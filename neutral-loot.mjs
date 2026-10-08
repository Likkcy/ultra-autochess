// Shared, seeded PvE loot. The lobby rolls tiers once; players roll contents of equal value.
import {items as equipment} from './equipment-data.mjs';
const COMPONENTS=['战刃','光弩','光能杖','能量晶石','合金甲','屏障披风','生命腰带','格斗护手'];
const complete=equipment.map(i=>i[0]).filter(n=>n!=='奇袭手套');
const round=g=>g.stage+'-'+g.round;
function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=Math.imul(a^(a>>>15),a|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function shuffle(list,rand){for(let i=list.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;}
export function neutralComponentBudget(g){if(g.stage===1)return 1;if(g.stage>=5)return 0;if(g.seed===undefined)return 2;const distribution=shuffle([1,2,3],random(g.seed^0x5ac327));return distribution[g.stage-2];}
export function neutralLootPlan(g){const rand=random((g.seed??4317)^Math.imul(g.stage,997)^Math.imul(g.round,31)),stage=g.stage,quality=rand();const tier=stage===1?'灰':quality<.6?'灰':quality<.86?'蓝':quality<.98?'金':'彩';return {round:round(g),components:neutralComponentBudget(g),boss:stage>=5,tier,value:stage===1?2:tier==='灰'?Math.min(12,stage*2):tier==='蓝'?Math.min(18,stage*2+4):tier==='金'?Math.min(26,stage*2+12):Math.min(40,stage*4+16),variant:Math.floor(rand()*4)};}
export function neutralBossItem(g,id=0){const rand=random((g.seed??4317)^Math.imul(g.stage,631)^Math.imul(id+1,1907));return complete[Math.floor(rand()*complete.length)];}
function component(g,p){if(!p.neutralComponentBag?.length){p.neutralBagCycle=(p.neutralBagCycle??0)+1;p.neutralComponentBag=shuffle([...COMPONENTS],random((g.seed??4317)^Math.imul(p.id+1,7639)^Math.imul(p.neutralBagCycle,313)));}return p.neutralComponentBag.pop();}
export function buildNeutralLoot(g,p,npcs,api={}){
 if(!npcs.length)return [];
 const plan=neutralLootPlan(g),rand=random((g.seed??4317)^Math.imul(g.stage,827)^Math.imul(g.round,107)^Math.imul(p.id+1,4703)),orbs=[];
 const put=(tier,contents,value)=>{const orbId=round(g)+':'+p.id+':'+orbs.length;orbs.push(contents.map((drop,i)=>({...drop,tier,orbId,value,rewardId:orbId+':'+i})));};
 const count=(p.componentDebt??0)+plan.components;
 for(let i=0;i<count;i++)put('组件',[{item:component(g,p),component:true}],4);
 if(plan.boss)put('成装',[{item:neutralBossItem(g,p.id)}],10);
 const drops=[],value=plan.value,variant=plan.tier==='彩'?plan.variant:Math.floor(rand()*4);let left=value;
 const addItem=(item,price)=>{drops.push({item});left-=price;};
 const addUnit=cost=>{const name=api.reserve?.(g,p,cost);if(name)drops.push({unit:name,cost,reserved:true});else drops.push({gold:cost});left-=cost;};
 if(g.stage===1)drops.push({gold:value}),left=0;
 else if(plan.tier==='灰'){if(variant===1&&value>=3)addUnit(3);else if(variant===2&&g.stage>=3)addItem('拆卸器',0);}
 else if(plan.tier==='蓝'){if(variant===0)addUnit(3),addUnit(3);else if(variant===1)addItem('重铸器',0);else if(variant===2)addItem('拆卸器',0);}
 else if(plan.tier==='金'){if(variant===0)addItem('普通成装选择器',10);else if(variant===1)addItem(rand()<.5?'光徽':'暗徽',8);else if(variant===2)addUnit(Math.min(5,g.stage+1)),addUnit(Math.min(5,g.stage+1));else addItem('普通复制器',10);}
 else if(plan.tier==='彩')addItem(['光明装备选择器','神器选择器','纹章选择器','普通复制器'][variant],[20,20,16,10][variant]);
 if(left>0)drops.push({gold:left});put(plan.tier,drops,value);
 // Keep each orb intact on one monster, rather than splitting a bundle between enemies.
 const assigned=npcs.map(()=>[]);orbs.forEach((orb,i)=>assigned[i%assigned.length].push(...orb));return assigned;
}
export function reservedNeutralCopies(g){const names=[];for(const b of g.battles??[])if(!b.lootSettled)for(const d of b.neutralLoot?.flat()??[])if(d.unit&&d.reserved)names.push(d.unit);return names;}
export function settleNeutralLoot(g,p,b,outcome,api={}){
 if(b.lootSettled)return p.lastLoot;
 const killed=new Set((b.state?.events??[]).filter(e=>e.type==='loot-drop').map(e=>e.target));
 const enemies=(b.state?.units??[]).filter(u=>u.neutral),loot=u=>u.neutralLoot??u.def?.loot??[];
 const planned=b.neutralLoot?.flat()??enemies.flatMap(loot),earned=enemies.filter(u=>outcome===0||u.dead||killed.has(u.id)).flatMap(loot),earnedIds=new Set(earned.map(d=>d.rewardId).filter(Boolean));
 const scheduled=b.neutralLoot?planned.filter(d=>d.component).length:(p.componentDebt??0)+neutralComponentBudget(g);
 p.componentDebt=Math.max(0,scheduled-earned.filter(d=>d.component).length);
 let gold=earned.reduce((n,d)=>n+(d.gold??0),0);const itemNames=earned.filter(d=>d.item).map(d=>d.item),units=[];
 for(const d of planned.filter(d=>d.unit&&d.reserved)){const won=earnedIds.has(d.rewardId)||earned.includes(d);if(won&&api.grant){api.grant(g,p,d.unit);units.push(d.unit);}else{g.pool[d.unit]++;if(won)gold+=d.cost;}d.reserved=false;}
 p.gold+=gold;p.items.push(...itemNames);p.lastIncome??={total:0};p.lastIncome.reward=gold;p.lastIncome.total+=gold;
 p.lastLoot={round:round(g),gold,items:itemNames,units,kills:enemies.filter(u=>outcome===0||u.dead||killed.has(u.id)).length,total:enemies.length,orbs:[...new Set(earned.map(d=>d.orbId).filter(Boolean))].map(id=>{const contents=earned.filter(d=>d.orbId===id);return {tier:contents[0].tier,value:contents[0].value,contents:contents.map(({reserved,...d})=>d)};}),deferredComponents:p.componentDebt};
 b.lootSettled=true;return p.lastLoot;
}
export const lootLabels=loot=>[...loot.filter(d=>d.item||d.unit).map(d=>d.item??d.unit),...(loot.some(d=>d.gold)?[loot.reduce((n,d)=>n+(d.gold??0),0)+'金币']:[])];
