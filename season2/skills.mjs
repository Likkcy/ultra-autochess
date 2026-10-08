import {skills} from './content.mjs';
const n=(u,v)=>Array.isArray(v)?v[Math.min(3,u.star)-1]:v;
const has=(u,n)=>u.matchEffects?.augments?.includes(n);
export function initPassives(s,a){for(const u of s.units){if(u.special)continue;const star=u.star,allies=a.allies(s,u);if(u.cost===5&&star===3){u.terminal=true;u.maxHp+=10000;u.hp=u.maxHp;u.immuneUntil=60;if(['迪迦','迫水真吾','银河'].includes(u.name))for(const w of allies)a.shield(s,w,w.maxHp*3,60,'terminal-'+u.id);}
 if(u.name==='阿古茹')u.dr=1-(1-u.dr)*(1-n(u,[.15,.2,.8]));
 if(u.name==='美菲拉斯星人'){const v=a.enemies(s,u).sort((x,y)=>y.cost-x.cost||y.star-x.star||x.id.localeCompare(y.id))[0];if(v){u.contract=v.id;const q=n(u,[.15,.2,.8]),st=a.stats(v);a.buff(s,v,'contract-'+u.id,60,{ad:-q,ap:-st.ap*q,as:-q});u.baseAd+=st.ad*q;u.ap+=st.ap*q;u.asBonus+=q;}}
 if(u.name==='迫水真吾'){const mode=u.matchEffects.command??'突击';for(const w of allies)a.buff(s,w,'command-'+u.id,60,mode==='坚守'?{armor:n(u,[20,30,150]),mr:n(u,[20,30,150])}:{ad:n(u,[.12,.18,1]),ap:n(u,[12,18,100])});}
 if(u.name==='巴罗萨星人'){const choices=a.enemies(s,u).flatMap(w=>w.items).filter(name=>s.normalEquipment.has(name));u.lootWeapon=choices[Math.floor(s.random()*choices.length)];if(u.lootWeapon){s.copyGear(s,u,u.lootWeapon);}else{u.adBonus+=.25;u.asBonus+=.25;}}
 }}
