// Loads groups and staff into the real project through the admin API. node tools/load-roster.mjs [extra-fake-count]
import fs from 'fs';
const R = decodeURIComponent(new URL('..', import.meta.url).pathname), j = f => JSON.parse(fs.readFileSync(R + f, 'utf8'));
const c = fs.readFileSync(R + 'config.js', 'utf8'), U = /supabaseUrl: '([^']+)'/.exec(c)[1], K = /anonKey: '([^']+)'/.exec(c)[1];
const rpc = async (f, b) => { const r = await fetch(`${U}/rest/v1/rpc/${f}`, { method: 'POST', headers: { apikey: K, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); const t = await r.json(); if (!r.ok) throw new Error(f + ' ' + JSON.stringify(t)); return t; };
const pw = j('private/passwords.json'), roster = j('data/roster.json'), mg = j('data/managers.json'), extra = +process.argv[2] || 0;
const A = (await rpc('mm_login', { p_id: pw.adminUser, p_password: pw.admin })).token;
console.log('groups', await rpc('mm_set_groups', { p_token: A, p_groups: j('data/groups-seed.json') }));
// The Stone stores share a code with the Bonchon store in the same mall, so their meeting group (from the slide) is set directly
const row = u => ({ id: u.id, name: u.name, store: u.store, code: u.code || u.store.split('-')[0].trim(), managerId: mg[u.id] || '', ...(u.meet ? { group: String(u.meet) } : {}) });
const eq = roster.filter(u => u.group === 'equity').map(row);
const fr = roster.filter(u => u.group === 'franchise').map(row);
for (let i = 0; i < extra; i++) fr.push({ id: 'T' + (90000 + i), name: 'ทดสอบ ' + i, store: 'BSR-LOAD TEST', code: ['BSR', 'BKH', 'AVA'][i % 3] });
for (const [g, rows] of [['equity', eq], ['franchise', fr]]) { const r = await rpc('mm_import', { p_token: A, p_grp: g, p_rows: rows, p_dry: false }); console.log(g, r.added, r.updated, r.removed, 'noGroup', r.noGroup.length, r.noGroup.map(x => x.store), 'kept', r.keptCoaches); }
console.log(await rpc('mm_admin', { p_token: A, p_body: { cmd: 'resetAll' } }));
