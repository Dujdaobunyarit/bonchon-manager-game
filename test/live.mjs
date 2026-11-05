// Rehearsal against the real Supabase project: all staff connect over Realtime, coaches submit together.
// It plays through game state, then resets the whole game. Run only when no real game is in progress.
import { createClient } from '@supabase/supabase-js';
import fs from 'fs'; import assert from 'assert';
const R = decodeURIComponent(new URL('..', import.meta.url).pathname), read = f => fs.readFileSync(R + f, 'utf8'), json = f => JSON.parse(read(f));
const cfg = read('config.js'), URL_ = /supabaseUrl: '([^']+)'/.exec(cfg)[1], KEY = /anonKey: '([^']+)'/.exec(cfg)[1];
const roster = json('data/roster.json'), content = json('data/content.json'), PW = json('private/passwords.json');
const sb = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const rpc = async (f, a) => { const { data, error } = await sb.rpc(f, a); if (error) throw new Error(f + ': ' + error.message); return data; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ok = 0; const check = (c, m) => { assert.ok(c, m); ok++; console.log('  ✓', m); };

// privacy over the real API
for (const t of ['roster', 'config', 'sessions']) {
  const r = await fetch(`${URL_}/rest/v1/${t}?select=*`, { headers: { apikey: KEY } });
  check(!r.ok, `${t} not readable with the public key (${r.status})`);
}
const gr = await fetch(`${URL_}/rest/v1/roster?select=*`, { headers: { apikey: KEY, 'Accept-Profile': 'game' } });
check(!gr.ok, `game schema not exposed (${gr.status})`);
const w = await fetch(`${URL_}/rest/v1/mm_tick?id=eq.1`, { method: 'PATCH', headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: '{"rev":999999}' });
check(!w.ok || (await w.json()).length === 0, 'change signal cannot be written');

const A = (await rpc('mm_login', { p_id: PW.adminUser, p_password: PW.admin })).token;
const adm = b => rpc('mm_admin', { p_token: A, p_body: b });
check((await rpc('mm_login', { p_id: roster[0].id, p_password: 'wrong' })).error, 'wrong password rejected');
await adm({ cmd: 'resetAll' });

// everyone logs in
let t0 = Date.now();
const users = [];
for (let i = 0; i < roster.length; i += 20) {
  const batch = roster.slice(i, i + 20);
  users.push(...await Promise.all(batch.map(async u => ({ u, t: (await rpc('mm_login', { p_id: u.id, p_password: PW.user })).token }))));
}
check(users.every(x => x.t), `all ${users.length} staff logged in (${Date.now() - t0} ms)`);
check((await rpc('mm_view', { p_token: A })).admin.joined.length === roster.length, 'admin sees everyone joined');

// separate Realtime connection per device
const clients = users.map(c => {
  const s = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  c.sb = s; c.subscribed = false; c.gotAt = 0;
  c.ch = s.channel('mm-tick').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mm_tick' }, p => { c.gotAt = Date.now(); c.rev = p.new.rev; })
    .subscribe(st => { c.status = st; if (st === 'SUBSCRIBED') c.subscribed = true; });
  return c;
});
t0 = Date.now(); while (clients.some(c => !c.subscribed) && Date.now() - t0 < 60000) await sleep(200);
const subs = clients.filter(c => c.subscribed).length;
console.log(`  subscribed ${subs}/${clients.length} in ${Date.now() - t0} ms; other states:`, [...new Set(clients.filter(c => !c.subscribed).map(c => c.status))]);
check(subs === clients.length, 'every device connected to Realtime');
await sleep(4000); // postgres_changes needs a moment after SUBSCRIBED

// signal fan-out then all devices fetch their view
const stat = a => { const s = [...a].sort((x, y) => x - y); return `median ${s[s.length >> 1]} ms, slowest ${s[s.length - 1]} ms`; };
await adm({ cmd: 'goto', phase: 'g2_motion', round: 0, clear: true }); await sleep(500);
await adm({ cmd: 'next' });
clients.forEach(c => { c.gotAt = 0; });
const fired = Date.now(); await adm({ cmd: 'next' });
t0 = Date.now(); while (clients.some(c => !c.gotAt) && Date.now() - t0 < 15000) await sleep(20);
const late = clients.filter(c => !c.gotAt).length;
console.log('  signal received:', stat(clients.filter(c => c.gotAt).map(c => c.gotAt - fired)), 'missed', late);
console.log(late === 0 ? '  ✓ signal reached every device' : `  ! ${late} device(s) missed the signal and rely on polling`);
const tv = Date.now();
const views = await Promise.all(clients.map(async c => { await sleep(Math.random() * 300); const s = Date.now(), v = await rpc('mm_view', { p_token: c.t }); c.v = v; return Date.now() - s; }));
console.log(`  all devices refreshed in ${Date.now() - tv} ms; each`, stat(views));
check(clients.every(c => c.v.phase === 'g2_match' && c.v.cards.length === 4), 'all devices show the match');

// repeated admin clicks: Realtime free plan allows about 100 messages a second
clients.forEach(c => { c.events = 0; c.closed = 0; });
const misses = [], delays = [];
for (let i = 0; i < 12; i++) {
  clients.forEach(c => { c.gotAt = 0; });
  const f = Date.now(); await adm({ cmd: 'board', on: i % 2 === 0 }); await sleep(3000);
  misses.push(clients.filter(c => !c.gotAt).length);
  delays.push(Math.max(...clients.filter(c => c.gotAt).map(c => c.gotAt - f), 0));
}
console.log('  12 clicks, 3 s apart. missed per click:', misses.join(','), '| slowest ms:', delays.join(','));
console.log('  connection states now:', JSON.stringify(clients.reduce((m, c) => (m[c.status] = (m[c.status] || 0) + 1, m), {})));
await adm({ cmd: 'board', on: false });

// ten coaches press submit together: order must give 15, 14, ...
const coaches = clients.filter(c => c.u.level === 'L4'), sc = content.scenarios[0], cards = coaches[0].v.cards;
const map = Object.fromEntries(Object.keys(sc.commands).map(k => [k, cards.find(x => x.t === sc.commands[k]).id]));
const ts = Date.now(), rs = await Promise.all(coaches.map(c => rpc('mm_act', { p_token: c.t, p_body: { type: 'g2', map } })));
console.log(`  ${coaches.length} simultaneous submits in ${Date.now() - ts} ms`);
check(rs.every(r => r.ok), 'every submit accepted');
await adm({ cmd: 'next' }); await adm({ cmd: 'next' });
const b = await rpc('mm_view', { p_token: A }), scores = b.scoreboard.map(r => r.total);
console.log('  scores', scores.join(', '));
check(new Set(scores).size === scores.length && scores[0] === 55 && scores[coaches.length - 1] === 40 + 15 - (coaches.length - 1), 'no ties: 55 down to 46');

// game 3 race on a real sign
await adm({ cmd: 'goto', phase: 'g3_board', round: 0, clear: true }); await adm({ cmd: 'next' });
const rs3 = await Promise.all(coaches.map(c => rpc('mm_act', { p_token: c.t, p_body: { type: 'g3', choice: content.personas[0].id } })));
check(rs3.every(r => r.ok), 'game 3 simultaneous answers accepted');
for (let i = 0; i < 4; i++) await adm({ cmd: 'next' });
const s3 = (await rpc('mm_view', { p_token: A })).phase; check(s3 === 'g3_reveal', 'all 4 signs then reveal');

// countdown auto-advance on the server clock
await adm({ cmd: 'goto', phase: 'g2_motion', round: 1, clear: true }); await adm({ cmd: 'next' });
await sleep(10500);
check((await rpc('mm_view', { p_token: coaches[0].t })).phase === 'g2_match', 'countdown opens the match on its own');

await Promise.all(clients.map(c => c.sb.removeAllChannels()));
await adm({ cmd: 'resetAll' });
const end = await rpc('mm_view', { p_token: A });
check(end.phase === 'idle' && end.admin.joined.length === 0, 'game reset after rehearsal');
console.log(`\nPASS ${ok} checks`); process.exit(0);
