// Renders game 2 scenario motions. node tools/motion/make.mjs [1,2,3] [--stills]
import fs from 'fs';
import { R, W, H, FPS, SR, RED, INK, GOLD, cl, prog, eo, eio, back, lerp, loadAll, sprite, bob, seated, chairBack, rr, table, plate, glass, sauce, pad, clock, bubble, emote, burst, label, wrap, bgDining, bgCounter, bgStore, Mix, SFX, bgm, voice, encoder, createCanvas } from './engine.mjs';
import { SCENES } from './scenes.mjs';

const OUT = R + 'motion-output'; fs.mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2), list = (args.find(a => /^[\d,]+$/.test(a)) || '1,2,3,4,5,6,7,8,9,10').split(',').map(Number), STILLS = args.includes('--stills');
await loadAll();
const BG = { dining: bgDining(), counter: bgCounter(), store: bgStore() };
const cv = createCanvas(W, H), c = cv.getContext('2d');
const ANIM = [['bull', 'กระทิง', 'BULL'], ['eagle', 'อินทรี', 'EAGLE'], ['rat', 'หนู', 'RAT'], ['bear', 'หมี', 'BEAR']];
const fx = { c, sprite, bob, seated, chairBack, rr, table, plate, glass, sauce, pad, clock, bubble, emote, burst, label, prog, eo, eio, back, lerp, cl, RED, INK, GOLD };

