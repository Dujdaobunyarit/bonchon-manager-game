// Back office: live answers, staff import, motion upload, export. Opens in its own tab, never on the projector.
const XR = { // reads the first sheet of an .xlsx in the browser; only the needed columns ever leave this device
  async entries(file) {
    const b = new Uint8Array(await file.arrayBuffer()), d = new DataView(b.buffer); let i = b.length - 22;
    while (i >= 0 && d.getUint32(i, true) !== 0x06054b50) i--;
    if (i < 0) throw new Error('ไม่ใช่ไฟล์ .xlsx');
    let n = d.getUint16(i + 10, true), p = d.getUint32(i + 16, true); const out = {}, td = new TextDecoder();
    while (n--) {
      const m = d.getUint16(p + 10, true), cs = d.getUint32(p + 20, true), nl = d.getUint16(p + 28, true), xl = d.getUint16(p + 30, true), cl = d.getUint16(p + 32, true), off = d.getUint32(p + 42, true);
      out[td.decode(b.subarray(p + 46, p + 46 + nl))] = { m, cs, off }; p += 46 + nl + xl + cl;
    }
    return { b, d, out };
  },
  async text(z, name) {
    const e = z.out[name]; if (!e) return null;
    const s = e.off + 30 + z.d.getUint16(e.off + 26, true) + z.d.getUint16(e.off + 28, true), raw = z.b.subarray(s, s + e.cs);
    if (e.m === 0) return new TextDecoder().decode(raw);
    const st = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(st).text();
  },
  async rows(file) {
    const z = await XR.entries(file), P = t => new DOMParser().parseFromString(t, 'application/xml');
    const ss = await XR.text(z, 'xl/sharedStrings.xml'), shared = ss ? [...P(ss).getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].map(t => t.textContent).join('')) : [];
    const wb = P(await XR.text(z, 'xl/workbook.xml')), first = wb.getElementsByTagName('sheet')[0], rid = first.getAttribute('r:id');
    const rels = P(await XR.text(z, 'xl/_rels/workbook.xml.rels')), rel = [...rels.getElementsByTagName('Relationship')].find(r => r.getAttribute('Id') === rid);
    const tg = rel.getAttribute('Target'), path = tg.startsWith('/') ? tg.slice(1) : 'xl/' + tg, sh = P(await XR.text(z, path));
    const col = r => { let c = 0; for (const ch of r.replace(/\d+/g, '')) c = c * 26 + ch.charCodeAt(0) - 64; return c - 1; };
    return [...sh.getElementsByTagName('row')].map(row => {
      const o = [];
      for (const c of row.getElementsByTagName('c')) {
        const t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0], is = c.getElementsByTagName('is')[0];
        o[col(c.getAttribute('r'))] = t === 's' ? shared[+v?.textContent] : t === 'inlineStr' ? [...(is?.getElementsByTagName('t') || [])].map(x => x.textContent).join('') : (v ? v.textContent : '');
      }
      return o;
    });
  },
};
const TPL = {
  equity: { label: 'Equity (EQ)', file: 'template-eq', head: ['Worker', 'Employee ID', 'Worker Status as of Effective Date', 'Location', 'Manager ID', 'กลุ่ม'] },
  franchise: { label: 'Franchise (FR)', file: 'template-fr', head: ['รหัสสาขา', 'ชื่อสาขา', 'รหัสพนักงาน', 'ชื่อ-นามสกุล', 'วันสุดท้ายของการเป็นพนักงาน', 'กลุ่ม'] },
};
function parseStaff(grp, rows) {
  const head = (rows[0] || []).map(h => String(h ?? '').replace(/\s+/g, ' ').trim()), ix = n => head.indexOf(n);
  const need = grp === 'equity' ? ['Worker', 'Employee ID', 'Location'] : ['ชื่อสาขา', 'รหัสพนักงาน', 'ชื่อ-นามสกุล'];
  const miss = need.filter(n => ix(n) < 0);
  if (miss.length) throw new Error(`ไฟล์นี้ไม่ใช่ template ${TPL[grp].label}: ไม่พบคอลัมน์ ${miss.join(', ')}`);
  const out = []; let skipped = 0; const g = ix('กลุ่ม');
  for (const r of rows.slice(1)) {
    if (!r || !r.some(v => String(v ?? '').trim())) continue;
    const loc = String(r[ix(grp === 'equity' ? 'Location' : 'ชื่อสาขา')] ?? '').trim(), store = loc.replace(/^\s*\S*?\d+\s*-\s*/, '').trim(), code = store.split('-')[0].trim();
    const groupV = g >= 0 ? String(r[g] ?? '').trim() : '';
    if (grp === 'equity') {
      const st = ix('Worker Status as of Effective Date'), w = String(r[ix('Worker')] ?? ''), mt = /\(([^)]*)\)/.exec(w), mg = ix('Manager ID');
      if (st >= 0 && /terminat/i.test(String(r[st] ?? ''))) { skipped++; continue; }
      out.push({ id: String(r[ix('Employee ID')] ?? '').trim(), name: (mt ? mt[1] : w).trim(), store, code, managerId: mg >= 0 ? String(r[mg] ?? '').trim() : '', group: groupV });
    } else {
      const end = ix('วันสุดท้ายของการเป็นพนักงาน');
      if (end >= 0 && String(r[end] ?? '').trim()) { skipped++; continue; }
      out.push({ id: String(r[ix('รหัสพนักงาน')] ?? '').trim(), name: String(r[ix('ชื่อ-นามสกุล')] ?? '').replace(/\s+/g, ' ').trim(), store, code, group: groupV });
    }
  }
  return { rows: out, skipped };
}
function saveBlob(blob, name) { const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); }

