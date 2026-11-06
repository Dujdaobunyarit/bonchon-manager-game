// Draws the scoreboard scene as sharp SVG layers in img/board/. Run after make-frame.mjs. node tools/make-board.mjs
import fs from 'fs';
const R = decodeURIComponent(new URL('..', import.meta.url).pathname), O = R + 'img/board/', FR = R + 'img/frame/'; fs.mkdirSync(O, { recursive: true });
const W = 1672, H = 855, crisp = 'shape-rendering="crispEdges"';
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const svg = (w, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" ${extra}>${body}</svg>`;
const write = (n, s) => fs.writeFileSync(O + n, s);
const inner = s => s.slice(s.indexOf('>', s.indexOf('<svg')) + 1, s.lastIndexOf('</svg>'));
function pixels(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length)); let out = '';
  rows.forEach((r, y) => { let x = 0; while (x < r.length) { const c = r[x]; if (c === '.' || c === ' ') { x++; continue; } let e = x; while (r[e] === c) e++; out += `<rect x="${x}" y="${y}" width="${e - x}" height="1" fill="${pal[c]}"/>`; x = e; } });
  return { w, h, out };
}
const grow = (cells, col, w, h) => { const a = new Map(cells); for (const k of cells.keys()) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = `${x + dx},${y + dy}`; if (!cells.has(q)) a.set(q, col); } } return a; };
const cellRects = (cells, s = 1, ox = 0, oy = 0) => { const by = new Map(); for (const [k, c] of cells) { const [x, y] = k.split(',').map(Number); if (!by.has(y)) by.set(y, new Map()); by.get(y).set(x, c); } let o = ''; for (const [y, row] of by) { const xs = [...row.keys()].sort((a, b) => a - b); let i = 0; while (i < xs.length) { let j = i; while (j + 1 < xs.length && xs[j + 1] === xs[j] + 1 && row.get(xs[j + 1]) === row.get(xs[i])) j++; o += `<rect x="${ox + xs[i] * s}" y="${oy + y * s}" width="${(xs[j] - xs[i] + 1) * s + .1}" height="${s + .1}" fill="${row.get(xs[i])}"/>`; i = j + 1; } } return o; };

// pixel font
const F = {
  S: ['01111', '11000', '11000', '01110', '00011', '00011', '11110'], C: ['01111', '11000', '11000', '11000', '11000', '11000', '01111'], O: ['01110', '11011', '11011', '11011', '11011', '11011', '01110'],
  R: ['11110', '11011', '11011', '11110', '11100', '11110', '11011'], E: ['11111', '11000', '11000', '11110', '11000', '11000', '11111'], B: ['11110', '11011', '11011', '11110', '11011', '11011', '11110'],
  A: ['01110', '11011', '11011', '11111', '11011', '11011', '11011'], D: ['11110', '11011', '11011', '11011', '11011', '11011', '11110'], N: ['11011', '11011', '11111', '11111', '11111', '11011', '11011'],
  H: ['11011', '11011', '11011', '11111', '11011', '11011', '11011'], T: ['11111', '01110', '01110', '01110', '01110', '01110', '01110'], ' ': ['000', '000', '000', '000', '000', '000', '000'],
};
function word(t) { const m = new Map(); let x = 0; for (const ch of t) { F[ch].forEach((r, y) => [...r].forEach((b, i) => { if (b === '1') m.set(`${x + i},${y}`, 'x'); })); x += F[ch][0].length + 1; } return { m, w: x - 1, h: 7 }; }

