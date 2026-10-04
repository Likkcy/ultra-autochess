import {legalTraits} from './augment-data.mjs';
// Combat augment handlers. Explicit hooks keep effects out of rendering.
import {items} from './equipment-data.mjs';
const real=u=>!u.special&&!u.mirror,live=u=>!u.dead&&u.hp>0;
const permanent=n=>items.some(i=>i[0]===n)||n.endsWith('纹章');
const camps=['银河警备队','人工智能','古利特','金属狂潮','宇宙骑士队','银河帝国','空想乐团'];
export const combatNames=['小型战备','轻装步兵','羽量级选手','并肩作战Ⅰ','急救包Ⅰ','复苏之风Ⅰ','战斗绷带','前线坚韧','后排专注','临时护甲','致命节奏Ⅰ','精密打击','战斗法师Ⅰ','孤立防线','优势压制','一费齐心','并肩作战Ⅱ','急救包Ⅱ','复苏之风Ⅱ','致命节奏Ⅱ','战斗法师Ⅱ','珠光莲花','源计划植入','源计划甲壳','源计划供能','小小伙伴','飞升','猛兽之巢','站定射击','守护阵线','爆破专家','飞升终章','棱彩莲花','终极战备','黄金护盾','以少胜多','百战老兵','绝境屏障','好事成双','卓尔不群','电火花','战地补给','双核协作','至尊双核','装备升级计划','纹章保养','阵营携手','职业共鸣','小队集结','核心阵容','并肩骑士','稳固重装','凝神射击','法术之刃','时间尽头','紧急集结','缓存节点','储能回路','致命追猎','血怒','战线推进','裁决印记','山岳之躯','堡垒阵列','破盾冲锋','疾速校准'];
const has=(u,n)=>real(u)&&(u.augments??[]).includes(n);
function add(u,v){for(const [k,n] of Object.entries(v))u[k]=(u[k]??0)+n;}
export function initCombatAugments(s,a){for(const side of [0,1]){const team=s.units.filter(u=>u.side===side&&real(u)),config=team[0]?.matchEffects??{},names=config.augments??[],counts=s.traits[side].counts,active=legalTraits.filter(t=>a.tier(counts,t)>=0),near=u=>team.filter(w=>w!==u&&a.distance(u,w)<=1),low=new Set(team.filter(u=>u.cost<=2).map(u=>u.name)).size,one=new Set(team.filter(u=>u.cost===1).map(u=>u.name)).size;
 s.traits[side].augmentHp=0;for(const u of team){u.augments=[...names];u.augmentPosition={x:u.x,y:u.y};u.stationaryAt=0;u.openedRear=side===0?u.y>=6:u.y<=1;u.augmentTargets=[...(config.augmentTargets??[])];const front=side===0?u.y<=5:u.y>=2,gear=u.items.length,completed=u.items.filter(permanent).length;u.augShieldPower??=0;u.augHealPower??=0;
 for(const n of names)switch(n){
 case '小型战备':add(u,{maxHp:80,adBonus:.05,ap:5});break;case '终极战备':add(u,{maxHp:250,adBonus:.15,ap:15,asBonus:.15});break;
 case '轻装步兵':if(!gear)add(u,{asBonus:.25,armor:20,mr:20});break;case '羽量级选手':if(u.cost<=2)u.asBonus+=.2;break;
 case '并肩作战Ⅰ':case '并肩作战Ⅱ':{const k=n.endsWith('Ⅰ')?2:3,c=Math.min(n.endsWith('Ⅰ')?6:8,active.length);add(u,{adBonus:c*k/100,ap:c*k});break;}
 case '急救包Ⅰ':case '急救包Ⅱ':{const gold=n.endsWith('Ⅱ');u.omni+=gold?.15:.08;u.augHealPower+=gold?.2:.1;u.augShieldPower+=gold?.2:.1;break;}
 case '前线坚韧':if(front)u.maxHp+=150;break;case '后排专注':if(!front)u.ap+=15;break;case '临时护甲':if(!completed)add(u,{armor:25,mr:25});break;
 case '致命节奏Ⅰ':u.asBonus+=.12;break;case '致命节奏Ⅱ':u.asBonus+=.22;break;case '精密打击':u.extraCrit=(u.extraCrit??0)+.15;break;
 case '战斗法师Ⅰ':case '战斗法师Ⅱ':if(front){const k=n.endsWith('Ⅰ')?15:25;add(u,{ap:k,armor:k,mr:k});}break;
 case '珠光莲花':u.augmentSkillCrit=true;u.extraCrit=(u.extraCrit??0)+.2;if(u.skillCrit||s.traits[side].justice>=0)u.extraCritDamage=(u.extraCritDamage??0)+.1;break;
 case '棱彩莲花':u.augmentSkillCrit=true;u.extraCrit=(u.extraCrit??0)+.35;u.extraCritDamage=(u.extraCritDamage??0)+.2;break;
 case '源计划植入':if(gear)add(u,{maxHp:200,adBonus:.15});break;case '源计划甲壳':if(gear)add(u,{maxHp:200,armor:25,mr:25});break;case '源计划供能':if(gear)u.maxHp+=150;break;
 case '一费齐心':u.maxHp*=1+.02*Math.min(5,one);u.amp+=.015*Math.min(5,one);break;
 case '小小伙伴':if(u.cost>=4){u.maxHp+=100*Math.min(4,low);u.asBonus+=.07*Math.min(4,low);}break;
 case '猛兽之巢':if(front){u.amp+=.1;u.beastFront=true;}break;
 case '守护阵线':if(front)add(u,{armor:25,mr:25});else u.amp+=.1;break;
 case '以少胜多':if(team.length<(config.population??team.length)){u.maxHp*=1.35;u.asBonus+=.45;}break;
 case '百战老兵':if(u.star>=2){u.amp+=.25;u.dr=1-(1-u.dr)*.85;}break;
 case '好事成双':if(team.filter(w=>w.name===u.name).length===2)add(u,{adBonus:.25,ap:25,armor:25,mr:25});break;
 case '卓尔不群':if(!u.traits.some(t=>active.includes(t))&&!['杰顿','加坦杰厄','奥特之父','新条茜','银河','托雷基亚','泰罗','艾斯杀手','镜子骑士','詹奈'].includes(u.name)){u.maxHp+=300;u.asBonus+=.45;}break;
 case '至尊双核':if(u.augmentTargets.includes(u.instanceId))add(u,{maxHp:400,adBonus:.25,ap:25,omni:.15});break;
 case '装备升级计划':u.amp+=.06*Math.min(u.name==='新条茜'?4:3,u.items.filter(n=>items.some(i=>i[0]===n)).length);break;
 case '纹章保养':if(u.items.some(n=>n.endsWith('纹章')))u.maxHp+=120;break;
 case '阵营携手':if(active.filter(t=>camps.includes(t)).length>=2)add(u,{armor:12,mr:12});break;
 case '职业共鸣':if(active.filter(t=>!camps.includes(t)).length>=3)add(u,{adBonus:.1,ap:10});break;
 case '小队集结':u.maxHp+=35*Math.min(6,active.filter(t=>a.tier(counts,t)===0).length);break;
 case '核心阵容':{const core=active.slice().sort((x,y)=>team.filter(w=>w.traits.includes(y)&&!w.items.includes(y+'纹章')).length-team.filter(w=>w.traits.includes(x)&&!w.items.includes(x+'纹章')).length)[0];if(u.traits.includes(core))u.maxHp+=150;break;}
 case '缓存节点':if(u.traits.includes('人工智能')&&s.traits[side].ai>=0)u.droneCount+=3;break;
 case '堡垒阵列':if(u.traits.includes('护卫')&&a.tier(counts,'护卫')>=0&&near(u).some(w=>w.traits.includes('护卫')))add(u,{armor:35,mr:35});break;
 }
 u.hp=u.maxHp;}

 }}
