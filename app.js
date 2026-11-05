'use strict';
const A = {
  bull:{th:'กระทิง',en:'BULL',dir:'N',strength:'เร็ว ตัดสินใจไว กล้ารับผิดชอบ',gap:'ใจร้อน พูดแรง ข้ามขั้นตอน',borrow:'หนู + หมี',ideal:'ตัดสินใจเร็วแต่พูดสุภาพ สั่งงานด้วย 3Cs ไม่ตะโกน ไม่ข้าม Step',talk:'สั้น ตรง ให้อำนาจ บอกเส้นที่ห้ามข้าม',c:'#e8541e'},
  eagle:{th:'อินทรี',en:'EAGLE',dir:'E',strength:'มองภาพใหญ่ อ่านเกม คิดล่วงหน้า',gap:'เบื่อรายละเอียด ทำไม่จบ',borrow:'หมี',ideal:'Think Ahead แล้ว Follow up จนจบ',talk:'บอกเหตุผล ถามความเห็น กำหนดเวลา',c:'#b9791f'},
  rat:{th:'หนู',en:'RAT',dir:'S',strength:'อบอุ่น เข้าใจคน ทีมรัก',gap:'ไม่กล้าปฏิเสธ เลี่ยงความขัดแย้ง',borrow:'กระทิง',ideal:'ใส่ใจ แต่กล้าเตือนน้องทันทีเมื่อผิดมาตรฐาน และกล้ารับข้อร้องเรียนด้วย BLAST',talk:'อบอุ่น ให้ประโยคสำเร็จรูป ส่งต่อได้',c:'#7c7c88'},
  bear:{th:'หมี',en:'BEAR',dir:'W',strength:'ละเอียด แม่นยำ รักษามาตรฐาน',gap:'ช้า ไม่ยืดหยุ่นตอน Peak',borrow:'อินทรี + กระทิง',ideal:'ยึด SOP แต่จัดลำดับความสำคัญได้ตอน Peak (SEE → PRIORITIZE → ACT)',talk:'ชัดเจน เป็นขั้นตอน บอกลำดับสำคัญ',c:'#a8672a'},
};
const LEARN = [
  {a:'bull',dir:'N',th:'กระทิง',en:'BULL',tips:[['⚡','สั้น ตรง'],['🎯','ให้อำนาจ'],['🚧','และบอกสิ่งที่ห้ามข้าม']]},
  {a:'eagle',dir:'E',th:'อินทรี',en:'EAGLE',tips:[['💡','บอกเหตุผลก่อน'],['💬','ถามความเห็น'],['📅','และกำหนด deadline กับนิยามงานเสร็จ']]},
  {a:'rat',dir:'S',th:'หนู',en:'RAT',tips:[['❤️','อบอุ่น'],['🗨️','ให้ประโยคสำเร็จรูป'],['👍','และให้สิทธิ์ส่งต่อเรื่องให้หัวหน้า']]},
  {a:'bear',dir:'W',th:'หมี',en:'BEAR',tips:[['⚙️','ชัดเจน'],['📋','เป็นขั้นตอน'],['🔍','และบอกลำดับความสำคัญ']]},
];
const learnCard=(l,i,open,fresh)=>`<div class="lcard ${open?'open':''} ${fresh?'fresh':''}" style="--d:${i*.4}s"><div class="flipper"><div class="face fback"><b>${l.dir}</b><span>?</span><small>${l.en}</small></div><div class="face front"><i class="dirb">${l.dir}</i><div class="stagef"><span class="glow"></span><img class="a-3d" src="img/${l.a}.png" alt="${l.th}"><span class="shadow"></span></div><h3>${l.th}<small>${l.en}</small></h3><ul>${l.tips.map((t,k)=>`<li style="--k:${k}"><em>${t[0]}</em>${t[1]}</li>`).join('')}</ul></div></div></div>`;
let learnSeen=-1;
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
function logout(){store.del('tok');token=null;if(channel)sb.removeChannel(channel);channel=null;liveFor=null;lastRev=null;V=null;lastKey='';boBuilt=false;showLogin();}

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
      else{clockOff=m.now+(Date.now()-t0)/2-Date.now();V=m;setupLive();render()}
    }
  }catch(e){expired=!!(e&&(e.code==='22P02'||/uuid/i.test(e.message||'')))/* other errors: the next poll retries */}
  inFlight=false;
  if(expired){again=false;return logout()}
  if(again){again=false;refresh()}
}
function refreshSoon(ms){if(refreshT)return;refreshT=setTimeout(()=>{refreshT=null;refresh()},ms)}
let liveFor=null,lastRev=null,tickBusy=false;
// admin and coaches use Realtime; store managers check a tiny counter, so any crowd size stays inside plan limits
function setupLive(){
  const want=V.admin?'admin':V.me&&V.me.canPlay?'coach':'viewer';
  if(want===liveFor)return;liveFor=want;
  if(channel){sb.removeChannel(channel);channel=null}
  rtOK=false;
  if(want==='viewer')return;
  const onChange=()=>refreshSoon(want==='admin'?250:Math.random()*150);
  channel=sb.channel('mm-tick').on('postgres_changes',{event:'UPDATE',schema:'public',table:'mm_tick'},onChange);
  if(want==='admin')channel=channel.on('postgres_changes',{event:'UPDATE',schema:'public',table:'mm_tick_admin'},onChange);
  channel.subscribe(status=>{rtOK=status==='SUBSCRIBED';if(rtOK)refresh()});
}
function connect(){liveFor=null;refresh()}
async function pollTick(){
  if(tickBusy||document.hidden||!token||liveFor!=='viewer')return;tickBusy=true;
  try{const {data}=await sb.from('mm_tick').select('rev').eq('id',1).single();
    if(data){if(lastRev!==null&&data.rev!==lastRev)refreshSoon(Math.random()*400);lastRev=data.rev}
  }catch{}
  tickBusy=false;
}
setTimeout(()=>{pollTick();setInterval(pollTick,2000)},Math.random()*2000);
setInterval(()=>{
  if(!token||!V)return;
  const age=Date.now()-lastFetch,viewer=liveFor==='viewer',limit=viewer?30000:rtOK?(V.admin?10000:8000):(V.admin?2000:3000);
  const due=!viewer&&V.phase==='g2_countdown'&&V.endsAt&&svNow()>=V.endsAt&&age>800;
  if(due||age>limit)refresh();
},500);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&token)refresh()});
const svNow=()=>Date.now()+clockOff;

