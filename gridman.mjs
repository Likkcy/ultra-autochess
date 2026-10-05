// Shared preparation/battle definition. Highest copy of each name supplies stars.
export function gridmanDefinition(tier,stars,world=false){
 const terminal=tier===2&&stars>=14&&world;
 return {name:'古利特超人',cost:0,traits:[],hp:terminal?24000:[700,1000,1400][tier]+[120,150,180][tier]*stars,ad:terminal?400:[40,55,70][tier]+[6,8,10][tier]*stars,as:terminal?1.2:tier>=1?.975:.75,armor:terminal?120:tier===2?65:35,mr:terminal?120:tier===2?65:35,range:1,mana:terminal?[40,80]:[30,90],skill:terminal?'终结光线：对全体敌人造成6000魔法伤害，为全部友军提供50%最大生命护盾，持续8秒。':`古利特光线：对路径上的敌人造成${Math.round((220+25*stars)*(tier>=1?1.25:1))}魔法伤害。`,passive:terminal?'普攻造成300%攻击力伤害，并攻击前方扇形内的其他敌人；整场控制免疫。':(tier>=1?'每第三次普攻造成180%攻击力的范围伤害。':'')+(tier===2?`开战获得25%最大生命护盾；首次生命低于50%时，对周围一格敌人造成${200+20*stars}魔法伤害并眩晕1秒。`:''),star:terminal?4:tier+1};
}