export function tickCombatAugments(s,a){for(const u of s.units.filter(real)){if(u.endTimeOmniUntil&&s.time>=u.endTimeOmniUntil){u.omni-=.15;u.endTimeOmniUntil=0;}if(!live(u))continue;const hasN=n=>has(u,n),team=s.units.filter(w=>w.side===u.side&&real(w)),config=u.matchEffects??{};
 if(u.augmentPosition?.x!==u.x||u.augmentPosition?.y!==u.y){u.augmentPosition={x:u.x,y:u.y};u.stationaryAt=s.time;}
 if(hasN('双核协作')&&u.augmentTargets?.includes(u.instanceId)){const pair=team.filter(w=>u.augmentTargets.includes(w.instanceId));if(pair.length===2&&pair.every(live))a.buff(s,u,'aug-dual',.1,{as:.2});}
 if(s.tick%20===0&&hasN('源计划供能')&&u.items.length)a.mana(s,u,2);
 if(hasN('储能回路')&&u.oracleStored&&s.time>=u.lockUntil){a.mana(s,u,u.oracleStored);u.oracleStored=0;}
 if(hasN('战斗绷带')&&!u.bandageTriggered&&u.hp<u.maxHp*.5){u.bandageTriggered=true;u.bandageUntil=s.time+5;u.bandageNext=s.time+1;}
 if(u.bandageNext<=s.time+1e-8&&u.bandageNext<=u.bandageUntil+1e-8){a.heal(s,u,40);u.bandageNext++;}
 if(u.beastFront&&!u.beastTriggered&&u.hp<u.maxHp*.5){u.beastTriggered=true;u.asBonus+=.25;}
 for(const [n,t,pct] of [['复苏之风Ⅰ',10,.35],['复苏之风Ⅱ',10,.6]])if(hasN(n)&&s.time>=t&&!u[n]){u[n]=true;a.heal(s,u,(u.maxHp-u.hp)*pct);}
 for(const [n,t,pct] of [['飞升',15,.4],['飞升终章',12,.65]])if(hasN(n)&&s.time>=t&&!u[n]){u[n]=true;u.amp+=pct;}
 if(hasN('站定射击')&&u.openedRear&&s.time-(u.stationaryAt??0)>=2&&(u.stationaryStacks??0)<6){u.stationaryStacks=(u.stationaryStacks??0)+1;u.adBonus+=.05;u.stationaryAt=s.time;}
 if(hasN('血怒')&&u.traits.includes('狂战士')&&a.tier(s.traits[u.side].counts,'狂战士')>=0)a.buff(s,u,'aug-rage',.1,{as:Math.min(.4,(1-u.hp/u.maxHp)*.5)});
 if(hasN('山岳之躯')&&u.traits.includes('主宰')&&a.tier(s.traits[u.side].counts,'主宰')>=0&&s.time-(u.stationaryAt??0)>=3&&s.time>=(u.mountainNext??0)){u.mountainNext=s.time+6;a.shield(s,u,u.maxHp*.1,4,'aug-mountain');}
 if(hasN('黄金护盾'))a.buff(s,u,'aug-gold-amp',.1,{amp:u.shields.some(sh=>sh.key==='aug-gold'&&sh.amount>0)?.1:0});
 if(hasN('破盾冲锋')&&!u.heavyBurst&&s.traits[u.side].counts['重装战士']>=2&&!u.shields.some(sh=>sh.key==='heavy')){u.heavyBurst=true;a.buff(s,u,'aug-heavy-burst',6,{ad:.25,ap:25,as:.25});}
 const cap=[10,12,15][s.traits[u.side].sharp]+(hasN('疾速校准')?5:0);if(u.traits.includes('神枪手')&&u.sharpStacks>=cap&&hasN('凝神射击')&&!u.calibrated){u.calibrated=true;u.amp+=.08;}
 }}
