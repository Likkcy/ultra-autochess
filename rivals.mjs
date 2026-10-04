export const reconciliation={id:'aug-reconciliation',name:'世纪和解',tier:'金',category:'羁绊强化',nodes:['2-1'],effect:'赛罗与贝利亚可以共同激活宿敌。任意一方参与击杀时，双方共享该次进度；同一敌人只计一次。贝利亚参与击败敌方赛罗时，该次进度计2次。',scope:'宿敌',trait:'宿敌',minimumMembers:1};
export function rivalActive(units){const team=units.filter(u=>!u.special&&!u.mirror&&['赛罗','贝利亚'].includes(u.name));const names=new Set(team.map(u=>u.name));return names.size===1||names.size===2&&team.some(u=>u.matchEffects?.augments?.includes('世纪和解'));}
export function creditRivalParticipation(s,v){
 if(v.special||v.mirror||v.rivalCredited)return;v.rivalCredited=true;
 const participants=new Set(Object.keys(v.participants??{}));if(v.pendingKiller)participants.add(v.pendingKiller);
 for(const side of [0,1]){
  const team=s.units.filter(u=>u.side===side&&!u.special&&!u.mirror&&u.rivalActive),involved=team.filter(u=>participants.has(u.id));if(!involved.length)continue;
  const shared=team.some(u=>u.matchEffects?.augments?.includes('世纪和解'))&&new Set(team.map(u=>u.name)).size===2;
  const points=u=>u.name==='贝利亚'&&v.name==='赛罗'?2:1;
  for(const u of shared?team:involved){const n=shared?Math.max(...involved.map(points)):points(u),before=u.permanent.rivalKills??0;u.permanent.rivalKills=before+n;if(u.name==='贝利亚')u.adBonus+=(Math.floor((before+n)/8)-Math.floor(before/8))*.08;}
 }
}
