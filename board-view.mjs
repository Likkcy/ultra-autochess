import {previewTeam,previewMetal,previewNeutrals,roundKind} from './match.mjs';

// Scouting is explicit UI state, never an automatically selected opponent.
export function preparationBoard(g,scoutId=0){
 const id=g.players.some(p=>p.id===scoutId)?scoutId:0;
 const scouting=id!==0;
 const neutrals=!scouting&&g.phase==='prepare'&&roundKind(g)==='neutral'?previewNeutrals(g):[];
 return {scoutId:id,scouting,label:scouting?'侦察 · '+g.players[id].name:neutrals.length?'野怪':'—',
  placements:[...previewTeam(g,id,scouting?1:0),...previewMetal(g,id,scouting?1:0),...neutrals]};
}

export function ownedInspection(g,unit,scoutId=0){
 if(scoutId!==0||unit.side===1||unit.neutral||unit.special||unit.previewMetal)return null;
 return g.players[0].units.find(u=>u.id===(unit.instanceId??unit.id))??null;
}
