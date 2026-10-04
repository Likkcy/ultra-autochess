import {items} from './equipment-data.mjs';
import {artifacts,radiants,rareItem} from './rare-equipment.mjs';
const nodes=['2-1','3-2','4-2'];
export const rareAugments=[
 {id:'rare-latent',name:'休眠锻炉',tier:'银',nodes:['2-1','3-2'],effect:'完成10场玩家战后，获得1个神器选择器。'},
 {id:'rare-living',name:'活体锻炉',tier:'彩',nodes:['2-1','3-2'],effect:'立即获得1个神器选择器，此后每完成9场玩家战再获得1个。'},
 {id:'rare-relics',name:'光明圣物',tier:'彩',nodes,effect:'获得1个光明圣物选择器，从5件光明装备中选择1件，并获得1个拆卸器。',exclusiveGroup:'radiant-source'},
 {id:'rare-refactor',name:'光明重构',tier:'彩',nodes,effect:'获得1个光明升级器与1个组件选择器。可升级狂怒刃、战意长枪、光辉冠、光能枪刃、大天使杖、生命铠、龙鳞披风或泰坦战甲。',exclusiveGroup:'radiant-source',needsRadiantBase:true},
 {id:'rare-transform',name:'神器重塑',tier:'彩',nodes,effect:'获得1个神器选择器。已有及以后获得的普通成装变为随机神器；每件神器为持有者提供60生命。组件、纹章、冠冕和光明装备保留。'},
 {id:'rare-caretaker',name:'照护者之选',tier:'彩',nodes:['2-1'],effect:'达到4级获得组件选择器，6级获得普通成装选择器，8级获得光明装备选择器。各奖励只能领取一次。'}
].map(d=>({category:'装备强化',scope:'队伍',...d}));
export const rareSelectors={'神器选择器':{type:'神器',size:3},'神器四选一':{type:'神器',size:4},'光明装备选择器':{type:'光明装备',size:3},'光明圣物选择器':{type:'光明装备',size:5}};
export const upgradeFor=name=>radiants.find(d=>d.base===name)?.name;
const has=(p,name)=>(p.augments??[]).includes(rareAugments.find(d=>d.name===name)?.id);
function pick(g,p,list){p.rareRng=(p.rareRng??(g.seed^Math.imul(p.id+1,0x9e3779b9)))>>>0;p.rareRng=(Math.imul(p.rareRng,1664525)+1013904223)>>>0;return list[Math.floor(p.rareRng/4294967296*list.length)];}
export function normalizeRareItems(g,p){if(!has(p,'神器重塑'))return;const normal=new Set(items.map(i=>i[0])),convert=n=>normal.has(n)?pick(g,p,artifacts).name:n;p.items=p.items.map(convert);for(const u of p.units)u.items=u.items.map(convert);}
export function rareImmediate(g,p,name){const grants={活体锻炉:['神器选择器'],光明圣物:['光明圣物选择器','拆卸器'],光明重构:['光明升级器','组件选择器'],神器重塑:['神器选择器']};p.items.push(...grants[name]??[]);rarePreparation(g,p);}
export function rarePreparation(g,p){if(has(p,'照护者之选')){p.caretakerRewards??=[];for(const [level,item] of [[4,'组件选择器'],[6,'普通成装选择器'],[8,'光明装备选择器']])if(p.level>=level&&!p.caretakerRewards.includes(level)){p.caretakerRewards.push(level);p.items.push(item);}}normalizeRareItems(g,p);}
export function rareSettlement(g,p,neutral){normalizeRareItems(g,p);if(neutral||p.hp<=0)return;const key=g.stage+'-'+g.round;if(p.rareSettledRound===key)return;p.rareSettledRound=key;for(const name of ['休眠锻炉','活体锻炉'])if(has(p,name)){p.rareForgeRounds??={};const count=p.rareForgeRounds[name]=(p.rareForgeRounds[name]??0)+1;if(name==='休眠锻炉'?count===10:count%9===0)p.items.push('神器选择器');}}
export function pandoraRare(g,p,name){const d=rareItem(name);return d?pick(g,p,d.type==='神器'?artifacts:radiants).name:name;}

export function rareProgress(p,name){const n=p.rareForgeRounds?.[name]??0;return name==='休眠锻炉'?Math.min(n,10)+'/10'+(n>=10?' · 已交付':''):name==='活体锻炉'?n%9+'/9':name==='照护者之选'?(p.caretakerRewards?.length??0)+'/3':'';}
