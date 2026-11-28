/* ================================================================
   WEATHER
   One kind a day, the same all day (WX_KINDS). Sunday and Holiday are always sunny, Waterday always
   rainy (snowy in winter); the other days are picked from the season's odds (WX_ODDS) by
   the save's own seed (G.wxSeed, save key wx), so the menu's calendar can show the whole
   week ahead. Songday makes songs stronger (songMul); Holiday is kept for festivals.
     sun: how much sunlight gets through (the HD look's sunbeams, shadows)
     grey: the overcast tint over the view · rain, snow, fog: how heavy
     water: the garden gets a drink that morning (RAIN_GROW of each plant's growth, and
       its health back) · spawn: how often pests turn up · bite: how soon fish bite
   ?weather=<kind> in the address forces one, to try them.
   ================================================================ */
const WX_KINDS={
  sunny: {name:"Sunny",       sun:1},
  cloudy:{name:"Cloudy",      sun:0.45,grey:0.16},
  rain:  {name:"Rain",        sun:0.1, grey:0.36,rain:1,  water:true,spawn:0.8,bite:1.3},
  storm: {name:"Thunderstorm",sun:0,   grey:0.5, rain:1.9,water:true,spawn:1.4,bite:1.5,thunder:true},
  snow:  {name:"Snow",        sun:0.3, grey:0.14,snow:1,  spawn:0.7},
  fog:   {name:"Fog",         sun:0.3, grey:0.1, fog:1,   spawn:1.15}};
const WX_ODDS={spring:{sunny:35,cloudy:25,rain:25,storm:5,fog:10},
               summer:{sunny:50,cloudy:15,rain:12,storm:18,fog:5},
               fall:  {sunny:30,cloudy:30,rain:20,storm:5,fog:15},
               winter:{sunny:30,cloudy:30,snow:30,fog:10}};
const SONGDAY_MUL=1.25, RAIN_GROW=0.1, SUNNY_SONG=1.1;
const WX_FORCE=(location.search.match(/[?&]weather=(\w+)/)||[])[1];
const wxSeed=()=>G.wxSeed||(G.wxSeed=1+Math.floor(Math.random()*1e9));
const weekdayOf=day=>WEEKDAYS[(day-1)%DAYS_PER_SEASON%WEEKDAYS.length];
function wxOf(day){
  if(WX_FORCE&&WX_KINDS[WX_FORCE]) return WX_FORCE;
  const w=weekdayOf(day), s=seasonOf(day);
  if(w==='Sunday'||w==='Holiday') return 'sunny';        /* (Holiday: fair weather for festivals) */
  if(w==='Waterday') return s==='winter'?'snow':'rain';
  let h=(wxSeed()^Math.imul(day,2654435761))>>>0;            /* (a hash of the day and the seed) */
  h=Math.imul(h^(h>>>16),2246822507)>>>0; h=Math.imul(h^(h>>>13),3266489909)>>>0; h=(h^(h>>>16))>>>0;
  const O=WX_ODDS[s]; let r=h/4294967296*Object.values(O).reduce((a,b)=>a+b,0);
  for(const k in O){ r-=O[k]; if(r<0) return k; }
  return 'sunny';
}
const wxKey=()=>wxOf(G.day), wx=()=>WX_KINDS[wxKey()];
const songday=()=>weekdayOf(G.day)==='Songday';
const songMul=()=>songday()?SONGDAY_MUL:1;                 /* songs in battle and in the garden */
const wxSpawn=()=>wx().spawn||1, wxBite=()=>wx().bite||1;
/* how much sun reaches the ground (indoors there's none to speak of anyway) */
const wxSun=()=>wx().sun;
const wxShade=()=>G.indoors?1:0.3+0.7*wxSun();
/* growth from a song in the garden: Songday's bonus, and a little more in the sun */
const wxGrowMul=()=>songMul()*(wxKey()==='sunny'?SUNNY_SONG:1);

