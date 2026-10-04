import {luckyPools,unitRole} from './augment-specials.mjs';
import {components,items} from './equipment-data.mjs';
export {components,items};
const live=u=>!u.dead&&u.hp>0;
const copies=(u,name)=>(u.combatItems??[]).filter(item=>item===name).length;
const owns=(u,name)=>copies(u,name)>0;
const allies=(s,u)=>s.units.filter(w=>w.side===u.side&&live(w));
const enemies=(s,u)=>s.units.filter(w=>w.side!==u.side&&live(w));
export function recipe(a,b){const ca=components.find(c=>c[1]===a),cb=components.find(c=>c[1]===b);const badges=['光徽','暗徽','光之徽章','暗之徽章'],ba=badges.includes(a),bb=badges.includes(b);if(ba&&bb)return '统帅冠冕';if(ba&&cb||bb&&ca){const badge=ba?a:b,code=(ba?cb:ca)[0],idx=components.findIndex(c=>c[0]===code),light=['银河警备队','金属狂潮','古利特','人工智能','宇宙骑士队','银河帝国','空想乐团','科学家'],dark=['战士','神枪手','法师','神谕','护卫','重装战士','格斗家','刺客'];return ((badge==='光徽'||badge==='光之徽章')?light:dark)[idx]+'纹章';}if(!ca||!cb)return null;const pair=[ca[0],cb[0]].sort().join('');return items.find(i=>i[1].replaceAll('+','').split('').sort().join('')===pair)?.[0]??null;}
export const emblemTraits=['银河警备队','金属狂潮','古利特','人工智能','宇宙骑士队','银河帝国','空想乐团','科学家','战士','神枪手','法师','神谕','护卫','重装战士','格斗家','刺客','召唤师','狂战士','主宰','正义使者','不屈之心','骑士之誓','导师'];
export function equipmentName(name){return emblemTraits.some(t=>name===t+'纹章')|| components.some(c=>c[1]===name)||items.some(i=>i[0]===name);}
function addAttributes(u,text){const match=(word)=>{const m=text.match(new RegExp(`${word}\\+(\\d+(?:\\.\\d+)?)`));return m?Number(m[1]):0;};
 u.adBonus+=match('攻击力')/100;u.asBonus+=match('攻速')/100;u.ap+=match('法强');u.maxHp+=match('生命');u.armor+=match('护甲');u.mr+=match('魔抗');u.mana+=match('初始法力');u.extraCrit=(u.extraCrit??0)+match('暴击率')/100;
}
function burn(s,u,v,a,seconds){if(!live(v))return;v.itemBurns??=[];if(!v.itemBurns.some(b=>b.until>=s.time))v.itemBurnNext=s.time+1;const key=u.id;let b=v.itemBurns.find(b=>b.source===key);if(!b){b={source:key,next:s.time+1};v.itemBurns.push(b);}b.until=s.time+seconds;v.woundUntil=Math.max(v.woundUntil??0,b.until);}
function titan(s,u,a){if(!owns(u,'泰坦战甲')||(u.titanStacks??0)>=25)return;u.titanStacks=(u.titanStacks??0)+1;const count=copies(u,'泰坦战甲');u.adBonus+=.02*count;u.ap+=2*count;if(u.titanStacks===25){u.armor+=20*count;u.mr+=20*count;}a.event(s,'item-stack',u,u,{item:'泰坦战甲',stacks:u.titanStacks});}
export function initEquipment(s,a){for(const u of s.units){
 u.combatItems=[...(u.items??[])];if(u.special&&!u.mirror){u.combatItems=[];continue;}
 if(owns(u,'奇袭手套')){const lucky=(u.matchEffects?.augments??[]).some(n=>['幸运手套','双份幸运'].includes(n));const candidates=lucky?[...luckyPools[unitRole(u.name)]]:items.filter(i=>i[0]!=='奇袭手套').map(i=>i[0]);for(let i=0;i<2;i++){const index=Math.floor(s.random()*candidates.length);u.combatItems.push(candidates.splice(index,1)[0]);}}
 for(const name of u.combatItems){const def=components.find(c=>c[1]===name)??items.find(i=>i[0]===name);if(def)addAttributes(u,def[3]);}
 const has=n=>owns(u,n),count=n=>u.combatItems.filter(x=>x===n).length;
 u.amp+=count('破星刃')*.08+count('巨兽猎刃')*.1+count('赤焰弩')*.06+count('光辉冠')*.15+count('破防护手')*.1;
 u.omni+=count('光能枪刃')*.2+count('噬光剑')*.2;
 const critItems=count('无尽战刃')+count('星辉护手');if(u.augments?.includes('珠光莲花')&&s.traits[u.side].justice<0&&critItems>0)u.extraCritDamage=(u.extraCritDamage??0)+.1;u.skillCrit=critItems>0||Boolean(u.augmentSkillCrit);u.extraCritDamage=(u.extraCritDamage??0)+Math.max(0,critItems-(s.traits[u.side].justice>=0||u.augmentSkillCrit?0:1))*.1;
 if(has('蓝晶符')&&u.maxMana)u.maxMana=Math.max(10,u.maxMana-10*count('蓝晶符'));
 for(let i=0;i<count('均衡护手');i++){const offensive=s.random()<.5;u.adBonus+=offensive?.3:.15;u.ap+=offensive?30:15;u.omni+=offensive?.15:.3;}
 if(has('生命铠'))u.maxHp*=1.12**count('生命铠');
 if(has('水银护符'))u.immuneUntil=18;
 if(has('应变头盔')){const front=u.side===0?u.y<=5:u.y>=2;if(front){u.armor+=35*count('应变头盔');u.mr+=35*count('应变头盔');}else{u.ap+=20*count('应变头盔');u.helmetBack=true;}}
 u.hp=u.maxHp;u.mana=Math.min(u.maxMana,u.mana);u.nextItemTick=1;
 if(has('王冠战甲')){a.shield(s,u,u.maxHp*.3*count('王冠战甲'),8,'crown');u.crownActive=true;}
 if(has('守誓战甲'))u.oathItemReady=true;
 if(has('泰坦战甲'))u.titanStacks=0;
 if(has('龙鳞披风'))u.dragonNext=2;
 if(has('救赎坠饰'))u.redemptionNext=5;
 if(has('大天使杖'))u.archangelNext=5;
 if(has('炎阳战甲'))u.sunfireNext=2;
 }}
