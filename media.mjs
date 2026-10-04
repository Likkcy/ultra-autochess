export const tracks=Array.from({length:14},(_,i)=>`./assets/audio/music/track-${String(i+1).padStart(2,'0')}.ogg`);
const defaults={music:false,index:0,musicVolume:35,sound:true,soundVolume:45};
export function validPreferences(value={}){
 const level=(v,f)=>Number.isFinite(Number(v))?Math.max(0,Math.min(100,Number(v))):f;
 return {music:value.music===true,index:Number.isInteger(value.index)?((value.index%14)+14)%14:0,musicVolume:level(value.musicVolume,35),sound:value.sound!==false,soundVolume:level(value.soundVolume,45)};
}
export function mountMedia(toast){
 let prefs;try{prefs=validPreferences(JSON.parse(localStorage.getItem('autochess-media-v1'))??defaults);}catch{prefs={...defaults};}
 const music=new Audio();music.id='lobby-audio';music.hidden=true;music.preload='none';document.body.append(music);let unlocked=false,generation=0,context=null,master=null;
 const buffers=new Map(),pending=new Map(),last=new Map();let voices=0;
 const $=id=>document.getElementById(id);
 const persist=()=>{try{localStorage.setItem('autochess-media-v1',JSON.stringify(prefs));}catch{}};
 const update=()=>{$('music-toggle').textContent=prefs.music?'停止':'播放';$('music-state').textContent=prefs.music?'播放中':'已停止';$('music-volume').value=prefs.musicVolume;$('sound').checked=prefs.sound;$('volume').value=prefs.soundVolume;};
 async function play(resume=false){const ticket=++generation;if(!resume){music.pause();music.src=tracks[prefs.index];}music.volume=prefs.musicVolume/100;try{await music.play();if(ticket!==generation)return;if(!prefs.music)music.pause();else $('music-state').textContent='播放中';}catch{if(ticket!==generation)return;prefs.music=false;persist();update();toast('音乐未能播放，请再次点击播放。');}}
 function stop(){generation++;music.pause();music.currentTime=0;prefs.music=false;persist();update();}
 function next(delta){prefs.index=(prefs.index+delta+tracks.length)%tracks.length;persist();if(prefs.music)play();}
 function unlock(){unlocked=true;try{context??=new AudioContext();if(!master){master=context.createGain();master.connect(context.destination);}master.gain.value=prefs.soundVolume/100;context.resume();}catch{}if(prefs.music&&music.paused)play();}
 document.addEventListener('pointerdown',unlock,{once:true});document.addEventListener('keydown',unlock,{once:true});
 $('music-toggle').onclick=()=>{if(prefs.music)stop();else{prefs.music=true;unlock();persist();update();}};
 $('music-prev').onclick=()=>next(-1);$('music-next').onclick=()=>next(1);
 $('music-volume').oninput=()=>{prefs.musicVolume=Number($('music-volume').value);music.volume=prefs.musicVolume/100;persist();};
 $('sound').onchange=()=>{prefs.sound=$('sound').checked;unlock();persist();};
 $('volume').oninput=()=>{prefs.soundVolume=Number($('volume').value);if(master)master.gain.value=prefs.soundVolume/100;persist();};
 music.onended=()=>{if(prefs.music)next(1);};
 music.onerror=()=>{if(prefs.music){stop();toast('音乐加载失败，请稍后重试。');}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){generation++;music.pause();context?.suspend();}else if(unlocked){context?.resume();if(prefs.music)play(true);}});
 async function sound(kind){
  if(!prefs.sound||!unlocked||!context||document.hidden||voices>=8)return;
  const now=performance.now(),interval=kind==='attack'?180:kind==='cast'?230:80;
  if(now-(last.get(kind)??-Infinity)<interval)return;last.set(kind,now);
  try{if(!buffers.has(kind)){if(!pending.has(kind))pending.set(kind,fetch(`./assets/audio/sfx/${kind}.ogg`).then(r=>{if(!r.ok)throw Error('missing sound');return r.arrayBuffer();}).then(b=>context.decodeAudioData(b)).then(b=>buffers.set(kind,b)).finally(()=>pending.delete(kind)));await pending.get(kind);}
   if(!prefs.sound||document.hidden||voices>=8)return;const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers.get(kind);gain.gain.value=kind==='attack'?.24:kind==='cast'?.42:.65;source.connect(gain);gain.connect(master);voices++;source.onended=()=>{voices--;source.disconnect();gain.disconnect();};source.start();
  }catch{}
 }
 update();return {sound};
}
