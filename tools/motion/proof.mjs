// Prints every on-screen and spoken line and compares narration with the deck notes.
import fs from 'fs';
import { SCENES } from './scenes.mjs';
const R = decodeURIComponent(new URL('../..', import.meta.url).pathname);
const deck = JSON.parse(fs.readFileSync(R + 'private/motion/scenes.json', 'utf8')), src = fs.readFileSync(R + 'tools/motion/scenes.mjs', 'utf8');
const norm = s => s.replace(/[\s.,]/g, '');
for (const s of SCENES) {
  const d = deck.find(x => +x.no === s.n), said = s.beats.map(b => b.say).join(' ');
  const extra = []; { let a = norm(said), b = norm(d.situation); let i = 0; while (i < a.length && a[i] === b[i]) i++; if (i < Math.max(a.length, b.length)) extra.push(`first difference at "${a.slice(i, i + 16)}" vs deck "${b.slice(i, i + 16)}"`); }
  console.log(`--- ${s.n} ${s.title === d.title ? 'title ok' : 'TITLE DIFF ' + d.title}`);
  console.log('deck :', d.situation); console.log('voice:', said); if (extra.length) console.log('DIFF :', extra[0]);
  console.log('quote:', s.quote);
}
console.log('\nbubbles and labels:', [...new Set([...src.matchAll(/'([^']*[฀-๿][^']*)'/g)].map(m => m[1]))].filter(t => t.length < 34 && !src.includes(`say: '${t}'`)).join(' | '));
