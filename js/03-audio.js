/* ================================================================
   AUDIO
   ================================================================ */
let AC=null,master=null,musicGain=null,sfxGain=null,noiseBuf=null;
function initAudio(){
  if(AC) return;
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain(); master.gain.value=0.5; master.connect(AC.destination);
    musicGain=AC.createGain(); musicGain.gain.value=0.34; musicGain.connect(master);
    sfxGain=AC.createGain(); sfxGain.gain.value=0.75; sfxGain.connect(master);
    const n=AC.sampleRate*0.5; noiseBuf=AC.createBuffer(1,n,AC.sampleRate);
    const d=noiseBuf.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
  }catch(e){ AC=null; }
}
addEventListener('pointerdown',()=>{initAudio(); initSfx(); initMusic(); loadStems();
  if(AC&&AC.state==='suspended')AC.resume();
  if(G.scene==='title') setMusic('title');},{passive:true});
const hz=s=>440*Math.pow(2,(s-9)/12);

/* ---- recorded stems for the rhythm game ------------------------------
   The backing track runs the whole time; the isolated flute is played in
   perfect sync but muted, and only opened up when a note is hit. -------- */
const STEM={ready:false,loading:false,failed:false,backing:null,flute:null};
function loadStems(){
  if(!AC||STEM.ready||STEM.loading||STEM.failed) return;
  STEM.loading=true;
  Promise.all([fetch(ASSET_STEM_BACKING),fetch(ASSET_STEM_FLUTE)])
    .then(rs=>{ if(!rs.every(r=>r.ok)) throw 0; return Promise.all(rs.map(r=>r.arrayBuffer())); })
    .then(bs=>Promise.all(bs.map(bf=>new Promise((res,rej)=>AC.decodeAudioData(bf,res,rej)))))
    .then(([bk,fl])=>{ STEM.backing=bk; STEM.flute=fl; STEM.ready=true; STEM.loading=false; })
    .catch(()=>{ STEM.loading=false; STEM.failed=true; });
}
function flute(semi,t,dur=0.5,vol=1,dest){
  if(!AC) return;
  const out=dest||sfxGain,f=hz(semi),g=AC.createGain();
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(0.55*vol,t+0.055);
  g.gain.setValueAtTime(0.55*vol,t+Math.max(0.06,dur*0.55));
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur); g.connect(out);
  const o1=AC.createOscillator(); o1.type='sine'; o1.frequency.value=f;
  const g1=AC.createGain(); g1.gain.value=1; o1.connect(g1); g1.connect(g);
  const o2=AC.createOscillator(); o2.type='sine'; o2.frequency.value=f*2;
  const g2=AC.createGain(); g2.gain.value=0.17; o2.connect(g2); g2.connect(g);
  const o3=AC.createOscillator(); o3.type='triangle'; o3.frequency.value=f; o3.detune.value=7;
  const g3=AC.createGain(); g3.gain.value=0.1; o3.connect(g3); g3.connect(g);
  const lfo=AC.createOscillator(); lfo.frequency.value=5.1;
  const lg=AC.createGain(); lg.gain.value=f*0.007;
  lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o3.frequency);
  lfo.start(t); lfo.stop(t+dur+0.05);
  const nz=AC.createBufferSource(); nz.buffer=noiseBuf;
  const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=f*2.2; bp.Q.value=2.5;
  const ng=AC.createGain();
  ng.gain.setValueAtTime(0.14*vol,t); ng.gain.exponentialRampToValueAtTime(0.006*vol,t+0.14);
  nz.connect(bp); bp.connect(ng); ng.connect(g); nz.start(t); nz.stop(t+Math.min(dur,0.5));
  [o1,o2,o3].forEach(o=>{o.start(t);o.stop(t+dur+0.05);});
}
function pad(semis,t,dur,vol,dest){ if(!AC)return;
  semis.forEach(s=>{ const o=AC.createOscillator(),g=AC.createGain();
    o.type='triangle'; o.frequency.value=hz(s);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(0.14*vol,t+0.6);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(dest||musicGain); o.start(t); o.stop(t+dur+0.05); }); }
function pluck(semi,t,dur,vol,dest){ if(!AC)return;
  const o=AC.createOscillator(),g=AC.createGain();
  o.type='sine'; o.frequency.value=hz(semi);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(0.3*vol,t+0.012);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g); g.connect(dest||musicGain); o.start(t); o.stop(t+dur+0.02); }
function perc(t,type,vol){ if(!AC)return;
  if(type==='kick'){ const o=AC.createOscillator(),og=AC.createGain();
    o.type='sine'; o.frequency.setValueAtTime(120,t);
    o.frequency.exponentialRampToValueAtTime(42,t+0.11);
    og.gain.setValueAtTime(0.5*vol,t); og.gain.exponentialRampToValueAtTime(0.001,t+0.16);
    o.connect(og); og.connect(musicGain); o.start(t); o.stop(t+0.18); return; }
  const nz=AC.createBufferSource(); nz.buffer=noiseBuf;
  const f=AC.createBiquadFilter(); f.type='highpass'; f.frequency.value=type==='hat'?7000:2600;
  const g=AC.createGain();
  g.gain.setValueAtTime((type==='hat'?0.09:0.16)*vol,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+(type==='hat'?0.045:0.12));
  nz.connect(f); f.connect(g); g.connect(musicGain); nz.start(t); nz.stop(t+0.2); }
function blip(f,dur,vol,type){ if(!AC)return;
  const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square'; o.frequency.value=f;
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t+dur); }
function thud(){ if(!AC)return;
  const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type='sine'; o.frequency.setValueAtTime(200,t);
  o.frequency.exponentialRampToValueAtTime(60,t+0.13);
  g.gain.setValueAtTime(0.4,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t+0.22); }
const THEME={prog:[[2,6,9],[-5,-1,2],[-1,2,6],[-3,1,4]]};
/* recorded themes, cross-faded */
const TRACKS={}; let curTrack=null, musicOn=false;
const TRACK_VOL={title:0.55,calm:0.42,battle:0.5,boss:0.55};
function initMusic(){
  if(musicOn) return; musicOn=true;
  for(const k in ASSET_MUS){
    try{ const a=new Audio(ASSET_MUS[k]); a.loop=true; a.volume=0; a.preload='auto'; TRACKS[k]=a; }
    catch(e){}
  }
}
function fadeTo(a,target,done){
  if(!a) return;
  if(a._f) clearInterval(a._f);
  a._f=setInterval(()=>{
    const d=target-a.volume;
    if(Math.abs(d)<0.04){ a.volume=Math.max(0,Math.min(1,target)); clearInterval(a._f); a._f=null; if(done)done(); }
    else a.volume=Math.max(0,Math.min(1,a.volume+Math.sign(d)*0.04));
  },40);
}
function setMusic(mode){
  if(mode===curTrack) return;
  const old=TRACKS[curTrack];
  if(old) fadeTo(old,0,()=>{ try{old.pause();}catch(e){} });
  curTrack=mode;
  const a=TRACKS[mode];
  if(a){ try{ a.volume=0; const p=a.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){}
         fadeTo(a,TRACK_VOL[mode]||0.45); }
}
