'use strict';
const A = {
  bull:{th:'กระทิง',en:'BULL',dir:'N',strength:'เร็ว ตัดสินใจไว กล้ารับผิดชอบ',gap:'ใจร้อน พูดแรง ข้ามขั้นตอน',borrow:'หนู + หมี',ideal:'ตัดสินใจเร็วแต่พูดสุภาพ สั่งงานด้วย 3Cs ไม่ตะโกน ไม่ข้าม Step',talk:'สั้น ตรง ให้อำนาจ บอกเส้นที่ห้ามข้าม',c:'#e8541e'},
  eagle:{th:'อินทรี',en:'EAGLE',dir:'E',strength:'มองภาพใหญ่ อ่านเกม คิดล่วงหน้า',gap:'เบื่อรายละเอียด ทำไม่จบ',borrow:'หมี',ideal:'Think Ahead แล้ว Follow up จนจบ',talk:'บอกเหตุผล ถามความเห็น กำหนดเวลา',c:'#b9791f'},
  rat:{th:'หนู',en:'RAT',dir:'S',strength:'อบอุ่น เข้าใจคน ทีมรัก',gap:'ไม่กล้าปฏิเสธ เลี่ยงความขัดแย้ง',borrow:'กระทิง',ideal:'ใส่ใจ แต่กล้าเตือนน้องทันทีเมื่อผิดมาตรฐาน และกล้ารับข้อร้องเรียนด้วย BLAST',talk:'อบอุ่น ให้ประโยคสำเร็จรูป ส่งต่อได้',c:'#7c7c88'},
  bear:{th:'หมี',en:'BEAR',dir:'W',strength:'ละเอียด แม่นยำ รักษามาตรฐาน',gap:'ช้า ไม่ยืดหยุ่นตอน Peak',borrow:'อินทรี + กระทิง',ideal:'ยึด SOP แต่จัดลำดับความสำคัญได้ตอน Peak (SEE → PRIORITIZE → ACT)',talk:'ชัดเจน เป็นขั้นตอน บอกลำดับสำคัญ',c:'#a8672a'},
};
const AK = ['bull','eagle','rat','bear'];
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store = { get(k){try{return localStorage.getItem(k)}catch{return null}}, set(k,v){try{localStorage.setItem(k,v)}catch{}}, del(k){try{localStorage.removeItem(k)}catch{}} };
const app = $('#app');
let token = store.get('tok'), V = null, channel = null, clockOff = 0, lastFetch = 0, lastKey = '', seenSigns = -1, rtOK = false, inFlight = false, again = false, refreshT = null;

const setOnce=(el,html)=>{if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html}};
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2600);}
const CFG = window.MM_CONFIG || {};
const sb = supabase.createClient(CFG.supabaseUrl, CFG.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
async function rpc(fn, args){ const { data, error } = await sb.rpc(fn, args); if(error) throw error; return data; }
const act = b => rpc('mm_act',{p_token:token,p_body:b}).then(j=>{refresh();return j}).catch(()=>({error:'เน็ตสะดุด ลองอีกครั้ง'}));
const cmd = b => rpc('mm_admin',{p_token:token,p_body:b}).then(j=>{if(j.error)toast(j.error);refresh();return j}).catch(()=>toast('เชื่อมต่อไม่สำเร็จ'));
function confetti(n=70){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const cols=['#d7141a','#ffc42e','#141414','#fff','#12a150'],host=$('#stage')||document.body;
  const w=host.id==='stage'?1920:innerWidth;
  for(let i=0;i<n;i++){const d=document.createElement('div');d.className='conf';d.style.cssText=`left:${Math.random()*w}px;background:${cols[i%5]};animation-duration:${2+Math.random()*2.5}s;animation-delay:${Math.random()*.8}s;${host.id==='stage'?'position:absolute;':''}`;host.appendChild(d);setTimeout(()=>d.remove(),5500);}
}

/* ---------- login ---------- */
function showLogin(msg){
  document.body.className='';
  app.innerHTML=`<div class="login"><form class="login-card" id="f" autocomplete="off">
    <div class="critters">${AK.map(a=>`<img src="img/${a}.png" alt="">`).join('')}</div>
    <span class="tag k">TEAM BONCHON</span>
    <h1 class="brush">Manager <em>Meeting</em> Game</h1>
    <p>เข้าเล่นด้วยรหัสพนักงานของคุณ</p>
    <label for="id">รหัสพนักงาน</label><input id="id" autocapitalize="off" autocomplete="username" required>
    <label for="pw">รหัสผ่าน</label><input id="pw" type="password" autocomplete="current-password" required>
    <div class="err" id="er">${esc(msg||'')}</div>
    <button class="btn full" id="go">เข้าสู่เกม</button></form></div>`;
  $('#f').onsubmit=async e=>{
    e.preventDefault();const go=$('#go');go.disabled=true;
    try{
      const j=await rpc('mm_login',{p_id:$('#id').value,p_password:$('#pw').value});
      if(j.error){$('#er').textContent=j.error;go.disabled=false;return}
      token=j.token;store.set('tok',token);connect();
    }catch{$('#er').textContent='เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองอีกครั้ง';go.disabled=false}
  };
}
function logout(){store.del('tok');token=null;if(channel)sb.removeChannel(channel);channel=null;V=null;lastKey='';showLogin();}

/* ---------- live updates: a change signal from Supabase, then each device fetches its own view ---------- */
async function refresh(){
  if(!token)return;
  if(inFlight){again=true;return}
  inFlight=true;lastFetch=Date.now();
  let expired=false;
  try{
    const t0=Date.now(),sent=token,m=await rpc('mm_view',{p_token:sent});
    if(sent===token){
      if(m.error==='login')expired=true;
      else{clockOff=m.now+(Date.now()-t0)/2-Date.now();V=m;render()}
    }
  }catch(e){expired=!!(e&&(e.code==='22P02'||/uuid/i.test(e.message||'')))/* other errors: the next poll retries */}
  inFlight=false;
  if(expired){again=false;return logout()}
  if(again){again=false;refresh()}
}
function refreshSoon(ms){if(refreshT)return;refreshT=setTimeout(()=>{refreshT=null;refresh()},ms)}
function connect(){
  refresh();
  if(channel)sb.removeChannel(channel);
  const onChange=()=>refreshSoon(V&&V.admin?250:Math.random()*300);
  channel=sb.channel('mm-tick').on('postgres_changes',{event:'UPDATE',schema:'public',table:'mm_tick'},onChange)
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'mm_tick_admin'},()=>{if(V&&V.admin)onChange()})
    .subscribe(status=>{rtOK=status==='SUBSCRIBED';if(rtOK)refresh()});
}
setInterval(()=>{
  if(!token||!V)return;
  const age=Date.now()-lastFetch,limit=rtOK?(V.admin?10000:8000):(V.admin?2000:4000);
  const due=V.phase==='g2_countdown'&&V.endsAt&&svNow()>=V.endsAt&&age>800;
  if(due||age>limit)refresh();
},500);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&token)refresh()});
const svNow=()=>Date.now()+clockOff;

