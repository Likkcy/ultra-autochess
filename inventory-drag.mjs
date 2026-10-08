const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Delegated pointer handling survives inventory rerenders and preserves ordinary clicks.
export function mountInventoryDrag({container,selector,indexOf,getItems,editable,recipe,describe,combine,external}){
 let drag=null,suppress=0;const tip=document.createElement('div');tip.className='craft-preview';tip.hidden=true;tip.setAttribute('role','status');document.body.append(tip);
 function clean(){container.querySelectorAll('.craft-target').forEach(b=>b.classList.remove('craft-target'));tip.hidden=true;drag=null;}
 function target(e){return document.elementFromPoint(e.clientX,e.clientY)?.closest(selector);}
 container.addEventListener('pointerdown',e=>{const b=e.target.closest(selector);if(!b||!editable()||e.button!==0)return;drag={index:indexOf(b),name:getItems()[indexOf(b)],x:e.clientX,y:e.clientY,active:false};});
 container.addEventListener('dragstart',e=>{if(e.target.closest(selector))e.preventDefault();});
 document.addEventListener('pointermove',e=>{if(!drag)return;if(!drag.active&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;drag.active=true;e.preventDefault();container.querySelectorAll('.craft-target').forEach(b=>b.classList.remove('craft-target'));const b=target(e),i=b&&container.contains(b)?indexOf(b):-1,result=i>=0&&i!==drag.index?recipe(drag.name,getItems()[i]):null;tip.hidden=false;tip.style.left=Math.min(e.clientX+18,innerWidth-300)+'px';tip.style.top=Math.min(e.clientY+18,innerHeight-180)+'px';if(result){b.classList.add('craft-target');const d=describe(result);tip.innerHTML=`<small>松手合成</small><b>${esc(result)}</b><p>${esc(d.stats)}</p><p>${esc(d.effect)}</p>`;}else tip.innerHTML=`<b>${esc(drag.name)}</b><small>${i===drag.index?'':i>=0?'无法合成':'拖到组件或棋子上'}</small>`;},{passive:false});
 document.addEventListener('pointerup',e=>{if(!drag)return;const d=drag,b=target(e),i=b&&container.contains(b)?indexOf(b):-1;clean();if(!d.active)return;suppress=Date.now()+250;e.preventDefault();e.stopImmediatePropagation();if(!editable()||getItems()[d.index]!==d.name)return;if(i>=0){if(i!==d.index&&recipe(d.name,getItems()[i]))combine(d.index,i);}else external?.(d.index,e);},true);
 document.addEventListener('pointercancel',clean);window.addEventListener('blur',clean);
 container.addEventListener('click',e=>{if(Date.now()<suppress){e.preventDefault();e.stopImmediatePropagation();}},true);
}