export function castSkill(s,u,v,a){let k=skills[u.name];if(u.special){if(u.name==='遗迹守卫')return;if(u.neutral){a.hit(s,u,v,u.def.spell??100,'magic');return;}return;}if(!k)throw Error('技能缺失：'+u.name);k={...k};if(u.name==='奈克瑟斯'&&u.cost===4)k={...k,p:[2.2,3.3,5.3],shield:[260,390,630],growthShield:3};if(u.name==='奈克瑟斯'&&u.cost===5)k={name:'诺亚闪电',p:[3.5,5.25,999],m:[300,450,99999],line:true,hpShield:[.35,.45,3],duration:4};
 if(has(u,'无尽一刀')&&u.hero&&u.name==='扎姆夏'){u.adBonus+=.06;return;}
 if(has(u,'双星连舞')&&u.hero&&u.name==='阿斯特拉')delete k.as;
 if(has(u,'远灵圣歌')&&u.hero&&u.name==='幽怜'){k.m=k.m.map(v=>v*(u.hymn?2.7:1.8));u.hymn=false;delete k.bounce;}
 if(has(u,'归来的英雄')&&u.hero&&u.name==='杰克')delete k.p;
 if(has(u,'深海猎食者')&&u.hero&&u.name==='萨德拉'){k.p=k.p.map(v=>v*.65);k.shots=2;delete k.leech;}
 const duration=k.duration??4,st=a.stats(u),factor=u.spellFactor??1,mg=value=>a.magic(u,n(u,value))*factor,phys=value=>st.ad*n(u,value)*factor;
 let center=v;if(k.dense){center=a.enemies(s,u).sort((x,y)=>a.enemies(s,u).filter(w=>a.distance(w,y)<=1).length-a.enemies(s,u).filter(w=>a.distance(w,x)<=1).length||x.id.localeCompare(y.id))[0]??v;}if(k.selfCenter)center=u;
 let targets=k.cone?a.coneTargets(s,u,v):k.line?a.lineTargets(s,u,v):k.aoe!==undefined?a.enemies(s,u).filter(w=>a.distance(center,w)<=k.aoe):[v];if(u.terminal)targets=a.enemies(s,u);
 if(u.name==='迪迦'&&(u.castCount>=3||u.terminal)){if(!u.shining){u.shining=true;u.ap+=n(u,[35,50,300]);u.dr=1-(1-u.dr)*(1-n(u,[.15,.2,.9]));}targets=u.terminal?a.enemies(s,u):a.enemies(s,u).filter(w=>a.lineTargets(s,u,v).includes(w)||a.distance(w,v)<=1);}
 if(k.dash){const free=a.neighbors(v).filter(p=>a.distance(p,u)<=k.dash+1&&!s.units.some(w=>a.live(w)&&w.x===p.x&&w.y===p.y)).sort((x,y)=>a.distance(u,x)-a.distance(u,y));if(free[0])Object.assign(u,free[0]);}
 const friends=a.allies(s,u).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.id.localeCompare(y.id)),support=k.support?friends.slice(0,k.support):[u];
 if(k.shield){let value=mg(k.shield)+(k.growthShield?(u.permanent.ad??0)*k.growthShield:0);if(u.name==='卡内贡')value*=1+Math.min(5,Math.floor((u.matchEffects.gold??0)/10))*.04;for(const w of support){const onCore=(u.matchEffects.cores??[]).some(c=>a.distance(w,c)<=1);a.shield(s,w,value*(u.name==='诺恩马尔特'&&onCore?1.25:1),duration,'skill-'+u.id);}if(k.selfShield)a.shield(s,u,value*k.selfShield,duration,'skill-self');}
 if(k.hpShield)a.shield(s,u,u.maxHp*n(u,k.hpShield),duration,'skill-'+u.id);
 if(k.heal)for(const w of support){const value=mg(k.heal),missing=w.maxHp-w.hp;a.heal(s,w,value);if(u.name==='高斯'){a.shield(s,w,Math.min(w.maxHp*.2,Math.max(0,value-missing)),4,'cosmos');w.buffs=w.buffs.filter(b=>(b.as??0)>=0&&(b.output??0)>=0);}}
 if(k.regen)u.effects.push({kind:'regen',until:s.time+duration,next:s.time+1,value:mg(k.regen)});
 const own={};for(const [field,key] of [['as','as'],['dr','dr'],['omni','omni']])if(k[field])own[key]=n(u,k[field]);if(k.omni){u.skillOmniBase??=u.omni;u.omni=u.skillOmniBase+n(u,k.omni);u.omniUntil=s.time+duration;delete own.omni;}if(k.res&&!k.support){own.armor=n(u,k.res);own.mr=n(u,k.res);}a.buff(s,u,'skill-own',duration,own);
 if(k.attackShots)u.shots={remaining:k.shotCount,coefficient:n(u,k.attackShots),pen:k.pen??0,pierce:k.pierce??0,until:s.time+duration};if(k.magicShots)u.magicShots={remaining:3,value:mg(k.magicShots)};if(k.onhit)u.onhit={coefficient:n(u,k.onhit),until:s.time+duration};
 if(k.allyAS||k.allyAP||k.res&&k.support)for(const w of support)a.buff(s,w,'support-'+u.id,duration,{as:n(u,k.allyAS??0),ap:n(u,k.allyAP??0),armor:n(u,k.res??0),mr:n(u,k.res??0)});
 if(k.allyAD){const w=a.allies(s,u).filter(w=>w!==u).sort((x,y)=>y.range-x.range||a.distance(u,x)-a.distance(u,y))[0]??u;a.buff(s,w,'ally-ad-'+u.id,duration,{ad:n(u,k.allyAD)});}
 if(k.allyMana){const receivers=u.name==='大田结花'?a.allies(s,u).filter(w=>w.attackTarget===v.id):u.name==='梅特龙星人'?a.allies(s,u).filter(w=>w!==u&&w.maxMana).sort((x,y)=>x.mana/x.maxMana-y.mana/y.maxMana).slice(0,1):support;for(const w of receivers)a.mana(s,w,n(u,k.allyMana));}
 for(let shot=0;shot<(k.shots??1);shot++)for(const w of targets){let multiplier=k.splash&&w!==v?k.splash:1;if(k.execute&&w.hp/w.maxHp<(u.name==='博伽茹'?.35:.4))multiplier*=1+k.execute;if(k.p)a.hit(s,u,w,phys(k.p)*multiplier,'physical',{skillHeal:n(u,k.leech??0),area:targets.length>1});if(k.m&&!(has(u,'极寒海域')&&u.hero&&u.name==='雷丘巴斯'))a.hit(s,u,w,(mg(k.m)+(k.growthDamage?(u.permanent.hp??0)*k.growthDamage:0))*multiplier,'magic',{area:targets.length>1});if(k.mLast&&shot===(k.shots??1)-1)a.hit(s,u,w,mg(k.mLast),'magic');if(k.stun)a.stun(s,w,n(u,k.stun));if(u.name==='加坦杰厄')a.stun(s,w,1.5);if(k.slow)a.buff(s,w,'slow-'+u.id,3,{as:-k.slow});if(k.shred)a.buff(s,w,'shred-'+u.id,duration,{armorPct:k.shred});if(k.vuln)a.buff(s,w,'vuln-'+u.id,duration,{[k.physicalVuln?'physicalVuln':'vuln']:n(u,k.vuln)});if(k.weaken)a.buff(s,w,'weak-'+u.id,duration,{output:-n(u,k.weaken)});if(k.drain)w.mana=Math.max(0,w.mana-n(u,k.drain));if(k.parasite){w.parasiteUntil=s.time+duration;w.parasiteOwner=u.id;}}
 if(k.lineMagic)for(const w of (u.terminal?a.enemies(s,u):a.lineTargets(s,u,v)))a.hit(s,u,w,mg(k.lineMagic),'magic');
 if(k.bounce)for(const w of a.enemies(s,u).filter(w=>w!==v).sort((x,y)=>a.distance(v,x)-a.distance(v,y)).slice(0,k.bounce))a.hit(s,u,w,mg(k.m)*k.splash,'magic');
 if(k.returning)for(const w of a.lineTargets(s,u,v))a.hit(s,u,w,phys(k.p)*(k.shots??1)*k.returning,'physical');if(k.pierce&&k.p)for(const w of a.lineTargets(s,u,v).filter(w=>w!==v))a.hit(s,u,w,phys(k.p)*(k.shots??1)*k.pierce,'physical');
 if(k.dot||k.delayed){u.effects=u.effects.filter(e=>e.kind!=='zone');u.effects.push({kind:'zone',position:{x:center.x,y:center.y},radius:k.aoe??1,until:s.time+duration,next:s.time+1,value:k.dot?mg(k.dot):0,final:k.delayed?mg(k.delayed):0,selfCenter:k.selfCenter||u.name==='塔贡',weaken:k.weaken??0});}
 if(u.name==='高斯')a.buff(s,v,'cosmos-weak',4,{output:-n(u,k.weaken)});
 if(u.name==='麦克斯')u.imagesUntil=s.time+6;if(u.name==='迪迦')u.tigaHit=true;if(u.name==='杰克'&&u.hero&&has(u,'归来的英雄'))u.jackRingUntil=s.time+duration;
 if(has(u,'极寒海域')&&u.hero&&u.name==='雷丘巴斯'){u.effects.push({kind:'cryo',until:s.time+2,next:s.time+.5,hits:0,targets:targets.map(w=>w.id),value:mg(k.m)*.35});}
}
export function attackPassive(s,u,v,a,extra){let coefficient=1;const nval=v=>n(u,v);if(u.shots?.remaining&&u.shots.until>s.time){coefficient=u.shots.coefficient;if(!extra)u.shots.remaining--;if(u.shots.pen&&u.shots.remaining===0)a.buff(s,v,'shot-pen',.1,{armorPct:u.shots.pen});if(u.shots.pierce)for(const w of a.lineTargets(s,u,v).filter(w=>w!==v))a.hit(s,u,w,a.stats(u).ad*coefficient*u.shots.pierce,'physical');}
 if(u.onhit?.until>s.time)coefficient+=u.onhit.coefficient;
 if(u.magicShots?.remaining){a.hit(s,u,v,u.magicShots.value,'magic');if(!extra)u.magicShots.remaining--;}
 if(u.special){if(u.name==='遗迹守卫'&&!extra&&u.attacks%5===0)for(const w of a.enemies(s,u).filter(w=>a.distance(w,u)<=1)){a.hit(s,u,w,u.def.spell,'magic');a.stun(s,w,.75);}return coefficient;}
 if(u.name==='杰克'&&u.shields.some(sh=>sh.amount>0))a.hit(s,u,v,u.maxHp*nval([.02,.03,.05]),'physical');
 if(u.name==='幽怜'&&v.church?.until>s.time)a.mana(s,u,nval([2,3,5]));
 if(['卡蜜拉','雷丘巴斯'].includes(u.name)&&(u.name==='卡蜜拉'?v.church?.until>s.time:v.buffs.some(b=>(b.as??0)<0)))a.hit(s,u,v,a.magic(u,nval(u.name==='卡蜜拉'?[25,40,70]:[25,40,70])),'magic');
 if(u.name==='乔尼亚斯'&&(u.hitCount??0)>=(u.consumedHits??0)+6){u.consumedHits=(u.consumedHits??0)+6;a.hit(s,u,v,u.maxHp*nval([.03,.04,.06]),'magic');}
 if(u.name==='布莱泽'&&(u.sameHits??0)%4===0)a.hit(s,u,v,a.magic(u,nval([60,90,150])),'magic');
 if(u.name==='帝国星人')a.buff(s,u,'imperial-focus',60,{amp:Math.min(3,Math.floor((u.sameHits??0)/3))*nval([.04,.06,.1])});
 if(u.name==='阿古茹'&&!extra&&u.shields.some(sh=>sh.amount>0))a.heal(s,u,u.maxHp*nval([.02,.03,.1]));
 if(u.name==='麦克斯'&&u.imagesUntil>s.time)a.hit(s,u,v,a.stats(u).ad*nval([.7,1,3]),'physical');
 if(u.name==='迪迦'&&u.tigaHit){u.tigaHit=false;a.hit(s,u,v,a.magic(u,nval([100,150,2000])),'magic');}
 if(extra)return coefficient;
 if(u.name==='阿斯特拉'){if(u.hero&&has(u,'双星连舞'))u.asBonus+=.03;if(u.attacks%(u.hero&&has(u,'双星连舞')?3:4)===0)for(const w of a.lineTargets(s,u,v))a.hit(s,u,w,a.stats(u).ad*nval([.8,1.2,2]),'physical');}
 if(u.name==='扎姆夏'&&u.attacks%4===0)a.hit(s,u,v,a.stats(u).ad*nval([.4,.6,1]),'physical',{pen:u.hero&&has(u,'无尽一刀')?.3:0});
 if(u.name==='赛罗'&&u.attacks%3===0)a.buff(s,u,'zero-as',2,{as:nval([.2,.3,.45])});
 if(u.name==='梦比优斯'&&u.onhit?.until>s.time&&u.attacks%3===0)for(const w of a.enemies(s,u).filter(w=>a.distance(w,v)<=1))a.hit(s,u,w,a.stats(u).ad*nval([1,1.5,2.5]),'physical',{area:true});
 return coefficient;}