function render(){ if(V.admin) return renderHost(); renderPlayer(); }

/* ---------- player ---------- */
function keyPlayer(){
  const m=V.me,g=m.g3||{},x=V.g3||{};
  return [V.phase,V.round,V.board,V.recapTab,m.g1||'',m.submitted?1:0,x.signs||0,g.correct?1:0,g.wrongThisSign?1:0,(g.wrong||[]).length].join('|');
}
function renderPlayer(){
  document.body.className='';
  const m=V.me,key=keyPlayer();
  if(!$('.shell'))app.innerHTML=`<div class="shell"><div class="top" id="top"></div><div class="main" id="main"></div></div><div id="ov"></div>`;
  $('#top').innerHTML=`${m.g1?`<img src="img/${m.g1}.png" alt="${A[m.g1].th}">`:''}<div class="nm">${esc(m.name)}<small>${m.level==='L4'?'หัวหน้าทีม · ':''}${esc(m.store)}</small></div>${m.score?`<span class="pts">${m.score.total} pt</span>`:''}<button class="out" id="out">ออก</button>`;
  $('#out').onclick=()=>{if(confirm('ออกจากเกม?'))logout()};
  setOnce($('#ov'),V.board&&V.scoreboard?`<div class="overlay">${boardHTML()}</div>`:'');
  patchPlayer();
  if(key===lastKey)return;
  const prevKey=lastKey;lastKey=key;
  const main=$('#main');
  const fn=PV[V.phase]||PV.idle; fn(main,prevKey);
  window.scrollTo(0,0);
}
function patchPlayer(){
  document.querySelectorAll('[data-b=submitted]').forEach(e=>e.textContent=`${V.submitted??0}/${V.totalPlayers}`);
  document.querySelectorAll('[data-b=cd]').forEach(e=>e.textContent=cdLeft());
}
const cdLeft=()=>Math.max(0,Math.ceil((V.endsAt-svNow())/1000));
setInterval(()=>{if(!V)return;document.querySelectorAll('[data-b=cd]').forEach(e=>{const t=String(cdLeft());if(e.textContent!==t){e.textContent=t;if(V.admin&&+t>0)beep(660,.09)}})},100);
const spectBanner=()=>V.me.canPlay?'':`<div class="spectate">👀 โหมดผู้ชม เกมนี้ Area Coach เป็นคนเล่นนะ</div>`;
function waitHTML(t,s){return `<div class="center"><div class="clock" role="img" aria-label="กำลังรอ"></div><h2 class="h brush">${t}</h2><p class="sub">${s||''}</p></div>`}
function boardHTML(title='สกอร์บอร์ด'){
  const b=V.scoreboard||[],me=V.me&&V.me.id;
  return `<h2 class="h brush" style="margin-bottom:12px">${title}</h2><div class="board">${b.map((r,i)=>`<div class="row ${r.id===me?'me':''}" style="animation-delay:${i*.05}s"><span class="r">${r.rank}</span><span class="n">${esc(r.name)}</span><span class="g">${r.last?'+'+r.last:''}</span><span class="t">${r.total}</span></div>`).join('')}</div>`;
}
function hello(main,h,s){main.innerHTML=`<div class="center"><div class="critters" style="width:min(420px,90%)">${AK.map(a=>`<img src="img/${a}.png" alt="">`).join('')}</div><h2 class="h brush">${h}</h2><p class="sub">${s}</p></div>`}
const PV={
  idle(m){hello(m,`สวัสดี ${esc(V.me.name)}!`,'เข้าเกมเรียบร้อย รอแอดมินเริ่มเกมได้เลย')},
  lobby(m){hello(m,`พร้อมแล้ว ${esc(V.me.name)}!`,'อีกสักครู่เกมจะเริ่ม ดูจอหลักไว้นะ')},
  g1(m){V.me.g1?showResult(m,V.me.g1):quiz(m)},
  g1_end(m){V.me.g1?showResult(m,V.me.g1):quiz(m)},
  g2_intro(m){m.innerHTML=`${spectBanner()}<div class="center"><span class="tag">เกมที่ 2</span><h2 class="h brush">สั่งงานให้<em>ตรงประเภท</em></h2><div class="rules"><div>ดูสถานการณ์บนจอหลัก แล้วโยงคำสั่งให้ตรงกับสัตว์ทั้ง 4 ตัว</div><div>ถูกครบเร็วที่สุดได้โบนัส <b>15 pt</b> คนถัดไป <b>14 pt</b> ไล่ลงไป</div><div>มีทั้งหมด <b>${V.g2N} สถานการณ์</b> คะแนนสะสมต่อเนื่อง</div></div></div>`},
  g2_motion(m){m.innerHTML=`${spectBanner()}<div class="center"><span class="tag">สถานการณ์ที่ ${V.scenario.n}/${V.g2N}</span><h2 class="h brush">ดูจอหลักเลย!</h2><p class="scen">${esc(V.scenario.title)}</p><p class="sub">${esc(V.scenario.situation)}</p></div>`},
  g2_countdown(m){m.innerHTML=`${spectBanner()}<div class="center"><p class="sub">เตรียมตัว…</p><div class="big" style="font-size:clamp(120px,35vw,240px);font-weight:800;color:var(--red);line-height:1" data-b="cd">${cdLeft()}</div></div>`},
  g2_match(m){
    if(!V.me.canPlay) return spectMatch(m);
    if(V.me.submitted) return m.innerHTML=waitHTML('ส่งแล้ว รอเฉลยนะ','แอดมินกำลังรอทุกคน · ส่งแล้ว <span data-b="submitted"></span>')+'',patchPlayer();
    linkGame(m);
  },
  g2_reveal(m){
    const r=V.me.result;
    const yours=V.me.canPlay?`<div class="yours">${r?`ถูก ${r.correct}/4 คู่ ได้ <b>+${r.pts} pt</b>${r.bonus?` (โบนัส ${r.bonus})`:''}`:'รอบนี้ไม่ได้ส่งคำตอบ'}</div>`:'';
    const wrong=V.recapTab==='wrong';
    m.innerHTML=`${spectBanner()}${yours}<div class="round">เฉลย สถานการณ์ที่ ${V.scenario.n}</div><h2 class="scen" style="margin-bottom:4px">${esc(V.scenario.title)}</h2><p class="sub" style="margin-bottom:12px">เป้าหมาย: ${esc(V.scenario.goal)}</p>
    ${V.answer.map(x=>`<div class="rcard"><img src="img/${x.a}.png" alt=""><div><b>${A[x.a].th}</b>${wrong?`<small>ถ้าพูดว่า: ${esc(x.wrong.say)}</small>→ ${esc(x.wrong.result)}`:esc(x.cmd)}</div></div>`).join('')}`;
    if(r&&r.correct===4)confetti(40);
  },
  g2_scores(m){m.innerHTML=boardHTML(`คะแนนหลังสถานการณ์ที่ ${V.scenario.n}`)},
  g2_end(m){m.innerHTML=boardHTML('จบเกมที่ 2')},
  g3_intro(m){m.innerHTML=`${spectBanner()}<div class="center"><span class="tag">เกมที่ 3</span><h2 class="h brush">แฟน<em>พันธุ์แท้</em> ลูกค้า</h2><div class="rules"><div>เปิดป้ายทีละแผ่น ทายให้ถูกว่าคือลูกค้าคนไหน</div><div>ยิ่งเปิดป้ายน้อย ยิ่งได้เยอะ <b>100 → 75 → 50 → 25 pt</b></div><div>ตอบถูกเร็วได้โบนัสเพิ่ม <b>15, 14, 13…</b></div><div>ตอบผิดต้องรอป้ายถัดไปจึงตอบใหม่ได้</div></div></div>`},
  g3_board:g3Player,
  g3_reveal(m){
    const p=V.g3.persona,r=V.me.result;
    const yours=V.me.canPlay?`<div class="yours">${r&&r.sign!=null?`ถูกตอนป้ายที่ ${r.sign+1} ได้ <b>+${r.pts} pt</b> (โบนัส ${r.bonus})`:r&&r.pts<0?`รอบนี้ <b>${r.pts} pt</b>`:'รอบนี้ยังไม่ได้คะแนน'}</div>`:'';
    m.innerHTML=`${spectBanner()}${yours}<div class="center" style="min-height:0"><img class="reveal-img" src="img/${p.img}" alt=""><h2 class="h brush">${esc(p.name)}</h2><p class="tag">${esc(p.tag)}</p></div><div class="signs">${V.g3.clues.map((c,i)=>`<div class="sign"><span>${esc(c)}</span></div>`).join('')}</div>`;
    if(r&&r.sign!=null)confetti(40);
  },
  g3_scores(m){m.innerHTML=boardHTML(`คะแนนหลังคนที่ ${V.round+1}`)},
  final(m){
    const b=V.scoreboard||[];
    m.innerHTML=`<div class="center" style="min-height:0;margin-bottom:14px"><div style="font-size:64px">🏆</div><h2 class="h brush">ขอบคุณที่ร่วมสนุก!</h2></div>${boardHTML('อันดับสุดท้าย')}`;
    if(b[0]&&b[0].id===V.me.id)confetti(120);
  },
};
function showResult(m,a){
  const d=A[a],c=V.me.g1Counts,p=V.me.promise||{};
  m.innerHTML=`<div class="center"><p class="sub">คุณคือ…</p><img class="hero a-${a}" src="img/${a}.png" alt="${d.th}"><h2 class="h brush"><em>${d.th}</em> ${d.en}</h2><div class="sticker">ติดสติ๊กเกอร์${d.th}ได้เลย!</div>
  ${c?`<p class="sub">A ${c.bull} · B ${c.eagle} · C ${c.rat} · D ${c.bear}</p>`:''}
  <div class="traits"><div class="card"><b style="color:var(--good)">จุดแข็งที่เก็บไว้</b><br>${d.strength}</div><div class="card"><b style="color:var(--red)">Gap ที่ต้องปิด</b><br>${d.gap}</div><div class="card"><b>ยืมจุดแข็งจาก</b><br>${d.borrow}</div><div class="card"><b>GEL ที่สมบูรณ์แบบ</b><br>${d.ideal}</div><div class="card"><b>พูดกับคุณแบบนี้ได้ผลที่สุด</b><br>${d.talk}</div>
  <form class="card" id="gp"><b style="color:var(--red)">GEL Promise</b><label for="pg">Gap ของฉันคือ</label><input id="pg" maxlength="300" value="${esc(p.gap)}"><label for="pn">Shift ถัดไปฉันจะ</label><input id="pn" maxlength="300" value="${esc(p.next)}"><button class="btn k full">บันทึก</button></form></div></div>`;
  $('#gp',m).onsubmit=async e=>{e.preventDefault();const j=await act({type:'g1promise',gap:$('#pg',m).value,next:$('#pn',m).value});toast(j.error||'บันทึกแล้ว')};
  confetti();
}
async function quiz(m){
  const ck='q:'+V.me.id; let S; try{S=JSON.parse(store.get(ck))}catch{} S=S||{a:[]};
  if(!quiz.Q){quiz.Q=(await rpc('mm_assessment',{p_token:token})).questions;}
  const Q=quiz.Q; let i=Math.min(S.a.length,Q.length-1);
  function draw(){
    const q=Q[i];
    m.innerHTML=`<div class="round">แบบประเมินคาแรกเตอร์ · ข้อ ${i+1}/${Q.length}</div><div class="progress"><i style="width:${i/Q.length*100}%"></i></div><p class="sub" style="margin-bottom:8px">เลือกตามที่ทำจริงในร้าน ไม่ใช่ตามที่อยากเป็น ไม่มีคำตอบถูกหรือผิด</p><p class="q">${esc(q.q)}</p><div class="opts">${q.options.map((t,n)=>`<button class="opt ${S.a[i]===n?'sel':''}" data-n="${n}"><b>${'ABCD'[n]}</b>&nbsp; ${esc(t)}</button>`).join('')}</div>${i?'<button class="back" id="bk">← ข้อก่อนหน้า</button>':''}`;
    m.querySelectorAll('.opt').forEach(b=>b.onclick=async()=>{
      S.a[i]=+b.dataset.n;store.set(ck,JSON.stringify(S));b.classList.add('sel');
      if(i<Q.length-1){i++;setTimeout(draw,130);return}
      m.querySelectorAll('.opt').forEach(x=>x.disabled=true);
      const j=await act({type:'g1',answers:S.a});
      if(j.error){toast(j.error);m.querySelectorAll('.opt').forEach(x=>x.disabled=false);return}
      store.del(ck);V.me.g1=j.animal;V.me.g1Counts=j.counts;lastKey=keyPlayer();showResult(m,j.animal);renderPlayer();
    });
    if(i)$('#bk',m).onclick=()=>{i--;draw()};
    window.scrollTo(0,0);
  }
  draw();
}
function spectMatch(m){
  m.innerHTML=`${spectBanner()}<div class="round">สถานการณ์ที่ ${V.scenario.n}/${V.g2N}</div><h2 class="scen">${esc(V.scenario.title)}</h2><p class="sub" style="margin:6px 0 12px">${esc(V.scenario.situation)}</p>${V.cards.map(c=>`<div class="rcard" style="grid-template-columns:1fr">${esc(c.t)}</div>`).join('')}<p class="sub" style="text-align:center">ส่งแล้ว <span data-b="submitted"></span></p>`;patchPlayer();
}
let LG={round:-1,order:[],map:{},sel:null};
function linkGame(m){
  const round=V.round;
  if(LG.round!==round){LG={round,order:V.cards.map(c=>c.id).sort(()=>Math.random()-.5),map:{},sel:null};}
  const text=Object.fromEntries(V.cards.map(c=>[c.id,c.t]));
  m.innerHTML=`<div class="round">สถานการณ์ที่ ${V.scenario.n}/${V.g2N}</div><h2 class="scen">${esc(V.scenario.title)}</h2><p class="sub">แตะสัตว์ แล้วแตะคำสั่งที่เหมาะ หรือลากเส้นโยงก็ได้</p>
  <div class="link" id="lk"><svg id="ln" aria-hidden="true"></svg><div class="lcol an">${AK.map(a=>`<button class="node anode" data-a="${a}"><img src="img/${a}.png" alt="" draggable="false">${A[a].th}</button>`).join('')}</div><div class="lcol cdc" id="cds"></div></div>
  <div class="actions"><button class="btn k" id="sh">🔀 สับการ์ด</button><button class="btn grow" id="sb">ส่งคำตอบ</button></div>`;
  const lk=$('#lk',m),cds=$('#cds',m),svg=$('#ln',m);
  function drawCards(){cds.innerHTML=LG.order.map(id=>`<button class="node cnode" data-c="${id}">${esc(text[id])}</button>`).join('');paint()}
  function paint(){
    const owner=Object.fromEntries(Object.entries(LG.map).map(([a,c])=>[c,a]));
    lk.querySelectorAll('.anode').forEach(n=>{n.classList.toggle('sel',LG.sel===n.dataset.a);n.classList.toggle('on',!!LG.map[n.dataset.a]);n.style.borderColor=LG.map[n.dataset.a]?A[n.dataset.a].c:'';n.setAttribute('aria-pressed',LG.sel===n.dataset.a)});
    lk.querySelectorAll('.cnode').forEach(n=>{const a=owner[n.dataset.c];n.classList.toggle('on',!!a);n.style.borderColor=a?A[a].c:'';const old=n.querySelector('img');if(old)old.remove();if(a){const i=new Image();i.src=`img/${a}.png`;i.alt=A[a].th;n.prepend(i)}});
    const n=Object.keys(LG.map).length,sb=$('#sb',m);sb.disabled=n<4;sb.textContent=n<4?`โยงแล้ว ${n}/4`:'ส่งคำตอบ';
    lines();
  }
  function lines(tmp){
    const base=lk.getBoundingClientRect();let s='';
    const pos=(el,side)=>{const r=el.getBoundingClientRect();return[(side?r.left:r.right)-base.left,r.top+r.height/2-base.top]};
    for(const a of AK){const c=LG.map[a];if(!c)continue;const e1=lk.querySelector(`[data-a=${a}]`),e2=lk.querySelector(`[data-c="${c}"]`);if(!e2)continue;const[x1,y1]=pos(e1,0),[x2,y2]=pos(e2,1),dx=(x2-x1)/2;s+=`<path d="M${x1} ${y1} C${x1+dx} ${y1},${x2-dx} ${y2},${x2} ${y2}" stroke="${A[a].c}" stroke-width="5" fill="none" stroke-linecap="round"/>`}
    if(tmp){const[x1,y1]=tmp.from;s+=`<path d="M${x1} ${y1} L${tmp.x-base.left} ${tmp.y-base.top}" stroke="#d7141a" stroke-width="4" stroke-dasharray="8 6" fill="none"/>`}
    svg.innerHTML=s;
  }
  function pair(a,c){for(const k of AK)if(LG.map[k]===c)delete LG.map[k];LG.map[a]=c;LG.sel=null;paint()}
  let drag=null;
  lk.onpointerdown=e=>{const n=e.target.closest('.anode');if(!n)return;drag={a:n.dataset.a,x0:e.clientX,y0:e.clientY,moved:false,from:(()=>{const b=lk.getBoundingClientRect(),r=n.getBoundingClientRect();return[r.right-b.left,r.top+r.height/2-b.top]})()};n.setPointerCapture&&n.setPointerCapture(e.pointerId)};
  lk.onpointermove=e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>8)drag.moved=true;if(drag.moved)lines({from:drag.from,x:e.clientX,y:e.clientY})};
  lk.onpointerup=e=>{if(!drag)return;const d=drag;drag=null;if(d.moved){const t=document.elementFromPoint(e.clientX,e.clientY),c=t&&t.closest('.cnode');if(c)pair(d.a,c.dataset.c);else paint();lk.dataset.skip='1';setTimeout(()=>delete lk.dataset.skip,50)}};
  lk.onpointercancel=()=>{drag=null;paint()};
  lk.onclick=e=>{
    if(lk.dataset.skip)return;
    const an=e.target.closest('.anode'),cn=e.target.closest('.cnode');
    if(an){const a=an.dataset.a;LG.sel=LG.sel===a?null:a;paint();return}
    if(cn){const c=cn.dataset.c;
      if(LG.sel)return pair(LG.sel,c);
      const own=AK.find(k=>LG.map[k]===c);
      if(own){delete LG.map[own];LG.sel=own;paint()}else toast('แตะเลือกสัตว์ก่อนนะ');
    }
  };
  $('#sh',m).onclick=()=>{LG.order.sort(()=>Math.random()-.5);drawCards();lk.classList.remove('shake');void lk.offsetWidth;lk.classList.add('shake')};
  $('#sb',m).onclick=async()=>{
    const b=$('#sb',m);b.disabled=true;
    const j=await act({type:'g2',map:LG.map});
    if(j.error){toast(j.error);b.disabled=false}
  };
  drawCards();
  window.onresize=()=>{if(lk.isConnected)lines()};
}
function g3Player(m){
  const g=V.g3,me=V.me.g3||{},can=V.me.canPlay;
  const isNew=g.signs>seenSigns?g.signs-1:-1;seenSigns=g.signs;
  const signs=g.clues.map((c,i)=>c?`<div class="sign ${i===isNew?'flip':''}"><span>${esc(c)}</span><span class="p">${g.signPoints[i]} pt</span></div>`:`<div class="sign closed"><span>ป้ายที่ ${i+1}</span><span class="p">${g.signPoints[i]} pt</span></div>`).join('');
  let note='';
  if(can){
    if(me.correct)note='<div class="notice g">ถูกต้อง! รอเฉลยพร้อมกันนะ</div>';
    else if(!g.signs)note='<div class="notice g" style="background:#eee;color:#555">รอเปิดป้ายแรก…</div>';
    else if(me.wrongThisSign)note='<div class="notice">ยังไม่ใช่! รอป้ายถัดไปแล้วตอบใหม่</div>';
  }
  const lock=!can||me.correct||!g.signs||me.wrongThisSign;
  m.innerHTML=`${spectBanner()}<div class="round">คนที่ ${V.round+1}/${V.g3N} · เค้าคือใคร?</div>${note}${me.correct?`<div class="center" style="min-height:0;margin:8px 0"><div class="clock" style="width:80px;height:80px;border-width:7px"></div></div>`:''}<div class="signs">${signs}</div>
  <div class="choices">${V.choices.map(c=>`<button class="choice ${(me.wrong||[]).includes(c.id)?'x':''}" data-c="${c.id}" ${lock||(me.wrong||[]).includes(c.id)?'disabled':''}><img src="img/${c.img}" alt="">${esc(c.name)}</button>`).join('')}</div>`;
  m.querySelectorAll('.choice:not([disabled])').forEach(b=>b.onclick=async()=>{
    m.querySelectorAll('.choice').forEach(x=>x.disabled=true);
    const j=await act({type:'g3',choice:b.dataset.c});
    if(j.error){toast(j.error);lastKey='';renderPlayer()}
  });
}