export function attackEquipment(s,u,v,a){
 if(owns(u,'狂怒刃'))u.asBonus+=.05*u.combatItems.filter(n=>n==='狂怒刃').length;
 titan(s,u,a);if(owns(u,'战意长枪'))a.mana(s,u,5*u.combatItems.filter(n=>n==='战意长枪').length);
 if(owns(u,'分裂光弩')){const other=enemies(s,u).filter(w=>w!==v&&a.distance(u,w)<=u.range).sort((x,y)=>a.distance(u,x)-a.distance(u,y))[0];if(other)a.hit(s,u,other,a.stats(u).ad*.7*copies(u,'分裂光弩'),'physical',{attack:true,item:true});}
 if(owns(u,'雷光弩')&&u.attacks%3===0)for(const w of [v,...enemies(s,u).filter(w=>w!==v).sort((x,y)=>a.distance(v,x)-a.distance(v,y))].slice(0,4)){a.hit(s,u,w,30*copies(u,'雷光弩'),'magic',{noCrit:true,item:true});a.buff(s,w,`shiv-${u.id}`,5,{mrPct:.3});}
}
export function castEquipment(s,u,a,fullCast=true){
 if(owns(u,'纳什护腕'))a.buff(s,u,'nashor',5,{as:.4*copies(u,'纳什护腕')});
 if(owns(u,'蓝晶符'))u.pendingItemMana=(u.pendingItemMana??0)+5*copies(u,'蓝晶符');
 const ion=enemies(s,u).filter(w=>owns(w,'离子火花')&&a.distance(w,u)<=2);for(const w of ion)a.hit(s,w,u,u.maxMana*1.6*copies(w,'离子火花'),'magic',{noCrit:true,item:true});
}
export function hitEquipment(s,u,v,amount,kind,opts,a,shieldBefore){
 if(amount<=0)return;
 if(!opts.item){
  if(owns(u,'赤焰弩')||owns(u,'焚星卷轴')&&!opts.attack)burn(s,u,v,a,5);
  if(owns(u,'破甲光弩')&&kind==='physical')a.buff(s,v,`lastwhisper-${u.id}`,5,{armorPct:.3});
  if(owns(u,'破防护手')&&shieldBefore>0)a.buff(s,u,'guardbreaker',3,{amp:.15*copies(u,'破防护手')});
  if(owns(u,'光能枪刃')){const w=allies(s,u).filter(w=>w!==u).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];if(w)a.heal(s,w,amount*.2*copies(u,'光能枪刃'));}
 }
 if(owns(v,'泰坦战甲')&&(v.titanReceived??-1)<=s.time){v.titanReceived=s.time+1;titan(s,v,a);}
 if(opts.attack&&!opts.item&&owns(v,'荆棘甲')&&(v.brambleNext??0)<=s.time){v.brambleNext=s.time+2;for(const w of enemies(s,v).filter(w=>a.distance(v,w)<=1))a.hit(s,v,w,100*copies(v,'荆棘甲'),'magic',{noCrit:true,item:true});}
}
export function damageEquipment(s,u,v,n,kind,opts,a){
 let value=n;if(owns(u,'巨兽猎刃')&&v.maxHp>=1600)value*=(1+a.stats(u).amp+.15*copies(u,'巨兽猎刃'))/(1+a.stats(u).amp);
 if(owns(v,'坚心甲'))value*=(v.hp/v.maxHp>.5?.85:.92)**copies(v,'坚心甲');
 if(owns(v,'夜幕战衣')&&v.untargetableUntil>s.time)return 0;
 if(v.redemptionUntil>s.time&&opts.area)value*=.9;
 return value;
}
export function tickEquipment(s,a){for(const u of s.units){
 if(live(u)){
  if(u.pendingItemMana&&s.time>=u.lockUntil){a.mana(s,u,u.pendingItemMana);u.pendingItemMana=0;}
  const has=n=>owns(u,n);
  if(has('夜幕战衣')&&!u.edgeTriggered&&u.hp/u.maxHp<.6){u.edgeTriggered=true;u.stunUntil=0;u.untargetableUntil=s.time+1;u.asBonus+=.15*copies(u,'夜幕战衣');}
  if(has('噬光剑')&&!u.btTriggered&&u.hp/u.maxHp<.4){u.btTriggered=true;a.shield(s,u,u.maxHp*.25*copies(u,'噬光剑'),5,'bloodthirster');}
  if(has('斗魂臂铠')&&!u.sterakTriggered&&u.hp/u.maxHp<.6){u.sterakTriggered=true;a.shield(s,u,u.maxHp*.25*copies(u,'斗魂臂铠'),5,'sterak');u.adBonus+=.2*copies(u,'斗魂臂铠');}
  if(has('守誓战甲')&&u.oathItemReady&&u.hp/u.maxHp<.4){u.oathItemReady=false;a.shield(s,u,u.maxHp*.25*copies(u,'守誓战甲'),5,'protector');u.armor+=20*copies(u,'守誓战甲');u.mr+=20*copies(u,'守誓战甲');}
  if(u.crownActive&&!u.shields.some(sh=>sh.key==='crown'&&sh.amount>0)){u.crownActive=false;u.ap+=25*copies(u,'王冠战甲');}
  if(u.dragonNext<=s.time){u.dragonNext+=2;a.heal(s,u,u.maxHp*.04*copies(u,'龙鳞披风'));}
  if(u.archangelNext<=s.time){u.archangelNext+=5;u.ap+=30*copies(u,'大天使杖');}
  if(u.redemptionNext<=s.time){u.redemptionNext+=5;for(const w of allies(s,u).filter(w=>a.distance(u,w)<=1)){for(let i=0;i<copies(u,'救赎坠饰');i++)a.heal(s,w,(w.maxHp-w.hp)*.15);w.redemptionUntil=s.time+5;}}
  if(u.sunfireNext<=s.time){u.sunfireNext+=2;for(let i=0;i<copies(u,'炎阳战甲');i++){const w=enemies(s,u).filter(w=>a.distance(u,w)<=2&&!w.itemBurns?.some(b=>b.source===u.id&&b.until>s.time)).sort((x,y)=>a.distance(u,x)-a.distance(u,y))[0];if(w)burn(s,u,w,a,10);}}
  if(s.tick%60===0&&u.helmetBack)a.mana(s,u,10*copies(u,'应变头盔'));
 }
 u.itemBurns=(u.itemBurns??[]).filter(b=>b.until>=s.time-1e-8);if(live(u)&&u.itemBurns.length&&(u.itemBurnNext??0)<=s.time){u.itemBurnNext=s.time+1;const source=a.lookup(s,u.itemBurns[0].source);if(source)a.hit(s,source,u,u.maxHp*.01,'true',{noCrit:true,item:true,fixedDamage:true});}
 u.buffs=u.buffs.filter(b=>!b.itemAura);if(!live(u))continue;
 const armorShred=enemies(s,u).some(w=>owns(w,'震荡披风')&&a.distance(u,w)<=2),mrShred=enemies(s,u).some(w=>owns(w,'离子火花')&&a.distance(u,w)<=2);
 if(armorShred||mrShred)u.buffs.push({key:'item-shred-aura',until:s.time+.1,armorPct:armorShred?.3:0,mrPct:mrShred?.3:0,itemAura:true});
 if(owns(u,'震荡披风')&&s.time<10)u.buffs.push({key:'evenshroud',until:s.time+.1,armor:20*copies(u,'震荡披风'),mr:20*copies(u,'震荡披风'),itemAura:true});
 if(owns(u,'磐石甲')){const targeting=enemies(s,u).filter(w=>a.nearest(s,w)?.id===u.id).length;u.buffs.push({key:'gargoyle',until:s.time+.1,armor:10*targeting*copies(u,'磐石甲'),mr:10*targeting*copies(u,'磐石甲'),itemAura:true});}
 }}
