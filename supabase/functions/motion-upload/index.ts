// Gives the game admin a one-time upload link for a scenario motion or a deck slide, or deletes a motion.
// JWT check is off because staff use game sessions, not Supabase accounts; the admin token is checked here.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return out({ error: 'method' }, 405);
  let b: { token?: string; n?: number; action?: string; slide?: number };
  try { b = await req.json(); } catch { return out({ error: 'bad request' }, 400); }
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!b.token || !uuid.test(b.token)) return out({ error: 'forbidden' }, 403);
  const { data: ok } = await sb.rpc('mm_is_admin', { p_token: b.token });
  if (ok !== true) return out({ error: 'forbidden' }, 403);
  if (b.action === 'slide') { // deck pages shown between games: slides/p47.jpg
    const s = Number(b.slide);
    if (!Number.isInteger(s) || s < 1 || s > 200) return out({ error: 'bad slide' }, 400);
    const { data, error } = await sb.storage.from('slides').createSignedUploadUrl(`p${s}.jpg`, { upsert: true });
    return error ? out({ error: error.message }, 500) : out({ url: data.signedUrl });
  }
  const n = Number(b.n);
  if (!Number.isInteger(n) || n < 1 || n > 10) return out({ error: 'สถานการณ์ไม่ถูกต้อง' }, 400);
  const path = `s${n}.mp4`, bucket = sb.storage.from('motions');
  if (b.action === 'delete') {
    const { error } = await bucket.remove([path]);
    return error ? out({ error: error.message }, 500) : out({ ok: true });
  }
  if (b.action === 'sign') {
    const { data, error } = await bucket.createSignedUploadUrl(path, { upsert: true });
    return error ? out({ error: error.message }, 500) : out({ url: data.signedUrl });
  }
  return out({ error: 'unknown' }, 400);
});
