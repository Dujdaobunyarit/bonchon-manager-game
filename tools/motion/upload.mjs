// Uploads motion-output/s1..s10.mp4 into the game. node tools/motion/upload.mjs
import fs from 'fs';
const R = decodeURIComponent(new URL('../..', import.meta.url).pathname);
const c = fs.readFileSync(R + 'config.js', 'utf8'), U = /supabaseUrl: '([^']+)'/.exec(c)[1], K = /anonKey: '([^']+)'/.exec(c)[1], pw = JSON.parse(fs.readFileSync(R + 'private/passwords.json'));
const H = { apikey: K, 'Content-Type': 'application/json' };
const A = (await (await fetch(`${U}/rest/v1/rpc/mm_login`, { method: 'POST', headers: H, body: JSON.stringify({ p_id: pw.adminUser, p_password: pw.admin }) })).json()).token;
let ok = 0;
for (let n = 1; n <= 10; n++) {
  const f = fs.readFileSync(`${R}motion-output/s${n}.mp4`);
  const j = await (await fetch(`${U}/functions/v1/motion-upload`, { method: 'POST', headers: H, body: JSON.stringify({ token: A, action: 'sign', n }) })).json();
  if (!j.url) { console.log(n, 'sign failed', j.error); continue; }
  const up = await fetch(j.url, { method: 'PUT', headers: { 'x-upsert': 'true', 'content-type': 'video/mp4', 'cache-control': 'max-age=60' }, body: f });
  const h = await fetch(`${U}/storage/v1/object/public/motions/s${n}.mp4?x=${Date.now()}`, { method: 'HEAD' });
  const size = +h.headers.get('content-length'), good = up.ok && h.ok && size === f.length;
  if (good) ok++;
  console.log(`s${n}`, up.status, h.status, h.headers.get('content-type'), (size / 1048576).toFixed(1) + ' MB', good ? 'ok' : 'FAILED');
}
console.log(`uploaded ${ok}/10`);
fs.writeFileSync('/tmp/claude-503/up-token.txt', A);
