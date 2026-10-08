// Our fixed progression follows TFT's increasing late-carousel reward value.
export function carouselCosts(stage){return stage<=1?[1]:stage===2?[2]:stage===3?[3]:stage===4?[3,4]:[4,5];}
export function carouselItem(stage,index,random,components,items,radiants=[],artifacts=[]){if(stage<=3)return components[Math.floor(random()*components.length)];if(stage===4&&index%2===0)return components[Math.floor(random()*components.length)];if(stage>=6&&random()<.2){const list=index%2?radiants:artifacts;if(list.length)return list[Math.floor(random()*list.length)];}return items[Math.floor(random()*items.length)];}
export function carouselState(g,offers,type,order,receipts=[]){return {round:g.stage+'-'+g.round,type,order:[...order],offers:structuredClone(offers),receipts:structuredClone(receipts),revealed:0};}
export function recordPick(g,p,offer,index){if(!g.carousel)return;g.carousel.receipts.push({player:p.id,name:offer.name,item:offer.item,index});}
export function revealPick(g){const c=g.carousel;if(!c)return false;const id=c.order[c.revealed];if(id===undefined||!c.receipts.some(r=>r.player===id))return false;c.revealed++;return true;}
