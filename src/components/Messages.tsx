import { useEffect, useRef, useState } from 'react';
import { CheckCheck, Image as ImageIcon, Mic, Send, Smile, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { clientChat, clientSend, partnerInbox, partnerSend } from '@/lib/chat.functions';
import { getStaffToken } from '@/lib/transfer';
import { playTwice } from '@/lib/notifications';

type Msg = { id: string; sender_id: string; text: string | null; image_url: string | null; voice_url: string | null; is_read: boolean; created_at: string };
type Media = { dataUrl: string; kind: 'image' | 'voice' };
const EMOJI = ['😀', '😂', '😍', '👍', '🙏', '🔥', '🚀', '📦', '🍔', '✅', '❤️', '👋'];
const toDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(b); });
const time = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function Thread({ messages, me, onSend }: { messages: Msg[]; me: string; onSend: (text: string, media?: Media) => Promise<void> }) {
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState(false);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);
  const go = async (media?: Media) => { if (!text.trim() && !media) return; setBusy(true); try { await onSend(text.trim(), media); setText(''); } catch (e) { toast.error(e instanceof Error ? e.message : 'Not sent'); } finally { setBusy(false); } };
  const record = async () => {
    if (rec) { rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream); const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); setRec(null); const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' }); if (blob.size) await go({ dataUrl: await toDataUrl(blob), kind: 'voice' }); };
      r.start(); setRec(r);
    } catch { toast.error('Microphone permission is needed for voice notes'); }
  };
  return <div className="flex min-h-0 flex-1 flex-col bg-[var(--chat-bg)]">
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
      {messages.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">No messages yet. Say hello 👋</p>}
      {messages.map((m) => { const mine = m.sender_id === me; return <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[78%] rounded-xl px-3 py-2 text-sm text-foreground ${mine ? 'bg-[var(--chat-sent)]' : 'bg-[var(--chat-received)]'}`}>
        {m.image_url && <a href={m.image_url} target="_blank" rel="noreferrer"><img src={m.image_url} alt="Shared photo" className="mb-1 max-h-60 rounded-lg object-cover" /></a>}
        {m.voice_url && <audio controls src={m.voice_url} className="mb-1 h-10 w-56 max-w-full" />}
        {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
        <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">{time(m.created_at)}{mine && <CheckCheck size={14} className={m.is_read ? 'text-[var(--chat-tick)]' : ''} />}</span>
      </div></div>; })}
      <div ref={end} />
    </div>
    {emoji && <div className="flex flex-wrap gap-1 border-t border-border bg-card p-2">{EMOJI.map((e) => <Button key={e} variant="ghost" size="icon" onClick={() => setText((t) => t + e)}>{e}</Button>)}</div>}
    <div className="flex items-center gap-2 border-t border-border bg-card p-2">
      <Button variant="ghost" size="icon" aria-label="Emoji" onClick={() => setEmoji((v) => !v)}><Smile /></Button>
      <Button variant="ghost" size="icon" aria-label="Send photo" onClick={() => file.current?.click()}><ImageIcon /></Button>
      <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; if (f.size > 8_000_000) return toast.error('Photo too large (max 8MB)'); await go({ dataUrl: await toDataUrl(f), kind: 'image' }); }} />
      {rec ? <div className="flex-1 animate-pulse px-3 text-sm text-primary">● Recording… tap stop to send</div> : <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void go(); }} placeholder="Type a message" maxLength={2000} className="h-11 min-w-0 flex-1 rounded-full bg-secondary px-4 text-sm outline-none" />}
      {text.trim() && !rec ? <Button size="icon" disabled={busy} className="rounded-full bg-[var(--chat-sent)]" aria-label="Send" onClick={() => void go()}><Send /></Button>
        : <Button size="icon" disabled={busy} className="rounded-full bg-[var(--chat-sent)]" aria-label={rec ? 'Stop recording' : 'Record voice note'} onClick={record}>{rec ? <Square /> : <Mic />}</Button>}
    </div>
  </div>;
}

export function ClientMessages() {
  const [state, setState] = useState<{ me: string; messages: Msg[] } | null>(null);
  const [error, setError] = useState('');
  const count = useRef(0);
  const load = () => clientChat().then((r) => { const incoming = r.messages.filter((m) => m.sender_id !== r.me).length; if (count.current && incoming > count.current) playTwice('message'); count.current = incoming; setState(r); }).catch(() => setError('Please log in to message Mbombela Transfer.'));
  useEffect(() => { void load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, []);
  if (error) return <p className="p-10 text-center text-muted-foreground">{error}</p>;
  if (!state) return <p className="p-10 text-center text-muted-foreground">Loading chat…</p>;
  return <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col border-x border-border">
    <div className="flex items-center gap-3 border-b border-border bg-card p-3"><div className="grid size-10 place-items-center rounded-full bg-primary font-bold">MT</div><div><b>Mbombela Transfer</b><p className="text-xs text-[var(--chat-online)]">Support team</p></div></div>
    <Thread messages={state.messages} me={state.me} onSend={async (text, media) => { await clientSend({ data: { text: text || undefined, media } }); await load(); }} />
  </div>;
}

type Conv = { id: string; client_name: string | null; last_message: string | null; updated_at: string; unread: number };
export function PartnerMessages() {
  const [list, setList] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const unread = useRef(0);
  const load = (id = active) => partnerInbox({ data: { token: getStaffToken(), conversationId: id ?? undefined } }).then((r) => { const total = r.conversations.reduce((n, c) => n + c.unread, 0); if (total > unread.current) playTwice('message'); unread.current = total; setList(r.conversations); setMessages(r.messages); }).catch(() => {});
  useEffect(() => { void load(); const t = setInterval(() => load(), 3000); return () => clearInterval(t); }, [active]);
  const current = list.find((c) => c.id === active);
  return <div className="panel flex h-[75vh] overflow-hidden p-0">
    <div className={`${active ? 'hidden md:block' : 'block'} w-full overflow-y-auto border-r border-border md:w-80`}>
      {list.length === 0 && <p className="p-6 text-sm text-muted-foreground">No conversations yet.</p>}
      {list.map((c) => <Button key={c.id} variant="ghost" onClick={() => { setActive(c.id); void load(c.id); }} className={`flex h-auto w-full items-center justify-start gap-3 rounded-none border-b border-border p-3 text-left ${active === c.id ? 'bg-secondary' : ''}`}>
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/20 font-bold text-primary">{(c.client_name ?? 'C').slice(0, 2).toUpperCase()}</div>
        <div className="min-w-0 flex-1"><b className="block truncate">{c.client_name}</b><span className="block truncate text-xs text-muted-foreground">{c.last_message ?? 'New conversation'}</span></div>
        <div className="flex flex-col items-end gap-1"><span className="text-[10px] text-muted-foreground">{time(c.updated_at)}</span>{c.unread > 0 && <span className="rounded-full bg-[var(--chat-online)] px-1.5 text-[10px] font-bold text-background">{c.unread}</span>}</div>
      </Button>)}
    </div>
    {active ? <div className="flex min-w-0 flex-1 flex-col"><div className="flex items-center gap-3 border-b border-border bg-card p-3"><Button variant="ghost" size="sm" className="md:hidden" onClick={() => setActive(null)}>Back</Button><b className="truncate">{current?.client_name}</b></div><Thread messages={messages} me="partner" onSend={async (text, media) => { await partnerSend({ data: { token: getStaffToken(), conversationId: active, text: text || undefined, media } }); await load(); }} /></div>
      : <div className="hidden flex-1 items-center justify-center text-muted-foreground md:flex">Select a conversation</div>}
  </div>;
}
