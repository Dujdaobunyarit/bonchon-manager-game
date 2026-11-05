// Drawing and audio toolkit for the game 2 scenario motions.
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { execFileSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export const R = decodeURIComponent(new URL('../..', import.meta.url).pathname);
export const W = 1920, H = 1080, FPS = 30, SR = 44100;
const F = R + 'node_modules/@expo-google-fonts/kanit/';
GlobalFonts.registerFromPath(F + 'Kanit_500Medium.ttf', 'KM');
GlobalFonts.registerFromPath(F + 'Kanit_700Bold.ttf', 'KB');
GlobalFonts.registerFromPath(F + 'Kanit_800ExtraBold_Italic.ttf', 'KI');
export const RED = '#d7141a', INK = '#141414', GOLD = '#ffc42e';

// ---------- easing ----------
export const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const prog = (t, t0, d) => cl((t - t0) / d);
export const eo = x => 1 - (1 - x) ** 3;
export const eio = x => x < .5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
export const back = x => { const c = 1.7; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
export const lerp = (a, b, x) => a + (b - a) * x;

// ---------- assets ----------
const IMG = {};
export async function loadAll() {
  for (const f of fs.readdirSync(R + 'private/motion/sprites')) if (f.endsWith('.png')) IMG[f.slice(0, -4)] = await loadImage(R + 'private/motion/sprites/' + f);
  for (const a of ['bull', 'eagle', 'rat', 'bear']) IMG[a] = await loadImage(R + 'img/' + a + '.png');
}
export function sprite(c, name, x, y, h, o = {}) {
  const m = IMG[name]; const s = h / m.height, w = m.width * s;
  c.save(); c.globalAlpha *= o.a ?? 1; c.translate(x, y + (o.dy || 0));
  if (o.rot) c.rotate(o.rot);
  c.scale((o.flip ? -1 : 1) * (o.sx ?? 1), o.sy ?? 1);
  c.drawImage(m, -w / 2, -h, w, h); c.restore();
}
export const bob = (t, sp = 2, a = 5, ph = 0) => Math.sin(t * sp * 2 + ph) * a;
export function seated(c, name, x, tableY, h, t, o = {}) {
  c.save(); c.beginPath(); c.rect(x - 400, 0, 800, tableY + 6); c.clip();
  sprite(c, name, x, tableY + h * .55, h, { ...o, dy: bob(t, 1, 3) }); c.restore();
}
export function chairBack(c, x, y) {
  c.fillStyle = '#c41116'; rr(c, x - 78, y - 188, 156, 200, 26); c.fill();
  c.fillStyle = '#e8262b'; rr(c, x - 62, y - 174, 124, 80, 18); c.fill();
}
export function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
export function table(c, x, y, w = 430) {
  c.fillStyle = '#0003'; c.beginPath(); c.ellipse(x, y + 268, w * .4, 18, 0, 0, 7); c.fill();
  c.fillStyle = '#1a1a1a'; c.fillRect(x - 15, y + 22, 30, 240); rr(c, x - 90, y + 256, 180, 14, 7); c.fill();
  c.fillStyle = '#f5ecdf'; rr(c, x - w / 2, y - 6, w, 26, 8); c.fill();
  c.fillStyle = '#cbbda9'; c.fillRect(x - w / 2 + 6, y + 15, w - 12, 7);
}
export function plate(c, x, y, s = 1, kind = 'chicken', a = 1) {
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 0, 78, 20, 0, 0, 7); c.fill();
  c.strokeStyle = '#d9d0c4'; c.lineWidth = 2; c.stroke();
  if (kind === 'chicken') for (const [dx, dy, r] of [[-30, -14, 22], [0, -22, 24], [30, -14, 22], [-14, -36, 18], [16, -38, 18]]) {
    c.fillStyle = '#a4481a'; c.beginPath(); c.ellipse(dx, dy, r, r * .78, .4, 0, 7); c.fill();
    c.fillStyle = '#c96a24'; c.beginPath(); c.ellipse(dx - 4, dy - 5, r * .42, r * .28, .4, 0, 7); c.fill();
  }
  if (kind === 'bones') for (const [dx, dy, ro] of [[-24, -6, .3], [8, -8, -.5], [28, -4, .8]]) { c.save(); c.translate(dx, dy); c.rotate(ro); c.fillStyle = '#eadfca'; rr(c, -15, -3, 30, 6, 3); c.fill(); c.restore(); }
  c.restore();
}
export function glass(c, x, y, level = 0, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (level > 0) { const h = 86 * level; c.fillStyle = '#4a2413'; c.beginPath(); c.moveTo(-23, -h - 2); c.lineTo(23, -h - 2); c.lineTo(19, -2); c.lineTo(-19, -2); c.fill(); c.fillStyle = '#d9b48a'; c.fillRect(-23, -h - 5, 46, 4); }
  c.strokeStyle = '#ffffffcc'; c.lineWidth = 4; c.beginPath(); c.moveTo(-27, -92); c.lineTo(-20, 0); c.lineTo(20, 0); c.lineTo(27, -92); c.stroke();
  c.strokeStyle = RED; c.lineWidth = 5; c.beginPath(); c.moveTo(6, -92); c.lineTo(20, -128); c.stroke();
  c.restore();
}
export function sauce(c, x, y, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = '#b30f14'; rr(c, -18, -72, 36, 72, 7); c.fill();
  c.fillStyle = '#141414'; rr(c, -11, -95, 22, 24, 4); c.fill();
  c.fillStyle = '#fff'; c.font = '12px KB'; c.textAlign = 'center'; c.fillText('SAUCE', 0, -32); c.restore();
}
export function pad(c, x, y, s = 1) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#fff'; rr(c, -30, -42, 60, 84, 5); c.fill(); c.fillStyle = '#141414'; c.fillRect(-30, -42, 60, 12); c.fillStyle = '#999'; for (let i = 0; i < 4; i++) c.fillRect(-20, -18 + i * 13, 40, 4); c.restore(); }
export function clock(c, x, y, r, frac, label, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = r * .1; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#d7141a44'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r * .9, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); c.fill();
  c.strokeStyle = RED; c.lineWidth = r * .07; c.lineCap = 'round'; const a = frac * Math.PI * 2 - Math.PI / 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * .72, Math.sin(a) * r * .72); c.stroke();
  c.strokeStyle = INK; const b = a * 12; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(b) * r * .82, Math.sin(b) * r * .82); c.lineWidth = r * .03; c.stroke();
  if (label) { c.fillStyle = RED; c.font = `${r * .62}px KB`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineWidth = 8; c.strokeStyle = '#fff'; c.strokeText(label, 0, r + r * .76); c.fillText(label, 0, r + r * .76); }
  c.restore();
}
export function bubble(c, x, y, w, h, text, o = {}) {
  const sc = o.s ?? 1; c.save(); c.translate(x, y); c.scale(sc, sc);
  c.fillStyle = o.bg || '#fff'; c.strokeStyle = o.stroke || INK; c.lineWidth = 5;
  rr(c, -w / 2, -h, w, h, 28); c.fill(); c.stroke();
  const tx = o.tail ?? 0; c.beginPath(); c.moveTo(tx - 22, -3); c.lineTo(tx + (o.tailDx ?? 8), 40); c.lineTo(tx + 22, -3); c.closePath(); c.fill(); c.beginPath(); c.moveTo(tx - 22, -1); c.lineTo(tx + (o.tailDx ?? 8), 40); c.lineTo(tx + 22, -1); c.stroke();
  c.fillStyle = o.bg || '#fff'; c.fillRect(tx - 19, -7, 38, 8);
  if (text) { c.fillStyle = o.color || INK; c.font = `${o.size || 44}px KB`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, -h / 2 + 2); }
  c.restore();
}
export function emote(c, kind, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (kind === 'angry') { c.strokeStyle = RED; c.lineWidth = 9; c.lineCap = 'round'; for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.beginPath(); c.moveTo(a * 8, b * 28); c.quadraticCurveTo(a * 9, b * 9, a * 28, b * 8); c.stroke(); } }
  if (kind === '!') { c.fillStyle = RED; c.font = '110px KB'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 9; c.strokeStyle = '#fff'; c.strokeText('!', 0, 0); c.fillText('!', 0, 0); }
  if (kind === '?') { c.fillStyle = RED; c.font = '100px KB'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 9; c.strokeStyle = '#fff'; c.strokeText('?', 0, 0); c.fillText('?', 0, 0); }
  if (kind === '...') { c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 4; rr(c, -62, -36, 124, 72, 34); c.fill(); c.stroke(); c.fillStyle = INK; for (const d of [-26, 0, 26]) { c.beginPath(); c.arc(d, 0, 8, 0, 7); c.fill(); } }
  if (kind === 'x') { c.strokeStyle = RED; c.lineWidth = 26; c.lineCap = 'round'; c.beginPath(); c.moveTo(-42, -42); c.lineTo(42, 42); c.moveTo(42, -42); c.lineTo(-42, 42); c.stroke(); }
  if (kind === 'check') { c.strokeStyle = '#12a150'; c.lineWidth = 22; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-36, 2); c.lineTo(-10, 30); c.lineTo(40, -32); c.stroke(); }
  c.restore();
}
export function burst(c, x, y, x01, color = GOLD) {
  if (x01 <= 0 || x01 >= 1) return; c.save(); c.translate(x, y); c.strokeStyle = color; c.lineWidth = 12 * (1 - x01) + 2; c.lineCap = 'round';
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r0 = 30 + 90 * x01, r1 = r0 + 60 * (1 - x01); c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); }
  c.restore();
}
export function label(c, text, x, y, size = 56, color = '#fff', bg = RED) {
  c.save(); c.font = `${size}px KB`; c.textAlign = 'center'; c.textBaseline = 'middle'; const w = c.measureText(text).width + size;
  c.fillStyle = bg; rr(c, x - w / 2, y - size * .8, w, size * 1.6, 14); c.fill(); c.fillStyle = color; c.fillText(text, x, y + 2); c.restore();
}
const seg = new Intl.Segmenter('th', { granularity: 'word' });
export function wrap(c, text, maxW) {
  const out = []; let cur = '';
  for (const { segment } of seg.segment(text)) {
    if (segment === '\n') { out.push(cur); cur = ''; continue; }
    if (c.measureText(cur + segment).width > maxW && cur.trim()) { out.push(cur.trim()); cur = segment.trimStart(); } else cur += segment;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// ---------- backgrounds ----------
function wallArt(c, x, y) {
  c.fillStyle = '#111'; c.fillRect(x, y, 150, 200); c.fillStyle = RED; c.fillRect(x + 12, y + 12, 126, 176);
  c.fillStyle = '#a4481a'; c.beginPath(); c.ellipse(x + 75, y + 96, 44, 30, .4, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillRect(x + 28, y + 148, 94, 10); c.fillRect(x + 40, y + 164, 70, 8);
}
function lamp(c, x, h = 120) { c.strokeStyle = '#222'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); c.fillStyle = '#1b1b1b'; c.beginPath(); c.moveTo(x - 74, h + 58); c.quadraticCurveTo(x, h - 42, x + 74, h + 58); c.fill(); c.fillStyle = '#fff3b0'; c.beginPath(); c.ellipse(x, h + 58, 58, 11, 0, 0, 7); c.fill(); }
function floor(c, y = 790) { const g = c.createLinearGradient(0, y, 0, H); g.addColorStop(0, '#d8c8b2'); g.addColorStop(1, '#a89680'); c.fillStyle = g; c.fillRect(0, y, W, H - y); c.strokeStyle = '#0000001c'; c.lineWidth = 2; for (let i = -6; i < 16; i++) { c.beginPath(); c.moveTo(W / 2 + (i - 5) * 120, y); c.lineTo(W / 2 + (i - 5) * 260, H); c.stroke(); } c.fillStyle = '#111'; c.fillRect(0, y - 8, W, 10); }
export function bgDining() {
  const cv = createCanvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#f2eee8'; c.fillRect(0, 0, W, H);
  c.fillStyle = INK; c.fillRect(0, 440, W, 360); c.fillStyle = RED; c.fillRect(0, 420, W, 28);
  c.strokeStyle = '#2d2d2d'; c.lineWidth = 3; for (let x = 0; x < W; x += 26) { c.beginPath(); c.moveTo(x, 450); c.lineTo(x, 790); c.stroke(); }
  for (const x of [120, 300, 480]) wallArt(c, x, 170);
  c.fillStyle = INK; c.fillRect(1220, 110, 620, 300); c.strokeStyle = RED; c.lineWidth = 9; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(1420, 260); c.quadraticCurveTo(1470, 150, 1560, 170); c.quadraticCurveTo(1640, 190, 1590, 280); c.quadraticCurveTo(1500, 360, 1420, 260); c.stroke();
  c.fillStyle = '#fff'; c.font = '34px KB'; c.textAlign = 'left'; c.fillText('Love at', 1640, 300); c.fillText('first bite', 1640, 342);
  floor(c); lamp(c, 760); lamp(c, 1080); return cv;
}
export function bgCounter() {
  const cv = createCanvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#eee9e1'; c.fillRect(0, 0, W, H); c.fillStyle = INK; c.fillRect(0, 0, W, 90); c.fillStyle = RED; c.fillRect(0, 90, W, 18);
  c.strokeStyle = RED; c.lineWidth = 10; c.strokeRect(330, 150, 1260, 280); c.lineWidth = 4;
  for (let x = 330; x <= 1590; x += 210) { c.beginPath(); c.moveTo(x, 150); c.lineTo(x, 430); c.stroke(); }
  c.fillStyle = '#d8d3cb'; c.fillRect(335, 155, 1250, 270); c.fillStyle = '#aaa59c'; c.fillRect(335, 300, 1250, 10);
  for (let i = 0; i < 12; i++) { c.fillStyle = ['#b30f14', '#f5ecdf', '#6b6b6b'][i % 3]; rr(c, 380 + i * 98, 240, 60, 60, 8); c.fill(); }
  floor(c, 800);
  c.fillStyle = '#141414'; c.fillRect(160, 540, 1600, 280); c.fillStyle = RED; c.fillRect(160, 640, 1600, 90); c.fillStyle = '#d9d4cc'; rr(c, 130, 516, 1660, 34, 8); c.fill();
  c.fillStyle = '#fff'; c.font = '44px KB'; c.textAlign = 'center'; c.fillText('Bonchon', 960, 700); lamp(c, 480, 40); lamp(c, 1440, 40); return cv;
}
export function bgStore() {
  const cv = createCanvas(W, H), c = cv.getContext('2d'); c.drawImage(IMG.store, 0, (H - W * IMG.store.height / IMG.store.width) / 2, W, W * IMG.store.height / IMG.store.width); return cv;
}

// ---------- audio ----------
const secs = s => Math.ceil(s * SR);
export class Mix {
  constructor(dur) { this.n = secs(dur); this.L = new Float32Array(this.n); this.Rr = new Float32Array(this.n); this.vox = new Float32Array(this.n); }
  add(t, buf, g = 1, pan = 0, vox = false) { const s = secs(t), gl = g * (1 - Math.max(0, pan)), gr = g * (1 + Math.min(0, pan)); for (let i = 0; i < buf.length && s + i < this.n; i++) { this.L[s + i] += buf[i] * gl; this.Rr[s + i] += buf[i] * gr; if (vox) this.vox[s + i] = 1; } }
  music(buf) { // ducks under the voice
    let d = 1; const look = secs(.12); const tgt = new Float32Array(this.n);
    for (let i = this.n - 1, c = 0; i >= 0; i--) { if (this.vox[i]) c = look; else if (c > 0) c--; tgt[i] = c > 0 ? 1 : 0; }
    for (let i = 0; i < this.n; i++) { const want = tgt[i] ? .3 : 1; d += (want - d) * (want < d ? .0009 : .00018); const fade = Math.min(1, (this.n - i) / secs(1.2)); const v = buf[i % buf.length] * d * fade; this.L[i] += v; this.Rr[i] += v; }
  }
  write(file) { const b = Buffer.alloc(this.n * 8); for (let i = 0; i < this.n; i++) { b.writeFloatLE(Math.tanh(this.L[i] * 1.05), i * 8); b.writeFloatLE(Math.tanh(this.Rr[i] * 1.05), i * 8 + 4); } fs.writeFileSync(file, b); }
}
const env = (i, n, a, r) => Math.min(1, i / (a * SR + 1)) * Math.min(1, (n - i) / (r * SR + 1));
function tone(d, f0, f1, type, g = 1, a = .005, r = .05) { const n = secs(d), o = new Float32Array(n); let p = 0; for (let i = 0; i < n; i++) { const f = f0 + (f1 - f0) * i / n; p += f / SR; const v = type === 'sq' ? Math.sign(Math.sin(p * 6.283)) : type === 'tri' ? 2 * Math.abs(2 * (p % 1) - 1) - 1 : Math.sin(p * 6.283); o[i] = v * g * env(i, n, a, r); } return o; }
function noise(d, cut0, cut1, g = 1, a = .01, r = .1) { const n = secs(d), o = new Float32Array(n); let lp = 0; for (let i = 0; i < n; i++) { const cut = cut0 + (cut1 - cut0) * i / n, k = 1 - Math.exp(-6.283 * cut / SR); lp += ((Math.random() * 2 - 1) - lp) * k; o[i] = lp * g * env(i, n, a, r) * (1 + 900 / (cut + 300)); } return o; }
const merge = (...b) => { const n = Math.max(...b.map(x => x[1].length + secs(x[0]))), o = new Float32Array(n); for (const [t, x] of b) { const s = secs(t); for (let i = 0; i < x.length; i++) o[s + i] += x[i]; } return o; };
export const SFX = {
  whoosh: () => noise(.42, 400, 5200, .36, .1, .22),
  pop: () => tone(.12, 340, 900, 'sin', .5, .002, .06),
  ding: () => merge([0, tone(.7, 1320, 1320, 'sin', .32, .002, .5)], [0, tone(.7, 2640, 2640, 'sin', .12, .002, .4)]),
  thud: () => merge([0, tone(.34, 130, 42, 'sin', 1, .002, .2)], [0, noise(.14, 2600, 300, .75, .001, .1)]),
  clink: () => merge([0, tone(.22, 2500, 2480, 'sin', .22, .001, .16)], [.05, tone(.18, 3400, 3380, 'sin', .15, .001, .12)]),
  tick: () => merge([0, tone(.035, 1900, 1500, 'sq', .13, .001, .02)]),
  wrong: () => merge([0, tone(.22, 196, 185, 'sq', .17)], [.2, tone(.42, 147, 139, 'sq', .17, .005, .15)]),
  right: () => merge([0, tone(.12, 880, 880, 'tri', .25)], [.11, tone(.25, 1319, 1319, 'tri', .25)]),
  stamp: () => merge([0, tone(.26, 110, 50, 'sin', .95, .002, .15)], [0, noise(.12, 3200, 500, .7, .001, .08)]),
  type: () => noise(.035, 3800, 2600, .25, .001, .02),
  door: () => merge([0, tone(.5, 1046, 1046, 'sin', .24, .002, .4)], [.2, tone(.8, 784, 784, 'sin', .24, .002, .65)]),
  pour: () => noise(1.5, 1100, 2500, .16, .15, .3),
  huh: () => tone(.32, 320, 520, 'tri', .28, .01, .1),
  sad: () => merge([0, tone(.3, 440, 415, 'tri', .22)], [.26, tone(.3, 392, 370, 'tri', .22)], [.52, tone(.55, 330, 300, 'tri', .22, .005, .3)]),
  sparkle: () => merge(...[0, .07, .14, .21].map((t, i) => [t, tone(.26, 1760 + i * 400, 1760 + i * 400, 'sin', .11, .002, .2)])),
  print: () => merge(...[0, .1, .2, .3, .4].map(t => [t, noise(.07, 2600, 1300, .24, .002, .03)])),
};
export function bgm(n, dur) { // original light loop, one key per scenario
  const bpm = 104, st = 60 / bpm / 2, steps = 64, len = secs(st * steps), o = new Float32Array(len), key = [0, 2, -2, 3, 1, -1, 4, 0, 2, -2][n - 1], nf = m => 440 * 2 ** ((m + key - 69) / 12);
  const put = (i, b) => { const s = secs(i * st); for (let j = 0; j < b.length; j++) o[(s + j) % len] += b[j]; };
  const ch = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  for (let i = 0; i < steps; i++) {
    const b = ch[Math.floor(i / 16) % 4], p = i % 8;
    if (p === 0 || p === 3 || p === 6) put(i, tone(st * 1.6, nf(b[0] - 24), nf(b[0] - 24), 'tri', .32, .005, .08));
    put(i, tone(st * .9, nf(b[[0, 2, 1, 2][i % 4]] + 12), nf(b[[0, 2, 1, 2][i % 4]] + 12), 'sin', .1, .003, .1));
    if (i % 4 === 2) put(i, noise(.05, 7000, 6000, .05, .001, .03));
    if (i % 8 === 4) put(i, noise(.1, 1800, 1200, .08, .001, .06));
    if (i % 16 === 12) put(i, tone(st * 2.6, nf(b[2] + 24), nf(b[2] + 24), 'tri', .06, .01, .2));
  }
  const amb = noise(6, 520, 520, .018, .01, .01), out = new Float32Array(secs(dur));
  for (let i = 0; i < out.length; i++) out[i] = o[i % len] * .5 + amb[i % amb.length];
  return out;
}
const TMP = '/tmp/claude-503/mv/voice'; fs.mkdirSync(TMP, { recursive: true });
export function voice(text, rate = 172) {
  const f = path.join(TMP, Buffer.from(text + rate).toString('base64url').slice(-60));
  if (!fs.existsSync(f + '.f32')) {
    execFileSync('say', ['-v', 'Kanya', '-r', String(rate), '-o', f + '.aiff', text]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f + '.aiff', '-af', 'highpass=f=90,acompressor=threshold=0.2:ratio=2.5,loudnorm=I=-15:TP=-1.5,silenceremove=start_periods=1:start_threshold=-45dB', '-f', 'f32le', '-ac', '1', '-ar', String(SR), f + '.f32']);
  }
  const b = fs.readFileSync(f + '.f32'); return new Float32Array(b.buffer, b.byteOffset, b.length / 4);
}
export function encoder(file, audio) {
  const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', audio, '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  return p;
}
export { createCanvas };
