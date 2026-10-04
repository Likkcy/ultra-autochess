// Trait-exclusive combat behavior, shared by real matches and the battle laboratory.
const live=u=>!u.dead&&u.hp>0;
const has=(u,n)=>!u.special&&(u.matchEffects?.augments??[]).includes(n);
const roleGroups={front:'杰克 哥尔赞 达达 美尔巴 古雷格尔人 机械哥莫拉 艾安隆 雷德王 武士圣剑 杰顿 维克特利 盖亚 乔尼亚斯 金古桥 奥特之父 镜子骑士 加坦杰厄',warrior:'初代 阿斯特拉 红莲火焰 戴拿 赛罗 贝利亚 奈克瑟斯 阿古茹 捷德 雷欧 安奇 梦比优斯 响裕太 泽塔 泰罗',shooter:'詹伯特 达克戈内 邪恶迪迦 欧布 麦克斯 黑暗洛普斯 新条茜 詹奈',mage:'阿诺西拉斯 庞顿 艾斯 迪迦 佐菲 亚波人 银河 托雷基亚',assassin:'马格马星人 基里艾洛德人 艾斯杀手',support:'皮古蒙 内海将 宝多六花 赛文 爱迪 巴尔坦星人 希卡利 高斯'};
export const unitRole=name=>Object.keys(roleGroups).find(r=>roleGroups[r].split(' ').includes(name))??'front';
export const luckyPools={front:['荆棘甲','磐石甲','生命铠','龙鳞披风','坚心甲','守誓战甲'],warrior:['噬光剑','泰坦战甲','无尽战刃','均衡护手','狂怒刃','斗魂臂铠'],shooter:['狂怒刃','破甲光弩','无尽战刃','分裂光弩','巨兽猎刃','赤焰弩'],mage:['蓝晶符','战意长枪','光辉冠','星辉护手','大天使杖','光能枪刃'],assassin:['噬光剑','无尽战刃','均衡护手','泰坦战甲','夜幕战衣','水银护符'],support:['蓝晶符','救赎坠饰','应变头盔','战意长枪','守誓战甲','生命铠']};
export function initAugmentSpecials(s,a){
 s.resonances=[];s.augmentZones=[];
 for(const side of [0,1]){const team=s.units.filter(u=>u.side===side&&!u.special),config=team[0]?.matchEffects??{};
 const counts=s.traits[side].counts;
 if((counts['金属狂潮']??0)>=3&&config.augments?.includes('钢铁驾驭')){
 const rank=a.tier(counts,'金属狂潮'),values=[[1500,65,45,300,180],[1900,80,55,450,240],[2400,100,65,600,320],[3000,125,80,800,440],[4000,170,110,1100,650]][rank];
 const pilot=team.find(u=>u.instanceId===config.pilotId&&u.traits.includes('金属狂潮'));
 const pos=config.robotPosition??{x:side===0?0:6,y:side===0?4:3};
 const occupied=s.units.some(u=>live(u)&&u.x===pos.x&&u.y===pos.y&&u!==pilot);let position=pos;
 if(occupied)position=Array.from({length:28},(_,i)=>({x:i%7,y:(side===0?4:0)+Math.floor(i/7)})).find(p=>!s.units.some(u=>live(u)&&u.x===p.x&&u.y===p.y));
 if(position){const robot=a.makeUnit({name:'驾驭机器人',cost:0,traits:[],hp:values[0],ad:values[1],as:.65,armor:values[2],mr:values[2],range:2,mana:[30,90]}, {...position,side,star:1},'robot-'+(++s.counter));robot.special=true;robot.robot=true;robot.robotShield=values[3];robot.robotDamage=values[4];robot.driver=pilot?.id;robot.robotRank=rank;
 if(pilot){const q=[1,1.5,2][pilot.star-1];pilot.openingKills=pilot.permanent.kills;pilot.robotId=robot.id;pilot.pilotQ=q;Object.assign(pilot,position);robot.maxHp*=1+[.1,.15,.2][pilot.star-1];robot.hp=robot.maxHp;robot.amp+=[.05,.1,.15][pilot.star-1];a.shield(s,pilot,[150,250,400][pilot.star-1],8,'pilot');
 switch(pilot.name){case '詹伯特':case '机械哥莫拉':pilot.pilotSkillAmp=.15*q;break;case '金古桥':pilot.augShieldPower=(pilot.augShieldPower??0)+.2*q;robot.armor+=15*q;robot.mr+=15*q;break;case '艾斯杀手':pilot.sampleMultiplier=1+.2*q;break;case '黑暗洛普斯':break;
 default:robot.robotRole=unitRole(pilot.name);switch(robot.robotRole){case 'front':pilot.armor+=15*q;pilot.mr+=15*q;robot.robotShield*=1+.25*q;break;case 'warrior':pilot.adBonus+=.15*q;break;case 'shooter':pilot.asBonus+=.15*q;robot.range=4;robot.adBonus+=.1*q;break;case 'mage':pilot.ap+=15*q;robot.robotSkillAmp=.3*q;break;case 'assassin':pilot.omni+=.1*q;break;case 'support':if(pilot.maxMana)pilot.mana+=10*q;break;}}
 }s.units.push(robot);a.event(s,'summon',pilot,robot);}
 }
 }
}
export function augmentSpecialCast(s,u,v,a){
 if(u.robot){a.shield(s,u,u.robotShield,5,'robot');for(const w of s.units.filter(w=>w.side!==u.side&&live(w)&&a.distance(w,v)<=1)){a.hit(s,u,w,u.robotDamage*(1+(u.robotSkillAmp??0))*a.stats(u).ap/100,'magic');if(!(w.immuneUntil>s.time))w.stunUntil=Math.max(w.stunUntil,s.time+.75);}if(u.robotRole==='support'){const driver=s.units.find(w=>w.id===u.driver&&live(w));if(driver){const other=s.units.filter(w=>w.side===u.side&&live(w)&&!w.special&&w!==driver).sort((x,y)=>a.distance(u,x)-a.distance(u,y))[0];for(const w of [driver,other].filter(Boolean))a.shield(s,w,100*driver.pilotQ,4,'robot-support');}}return true;}
 if(has(u,'一心同体')&&u.instanceId===u.matchEffects?.resonanceId&&s.traits[u.side].summoner>=0){const pets=s.units.filter(w=>w.owner===u.id&&live(w)&&['米克拉斯','巴尔坦分身','双首火焰兽','光能支援兽'].includes(w.name));for(const pet of pets){if(s.resonances.some(e=>e.source===pet.id))continue;s.resonances.push({source:pet.id,owner:u.id,target:v.id,position:{x:v.x,y:v.y},at:Math.max(s.time+.05,pet.busyUntil??0),star:u.star});}}
 if(u.robotId){const robot=s.units.find(w=>w.id===u.robotId&&live(w)),q=u.pilotQ;if(robot){if(u.name==='詹伯特')for(const [i,w] of a.lineTargets(s,robot,v).entries())a.hit(s,robot,w,a.stats(robot).ad*1.6*q*(i? .5:1),'physical',{augment:true});if(u.name==='机械哥莫拉')for(const w of s.units.filter(w=>w.side!==u.side&&live(w)&&a.distance(robot,w)<=1)){a.hit(s,robot,w,100*q,'magic',{augment:true});if(!(w.immuneUntil>s.time))w.stunUntil=Math.max(w.stunUntil,s.time+.5);}}}
 return false;
}
export function augmentSpecialAttack(s,u,v,a){
 const robot=u.robotId&&s.units.find(w=>w.id===u.robotId&&live(w));if(robot&&u.name==='黑暗洛普斯'&&u.lopuzShots>=0&&u.pilotEnhancedAttack)a.hit(s,robot,v,a.stats(robot).ad*.6*u.pilotQ,'magic',{augment:true,noCrit:true});
 if(u.robot){const pilot=s.units.find(w=>w.id===u.driver);if(pilot?.name==='金古桥')for(const w of s.units.filter(w=>w.side!==u.side&&live(w)&&w!==v&&a.distance(v,w)<=1))a.hit(s,u,w,a.stats(u).ad*.35*pilot.pilotQ,'physical',{augment:true,noCrit:true});}
}
export function tickAugmentSpecials(s,a){
 for(const robot of s.units.filter(u=>u.robot&&live(u))){const driver=s.units.find(w=>w.id===robot.driver&&live(w));if(driver){if(s.time>=driver.busyUntil)Object.assign(driver,{x:robot.x,y:robot.y});if(driver.name==='黑暗洛普斯')a.buff(s,driver,'pilot-speed',.1,{as:driver.lopuzShots>0?.15*driver.pilotQ:0});if(robot.robotRole==='assassin'&&driver.permanent.kills>(driver.openingKills??driver.permanent.kills)&&!robot.pilotKillBuff){robot.pilotKillBuff=true;a.buff(s,robot,'pilot-assassin',6,{as:.25*driver.pilotQ});}if(driver.name==='艾斯杀手'&&(driver.sampleTarget||driver.star===3)){for(const [k,field] of [['baseAd','sampleShareAd'],['ap','sampleShareAp'],['armor','sampleShareArmor'],['mr','sampleShareMr']]){const amount=Math.min(30,Math.max(0,driver[k]-(driver.openingSnapshot?.[k]??driver[k]))*.25);robot[k]+=amount-(robot[field]??0);robot[field]=amount;}}}}
 const ready=s.resonances.filter(e=>e.at<=s.time);s.resonances=s.resonances.filter(e=>e.at>s.time);
 for(const e of ready){const pet=s.units.find(u=>u.id===e.source),owner=s.units.find(u=>u.id===e.owner&&live(u)),v=s.units.find(u=>u.id===e.target&&live(u));if(!pet||!live(pet)||!owner)continue;if(pet.busyUntil>s.time){s.resonances.push({...e,at:pet.busyUntil});continue;}const mul=pet.summonMultiplier??1,scale=a.stats(pet).ap/100*mul,index=e.star-1;
 if(pet.name==='米克拉斯')for(const w of s.units.filter(w=>w.side!==pet.side&&live(w)&&a.distance(pet,w)<=1)){a.hit(s,pet,w,[100,150,250][index]*scale,'magic',{augment:true});if(!(w.immuneUntil>s.time))w.stunUntil=Math.max(w.stunUntil,s.time+.5);}
 if(pet.name==='巴尔坦分身'&&v)for(const w of a.lineTargets(s,pet,v).filter(w=>a.distance(pet,w)<=2))a.hit(s,pet,w,[80,120,200][index]*scale,'magic',{augment:true});
 if(pet.name==='双首火焰兽'){s.augmentZones=s.augmentZones.filter(z=>z.owner!==owner.id);s.augmentZones.push({owner:owner.id,source:pet.id,side:pet.side,position:e.position,damage:[50,75,125][index]*scale,next:s.time+1,until:s.time+3});}
 if(pet.name==='光能支援兽'){const w=s.units.filter(w=>w.side===pet.side&&live(w)&&!w.special).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];if(w)a.shield(s,w,[180,270,500][index]*scale,5,'resonance-'+owner.id);}
 a.event(s,'resonance',pet,v);
 }
 for(const z of s.augmentZones){if(s.time+1e-8>=z.next&&z.next<=z.until+1e-8){z.next++;const source=s.units.find(u=>u.id===z.source);if(source)for(const w of s.units.filter(w=>w.side!==z.side&&live(w)&&a.distance(z.position,w)<=1))a.hit(s,source,w,z.damage,'magic',{augment:true,noCrit:true});}}s.augmentZones=s.augmentZones.filter(z=>z.until>=s.time);
}
