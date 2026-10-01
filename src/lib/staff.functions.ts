import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { verifyStaff } from './staff-token.server';

const admin = async () => (await import('@/integrations/supabase/client.server')).supabaseAdmin;
const tok = z.object({ token: z.string().max(400) });

// ---------- Drivers ----------
export const completeDriverProfile = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.extend({ name: z.string().trim().min(2).max(80), phone: z.string().trim().min(6).max(30) }).parse(d))
  .handler(async ({ data }) => {
    const { driverId } = verifyStaff(data.token, ['driver']);
    const db = await admin();
    const { error } = await db.from('driver_access').update({ driver_name: data.name, driver_phone: data.phone, first_login: false }).eq('id', driverId!);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listDrivers = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.parse(d))
  .handler(async ({ data }) => {
    verifyStaff(data.token, ['partner', 'master']);
    const db = await admin();
    const { data: drivers } = await db.from('driver_access').select('*').order('created_at', { ascending: false });
    const { data: orders } = await db.from('orders').select('driver_id, amount, status').eq('status', 'completed').not('driver_id', 'is', null);
    return (drivers ?? []).map((d) => {
      const mine = (orders ?? []).filter((o) => o.driver_id === d.id);
      return { ...d, completed: mine.length, income: mine.reduce((n, o) => n + Number(o.amount), 0) };
    });
  });

export const saveDriver = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.extend({ id: z.string().uuid().optional(), password: z.string().trim().min(4).max(60), name: z.string().trim().max(80).optional(), phone: z.string().trim().max(30).optional() }).parse(d))
  .handler(async ({ data }) => {
    verifyStaff(data.token, ['partner', 'master']);
    if ([process.env['PARTNER_ACCESS_CODE'], process.env['MASTER_ACCESS_CODE']].some((v) => v && data.password === v)) throw new Error('That password is reserved');
    const db = await admin();
    const { data: clash } = await db.from('driver_access').select('id').eq('password', data.password).maybeSingle();
    if (clash && clash.id !== data.id) throw new Error('That password is already used');
    const row = { password: data.password, ...(data.name !== undefined ? { driver_name: data.name || null } : {}), ...(data.phone !== undefined ? { driver_phone: data.phone || null } : {}) };
    const { error } = data.id ? await db.from('driver_access').update(row).eq('id', data.id) : await db.from('driver_access').insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setDriverActive = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.extend({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    verifyStaff(data.token, ['partner', 'master']);
    const db = await admin();
    await db.from('driver_access').update({ is_active: data.active }).eq('id', data.id);
    return { ok: true };
  });

// ---------- Pricing ----------
export const updatePrice = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.extend({ id: z.string().uuid(), price: z.number().min(0).max(100000), label: z.string().trim().max(60).nullable(), applyTo: z.enum(['self', 'paxi', 'food_delivery', 'receive_package', 'send_package', 'all']) }).parse(d))
  .handler(async ({ data }) => {
    verifyStaff(data.token, ['partner', 'master']);
    const db = await admin();
    const upd = { price: data.price, label: data.label || null, updated_at: new Date().toISOString() };
    const q = db.from('app_pricing').update(data.applyTo === 'self' ? upd : { label: upd.label, updated_at: upd.updated_at });
    // Price always applies to the chosen item; label can be spread to a category or everything.
    await db.from('app_pricing').update(upd).eq('id', data.id);
    if (data.applyTo === 'all') await q.not('id', 'is', null);
    else if (data.applyTo !== 'self') await q.eq('category', data.applyTo);
    return { ok: true };
  });

// ---------- Refresh center ----------
export const refreshAction = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.extend({ section: z.enum(['orders_new', 'orders_completed', 'orders_canceled', 'orders_paid', 'orders_all', 'clients', 'drivers', 'reviews', 'revenue', 'all']), confirm: z.string().max(20).optional() }).parse(d))
  .handler(async ({ data }) => {
    verifyStaff(data.token, ['partner']);
    if (data.section === 'all' && data.confirm !== 'DELETE ALL') throw new Error('Type DELETE ALL to confirm');
    const db = await admin();
    const removeOrders = async (statuses: string[] | null) => {
      let q = db.from('orders').select('id, proof_paths');
      if (statuses) q = q.in('status', statuses);
      const { data: rows } = await q;
      const paths = (rows ?? []).flatMap((r) => r.proof_paths ?? []);
      if (paths.length) await db.storage.from('order-proofs').remove(paths);
      const ids = (rows ?? []).map((r) => r.id);
      for (let i = 0; i < ids.length; i += 200) await db.from('orders').delete().in('id', ids.slice(i, i + 200));
    };
    const emptyBucket = async () => {
      for (let i = 0; i < 20; i++) {
        const { data: files } = await db.storage.from('order-proofs').list('', { limit: 1000 });
        if (!files?.length) break;
        await db.storage.from('order-proofs').remove(files.map((f) => f.name));
      }
    };
    switch (data.section) {
      case 'orders_new': await removeOrders(['pending']); break;
      case 'orders_completed': case 'orders_paid': case 'revenue': await removeOrders(['completed']); break;
      case 'orders_canceled': await removeOrders(['canceled']); break;
      case 'orders_all': case 'clients': await removeOrders(null); break;
      case 'drivers': await db.from('drivers_live').delete().not('driver_id', 'is', null); break;
      case 'reviews': await db.from('reviews').delete().not('id', 'is', null); break;
      case 'all':
        await removeOrders(null);
        await db.from('reviews').delete().not('id', 'is', null);
        await db.from('drivers_live').delete().not('driver_id', 'is', null);
        await emptyBucket();
        break;
    }
    await db.from('refresh_logs').insert({ action_type: 'refresh', section: data.section });
    return { ok: true };
  });
