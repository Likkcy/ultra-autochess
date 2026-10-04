// Frozen cross-round rewards and their combat effects. No browser dependencies.
export const inventions=[
 {name:'应急护盾发生器',group:'shield',advanced:false,at:0},
 {name:'医疗脉冲仪',group:'heal',advanced:false,at:8},
 {name:'能源补给器',group:'mana',advanced:false,at:6},
 {name:'强化护盾发生器',group:'shield',advanced:true,at:0},
 {name:'时滞震荡器',group:'stun',advanced:true,at:8},
 {name:'复合修复装置',group:'heal',advanced:true,at:8},
 {name:'超载供能器',group:'mana',advanced:true,at:6},
];
export const empireUpgrades=[
 {name:'帝国武备',price:6,adPercent:.03}, {name:'帝国能源',price:6,ap:3},
 {name:'作战加速',price:8,as:.05}, {name:'装甲扩充',price:8,hp:60},
 {name:'复合防御',price:8,armor:3,mr:3},
];
export const boosters={'赛罗':'等离子增幅器','红莲火焰':'烈焰循环器','镜子骑士':'镜面折射器','詹伯特':'战斧加速器'};
export const boosterInfo={
 赛罗:['技能命中生命低于40%的敌人时，伤害提高20%；每次施法首次击败敌人，回复最大生命10%。','伤害提高30%，回复最大生命15%。'],
 红莲火焰:['每次普攻获得2%攻速，最多15层（30%）；每第三次普攻回复最大生命2%。','每层3%攻速，最多45%；每第三次普攻回复最大生命3%。'],
 镜子骑士:['一、二星技能护盾提高20%，反击追加护盾吸收量的20个百分点；三星只强化自身护盾。','护盾提高30%，一、二星反击追加30个百分点；三星只强化自身护盾。'],
 詹伯特:['技能路径上的次要目标承受主目标伤害的75%；命中敌人护甲降低15%，持续4秒。','次要目标承受87.5%；护甲降低22.5%，持续4秒。']
};
export const boosterDescription=(name,count=2)=>boosterInfo[name]?.[count>=4?1:0]??'';
export function initSpecials(s,a){
 s.inventionTimers=[];
 for(const side of [0,1]){const team=s.units.filter(u=>u.side===side&&!u.special),config=team[0]?.matchEffects??{};
  for(const u of team){if(u.traits.includes('银河帝国'))for(const d of empireUpgrades){const n=config.empireUpgrades?.[d.name]??0;u.maxHp+=(d.hp??0)*n;u.adBonus+=(d.adPercent??0)*n;u.asBonus+=(d.as??0)*n;u.ap+=(d.ap??0)*n;u.armor+=(d.armor??0)*n;u.mr+=(d.mr??0)*n;u.hp=u.maxHp;}
   const count=s.traits[side].counts['宇宙骑士队']??0;if(count>=2&&u.booster&&boosters[u.name]===u.booster)u.boosterScale=count>=4?1.5:1;
  }
  if((s.traits[side].counts['科学家']??0)>=2)for(const name of config.activeInventions??[]){const d=inventions.find(d=>d.name===name);if(d)s.inventionTimers.push({side,...d,done:false});}
 }
}
export function tickSpecials(s,a){for(const d of s.inventionTimers??[]){if(d.done||s.time+1e-8<d.at)continue;d.done=true;const friends=s.units.filter(u=>u.side===d.side&&!u.dead&&u.hp>0),foes=s.units.filter(u=>u.side!==d.side&&!u.dead&&u.hp>0);for(const u of d.group==='stun'?foes:friends){
  if(d.group==='shield')a.shield(s,u,d.advanced?u.maxHp*.15:150,8,`invention-${d.name}`);
  if(d.group==='heal'){a.heal(s,u,u.maxHp*(d.advanced?.15:.1));if(d.advanced)a.shield(s,u,150,4,`invention-${d.name}`);}
  if(d.group==='mana'){a.mana(s,u,d.advanced?20:10);if(d.advanced)a.buff(s,u,'invention-overload',4,{as:.2});}
  if(d.group==='stun'&&!(u.immuneUntil>s.time))u.stunUntil=Math.max(u.stunUntil,s.time+1);
 }a.event(s,'invention',friends[0],null,{name:d.name});}}