export function deathPassive(s,u,a){if(u.name==='伽古拉'&&!u.demon){u.demon=true;u.hp=u.maxHp*n(u,[.4,.6,1]);u.invulnerableUntil=s.time+.75;u.asBonus+=n(u,[.3,.45,2]);u.dr=1-(1-u.dr)*(1-n(u,[.15,.2,.9]));a.event(s,'revive',u,u);return true;}return false;}
export function tickPassives(s,a){for(const u of s.units){if(u.omniUntil&&s.time>=u.omniUntil){u.omni=u.skillOmniBase;u.omniUntil=0;}if(a.live(u)&&u.name==='盖亚')a.buff(s,u,'gaia-shield',.1,{dr:u.shields.some(sh=>sh.amount>0)?n(u,[.15,.18,.25]):0});if(a.live(u)&&u.name==='拉贡')a.buff(s,u,'ragon-low',.1,{as:u.hp/u.maxHp<.5?n(u,[.1,.15,.25]):0});if(a.live(u)&&u.name==='杰克'&&u.jackRingUntil>s.time&&s.tick%20===0)for(const w of a.enemies(s,u).filter(w=>a.distance(u,w)<=1))a.hit(s,u,w,a.stats(u).ad*n(u,[1.6,2.4,3.9])+(u.shields.some(sh=>sh.amount>0)?u.maxHp*n(u,[.02,.03,.05]):0),'physical');
 if(u.compassMana&&s.time>=u.lockUntil){a.mana(s,u,u.compassMana);u.compassMana=0;}for(const e of u.effects){if(e.kind==='cryo'&&u.stunUntil>s.time){e.ended=true;continue;}if(e.kind==='cryo'&&a.live(u)&&e.next<=s.time&&s.time<=e.until+1e-8){e.next+=.5;e.hits++;for(const id of e.targets){const w=a.lookup(s,id);if(w&&a.live(w)){a.hit(s,u,w,e.value,'magic');if(e.hits===4)a.stun(s,w,1);}}}if(e.kind==='regen'&&a.live(u)&&e.next<=s.time&&s.time<=e.until+1e-8){e.next+=1;a.heal(s,u,e.value);}if(e.kind==='zone'&&a.live(u)){const center=e.selfCenter?u:e.position;if(e.next<=s.time&&s.time<=e.until+1e-8){e.next+=1;for(const w of a.enemies(s,u).filter(w=>a.distance(center,w)<=e.radius))a.hit(s,u,w,e.value,'magic',{area:true});}if(s.time>=e.until&&!e.ended){e.ended=true;for(const w of a.enemies(s,u).filter(w=>a.distance(center,w)<=e.radius)){a.hit(s,u,w,e.final,'magic',{area:true});if(e.weaken)a.buff(s,w,'zone-weak',3,{output:-e.weaken});}}}if(e.kind==='remnant'&&e.next<=s.time&&s.time<=e.until){e.next+=2;const target=s.units.filter(w=>w.side!==u.side&&a.live(w))[0];if(target)for(const w of s.units.filter(w=>w.side!==u.side&&a.live(w)&&a.distance(w,target)<=1))a.hit(s,{...u,dead:false},w,a.magic(u,n(u,[450,700,99999]))*n(u,[.4,.6,1]),'magic');}}
 u.effects=u.effects.filter(e=>e.until>=s.time&&!e.ended);
 }}
