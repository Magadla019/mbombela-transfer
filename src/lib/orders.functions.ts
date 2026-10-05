import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { Database, Json } from '@/integrations/supabase/types';
import { fixedRoleForCode, issueStaffToken, verifyStaff, verifyStaffToken } from './staff-token.server';

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

const priceKey: Record<string, [string, string, number]> = {
  send: ['send_package', 'base', 40],
  receive: ['receive_package', 'base', 40],
  food: ['food_delivery', 'base', 35],
  paxi: ['paxi_receive_delivery', 'base', 40],
  paxi_receive: ['paxi_receive_delivery', 'base', 40],
};

export const createOrder = createServerFn({ method: 'POST' })
  .inputValidator((d) => orderInput.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    let [cat, sub, fallback] = priceKey[data.order_type] ?? ['send_package', 'base', 40];
    let prefix = data.order_type === 'paxi_receive' ? 'MB-PAXI-R-' : 'MB-';
    let bag: string | null = null;
    if (data.order_type === 'paxi_send') {
      bag = data.extra?.['paxi_bag_type'] ?? null;
      if (!bag || !(bag in PAXI_BAGS)) throw new Error('Choose a PAXI bag');
      cat = 'paxi'; sub = `${bag}_bag`; fallback = PAXI_BAGS[bag as keyof typeof PAXI_BAGS]; prefix = 'MB-PAXI-S-';
    }
    const { data: p } = await db.from('app_pricing').select('price').eq('category', cat).eq('sub_category', sub).eq('is_active', true).maybeSingle();
    let amount = p ? Number(p.price) : fallback;
    if (data.order_type === 'paxi_send') {
      const { data: fee } = await db.from('app_pricing').select('price').eq('category', 'paxi_send_delivery').eq('sub_category', 'base').eq('is_active', true).maybeSingle();
      amount += fee ? Number(fee.price) : 40;
    }
    const order_number = prefix + Date.now();
    const { data: row, error } = await db
      .from('orders')
      .insert({
        ...data, extra: (data.extra ?? {}) as Json, proof_paths: data.proof_paths ?? [], order_number, amount, status: 'pending',
        distance: null, eta: null, status_times: { pending: now() },
        type: data.order_type.startsWith('paxi') ? 'paxi' : 'delivery', paxi_bag_type: bag, paxi_tracking: data.extra?.['paxi_tracking'] ?? null,
      })
      .select('id, order_number')
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

const publicCols = 'id, order_number, pickup_address, delivery_address, order_type, brand, amount, status, payment_method, driver_name, driver_phone, driver_lat, driver_lng, dest_lat, dest_lng, pickup_lat, pickup_lng, distance, eta, status_times, created_at, updated_at, completed_at, client_popup_shown, client_popup_state';

export const getOrder = createServerFn({ method: 'GET' })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db.from('orders').select(publicCols).eq('id', data.id).maybeSingle();
    return row;
  });

// Client: orders placed on this device (order ids are unguessable).
export const clientOrders = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).max(100) }).parse(d))
  .handler(async ({ data }) => {
    if (!data.ids.length) return [];
    const db = await admin();
    const { data: rows } = await db.from('orders').select(publicCols).in('id', data.ids).order('created_at', { ascending: false });
    return rows ?? [];
  });

export const markClientPopupShown = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    await db.from('orders').update({ client_popup_shown: true }).eq('id', data.id).eq('status', 'completed');
    return { ok: true };
  });

