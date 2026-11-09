// Dumps every slide's text and speaker notes in show order. node tools/dump-deck.mjs <deck.pptx> <out.txt>
import { execFileSync } from 'child_process'; import fs from 'fs';
const [, , deck, out] = process.argv;
const rd = f => { try { return execFileSync('unzip', ['-p', deck, f], { maxBuffer: 1 << 28 }).toString('utf8'); } catch { return ''; } };
const dec = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const paras = x => [...x.matchAll(/<a:p>([\s\S]*?)<\/a:p>|<a:p [^>]*>([\s\S]*?)<\/a:p>/g)].map(m => dec([...(m[1] ?? m[2]).matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(t => t[1]).join(''))).filter(t => t.trim());
const pres = rd('ppt/presentation.xml'), rels = rd('ppt/_rels/presentation.xml.rels');
const ids = [...pres.matchAll(/<p:sldId [^>]*r:id="([^"]+)"/g)].map(m => m[1]);
const lines = [];
ids.forEach((rid, i) => {
  const tgt = new RegExp(`Id="${rid}"[^>]*Target="([^"]+)"|Target="([^"]+)"[^>]*Id="${rid}"`).exec(rels); const f = 'ppt/' + (tgt[1] || tgt[2]);
  const x = rd(f), hidden = /<p:sld [^>]*show="0"/.test(x);
  lines.push(`\n===== slide ${i + 1}${hidden ? ' (hidden)' : ''} (${f.split('/').pop()}) =====`);
  for (const sp of x.split(/<p:sp>|<p:sp |<p:graphicFrame/).slice(1)) { const nm = /name="([^"]*)"/.exec(sp)?.[1] || ''; const t = paras(sp); if (t.length) lines.push(`[${nm}] ` + t.join(' / ')); }
  const r = rd(f.replace('slides/', 'slides/_rels/') + '.rels'), nf = /Target="\.\.\/notesSlides\/([^"]+)"/.exec(r);
  if (nf) { const n = paras(rd('ppt/notesSlides/' + nf[1])).filter(t => !/^\d+$/.test(t.trim())); if (n.length) lines.push('NOTES: ' + n.join(' / ')); }
});
fs.writeFileSync(out, lines.join('\n')); console.log(ids.length, 'slides');
