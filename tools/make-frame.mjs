// Draws the Bonchon start frame as sharp SVG layers in img/frame/. node tools/make-frame.mjs <logo.svg>
import fs from 'fs';
const R = decodeURIComponent(new URL('..', import.meta.url).pathname), O = R + 'img/frame/'; fs.mkdirSync(O, { recursive: true });
const W = 553, H = 303;
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, rr = (a, b) => a + rnd() * (b - a);
const n1 = x => +x.toFixed(1);

// pixel grids become merged crisp rectangles
function pixels(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length)); let out = '';
  rows.forEach((r, y) => { let x = 0; while (x < r.length) { const c = r[x]; if (c === '.' || c === ' ') { x++; continue; } let e = x; while (r[e] === c) e++; out += `<rect x="${x}" y="${y}" width="${e - x}" height="1" fill="${pal[c]}"/>`; x = e; } });
  return { w, h, out };
}
const svg = (w, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" ${extra}>${body}</svg>`;
const crisp = 'shape-rendering="crispEdges"';

// grid helpers for shaded sprites
function grid(w, h) { return { w, h, c: Array.from({ length: h }, () => Array(w).fill('.')) }; }
function ring(g, col, over = '.') { const a = g.c.map(r => [...r]); for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (g.c[y][x] === over && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (g.c[y + dy]?.[x + dx] ?? '.') !== '.')) a[y][x] = col; g.c = a; }
const rows = g => g.c.map(r => r.join(''));

// chicken, redrawn cell by cell from the supplied frame
const chicken = pixels([
  '........kkkkkkk.........', '......kkrrrrrrrkk.......', '......krrrrrrrrrk.......', '......kkrRrrrRrrk.......',
  '.......kkwwwwwwkkk......', '......kkwwwwwwwwwkk.....', '.....kkwwwwwwkkwwwkkk...', '.....kwwwwwwwkkwwwyyyk..',
  '.....kwwwwwwwwwwwwyyyyk.', 'kk...kwwwwwwwwwwwrrrkk..', 'kwk..kwwwwwwwwwwwrrrrk..', 'kwwkkkwwwwwwwwwwwwkrrk..',
  'kwwwwwwwwwwwwwwwwwkkk...', '.kwwwwwwggggggwwwwwk....', 'kkwwwwgwwwwwwgwwwwwk....', 'kwwwwwgwwwwwwgwwwwk.....',
  '.kwwwwwgggggggwwwwk.....', '..kwwwwwwwwwwwwwwk......', '...kkwwwwwwwwwwkk.......', '.....kkkkkkkkkk.........',
  '.......kyyk..kyyk.......', '.......kyyk..kyyk.......', '.......kyyk..kyyk.......', '.....kkyyyk.kkyyyk......',
  '.....kyyyyyk.kyyyyyk....', '.....kkkkkkk.kkkkkkk....',
], { k: '#14090a', r: '#e3131b', R: '#a80d12', w: '#ffffff', g: '#c9c6c4', y: '#f6c417' });
fs.writeFileSync(O + 'chicken.svg', svg(chicken.w, chicken.h, chicken.out, crisp));

