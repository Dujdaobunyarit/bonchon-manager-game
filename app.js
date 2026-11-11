'use strict';
const A = {
  bull:{th:'กระทิง',en:'BULL',dir:'D',strength:'คิดไว ทำไว รับผิดชอบ',gap:'ใจร้อน พูดแรง ข้ามขั้นตอน',borrow:'หนู + หมี',ideal:'ตัดสินใจเร็วแต่พูดสุภาพ สั่งงานด้วย 3Cs ไม่ตะโกน ไม่ข้าม Step',talk:'สั้น ตรง ชัด บอกเป้าหมาย',c:'#e8541e'},
  eagle:{th:'อินทรี',en:'EAGLE',dir:'I',strength:'พูดเป็น สร้างพลัง ชวนทีมลุย',gap:'พูดเยอะ ลืมงาน ไม่ตามผล',borrow:'หมี',ideal:'Think Ahead แล้ว Follow up จนจบ',talk:'พูดคุย เปิดโอกาสให้เสนอไอเดีย / ชื่นชม',c:'#b9791f'},
  rat:{th:'หนู',en:'RAT',dir:'S',strength:'ใส่ใจ รับฟัง สร้างทีมเวิร์ก',gap:'เกรงใจ ไม่กล้าพูด ไม่กล้าตัดสินใจ',borrow:'กระทิง',ideal:'ใส่ใจ แต่กล้าเตือนน้องทันทีเมื่อผิดมาตรฐาน และกล้ารับข้อร้องเรียนด้วย BLAST',talk:'ให้กำลังใจ อธิบายการเปลี่ยนแปลง',c:'#7c7c88'},
  bear:{th:'หมี',en:'BEAR',dir:'C',strength:'รอบคอบ แม่นยำ ทำตามมาตรฐาน',gap:'ยึดติด ช้า ไม่ยืดหยุ่น',borrow:'อินทรี + กระทิง',ideal:'ยึด SOP แต่จัดลำดับความสำคัญได้ตอน Peak (SEE → PRIORITIZE → ACT)',talk:'ให้ข้อมูล ขั้นตอน และ Checklist',c:'#a8672a'},
};
const LEARN = [
  {a:'bull',dir:'D',th:'กระทิง',en:'BULL',tips:[['⚡','สั้น ตรง ชัด'],['🎯','ระบุเป้าหมาย'],['🏁','และผลลัพธ์ที่ต้องการ']]},
  {a:'eagle',dir:'I',th:'อินทรี',en:'EAGLE',tips:[['💬','พูดคุย ชวนมีส่วนร่วม'],['💡','เปิดโอกาสให้เสนอไอเดีย'],['👏','ให้กำลังใจ และชื่นชม']]},
  {a:'rat',dir:'S',th:'หนู',en:'RAT',tips:[['🤝','ให้ความมั่นใจ'],['🪜','อธิบายอย่างเป็นขั้นตอน'],['🌱','และค่อย ๆ ปรับ']]},
  {a:'bear',dir:'C',th:'หมี',en:'BEAR',tips:[['📋','ให้ข้อมูลและรายละเอียด'],['✅','มีขั้นตอน / Checklist'],['🔁','และ Check Back']]},
];
const learnCard=(l,i,open,fresh)=>`<div class="lcard ${open?'open':''} ${fresh?'fresh':''}" style="--d:${i*.4}s"><div class="flipper"><div class="face fback"><b>${l.dir}</b><span>?</span><small>${l.en}</small></div><div class="face front"><i class="dirb">${l.dir}</i><div class="stagef"><span class="glow"></span><img class="a-3d" src="img/${l.a}.png" alt="${l.th}"><span class="shadow"></span></div><h3>${l.th}<small>${l.en}</small></h3><ul>${l.tips.map((t,k)=>`<li style="--k:${k}"><em>${t[0]}</em>${t[1]}</li>`).join('')}</ul></div></div></div>`;
let learnSeen=-1;
const GEL_COL={bull:'#e31b23',eagle:'#f0a500',rat:'#e85c8a',bear:'#2f6fd6'};
const GEL_ACTS=[['SEE FIRST','เห็นปัญหาก่อนลูกค้าต้องเรียก','1, 3, 5, 7'],['COMMUNICATE FIRST','แจ้งลูกค้าทันที ไม่ปล่อยให้รอโดยไม่มีคำตอบ','2, 4, 10'],['COORDINATE TEAM','สื่อสารและประสานทีมให้แก้ปัญหาได้จริง','3, 6, 8'],['OWN THE PROBLEM','รับผิดชอบปัญหา ไม่โยนให้คนอื่น','4, 6, 9, 10'],['FOLLOW THROUGH','ตรวจสอบผลจนลูกค้าได้รับการแก้ไขครบ','2, 5, 8, 9']];
let gelSeen=-1;
const PGROUPS=[['🎓','วัยเรียน',[['Teen Student','ความสนุกและความคุ้มค่า',['p2','p8']]]],['💼','วัยทำงาน',[['Adult · Enjoy Eater','พักผ่อนและสังสรรค์',['p1']],['Late Adult · Enjoy Eater','รสชาติและประสบการณ์',['p3']],['Adult · Mass-Just Eat','อิ่มคุ้มและเลือกง่าย',['p5','p10']]]],['👨‍👩‍👧','ครอบครัวมีลูก',[['Adult with Kids · Enjoy Eater','เวลาคุณภาพกับครอบครัว',['p4','p9']],['Adult with Kids · Mass-Just Eat','ความคุ้มค่าและความสะดวก',['p7']]]],['🦯','วัยเกษียณ',[['Senior','นั่งสบายและใช้เวลากับครอบครัว',['p6']]]]];
const PNAME={p1:'พี่เต๋อ',p2:'น้องปันปัน',p3:'พี่คิ้ม',p4:'พ่อมิค',p5:'พรทิพย์',p6:'ป้านวล',p7:'สมชาย',p8:'น้องมายด์',p9:'พ่อต้น',p10:'น้องเฟิร์น'};
const pAvatar=id=>`<span class="pav pav-${id}" style="background-image:url(img/persona${id.slice(1)}.png)"></span>`;
const PGI=['cap','case','users','cane'];
const personaMap=(small)=>`<div class="pmapx ${small?'sm':''}">${small?'':'<i class="pm-sw"></i><img class="pm-logo" src="img/frame/logo.svg" alt="Bonchon">'}<div class="pm-head"><span class="pm-brand">BONCHON | CUSTOMER SERVICE TRAINING</span><h2>Customer <em>Persona</em></h2><p><b>7 กลุ่มลูกค้า · 10 คน</b> จัดตามช่วงชีวิตและสิ่งที่ให้ความสำคัญ</p></div><div class="pm-cols">${PGROUPS.map(([e,g,types],gi)=>`<div class="pm-col" style="--n:${types.length};--g:${gi}"><div class="pm-gh"><span>${ic(PGI[gi])}</span>${g}</div><div class="pm-types">${types.map(([t,d,ids])=>`<div class="pm-t"><div class="pm-avs">${ids.map(id=>`<div class="pm-av">${pAvatar(id)}<b>${PNAME[id].replace('น้อง','')}</b></div>`).join('')}</div><div class="pm-tag">${t}</div><div class="pm-d">${d}</div></div>`).join('')}</div></div>`).join('')}</div></div>`;
const DECK={p1:[181,182],p2:[47,48,49,50,51,52,53,54],p3:[71,72,73]};
const GV=[['🏪','เดินดูร้านก่อนลูกค้าเรียก'],['⚠️','แจ้งลูกค้าทันทีเมื่อมีปัญหา'],['💬','สื่อสารงานให้ทีมเข้าใจตรงกัน'],['🤝','ช่วยทีมทันทีเมื่อมีงานค้าง'],['⚙️','ตัดสินใจแก้ปัญหาได้'],['👂','รับฟังลูกค้าจนจบ'],['📋','มอบหมายงานชัดเจน'],['✅','ติดตามงานจนเสร็จ'],['⏰','ตรวจความพร้อมก่อนช่วง Peak']];
const IC={store:'<path d="M4 10v10h16V10"/><path d="M2.5 10 4.5 4h15l2 6z"/><path d="M2.5 10a3.2 3.2 0 0 0 6.3 0 3.2 3.2 0 0 0 6.4 0 3.2 3.2 0 0 0 6.3 0"/><path d="M9.5 20v-5h5v5"/>',alert:'<path d="M12 3 2 20.5h20z"/><path d="M12 9.5v5"/><path d="M12 17.6v.1"/>',chat:'<path d="M3.5 5h11a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1H8L4.5 16.5V14a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M15.5 9H20a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1v2.5L17 17h-5a1 1 0 0 1-1-1v-2.5"/>',users:'<circle cx="12" cy="7.5" r="3.2"/><path d="M5.8 20a6.2 6.2 0 0 1 12.4 0z"/><circle cx="4.8" cy="9.5" r="2.2"/><circle cx="19.2" cy="9.5" r="2.2"/><path d="M1 18.5a4 4 0 0 1 4.4-4M23 18.5a4 4 0 0 0-4.4-4"/>',gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 1.8v3.4M12 18.8v3.4M1.8 12h3.4M18.8 12h3.4M4.8 4.8l2.4 2.4M16.8 16.8l2.4 2.4M4.8 19.2l2.4-2.4M16.8 7.2l2.4-2.4"/><circle cx="12" cy="12" r="7"/>',ear:'<path d="M6.5 9a5.5 5.5 0 0 1 11 0c0 3.2-3.2 4.2-3.2 7.3a3.2 3.2 0 0 1-6.3.4"/><path d="M9.5 9.3a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-1.5 3.2"/><path d="M19.5 4.5a8 8 0 0 1 1.3 7.5"/>',list:'<rect x="4.5" y="3.5" width="15" height="18" rx="2"/><path d="M9 3.5V2h6v1.5"/><path d="m7.8 9.5 1.4 1.4 2.3-2.4M7.8 15.5l1.4 1.4 2.3-2.4M13.5 10h3.5M13.5 16h3.5"/>',check:'<circle cx="12" cy="12" r="9.5"/><path d="m7.8 12.4 3 3 5.4-6.2"/>',clock:'<circle cx="12" cy="12" r="9.5"/><path d="M12 6.5V12l3.6 3"/>',eye:'<path d="M2 12.5s3.8-6.5 10-6.5 10 6.5 10 6.5-3.8 6.5-10 6.5S2 12.5 2 12.5z"/><circle cx="12" cy="12.5" r="3"/><path d="M12 1.5v2M5.5 3l1 1.8M18.5 3l-1 1.8"/>',hand:'<path d="m1.5 10.5 4-4 4.2 1.8 2.6-1.5 4.2 1 5.5 3.7"/><path d="m5.5 12.5 4.3 4.3a1.5 1.5 0 0 0 2.1-2.1l1.8 1.8a1.5 1.5 0 0 0 2.1-2.1l1 1a1.5 1.5 0 0 0 2.1-2.1l-4.6-4.6"/>',box:'<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="m8 12.3 3 3 5.2-6"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',target:'<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.6"/><path d="m13 11 7-7M17 4h3v3"/>',phone:'<rect x="6.5" y="2" width="11" height="20" rx="2.2"/><path d="M10.5 18.5h3"/>',pen:'<path d="M15.5 4.5 19.5 8.5 8.5 19.5H4.5v-4z"/><path d="m13.5 6.5 4 4"/>',paw:'<circle cx="7" cy="9" r="2"/><circle cx="12" cy="6.5" r="2"/><circle cx="17" cy="9" r="2"/><path d="M12 12c-3 0-6 4.5-4.5 6.5S11 18 12 18s3 2.5 4.5.5S15 12 12 12z"/>',bulb:'<path d="M9 17.5h6M10 21h4"/><path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.6.5.8 1.2.8 1.9v1.3h6v-1.3c0-.7.2-1.4.8-1.9A6.5 6.5 0 0 0 12 2.5z"/>'};
Object.assign(IC,{gem:'<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 6 3-6M12 9v12"/>',team:'<circle cx="12" cy="6" r="3"/><path d="M7 21v-5a5 5 0 0 1 10 0v5"/><circle cx="4.5" cy="10" r="2"/><circle cx="19.5" cy="10" r="2"/>',heart:'<path d="M12 20.5S3 15 3 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9 2.8C21 15 12 20.5 12 20.5z"/>',smile:'<circle cx="12" cy="12" r="9.5"/><path d="M8 14.5a4.5 4.5 0 0 0 8 0M9 9.5h.1M15 9.5h.1"/>',cap:'<path d="M1.5 9 12 4l10.5 5L12 14z"/><path d="M6 11.3V16c3.3 2.6 8.7 2.6 12 0v-4.7"/><path d="M22.5 9v6"/>',case:'<rect x="2.5" y="7" width="19" height="13" rx="2"/><path d="M9 7V4.5h6V7M2.5 13h19M11 13v2h2v-2"/>',cane:'<path d="M10 21.5V8.5a4.5 4.5 0 0 1 9 0v1"/>',chats:'<path d="M3 5h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8l-4 3v-3H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M15 9h6a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v3l-4-3h-3a2 2 0 0 1-2-1.5"/><path d="M5 9.5h.1M8 9.5h.1M11 9.5h.1"/>',cloche:'<path d="M3 17h18M4.5 17a7.5 7.5 0 0 1 15 0M12 7.5V6M10.5 6h3"/><path d="M2 20.5h20"/>',findp:'<circle cx="8" cy="7" r="3"/><path d="M2 19a6 6 0 0 1 9.5-4.9"/><circle cx="16.5" cy="15.5" r="4"/><path d="m19.5 18.5 3 3"/>',woman:'<circle cx="12" cy="4.5" r="2.5"/><path d="M12 8c-2.2 0-3.4 1.6-3.8 3.4L7 16h3v6h4v-6h3l-1.2-4.6C15.4 9.6 14.2 8 12 8z"/>',cake:'<path d="M4 21V13h16v8z"/><path d="M4 16.5c1.3 1 2.7 1 4 0s2.7-1 4 0 2.7 1 4 0 2.7-1 4 0"/><path d="M8 13V10M12 13V10M16 13V10"/><path d="M8 7.5v.1M12 7.5v.1M16 7.5v.1"/>',city:'<path d="M3 21V9h6v12M9 21V4h8v17M17 21V11h4v10"/><path d="M12 8h2M12 11.5h2M12 15h2M5.5 12.5h1M5.5 16h1"/>',cal:'<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h.1M12 14h.1M16 14h.1M8 17.5h.1M12 17.5h.1"/>',moon:'<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',again:'<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4.5h-4.5"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',fork:'<path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10"/><path d="M17 21V3c-2.2 1.2-3.5 3.6-3.5 7v3H17"/>',calok:'<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="m8.5 15 2.5 2.5 4.5-5"/>',chart:'<path d="M4 20V14M10 20V9M16 20V4"/>'});
const MB_KPI=[[528876,'','สมาชิก'],[2.1,' ครั้ง','ต่อคนต่อปี'],[767,'','บาทต่อบิล'],[1618,'','บาทต่อสมาชิกใน 12 เดือน']];
const MB_STAT=[['woman',67,'เป็นผู้หญิง',''],['cake',65,'อายุ 20–39 ปี','อายุเฉลี่ย 34.3 ปี'],['city',70,'อยู่กรุงเทพฯ และปริมณฑล',''],['cal',38,'มาเสาร์–อาทิตย์','วันศุกร์–อาทิตย์รวม 53%'],['moon',52,'มามื้อเย็นและมื้อดึก',''],['again',51,'มาเพียงครั้งเดียวในรอบ 12 เดือน','']];
const MB_MENU=[['Ramyeon + Wing 4','9'],['ซุป Soondubu','6.9'],['ชีสต๊อกบกกี','5.0'],['Budae Jjigae','4.8']];
const MB_GRP=[[3,'สาวทำงานในเมือง',['ผู้หญิง 67%','อายุ 20–39 ปี 65%','กทม. 70%'],'กลางวันวันธรรมดา · เย็นหลังเลิกงาน','เร็ว อร่อย เมนูเกาหลีที่ชอบ ไม่ต้องรอนาน','แนะนำเซ็ต Ramyeon + Wing และช่องทางสั่งกลับบ้าน'],[1,'แก๊งเพื่อนมื้อเย็นวันหยุด',['Dinner + Late Dinner 52%','ศุกร์–อาทิตย์ 53%'],'เย็นถึงดึก · วันศุกร์–อาทิตย์','เมนูแชร์ บรรยากาศสนุก นั่งได้นาน','แนะนำ Budae Jjigae / ต๊อกบกกีสำหรับแชร์ และชวนเติมเครื่องดื่ม'],[4,'ครอบครัววันหยุด',['อายุ 30–49 ปี 57%','เสาร์–อาทิตย์ 38%'],'มื้อกลางวันหรือมื้อเย็น · วันเสาร์–อาทิตย์','เมนูสำหรับเด็ก ความสะดวก และความคุ้มค่า','ถามระดับความเผ็ด เสนอเก้าอี้เด็ก และแนะนำชุด Soondubu'],[2,'นักเรียน นักศึกษา',['อายุ 10–29 ปี 35%','ช่วง Break (บ่าย) 25%'],'ช่วงบ่าย · หลังเลิกเรียน','ความคุ้มค่า โปรชัด และของทานเล่นที่แชร์กันได้','แนะนำโปรที่มีจริง แจ้งราคาให้ชัด และชวนสมัครสมาชิก']];
const MB_STEP=[['eye','สร้างประสบการณ์แรกที่ดี','ทักทายภายใน 10 วินาที · แจ้งเวลารอ · ดูแลไม่ให้ลูกค้าต้องเรียก'],['fork','แนะนำให้ตรงความต้องการ','ชุดเร็วสำหรับคนทำงาน · เมนูแชร์สำหรับกลุ่มเพื่อน · เมนูเหมาะกับครอบครัว · โปรคุ้มค่าสำหรับนักเรียน'],['calok','ชวนให้กลับมา','ขอบคุณ · ชวนสมัครสมาชิก · แนะนำเมนูหรือโปรที่ตรงใจสำหรับครั้งหน้า']];
const fmtN=(v,d)=>v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const countUp=root=>root.querySelectorAll('[data-n]').forEach((e,i)=>{const t=+e.dataset.n,d=(e.dataset.n.split('.')[1]||'').length,t0=performance.now()+300+i*60,dur=1300;const f=now=>{const k=Math.min(1,Math.max(0,(now-t0)/dur)),ez=1-Math.pow(1-k,3);e.textContent=fmtN(t*ez,d);if(k<1)requestAnimationFrame(f)};e.textContent=fmtN(0,d);requestAnimationFrame(f)});
const C4=['#e3262d','#f2a900','#ea4c89','#2563eb'];
const P2_WHAT=[['eye','พฤติกรรม','Behavior','มาเมื่อไร มากับใคร สั่งอะไร'],['target','ความต้องการ','Needs','อยากได้อะไรจากมื้อนี้'],['alert','ปัญหา','Pain Points','อะไรทำให้ไม่พอใจ'],['bulb','แรงจูงใจ','ในการตัดสินใจซื้อ','อะไรทำให้เลือกเข้าร้านและสั่งเพิ่ม']];
const P2_OCC=[['clock','มื้อเร่งรีบ','ต้องการความเร็ว'],['users','มื้อกับครอบครัว','ต้องการความสะดวกและนั่งสบาย'],['chats','นัดกินกับเพื่อน','อยากแชร์อาหารและใช้เวลาด้วยกัน'],['cake','ฉลองโอกาสพิเศษ','อยากได้มื้อที่น่าจดจำ']];
const P2_WHY=['เข้าใจความต้องการลูกค้า','สื่อสารได้ตรงกลุ่ม','พัฒนาสินค้าและบริการ','สร้างประสบการณ์ที่ดี','ตัดสินใจทางธุรกิจแม่นยำขึ้น'];
const P2_AX=[['วัยเรียน','เงินจากพ่อแม่ เน้นสนุก ของใหม่ ความคุ้ม'],['วัยทำงาน','ดูแลตัวเอง (และพ่อแม่) เวลาจำกัด'],['มีลูก','ลูกมาก่อน เรื่องเด็ก ความสะอาด ปลอดภัย'],['วัยเกษียณ','ใจเย็น เรียบง่าย พึ่งลูกหลานบางเรื่อง']];
const P2_SOP=[['cap','นักเรียน-นักศึกษา','เย็นหลังเลิกเรียน · วันธรรมดา','เซ็ตคุ้มราคา','มาเป็นกลุ่มใหญ่ ต้องการพื้นที่ โต๊ะ เก้าอี้เยอะ','เตรียมต่อโต๊ะ แนะนำเซ็ตแชร์ และโปรประจำเดือน'],['case','พนักงานบริษัท','กลางวัน / หลังเลิกงาน · วันธรรมดา','เมนูที่ได้เร็ว เช่น ชุดไก่ทอด','ต้องการความรวดเร็ว บางครั้งต้องการ Wi-Fi / ปลั๊กไฟ','แจ้งเวลารอให้ชัด เสิร์ฟตามเวลา เช็กบิลให้เร็ว'],['users','ครอบครัว','กลางวัน / เย็น · เสาร์-อาทิตย์','เมนูที่เด็กชอบ เช่น เฟรนช์ฟรายส์','ต้องการเก้าอี้เด็ก ความเอาใจใส่ พื้นที่ให้เด็ก','เห็นเด็ก → เก้าอี้เด็กและ Kid Set ก่อนลูกค้าขอ']];
const p2Head=(t,sub)=>`<div class="p2-head"><span class="p2-eb">BONCHON | PART 2 · รู้จักลูกค้า</span><h1>${t}</h1>${sub?`<p>${sub}</p>`:''}</div>`;
const part2Page=(n,sm)=>{const c=sm?'sm':'';
  if(n===53)return personaMap(sm);
  if(n===47)return `<div class="dkx p2cov ${c}"><span class="dk-brand">BONCHON | CUSTOMER SERVICE TRAINING</span><div class="p2c-main"><span class="p2c-part">PART 2</span><h1><em>รู้จักลูกค้า</em> - รู้จักการบริการ</h1><p>อ่านลูกค้าให้ออก แล้วดูแลก่อนลูกค้าขอ</p></div></div>`;
  if(n===48)return `<div class="p2x ${c}">${p2Head('<b>Persona</b> คืออะไร?','Customer Persona คือภาพตัวแทนของลูกค้าเป้าหมาย ที่สะท้อน <b>4 เรื่องนี้</b>')}<div class="p2-c4">${P2_WHAT.map(([k,t,e,d],i)=>`<div class="p2-card" style="--i:${i};--c:${C4[i]}"><span class="p2-num">${i+1}</span><span class="p2-ic">${ic(k)}</span><h3>${t}</h3><small>${e}</small><p>${d}</p></div>`).join('')}</div><div class="p2-bar"><b>Persona</b> ช่วยให้เราเข้าใจลูกค้าในฐานะ <em>คนจริง</em> ไม่ใช่แค่กลุ่มลูกค้า</div></div>`;
  if(n===49)return `<div class="p2x ${c}">${p2Head('<b>Occasion</b> คืออะไร?','เหตุผลและสถานการณ์ที่ทำให้ลูกค้ามาใช้บริการในวันนี้')}<div class="p2-c4">${P2_OCC.map(([k,t,d],i)=>`<div class="p2-card" style="--i:${i};--c:${C4[i]}"><span class="p2-num">${i+1}</span><span class="p2-ic">${ic(k)}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</div><div class="p2-bar">ลูกค้าคนเดิม แต่<em>ต่าง Occasion</em> ความคาดหวังและบริการที่ต้องการอาจต่างกัน</div></div>`;
  if(n===50)return `<div class="p2x ${c}">${p2Head('รู้จัก <b>Persona</b> ไปทำไม?','เข้าใจลูกค้า เพื่อออกแบบการสื่อสาร สินค้า และบริการให้ตรงจุด')}<div class="p2-why">${P2_WHY.map((t,i)=>`<div class="p2-w ${i===3?'hi':''}" style="--i:${i}"><b>0${i+1}</b><span>${t}</span></div>`).join('')}</div><div class="p2-eq">${['WHO','NEED','PAIN POINT','BEHAVIOR'].map((t,i)=>`<span class="p2-t" style="--i:${i};--c:${C4[i]}">${t}</span><i>${i<3?'+':'='}</i>`).join('')}<span class="p2-t res" style="--i:4">CUSTOMER <em>PERSONA</em></span></div><div class="p2-bar lt">ยิ่งเข้าใจลูกค้า <em>ยิ่งออกแบบบริการได้ตรงใจ</em></div></div>`;
  if(n===51)return `<div class="p2x ${c}">${p2Head('ตัวอย่าง <b>Customer Persona</b>','จากข้อมูลลูกค้า 1 คน สู่สิ่งที่ร้านควรทำ')}<div class="p2-ex"><div class="p2-min"><div class="p2-mh"><span>มิน</span><div><b>มิน</b><small>อายุ 28 ปี · พนักงานออฟฟิศ</small></div></div><ul><li>เวลาทานอาหารกลางวันจำกัด</li><li>ชอบความรวดเร็วและความคุ้มค่า</li><li>ใช้ Facebook, TikTok และ Food Delivery App</li></ul></div><span class="p2-arr">→</span><div class="p2-do"><h3>สิ่งที่ร้านควรทำ</h3>${[['Lunch Set','เซ็ตกลางวันที่คุ้มค่า เลือกง่าย'],['ลดเวลารออาหาร','แจ้งเวลารอให้ชัด เสิร์ฟตามเวลา'],['Mobile Ordering','สั่งล่วงหน้าผ่านมือถือ ไม่ต้องรอคิว']].map(([t,d],i)=>`<div class="p2-di" style="--i:${i}"><b>${i+1}</b><div><h4>${t}</h4><p>${d}</p></div></div>`).join('')}</div></div></div>`;
  if(n===52)return `<div class="p2x ${c}">${p2Head('<b>Persona</b> ดูจาก 2 แกน','ลูกค้าแต่ละคน = ช่วงชีวิต + สไตล์หรือความคาดหวังต่อมื้ออาหาร · ไม่ใช่ดูแค่หน้าตาหรืออายุ')}<h3 class="p2-ax">แกนที่ 1 · ช่วงชีวิต</h3><div class="p2-life">${P2_AX.map(([t,d],i)=>`${i?'<i>›</i>':''}<div class="p2-l" style="--i:${i}"><b><span>${i+1}</span>${t}</b><p>${d}</p></div>`).join('')}</div><h3 class="p2-ax">แกนที่ 2 · สไตล์หรือความคาดหวังต่อมื้ออาหาร</h3><div class="p2-style"><div class="p2-s dk" style="--i:0"><h4>Enjoy Eater</h4><p>ตั้งใจมาทานให้อร่อย ใช้เงินเพื่อประสบการณ์</p><small><b>บริการ:</b> แนะนำเมนูใหม่ ของหวาน ดูแลให้รู้สึกพิเศษ</small></div><div class="p2-s" style="--i:1"><h4>Mass – Just Eat</h4><p>มาทานให้อิ่ม เน้นคุ้มค่า ระวังการใช้เงิน</p><small><b>บริการ:</b> แนะนำโปรประจำเดือน เซ็ตคุ้ม บอกราคาให้ชัด</small></div></div></div>`;
  return `<div class="p2x ${c}">${p2Head('<b>3 กลุ่มลูกค้า</b>ที่ทีมร้านเจอบ่อย และสิ่งที่ควรทำ','จาก SOP: มาเมื่อไร สั่งอะไร ต้องการอะไร แล้วเรา Think Ahead อะไรได้บ้าง')}<div class="p2-sop">${P2_SOP.map(([k,t,w,o,n2,th],i)=>`<div class="p2-g" style="--i:${i}"><div class="p2-gh">${ic(k)}<b>${t}</b></div><dl><dt>มาเมื่อไร</dt><dd>${w}</dd><dt>มักสั่ง</dt><dd>${o}</dd><dt>ต้องการ</dt><dd>${n2}</dd></dl><div class="p2-th"><b>Think Ahead</b>${th}</div></div>`).join('')}</div></div>`;
};
const MS_ROLE=[['eye','SEE FIRST','เห็นก่อน'],['chat','COMMUNICATE FIRST','สื่อสารก่อน'],['gear','CONTROL THE FLOW','คุม Flow'],['users','SUPPORT THE TEAM','ช่วยทีม'],['chart','DRIVE SALES','เพิ่มยอดขาย']];
const MS_MIND=[['users','PEOPLE FIRST','เราให้ความสำคัญกับลูกค้าเป็นอันดับแรก'],['gem','SERVICE EXCELLENCE','เราส่งมอบมาตรฐานการบริการที่เหนือความคาดหวัง'],['team','TEAM LEADERSHIP','เราประสานทุกตำแหน่งให้ทำงานเป็นทีมเดียว'],['heart','GUEST LOYALTY','เราสร้างความสัมพันธ์และลูกค้าประจำของร้าน']];
const MS_REQ=[['cal','Full Time อายุงาน <em>6 เดือนขึ้นไป</em>'],['users','ผ่านการคัดเลือกโดย <em>Area Coach</em> และ <em>Store Manager</em>'],['target','สอบ Customer Service <em class="hl">≥ 95%</em>'],['calok','ประเมิน <em>7 Service Steps</em> หน้างาน <em class="hl">100%</em> โดย Area Coach'],['chat','พนักงานต่างชาติสื่อสารภาษาไทยกับลูกค้าได้'],['cap','ผ่าน Train the Trainer + Workshop GEL <em class="hl">(11 NOV)</em> + 30-Day CARE Challenge + Persona']];
const MS_GOAL=[['users','ยกระดับ','ประสบการณ์ลูกค้า'],['chart','มาตรฐาน','การบริการที่เป็นเลิศ'],['heart','สร้าง Brand Promise','ของ Bonchon']];
const msTitle=(pre)=>`<h1 class="ms-t">${pre?`<small>${pre}</small>`:''}<em>MASTER</em> SERVICE</h1>`;
const msPage=(r,sm)=>{const c=sm?'sm':'',ph=sm?'':'<div class="ms-ph"><img src="img/ms-photo.jpg" alt=""></div>';
  if(r===0)return `<div class="msx dk ${c}">${ph}<div class="ms-l"><img class="ms-logo" src="img/frame/logo.svg" alt="Bonchon"><span class="ms-kfc">KOREAN FRIED CHICKEN</span>${msTitle('')}<div class="ms-gel"><b>GEL:</b> Guest Experience Leader</div><p class="ms-sp">PEOPLE <i>|</i> SERVICE <i>|</i> EXPERIENCES<br>A STRONGER BONCHON TOGETHER</p><div class="ms-3">${[['users','GREAT PEOPLE'],['heart','MEANINGFUL SERVICE'],['smile','HAPPIER MOMENTS']].map(([k,t],i)=>`<div style="--i:${i}">${ic(k)}<b>${t}</b></div>`).join('')}</div></div></div>`;
  if(r===1)return `<div class="msx ${c}">${ph}<div class="ms-l"><span class="ms-what">WHAT IS</span>${msTitle('')}<div class="ms-gel">GEL: Guest Experience Leader</div><p class="ms-p"><b>Master Service</b> คือผู้เชี่ยวชาญด้านการสร้างประสบการณ์ที่ยอดเยี่ยมให้แก่ลูกค้าในทุกช่วงเวลาของการใช้บริการ ต่อยอดจากบทบาท <b>GEL</b> ผู้นำหน้าร้านประจำกะที่ประสานทุกตำแหน่งให้ทำงานเป็นทีมเดียว</p><div class="ms-roles">${MS_ROLE.map(([k,e,t],i)=>`<div style="--i:${i}"><span>${ic(k)}</span><b>${e}</b><small>${t}</small></div>`).join('')}</div><h3 class="ms-band">MASTER SERVICE <em>MINDSET</em></h3><div class="ms-mind">${MS_MIND.map(([k,e,t],i)=>`<div style="--i:${i}"><span>${ic(k)}</span><b>${e}</b><small>${t}</small></div>`).join('')}</div></div></div>`;
  if(r===2)return `<div class="msx ${c}">${ph}<div class="ms-l">${msTitle('คุณสมบัติ')}<div class="ms-req">${MS_REQ.map(([k,t],i)=>`<div style="--i:${i}"><span>${ic(k)}</span><p>${t}</p></div>`).join('')}</div><div class="ms-goal"><b class="ms-gt">Master Service <em>Goal</em></b>${MS_GOAL.map(([k,a,b],i)=>`<div style="--i:${i}">${ic(k)}<b>${a}</b><small>${b}</small></div>`).join('')}</div></div></div>`;
  if(r===3)return `<div class="msx dk soon ${c}">${ph}<div class="ms-l">${msTitle('')}<div class="ms-soon"><span>📣</span><b>COMING SOON</b></div><p class="ms-sub">เตรียมพบกับโครงการยกระดับมาตรฐานการบริการของ Bonchon <em>เร็ว ๆ นี้!</em></p></div></div>`;
  return `<div class="brk ${c}"><div class="brk-cup"><i></i><i></i><i></i><span>☕</span></div><h1>Break</h1><p>พักเบรก แล้วพบกันในช่วงถัดไป</p><div class="brk-foot">GOOD FOOD <i>•</i> GOOD PEOPLE <i>•</i> GOOD DAY</div></div>`;
};
const RC_Q=['จำอะไรได้จากครั้งที่แล้ว?','นำอะไรไปใช้ที่ร้านแล้ว?','เกิดผลลัพธ์หรือเจออุปสรรคอะไร?'];
const RC_G=[['0–49%','ยังไม่ต่อเนื่อง','#e3262d',.22],['50–79%','ทำได้บางช่วง','#f5b700',.64],['80–100%','ทำได้สม่ำเสมอ','#2bb24c',.9]];
const gauge=(c,f,i)=>`<svg class="rc-gauge" viewBox="0 0 200 110"><path d="M20 100a80 80 0 0 1 160 0" class="bg"/><path d="M20 100a80 80 0 0 1 160 0" class="fg" style="stroke:${c};--f:${f};--i:${i}"/></svg>`;
const prePage=(r,sm)=>{const c=sm?'sm':'';
  if(r===0)return `<div class="rcx ${c}">${sm?'':SWOOSH}<div class="rc-top"><span class="gx-tag">01 | RECAP</span><b>Q3 Great Service</b></div><h1 class="rc-h"><span class="gg-badge">Service</span> ครั้งที่แล้ว<em>เรียนอะไร?</em></h1><p class="rc-sub">เดือนที่แล้ว เราเรียนรู้เรื่อง <b>Great Service</b> และบทบาทของ <b>GEL</b><br>วันนี้อยากฟังว่า <b>ใครนำไปใช้จริงแล้วบ้าง?</b></p><div class="rc-body"><div class="rc-art"><span class="rc-chat">${ic('chats')}<i></i><i></i><i></i></span><span class="rc-ppl">${ic('users')}</span></div><div class="rc-qs">${RC_Q.map((q,i)=>`<div class="rc-q" style="--i:${i}"><b>${i+1}</b><span>${q}</span></div>`).join('')}</div></div></div>`;
  return `<div class="rcx ${c}">${sm?'':SWOOSH}<div class="rc-top"><span class="gx-tag">02 | GEL REALITY CHECK</span></div><h1 class="rc-h">ร้านของคุณ GEL System <em>เกิดขึ้นจริงกี่ %?</em></h1><p class="rc-sub">ถ้าวันนี้ต้องให้คะแนนร้านตัวเอง <b class="r">0–100%</b> GEL ทำหน้าที่ได้จริงแค่ไหน?</p><div class="rc-gs">${RC_G.map(([p,l,col,f],i)=>`<div class="rc-g" style="--i:${i};--c:${col}">${gauge(col,f,i)}<b>${p}</b><span>${l}</span></div>`).join('')}</div><div class="rc-why"><span>?</span><b>และอะไรคือ<em>สาเหตุ</em>ที่ยังไม่ถึง 100%?</b></div></div>`;
};
const RV=[['กลับมาอีก 1 ครั้ง (เป้าที่จับต้องได้)','206.9',206.9,1],['ใช้จ่ายเท่าค่าเฉลี่ย 1,618 บาท/ปี','229.5',229.5,0],['มาบ่อยเท่ากลุ่มมาซ้ำ (~3.2 ครั้ง/ปี)*','~464',464,0]];
const SUM3=[['users','รู้จักทีม','เข้าใจจุดแข็งและวิธีสื่อสาร',['สังเกตจุดแข็งและวิธีทำงานของแต่ละคน','เลือกวิธีสื่อสารให้เหมาะกับทีม','กฎความปลอดภัยใช้เหมือนกันทุกคน']],['findp','รู้จักลูกค้า','Persona + Occasion + สิ่งที่ลูกค้าบอกจริง',['Persona บอกว่าเขาเป็นใคร','Occasion บอกว่าวันนี้เขามาเพื่ออะไร','สังเกตทั้งสองอย่างก่อนบริการ']],['cloche','รู้จักวิธีบริการ','5 ช่วงบริการ',['ต้อนรับ · เลือกเมนู · เสิร์ฟอาหาร · ระหว่างทาน · ก่อนกลับ','สังเกต → สอบถาม → แนะนำ → ยืนยัน → ติดตาม','ปรับตามสถานการณ์ ดูแลทุกคนอย่างเท่าเทียม']]];
const endPage=(r,sm)=>{const c=sm?'sm':'';
  if(r===3)return `<div class="rvx ${c}"><span class="mb-tag">REPEAT VISIT OPPORTUNITY</span><h1>ถ้าลูกค้า <em>51%</em> ที่มาครั้งเดียว กลับมาซ้ำอีกแค่ <b>1 ครั้ง</b></h1><div class="rv-big"><b>+<span data-n="207">207</span></b><div><h2>ล้านบาท / ปี</h2><p>269,727 คน × 767 บาทต่อบิล · ยอดขายสมาชิกเพิ่มขึ้น <em>+24%</em></p></div></div><div class="rv-cards">${RV.map(([l,v,n,hi],i)=>`<div class="rv-c ${hi?'hi':''}" style="--i:${i};--w:${n/464*100}%"><small>${l}</small><b>${v} <span>ล้านบาท</span></b><i><u></u></i></div>`).join('')}</div><p class="rv-note">ฐาน: สมาชิก 528,876 คน · ยอดขายสมาชิกรวม ≈ 855.7 ล้านบาท/ปี · *ประมาณจากค่าเฉลี่ย 2.1 ครั้ง/คน/ปี</p></div>`;
  if(r===4)return `<div class="dkx s3x ${c}"><span class="dk-brand">BONCHON | CUSTOMER SERVICE TRAINING</span><h1 class="dk-h">สรุป <b>3</b> เรื่องก่อนให้บริการ</h1><div class="s3-cards">${SUM3.map(([k,t,h,l],i)=>`<div class="s3-c" style="--i:${i}"><div class="s3-hd"><span>${i+1}</span><b>${t}</b></div><div class="s3-sub">${ic(k)}<b>${h}</b></div><ul>${l.map(x=>`<li>${x}</li>`).join('')}</ul></div>`).join('')}</div><div class="s3-commit">${ic('target')}<b>คำมั่นของฉัน: สิ่งที่จะลองทำในกะถัดไป คือ <i></i></b></div></div>`;
  return `<div class="dkx tkx ${c}"><span class="dk-brand">BONCHON | CUSTOMER SERVICE TRAINING</span><span class="tk-tag">GEL • KEY TAKEAWAY</span><div class="tk-main"><p class="tk-l1"><b>GEL</b> ที่ดีไม่ได้วัดจากความตั้งใจ</p><p class="tk-l2">แต่วัดจากสิ่งที่ลูกค้าและทีม</p><p class="tk-l3"><span>เห็นในร้านทุกวัน</span></p><div class="tk-div"><i></i>${ic('users')}<i></i></div><p class="tk-sub">เปลี่ยนความตั้งใจให้เป็นพฤติกรรมที่ลูกค้าสัมผัสได้ และทีมทำได้จริงทุกวัน</p></div><div class="tk-foot">GOOD FOOD <i>•</i> GOOD PEOPLE <i>•</i> GOOD DAY</div></div>`;
};
const memberPage=(r,sm)=>{const c=sm?'sm':'';if(r>=3)return endPage(r,sm);
  if(r===0)return `<div class="mbx ${c}"><div class="mb-head"><span class="mb-tag">MEMBER PROFILE 12M</span><h1>ลูกค้าสมาชิกบอนชอนเป็นใคร <small>ข้อมูลสมาชิกย้อนหลัง <b>12 เดือน</b></small></h1></div><div class="mb-kpis">${MB_KPI.map(([n,u,l],i)=>`<div class="mb-k" style="--i:${i}"><b><span data-n="${n}">${fmtN(n,String(n).includes('.')?1:0)}</span>${u}</b><small>${l}</small></div>`).join('')}</div><div class="mb-stats">${MB_STAT.map(([k,p,a,b],i)=>`<div class="mb-s ${i===5?'hot':''}" style="--i:${i};--p:${p}"><span class="mb-ring"><i>${ic(k)}</i></span><div><b><span data-n="${p}">${p}</span>%</b><p>${a}${b?`<small>(${b})</small>`:''}</p></div></div>`).join('')}</div><div class="mb-menu"><span class="mb-mt">เมนูยอดนิยม <small>(% ของบิล)</small></span><div class="mb-ml">${MB_MENU.map(([n,p],i)=>`<div class="mb-mi" style="--i:${i};--w:${+p/9*100}%"><b>${n}</b><span><i></i></span><em>${p}%</em></div>`).join('')}</div></div><div class="mb-sum"><b>สรุป</b><span>ลูกค้าหลักคือผู้หญิงวัยทำงาน อยู่ในเมือง มาช่วงเย็นและวันหยุด แต่ครึ่งหนึ่งยังมาแค่ครั้งเดียว <em>โจทย์ใหญ่คือทำให้กลับมาซื้อซ้ำ</em></span></div></div>`;
  if(r===1)return `<div class="mbx ${c}"><div class="mb-head"><span class="mb-tag">4 กลุ่มสมาชิกจากข้อมูล</span><h1>สมาชิก 4 กลุ่มที่ร้านควรรู้จัก</h1></div><div class="mb-grps">${MB_GRP.map(([p,t,chips,w,l,d],i)=>`<div class="mb-g" style="--i:${i}"><div class="mb-gh"><span class="mb-av"><img src="img/persona${p}.png" alt=""></span><div><h2>${t}</h2><div class="mb-chips">${chips.map(x=>`<span>${x}</span>`).join('')}</div></div></div><div class="mb-rows"><div>${ic('cal')}<b>มาเมื่อไร</b><span>${w}</span></div><div>${ic('search')}<b>มองหาอะไร</b><span>${l}</span></div><div class="do">${ic('fork')}<b>ร้านควรทำอะไร</b><span>${d}</span></div></div></div>`).join('')}</div></div>`;
  return `<div class="mbx ${c}"><div class="mb-head"><span class="mb-tag">OPPORTUNITY · โอกาสซื้อซ้ำ</span><h1>เปลี่ยนสมาชิกที่มา 1 ครั้งในรอบ 12 เดือน <em>ให้กลับมาอีก</em></h1></div><div class="mb-opp"><div class="mb-big"><div class="mb-donut"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" class="bg"/><circle cx="60" cy="60" r="50" class="fg"/></svg><b><span data-n="51">51</span>%</b></div><p>สมาชิกที่มา <b>1 ครั้ง</b><br>ในรอบ 12 เดือน</p><div class="mb-back"><b>สมาชิกที่กลับมาซื้อซ้ำ <em><span data-n="49">49</span>%</em></b><small>มาเฉลี่ย 2.1 ครั้งต่อปี · ใช้จ่ายเฉลี่ย 767 บาทต่อบิล</small></div></div><div class="mb-steps">${MB_STEP.map(([k,t,d],i)=>`${i?'<span class="mb-down"></span>':''}<div class="mb-st" style="--i:${i}"><span class="mb-si">${ic(k)}</span><div><h3><em>0${i+1}</em> ${t}</h3><p>${d}</p></div></div>`).join('')}<div class="mb-track">${ic('chart')}<b>ติดตามผล:</b><span>% สมาชิกซื้อซ้ำ · Frequency · ยอดขายรายเดือน · NPS · ข้อร้องเรียน</span></div></div></div></div>`;
};
const ic=(k,c='')=>`<svg class="ic ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
const GVI=['store','alert','chat','users','gear','ear','list','check','clock'];
const SWOOSH='<i class="sw sw1"></i><i class="sw sw2"></i><i class="sw sw3"></i><i class="sw sw4"></i>';
const GG_STEPS=[['self','user','รู้จักตัวเอง','เข้าใจจุดแข็ง<br>และ<em>สิ่งที่ต้องพัฒนา</em>'],['team','users','รู้จักทีม','รู้ศักยภาพ<br>แบ่งบทบาท และทำงานร่วมกัน'],['do','target','ลงมือปฏิบัติ','ฝึกตัดสินใจ สื่อสาร และประสานทีม<br>จาก 10 สถานการณ์จริง']];
const GG_VALS=[['eye','SEE','FIRST'],['chat','COMMUNICATE','FIRST'],['users','COORDINATE','TEAM'],['hand','OWN','THE PROBLEM'],['box','FOLLOW','THROUGH']];
const KY_STEPS=[['phone','ทำแบบประเมินในมือถือ','เริ่มในหน้าถัดไป'],['pen','ตอบตามที่เป็นจริง','ไม่ใช่ตามที่คิดว่าควรเป็น'],['paw','ดูผลสไตล์ของตัวเอง','จำไว้ ใช้ต่อใน Workshop'],['users','รวมกลุ่มตามผล','แชร์กับเพื่อนที่ได้ผลเดียวกัน']];
const goodGel=sm=>`<div class="ggx ${sm?'sm':''}">${sm?'':SWOOSH}<span class="gx-tag">04 | WHAT GOOD LOOKS LIKE</span><h1 class="gg-h"><span class="gg-badge">Good GEL</span> <span>ไม่ใช่คนที่ทำทุกอย่างเอง</span></h1><div class="gg-band">แต่คือคนที่ทำให้ทั้งทีมส่งมอบ <em>Great Service ได้ทุก Shift</em></div><div class="gg-steps">${GG_STEPS.map(([img,icn,t,d],i)=>`${i?'<span class="gg-arr"><i></i><i></i><i></i></span>':''}<div class="gg-step" style="--i:${i}"><div class="gg-pic"><img src="img/gg-${img}.jpg" alt=""></div><div class="gg-lab"><span>${ic(icn)}</span><b>${t}</b></div><p>${d}</p></div>`).join('')}</div><div class="gg-vals">${GG_VALS.map(([k,a,b],i)=>`<div class="gg-v" style="--i:${i}">${ic(k)}<b>${a}<br>${b}</b></div>`).join('')}</div></div>`;
const knowSelf=sm=>`<div class="kyx ${sm?'sm':''}"><div class="ky-head"><span class="ky-part">PART 1 · <small>รู้จักคน</small></span><h1>รู้จักตัวเองก่อน <em>แล้วค่อยรู้จักทีม</em></h1><p>ค้นหาสไตล์การทำงานของคุณ ด้วยแบบประเมินสั้น ๆ ในมือถือ</p></div><div class="ky-body"><div class="ky-l"><div class="ky-q"><span class="ky-mark">?</span>${AK.map((a,i)=>`<img class="ky-a ky-${a}" src="img/${a}.png" alt="" style="--i:${i}">`).join('')}</div><h2>การทำงานของคุณ เป็นแบบไหน<b>?</b></h2><p>ทุกคนมีหลายสไตล์ผสมกัน ไม่มีแบบไหนดีกว่าแบบไหน</p></div><div class="ky-r"><span class="ky-how">ทำอย่างไร</span>${KY_STEPS.map(([k,a,b],i)=>`<div class="ky-s" style="--i:${i}"><span>${ic(k)}</span><div><b>${a}</b><small>${b}</small></div></div>`).join('')}</div></div></div>`;
const gvoteBoard=g=>`<div class="scr gvx">${SWOOSH}<div class="gx-l"><span class="gx-tag">03 | GEL ที่มีประสิทธิภาพ</span><h1 class="gx-h">GEL ที่ดี <em>ต้องมีพฤติกรรมอะไรบ้าง?</em><svg class="gx-ul" viewBox="0 0 600 30" preserveAspectRatio="none"><path d="M5 22 Q 300 2 595 14"/></svg></h1><p class="gx-q"><span class="gx-bub">${ic('chat')}</span><span>ร่วมกันเลือก <b>Top 3 พฤติกรรม</b><br>ที่อยากให้ GEL ที่ร้านทำได้ดีที่สุด</span></p><div class="gx-grid">${GV.map(([e,t],i)=>`<div class="gx-c ${i%2?'dk':'rd'}" style="--i:${i}"><span class="gx-ic">${ic(GVI[i])}</span><b>${t}</b></div>`).join('')}</div></div><div class="gx-r"><div class="gx-bulb">${ic('bulb')}<i></i><i></i><i></i></div><div class="gx-pill">ร่วมกันเลือก<br><b>Top 3 พฤติกรรม</b></div><p class="gx-ask">แล้วตอบว่า<b>พฤติกรรมนี้</b><br>ต้องเห็น GEL ทำอะไรจริง<br>ในร้าน?</p><div class="gx-count"><span class="gx-ph">${ic('phone')} เลือก 3 ข้อในมือถือ</span><div class="gx-num"><b data-b="gvn">${g.voters}</b>/${g.people}<small>คนโหวตแล้ว</small></div><div class="gx-bar"><i id="gxbar" style="width:${g.people?g.voters/g.people*100:0}%"></i></div></div><div class="gx-tip">${ic('target')}<span><b>หลักคิด:</b> เลือกสิ่งที่สังเกตได้ สอนทีมได้ และตรวจสอบได้</span></div></div></div>`;
const gvRank=g=>GV.map((b,i)=>({i,n:(g.counts||[])[i]||0,l4:(g.l4||[])[i]||0,l5:(g.l5||[])[i]||0})).sort((a,b)=>b.n-a.n||a.i-b.i);
const gvChart=(g,mine,small)=>{const r=gvRank(g),max=Math.max(1,r[0].n),v=g.voters||0;let rank=0,prev=-1;return `<div class="gvc ${small?'sm':''}">${r.map((x,k)=>{if(x.n!==prev){rank=k+1;prev=x.n}const top=x.n>0&&rank<=3;return `<div class="gvr ${top?'gtop':''} ${mine&&mine.includes(x.i)?'mine':''}" style="--w:${Math.round(x.n/max*100)}%;--d:${k*.08}s"><span class="gvk">${top?['🥇','🥈','🥉'][rank-1]:rank}</span><span class="gvl"><i>${GV[x.i][0]}</i>${GV[x.i][1]}</span><span class="gvb"><b></b></span><span class="gvn"><b>${x.n}</b><small>${v?Math.round(x.n/v*100):0}%</small></span></div>`}).join('')}</div>`};
const slideUrl=n=>`${CFG.supabaseUrl}/storage/v1/object/public/slides/p${n}.jpg`;
const deckNow=()=>{const l=DECK[V.phase]||[];return l[Math.min(V.round,l.length-1)]};
const gelCard=(a,i,open,fresh)=>open?`<div class="gelc ${fresh?'fresh':''}" style="--gc:${GEL_COL[a]}"><div class="gtop"><span class="gimg"><img src="img/${a}.png" alt=""></span><b>${A[a].th}<small>${A[a].en}</small></b></div><ul><li><i class="k">✓</i><span><em>เก็บไว้</em>${A[a].strength}</span></li><li><i class="x">✗</i><span><em>ทิ้ง</em>${A[a].gap}</span></li><li><i class="b">⇄</i><span><em>ยืมจุดแข็งจาก</em>${A[a].borrow}</span></li></ul></div>`:`<div class="gelc shut" style="--gc:${GEL_COL[a]}"><span>?</span><b>${A[a].th}</b></div>`;
const gelHead='<span class="gtag">BONCHON | RECAP กิจกรรมที่ 1</span><h1 class="gh">สรุปกิจกรรมที่ 1: พฤติกรรม 4 ประเภท สู่ <em>GEL</em></h1><p class="gsub"><b>ทุกคนปรับสไตล์ได้</b> | เลือกวิธีสื่อสารให้เหมาะกับคน แต่ต้องรักษามาตรฐาน Service เดียวกัน</p>';
const gelFoot='<b>GEL ที่พร้อมนำทีม</b> = เร็วแบบกระทิง • สร้างพลังแบบอินทรี • ใส่ใจแบบหนู • แม่นยำแบบหมี';
const gelActs=()=>`<span class="gtag">BONCHON | RECAP</span><h1 class="gh">ไม่ว่าจะเป็น GEL แบบไหน <em>ทุกคนต้องทำ 5 เรื่องนี้ให้ได้</em></h1><p class="gsub gsub2">ONE SERVICE STANDARD • 5 ACTIONS EVERY GEL MUST DELIVER</p><div class="gacts">${GEL_ACTS.map((x,i)=>`<div class="gact" style="--k:${i}"><b>0${i+1}</b><span class="en">${x[0]}</span><span class="th">${x[1]}</span><span class="sc">สถานการณ์ ${x[2]}</span></div>`).join('')}</div><div class="gfoot on">SEE IT • SAY IT • SOLVE IT • OWN IT • CHECK IT</div>`;
const DISC=[['bull','D','Dominance','นักลุย กล้าตัดสินใจ มุ่งผลลัพธ์','🎯','สั้น • ตรง • ชัด ระบุเป้าหมายและผลลัพธ์'],['eagle','I','Influence','นักสื่อสาร สร้างแรงจูงใจ ชอบมีส่วนร่วม','💬','พูดคุย ชวนมีส่วนร่วม ให้กำลังใจ / ชื่นชม'],['rat','S','Steadiness','นักประสานงาน ใจเย็น ช่วยเหลือทีม','🤝','ให้ความมั่นใจ อธิบายอย่างเป็นขั้นตอน ค่อย ๆ ปรับ'],['bear','C','Conscientiousness','นักวิเคราะห์ รอบคอบ เน้นความถูกต้อง','📋','ให้ข้อมูลและรายละเอียด มีขั้นตอน / Checklist และ Check Back']];
const discScreen=(m,top,sub)=>{m.innerHTML=`<div class="disc"><div class="disc-watch">👀 ${watchText()}${top?`<b>${top}</b>`:''}${sub?`<small>${sub}</small>`:''}</div><div class="disc-head"><span class="disc-tb">TEAM <i>BONCHON</i></span><h2>สั่งงาน<em>ให้ตรงประเภท</em></h2><p><b>DISC</b> = ปรับวิธีสื่อสาร ไม่ใช่ติดป้ายคน</p><p class="disc-std">สไตล์ต่างกัน แต่ Service &amp; Safety Standard เดียวกัน</p></div><div class="disc-list">${DISC.map(([a,L,w,p,ic,t],i)=>`<div class="disc-c ${i%2?'dk':''}" style="--i:${i}"><div class="disc-pic"><img src="img/${a}.png" alt=""></div><div class="disc-txt"><div class="disc-name"><b class="L">${L}</b><span><b>${A[a].th}</b><small>${w}</small></span></div><p><em>บุคลิก</em>${p}</p><p class="how"><em>วิธีสื่อสาร / สั่งงาน</em><span>${ic}</span> ${t}</p></div></div>`).join('')}</div></div>`};
const LGKEY=()=>'lg:'+(V.me&&V.me.id);
const watchAnimals=(m,top,sub)=>{m.innerHTML=`<div class="center wa"><div class="wa-zoo">${AK.map((a,i)=>`<img class="wa-a" style="--i:${i}" src="img/${a}.png" alt="${A[a].th}">`).join('')}</div><div class="wa-bub">👀 ${watchText()}</div>${top?`<h2 class="h brush">${top}</h2>`:''}${sub?`<p class="sub">${sub}</p>`:''}</div>`};
const FRAME=`<div class="fart"><img class="fbase" src="img/frame/base.svg" alt=""><img class="f-logo" src="img/frame/logo.svg" alt="Bonchon"><img class="f-crown" src="img/frame/crown.svg" alt=""><img class="f-sp s1" src="img/frame/spark.svg" alt=""><img class="f-sp s2" src="img/frame/spark.svg" alt=""><img class="f-sp s3" src="img/frame/spark.svg" alt=""><img class="f-ry" src="img/frame/rays-y.svg" alt=""><img class="f-drum" src="img/frame/drum.svg" alt=""><img class="f-chick" src="img/frame/chicken.svg" alt=""><img class="f-rr" src="img/frame/rays-r.svg" alt=""><img class="f-buck" src="img/frame/bucket.svg" alt=""></div>`;
const recapKey=()=>V.round+'|'+V.recapTab;let recapSeen={k:'',n:0},recapCheer='';
const unq=t=>String(t).replace(/^["“”\s]+|["“”\s]+$/g,'');
const recapList=()=>AK.map(a=>V.answer.find(x=>x.a===a)).filter(Boolean);
const recapBody=(x,w)=>w?`<p class="rlab">ถ้าพูดว่า</p><p class="rsay">“${esc(unq(x.wrong.say))}”</p><p class="rlab">ผลที่ได้</p><p class="rres">${esc(x.wrong.result)}</p>`:`<p class="rlab">พูดให้ตรงสไตล์</p><p class="rcmd">${esc(x.cmd)}</p>`;
const recapCard=(x,i,open,fresh,w)=>`<div class="lcard rcp ${w?'bad':'good'} ${open?'open':''} ${fresh?'fresh':''}" data-rc="${i}" style="--d:${i*.4}s"><div class="flipper"><div class="face fback"><b>${i+1}</b><span>?</span><small>${A[x.a].th}</small></div><div class="face front"><i class="verd">${w?'✗':'✓'}</i><div class="stagef"><img class="a-3d" src="img/${x.a}.png" alt="${A[x.a].th}"><span class="shadow"></span><span class="fx">${w?'💢':'✨'}</span></div><h3>${A[x.a].th}</h3><div class="rtext">${recapBody(x,w)}</div></div></div></div>`;
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
  app.innerHTML=`<div class="login"><div class="lframe">${FRAME}<div class="lban"><span class="tag k">TEAM BONCHON</span><h1 class="brush">Manager <em>Meeting</em> Game</h1></div></div><form class="login-card" id="f" autocomplete="off">
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
function logout(){if(token)rpc('mm_logout',{p_token:token}).catch(()=>{});store.del('tok');token=null;if(channel)sb.removeChannel(channel);channel=null;liveFor=null;lastRev=null;V=null;lastKey='';boBuilt=false;showLogin();}

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
  return [V.phase,V.round,V.board,V.recapTab,V.recapOpen||0,(m.gvPicks||[]).join(','),m.g1||'',m.submitted?1:0,x.signs||0,(x.signPoints||[]).join(','),g.choice||'',m.group?m.group.no:''].join('|');
}
function renderPlayer(){
  if(V.phase==='idle'||V.phase==='lobby'){store.del('q:'+V.me.id);store.del(LGKEY());LG.round=-1;seenSigns=-1;learnSeen=-1;gelSeen=-1}
  const inForest=V.phase==='g1'||V.phase==='g1_end'||V.phase==='learn'||V.phase==='g2_reveal';
  document.body.className=(inForest?'forest':V.phase==='g3_intro'?'g3cover':['g3_board','g3_reveal','g3_scores'].includes(V.phase)?'store':'')+(V.phase==='g2_match'&&V.me.canPlay?' nozoom':'');
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
  gvote(m){
    let done=V.me.gvPicks;const pick=new Set(done||[]);let edit=!done;
    const draw=()=>{
      if(!edit){m.innerHTML=`<div class="gvp"><div class="gvp-h"><span class="tag k">GEL ที่มีประสิทธิภาพ</span><h2 class="h brush">ส่งคำตอบแล้ว ✓</h2><p class="sub">คุณเลือก 3 พฤติกรรมนี้ ดูผลรวมบนจอหลักได้เลย</p></div><div class="gvp-list">${done.map(i=>`<div class="gvo on"><i>${ic(GVI[i])}</i><span>${GV[i][1]}</span></div>`).join('')}</div><button class="btn ghost full" id="gvEdit">แก้ไขคำตอบ</button></div>`;$('#gvEdit').onclick=()=>{edit=true;draw()};return}
      m.innerHTML=`<div class="gvp"><div class="gvp-h"><span class="tag k">GEL ที่มีประสิทธิภาพ</span><h2 class="h brush">GEL ที่ดี<em>ต้องมีพฤติกรรมอะไรบ้าง?</em></h2><p class="sub">ร่วมกันเลือก <b>Top 3 พฤติกรรม</b> ที่อยากให้ GEL ที่ร้านทำได้ดีที่สุด</p></div><div class="gvp-list">${GV.map(([e,t],i)=>`<button class="gvo ${i%2?'dk':'rd'} ${pick.has(i)?'on':''}" data-i="${i}" style="--i:${i}"><i>${ic(GVI[i])}</i><span>${t}</span><b class="ck">${pick.has(i)?[...pick].indexOf(i)+1:''}</b></button>`).join('')}</div><div class="gvp-foot"><span>เลือกแล้ว <b>${pick.size}</b>/3</span><button class="btn" id="gvSend" ${pick.size===3?'':'disabled'}>ส่งคำตอบ</button></div></div>`;
      m.querySelectorAll('.gvo').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(pick.has(i))pick.delete(i);else if(pick.size<3)pick.add(i);else{toast('เลือกได้ 3 ข้อ กดข้อเดิมเพื่อเอาออกก่อน');return}draw()});
      $('#gvSend').onclick=async()=>{$('#gvSend').disabled=true;const j=await act({type:'gelvote',picks:[...pick]});if(j.error){toast(j.error);$('#gvSend').disabled=false;return}V.me.gvPicks=done=[...pick];edit=false;lastKey=keyPlayer();if(MMAudio.good)MMAudio.good();draw()};
    };
    draw();
  },
  gvres(m){m.innerHTML=`<div class="gvp"><div class="gvp-h"><span class="tag k">ผลโหวต</span><h2 class="h brush">GEL ที่ดี<em>ต้องมีพฤติกรรมอะไรบ้าง?</em></h2><p class="sub">Top 3 จาก ${V.gv.voters} คน · คนละ 3 ข้อ${V.me.gvPicks?' · <span class="mk">ข้อที่คุณเลือก</span>':''}</p></div>${gvChart(V.gv,V.me.gvPicks,true)}</div>`},
  p4(m){m.innerHTML=`<div class="p1p">${V.round<4?'<p class="sub">👀 ดูบนจอหลักไปพร้อมกัน</p>':''}${msPage(V.round,true)}</div>`},
  p0(m){m.innerHTML=`<div class="p1p"><p class="sub">👀 ดูบนจอหลักไปพร้อมกัน</p>${prePage(V.round,true)}</div>`},
  p1(m){m.innerHTML=`<div class="p1p"><p class="sub">👀 ดูบนจอหลักไปพร้อมกัน</p>${V.round?knowSelf(true):goodGel(true)}</div>`},
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
  g2_intro(m){m.innerHTML=`${spectBanner()}<div class="center"><span class="tag">เกมที่ 2</span><h2 class="h brush">สั่งงานให้<em>ตรงประเภท</em></h2><div class="rules"><div>แต่ละกลุ่มจับคู่คำสั่งให้ตรงกับสัตว์ทั้ง 4 ตัว</div><div>หากโยงคู่ถูกทุกคู่ได้รับ <b>100 pt</b> ถูกครึ่งนึงได้รับ <b>50 pt</b> ถูก 1 คู่ได้รับ <b>25 pt</b></div><div>กลุ่มแรกที่ตอบถูกจะได้รับโบนัสพิเศษ <b>15 pt</b></div><div>มีทั้งหมด <b>${V.g2N} สถานการณ์</b> โดยใช้จอหลักของ Area Coach</div></div></div></div>`},
  g2_motion(m){if(!V.me.canPlay)return discScreen(m,esc(V.scenario.title),`สถานการณ์ที่ ${V.scenario.n}/${V.g2N}`);m.innerHTML=`${spectBanner()}<div class="center"><span class="tag">สถานการณ์ที่ ${V.scenario.n}/${V.g2N}</span><h2 class="h brush">ดูจอหลักเลย!</h2><p class="scen">${esc(V.scenario.title)}</p><p class="sub">${esc(V.scenario.situation)}</p></div>`},
  g2_countdown(m){if(!V.me.canPlay)return discScreen(m,esc(V.scenario.title),'เตรียมตัว…');m.innerHTML=`<div class="center"><p class="sub">เตรียมตัว…</p><div class="big" style="font-size:clamp(120px,35vw,240px);font-weight:800;color:var(--red);line-height:1" data-b="cd">${cdLeft()}</div></div>`},
  g2_match(m){
    if(!V.me.canPlay) return discScreen(m,esc(V.scenario.title),`AC กำลังจับคู่คำสั่ง สถานการณ์ที่ ${V.scenario.n}/${V.g2N}`);
    if(V.me.submitted) return m.innerHTML=waitHTML('ส่งแล้ว รอเฉลยนะ','แอดมินกำลังรอทุกคน · ส่งแล้ว <span data-b="submitted"></span>')+'',patchPlayer();
    linkGame(m);
  },
  g2_reveal(m){
    const r=V.me.result;
    const yours=V.me.canPlay?`<div class="yours">${r?`ถูก ${r.correct}/4 คู่ ได้ <b>+${r.pts} pt</b>${r.bonus?` (โบนัสกลุ่มแรก ${r.bonus})`:''}`:'รอบนี้ไม่ได้ส่งคำตอบ'}</div>`:'';
    const wrong=V.recapTab==='wrong',n=V.recapOpen??4;
    m.innerHTML=`${spectBanner()}${yours}<div class="pverd ${wrong?'bad':'good'}">${wrong?'✗ พูดผิดสไตล์':'✓ พูดถูกสไตล์'}</div><div class="round">สถานการณ์ที่ ${V.scenario.n}</div><h2 class="scen" style="margin-bottom:4px">${esc(V.scenario.title)}</h2><p class="sub" style="margin-bottom:12px">เป้าหมาย: ${esc(V.scenario.goal)}</p>
    ${recapList().map((x,i)=>i<n?`<div class="rcard prc ${wrong?'bad':'good'}"><img src="img/${x.a}.png" alt=""><div><b>${A[x.a].th}</b>${wrong?`<span class="rsay">“${esc(unq(x.wrong.say))}”</span><small>→ ${esc(x.wrong.result)}</small>`:`<span class="rcmd">${esc(x.cmd)}</span>`}</div></div>`:`<div class="rcard prc wait"><img src="img/${x.a}.png" alt=""><div><b>${A[x.a].th}</b><small>รอเปิดที่จอหลัก</small></div></div>`).join('')}`;
    const ck='p'+V.round;if(r&&r.correct===4&&recapCheer!==ck){recapCheer=ck;confetti(40)}
  },
  g2_scores(m){m.innerHTML=boardHTML(`คะแนนหลังสถานการณ์ที่ ${V.scenario.n}`)},
  g2_end(m){m.innerHTML=boardHTML('จบเกมที่ 2')},
  pmap(m){m.innerHTML=personaMap(true)},
  p2(m){m.innerHTML=`<div class="p1p"><p class="sub">👀 ดูบนจอหลักไปพร้อมกัน</p>${part2Page(deckNow(),true)}</div>`},
  p3(m){m.innerHTML=`<div class="p1p"><p class="sub">👀 ดูบนจอหลักไปพร้อมกัน</p>${memberPage(V.round,true)}</div>`;countUp(m)},
  gel(m){const n=V.round;m.innerHTML=`<div class="gelp-p">${n>=5?gelActs():gelHead+`<div class="ggrid-p">${AK.map((a,i)=>gelCard(a,i,i<n,false)).join('')}</div>${n>=4?`<div class="gfoot on">${gelFoot}</div>`:''}`}</div>`},
  g3_intro(m){m.innerHTML=`${spectBanner()}<div class="center"><span class="tag">เกมที่ 3</span><h2 class="h brush cover-t">แฟน<em>พันธุ์แท้</em> ลูกค้า</h2>${neon('7','sm')}<p class="persona-t">CUSTOMER PERSONA</p>${faces()}<div class="rules"><div>ลูกค้า <b>10 คน</b> อยู่ใน <b>7 Persona</b> (Persona ซ้ำได้ อย่าตัดตัวเลือกทิ้ง)</div><div>เปิดป้ายทีละแผ่น ทายให้ถูกว่าคือลูกค้าคนไหน</div><div>ยิ่งเปิดป้ายน้อย ยิ่งได้เยอะ <b>100 → 80 → 60 → 40 → 20 pt</b></div><div>ตอบได้ครั้งเดียว ส่งแล้วล็อกทันที เฉลยพร้อมกันตอนท้าย</div><div>กลุ่มแรกที่ตอบถูกได้โบนัสอีก <b>15 pt</b> กลุ่มเดียวเท่านั้น</div><div>คะแนนรวมเท่ากัน ตัดสินด้วยเวลารวมที่ตอบ เร็วกว่าอันดับดีกว่า</div></div></div>${V.me.canPlay?'':personaMap(true)}`},
  g3_board:g3Player,
  g3_reveal(m){
    const p=V.g3.persona,r=V.me.result;
    const yours=V.me.canPlay?`<div class="yours">${r&&r.sign!=null?`ตอบถูก ป้ายที่ ${r.sign+1} ได้ <b>+${r.pts} pt</b>${r.bonus?` (โบนัสกลุ่มแรก ${r.bonus})`:''}`:r?`ตอบไม่ถูก รอบนี้ <b>${r.pts} pt</b>`:'รอบนี้ไม่ได้ส่งคำตอบ'}</div>`:'';
    m.innerHTML=`${spectBanner()}${yours}<div class="center" style="min-height:0"><img class="reveal-img" src="img/${p.img}" alt=""><h2 class="h brush">${esc(p.name)}</h2><p class="tag">${esc(p.tag)}</p>${p.as?`<p class="asp">= Persona แบบ<b>${esc(PNAME[p.as]||'')}</b></p>`:''}</div><div class="signs">${V.g3.clues.map((c,i)=>`<div class="sign"><span>${esc(c)}</span></div>`).join('')}</div>${V.me.canPlay?'':personaMap(true)}`;
    if(r&&r.sign!=null)confetti(40);
  },
  g3_scores(m){m.innerHTML=boardHTML(`คะแนนหลังคนที่ ${V.round+1}`)+(V.me.canPlay?'':personaMap(true))},
  final(m){
    const b=V.scoreboard||[];
    m.innerHTML=`<div class="center" style="min-height:0;margin-bottom:14px"><div style="font-size:64px">🏆</div><h2 class="h brush">ขอบคุณที่ร่วมสนุก!</h2></div>${boardHTML('อันดับสุดท้าย')}`;
    if(b[0]&&b[0].id===V.me.id)confetti(120);
  },
};
function showResult(m,a){
  const d=A[a],c=V.me.g1Counts;
  m.innerHTML=`<div class="center"><p class="sub">คุณคือ…</p><img class="hero a-${a}" src="img/${a}.png" alt="${d.th}"><h2 class="h brush"><em>${d.th}</em> ${d.en}</h2><div class="sticker">ติดสติ๊กเกอร์${d.th}ได้เลย!</div>
  ${c?`<p class="sub">A ${c.bull} · B ${c.eagle} · C ${c.rat} · D ${c.bear}</p>`:''}
  <div class="traits"><div class="card"><b style="color:var(--good)">จุดแข็งที่เก็บไว้</b><br>${d.strength}</div><div class="card"><b style="color:var(--red)">Gap ที่ต้องปิด</b><br>${d.gap}</div><div class="card"><b>ยืมจุดแข็งจาก</b><br>${d.borrow}</div><div class="card"><b>GEL ที่สมบูรณ์แบบ</b><br>${d.ideal}</div><div class="card"><b>พูดกับคุณแบบนี้ได้ผลที่สุด</b><br>${d.talk}</div></div></div>`;
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
  if(LG.round!==round){let sv=null;try{sv=JSON.parse(store.get(LGKEY()))}catch{}const ids=V.cards.map(c=>c.id);LG=sv&&sv.round===round&&sv.order&&sv.order.length===ids.length&&sv.order.every(x=>ids.includes(x))?{round,order:sv.order,map:sv.map||{},sel:null}:{round,order:ids.sort(()=>Math.random()-.5),map:{},sel:null};}
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
    try{store.set(LGKEY(),JSON.stringify({round:LG.round,order:LG.order,map:LG.map}))}catch{}
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
// 20-second thinking time after each sign opens; the next sign unlocks when it ends
const G3_THINK=20;let g3cd={k:'',end:0};
const g3Left=()=>Math.max(0,Math.ceil((g3cd.end-Date.now())/1000));
const g3Arm=g=>{const k=V.round+':'+g.signs;if(g.signs>0&&g3cd.k!==k)g3cd={k,end:Date.now()+G3_THINK*1000};if(!g.signs)g3cd={k,end:0}};
const g3Bind=root=>root.querySelectorAll('.hsign.pick').forEach(n=>n.onclick=()=>{root.querySelectorAll('.hsign.pick').forEach(x=>x.classList.remove('pick'));cmd({cmd:'openSign',i:+n.dataset.i})});
setInterval(()=>{if(!V||V.phase!=='g3_board')return;const t=g3Left();
  document.querySelectorAll('[data-b=g3cd]').forEach(e=>{if(e.textContent!==String(t)){e.textContent=t;if(V.admin&&t>0&&t<=3&&location.hash!=='#backoffice')beep()}});
  document.querySelectorAll('.g3cdw,.g3cdp').forEach(e=>e.classList.toggle('done',t===0));
  if(t===0){const w=document.querySelectorAll('#scr .hsign.wait');if(w.length){w.forEach(n=>{n.classList.replace('wait','pick');n.querySelector('.p').textContent='คลิกเปิด'});g3Bind($('#scr'))}}},250);
const newSign=g=>{const o=g.opened||[],r=seenSigns>=0&&g.signs>seenSigns?o[o.length-1]:-1;seenSigns=g.signs;return r??-1};
const signPts=(g,i)=>{const k=(g.opened||[]).indexOf(i);return k>=0?g.signPoints[k]:''};
const nowPts=g=>g.signs<g.signCount?(g.signs?`ตอบถูกตอนนี้ได้ <b>${g.signPoints[g.signs-1]} pt</b> · เปิดแล้ว ${g.signs}/${g.signCount} ป้าย`:`เปิดป้ายแรก ตอบถูกได้ <b>${g.signPoints[0]} pt</b>`):`เปิดครบ ${g.signCount} ป้าย ตอบถูกได้ <b>${g.signPoints[g.signCount-1]} pt</b>`;
function g3Player(m){
  const g=V.g3,me=V.me.g3||{},can=V.me.canPlay;
  const isNew=newSign(g);g3Arm(g);
  const signs=`<div class="nowpts">${nowPts(g)}${g.signs?`<span class="g3cdp ${g3Left()?'':'done'}"> · ⏱ เวลาคิด <b data-b="g3cd">${g3Left()}</b> วิ</span>`:''}</div>`+g.clues.map((c,i)=>c?`<div class="sign ${i===isNew?'flip':''}"><span><i class="sn">${i+1}</i>${esc(c)}</span><span class="p">${signPts(g,i)} pt</span></div>`:`<div class="sign closed"><span>ป้ายที่ ${i+1}</span><span class="p">?</span></div>`).join('');
  if(!can){m.innerHTML=`${spectBanner()}<div class="round">คนที่ ${V.round+1}/${V.g3N} · เค้าคือใคร?</div><div class="signs">${signs}</div>${personaMap(true)}`;return}
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
function keyHost(){const g=V.g3||{};return [V.phase,V.round,V.board,V.recapTab,V.recapOpen||0,g.signs||0].join('|')}
function renderHost(){
  document.body.className='host';
  if(!$('#stage')){app.innerHTML=`<div id="stage"><div class="brand">TEAM <i>BONCHON</i></div><div id="scr"></div><div id="ovl"></div><div class="bar" id="bar"></div><div id="pn"></div></div>`;fit();}
  $('#stage').classList.toggle('nobar',barHidden);const inForest=V.phase==='g1'||V.phase==='g1_end'||V.phase==='learn'||V.phase==='g2_reveal';$('#stage').classList.toggle('forest',inForest);$('#stage').classList.toggle('deco',!inForest&&['groups','g2_intro','g3_intro','gel'].includes(V.phase));$('#stage').classList.toggle('frm',['idle','lobby'].includes(V.phase));MMAudio.scene(V.phase==='learn'?'forest':inForest?'forest':'music');$('#stage').classList.toggle('store',['g3_board','g3_reveal','g3_scores'].includes(V.phase));$('#stage').classList.toggle('g3cover',V.phase==='g3_intro');$('#stage').classList.toggle('rcs',V.phase==='g2_reveal');$('#stage').classList.toggle('gelpg',V.phase==='gel');$('#stage').classList.toggle('deckpg',['p0','p1','p2','p3','p4','pmap','gvote'].includes(V.phase));
  drawBar();
  patchHost();
  const key=keyHost();
  if(key!==lastKey){const old=lastKey;lastKey=key;if(old&&V.phase!=='learn'&&!(V.phase==='g2_reveal'&&old.startsWith('g2_reveal')))MMAudio.transition();if(V.phase!=='g2_motion')MMAudio.duck(false);
    (HV[V.phase]||HV.idle)($('#scr'),old);patchHost();boardFx();
  }
  setOnce($('#ovl'),V.board&&V.scoreboard?`<div class="hboard-ov sb">${sbPage('สกอร์บอร์ด')}</div>`:'');
  $('#stage').classList.toggle('sbp',!!(V.board&&V.scoreboard)||['g2_scores','g2_end','g3_scores'].includes(V.phase));boardFx();
  
}
function drawBar(){
  const a=V.admin;
  $('#bar').innerHTML=`<button class="btn ghost ${V.board?'on':''}" id="bBoard">🏆 สกอร์บอร์ด</button>
    ${V.phase==='g2_reveal'?`<button class="btn ghost ${V.recapTab==='wrong'?'on':''}" id="bWrong">${V.recapTab==='wrong'?'✓ พูดถูกสไตล์':'✗ ถ้าพูดผิดสไตล์'}</button>${(V.recapOpen??4)<4?'<button class="btn ghost" id="bOpenAll">เปิดทั้งหมด</button>':''}`:''}
    <button class="btn ghost" id="bSet">⚙️ ตั้งค่า</button><button class="btn ghost" id="bBo">📊 หลังบ้าน</button><button class="btn ghost" id="bReset">🔄 เริ่มใหม่</button><button class="btn ghost" id="bFs">⛶</button><button class="btn ghost ${MMAudio.musicOn?'on':''}" id="bMusic">🎵</button><button class="btn ghost ${MMAudio.sfxOn?'on':''}" id="bMute">🔔</button>
    <span class="stat">เข้าแล้ว ${a.joined.length} คน</span>
    ${a.draftAssessment?'<span class="warn">เกม 1 ใช้คำถามทดสอบ</span>':''}
    ${a.nextLabel?`<button class="btn primary" id="bNext">${esc(a.nextLabel)}</button>`:'<span style="margin-left:auto"></span>'}`;
  $('#bBoard').onclick=()=>cmd({cmd:'board',on:!V.board});
  if($('#bWrong'))$('#bWrong').onclick=()=>cmd({cmd:'recapTab',tab:V.recapTab==='wrong'?'answer':'wrong'});
  if($('#bOpenAll'))$('#bOpenAll').onclick=()=>cmd({cmd:'recapOpenAll'});
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
  if(V.gv){set('gvn',V.gv.voters);const b=$('#gxbar');if(b)b.style.width=(V.gv.people?V.gv.voters/V.gv.people*100:0)+'%'}
  const chips=$('#chips');
  if(chips){const have=chips.children.length;const list=V.admin.joined;for(let i=have;i<list.length;i++){const d=document.createElement('span');d.className='chip '+(list[i].l==='L4'?'l4':'');d.textContent=list[i].n;chips.prepend(d)}}
}
function hBoard(){return `<div class="hboard" style="grid-template-rows:repeat(${Math.max(1,(V.scoreboard||[]).length)},1fr)">${(V.scoreboard||[]).map((r,i)=>`<div class="hrow ${i===0&&r.total>0?'top1':''}" data-id="${esc(r.id)}" data-t="${r.total}" style="animation-delay:${.35+i*.06}s"><span class="r">${r.rank}</span><span>${esc(rowLabel(r))}</span><span class="g">${r.last?'+'+r.last:''}</span><span class="t">${r.total}</span></div>`).join('')}</div>`}
const SB_ART=`<div class="sb-art"><img class="sb-base" src="img/board/base.svg" alt=""><img class="sb-cone c1" src="img/board/cone.svg" alt=""><img class="sb-cone c2" src="img/board/cone.svg" alt=""><img class="sb-cone c3" src="img/board/cone.svg" alt=""><img class="sb-base" src="img/board/panel.svg" alt=""><img class="sb-logo" src="img/frame/logo.svg" alt="Bonchon"><img class="sb-title" src="img/board/title.svg" alt="SCOREBOARD"><img class="sb-dr d1" src="img/frame/drum.svg" alt=""><img class="sb-dr d2" src="img/frame/drum.svg" alt=""><img class="sb-sp s1" src="img/board/spark.svg" alt=""><img class="sb-sp s2" src="img/board/spark.svg" alt=""><img class="sb-sp s3" src="img/board/spark.svg" alt=""><img class="sb-sp s4" src="img/board/spark.svg" alt=""><img class="sb-my" src="img/board/marks-y.svg" alt=""><img class="sb-clip" src="img/board/chick-clip.svg" alt=""><img class="sb-mw" src="img/board/marks-w.svg" alt=""><img class="sb-pop" src="img/board/chick-pop.svg" alt=""><img class="sb-buck" src="img/board/bucket.svg" alt=""></div>`;
const sbPage=t=>`${SB_ART}<div class="sb-rib">${t}</div><div class="sb-rows">${hBoard()}</div>`;
let boardPrev={};
function fitText(box){const els=[...box.children];let k=1;const base=els.map(e=>parseFloat(getComputedStyle(e).fontSize));while(box.scrollHeight>box.clientHeight+1&&k>.55){k-=.04;els.forEach((e,i)=>e.style.fontSize=base[i]*k+'px')}}
function boardFx(){ // rows move from their old place and scores count up
  const box=document.querySelector('.sb-rows .hboard');if(!box||box.dataset.fx)return;box.dataset.fx='1';
  const rows=[...box.children],h=rows[0]?rows[0].getBoundingClientRect().height+8:0,sc=$('#stage').getBoundingClientRect().width/1920||1,step=h/sc,next={};
  rows.forEach((e,i)=>{const id=e.dataset.id,t=+e.dataset.t,p=boardPrev[id],n=e.querySelector('.t');next[id]={i,t};
    if(p&&p.i!==i){e.style.setProperty('--from',(p.i-i)*step+'px');e.classList.add('moved')}
    if(p&&p.t!==t&&n){const a=p.t,t0=performance.now()+700;n.textContent=a;e.classList.add('gain');const run=x=>{const k=Math.min(1,Math.max(0,(x-t0)/1100)),v=Math.round(a+(t-a)*(1-(1-k)**3));if(n.isConnected){n.textContent=v;if(k<1)requestAnimationFrame(run)}};requestAnimationFrame(run)}});
  boardPrev=next;
}
function introHost(s,tag,t,lines,img){s.innerHTML=`<div class="scr c"><span class="tag" style="font-size:40px">${tag}</span><h1 class="t1 brush" style="margin:16px 0 26px">${t}</h1><div style="display:flex;gap:30px;align-items:center;font-size:36px;text-align:left">${img?`<img src="${img}" alt="" style="height:440px;border-radius:20px">`:''}<div class="rules" style="width:1100px">${lines.map(l=>`<div>${l}</div>`).join('')}</div></div></div>`}
const HV={
  gvote(s){s.innerHTML=gvoteBoard(V.gv)},
  gvres(s){const g=V.gv;s.innerHTML=`<div class="scr gvres"><div class="gvres-h"><span class="tag k">03 | GEL ที่มีประสิทธิภาพ</span><h1 class="t2">GEL ที่ดี<em>ต้องมีพฤติกรรมอะไรบ้าง?</em></h1><p>Top 3 พฤติกรรมจากการโหวตของ <b>${g.voters}</b> คน · เลือกคนละ 3 ข้อ</p></div>${gvChart(g,null,false)}</div>`;fanfare()},
  p4(s){s.innerHTML=`<div class="scr p1x">${msPage(V.round,false)}</div>`;if(V.round===4)fanfare()},
  p0(s){s.innerHTML=`<div class="scr p1x">${prePage(V.round,false)}</div>`},
  p1(s){s.innerHTML=`<div class="scr p1x">${V.round?knowSelf(false):goodGel(false)}</div>`},
  idle(s){s.innerHTML=`<div class="scr fr">${FRAME}<div class="fbox fidle"><span class="tag k">TEAM BONCHON</span><h1 class="t1 brush">Manager <em>Meeting</em> Game</h1><p class="t3">กด Launch เมื่อพร้อมให้ทุกคนเข้าเกม</p></div></div>`},
  lobby(s){
    const url=location.origin+location.pathname;let svg='';
    try{const q=qrcode(0,'M');q.addData(url);q.make();svg=q.createSvgTag({scalable:true,margin:2})}catch{}
    s.innerHTML=`<div class="scr fr">${FRAME}<div class="fbox flobby"><h1 class="t2 brush">สแกนเข้าเกม<em>เลย!</em></h1><div class="fgrid"><div class="qr">${svg}<div class="qcap">ล็อกอินด้วยรหัสพนักงาน</div></div><div class="fside"><div class="fcount"><span class="big" data-b="joined">0</span><span class="t3">คนเข้าเกมแล้ว</span></div><div class="url">${esc(url)}</div><div class="chips" id="chips"></div></div></div></div></div>`;
  },
  g1(s){s.innerHTML=`<div class="scr"><div class="fhead"><span class="tag" style="font-size:30px">เกมที่ 1</span><h1 class="t2 brush">เราคือสัตว์<em>ประเภทไหน?</em></h1><p class="t3"><span data-b="g1done" style="color:var(--red);font-weight:800;font-size:64px">0</span> / ${V.totalUsers} คน ทำเสร็จแล้ว</p></div>${dist()}</div>`},
  g1_end(s){s.innerHTML=`<div class="scr"><div class="fhead"><h1 class="t2 brush">ทีมเราเป็น<em>แบบนี้!</em></h1><p class="t3"><span data-b="g1done" style="color:var(--red);font-weight:800">0</span> คน ได้รับสติ๊กเกอร์ของตัวเอง</p></div>${dist()}</div>`;fanfare();confetti(90)},
  learn(s){
    const n=V.round,fresh=learnSeen>=0&&n>learnSeen?n-1:-1;learnSeen=n;
    s.innerHTML=`<div class="scr learn"><div class="lhead"><span class="ltitle brush">สั่งงานให้ตรงกับ<em>ประเภท</em> <b>4</b></span><span class="lsub">เข้าใจความแตกต่าง สื่อสารให้ตรงจุด เพื่อให้งานสำเร็จร่วมกัน</span></div><div class="lbody"><div class="lgoal"><h3>เป้าหมาย</h3><p>ฝึกผู้จัดการให้ปรับวิธีสั่งงาน ให้เหมาะกับลักษณะการทำงานของพนักงานแต่ละประเภท</p><div class="lbub">คำสั่งเดียวกัน แต่แต่ละคนอาจต้องการ<b>วิธีสื่อสารที่แตกต่างกัน</b></div></div><div class="lgrid">${LEARN.map((l,i)=>learnCard(l,i,i<n,i===fresh)).join('')}</div></div><div class="ltipbar ${n>=4?'on':''}">💡 <b>เคล็ดลับ</b> สังเกตจากการใช้คำพูด น้ำเสียง และภาษากาย ให้ตรงกับสไตล์ของพนักงาน</div></div>`;
    if(fresh>=0){MMAudio.open();setTimeout(()=>MMAudio.animal(LEARN[fresh].a),350);if(fresh===3)setTimeout(()=>confetti(90),900)}
  },
  groups(s){s.innerHTML=`<div class="scr"><h1 class="t2 brush" style="margin-top:12px">แบ่ง<em>กลุ่ม</em> ไปรวมตัวกับ AC ของคุณ</h1><div class="hgroups">${(V.groups||[]).map(g=>`<div class="hgroup"><b>${g.no}</b><span>AC ${esc(g.nick)}</span><small>${g.members} คน</small></div>`).join('')}</div></div>`},
  g2_intro(s){introHost(s,'เกมที่ 2','สั่งงานให้<em>ตรงประเภท</em>',['แต่ละกลุ่มจับคู่คำสั่งให้ตรงกับสัตว์ทั้ง 4 ตัว','หากโยงคู่ถูกทุกคู่ได้รับ <b>100 pt</b> ถูกครึ่งนึงได้รับ <b>50 pt</b> ถูก 1 คู่ได้รับ <b>25 pt</b>','กลุ่มแรกที่ตอบถูกจะได้รับโบนัสพิเศษ <b>15 pt</b>',`มีทั้งหมด <b>${V.g2N} สถานการณ์</b> โดยใช้จอหลักของ Area Coach`])},
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
    const w=V.recapTab==='wrong',n=V.recapOpen??4,list=recapList(),k=recapKey(),fresh=recapSeen.k===k&&n===recapSeen.n+1?n-1:-1;recapSeen={k,n};
    s.innerHTML=`<div class="scr rcscr"><div class="rhead ${w?'bad':'good'}"><span class="rbadge">${w?'✗ พูดผิดสไตล์':'✓ พูดถูกสไตล์'}</span><div class="rht"><h1>${esc(V.scenario.title)}</h1><p>เป้าหมายร่วม: ${esc(V.scenario.goal)}${w?'':` · ถูกครบ ${V.allCorrect??0} กลุ่ม`}</p></div></div><div class="rgrid">${list.map((x,i)=>recapCard(x,i,i<n,i===fresh,w)).join('')}</div></div>`;
    requestAnimationFrame(()=>s.querySelectorAll('.rtext').forEach(fitText));setTimeout(()=>s.querySelectorAll('.rtext').forEach(fitText),900);
    s.querySelectorAll('.lcard:not(.open)').forEach(e=>{e.onclick=()=>{if(+e.dataset.rc===(V.recapOpen??4))cmd({cmd:'next'})}});
    if(fresh>=0){MMAudio.open();setTimeout(()=>MMAudio.animal(list[fresh].a),350);setTimeout(()=>w?MMAudio.bad():MMAudio.good(),1250);if(fresh===3&&!w)setTimeout(()=>{fanfare();confetti(90)},1500)}
  },
  g2_scores(s){s.innerHTML=`<div class="scr sb">${sbPage(`สกอร์บอร์ด หลังสถานการณ์ที่ ${V.scenario.n}`)}</div>`},
  g2_end(s){s.innerHTML=`<div class="scr sb">${sbPage('จบเกมที่ 2')}</div>`;fanfare()},
  pmap(s){s.innerHTML=`<div class="scr pmscr">${personaMap(false)}</div>`;fanfare()},
  p2(s){const n=deckNow();s.innerHTML=`<div class="scr ${n===53?'pmscr':'p1x'}">${part2Page(n,false)}</div>`},
  p3(s){s.innerHTML=`<div class="scr p1x">${memberPage(V.round,false)}</div>`;countUp(s)},
  gel(s){
    const n=V.round,fresh=gelSeen>=0&&n===gelSeen+1?n-1:-1;gelSeen=n;
    if(n>=5){s.innerHTML=`<div class="scr gelp acts">${gelActs()}</div>`;if(fresh===4){fanfare();confetti(80)}return}
    s.innerHTML=`<div class="scr gelp">${gelHead}<div class="ggrid">${AK.map((a,i)=>gelCard(a,i,i<n,i===fresh)).join('')}</div><div class="gfoot ${n>=4?'on':''}">${gelFoot}</div></div>`;
    s.querySelectorAll('.gelc.shut').forEach((e,i)=>{e.onclick=()=>{if(AK.indexOf(AK[n])===[...e.parentNode.children].indexOf(e))cmd({cmd:'next'})}});
    if(fresh>=0){MMAudio.open();setTimeout(()=>MMAudio.animal(AK[fresh]),300)}
  },
  g3_intro(s){s.innerHTML=`<div class="scr cover"><div class="c-left"><i class="br b1"></i><i class="br b2"></i><i class="br b3"></i><div class="c-title"><p class="c-no">เกมที่ 3</p><h1>แฟนพันธุ์แท้ ลูกค้า</h1><hr><ul><li>ลูกค้า <b>10 คน</b> อยู่ใน <b>7 Persona</b> · Persona ซ้ำได้</li><li>เลือกเปิดป้ายแผ่นไหนก่อนก็ได้ ยิ่งเปิดน้อยยิ่งได้เยอะ <b>100 · 80 · 60 · 40 · 20 pt</b></li><li>กลุ่มละหนึ่งคำตอบ ล็อกทันที เฉลยพร้อมกัน</li><li>กลุ่มแรกที่ตอบถูกได้โบนัสอีก <b>15 pt</b></li><li>คะแนนรวมเท่ากัน ตัดสินด้วยเวลารวมที่ตอบ</li></ul></div></div><div class="c-right"><i class="sl s1"></i><i class="sl s2"></i>${[[2,12,16],[1,30,6],[5,50,8],[3,72,15],[4,14,66],[7,38,78],[6,66,67]].map(([n,x,y],i)=>`<img class="cf" src="img/face${n}.png" alt="" style="left:${x}%;top:${y}%;animation-delay:${i*.09}s,${-i*.7}s">`).join('')}<div class="c-mid">${neon('7','lg')}<p class="persona-t">CUSTOMER<br>PERSONA</p></div></div></div>`},
  g3_board(s){
    const g=V.g3,isNew=newSign(g);if(isNew>=0)MMAudio.open();g3Arm(g);const wait=g3Left()>0;setTimeout(()=>g3Bind(s));
    s.innerHTML=`<div class="scr storelay"><div class="st-panel"><h1 class="t2 brush">เค้าคือ<em>ใคร?</em> <small>คนที่ ${V.round+1}/${V.g3N}</small></h1><div class="hnow">${nowPts(g)}</div><div class="hsigns">${g.clues.map((c,i)=>c?`<div class="hsign ${i===isNew?'flip':''}"><span><i class="sn">${i+1}</i>${esc(c)}</span><span class="p">${signPts(g,i)} pt</span></div>`:`<div class="hsign closed ${wait?'wait':'pick'}" data-i="${i}"><span>ป้ายที่ ${i+1}</span><span class="p">${wait?'รอเวลาคิด':'คลิกเปิด'}</span></div>`).join('')}</div></div><div class="st-side">${g.signs?`<div class="g3cdw ${wait?'':'done'}"><b data-b="g3cd">${g3Left()}</b><small>วินาที เวลาคิด</small><em>⏰ หมดเวลา · เลือกเปิดป้ายถัดไป</em></div>`:orbit(neon('?','md'))}<div class="st-count">ส่งคำตอบแล้ว <b data-b="answered">0</b>/${V.totalPlayers} กลุ่ม</div></div></div>`;
  },
  g3_reveal(s){
    const g=V.g3,p=g.persona;seenSigns=-1;
    s.innerHTML=`<div class="scr storelay"><div class="st-panel"><h1 class="t1 brush" style="font-size:88px"><em>${esc(p.name)}</em></h1><p class="tag" style="font-size:32px;align-self:flex-start;margin:6px 0 14px">${esc(p.tag)}</p>${p.as?`<p class="asp">= Persona แบบ<b>${esc(PNAME[p.as]||'')}</b></p>`:''}<div class="hsigns" style="gap:10px">${g.clues.map(c=>`<div class="hsign" style="min-height:66px;font-size:28px"><span>${esc(c)}</span></div>`).join('')}</div><p class="t3" style="margin:12px 0 0;font-size:30px">ตอบถูก ${g.correctCount}/${V.totalPlayers} กลุ่ม</p></div><div class="st-side"><div class="st-pic"><div class="spin"></div><img class="pic" src="img/${esc(p.img)}" alt=""></div></div></div>`;
    fanfare();
  },
  g3_scores(s){s.innerHTML=`<div class="scr sb">${sbPage(`สกอร์บอร์ด หลังคนที่ ${V.round+1}`)}</div>`},
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
  <p>ผลเกมที่ 1 คำตอบ และคะแนนทั้งหมดจะถูกลบ <b>กู้คืนไม่ได้</b></p>
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
    <div><label>เกม 2: ถูก 1 คู่</label><input id="sOne" type="number" min="0" value="${s.onePoints??25}"></div>
    <div><label>โบนัสกลุ่มแรกที่ถูก (กลุ่มเดียว)</label><input id="sBonus" type="number" min="0" value="${s.bonusStart}"></div>
    <div><label>เกม 3: หักคะแนนเมื่อตอบผิด</label><input id="sPen" type="number" min="0" value="${s.wrongPenalty}"></div>
    <div><label>เกม 3: จำนวนแผ่นป้าย (1–5)</label><input id="sCount" type="number" min="1" max="5" value="${s.signCount}"></div>
    <div style="grid-column:span 2"><label>คะแนนแต่ละป้าย คั่นด้วยจุลภาค</label><input id="sPts" value="${s.signPoints.join(', ')}"></div>
  </div><button class="btn" id="sSave" style="margin-top:12px;min-height:44px">บันทึกคะแนน</button>
  <p style="color:var(--mute);font-size:17px;margin-top:6px">จำนวนป้ายมีผลกับคนที่ยังไม่เริ่มเล่น สมชายมีคำใบ้ 4 ข้อจึงเปิดได้สูงสุด 4 ป้าย</p>
  <h3>ข้ามไปหน้าอื่น</h3><div class="jump">
    <select id="jg">${[['lobby','Lobby'],['p0','Recap + GEL Reality Check'],['gvote','โหวตพฤติกรรม GEL'],['gvres','ผลโหวต GEL'],['p1','สไลด์ Good GEL'],['g1','เกม 1'],['g1_end','สรุปเกม 1'],['learn','อธิบายสัตว์ 4 ประเภท'],['groups','แบ่งกลุ่ม'],['g2_intro','เกม 2: กติกา'],['g2_end','สรุปเกม 2'],['gel','สรุปกิจกรรมที่ 1: GEL'],['p2','สไลด์ Part 2 (47–54)'],['g3_intro','เกม 3: กติกา'],['pmap','สรุป Customer Persona'],['final','ผลรวมสุดท้าย'],['p4','Master Service + Break'],['p3','สไลด์ข้อมูลสมาชิก (71–73)']].map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select><button class="btn k" id="jgo">ไป</button>
    <select id="js">${a.scenarios.map((x,i)=>`<option value="${i}">สถานการณ์ ${x.n}</option>`).join('')}</select><button class="btn k" id="jso">เล่นข้อนี้ใหม่</button>
    <select id="jp">${a.personas.map((x,i)=>`<option value="${i}">${esc(x.name)}</option>`).join('')}</select><button class="btn k" id="jpo">เล่นคนนี้ใหม่</button>
  </div>
  <h3>ข้อมูล</h3><div class="jump"><button class="btn k" id="xXlsx">⬇️ ดาวน์โหลด Excel</button><button class="btn w" id="xScore">ล้างคะแนนเกม 2–3</button><button class="btn" id="xAll">รีเซ็ตเกมทั้งหมด</button><button class="btn w" id="xOut">ออกจากระบบ</button></div></div>`;
  $('#pX').onclick=()=>{panelOpen=false;$('#pn').innerHTML=''};
  $('#sSave').onclick=async()=>{const j=await cmd({cmd:'settings',settings:{fullPoints:$('#sFull').value,halfPoints:$('#sHalf').value,onePoints:$('#sOne').value,bonusStart:$('#sBonus').value,wrongPenalty:$('#sPen').value,signCount:$('#sCount').value,signPoints:$('#sPts').value.split(',').map(x=>+x.trim())}});if(j&&j.ok)toast('บันทึกแล้ว')};
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
    {name:'โหวต GEL สรุป',head:['อันดับ','พฤติกรรม','จำนวนคนเลือก','% ของคนที่โหวต','AC (L4)','Store Manager (L5)'],rows:gvRank(j.gelVote||{}).map((x,k)=>[k+1,GV[x.i][1],x.n,(j.gelVote.voters?Math.round(x.n/j.gelVote.voters*1000)/10:0)+'%',x.l4,x.l5])},
    {name:'โหวต GEL รายคน',head:['กลุ่ม','AC','รหัสพนักงาน','ชื่อ','ระดับ','สาขา/ตำแหน่ง','พฤติกรรมที่ 1','พฤติกรรมที่ 2','พฤติกรรมที่ 3'],rows:rows.filter(r=>r.gv).map(r=>[r.groupNo,r.nick,r.id,r.name,r.level,r.store,...r.gv.map(i=>GV[i][1])])},
    {name:'ข้อมูลไฟล์',head:['รายการ','ค่า'],rows:[['ดาวน์โหลดเมื่อ',stamp],['พนักงานทั้งหมด',rows.length],['เข้าเกมแล้ว',rows.filter(r=>r.joined).length],['โหวตพฤติกรรม GEL แล้ว',rows.filter(r=>r.gv).length],['ทำเกม 1 แล้ว',rows.filter(r=>r.animal).length]]},
  ];
  const u=URL.createObjectURL(MMXlsx(sheets)),l=document.createElement('a'),p=n=>String(n).padStart(2,'0');
  l.href=u;l.download=`manager-meeting-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.xlsx`;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);toast('ดาวน์โหลดแล้ว');
}
/* boot */
if(token)connect();else showLogin();
