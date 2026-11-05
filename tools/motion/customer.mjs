// Original flat-vector customers drawn in code, one look per clip. All sizes are percent of body height.
export const LOOKS = {
  m1: { g: 'm', hair: 'short', hc: '#17120f', skin: '#f6ab8c', top: 'tee', c1: '#9aa3ad', c2: '#6c747d', pants: '#33363b', cuff: '#50545a', shoe: '#ea6a2a' },
  f1: { g: 'f', hair: 'long', hc: '#2a1a14', skin: '#f8b596', top: 'blouse', c1: '#f2c230', c2: '#d2a31c', pants: '#2f4a6b', cuff: '#3f5e85', shoe: '#f4f0ea' },
  m2: { g: 'm', hair: 'spiky', hc: '#2a1d18', skin: '#f3a585', top: 'jacket', c1: '#ee5a24', c2: '#c9451a', inner: '#ffcb1f', pants: '#2c2f36', cuff: '#7c8591', shoe: '#ea6a2a' },
  f2: { g: 'f', hair: 'bob', hc: '#3b241a', skin: '#f6ae8e', top: 'blouse', c1: '#2aa198', c2: '#1d7d76', skirt: '#3d3a46', shoe: '#8f3b2e' },
  m3: { g: 'm', hair: 'side', hc: '#1c1613', skin: '#eb9c7b', top: 'polo', c1: '#2f4f8f', c2: '#22396a', pants: '#b89f7c', cuff: '#a08868', shoe: '#59443a', glasses: true },
  f3: { g: 'f', hair: 'pony', hc: '#1d1512', skin: '#f8b89a', top: 'tee', c1: '#8a63c7', c2: '#6c49a3', pants: '#34323c', cuff: '#4b4856', shoe: '#ffffff' },
  f4: { g: 'f', hair: 'long', hc: '#6b4029', skin: '#f9bb9e', top: 'jacket', c1: '#5f86b8', c2: '#466a98', inner: '#fbf7ef', pants: '#3a3f4c', cuff: '#53596a', shoe: '#b0352d' },
  m4: { g: 'm', hair: 'side', hc: '#8d9196', skin: '#eea283', top: 'shirt', c1: '#3f8b63', c2: '#2d6b4a', pants: '#3a3a3d', cuff: '#515155', shoe: '#2c2622', beard: true },
  f5: { g: 'f', hair: 'bob', hc: '#141110', skin: '#eda684', top: 'shirt', c1: '#ef86a4', c2: '#cf6484', skirt: '#f0e6d8', shoe: '#44352e' },
  m5: { g: 'm', hair: 'spiky', hc: '#0f0d0c', skin: '#d98e6b', top: 'stripe', c1: '#f5f1e9', c2: '#d7141a', pants: '#3b4f6e', cuff: '#50688c', shoe: '#ffffff' },
};
const INK = '#1a1412';
const st = { t: 0, tl: null, talk: 0, raise: null, seated: false };
export function setCustomerState(s) { Object.assign(st, { t: 0, tl: null, talk: 0, raise: null }, s); }
const moodAt = (tl, t) => { if (!tl) return 'neutral'; if (typeof tl === 'string') return tl; let m = tl[0][1]; for (const [a, v] of tl) if (t >= a) m = v; return m; };
function lastChange(tl, t) { if (!Array.isArray(tl)) return -9; let a = -9; for (const [x] of tl) if (t >= x) a = x; return a; }
const lerpP = (a, b, k) => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * k, p[1] + (b[i][1] - p[1]) * k]);
const eio = x => x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;

function line(c, pts, w, col, cap = 'round') { c.strokeStyle = col; c.lineWidth = w; c.lineCap = cap; c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
const dot = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };

