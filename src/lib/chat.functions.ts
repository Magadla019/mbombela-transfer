import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { verifyStaff } from './staff-token.server';

// Private internal chat: tables have no public RLS; all access is checked here.
const admin = async () => (await import('@/integrations/supabase/client.server')).supabaseAdmin;
type Db = Awaited<ReturnType<typeof admin>>;

const media = z.object({ dataUrl: z.string().max(14_000_000), kind: z.enum(['image', 'voice']) }).optional();
const send = z.object({ text: z.string().trim().max(2000).optional(), media });

async function upload(db: Db, m: z.infer<typeof media>) {
  if (!m) return {};
  const match = /^data:([\w/+.-]+);base64,(.+)$/.exec(m.dataUrl);
  if (!match) throw new Error('Invalid file');
  const type = match[1]!;
  if (m.kind === 'image' && !type.startsWith('image/')) throw new Error('Images only');
  if (m.kind === 'voice' && !type.startsWith('audio/')) throw new Error('Audio only');
  const path = `${crypto.randomUUID()}.${type.split('/')[1]?.split(';')[0] ?? 'bin'}`;
  const { error } = await db.storage.from('chat-media').upload(path, Buffer.from(match[2]!, 'base64'), { contentType: type });
  if (error) throw new Error('Upload failed');
  return m.kind === 'image' ? { image_url: path } : { voice_url: path };
}

async function withUrls(db: Db, conversationId: string) {
  const { data } = await db.from('messages').select('*').eq('conversation_id', conversationId).order('created_at').limit(300);
  const rows = data ?? [];
  const paths = rows.flatMap((r) => [r.image_url, r.voice_url]).filter((p): p is string => !!p);
  const signed = paths.length ? (await db.storage.from('chat-media').createSignedUrls(paths, 3600)).data ?? [] : [];
  const url = (p: string | null) => (p ? signed.find((s) => s.path === p)?.signedUrl ?? null : null);
  return rows.map((r) => ({ ...r, image_url: url(r.image_url), voice_url: url(r.voice_url) }));
}

async function post(db: Db, conversationId: string, sender: string, input: z.infer<typeof send>) {
  if (!input.text && !input.media) throw new Error('Empty message');
  const files = await upload(db, input.media);
  await db.from('messages').insert({ conversation_id: conversationId, sender_id: sender, text: input.text || null, ...files });
  await db.from('conversations').update({ last_message: input.text || (input.media?.kind === 'voice' ? '🎤 Voice note' : '📷 Photo'), updated_at: new Date().toISOString() }).eq('id', conversationId);
}

async function clientConversation(db: Db, userId: string, email?: string) {
  const { data } = await db.from('conversations').select('id').eq('client_id', userId).maybeSingle();
  if (data) return data.id;
  const { data: created, error } = await db.from('conversations').insert({ client_id: userId, client_name: email ?? 'Client' }).select('id').single();
  if (error) throw new Error(error.message);
  return created.id;
}

export const clientChat = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const id = await clientConversation(db, context.userId, context.claims.email as string | undefined);
    await db.from('messages').update({ is_read: true }).eq('conversation_id', id).eq('sender_id', 'partner');
    return { conversationId: id, me: context.userId, messages: await withUrls(db, id) };
  });

export const clientSend = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => send.parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const id = await clientConversation(db, context.userId, context.claims.email as string | undefined);
    await post(db, id, context.userId, data);
    return { ok: true };
  });

const tok = z.object({ token: z.string().min(10).max(500) });

export const partnerInbox = createServerFn({ method: 'POST' })
  .inputValidator((d) => tok.extend({ conversationId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data }) => {
    verifyStaff(data.token, ['partner', 'master']);
    const db = await admin();
    const { data: list } = await db.from('conversations').select('*').order('updated_at', { ascending: false }).limit(200);
    const { data: unread } = await db.from('messages').select('conversation_id').eq('is_read', false).neq('sender_id', 'partner');
    const counts: Record<string, number> = {};
    for (const u of unread ?? []) counts[u.conversation_id] = (counts[u.conversation_id] ?? 0) + 1;
    let messages: Awaited<ReturnType<typeof withUrls>> = [];
    if (data.conversationId) {
      await db.from('messages').update({ is_read: true }).eq('conversation_id', data.conversationId).neq('sender_id', 'partner');
      messages = await withUrls(db, data.conversationId);
      counts[data.conversationId] = 0;
    }
    return { me: 'partner', conversations: (list ?? []).map((c) => ({ ...c, unread: counts[c.id] ?? 0 })), messages };
  });

export const partnerSend = createServerFn({ method: 'POST' })
  .inputValidator((d) => send.extend({ token: z.string().min(10).max(500), conversationId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    verifyStaff(data.token, ['partner', 'master']);
    await post(await admin(), data.conversationId, 'partner', data);
    return { ok: true };
  });
