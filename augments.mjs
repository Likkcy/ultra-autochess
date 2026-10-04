import {rareAugments,upgradeFor,rareImmediate,rarePreparation,rareSettlement,pandoraRare} from './rare-augments.mjs';
import {reconciliation} from './rivals.mjs';
import {augmentSpecs,heroSpecs} from './augment-data.mjs';
import {refundUnitItems} from './item-ledger.mjs';
import {combatNames} from './augment-combat.mjs';
export const allAugments=[...augmentSpecs.map(d=>d.name==='便携锻炉'?{...d,nodes:['2-1','3-2','4-2'],effect:'获得1个神器四选一，从4件神器中选择1件。'}:d),...heroSpecs,reconciliation,...rareAugments];
export const augmentDefinition=id=>allAugments.find(d=>d.id===id);
const instant={零用金:{gold:10},节俭账户:{gold:4},启动资金:{gold:20},利滚利:{gold:10},巨额储备:{gold:40},对冲基金:{gold:25},高端购物:{gold:10},投资账户:{gold:10},银色刷新券:{free:8},黄金刷新券:{free:15},棱彩门票:{free:5},常客折扣:{free:4},'一费补给':{units:[1,5]},'二费补给':{units:[2,4],gold:4},'三费投资':{units:[3,3],gold:6},组件包:{components:2},武器补给:{items:['战刃','光弩']},法术补给:{items:['光能杖','能量晶石']},防具补给:{items:['合金甲','屏障披风']},生命补给:{items:['生命腰带','格斗护手']},装备整修:{components:1,items:['拆卸器','拆卸器','重铸器','重铸器']},备用工具:{items:['普通成装选择器','拆卸器']},大组件包:{components:4},成装军备:{complete:2},量身定制:{items:['普通成装选择器','普通成装选择器']},便携锻炉:{items:['神器四选一']},战刃工坊:{items:['破星刃','战刃']},光能工坊:{items:['光辉冠','光能杖']},攻速工坊:{items:['狂怒刃','光弩']},防御工坊:{items:['生命铠','合金甲']},超级组件包:{components:6,items:['拆卸器','拆卸器']},豪华军备:{complete:4},统帅加冕:{gold:12,items:['统帅冠冕']},最后储备:{gold:15,hp:25}};
const ongoing=['购物优惠','败后整备','胜利津贴','三连搜寻','贸易站','耐心搜牌'];
export const battleNames=['小型战备','轻装步兵','羽量级选手','并肩作战Ⅰ','急救包Ⅰ','复苏之风Ⅰ','战斗绷带','前线坚韧','后排专注','临时护甲','致命节奏Ⅰ','精密打击','战斗法师Ⅰ','孤立防线','优势压制','一费齐心','并肩作战Ⅱ','急救包Ⅱ','复苏之风Ⅱ','致命节奏Ⅱ','战斗法师Ⅱ','珠光莲花','源计划植入','源计划甲壳','源计划供能','小小伙伴','飞升','猛兽之巢','站定射击','守护阵线','爆破专家','飞升终章','棱彩莲花','终极战备','黄金护盾','以少胜多','百战老兵','绝境屏障'];
const operations=['世纪和解','潘多拉备战席','精准补件','潘多拉装备','复制组件','幸运手套','复制援助','终极定制','双份幸运','装备升级计划','遗产回收','好事成双','经验补给','升级津贴','阶段训练','生日礼物','明智消费','升级咯','新兵入队','稳步前进','血色契约','连败重整','阵容收藏家','黄金之卵','三星征途','孤注一掷','纹章保养','骑士零件库','紧急预案','帝国的军械库','一心同体','独奏时刻','传道授业','金属回收站','我们的世界','钢铁驾驭'];
export const implementedAugments=new Set(allAugments.filter(d=>instant[d.name]||ongoing.includes(d.name)||combatNames.includes(d.name)||operations.includes(d.name)||d.emblem||d.id.startsWith('hero-')||d.id.startsWith('rare-')).map(d=>d.id));
export const hasAugment=(p,name)=>(p.augments??[]).some(id=>augmentDefinition(id)?.name===name);
function random(g){g.augmentRng=(g.augmentRng??(g.seed^0xA87630))>>>0;g.augmentRng=(g.augmentRng+0x6D2B79F5)>>>0;let t=g.augmentRng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}
const pick=(g,list)=>list[Math.floor(random(g)*list.length)];
const sequence=[['金','金','金',30],['银','金','金',20],['金','银','金',15],['金','金','彩',10],['彩','金','金',8],['金','彩','金',7],['银','金','彩',5],['彩','彩','彩',5]];
function compatible(p,d){
 const selected=(p.augments??[]).map(augmentDefinition).filter(Boolean),xp=['经验补给','升级津贴','阶段训练','生日礼物','明智消费','升级咯','稳步前进','血色契约'];
 if(d.id.startsWith('hero-'))return !p.heroName;if(d.name==='神器重塑'&&hasAugment(p,'光明重构')||d.name==='光明重构'&&hasAugment(p,'神器重塑'))return false;
 if(d.name==='孤注一掷'&&(p.level>7||selected.some(x=>xp.includes(x.name))))return false;
 if(xp.includes(d.name)&&hasAugment(p,'孤注一掷'))return false;
 if(['稳步前进','血色契约'].includes(d.name)&&hasAugment(p,'明智消费')||d.name==='明智消费'&&['稳步前进','血色契约'].some(n=>hasAugment(p,n)))return false;
 if(d.name==='阶段训练'&&hasAugment(p,'稳步前进')||d.name==='稳步前进'&&hasAugment(p,'阶段训练'))return false;
 if(d.name==='卓尔不群'&&selected.some(x=>x.trait)||d.trait&&hasAugment(p,'卓尔不群'))return false;
 return !selected.some(x=>x.exclusiveGroup&&x.exclusiveGroup===d.exclusiveGroup);
}
function candidates(g,p,node,tier){const seen=new Set(p.augmentChoice?.seen??[]);
 return allAugments.filter(d=>{if(!implementedAugments.has(d.id)||d.tier!==tier||!d.nodes.includes(node)||seen.has(d.id)||(p.augments??[]).includes(d.id)||!compatible(p,d))return false;
 if(d.needsRadiantBase&&!p.items.concat(p.units.flatMap(u=>u.items??[])).some(upgradeFor))return false;
 return true;
 });}
