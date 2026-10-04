export const encounters=[
 {id:'none',name:'平静开局',weight:30,effect:'本局没有开局奇遇。'},
 {id:'star-one',name:'新星登场',weight:10,cost:1,star:2,effect:'每位玩家获得一名随机二星一费棋子。'},
 {id:'cost-two',name:'援军抵达',weight:9,cost:2,star:1,effect:'每位玩家获得一名随机二费棋子。'},
 {id:'cost-three',name:'精锐集结',weight:7,cost:3,star:1,effect:'每位玩家获得一名随机三费棋子。'},
 {id:'first-prismatic',name:'头彩',weight:6,sequence:['彩','金','金'],effect:'本局强化等级为彩、金、金。'},
 {id:'last-prismatic',name:'尾彩',weight:6,sequence:['金','金','彩'],effect:'本局强化等级为金、金、彩。'},
 {id:'all-prismatic',name:'全彩',weight:3,sequence:['彩','彩','彩'],effect:'本局三次强化均为棱彩。'},
 {id:'first-gold',name:'头金',weight:6,sequence:['金','彩','彩'],effect:'首次强化为金色，后续均为棱彩；本局不出现银色强化。'},
 {id:'last-gold',name:'尾金',weight:6,sequence:['彩','彩','金'],effect:'最后一次强化为金色，前两次均为棱彩；本局不出现银色强化。'},
 {id:'all-gold',name:'全金',weight:7,sequence:['金','金','金'],effect:'本局三次强化均为金色。'},
 {id:'artifact',name:'遗迹馈赠',weight:5,item:'神器选择器',effect:'每位玩家获得一个神器选择器，从三件神器中选择一件。'},
 {id:'radiant',name:'光明赐福',weight:5,item:'光明装备选择器',effect:'每位玩家获得一个光明装备选择器，从三件光明装备中选择一件。'}
];
export function openingEncounter(seed,forced){if(forced!==undefined){const d=encounters.find(e=>e.id===forced);if(!d)throw Error('未知开局奇遇');return d;}let a=(Number(seed)^0x51E7AC09)>>>0;a=Math.imul(a^(a>>>16),0x7feb352d);a=Math.imul(a^(a>>>15),0x846ca68b);let roll=((a^(a>>>16))>>>0)/4294967296*encounters.reduce((n,e)=>n+e.weight,0);return encounters.find(e=>(roll-=e.weight)<0)??encounters[0];}
