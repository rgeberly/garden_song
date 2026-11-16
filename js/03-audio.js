/* ================================================================
   AUDIO
   ================================================================ */
let AC=null,master=null,musicGain=null,sfxGain=null,noiseBuf=null;
/* Volume (the Settings tab): Music and Sound effects, each 0 (off) to 10 (full), kept
   in this browser (not in the save). Music is the tracks and the rhythm game's songs;
   sound effects are everything else. */
const VOL={music:10,sfx:10};
try{ const v=JSON.parse(localStorage.getItem('kgs-vol')||'{}');
  ['music','sfx'].forEach(k=>{ if(v[k]>=0&&v[k]<=10) VOL[k]=Math.round(v[k]); }); }catch(e){}
/* a level as a loudness: squared, so each step sounds about as big as the last */
const volK=k=>(VOL[k]/10)**2;
const MASTER_VOL=0.5, MUSIC_GAIN=0.34, SFX_GAIN=0.75;
let songGain=null;                         /* the rhythm game's recordings (music) */
function setVolume(k,v){
  VOL[k]=clamp(Math.round(v),0,10);
  try{ localStorage.setItem('kgs-vol',JSON.stringify(VOL)); }catch(e){}
  applyVolume();
}
function applyVolume(){
  if(AC){ musicGain.gain.value=MUSIC_GAIN*volK('music'); songGain.gain.value=volK('music'); sfxGain.gain.value=SFX_GAIN*volK('sfx'); }
  const a=TRACKS[curTrack]; if(a&&!a.paused) fadeTo(a,trackVol(curTrack));
  for(const k in SFX) SFX[k].volume=SFX_LOOP_VOL*volK('sfx');
}
function initAudio(){
  if(AC) return;
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain(); master.gain.value=MASTER_VOL; master.connect(AC.destination);
    musicGain=AC.createGain(); musicGain.gain.value=MUSIC_GAIN*volK('music'); musicGain.connect(master);
    songGain=AC.createGain(); songGain.gain.value=volK('music'); songGain.connect(master);
    sfxGain=AC.createGain(); sfxGain.gain.value=SFX_GAIN*volK('sfx'); sfxGain.connect(master);
    const n=AC.sampleRate*0.5; noiseBuf=AC.createBuffer(1,n,AC.sampleRate);
    const d=noiseBuf.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
  }catch(e){ AC=null; }
  loadStems(); loadSounds();   /* a key press counts too, not just a tap */
}
addEventListener('pointerdown',()=>{initAudio(); initSfx(); initMusic(); loadStems();
  if(AC&&AC.state==='suspended')AC.resume();},{passive:true});
/* The title theme. Browsers only allow sound after a tap or key press, so it is tried
   as soon as the game loads (some browsers allow it) and otherwise the first press on
   the title screen starts the music instead of the game (titleWoken). */
let titleWoken=false;
function titleMusic(onLoad){
  initMusic(); setMusic('title');
  const a=TRACKS.title;
  /* blocked earlier, it's still the current track but paused: start it now */
  if(a&&a.paused){ try{ const p=a.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} fadeTo(a,trackVol('title')); }
  if(onLoad){ if(a) setTimeout(()=>{ if(!a.paused&&G.scene==='title') titleWoken=true; },600); return; }
  titleWoken=true;
}
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
/* ---- each song's own recordings (SONG_DATA, made by tools/build_songs.py) ----
   Loaded the first time the song is played, then kept. */
