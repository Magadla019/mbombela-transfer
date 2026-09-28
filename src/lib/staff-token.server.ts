import { createHmac, timingSafeEqual } from 'crypto';

export type StaffRole = 'partner' | 'driver';

function sign(payload: string) {
  const secret = process.env['STAFF_TOKEN_SECRET'];
  if (!secret) throw new Error('Server is missing STAFF_TOKEN_SECRET');
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function issueStaffToken(role: StaffRole) {
  const payload = `${role}.${Date.now() + 1000 * 60 * 60 * 24 * 7}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyStaffToken(token: string | undefined, allowed?: StaffRole[]): StaffRole {
  if (!token) throw new Error('Unauthorized');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Unauthorized');
  const [role, exp, sig] = parts;
  const expected = sign(`${role}.${exp}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('Unauthorized');
  if (Number(exp) < Date.now()) throw new Error('Session expired');
  if (role !== 'partner' && role !== 'driver') throw new Error('Unauthorized');
  if (allowed && !allowed.includes(role)) throw new Error('Forbidden');
  return role;
}

export function roleForCode(code: string): StaffRole | null {
  const c = code.trim();
  if (c === 'Mbombela Transfer 452') return 'partner';
  if (c === 'Mbombela Transfer 1141') return 'driver';
  return null;
}