export function augmentDamage(s,u,v,n,opts,a){let k=n;if(!opts.attack&&!opts.item&&!opts.augment)k*=1+(u.pilotSkillAmp??0);if(has(u,'优势压制')&&v.maxHp>u.maxHp)k*=1.1;if(v.buffs.some(b=>b.key==='aug-judgment'))k*=1.12;return k;}
export function augmentHit(s,u,v,amount,opts,crit,a){if(opts.augment||opts.item)return;if(has(u,'爆破专家')&&!opts.attack){u.augmentHitTargets??=[];if(!u.augmentHitTargets.includes(v.id)){u.augmentHitTargets.push(v.id);a.buff(s,v,'aug-explosive-'+u.id,5,{armor:-15,mr:-15});}}
 if(has(u,'裁决印记')&&u.traits.includes('正义使者')&&s.traits[u.side].justice>=0&&crit&&!opts.attack)a.buff(s,v,'aug-judgment',4,{});
 if(has(v,'电火花')&&opts.attack&&crit&&s.time>=(v.sparkNext??0)){v.sparkNext=s.time+1;a.hit(s,v,u,80,'magic',{noCrit:true,item:true,augment:true,fixedDamage:true});}
}
export function augmentAttack(s,u,v,a){if(has(u,'法术之刃')&&u.bladeMarks){a.hit(s,u,v,a.stats(u).ap*.6*u.bladeMarks,'magic',{augment:true,noCrit:true});u.bladeMarks=0;}}
export function augmentCast(s,u,v,a){if(has(u,'法术之刃')&&u.traits.includes('法师')&&s.traits[u.side].mage>=0)u.bladeMarks=Math.min(2,(u.bladeMarks??0)+1);}
export function augmentDeath(s,u,killer,a){if(!real(u))return;const team=s.units.filter(w=>w.side===u.side&&real(w)&&live(w));if(has(u,'战地补给')&&!u.augSupply){u.augSupply=true;for(const w of team.sort((x,y)=>a.distance(u,x)-a.distance(u,y)).slice(0,2))a.heal(s,w,(w.maxHp-w.hp)*.15);}
 if(has(u,'双核协作')&&u.augmentTargets.includes(u.instanceId)&&!u.augDualDeath){u.augDualDeath=true;const partner=team.find(w=>w!==u&&u.augmentTargets.includes(w.instanceId));if(partner)a.buff(s,partner,'aug-dual-survivor',6,{amp:.25});}
 if(killer&&real(killer)&&!u.augKillCredited){u.augKillCredited=true;if(has(killer,'血怒')&&killer.traits.includes('狂战士')&&a.tier(s.traits[killer.side].counts,'狂战士')>=0&&!killer.augBlood){killer.augBlood=true;a.shield(s,killer,killer.maxHp*.15,5,'aug-blood');}if(has(killer,'致命追猎')&&killer.traits.includes('刺客')&&a.tier(s.traits[killer.side].counts,'刺客')>=0){if(!killer.augChase){killer.augChase=true;const enemy=s.units.filter(w=>w.side!==killer.side&&live(w)&&a.distance(killer,w)<=2).sort((x,y)=>a.distance(killer,x)-a.distance(killer,y))[0];if(enemy){const pos=a.neighbors(enemy).find(p=>!s.units.some(w=>live(w)&&w.x===p.x&&w.y===p.y));if(pos)Object.assign(killer,pos);}}a.buff(s,killer,'aug-chase',6,{amp:.12});}}}