const SONG_DIR='assets/audio/songs/', SONG_BUF={};
const songData=key=>typeof SONG_DATA!=='undefined'&&key&&SONG_DATA[key]||null;
function loadSong(key){
  const D=songData(key); if(!D||!AC) return null;
  if(!SONG_BUF[key]){ const S=SONG_BUF[key]={ready:false,failed:false};
    Promise.all(['backing','flute'].map(k=>fetch(SONG_DIR+D.file+'_'+k+'.m4a')
        .then(r=>{ if(!r.ok) throw 0; return r.arrayBuffer(); })
        .then(bf=>new Promise((res,rej)=>AC.decodeAudioData(bf,res,rej)))))
      .then(([bk,fl])=>{ S.backing=bk; S.flute=fl; S.ready=true; })
      .catch(()=>{ S.failed=true; }); }
  return SONG_BUF[key];
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
/* ---- recorded sound effects (SOUNDS, js/data/sounds.js, made by tools/build_sfx.py) ----
   All of them are fetched once sound is allowed, and kept decoded so they play at once.
   sndN counts every sound played: a key or tap that played none gets the menu's own
   click (menuSound). */
let sndN=0;
const SND_BUF={}, SND_DIR='assets/audio/sfx/';
/* how loud each one plays (they're all built to about the same loudness) */
const SOUND_VOL={menu_move:0.45,menu_tab:0.5,menu_confirm:0.55,menu_cancel:0.55,menu_toggle:0.5,menu_talkbox_advance:0.45,
  cant_do_that:0.6,buy:0.7,sell:0.7,pickup:0.65,drink:0.7,droplet:0.5,knock_on_door:0.8,open_door:0.6,close_door:0.6,
  battle_start:0.8,get_key_item:0.75,fish_jump:0.75,fish_churnin:0.6,tituba_meow:0.8,
  tiny_tweet:0.8,tiny_songs:0.8,tiny_peckpeckpeck:0.8,tiny_disarmingtrill:0.8,tiny_wakeupcall:0.8};
function loadSounds(){
  if(!AC||loadSounds.on||typeof SOUNDS==='undefined') return; loadSounds.on=true;
  for(const k in SOUNDS) SOUNDS[k].files.forEach(file=>{
    fetch(SND_DIR+file+'.m4a').then(r=>{ if(!r.ok) throw 0; return r.arrayBuffer(); })
      .then(bf=>new Promise((res,rej)=>AC.decodeAudioData(bf,res,rej)))
      .then(buf=>{ /* skip the encoder's bit of silence at the very start */
        const d=buf.getChannelData(0); let pk=0; for(let i=0;i<d.length;i++) pk=Math.max(pk,Math.abs(d[i]));
        let s=0; while(s<d.length&&Math.abs(d[s])<pk*0.01) s++;
        SND_BUF[file]={buf,off:Math.max(0,s-48)/buf.sampleRate}; })
      .catch(()=>{}); });
}
/* play a sound (a random take, if it has several). vol: times its SOUND_VOL.
   Returns how long it lasts in seconds (0 if it can't play yet). */
const SND_LAST={};
function sfx(key,vol=1){
  sndN++;
  const S=typeof SOUNDS!=='undefined'&&SOUNDS[key]; if(!AC||!S) return 0;
  let takes=S.files.filter(f=>SND_BUF[f]);
  if(takes.length>1) takes=takes.filter(f=>f!==SND_LAST[key]);       /* not the same take twice running */
  const file=takes[Math.floor(Math.random()*takes.length)]; if(!file) return 0;
  SND_LAST[key]=file;
  const B=SND_BUF[file], src=AC.createBufferSource(), g=AC.createGain();
  src.buffer=B.buf; g.gain.value=(SOUND_VOL[key]||0.6)*vol;
  src.connect(g); g.connect(sfxGain); src.start(AC.currentTime,B.off);
  return B.buf.duration-B.off;
}
function blip(f,dur,vol,type){ sndN++; if(!AC)return;
  const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'square'; o.frequency.value=f;
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t+dur); }
/* water: a burst of filtered noise that falls away, over a little plop (vol 0..1) */
function splashSound(vol){
  sndN++; if(!AC||!noiseBuf) return;
  const t=AC.currentTime, v=vol||0.4;
  const nz=AC.createBufferSource(); nz.buffer=noiseBuf;
  const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.setValueAtTime(1800,t); bp.frequency.exponentialRampToValueAtTime(700,t+0.35); bp.Q.value=0.8;
  const g=AC.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.5*v,t+0.015); g.gain.exponentialRampToValueAtTime(0.0001,t+0.42);
  nz.connect(bp); bp.connect(g); g.connect(sfxGain||master); nz.start(t); nz.stop(t+0.45);
  const o=AC.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(420,t); o.frequency.exponentialRampToValueAtTime(110,t+0.12);
  const og=AC.createGain(); og.gain.setValueAtTime(0.25*v,t); og.gain.exponentialRampToValueAtTime(0.0001,t+0.15);
  o.connect(og); og.connect(sfxGain||master); o.start(t); o.stop(t+0.16);
}
function thud(){ sndN++; if(!AC)return;
  const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type='sine'; o.frequency.setValueAtTime(200,t);
  o.frequency.exponentialRampToValueAtTime(60,t+0.13);
  g.gain.setValueAtTime(0.4,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2);
  o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t+0.22); }
const THEME={prog:[[2,6,9],[-5,-1,2],[-1,2,6],[-3,1,4]]};
/* recorded themes, cross-faded */
const TRACKS={}; let curTrack=null, musicOn=false;
const TRACK_VOL={title:0.55,calm:0.42,battle:0.5,boss:0.55};
const trackVol=k=>(TRACK_VOL[k]||0.45)*volK('music');
function initMusic(){ musicOn=true; }
/* a track is fetched the first time it's wanted (there are a lot of them now); all
   loop but the victory fanfare */
/* where a track starts (seconds), and loops back to, if not its very beginning */
const TRACK_START={title:16};
function trackFor(k){
  if(!TRACKS[k]&&ASSET_MUS[k]){ try{ const a=new Audio(ASSET_MUS[k]); a.volume=0; a.preload='auto'; TRACKS[k]=a;
    const st=TRACK_START[k];
    a.loop=k!=='victory'&&!st;
    if(st) a.addEventListener('ended',()=>{ if(curTrack===k){ a.currentTime=st; const p=a.play(); if(p&&p.catch) p.catch(()=>{}); } });
  }catch(e){} }
  return TRACKS[k];
}
/* The battle and boss themes start from the top with every fight. */
function restartTrack(k){ const a=TRACKS[k]; if(a&&curTrack!==k){ try{ a.currentTime=0; }catch(e){} } }
/* jump a track to its starting point (once it knows its length) */
function cueTrack(a,k){
  const st=TRACK_START[k]||0; if(!st) return;
  if(a.readyState>=1) a.currentTime=st; else a.addEventListener('loadedmetadata',()=>{ a.currentTime=st; },{once:true});
}
/* the music for where she is and the season: the garden and home (spring keeps the
   original calm theme), the village, and the mountain (one theme for spring and summer,
   one for fall and winter) */
function areaMusic(){
  const s=season();
  if(G.area==='town'||(typeof PLACES!=='undefined'&&PLACES[G.area]&&PLACES[G.area].room)) return s+'_village';
  if(G.area==='mountain') return s==='spring'||s==='summer'?'springsummer_mountain':'fallwinter_mountain';
  return s==='spring'?'calm':s+'_garden';
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
  const a=trackFor(mode);
  if(a){ try{ a.volume=0; if(mode==='victory'||mode==='battle'||mode==='boss'||mode==='boss2') a.currentTime=0; cueTrack(a,mode); const p=a.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){}
         fadeTo(a,trackVol(mode)); }
}
