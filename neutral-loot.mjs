// Seeded PvE rewards: assign once at opening, reveal on first death, settle once.
export function neutralComponentBudget(g){return g.stage===1?1:g.stage<=4?2:g.stage===5?1:0;}
export function buildNeutralLoot(g,p,npcs,api){
 const drops=npcs.map(()=>[]),put=(value,i=0)=>drops[i%drops.length].push(value);
 let gold=g.stage===1?2:g.stage===2?4:g.stage===3?6:g.stage===4?8:g.stage===5?10:8;
 const components=(p.componentDebt??0)+neutralComponentBudget(g);
 for(let i=0;i<components;i++)put({item:api.component(g,p),component:true},i);
 if(g.stage>=2&&g.stage<=5&&api.random(g)<.1){put({item:api.random(g)<.5?'光徽':'暗徽'},drops.length-1);gold-=2;}
 for(let i=0;i<gold;i++)put({gold:1},i);
 if(g.stage>=6)put({item:'普通成装选择器'},drops.length-1);
 if(g.stage===3||g.stage===5)put({item:'拆卸器'},drops.length-1);
 if(g.stage===4)put({item:'重铸器'},drops.length-1);
 return drops;
}
export function settleNeutralLoot(g,p,b,outcome){
 const killed=new Set((b.state?.events??[]).filter(e=>e.type==='loot-drop').map(e=>e.target));
 const enemies=(b.state?.units??[]).filter(u=>u.neutral);
 const earned=enemies.filter(u=>outcome===0||killed.has(u.id)).flatMap(u=>u.neutralLoot??[]);
 p.componentDebt=Math.max(0,(p.componentDebt??0)+neutralComponentBudget(g)-earned.filter(d=>d.component).length);
 const gold=earned.reduce((sum,d)=>sum+(d.gold??0),0),items=earned.filter(d=>d.item).map(d=>d.item);
 p.gold+=gold;p.items.push(...items);p.lastIncome.reward=gold;p.lastIncome.total+=gold;
 p.lastLoot={round:g.stage+'-'+g.round,gold,items,kills:killed.size,total:enemies.length};
 return p.lastLoot;
}