// title
{
  const { m, w, h } = word('SCOREBOARD'); const P = 2, out = new Map();
  for (const k of m.keys()) { const [x, y] = k.split(',').map(Number); for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) out.set(`${x * 2 + a},${y * 2 + b}`, '#ffffff'); }
  const line = grow(out, '#c20d13'), edge = grow(line, '#14090a');
  const shadow = cellRects(new Map([...edge.keys()].map(k => [k, '#6e070a'])), 1, P + 1, P + 2);
  write('title.svg', svg(w * 2 + 6, h * 2 + 7, `<g ${crisp}>${shadow}${cellRects(edge, 1, P, P)}</g>`));
}
// orange sparkle
write('spark.svg', svg(20, 20, '<path d="M10 0Q11.3 8.7 20 10 11.3 11.3 10 20 8.7 11.3 0 10 8.7 8.7 10 0Z" fill="#ffb238"/><path d="M10 5Q10.7 9.300 15 10 10.7 10.700 10 15 9.300 10.700 5 10 9.300 9.300 10 5Z" fill="#fff0c2"/>'));
write('cone.svg', svg(240, 300, '<defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffbd6b" stop-opacity=".5"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></linearGradient></defs><polygon points="82,0 158,0 240,300 0,300" fill="url(#c)"/>'));
write('marks-y.svg', svg(24, 22, `<g ${crisp} fill="#f6c417" stroke="#14090a" stroke-width=".8"><path d="M3 1h4l-1 10H4zM4 13h3v3H4z"/><path d="M19 6l3 2-6 7-2-2zM11 16l2-2 2 2-2 2z"/></g>`));
write('marks-w.svg', svg(24, 22, `<g ${crisp} fill="#fff" stroke="#14090a" stroke-width=".8"><path d="M16 1h4l-1 10h-2zM17 13h3v3h-3z"/><path d="M2 6l2-1 6 7-2 2zM9 15l2-1 1 2-2 1z"/></g>`));

// chicken holding a clipboard
{
  const p = pixels([
    '........kkkkkkk.............', '......kkrrrrrrrkk...........', '......krrrrrrrrrk...........', '......kkrRrrrRrrk...........',
    '.......kkwwwwwwkkk..........', '......kkwwwwwwwwwkk.........', '.....kkwwwwwwkkwwwkkk.......', '.....kwwwwwwwkkwwwyyyk......',
    '.....kwwwwwwwwwwwwyyyyk.....', 'kk...kwwwwwwwwwwwrrrkk......', 'kwk..kwwwwwwwwwwwrrrrk......', 'kwwkkkwwwwwwwwwwwwkrrk..kkkk',
    'kwwwwwwwwwwwwwwwwwkkk.kkbbbk', '.kwwwwwwggggwwwwwwwk.kbbppbk', 'kkwwwwgwwwwgwwwwwwkk.kbppppk', 'kwwwwwwggggwwwwwwkwwkkppppbk',
    '.kwwwwwwwwwwwwwwkwwwwkpzzpbk', '..kwwwwwwwwwwwwwwkwwkbppppbk', '...kkwwwwwwwwwwkkkkkkbbzzpk.', '.....kkkkkkkkkk.....kkkbbbk.',
    '.......kyyk..kyyk......kkkk.', '.......kyyk..kyyk...........', '.......kyyk..kyyk...........', '.....kkyyyk.kkyyyk..........',
    '.....kyyyyyk.kyyyyyk........', '.....kkkkkkk.kkkkkkk........',
  ], { k: '#14090a', r: '#e3131b', R: '#a80d12', w: '#ffffff', g: '#c9c6c4', y: '#f6c417', b: '#6b4a36', p: '#f7f3ec', z: '#c0392b' });
  write('chick-clip.svg', svg(p.w, p.h, p.out, crisp));
}
// chicken popping out of the bucket, wings up
{
  const body = pixels([
    '.......kkkkkkkk.......', '......krrrrrrrrk......', '......krRrrrrRrk......', '.......kwwwwwwk.......',
    '.k...kkwwwwwwwwkk...k.', 'kwk.kkwwkwwwwkwwkk.kwk', 'kwwkkwwwwwyywwwwwkkwwk', 'kwwwkwwwwyyyywwwwkwwwk',
    '.kwwwkwwwwrrwwwwkwwwk.', '.kwwwwwwwwwwwwwwwwwwk.', '..kkwwwwwwwwwwwwwwkk..', '....kwwwwwwwwwwwwk....', '....kwwwwwwwwwwwwk....', '....kwwwwwwwwwwwwk....',
  ], { k: '#14090a', r: '#e3131b', R: '#a80d12', w: '#ffffff', y: '#f6c417' });
  write('chick-pop.svg', svg(body.w, body.h, body.out, crisp));
  const rows = []; const w = 40, h = 30;
  for (let y = 0; y < h; y++) { let r = ''; const k = y / (h - 1), a = Math.round(1 + k * 5), b = Math.round(38 - k * 5); for (let x = 0; x < w; x++) { if (x < a - 1 || x > b + 1 || y < 0) r += '.'; else if (x === a - 1 || x === b + 1 || y === h - 1) r += 'k'; else if (y < 3) r += x > b - 3 ? 'g' : 'w'; else r += x < a + 2 ? 'S' : x > b - 3 ? 'M' : 'r'; } rows.push(r); }
  const p = pixels(rows, { k: '#14090a', w: '#ffffff', g: '#d9d4cf', r: '#d7141a', S: '#f23a3f', M: '#a80d12' });
  const logo = fs.readFileSync(FR + 'bucket.svg', 'utf8'), lg = logo.match(/<svg x="6\.6"[\s\S]*?<\/svg>/)[0].replace('x="6.6" y="23" width="26.8" height="13"', 'x="5.8" y="7" width="28.4" height="16"');
  write('bucket.svg', svg(w, h, `<g ${crisp}>${p.out}</g>${lg}`));
}