function drawOption(g,p,node,tier,restricted=true,replaceIndex=-1){
 const eligible=candidates(g,p,node,tier),others=p.augmentChoice.offers.filter((_,i)=>i!==replaceIndex);
 const heroes=eligible.filter(d=>d.id.startsWith('hero-'));
 const canHero=replaceIndex>=0&&restricted&&tier==='金'&&!others.some(id=>id?.startsWith('hero-'));
 let list=eligible.filter(d=>!d.id.startsWith('hero-')&&(restricted||!d.trait));
 if(canHero&&heroes.length&&(!list.length||random(g)<.25))list=heroes;
 const d=pick(g,list);if(d)p.augmentChoice.seen.push(d.id);return d?.id??null;
}
export function prepareAugments(g,api){if(!g.augmentsEnabled)return;const node=g.stage+'-'+g.round,index=['2-1','3-2','4-2'].indexOf(node);if(index<0)return;if(!g.augmentSequence){let roll=random(g)*100;const seq=sequence.find(s=>(roll-=s[3])<0)??sequence[0];g.augmentSequence=seq.slice(0,3);}for(const p of g.players){if(p.hp<=0||(p.augmentNodes??[]).includes(node)||p.augmentChoice)continue;p.augmentChoice={node,tier:g.augmentSequence[index],seen:[],rerolled:[false,false,false],offers:[]};const c=p.augmentChoice;for(let i=0;i<3;i++)c.offers.push(drawOption(g,p,node,c.tier,i!==2));if(c.tier==='金'&&random(g)<.25){const heroes=candidates(g,p,node,'金').filter(d=>d.id.startsWith('hero-'));const hero=pick(g,heroes);if(hero){c.offers[0]=hero.id;c.seen.push(hero.id);}}
 if(p.id>0){const options=c.offers.map(augmentDefinition).filter(Boolean);options.sort((a,b)=>score(p,b)-score(p,a));if(options.length)chooseAugment(g,p.id,c.offers.indexOf(options[0].id),api);}
 }}
