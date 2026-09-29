import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { Database, Json } from '@/integrations/supabase/types';
import { issueStaffToken, roleForCode, verifyStaffToken } from './staff-token.server';

const admin = async () => (await import('@/integrations/supabase/client.server')).supabaseAdmin;
const s = (max = 500) => z.string().trim().max(max).nullable().optional().transform((v) => v ?? null);
const now = () => new Date().toISOString();

export const PAXI_BAGS = { small: 60, medium: 80, large: 110, xl: 150 } as const;

const orderInput = z.object({
  customer_name: z.string().trim().min(1).max(120),
  customer_phone: z.string().trim().min(3).max(30),
  pickup_address: z.string().trim().min(1).max(500),
  pickup_details: s(),
  delivery_address: z.string().trim().min(1).max(500),
  delivery_details: s(),
  receiver_name: s(120),
  receiver_phone: s(30),
  package_type: s(60),
  package_description: s(1000),
  brand: s(60),
  order_type: z.enum(['send', 'receive', 'food', 'paxi', 'paxi_receive', 'paxi_send']),
  proof_paths: z.array(z.string().max(300)).max(5).optional(),
  extra: z.record(z.string().max(60), z.string().max(500)).optional(),
});

export const createOrder = createServerFn({ method: 'POST' })
  .inputValidator((d) => orderInput.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    let amount = Math.floor(Math.random() * 76) + 45;
    let prefix = 'MB-';
    if (data.order_type === 'paxi_receive') { amount = 50; prefix = 'MB-PAXI-R-'; }
    if (data.order_type === 'paxi_send') {
      const bag = data.extra?.['paxi_bag_type'] as keyof typeof PAXI_BAGS | undefined;
      if (!bag || !(bag in PAXI_BAGS)) throw new Error('Choose a PAXI bag');
      amount = PAXI_BAGS[bag]; prefix = 'MB-PAXI-S-';
    }
    const order_number = prefix + Date.now();
    const { data: row, error } = await db
      .from('orders')
      .insert({ ...data, extra: (data.extra ?? {}) as Json, proof_paths: data.proof_paths ?? [], order_number, amount, status: 'pending', distance: '2.3', eta: '55', status_times: { pending: now() } })
      .select('id, order_number')
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

const publicCols = 'id, order_number, pickup_address, delivery_address, order_type, brand, amount, status, payment_method, driver_name, driver_phone, driver_lat, driver_lng, distance, eta, status_times, created_at, updated_at';

export const getOrder = createServerFn({ method: 'GET' })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db.from('orders').select(publicCols).eq('id', data.id).maybeSingle();
    return row;
  });

async function setStatus(id: string, from: string[], status: string, patch: Database['public']['Tables']['orders']['Update'] = {}) {
  const db = await admin();
  const { data: cur } = await db.from('orders').select('status, status_times').eq('id', id).single();
  if (!cur || !from.includes(cur.status)) throw new Error('This step is not available right now');
  const times = { ...((cur.status_times as Record<string, string>) ?? {}), [status]: now() };
  const { error } = await db.from('orders').update({ ...patch, status, status_times: times }).eq('id', id);
  if (error) throw new Error(error.message);
}

// Client confirms the rider arrived -> payment step.
export const confirmDelivery = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => { await setStatus(data.id, ['arrived'], 'payment_pending'); return { ok: true }; });

export const choosePayment = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ id: z.string().uuid(), method: z.enum(['Cash', 'Card']) }).parse(d))
  .handler(async ({ data }) => { await setStatus(data.id, ['payment_pending'], 'payment_verifying', { payment_method: data.method }); return { ok: true }; });

export const staffLogin = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ code: z.string().max(100) }).parse(d))
  .handler(async ({ data }) => {
    const role = roleForCode(data.code);
    if (!role) return { ok: false as const };
    return { ok: true as const, role, token: issueStaffToken(role) };
  });

const tok = z.object({ token: z.string().max(300) });

export const staffCheck = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.parse(d))
  .handler(async ({ data }) => {
    try { return { role: verifyStaffToken(data.token) }; } catch { return { role: null }; }
  });

export const staffData = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.parse(d))
  .handler(async ({ data }) => {
    const role = verifyStaffToken(data.token);
    const db = await admin();
    const { data: orders } = await db.from('orders').select('*').order('created_at', { ascending: false }).limit(500);
    const reviews = role === 'partner' ? (await db.from('reviews').select('*').order('created_at', { ascending: false })).data ?? [] : [];
    return { role, orders: orders ?? [], reviews };
  });

// Short-lived private links so staff can check slips / ID / parcel photos.
export const staffProofUrls = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.extend({ paths: z.array(z.string().max(300)).max(10) }).parse(d))
  .handler(async ({ data }) => {
    verifyStaffToken(data.token);
    if (!data.paths.length) return [];
    const db = await admin();
    const { data: signed } = await db.storage.from('order-proofs').createSignedUrls(data.paths, 3600);
    return (signed ?? []).map((x) => ({ path: x.path ?? '', url: x.signedUrl })).filter((x) => x.url);
  });