/* the morning: rain waters the garden (once a day), and a word about the day */
function wxMorning(){
  if(!wx().water||G.daily.rained===G.day) return 0;
  G.daily.rained=G.day; let n=0;
  plots.forEach(p=>{ if(active(p)&&p.sp&&!p.tree){ p.health=100; if(p.stage<3) setGrowth(p,p.growth+plantNeed(p)*RAIN_GROW); n++; } });
  return n;
}
function wxSay(){
  const k=wxKey(), w=weekdayOf(G.day);
  let t=k==='rain'?"Rain today: the garden gets a drink.":k==='storm'?"A storm! The garden's watered, but pests are restless.":
        k==='snow'?"Snow today. The pests are staying in.":k==='fog'?"A foggy day. Pests could be anywhere.":
        k==='cloudy'?"A cloudy day.":"A sunny day: the plants grow a little more for your songs.";
  if(w==='Songday') t+="  Songday: songs are "+Math.round((SONGDAY_MUL-1)*100)+"% stronger!";
  if(w==='Holiday') t+="  It's a holiday!";
  return t;
}

/* ---------- how it looks ----------
   drawWeather(c, y0, y1, ox, oy, mode): over a band of a scene (the view, a battle, the
   pond), after the hour's tint. ox, oy: how far the view has moved over the ground, so
   fog and puddle splashes stay put. Mountain and forest mornings are a little misty
   whatever the weather. */