function armPose(pose, s, S, W, wave) { // s is -1 screen left, 1 screen right; points shoulder, elbow, wrist
  const sh = [s * (S - 2.3), -71];
  if (pose === 'table') return [sh, [s * (S + 2.2), -60], [s * (S - 2.6), -56.6]];
  if (pose === 'raise') return [sh, [s * (S + 6.2), -71 + wave * .2], [s * (S + 8 + wave * .5), -84]];
  if (pose === 'hip') return [sh, [s * (S + 6), -60], [s * (W + 1.4), -51]];
  if (pose === 'cross') return [sh, [s * (S + 1.6), -60.5], [-s * 4.6, s < 0 ? -62.5 : -60.2]];
  return [sh, [s * (S + 2), -60], [s * (S + 2.6), -48.5]];
}
function hand(c, x, y, skin, open, ang = 0) {
  c.save(); c.translate(x, y); c.rotate(ang);
  if (open) { c.strokeStyle = skin; c.lineCap = 'round'; c.lineWidth = 1.05; for (const [a, l] of [[-.62, 3.6], [-.2, 4.4], [.2, 4.5], [.6, 3.8]]) { c.beginPath(); c.moveTo(Math.sin(a) * 1.6, -Math.cos(a) * 1.4); c.lineTo(Math.sin(a) * (1.6 + l), -Math.cos(a) * (1.4 + l)); c.stroke(); } c.lineWidth = 1.05; c.beginPath(); c.moveTo(1.4, .4); c.lineTo(3.8, -1); c.stroke(); dot(c, 0, 0, 2.3, skin); }
  else { c.fillStyle = skin; c.beginPath(); c.ellipse(0, .5, 2.1, 2.7, 0, 0, 7); c.fill(); c.lineWidth = .9; c.strokeStyle = skin; c.lineCap = 'round'; c.beginPath(); c.moveTo(1.5, -.8); c.lineTo(2.3, 1.2); c.stroke(); }
  c.restore();
}
function drawArm(c, L, p, s, raised) {
  const longSleeve = ['jacket', 'shirt'].includes(L.top), [a, b, d] = p;
  const mid = [a[0] + (b[0] - a[0]) * .62, a[1] + (b[1] - a[1]) * .62];
  if (longSleeve) { line(c, [a, b], 5.8, L.c1); line(c, [b, d], 5.4, L.c1); line(c, [[d[0] - (d[0] - b[0]) * .08, d[1] - (d[1] - b[1]) * .08], d], 5.5, L.c2, 'butt'); }
  else { line(c, [b, d], 4.6, L.skin); line(c, [a, b], 4.9, L.skin); const sleeve = L.top === 'stripe' ? L.c1 : L.c1; line(c, [a, mid], 5.9, sleeve); if (L.top !== 'stripe') line(c, [[mid[0] - (mid[0] - a[0]) * .12, mid[1] - (mid[1] - a[1]) * .12], mid], 6, L.c2, 'butt'); }
  const dx = d[0] - b[0], dy = d[1] - b[1], n = Math.hypot(dx, dy) || 1, hx = d[0] + dx / n * 2.1, hy = d[1] + dy / n * 2.1;
  hand(c, hx, hy, L.skin, raised, Math.atan2(dy, dx) + Math.PI / 2);
}
function mouth(c, mood, talkAmt, lip) {
  const y = -82.7; c.lineCap = 'round';
  if (talkAmt > .05) { const o = .7 + talkAmt * 1.5; c.fillStyle = '#7a2320'; c.beginPath(); c.ellipse(0, y + .1, 1.7, o, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillRect(-1.2, y + .1 - o + .05, 2.4, .5); return; }
  c.strokeStyle = lip; c.lineWidth = .62; c.beginPath();
  if (mood === 'happy') { c.moveTo(-2.3, y - .4); c.quadraticCurveTo(0, y + 1.8, 2.3, y - .4); c.stroke(); return; }
  if (mood === 'neutral') { c.moveTo(-1.8, y); c.quadraticCurveTo(0, y + .8, 1.8, y); c.stroke(); return; }
  if (mood === 'annoyed') { c.moveTo(-1.9, y + .2); c.quadraticCurveTo(0, y - .2, 1.9, y - .2); c.stroke(); return; }
  if (mood === 'sad') { c.moveTo(-1.9, y + .7); c.quadraticCurveTo(0, y - .9, 1.9, y + .7); c.stroke(); return; }
  if (mood === 'angry') { c.moveTo(-2.2, y + .9); c.quadraticCurveTo(0, y - 1, 2.2, y + .9); c.stroke(); return; }
  if (mood === 'shock') { c.fillStyle = '#7a2320'; c.beginPath(); c.ellipse(0, y + .3, 1.3, 1.8, 0, 0, 7); c.fill(); }
}
function brows(c, mood, col) {
  c.strokeStyle = col; c.lineWidth = .78; c.lineCap = 'round';
  const b = { neutral: [-92, -92.4, -92], happy: [-92.4, -93, -92.4], annoyed: [-91.5, -91.3, -91.7], angry: [-92.3, -90.4, -92.5], sad: [-90.9, -92.5, -90.9], shock: [-93, -93.6, -93] }[mood] || [-92, -92.4, -92];
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 4.8, b[0]); c.quadraticCurveTo(s * 3.2, b[1] - .2, s * 1.5, b[1]); c.stroke(); }
}
function hairBack(c, L) {
  c.fillStyle = L.hc;
  if (L.hair === 'long') { c.beginPath(); c.moveTo(-8, -92); c.bezierCurveTo(-11.5, -84, -12, -74, -11, -65); c.quadraticCurveTo(-5, -62, 0, -66); c.quadraticCurveTo(5, -62, 11, -65); c.bezierCurveTo(12, -74, 11.5, -84, 8, -92); c.fill(); }
  if (L.hair === 'bob') { c.beginPath(); c.moveTo(-8, -92); c.bezierCurveTo(-11, -86, -10.8, -80, -9.2, -77.2); c.quadraticCurveTo(-5, -76.2, 0, -78); c.quadraticCurveTo(5, -76.2, 9.2, -77.2); c.bezierCurveTo(10.8, -80, 11, -86, 8, -92); c.fill(); }
  if (L.hair === 'pony') { c.beginPath(); c.moveTo(5, -96); c.bezierCurveTo(13, -97, 14, -84, 11.5, -74); c.quadraticCurveTo(8.5, -80, 7, -90); c.fill(); }
}
function hairFront(c, L) {
  c.fillStyle = L.hc; c.beginPath();
  if (L.hair === 'short') { c.moveTo(-7.7, -87.5); c.bezierCurveTo(-9.5, -99.5, 9.5, -99.5, 7.7, -87.5); c.quadraticCurveTo(7.2, -91.5, 5, -92.8); c.quadraticCurveTo(0, -94.4, -5, -92.8); c.quadraticCurveTo(-7.2, -91.5, -7.7, -87.5); c.fill(); return; }
  if (L.hair === 'spiky') { c.moveTo(-7.7, -87.5); c.lineTo(-8.8, -94); c.lineTo(-6.6, -93.8); c.lineTo(-6.8, -98); c.lineTo(-3.4, -96.6); c.lineTo(-2.2, -100.2); c.lineTo(.8, -97.2); c.lineTo(3.8, -100); c.lineTo(4.6, -96.6); c.lineTo(8.2, -97); c.lineTo(7.4, -93.6); c.lineTo(8.8, -92.4); c.lineTo(7.7, -87.5); c.quadraticCurveTo(7, -91.4, 4.2, -92.8); c.quadraticCurveTo(0, -91, -3, -93.2); c.quadraticCurveTo(-6.6, -91.8, -7.7, -87.5); c.fill(); return; }
  if (L.hair === 'side') { c.moveTo(-7.7, -87.5); c.bezierCurveTo(-9.8, -100, 10, -100, 7.7, -87.5); c.quadraticCurveTo(7.3, -90.5, 5.4, -92.4); c.quadraticCurveTo(-1.5, -91.2, -4.2, -94.4); c.quadraticCurveTo(-7, -92, -7.7, -87.5); c.fill(); return; }
  c.moveTo(-8, -85.5); c.bezierCurveTo(-10, -100, 10, -100, 8, -85.5); c.quadraticCurveTo(7.2, -91, 3.8, -93.2); c.quadraticCurveTo(1.2, -94, 0, -95); c.quadraticCurveTo(-1.2, -94, -3.8, -93.2); c.quadraticCurveTo(-7.2, -91, -8, -85.5); c.fill();
}
function torso(c, L, S, W) {
  const shape = () => { c.beginPath(); c.moveTo(-3, -76.2); c.quadraticCurveTo(-S, -75.6, -S, -71.5); c.lineTo(-W, -46); c.lineTo(W, -46); c.lineTo(S, -71.5); c.quadraticCurveTo(S, -75.6, 3, -76.2); c.closePath(); };
  c.fillStyle = L.c1; shape(); c.fill();
  c.save(); shape(); c.clip();
  if (L.top === 'stripe') { c.fillStyle = L.c2; for (let y = -72; y < -46; y += 4.6) c.fillRect(-20, y, 40, 1.6); }
  c.fillStyle = '#0000000f'; c.beginPath(); c.moveTo(S * .34, -78); c.lineTo(20, -78); c.lineTo(20, -44); c.lineTo(W * .46, -44); c.fill();
  if (L.top === 'jacket') { c.fillStyle = L.inner; c.fillRect(-3, -77, 6, 32); c.fillStyle = L.c2; for (const s of [-1, 1]) { c.fillRect(s * 3 - .28, -77, .56, 32); c.strokeStyle = L.c2; c.lineWidth = .4; c.strokeRect(s * (W * .62) - 2.4, -66, 4.8, 5); } }
  if (L.top === 'shirt' || L.top === 'polo') { c.fillStyle = L.c2; c.fillRect(-.24, -75, .48, L.top === 'polo' ? 8 : 30); for (let y = -71; y < (L.top === 'polo' ? -67 : -47); y += 5) dot(c, 0, y, .36, L.c2); }
  c.restore();
  if (L.top === 'jacket' || L.top === 'shirt' || L.top === 'polo') { c.fillStyle = L.top === 'jacket' ? L.c2 : L.c2; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * .4, -74); c.lineTo(s * 3.6, -77.2); c.lineTo(s * 5.4, -74.8); c.lineTo(s * 2.4, -71.4); c.fill(); } }
  else { c.strokeStyle = L.c2; c.lineWidth = .95; c.beginPath(); c.moveTo(-3.3, -76.2); c.quadraticCurveTo(0, -73, 3.3, -76.2); c.stroke(); }
}
function legs(c, L, t, walk, W) {
  const lift = s => walk ? Math.max(0, Math.sin(t * 7 * s)) * 3 : 0, foot = (x, y, s) => {
    c.fillStyle = L.shoe; c.beginPath(); c.moveTo(x - 3.2, y - 3); c.quadraticCurveTo(x, y - 4.7, x + 3.2, y - 3); c.quadraticCurveTo(x + 5.2 * (s > 0 ? 1 : .7), y - 1.3, x + 4.8 * (s > 0 ? 1 : .6), y - .4); c.lineTo(x - 4.8 * (s < 0 ? 1 : .6), y - .4); c.quadraticCurveTo(x - 5.2 * (s < 0 ? 1 : .7), y - 1.3, x - 3.2, y - 3); c.fill();
    c.fillStyle = L.shoe === '#ffffff' || L.shoe === '#f4f0ea' ? '#c9c4bc' : '#f4f0ea'; c.fillRect(x - 4.7 * (s < 0 ? 1 : .62), y - .9, 4.7 * (s < 0 ? 1 : .62) + 4.7 * (s > 0 ? 1 : .62), .9);
  };
  for (const s of [-1, 1]) {
    const x = s * (L.g === 'f' ? 3.5 : 4.1), y = -lift(s);
    if (L.skirt) { line(c, [[x, -30], [x, y - 3]], 3.9, L.skin); }
    else { line(c, [[x * .92, -47], [x * 1.04, y - 7]], L.g === 'f' ? 6.2 : 7, L.pants, 'butt'); c.fillStyle = L.cuff; c.fillRect(x * 1.04 - (L.g === 'f' ? 3.2 : 3.6), y - 8.5, L.g === 'f' ? 6.4 : 7.2, 2.2); c.fillStyle = '#e4dfd6'; c.fillRect(x * 1.04 - 2.1, y - 6.3, 4.2, 3); }
    foot(x * 1.08, y, s);
  }
  if (L.skirt) { c.fillStyle = L.skirt; c.beginPath(); c.moveTo(-W, -48); c.lineTo(W, -48); c.lineTo(W + 2.8, -27); c.lineTo(-W - 2.8, -27); c.fill(); }
  else { c.fillStyle = L.pants; c.beginPath(); c.moveTo(-W, -48); c.lineTo(W, -48); const o2 = L.g === 'f' ? 6.7 : 7.8; c.lineTo(o2, -35); c.lineTo(-o2, -35); c.fill(); }
}
export function drawCustomer(c, name, x, y, h, o = {}) {
  const L = LOOKS[name], u = h / 100, t = st.t, tl = o.mood ?? st.tl, mood = moodAt(tl, t), side = L.g === 'f';
  const S = side ? 10.2 : 11.8, W = side ? 8.1 : 9.2;
  const seatedNow = !!o.seated, raiseOn = !o.mood && st.raise && t >= st.raise[0] && t <= st.raise[1], wave = Math.sin(t * 9) * 3;
  const poseFor = m => seatedNow ? (m === 'angry' ? 'cross' : 'table') : (m === 'angry' ? 'hip' : 'down');
  const change = lastChange(tl, t), k = eio(Math.min(1, Math.max(0, (t - change) / .22)));
  const prevMood = Array.isArray(tl) ? moodAt(tl, change - .001) : mood;
  const pts = s => { const to = raiseOn && s < 0 ? 'raise' : poseFor(mood), from = poseFor(prevMood); return lerpP(armPose(from, s, S, W, wave), armPose(to, s, S, W, wave), k); };
  c.save(); c.globalAlpha *= o.a ?? 1; c.translate(x, y + (o.dy || 0)); if (o.rot) c.rotate(o.rot); c.scale((o.flip ? -1 : 1) * u, u);
  const headTurn = mood === 'angry' ? Math.sin(t * 7) * .012 : mood === 'annoyed' ? -.025 : 0;
  hairBackGroup: { c.save(); c.translate(0, -80); c.rotate(headTurn); c.translate(0, 80); hairBack(c, L); c.restore(); }
  if (!seatedNow) legs(c, L, t, o.walk, W);
  const pR = pts(1), pL = pts(-1), crossing = mood === 'angry' && seatedNow;
  if (!crossing) { drawArm(c, L, pL, -1, raiseOn); drawArm(c, L, pR, 1, false); }
  c.fillStyle = L.skin; c.fillRect(-2.5, -81, 5, 6.2); c.fillStyle = '#00000022'; c.beginPath(); c.moveTo(-2.5, -79.6); c.quadraticCurveTo(0, -76.6, 2.5, -79.6); c.lineTo(2.5, -77.8); c.quadraticCurveTo(0, -74.8, -2.5, -77.8); c.fill();
  torso(c, L, S, W);
  if (crossing) { drawArm(c, L, pL, -1, false); drawArm(c, L, pR, 1, false); }
  c.save(); c.translate(0, -80); c.rotate(headTurn); c.translate(0, 80);
  for (const s of [-1, 1]) dot(c, s * 7.3, -86.6, 1.45, L.skin);
  c.fillStyle = L.skin; c.beginPath(); c.moveTo(-7.4, -90); c.bezierCurveTo(-7.8, -96, 7.8, -96, 7.4, -90); c.bezierCurveTo(7.6, -83, 4.4, -79, 0, -79); c.bezierCurveTo(-4.4, -79, -7.6, -83, -7.4, -90); c.fill();
  if (L.beard) { c.fillStyle = L.hc; c.globalAlpha *= .85; c.beginPath(); c.moveTo(-7, -85.5); c.bezierCurveTo(-5.5, -80.6, -3, -79, 0, -79); c.bezierCurveTo(3, -79, 5.5, -80.6, 7, -85.5); c.quadraticCurveTo(3.5, -83.8, 0, -84.4); c.quadraticCurveTo(-3.5, -83.8, -7, -85.5); c.fill(); c.globalAlpha /= .85; }
  brows(c, mood, L.hair === 'side' && L.beard ? '#6a6d72' : INK);
  const blink = ((t + name.charCodeAt(1) * .7) % 3.4) < .11, er = mood === 'shock' ? 1.15 : .92;
  for (const s of [-1, 1]) { if (blink) line(c, [[s * 3.9, -88.2], [s * 2.1, -88.2]], .55, INK); else dot(c, s * 3, -88.2, er, INK); if (side && !blink) line(c, [[s * 3.8, -88.7], [s * 4.7, -89.1]], .34, INK); }
  line(c, [[.1, -87], [.65, -85.2], [-.1, -85]], .42, '#00000040');
  if (mood === 'angry') for (const s of [-1, 1]) dot(c, s * 4.8, -85, 1.1, '#e4574a55');
  if (side) for (const s of [-1, 1]) dot(c, s * 4.6, -85.2, .95, '#ef766a40');
  mouth(c, mood, o.mood ? 0 : st.talk, side ? '#b5413c' : '#7b3a2c');
  hairFront(c, L);
  if (L.glasses) { c.strokeStyle = INK; c.lineWidth = .42; for (const s of [-1, 1]) { c.beginPath(); c.roundRect(s * 3 - 2.1, -89.8, 4.2, 3.2, .8); c.stroke(); } c.beginPath(); c.moveTo(-.9, -88.4); c.lineTo(.9, -88.4); c.stroke(); }
  c.restore(); c.restore();
}