/* ---------- projector / admin ---------- */
let audio=null,muted=false;
function beep(f,d){if(muted)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;g.gain.value=.15;g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch{}}
const fanfare=()=>[523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,.22),i*130));
function fit(){const s=$('#stage');if(!s)return;const k=Math.min(innerWidth/1920,innerHeight/1080);s.style.transform=`scale(${k}) translate(-50%,-50%)`}
addEventListener('resize',fit);
let panelOpen=false,barHidden=false;
function keyHost(){const g=V.g3||{};return [V.phase,V.round,V.board,V.recapTab,g.signs||0].join('|')}
function renderHost(){
  document.body.className='host';
  if(!$('#stage')){app.innerHTML=`<div id="stage"><div class="brand">TEAM <i>BONCHON</i></div><div id="scr"></div><div id="ovl"></div><div class="bar" id="bar"></div><div id="pn"></div></div>`;fit();}
  $('#stage').classList.toggle('nobar',barHidden);$('#stage').classList.toggle('deco',['idle','lobby','g2_intro','g3_intro','g1'].includes(V.phase));
  drawBar();
  patchHost();
  const key=keyHost();
  if(key!==lastKey){const old=lastKey;lastKey=key;
    (HV[V.phase]||HV.idle)($('#scr'),old);patchHost();
  }
  setOnce($('#ovl'),V.board&&V.scoreboard?`<div class="hboard-ov"><h2 class="t2 brush">สกอร์<em>บอร์ด</em></h2>${hBoard()}</div>`:'');
  
}
function drawBar(){
  const a=V.admin;
  $('#bar').innerHTML=`<button class="btn ghost ${V.board?'on':''}" id="bBoard">🏆 สกอร์บอร์ด</button>
    ${V.phase==='g2_reveal'?`<button class="btn ghost ${V.recapTab==='wrong'?'on':''}" id="bWrong">ถ้าพูดผิดสไตล์</button>`:''}
    <button class="btn ghost" id="bSet">⚙️ ตั้งค่า</button><button class="btn ghost" id="bFs">⛶</button><button class="btn ghost" id="bMute">${muted?'🔇':'🔊'}</button>
    <span class="stat">เข้าแล้ว ${a.joined.length}/${V.totalUsers}</span>
    ${a.draftAssessment?'<span class="warn">เกม 1 ใช้คำถามทดสอบ</span>':''}
    ${a.nextLabel?`<button class="btn primary" id="bNext">${esc(a.nextLabel)}</button>`:'<span style="margin-left:auto"></span>'}`;
  $('#bBoard').onclick=()=>cmd({cmd:'board',on:!V.board});
  if($('#bWrong'))$('#bWrong').onclick=()=>cmd({cmd:'recapTab',tab:V.recapTab==='wrong'?'answer':'wrong'});
  $('#bSet').onclick=openPanel;
  $('#bFs').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
  $('#bMute').onclick=()=>{muted=!muted;drawBar()};
  if($('#bNext'))$('#bNext').onclick=()=>{beep(880,.08);cmd({cmd:'next'})};
}
document.addEventListener('keydown',e=>{
  if(!V||!V.admin||panelOpen||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(e.key===' '||e.key==='ArrowRight'){e.preventDefault();if(V.admin.nextLabel)cmd({cmd:'next'})}
  if(e.key==='b')cmd({cmd:'board',on:!V.board});
  if(e.key==='h'){barHidden=!barHidden;renderHost()}
  if(e.key==='f')document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
});
function patchHost(){
  const set=(b,t)=>document.querySelectorAll(`#scr [data-b=${b}]`).forEach(e=>{if(e.textContent!==String(t))e.textContent=t});
  set('submitted',`${V.submitted??0}/${V.totalPlayers}`);
  set('joined',V.admin.joined.length);
  if(V.g1Done!=null){set('g1done',V.g1Done);for(const a of AK)set('n-'+a,V.g1Counts[a])}
  if(V.g3){set('answered',V.g3.correctCount)}
  const chips=$('#chips');
  if(chips){const have=chips.children.length;const list=V.admin.joined;for(let i=have;i<list.length;i++){const d=document.createElement('span');d.className='chip '+(list[i].l==='L4'?'l4':'');d.textContent=list[i].n;chips.appendChild(d)}}
}
function hBoard(){return `<div class="hboard" style="grid-template-rows:repeat(${Math.max(1,(V.scoreboard||[]).length)},1fr)">${(V.scoreboard||[]).map((r,i)=>`<div class="hrow ${i===0&&r.total>0?'top1':''}" style="animation-delay:${i*.06}s"><span class="r">${r.rank}</span><span>${esc(r.name)}</span><span class="g">${r.last?'+'+r.last:''}</span><span class="t">${r.total}</span></div>`).join('')}</div>`}
function introHost(s,tag,t,lines,img){s.innerHTML=`<div class="scr c"><span class="tag" style="font-size:40px">${tag}</span><h1 class="t1 brush" style="margin:16px 0 26px">${t}</h1><div style="display:flex;gap:30px;align-items:center;font-size:36px;text-align:left">${img?`<img src="${img}" alt="" style="height:440px;border-radius:20px">`:''}<div class="rules" style="width:1100px">${lines.map(l=>`<div>${l}</div>`).join('')}</div></div></div>`}
const HV={
  idle(s){s.innerHTML=`<div class="scr c"><div class="critters" style="width:800px;margin-bottom:10px">${AK.map(a=>`<img src="img/${a}.png" alt="">`).join('')}</div><h1 class="t1 brush">Manager <em>Meeting</em> Game</h1><p class="t3" style="color:var(--mute);margin-top:12px">กด Launch เมื่อพร้อมให้ทุกคนเข้าเกม</p></div>`},
  lobby(s){
    const url=location.origin+location.pathname;let svg='';
    try{const q=qrcode(0,'M');q.addData(url);q.make();svg=q.createSvgTag({scalable:true,margin:2})}catch{}
    s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:12px">สแกนเข้าเกม<em>เลย!</em></h1><div class="lobby"><div class="qr">${svg}<div class="url">${esc(url)}</div><div style="color:var(--mute);font-size:22px">ล็อกอินด้วยรหัสพนักงาน</div></div><div style="display:flex;flex-direction:column;min-height:0"><div><span class="big" data-b="joined">0</span> <span class="t3">/ ${V.totalUsers} คน</span></div><div class="chips" id="chips"></div></div></div></div>`;
  },
  g1(s){s.innerHTML=`<div class="scr"><span class="tag" style="font-size:30px;align-self:flex-start;margin-top:14px">เกมที่ 1</span><h1 class="t2 brush" style="margin-top:8px">เราคือสัตว์<em>ประเภทไหน?</em></h1><p class="t3"><span data-b="g1done" style="color:var(--red);font-weight:800;font-size:72px">0</span> / ${V.totalUsers} คน ทำเสร็จแล้ว</p>${dist()}</div>`},
  g1_end(s){s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:16px">ทีมเราเป็น<em>แบบนี้!</em></h1><p class="t3"><span data-b="g1done" style="color:var(--red);font-weight:800">0</span> คน ได้รับสติ๊กเกอร์ของตัวเอง</p>${dist()}</div>`;fanfare();confetti(90)},
  g2_intro(s){introHost(s,'เกมที่ 2','สั่งงานให้<em>ตรงประเภท</em>',['ดูสถานการณ์ แล้ว Area Coach โยงคำสั่งให้ตรงกับสัตว์ทั้ง 4 ตัว','ถูกครบเร็วที่สุดได้โบนัส <b>15 pt</b> คนถัดไป <b>14 pt</b> ไล่ลงไป',`ทั้งหมด <b>${V.g2N} สถานการณ์</b> Store Manager ร่วมลุ้นบนจอ`])},
  g2_motion(s){
    const n=V.scenario.n;
    s.innerHTML=`<div class="scr c"><span class="tag" style="font-size:40px">สถานการณ์ที่ ${n}/${V.g2N}</span><h1 class="t1 brush" style="margin:22px 0;max-width:1650px">${esc(V.scenario.title)}</h1><p class="t3" style="max-width:1400px;font-size:48px">${esc(V.scenario.situation)}</p><p id="noMotion" style="color:var(--mute);margin-top:26px;font-size:24px"></p></div>`;
    hasVideo(n).then(ok=>{
      if(V.phase!=='g2_motion'||V.scenario.n!==n)return;
      if(!ok){const e=$('#noMotion');if(e)e.textContent=`ยังไม่มี Motion ของสถานการณ์นี้ (อัปโหลดเป็น s${n}.mp4)`;return}
      s.innerHTML=`<div class="motion"><video id="mv" playsinline controls src="${esc(videoUrl(n))}"></video></div>`;
      const v=$('#mv');v.onended=()=>{if(V.phase==='g2_motion')cmd({cmd:'next'})};v.play().catch(()=>toast('กดปุ่มเล่นบนวิดีโอ'));
    });
  },
  g2_countdown(s){s.innerHTML=`<div class="scr c"><p class="t3">เตรียมโยงคำสั่ง!</p><div class="cd go" data-b="cd">${cdLeft()}</div><p class="t2 brush">${esc(V.scenario.title)}</p></div>`},
  g2_match(s){s.innerHTML=`<div class="scr"><div style="display:flex;gap:18px;align-items:baseline;margin-top:12px"><span class="tag" style="font-size:28px">สถานการณ์ที่ ${V.scenario.n}/${V.g2N}</span><h1 class="t2 brush" style="font-size:54px">${esc(V.scenario.title)}</h1></div><div class="hanimals">${AK.map(a=>`<div class="hanimal"><img src="img/${a}.png" alt=""><div><b>${A[a].th}</b><small>${A[a].talk}</small></div></div>`).join('')}</div><div class="hmatch"><div class="hcards">${V.cards.map(c=>`<div class="hcard">${esc(c.t)}</div>`).join('')}</div><div class="hside"><div class="clock"></div><div class="t3">ส่งแล้ว</div><div class="big" style="font-size:96px" data-b="submitted"></div></div></div></div>`},
  g2_reveal(s){
    const w=V.recapTab==='wrong';
    s.innerHTML=`<div class="scr"><div style="display:flex;gap:18px;align-items:baseline;margin-top:12px"><span class="tag" style="font-size:28px">${w?'ถ้าพูดผิดสไตล์':'เฉลย'}</span><h1 class="t2 brush" style="font-size:54px">${esc(V.scenario.title)}</h1></div><p style="font-size:28px;color:var(--mute)">เป้าหมายร่วม: ${esc(V.scenario.goal)} ${w?'':` · ตอบถูกครบ ${V.allCorrect??0} คน`}</p><div class="recap">${V.answer.map(x=>`<div class="rc"><img src="img/${x.a}.png" alt=""><h3>${A[x.a].th}</h3>${w?`<p class="bad">✗ ${esc(x.wrong.say)}</p><p>→ ${esc(x.wrong.result)}</p>`:`<p>${esc(x.cmd)}</p>`}</div>`).join('')}</div></div>`;
    if(!w)fanfare();
  },
  g2_scores(s){s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:12px">สกอร์บอร์ด <em>หลังสถานการณ์ที่ ${V.scenario.n}</em></h1>${hBoard()}</div>`},
  g2_end(s){s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:12px">จบ<em>เกมที่ 2</em></h1>${hBoard()}</div>`;fanfare()},
  g3_intro(s){introHost(s,'เกมที่ 3','แฟน<em>พันธุ์แท้</em> ลูกค้า',['เปิดป้ายทีละแผ่น ทายให้ถูกว่าคือลูกค้าคนไหน','ยิ่งเปิดน้อยยิ่งได้เยอะ <b>100 → 75 → 50 → 25 pt</b>','ตอบถูกเร็วได้โบนัสเพิ่ม <b>15, 14, 13…</b>'],'img/personas-all.jpg')},
  g3_board(s){
    const g=V.g3,isNew=g.signs>seenSigns?g.signs-1:-1;seenSigns=g.signs;if(isNew>=0)beep(720,.15);
    s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:12px">เค้าคือ<em>ใคร?</em> <span style="font-size:32px;color:var(--mute);font-style:normal;font-weight:500">คนที่ ${V.round+1}/${V.g3N}</span></h1><div class="g3grid"><div class="g3side"><div class="mystery">?</div><div class="t3">ตอบถูกแล้ว <b data-b="answered" style="color:var(--red)">0</b>/${V.totalPlayers} คน</div></div><div class="hsigns">${g.clues.map((c,i)=>c?`<div class="hsign ${i===isNew?'flip':''}"><span>${esc(c)}</span><span class="p">${g.signPoints[i]} pt</span></div>`:`<div class="hsign closed"><span>ป้ายที่ ${i+1}</span><span class="p">${g.signPoints[i]} pt</span></div>`).join('')}</div></div></div>`;
  },
  g3_reveal(s){
    const g=V.g3,p=g.persona;seenSigns=-1;
    s.innerHTML=`<div class="scr"><div class="g3grid" style="margin-top:28px"><div class="g3side"><img class="pic" src="img/${esc(p.img)}" alt=""></div><div style="display:flex;flex-direction:column;justify-content:center;min-height:0"><h1 class="t1 brush"><em>${esc(p.name)}</em></h1><p class="tag" style="font-size:42px;align-self:flex-start;margin:8px 0 18px">${esc(p.tag)}</p><div class="hsigns" style="flex:none;gap:10px">${g.clues.map(c=>`<div class="hsign" style="min-height:72px;font-size:32px"><span>${esc(c)}</span></div>`).join('')}</div><p class="t3" style="margin-top:14px">ตอบถูก ${g.correctCount}/${V.totalPlayers} คน</p></div></div></div>`;
    fanfare();
  },
  g3_scores(s){s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:12px">สกอร์บอร์ด <em>หลังคนที่ ${V.round+1}</em></h1>${hBoard()}</div>`},
  final(s){
    const b=V.scoreboard||[],o=[b[1],b[0],b[2]],cl=['p2','p1','p3'],md=['🥈','🥇','🥉'];
    s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:12px;text-align:center">สุดยอด<em>แฟนพันธุ์แท้!</em></h1><div class="podium">${o.map((r,i)=>r?`<div class="pod ${cl[i]}"><div class="m">${md[i]}</div><div class="nm">${esc(r.name)}</div><div class="sc">${r.total}</div></div>`:'<div></div>').join('')}</div></div>`;
    fanfare();confetti(160);setTimeout(()=>confetti(120),1800);
  },
};
const videoUrl=n=>`${CFG.supabaseUrl}/storage/v1/object/public/motions/s${n}.mp4`;
const hasVideo=n=>fetch(videoUrl(n),{method:'HEAD',cache:'no-store'}).then(r=>r.ok).catch(()=>false);
function dist(){return `<div class="dist">${AK.map(a=>`<div class="dcol"><img class="${V.phase==='g1_end'?'a-'+a:''}" src="img/${a}.png" alt=""><div class="n" data-b="n-${a}">0</div><div class="l">${A[a].th}</div><small>${A[a].strength}</small></div>`).join('')}</div>`}

/* settings panel */
function openPanel(){
  panelOpen=true;const a=V.admin,s=a.settings;
  $('#pn').innerHTML=`<div class="panel"><button class="x" id="pX">ปิด</button><h2>ตั้งค่าเกม</h2>
  <h3>คะแนน</h3><div class="grid">
    <div><label>เกม 2: คะแนนต่อคู่ที่ถูก</label><input id="sPair" type="number" min="0" value="${s.pairPoints}"></div>
    <div><label>โบนัสคนแรก (ลดทีละ 1)</label><input id="sBonus" type="number" min="0" value="${s.bonusStart}"></div>
    <div><label>เกม 3: หักคะแนนเมื่อตอบผิด</label><input id="sPen" type="number" min="0" value="${s.wrongPenalty}"></div>
    <div><label>เกม 3: จำนวนแผ่นป้าย (1–5)</label><input id="sCount" type="number" min="1" max="5" value="${s.signCount}"></div>
    <div style="grid-column:span 2"><label>คะแนนแต่ละป้าย คั่นด้วยจุลภาค</label><input id="sPts" value="${s.signPoints.join(', ')}"></div>
  </div><button class="btn" id="sSave" style="margin-top:12px;min-height:44px">บันทึกคะแนน</button>
  <p style="color:var(--mute);font-size:17px;margin-top:6px">จำนวนป้ายมีผลกับคนที่ยังไม่เริ่มเล่น สมชายมีคำใบ้ 4 ข้อจึงเปิดได้สูงสุด 4 ป้าย</p>
  <h3>Motion สถานการณ์ (เกม 2)</h3><p style="color:var(--mute);font-size:18px">อัปโหลดที่ Supabase &gt; Storage &gt; motions ตั้งชื่อ s1.mp4 ถึง s10.mp4 แล้วกดเช็ก</p><button class="btn w" id="vChk" style="min-height:40px;margin-bottom:6px">เช็กไฟล์อีกครั้ง</button><div id="vids"></div>
  <h3>ข้ามไปหน้าอื่น</h3><div class="jump">
    <select id="jg">${[['lobby','Lobby'],['g1','เกม 1'],['g1_end','สรุปเกม 1'],['g2_intro','เกม 2: กติกา'],['g2_end','สรุปเกม 2'],['g3_intro','เกม 3: กติกา'],['final','ผลรวมสุดท้าย']].map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select><button class="btn k" id="jgo">ไป</button>
    <select id="js">${a.scenarios.map((x,i)=>`<option value="${i}">สถานการณ์ ${x.n}</option>`).join('')}</select><button class="btn k" id="jso">เล่นข้อนี้ใหม่</button>
    <select id="jp">${a.personas.map((x,i)=>`<option value="${i}">${esc(x.name)}</option>`).join('')}</select><button class="btn k" id="jpo">เล่นคนนี้ใหม่</button>
  </div>
  <h3>ข้อมูล</h3><div class="jump"><button class="btn w" id="xCsv">ดาวน์โหลดผล CSV</button><button class="btn w" id="xScore">ล้างคะแนนเกม 2–3</button><button class="btn" id="xAll">รีเซ็ตเกมทั้งหมด</button><button class="btn w" id="xOut">ออกจากระบบ</button></div></div>`;
  drawVideos();$('#vChk').onclick=drawVideos;
  $('#pX').onclick=()=>{panelOpen=false;$('#pn').innerHTML=''};
  $('#sSave').onclick=async()=>{const j=await cmd({cmd:'settings',settings:{pairPoints:$('#sPair').value,bonusStart:$('#sBonus').value,wrongPenalty:$('#sPen').value,signCount:$('#sCount').value,signPoints:$('#sPts').value.split(',').map(x=>+x.trim())}});if(j&&j.ok)toast('บันทึกแล้ว')};
  $('#jgo').onclick=()=>{if(confirm('ข้ามไปหน้านี้?'))cmd({cmd:'goto',phase:$('#jg').value})};
  $('#jso').onclick=()=>{if(confirm('เล่นข้อนี้ใหม่? คะแนนของข้อนี้จะถูกล้าง')){cmd({cmd:'goto',phase:'g2_motion',round:$('#js').value,clear:true});$('#pX').click()}};
  $('#jpo').onclick=()=>{if(confirm('เล่นคนนี้ใหม่? คะแนนของรอบนี้จะถูกล้าง')){seenSigns=-1;cmd({cmd:'goto',phase:'g3_board',round:$('#jp').value,clear:true});$('#pX').click()}};
  $('#xScore').onclick=()=>{if(confirm('ล้างคะแนนเกม 2 และ 3 ทั้งหมด?'))cmd({cmd:'resetScores'})};
  $('#xAll').onclick=()=>{if(prompt('พิมพ์ RESET เพื่อรีเซ็ตเกมทั้งหมด (ผลเกม 1 และคะแนนจะหาย)')==='RESET'){cmd({cmd:'resetAll'});$('#pX').click()}};
  $('#xOut').onclick=()=>{panelOpen=false;logout()};
  $('#xCsv').onclick=async()=>{const j=await rpc('mm_export',{p_token:token});if(j.error)return toast(j.error);const cols=['id','name','level','group','store','animal','gap','next','g2','g3','total'];const cell=c=>'"'+String(c??'').replace(/"/g,'""').replace(/^([=+\-@])/,"'$1")+'"';const u=URL.createObjectURL(new Blob(['\ufeff'+[cols.join(',')].concat(j.rows.map(r=>cols.map(c=>cell(r[c])).join(','))).join('\r\n')],{type:'text/csv;charset=utf-8'}));const l=document.createElement('a');l.href=u;l.download='manager-meeting-results.csv';l.click();URL.revokeObjectURL(u)};
}
function drawVideos(){
  const el=$('#vids');if(!el)return;
  el.innerHTML=V.admin.scenarios.map(x=>`<div class="vrow" style="grid-template-columns:44px 1fr 150px"><b>${x.n}</b><span>${esc(x.title)}</span><span id="vs${x.n}">กำลังเช็ก…</span></div>`).join('');
  V.admin.scenarios.forEach(x=>hasVideo(x.n).then(ok=>{const e=$('#vs'+x.n);if(e){e.textContent=ok?'✓ มีแล้ว':'ยังไม่มี';e.className=ok?'ok':''}}));
}

/* boot */
if(token)connect();else showLogin();
