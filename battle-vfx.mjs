// Bounded, time-based effects; all artwork is drawn locally, no external assets.
export function createEffects(){
 let effects=[];
 return {
 clear(){effects=[];},
 add(kind,position,power=1){if(!position)return;const x=Number.isFinite(position.x)?position.x:3,y=Number.isFinite(position.y)?position.y:5;effects.push({kind,x,y,age:0,life:kind==='upgrade'?1.8:kind==='death'?1.1:.85,power});effects=effects.slice(-32);},
 draw(ctx,dt,center,r,reduced){if(reduced){effects=[];return;}for(const e of effects){e.age+=Math.max(0,Number.isFinite(dt)?dt:0);const p=center(e),t=e.age/e.life;if(t>=1)continue;
  ctx.save();ctx.translate(p.x,p.y);ctx.globalCompositeOperation='screen';ctx.globalAlpha=Math.sin(Math.PI*Math.min(1,t))* .85;
  const gold=['upgrade','equip','victory','loot'].includes(e.kind),color=gold?'#ffd584':e.kind==='death'?'#b6a1ee':'#8ef0ec';
  const radius=Math.max(.1,r*(.3+t*(e.power>1?2.2:1.5))),g=ctx.createRadialGradient(0,0,0,0,0,radius);g.addColorStop(0,'#fff7da');g.addColorStop(.18,color+'aa');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(-radius,-radius,radius*2,radius*2);
  ctx.shadowColor=color;ctx.shadowBlur=10;ctx.strokeStyle=color;ctx.lineWidth=1.8*(1-t)+.4;
  for(let ring=0;ring<2;ring++){ctx.beginPath();ctx.ellipse(0,0,radius*(1-ring*.25),radius*(gold?.42:.8)*(1-ring*.25),ring*.5,0,Math.PI*2);ctx.stroke();}
  if(e.kind==='cast'||e.kind==='beam'){ctx.rotate(t*.4);for(let i=0;i<3;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(-radius,0);ctx.quadraticCurveTo(0,-radius*.4,radius,0);ctx.stroke();}}
  const count=gold?18:12;for(let i=0;i<count;i++){const angle=i*2.39996+(gold?-.2:.35)*t,dist=radius*(.6+(i%3)*.18),x=Math.cos(angle)*dist,y=Math.sin(angle)*dist-(gold?t*r*.8:0);ctx.fillStyle=i%3?'#fff3c6':color;ctx.beginPath();ctx.ellipse(x,y,Math.max(.6,2.8*(1-t)),Math.max(1,6*(1-t)),angle,0,Math.PI*2);ctx.fill();}
  if(e.kind==='upgrade'){ctx.globalCompositeOperation='source-over';ctx.globalAlpha=(1-t)*.75;ctx.strokeStyle='#c1973f';ctx.lineWidth=1;for(let i=0;i<6;i++){const a=i*Math.PI/3+t*.2;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.65,Math.sin(a)*r*.65);ctx.lineTo(Math.cos(a)*r*1.2,Math.sin(a)*r*1.2);ctx.stroke();}}
  ctx.restore();}effects=effects.filter(e=>e.age<e.life);}
 };
}
