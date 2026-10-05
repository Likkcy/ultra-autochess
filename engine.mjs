import {initRoyalFusion,tickRoyalFusion} from './legendary-traits.mjs';
import {rivalActive,creditRivalParticipation} from './rivals.mjs';
import {initSpecials,tickSpecials} from './specials.mjs';
// DOM-free fixed-step combat engine. Rendering never advances simulation time.
import {initAbilities,initAbilitySummons,initCompanions,retrySummons,castAbility,beforeAttack,afterAttack,tickAbilities,onAbilityKill} from "./abilities.mjs";
import {initEquipment,attackEquipment,castEquipment,hitEquipment,damageEquipment,tickEquipment} from './equipment.mjs';
import {initCombatAugments,finalizeAugmentShields,endFrameAugments,tickCombatAugments,augmentDamage,augmentHit,augmentAttack,augmentCast,augmentDeath,augmentRevive,ownsCombatAugment} from './augment-combat.mjs';
import {initAugmentSpecials,augmentSpecialCast,augmentSpecialAttack,tickAugmentSpecials} from './augment-specials.mjs';
export const STEP=0.05;
export const WIDTH=7, HEIGHT=8;
export const heroNames=['红莲火焰','赛罗','奈克瑟斯','赛文','武士圣剑','杰克','阿斯特拉','贝利亚'];
export function rng(seed){let a=Number(seed)>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const axial=p=>({q:p.x-(p.y-(p.y&1))/2,r:p.y});
const offset=p=>({x:p.q+(p.r-(p.r&1))/2,y:p.r});
export function distance(a,b){a=axial(a);b=axial(b);return(Math.abs(a.q-b.q)+Math.abs(a.r-b.r)+Math.abs(a.q+a.r-b.q-b.r))/2;}
export function neighbors(p){const a=axial(p);return [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]].map(([q,r])=>offset({q:a.q+q,r:a.r+r})).filter(p=>p.x>=0&&p.x<WIDTH&&p.y>=0&&p.y<HEIGHT);}
export const traitTiers={古利特:[3,5,7],银河帝国:[2,4],科学家:[2,3,4],银河警备队:[3,5,7,9,11],人工智能:[2,4,6,8,9],金属狂潮:[3,5,7,9,10],宇宙骑士队:[2,4],法师:[2,3,5],神谕:[2,4,6],狂战士:[2,3,5],战士:[2,4,6],主宰:[2,4,6],护卫:[2,4,6],重装战士:[2,3],格斗家:[2,4,6],神枪手:[2,3,5],不屈之心:[2,3,5],骑士之誓:[2,4,6],导师:[1,2,3,4],召唤师:[2,3,4],刺客:[2,4],正义使者:[2,3,6],空想乐团:[2,4,6],宿敌:[1]};
export const supportedTraits=['古利特','空想乐团','银河警备队','法师','神谕','狂战士','战士','护卫','格斗家','不屈之心','骑士之誓','导师','召唤师','主宰','重装战士','刺客','正义使者','神枪手','人工智能','金属狂潮','科学家','银河帝国','宇宙骑士队','宿敌'];
const pick=(arr,star)=>arr[star-1];
const alive=u=>!u.dead&&u.hp>0;
export function traitCounts(units){const counts={};const names=new Set();for(const u of units){if(u.special||names.has(u.name))continue;names.add(u.name);for(const t of u.traits)counts[t]=(counts[t]??0)+1;}if(counts["宿敌"]!==undefined)counts["宿敌"]=rivalActive(units)?1:0;return counts;}
export function tier(counts,name){let t=-1;for(const [i,n] of (traitTiers[name]??[]).entries())if((counts[name]??0)>=n)t=i;return t;}
function makeUnit(def,p,id){
 const star=Math.max(1,Math.min(3,Number(p.star)||1));const hero=Boolean(p.hero&&heroNames.includes(def.name));
 const permanent={ap:0,kills:0,...p.permanent};
 return {id,name:def.name,cost:def.cost,traits:[...def.traits],star,hero,special:false,side:p.side,x:p.x,y:p.y,items:[...(p.items??[])],hp:def.hp*[1,1.8,3.24][star-1],maxHp:def.hp*[1,1.8,3.24][star-1],baseAd:def.ad*[1,1.5,2.25][star-1],baseAs:def.as,armor:def.armor,mr:def.mr,range:def.range,ap:100+permanent.ap,adBonus:0,asBonus:0,amp:0,dr:0,omni:0,mana:def.mana?.[0]??0,maxMana:def.mana?.[1]??0,permanent,shields:[],buffs:[],attackClock:0.4,moveClock:0,lockUntil:0,stunUntil:0,busyUntil:0,attacks:0,droneCount:0,fighterStacks:0,sharpStacks:0,castCount:0,dead:false,reviveAt:0,revived:false,killCredited:false,damageDone:0,healingDone:0};
}
function resistance(u,key){const values=u.buffs.map(b=>b[key]??0),positive=values.filter(v=>v>0).reduce((n,v)=>n+v,0),negative=values.filter(v=>v<0).reduce((n,v)=>n+v,0),pct=Math.max(0,...u.buffs.map(b=>b[key+'Pct']??0));return Math.max(0,(u[key]+positive)*(1-pct)+negative-(u.janPenalty??0));}
function bonus(u,key){return u.buffs.reduce((s,b)=>s+(b[key]??0),0);}
export function stats(u){return {ad:u.baseAd*(1+u.adBonus+bonus(u,'ad')),as:Math.max(.05,Math.min(5,u.baseAs*(1+u.asBonus+bonus(u,'as')))),ap:u.ap+bonus(u,'ap'),armor:resistance(u,'armor'),mr:resistance(u,'mr'),amp:u.amp+bonus(u,'amp'),output:1+bonus(u,'output'),dr:1-(1-u.dr)*(1-bonus(u,'dr'))};}
function event(s,type,source,target,extra={}){s.events.push({tick:s.tick,time:Number(s.time.toFixed(2)),type,source:source?.id??null,target:target?.id??null,...extra});}
function buff(s,u,key,seconds,values){u.buffs=u.buffs.filter(b=>b.key!==key);u.buffs.push({key,until:s.time+seconds,...values});}
function shield(s,u,amount,seconds,key){amount=Math.max(0,amount)*(1+(u.augShieldPower??0))*(s.time>=30?.5:1);u.shields=u.shields.filter(x=>x.key!==key);u.shields.push({key,amount,until:s.time+seconds});event(s,'shield',u,u,{amount:Math.round(amount)});}
function heal(s,u,n){if(!alive(u))return;const value=Math.max(0,Math.min(u.maxHp-u.hp,n*(1+(u.augHealPower??0))*(s.time>=30?0.5:1)*(u.woundUntil>s.time?.67:1)));u.hp+=value;u.healingDone+=value;if(value>1)event(s,'heal',u,u,{amount:Math.round(value)});}
const mana=(s,u,n)=>{if(u.maxMana&&s.time>=u.lockUntil)u.mana=Math.min(u.maxMana,u.mana+n);};
const enemyList=(s,u)=>s.units.filter(v=>v.side!==u.side&&alive(v)&&!(v.untargetableUntil>s.time));
const nearest=(s,u)=>enemyList(s,u).sort((a,b)=>distance(u,a)-distance(u,b)||Number(Boolean(b.robot))-Number(Boolean(a.robot))||a.id.localeCompare(b.id))[0];
const nearby=(s,u,center,r)=>enemyList(s,u).filter(v=>distance(center,v)<=r);
const lookup=(s,id)=>s.units.find(u=>u.id===id);
function queue(s,after,type,source,target,extra={}){s.queue.push({at:s.time+after,type,source:source.id,target:target?.id??null,...extra});}
function magic(u,n){return n*stats(u).ap/100;}
function hit(s,u,v,n,kind='physical',opts={}){
 if(!v||!alive(v)||n<=0)return 0;
 let value=augmentDamage(s,u,v,n,opts,abilityAPI)*(opts.fixedDamage?1:(1+stats(u).amp)*Math.max(0,stats(u).output))*(s.time>=30?1.5:1);
 const chance=.25+(u.extraCrit??0)+(s.traits[u.side].justice>=0?pick([.1,.2,.35],s.traits[u.side].justice+1):0),critDamage=1.4+(u.extraCritDamage??0)+Math.max(0,chance-1)/2;let crit=false;if((opts.attack||u.skillCrit||s.traits[u.side].justice>=0)&&!opts.noCrit&&s.random()<Math.min(1,chance)){value*=(v.combatItems??[]).includes('荆棘甲')?1+(critDamage-1)*(.5**v.combatItems.filter(n=>n==='荆棘甲').length):critDamage;crit=true;}value=damageEquipment(s,u,v,value,kind,opts,abilityAPI);if(value<=0)return 0;
 const resistance=kind==='physical'?stats(v).armor*(1-(opts.pen??0)):kind==='magic'?stats(v).mr:0;
 value*=100/(100+resistance)*(1-stats(v).dr);
 const before=value,shieldBefore=v.shields.reduce((sum,sh)=>sum+sh.amount,0);
 v.shields.sort((a,b)=>a.until-b.until);
 for(const sh of v.shields){const absorb=Math.min(sh.amount,value);sh.amount-=absorb;value-=absorb;if(sh.tracker){const owner=lookup(s,sh.tracker.source);if(owner){owner.tracked??={};owner.tracked[sh.tracker.serial]=(owner.tracked[sh.tracker.serial]??0)+absorb;}}if(value<=0)break;}
 const actual=Math.min(v.hp,value);v.hp-=actual;const absorbed=before-value;
 if(v.stance)v.stance.absorbed+=actual+absorbed;if(v.guard)v.guard.absorbed+=actual+absorbed;
 u.damageDone+=actual+absorbed;if(actual+absorbed>0){const owner=u.owner?lookup(s,u.owner):u;if(owner&&!owner.mirror&&owner.side!==v.side){v.participants??={};v.participants[owner.id]=true;}}
 if(v.hp<=0&&!v.pendingKiller){v.pendingKiller=u.id;v.pendingKillTag=opts.tag??null;}
 mana(s,v,Math.min(15,(actual+absorbed)*0.05));
 if(u.omni&&!opts.item&&!opts.reflected)heal(s,u,(actual+absorbed)*u.omni);
 if(opts.skillHeal)heal(s,u,(actual+absorbed)*opts.skillHeal);
 event(s,'hit',u,v,{amount:Math.round(actual+absorbed),kind,crit});hitEquipment(s,u,v,actual+absorbed,kind,opts,abilityAPI,shieldBefore);augmentHit(s,u,v,actual+absorbed,opts,crit,abilityAPI);
 if(opts.attack&&v.reflectUntil>s.time&&!opts.reflected){v.reflectedBy??={};if((v.reflectedBy[u.id]??-1)<=s.time){v.reflectedBy[u.id]=s.time+1;hit(s,v,u,magic(v,pick([20,30,50],v.star)),'magic',{noCrit:true,reflected:true});}}
 if(s.traits[u.side].justice===2&&v.hp>0&&v.hp/v.maxHp<0.12){v.hp=0;v.pendingKiller??=u.id;event(s,'execute',u,v);}
 return actual+absorbed;
}
function computeTraits(s){
 for(const side of [0,1]){
  const team=s.units.filter(u=>u.side===side&&!u.special);const counts=traitCounts(team),t=n=>tier(counts,n);
  s.traits[side]={counts,police:t('银河警备队'),mage:t('法师'),oracle:t('神谕'),fighter:t('格斗家'),sharp:t('神枪手'),ai:t('人工智能'),unyield:t('不屈之心'),summoner:t('召唤师'),justice:t('正义使者'),oath:t('骑士之誓'),beam:false,startingHp:0};
  const guard=t('护卫'),mentor=t('导师'),mentorMultiplier=mentor===3?1.5:1;
  const mentorNames=new Set(team.filter(u=>u.traits.includes('导师')).map(u=>u.name));
  const captain=team.find(u=>u.oathCaptain&&u.traits.includes('骑士之誓'))??team.filter(u=>u.traits.includes('骑士之誓')).sort((a,b)=>b.star-a.star||b.cost-a.cost||a.id.localeCompare(b.id))[0];
  s.traits[side].captain=captain?.id??null;
  for(const u of team){
   const has=n=>u.traits.includes(n),give=(n,fn)=>{const rank=t(n);if(rank>=0&&has(n))fn(rank);};
   if(guard>=0){const r=[12,22,35][guard]*(has('护卫')?2:1);u.armor+=r;u.mr+=r;}
   if(mentor>=0){if(mentorNames.has('赛文'))u.ap+=12*mentorMultiplier;if(mentorNames.has('雷欧'))u.adBonus+=0.12*mentorMultiplier;if(mentorNames.has('爱迪'))u.maxHp*=1+.12*mentorMultiplier;if(mentorNames.has('奥特之父'))u.dr=1-(1-u.dr)*(1-.08*mentorMultiplier);}
   give('银河警备队',i=>{u.adBonus+=[.1,.18,.28,.4,.75][i];u.ap+=[10,18,28,40,75][i];});
   give('法师',i=>u.ap+=[15,30,55][i]);give('狂战士',i=>{u.adBonus+=[.1,.18,.35][i];u.asBonus+=[.2,.35,.65][i];});
   give('战士',i=>u.maxHp*=1+[.2,.35,.55][i]);give('主宰',i=>u.dr=1-(1-u.dr)*(1-[.12,.22,.35][i]));
   give('金属狂潮',i=>{u.armor+=[10,20,30,45,80][i];u.mr+=[10,20,30,45,80][i];});
   give('人工智能',i=>u.asBonus+=[.1,.2,.3,.45,.8][i]);give('刺客',i=>u.omni+=[.15,.25][i]);
   if(s.traits[side].oath>=0&&u.id===captain?.id){const i=s.traits[side].oath;u.maxHp*=1+[.15,.25,.4][i];u.adBonus+=[.15,.25,.4][i];u.ap+=[15,25,40][i];}
   if(u.hero&&u.name==='阿斯特拉'){u.maxMana=0;u.mana=0;u.baseAs=.85;u.omni+=.2;}
   if(u.hero&&u.name==='奈克瑟斯'){u.maxMana=0;u.mana=0;}
   if(u.hero&&u.name==='杰克'){u.range=3;u.baseAs=.8;u.mana=20;u.maxMana=60;}
   if(u.hero&&u.name==='赛文'){u.range=3;u.baseAs=.75;u.maxHp+=pick([200,300,500],u.star);u.mana=0;u.maxMana=60;}
   u.hp=u.maxHp;
   
  }
  s.traits[side].startingHp=team.filter(u=>u.traits.includes('银河警备队')).reduce((v,u)=>v+u.maxHp,0);
 }
}
function spawnMiclas(s,owner){if(owner.mirror)return null;
 if(owner.hero)return;
 const existing=[...s.units,...(s.waitingUnits??[])].find(u=>u.owner===owner.id&&alive(u));if(existing)return existing.waiting?null:existing;
 const used=new Set(s.units.filter(alive).map(u=>`${u.x},${u.y}`));
 const half=Array.from({length:28},(_,i)=>({x:i%7,y:(owner.side===0?4:0)+Math.floor(i/7)})).sort((p,q)=>distance(owner,p)-distance(owner,q));const p=half.find(p=>!used.has(`${p.x},${p.y}`));
 const rank=s.traits[owner.side].summoner,mul=rank>=0?1+[.15,.3,.5][rank]:1;
 const def={name:'米克拉斯',cost:0,traits:[],hp:pick([550,850,1400],owner.star)*mul,ad:pick([30,45,70],owner.star)*mul,as:.55,armor:40,mr:40,range:1,mana:null};
 const u=makeUnit(def,{...(p??{x:owner.x,y:owner.y}),side:owner.side,star:1},`summon-${owner.id}-${++s.counter}`);u.star=owner.star;u.special=true;u.owner=owner.id;u.ap=100;u.summonMultiplier=mul;if(!p){u.waiting=true;s.waitingUnits??=[];s.waitingUnits.push(u);return null;}s.units.push(u);event(s,'summon',owner,u);return u;
}
export function createBattle(catalog,placements,seed=4317){
 if(!Array.isArray(placements)||placements.length<2)throw Error('双方至少各需一名棋子');
 const occupied=new Set();
 const s={version:1,tick:0,time:0,seed:Number(seed)>>>0,random:rng(seed),counter:0,units:[],events:[],queue:[],traits:[{},{}],finished:false,winner:null};
 for(const p of placements){
  const def=catalog.find(u=>u.name===p.name);if(!def?.implemented)throw Error(`未接入角色：${p.name}`);
  if(!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.x>=WIDTH||p.y<0||p.y>=HEIGHT||![0,1].includes(p.side))throw Error('非法棋盘位置');
  if(occupied.has(`${p.x},${p.y}`))throw Error('棋子不能重叠');occupied.add(`${p.x},${p.y}`);
  s.units.push(makeUnit(def,p,`unit-${++s.counter}`));
 }
 if(![0,1].every(side=>s.units.some(u=>u.side===side)))throw Error('双方至少各需一名棋子');
 for(let i=0;i<s.units.length;i++){s.units[i].evolutions=placements[i].evolutions??[];s.units[i].oathCaptain=Boolean(placements[i].oathCaptain);s.units[i].matchEffects=placements[i].matchEffects??{};s.units[i].booster=placements[i].booster??null;s.units[i].instanceId=placements[i].instanceId??null;s.units[i].eyePosition=placements[i].eyePosition??null;const def=catalog.find(d=>d.name===s.units[i].name);if(def.special){s.units[i].special=true;s.units[i].neutral=Boolean(def.neutral);s.units[i].neutralLoot=placements[i].neutralLoot??[];s.units[i].npcStage=def.npcStage??0;s.units[i].npcNext=def.npcStage===5?5:6;}}
 for(const u of s.units)for(const item of u.items)if(item.endsWith('纹章')){const trait=item.slice(0,-2);if(traitTiers[trait]&&!u.traits.includes(trait))u.traits.push(trait);}
 const rivalSides=[0,1].map(side=>rivalActive(s.units.filter(u=>u.side===side)));for(const u of s.units)u.rivalActive=['赛罗','贝利亚'].includes(u.name)&&rivalSides[u.side];for(const u of s.units)if(u.name==='赛罗'&&rivalSides[u.side])for(const trait of u.evolutions)if(['正义使者','法师','格斗家','狂战士'].includes(trait)&&!u.traits.includes(trait))u.traits.push(trait);
 computeTraits(s);initAbilities(s,abilityAPI);initSpecials(s,abilityAPI);initCombatAugments(s,abilityAPI);initEquipment(s,abilityAPI);finalizeAugmentShields(s,abilityAPI);initAugmentSpecials(s,abilityAPI);initAbilitySummons(s,abilityAPI);initCompanions(s,abilityAPI);for(const u of [...s.units])if(u.name==='赛文')spawnMiclas(s,u);tickSpecials(s,abilityAPI);for(const side of [0,1]){s.traits[side].startingHp=s.units.filter(u=>u.side===side&&!u.special&&u.traits.includes('银河警备队')).reduce((n,u)=>n+u.maxHp,0);const heavy=tier(s.traits[side].counts,'重装战士');if(heavy>=0)for(const u of s.units.filter(u=>u.side===side))shield(s,u,u.maxHp*([.12,.2][heavy]*(ownsCombatAugment(u,'稳固重装')?1.1:1)),ownsCombatAugment(u,'稳固重装')?12:8,'heavy');}
 initRoyalFusion(s,abilityAPI);
 for(const u of s.units)u.openingSnapshot=Object.fromEntries(['maxHp','baseAd','baseAs','armor','mr','range','ap','adBonus','asBonus','amp','dr','omni','mana','maxMana','extraCrit','extraCritDamage','skillCrit','combatItems','helmetBack','oathItemReady','dragonNext','redemptionNext','archangelNext','sunfireNext','immuneUntil'].filter(k=>u[k]!==undefined).map(k=>[k,structuredClone(u[k])]));
 event(s,'start',null,null,{seed:s.seed});return s;
}
function attack(s,u,v){
 const st=stats(u);u.attacks++;mana(s,u,10);let coefficient=beforeAttack(s,u,v,abilityAPI);if(u.robot&&u.robotRole==='warrior'&&u.attacks%3===0){const driver=s.units.find(w=>w.id===u.driver);coefficient=1.6*(driver?.pilotQ??1);}
 if(u.traits.includes('格斗家')&&s.traits[u.side].fighter>=0&&u.attacks%4===0&&u.fighterStacks<8){u.fighterStacks++;u.adBonus+=[.03,.05,.08][s.traits[u.side].fighter];}
 if(u.name==='红莲火焰'&&u.hero){u.asBonus+=.03;if(u.attacks%3===0)coefficient=pick([1.8,2.4,3.6],u.star);}
 if(u.name==='奈克瑟斯'&&u.hero&&u.attacks%6===0){
  const dealt=hit(s,u,v,st.ad*pick([1.4,2.1,3.5],u.star),'physical',{attack:true});
  const magicDamage=hit(s,u,v,magic(u,pick([180,270,450],u.star)),'magic',{noCrit:true});heal(s,u,(dealt+magicDamage)*.2);
  if(!v.special&&(dealt+magicDamage)>0){const n=pick([1,2,4],u.star);u.ap+=n;u.permanent.ap+=n;event(s,'growth',u,u,{amount:n});}augmentAttack(s,u,v,abilityAPI);attackEquipment(s,u,v,abilityAPI);event(s,'attack',u,v);return;
 }
 if(u.name==='阿斯特拉'&&u.hero&&u.attacks%3===0){
  u.busyUntil=s.time+(pick([2,3,4],u.star)-1)*.15;
  for(let i=0;i<pick([2,3,4],u.star);i++)queue(s,i*.15,'kick',u,v,{coefficient:pick([.8,1.2,2],u.star)});augmentAttack(s,u,v,abilityAPI);attackEquipment(s,u,v,abilityAPI);event(s,'attack',u,v);return;
 }
 if(u.belialUntil>s.time){coefficient=pick([1.4,1.7,2.4],u.star);for(const w of nearby(s,u,v,1))if(w.id!==v.id)hit(s,u,w,st.ad*coefficient*.5,'physical',{attack:true});}
 if(u.sevenShots>0){coefficient=pick([1.6,2,3],u.star);u.sevenShots--;const rank=s.traits[u.side].summoner;coefficient*=rank>=0?1+[.15,.3,.5][rank]:1;const other=lineTargets(s,u,v).filter(w=>w.id!==v.id&&distance(u,w)>distance(u,v));for(const w of other)hit(s,u,w,st.ad*coefficient*.4,'physical',{noCrit:true});}
 u.pilotEnhancedAttack=u.lopuzShots>0;if(u.lopuzShots>0){coefficient=pick([1.4,1.7,2.2],u.star);u.lopuzShots--;}
 if(u.name==='红莲火焰'&&!u.hero&&u.flameUntil>s.time){u.flameAttacks=(u.flameAttacks??0)+1;if(u.flameAttacks%3===0)coefficient=pick([1.8,2.4,3.6],u.star);}
 const advanceDamage=ownsCombatAugment(u,'战线推进')&&u.traits.includes('战士')&&tier(s.traits[u.side].counts,'战士')>=0&&u.attacks%5===0?u.maxHp*.06:0;const basePen=u.name==='黑暗洛普斯'&&coefficient>1?1-.8*(u.robotId&&s.units.some(w=>w.id===u.robotId&&alive(w))?1-.1*u.pilotQ:1):0,calibratedPen=ownsCombatAugment(u,'疾速校准')&&u.traits.includes('神枪手')&&s.traits[u.side].sharp>=0&&u.sharpStacks>=[10,12,15][s.traits[u.side].sharp]+5?.2:0;hit(s,u,v,st.ad*coefficient+advanceDamage,'physical',{attack:true,pen:1-(1-basePen)*(1-calibratedPen)});
 if(u.flameUntil>s.time)hit(s,u,v,magic(u,pick([30,45,75],u.star)),'magic',{noCrit:true});
 if(u.name==='雷欧'&&u.attacks%4===0){hit(s,u,v,st.ad*(pick([2.2,3,4.5],u.star)-1),'physical',{attack:true});v.stunUntil=Math.max(v.stunUntil,s.time+pick([.75,1,1.25],u.star));heal(s,u,magic(u,pick([60,90,160],u.star)));}
 if(u.traits.includes('神枪手')&&s.traits[u.side].sharp>=0){const rank=s.traits[u.side].sharp;if(u.sharpStacks<[10,12,15][rank]+(ownsCombatAugment(u,'疾速校准')?5:0)){u.sharpStacks++;u.asBonus+=[.04,.06,.09][rank];}}
 if(u.traits.includes('人工智能')&&s.traits[u.side].ai>=0){const rank=s.traits[u.side].ai;const n=u.droneCount;hit(s,u,v,n*(st.ad*[.01,.013,.016,.02,.03][rank]+st.ap*[.005,.0065,.008,.01,.015][rank]),'magic',{noCrit:true});u.droneCount++;}
 augmentAttack(s,u,v,abilityAPI);augmentSpecialAttack(s,u,v,abilityAPI);afterAttack(s,u,v,abilityAPI,coefficient);attackEquipment(s,u,v,abilityAPI);event(s,'attack',u,v);
}
function cast(s,u,v,second=false){
 u.busyUntil=Math.max(u.busyUntil,s.time+.3);if(!second){u.mana=0;u.castCount++;u.lockUntil=s.time+1.3;}
 event(s,'cast',u,v,{second});castEquipment(s,u,abilityAPI,!second);augmentCast(s,u,v,abilityAPI);const st=stats(u);
 if(u.robot){augmentSpecialCast(s,u,v,abilityAPI);return;}
 switch(u.name){
  case '初代':hit(s,u,v,st.ad*pick([2.4,3.6,5.8],u.star));buff(s,v,'first-shred',4,{armorPct:pick([.15,.2,.25],u.star)});break;
  case '杰克':
   if(u.hero){shield(s,u,magic(u,pick([300,450,750],u.star)),5,'jack');if((u.jackStacks??0)<6){u.jackStacks=(u.jackStacks??0)+1;u.adBonus+=.15;}u.bladesUntil=s.time+6;u.bladeNext??=s.time+1;}
   else {shield(s,u,magic(u,pick([250,375,625],u.star)),5,'jack');const ally=s.units.filter(w=>w.side===u.side&&alive(w)&&w.id!==u.id).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(ally)shield(s,ally,magic(u,pick([100,150,250],u.star)),5,`jack-${u.id}`);}break;
  case '阿斯特拉':for(let i=0;i<2;i++)queue(s,i*.15,'kick',u,v,{coefficient:pick([1.1,1.65,2.7],u.star)});heal(s,u,magic(u,pick([70,105,175],u.star)));break;
  case '赛文':
   if(u.hero)u.sevenShots=5;
   else {const pet=spawnMiclas(s,u);if(pet){shield(s,pet,magic(pet,pick([200,300,500],u.star))*pet.summonMultiplier,5,'miclas');hit(s,pet,v,magic(pet,pick([150,225,360],u.star))*pet.summonMultiplier,'magic');v.stunUntil=Math.max(v.stunUntil,s.time+1);}hit(s,u,v,st.ad*pick([1.2,1.8,2.9],u.star));}break;
  case '红莲火焰':u.flameUntil=s.time+5;if(!u.hero)buff(s,u,'flame-as',5,{as:pick([.2,.3,.45],u.star)});break;
  case '机械哥莫拉':for(const w of nearby(s,u,v,1)){hit(s,u,w,magic(u,pick([180,270,450],u.star)),'magic');w.stunUntil=Math.max(w.stunUntil,s.time+pick([1,1.25,1.5],u.star)+(u.robotId&&s.units.some(w=>w.id===u.robotId&&alive(w))?.2*u.pilotQ:0));}shield(s,u,magic(u,pick([180,270,450],u.star)),4,'gomora');break;
  case '武士圣剑':
   if(u.hero){u.stance={absorbed:0};buff(s,u,'sword-stance',2,{dr:pick([.25,.3,.4],u.star)});queue(s,2,'sword',u,v);u.busyUntil=s.time+2;u.lockUntil=s.time+3;}
   else {shield(s,u,magic(u,pick([250,375,625],u.star)),5,'sword');buff(s,u,'sword-armor',5,{armor:pick([15,20,30],u.star),mr:pick([15,20,30],u.star)});for(const w of nearby(s,u,v,1))hit(s,u,w,st.ad*pick([1.8,2.7,4.4],u.star));}break;
  case '赛罗':{
   const extras=u.hero?Math.min(4,Math.floor(u.permanent.kills/8)):0;
   const amount=st.ad*(pick([3,4.5,8],u.star)+extras*pick([.9,1.35,2.4],u.star));
   queue(s,.2,'zero',u,v,{amount,extras});buff(s,u,'zero-as',5,{as:pick([.25,.35,.55],u.star)});break;}
  case '贝利亚':
   for(const w of nearby(s,u,v,1))hit(s,u,w,st.ad*pick([2.2,3.3,5.2],u.star),'physical',u.hero?{}:{skillHeal:pick([.2,.25,.35],u.star)});
   if(u.hero){u.belialUntil=Math.max(u.belialUntil??0,s.time+6);buff(s,u,'belial-form',u.belialUntil-s.time,{as:pick([.35,.45,.65],u.star)});u.omni=u.baseOmni??u.omni;u.baseOmni=u.omni;u.omni=u.baseOmni+.2;}
   else shield(s,u,magic(u,pick([150,225,450],u.star)),4,'belial');break;
  case '奈克瑟斯':{
   const targets=lineTargets(s,u,v);for(const w of targets)hit(s,u,w,magic(u,pick([220,330,550],u.star)),'magic');shield(s,u,magic(u,pick([180,270,450],u.star)),5,'nexus');if(!u.special&&targets.some(w=>!w.special)){const n=pick([1,2,4],u.star);u.permanent.ap+=n;u.ap+=n;event(s,'growth',u,u,{amount:n});}break;}
  case '艾斯':queue(s,.6,'ace',u,v,{amount:magic(u,pick([280,420,750],u.star)),position:{x:v.x,y:v.y}});u.busyUntil=s.time+.6;break;
  case '黑暗洛普斯':u.lopuzShots=pick([4,5,7],u.star);break;
  case '戴拿':shield(s,u,magic(u,pick([180,270,450],u.star)),4,'dyna');hit(s,u,v,st.ad*pick([2.6,3.9,6.5],u.star),'physical',{skillHeal:pick([.15,.2,.25],u.star)});break;
  case '阿诺西拉斯':for(const w of nearby(s,u,v,1))hit(s,u,w,magic(u,pick([180,270,450],u.star)),'magic');break;
  default:if(!castAbility(s,u,v,abilityAPI))throw Error(`缺少技能处理器：${u.name}`);
 }
 u.lockUntil=Math.max(u.lockUntil,u.busyUntil+1);
 if(!second&&u.traits.includes('法师')&&s.traits[u.side].mage>=0){const delay=Math.max(.3,u.busyUntil-s.time);queue(s,delay,'second-cast',u,v);u.lockUntil=Math.max(u.lockUntil,s.time+delay+1.3);}
 augmentSpecialCast(s,u,v,abilityAPI);
}
function move(s,u,target){
 const driver=u.robot&&s.units.find(w=>w.id===u.driver&&alive(w)),moveRange=driver?Math.min(u.range,driver.range):u.range;const occupied=new Set(s.units.filter(alive).filter(w=>w.id!==u.id&&w!==driver).map(w=>`${w.x},${w.y}`));
 const starts=neighbors(u).filter(p=>!occupied.has(`${p.x},${p.y}`));let found=null;
 // BFS searches a route to any free attack-range tile instead of getting stuck behind allies.
 const visited=new Set([`${u.x},${u.y}`]),pending=starts.map(p=>({p,first:p}));
 while(pending.length){const {p,first}=pending.shift(),key=`${p.x},${p.y}`;if(visited.has(key))continue;visited.add(key);if(distance(p,target)<=moveRange){found=first;break;}for(const n of neighbors(p))if(!occupied.has(`${n.x},${n.y}`)&&!visited.has(`${n.x},${n.y}`))pending.push({p:n,first});}
 if(found){u.x=found.x;u.y=found.y;if(driver&&s.time>=driver.busyUntil)Object.assign(driver,found);event(s,'move',u,null,{x:u.x,y:u.y});}u.moveClock=.35;
}
function resolve(s,a){
 const u=lookup(s,a.source);if(!u||u.dead||s.time<u.stunUntil)return;
 let v=lookup(s,a.target);const retarget=['attack','cast','second-cast'].includes(a.type);if((!v||!alive(v))&&retarget)v=nearest(s,u);if(!v&&!['ace'].includes(a.type))return;if(v&&!alive(v)&&!['ace'].includes(a.type))return;
 if(a.type==='attack')return attack(s,u,v);
 if(a.type==='cast'||a.type==='second-cast')return cast(s,u,v,a.type==='second-cast');
 if(a.type==='kick'){
  if(distance(u,v)>u.range&&u.hero){const dest=neighbors(v).filter(p=>distance(u,p)<=2&&!s.units.some(w=>alive(w)&&w.x===p.x&&w.y===p.y)).sort((a,b)=>distance(u,a)-distance(u,b))[0];if(dest){u.x=dest.x;u.y=dest.y;event(s,'dash',u,v);}else return;}
  hit(s,u,v,stats(u).ad*a.coefficient,'physical',{attack:true,tag:'kick'});return;
 }
 if(a.type==='zero'){let recovered=false;const strike=(w,amount)=>{const dealt=hit(s,u,w,amount*(w.hp/w.maxHp<.4?1+.2*(u.boosterScale??0):1));if(u.boosterScale&&!recovered&&!w.special&&dealt>0&&w.hp<=0){recovered=true;heal(s,u,u.maxHp*.1*u.boosterScale);}};strike(v,a.amount);for(const w of nearby(s,u,v,1).filter(w=>w.id!==v.id).slice(0,2))strike(w,a.amount*.4);event(s,'blades',u,v,{count:2+a.extras});}
 if(a.type==='ace'){for(const w of lineTargets(s,{...u,...a.origin},a.position??v))hit(s,u,w,a.amount,'magic');}
 if(a.type==='sword'){
  const amount=stats(u).ad*pick([2.4,3.6,5.8],u.star)+Math.min(u.maxHp*.25,(u.stance?.absorbed??0)*.35);u.stance=null;
  for(const w of coneTargets(s,u,v))hit(s,u,w,amount);if((u.swordStacks??0)<10){u.swordStacks=(u.swordStacks??0)+1;u.asBonus+=.08;}
 }
}
function deaths(s){
 for(const u of s.units){if(u.dead||u.hp>0)continue;u.dead=true;u.shields=[];u.stance=null;if(u.neutral&&!u.lootDropped){u.lootDropped=true;event(s,'loot-drop',null,u,{loot:structuredClone(u.neutralLoot??[]),x:u.x,y:u.y});}event(s,'death',lookup(s,u.pendingKiller),u);
  creditRivalParticipation(s,u);const killer=lookup(s,u.pendingKiller);augmentDeath(s,u,killer,abilityAPI);
  if(!u.special&&!u.killCredited&&killer){u.killCredited=true;if(!killer.special&&!killer.mirror){killer.permanent.kills++;onAbilityKill(s,killer,u,abilityAPI);
   if(killer.name==='阿斯特拉'&&killer.hero&&u.pendingKillTag==='kick'&&(killer.astraKills??0)<5){killer.astraKills=(killer.astraKills??0)+1;killer.asBonus+=.2;}
   if(killer.hero&&killer.name==='贝利亚'&&killer.belialUntil>s.time){heal(s,killer,killer.maxHp*.08);killer.belialUntil=Math.min(s.time+12,killer.belialUntil+2);buff(s,killer,'belial-form',killer.belialUntil-s.time,{as:pick([.35,.45,.65],killer.star)});}
  }}
  if(!u.special&&u.traits.includes('骑士之誓')&&u.id!==s.traits[u.side].captain){const c=lookup(s,s.traits[u.side].captain);const t=s.traits[u.side].oath;if(c&&alive(c)&&t>=0&&!u.oathDeath){u.oathDeath=true;c.adBonus+=[.06,.09,.12][t];c.ap+=[6,9,12][t];heal(s,c,c.maxHp*.08);}}
  if(u.droneCount){const recipient=s.units.filter(w=>w.side===u.side&&alive(w)&&w.traits.includes('人工智能')).sort((a,b)=>distance(u,a)-distance(u,b)||a.id.localeCompare(b.id))[0];if(recipient){recipient.droneCount+=u.droneCount;if(ownsCombatAugment(recipient,'缓存节点')&&!recipient.cacheTransferred){recipient.cacheTransferred=true;shield(s,recipient,Math.min(450,u.droneCount*15),5,'aug-cache');}u.droneCount=0;if(s.traits[u.side].ai===4)buff(s,recipient,'ai-transfer',6,{as:.3});event(s,'transfer',u,recipient);}}
  const t=s.traits[u.side].unyield;
  if(!u.special&&u.traits.includes('不屈之心')&&t>=0&&!u.revived){u.revived=true;u.reviveAt=s.time+[3,2.5,2][t];event(s,'revive-wait',u,u);}else if(!u.special&&u.fatherRevive&&!u.fatherReviveUsed){u.fatherReviveUsed=true;u.fullRevive=true;u.reviveAt=s.time+.1;event(s,'revive-wait',u,u);}
 }
}
export function step(s){
 if(s.finished)return s;s.tick++;s.time=s.tick*STEP;
 for(const u of s.units){if(alive(u)&&s.time<u.stunUntil&&!(u.immuneUntil>s.time)){const cancelled=s.queue.filter(a=>a.source===u.id&&['zero','ace','sword','kick','second-cast'].includes(a.type));s.queue=s.queue.filter(a=>!cancelled.includes(a));const effects=(u.effects??[]).filter(e=>e.interrupt);u.effects=(u.effects??[]).filter(e=>!e.interrupt);if(cancelled.length||effects.length){u.stance=null;event(s,'interrupt',u,u,{cancelled:cancelled.length+effects.length});}}u.buffs=u.buffs.filter(b=>b.until>s.time);u.shields=u.shields.filter(sh=>sh.until>s.time&&sh.amount>0);if(u.belialUntil&&s.time>=u.belialUntil){u.belialUntil=0;u.omni=u.baseOmni??0;}
  if(u.reviveAt&&s.time>=u.reviveAt){u.reviveAt=0;u.dead=false;u.pendingKiller=null;u.hp=u.fullRevive?u.maxHp:u.maxHp*[.25,.4,.6][s.traits[u.side].unyield];augmentRevive(s,u,abilityAPI);u.fullRevive=false;u.stunUntil=0;u.immuneUntil=s.time+([3,4,6][s.traits[u.side].unyield]??0);u.attackClock=.2;event(s,'revive',u,u);}
 }
 tickRoyalFusion(s,abilityAPI);retrySummons(s,abilityAPI);tickAbilities(s,abilityAPI);tickEquipment(s,abilityAPI);tickSpecials(s,abilityAPI);tickCombatAugments(s,abilityAPI);tickAugmentSpecials(s,abilityAPI);
 const actions=s.queue.filter(a=>a.at<=s.time+1e-8);s.queue=s.queue.filter(a=>a.at>s.time+1e-8);
 for(const u of s.units.filter(alive)){
  if(u.fusing)continue;
  if(u.npcStage>=4&&s.time>=u.npcNext){u.npcNext+=u.npcStage===5?5:6;const v=nearest(s,u);if(v&&s.time>=u.stunUntil){const targets=u.npcStage===5?nearby(s,u,u,1):nearby(s,u,v,0);for(const w of targets)hit(s,u,w,u.npcStage===5?350:u.npcStage===4?200:300,'magic',{noCrit:true});event(s,'cast',u,v);}}
  if(u.npcStage===5&&!u.npcShield&&u.hp<u.maxHp*.5){u.npcShield=true;shield(s,u,800,8,'npc-boss');}
  if(u.immuneUntil>s.time)u.stunUntil=0;
  if(s.time<u.stunUntil)continue;const v=nearest(s,u);if(!v)continue;
  if(s.tick%20===0&&u.traits.includes('神谕')&&s.traits[u.side].oracle>=0){const amount=[3,5,8][s.traits[u.side].oracle];if(ownsCombatAugment(u,'储能回路')&&s.time<u.lockUntil)u.oracleStored=Math.min(20,(u.oracleStored??0)+amount);else mana(s,u,amount);}
  if(s.tick%20===0&&!u.traits.includes('神谕')&&s.traits[u.side].oracle>=0)mana(s,u,[1,2,3][s.traits[u.side].oracle]);
  if(u.bladesUntil>s.time&&u.bladeNext<=s.time){u.bladeNext=s.time+1;const targets=enemyList(s,u).filter(w=>distance(u,w)<=u.range).sort((a,b)=>distance(u,a)-distance(u,b)||a.id.localeCompare(b.id));if(targets.length)for(let i=0;i<3;i++)actions.push({type:'blade-hit',source:u.id,target:targets[i%targets.length].id});}
  u.moveClock-=STEP;u.attackClock-=STEP;
  if(s.time<u.busyUntil||actions.some(a=>a.source===u.id&&a.type==='second-cast'))continue;
  if(u.maxMana&&u.mana>=u.maxMana&&s.time>=u.lockUntil){actions.push({type:'cast',source:u.id,target:v.id});u.busyUntil=s.time+.3;continue;}
  if(distance(u,v)>(u.robot?Math.min(u.range,s.units.find(w=>w.id===u.driver&&alive(w))?.range??u.range):u.range)){if(u.moveClock<=0&&!s.units.some(w=>w.id===u.robotId&&alive(w)))move(s,u,v);continue;}
  if(u.attackClock<=0){actions.push({type:'attack',source:u.id,target:v.id});u.attackClock=1/(stats(u).as*(s.time>=30?2:1));}
 }
 for(const a of actions){if(a.type==='blade-hit'){const u=lookup(s,a.source),v=lookup(s,a.target);if(u&&alive(u))hit(s,u,v,stats(u).ad*pick([.5,.75,1.2],u.star));}else resolve(s,a);}
 deaths(s);
 for(const side of [0,1]){const tr=s.traits[side];if(tr.police<1||tr.beam)continue;const team=s.units.filter(u=>u.side===side&&u.traits.includes('银河警备队'));if(team.reduce((n,u)=>n+Math.max(0,u.hp),0)<tr.startingHp*.5){tr.beam=true;const source=team.find(alive);if(source){const S=team.reduce((n,u)=>n+u.star,0),i=tr.police-1;for(const v of s.units.filter(v=>v.side!==side&&alive(v)))hit(s,source,v,[100,150,200,500][i]+[25,35,45,100][i]*S,'magic',{noCrit:true});for(const u of team.filter(alive))buff(s,u,'police-beam',[6,7,8,60][i],{as:[.35,.5,.7,1.2][i]});event(s,'beam',source,null);}}}
 deaths(s);
 endFrameAugments(s,abilityAPI);
 const live=[0,1].map(side=>s.units.some(u=>u.side===side&&(alive(u)||u.reviveAt>s.time)));
 if(!live[0]||!live[1]||s.time>=45){s.finished=true;s.winner=live[0]&&!live[1]?0:live[1]&&!live[0]?1:null;event(s,'end',null,null,{winner:s.winner});}
 return s;
}
export function runBattle(s){while(!s.finished)step(s);return s;}
export function summary(s){return {seed:s.seed,time:Number(s.time.toFixed(2)),winner:s.winner,events:s.events.length,units:s.units.map(u=>({id:u.id,name:u.name,side:u.side,hp:Number(u.hp.toFixed(2)),damage:Math.round(u.damageDone),permanent:{...u.permanent},revived:u.revived})),eventLog:s.events};}

const point=p=>({x:p.x+.5*(p.y&1),y:p.y*Math.sqrt(3)/2});
export function lineTargets(s,u,target){const p=point(u),q=point(target),dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy)||1;return enemyList(s,u).filter(w=>{const r=point(w),x=r.x-p.x,y=r.y-p.y;return (x*dx+y*dy)/len>=-.01&&Math.abs(x*dy-y*dx)/len<=.48;}).sort((a,b)=>distance(u,a)-distance(u,b)||a.id.localeCompare(b.id));}
export function coneTargets(s,u,target){const p=point(u),q=point(target),dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy)||1;return enemyList(s,u).filter(w=>{const r=point(w),x=r.x-p.x,y=r.y-p.y,d=Math.hypot(x,y);return distance(u,w)<=2&&(x*dx+y*dy)/(len*(d||1))>=.65;});}
const abilityAPI={makeUnit,stats,hit,buff,shield,heal,mana,event,lookup,nearest,distance,neighbors,tier,lineTargets,coneTargets};
