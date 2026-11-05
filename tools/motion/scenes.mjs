// Storyboards for the 10 scenarios. Spoken text and quotes follow deck slides 23 to 62.
const FX = 1190, FY = 610; // main table
const walk = (f, t) => ({ dy: -Math.abs(Math.sin(t * 7)) * 14, rot: Math.sin(t * 7) * .025 });
const breathe = (f, t) => ({ dy: f.bob(t, 1.1, 3) });
function custAt(f, name, t, x = FX, y = FY, h = 620, o = {}) { const { c } = f; f.chairBack(c, x, y); f.seated(c, name, x, y, h, t, o); }
function angry(f, t, x, y, t0 = 0) { const k = f.back(f.prog(t, t0, .3)); if (k > 0) f.emote(f.c, 'angry', x, y + Math.sin(t * 8) * 3, k * (1 + Math.sin(t * 6) * .06)); }
function pop(f, t, t0, fn) { const k = f.back(f.prog(t, t0, .35)); if (k > 0) fn(k); }
const person = (f, name, x, t, h = 590, o = {}) => f.sprite(f.c, name, x, 900, h, { ...breathe(f, t), ...o });

const quotePose = (name, emo = true) => (f, t) => {
  const { c } = f; custAt(f, name, t, 330, 660, 800); f.table(c, 330, 660, 560);
  if (emo) angry(f, t, 470, 200, .1);
};