export const driverAction = createServerFn({ method: 'POST' })
  .inputValidator((d) =>
    tok.extend({
      id: z.string().uuid(),
      action: z.enum(['accept', 'picked', 'delivering', 'arrived', 'cancel', 'location', 'money_received']),
      driver_id: z.string().uuid().optional(),
      driver_name: z.string().max(80).optional(),
      driver_phone: z.string().max(30).optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const role = verifyStaffToken(data.token);
    const db = await admin();
    const { data: current } = await db.from('orders').select('status, distance, eta, proof_paths').eq('id', data.id).single();
    if (!current) throw new Error('Order not found');
    const pos = data.lat != null && data.lng != null ? { driver_lat: data.lat, driver_lng: data.lng } : {};
    if (data.driver_id && data.lat != null && data.lng != null) {
      await db.from('drivers_live').upsert({ driver_id: data.driver_id, lat: data.lat, lng: data.lng, is_online: true, updated_at: now() });
    }
    if (data.action === 'cancel') { await setStatus(data.id, ['pending', 'accepted'], 'canceled'); return { ok: true }; }
    if (role !== 'driver') throw new Error('Forbidden');
    switch (data.action) {
      case 'accept':
        await setStatus(data.id, ['pending'], 'accepted', { driver_id: data.driver_id ?? null, driver_name: data.driver_name ?? null, driver_phone: data.driver_phone ?? null, ...pos });
        break;
      case 'picked': await setStatus(data.id, ['accepted'], 'picked', pos); break;
      case 'delivering': await setStatus(data.id, ['picked'], 'delivering', pos); break;
      case 'arrived': await setStatus(data.id, ['picked', 'delivering'], 'arrived', pos); break;
      case 'money_received': {
        await setStatus(data.id, ['payment_verifying'], 'completed', { completed_at: now() });
        // POPIA: remove slips / ID / parcel photos once the order is done.
        const paths = current.proof_paths ?? [];
        if (paths.length) await db.storage.from('order-proofs').remove(paths);
        await db.from('orders').update({ proof_paths: [], proof_deleted_at: now() }).eq('id', data.id);
        break;
      }
      default: {
        const d = Math.max(0.1, Number(current.distance ?? 2.3) - 0.05);
        const e = Math.max(1, Number(current.eta ?? 55) - 0.5);
        await db.from('orders').update({ ...pos, distance: d.toFixed(1), eta: String(Math.round(e * 10) / 10) }).eq('id', data.id);
      }
    }
    return { ok: true };
  });

export const reviewAction = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.extend({ id: z.string().uuid(), action: z.enum(['approve', 'delete']) }).parse(d))
  .handler(async ({ data }) => {
    verifyStaffToken(data.token, ['partner']);
    const db = await admin();
    if (data.action === 'approve') {
      const { error } = await db.from('reviews').update({ approved: true }).eq('id', data.id);
      if (error) throw new Error(error.message);
    } else {
      const { data: r } = await db.from('reviews').select('photo_url').eq('id', data.id).maybeSingle();
      if (r?.photo_url) await db.storage.from('order-proofs').remove([r.photo_url]);
      const { error } = await db.from('reviews').delete().eq('id', data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// Staff: signed links for review photos.
export const reviewPhotoUrls = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.parse(d))
  .handler(async ({ data }) => {
    verifyStaffToken(data.token, ['partner']);
    const db = await admin();
    const { data: rows } = await db.from('reviews').select('id, photo_url').not('photo_url', 'is', null);
    const paths = (rows ?? []).map((r) => r.photo_url!).filter(Boolean);
    if (!paths.length) return {} as Record<string, string>;
    const { data: signed } = await db.storage.from('order-proofs').createSignedUrls(paths, 3600);
    const byPath = new Map((signed ?? []).map((x) => [x.path, x.signedUrl]));
    return Object.fromEntries((rows ?? []).map((r) => [r.id, byPath.get(r.photo_url!) ?? ''])) as Record<string, string>;
  });

// Public: approved reviews only, with temporary photo links.
export const approvedReviews = createServerFn({ method: 'GET' })
  .handler(async () => {
    const db = await admin();
    const { data: rows } = await db.from('reviews').select('id, name, location, service, rating, text, photo_url, created_at').eq('approved', true).order('created_at', { ascending: false }).limit(10);
    const list = rows ?? [];
    const paths = list.map((r) => r.photo_url).filter((p): p is string => !!p);
    const signed = paths.length ? (await db.storage.from('order-proofs').createSignedUrls(paths, 3600)).data ?? [] : [];
    const byPath = new Map(signed.map((x) => [x.path, x.signedUrl]));
    return list.map((r) => ({ ...r, photo_url: r.photo_url ? byPath.get(r.photo_url) ?? null : null }));
  });
