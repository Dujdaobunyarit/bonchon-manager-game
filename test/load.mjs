// Full-size rehearsal on the real project. Run with test users loaded: node tools/load-roster.mjs 120
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const R = decodeURIComponent(new URL('..', import.meta.url).pathname), j = f => JSON.parse(fs.readFileSync(R + f, 'utf8'));
const c = fs.readFileSync(R + 'config.js', 'utf8'), U = /supabaseUrl: '([^']+)'/.exec(c)[1], K = /anonKey: '([^']+)'/.exec(c)[1];
const H = { apikey: K, 'Content-Type': 'application/json' }, pw = j('private/passwords.json'), content = j('data/content.json');
const stats = { rpc: {}, errors: {} };
const rpc = async (f, b) => { const s = Date.now(); const r = await fetch(`${U}/rest/v1/rpc/${f}`, { method: 'POST', headers: H, body: JSON.stringify(b) }); (stats.rpc[f] ??= []).push(Date.now() - s); if (!r.ok) { stats.errors[f + ' ' + r.status] = (stats.errors[f + ' ' + r.status] || 0) + 1; throw new Error(f + ' ' + r.status); } return r.json(); };
const sleep = ms => new Promise(r => setTimeout(r, ms)), pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))] ?? 0; };
const line = (l, a) => console.log(`  ${l}: n=${a.length} p50=${pct(a, .5)}ms p95=${pct(a, .95)}ms max=${Math.max(0, ...a)}ms`);
const A = (await rpc('mm_login', { p_id: pw.adminUser, p_password: pw.admin })).token, adm = b => rpc('mm_admin', { p_token: A, p_body: b });
await adm({ cmd: 'resetAll' });
const ex = (await rpc('mm_export', { p_token: A })).rows, FAKE = ex.filter(r => r.id.startsWith('T'));
const stop = { v: false };
// login burst
let t0 = Date.now(); const users = [];
await Promise.all(ex.map(async (u, i) => { await sleep(Math.random() * 20000); const r = await rpc('mm_login', { p_id: u.id, p_password: pw.user }); users.push({ u, t: r.token }); }));
console.log(`logins: ${users.length} people across 20 s`); line('login', stats.rpc.mm_login);
const viewers = users.filter(x => x.u.level === 'L5'), coaches = users.filter(x => x.u.level === 'L4');
console.log(`viewers ${viewers.length}, coaches ${coaches.length}`);
// coaches on Realtime; viewers poll the counter every 3 s exactly like app.js
let phaseFired = 0; const seen = [], coachSig = [];
const subs = coaches.map(c => { const s = createClient(U, K, { auth: { persistSession: false } }); c.ch = s.channel('mm-tick').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mm_tick' }, p => { if (phaseFired) coachSig.push(Date.now() - phaseFired); c.rev = p.new.rev; }).subscribe(st => { c.st = st; }); c.sb = s; return c; });
t0 = Date.now(); while (subs.some(c => c.st !== 'SUBSCRIBED') && Date.now() - t0 < 30000) await sleep(100);
console.log('coach realtime', subs.filter(c => c.st === 'SUBSCRIBED').length); await sleep(3000);
const pollLat = []; let pollErr = 0;
for (const v of viewers) {
  v.rev = null; v.phase = null;
  (async () => { await sleep(Math.random() * 2000);
    while (!stop.v) {
      const s = Date.now();
      try { const r = await fetch(`${U}/rest/v1/mm_tick?select=rev&id=eq.1`, { headers: { ...H, Accept: 'application/vnd.pgrst.object+json' } }); if (!r.ok) { pollErr++; } else { const d = await r.json(); pollLat.push(Date.now() - s);
        if (v.rev !== null && d.rev !== v.rev) { await sleep(Math.random() * 400); try { const m = await rpc('mm_view', { p_token: v.t }); v.phase = m.phase; v.round = m.round; if (phaseFired) seen.push(Date.now() - phaseFired); } catch {} }
        v.rev = d.rev; } } catch { pollErr++; }
      await sleep(2000);
    } })();
}
await sleep(4000);
const step = async (label, f, wantPhase) => {
  seen.length = 0; coachSig.length = 0; const n0 = viewers.length; phaseFired = Date.now(); await f();
  const start = Date.now(); while (seen.length < n0 && Date.now() - start < 15000) await sleep(100);
  await Promise.all(coaches.map(c => rpc('mm_view', { p_token: c.t })));
  console.log(`${label}: viewers updated ${seen.length}/${n0}`); line('  admin click to viewer screen', seen); line('  admin click to coach signal', coachSig); phaseFired = 0;
};
await step('launch', () => adm({ cmd: 'next' }));
await step('recap', () => adm({ cmd: 'next' }));
await step('reality check', () => adm({ cmd: 'next' }));
await step('GEL vote opens', () => adm({ cmd: 'next' }));
// everyone votes 3 behaviours within 30 s
stats.rpc.mm_act = [];
await Promise.all(users.map(async x => { await sleep(Math.random() * 30000); const s = new Set(); while (s.size < 3) s.add(Math.floor(Math.random() * 9)); const r = await rpc('mm_act', { p_token: x.t, p_body: { type: 'gelvote', picks: [...s] } }); if (!r.ok) stats.errors.gelvote = (stats.errors.gelvote || 0) + 1; await rpc('mm_view', { p_token: x.t }); }));
line('GEL vote submit', stats.rpc.mm_act); stats.rpc.mm_act = [];
const gv = (await rpc('mm_view', { p_token: A })).gv; console.log(`  votes counted ${gv.voters}/${users.length}`);
await step('vote results', () => adm({ cmd: 'next' }));
await step('Good GEL', () => adm({ cmd: 'next' }));
await step('know yourself', () => adm({ cmd: 'next' }));
await step('start game 1', () => adm({ cmd: 'next' }));
// everyone finishes game 1 within 45 s
const Q = (await rpc('mm_assessment', { p_token: A })).questions; const ans = Q.map(() => 0);
await Promise.all(users.map(async x => { await sleep(Math.random() * 45000); await rpc('mm_assessment', { p_token: x.t }); const r = await rpc('mm_act', { p_token: x.t, p_body: { type: 'g1', answers: Q.map((_, i) => Math.floor(Math.random() * 4)) } }); if (!r.animal) stats.errors.g1 = (stats.errors.g1 || 0) + 1; await rpc('mm_view', { p_token: x.t }); }));
line('game 1 submit', stats.rpc.mm_act);
await step('end game 1', () => adm({ cmd: 'next' }));
await step('animals page', () => adm({ cmd: 'next' }));
for (let i = 0; i < 4; i++) await step('open animal ' + (i + 1), () => adm({ cmd: 'next' }));
await step('groups', () => adm({ cmd: 'next' }));
await step('game 2 intro', () => adm({ cmd: 'next' }));
await step('motion', () => adm({ cmd: 'next' }));
await step('countdown', () => adm({ cmd: 'next' }));
await step('match', () => adm({ cmd: 'next' }));
let cv = await rpc('mm_view', { p_token: coaches[0].t });
const sc = content.scenarios[0], map = Object.fromEntries(Object.keys(sc.commands).map(k => [k, cv.cards.find(x => x.t === sc.commands[k]).id]));
stats.rpc.mm_act = []; let ts = Date.now();
const rr = await Promise.all(coaches.map(c => rpc('mm_act', { p_token: c.t, p_body: { type: 'g2', map } })));
console.log(`${coaches.length} coaches submit together: ${rr.filter(r => r.ok).length}/${coaches.length} in ${Date.now() - ts} ms`);
await step('reveal', () => adm({ cmd: 'next' }));
await step('open answers', () => adm({ cmd: 'recapOpenAll' }));
await step('wrong style', () => adm({ cmd: 'next' }));
await step('open wrong style', () => adm({ cmd: 'recapOpenAll' }));
await step('scoreboard (heaviest)', () => adm({ cmd: 'next' }));
const b = (await rpc('mm_view', { p_token: A })).scoreboard.map(r => r.total); console.log('  scores', b.join(','), b[0] === 115 && b.slice(1).every(x => x === 100) ? 'first 115, rest 100' : 'UNEXPECTED');
await adm({ cmd: 'goto', phase: 'g3_board', round: 0, clear: true });
await step('open sign 1', () => adm({ cmd: 'next' }));
ts = Date.now(); const pid = content.personas[0].id; const r3 = await Promise.all(coaches.map((c, i) => rpc('mm_act', { p_token: c.t, p_body: { type: 'g3', choice: i % 2 ? pid : 'p7' } })));
console.log(`game 3 answers: ${r3.filter(r => r.ok).length}/${coaches.length} in ${Date.now() - ts} ms`);
for (let i = 0; i < 3; i++) await adm({ cmd: 'next' });
const mon = []; for (let i = 0; i < 10; i++) { const s = Date.now(); await rpc('mm_monitor', { p_token: A }); mon.push(Date.now() - s); await sleep(200); } line('back office refresh', mon);
await step('reveal game 3', () => adm({ cmd: 'next' }));
stop.v = true; await sleep(500);
line('viewer poll', pollLat.slice(-3000)); console.log('  poll errors', pollErr);
for (const [k, a] of Object.entries(stats.rpc)) line(k, a);
console.log('errors', JSON.stringify(stats.errors));
await Promise.all(coaches.map(c => c.sb.removeAllChannels()));
process.exit(0);