const WX={drops:[],flakes:[],splash:[],fog:[],flash:0,next:0,last:0,thunderAt:0};
function wxFogK(){
  const w=wx(), h=G.clock/60;
  let k=w.fog?1:0;
  if((G.area==='mountain'||G.area==='forest')&&G.scene!=='battle'&&h<10) k=Math.max(k,0.55*clamp((10-h)/2,0,1));   /* misty mornings up the trail */
  return k;
}
let WX_FOG_IMG=null;
function wxFogImg(){
  if(WX_FOG_IMG) return WX_FOG_IMG;
  const cv=document.createElement('canvas'); cv.width=cv.height=128; const g=cv.getContext('2d');
  const r=g.createRadialGradient(64,64,0,64,64,64); r.addColorStop(0,'rgba(235,240,248,1)'); r.addColorStop(0.5,'rgba(235,240,248,.55)'); r.addColorStop(1,'rgba(235,240,248,0)');
  g.fillStyle=r; g.fillRect(0,0,128,128); return WX_FOG_IMG=cv;
}
function drawWeather(c,y0,y1,ox=0,oy=0){
  const w=wx(), now=performance.now(), dt=Math.min(50,now-(WX.last||now)); WX.last=now;
  const H=y1-y0, night=1-daylight();
  c.save(); c.beginPath(); c.rect(-20,y0,LW+40,H); c.clip();
  /* overcast: a grey-blue wash (less at night, when it's dark anyway) */
  if(w.grey){ c.globalCompositeOperation='multiply'; c.globalAlpha=w.grey*(1-night*0.5);
    c.fillStyle='#76849c'; c.fillRect(-20,y0,LW+40,H); c.globalCompositeOperation='source-over'; c.globalAlpha=1; }
  /* fog: soft drifting banks, kept on the ground */
  const fk=wxFogK();
  if(fk>0){ const im=wxFogImg();
    while(WX.fog.length<18) WX.fog.push({x:rnd(-60,LW+60)+ox,y:rnd(0,1),s:rnd(110,200),v:rnd(0.004,0.012),ph:rnd(0,TAU)});
    c.globalAlpha=0.2*fk*(1-night*0.4); c.fillStyle='#e6ecf4'; c.fillRect(-20,y0,LW+40,H);
    WX.fog.forEach(f=>{ f.x+=f.v*dt; let x=f.x-ox; const span=LW+260;
      if(x>LW+130){ f.x-=span; x-=span; } if(x<-130){ f.x+=span; x+=span; }
      c.globalAlpha=0.5*fk*(0.7+0.3*Math.sin(G.t/2600+f.ph));
      c.drawImage(im,x-f.s/2,y0+f.y*H-f.s*0.3-(oy%H)*0.2,f.s,f.s*0.6); });
    c.globalAlpha=1; }
  /* rain: slanting streaks falling over the ground (each keeps its place on it as the view
     moves: wx, wy are where it'd be with the view unmoved); where they land is drawRainGround */
  if(w.rain){ const n=Math.round(120*w.rain), len=w.thunder?24:19;
    while(WX.drops.length<n) WX.drops.push({wx:rnd(-40,LW+40)+ox,wy:rnd(y0-H,y1)+oy,v:rnd(0.55,0.8)*(w.thunder?1.25:1),l:rnd(0.7,1.2)});
    if(WX.drops.length>n) WX.drops.length=n;
    c.strokeStyle='rgba(215,232,255,.5)'; c.lineWidth=0.9; c.beginPath();
    WX.drops.forEach(d=>{ d.wy+=d.v*dt; d.wx+=d.v*dt*0.22; wxKeepIn(d,ox,oy,y0,y1,40);
      const x=d.wx-ox, y=d.wy-oy; c.moveTo(x,y); c.lineTo(x-len*d.l*0.22,y-len*d.l); });
    c.stroke(); }
  /* snow: flakes drifting down, swaying */
  if(w.snow){ const n=Math.round(110*w.snow);
    while(WX.flakes.length<n) WX.flakes.push({wx:rnd(-20,LW+20)+ox,wy:rnd(y0-H,y1)+oy,v:rnd(0.012,0.03),s:rnd(1,3),ph:rnd(0,TAU)});
    c.fillStyle='#ffffff';
    WX.flakes.forEach(f=>{ f.wy+=f.v*dt*(1+f.s*0.3); f.wx+=Math.sin(G.t/900+f.ph)*0.15+0.004*dt; wxKeepIn(f,ox,oy,y0,y1,10);
      c.globalAlpha=0.55+0.35*(f.s/3); c.beginPath(); c.arc(f.wx-ox,f.wy-oy,f.s,0,TAU); c.fill(); });
    c.globalAlpha=1; }
  /* lightning: now and then a flicker of light over everything, the thunder after it */
  if(w.thunder){
    if(!WX.next) WX.next=now+rnd(4000,9000);
    if(now>WX.next){ WX.flash=1; WX.double=Math.random()<0.6; WX.next=now+rnd(7000,16000); WX.thunderAt=now+rnd(250,1400); }
    if(WX.thunderAt&&now>WX.thunderAt){ WX.thunderAt=0; thunder(); }
    if(WX.flash>0){ const f=WX.flash, flick=WX.double&&f>0.45&&f<0.7?0.3:1;
      c.globalCompositeOperation='lighter'; c.globalAlpha=0.55*f*f*flick; c.fillStyle='#dfe8ff'; c.fillRect(-20,y0,LW+40,H);
      WX.flash=Math.max(0,f-dt/420); } }
  c.restore();
}
/* a drop or flake that's fallen past the bottom, or that the view has left behind, starts
   again somewhere above (or across) the view */
function wxKeepIn(d,ox,oy,y0,y1,m){
  const x=d.wx-ox, y=d.wy-oy, H=y1-y0;
  if(y>y1+m){ d.wy=y0-rnd(0,m)+oy; d.wx=rnd(-m,LW+m)+ox; }
  else if(y<y0-H-m) d.wy+=H+m*2;
  if(x<-m*2) d.wx+=LW+m*3; else if(x>LW+m*2) d.wx-=LW+m*3;
}
/* where the rain lands: little rings on the ground, drawn under everyone standing on it
   (call it after the ground, before the people and plants), kept in place as the view moves */