// drumstick
{
  const g = grid(40, 36), A = [6, 30], B = [33, 7], L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const dx = x + .5 - A[0], dy = y + .5 - A[1], t = (dx * ux + dy * uy) / L, d = -dx * uy + dy * ux;
    const hw = t < .3 ? 0 : t < .62 ? 2.6 + (t - .3) * 21 : Math.sqrt(Math.max(0, 1 - ((t - .62) / .42) ** 2)) * 9.4;
    if (t >= .3 && t <= 1.04 && Math.abs(d) <= hw) {
      const s = d / Math.max(1, hw); g.c[y][x] = s < -.55 ? 'L' : s < .25 ? 'o' : s < .68 ? 'O' : 'D';
    } else if (t > .1 && t < .34 && Math.abs(d) < 2) g.c[y][x] = d > .8 ? 'g' : 'b';
    else if (Math.hypot(dx + ux * .2 - 2.2 * uy, dy + uy * .2 + 2.2 * ux) < 2.8 || Math.hypot(dx + ux * .2 + 2.2 * uy, dy + uy * .2 - 2.2 * ux) < 2.8) g.c[y][x] = 'b';
  }
  for (const [x, y] of [[24, 12], [27, 9], [28, 10], [21, 15], [30, 8]]) g.c[y][x] = 'H';
  ring(g, 'k'); ring(g, 'w');
  const p = pixels(rows(g), { k: '#3a1109', w: '#ffffff', L: '#f8ba55', o: '#ee8e2d', O: '#d96e1e', D: '#a94a12', H: '#fff0c8', b: '#fffaf1', g: '#d9cfc2' });
  fs.writeFileSync(O + 'drum.svg', svg(p.w, p.h, p.out, crisp));
}
const rays = (pts, col, w) => pts.map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="square"/>`).join('');
fs.writeFileSync(O + 'rays-y.svg', svg(40, 30, rays([[5, 19, 17, 25], [17, 5, 23, 17]], '#f6c417', 3.4)));
fs.writeFileSync(O + 'rays-r.svg', svg(40, 30, rays([[6, 21, 17, 25], [14, 7, 20, 18], [29, 4, 28, 15]], '#ef2028', 3.2)));

// bucket with fried chicken
const logoSrc = fs.readFileSync(process.argv[2], 'utf8'), inner = logoSrc.slice(logoSrc.indexOf('>', logoSrc.indexOf('<svg')) + 1, logoSrc.lastIndexOf('</svg>'));
const logoPaint = (black, red) => inner.replace(/rgb\(0%,\s*0%,\s*0%\)|#000000|#000\b/g, black).replace(/rgb\([0-9.]+%,\s*[0-9.]+%,\s*[0-9.]+%\)/g, m => m.startsWith('rgb(100%, 100%, 100%') || m.startsWith('rgb(100%,100%,100%') ? m : red);
const LOGO_VB = '222 498 792 204';
{
  const g = grid(40, 42);
  const blob = (cx, cy, r) => { for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const dx = x + .5 - cx, dy = y + .5 - cy, a = Math.atan2(dy, dx), q = r * (1 + .13 * Math.sin(a * 5 + cx)); const d = Math.hypot(dx, dy * 1.08); if (d < q) { const s = (dx * .6 + dy * .8) / q; g.c[y][x] = s < -.48 ? 'L' : s < .1 ? 'o' : s < .5 ? 'O' : 'D'; } } ; g.c[Math.round(cy - r * .4)][Math.round(cx - r * .25)] = 'H'; g.c[Math.round(cy - r * .1)][Math.round(cx + r * .2)] = 'H'; };
  const mark = g2 => { const a = g2.c.map(r => [...r]); for (let y = 0; y < g2.h; y++) for (let x = 0; x < g2.w; x++) if ('LoOD'.includes(g2.c[y][x]) && (x + y) % 11 === 0) a[y][x] = 'O'; g2.c = a; };
  blob(14, 8, 6.4); blob(26, 8, 5.6); ring(g, 'k'); blob(8, 13.5, 5.6); blob(32, 13.5, 5.4); ring(g, 'k'); blob(20, 13.5, 5.8); ring(g, 'k'); mark(g);
  for (let y = 17; y < g.h - 1; y++) { const k = (y - 17) / (g.h - 18), x0 = Math.round(2 + k * 4), x1 = Math.round(37 - k * 4); for (let x = x0; x <= x1; x++) g.c[y][x] = y < 20 ? (x > x1 - 3 ? 'g' : 'w') : x < x0 + 2 ? 'S' : x > x1 - 4 ? 'M' : 'r'; }
  for (let i = 0; i < 40; i++) { const a = g.c.findIndex(() => false); void a; }
  ring(g, 'k');
  const p = pixels(rows(g), { k: '#14090a', w: '#ffffff', g: '#d9d4cf', r: '#d7141a', S: '#f23a3f', M: '#a80d12', L: '#fbc25a', o: '#ee9630', O: '#d9741f', D: '#a64c12', H: '#fff0c8' });
  // logo is vector so it stays sharp on the bucket
  fs.writeFileSync(O + 'bucket.svg', svg(p.w, p.h, `<g ${crisp}>${p.out}</g><svg x="6.6" y="23" width="26.8" height="13" viewBox="${LOGO_VB}" preserveAspectRatio="xMidYMid meet">${logoPaint('#ffffff', '#8f0b10')}</svg>`));
}
fs.writeFileSync(O + 'logo.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VB}">${logoPaint('#ffffff', '#e0141b')}</svg>`);

