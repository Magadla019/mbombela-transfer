import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';
import { issueStaffToken, roleForCode, verifyStaffToken } from './staff-token.server';

const admin = async () => (await import('@/integrations/supabase/client.server')).supabaseAdmin;
const s = (max = 500) => z.string().trim().max(max).nullable().optional().transform((v) => v ?? null);

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
  order_type: z.enum(['send', 'receive', 'food', 'paxi']),
  proof_paths: z.array(z.string().max(300)).max(5).optional(),
});

export const createOrder = createServerFn({ method: 'POST' })
  .inputValidator((d) => orderInput.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const order_number = 'MB-' + Date.now();
    const { data: row, error } = await db
      .from('orders')
      .insert({ ...data, proof_paths: data.proof_paths ?? [], order_number, amount: Math.floor(Math.random() * 76) + 45, status: 'pending', distance: '2.3', eta: '55' })
      .select('id, order_number')
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

const publicCols = 'id, order_number, pickup_address, delivery_address, order_type, brand, amount, status, driver_name, driver_phone, driver_lat, driver_lng, distance, eta, created_at, updated_at';

export const getOrder = createServerFn({ method: 'GET' })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db.from('orders').select(publicCols).eq('id', data.id).maybeSingle();
    return row;
  });

export const confirmDelivery = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db.from('orders').update({ status: 'completed' }).eq('id', data.id).eq('status', 'arrived');
    if (error) throw new Error(error.message);
    return { ok: true };
  });

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

export const driverAction = createServerFn({ method: 'POST' })
  .inputValidator((d) =>
    tok.extend({
      id: z.string().uuid(),
      action: z.enum(['accept', 'picked', 'arrived', 'cancel', 'location']),
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
    const { data: current } = await db.from('orders').select('status, distance, eta').eq('id', data.id).single();
    if (!current) throw new Error('Order not found');
    const pos = data.lat != null && data.lng != null ? { driver_lat: data.lat, driver_lng: data.lng } : {};
    let patch: Database['public']['Tables']['orders']['Update'] = {};
    if (data.action === 'cancel') {
      if (!['pending', 'accepted'].includes(current.status)) throw new Error('Cannot cancel now');
      patch = { status: 'canceled' };
    } else {
      if (role !== 'driver') throw new Error('Forbidden');
      if (data.action === 'accept') {
        if (current.status !== 'pending') throw new Error('Order already taken');
        patch = { status: 'accepted', driver_id: data.driver_id ?? null, driver_name: data.driver_name ?? null, driver_phone: data.driver_phone ?? null, ...pos };
      } else if (data.action === 'picked') patch = { status: 'picked', ...pos };
      else if (data.action === 'arrived') patch = { status: 'arrived', ...pos };
      else {
        const d = Math.max(0.1, Number(current.distance ?? 2.3) - 0.05);
        const e = Math.max(1, Number(current.eta ?? 55) - 0.5);
        patch = { ...pos, distance: d.toFixed(1), eta: String(Math.round(e * 10) / 10) };
      }
      if (data.driver_id && data.lat != null && data.lng != null) {
        await db.from('drivers_live').upsert({ driver_id: data.driver_id, lat: data.lat, lng: data.lng, is_online: true, updated_at: new Date().toISOString() });
      }
    }
    const { error } = await db.from('orders').update(patch).eq('id', data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reviewAction = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.extend({ id: z.string().uuid(), action: z.enum(['approve', 'delete']) }).parse(d))
  .handler(async ({ data }) => {
    verifyStaffToken(data.token, ['partner']);
    const db = await admin();
    const q = data.action === 'approve' ? db.from('reviews').update({ approved: true }).eq('id', data.id) : db.from('reviews').delete().eq('id', data.id);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });
