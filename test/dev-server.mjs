// Local preview: serves the site and answers Supabase RPC calls from an in-memory Postgres. No Realtime, so clients poll.
import { PGlite } from '@electric-sql/pglite';
import http from 'http'; import fs from 'fs'; import path from 'path';
const R = decodeURIComponent(new URL('..', import.meta.url).pathname), read = f => fs.readFileSync(R + f, 'utf8');
const db = new PGlite();
await db.exec(`create role anon nologin; create role authenticated nologin;`);
await db.exec(read('supabase/schema.sql')); await db.exec(read('private/seed.sql')); await db.exec(read('supabase/update_2.sql')); await db.exec(read('supabase/update_3.sql')); await db.exec(read('supabase/update_4.sql')); await db.exec(read('supabase/update_5.sql')); await db.exec(read('supabase/update_6.sql')); await db.exec(read('supabase/update_7.sql')); await db.exec(read('supabase/update_8.sql')); await db.exec(read('supabase/update_9.sql')); await db.exec(read('supabase/update_10.sql')); await db.exec(read('supabase/update_11.sql')); await db.exec(read('supabase/update_12.sql')); await db.exec(read('supabase/update_13.sql')); await db.exec('set role anon');
{ const q = (f, ...x) => db.query(`select public.${f}(${x.map((_, i) => `$${i + 1}`).join(',')}) v`, x).then(r => r.rows[0].v), js = f => JSON.parse(read(f)), pw = js('private/passwords.json');
  const A = (await q('mm_login', pw.adminUser, pw.admin)).token; await q('mm_set_groups', A, js('data/groups-seed.json'));
  const mg = js('data/managers.json'), row = u => ({ id: u.id, name: u.name, store: u.store, code: u.store.split('-')[0].trim(), managerId: mg[u.id] || '' }), R0 = js('data/roster.json');
  for (const g of ['equity', 'franchise']) await q('mm_import', A, g, R0.filter(u => u.group === g).map(row), false); }
const ARGS = { mm_login: ['p_id', 'p_password'], mm_view: ['p_token'], mm_assessment: ['p_token'], mm_act: ['p_token', 'p_body'], mm_admin: ['p_token', 'p_body'], mm_export: ['p_token'], mm_monitor: ['p_token'], mm_is_admin: ['p_token'], mm_set_groups: ['p_token', 'p_groups'], mm_import: ['p_token', 'p_grp', 'p_rows', 'p_dry'] };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
http.createServer((req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  if (p === '/rest/v1/mm_tick') { db.query('select rev from public.mm_tick').then(r => { res.writeHead(200, { ...cors, 'Content-Type': 'application/vnd.pgrst.object+json' }); res.end(JSON.stringify(r.rows[0])); }); return; }
  const m = /^\/rest\/v1\/rpc\/(\w+)$/.exec(p);
  if (m) { let b = ''; req.on('data', d => b += d); req.on('end', async () => { try {
    const body = JSON.parse(b || '{}'), a = ARGS[m[1]].map(k => body[k]);
    const r = await db.query(`select public.${m[1]}(${a.map((_, i) => `$${i + 1}`).join(',')}) v`, a);
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json' }); res.end(JSON.stringify(r.rows[0].v));
  } catch (e) { res.writeHead(400, { ...cors, 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message: e.message })); } }); return; }
  if (p.startsWith('/storage/v1/object/public/')) { // motions and slides come from the live project
    fetch('https://gwzsjlxvvpuslevlfqdt.supabase.co' + p, { headers: req.headers.range ? { range: req.headers.range } : {} }).then(async r => { const h = { 'Access-Control-Allow-Origin': '*', 'Content-Type': r.headers.get('content-type') || 'application/octet-stream', 'Accept-Ranges': 'bytes' }; for (const k of ['content-range', 'content-length']) if (r.headers.get(k)) h[k] = r.headers.get(k); res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer())); }).catch(() => { res.writeHead(502); res.end(); }); return; }
  if (p === '/config.js') { res.writeHead(200, { 'Content-Type': 'text/javascript' }); return res.end(`window.MM_CONFIG={supabaseUrl:location.origin,anonKey:'local'}`); }
  const f = path.join(R, p === '/' ? 'index.html' : decodeURIComponent(p));
  if (!f.startsWith(R) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); fs.createReadStream(f).pipe(res);
}).listen(+process.env.PORT || 3456, () => console.log('dev on', +process.env.PORT || 3456));