async function geocode(address?: string | null) {
  if (!address) return null;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=za&q=${encodeURIComponent(address + ', Mpumalanga')}`, { headers: { 'User-Agent': 'MbombelaTransfer/1.0' }, signal: AbortSignal.timeout(8000) });
    const j = (await r.json()) as { lat: string; lon: string }[];
    return j[0] ? { lat: Number(j[0].lat), lng: Number(j[0].lon) } : null;
  } catch { return null; }
}

async function setStatus(id: string, from: string[], status: string, patch: Database['public']['Tables']['orders']['Update'] = {}) {
  const db = await admin();
  const { data: cur } = await db.from('orders').select('status, status_times').eq('id', id).single();
  if (!cur || !from.includes(cur.status)) throw new Error('This step is not available right now');
  const times = { ...((cur.status_times as Record<string, string>) ?? {}), [status]: now() };
  const { error } = await db.from('orders').update({ ...patch, status, status_times: times }).eq('id', id);
  if (error) throw new Error(error.message);
}

export const confirmDelivery = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => { await setStatus(data.id, ['arrived'], 'payment_pending', { client_popup_state: 'payment_pending' }); return { ok: true }; });

export const choosePayment = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ id: z.string().uuid(), method: z.enum(['Cash', 'Card']) }).parse(d))
  .handler(async ({ data }) => { await setStatus(data.id, ['payment_pending'], 'payment_verifying', { payment_method: data.method, driver_popup_state: 'verify_payment', driver_popup_shown: false }); return { ok: true }; });

export const staffLogin = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ code: z.string().max(100) }).parse(d))
  .handler(async ({ data }) => {
    const code = data.code.trim();
    const fixed = fixedRoleForCode(code);
    if (fixed) return { ok: true as const, role: fixed, token: issueStaffToken(fixed), driver: null };
    if (code.length < 4) return { ok: false as const };
    const db = await admin();
    const { data: d } = await db.from('driver_access').select('id, driver_name, driver_phone, first_login').eq('password', code).eq('is_active', true).maybeSingle();
    if (!d) return { ok: false as const };
    return {
      ok: true as const, role: 'driver' as const, token: issueStaffToken('driver', d.id),
      driver: { id: d.id, name: d.driver_name, phone: d.driver_phone, needsProfile: d.first_login || !d.driver_name },
    };
  });

const tok = z.object({ token: z.string().max(400) });

export const staffCheck = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.parse(d))
  .handler(async ({ data }) => {
    try { return verifyStaff(data.token); } catch { return { role: null, driverId: null }; }
  });

export const staffData = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.parse(d))
  .handler(async ({ data }) => {
    const { role, driverId } = verifyStaff(data.token);
    const db = await admin();
    let q = db.from('orders').select('*').order('created_at', { ascending: false }).limit(1000);
    if (role === 'driver') q = q.or(`and(status.eq.pending,driver_id.is.null),driver_id.eq.${driverId}`);
    const { data: orders } = await q;
    const reviews = role === 'partner' ? (await db.from('reviews').select('*').order('created_at', { ascending: false })).data ?? [] : [];
    let me = null;
    if (role === 'driver' && driverId) {
      const { data: d } = await db.from('driver_access').select('id, driver_name, driver_phone, is_active').eq('id', driverId).maybeSingle();
      if (!d?.is_active) throw new Error('Unauthorized');
      me = d;
    }
    return { role, driverId, me, orders: orders ?? [], reviews };
  });

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
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
      heading: z.number().min(0).max(360).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { role, driverId } = verifyStaff(data.token);
    const db = await admin();
    const { data: current } = await db.from('orders').select('status, distance, eta, proof_paths, driver_id, amount').eq('id', data.id).single();
    if (!current) throw new Error('Order not found');
    const pos = data.lat != null && data.lng != null ? { driver_lat: data.lat, driver_lng: data.lng } : {};
    if (data.action === 'cancel') {
      if (role === 'driver' && current.driver_id !== driverId) throw new Error('Forbidden');
      await setStatus(data.id, ['pending', 'accepted'], 'canceled'); return { ok: true };
    }
    if (role !== 'driver' || !driverId) throw new Error('Forbidden');
    if (data.action === 'location' && (data.lat == null || data.lng == null)) throw new Error('Location required');
    if (data.lat != null && data.lng != null) {
      await db.from('drivers_live').upsert({ driver_id: driverId, lat: data.lat, lng: data.lng, is_online: true, updated_at: now() });
      if (data.action !== 'accept' ? current.driver_id === driverId : true) await db.from('driver_locations').upsert({ driver_id: driverId, order_id: data.id, lat: data.lat, lng: data.lng, heading: data.heading ?? null, updated_at: now() }, { onConflict: 'order_id' });
    }
    if (data.action === 'accept') {
      const { data: me } = await db.from('driver_access').select('driver_name, driver_phone').eq('id', driverId).single();
      const { data: cur } = await db.from('orders').select('status_times').eq('id', data.id).single();
      const times = { ...((cur?.status_times as Record<string, string>) ?? {}), accepted: now() };
      // Atomic: only succeeds if nobody else took it.
      const { data: taken } = await db.from('orders')
        .update({ driver_id: driverId, driver_name: me?.driver_name ?? 'Driver', driver_phone: me?.driver_phone ?? null, assigned_at: now(), status: 'accepted', status_times: times, ...pos })
        .eq('id', data.id).eq('status', 'pending').is('driver_id', null).select('id');
      if (!taken?.length) throw new Error('Already taken');
      const { data: addr } = await db.from('orders').select('pickup_address, delivery_address').eq('id', data.id).single();
      const [pick, dest] = await Promise.all([geocode(addr?.pickup_address), geocode(addr?.delivery_address)]);
      await db.from('orders').update({ pickup_lat: pick?.lat ?? null, pickup_lng: pick?.lng ?? null, dest_lat: dest?.lat ?? null, dest_lng: dest?.lng ?? null }).eq('id', data.id);
      return { ok: true };
    }
    if (current.driver_id !== driverId) throw new Error('This order belongs to another driver');
    switch (data.action) {
      case 'picked': await setStatus(data.id, ['accepted'], 'picked', pos); break;
      case 'delivering': await setStatus(data.id, ['picked'], 'delivering', pos); break;
      case 'arrived': await setStatus(data.id, ['picked', 'delivering'], 'arrived', { ...pos, client_popup_state: 'arrived', client_popup_shown: false }); break;
      case 'money_received': {
        await setStatus(data.id, ['payment_verifying'], 'completed', { completed_at: now(), client_popup_state: 'completed', client_popup_shown: false, driver_popup_shown: true, driver_popup_state: null });
        const paths = current.proof_paths ?? [];
        if (paths.length) await db.storage.from('order-proofs').remove(paths);
        await db.from('orders').update({ proof_paths: [], proof_deleted_at: now() }).eq('id', data.id);
        await db.from('drivers_live').update({ is_online: false }).eq('driver_id', driverId);
        const { data: me } = await db.from('driver_access').select('total_completed, total_income').eq('id', driverId).single();
        if (me) await db.from('driver_access').update({ total_completed: me.total_completed + 1, total_income: Number(me.total_income) + Number(current.amount) }).eq('id', driverId);
        break;
      }
      default: {
        const { error } = await db.from('orders').update(pos).eq('id', data.id);
        if (error) throw new Error(error.message);
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