// sparkle and crown
fs.writeFileSync(O + 'spark.svg', svg(20, 20, '<path d="M10 0Q11.3 8.7 20 10 11.3 11.3 10 20 8.7 11.3 0 10 8.7 8.7 10 0Z" fill="#fff"/>'));
fs.writeFileSync(O + 'crown.svg', svg(36, 26, '<path d="M4 20 2 6l9 7 7-11 7 11 9-7-2 14Z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/><path d="M6 24h24" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>'));

// background
function brush(x0, y0, x1, y1, width, col, n = 26) {
  const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy, ny = ux; let s = '';
  for (let i = 0; i < n; i++) {
    const o = (i / (n - 1) - .5) * width, a = rr(0, .16) * len * (Math.abs(o) / width * 2 + .25), b = len * (1 - rr(0, .34) * (Math.abs(o) / width * 2 + .2)), w = width / n * rr(.95, 1.5);
    const p = (t, q) => `${n1(x0 + ux * t + nx * (o + q))},${n1(y0 + uy * t + ny * (o + q))}`;
    s += `<polygon points="${p(a, -w / 2)} ${p(b, -w / 5)} ${p(b + rr(4, 16), 0)} ${p(b, w / 5)} ${p(a, w / 2)}" fill="${col}"/>`;
  }
  return s;
}
function halftone(cx, cy, rx, ry, col) { let s = ''; for (let y = cy - ry; y <= cy + ry; y += 4.2) for (let x = cx - rx + ((Math.round((y - cy) / 4.2) % 2) ? 2.1 : 0); x <= cx + rx; x += 4.2) { const d = Math.hypot((x - cx) / rx, (y - cy) / ry); if (d < 1) s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(1.65 * (1 - d * .75))}" fill="${col}"/>`; } return s; }
let base = `<defs><radialGradient id="v" cx="50%" cy="46%" r="72%"><stop offset="0" stop-color="#2a0a0c"/><stop offset="1" stop-color="#0d0405"/></radialGradient><linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0709"/><stop offset="1" stop-color="#7c0b0f"/></linearGradient></defs>`;
base += `<rect width="${W}" height="${H}" fill="url(#v)"/>`;
base += halftone(215, 22, 42, 25, '#a30f14') + halftone(520, 165, 36, 42, '#b81218') + halftone(30, 170, 26, 28, '#5c0b0e');
base += brush(322, 42, 462, -2, 28, '#e0141b', 22) + brush(380, 40, 470, 14, 10, '#a30f14', 9);
base += brush(-8, 262, 110, 195, 72, '#e0141b', 30) + brush(-8, 232, 92, 190, 16, '#a30f14', 9);
base += brush(562, 192, 450, 268, 80, '#e0141b', 30) + brush(562, 240, 500, 272, 22, '#a30f14', 9);
// floor
base += `<rect y="270" width="${W}" height="${H - 270}" fill="url(#fl)"/>`;
let fl = ''; for (let i = 0; i < 11; i++) { const x = 12 + i * 50 + rr(-6, 6), r = rr(10, 15); for (let k = 0; k < r; k += 3) { const y = 288 - k; fl += `<rect x="${n1(x - (r - k))}" y="${y}" width="${n1((r - k) * 2)}" height="3" fill="${k > r - 7 ? '#ef2028' : '#c31016'}"/>`; } fl += `<rect x="${n1(x - 3)}" y="${n1(288 - r + 1)}" width="3" height="3" fill="#ffd9c9"/>`; }
fl += `<rect y="288" width="${W}" height="9" fill="#e0141b"/><rect y="297" width="${W}" height="6" fill="#7c0b0f"/>`;
for (let x = 2; x < W; x += 14) fl += `<rect x="${x}" y="${(x % 28) ? 291 : 293}" width="${x % 42 ? 5 : 8}" height="3" fill="${x % 42 ? '#ff8a6e' : '#fff'}"/>`;
base += `<g ${crisp}>${fl}</g>`;
// panel
base += `<rect x="64" y="55" width="429" height="208" rx="39" fill="#ffffff"/><rect x="66.2" y="57.2" width="424.6" height="203.6" rx="37" fill="#e0141b"/><rect x="69" y="60" width="419" height="198" rx="34.5" fill="#ffffff"/><rect x="70.4" y="61.4" width="416.2" height="195.2" rx="33" fill="#f9ebe2"/>`;
fs.writeFileSync(O + 'base.svg', svg(W, H, base));
for (const f of fs.readdirSync(O)) console.log(f, (fs.statSync(O + f).size / 1024).toFixed(1) + ' KB');
