// Stable item identities for metal reclamation. Names remain the public inventory API.
function fresh(p){p.itemCounter=(p.itemCounter??0)+1;return `item-${p.id}-${p.itemCounter}`;}
export function reconcileItems(p){
 const previous=[...(p.itemLedger??[])],used=new Set();
 p.itemLedger=p.items.map((name,i)=>{let index=previous[i]?.name===name&&!used.has(i)?i:previous.findIndex((v,j)=>v.name===name&&!used.has(j));if(index>=0){used.add(index);return previous[index];}return {name,id:fresh(p)};});
 for(const u of p.units){u.itemIds??=[];for(let i=0;i<u.items.length;i++)u.itemIds[i]??=fresh(p);u.itemIds.length=u.items.length;}
}
export function removeInventoryItem(p,index){reconcileItems(p);return p.itemLedger.splice(index,1)[0];}
export function refundUnitItems(p,u){reconcileItems(p);for(let i=0;i<u.items.length;i++)p.itemLedger.push({name:u.items[i],id:u.itemIds[i]});}
export function equipmentIdentity(p,u,index,incoming,combined){if(combined){u.itemIds[index]=fresh(p);}else u.itemIds.push(incoming.id);}