function drawRainGround(c,y0,y1,ox=0,oy=0){
  const w=wx(); if(!w.rain){ WX.splash.length=0; return; }
  const now=performance.now(), dt=Math.min(50,now-(WX.lastG||now)); WX.lastG=now;
  let k=dt*0.05*w.rain; while(k>0){ if(Math.random()<k) WX.splash.push({wx:rnd(-10,LW+10)+ox,wy:rnd(y0,y1)+oy,t:0}); k-=1; }
  WX.splash=WX.splash.filter(s=>(s.t+=dt)<340);
  c.save(); c.strokeStyle='rgba(220,236,255,.7)'; c.lineWidth=0.8;
  WX.splash.forEach(s=>{ const q=s.t/340, x=s.wx-ox, y=s.wy-oy; if(y<y0-6||y>y1+6) return;
    c.globalAlpha=(1-q)*0.9; c.beginPath(); c.ellipse(x,y,1+q*4.5,0.5+q*1.7,0,0,TAU); c.stroke(); });
  c.restore();
}
/* thunder: a recording if there is one (sfx/thunder.wav), else a made-up rumble */
function thunder(){
  if(sfx('thunder',G.indoors?0.5:0.9)>0||!AC) return;
  const t=AC.currentTime, n=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain();
  n.buffer=wxNoise(); n.loop=true; f.type='lowpass'; f.frequency.setValueAtTime(320,t); f.frequency.exponentialRampToValueAtTime(90,t+2.6);
  const v=(G.indoors?0.35:0.7);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+0.08); g.gain.setTargetAtTime(v*0.5,t+0.3,0.4); g.gain.exponentialRampToValueAtTime(0.001,t+3.2);
  n.connect(f); f.connect(g); g.connect(sfxGain); n.start(t); n.stop(t+3.3);
}

/* ---------- how it sounds ----------
   Rain: a recording looped (sfx/rain.wav, once it's made and listed in LOOPS), else a
   soft hiss made from noise; muffled indoors, quieter in the menus and the rhythm game. */
let WX_NOISE=null;
function wxNoise(){
  if(WX_NOISE) return WX_NOISE;
  const n=AC.sampleRate*4, buf=AC.createBuffer(1,n,AC.sampleRate), d=buf.getChannelData(0);
  let b0=0,b1=0,b2=0;                                         /* (pinkish: softer than white) */
  for(let i=0;i<n;i++){ const w=Math.random()*2-1; b0=0.997*b0+w*0.029; b1=0.985*b1+w*0.032; b2=0.95*b2+w*0.048; d[i]=(b0+b1+b2+w*0.05)*0.9; }
  return WX_NOISE=buf;
}
const WX_SND={on:null,rec:null,lvl:0};
function updateWeatherSound(){
  if(!AC||G.scene==='title'){ wxSoundTo(0,2000); return; }
  const w=wx(), wet=w.rain||0;
  let v=wet?(w.thunder?0.34:0.2):0;
  if(G.scene==='rhythm'||G.scene==='sleep') v*=0.25; else if(G.scene!=='world'&&G.scene!=='battle'&&G.scene!=='fishing') v*=0.6;
  const inside=G.indoors||!!(PLACES[G.area]&&PLACES[G.area].room);
  if(inside) v*=0.55;
  wxSoundTo(v,inside?650:2600);
}
function wxSoundTo(v,cut){
  if(!AC) return;
  if(v<=0.001&&!WX_SND.on&&!WX_SND.rec) return;
  if(typeof SOUNDS!=='undefined'&&SOUNDS.rain){              /* the recording */
    if(!WX_SND.rec&&v>0.001) WX_SND.rec=sfxLoop('rain',v*3);
    else if(WX_SND.rec){ WX_SND.rec.set(v*3); if(v<=0.001){ WX_SND.rec.stop(); WX_SND.rec=null; } }
    return; }
  if(!WX_SND.on&&v>0.001){
    const src=AC.createBufferSource(), hp=AC.createBiquadFilter(), lp=AC.createBiquadFilter(), g=AC.createGain();
    src.buffer=wxNoise(); src.loop=true; hp.type='highpass'; hp.frequency.value=260; lp.type='lowpass'; lp.frequency.value=cut;
    g.gain.value=0; src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(sfxGain); src.start();
    WX_SND.on={src,lp,g}; }
  if(WX_SND.on){ const t=AC.currentTime; WX_SND.on.g.gain.setTargetAtTime(v,t,0.6); WX_SND.on.lp.frequency.setTargetAtTime(cut,t,0.3);
    if(v<=0.001&&WX_SND.on.g.gain.value<0.002){ try{ WX_SND.on.src.stop(); }catch(e){} WX_SND.on=null; } }
}