function score(p,d){return d.id.startsWith('hero-')?5:d.trait?(p.augmentSnapshot??[]).filter(u=>u.traits.includes(d.trait)).length*3:2;}
export function rerollAugment(g,id,index){const p=g.players[id],c=p.augmentChoice;if(g.phase!=='prepare'||!c||!Number.isInteger(index)||index<0||index>2||c.rerolled[index])throw Error('该选项不能再次刷新');const others=c.offers.filter((_,i)=>i!==index).map(augmentDefinition).filter(Boolean);const restricted=others.some(d=>!d.trait&&!d.id.startsWith('hero-'));const replacement=drawOption(g,p,c.node,c.tier,restricted,index);if(!replacement)throw Error('暂无合法替代项');c.rerolled[index]=true;c.offers[index]=replacement;}
export function chooseAugment(g,id,index,api){const p=g.players[id],c=p?.augmentChoice;if(g.phase!=='prepare'||!c||p.hp<=0)throw Error('当前没有待选强化');const d=augmentDefinition(c.offers[index]);if(!d||!implementedAugments.has(d.id)||!compatible(p,d))throw Error('请选择合法强化');p.augments??=[];p.augments.push(d.id);p.augmentNodes??=[];p.augmentNodes.push(c.node);p.augmentChoice=null;const r=instant[d.name]??{};p.gold+=r.gold??0;p.freeRefreshes=(p.freeRefreshes??0)+(r.free??0);if(r.hp){p.maxPlayerHp=125;p.hp=Math.min(125,p.hp+r.hp);}p.items.push(...r.items??[]);for(let i=0;i<(r.components??0);i++)p.items.push(pick(g,api.components));const complete=api.items.filter(n=>n!=='奇袭手套');for(let i=0;i<(r.complete??0);i++){const n=pick(g,complete);p.items.push(n);complete.splice(complete.indexOf(n),1);}if(r.units)for(let i=0;i<r.units[1];i++)api.reward(g,p,null,r.units[0]);if(d.emblem)p.items.push(d.emblem+'纹章');if(d.rewardUnit)api.reward(g,p,d.rewardUnit);if(d.rewardItem)p.items.push(d.rewardItem);augmentImmediate(g,p,d,api);}
export function augmentPrep(g,p,api){rarePreparation(g,p);if(api)augmentRoundOperations(g,p,api);p.roundFreeRefreshes=0;p.discountUsed=false;if(hasAugment(p,'贸易站'))p.roundFreeRefreshes++;if(hasAugment(p,'耐心搜牌')&&p.gold>=40&&(p.patienceTicks??0)<10){p.patienceTicks=(p.patienceTicks??0)+1;p.freeRefreshes=(p.freeRefreshes??0)+2;}if(hasAugment(p,'投资账户'))p.freeRefreshes=(p.freeRefreshes??0)+Math.min(5,Math.max(0,Math.floor((p.gold-50)/10)));}
export function refreshPrice(p){return (p.roundFreeRefreshes??0)+(p.freeRefreshes??0)>0?0:hasAugment(p,'常客折扣')&&(p.paidRefreshes??0)>=10||hasAugment(p,'购物优惠')&&!p.discountUsed?1:2;}
export function payRefresh(g,p){const cost=refreshPrice(p);if(p.gold<cost)throw Error('刷新金币不足');if(!cost){if(p.roundFreeRefreshes>0)p.roundFreeRefreshes--;else p.freeRefreshes--;}else{p.gold-=cost;p.refreshSpend=(p.refreshSpend??0)+cost;p.discountUsed=true;p.paidRefreshes=(p.paidRefreshes??0)+1;if(hasAugment(p,'三连搜寻')&&p.paidRefreshes%3===0)p.freeRefreshes=(p.freeRefreshes??0)+1;if(hasAugment(p,'棱彩门票')&&random(g)<.5)p.freeRefreshes=(p.freeRefreshes??0)+1;}}
export function augmentSettle(g,p,outcome,neutral,api){rareSettlement(g,p,neutral);p.augmentSnapshot=p.units.filter(u=>u.location==='board').map(u=>({name:u.name,naturalTraits:[...g.catalog.find(d=>d.name===u.name).traits],traits:[...g.catalog.find(d=>d.name===u.name).traits,...(u.items??[]).filter(n=>n.endsWith('纹章')).map(n=>n.slice(0,-2))]}));if(neutral||p.hp<=0)return;augmentQuestSettle(g,p,outcome,api);let gold=hasAugment(p,'节俭账户')?1:0;if(outcome===0&&hasAugment(p,'胜利津贴')&&(p.winPayments??0)<8){p.winPayments=(p.winPayments??0)+1;gold+=2;}if(outcome===1&&['败后整备','最后储备'].some(n=>hasAugment(p,n))){for(const n of ['败后整备','最后储备'])if(hasAugment(p,n)&&((p.failurePayments??{})[n]??0)<5){p.failurePayments??={};p.failurePayments[n]=(p.failurePayments[n]??0)+1;p.freeRefreshes=(p.freeRefreshes??0)+2;}}p.gold+=gold;p.lastIncome.total+=gold;p.lastIncome.augment=gold;}
export function combatAugments(p){return (p.augments??[]).map(id=>allAugments.find(d=>d.id===id&&!d.id.startsWith('hero-'))?.name).filter(Boolean);}