let boBuilt = false, monT = null, pending = {};
function renderBO() {
  document.body.className = 'bo';
  if (!boBuilt) {
    boBuilt = true;
    app.innerHTML = `<div class="bo-wrap"><header class="bo-head"><h1 class="brush">ระบบ<em>หลังบ้าน</em></h1><span id="boState" class="bo-state"></span><button class="btn k" id="boX">⬇️ ดาวน์โหลด Excel</button></header>
    <section class="bo-sec"><h2>ดูคำตอบสด</h2><p class="sub">หน้านี้ห้ามขึ้น projector เพราะเห็นถูกผิดของทุกกลุ่ม</p><div id="boLive"></div></section>
    <section class="bo-sec"><h2>Import ข้อมูลรายคน</h2><p class="sub">อ่านไฟล์ในเครื่องนี้ และส่งเฉพาะรหัส ชื่อ สาขา กลุ่ม กับรหัสหัวหน้าขึ้นระบบ คนที่ไม่มีในไฟล์จะถูกนำออกจากประเภทนั้น พร้อมผลเกมที่ 1 ของคนนั้น</p><div class="bo-grid">${Object.entries(TPL).map(([k, t]) => `<div class="card" data-grp="${k}"><h3>${t.label}</h3><div class="jump"><button class="btn w tpl">⬇️ Template</button><label class="btn k up">เลือกไฟล์ .xlsx<input type="file" accept=".xlsx" style="display:none"></label></div><div class="res"></div></div>`).join('')}</div></section>
    <section class="bo-sec"><h2>Motion สถานการณ์</h2><p class="sub">ไฟล์ .mp4 ไม่เกิน 50 MB ต่อสถานการณ์ อัปโหลดซ้ำจะแทนไฟล์เดิม ไฟล์เปิดดูได้ถ้ามีลิงก์</p><div id="boVid"></div></section></div>`;
    $('#boX').onclick = exportExcel;
    document.querySelectorAll('[data-grp]').forEach(card => {
      const g = card.dataset.grp, res = card.querySelector('.res');
      card.querySelector('.tpl').onclick = () => saveBlob(MMXlsx([{ name: 'รายชื่อ', head: TPL[g].head, rows: [] }]), TPL[g].file + '.xlsx');
      card.querySelector('input').onchange = async e => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        res.textContent = 'กำลังอ่านไฟล์…';
        try {
          const { rows, skipped } = parseStaff(g, await XR.rows(f));
          if (!rows.length) throw new Error('ไม่พบรายชื่อในไฟล์');
          const j = await rpc('mm_import', { p_token: token, p_grp: g, p_rows: rows, p_dry: true });
          if (j.error) throw new Error(j.error);
          pending[g] = rows;
          res.innerHTML = `<p><b>${esc(f.name)}</b> ${rows.length} คน</p><ul class="bo-list"><li>เพิ่มใหม่ ${j.added}</li><li>อัปเดต ${j.updated}</li><li>นำออก ${j.removed}</li><li>เป็น Area Coach อยู่แล้ว ข้าม ${j.keptCoaches}</li>${skipped ? `<li>พ้นสภาพ ข้าม ${skipped}</li>` : ''}</ul>${j.noGroup.length ? `<p class="warn-t">ยังไม่มีกลุ่ม ${j.noGroup.length} คน: ${j.noGroup.map(x => esc(x.name + ' (' + x.store + ')')).join(', ')}</p>` : ''}${j.invalid.length ? `<p class="warn-t">ข้าม ${j.invalid.length} แถว: ${j.invalid.map(x => esc((x.name || x.id || '-') + ' ' + x.why)).join(', ')}</p>` : ''}<button class="btn go">ยืนยัน Import</button>`;
          res.querySelector('.go').onclick = async ev => {
            ev.target.disabled = true;
            const r = await rpc('mm_import', { p_token: token, p_grp: g, p_rows: pending[g], p_dry: false }).catch(() => ({ error: 'เชื่อมต่อไม่สำเร็จ' }));
            res.textContent = r.error ? r.error : `Import สำเร็จ: เพิ่ม ${r.added} อัปเดต ${r.updated} นำออก ${r.removed}`;
            refreshMon();
          };
        } catch (err) { res.innerHTML = `<p class="warn-t">${esc(err.message || 'อ่านไฟล์ไม่สำเร็จ')}</p>`; }
      };
    });
    drawBoVideos();
  }
  refreshMon();
}
async function refreshMon() {
  clearTimeout(monT); monT = setTimeout(refreshMon, 4000);
  if (document.hidden) return;
  let m; try { m = await rpc('mm_monitor', { p_token: token }); } catch { return; }
  if (m.error) return;
  const live = $('#boLive'); if (!live) return;
  $('#boState').textContent = `${m.phase}${m.title ? ' · ' + m.title : ''}${m.signs != null ? ' · เปิดป้าย ' + m.signs : ''}`;
  const g3 = (m.phase || '').startsWith('g3_') && m.coaches.some(c => c.g3 !== undefined), isG3 = ['g3_board', 'g3_reveal', 'g3_scores'].includes(m.phase), isG2 = ['g2_match', 'g2_reveal', 'g2_scores'].includes(m.phase);
  const tick = t => new Date(t).toLocaleTimeString('th-TH');
  const status = c => {
    if (isG3) return c.g3 ? `<span class="${c.g3.correct ? 'ok' : 'no'}">${c.g3.correct ? '✓ ถูก' : '✗ ผิด'}</span> ${esc(c.g3.choice)} · ป้าย ${c.g3.sign} · ${tick(c.g3.at)} · ${c.g3.pts} pt` : '<span class="wait">ยังไม่ตอบ</span>';
    if (isG2) return c.g2 ? `<span class="${c.g2.correct === 4 ? 'ok' : 'no'}">ถูก ${c.g2.correct}/4</span> · ลำดับ ${c.g2.order} · ${c.g2.pts} pt` : '<span class="wait">ยังไม่ส่ง</span>';
    return c.joined ? 'เข้าแล้ว' : '<span class="wait">ยังไม่เข้า</span>';
  };
  const answered = m.coaches.filter(c => isG3 ? c.g3 : isG2 ? c.g2 : c.joined).length;
  live.innerHTML = `<div class="bo-stats"><div><b>${m.joined}/${m.total}</b>เข้าเกม</div><div><b>${m.g1}</b>ทำเกม 1 แล้ว</div><div><b>${answered}/${m.coaches.length}</b>${isG3 || isG2 ? 'กลุ่มส่งแล้ว' : 'AC เข้าแล้ว'}</div></div>
  <div class="bo-table"><table><thead><tr><th>กลุ่ม</th><th>AC</th><th>สถานะรอบนี้</th><th>คะแนนรวม</th><th>สมาชิกเข้าแล้ว</th></tr></thead><tbody>${m.coaches.map(c => { const g = (m.groups || []).find(x => x.no === c.group) || {}; return `<tr><td>${c.group ?? '-'}</td><td>${esc(c.nick || '')} <small>${esc(c.name)}</small></td><td>${status(c)}</td><td>${c.total ?? 0}</td><td>${g.joined ?? 0}/${(g.members ?? 0) + 1}</td></tr>`; }).join('')}</tbody></table></div>
  ${m.noGroup.length ? `<p class="warn-t">ยังไม่มีกลุ่ม: ${m.noGroup.map(x => esc(`${x.name} (${x.store})`)).join(', ')} แก้ได้โดยใส่เลขกลุ่มในคอลัมน์ "กลุ่ม" แล้ว Import ใหม่</p>` : ''}`;
}
const FN_URL = () => `${CFG.supabaseUrl}/functions/v1/motion-upload`;
async function motionCall(body) { const r = await fetch(FN_URL(), { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CFG.anonKey }, body: JSON.stringify({ token, ...body }) }); return r.json(); }
function drawBoVideos() {
  const el = $('#boVid'); if (!el || !V) return;
  el.innerHTML = V.admin.scenarios.map(x => `<div class="vrow2"><b>${x.n}</b><span>${esc(x.title)}</span><span class="vs" id="bv${x.n}">กำลังเช็ก…</span><label class="btn k up">อัปโหลด<input type="file" accept="video/mp4,.mp4" data-n="${x.n}" style="display:none"></label><button class="btn w del" data-n="${x.n}">ลบ</button></div>`).join('');
  V.admin.scenarios.forEach(x => hasVideo(x.n).then(ok => { const e = $('#bv' + x.n); if (e) { e.textContent = ok ? '✓ มีแล้ว' : 'ยังไม่มี'; e.className = 'vs ' + (ok ? 'ok' : ''); } }));
  el.querySelectorAll('input').forEach(i => i.onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) uploadMotion(+i.dataset.n, f); });
  el.querySelectorAll('.del').forEach(b => b.onclick = async () => { if (!confirm(`ลบ Motion สถานการณ์ที่ ${b.dataset.n}?`)) return; const j = await motionCall({ action: 'delete', n: +b.dataset.n }).catch(() => ({ error: 'เชื่อมต่อไม่สำเร็จ' })); toast(j.error || 'ลบแล้ว'); drawBoVideos(); });
}
async function uploadMotion(n, f) {
  const st = $('#bv' + n), set = t => { if (st) { st.textContent = t; st.className = 'vs'; } };
  if (f.size > 50 * 1024 * 1024) return toast(`ไฟล์ ${(f.size / 1048576).toFixed(0)} MB เกิน 50 MB กรุณาบีบไฟล์ก่อน`);
  if (!/\.mp4$/i.test(f.name) && f.type !== 'video/mp4') return toast('รองรับเฉพาะไฟล์ .mp4');
  set('กำลังเตรียม…');
  const j = await motionCall({ action: 'sign', n }).catch(() => ({ error: 'เชื่อมต่อไม่สำเร็จ' }));
  if (j.error) { set('อัปโหลดไม่สำเร็จ'); return toast(j.error); }
  const x = new XMLHttpRequest(); x.open('PUT', j.url); x.setRequestHeader('x-upsert', 'true'); x.setRequestHeader('content-type', 'video/mp4'); x.setRequestHeader('cache-control', 'max-age=60');
  x.upload.onprogress = e => set(Math.round(e.loaded / e.total * 100) + '%');
  x.onload = () => { if (x.status >= 200 && x.status < 300) { toast('อัปโหลดแล้ว'); drawBoVideos(); } else { set('อัปโหลดไม่สำเร็จ'); toast('อัปโหลดไม่สำเร็จ (' + x.status + ')'); } };
  x.onerror = () => { set('อัปโหลดไม่สำเร็จ'); toast('เน็ตสะดุด ลองอีกครั้ง'); };
  x.send(f);
}