export function augmentRevive(s,u,a){if(has(u,'时间尽头')&&u.revived&&!u.fullRevive&&!u.augEndTime){u.augEndTime=true;a.buff(s,u,'aug-end-time',6,{as:.4,amp:.2});u.omni+=.15;u.endTimeOmniUntil=s.time+6;}}
export const ownsCombatAugment=has;

export function finalizeAugmentShields(s,a){for(const side of [0,1]){const team=s.units.filter(u=>u.side===side&&real(u)),near=u=>team.filter(w=>w!==u&&a.distance(u,w)<=1);s.traits[side].augmentHp=0; for(const u of team){if(has(u,'黄金护盾'))a.shield(s,u,u.maxHp*.35,10,'aug-gold');if(has(u,'孤立防线')&&!near(u).length)a.shield(s,u,u.maxHp*.18,8,'aug-isolated');if(has(u,'并肩骑士')&&s.traits[side].oath>=0&&u.traits.includes('骑士之誓')){const captain=team.find(w=>w.id===s.traits[side].captain);if(captain&&(u===captain||a.distance(u,captain)<=1))a.shield(s,u,u.maxHp*.15,6,'aug-knight');}s.traits[side].augmentHp+=u.maxHp;}}}

export function endFrameAugments(s,a){for(const u of s.units.filter(real)){if(!live(u))continue;const hasN=n=>has(u,n),team=s.units.filter(w=>w.side===u.side&&real(w));
 if(hasN('绝境屏障')&&!s.traits[u.side].augmentCrisis&&team.reduce((n,w)=>n+Math.max(0,w.hp),0)<s.traits[u.side].augmentHp*.4){s.traits[u.side].augmentCrisis=true;for(const w of team.filter(live)){a.shield(s,w,w.maxHp*.3,5,'aug-crisis');w.stunUntil=0;w.immuneUntil=Math.max(w.immuneUntil??0,s.time+2);}}
 if(hasN('紧急集结')&&!s.traits[u.side].augmentPolice&&s.traits[u.side].counts['银河警备队']>=3){const police=team.filter(w=>w.traits.includes('银河警备队'));if(s.traits[u.side].beam||s.traits[u.side].police===0&&police.reduce((n,w)=>n+Math.max(0,w.hp),0)<s.traits[u.side].startingHp*.5){s.traits[u.side].augmentPolice=true;for(const w of police.filter(live))a.shield(s,w,w.maxHp*.2,6,'aug-police');}}
}}
