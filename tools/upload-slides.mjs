// Uploads private/slides/p<N>.jpg into the game's slides bucket. node tools/upload-slides.mjs
import fs from 'fs';
const R = decodeURIComponent(new URL('..', import.meta.url).pathname);
const c = fs.readFileSync(R + 'config.js', 'utf8'), U = /supabaseUrl: '([^']+)'/.exec(c)[1], K = /anonKey: '([^']+)'/.exec(c)[1], pw = JSON.parse(fs.readFileSync(R + 'private/passwords.json'));
const H = { apikey: K, 'Content-Type': 'application/json' };
const A = (await (await fetch(`${U}/rest/v1/rpc/mm_login`, { method: 'POST', headers: H, body: JSON.stringify({ p_id: pw.adminUser, p_password: pw.admin }) })).json()).token;
let ok = 0, all = 0;
for (const f of fs.readdirSync(R + 'private/slides').filter(f => /^p\d+\.jpg$/.test(f))) {
  all++; const n = +f.slice(1, -4), body = fs.readFileSync(R + 'private/slides/' + f);
  const j = await (await fetch(`${U}/functions/v1/motion-upload`, { method: 'POST', headers: H, body: JSON.stringify({ token: A, action: 'slide', slide: n }) })).json();
  if (!j.url) { console.log(f, 'sign failed', j.error); continue; }
  const up = await fetch(j.url, { method: 'PUT', headers: { 'x-upsert': 'true', 'content-type': 'image/jpeg', 'cache-control': 'max-age=60' }, body });
  const h = await fetch(`${U}/storage/v1/object/public/slides/${f}?x=${Date.now()}`, { method: 'HEAD' });
  const good = up.ok && h.ok && +h.headers.get('content-length') === body.length; if (good) ok++;
  console.log(f, up.status, h.status, good ? 'ok' : 'FAILED');
}
console.log(`uploaded ${ok}/${all}`);
fs.writeFileSync('/tmp/claude-503/up-token.txt', A);