// scene
let b = `<defs>
<pattern id="br" width="56" height="28" patternUnits="userSpaceOnUse"><rect width="56" height="28" fill="#211312"/><path d="M0 13h56v2H0zM0 27h56v1H0zM14 0h2v13h-2zM42 15h2v13h-2z" fill="#120908"/><rect x="16" y="1" width="26" height="3" fill="#2d1a18"/></pattern>
<pattern id="rb" width="56" height="28" patternUnits="userSpaceOnUse"><rect width="56" height="28" fill="#5e1412"/><path d="M0 13h56v2H0zM0 27h56v1H0zM14 0h2v13h-2zM42 15h2v13h-2z" fill="#3a0c0b"/><rect x="18" y="2" width="20" height="3" fill="#74201c"/></pattern>
<pattern id="fl" width="104" height="30" patternUnits="userSpaceOnUse"><rect width="104" height="30" fill="#5d5450"/><path d="M0 0h104v2H0zM0 15h104v2H0zM30 0h2v15h-2zM82 15h2v15h-2z" fill="#3d3532"/><rect x="36" y="5" width="30" height="2" fill="#6c625e"/></pattern>
<linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd49a"/><stop offset=".6" stop-color="#f0a765"/><stop offset="1" stop-color="#b76a3c"/></linearGradient>
<radialGradient id="vg" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient></defs>`;
b += `<rect width="${W}" height="${H}" fill="url(#br)"/><rect y="560" width="${W}" height="240" fill="url(#rb)"/><rect y="556" width="${W}" height="8" fill="#1a0e0d"/>`;
b += `<rect y="790" width="${W}" height="65" fill="url(#fl)"/><rect y="786" width="${W}" height="7" fill="#14090a"/>`;
// left window
b += `<g ${crisp}><polygon points="0,142 208,142 246,190 0,190" fill="#7c1512"/><rect y="186" width="208" height="8" fill="#14090a"/><rect y="190" width="190" height="370" fill="#14090a"/><rect y="197" width="176" height="356" fill="url(#win)"/></g>`;
for (const [x, y, w, op] of [[0, 300, 48, .55], [90, 250, 70, .45], [12, 378, 70, .4], [96, 372, 62, .5]]) b += `<rect x="${x}" y="${y}" width="${w}" height="12" fill="#fff4d9" opacity="${op}"/>`;
b += `<rect x="58" y="197" width="9" height="356" fill="#14090a"/><g fill="#3a2118"><rect x="0" y="468" width="48" height="12"/><rect x="18" y="480" width="10" height="72"/><rect x="78" y="468" width="86" height="12"/><rect x="116" y="480" width="10" height="72"/><rect x="0" y="424" width="30" height="46" opacity=".6"/><rect x="74" y="430" width="30" height="40" opacity=".6"/></g>`;
// right shop
b += `<g ${crisp}><rect x="1468" y="240" width="204" height="330" fill="#1a0f0e"/></g>`;
b += `<polygon points="1442,70 1672,18 1672,178 1446,218" fill="#14090a"/><polygon points="1442,70 1672,18 1672,42 1442,96" fill="#e0141b"/>`;
const stripe = []; for (let i = 0; i < 6; i++) stripe.push(`<polygon points="${1462 + i * 36},${214 - i * 7} ${1498 + i * 36},${207 - i * 7} ${1498 + i * 36 - 6},${262 - i * 6} ${1462 + i * 36 - 6},${268 - i * 6}" fill="${i % 2 ? '#fff' : '#d7141a'}"/>`);
b += stripe.join('');
{ const street = word('BONCHON STREET'); let s = ''; for (const k of street.m.keys()) { const [x, y] = k.split(',').map(Number); s += `<rect x="${x}" y="${y}" width="1.05" height="1.05"/>`; } b += `<g transform="translate(1462 168) rotate(-11) scale(2.5 3)" fill="#fff" ${crisp}>${s}</g>`; const J = ['ㄴ', 'ㅗ', 'ㄴ', 'ㅊ', 'ㅗ', 'ㄴ']; const G = { 'ㄴ': 'M1 1v5h6', 'ㅗ': 'M4 2v4M1 6h6', 'ㅊ': 'M4 0v2M1 2h6M4 2L1 6M4 2l3 4' }; b += `<g transform="translate(1466 134) rotate(-11)" fill="none" stroke="#fff" stroke-width="1.8">${J.map((c, i) => `<path transform="translate(${i * 31} 0) scale(3)" d="${G[c]}" stroke-width=".8"/>`).join('')}</g>`; }
// poster
const drum = inner(fs.readFileSync(FR + 'drum.svg', 'utf8'));
b += `<rect x="1506" y="266" width="150" height="268" fill="#14090a"/><rect x="1514" y="274" width="134" height="252" fill="#e8d9cd"/><rect x="1514" y="430" width="134" height="96" fill="#a81218"/><svg x="1512" y="315" width="136" height="136" viewBox="0 0 40 36" ${crisp}>${drum}</svg><svg x="1565" y="405" width="92" height="84" viewBox="0 0 40 36" ${crisp}>${drum}</svg><rect x="1490" y="540" width="182" height="20" fill="#2a1817"/>`;
// lamps
const lamp = (x, y, cord) => `<rect x="${x - 2}" y="0" width="4" height="${cord}" fill="#0c0606"/><path d="M${x - 58} ${y + 44}Q${x} ${y - 52} ${x + 58} ${y + 44}Z" fill="#1c1b1d"/><path d="M${x - 44} ${y + 24}Q${x - 20} ${y - 14} ${x - 4} ${y - 14}L${x - 16} ${y + 24}Z" fill="#3b3a3e"/><ellipse cx="${x}" cy="${y + 46}" rx="50" ry="10" fill="#fff0b8"/><ellipse cx="${x}" cy="${y + 50}" rx="30" ry="9" fill="#ffc466"/>`;
b += lamp(135, 88, 60) + lamp(312, 30, 12) + lamp(1352, 30, 12);
// bushes
const bush = (cx, y, w, h) => { const m = new Map(); for (let i = 0; i < 7; i++) { const c = cx + (i - 3) * w / 7, r = h * (.45 + rnd() * .35); for (let yy = -Math.ceil(r); yy <= 0; yy++) for (let x = -Math.ceil(r); x <= r; x++) if (Math.hypot(x, yy) <= r) m.set(`${Math.round(c + x)},${y + yy}`, yy < -r * .55 ? '#57a33c' : '#2f7a2d'); } const e = grow(m, '#12301a'); return `<g transform="scale(6)" ${crisp}>${cellRects(e)}</g>`; };
b += bush(32, 136, 26, 6) + bush(245, 136, 26, 6);
// scoreboard panel with stepped corners
const panel = (x, y, w, h, s, col) => { const pts = [[x + 3 * s, y], [x + w - 3 * s, y], [x + w - 3 * s, y + s], [x + w - s, y + s], [x + w - s, y + 3 * s], [x + w, y + 3 * s], [x + w, y + h - 3 * s], [x + w - s, y + h - 3 * s], [x + w - s, y + h - s], [x + w - 3 * s, y + h - s], [x + w - 3 * s, y + h], [x + 3 * s, y + h], [x + 3 * s, y + h - s], [x + s, y + h - s], [x + s, y + h - 3 * s], [x, y + h - 3 * s], [x, y + 3 * s], [x + s, y + 3 * s], [x + s, y + s], [x + 3 * s, y + s]]; return `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${col}" ${crisp}/>`; };
write('panel.svg', svg(W, H, panel(198, 192, 1268, 626, 7, '#14090a') + panel(202, 196, 1260, 618, 7, '#e0141b') + panel(208, 202, 1248, 606, 6, '#ffffff') + panel(213, 207, 1238, 596, 6, '#f9ebe2')));
b += `<rect width="${W}" height="${H}" fill="url(#vg)"/>`;
write('base.svg', svg(W, H, b));
for (const f of fs.readdirSync(O)) console.log(f, (fs.statSync(O + f).size / 1024).toFixed(1) + ' KB');
