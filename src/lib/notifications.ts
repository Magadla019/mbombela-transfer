import { useEffect, useRef, useState } from 'react';

// Native Web Audio ring + browser Notification; no third-party push service.
let ctx: AudioContext | null = null;
function tone(kind: 'order' | 'notification' | 'message') {
  try {
    ctx ??= new AudioContext();
    const c = ctx;
    const notes = kind === 'order' ? [880, 660, 880, 660] : kind === 'message' ? [1200] : [740, 990];
    notes.forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.frequency.value = f; o.type = 'square';
      const t = c.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.17);
    });
  } catch { /* audio blocked until user interaction */ }
}
export const soundOn = () => typeof window !== 'undefined' && localStorage.getItem('mb_sound_enabled') !== 'false';
export function playTwice(kind: 'order' | 'notification' | 'message' = 'order') {
  if (!soundOn()) return;
  tone(kind); setTimeout(() => tone(kind), 2000);
  if (localStorage.getItem('mb_vibration') !== 'false') navigator.vibrate?.([200, 100, 200]);
}
export function notify(title: string, body: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || localStorage.getItem('mb_desktop_notif') === 'false') return;
  try { new Notification(title, { body, icon: '/favicon.ico' }); } catch { /* some mobile browsers need a service worker */ }
}
export async function askPermission() {
  localStorage.setItem('mb_notif_asked', 'true');
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.requestPermission();
}

const FIVE_MIN = 5 * 60 * 1000;
type O = { id: string; status: string; order_number: string; driver_id: string | null };

/** Rings twice on new pending orders and every 5 min while still pending; for a driver, reminds every 5 min until their order is delivered. */
export function useOrderRinging(orders: O[], role: string, myId: string | null) {
  const seen = useRef<Set<string> | null>(null);
  const latest = useRef(orders); latest.current = orders;
  const [badge, setBadge] = useState(0);
  useEffect(() => {
    const pending = orders.filter((o) => o.status === 'pending');
    if (seen.current === null) { seen.current = new Set(orders.map((o) => o.id)); return; }
    const fresh = pending.filter((o) => !seen.current!.has(o.id));
    orders.forEach((o) => seen.current!.add(o.id));
    if (fresh.length) { playTwice('order'); notify('🔥 New Order!', `Order #${fresh[0]!.order_number} is waiting`); setBadge((b) => b + fresh.length); }
  }, [orders]);
  useEffect(() => {
    const t = setInterval(() => {
      const list = latest.current;
      const pending = list.filter((o) => o.status === 'pending');
      if (pending.length) { playTwice('order'); notify('Still waiting', `${pending.length} order(s) not accepted yet`); return; }
      const mine = role === 'driver' && list.find((o) => o.driver_id === myId && ['accepted', 'picked', 'delivering'].includes(o.status));
      if (mine) { playTwice('notification'); notify('Order reminder', `Order #${mine.order_number} is ${mine.status}`); }
    }, FIVE_MIN);
    return () => clearInterval(t);
  }, [role, myId]);
  return { badge, clearBadge: () => setBadge(0) };
}
