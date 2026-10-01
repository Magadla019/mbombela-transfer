import type { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

export type Order = Tables<'orders'>;
export type Review = Tables<'reviews'>;
export type OrderStatus = 'pending'|'accepted'|'picked'|'delivering'|'arrived'|'completed'|'canceled';

export const brandNames=['KFC',"Nando's",'Panarottis','RocoMamas','Spur','Debonairs Pizza','Fishaways',"Galito's",'Mugg & Bean',"McDonald's"];

// Only small pointers live in the browser: staff session token, role, driver id and the last order id for guest tracking.
export const getStaffToken = () => (typeof window === 'undefined' ? '' : localStorage.getItem('mbombela_staff_token') || '');
export const setStaff = (role: string, token: string) => { localStorage.setItem('mbombela_role', role); localStorage.setItem('mbombela_staff_token', token); };
export const clearStaff = () => { ['mbombela_role','mbombela_staff_token','driver_id','driver_name','driver_phone'].forEach((k) => localStorage.removeItem(k)); };
export const driverId = () => { let id = localStorage.getItem('mbombela_driver_id'); if (!id) { id = crypto.randomUUID(); localStorage.setItem('mbombela_driver_id', id); } return id; };
export const lastOrderId = () => (typeof window === 'undefined' ? null : localStorage.getItem('mbombela_last_order'));
export const myOrderIds = (): string[] => { if (typeof window === 'undefined') return []; try { const v = JSON.parse(localStorage.getItem('mbombela_my_orders') || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 100) : []; } catch { return []; } };
export const setLastOrderId = (id: string) => { localStorage.setItem('mbombela_last_order', id); const ids = myOrderIds().filter((x) => x !== id); localStorage.setItem('mbombela_my_orders', JSON.stringify([id, ...ids].slice(0, 100))); };

export async function uploadProofs(files: (File | null | undefined)[]) {
  const paths: string[] = [];
  for (const file of files) {
    if (!file || !file.size) continue;
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('order-proofs').upload(path, file);
    if (error) throw new Error('Upload failed: ' + error.message);
    paths.push(path);
  }
  return paths;
}