export function applyAugmentXP(g,p,amount,api){
 const cap=hasAugment(p,'孤注一掷')?7:hasAugment(p,'升级咯')?11:10;
 const paid=p.refreshSpend??0;if(hasAugment(p,'明智消费')){amount+=2*Math.floor(paid/4);p.refreshSpend=paid%4;}
 p.xp+=amount;const requirements=[0,2,2,6,10,20,36,48,80,84,100];
 while(p.level<cap&&p.xp>=requirements[p.level]){p.xp-=requirements[p.level];p.level++;if(hasAugment(p,'升级津贴'))p.gold+=p.level;if(hasAugment(p,'生日礼物'))api.reward(g,p,null,Math.min(5,Math.max(1,p.level-3)));}rarePreparation(g,p);
}
export function augmentImmediate(g,p,d,api){
 const equipment={精准补件:['组件选择器'],复制组件:['复制组件选择器'],幸运手套:['奇袭手套'],双份幸运:['奇袭手套','奇袭手套'],复制援助:['低费复制器','低费复制器'],终极定制:['普通成装选择器','普通成装选择器','普通成装选择器','普通复制器'],装备升级计划:['普通成装选择器','普通成装选择器'],新兵入队:['普通复制器']};
 p.items.push(...(equipment[d.name]??[]));rareImmediate(g,p,d.name);
 for(let i=0;i<({潘多拉装备:2,复制援助:1,纹章保养:1}[d.name]??0);i++)p.items.push(pick(g,api.components));
 if(d.name==='遗产回收')p.items.push(pick(g,api.items));
 p.gold+=({潘多拉备战席:5,精准补件:3,经验补给:4,阶段训练:8,稳步前进:10,孤注一掷:50}[d.name]??0);
 if(['新兵入队','孤注一掷'].includes(d.name))p.extraPopulation=(p.extraPopulation??0)+1;
 const xp={经验补给:16,升级津贴:4,生日礼物:6,升级咯:12,稳步前进:12};if(xp[d.name])applyAugmentXP(g,p,xp[d.name],api);
 if(d.name==='三星征途')for(let i=0;i<4;i++)api.reward(g,p,null,1);
 if(d.name==='紧急预案')api.science(g,p);
 if(d.rewardUnits)for(const name of d.rewardUnits)api.reward(g,p,name,g.catalog.find(d=>d.name===name)?.cost??1);
 if(d.name==='好事成双'||d.name==='三星征途')augmentRoundOperations(g,p,api);
 if(d.id.startsWith('hero-')){p.heroName=d.name;const u=api.reward(g,p,d.name,d.cost);const target=p.units.filter(u=>u.name===d.name).sort((a,b)=>b.star-a.star||a.id-b.id)[0]??u;if(target)target.hero=true;}
}
export function augmentEquipmentUsed(g,p,u,result,api){
 const metal=new Set(p.units.filter(w=>w.location==='board'&&(g.catalog.find(d=>d.name===w.name).traits.includes('金属狂潮')||w.items.includes('金属狂潮纹章'))).map(w=>w.name)).size;
 if(metal>=3&&result==='金属狂潮纹章'&&hasAugment(p,'金属回收站')&&(p.metalReclaims??0)<3){const token=u.itemIds?.[u.items.indexOf(result)];p.reclaimedTokens??=[];if(token&&!p.reclaimedTokens.includes(token)){p.reclaimedTokens.push(token);p.metalReclaims=(p.metalReclaims??0)+1;p.items.push(pick(g,api.components));}}
}
export function augmentRoundOperations(g,p,api){
 if(p.duplicateRemaining>0&&p.duplicateComponent){p.items.push(p.duplicateComponent);p.duplicateRemaining--;}
 if(hasAugment(p,'潘多拉装备'))p.items=p.items.map(n=>api.components.includes(n)?pick(g,api.components):api.items.includes(n)?pick(g,api.items):pandoraRare(g,p,n));
 if(hasAugment(p,'潘多拉备战席')){for(const u of p.units.filter(u=>u.location==='bench').filter((u,i)=>(p.pandoraSlots??[0,1,2]).includes(i)&&u.id!==p.mirrorTarget)){const d=g.catalog.find(d=>d.name===u.name);if(d.cost>4)continue;const count=3**(u.star-1),old=u.name;g.pool[old]+=count;const choices=g.catalog.filter(d=>d.cost===g.catalog.find(d=>d.name===old).cost&&g.pool[d.name]>=count),next=pick(g,choices);if(!next){g.pool[old]-=count;continue;}g.pool[next.name]-=count;refundUnitItems(p,u);p.items.push(...u.items);u.items=[];u.itemIds=[];u.name=next.name;u.permanent={ap:0,kills:0};u.training=[];u.hero=false;u.evolutions=[];}}
 if(hasAugment(p,'好事成双')){p.doubleRewards??=[];p.doublePending??=[];for(const u of p.units.filter(u=>u.star===3))if(!p.doubleRewards.includes(u.name)){p.doubleRewards.push(u.name);p.doublePending.push(u.name);}p.doublePending=p.doublePending.filter(name=>!api.reward(g,p,name,g.catalog.find(d=>d.name===name).cost,3,2));}
 if(hasAugment(p,'三星征途')&&!p.tristarPaid&&new Set(p.units.filter(u=>u.star===3).map(u=>u.name)).size>=4){p.tristarPaid=true;p.gold+=25;p.items.push('普通成装选择器','普通成装选择器','统帅冠冕');}
 if(p.heroName&&!p.units.some(u=>u.hero)){const u=p.units.filter(u=>u.name===p.heroName).sort((a,b)=>b.star-a.star||a.id-b.id)[0];if(u)u.hero=true;}
}
export function augmentQuestSettle(g,p,outcome,api){
 if(hasAugment(p,'血色契约'))p.hp=Math.min(p.maxPlayerHp??100,p.hp+2);
 if(hasAugment(p,'连败重整')&&(p.lossCashouts??0)<2){if(outcome===1)p.lossCharge=(p.lossCharge??0)+1;else{if(outcome===0&&p.lossCharge){const gold=[0,4,8,14,22,30][Math.min(5,p.lossCharge)];p.gold+=gold;p.lastIncome.total+=gold;p.lossCashouts=(p.lossCashouts??0)+1;}p.lossCharge=0;}}
 if(hasAugment(p,'阵容收藏家')&&!p.collectPaid){p.collection=[...new Set([...(p.collection??[]),...p.units.filter(u=>u.location==='board').map(u=>u.name)])];if(p.collection.length>=10){p.collectPaid=true;p.gold+=12;p.lastIncome.total+=12;p.items.push('普通成装选择器');}}
 if(hasAugment(p,'黄金之卵')&&!p.eggPaid){p.eggProgress=(p.eggProgress??0)+1+(outcome===0?1:0);if(p.eggProgress>=8){p.eggPaid=true;p.gold+=30;p.lastIncome.total+=30;p.items.push('普通成装选择器','普通成装选择器','普通复制器');}}
 if(hasAugment(p,'传道授业'))for(const [mentorId,uid] of Object.entries(p.apprentices??{})){const mentor=p.units.find(u=>u.id===Number(mentorId)&&u.location==='board'),student=p.units.find(u=>u.id===uid&&u.location==='board');if(!mentor||!student)continue;student.training??=[];if(student.training.length>=8)continue;const attr={'赛文':'ap','雷欧':'adPercent','爱迪':'hpPercent','奥特之父':'dr'}[mentor.name];if(!attr)continue;const value=attr==='ap'?1.8:attr==='dr'?.012:.018;g.trainingCounter=(g.trainingCounter??0)+1;student.training.push({id:g.trainingCounter,round:g.stage*10+g.round,attr,value});student.permanent[attr]=(student.permanent[attr]??0)+value;}
}

export function augmentLegacy(g,eliminated,api){for(const p of g.players){if(p.hp<=0||!hasAugment(p,'遗产回收')||(p.legacyRewards??0)>=3)continue;for(const other of eliminated){if(other===p||(p.legacyRewards??0)>=3)continue;p.legacyRewards=(p.legacyRewards??0)+1;const list=[...new Set([...other.items,...other.units.flatMap(u=>u.items)].filter(n=>api.items.includes(n)))];if(!list.length){p.gold+=8;continue;}const offers=[];while(list.length&&offers.length<3)offers.push(list.splice(Math.floor(random(g)*list.length),1)[0]);if(p.itemChoice){p.itemChoiceQueue??=[];p.itemChoiceQueue.push(offers);}else{p.itemChoice=offers;p.itemChoiceKind='遗产回收';}}}}
