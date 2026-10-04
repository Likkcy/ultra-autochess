// Shared preparation/battle definition. Highest copy of each name supplies stars.
export function gridmanDefinition(tier,stars,world=false){
 const terminal=tier===2&&stars>=14&&world;
 return {name:'古利特超人',cost:0,traits:[],hp:terminal?24000:[700,1000,1400][tier]+[120,150,180][tier]*stars,ad:terminal?400:[40,55,70][tier]+[6,8,10][tier]*stars,as:terminal?1.2:.75,armor:terminal?120:35,mr:terminal?120:35,range:1,mana:terminal?[40,80]:[30,90],skill:terminal?'全场终结光线；为友军提供护盾。':'古利特光线；高档位解锁额外技能和被动。',star:terminal?4:tier+1};
}
