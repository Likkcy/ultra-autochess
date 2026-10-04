import {hasAugment} from './augments.mjs';
import {boosters} from './specials.mjs';
import {previewTeam,setBooster} from './match.mjs';
import {traitCounts} from './engine.mjs';
// UI resources are derived from the deployed roster, never copied into ordinary inventory.
export function traitResources(g,id=0){const p=g.players[id],team=previewTeam(g,id),counts=traitCounts(team.map(u=>({...u,traits:[...g.catalog.find(d=>d.name===u.name).traits,...u.items.filter(n=>n.endsWith('纹章')).map(n=>n.slice(0,-2))]}))),knights=counts['宇宙骑士队']??0,slots=knights>=2?(knights>=4?2:1)+(hasAugment(p,'骑士零件库')?1:0):0;return {counts,boosterSlots:slots,boosterAvailable:Math.max(0,slots-p.units.filter(u=>u.location==='board'&&u.booster).length),scienceVisible:(counts['科学家']??0)>=2||!!p.scienceOffers?.length||!!p.inventions?.length,empireVisible:(counts['银河帝国']??0)>=2};}
export function useKnightBooster(g,id,uid){const p=g.players[id],u=p.units.find(u=>u.id===uid);if(!u||u.location!=='board'||!boosters[u.name])throw Error('请拖到登场的宇宙骑士身上');if(u.booster)throw Error('这名骑士已经进化');if(!traitResources(g,id).boosterAvailable)throw Error('当前没有可用强化器');setBooster(g,id,uid,boosters[u.name]);}
