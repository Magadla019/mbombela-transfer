import { createHmac, timingSafeEqual } from 'crypto';

export type StaffRole = 'partner' | 'driver' | 'master';
export type StaffSession = { role: StaffRole; driverId: string | null };

function sign(payload: string) {
  const secret = process.env['STAFF_TOKEN_SECRET'];
  if (!secret) throw new Error('Server is missing STAFF_TOKEN_SECRET');
  return createHmac('sha256', secret).update(payload).digest('hex');
}

// Token format: "<role>~<driverId|->.<expiry>.<signature>"
export function issueStaffToken(role: StaffRole, driverId: string | null = null) {
  const payload = `${role}~${driverId ?? '-'}.${Date.now() + 1000 * 60 * 60 * 24 * 7}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyStaff(token: string | undefined, allowed?: StaffRole[]): StaffSession {
  if (!token) throw new Error('Unauthorized');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Unauthorized');
  const [head = '', exp = '', sig = ''] = parts;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(`${head}.${exp}`));
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('Unauthorized');
  if (Number(exp) < Date.now()) throw new Error('Session expired');
  const [role = '', did = '-'] = head.split('~');
  if (role !== 'partner' && role !== 'driver' && role !== 'master') throw new Error('Unauthorized');
  if (allowed && !allowed.includes(role)) throw new Error('Forbidden');
  return { role, driverId: did === '-' ? null : did };
}

export function verifyStaffToken(token: string | undefined, allowed?: StaffRole[]): StaffRole {
  return verifyStaff(token, allowed).role;
}

export function fixedRoleForCode(code: string): 'partner' | 'master' | null {
  const c = code.trim();
  if (c === 'Mbombela Transfer 452') return 'partner';
  if (c === 'Mbombela Transfer 1141') return 'master';
  return null;
}