const neon=(inner,cls='')=>`<div class="neon ${cls}"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="n1" cx="100" cy="100" r="92"/><circle class="n2" cx="100" cy="100" r="81"/><circle class="n3" cx="100" cy="100" r="96"/></svg><span>${inner}</span></div>`;
const faces=(cls='')=>`<div class="faces ${cls}">${[1,2,3,4,5,6,7].map((n,i)=>`<img src="img/face${n}.png" alt="" style="animation-delay:${-i*.55}s">`).join('')}</div>`;
const orbit=inner=>`<div class="orbit"><div class="ring">${[1,2,3,4,5,6,7].map((n,i)=>`<img src="img/face${n}.png" alt="" style="--a:${i*360/7}deg">`).join('')}</div>${inner}</div>`;
const groupLabel=g=>g&&g.no?`กลุ่ม ${g.no} · AC ${g.nick}`:'';
const rowLabel=r=>r.group?`กลุ่ม ${r.group} · AC ${r.nick}`:r.name;
function render(){ if(V.admin) return location.hash==='#backoffice'?renderBO():renderHost(); renderPlayer(); }
addEventListener('hashchange',()=>location.reload());

/* ---------- player ---------- */
function keyPlayer(){
  const m=V.me,g=m.g3||{},x=V.g3||{};
  return [V.phase,V.round,V.board,V.recapTab,m.g1||'',m.submitted?1:0,x.signs||0,g.choice||'',m.group?m.group.no:''].join('|');
}
function renderPlayer(){
  if(V.phase==='idle'||V.phase==='lobby'){store.del('q:'+V.me.id);LG.round=-1;seenSigns=-1;learnSeen=-1}
  const inForest=V.phase==='g1'||V.phase==='g1_end'||V.phase==='learn';
  document.body.className=inForest?'forest':V.phase==='g3_intro'?'g3cover':['g3_board','g3_reveal','g3_scores'].includes(V.phase)?'store':'';
  MMAudio.scene(V.phase==='g1'||V.phase==='g1_end'?'forest':'none');
  const m=V.me,key=keyPlayer();
  if(!$('.shell'))app.innerHTML=`<div class="shell"><div class="top" id="top"></div><div class="main" id="main"></div></div><div id="ov"></div>`;
  $('#top').innerHTML=`${m.g1?`<img src="img/${m.g1}.png" alt="${A[m.g1].th}">`:''}<div class="nm">${esc(m.name)}<small>${m.group?esc(groupLabel(m.group))+' · ':''}${esc(m.store)}</small></div>${m.score?`<span class="pts">${m.score.total} pt</span>`:''}${inForest?`<button class="out snd" id="snd" aria-label="เปิดปิดเสียงป่า">${MMAudio.musicOn?'🔊':'🔇'}</button>`:''}<button class="out" id="out">ออก</button>`;
  if($('#snd'))$('#snd').onclick=()=>{MMAudio.music(!MMAudio.musicOn);renderPlayer()};
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
setInterval(()=>{if(!V)return;document.querySelectorAll('[data-b=cd]').forEach(e=>{const t=String(cdLeft());if(e.textContent!==t){e.textContent=t;if(V.admin&&+t>0&&location.hash!=='#backoffice')beep()}})},100);
const watchText=()=>V.me.group?`ไปดูจอหลักของ AC ${esc(V.me.group.nick)} (กลุ่ม ${V.me.group.no})`:'ไปดูจอหลักกับ Area Coach ของคุณ';
const spectBanner=()=>V.me.canPlay?'':`<div class="spectate">👀 ${watchText()}</div>`;
const watchScreen=(m,top,sub)=>{m.innerHTML=`<div class="center"><div class="watch">👀 ${watchText()}</div>${top?`<h2 class="h brush">${top}</h2>`:''}${sub?`<p class="sub">${sub}</p>`:''}</div>`};
function waitHTML(t,s){return `<div class="center"><div class="clock" role="img" aria-label="กำลังรอ"></div><h2 class="h brush">${t}</h2><p class="sub">${s||''}</p></div>`}
function boardHTML(title='สกอร์บอร์ด'){
  const b=V.scoreboard||[],me=V.me&&V.me.id;
  return `<h2 class="h brush" style="margin-bottom:12px">${title}</h2><div class="board">${b.map((r,i)=>`<div class="row ${r.id===me?'me':''}" style="animation-delay:${i*.05}s"><span class="r">${r.rank}</span><span class="n">${esc(rowLabel(r))}</span><span class="g">${r.last?'+'+r.last:''}</span><span class="t">${r.total}</span></div>`).join('')}</div>`;
}
function hello(main,h,s){main.innerHTML=`<div class="center"><div class="critters" style="width:min(420px,90%)">${AK.map(a=>`<img src="img/${a}.png" alt="">`).join('')}</div><h2 class="h brush">${h}</h2><p class="sub">${s}</p></div>`}
const PV={
  idle(m){hello(m,`สวัสดี ${esc(V.me.name)}!`,'เข้าเกมเรียบร้อย รอแอดมินเริ่มเกมได้เลย')},
  lobby(m){hello(m,`พร้อมแล้ว ${esc(V.me.name)}!`,'อีกสักครู่เกมจะเริ่ม ดูจอหลักไว้นะ')},
  g1(m){V.me.g1?showResult(m,V.me.g1):quiz(m)},
  g1_end(m){V.me.g1?showResult(m,V.me.g1):quiz(m)},
  learn(m){
    const n=V.round,fresh=learnSeen>=0&&n>learnSeen?n-1:-1;learnSeen=n;
    m.innerHTML=`<div class="center" style="gap:8px"><span class="tag">ก่อนเล่นเกมที่ 2</span><h2 class="h brush">สั่งงานให้ตรงกับ<em>ประเภท</em></h2><p class="sub">${n?'ดูจอหลักแล้วจำให้แม่นนะ':'คำสั่งเดียวกัน แต่แต่ละคนอาจต้องการวิธีสื่อสารที่แตกต่างกัน'}</p></div><div class="lgrid-p">${LEARN.map((l,i)=>learnCard(l,i,i<n,i===fresh)).join('')}</div>${n>=4?'<p class="ltip">💡 สังเกตจากคำพูด น้ำเสียง และภาษากาย ให้ตรงกับสไตล์ของพนักงาน</p>':''}`;
  },
  groups(m){
    const g=V.me.group;
    if(!g){m.innerHTML=`<div class="center"><h2 class="h brush">ยังไม่มีกลุ่มของคุณ</h2><p class="sub">แจ้งทีมงานเพื่อจัดกลุ่มให้นะ</p></div>`;return}
    m.innerHTML=V.me.canPlay?`<div class="center"><p class="sub">คุณคือหัวหน้า</p><div class="gcard"><div>กลุ่มที่</div><div class="no">${g.no}</div><div>AC ${esc(g.nick)}</div></div><p class="sub">ลูกทีม Store Manager ${V.me.members??0} คน เปิดจอนี้ให้ทีมดูตอนเล่นเกมที่ 2 และ 3</p></div>`
    :`<div class="center"><p class="sub">${esc(V.me.store)}</p><h2 class="h brush">คุณอยู่</h2><div class="gcard"><div>กลุ่มที่</div><div class="no">${g.no}</div><div>AC ${esc(g.nick)}</div></div><p class="sub">ไปรวมตัวกับ AC ${esc(g.nick)} แล้วดูจอหลักด้วยกันในเกมที่ 2 และ 3</p></div>`;
  },
  g2_intro(m){m.innerHTML=`${spectBanner()}<div class="center"><span class="tag">เกมที่ 2</span><h2 class="h brush">สั่งงานให้<em>ตรงประเภท</em></h2><div class="rules"><div>ดูสถานการณ์บนจอหลัก แล้วจับคู่คำสั่งให้ตรงกับสัตว์ทั้ง 4 ตัว</div><div>ถูกครบได้ <b>100 pt</b> ถูกครึ่งเดียวได้ <b>50 pt</b></div><div>คนแรกที่ถูกครบได้โบนัสอีก <b>15 pt</b> คนเดียวเท่านั้น</div><div>คะแนนรวมเท่ากัน ตัดสินด้วยเวลารวมที่ตอบ เร็วกว่าอันดับดีกว่า</div><div>มีทั้งหมด <b>${V.g2N} สถานการณ์</b> คะแนนสะสมต่อเนื่อง</div></div></div>`},
  g2_motion(m){if(!V.me.canPlay)return watchScreen(m,esc(V.scenario.title),`สถานการณ์ที่ ${V.scenario.n}/${V.g2N}`);m.innerHTML=`${spectBanner()}<div class="center"><span class="tag">สถานการณ์ที่ ${V.scenario.n}/${V.g2N}</span><h2 class="h brush">ดูจอหลักเลย!</h2><p class="scen">${esc(V.scenario.title)}</p><p class="sub">${esc(V.scenario.situation)}</p></div>`},
  g2_countdown(m){if(!V.me.canPlay)return watchScreen(m,esc(V.scenario.title),'เตรียมตัว…');m.innerHTML=`<div class="center"><p class="sub">เตรียมตัว…</p><div class="big" style="font-size:clamp(120px,35vw,240px);font-weight:800;color:var(--red);line-height:1" data-b="cd">${cdLeft()}</div></div>`},
  g2_match(m){
    if(!V.me.canPlay) return watchScreen(m,esc(V.scenario.title),`AC กำลังจับคู่คำสั่ง สถานการณ์ที่ ${V.scenario.n}/${V.g2N}`);
    if(V.me.submitted) return m.innerHTML=waitHTML('ส่งแล้ว รอเฉลยนะ','แอดมินกำลังรอทุกคน · ส่งแล้ว <span data-b="submitted"></span>')+'',patchPlayer();
    linkGame(m);
  },
  g2_reveal(m){
    const r=V.me.result;
    const yours=V.me.canPlay?`<div class="yours">${r?`ถูก ${r.correct}/4 คู่ ได้ <b>+${r.pts} pt</b>${r.bonus?` (โบนัสคนแรก ${r.bonus})`:''}`:'รอบนี้ไม่ได้ส่งคำตอบ'}</div>`:'';
    const wrong=V.recapTab==='wrong';
    m.innerHTML=`${spectBanner()}${yours}<div class="round">เฉลย สถานการณ์ที่ ${V.scenario.n}</div><h2 class="scen" style="margin-bottom:4px">${esc(V.scenario.title)}</h2><p class="sub" style="margin-bottom:12px">เป้าหมาย: ${esc(V.scenario.goal)}</p>
    ${V.answer.map(x=>`<div class="rcard"><img src="img/${x.a}.png" alt=""><div><b>${A[x.a].th}</b>${wrong?`<small>ถ้าพูดว่า: ${esc(x.wrong.say)}</small>→ ${esc(x.wrong.result)}`:esc(x.cmd)}</div></div>`).join('')}`;
    if(r&&r.correct===4)confetti(40);
  },
  g2_scores(m){m.innerHTML=boardHTML(`คะแนนหลังสถานการณ์ที่ ${V.scenario.n}`)},
  g2_end(m){m.innerHTML=boardHTML('จบเกมที่ 2')},
  g3_intro(m){m.innerHTML=`${spectBanner()}<div class="center"><span class="tag">เกมที่ 3</span><h2 class="h brush cover-t">แฟน<em>พันธุ์แท้</em> ลูกค้า</h2>${neon('7','sm')}<p class="persona-t">CUSTOMER PERSONA</p>${faces()}<div class="rules"><div>เปิดป้ายทีละแผ่น ทายให้ถูกว่าคือลูกค้าคนไหน</div><div>ยิ่งเปิดป้ายน้อย ยิ่งได้เยอะ <b>100 → 75 → 50 → 25 pt</b></div><div>ตอบได้ครั้งเดียว ส่งแล้วล็อกทันที เฉลยพร้อมกันตอนท้าย</div><div>คนแรกที่ตอบถูกได้โบนัสอีก <b>15 pt</b> คนเดียวเท่านั้น</div><div>คะแนนรวมเท่ากัน ตัดสินด้วยเวลารวมที่ตอบ เร็วกว่าอันดับดีกว่า</div></div></div>`},
  g3_board:g3Player,
  g3_reveal(m){
    const p=V.g3.persona,r=V.me.result;
    const yours=V.me.canPlay?`<div class="yours">${r&&r.sign!=null?`ตอบถูก ป้ายที่ ${r.sign+1} ได้ <b>+${r.pts} pt</b>${r.bonus?` (โบนัสคนแรก ${r.bonus})`:''}`:r?`ตอบไม่ถูก รอบนี้ <b>${r.pts} pt</b>`:'รอบนี้ไม่ได้ส่งคำตอบ'}</div>`:'';
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
  MMAudio.animal(a);confetti();
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
  const isNew=seenSigns>=0&&g.signs>seenSigns?g.signs-1:-1;seenSigns=g.signs;
  const signs=g.clues.map((c,i)=>c?`<div class="sign ${i===isNew?'flip':''}"><span>${esc(c)}</span><span class="p">${g.signPoints[i]} pt</span></div>`:`<div class="sign closed"><span>ป้ายที่ ${i+1}</span><span class="p">${g.signPoints[i]} pt</span></div>`).join('');
  if(!can){m.innerHTML=`${spectBanner()}<div class="round">คนที่ ${V.round+1}/${V.g3N} · เค้าคือใคร?</div>${faces('small')}<div class="signs">${signs}</div>`;return}
  if(me.choice){
    const c=V.choices.find(x=>x.id===me.choice);
    m.innerHTML=`<div class="round">คนที่ ${V.round+1}/${V.g3N} · เค้าคือใคร?</div><div class="center" style="min-height:0;margin:12px 0"><div class="clock" style="width:90px;height:90px;border-width:8px"></div><h2 class="h brush">ส่งคำตอบแล้ว รอเฉลย</h2><p class="sub">คุณตอบ <b>${esc(c?c.name:'')}</b> คำตอบล็อกแล้ว</p></div>${faces('small')}<div class="signs">${signs}</div>`;
    return;
  }
  const lock=!g.signs;
  m.innerHTML=`<div class="round">คนที่ ${V.round+1}/${V.g3N} · เค้าคือใคร?</div>${lock?'<div class="notice g" style="background:#eee;color:#555">รอเปิดป้ายแรก…</div>':'<div class="notice g" style="background:#fff4d6;color:#7a5600">ตอบได้ครั้งเดียว ส่งแล้วล็อกทันที</div>'}<div class="signs">${signs}</div>
  <div class="choices">${V.choices.map(c=>`<button class="choice" data-c="${c.id}" ${lock?'disabled':''}><img src="img/${c.img}" alt="">${esc(c.name)}</button>`).join('')}</div>`;
  m.querySelectorAll('.choice:not([disabled])').forEach(b=>b.onclick=async()=>{
    if(!confirm(`ตอบ ${b.textContent.trim()} ใช่ไหม? ส่งแล้วเปลี่ยนไม่ได้`))return;
    m.querySelectorAll('.choice').forEach(x=>x.disabled=true);
    const j=await act({type:'g3',choice:b.dataset.c});
    if(j.error){toast(j.error);lastKey='';renderPlayer()}
  });
}

/* ---------- projector / admin ---------- */
const beep=()=>MMAudio.tick();
const fanfare=()=>MMAudio.fanfare();
document.addEventListener('pointerdown',()=>{if(V&&location.hash!=='#backoffice'&&(V.admin||V.phase==='g1'||V.phase==='g1_end'))MMAudio.unlock()},{capture:true});
function fit(){const s=$('#stage');if(!s)return;const k=Math.min(innerWidth/1920,innerHeight/1080);s.style.transform=`scale(${k}) translate(-50%,-50%)`}
addEventListener('resize',fit);
let panelOpen=false,barHidden=false;
function keyHost(){const g=V.g3||{};return [V.phase,V.round,V.board,V.recapTab,g.signs||0].join('|')}
function renderHost(){
  document.body.className='host';
  if(!$('#stage')){app.innerHTML=`<div id="stage"><div class="brand">TEAM <i>BONCHON</i></div><div id="scr"></div><div id="ovl"></div><div class="bar" id="bar"></div><div id="pn"></div></div>`;fit();}
  $('#stage').classList.toggle('nobar',barHidden);const inForest=V.phase==='g1'||V.phase==='g1_end'||V.phase==='learn';$('#stage').classList.toggle('forest',inForest);$('#stage').classList.toggle('deco',!inForest&&['idle','lobby','groups','g2_intro','g3_intro'].includes(V.phase));MMAudio.scene(V.phase==='learn'?'forest':inForest?'forest':'music');$('#stage').classList.toggle('store',['g3_board','g3_reveal','g3_scores'].includes(V.phase));$('#stage').classList.toggle('g3cover',V.phase==='g3_intro');
  drawBar();
  patchHost();
  const key=keyHost();
  if(key!==lastKey){const old=lastKey;lastKey=key;if(old&&V.phase!=='learn')MMAudio.transition();if(V.phase!=='g2_motion')MMAudio.duck(false);
    (HV[V.phase]||HV.idle)($('#scr'),old);patchHost();
  }
  setOnce($('#ovl'),V.board&&V.scoreboard?`<div class="hboard-ov"><h2 class="t2 brush">สกอร์<em>บอร์ด</em></h2>${hBoard()}</div>`:'');
  
}
function drawBar(){
  const a=V.admin;
  $('#bar').innerHTML=`<button class="btn ghost ${V.board?'on':''}" id="bBoard">🏆 สกอร์บอร์ด</button>
    ${V.phase==='g2_reveal'?`<button class="btn ghost ${V.recapTab==='wrong'?'on':''}" id="bWrong">ถ้าพูดผิดสไตล์</button>`:''}
    <button class="btn ghost" id="bSet">⚙️ ตั้งค่า</button><button class="btn ghost" id="bBo">📊 หลังบ้าน</button><button class="btn ghost" id="bReset">🔄 เริ่มใหม่</button><button class="btn ghost" id="bFs">⛶</button><button class="btn ghost ${MMAudio.musicOn?'on':''}" id="bMusic">🎵</button><button class="btn ghost ${MMAudio.sfxOn?'on':''}" id="bMute">🔔</button>
    <span class="stat">เข้าแล้ว ${a.joined.length}/${V.totalUsers}</span>
    ${a.draftAssessment?'<span class="warn">เกม 1 ใช้คำถามทดสอบ</span>':''}
    ${a.nextLabel?`<button class="btn primary" id="bNext">${esc(a.nextLabel)}</button>`:'<span style="margin-left:auto"></span>'}`;
  $('#bBoard').onclick=()=>cmd({cmd:'board',on:!V.board});
  if($('#bWrong'))$('#bWrong').onclick=()=>cmd({cmd:'recapTab',tab:V.recapTab==='wrong'?'answer':'wrong'});
  $('#bSet').onclick=openPanel;$('#bReset').onclick=openReset;$('#bBo').onclick=()=>window.open(location.pathname+'#backoffice','_blank');
  $('#bFs').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
  $('#bMute').onclick=()=>{MMAudio.sfx(!MMAudio.sfxOn);drawBar()};
  $('#bMusic').onclick=()=>{MMAudio.music(!MMAudio.musicOn);drawBar()};
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
  if(V.g3){set('answered',V.g3.answered)}
  const chips=$('#chips');
  if(chips){const have=chips.children.length;const list=V.admin.joined;for(let i=have;i<list.length;i++){const d=document.createElement('span');d.className='chip '+(list[i].l==='L4'?'l4':'');d.textContent=list[i].n;chips.appendChild(d)}}
}
function hBoard(){return `<div class="hboard" style="grid-template-rows:repeat(${Math.max(1,(V.scoreboard||[]).length)},1fr)">${(V.scoreboard||[]).map((r,i)=>`<div class="hrow ${i===0&&r.total>0?'top1':''}" style="animation-delay:${i*.06}s"><span class="r">${r.rank}</span><span>${esc(rowLabel(r))}</span><span class="g">${r.last?'+'+r.last:''}</span><span class="t">${r.total}</span></div>`).join('')}</div>`}
function introHost(s,tag,t,lines,img){s.innerHTML=`<div class="scr c"><span class="tag" style="font-size:40px">${tag}</span><h1 class="t1 brush" style="margin:16px 0 26px">${t}</h1><div style="display:flex;gap:30px;align-items:center;font-size:36px;text-align:left">${img?`<img src="${img}" alt="" style="height:440px;border-radius:20px">`:''}<div class="rules" style="width:1100px">${lines.map(l=>`<div>${l}</div>`).join('')}</div></div></div>`}
const HV={
  idle(s){s.innerHTML=`<div class="scr c"><div class="critters" style="width:800px;margin-bottom:10px">${AK.map(a=>`<img src="img/${a}.png" alt="">`).join('')}</div><h1 class="t1 brush">Manager <em>Meeting</em> Game</h1><p class="t3" style="color:var(--mute);margin-top:12px">กด Launch เมื่อพร้อมให้ทุกคนเข้าเกม</p></div>`},
  lobby(s){
    const url=location.origin+location.pathname;let svg='';
    try{const q=qrcode(0,'M');q.addData(url);q.make();svg=q.createSvgTag({scalable:true,margin:2})}catch{}
    s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:12px">สแกนเข้าเกม<em>เลย!</em></h1><div class="lobby"><div class="qr">${svg}<div class="url">${esc(url)}</div><div style="color:var(--mute);font-size:22px">ล็อกอินด้วยรหัสพนักงาน</div></div><div style="display:flex;flex-direction:column;min-height:0"><div><span class="big" data-b="joined">0</span> <span class="t3">/ ${V.totalUsers} คน</span></div><div class="chips" id="chips"></div></div></div></div>`;
  },
  g1(s){s.innerHTML=`<div class="scr"><div class="fhead"><span class="tag" style="font-size:30px">เกมที่ 1</span><h1 class="t2 brush">เราคือสัตว์<em>ประเภทไหน?</em></h1><p class="t3"><span data-b="g1done" style="color:var(--red);font-weight:800;font-size:64px">0</span> / ${V.totalUsers} คน ทำเสร็จแล้ว</p></div>${dist()}</div>`},
  g1_end(s){s.innerHTML=`<div class="scr"><div class="fhead"><h1 class="t2 brush">ทีมเราเป็น<em>แบบนี้!</em></h1><p class="t3"><span data-b="g1done" style="color:var(--red);font-weight:800">0</span> คน ได้รับสติ๊กเกอร์ของตัวเอง</p></div>${dist()}</div>`;fanfare();confetti(90)},
  learn(s){
    const n=V.round,fresh=learnSeen>=0&&n>learnSeen?n-1:-1;learnSeen=n;
    s.innerHTML=`<div class="scr learn"><div class="lhead"><span class="ltitle brush">สั่งงานให้ตรงกับ<em>ประเภท</em> <b>4</b></span><span class="lsub">เข้าใจความแตกต่าง สื่อสารให้ตรงจุด เพื่อให้งานสำเร็จร่วมกัน</span></div><div class="lbody"><div class="lgoal"><h3>เป้าหมาย</h3><p>ฝึกผู้จัดการให้ปรับวิธีสั่งงาน ให้เหมาะกับลักษณะการทำงานของพนักงานแต่ละประเภท</p><div class="lbub">คำสั่งเดียวกัน แต่แต่ละคนอาจต้องการ<b>วิธีสื่อสารที่แตกต่างกัน</b></div></div><div class="lgrid">${LEARN.map((l,i)=>learnCard(l,i,i<n,i===fresh)).join('')}</div></div><div class="ltipbar ${n>=4?'on':''}">💡 <b>เคล็ดลับ</b> สังเกตจากการใช้คำพูด น้ำเสียง และภาษากาย ให้ตรงกับสไตล์ของพนักงาน</div></div>`;
    if(fresh>=0){MMAudio.open();setTimeout(()=>MMAudio.animal(LEARN[fresh].a),350);if(fresh===3)setTimeout(()=>confetti(90),900)}
  },
  groups(s){s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:12px">แบ่ง<em>กลุ่ม</em> ไปรวมตัวกับ AC ของคุณ</h1><div class="hgroups">${(V.groups||[]).map(g=>`<div class="hgroup"><b>${g.no}</b><span>AC ${esc(g.nick)}</span><small>${g.members} คน</small></div>`).join('')}</div></div>`},
  g2_intro(s){introHost(s,'เกมที่ 2','สั่งงานให้<em>ตรงประเภท</em>',['แต่ละกลุ่มจับคู่คำสั่งให้ตรงกับสัตว์ทั้ง 4 ตัว','ถูกครบ <b>100 pt</b> ถูกครึ่งเดียว <b>50 pt</b>','กลุ่มแรกที่ถูกครบได้โบนัสอีก <b>15 pt</b> กลุ่มเดียวเท่านั้น','คะแนนรวมเท่ากัน ตัดสินด้วยเวลารวมที่ตอบ เร็วกว่าอันดับดีกว่า',`ทั้งหมด <b>${V.g2N} สถานการณ์</b> ลูกทีมร่วมลุ้นที่จอหลักของ AC`])},
  g2_motion(s){
    const n=V.scenario.n;
    s.innerHTML=`<div class="scr c"><span class="tag" style="font-size:40px">สถานการณ์ที่ ${n}/${V.g2N}</span><h1 class="t1 brush" style="margin:22px 0;max-width:1650px">${esc(V.scenario.title)}</h1><p class="t3" style="max-width:1400px;font-size:48px">${esc(V.scenario.situation)}</p><p id="noMotion" style="color:var(--mute);margin-top:26px;font-size:24px"></p></div>`;
    hasVideo(n).then(ok=>{
      if(V.phase!=='g2_motion'||V.scenario.n!==n)return;
      if(!ok){const e=$('#noMotion');if(e)e.textContent=`ยังไม่มี Motion ของสถานการณ์นี้ อัปโหลดได้ที่ 📊 หลังบ้าน`;return}
      s.innerHTML=`<div class="motion"><video id="mv" playsinline controls src="${esc(videoUrl(n))}?v=${Date.now()}"></video></div>`;
      const v=$('#mv');MMAudio.duck(true);v.onended=()=>{MMAudio.duck(false);if(V.phase==='g2_motion')cmd({cmd:'next'})};v.play().catch(()=>toast('กดปุ่มเล่นบนวิดีโอ'));
    });
  },
  g2_countdown(s){s.innerHTML=`<div class="scr c"><p class="t3">เตรียมโยงคำสั่ง!</p><div class="cd go" data-b="cd">${cdLeft()}</div><p class="t2 brush">${esc(V.scenario.title)}</p></div>`},
  g2_match(s){s.innerHTML=`<div class="scr"><div style="display:flex;gap:18px;align-items:baseline;margin-top:12px"><span class="tag" style="font-size:28px">สถานการณ์ที่ ${V.scenario.n}/${V.g2N}</span><h1 class="t2 brush" style="font-size:54px">${esc(V.scenario.title)}</h1></div><div class="hanimals">${AK.map(a=>`<div class="hanimal"><img src="img/${a}.png" alt=""><div><b>${A[a].th}</b><small>${A[a].talk}</small></div></div>`).join('')}</div><div class="hmatch"><div class="hcards">${V.cards.map(c=>`<div class="hcard">${esc(c.t)}</div>`).join('')}</div><div class="hside"><div class="clock"></div><div class="t3">ส่งคำตอบแล้ว</div><div class="big" style="font-size:96px" data-b="submitted"></div><div class="t3">กลุ่ม</div></div></div></div>`},
  g2_reveal(s){
    const w=V.recapTab==='wrong';
    s.innerHTML=`<div class="scr"><div style="display:flex;gap:18px;align-items:baseline;margin-top:12px"><span class="tag" style="font-size:28px">${w?'ถ้าพูดผิดสไตล์':'เฉลย'}</span><h1 class="t2 brush" style="font-size:54px">${esc(V.scenario.title)}</h1></div><p style="font-size:28px;color:var(--mute)">เป้าหมายร่วม: ${esc(V.scenario.goal)} ${w?'':` · ถูกครบ ${V.allCorrect??0} กลุ่ม`}</p><div class="recap">${V.answer.map(x=>`<div class="rc"><img src="img/${x.a}.png" alt=""><h3>${A[x.a].th}</h3>${w?`<p class="bad">✗ ${esc(x.wrong.say)}</p><p>→ ${esc(x.wrong.result)}</p>`:`<p>${esc(x.cmd)}</p>`}</div>`).join('')}</div></div>`;
    if(!w)fanfare();
  },
  g2_scores(s){s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:12px">สกอร์บอร์ด <em>หลังสถานการณ์ที่ ${V.scenario.n}</em></h1>${hBoard()}</div>`},
  g2_end(s){s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:12px">จบ<em>เกมที่ 2</em></h1>${hBoard()}</div>`;fanfare()},
  g3_intro(s){s.innerHTML=`<div class="scr cover"><div class="c-left"><i class="br b1"></i><i class="br b2"></i><i class="br b3"></i><div class="c-title"><p class="c-no">เกมที่ 3</p><h1>แฟนพันธุ์แท้ ลูกค้า</h1><hr><ul><li>เปิดป้ายทีละแผ่น ยิ่งน้อยยิ่งได้เยอะ <b>100 · 75 · 50 · 25 pt</b></li><li>กลุ่มละหนึ่งคำตอบ ล็อกทันที เฉลยพร้อมกัน</li><li>กลุ่มแรกที่ตอบถูกได้โบนัสอีก <b>15 pt</b></li><li>คะแนนรวมเท่ากัน ตัดสินด้วยเวลารวมที่ตอบ</li></ul></div></div><div class="c-right"><i class="sl s1"></i><i class="sl s2"></i>${[[2,12,16],[1,30,6],[5,50,8],[3,72,15],[4,14,66],[7,38,78],[6,66,67]].map(([n,x,y],i)=>`<img class="cf" src="img/face${n}.png" alt="" style="left:${x}%;top:${y}%;animation-delay:${i*.09}s,${-i*.7}s">`).join('')}<div class="c-mid">${neon('7','lg')}<p class="persona-t">CUSTOMER<br>PERSONA</p></div></div></div>`},
  g3_board(s){
    const g=V.g3,isNew=seenSigns>=0&&g.signs>seenSigns?g.signs-1:-1;seenSigns=g.signs;if(isNew>=0)MMAudio.open();
    s.innerHTML=`<div class="scr storelay"><div class="st-panel"><h1 class="t2 brush">เค้าคือ<em>ใคร?</em> <small>คนที่ ${V.round+1}/${V.g3N}</small></h1><div class="hsigns">${g.clues.map((c,i)=>c?`<div class="hsign ${i===isNew?'flip':''}"><span>${esc(c)}</span><span class="p">${g.signPoints[i]} pt</span></div>`:`<div class="hsign closed ${i===g.signs?'nextup':''}"><span>ป้ายที่ ${i+1}</span><span class="p">${g.signPoints[i]} pt</span></div>`).join('')}</div></div><div class="st-side">${orbit(neon('?','md'))}<div class="st-count">ส่งคำตอบแล้ว <b data-b="answered">0</b>/${V.totalPlayers} กลุ่ม</div></div></div>`;
  },
  g3_reveal(s){
    const g=V.g3,p=g.persona;seenSigns=-1;
    s.innerHTML=`<div class="scr storelay"><div class="st-panel"><h1 class="t1 brush" style="font-size:88px"><em>${esc(p.name)}</em></h1><p class="tag" style="font-size:32px;align-self:flex-start;margin:6px 0 14px">${esc(p.tag)}</p><div class="hsigns" style="gap:10px">${g.clues.map(c=>`<div class="hsign" style="min-height:66px;font-size:28px"><span>${esc(c)}</span></div>`).join('')}</div><p class="t3" style="margin:12px 0 0;font-size:30px">ตอบถูก ${g.correctCount}/${V.totalPlayers} กลุ่ม</p></div><div class="st-side"><div class="st-pic"><div class="spin"></div><img class="pic" src="img/${esc(p.img)}" alt=""></div></div></div>`;
    fanfare();
  },
  g3_scores(s){s.innerHTML=`<div class="scr storeboard"><h1 class="t2 brush">สกอร์บอร์ด <em>หลังคนที่ ${V.round+1}</em></h1>${hBoard()}</div>`},
  final(s){
    const b=V.scoreboard||[],o=[b[1],b[0],b[2]],cl=['p2','p1','p3'],md=['🥈','🥇','🥉'];
    s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:12px;text-align:center">สุดยอด<em>แฟนพันธุ์แท้!</em></h1><div class="podium">${o.map((r,i)=>r?`<div class="pod ${cl[i]}"><div class="m">${md[i]}</div><div class="nm">${esc(rowLabel(r))}</div><div class="sc">${r.total}</div></div>`:'<div></div>').join('')}</div></div>`;
    fanfare();confetti(160);setTimeout(()=>confetti(120),1800);
  },
};
const videoUrl=n=>`${CFG.supabaseUrl}/storage/v1/object/public/motions/s${n}.mp4`;
const hasVideo=n=>fetch(videoUrl(n),{method:'HEAD',cache:'no-store'}).then(r=>r.ok).catch(()=>false);
function dist(){return `<div class="dist">${AK.map(a=>`<div class="dcol"><img class="${V.phase==='g1_end'?'a-'+a:'sway'}" src="img/${a}.png" alt=""><div class="n" data-b="n-${a}">0</div><div class="l">${A[a].th}</div><small>${A[a].strength}</small></div>`).join('')}</div>`}

/* settings panel */
function openReset(){
  panelOpen=true;
  $('#pn').innerHTML=`<div class="panel resetbox" role="dialog" aria-modal="true" aria-labelledby="rsT"><h2 id="rsT">🔄 รีเซ็ตทั้งหมดและเริ่มเล่นใหม่?</h2>
  <p>ผลเกมที่ 1 GEL Promise คำตอบ และคะแนนทั้งหมดจะถูกลบ <b>กู้คืนไม่ได้</b></p>
  <p>ยังเก็บไว้: รายชื่อพนักงาน กลุ่ม วิดีโอ และการตั้งค่าคะแนน ทุกคนไม่ต้องล็อกอินใหม่ แล้วหน้าจอจะกลับไปที่ QR รอเริ่มเกม</p>
  <div class="jump"><button class="btn w" id="rsX">⬇️ ดาวน์โหลดผลก่อน</button><button class="btn k" id="rsNo">ยกเลิก</button><button class="btn" id="rsGo">รีเซ็ตและเริ่มใหม่</button></div></div>`;
  const close=()=>{panelOpen=false;$('#pn').innerHTML=''};
  $('#rsX').onclick=exportExcel;
  $('#rsNo').onclick=close;
  $('#rsGo').onclick=async e=>{
    e.target.disabled=true;
    const a=await cmd({cmd:'resetAll'});
    if(!a||a.error){e.target.disabled=false;return}
    await cmd({cmd:'next'});
    seenSigns=-1;close();toast('รีเซ็ตแล้ว พร้อมเริ่มเล่นใหม่');
  };
}
function openPanel(){
  panelOpen=true;const a=V.admin,s=a.settings;
  $('#pn').innerHTML=`<div class="panel"><button class="x" id="pX">ปิด</button><h2>ตั้งค่าเกม</h2>
  <h3>คะแนน</h3><div class="grid">
    <div><label>เกม 2: ถูกครบ 4 คู่</label><input id="sFull" type="number" min="0" value="${s.fullPoints}"></div>
    <div><label>เกม 2: ถูก 2 คู่</label><input id="sHalf" type="number" min="0" value="${s.halfPoints}"></div>
    <div><label>โบนัสคนแรกที่ถูก (คนเดียว)</label><input id="sBonus" type="number" min="0" value="${s.bonusStart}"></div>
    <div><label>เกม 3: หักคะแนนเมื่อตอบผิด</label><input id="sPen" type="number" min="0" value="${s.wrongPenalty}"></div>
    <div><label>เกม 3: จำนวนแผ่นป้าย (1–5)</label><input id="sCount" type="number" min="1" max="5" value="${s.signCount}"></div>
    <div style="grid-column:span 2"><label>คะแนนแต่ละป้าย คั่นด้วยจุลภาค</label><input id="sPts" value="${s.signPoints.join(', ')}"></div>
  </div><button class="btn" id="sSave" style="margin-top:12px;min-height:44px">บันทึกคะแนน</button>
  <p style="color:var(--mute);font-size:17px;margin-top:6px">จำนวนป้ายมีผลกับคนที่ยังไม่เริ่มเล่น สมชายมีคำใบ้ 4 ข้อจึงเปิดได้สูงสุด 4 ป้าย</p>
  <h3>ข้ามไปหน้าอื่น</h3><div class="jump">
    <select id="jg">${[['lobby','Lobby'],['g1','เกม 1'],['g1_end','สรุปเกม 1'],['learn','อธิบายสัตว์ 4 ประเภท'],['groups','แบ่งกลุ่ม'],['g2_intro','เกม 2: กติกา'],['g2_end','สรุปเกม 2'],['g3_intro','เกม 3: กติกา'],['final','ผลรวมสุดท้าย']].map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select><button class="btn k" id="jgo">ไป</button>
    <select id="js">${a.scenarios.map((x,i)=>`<option value="${i}">สถานการณ์ ${x.n}</option>`).join('')}</select><button class="btn k" id="jso">เล่นข้อนี้ใหม่</button>
    <select id="jp">${a.personas.map((x,i)=>`<option value="${i}">${esc(x.name)}</option>`).join('')}</select><button class="btn k" id="jpo">เล่นคนนี้ใหม่</button>
  </div>
  <h3>ข้อมูล</h3><div class="jump"><button class="btn k" id="xXlsx">⬇️ ดาวน์โหลด Excel</button><button class="btn w" id="xScore">ล้างคะแนนเกม 2–3</button><button class="btn" id="xAll">รีเซ็ตเกมทั้งหมด</button><button class="btn w" id="xOut">ออกจากระบบ</button></div></div>`;
  $('#pX').onclick=()=>{panelOpen=false;$('#pn').innerHTML=''};
  $('#sSave').onclick=async()=>{const j=await cmd({cmd:'settings',settings:{fullPoints:$('#sFull').value,halfPoints:$('#sHalf').value,bonusStart:$('#sBonus').value,wrongPenalty:$('#sPen').value,signCount:$('#sCount').value,signPoints:$('#sPts').value.split(',').map(x=>+x.trim())}});if(j&&j.ok)toast('บันทึกแล้ว')};
  $('#jgo').onclick=()=>{if(confirm('ข้ามไปหน้านี้?'))cmd({cmd:'goto',phase:$('#jg').value})};
  $('#jso').onclick=()=>{if(confirm('เล่นข้อนี้ใหม่? คะแนนของข้อนี้จะถูกล้าง')){cmd({cmd:'goto',phase:'g2_motion',round:$('#js').value,clear:true});$('#pX').click()}};
  $('#jpo').onclick=()=>{if(confirm('เล่นคนนี้ใหม่? คะแนนของรอบนี้จะถูกล้าง')){seenSigns=-1;cmd({cmd:'goto',phase:'g3_board',round:$('#jp').value,clear:true});$('#pX').click()}};
  $('#xScore').onclick=()=>{if(confirm('ล้างคะแนนเกม 2 และ 3 ทั้งหมด?'))cmd({cmd:'resetScores'})};
  $('#xAll').onclick=openReset;
  $('#xOut').onclick=()=>{panelOpen=false;logout()};
  $('#xXlsx').onclick=exportExcel;
}
async function exportExcel(){
  let j;try{j=await rpc('mm_export',{p_token:token})}catch{return toast('ดาวน์โหลดไม่สำเร็จ ลองอีกครั้ง')}
  if(j.error)return toast(j.error);
  const th=a=>a?A[a].th:'',yn=v=>v===true?'ถูก':v===false?'ผิด':'',d=new Date(j.at),stamp=d.toLocaleString('th-TH'),rows=j.rows||[];
  const sheets=[
    {name:'สรุปรายคน',head:['กลุ่ม','AC','รหัสพนักงาน','ชื่อ','ระดับ','ประเภท','สาขา/ตำแหน่ง','เข้าเกม','สัตว์','คะแนนเกม 2','คะแนนเกม 3','คะแนนรวม'],
      rows:rows.map(r=>[r.groupNo,r.nick,r.id,r.name,r.level,r.group,r.store,r.joined?'เข้าแล้ว':'ยังไม่เข้า',th(r.animal),r.g2,r.g3,r.total])},
    {name:'เกม 1 สัตว์',head:['กลุ่ม','รหัสพนักงาน','ชื่อ','ระดับ','สาขา/ตำแหน่ง','สัตว์','A กระทิง','B อินทรี','C หนู','D หมี','Gap ของฉันคือ','Shift ถัดไปฉันจะ'],
      rows:rows.filter(r=>r.animal).map(r=>[r.groupNo,r.id,r.name,r.level,r.store,th(r.animal),r.counts.bull,r.counts.eagle,r.counts.rat,r.counts.bear,r.gap,r.next])},
    {name:'เกม 2 สั่งงาน',head:['ข้อ','สถานการณ์','กลุ่ม','รหัสพนักงาน','ชื่อ','ลำดับส่ง','กระทิง','อินทรี','หนู','หมี','ถูก (คู่)','คะแนนฐาน','โบนัส','คะแนนรวม'],
      rows:j.g2.map(r=>[r.n,r.title,r.groupNo,r.id,r.name,r.order,yn(r.pairs.bull),yn(r.pairs.eagle),yn(r.pairs.rat),yn(r.pairs.bear),r.correct,r.base,r.bonus,r.pts])},
    {name:'เกม 3 พันธุ์แท้',head:['คนที่','Persona','กลุ่ม','รหัสพนักงาน','ชื่อ','ตอบ','ตอบตอนป้ายที่','ผล','คะแนนฐาน','โบนัส','หักคะแนน','คะแนนรวม'],
      rows:j.g3.map(r=>[r.n,r.persona,r.groupNo,r.id,r.name,r.choice,r.sign,r.correct?'ถูก':'ผิด',r.base,r.bonus,r.penalty,r.pts])},
    {name:'สกอร์บอร์ด',head:['อันดับ','กลุ่ม','AC','รหัสพนักงาน','ชื่อ','คะแนนเกม 2','คะแนนเกม 3','คะแนนรวม','เวลารวม (วินาที)'],rows:j.board.map(r=>[r.rank,r.group,r.nick,r.id,r.name,r.g2,r.g3,r.total,Math.round(r.ms/10)/100])},
    {name:'ข้อมูลไฟล์',head:['รายการ','ค่า'],rows:[['ดาวน์โหลดเมื่อ',stamp],['พนักงานทั้งหมด',rows.length],['เข้าเกมแล้ว',rows.filter(r=>r.joined).length],['ทำเกม 1 แล้ว',rows.filter(r=>r.animal).length]]},
  ];
  const u=URL.createObjectURL(MMXlsx(sheets)),l=document.createElement('a'),p=n=>String(n).padStart(2,'0');
  l.href=u;l.download=`manager-meeting-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.xlsx`;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);toast('ดาวน์โหลดแล้ว');
}
/* boot */
if(token)connect();else showLogin();
