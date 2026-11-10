// Walks the whole meeting on the local test server with sample players, screenshots every projector page in order,
// and writes a PDF run sheet for the speaker. Needs Google Chrome and the dev server:
//   PORT=3457 node test/dev-server.mjs &   then   node tools/export-sequence.mjs <out-dir>
import fs from 'fs';
import { spawn } from 'child_process';
const R = decodeURIComponent(new URL('..', import.meta.url).pathname), OUT = process.argv[2], PORT = 3457, BASE = `http://localhost:${PORT}`;
const j = f => JSON.parse(fs.readFileSync(R + f, 'utf8')), pw = j('private/passwords.json'), roster = j('data/roster.json'), content = j('data/content.json');
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT + '/shots', { recursive: true });

// --- server API for the sample players
const api = async (fn, body) => (await (await fetch(`${BASE}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: 'x' }, body: JSON.stringify(body) })).json());
const tok = {}; const login = async id => tok[id] ??= (await api('mm_login', { p_id: id, p_password: pw.user })).token;
const L4 = roster.filter(u => u.level === 'L4'), L5 = roster.filter(u => u.level === 'L5');
const pick = (a, n) => [...a].sort(() => Math.random() - .5).slice(0, n);

// --- Chrome over the DevTools protocol
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${OUT}/chrome`, '--window-size=1920,1080', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
let target; for (let i = 0; i < 50 && !target; i++) { await sleep(300); try { target = (await (await fetch('http://127.0.0.1:9333/json/list')).json()).find(t => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let seq = 0; const waits = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && waits.has(m.id)) { waits.get(m.id)(m); waits.delete(m.id); } };
const cdp = (method, params = {}) => new Promise(r => { const id = ++seq; waits.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async expr => (await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
await cdp('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await cdp('Page.enable'); await cdp('Page.navigate', { url: BASE }); await sleep(2500);
await ev(`(async()=>{const j=await rpc('mm_login',{p_id:${JSON.stringify(pw.adminUser)},p_password:${JSON.stringify(pw.admin)}});token=j.token;store.set('tok',token);connect();})()`); await sleep(2000);
await ev(`(async()=>{await cmd({cmd:'resetAll'})})()`); await sleep(1500);

const NAME = { idle: 'หน้าแรก ก่อน Launch', lobby: 'Lobby · ทุกคนสแกน QR ล็อกอินเข้าเกม', p0: ['Recap Q3 Great Service', 'GEL Reality Check'], gvote: 'โหวต GEL ที่ดีต้องมีพฤติกรรมอะไรบ้าง · ทุกคนเลือก 3 ข้อในมือถือ', gvres: 'ผลโหวต Top 3 พฤติกรรม', p1: ['Good GEL', 'รู้จักตัวเองก่อน แล้วค่อยรู้จักทีม'], g1: 'เกมที่ 1 · แบบประเมินสไตล์การทำงาน (ทุกคนทำในมือถือ)', g1_end: 'สรุปผลเกมที่ 1 · สัตว์ 4 ประเภท', learn: 'อธิบายสัตว์ 4 ประเภท (เปิดทีละตัว)', groups: 'แบ่งกลุ่มตาม AC', g2_intro: 'เกมที่ 2 · กติกา สั่งงานให้ตรงประเภท', g2_motion: 'เกมที่ 2 · คลิปสถานการณ์', g2_countdown: 'เกมที่ 2 · นับถอยหลัง 10 วินาที', g2_match: 'เกมที่ 2 · AC จับคู่คำสั่งในจอของตัวเอง', g2_reveal: 'เกมที่ 2 · เฉลย (เปิดทีละสัตว์)', g2_scores: 'เกมที่ 2 · สกอร์บอร์ด', g2_end: 'จบเกมที่ 2', gel: 'สรุปกิจกรรมที่ 1 · GEL 4 ประเภท และ 5 เรื่องที่ต้องทำ', p2: 'Part 2 · รู้จักลูกค้า', g3_intro: 'เกมที่ 3 · กติกา แฟนพันธุ์แท้ลูกค้า', g3_board: 'เกมที่ 3 · เปิดป้ายคำใบ้ (คลิกป้ายหรือกดปุ่ม)', g3_reveal: 'เกมที่ 3 · เฉลยตัวละคร', g3_scores: 'เกมที่ 3 · สกอร์บอร์ด', pmap: 'สรุป Customer Persona', p3: ['ลูกค้าสมาชิกบอนชอนเป็นใคร', 'สมาชิก 4 กลุ่มที่ร้านควรรู้จัก', 'โอกาสซื้อซ้ำ', 'Repeat Visit Opportunity', 'สรุป 3 เรื่องก่อนให้บริการ', 'GEL Key Takeaway'], final: '🏆 ผลรวมสุดท้าย', p4: ['Master Service', 'What is Master Service?', 'คุณสมบัติ Master Service', 'Master Service Coming Soon', '☕ Break'] };
const P2 = ['ปก Part 2 รู้จักลูกค้า - รู้จักการบริการ', 'Persona คืออะไร?', 'Occasion คืออะไร?', 'รู้จัก Persona ไปทำไม?', 'ตัวอย่าง Customer Persona', 'Persona ดูจาก 2 แกน', 'Customer Persona 10 คน 7 Persona', '3 กลุ่มลูกค้าที่ทีมร้านเจอบ่อย'];
const pages = [];
const note = text => pages.push({ note: text });
const shot = async () => {
  await sleep(3400);
  const s = await ev(`({phase:V.phase,round:V.round,next:V.admin.nextLabel,recap:V.recapTab,open:V.recapOpen,signs:(V.g3||{}).signs,scen:(V.scenario||{}).title,persona:((V.g3||{}).persona||{}).name})`);
  const png = (await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 82 })).result.data, f = `shots/${String(pages.length + 1).padStart(3, '0')}.jpg`;
  fs.writeFileSync(`${OUT}/${f}`, Buffer.from(png, 'base64'));
  let title = NAME[s.phase]; if (Array.isArray(title)) title = title[s.round] || title[0];
  if (s.phase === 'p2') title = 'Part 2 · ' + P2[s.round];
  if (s.phase.startsWith('g2_') && s.phase !== 'g2_intro' && s.phase !== 'g2_end') title += ` · สถานการณ์ที่ ${s.round + 1}${s.scen ? ' ' + s.scen : ''}`;
  if (s.phase === 'g2_reveal') title += s.recap === 'wrong' ? ' · ถ้าพูดผิดสไตล์' : ' · คำสั่งที่ถูก';
  if (s.phase.startsWith('g3_') && s.phase !== 'g3_intro') title += ` · คนที่ ${s.round + 1}${s.phase === 'g3_board' ? ` (เปิดแล้ว ${s.signs} ป้าย)` : ''}${s.persona ? ' ' + s.persona : ''}`;
  if (s.phase === 'learn') title += ` · เปิดแล้ว ${s.round} ตัว`;
  if (s.phase === 'gel' && s.round < 5) title += ` · เปิดแล้ว ${s.round} ตัว`;
  pages.push({ f, title, next: s.next, phase: s.phase });
  console.log(pages.length, s.phase, s.round, s.next);
  return s;
};
const next = () => ev(`(async()=>{await cmd({cmd:'next'})})()`);
const goto = (phase, round = 0) => ev(`(async()=>{await cmd({cmd:'goto',phase:${JSON.stringify(phase)},round:${round}})})()`);

// sample players
const actors = { votes: async () => { for (const u of pick(roster, 70)) { const w = [3, 3, 3, 2, 2, 7, 7, 7, 7, 0, 0, 1, 4, 5, 6, 8, 8, 2], s = new Set(); while (s.size < 3) s.add(w[Math.floor(Math.random() * w.length)]); await api('mm_act', { p_token: await login(u.id), p_body: { type: 'gelvote', picks: [...s] } }); } },
  g1: async () => { const Q = (await api('mm_assessment', { p_token: await login(L4[0].id) })).questions; for (const u of [...L4, ...pick(L5, 60)]) await api('mm_act', { p_token: await login(u.id), p_body: { type: 'g1', answers: Q.map(() => Math.floor(Math.random() * 4)) } }); },
  g2: async r => { const sc = content.scenarios[r], cards = (await api('mm_view', { p_token: await login(L4[0].id) })).cards || []; const right = Object.fromEntries(Object.keys(sc.commands).map(k => [k, cards.find(c => c.t === sc.commands[k])?.id]));
    for (const [i, u] of L4.entries()) { const m = { ...right }; if (i % 3 === 2) [m.bull, m.eagle] = [m.eagle, m.bull]; if (i % 4 === 3) [m.rat, m.bear] = [m.bear, m.rat]; await api('mm_act', { p_token: await login(u.id), p_body: { type: 'g2', map: m } }); await sleep(120); } },
  g3: async (r, part) => { const p = content.personas[r], ans = p.as || p.id; for (const [i, u] of L4.entries()) if (i % 2 === part) await api('mm_act', { p_token: await login(u.id), p_body: { type: 'g3', choice: i % 5 === 4 ? 'p6' : ans } }); } };

// ---- walk the meeting
await shot();                                     // idle
await next(); await shot();                       // lobby
await next(); await shot(); await next(); await shot();   // p0 x2
await next(); await actors.votes(); await shot();         // gvote
await next(); await shot();                       // gvres
await next(); await shot(); await next(); await shot();   // p1 x2
await next(); await actors.g1(); await shot();            // g1
await next(); await shot();                       // g1_end
for (let i = 0; i < 5; i++) { await next(); await shot(); } // learn 0..4
await next(); await shot();                       // groups
await next(); await shot();                       // g2_intro
const g2round = async r => { await shot(); await next(); await shot(); await next(); await actors.g2(r); await shot(); for (let i = 0; i < 10; i++) { await next(); await shot(); } await next(); await shot(); };
await next(); await g2round(0);                   // scenario 1: motion, countdown, match, reveal x10, scores
note('สถานการณ์ที่ 2–9 ทำซ้ำแบบเดียวกับสถานการณ์ที่ 1 (คลิป → นับถอยหลัง → AC จับคู่ → เฉลย → สกอร์บอร์ด)');
await goto('g2_motion', 9); await g2round(9);      // scenario 10
await next(); await shot();                       // g2_end
for (let i = 0; i < 6; i++) { await next(); await shot(); } // gel 0..5
for (let i = 0; i < 8; i++) { await next(); await shot(); } // p2 0..7
await next(); await shot();                       // g3_intro
const g3round = async (r, first) => { if (!first) await shot(); await next(); await actors.g3(r, 0); await shot(); await next(); await shot(); await next(); await actors.g3(r, 1); await shot(); await next(); await shot(); await next(); await shot(); await next(); await shot(); await next(); await shot(); };
await next(); await g3round(0, false);            // person 1: board 0..5 signs, reveal, scores
note('คนที่ 2–9 ทำซ้ำแบบเดียวกับคนที่ 1 (เปิดป้ายทีละแผ่น เลือกแผ่นไหนก่อนก็ได้ → เฉลย → สกอร์บอร์ด)');
await goto('g3_board', 9); await g3round(9, false); // person 10
await next(); await shot();                       // pmap
for (let i = 0; i < 6; i++) { await next(); await shot(); } // p3 0..5
await next(); await shot();                       // final
for (let i = 0; i < 5; i++) { await next(); await shot(); } // Master Service x4 + Break
fs.writeFileSync(`${OUT}/pages.json`, JSON.stringify(pages, null, 1));

// ---- PDF run sheet
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
let n = 0; const body = pages.map(p => p.note ? `<section class="note"><div><b>⋯</b><p>${esc(p.note)}</p></div></section>` : `<section><header><span class="no">${++n}</span><h2>${esc(p.title)}</h2></header><img src="${p.f}"><footer>${p.next ? `ปุ่มถัดไปบนจอแอดมิน: <b>${esc(p.next)}</b>` : '<b>หน้าสุดท้าย</b>'}</footer></section>`).join('');
const toc = []; let k = 0; for (const p of pages) { if (p.note) continue; k++; const h = p.title.split(' · ')[0]; if (!toc.length || toc[toc.length - 1].h !== h) toc.push({ h, from: k }); }
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{margin:0;font-family:'Sukhumvit Set','Thonburi',sans-serif;color:#1d1d1d}
section{page-break-after:always;height:189mm;display:flex;flex-direction:column;gap:3mm}
header{display:flex;align-items:center;gap:4mm}.no{background:#d7141a;color:#fff;font-weight:800;font-size:16pt;min-width:14mm;height:11mm;border-radius:6mm;display:grid;place-items:center;padding:0 3mm}
h2{margin:0;font-size:15pt}img{width:100%;height:auto;max-height:156mm;object-fit:contain;border:1px solid #ddd;border-radius:2mm}
footer{font-size:12pt;color:#444}footer b{color:#d7141a}
.cover{justify-content:center;align-items:flex-start;gap:6mm;padding:0 12mm}.cover h1{margin:0;font-size:34pt}.cover h1 em{color:#d7141a;font-style:normal}.cover p{margin:0;font-size:14pt;color:#444}
.toc{column-count:2;font-size:11pt;line-height:1.6}.toc div span{display:inline-block;width:14mm;color:#d7141a;font-weight:700}
.note{justify-content:center;align-items:center}.note div{text-align:center;max-width:200mm}.note b{font-size:40pt;color:#d7141a}.note p{font-size:18pt}
</style></head><body><section class="cover"><h1>Manager Meeting Game · <em>ลำดับหน้าจอ</em></h1><p>Bonchon Manager Meeting 11 พ.ย. 2026 · จอหลัก (projector) ทุกหน้าตามลำดับที่แอดมินกดปุ่ม "ถัดไป" · ${n} หน้า</p><p>ภาพจากการทดลองเล่นด้วยข้อมูลตัวอย่าง คะแนนและผลโหวตในวันจริงจะต่างไป</p><div class="toc">${toc.map(t => `<div><span>หน้า ${t.from}</span>${esc(t.h)}</div>`).join('')}</div></section>${body}</body></html>`;
fs.writeFileSync(`${OUT}/sequence.html`, html);
await cdp('Page.navigate', { url: 'file://' + OUT + '/sequence.html' }); await sleep(2500);
const pdf = (await cdp('Page.printToPDF', { landscape: true, printBackground: true, paperWidth: 11.69, paperHeight: 8.27, marginTop: .4, marginBottom: .4, marginLeft: .4, marginRight: .4, preferCSSPageSize: true })).result.data;
fs.writeFileSync(`${OUT}/sequence.pdf`, Buffer.from(pdf, 'base64'));
console.log('pages', n, 'pdf', fs.statSync(`${OUT}/sequence.pdf`).size);
ws.close(); chrome.kill(); process.exit(0);
