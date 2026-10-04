import {items} from './equipment-data.mjs';
const radiantEffects={
狂怒刃:'每次普攻获得10%可叠加攻速。',战意长枪:'每次普攻额外回复10法力。',光辉冠:'伤害提高30%。',光能枪刃:'获得40%全能吸血；造成伤害时，为生命比例最低的另一名友军回复伤害40%的生命。',大天使杖:'每5秒获得60法强。',生命铠:'最大生命值提高25.44%。',龙鳞披风:'每2秒回复最大生命8%的生命。',泰坦战甲:'攻击或承伤时获得4%攻击力与4法强，最多25层；满层获得40护甲和魔抗。'
};
export const radiants=Object.entries(radiantEffects).map(([base,effect])=>({name:'光明·'+base,type:'光明装备',base,stats:items.find(i=>i[0]===base)[3].replace(/\+(\d+(?:\.\d+)?)/g,(_,n)=>'+'+Number(n)*2),effect}));
export const artifacts=[
 {name:'星门射矛',type:'神器',stats:'攻击力+25%，攻速+20%',effect:'射程+2格。每第三次普攻追加90%攻击力的物理伤害，无视目标50%护甲。'},
 {name:'时序核心',type:'神器',stats:'法强+30，初始法力+30',effect:'每秒回复4法力；施法锁蓝期间暂停回复。'},
 {name:'幽冥战甲',type:'神器',stats:'生命+500，护甲+30',effect:'每场首次生命低于35%时，获得最大生命40%的护盾6秒，并解除控制。'},
 {name:'星铸巨锤',type:'神器',stats:'攻击力+35%，生命+300',effect:'每第四次普攻对目标及其相邻敌人造成150%攻击力的物理伤害。'},
 {name:'引力棱镜',type:'神器',stats:'法强+40，魔抗+25',effect:'每次施法使两格内敌人的护甲与魔抗降低25%，持续5秒，不叠加。'},
 {name:'生命熔炉',type:'神器',stats:'生命+600，护甲+20，魔抗+20',effect:'每秒回复最大生命2%的生命；每10秒永久获得100生命，每场最多300。'},
 {name:'暴风引擎',type:'神器',stats:'攻速+35%',effect:'每次普攻获得3%可叠加攻速，最多20层；满层获得20%全能吸血。'},
 {name:'光脉圣杯',type:'神器',stats:'法强+30，生命+300',effect:'每5秒使自身及相邻友军获得持有者最大生命15%的护盾，持续4秒。'}
];
export const rareItems=[...radiants,...artifacts];
export const rareItem=name=>rareItems.find(i=>i.name===name);
export function rareAttack(s,u,v,a){const has=n=>(u.combatItems??[]).includes(n),count=n=>(u.combatItems??[]).filter(i=>i===n).length;
 if(has('星门射矛')&&u.attacks%3===0)a.hit(s,u,v,a.stats(u).ad*.9*count('星门射矛'),'physical',{item:true,noCrit:true,pen:.5});
 if(has('星铸巨锤')&&u.attacks%4===0)for(const w of s.units.filter(w=>w.side!==u.side&&!w.dead&&w.hp>0&&a.distance(w,v)<=1))a.hit(s,u,w,a.stats(u).ad*1.5*count('星铸巨锤'),'physical',{item:true,area:true,noCrit:true});
 if(has('暴风引擎')&&(u.stormStacks??0)<20){u.stormStacks=(u.stormStacks??0)+1;u.asBonus+=.03*count('暴风引擎');if(u.stormStacks===20)u.omni+=.2*count('暴风引擎');}
}
export function rareCast(s,u,a){if((u.combatItems??[]).includes('引力棱镜'))for(const w of s.units.filter(w=>w.side!==u.side&&!w.dead&&w.hp>0&&a.distance(w,u)<=2))a.buff(s,w,'artifact-gravity',5,{armorPct:.25,mrPct:.25});}
export function rareTick(s,u,a){const has=n=>(u.combatItems??[]).includes(n),count=n=>(u.combatItems??[]).filter(i=>i===n).length;
 if(has('幽冥战甲')&&!u.spectralTriggered&&u.hp/u.maxHp<.35){u.spectralTriggered=true;u.stunUntil=0;a.shield(s,u,u.maxHp*.4*count('幽冥战甲'),6,'artifact-spectral');}
 if((u.rareNext??1)>s.time)return;u.rareNext=Math.floor(s.time)+1;
 if(has('时序核心')&&s.time>=u.lockUntil)a.mana(s,u,4*count('时序核心'));
 if(has('生命熔炉')){a.heal(s,u,u.maxHp*.02*count('生命熔炉'));if([10,20,30].includes(Math.floor(s.time))){const amount=100*count('生命熔炉');u.permanent.hp=(u.permanent.hp??0)+amount;u.maxHp+=amount;a.heal(s,u,amount);}}
 if(has('光脉圣杯')&&Math.floor(s.time)%5===0)for(const w of s.units.filter(w=>w.side===u.side&&!w.dead&&w.hp>0&&a.distance(w,u)<=1))a.shield(s,w,u.maxHp*.15*count('光脉圣杯'),4,'artifact-chalice-'+u.id);
}
