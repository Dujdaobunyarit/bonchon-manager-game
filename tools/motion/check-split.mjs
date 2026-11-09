// Writes each split narration part as a wav so it can be checked by ear or by speech recognition.
import fs from 'fs'; import { execFileSync } from 'child_process';
import { loadVoice, splitVoice, SR } from './engine.mjs'; import { SCENES } from './scenes.mjs'; import { clipLines, COMMON } from './lines.mjs';
const O = process.argv[2]; fs.mkdirSync(O, { recursive: true });
const dump = (n, parts) => parts.forEach((p, i) => { const f = `${O}/${n}_${i}`; fs.writeFileSync(f + '.f32', Buffer.from(p.buffer, p.byteOffset, p.byteLength)); execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', f + '.f32', '-ar', '16000', f + '.wav']); fs.unlinkSync(f + '.f32'); });
for (const s of SCENES) { const L = clipLines(s), use = s.n <= 2 ? L : L.slice(0, -1), parts = splitVoice(loadVoice('s' + s.n), use, s.n === 9 ? [6.26, 9.1, 11.13] : undefined); dump('s' + s.n, parts); console.log(s.n, parts.map(p => (p.length / SR).toFixed(1)).join(' ')); }
dump('c', splitVoice(loadVoice('common'), COMMON));