function subtitle(text, a) {
  if (!text || a <= 0) return;
  c.save(); c.globalAlpha = a; c.font = '46px KM'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const lines = wrap(c, text, 1560), h = lines.length * 62 + 34, y = H - h - 26, w = Math.min(1700, Math.max(...lines.map(l => c.measureText(l).width)) + 90);
  c.fillStyle = '#000000d9'; rr(c, W / 2 - w / 2, y, w, h, 18); c.fill(); c.fillStyle = '#fff';
  lines.forEach((l, i) => c.fillText(l, W / 2, y + 48 + i * 62)); c.restore();
}
function wipe(x01) {
  if (x01 <= 0 || x01 >= 1) return; const px = lerp(-700, W + 700, eio(x01));
  c.save(); c.fillStyle = RED; c.beginPath(); c.moveTo(px - 560, 0); c.lineTo(px + 800, 0); c.lineTo(px + 420, H); c.lineTo(px - 940, H); c.fill();
  c.fillStyle = INK; c.beginPath(); c.moveTo(px + 800, 0); c.lineTo(px + 930, 0); c.lineTo(px + 550, H); c.lineTo(px + 420, H); c.fill(); c.restore();
}
function titleCard(sc, t, d) {
  c.fillStyle = '#0d0d0d'; c.fillRect(0, 0, W, H);
  const k = eo(prog(t, 0, .5));
  c.save(); c.fillStyle = RED; c.beginPath(); c.moveTo(-200, 760 + (1 - k) * 500); c.lineTo(W * .62 * k, 660); c.lineTo(W * .5 * k, 860); c.lineTo(-200, 960); c.fill();
  c.beginPath(); c.moveTo(W + 200, 120 - (1 - k) * 300); c.lineTo(W - 620 * k, 0); c.lineTo(W - 780 * k, 60); c.lineTo(W + 200, 260); c.fill(); c.restore();
  const a = back(prog(t, .1, .45));
  c.save(); c.translate(W / 2, 330); c.scale(a, a); label(c, `สถานการณ์ที่ ${sc.n}`, 0, 0, 72); c.restore();
  const b = eo(prog(t, .3, .45)); c.save(); c.globalAlpha = b; c.translate(0, (1 - b) * 40); c.fillStyle = '#fff'; c.font = '104px KB'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const ls = wrap(c, sc.title, 1600); ls.forEach((l, i) => c.fillText(l, W / 2, 520 + i * 130 - (ls.length - 1) * 50)); c.restore();
}
function drawScene(bg, t, zoom = .012, focus = [W / 2, H * .62]) {
  const z = 1.1 + t * zoom; c.save(); c.translate(focus[0], focus[1]); c.scale(z, z); c.translate(-focus[0], -focus[1]);
  c.drawImage(BG[bg], 0, 0, W, H); return () => c.restore();
}
function quote(sc, t, d) {
  const end = drawScene(sc.quoteBg || 'dining', t, .006); sc.quotePose(fx, t, d); end();
  c.fillStyle = '#00000060'; c.fillRect(0, 0, W, H);
  const k = back(prog(t, .05, .45)), x = 1130, w = 1270;
  c.font = '54px KB'; const ls = wrap(c, sc.quote, w - 130), h = ls.length * 78 + 148, top = 450 - h / 2;
  c.save(); c.translate(x, top + h); c.scale(k, k); c.translate(-x, -top - h);
  c.fillStyle = '#fff'; rr(c, x - w / 2, top, w, h, 36); c.fill();
  c.beginPath(); c.moveTo(x - w / 2 + 90, top + h - 3); c.lineTo(x - w / 2 - 10, top + h + 74); c.lineTo(x - w / 2 + 210, top + h - 3); c.fill();
  c.fillStyle = '#857b74'; c.font = '30px KM'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('เสียงจากลูกค้าจริง', x - w / 2 + 62, top + 54);
  const shown = Math.floor(prog(t, .35, d * .62) * sc.quote.length); let left = shown;
  c.fillStyle = INK; c.font = '54px KB';
  ls.forEach((l, i) => { const take = Math.min(left, l.length + 1); left -= take; c.fillText(take >= l.length ? l : l.slice(0, take), x - w / 2 + 62, top + 112 + i * 78); });
  c.restore();
}
function stamp(sc, t, d) {
  const end = drawScene(sc.quoteBg || 'dining', 6 + t, .006); sc.quotePose(fx, t + 5, d); end();
  c.fillStyle = '#000000b8'; c.fillRect(0, 0, W, H);
  const k = prog(t, .05, .24), s = lerp(2.4, 1, eo(k));
  c.save(); c.globalAlpha = k; c.translate(W / 2, 450); c.rotate(-.05); c.scale(s, s);
  c.strokeStyle = RED; c.lineWidth = 12; rr(c, -660, -112, 1320, 224, 26); c.stroke(); c.fillStyle = '#fff'; c.font = '84px KB'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('เกิดขึ้นจริงเดือนที่แล้ว', 0, 2); c.restore();
}
function question(sc, t, d) {
  c.fillStyle = '#f7f1ea'; c.fillRect(0, 0, W, H);
  c.fillStyle = RED; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, 170); c.lineTo(0, 240); c.fill();
  c.fillStyle = '#fff'; c.font = '66px KB'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ถ้าน้องเป็นแบบไหน เราจะสั่งงานอย่างไร?', W / 2, 106);
  ANIM.forEach(([a, th], i) => {
    const k = back(prog(t, .3 + i * .55, .45)), x = 280 + i * 453, y = 800;
    if (k <= 0) return; c.save(); c.translate(x, y); c.scale(k, k);
    sprite(c, a, 0, 0 + Math.sin(t * 3 + i) * 9, 430, { rot: Math.sin(t * 2.2 + i) * .03 }); c.restore();
    c.save(); c.globalAlpha = cl(k); label(c, th, x, 860, 50, '#fff', i % 2 ? INK : RED); c.restore();
  });
}
const quietSub = (s) => s;