export const SCENES = [
{
  n: 1, bg: 'dining', title: 'น้ำเสียงไม่ดี วางของกระแทก', quote: 'พนักงานพูดจาไม่ดีเลย วางซอสกระแทกที่โต๊ะ ฝากอบรมมารยาทพนักงานด้วย', quotePose: quotePose('c_1'),
  beats: [
    { say: 'พนักงานรับออเดอร์ ด้วยน้ำเสียงห้วน หน้าไม่ยิ้ม', sub: 'พนักงานรับออเดอร์ด้วยน้ำเสียงห้วน หน้าไม่ยิ้ม', sfx: [[.25, 'pop'], [1.5, 'huh']], draw(f, t, d) {
      const { c } = f; custAt(f, 'c_1', t); f.table(c, FX, FY); const x = f.lerp(180, 790, f.eo(f.prog(t, 0, .9))); person(f, 'm_grumpy', x, t, 620, f.prog(t, 0, .9) < 1 ? walk(f, t) : {}); f.pad(c, x + 92, 610 + f.bob(t, 3, 2));
      pop(f, t, 1.0, k => f.bubble(c, x + 30, 240, 280, 120, 'เอาอะไร', { s: k, size: 48, stroke: f.RED, color: f.RED, tailDx: 4 })); pop(f, t, 1.6, k => f.emote(c, '...', FX + 150, 170, k));
    } },
    { say: 'ตอนเสิร์ฟ วางขวดซอสกระแทกโต๊ะ', sub: 'ตอนเสิร์ฟ วางขวดซอสกระแทกโต๊ะ', min: 4.4, cut: false, sfx: [[1.15, 'thud', 1], [1.2, 'clink', .8], [1.3, 'wrong', .5]], focus: [1050, 560], zoom: .05, draw(f, t, d) {
      const { c } = f; const sh = t > 1.15 && t < 1.55 ? Math.sin(t * 90) * 11 * (1.55 - t) : 0; c.save(); c.translate(sh, 0);
      custAt(f, 'c_1', t); f.table(c, FX, FY); person(f, 'm_furious', 800, t, 620); f.plate(c, FX + 90, FY - 8, .9);
      const y = t < .75 ? 380 + f.bob(t, 3, 5) : f.lerp(380, FY - 6, f.eio(f.prog(t, .75, .4))); const x = t < .75 ? 950 : f.lerp(950, FX - 100, f.eio(f.prog(t, .75, .4))); f.sauce(c, x, y, t > 1.15 ? Math.sin((t - 1.15) * 28) * .22 * Math.max(0, 1.5 - (t - 1.15)) : -.1);
      f.burst(c, FX - 100, FY - 18, f.prog(t, 1.15, .45)); c.restore();
      if (t > 1.2) { const k = f.back(f.prog(t, 1.25, .3)); f.emote(c, '!', FX + 150, 190, k); }
    } },
  ],
},
{
  n: 2, bg: 'dining', title: 'รอ 40 นาที ไม่มีใครมาอัปเดต', quote: 'คนอื่นได้หมด เราได้แค่อย่างเดียว รอเกือบ 40 นาที ไม่พอใจอย่างมาก', quotePose: quotePose('c_3'),
  beats: [
    { say: 'โต๊ะอื่นได้อาหารครบแล้ว', sfx: [[.5, 'clink'], [.8, 'clink'], [1.1, 'ding', .5]], draw(f, t) {
      const { c } = f; custAt(f, 'c_7', t, 520, 610, 560); f.table(c, 520, 610); [[-110, 0], [10, -6], [120, 0]].forEach(([dx, dy], i) => { const k = f.back(f.prog(t, .4 + i * .3, .3)); if (k > 0) f.plate(c, 520 + dx, 604 + dy, k * .85); }); pop(f, t, 1.3, k => f.emote(c, 'check', 690, 230, k));
      custAt(f, 'c_3', t, FX + 130, 610, 590); f.table(c, FX + 130, 610); f.plate(c, FX + 130, 604, .85, 'empty');
    } },
    { say: 'โต๊ะนี้ ได้แค่อย่างเดียว', sfx: [[.35, 'huh']], cut: false, focus: [1320, 460], zoom: .07, draw(f, t) { const { c } = f; custAt(f, 'c_7', t, 520, 610, 560); f.table(c, 520, 610); [-110, 10, 120].forEach(dx => f.plate(c, 520 + dx, 604, .85)); custAt(f, 'c_3', t, FX + 130, 610, 590); f.table(c, FX + 130, 610); f.plate(c, FX + 130, 604, .9); pop(f, t, .35, k => f.bubble(c, FX + 290, 250, 150, 110, '1', { s: k, size: 76, color: f.RED, tail: -30 })); } },
    { say: 'รอเกือบ 40 นาที ไม่มีใครมาบอกสถานะ', sfx: [0, .5, 1, 1.5, 2, 2.5, 3, 3.5].map(t => [t, 'tick', .7]), min: 4.6, draw(f, t, d) {
      const { c } = f; custAt(f, 'c_3', t, FX + 130, 610, 590); f.table(c, FX + 130, 610); f.plate(c, FX + 130, 604, .9, 'bones'); const m = Math.floor(f.prog(t, .1, 3.3) * 39); person(f, 'f_back', 240 + Math.sin(t * .6) * 18, t, 470, { a: .96 });
      f.clock(c, 760, 300, 120, m / 60, `${m} นาที`); if (m > 22) angry(f, t, FX + 310, 180);
    } },
  ],
},
{
  n: 3, bg: 'dining', title: 'นั่งแล้วต้องเรียกคนมารับออเดอร์เอง', quote: 'ลูกค้าในร้านไม่เกิน 10 โต๊ะ แต่ต้องเรียกพนักงานมารับออเดอร์เอง เหมือนไม่เต็มใจบริการเลย', quotePose: quotePose('c_4'),
  beats: [
    { say: 'ร้านมีลูกค้า ไม่ถึง 10 โต๊ะ', sub: 'ร้านมีลูกค้าไม่ถึง 10 โต๊ะ', zoom: .02, sfx: [[.45, 'pop']], draw(f, t) { const { c } = f; f.table(c, 520, 610, 380); custAt(f, 'c_1', t); f.table(c, FX, FY); pop(f, t, .45, k => f.label && (c.save(), c.translate(620, 240), c.scale(k, k), f.label(c, 'ลูกค้าไม่ถึง 10 โต๊ะ', 0, 0, 60), c.restore())); } },
    { say: 'แต่ลูกค้านั่งรอ 5 นาที', cut: false, min: 3.6, sfx: [0, .5, 1, 1.5, 2, 2.5, 3].map(t => [t, 'tick', .7]), draw(f, t) { const { c } = f; f.table(c, 520, 610, 380); custAt(f, 'c_1', t); f.table(c, FX, FY); const m = Math.min(5, Math.floor(f.prog(t, .1, 2.6) * 6)); f.clock(c, 620, 300, 118, m / 60, `${m} นาที`); pop(f, t, 1.4, k => f.emote(c, '...', FX + 150, 190, k)); } },
    { say: 'ต้องเรียกพนักงาน มารับออเดอร์เอง', sub: 'ต้องเรียกพนักงานมารับออเดอร์เอง', sfx: [[.4, 'huh'], [1.2, 'ding', .5]], draw(f, t) { const { c } = f; person(f, 'm_back', 310, t, 590, { flip: true }); f.sprite(c, 'hand_open', FX - 170, 330 + Math.sin(t * 9) * 12, 120, { rot: Math.sin(t * 8) * .25, a: f.prog(t, .25, .2) }); custAt(f, 'c_1', t); f.table(c, FX, FY); pop(f, t, .4, k => f.bubble(c, FX - 60, 190, 340, 120, 'น้องครับ!', { s: k, size: 54, tail: -60 })); pop(f, t, 1.1, k => f.emote(c, '?', 430, 240, k)); } },
  ],
},
{
  n: 4, bg: 'dining', title: 'ลืมคีย์ออเดอร์ เมนูไม่มา', quote: 'ลูกค้าในร้านมีแค่ 3 ถึง 4 โต๊ะ ทานเซ็ตหมดแล้ว เมนูที่สั่งก็ยังไม่มา ความใส่ใจไม่มีเลย', quotePose: quotePose('c_7'),
  beats: [
    { say: 'ลูกค้าสั่งเพิ่ม 1 อย่าง', sfx: [[.35, 'pop'], [.9, 'type'], [1.05, 'type'], [1.2, 'type']], draw(f, t) { const { c } = f; custAt(f, 'c_7', t); f.table(c, FX, FY); f.plate(c, FX + 70, FY - 8, .9); person(f, 'm_stand', 760, t, 620); f.pad(c, 860, 610 + Math.sin(t * 8) * 3); pop(f, t, .35, k => f.bubble(c, FX + 10, 180, 230, 110, '+1', { s: k, size: 72, color: f.RED, tail: -30 })); } },
    { say: 'พนักงานรับออเดอร์ แต่ไม่ได้คีย์', sub: 'พนักงานรับออเดอร์ แต่ไม่ได้คีย์', min: 4, focus: [760, 500], zoom: .03, sfx: [[1.1, 'wrong', .7]], draw(f, t) {
      const { c } = f; person(f, 'm_stand', f.lerp(520, 980, f.prog(t, 0, 1.4)), t, 590, f.prog(t, 0, 1.4) < 1 ? walk(f, t) : { flip: true }); c.fillStyle = '#141414'; f.rr(c, 240, 390, 330, 250, 14); c.fill(); c.fillStyle = '#fff'; f.rr(c, 258, 408, 294, 214, 8); c.fill(); c.fillStyle = f.INK; c.font = '36px KB'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('POS', 405, 448); c.fillStyle = '#ccc'; c.fillRect(290, 490, 230, 12); c.fillRect(290, 520, 170, 12); c.fillStyle = '#141414'; c.fillRect(380, 640, 50, 170); pop(f, t, 1.1, k => f.emote(c, 'x', 405, 550, k * 1.1));
    } },
    { say: 'ทานเซ็ตหลักหมดแล้ว ก็ยังไม่มา', sub: 'ทานเซ็ตหลักหมดแล้ว ก็ยังไม่มา', sfx: [[.4, 'clink'], [1.2, 'sad', .7]], draw(f, t) { const { c } = f; custAt(f, 'c_7', t); f.table(c, FX, FY); const done = t > 1; f.plate(c, FX + 70, FY - 8, .9, done ? 'bones' : 'chicken'); pop(f, t, 1.2, k => f.bubble(c, 620, 330, 300, 120, '+1 ?', { s: k, size: 72, color: f.RED, tail: 120, tailDx: 40 })); if (t > 1.5) angry(f, t, FX + 170, 150, 1.5); } },
  ],
},
{
  n: 5, bg: 'dining', title: 'สั่งรีฟิล ได้เติมรอบเดียว', quote: 'สั่งโค้กรีฟิล แต่พนักงานไม่ค่อยอยู่เลย ได้กินรีฟิลแค่รอบเดียว เหมือนไม่ได้สั่งรีฟิล', quotePose: quotePose('c_2'),
  beats: [
    { say: 'ลูกค้านั่งโซนหลังร้าน สั่งโค้กรีฟิล', sub: 'ลูกค้านั่งโซนหลังร้าน สั่งโค้กรีฟิล', sfx: [[.4, 'pop']], draw(f, t) { const { c } = f; custAt(f, 'c_2', t); f.table(c, FX, FY); f.glass(c, FX + 110, FY - 6, .95); pop(f, t, .4, k => f.label && (c.save(), c.translate(560, 260), c.scale(k, k), f.label(c, 'โซนหลังร้าน', 0, 0, 62), c.restore())); } },
    { say: 'แต่ไม่มีพนักงานอยู่ในโซน', min: 3.4, sfx: [[.6, 'huh']], draw(f, t) { const { c } = f; custAt(f, 'c_2', t); f.table(c, FX, FY); f.glass(c, FX + 110, FY - 6, f.lerp(.95, .08, f.prog(t, .2, 2))); const x = 600 + Math.sin(t * 1.5) * 170; f.emote(c, '?', x, 370, 1.2); c.strokeStyle = '#fff8'; c.lineWidth = 6; c.setLineDash([16, 14]); c.strokeRect(330, 420, 540, 470); c.setLineDash([]); } },
    { say: 'ได้เติมแค่รอบเดียว', min: 3.8, sfx: [[.2, 'pour'], [2.2, 'sad', .7]], draw(f, t) { const { c } = f; custAt(f, 'c_2', t); f.table(c, FX, FY); const lv = t < 1.5 ? f.lerp(.08, .95, f.prog(t, .2, 1.2)) : f.lerp(.95, .05, f.prog(t, 1.6, 1.3)); f.glass(c, FX + 110, FY - 6, lv); person(f, 'f_side', t < 1.6 ? 900 : f.lerp(900, 120, f.prog(t, 1.6, 1.2)), t, 570, t < 1.6 ? { flip: false } : { flip: true, ...walk(f, t) }); pop(f, t, 1.8, k => f.bubble(c, FX + 240, 330, 190, 110, '1 รอบ', { s: k, size: 46, color: f.RED, tail: -40 })); } },
  ],
},
{
  n: 6, bg: 'dining', title: 'เสิร์ฟผิดโต๊ะ ไม่ขอโทษ', quote: 'เข้าใจว่าผิดพลาดได้ แต่เห็นลูกค้ารอเป็นชั่วโมง ก็ควรเอะใจได้แล้ว ไม่มีการขอโทษด้วย', quotePose: quotePose('c_6'),
  beats: [
    { say: 'อาหารของโต๊ะนี้ ถูกเสิร์ฟไปผิดโต๊ะ', sub: 'อาหารของโต๊ะนี้ ถูกเสิร์ฟไปผิดโต๊ะ', min: 4, sfx: [[1.5, 'clink'], [1.8, 'wrong', .6]], draw(f, t) { const { c } = f; custAt(f, 'c_7', t, 400, 610, 560); f.table(c, 400, 610, 380); custAt(f, 'c_6', t); f.table(c, FX, FY); const k = f.prog(t, .15, 1.3), x = f.lerp(1000, 660, k); person(f, 'm_stand', x, t, 600, { flip: true, ...(k < 1 ? walk(f, t) : {}) }); const px = k < 1 ? x - 90 : f.lerp(x - 90, 450, f.prog(t, 1.35, .3)), py = k < 1 ? 470 : f.lerp(470, 604, f.prog(t, 1.35, .3)); f.plate(c, px, py, .85); pop(f, t, 1.9, b => { f.emote(c, 'x', 460, 390, b * .9); }); } },
    { say: 'ลูกค้ารอเกือบชั่วโมง', min: 3.6, sfx: [0, .4, .8, 1.2, 1.6, 2, 2.4].map(t => [t, 'tick', .7]), draw(f, t) { const { c } = f; custAt(f, 'c_6', t); f.table(c, FX, FY); const m = Math.floor(f.prog(t, .1, 2.6) * 58); f.clock(c, 640, 300, 124, m / 60, `${m} นาที`); if (m > 30) f.emote(c, '...', FX + 170, 190); } },
    { say: 'ต้องตามเองถึงรู้ และไม่มีใครขอโทษ', sub: 'ต้องตามเองถึงรู้ และไม่มีใครขอโทษ', min: 4.2, sfx: [[.3, 'huh'], [1.8, 'sad', .7]], draw(f, t) { const { c } = f; person(f, 'm_bored', 720, t, 620); custAt(f, 'c_6', t); f.table(c, FX, FY); pop(f, t, .3, k => f.bubble(c, FX - 40, 180, 360, 120, 'อาหารโต๊ะนี้ล่ะคะ', { s: k, size: 44, tail: -90 })); pop(f, t, 1.7, k => f.bubble(c, 660, 250, 200, 110, '...', { s: k, size: 64, tail: 40 })); if (t > 2.2) angry(f, t, FX + 180, 160, 2.2); } },
  ],
},
{
  n: 7, bg: 'store', title: 'ยืนหน้าร้าน 5 นาที ไม่มีใครเชิญ', quoteBg: 'store', quote: 'ยืนรอหน้าร้านเกิน 5 นาที แคชเชียร์ก็เห็นแต่ไม่สนใจ พนักงานเหมือนหลบสายตาตลอด', quotePose: (f, t) => { f.sprite(f.c, 'c_3', 300, 1010, 800, { dy: f.bob(t, 1, 3) }); angry(f, t, 460, 240, .1); },
  beats: [
    { say: 'ลูกค้ายืนดูเมนูหน้าร้าน เกิน 5 นาที', sub: 'ลูกค้ายืนดูเมนูหน้าร้านเกิน 5 นาที', min: 4.4, zoom: .018, sfx: [[.05, 'door', .6], ...[1, 1.5, 2, 2.5, 3, 3.5].map(t => [t, 'tick', .6])], draw(f, t) { const { c } = f; f.sprite(c, 'c_3', 640 + (t < .9 ? (t - .9) * 300 : 0), 1000, 650, t < .9 ? walk(f, t) : breathe(f, t)); const m = Math.min(5, Math.floor(f.prog(t, .9, 2.8) * 6)); f.clock(c, 300, 300, 112, m / 60, `${m} นาที`); } },
    { say: 'แคชเชียร์เห็น แต่ไม่สนใจ', sub: 'แคชเชียร์เห็น แต่ไม่สนใจ', min: 3.4, cut: false, focus: [1500, 650], zoom: .03, sfx: [[.5, 'huh']], draw(f, t) { const { c } = f; f.sprite(c, 'c_3', 640, 1000, 650, breathe(f, t)); f.sprite(c, 'm_think', 1430, 1000, 650, breathe(f, t)); pop(f, t, .6, k => f.emote(c, '...', 1450, 320, k * 1.1)); } },
    { say: 'พนักงานยืนหันหลัง ไม่มีใครเชิญ', sub: 'พนักงานยืนหันหลัง ไม่มีใครเชิญ', min: 3.8, cut: false, sfx: [[1.4, 'sad', .7]], draw(f, t) { const { c } = f; f.sprite(c, 'c_3', 640, 1000, 650, breathe(f, t)); f.sprite(c, 'f_back', 1480, 1000, 620, breathe(f, t)); if (t > 1.5) angry(f, t, 780, 390, 1.5); pop(f, t, 1.2, k => f.emote(c, 'x', 1120, 540, k)); } },
  ],
},
{
  n: 8, bg: 'dining', title: 'ขอเก็บโต๊ะ ขอของ ต้องตามเอง', quote: 'ขอให้เก็บโต๊ะ แล้วรอ 5 นาที ต้องเรียกขอกระดาษรองโต๊ะเอง ทำไมพนักงานเหมือนไม่เต็มใจบริการ', quotePose: quotePose('c_1'),
  beats: [
    { say: 'ลูกค้าขอให้เก็บโต๊ะที่อยากนั่ง', min: 3.6, sfx: [[.5, 'clink'], [1.5, 'clink']], draw(f, t) { const { c } = f; f.table(c, FX, FY); const k = f.prog(t, 1.4, .45); f.plate(c, FX - 90, FY - 8, .8, 'bones', 1 - k); f.glass(c, FX + 110, FY - 6, .1 * (1 - k)); f.sprite(c, 'c_1', 720, 900, 610, breathe(f, t)); pop(f, t, .3, b => f.bubble(c, 800, 260, 310, 110, 'โต๊ะนี้ได้ไหม', { s: b, size: 42, tail: -60 })); person(f, 'f_smile', FX + 340, t, 560, {}); } },
    { say: 'นั่งแล้วรอ 5 นาที ไม่มีใครมาเซตโต๊ะ', sub: 'นั่งแล้วรอ 5 นาที ไม่มีใครมาเซตโต๊ะ', min: 4.2, sfx: [0, .5, 1, 1.5, 2, 2.5, 3].map(t => [t, 'tick', .7]), draw(f, t) { const { c } = f; custAt(f, 'c_1', t); f.table(c, FX, FY); const m = Math.min(5, Math.floor(f.prog(t, .1, 2.6) * 6)); f.clock(c, 640, 300, 120, m / 60, `${m} นาที`); pop(f, t, 1.5, k => f.emote(c, '...', FX + 170, 180, k)); } },
    { say: 'ต้องเรียก ขอกระดาษรองจานเอง', sub: 'ต้องเรียกขอกระดาษรองจานเอง', sfx: [[.3, 'huh'], [1.5, 'sad', .7]], draw(f, t) { const { c } = f; custAt(f, 'c_1', t); f.sprite(c, 'hand_open', FX - 170, 330 + Math.sin(t * 9) * 12, 120, { rot: Math.sin(t * 8) * .25 }); f.table(c, FX, FY); pop(f, t, .3, k => f.bubble(c, FX - 70, 190, 450, 120, 'ขอกระดาษรองจานด้วย', { s: k, size: 40, tail: -60 })); person(f, 'f_back', 360, t, 520); } },
  ],
},
{
  n: 9, bg: 'counter', title: 'ถูกลูกค้าเตือน แล้วจ้องหน้าไม่พอใจ', quoteBg: 'counter', quote: 'ไม่มั่นใจเรื่องความสะอาดของร้าน และพนักงานยืนจ้องหน้าไม่พอใจ ไม่สำนึกผิด', quotePose: (f, t) => { f.sprite(f.c, 'c_6', 300, 1020, 780, { dy: f.bob(t, 1, 3) }); angry(f, t, 470, 260, .1); },
  beats: [
    { say: 'ลูกค้าเห็นพนักงาน ใส่รองเท้าเหยียบเคาน์เตอร์เตรียมอาหาร', sub: 'ลูกค้าเห็นพนักงานใส่รองเท้าเหยียบเคาน์เตอร์เตรียมอาหาร', min: 4.8, focus: [960, 640], zoom: .012, sfx: [[.45, 'thud', .7], [1.6, 'wrong', .5]], draw(f, t) { const { c } = f; const y = 526 - f.back(f.prog(t, 0, .45)) * 0; f.sprite(c, 'm_stand', 1090, 526 + (1 - f.eo(f.prog(t, 0, .45))) * 130, 430, { dy: f.bob(t, 1.2, 2) }); f.burst(c, 1090, 520, f.prog(t, .4, .45)); pop(f, t, 1.5, k => { c.save(); c.translate(1090, 526); c.scale(k, k); c.strokeStyle = f.RED; c.lineWidth = 12; c.beginPath(); c.ellipse(0, -14, 150, 46, 0, 0, 7); c.stroke(); c.restore(); }); f.sprite(c, 'c_6', 400, 950, 560, breathe(f, t)); } },
    { say: 'จึงเตือน', min: 2, cut: false, sfx: [[.15, 'huh']], draw(f, t) { const { c } = f; f.sprite(c, 'm_stand', 1090, 526, 430); f.sprite(c, 'c_6', 400, 950, 560, breathe(f, t)); pop(f, t, .1, k => f.bubble(c, 560, 350, 470, 120, 'น้องคะ ตรงนี้ไม่ได้นะคะ', { s: k, size: 38, tail: -110 })); } },
    { say: 'พนักงานยืนจ้องหน้า ด้วยท่าทีไม่พอใจ', sub: 'พนักงานยืนจ้องหน้า ด้วยท่าทีไม่พอใจ', min: 4, focus: [960, 640], zoom: .012, sfx: [[.2, 'stamp', .7], [1.2, 'sad', .6]], draw(f, t) { const { c } = f; f.sprite(c, 'm_furious', 1090, 526, 430, { dy: f.bob(t, 3, 1) }); f.sprite(c, 'c_6', 400, 950, 560, breathe(f, t)); c.strokeStyle = f.RED; c.lineWidth = 10; c.setLineDash([26, 20]); c.lineDashOffset = -t * 90; const k = f.prog(t, .15, .4); c.beginPath(); c.moveTo(1040, 160); c.lineTo(f.lerp(1040, 510, k), f.lerp(160, 460, k)); c.stroke(); c.setLineDash([]); pop(f, t, .9, b => f.emote(c, '!', 560, 400, b)); } },
  ],
},
{
  n: 10, bg: 'dining', title: 'เมนูหมด แต่ยังอยู่ในบิล', quote: 'เมนูหมดทีหลัง แต่พอคิดเงินแล้วยังมีในบิล', quotePose: quotePose('c_7'),
  beats: [
    { say: 'ลูกค้าสั่งเมนูที่หมดทีหลัง', min: 3.6, sfx: [[1.3, 'stamp', .8]], draw(f, t) { const { c } = f; custAt(f, 'c_7', t); f.table(c, FX, FY); person(f, 'm_stand', 720, t, 610); f.pad(c, 820, 600); pop(f, t, .15, k => { c.save(); c.translate(360, 340); c.scale(k, k); c.fillStyle = '#fff'; f.rr(c, -140, -130, 280, 260, 16); c.fill(); c.strokeStyle = f.INK; c.lineWidth = 5; c.stroke(); f.plate(c, 0, 30, 1.15); c.restore(); }); pop(f, t, 1.3, k => { c.save(); c.translate(360, 340); c.rotate(-.18); c.scale(k, k); f.label(c, 'หมด', 0, 0, 86); c.restore(); }); } },
    { say: 'พนักงานไม่ได้แจ้งให้ชัด', min: 3.2, sfx: [[.45, 'huh']], draw(f, t) { const { c } = f; custAt(f, 'c_7', t); f.table(c, FX, FY); person(f, 'm_bored', 720, t, 610); pop(f, t, .4, k => f.bubble(c, 700, 230, 210, 110, '...', { s: k, size: 64, tail: 20 })); pop(f, t, .9, k => f.emote(c, '?', FX + 170, 190, k)); } },
    { say: 'ตอนจ่ายเงิน เมนูนั้นยังอยู่ในบิล', sub: 'ตอนจ่ายเงิน เมนูนั้นยังอยู่ในบิล', min: 4.4, focus: [760, 460], zoom: .04, sfx: [[.15, 'print'], [1.7, 'wrong', .8]], draw(f, t) { const { c } = f; custAt(f, 'c_7', t); f.table(c, FX, FY); const k = f.eo(f.prog(t, .1, .8)), y = 150; c.save(); c.translate(690, y); c.scale(k, k); c.fillStyle = '#fff'; c.shadowColor = '#0006'; c.shadowBlur = 24; f.rr(c, -210, 0, 420, 560, 8); c.fill(); c.shadowBlur = 0; c.fillStyle = f.INK; c.font = '42px KB'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ใบเสร็จ', 0, 54); c.font = '30px KM'; c.textAlign = 'left'; ['เซ็ตไก่ทอด', 'โค้ก', 'เฟรนช์ฟรายส์'].forEach((l, i) => { c.fillStyle = f.INK; c.fillText(l, -170, 130 + i * 62); c.textAlign = 'right'; c.fillText('1', 170, 130 + i * 62); c.textAlign = 'left'; }); const hi = f.prog(t, 1.7, .3); c.fillStyle = `rgba(215,20,26,${.16 * hi})`; c.fillRect(-190, 290, 380, 64); c.fillStyle = hi > 0 ? f.RED : f.INK; c.font = '32px KB'; c.fillText('เมนูที่หมด', -170, 322); c.textAlign = 'right'; c.fillText('+1', 170, 322); c.textAlign = 'left'; c.fillStyle = '#aaa'; c.fillRect(-170, 390, 340, 4); c.restore(); pop(f, t, 1.7, b => { c.save(); c.translate(690, 472); c.scale(b, b); c.strokeStyle = f.RED; c.lineWidth = 11; c.beginPath(); c.ellipse(0, 0, 228, 56, 0, 0, 7); c.stroke(); c.restore(); }); if (t > 2.1) angry(f, t, FX + 170, 150, 2.1); } },
  ],
},
];
