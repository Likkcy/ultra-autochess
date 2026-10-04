// Additional character mechanics. Uses the existing combat engine's damage and event rules.
import {gridmanDefinition} from './gridman.mjs';
const n=(u,a)=>a[Math.min(3,u.star)-1];
const live=u=>!u.dead&&u.hp>0;
const allies=(s,u)=>s.units.filter(w=>w.side===u.side&&live(w));
const lowest=(s,u)=>allies(s,u).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.id.localeCompare(b.id))[0];
const enemies=(s,u)=>s.units.filter(w=>w.side!==u.side&&live(w));
const near=(s,u,p,r,a)=>enemies(s,u).filter(w=>a.distance(p,w)<=r);
const stun=(s,u,t)=>{if(!(u.immuneUntil>s.time))u.stunUntil=Math.max(u.stunUntil,s.time+t);};
const later=(s,u,kind,delay,values={})=>{u.effects??=[];u.effects.push({kind,at:s.time+delay,...values});};
const group=(s,u,p,r,a)=>allies(s,u).filter(w=>a.distance(p,w)<=r);
const magic=(u,value,a)=>value*a.stats(u).ap/100;
function spawn(s,owner,def,a,star=1){
 const free=[];for(let y=owner.side===0?4:0;y<(owner.side===0?8:4);y++)for(let x=0;x<7;x++)if(!s.units.some(w=>live(w)&&w.x===x&&w.y===y))free.push({x,y});
 const desired=owner.matchEffects?.metalPositions?.[def.name],reservations=s.units.filter(u=>!u.special).flatMap(u=>Object.entries(u.matchEffects?.metalPositions??{}).filter(([name])=>name!==def.name).map(([,pos])=>pos));for(let i=free.length-1;i>=0;i--)if(reservations.some(p=>p.x===free[i].x&&p.y===free[i].y))free.splice(i,1);
 free.sort((p,q)=>a.distance(owner,p)-a.distance(owner,q)||p.y-q.y||p.x-q.x);
 const position=desired&&free.find(p=>p.x===desired.x&&p.y===desired.y)||free[0];
 const u=a.makeUnit({cost:0,traits:[],mana:null,mr:def.armor??30,...def},{...(position??{x:0,y:owner.side===0?4:0}),side:owner.side,star:1},`special-${++s.counter}`);
 u.special=true;u.owner=owner.id;u.star=star;u.ap=100;if(!position){u.waiting=true;s.waitingUnits??=[];s.waitingUnits.push(u);return u;}s.units.push(u);a.event(s,'summon',owner,u);applyJan(s,u,a);return u;
}
export function pets(s,u,a){
 if(u.mirror)return [];
 const templates={巴尔坦星人:{name:'巴尔坦分身',hp:n(u,[220,340,550]),ad:n(u,[20,30,48]),as:.7,armor:20,range:2,count:2},庞顿:{name:'双首火焰兽',hp:n(u,[400,650,1050]),ad:n(u,[25,38,60]),as:.6,armor:25,range:3,count:1},佐菲:{name:'光能支援兽',hp:n(u,[450,750,1500]),ad:n(u,[25,40,80]),as:.7,armor:20,range:3,count:1}};
 const def=templates[u.name];if(!def)return [];
 const rank=s.traits[u.side].summoner,mul=rank>=0?1+[.15,.3,.5][rank]:1;
 let owned=[...s.units,...(s.waitingUnits??[])].filter(w=>w.owner===u.id&&live(w));while(owned.length<def.count){const pet=spawn(s,u,{...def,hp:def.hp*mul,ad:def.ad*mul},a,u.star);if(!pet)break;pet.summonMultiplier=mul;owned.push(pet);}return owned.filter(w=>!w.waiting);
}
function applyJan(s,u,a){const enemyJan=s.units.filter(w=>w.side!==u.side&&w.name==='詹奈'&&!w.special);const shred=Math.max(0,...enemyJan.map(w=>n(w,[15,25,100])));if(shred&&!u.janShred){u.janShred=true;u.janPenalty=shred;a.event(s,'shred',enemyJan[0],u,{amount:shred});}}
export function initAbilities(s,a){
 for(const u of [...s.units]){
  if(u.cost===5&&u.star===3){u.maxHp+=4000;u.hp=u.maxHp;}
  const p=u.permanent;u.maxHp*=1+(p.hpPercent??0);u.dr=1-(1-u.dr)*(1-Math.min(.8,p.dr??0));u.maxHp+=(p.hp??0);u.hp=u.maxHp;u.baseAd+=(p.ad??0);u.asBonus+=(p.as??0);u.adBonus+=(p.adPercent??0)+Math.floor((p.rivalKills??0)/8)*.08*(u.name==='贝利亚'?1:0);u.extraCrit=(u.extraCrit??0)+(p.crit??0);u.armor+=(p.armor??0);u.mr+=(p.mr??0);
  if(u.name==='奥特之父'){u.dr=1-(1-u.dr)*(1-n(u,[.15,.2,.6]));u.adBonus+=n(u,[.2,.3,1]);}
  if(u.name==='托雷基亚'){u.eye={x:u.eyePosition?.x??u.x,y:u.eyePosition?.y??u.y};}
  applyJan(s,u,a);
 }
}
export function initAbilitySummons(s,a){
 for(const side of [0,1]){
  const tr=s.traits[side],team=s.units.filter(u=>u.side===side&&!u.special),grid=a.tier(tr.counts,'古利特');
  if(grid>=0){const distinct=[...new Map(team.filter(u=>u.traits.includes('古利特')).sort((x,y)=>x.star-y.star).map(u=>[u.name,u])).values()],S=distinct.reduce((v,u)=>v+u.star,0),owner=distinct[0];const d=gridmanDefinition(grid,S,owner.matchEffects?.augments?.includes('我们的世界'));const giant=spawn(s,owner,d,a,grid+1);if(giant){if(grid===2&&S>=14&&owner.matchEffects?.augments?.includes('我们的世界')){giant.star=4;giant.maxHp=giant.hp=24000;giant.baseAd=400;giant.baseAs=1.2;giant.armor=giant.mr=120;giant.mana=40;giant.maxMana=80;giant.immuneUntil=60;}giant.gridTier=grid;giant.gridStars=S;if(grid>=1&&giant.star<4)giant.asBonus+=.3;if(grid===2){if(giant.star<4){giant.armor+=30;giant.mr+=30;}a.shield(s,giant,giant.maxHp*.25,60,'grid');}}}
  const metal=a.tier(tr.counts,'金属狂潮');if(metal>=1){const owner=team.find(u=>u.traits.includes('金属狂潮'));const defs=[{name:'乌英达姆',hp:1000,ad:50,as:.6,armor:45,range:1,mana:[30,90]},{name:'英普莱扎',hp:900,ad:65,as:.65,armor:35,range:3,mana:[20,80]},{name:'加拉特隆',hp:1400,ad:70,as:.65,armor:50,range:3,mana:[40,110]}];for(const d of defs.slice(0,Math.min(3,metal))){const pet=spawn(s,owner,d,a);if(pet&&metal===4){pet.maxHp*=1.8;pet.hp=pet.maxHp;pet.amp+=.6;}}}
 }
}
export function initCompanions(s,a){for(const u of [...s.units])if(!u.special)pets(s,u,a);}
export function retrySummons(s,a){if(s.tick%20)return;const pending=s.waitingUnits??[];s.waitingUnits=[];for(const u of pending){const free=[];for(let y=u.side===0?4:0;y<(u.side===0?8:4);y++)for(let x=0;x<7;x++)if(!s.units.some(w=>live(w)&&w.x===x&&w.y===y))free.push({x,y});if(!free.length){s.waitingUnits.push(u);continue;}const owner=s.units.find(w=>w.id===u.owner);free.sort((p,q)=>a.distance(owner??u,p)-a.distance(owner??u,q));Object.assign(u,free[0]);u.waiting=false;s.units.push(u);applyJan(s,u,a);a.event(s,'summon',owner,u);}}
function ray(s,u,v,a){return a.lineTargets(s,u,v);}
function cone(s,u,v,a){return a.coneTargets(s,u,v);}
function trackedShield(s,u,w,amount,seconds,key,a,serial){a.shield(s,w,amount,seconds,key);w.shields.at(-1).tracker={source:u.id,serial};}
function burn(s,u,v,stacks,a){if(!live(v))return;v.burns??=[];let b=v.burns.find(b=>b.source===u.id);if(!b){b={source:u.id,stacks:0,next:s.time+1};v.burns.push(b);}b.stacks=Math.min(10,b.stacks+stacks);b.until=s.time+5;b.damage=n(u,[8,12,150]);b.heal=n(u,[.2,.25,.5]);a.event(s,'burn',u,v,{stacks:b.stacks});}
function channel(s,u,kind,v,value,times,a,extra={}){u.effects??=[];u.effects=u.effects.filter(e=>e.kind!==kind);later(s,u,kind,1,{target:v.id,position:{x:v.x,y:v.y},value,times,interval:1,...extra});}
export function castAbility(s,u,v,a){
 const st=a.stats(u),M=x=>magic(u,n(u,x),a),P=x=>st.ad*n(u,x),H=(w,value,kind='magic',options={})=>a.hit(s,u,w,value,kind,options),shield=(w,value,seconds,key)=>a.shield(s,w,value,seconds,key),buff=(w,key,seconds,values)=>a.buff(s,w,key,seconds,values);
 switch(u.name){
  case '皮古蒙':{const w=lowest(s,u);if(w){a.heal(s,w,M([160,240,400]));for(const z of group(s,u,w,1,a))if(z!==w)a.heal(s,z,M([80,120,200]));}break;}
  case '内海将':{const w=allies(s,u).sort((x,y)=>a.stats(y).as-a.stats(x).as)[0];if(w){shield(w,M([120,180,300]),5,`utsumi-${u.id}`);buff(w,`utsumi-${u.id}`,5,{as:n(u,[.15,.2,.3])});}break;}
  case '宝多六花':for(const w of group(s,u,u,1,a))shield(w,M([100,150,250]),4,`rikka-${u.id}`);break;
  case '马格马星人':H(v,P([2.2,3.3,5.4]),'physical');buff(u,'magma',4,{as:n(u,[.2,.3,.45])});break;
  case '达达':H(v,M([120,180,300]));buff(v,`dada-${u.id}`,4,{output:-n(u,[.12,.16,.22])});break;
  case '美尔巴':shield(u,M([180,270,450]),4,'melba');for(const w of cone(s,u,v,a))H(w,P([1.4,2.1,3.4]),'physical');break;
  case '哥尔赞':for(const w of near(s,u,u,1,a)){H(w,M([120,180,300]));stun(s,w,n(u,[.75,1,1.25]));}buff(u,'golzan',4,{dr:n(u,[.15,.2,.25])});break;
  case '詹伯特':ray(s,u,v,a).forEach((w,i)=>{if(u.boosterScale)a.buff(s,w,`jumbot-booster-${u.id}`,4,{armorPct:.15*u.boosterScale});H(w,P([2,3,4.8])*(i?(u.boosterScale ? .25*u.boosterScale+.5 : .5):1),'physical');});break;
  case '古雷格尔人':u.guard={absorbed:0};buff(u,'greg-guard',3,{dr:n(u,[.2,.25,.35])});later(s,u,'greg-counter',3,{target:v.id});break;
  case '爱迪':{const w=lowest(s,u);if(w){a.heal(s,w,M([220,330,550]));buff(w,`eighty-${u.id}`,5,{armor:n(u,[15,20,30]),mr:n(u,[15,20,30])});}break;}
  case '艾安隆':shield(u,M([300,450,750]),5,'iron');buff(u,'iron',5,{dr:n(u,[.15,.2,.3])});u.reflectUntil=s.time+5;break;
  case '达克戈内':for(let i=0;i<3;i++)later(s,u,'retarget-shot',i*.15,{target:v.id,value:P([.9,1.35,2.2]),kindDamage:'physical',inRange:true});break;
  case '基里艾洛德人':H(v,M([240,360,600]));channel(s,u,'kiriel-dot',v,M([25,40,65]),3,a);break;
  case '巴尔坦星人':for(const actor of [u,...pets(s,u,a)]){a.hit(s,actor,v,magic(actor,n(u,[90,135,220]),a)*(actor.summonMultiplier??1),'magic');buff(actor,'baltan-speed',5,{as:n(u,[.25,.35,.5])});}break;
  case '庞顿':H(v,M([120,180,300]));for(const pet of pets(s,u,a)){pet.busyUntil=s.time+3;channel(s,pet,'pandon-fire',v,magic(pet,n(u,[45,70,115]),a)*pet.summonMultiplier,3,a);}break;
  case '雷德王':H(v,P([2.3,3.45,5.5]),'physical');buff(v,`redking-${u.id}`,5,{armorPct:n(u,[.2,.25,.35])});break;
  case '邪恶迪迦':for(const w of ray(s,u,v,a)){H(w,P([1.6,2.4,4]),'physical');H(w,M([100,150,250]));}u.extraAttack={until:s.time+4,damage:M([25,40,65])};break;
  case '杰顿':{const serial=++u.effectSerial||1;u.effectSerial=serial;u.effects=(u.effects??[]).filter(e=>e.kind!=='zetton-ball');trackedShield(s,u,u,M([350,525,900]),4,'zetton',a,serial);for(const w of near(s,u,v,1,a))H(w,M([220,330,600]));later(s,u,'zetton-ball',.05,{target:v.id,position:{x:v.x,y:v.y},value:0,ratio:n(u,[.3,.4,.5]),serial,expires:s.time+4});break;}
  case '阿古茹':for(let i=0;i<2;i++)later(s,u,'aguru-slash',i*.15,{target:v.id,value:P([.9,1.35,2.1]),magic:M([70,105,180]),second:i===1});break;
  case '捷德':u.extraAttack={until:s.time+n(u,[5,5,7]),damage:M([35,55,100])};buff(u,'geed',n(u,[5,5,7]),{as:n(u,[.3,.4,.6])});later(s,u,'geed-beam',n(u,[5,5,7]),{target:v.id,value:M([180,270,500])});break;
  case '维克特利':shield(u,M([200,300,550]),4,'victory');H(v,P([3,4.5,7]),'physical',{pen:n(u,[.2,.25,.35])});break;
  case '欧布':for(const w of ray(s,u,v,a)){H(w,P([1.2,1.8,3]),'physical');H(w,M([180,270,480]));}u.extraAttack={until:s.time+4,damage:M([25,40,75])};break;
  case '麦克斯':{const targets=[v,...enemies(s,u).filter(w=>w!==v).sort((x,y)=>a.distance(v,x)-a.distance(v,y)||x.id.localeCompare(y.id)).slice(0,2)];targets.forEach((w,i)=>H(w,P([1.6,2.4,3.8])*.85**i,'physical'));buff(u,'max-speed',4,{as:n(u,[.2,.3,.45])});break;}
  case '安奇':{const free=a.neighbors(v).filter(p=>!s.units.some(w=>live(w)&&w.x===p.x&&w.y===p.y)).sort((x,y)=>a.distance(u,x)-a.distance(u,y));if(free[0]){Object.assign(u,free[0]);a.event(s,'dash',u,v);}H(v,P([2,3,4.6]),'physical');shield(u,M([150,225,450]),4,'anti');buff(u,'anti-speed',4,{as:n(u,[.25,.35,.5])});break;}
  case '梦比优斯':u.mebiusUntil=s.time+n(u,[6,6,8]);u.extraAttack={until:u.mebiusUntil,damage:M([45,70,140])};buff(u,'mebius',n(u,[6,6,8]),{as:n(u,[.3,.4,.6])});break;
  case '迪迦':u.busyUntil=s.time+.8;u.lockUntil=s.time+1.8;later(s,u,'tiga-beam',.8,{position:{x:v.x,y:v.y},value:M([480,720,1650]),interrupt:true});break;
  case '泽塔':for(const w of cone(s,u,v,a)){const amp=w.hp/w.maxHp<.4?1.3:1;H(w,P([2.5,3.75,6.5])*amp,'physical');H(w,M([100,150,350])*amp);}break;
  case '盖亚':shield(u,M([400,600,1400]),5,'gaia');for(const w of near(s,u,v,1,a)){H(w,M([180,270,650]));stun(s,w,n(u,[1.25,1.5,2]));}break;
  case '希卡利':for(const w of ray(s,u,v,a))H(w,M([300,450,1000]));u.extraAttack={until:s.time+5,damage:M([35,55,110])};for(const w of group(s,u,u,1,a))buff(w,`hikari-${u.id}`,5,{as:n(u,[.2,.25,.4])});break;
  case '金古桥':u.stunUntil=0;u.immuneUntil=Math.max(u.immuneUntil??0,s.time+.8);u.busyUntil=s.time+.8;buff(u,'kingjo-split',.8,{dr:.5});later(s,u,'kingjo',.8,{position:{x:v.x,y:v.y},value:P([2.2,3.3,6]),shield:M([450,675,1500])});break;
  case '响裕太':for(const w of cone(s,u,v,a)){H(w,P([1.8,2.7,4.5]),'physical');H(w,M([150,225,550]));}for(const giant of allies(s,u).filter(w=>w.name==='古利特超人'))for(const w of ray(s,giant,v,a))a.hit(s,giant,w,magic(giant,n(u,[180,270,650]),a),'magic');break;
  case '佐菲':for(const w of ray(s,u,v,a))H(w,M([400,600,1350]));for(const pet of pets(s,u,a))for(const w of ray(s,pet,v,a))a.hit(s,pet,w,magic(pet,n(u,[150,225,500]),a)*pet.summonMultiplier,'magic');break;
  case '亚波人':later(s,u,'yapool',1,{position:{x:v.x,y:v.y},value:M([380,570,1300]),dot:M([40,60,140]),interrupt:true});break;
  case '高斯':{const w=lowest(s,u);if(w){for(const z of group(s,u,w,1,a))a.heal(s,z,M([250,375,800]));shield(w,M([150,225,500]),5,`cosmos-${u.id}`);for(const z of near(s,u,w,1,a))buff(z,`cosmos-${u.id}`,3,{as:-n(u,[.2,.25,.35])});}break;}
  case '加坦杰厄':u.gatanUntil=s.time+6;buff(u,'gatan',6,{dr:n(u,[.15,.2,.6])});for(const w of u.star===3?enemies(s,u):ray(s,u,v,a)){H(w,u.star===3?magic(u,9999,a):M([350,525,9999]));stun(s,w,n(u,[1,1.5,3]));}channel(s,u,'gatan-fog',v,0,6,a);break;
  case '奥特之父':for(const w of u.star===3?allies(s,u):group(s,u,u,1,a)){shield(w,u.star===3?magic(u,15000,a):M([450,675,15000]),u.star===3?12:6,`father-${u.id}`);if(u.star===3){w.stunUntil=0;w.immuneUntil=s.time+8;if(!w.special&&!w.fatherReviveUsed)w.fatherRevive=true;}}for(const w of u.star===3?enemies(s,u):cone(s,u,v,a)){H(w,u.star===3?9999:P([2.5,3.75,0]),'physical');stun(s,w,1.5);}break;
  case '新条茜':u.akaneShots=u.star===3?Infinity:n(u,[6,8,0]);if(u.star===3)buff(u,'akane-three',60,{as:2});break;
  case '银河':for(const w of u.star===3?enemies(s,u):ray(s,u,v,a))H(w,u.star===3?magic(u,9999,a):M([450,675,9999]));for(const w of allies(s,u).filter(w=>w!==u)){if(u.star===3){w.pendingFullMana=true;buff(w,'gunga-three',60,{ap:100,as:1});}else a.mana(s,w,n(u,[8,12,0]));}break;
  case '托雷基亚':{if(u.star===3&&!u.tregearControlled){u.tregearControlled=true;for(const w of enemies(s,u))stun(s,w,5);}channel(s,u,'tregear-zone',v,M([120,180,1000]),3,a,{burst:M([180,270,6000]),all:u.star===3});if(u.star===3)u.eyeGlobal=true;break;}
  case '泰罗':if(u.star===3){for(const w of enemies(s,u)){H(w,magic(u,8000,a));burn(s,u,w,10,a);}buff(u,'taro-three',8,{dr:.5});}else for(const w of near(s,u,u,1,a))H(w,P([2.5,3.75,0]),'physical');u.taroUntil=s.time+6;break;
  case '艾斯杀手':if(u.star===3){if(!u.allSampled){u.allSampled=true;for(const w of enemies(s,u)){u.baseAd+=w.baseAd*.3;u.ap+=w.ap*.3;u.armor+=w.armor*.3;u.mr+=w.mr*.3;}}u.immuneUntil=s.time+enemies(s,u).length*.4+1;enemies(s,u).forEach((w,i)=>later(s,u,'slayer-execute',i*.4,{target:w.id,value:9999}));}else for(let i=0;i<3;i++)later(s,u,'slayer-hit',i*.2,{target:v.id,value:P([1,1.5,0]),magic:i===2?M([200,300,0]):0});break;
  case '镜子骑士':{const serial=(u.effectSerial??0)+1;u.effectSerial=serial;u.tracked??={};u.tracked[serial]=0;for(const w of u.star===3?allies(s,u):group(s,u,u,1,a))trackedShield(s,u,w,(u.star===3?magic(u,12000,a):M([400,600,0]))*(1+.2*(u.boosterScale??0)*(u.star===3&&w!==u?0:1)),u.star===3?10:4,`mirror-${u.id}`,a,serial);later(s,u,'mirror-burst',u.star===3?3:4,{value:u.star===3?magic(u,5000,a):M([200,300,0]),serial,ratio:n(u,[.5,.7,3])+(u.star===3?0:.2*(u.boosterScale??0)),all:u.star===3});if(u.star===3&&!u.special){for(const w of [...allies(s,u)].filter(w=>!w.special)){const opening=w.openingSnapshot??w,def={name:w.name,hp:opening.maxHp,ad:opening.baseAd,as:opening.baseAs,armor:opening.armor,mr:opening.mr,range:opening.range,mana:[opening.mana,opening.maxMana]};const clone=spawn(s,u,def,a,w.star);if(clone){Object.assign(clone,structuredClone(w.openingSnapshot??{}));clone.hp=clone.maxHp;clone.mirror=true;clone.traits=[...w.traits];for(const key of ['dragonNext','redemptionNext','archangelNext','sunfireNext','immuneUntil'])if(clone[key])clone[key]+=s.time;}}}break;}
  case '詹奈':if(u.star===3){if(!u.janGranted){u.janGranted=true;u.janDrones=100;u.janNext=s.time+1;}for(const w of enemies(s,u))for(let i=0;i<12;i++)later(s,u,'jan-rocket',i*.25,{target:w.id,value:1000});}else{for(let i=0;i<6;i++)later(s,u,'retarget-shot',i*.12,{target:v.id,value:P([.45,.65,0]),kindDamage:'physical'});later(s,u,'jan-burst',.75,{position:{x:v.x,y:v.y},value:M([200,300,0])});}break;
  case '古利特超人':if(u.star===4){for(const w of enemies(s,u))H(w,6000,'magic');for(const w of allies(s,u))a.shield(s,w,w.maxHp*.5,8,'grid-terminal');break;}for(const w of ray(s,u,v,a))H(w,magic(u,(220+25*u.gridStars)*(u.gridTier>=1?1.25:1),a));break;
  case '乌英达姆':shield(u,350,5,'windam');H(v,200);stun(s,v,1);break;
  case '英普莱扎':for(let i=0;i<3;i++)later(s,u,'retarget-shot',i*.15,{target:v.id,value:st.ad*1.2,kindDamage:'physical'});break;
  case '加拉特隆':for(const w of ray(s,u,v,a)){H(w,450);buff(w,'galactron-slow',4,{as:-.2});}break;
  default:return false;
 }
 return true;
}
export function beforeAttack(s,u,v,a){
 if(u.name==='乔尼亚斯'&&u.attacks%3===0)return n(u,[1.4,1.7,2.6]);
 if(u.name==='古利特超人'&&u.star===4)return 3;if(u.name==='古利特超人'&&u.gridTier>=1&&u.attacks%3===0)return 1.8;
 if(u.name==='新条茜'&&u.akaneShots>0){u.akaneShots--;return n(u,[1.8,2.2,10]);}
 return 1;
}
export function afterAttack(s,u,v,a,coefficient){
 if(u.name==='红莲火焰'&&u.boosterScale&&!u.mirror){if((u.boosterStacks??0)<15){u.boosterStacks=(u.boosterStacks??0)+1;u.asBonus+=.02*u.boosterScale;}if(u.attacks%3===0)a.heal(s,u,u.maxHp*.02*u.boosterScale); }
 const st=a.stats(u);
 if(u.extraAttack?.until>s.time)a.hit(s,u,v,u.extraAttack.damage,'magic',{noCrit:true});
 if(u.name==='梦比优斯'&&u.mebiusUntil>s.time&&u.attacks%3===0)for(const w of ray(s,u,v,a))a.hit(s,u,w,st.ad*n(u,[1.2,1.5,2.4]));
 if(u.name==='古利特超人'&&u.star===4)for(const w of cone(s,u,v,a).filter(w=>w!==v))a.hit(s,u,w,st.ad*3,'physical',{noCrit:true,augment:true});if(u.name==='乔尼亚斯'&&u.attacks%3===0||u.name==='古利特超人'&&u.star!==4&&u.gridTier>=1&&u.attacks%3===0)for(const w of near(s,u,v,1,a))if(w!==v)a.hit(s,u,w,st.ad*coefficient,'physical',{attack:true});
 if(u.name==='新条茜'){
  if(u.star<3&&(u.akaneStacks??0)<20){u.akaneStacks=(u.akaneStacks??0)+1;u.asBonus+=.05;}
  if(coefficient>1){for(const w of u.star===3?enemies(s,u):near(s,u,v,1,a))if(w!==v)a.hit(s,u,w,st.ad*coefficient*(u.star===3?1:.4),'physical',{attack:true});}
  if(u.star===3&&u.akaneShots>0&&u.attacks%3===0)for(const w of enemies(s,u))a.hit(s,u,w,magic(u,3000,a),'magic');
 }
 if(u.name==='泰罗'){burn(s,u,v,1,a);if(u.taroUntil>s.time)for(const w of near(s,u,v,1,a))if(w!==v){a.hit(s,u,w,st.ad*.5);burn(s,u,w,1,a);}}
 if(u.name==='艾斯杀手'&&u.star<3&&!u.sampleTarget){u.sampleTarget=v.id;const ratio=n(u,[.1,.15,0])*(u.sampleMultiplier??1);u.sample={ad:v.baseAd*ratio,ap:v.ap*ratio,armor:v.armor*ratio,mr:v.mr*ratio};u.baseAd+=u.sample.ad;u.ap+=u.sample.ap;u.armor+=u.sample.armor;u.mr+=u.sample.mr;a.event(s,'sample',u,v);}
}
export function tickAbilities(s,a){
 for(const u of [...s.units]){
  applyJan(s,u,a);
  if(live(u)&&u.pendingFullMana&&s.time>=u.lockUntil){u.pendingFullMana=false;if(u.maxMana)u.mana=u.maxMana;}
  for(const b of u.burns??[])if(live(u)&&b.until>s.time&&b.next<=s.time){b.next+=1;const source=a.lookup(s,b.source);if(source){const dealt=a.hit(s,source,u,magic(source,b.damage*b.stacks,a),'magic',{noCrit:true});a.heal(s,source,dealt*b.heal);}}u.burns=(u.burns??[]).filter(b=>b.until>s.time);
  if(!live(u))continue;
  if(u.name==='乔尼亚斯'&&!u.joneusTriggered&&u.hp/u.maxHp<.5){u.joneusTriggered=true;a.heal(s,u,magic(u,n(u,[200,300,700]),a));a.buff(s,u,'joneus',n(u,[6,6,8]),{ad:n(u,[.2,.3,.5])});a.event(s,'passive',u,u);}
  if(u.name==='古利特超人'&&u.gridTier===2&&!u.gridPulse&&u.hp/u.maxHp<.5){u.gridPulse=true;for(const w of near(s,u,u,1,a)){a.hit(s,u,w,magic(u,200+20*u.gridStars,a),'magic');stun(s,w,1);}}
  if(u.janDrones&&u.janNext<=s.time){u.janNext=s.time+1;const v=a.nearest(s,u),rank=s.traits[u.side].ai,st=a.stats(u);if(v)a.hit(s,u,v,u.janDrones*(st.ad*(rank>=0?[.01,.013,.016,.02,.03][rank]:.01)+st.ap*(rank>=0?[.005,.0065,.008,.01,.015][rank]:.005)),'magic',{noCrit:true});}
  const due=(u.effects??[]).filter(e=>e.at<=s.time+1e-8);u.effects=(u.effects??[]).filter(e=>e.at>s.time+1e-8);
  for(const e of due){if(e.interrupt&&s.time<u.stunUntil)continue;let v=a.lookup(s,e.target);if((!v||!live(v))&&e.kind==='retarget-shot')v=a.nearest(s,u);if(v&&!live(v))v=null;const position=e.position??v;
   switch(e.kind){
    case 'retarget-shot':case 'slayer-hit':if(v&&(!e.inRange||a.distance(u,v)<=u.range)){a.hit(s,u,v,e.value,e.kindDamage??'physical');if(e.magic)a.hit(s,u,v,e.magic,'magic');}break;
    case 'aguru-slash':if(v){a.hit(s,u,v,e.value);a.hit(s,u,v,e.magic,'magic');if(e.second)a.buff(s,v,`aguru-${u.id}`,5,{armor:-n(u,[15,20,30]),mr:-n(u,[15,20,30])});}break;
    case 'greg-counter':if(v)a.hit(s,u,v,a.stats(u).ad*n(u,[1.8,2.7,4.4])+Math.min(u.maxHp*.3,(u.guard?.absorbed??0)*n(u,[.2,.25,.3])));u.guard=null;break;
    case 'zetton-ball':if(s.time<e.expires&&u.shields.some(sh=>sh.key==='zetton'&&sh.amount>0)){e.at=s.time+.05;u.effects.push(e);}else if(position)for(const w of near(s,u,position,1,a))a.hit(s,u,w,e.value+(u.tracked?.[e.serial]??0)*e.ratio,'magic');break;
    case 'tiga-beam':if(position)ray(s,u,position,a).forEach((w,i)=>a.hit(s,u,w,e.value*(i===0?1.2:1),'magic'));break;
    case 'geed-beam':if(v)for(const w of ray(s,u,v,a))a.hit(s,u,w,e.value,'magic');break;
    case 'kingjo':a.shield(s,u,e.shield,6,'kingjo');if(position)for(const w of near(s,u,position,1,a))a.hit(s,u,w,e.value);break;
    case 'yapool':if(position){for(const w of near(s,u,position,1,a))a.hit(s,u,w,e.value,'magic');later(s,u,'yapool-dot',1,{position,value:e.dot,times:3});}break;
    case 'yapool-dot':case 'tregear-zone':{const targets=e.all?enemies(s,u):position?near(s,u,position,1,a):[];for(const w of targets)a.hit(s,u,w,e.value,'magic');if(e.times>1){e.times--;e.at=s.time+1;u.effects.push(e);}else if(e.kind==='tregear-zone')for(const w of targets){a.hit(s,u,w,e.burst,'magic');stun(s,w,1.5);}break;}
    case 'kiriel-dot':if(v&&v.id===e.target)a.hit(s,u,v,e.value,'magic');if(e.times>1){e.times--;e.at=s.time+1;u.effects.push(e);}break;
    case 'pandon-fire':if(position)for(const w of ray(s,u,position,a))a.hit(s,u,w,e.value,'magic');if(e.times>1){e.times--;e.at=s.time+1;u.effects.push(e);}break;
    case 'gatan-fog':for(const w of u.star===3?enemies(s,u):near(s,u,u,2,a))a.hit(s,u,w,u.star===3?magic(u,500+w.maxHp*.08,a):magic(u,n(u,[60,90,0]),a),'magic');if(e.times>1){e.times--;e.at=s.time+1;u.effects.push(e);}break;
    case 'mirror-burst':for(const w of e.all?enemies(s,u):near(s,u,u,2,a))a.hit(s,u,w,e.value+(u.tracked?.[e.serial]??0)*e.ratio,'magic');break;
    case 'slayer-execute':if(v&&v.id===e.target){const free=a.neighbors(v).find(p=>!s.units.some(w=>live(w)&&w.x===p.x&&w.y===p.y));if(free)Object.assign(u,free);a.hit(s,u,v,e.value);if(v.hp<=0)a.heal(s,u,u.maxHp*.2);}break;
    case 'jan-rocket':if(v&&v.id===e.target)a.hit(s,u,v,e.value);break;
    case 'jan-burst':if(position)for(const w of near(s,u,position,1,a))a.hit(s,u,w,e.value,'magic');break;
   }
  }
 }
 // Spatial auras are recomputed after movement, and sources do not multiply on every tick.
 for(const u of s.units){u.buffs=u.buffs.filter(b=>!b.aura);if(!live(u))continue;const eyeSources=s.units.filter(w=>w.side===u.side&&live(w)&&w.name==='托雷基亚'&&!w.mirror);for(const eye of eyeSources)if(eye.eyeGlobal||a.distance(eye.eye??eye,u)<=1){u.buffs.push({key:`eye-${eye.id}`,until:s.time+.1,as:eye.eyeGlobal?1.5:n(eye,[.2,.3,1.5]),armor:eye.eyeGlobal?150:n(eye,[20,30,150]),mr:eye.eyeGlobal?150:n(eye,[20,30,150]),aura:true});}
  const rank=a.tier(s.traits[u.side].counts,'空想乐团');if(rank>=0){const orchestra=s.units.filter(w=>w.side===u.side&&!w.special&&w.traits.includes('空想乐团')),solo=orchestra.find(w=>w.instanceId===w.matchEffects?.soloId&&w.matchEffects?.augments?.includes('独奏时刻'));const sources=solo?u===solo?new Set(orchestra.map(w=>w.name)).size:live(solo)&&a.distance(u,solo)<=1?1:0:Math.min([2,3,4][rank],allies(s,u).filter(w=>w.traits.includes('空想乐团')&&a.distance(u,w)<=1).length);u.buffs.push({key:'ensemble-aura',until:s.time+.1,ad:sources*[.06,.10,.15][rank],ap:sources*[6,10,15][rank],aura:true});}
 }
}
export function onAbilityKill(s,killer,v,a){
 if((s.traits[killer.side].counts['银河帝国']??0)>=2&&killer.traits.includes('银河帝国'))killer.empireKills=(killer.empireKills??0)+1;
 if(s.traits[killer.side].counts['宿敌']>=2&&['赛罗','贝利亚'].includes(killer.name)){const before=killer.permanent.rivalKills??0;killer.permanent.rivalKills=before+(killer.name==='贝利亚'&&v.name==='泰罗'?2:1);if(killer.name==='贝利亚')killer.adBonus+=(Math.floor(killer.permanent.rivalKills/8)-Math.floor(before/8))*.08;}
 if(killer.name==='艾斯杀手'&&killer.sampleTarget===v.id&&!killer.sampleBonus){killer.sampleBonus=true;for(const key of ['ap','armor','mr'])killer[key]+=killer.sample[key];killer.baseAd+=killer.sample.ad;}
 const assassin=a.tier(s.traits[killer.side].counts,'刺客');if(assassin>=0&&killer.traits.includes('刺客'))a.buff(s,killer,'assassin-kill',5,{ad:[.2,.35][assassin],as:[.3,.5][assassin]});
}