async function render(sc) {
  const beats = [
    { kind: 'title', say: `สถานการณ์ที่ ${sc.n}. ${sc.title}`, sub: '', pad: .7, sfx: [[0, 'whoosh'], [.15, 'stamp'], [.45, 'pop']] },
    ...sc.beats.map(b => ({ kind: 'scene', pad: .55, ...b })),
    { kind: 'quote', say: sc.quote, sub: '', pad: .7, rate: 158, sfx: [[0, 'whoosh'], [.08, 'pop']] },
    { kind: 'stamp', say: 'เรื่องนี้ เกิดขึ้นจริง เดือนที่แล้ว', sub: '', pad: .55, sfx: [[.2, 'stamp']] },
    { kind: 'q', say: 'ถ้าน้องที่ต้องไปจัดการเป็น กระทิง. อินทรี. หนู. หมี. เราจะสั่งงานอย่างไร?', sub: 'ถ้าน้องที่ต้องไปจัดการเป็น กระทิง / อินทรี / หนู / หมี เราจะสั่งงานอย่างไร?', pad: 1, sfx: [[0, 'whoosh'], [.3, 'pop'], [.85, 'pop'], [1.4, 'pop'], [1.95, 'pop'], [2.5, 'sparkle']] },
  ];
  let T = 0; const lead = .22;
  for (const b of beats) { b.v = voice(b.say, b.rate || 172); b.t0 = T; b.d = Math.max(b.min || 0, lead + b.v.length / SR + b.pad); T += b.d; }
  const mix = new Mix(T);
  for (const b of beats) {
    mix.add(b.t0 + lead, b.v, .95, 0, true);
    for (const [t, n, g] of b.sfx || []) mix.add(b.t0 + t, SFX[n](), g ?? .8, (Math.random() - .5) * .25);
    if (b.kind === 'scene' && b.cut !== false) mix.add(b.t0, SFX.whoosh(), .35);
  }
  mix.music(bgm(sc.n, T));
  const wav = `/tmp/claude-503/mv/a${sc.n}.f32`; mix.write(wav);
  const frames = Math.ceil(T * FPS), file = `${OUT}/s${sc.n}.mp4`;
  const enc = STILLS ? null : encoder(file, wav);
  const stills = new Set(beats.flatMap(b => [b.t0 + b.d * .5, b.t0 + b.d * .92].map(x => Math.round(x * FPS))));
  const t0w = Date.now();
  for (let f = 0; f < frames; f++) {
    const t = f / FPS, b = beats.find(x => t < x.t0 + x.d) || beats.at(-1), lt = t - b.t0;
    if (STILLS && !stills.has(f)) continue;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    if (b.kind === 'title') titleCard(sc, lt, b.d);
    if (b.kind === 'scene') { const end = drawScene(b.bg || sc.bg, lt, b.zoom ?? .012, b.focus); b.draw(fx, lt, b.d); end(); if (b.over) b.over(fx, lt, b.d); subtitle(b.sub ?? b.say, eo(prog(lt, .05, .25))); }
    if (b.kind === 'quote') quote(sc, lt, b.d);
    if (b.kind === 'stamp') stamp(sc, lt, b.d);
    if (b.kind === 'q') { question(sc, lt, b.d); subtitle(b.sub, eo(prog(lt, .1, .3))); }
    if (b.kind !== 'title' && b.cut !== false) wipe(prog(lt, -.01, .34));
    if (t > T - .4) { c.fillStyle = `rgba(0,0,0,${prog(t, T - .4, .4)})`; c.fillRect(0, 0, W, H); }
    if (STILLS) { fs.writeFileSync(`/tmp/claude-503/mv/still_${sc.n}_${String(f).padStart(5, '0')}.jpg`, await cv.encode('jpeg', 72)); continue; }
    const px = cv.data();
    if (!enc.stdin.write(px)) await new Promise(r => enc.stdin.once('drain', r));
  }
  if (enc) { enc.stdin.end(); await new Promise(r => enc.on('close', r)); }
  console.log(`s${sc.n} ${T.toFixed(1)}s ${frames}f in ${((Date.now() - t0w) / 1000).toFixed(0)}s`, STILLS ? 'stills' : (fs.statSync(file).size / 1048576).toFixed(1) + ' MB');
}
for (const n of list) await render(SCENES.find(s => s.n === n));
