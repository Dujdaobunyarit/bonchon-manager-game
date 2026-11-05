// Narration lines per clip, in the order they are spoken. node tools/motion/lines.mjs
import { SCENES } from './scenes.mjs';
export const titleLine = s => `สถานการณ์ที่ ${s.n} ${s.title}`;
export const clipLines = s => [titleLine(s), ...s.beats.map(b => b.say), s.quote];
export const COMMON = ['เรื่องนี้ เกิดขึ้นจริง เดือนที่แล้ว', 'ถ้าน้องที่ต้องไปจัดการเป็น กระทิง อินทรี หนู หมี เราจะสั่งงานอย่างไร?'];
if (process.argv[1].endsWith('lines.mjs')) { for (const s of SCENES) console.log(s.n + '|' + clipLines(s).join(' <long pause> ')); console.log('c|' + COMMON.join(' <long pause> ')); }