/* ---------- a little picture of the weather (the clock, the menu's calendar) ---------- */
function weatherIcon(c,k,x,y,r,night){
  c.save(); c.translate(x,y);
  const sun=(sx,sy,sr)=>{ c.strokeStyle='#e8a03a'; c.lineWidth=sr*0.28;
    for(let i=0;i<8;i++){ const a=i*Math.PI/4; c.beginPath(); c.moveTo(sx+Math.cos(a)*sr*1.3,sy+Math.sin(a)*sr*1.3); c.lineTo(sx+Math.cos(a)*sr*1.8,sy+Math.sin(a)*sr*1.8); c.stroke(); }
    c.fillStyle='#f2c84b'; c.beginPath(); c.arc(sx,sy,sr,0,TAU); c.fill(); };
  const moon=(sx,sy,sr)=>{ c.save(); c.beginPath(); c.arc(sx,sy,sr,0,TAU); c.clip();
    c.fillStyle='#e8ecff'; c.beginPath(); c.rect(sx-sr-1,sy-sr-1,sr*2+2,sr*2+2); c.arc(sx+sr*0.48,sy-sr*0.33,sr*0.84,0,TAU,true); c.fill('evenodd'); c.restore(); };
  const cloud=(cx,cy,cr,col)=>{ c.fillStyle=col; c.beginPath();
    c.arc(cx-cr*0.55,cy+cr*0.15,cr*0.5,0,TAU); c.arc(cx,cy-cr*0.15,cr*0.65,0,TAU); c.arc(cx+cr*0.6,cy+cr*0.15,cr*0.48,0,TAU);
    c.rect(cx-cr*0.55,cy+cr*0.1,cr*1.15,cr*0.55); c.fill(); };
  if(k==='sunny'){ night?moon(0,0,r*0.75):sun(0,0,r*0.55); }
  else if(k==='cloudy'){ night?moon(-r*0.35,-r*0.35,r*0.45):sun(-r*0.35,-r*0.35,r*0.33); cloud(r*0.12,r*0.18,r*0.75,'#dfe6f2'); }
  else if(k==='rain'||k==='storm'){ cloud(0,-r*0.2,r*0.78,k==='storm'?'#9aa6bc':'#c8d2e4');
    c.strokeStyle='#7ab8ff'; c.lineWidth=r*0.14; c.lineCap='round';
    for(const dx of [-0.45,0,0.45]){ c.beginPath(); c.moveTo(r*dx,r*0.5); c.lineTo(r*(dx-0.12),r*0.9); c.stroke(); }
    if(k==='storm'){ c.fillStyle='#ffd84a'; c.beginPath(); c.moveTo(r*0.1,r*0.2); c.lineTo(-r*0.2,r*0.65); c.lineTo(r*0.02,r*0.62); c.lineTo(-r*0.12,r); c.lineTo(r*0.3,r*0.5); c.lineTo(r*0.06,r*0.52); c.closePath(); c.fill(); } }
  else if(k==='snow'){ c.strokeStyle='#d8eeff'; c.lineWidth=r*0.14; c.lineCap='round';
    for(let i=0;i<6;i++){ const a=i*Math.PI/3; c.beginPath(); c.moveTo(0,0); c.lineTo(Math.cos(a)*r*0.85,Math.sin(a)*r*0.85); c.stroke(); } }
  else if(k==='fog'){ c.strokeStyle='#dfe6f2'; c.lineWidth=r*0.18; c.lineCap='round';
    [-0.45,0,0.45].forEach((dy,i)=>{ c.beginPath(); c.moveTo(-r*(0.8-i*0.1),r*dy); c.lineTo(r*(0.8-((i+1)%2)*0.2),r*dy); c.stroke(); }); }
  c.restore();
}
