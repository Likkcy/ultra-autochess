export const kingDefinition={name:'奥特之王',cost:0,traits:[],hp:30000,ad:800,as:1.2,armor:160,mr:160,range:4,mana:[100,100],star:4,skill:'王者裁决：眩晕全体敌人4秒，随后每0.55秒依次击飞一名敌人，造成12000＋目标最大生命50%的真实伤害，并眩晕1.5秒。控制免疫可抵抗眩晕。',passive:'获得65%减伤和整场控制免疫。普攻造成三倍攻击力伤害。'};
export const metalDefinitions=[{name:'乌英达姆',threshold:5,hp:1000,ad:50,as:.6,armor:45,mr:45,range:1,mana:[30,90],skill:'获得350/525/875护盾，持续5秒；对目标造成200/300/500魔法伤害并眩晕1秒。'},{name:'英普莱扎',threshold:7,hp:900,ad:65,as:.65,armor:35,mr:35,range:3,mana:[20,80],skill:'连续发射三轮炮击，每轮造成120%攻击力的物理伤害。'},{name:'加拉特隆',threshold:9,hp:1400,ad:70,as:.65,armor:50,mr:50,range:3,mana:[40,110],skill:'光线对路径敌人造成450/675/1125魔法伤害，降低20%攻速，持续4秒。'}];
export function metalDefinition(d,count){const star=count>=10?3:1;return {...d,cost:0,traits:[],star,hp:d.hp*(star===3?3.24*1.8:1),ad:d.ad*(star===3?2.25:1),amp:star===3?.6:0};}
export function prismaticTrait(name,count,world=false,stars=0){return name==='银河警备队'?count>=11:name==='金属狂潮'?count>=10:name==='人工智能'?count>=9:name==='古利特'?count>=7&&world&&stars>=14:false;}
const alive=u=>!u.dead&&u.hp>0;
export function initRoyalFusion(s,a){
 for(const side of [0,1]){if((s.traits[side].counts['银河警备队']??0)<11)continue;
  const members=s.units.filter(u=>u.side===side&&!u.special&&u.traits.includes('银河警备队'));
  s.royalFusions??=[];s.royalFusions.push({side,members:members.map(u=>u.id),at:1.2,done:false});s.traits[side].beam=true;
  for(const u of members){u.fusing=true;u.fusionCenter={x:3,y:side===0?4:3};u.untargetableUntil=1.2;u.busyUntil=1.2;}
  a.event(s,'fusion-start',members[0],null,{side});
 }
}
export function castKing(s,u,a){
 const targets=s.units.filter(v=>v.side!==u.side&&alive(v));
 for(const v of targets)if(!(v.immuneUntil>s.time))v.stunUntil=Math.max(v.stunUntil,s.time+4);
 u.kingTargets=targets.sort((v,w)=>w.maxHp-v.maxHp||v.id.localeCompare(w.id)).map(v=>v.id);u.kingNext=s.time+.35;
 u.busyUntil=Math.max(u.busyUntil,s.time+.45+Math.max(0,targets.length-1)*.55);
 a.event(s,'royal-judgment',u,null);
}
export function tickRoyalFusion(s,a){
 for(const f of s.royalFusions??[]){if(f.done||s.time<f.at)continue;f.done=true;
  for(const u of s.units.filter(u=>f.members.includes(u.id))){u.fusing=false;u.fused=true;u.hp=0;u.dead=true;u.killCredited=true;u.reviveAt=0;u.effects=[];}
  // Personal companions join their owners; independent trait summons remain.
  for(const u of [...s.units,...(s.waitingUnits??[])])if(f.members.includes(u.owner)&&['米克拉斯','巴尔坦分身','双首火焰兽','光能支援兽'].includes(u.name)){u.fused=true;u.hp=0;u.dead=true;}
  s.waitingUnits=(s.waitingUnits??[]).filter(u=>!u.fused);s.queue=s.queue.filter(e=>!f.members.includes(e.source));
  const used=new Set(s.units.filter(alive).map(u=>u.x+','+u.y)),positions=[];
  for(let y=f.side===0?4:0;y<(f.side===0?8:4);y++)for(let x=0;x<7;x++)positions.push({x,y});
  const center={x:3,y:f.side===0?4:3};positions.sort((p,q)=>a.distance(p,center)-a.distance(q,center)||p.y-q.y||p.x-q.x);
  const position=positions.find(p=>!used.has(p.x+','+p.y));
  const king=a.makeUnit(kingDefinition,{...position,side:f.side,star:1},'king-'+(++s.counter));
  Object.assign(king,{star:4,special:true,royal:true,definition:kingDefinition,dr:.65,immuneUntil:60});s.units.push(king);
  a.event(s,'fusion-complete',king,null,{members:f.members,side:f.side});
 }
 for(const u of s.units.filter(u=>u.royal&&alive(u))){if(!u.kingTargets?.length||s.time<u.kingNext)continue;
  let target;while(u.kingTargets.length&&!target){const v=a.lookup(s,u.kingTargets.shift());if(v&&alive(v))target=v;}if(!target)continue;
  u.kingNext=s.time+.55;a.hit(s,u,target,12000+target.maxHp*.5,'true',{noCrit:true,fixedDamage:true});
  target.airborneUntil=s.time+.65;if(!(target.immuneUntil>s.time))target.stunUntil=Math.max(target.stunUntil,s.time+1.5);
  a.event(s,'royal-launch',u,target);
 }
}
