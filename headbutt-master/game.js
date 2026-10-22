/* Headbutt Master - self-contained mobile web pilot, no external runtime */
(function () {
'use strict';
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const STORAGE = 'headbutt_master_pilot_v1';
const NAMES = ['동대회','구대회','시대회','지역대회','전국대회','아시아대회','세계대회','Headbutt Championship'];
const STAGES = [
  {name:'동대회', place:'퇴근길 동네 체육관', boss:'박 관장', desc:'아저씨의 무모한 첫 데뷔'},
  {name:'구대회', place:'구민 체육센터', boss:'구청 철이마', desc:'동네를 넘어 구의 최강자를 향해'},
  {name:'시대회', place:'시민 올림픽 경기장', boss:'돌머리 태식', desc:'본격적인 선수들과 맞붙다'},
  {name:'지역대회', place:'광역 종합 체육관', boss:'황금 두개골', desc:'지역 대표 자리를 차지하라'},
  {name:'전국대회', place:'전국 챔피언 아레나', boss:'전국구 불도저', desc:'대한민국 이마 왕좌 결정전'},
  {name:'아시아대회', place:'아시아 그랜드 돔', boss:'철두권 마스터', desc:'대륙 최강의 두개골들'},
  {name:'세계대회', place:'월드 스타디움', boss:'월드 챔피언', desc:'세계의 시선을 이마에 모아라'},
  {name:'Headbutt Championship', place:'레전드 오브 헤드벗', boss:'THE HEADBUTT KING', desc:'모든 우승 트로피의 정점'}
];
const OUTFITS = ['회식 후 퇴근복','동네 체육관 운동복','초보 선수 트레이닝복','시 대표 경기복','지역 챔피언 유니폼','국가대표 트랙슈트','아시아 투사복','세계 챔피언 전투복','그랜드 슬램 황금 유니폼'];
const STATS = {
  forehead:{name:'이마',icon:'◉',cls:'forehead',desc:'기본 박치기 피해 +7'},
  waist:{name:'허리',icon:'↪',cls:'waist',desc:'차지 위력 증가 · 재사용 대기 감소'},
  leg:{name:'다리',icon:'↟',cls:'leg',desc:'이동 속도 +9%'},
  thigh:{name:'허벅지',icon:'◆',cls:'thigh',desc:'최대 체력 +22 · 충돌 피해 감소'}
};
const STAT_KEYS = Object.keys(STATS);
const PERKS = [
 {key:'power',name:'땀나는 이마',desc:'기본 박치기 공격력 +23%',effect:(r)=>{r.power*=1.23;}},
 {key:'speed',name:'회식 탈출',desc:'이동 속도 +17%',effect:(r)=>{r.moveBoost*=1.17;}},
 {key:'rate',name:'초고속 연타',desc:'자동 박치기 속도 +19%',effect:(r)=>{r.attackRate*=1.19;}},
 {key:'range',name:'유연한 목',desc:'공격 범위 +17%',effect:(r)=>{r.rangeBoost*=1.17;}},
 {key:'charge',name:'허리의 반란',desc:'차지 박치기 피해 +28%',effect:(r)=>{r.chargeBoost*=1.28;}},
 {key:'heal',name:'숙취 해소',desc:'체력 50 회복',effect:(r)=>{r.player.hp=Math.min(r.player.maxHp,r.player.hp+50);}},
 {key:'armor',name:'주정뱅이 맷집',desc:'받는 피해 14% 감소',effect:(r)=>{r.armor*=.86;}},
 {key:'shock',name:'이마 충격파',desc:'일반 공격 적중 시 작은 충격파',effect:(r)=>{r.shockwave=true;}}
];
const fresh = () => ({
 gold:160, levels:{forehead:1,waist:1,leg:1,thigh:1},scrolls:{forehead:3,waist:2,leg:2,thigh:2},
 clears:Array(8).fill(false), stageUnlocked:0,selectedStage:0,wins:0,totalKills:0,bestKills:0,bestCombo:0,
 bestTime:0, claimed:false,mockClaimed:false
});
function load(){
  const p=fresh();
  try {
    const data=JSON.parse(localStorage.getItem(STORAGE)||'null');
    if(!data||typeof data!=='object')return p;
    p.gold=safeInt(data.gold,0,10000000,p.gold);
    for(const k of STAT_KEYS){
      p.levels[k]=safeInt(data.levels&&data.levels[k],1,100,1);
      p.scrolls[k]=safeInt(data.scrolls&&data.scrolls[k],0,100000,0);
    }
    p.clears=Array.from({length:8},(_,i)=>!!(Array.isArray(data.clears)&&data.clears[i]));
    p.stageUnlocked=Math.max(0,p.clears.reduce((max,yes,i)=>yes?Math.max(max,Math.min(7,i+1)):max,0));
    p.selectedStage=Math.min(p.stageUnlocked,safeInt(data.selectedStage,0,7,p.stageUnlocked));
    for(const k of ['wins','totalKills','bestKills','bestCombo','bestTime'])p[k]=safeInt(data[k],0,10000000,0);
    p.claimed=!!data.claimed;p.mockClaimed=!!data.mockClaimed;
  }catch(e){console.warn('저장된 데이터 읽기 실패',e);}
  return p;
}
function safeInt(value,min,max,fallback){return Number.isFinite(Number(value))?Math.min(max,Math.max(min,Math.floor(Number(value)))):fallback;}
let profile=load(),run=null,raf=0,lastFrame=0,currentPage='home',soundEnabled=true;
let stick={x:0,y:0,pointer:null},keys={},chargePointer=null,chargeKeyboard=false,toastTimer=0,visualTime=0;
const gameScreen=$('#game-screen'),gameModal=$('#game-modal'),arena=$('#arena'),ctx=arena.getContext('2d',{alpha:false});
let view={w:380,h:520,dpr:1};
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(profile));}catch(e){console.warn('저장할 수 없습니다',e);}}
function scrollCost(k){return Math.max(1,Math.ceil(1+(profile.levels[k]-1)*1.35));}
function goldCost(k){return Math.floor(20+profile.levels[k]*32);}
function stageCount(){return profile.clears.filter(Boolean).length;}
function outfitTier(){return Math.min(8,stageCount());}
function num(n){return Math.floor(n).toLocaleString('ko-KR');}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400);}
function changePage(page){
 if(run){return;}
 if(!$('#page-'+page))return;
 currentPage=page;
 $$('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+page));
 $$('.bottom-nav button').forEach(x=>x.classList.toggle('selected',x.dataset.page===page));
 $('#content').scrollTop=0;
 renderAll();
}
function renderAll(){
 $('#top-gold').textContent=num(profile.gold);
 const completed=stageCount(),next=profile.selectedStage,stage=STAGES[next];
 $('#chapter-counter').textContent=String(next+1).padStart(2,'0')+' / 08';
 $('#hero-outfit').textContent='현재 복장 · '+OUTFITS[outfitTier()];
 $('#home-stage-name').textContent=stage.name==='Headbutt Championship'?stage.name:'제'+(next+1)+'회 '+stage.name;
 $('#home-stage-desc').textContent=stage.desc;
 $('#home-stage-num').textContent=String(next+1).padStart(2,'0');
 $('#home-kos').textContent=num(profile.totalKills);
 $('#home-trophies').innerHTML=completed+' <small>/ 8</small>';
 $('#home-combo').textContent=num(profile.bestCombo);
 $('#home-story').innerHTML=completed===8?'“회사에서는 부장, 경기장에서는 전설!”<br>마침내 모든 트로피를 손에 넣었다. 그랜드 슬램 달성!'
  :completed>=1?'“대회가 끝나고 나면 회식이 아니라 훈련이야.”<br>우승 트로피가 늘어날수록 허리도, 이마도, 아저씨의 꿈도 강해진다.'
  :'“내가 왕년에 말이야… 이마 하나는 끝내줬다고.”<br>회식 후 우연히 발견한 박치기 대회 포스터. 그의 새로운 인생이 시작된다.';
 $('#up-outfit').textContent=OUTFITS[outfitTier()];
 renderTraining();renderStages();renderRecords();renderStore();renderHero();
}
function renderTraining(){
 $('#training-list').innerHTML=STAT_KEYS.map(k=>{
   const def=STATS[k],lv=profile.levels[k],need=scrollCost(k),cash=goldCost(k),have=profile.scrolls[k];
   const disabled=have<need||profile.gold<cash||lv>=100;
   return '<div class="training-row"><div class="training-icon '+def.cls+'">'+def.icon+'</div>'+
   '<div class="training-info"><div class="training-name"><b>'+def.name+'</b><span>Lv.'+lv+'</span></div><p>'+def.desc+'</p><div class="training-scrolls">주문서 <strong>'+num(have)+'</strong> / '+num(need)+'장 · <strong>●</strong> '+num(cash)+'</div></div>'+
   '<button data-act="train" data-stat="'+k+'" class="train-btn" '+(disabled?'disabled':'')+'>강화 ↑</button></div>';
 }).join('');
}
function renderStages(){
 const count=stageCount();
 $('#trophy-progress').textContent=count+' / 8';
 $('#grand-bar').style.width=(count/8*100)+'%';
 $('#stage-list').innerHTML=STAGES.map((st,i)=>{
   const clear=profile.clears[i],locked=i>profile.stageUnlocked,sel=i===profile.selectedStage;
   const cls='stage-item '+(clear?'cleared ':locked?'locked ':'')+(sel?'current':'');
   return '<div class="'+cls+'"><div class="stage-medal">'+(clear?'✓':locked?'⌑':i+1)+'</div>'+
   '<div class="stage-details"><strong>'+st.name+'</strong><p>'+st.place+'</p><small>'+(clear?'우승 완료 · 재도전 가능':locked?'이전 대회 우승 필요':st.boss+'에게 도전')+'</small></div>'+
   (locked?'<span class="stage-action">잠김</span>':'<button data-act="select-stage" data-stage="'+i+'" class="stage-action">'+(clear?'재도전':'입장')+'</button>')+'</div>';
 }).join('');
}
function renderRecords(){
 const n=stageCount();
 const titles=['퇴근길 이마 신인','동네 박치기 신동','구대표 철이마','시대표 박치기 고수','지역 최강 돌머리','전국 박치기 왕','아시아 철두인','세계의 이마','그랜드 슬램 전설'];
 $('#record-title').textContent=titles[n];
 $('#record-sub').textContent=n===8?'HEADBUTT CHAMPIONSHIP 그랜드 슬램 달성':STAGES[profile.stageUnlocked].name+' 도전자';
 const vals=[['우승 횟수',num(profile.wins)],['누적 K.O.',num(profile.totalKills)],['한 경기 최고 K.O.',num(profile.bestKills)],['최대 콤보',num(profile.bestCombo)]];
 $('#record-grid').innerHTML=vals.map(x=>'<div><small>'+x[0]+'</small><strong>'+x[1]+'</strong></div>').join('');
 $('#ranking-score').textContent=num(profile.bestKills)+' K.O.';
}
function renderStore(){
 $('#claim-btn').disabled=profile.claimed;
 $('#claim-btn').textContent=profile.claimed?'수령 완료':'받기';
}
function heroCanvas(id,kind){
 const cv=$(id);if(!cv)return;
 const c=cv.getContext('2d');const w=cv.width,h=cv.height;
 c.clearRect(0,0,w,h);
 if(kind==='home'){
   c.save();c.fillStyle='#ffd27a44';c.beginPath();c.ellipse(300,276,72,17,0,0,Math.PI*2);c.fill();c.restore();
   drawFighter(c,270,290,1.92,outfitTier(),-1,-.07,{player:true});
   c.font='900 25px sans-serif';c.fillStyle='#fff2b7';c.fillText('✹',329,80);
 }else{
   c.save();c.fillStyle='#ffddaa26';c.beginPath();c.ellipse(210,195,60,10,0,0,Math.PI*2);c.fill();c.restore();
   drawFighter(c,210,191,1.43,outfitTier(),1,0,{player:true});
   c.font='700 12px sans-serif';c.textAlign='left';c.fillStyle='#ffe18a';c.fillText('FOREHEAD POWER',21,25);
   c.textAlign='right';c.fillText('HEADBUTT MASTER',400,185);c.textAlign='left';
 }
}
function renderHero(){heroCanvas('#heroCanvas','home');heroCanvas('#upgradeCanvas','upgrade');}
function getOutfit(tier){
 const palettes=[
  {top:'#e0dbe2',jacket:'#454b65',pant:'#3c4058',trim:'#eb6491',shoes:'#242335'},
  {top:'#efe3c4',jacket:'#9aa07e',pant:'#34384b',trim:'#d7566a',shoes:'#2c2b34'},
  {top:'#edf0f4',jacket:'#d87754',pant:'#4b506e',trim:'#f9c85a',shoes:'#232839'},
  {top:'#e3f0ed',jacket:'#328caa',pant:'#36566c',trim:'#ffdc6a',shoes:'#2b3f4d'},
  {top:'#fff5e0',jacket:'#b9485e',pant:'#43384c',trim:'#ffd668',shoes:'#232839'},
  {top:'#fff8e2',jacket:'#3c6bca',pant:'#253968',trim:'#e8b34d',shoes:'#21263f'},
  {top:'#fcfcf2',jacket:'#943e52',pant:'#382c47',trim:'#ffe48d',shoes:'#282537'},
  {top:'#f9eed4',jacket:'#333546',pant:'#282b3e',trim:'#e5c066',shoes:'#222434'},
  {top:'#fffbdc',jacket:'#e4a936',pant:'#906329',trim:'#fff3a6',shoes:'#59362b'}
 ];
 return palettes[Math.max(0,Math.min(8,tier))];
}
function drawFighter(c,x,y,s,tier,dir,lean,opts){
 opts=opts||{};
 const enemy=!!opts.enemy,boss=!!opts.boss;
 const pal=enemy?{top:boss?'#faeeab':'#c8cfda',jacket:boss?'#a8475e':['#7892a3','#b88771','#8b7bb0'][opts.variety%3||0],pant:'#353b4b',trim:boss?'#ffdb6d':'#e9b993',shoes:'#292b35'}:getOutfit(tier);
 const mus=enemy?0.5:Math.min(1.0,tier/8),belly=enemy?0.94:1.24-mus*.32;
 const walk=opts.walk||0;
 c.save();c.translate(x,y);c.scale(s*(dir<0?-1:1),s);
 c.globalAlpha=opts.ghost?.6:1;
 // Elliptical shadow, feet and walking legs
 c.fillStyle='#040b1c50';c.beginPath();c.ellipse(0,0,26,7,0,0,Math.PI*2);c.fill();
 c.lineCap='round';
 for(const side of [-1,1]){
  c.strokeStyle=pal.pant;c.lineWidth=15+mus*4;c.beginPath();c.moveTo(side*11,-35);c.lineTo(side*13+Math.sin(walk)*5*side,-10);c.stroke();
  c.strokeStyle=pal.shoes;c.lineWidth=10;c.beginPath();c.moveTo(side*13+Math.sin(walk)*5*side,-9);c.lineTo(side*16+Math.sin(walk)*5*side,-4);c.stroke();
 }
 // Torso leans from waist, forehead leads
 c.translate(0,-33);c.rotate(lean);
 c.fillStyle='#ba7f6a';c.fillRect(-8,-38,16,11);
 // arms and round fists
 for(const side of [-1,1]){
  c.strokeStyle=pal.jacket;c.lineWidth=15+mus*3;c.beginPath();c.moveTo(side*(22+mus*2),-39);c.lineTo(side*(27+mus*3),-14);c.stroke();
  c.fillStyle='#f0b99c';c.beginPath();c.ellipse(side*(29+mus*3),-9,8,9,0,0,Math.PI*2);c.fill();
 }
 // torso and belly
 c.fillStyle=pal.jacket;c.strokeStyle='#25263d';c.lineWidth=2;
 c.beginPath();c.ellipse(0,-37,23*belly,31,0,0,Math.PI*2);c.fill();c.stroke();
 c.fillStyle=pal.top;c.beginPath();c.ellipse(0,-44,10+mus*3,23,0,0,Math.PI*2);c.fill();
 if(!enemy&&tier===0){ // loosened office tie, rumpled shirt
   c.fillStyle='#d75d82';c.beginPath();c.moveTo(-2,-62);c.lineTo(5,-58);c.lineTo(3,-49);c.lineTo(10,-37);c.lineTo(5,-35);c.lineTo(-3,-49);c.closePath();c.fill();
   c.strokeStyle='#34374a';c.lineWidth=2;c.beginPath();c.moveTo(-18,-57);c.lineTo(-7,-35);c.stroke();
 }else{
  c.strokeStyle=pal.trim;c.lineWidth=4;c.beginPath();c.moveTo(-14,-57);c.lineTo(-8,-24);c.moveTo(14,-57);c.lineTo(8,-24);c.stroke();
  if(!enemy){c.fillStyle=pal.trim;c.font='900 12px sans-serif';c.textAlign='center';c.fillText(tier>5?'★':'H',0,-32);}
 }
 // head, oversized forehead
 c.fillStyle='#f2c5a4';c.strokeStyle='#a96d65';c.lineWidth=1.5;c.beginPath();c.ellipse(0,-79,24+mus*1.5,26,0,0,Math.PI*2);c.fill();c.stroke();
 // ears
 c.fillStyle='#efb895';for(const side of [-1,1]){c.beginPath();c.ellipse(side*24,-77,5,8,0,0,Math.PI*2);c.fill();}
 // mop of hair / receding hairline
 c.fillStyle=enemy?'#302f43':'#353447';c.beginPath();c.moveTo(-24,-85);c.quadraticCurveTo(-29,-111,-2,-108);c.quadraticCurveTo(20,-114,25,-91);c.lineTo(15,-95);c.quadraticCurveTo(2,-100,-9,-97);c.lineTo(-19,-92);c.closePath();c.fill();
 if(!enemy&&tier<2){c.strokeStyle='#343244';c.lineWidth=4;c.beginPath();c.moveTo(-10,-99);c.lineTo(-19,-104);c.stroke();}
 if(boss){c.fillStyle='#ffe26b';c.beginPath();c.moveTo(-24,-103);c.lineTo(-18,-120);c.lineTo(-7,-108);c.lineTo(2,-126);c.lineTo(13,-108);c.lineTo(24,-121);c.lineTo(25,-101);c.closePath();c.fill();}
 // forehead highlight
 c.fillStyle='#fff2dc9c';c.beginPath();c.ellipse(-5,-92,10,4,-.3,0,Math.PI*2);c.fill();
 // expressive eyes brows
 c.strokeStyle='#43313b';c.lineWidth=3;c.beginPath();c.moveTo(-16,-82);c.lineTo(-5,-84);c.moveTo(6,-84);c.lineTo(17,-82);c.stroke();
 c.fillStyle='#222837';c.beginPath();c.ellipse(-10,-78,2.7,3.1,0,0,Math.PI*2);c.ellipse(11,-78,2.7,3.1,0,0,Math.PI*2);c.fill();
 c.fillStyle='#e99087';c.beginPath();c.ellipse(-18,-68,6,3,0,0,Math.PI*2);c.ellipse(18,-68,6,3,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#8e5b5a';c.lineWidth=2;c.beginPath();c.moveTo(-3,-66);c.quadraticCurveTo(3,-62,7,-66);c.stroke();
 if(!enemy&&tier===0){c.fillStyle='#e28e8e80';c.beginPath();c.ellipse(0,-69,15,5,0,0,Math.PI*2);c.fill();}
 if(!enemy&&tier>=7){c.strokeStyle='#fce18a';c.lineWidth=3;c.beginPath();c.arc(0,-78,32,Math.PI*1.25,Math.PI*1.8);c.stroke();}
 c.restore();
}
function random(lo,hi){return lo+Math.random()*(hi-lo);}
function playSound(type){
 if(!soundEnabled)return;
 try{
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx)return;
  if(!window._hbaudio)window._hbaudio=new Ctx();
  const audio=window._hbaudio;if(audio.state==='suspended')audio.resume();
  const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;
  o.type=type==='win'?'triangle':'square';
  o.frequency.setValueAtTime(type==='hit'?150:type==='charge'?220:type==='win'?520:300,t);
  o.frequency.exponentialRampToValueAtTime(type==='hit'?55:type==='charge'?90:type==='win'?780:140,t+.12);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(type==='win'?.055:.025,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.17);
  o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.18);
 }catch(e){/* audio is optional */}
}
function vibrate(ms){try{if(navigator.vibrate)navigator.vibrate(ms);}catch(e){}}
function presentModal(kicker,title,desc,extra,buttons){
 $('#modal-kicker').textContent=kicker;
 $('#modal-title').textContent=title;
 $('#modal-desc').textContent=desc;
 $('#modal-extra').innerHTML=extra||'';
 $('#modal-actions').innerHTML=buttons||'';
 gameModal.classList.remove('hidden');
 if(run){run.paused=true;}
}
function dismissModal(){gameModal.classList.add('hidden');if(run){run.paused=false;lastFrame=performance.now();}}
function resizeCanvas(){
 if(gameScreen.classList.contains('hidden'))return;
 const rect=$('#arena-wrap').getBoundingClientRect();
 const w=Math.max(240,rect.width||360),h=Math.max(250,rect.height||480);
 const dpr=Math.min(2,window.devicePixelRatio||1);
 view={w:w,h:h,dpr:dpr};
 arena.width=Math.round(w*dpr);arena.height=Math.round(h*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);
}
function baseDamage(){return 19+profile.levels.forehead*7;}
function startRun(stageId){
 if(run){quitRun();}
 profile.selectedStage=Math.min(profile.stageUnlocked,Math.max(0,stageId));
 save();renderAll();
 stick={x:0,y:0,pointer:null};chargePointer=null;chargeKeyboard=false;
 const hp=143+profile.levels.thigh*22;
 run={
 stage:profile.selectedStage,elapsed:0,limit:60,paused:true,finished:false,
 player:{x:0,y:0,hp:hp,maxHp:hp,invuln:0,atkCooldown:.18,anim:0,facing:1,walk:0},
 enemies:[],pickups:[],effects:[],numbers:[],spawnTimer:1,boss:null,bossSpawned:false,alertTime:0,
 exp:0,expNeeded:22,level:1,ko:0,combo:0,maxCombo:0,comboTimer:0,goldEarned:0,
 loot:{forehead:0,waist:0,leg:0,thigh:0},power:1,moveBoost:1,attackRate:1,rangeBoost:1,chargeBoost:1,armor:1,shockwave:false,
 nextEnemyId:0,chargeHeld:false,chargeStart:0,chargeCooldown:0,rush:null,stopAt:0,showTutorial:!profile.wins&&!profile.totalKills
 };
 gameScreen.classList.remove('hidden');resizeCanvas();renderHUD();
 presentModal('CHAPTER '+String(run.stage+1).padStart(2,'0'),STAGES[run.stage].name+' 출전!',
  STAGES[run.stage].place+'에서 시작합니다.\n60초 생존 후 '+STAGES[run.stage].boss+'를 쓰러뜨리세요.',
  '<div class="loot-list"><div>♟ 자동 박치기 <b>ON</b></div><div>✹ 차지 박치기 <b>수동</b></div><div>◎ 왼쪽 패드 <b>이동</b></div><div>♛ 보스 격파 <b>우승</b></div></div>',
  '<button data-act="go">박치기 시작!</button><button class="secondary" data-act="quit">체육관 나가기</button>');
 lastFrame=performance.now();
 if(raf)cancelAnimationFrame(raf);
 raf=requestAnimationFrame(frame);
}
function quitRun(){
 if(raf)cancelAnimationFrame(raf);
 raf=0;run=null;stick.x=0;stick.y=0;keys={};
 $('#joystick-knob').style.transform='translate(0px,0px)';
 gameScreen.classList.add('hidden');gameModal.classList.add('hidden');
 $('#boss-hud').classList.add('hidden');$('#boss-alert').classList.add('hidden');
 renderAll();
}
function spawnEnemy(boss){
 const r=run;if(!r)return;
 const angle=random(0,Math.PI*2),radius=random(boss?220:170,boss?260:Math.max(230,Math.min(view.w,view.h)*.66+95));
 const i=r.nextEnemyId++,t=1+r.stage*.20+r.elapsed*.006;
 const type=Math.floor(Math.random()*3),hp=(boss?500+350*r.stage:28+10*r.stage+Math.random()*18)*t*(boss?.80:1);
 const e={id:i,boss:!!boss,variety:type,x:r.player.x+Math.cos(angle)*radius,y:r.player.y+Math.sin(angle)*radius,
  hp:hp,maxHp:hp,speed:boss?42+r.stage*3:(40+type*8+r.stage*2.5),cooldown:random(.4,1.2),stun:0,flash:0,walk:random(0,8),facing:1};
 r.enemies.push(e);
 if(boss){r.boss=e;r.bossSpawned=true;r.alertTime=2.8;$('#boss-hud').classList.remove('hidden');$('#boss-name').textContent=STAGES[r.stage].boss;$('#boss-alert').classList.remove('hidden');playSound('charge');vibrate([60,70,100]);}
}
function pop(x,y,txt,color,size){
 const r=run;if(!r)return;
 r.numbers.push({x:x,y:y,text:String(txt),color:color||'#fff1b2',life:.66,size:size||15});
 if(r.numbers.length>70)r.numbers.shift();
}
function sparks(x,y,color,count,speed){
 if(!run)return;
 for(let i=0;i<count;i++){
  const a=random(0,Math.PI*2),v=random(speed*.35,speed);
  run.effects.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:random(.15,.45),maxLife:.45,r:random(2,5),color:color});
 }
 if(run.effects.length>230)run.effects.splice(0,run.effects.length-230);
}
function hurtEnemy(e,dmg,dirx,diry,charging){
 const r=run;if(!r||r.finished||e.hp<=0)return;
 const crit=Math.random()<(.09+profile.levels.forehead*.002);
 const actual=Math.ceil(dmg*(crit?1.8:1)*random(.90,1.12));
 e.hp-=actual;e.flash=.18;
 const repel=charging?38:17;e.x+=dirx*repel;e.y+=diry*repel;
 pop(e.x,e.y-42,(crit?'★ ':'')+actual,crit?'#ffe279':charging?'#bafff7':'#fff2cc',charging?20:16);
 sparks(e.x,e.y-43,charging?'#8af4eb':'#ffbb66',charging?13:6,charging?145:85);
 if(e.hp<=0)killEnemy(e);
 else if(r.shockwave&&!charging){for(const nearby of r.enemies)if(nearby!==e&&nearby.hp>0&&Math.hypot(nearby.x-e.x,nearby.y-e.y)<58){nearby.hp-=Math.ceil(actual*.16);nearby.flash=.08;if(nearby.hp<=0)killEnemy(nearby);}}
 if(charging)playSound('charge');else if(Math.random()<.55)playSound('hit');
}
function killEnemy(e){
 const r=run;if(!r||e.dead)return;
 e.dead=true;e.hp=0;r.ko++;r.combo++;r.comboTimer=3.5;r.maxCombo=Math.max(r.maxCombo,r.combo);
 r.goldEarned+=e.boss?70:2+r.stage;
 sparks(e.x,e.y-35,e.boss?'#ffe18e':'#f9b36c',e.boss?45:13,125);
 pop(e.x,e.y-65,e.boss?'CHAMPION K.O.!':'K.O.','#fff1a4',e.boss?26:18);
 r.pickups.push({x:e.x,y:e.y,type:'xp',amount:e.boss?60:6+Math.floor(r.stage*.5),phase:random(0,6),dead:false});
 if(Math.random()<(e.boss?1:.16)){
  r.pickups.push({x:e.x+random(-18,18),y:e.y+random(-16,16),type:'scroll',stat:STAT_KEYS[Math.floor(Math.random()*4)],phase:random(0,6),dead:false});
 }
 if(Math.random()<(e.boss?.8:.07))r.pickups.push({x:e.x+10,y:e.y+5,type:'heal',phase:1,dead:false});
 if(e.boss)endRun(true);
}
function playerHurt(damage){
 const r=run;if(!r||r.finished||r.player.invuln>0||r.rush)return;
 const resist=Math.min(.44,(profile.levels.thigh-1)*.035);
 const actual=Math.max(1,Math.ceil(damage*(1-resist)*r.armor));
 r.player.hp=Math.max(0,r.player.hp-actual);r.player.invuln=.56;r.combo=0;r.comboTimer=0;
 pop(r.player.x,r.player.y-103,'-'+actual,'#ff718b',19);sparks(r.player.x,r.player.y-70,'#ff8293',9,95);vibrate(30);
 if(r.player.hp<=0)endRun(false);
}
function autoAttack(){
 const r=run;if(!r||r.finished)return;
 const p=r.player,range=111*r.rangeBoost,targets=r.enemies.filter(e=>e.hp>0&&!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<range).sort((a,b)=>
 Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
 if(!targets.length){p.atkCooldown=.07;return;}
 const target=targets[0],dx=target.x-p.x,dy=target.y-p.y,dist=Math.max(1,Math.hypot(dx,dy)),vx=dx/dist,vy=dy/dist;
 p.facing=vx<0?-1:1;p.anim=.23;
 let hits=0;
 for(const e of targets){
  const ex=e.x-p.x,ey=e.y-p.y,ed=Math.max(1,Math.hypot(ex,ey));
  if((ex/ed*vx+ey/ed*vy)>.25 || ed<50){
   hurtEnemy(e,baseDamage()*r.power,vx,vy,false);if(++hits>=3)break;
  }
 }
 sparks(p.x+vx*36,p.y-66+vy*30,'#fff4a8',6,74);
 p.atkCooldown=.66/r.attackRate;
}
function chargePress(){
 const r=run;if(!r||r.paused||r.finished||r.chargeCooldown>0||r.chargeHeld||r.rush)return;
 r.chargeHeld=true;r.chargeStart=performance.now();$('#charge-btn').classList.remove('cooldown');
}
function chargeRelease(){
 const r=run;if(!r||!r.chargeHeld)return;
 const held=(performance.now()-r.chargeStart)/1000;
 r.chargeHeld=false;
 if(r.paused||r.finished)return;
 const ratio=Math.min(1,held/1.4),p=r.player;
 let dx=stick.x,dy=stick.y;
 if(Math.hypot(dx,dy)<.2){
  let near=null,nearest=1e9;
  for(const e of r.enemies)if(e.hp>0){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<nearest){nearest=d;near=e;}}
  if(near){dx=near.x-p.x;dy=near.y-p.y;}else{dx=p.facing;dy=0;}
 }
 const norm=Math.max(.01,Math.hypot(dx,dy));dx/=norm;dy/=norm;
 const duration=.2+.12*ratio,speed=(260+290*ratio)/duration;
 r.rush={x:dx,y:dy,speed:speed,left:duration,hit:new Set(),damage:(baseDamage()*r.power)*(2.1+ratio*3.3)*(1+profile.levels.waist*.12)*r.chargeBoost};
 r.chargeCooldown=Math.max(2.6,4.5-profile.levels.waist*.12);
 r.player.facing=dx<0?-1:1;r.player.invuln=.35;vibrate(ratio>.65?[30,30,45]:25);playSound('charge');
 $('#charge-btn').classList.remove('fully-charged');
 sparks(p.x,p.y-65,ratio>.7?'#fff192':'#ff8f79',ratio>.7?25:12,180);
}
function collisionRush(){
 const r=run;if(!r||!r.rush)return;
 const p=r.player,s=r.rush;
 for(const e of r.enemies){
  if(e.hp<=0||s.hit.has(e.id))continue;
  const d=Math.hypot(e.x-p.x,e.y-p.y+30);
  if(d<(e.boss?65:50)){
   s.hit.add(e.id);hurtEnemy(e,s.damage,s.x,s.y,true);if(r.finished)return;
  }
 }
}
function gainPickup(p){
 const r=run;if(!r)return;
 if(p.type==='xp')r.exp+=p.amount;
 else if(p.type==='scroll'){r.loot[p.stat]++;pop(p.x,p.y-55,'주문서 +1','#bdfff3',13);}
 else if(p.type==='heal'){const value=18+profile.levels.thigh*2;r.player.hp=Math.min(r.player.maxHp,r.player.hp+value);pop(p.x,p.y-55,'♥ +'+value,'#9cffac',13);}
}
function levelUp(){
 const r=run;if(!r||r.paused||r.finished||r.exp<r.expNeeded)return;
 r.exp-=r.expNeeded;r.level++;r.expNeeded=19+r.level*17;
 const pool=PERKS.slice().sort(()=>Math.random()-.5).slice(0,3);
 presentModal('LEVEL UP · '+r.level,'아저씨 각성!', '경기 중 능력 하나를 선택하세요. (이번 경기 한정)',
  '<div class="choices">'+pool.map(v=>'<button class="choice-btn" data-act="perk" data-perk="'+v.key+'">'+v.name+'<span>'+v.desc+'</span></button>').join('')+'</div>',
  '<button data-act="perk" data-perk="'+pool[0].key+'">추천 강화 선택</button>');
 playSound('win');
}
function endRun(win){
 const r=run;if(!r||r.finished)return;
 r.finished=true;r.paused=true;r.chargeHeld=false;r.rush=null;
 const first=win&&!profile.clears[r.stage];
 if(win){profile.clears[r.stage]=true;profile.stageUnlocked=Math.max(profile.stageUnlocked,Math.min(7,r.stage+1));profile.wins++;}
 const rewardGold=r.goldEarned+(win?(first?180+r.stage*70:80+r.stage*20):Math.floor(r.elapsed*.4));
 profile.gold+=rewardGold;
 for(const k of STAT_KEYS){profile.scrolls[k]+=r.loot[k];if(first){profile.scrolls[k]++;r.loot[k]++;}}
 profile.totalKills+=r.ko;profile.bestKills=Math.max(profile.bestKills,r.ko);profile.bestCombo=Math.max(profile.bestCombo,r.maxCombo);
 profile.bestTime=Math.max(profile.bestTime,Math.round(r.elapsed));
 if(win)profile.selectedStage=Math.min(7,r.stage+1);
 save();renderAll();
 const scrolls=STAT_KEYS.map(k=>'<div>'+STATS[k].name+' 주문서 <b>+'+r.loot[k]+'</b></div>').join('');
 const title=win?(r.stage===7?'그랜드 슬램 달성!':'우승! '+STAGES[r.stage].name+' 제패!'):'아쉽다! 다음엔 이마로!';
 const desc=win?'KO '+r.ko+'명 · 최고 콤보 '+r.maxCombo+'\n새로운 복장과 강화 재료를 획득했습니다.':
  'KO '+r.ko+'명 · 생존 '+Math.floor(r.elapsed)+'초\n패배해도 획득한 주문서와 골드는 유지됩니다.';
 presentModal(win?'CHAMPION!':'GAME OVER',title,desc,
   '<div class="loot-list"><div>경기 보상 골드 <b>+'+num(rewardGold)+'</b></div><div>획득 트로피 <b>'+(win?'★':'—')+'</b></div>'+scrolls+'</div>',
   (win&&r.stage<7?'<button data-act="next">다음 대회 도전 →</button>':'')+
   '<button data-act="again" class="secondary">같은 대회 재도전</button><button data-act="go-upgrade" class="secondary">강화소로 돌아가기</button>');
 if(win){playSound('win');vibrate([35,45,35,50,70]);}
}
function update(dt){
 const r=run;if(!r||r.paused||r.finished)return;
 dt=Math.min(dt,.05);r.elapsed+=dt;
 const p=r.player;
 p.invuln=Math.max(0,p.invuln-dt);p.anim=Math.max(0,p.anim-dt);
 r.chargeCooldown=Math.max(0,r.chargeCooldown-dt);
 r.comboTimer-=dt;if(r.comboTimer<=0)r.combo=0;
 if(r.alertTime>0){r.alertTime-=dt;if(r.alertTime<=0)$('#boss-alert').classList.add('hidden');}
 let mx=stick.x,my=stick.y;
 if(keys.ArrowLeft||keys.a)mx-=1;if(keys.ArrowRight||keys.d)mx+=1;
 if(keys.ArrowUp||keys.w)my-=1;if(keys.ArrowDown||keys.s)my+=1;
 const mag=Math.hypot(mx,my);if(mag>1){mx/=mag;my/=mag;}
 if(r.rush){
   p.x+=r.rush.x*r.rush.speed*dt;p.y+=r.rush.y*r.rush.speed*dt;
   r.rush.left-=dt;p.anim=.18;collisionRush();
   if(!run||r.finished)return;
   if(r.rush.left<=0){r.rush=null;p.invuln=Math.max(p.invuln,.25);}
 }else{
  const speed=(125+profile.levels.leg*13)*r.moveBoost;
  p.x+=mx*speed*dt;p.y+=my*speed*dt;if(Math.abs(mx)>.1)p.facing=mx<0?-1:1;
  if(mag>.1)p.walk+=dt*13;
 }
 // The field follows the player. Continuous spawns arrive from outside the visible zone.
 if(!r.bossSpawned){
   r.spawnTimer-=dt;
   if(r.spawnTimer<=0&&r.enemies.filter(e=>e.hp>0).length<38){
    const count=1+(r.elapsed>29?1:0)+(r.stage>4?1:0);
    for(let i=0;i<count;i++)spawnEnemy(false);
    r.spawnTimer=Math.max(.4,1.26-r.elapsed*.008-r.stage*.05);
   }
   if(r.elapsed>=r.limit)spawnEnemy(true);
 }
 for(const e of r.enemies){
  if(e.hp<=0)continue;
  e.flash=Math.max(0,e.flash-dt);e.stun=Math.max(0,e.stun-dt);e.cooldown-=dt;
  const dx=p.x-e.x,dy=p.y-e.y,dist=Math.max(1,Math.hypot(dx,dy)),nx=dx/dist,ny=dy/dist;
  e.facing=nx<0?-1:1;e.walk+=dt*11;
  if(e.stun<=0&&dist>(e.boss?40:29)){e.x+=nx*e.speed*dt;e.y+=ny*e.speed*dt;}
  if(dist<(e.boss?47:30)&&e.cooldown<=0){playerHurt(e.boss?18+r.stage*2:8+r.stage*1.1);e.cooldown=e.boss?.85:.9;if(r.finished)return;}
 }
 r.enemies=r.enemies.filter(e=>e.hp>0);
 p.atkCooldown-=dt;if(p.atkCooldown<=0&&!r.rush)autoAttack();
 if(r.finished)return;
 for(const pickup of r.pickups){
  if(pickup.dead)continue;
  pickup.phase+=dt*3;
  const dx=p.x-pickup.x,dy=p.y-pickup.y,dist=Math.max(.01,Math.hypot(dx,dy));
  if(dist<120){const speed=150+(120-dist)*2.3;pickup.x+=dx/dist*speed*dt;pickup.y+=dy/dist*speed*dt;}
  if(dist<28){pickup.dead=true;gainPickup(pickup);}
 }
 r.pickups=r.pickups.filter(x=>!x.dead).slice(-130);
 for(const v of r.effects){v.x+=v.vx*dt;v.y+=v.vy*dt;v.vx*=Math.pow(.89,dt*60);v.vy*=Math.pow(.89,dt*60);v.life-=dt;}
 r.effects=r.effects.filter(e=>e.life>0);
 for(const v of r.numbers){v.y-=28*dt;v.life-=dt;}
 r.numbers=r.numbers.filter(e=>e.life>0);
 if(r.exp>=r.expNeeded)levelUp();
}
function drawArena(t){
 const w=view.w,h=view.h,r=run;if(!r)return;
 const p=r.player,c=ctx;
 c.setTransform(view.dpr,0,0,view.dpr,0,0);
 const grad=c.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#273c48');grad.addColorStop(1,'#1c3440');c.fillStyle=grad;c.fillRect(0,0,w,h);
 // moving court lines and warm spotlights
 const cell=65,offx=((-p.x%cell)+cell)%cell,offy=((-p.y%cell)+cell)%cell;
 c.strokeStyle='#b2d3c614';c.lineWidth=1;c.beginPath();
 for(let x=offx;x<w;x+=cell){c.moveTo(x,0);c.lineTo(x,h);}
 for(let y=offy;y<h;y+=cell){c.moveTo(0,y);c.lineTo(w,y);}c.stroke();
 c.strokeStyle='#e8d6a71a';c.lineWidth=3;c.beginPath();c.arc(w/2,h/2,175,0,Math.PI*2);c.stroke();
 c.strokeStyle='#eef2d516';c.lineWidth=2;c.beginPath();c.arc(w/2,h/2,295,0,Math.PI*2);c.stroke();
 for(let k=0;k<11;k++){const x=((k*117-p.x*.17)% (w+130)+w+130)%(w+130)-65,y=((k*83-p.y*.12)%(h+90)+h+90)%(h+90)-45;c.fillStyle=k%2?'#ffd27a0b':'#93e6ff09';c.beginPath();c.arc(x,y,28+k*2,0,Math.PI*2);c.fill();}
 const camx=p.x-w/2,camy=p.y-h/2;
 function screen(e){return{x:e.x-camx,y:e.y-camy};}
 // pickups behind characters
 for(const v of r.pickups){
  const pos=screen(v);if(pos.x<-20||pos.x>w+20||pos.y<-20||pos.y>h+20)continue;
  const yy=pos.y+Math.sin(v.phase)*3;
  c.save();c.translate(pos.x,yy);c.shadowBlur=12;c.shadowColor=v.type==='xp'?'#5fe0f5':v.type==='heal'?'#a0ffa6':'#fff0ad';
  c.fillStyle=v.type==='xp'?'#65d9e7':v.type==='heal'?'#aaffaa':'#ffde79';
  c.beginPath();if(v.type==='xp'){c.moveTo(0,-8);c.lineTo(7,0);c.lineTo(0,8);c.lineTo(-7,0);}else{c.arc(0,0,8,0,Math.PI*2);}c.closePath();c.fill();
  c.fillStyle='#283043';c.font='900 11px sans-serif';c.textAlign='center';c.fillText(v.type==='scroll'?'✦':v.type==='heal'?'♥':'',0,4);c.restore();
 }
 // enemies sorted by y for depth
 const actors=r.enemies.filter(e=>e.hp>0).map(e=>({e:e,y:e.y})).sort((a,b)=>a.y-b.y);
 let drawnPlayer=false;
 function drawPlayer(){
  const xx=w/2,yy=h/2;
  if(r.chargeHeld){const ratio=Math.min(1,(performance.now()-r.chargeStart)/1400);c.strokeStyle=ratio>=1?'#ffed75':'#f9a667';c.lineWidth=2+ratio*4;c.beginPath();c.arc(xx,yy-50,39+ratio*25,0,Math.PI*2);c.stroke();}
  if(r.rush){c.save();c.strokeStyle='#ffeb89bb';c.lineWidth=14;c.lineCap='round';c.beginPath();c.moveTo(xx-r.rush.x*57,yy-56-r.rush.y*57);c.lineTo(xx,yy-56);c.stroke();c.restore();}
  const flicker=p.invuln>0&&!r.rush&&Math.sin(t*32)>0;
  drawFighter(c,xx,yy,.71+Math.min(.07,profile.levels.thigh*.004),outfitTier(),p.facing,p.anim?(-.22*p.facing):r.rush?(-.45*p.facing):.02*Math.sin(t*2),{player:true,ghost:flicker,walk:p.walk});
  if(p.anim>0||r.rush){c.strokeStyle='#fff9b8a8';c.lineWidth=3;c.beginPath();c.arc(xx+p.facing*16,yy-78,26,-1.35,1.1);c.stroke();}
 }
 for(const a of actors){
  if(!drawnPlayer&&a.y>p.y){drawPlayer();drawnPlayer=true;}
  const e=a.e,pos=screen(e);
  if(pos.x<-90||pos.x>w+90||pos.y<-120||pos.y>h+100)continue;
  drawFighter(c,pos.x,pos.y,e.boss?1.02:.63,0,e.facing,Math.sin(e.walk)*.045,{enemy:true,boss:e.boss,variety:e.variety,walk:e.walk});
  if(e.flash>0){c.strokeStyle='#fff3a8';c.lineWidth=3;c.beginPath();c.arc(pos.x,pos.y-54,e.boss?62:43,0,Math.PI*2);c.stroke();}
  if(e.hp<e.maxHp||e.boss){c.fillStyle='#302938';c.fillRect(pos.x-(e.boss?35:20),pos.y-(e.boss?147:89),e.boss?70:40,5);
   c.fillStyle=e.boss?'#ff8b75':'#a5e5bf';c.fillRect(pos.x-(e.boss?35:20),pos.y-(e.boss?147:89),(e.boss?70:40)*Math.max(0,e.hp/e.maxHp),5);}
 }
 if(!drawnPlayer)drawPlayer();
 for(const fx of r.effects){
  const pos=screen(fx);c.globalAlpha=Math.max(0,fx.life/fx.maxLife);c.fillStyle=fx.color;c.beginPath();c.arc(pos.x,pos.y,fx.r,0,Math.PI*2);c.fill();
 }c.globalAlpha=1;
 for(const n of r.numbers){
  const pos=screen(n);c.globalAlpha=Math.max(0,n.life/.65);c.font='900 '+n.size+'px "Noto Sans KR",sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#3d2738';c.strokeText(n.text,pos.x,pos.y);c.fillStyle=n.color;c.fillText(n.text,pos.x,pos.y);
 }c.globalAlpha=1;c.textAlign='left';
 // inner edges hint the field continues forever
 const shade=c.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#17223355');shade.addColorStop(.18,'#17223300');shade.addColorStop(.78,'#17223300');shade.addColorStop(1,'#0f172454');c.fillStyle=shade;c.fillRect(0,0,w,h);
}
function renderHUD(){
 const r=run;if(!r)return;
 $('#match-name').textContent=STAGES[r.stage].name;
 const remain=r.bossSpawned?Math.floor(r.elapsed-r.limit):Math.max(0,Math.ceil(r.limit-r.elapsed));
 $('#match-timer').textContent=r.bossSpawned?'BOSS':String(Math.floor(remain/60)).padStart(2,'0')+':'+String(remain%60).padStart(2,'0');
 $('#hud-hp').textContent=Math.ceil(r.player.hp)+' / '+r.player.maxHp;
 $('#hp-fill').style.width=Math.max(0,100*r.player.hp/r.player.maxHp)+'%';
 $('#hud-level').textContent='LV.'+r.level;
 $('#exp-fill').style.width=Math.min(100,100*r.exp/r.expNeeded)+'%';
 $('#hud-ko').textContent=r.ko;$('#hud-combo').textContent=r.combo;
 $('#boss-status').textContent=r.bossSpawned?'보스와 일기토!':'보스 출현까지 '+Math.max(0,Math.ceil(r.limit-r.elapsed))+'초';
 if(r.boss)$('#boss-fill').style.width=Math.max(0,100*r.boss.hp/r.boss.maxHp)+'%';
 $('#run-buff').textContent='이마 Lv.'+profile.levels.forehead+' · 허리 Lv.'+profile.levels.waist;
 const btn=$('#charge-btn'),prog=$('#charge-progress'),caption=$('#charge-caption');
 if(r.chargeHeld){
  const ratio=Math.min(1,(performance.now()-r.chargeStart)/1400);
  btn.classList.toggle('fully-charged',ratio>=1);
  prog.style.height=ratio*100+'%';caption.textContent=ratio>=1?'MAX! 지금 놓으세요':'충전 중 '+Math.floor(ratio*100)+'%';
 }else if(r.chargeCooldown>0){
  btn.classList.add('cooldown');btn.classList.remove('fully-charged');prog.style.height='0%';caption.textContent='재충전 '+r.chargeCooldown.toFixed(1)+'초';
 }else{
  btn.classList.remove('cooldown','fully-charged');prog.style.height='0%';caption.textContent='누르고 모아, 놓으면 돌진!';
 }
}
function frame(now){
 if(!run){raf=0;return;}
 const dt=Math.min(.06,Math.max(0,(now-lastFrame)/1000));lastFrame=now;visualTime+=dt;
 update(dt);if(run){drawArena(visualTime);renderHUD();raf=requestAnimationFrame(frame);}
}
function buyTraining(k){
 if(!STATS[k])return;
 const cost=scrollCost(k),cash=goldCost(k);
 if(profile.levels[k]>=100){toast('최대 레벨입니다.');return;}
 if(profile.scrolls[k]<cost){toast(STATS[k].name+' 주문서가 부족합니다.');return;}
 if(profile.gold<cash){toast('골드가 부족합니다.');return;}
 profile.scrolls[k]-=cost;profile.gold-=cash;profile.levels[k]++;
 save();renderAll();playSound('win');toast(STATS[k].name+' 강화 성공! Lv.'+profile.levels[k]);
}
function bonusScrolls(each){for(const k of STAT_KEYS)profile.scrolls[k]+=each;}
function action(type,btn){
 if(type==='start'){startRun(profile.selectedStage);return;}
 if(type==='train'){buyTraining(btn.dataset.stat);return;}
 if(type==='select-stage'){startRun(Number(btn.dataset.stage));return;}
 if(type==='exchange'){
  if(profile.gold<80){toast('골드 80개가 필요합니다.');return;}
  profile.gold-=80;const k=STAT_KEYS[Math.floor(Math.random()*4)];profile.scrolls[k]++;
  save();renderAll();toast(STATS[k].name+' 주문서 +1');return;
 }
 if(type==='claim'){
  if(profile.claimed){toast('이미 수령한 체험 패키지입니다.');return;}
  profile.claimed=true;bonusScrolls(2);save();renderAll();toast('강화 주문서 4종 각 2장 획득!');return;
 }
 if(type==='mockbuy'){
  if(profile.mockClaimed){toast('가상 결제 시연은 1회만 가능합니다.');return;}
  if(window.confirm('테스트 전용 가상 결제입니다.\n실제 돈이 결제되지 않습니다.\n주문서 4종 각 8장을 지급할까요?')){
   bonusScrolls(8);profile.mockClaimed=true;save();renderAll();toast('가상 상품 지급 완료 · 실제 결제 없음');
  }return;
 }
 if(type==='reset'){
  if(window.confirm('이 브라우저의 모든 우승·강화·골드 기록을 초기화할까요?')){
   profile=fresh();save();renderAll();toast('초기화 완료');
  }return;
 }
 if(type==='go'){dismissModal();return;}
 if(type==='quit'){quitRun();changePage('home');return;}
 if(type==='pause'){
  if(!run||run.finished||run.paused)return;
  presentModal('PAUSE','잠시 쉬어가요','회식보다 중요한 건 박치기입니다. 손을 풀고 다시 도전하세요.',null,
  '<button data-act="resume">경기 계속하기</button><button class="secondary" data-act="forfeit">기권하고 보상받기</button>');return;
 }
 if(type==='resume'){dismissModal();return;}
 if(type==='forfeit'){endRun(false);return;}
 if(type==='perk'){
  if(!run||run.finished)return;
  const perk=PERKS.find(p=>p.key===btn.dataset.perk);
  if(!perk)return;
  perk.effect(run);dismissModal();toast(perk.name+' 획득!');
  return;
 }
 if(type==='next'){const next=Math.min(7,run.stage+1);quitRun();startRun(next);return;}
 if(type==='again'){const idx=run.stage;quitRun();startRun(idx);return;}
 if(type==='go-upgrade'){quitRun();changePage('upgrade');return;}
}
document.addEventListener('click',e=>{
 const nav=e.target.closest('[data-page]');
 if(nav&&!run){changePage(nav.dataset.page);return;}
 const btn=e.target.closest('[data-act]');
 if(btn&&!btn.disabled){action(btn.dataset.act,btn);}
});
function moveKnob(e){
 const base=$('#joystick').getBoundingClientRect(),cx=base.left+base.width/2,cy=base.top+base.height/2;
 let dx=e.clientX-cx,dy=e.clientY-cy;const distance=Math.max(1,Math.hypot(dx,dy));
 const max=42;
 if(distance>max){dx=dx/distance*max;dy=dy/distance*max;}
 stick.x=dx/max;stick.y=dy/max;
 if(Math.hypot(stick.x,stick.y)<.1){stick.x=0;stick.y=0;}
 $('#joystick-knob').style.transform='translate('+dx+'px,'+dy+'px)';
}
function resetStick(){stick.x=0;stick.y=0;stick.pointer=null;$('#joystick-knob').style.transform='translate(0px,0px)';}
const joy=$('#joystick');
joy.addEventListener('pointerdown',e=>{if(!run||run.paused)return;e.preventDefault();stick.pointer=e.pointerId;joy.setPointerCapture(e.pointerId);moveKnob(e);});
joy.addEventListener('pointermove',e=>{if(stick.pointer===e.pointerId){e.preventDefault();moveKnob(e);}});
joy.addEventListener('pointerup',e=>{if(stick.pointer===e.pointerId)resetStick();});
joy.addEventListener('pointercancel',e=>{if(stick.pointer===e.pointerId)resetStick();});
const chargeButton=$('#charge-btn');
chargeButton.addEventListener('pointerdown',e=>{if(!run||run.paused||run.finished)return;e.preventDefault();chargePointer=e.pointerId;chargeButton.setPointerCapture(e.pointerId);chargePress();});
chargeButton.addEventListener('pointerup',e=>{if(chargePointer===e.pointerId){e.preventDefault();chargePointer=null;chargeRelease();}});
chargeButton.addEventListener('pointercancel',e=>{if(chargePointer===e.pointerId){chargePointer=null;chargeRelease();}});
document.addEventListener('keydown',e=>{
 const key=e.key.length===1?e.key.toLowerCase():e.key;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Spacebar'].includes(key))e.preventDefault();
 if(key==='Escape'&&run&&!run.paused&&!run.finished){action('pause',null);return;}
 if(key===' '&&!chargeKeyboard){chargeKeyboard=true;chargePress();}
 keys[key]=true;
});
document.addEventListener('keyup',e=>{
 const key=e.key.length===1?e.key.toLowerCase():e.key;keys[key]=false;
 if(key===' '){chargeKeyboard=false;chargeRelease();}
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&run&&!run.paused&&!run.finished)action('pause',null);
});
window.addEventListener('resize',()=>{resizeCanvas();renderHero();});
if(window.ResizeObserver){new ResizeObserver(()=>{if(run)resizeCanvas();}).observe($('#arena-wrap'));}
renderAll();
})();