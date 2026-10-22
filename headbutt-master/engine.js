/* Headbutt Master v0.2 — deterministic, single-opponent duel rules. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HM=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const VERSION='0.2.0',SAVE='headbutt_master_pilot_v2',OLD_SAVE='headbutt_master_pilot_v1';
const PARTS=['forehead','waist','leg','thigh'];
const PART_NAMES=['이마','허리','다리','허벅지'];
const STAGES=['동대회','구대회','시대회','지역대회','전국대회','아시아대회','세계대회','Headbutt Championship'];
const OUTFITS=['회식 후 퇴근복','동네 운동복','구대표 트레이닝복','시대표 경기복','지역 챔피언복','국가대표 유니폼','아시아 투사복','세계 챔피언복','그랜드 슬램 황금복'];
const BOSSES=['박 관장','구청 철이마','돌머리 태식','황금 두개골','전국구 불도저','철두권 마스터','월드 챔피언','THE HEADBUTT KING'];
const SKILLS=[
 {id:'double',name:'더블 박치기',short:'더블',icon:'×2',lv:1,cost:14,cd:4.5,tag:'연속 공격',desc:'이마를 두 번 연속 찍습니다. 기본 피해의 85% × 2회.',original:true},
 {id:'behind',name:'이환이형 박치기',short:'이환이형',icon:'↶',lv:2,cost:18,cd:7,tag:'회피 · 뒤치기',desc:'1초 회피하며 상대 뒤로 이동해 140% 피해. 예고된 공격을 피할 수 있습니다.',original:true},
 {id:'power',name:'강화 박치기',short:'강화',icon:'↑',lv:3,cost:20,cd:6,tag:'강력한 한 방',desc:'허리를 크게 젖힌 뒤 250% 피해. 준비 동작 중에는 피격될 수 있습니다.',original:true},
 {id:'grab',name:'손으로 잡고 박치기',short:'잡고 박치기',icon:'⋈',lv:4,cost:25,cd:8,tag:'잡기 · 방어 관통',desc:'가까운 상대를 양손으로 잡고 65% 피해를 세 번. 방어를 무시합니다.',original:true},
 {id:'shot',name:'원거리 박치기',short:'원거리',icon:'➜',lv:5,cost:20,cd:5,tag:'이마 발사',desc:'이마 모양의 탄환을 쏩니다. 거리에 관계없이 165% 피해.',original:true},
 {id:'counter',name:'반격 박치기',short:'반격',icon:'↩',lv:6,cost:18,cd:8,tag:'타이밍 반격',desc:'1.5초 안에 받는 첫 공격을 막고 220% 피해로 되돌려 줍니다.'},
 {id:'rush',name:'불도저 박치기',short:'불도저',icon:'»',lv:7,cost:25,cd:8,tag:'돌진 · 밀치기',desc:'거리를 좁혀 200% 피해를 주고 상대를 뒤로 밀어냅니다.'},
 {id:'stun',name:'뇌진탕 박치기',short:'기절',icon:'✧',lv:8,cost:22,cd:9,tag:'기절',desc:'150% 피해를 주고 상대를 1.7초 동안 기절시킵니다.'},
 {id:'iron',name:'금강불괴 이마',short:'금강불괴',icon:'◇',lv:9,cost:20,cd:12,tag:'방어',desc:'4초 동안 받는 피해를 55% 줄입니다. 반격과 함께 사용해 버티세요.'},
 {id:'king',name:'박치기 왕의 일격',short:'왕의 일격',icon:'♛',lv:10,cost:45,cd:14,tag:'궁극기',desc:'허리를 끝까지 젖혀 500% 피해. 최종 결승을 위한 결정타.'}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function int(v,a,b,f=0){return typeof v==='number'&&Number.isFinite(v)?clamp(Math.floor(v),a,b):f;}
function fresh(){return{version:2,gold:160,levels:{forehead:1,waist:1,leg:1,thigh:1},scrolls:{forehead:3,waist:2,leg:2,thigh:2},clears:Array(8).fill(false),selectedStage:0,wins:0,totalKills:0,bestKills:0,bestCombo:0,claimed:false,mockClaimed:false,duelWins:0,duelLosses:0,bestRound:0,learned:1,muted:false};}
function normalize(d){const p=fresh();if(!d||typeof d!=='object')return p;p.gold=int(d.gold,0,1e8,160);PARTS.forEach(k=>{p.levels[k]=int(d.levels?.[k],1,100,1);p.scrolls[k]=int(d.scrolls?.[k],0,1e6,0);});p.clears=p.clears.map((_,i)=>d.clears?.[i]===true);for(const k of ['wins','totalKills','bestKills','bestCombo','duelWins','duelLosses','bestRound'])p[k]=int(d[k],0,1e8);p.learned=int(d.learned,1,10,1);p.claimed=d.claimed===true;p.mockClaimed=d.mockClaimed===true;p.muted=d.muted===true;p.selectedStage=int(d.selectedStage,0,unlockedStage(p));return p;}
function load(storage){try{const current=storage.getItem(SAVE);if(current)return normalize(JSON.parse(current));const old=storage.getItem(OLD_SAVE);const p=normalize(old?JSON.parse(old):null);storage.setItem(SAVE,JSON.stringify(p));return p;}catch(_){return fresh();}}
function save(storage,p){try{storage.setItem(SAVE,JSON.stringify(p));return true;}catch(_){return false;}}
function unlockedStage(p){let i=0;while(i<7&&p.clears[i])i++;return i;}
function trainCost(p,k){return{scroll:Math.ceil(1+(p.levels[k]-1)*1.35),gold:20+p.levels[k]*32};}
function train(p,k){if(!PARTS.includes(k))return false;const c=trainCost(p,k);if(p.levels[k]>=100||p.gold<c.gold||p.scrolls[k]<c.scroll)return false;p.gold-=c.gold;p.scrolls[k]-=c.scroll;p.levels[k]++;return true;}
function attackPower(p,lv=1){return(19+7*p.levels.forehead)*(1+(lv-1)*.075);}
function hpMax(p,lv=1){return 185+22*p.levels.thigh+(lv-1)*10;}
function fighter(x,hp){return{x,hp,max:hp,pose:0,stun:0,evade:0,shield:0,counter:0,flash:0,facing:1};}
function createRun(p,stage=0,practice=false){const r={stage:clamp(stage,0,7),practice,level:practice?10:1,round:1,phase:'ready',time:0,left:60,p:fighter(350,hpMax(p,practice?10:1)),e:null,cd:{},energy:100,basicCd:0,dodgeCd:0,lock:0,charge:false,chargeTime:0,pending:[],projectiles:[],events:[],clock:0,ai:1.4,aiCount:0,warning:null,equipped:practice?['double','behind','grab','shot']:['double',null,null,null],settled:false,roundWins:0,combo:0,maxCombo:0,lastHit:-10,score:0};makeOpponent(r);if(practice){r.e.hp=r.e.max=1800;r.e.name='연습 파트너 · 철이마';r.p.hp=r.p.max=650;}return r;}
function makeOpponent(r){const hp=95+r.round*24+r.stage*55;r.e=fighter(620,hp);r.e.facing=-1;r.e.name=r.round===10?BOSSES[r.stage]:['넥타이 김 대리','동네 헬스 형','이마부장 최 씨','퇴근길 철수','뚝심의 오 과장','박치기 강 사범','번개 머리 조 씨','철벽 임 코치','전설의 이 차장'][r.round-1];r.ai=1.4;r.aiCount=0;r.warning=null;}
function emit(r,type,data={}){r.events.push({type,...data});if(r.events.length>80)r.events.shift();}
function dist(r){return Math.abs(r.e.x-r.p.x);}
function toward(a,b){return b.x>=a.x?1:-1;}
function hit(r,p,from,mult,opts={}){if(r.phase!=='fight')return;const a=from==='p'?r.p:r.e,b=from==='p'?r.e:r.p;
 if(b.evade>0){emit(r,'miss',{x:b.x,text:'회피!'});return;}
 if(from==='e'&&b.counter>0){b.counter=0;emit(r,'counter',{x:b.x,text:'COUNTER!'});hit(r,p,'p',2.2,{ignore:true});return;}
 const raw=from==='p'?attackPower(p,r.level)*mult:(9+r.round*1.4+r.stage*2)*mult;
 const resist=from==='e'?1-Math.min(.4,(p.levels.thigh-1)*.035):1;
 const damage=Math.max(1,Math.round(raw*resist*(b.shield > 0 && !opts.ignore ? .45 : 1)));
 b.hp=Math.max(0,b.hp-damage);b.flash=.22;emit(r,'hit',{from,x:b.x,damage,heavy:mult>=2.3});
 if(from==='p'){r.combo=r.clock-r.lastHit<3?r.combo+1:1;r.lastHit=r.clock;r.maxCombo=Math.max(r.maxCombo,r.combo);r.score+=damage;}
 if(opts.stun){b.stun=opts.stun;if(from==='p'){r.warning=null;r.pending=r.pending.filter(v=>v.from!=='e');emit(r,'text',{x:b.x,text:'기절!'});}}
 if(opts.knock)b.x=clamp(b.x+toward(a,b)*opts.knock,100,900);
 if(b.hp<=0){r.phase=from==='p'?'won':'lost';r.charge=false;r.pending=[];r.projectiles=[];r.warning=null;emit(r,'end',{win:from==='p'});}
}
function schedule(r,from,delay,mult,options={}){r.pending.push({from,at:r.clock+delay,mult,origin:(from==='p'?r.p:r.e).x,dir:toward(from==='p'?r.p:r.e,from==='p'?r.e:r.p),...options});}
function startCharge(r){if(r.phase!=='fight'||r.lock>0||r.basicCd>0||r.p.stun>0)return false;r.charge=true;r.chargeTime=0;return true;}
function cancelCharge(r){r.charge=false;r.chargeTime=0;}
function releaseCharge(r,p){if(!r.charge)return false;const q=clamp(r.chargeTime,0,1.2);cancelCharge(r);if(r.phase!=='fight'||r.p.stun>0)return false;const perfect=q>=.72&&q<=.96;const mult=(perfect?2.65:1+q*.95)*(1+(p.levels.waist-1)*.035);r.basicCd=.65;r.lock=.28;r.p.pose=.35;schedule(r,'p',.14,mult,{range:280});emit(r,'attack',{id:'basic',perfect});return true;}
function dodge(r){if(r.phase!=='fight'||r.dodgeCd>0||r.p.stun>0)return false;cancelCharge(r);r.p.evade=.68;r.p.x=clamp(r.p.x-toward(r.p,r.e)*125,100,900);r.dodgeCd=2.8;emit(r,'skill',{id:'dodge'});return true;}
function useSkill(r,p,id){const s=SKILLS.find(x=>x.id===id);if(!s||r.phase!=='fight'||s.lv>r.level||!r.equipped.includes(id))return'아직 사용할 수 없는 기술';if(r.p.stun>0||r.lock>0)return'동작이 끝난 뒤 사용';if((r.cd[id]||0)>0)return'재사용 대기 중';if(r.energy<s.cost)return'기력이 부족합니다';if(['double','power','grab','stun','king'].includes(id)&&dist(r)>310)return'조금 더 가까이 다가가세요';cancelCharge(r);r.energy-=s.cost;r.cd[id]=s.cd;r.lock=.45;r.p.pose=.55;emit(r,'skill',{id});
 switch(id){
 case'double':schedule(r,'p',.14,.85,{range:315});schedule(r,'p',.38,.85,{range:330});r.lock=.5;break;
 case'behind':{const d=toward(r.p,r.e);r.p.x=clamp(r.e.x+d*235,95,905);r.p.facing=-d;r.p.evade=1;schedule(r,'p',.3,1.4,{range:350,anyDir:true});break;}
 case'power':r.lock=.72;r.p.pose=.85;schedule(r,'p',.62,2.5,{range:340});break;
 case'grab':r.e.x=clamp(r.p.x+toward(r.p,r.e)*240,100,900);r.e.stun=1.25;r.warning=null;r.pending=r.pending.filter(v=>v.from!=='e');[.18,.43,.69].forEach(d=>schedule(r,'p',d,.65,{range:340,ignore:true}));r.lock=.78;break;
 case'shot':schedule(r,'p',.18,1.65,{projectile:true});break;
 case'counter':r.p.counter=1.5;r.lock=.15;break;
 case'rush':r.p.x=clamp(r.e.x-toward(r.p,r.e)*235,95,905);r.p.evade=.38;schedule(r,'p',.18,2,{range:350,knock:100});break;
 case'stun':schedule(r,'p',.24,1.5,{range:330,stun:1.7});break;
 case'iron':r.p.shield=4;r.lock=.15;break;
 case'king':r.lock=1;r.p.pose=1.1;schedule(r,'p',.88,5,{range:400,knock:80});break;
 }return null;}
function equip(r,id,slot){const s=SKILLS.find(v=>v.id===id);if(!s||s.lv>r.level||slot<0||slot>3)return false;const a=r.equipped.slice();const old=a.indexOf(id);if(old===slot)return true;if(old>=0)a[old]=a[slot]||null;a[slot]=id;r.equipped=a.slice(0,4);return true;}
function step(r,p,dt,input=0){if(r.phase!=='fight')return;dt=clamp(dt,0,.04);r.clock+=dt;r.time+=dt;r.left=Math.max(0,r.left-dt);r.energy=Math.min(100,r.energy+12*dt);for(const f of [r.p,r.e])for(const k of ['pose','stun','evade','shield','counter','flash'])f[k]=Math.max(0,f[k]-dt);for(const k in r.cd)r.cd[k]=Math.max(0,r.cd[k]-dt);for(const k of ['basicCd','dodgeCd','lock'])r[k]=Math.max(0,r[k]-dt);if(r.charge)r.chargeTime=Math.min(1.2,r.chargeTime+dt);
 if(r.p.stun<=0&&r.lock<=0){let next=clamp(r.p.x+clamp(input,-1,1)*(170+p.levels.leg*12)*dt*(r.charge?.35:1),100,900);if(Math.abs(next-r.e.x)>=230)r.p.x=next;}
 r.p.facing=toward(r.p,r.e);r.e.facing=toward(r.e,r.p);
 if(r.e.stun<=0){if(!r.warning&&dist(r)>260)r.e.x+=toward(r.e,r.p)*(80+r.stage*5)*dt;r.ai-=dt;if(r.ai<=0&&!r.warning){const kind=r.aiCount%4===3?'shot':r.aiCount%3===2?'heavy':'normal';r.aiCount++;const wind=kind==='normal'?.85:1.12;const mult=kind==='heavy'?1.8:kind==='shot'?1.15:1;r.warning={kind,until:r.clock+wind,total:wind};r.e.pose=wind+.25;schedule(r,'e',wind,mult,{range:320,projectile:kind==='shot'});r.ai=wind+1.2+Math.max(0,.5-r.stage*.05);emit(r,'warning',{kind});}}
 const due=r.pending.filter(a=>a.at<=r.clock);r.pending=r.pending.filter(a=>a.at>r.clock);
 for(const a of due){if(r.phase!=='fight')break;const from=a.from==='p'?r.p:r.e,to=a.from==='p'?r.e:r.p;if(a.from==='e'){r.warning=null;if(from.stun>0)continue;}if(a.projectile){r.projectiles.push({x:from.x,dir:toward(from,to),from:a.from,mult:a.mult,life:2});continue;}const front=a.anyDir||(to.x-from.x)*a.dir>=-40;if(Math.abs(to.x-from.x)<=(a.range||280)&&front)hit(r,p,a.from,a.mult,a);else emit(r,'miss',{x:to.x,text:'빗나감'});}
 for(const b of r.projectiles){if(r.phase!=='fight')break;const target=b.from==='p'?r.e:r.p;const old=b.x;b.x+=b.dir*650*dt;b.life-=dt;if((target.x-old)*(target.x-b.x)<=0||Math.abs(b.x-target.x)<35){hit(r,p,b.from,b.mult);b.life=0;}}
 r.projectiles=r.projectiles.filter(b=>b.life>0&&b.x>-50&&b.x<1050);
 if(r.phase==='fight'&&r.left<=0){const win=r.p.hp/r.p.max>r.e.hp/r.e.max;r.phase=win?'won':'lost';cancelCharge(r);r.pending=[];r.projectiles=[];r.warning=null;emit(r,'end',{win,decision:true});}
}
function settle(p,r){if(r.settled||!['won','lost'].includes(r.phase))return null;r.settled=true;const won=r.phase==='won',reward={gold:0,scrolls:{},won,champion:won&&r.round===10,practice:r.practice,first:false};if(r.practice)return reward;const key=PARTS[(r.round-1+r.stage)%4];reward.gold=won?38+r.round*5+r.stage*12:12+r.stage*5;reward.scrolls[key]=won?2:1;p.gold+=reward.gold;p.scrolls[key]+=reward.scrolls[key];p.bestCombo=Math.max(p.bestCombo,r.maxCombo);p.learned=Math.max(p.learned,r.level);if(won){p.duelWins++;p.totalKills++;r.roundWins++;p.bestRound=Math.max(p.bestRound,r.round);p.bestKills=Math.max(p.bestKills,r.roundWins);}else p.duelLosses++;if(reward.champion){reward.first=!p.clears[r.stage];p.clears[r.stage]=true;p.wins++;if(reward.first){p.gold+=200+r.stage*60;reward.gold+=200+r.stage*60;PARTS.forEach(k=>{p.scrolls[k]+=3;reward.scrolls[k]=(reward.scrolls[k]||0)+3;});}p.selectedStage=Math.min(7,r.stage+1);}return reward;}
function nextRound(r,p){if(r.phase!=='won'||r.round>=10||!r.settled||r.practice)return false;r.round++;r.level=r.round;r.phase='ready';r.left=60;r.time=0;r.energy=100;r.cd={};r.basicCd=0;r.dodgeCd=0;r.lock=0;r.pending=[];r.projectiles=[];r.events=[];r.settled=false;const hp=hpMax(p,r.level);r.p=fighter(350,Math.min(hp,r.p.hp+Math.round(hp*.32)+10));r.p.max=hp;makeOpponent(r);const empty=r.equipped.findIndex(x=>!x);if(empty>=0)r.equipped[empty]=SKILLS[r.level-1].id;p.learned=Math.max(p.learned,r.level);return true;}
return{VERSION,SAVE,OLD_SAVE,PARTS,PART_NAMES,STAGES,OUTFITS,BOSSES,SKILLS,clamp,fresh,normalize,load,save,unlockedStage,trainCost,train,attackPower,hpMax,createRun,startCharge,cancelCharge,releaseCharge,dodge,useSkill,equip,step,settle,nextRound,dist};
});
