// Draws the three extra game 3 characters so they do not reuse the original persona pictures. node tools/make-new-personas.mjs
import fs from 'fs';
import { createCanvas } from '@napi-rs/canvas';
import { LOOKS, drawCustomer, setCustomerState } from './motion/customer.mjs';
const R = decodeURIComponent(new URL('..', import.meta.url).pathname);
Object.assign(LOOKS, {
  mind: { g: 'f', hair: 'bob', hc: '#22213a', skin: '#f7c2a4', top: 'tee', c1: '#ffffff', c2: '#d8dee8', skirt: '#2c4f8e', shoe: '#1d2230' },
  ton: { g: 'm', hair: 'side', hc: '#241914', skin: '#e3a080', top: 'polo', c1: '#2f7bd0', c2: '#1d5a9e', pants: '#5d4c3b', cuff: '#4b3d30', shoe: '#3a2c25' },
  tonkid: { g: 'f', hair: 'pony', hc: '#2a1a14', skin: '#f7c0a0', top: 'tee', c1: '#ff8fb3', c2: '#e86f95', skirt: '#ffd84d', shoe: '#ffffff' },
  fern: { g: 'f', hair: 'long', hc: '#3a2418', skin: '#efb08f', top: 'shirt', c1: '#f3efe6', c2: '#cbc3b4', skirt: '#3a3f55', shoe: '#2a2522' },
});
const W = 600, H = 900, foot = 880, h = 840;
function canvas() { const cv = createCanvas(W, H); return [cv, cv.getContext('2d')]; }
const u = h / 100, X = x => W / 2 + x * u, Y = y => foot + y * u; // body units to pixels
async function save(cv, name) { fs.writeFileSync(R + 'img/' + name, await cv.encode('png')); console.log(name); }
setCustomerState({ t: .4, tl: 'happy', talk: 0 });

// น้องมายด์: student with a backpack and a phone
{
  const [cv, c] = canvas();
  c.fillStyle = '#e8574f'; c.beginPath(); c.roundRect(X(-13.5), Y(-74), 27 * u, 30 * u, 5 * u); c.fill(); // backpack behind
  drawCustomer(c, 'mind', W / 2, foot, h, { mood: 'happy' });
  c.strokeStyle = '#c23e37'; c.lineWidth = 2.2 * u; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(X(s * 6.5), Y(-75.5)); c.lineTo(X(s * 8.5), Y(-56)); c.stroke(); }
  c.fillStyle = '#c0242c'; c.beginPath(); c.moveTo(X(-1.6), Y(-74)); c.lineTo(X(1.6), Y(-74)); c.lineTo(X(2.4), Y(-67)); c.lineTo(X(0), Y(-65.5)); c.lineTo(X(-2.4), Y(-67)); c.fill(); // school bow
  c.fillStyle = '#1d2230'; c.beginPath(); c.roundRect(X(13), Y(-52), 4 * u, 7 * u, .8 * u); c.fill(); c.fillStyle = '#7fd3ff'; c.fillRect(X(13.6), Y(-51.2), 2.8 * u, 5.2 * u); // phone
  await save(cv, 'persona8.png');
}
// พ่อต้น: dad with a balloon, gift and a birthday girl in a party hat
{
  const [cv, c] = canvas();
  c.strokeStyle = '#555'; c.lineWidth = .35 * u; c.beginPath(); c.moveTo(X(-16), Y(-50)); c.quadraticCurveTo(X(-21), Y(-80), X(-19), Y(-95)); c.stroke();
  c.fillStyle = '#ff5a5f'; c.beginPath(); c.ellipse(X(-19), Y(-101), 5.2 * u, 6.4 * u, 0, 0, 7); c.fill(); c.fillStyle = '#ffffff88'; c.beginPath(); c.ellipse(X(-20.8), Y(-103.5), 1.2 * u, 2 * u, -.4, 0, 7); c.fill();
  drawCustomer(c, 'ton', W / 2 - 40, foot, h * .97, { mood: 'happy' });
  drawCustomer(c, 'tonkid', W / 2 + 120, foot, h * .5, { mood: 'happy' });
  const kx = W / 2 + 120, ku = h * .5 / 100; // party hat on the girl
  c.fillStyle = '#7b5cff'; c.beginPath(); c.moveTo(kx - 6 * ku, foot - 94 * ku); c.lineTo(kx + 6 * ku, foot - 94 * ku); c.lineTo(kx + 1 * ku, foot - 110 * ku); c.fill();
  c.fillStyle = '#ffd84d'; c.beginPath(); c.arc(kx + 1 * ku, foot - 110 * ku, 2 * ku, 0, 7); c.fill();
  const gx = W / 2 - 40 + 15 * u * .97, gy = foot - 52 * u * .97; // gift box in the right hand
  c.fillStyle = '#ffd84d'; c.fillRect(gx - 5 * u, gy - 6 * u, 10 * u, 8 * u); c.fillStyle = '#e8574f'; c.fillRect(gx - .9 * u, gy - 6 * u, 1.8 * u, 8 * u); c.fillRect(gx - 5 * u, gy - 3 * u, 10 * u, 1.6 * u);
  c.strokeStyle = '#e8574f'; c.lineWidth = .8 * u; c.beginPath(); c.ellipse(gx - 1.6 * u, gy - 7 * u, 1.8 * u, 1 * u, -.5, 0, 7); c.ellipse(gx + 1.6 * u, gy - 7 * u, 1.8 * u, 1 * u, .5, 0, 7); c.stroke();
  await save(cv, 'persona9.png');
}
// น้องเฟิร์น: office worker with a lanyard card and a tote bag
{
  const [cv, c] = canvas();
  drawCustomer(c, 'fern', W / 2, foot, h, { mood: 'happy' });
  c.strokeStyle = '#2f7bd0'; c.lineWidth = .7 * u; c.beginPath(); c.moveTo(X(-3.2), Y(-76)); c.lineTo(X(-1), Y(-63)); c.moveTo(X(3.2), Y(-76)); c.lineTo(X(1), Y(-63)); c.stroke();
  c.fillStyle = '#ffffff'; c.strokeStyle = '#9aa3ad'; c.lineWidth = .3 * u; c.beginPath(); c.roundRect(X(-2.6), Y(-63.5), 5.2 * u, 7 * u, .6 * u); c.fill(); c.stroke(); c.fillStyle = '#2f7bd0'; c.fillRect(X(-2.6), Y(-63.5), 5.2 * u, 1.6 * u); c.fillStyle = '#c9d1db'; c.fillRect(X(-1.6), Y(-60.6), 3.2 * u, .6 * u); c.fillRect(X(-1.6), Y(-59.2), 2.2 * u, .6 * u);
  c.fillStyle = '#c98c4a'; c.beginPath(); c.roundRect(X(10.5), Y(-58), 10 * u, 11 * u, 1.2 * u); c.fill(); c.strokeStyle = '#a06a32'; c.lineWidth = .8 * u; c.beginPath(); c.moveTo(X(12.5), Y(-58)); c.quadraticCurveTo(X(11), Y(-74), X(8.8), Y(-72)); c.moveTo(X(18.5), Y(-58)); c.quadraticCurveTo(X(15), Y(-74), X(9.5), Y(-73.5)); c.stroke();
  await save(cv, 'persona10.png');
}
