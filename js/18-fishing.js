/* ================================================================
   FISHING at the mountain pond
   Each trip takes FISH_MIN minutes and needs a rod and reel (RODS, sold at Hollis Tools).
   Cast by swiping up (or holding J and letting go: the longer, the further), wait for a
   bite, set the hook by pulling the rod (swipe up, or W / up), then reel it in: on a touch screen wind the reel at the bottom right by circling
   your finger round it, and pull the rod back with the lever at the bottom left
   (drag it up); with keys hold J or Space to reel and W / up to pull. Pulling the
   rod back yanks the fish a good way closer (pump it: pull, ease down while
   reeling, pull again) but both tighten the line, and the fish fights back in
   bursts, running line out. Past DRAG the reel's drag lets line slip instead of
   breaking it, so a snap is rare; a slack line (stop reeling) loses it. The fish roams
   across the water and darts off in its bursts, splashing (and now and then leaping
   clear). The usual pad and buttons are hidden here; Stop is top right.
   ================================================================ */
const FISH_MIN=30, HOOK_MS=1100, SNAP_MS=2000, SLACK_MS=2600, THROW_MS=750;
/* Rods and reels, bought one after another: reel, how fast it winds line in; drag, the
   tension where its drag starts to slip; max, the strongest fish (power) it can land. */
const RODS=[null,
  {name:"Bamboo Rod & Reel",  cost:250, reel:0.85,drag:0.8, max:1.8, about:"A starter set. Fine for most fish, but no match for the real bruisers."},
  {name:"Spinning Rod & Reel",cost:800, reel:1.15,drag:0.88,max:2.3, about:"A proper spinning reel with a smooth drag. Lands a Golden Koi."},
  {name:"Pro Rod & Reel",     cost:2000,reel:1.6, drag:0.95,max:99,  about:"Tournament grade. Nothing in these waters can out-pull it."}];
const rodNow=()=>RODS[G.rod||1];
const lunkerSize=k=>Math.round(30*(0.7+GOODS[k].power*0.4));   /* the biggest one of a kind gets */
/* the reel's drag: past this tension the line slips out instead of breaking; the scale
   of the tension gauge (it only snaps above 1, held there for SNAP_MS) */
const T_MAX=1.15, dragAt=()=>rodNow().drag, FISH_FADE=400;
const REEL={x:280,r:64}, ROD={x:62,h:84}, FSTOP={x:LW-70,y:14,w:60,h:26};
let FS=null;
/* Where the line can meet the water: 'near' 0 (far away) to 1 (close by), 'side' -1..1
   across it. In each pond picture's own pixels (FISH_WATER, from the far end of the water
   to the near water), or in screen px for the drawn pond. */
const FISH_WATER={fishing:{far:{x:565,y:845,half:85},near:{x:760,y:1340,half:250}},
                  fishing_spring:{far:{x:620,y:830,half:110},near:{x:800,y:1350,half:260}}};
const DRAWN_WATER={far:{x:200,y:170,half:110},near:{x:210,y:340,half:150}};
/* where the pond picture sits on the screen: covering it, its bottom on the band's */
function fishPic(){ const im=fishImg(), T0=BAND_TOP(), T1=BAND_BOT(), r=im.naturalWidth/im.naturalHeight;
  const h=Math.max(T1-T0,LW/r), w=h*r; return {x:(LW-w)/2,y:T1-h,w,h,s:h/im.naturalHeight}; }
function waterPt(near,side){
  const im=fishImg(), W=im?FISH_WATER[pondKey()]||FISH_WATER.fishing:DRAWN_WATER, k=clamp(near,0,1);
  let x=W.far.x+(W.near.x-W.far.x)*k+side*(W.far.half+(W.near.half-W.far.half)*k), y=W.far.y+(W.near.y-W.far.y)*k;
  if(im){ const P=fishPic(); x=P.x+x*P.s; y=P.y+y*P.s; }
  return {x,y,s:0.55+0.75*k};             /* s: how big things look there */
}
/* how close the line's end is (dist 1 is where the cast lands) */
const lineNear=()=>clamp(1-FS.dist,0,1)*0.95+0.05;
/* the reel sits near the bottom right of the screen, where a thumb can reach it */
const reelY=()=>Math.max(392,BAND_BOT()-98);
function pickFish(){
  const L=Object.keys(GOODS).filter(k=>{ const g=GOODS[k]; return g.kind==='fish'&&(!g.seasons||g.seasons.includes(season()))&&(!g.night||isNight()); });
  let t=L.reduce((a,k)=>a+GOODS[k].w,0)*Math.random();
  for(const k of L){ t-=GOODS[k].w; if(t<=0) return k; } return L[0];
}
function startFishing(){
  if(season()==='winter'){ say("The pond is frozen solid. Come back in spring!"); return; }
  passTime(FISH_MIN); if(G.scene!=='world') return;          /* it might have got late */
  FS={phase:'ready',t:0,wait:rnd(1800,5200),fish:null,dist:1,tension:0.15,pull:0,burst:0,charge:0,sw:null,lunker:false,inT:0,
     snapT:0,slackT:0,reel:0,ang:0,reelId:null,lastA:null,spin:0,size:0,splash:[],
     lift:0,liftWant:0,rodId:null,rodY0:0,
     side:rnd(-0.3,0.3),sideTo:0,drops:[],rings:[],leap:null};
  padVec={x:0,y:0}; padId=null; G.scene='fishing';
  blip(300,0.05,0.12,'triangle');
}
function endFishing(msg){ FS=null; G.scene='world'; if(msg) say(msg); autoSave(); }
/* the cast: power 0..1 decides how far out the bobber lands */
function fishCast(power){
  FS.phase='cast'; FS.t=0; FS.dist=0.55+0.45*clamp(power,0,1); FS.charge=0;
  blip(240,0.08,0.1,'triangle');
}
/* pulling the rod: sets the hook on a bite, scares the fish off before one */
function fishPull(){
  if(FS.phase==='bite'){ FS.phase='reel'; FS.t=0; FS.lift=1; blip(520,0.06,0.15,'square'); fishSplash(0.6); return; }
  if(FS.phase==='wait'){ FS.phase='lost'; FS.t=0; FS.msg="Too soon — you scared it off."; }
}
function fishHook(){
  if(FS.phase==='caught'||FS.phase==='lost'){ if(FS.t>500) endFishing(FS.phase==='caught'?null:FS.msg); }
}
function fishKey(k){
  if(!FS) return;
  if(isBack(k)){ endFishing("You reel in your line."); return; }
  if(isUp(k)) fishPull();
  else if(isOk(k)||k==='e') fishHook();
}
const inReel=(x,y)=>Math.hypot(x-REEL.x,y-reelY())<REEL.r+30;
/* the rod lever: a slot at the bottom left; drag up to pull the rod back */
const rodTop=()=>reelY()-ROD.h/2;
const inRod=(x,y)=>Math.abs(x-ROD.x)<46&&y>rodTop()-30&&y<rodTop()+ROD.h+30;
function fishTouch(x,y,id){
  if(!FS) return;
  if(x>FSTOP.x&&x<FSTOP.x+FSTOP.w&&y>FSTOP.y+BAND_TOP()&&y<FSTOP.y+FSTOP.h+BAND_TOP()){ endFishing("You reel in your line."); return; }
  if(FS.phase==='reel'&&inReel(x,y)){ FS.reelId=id; FS.lastA=Math.atan2(y-reelY(),x-REEL.x); return; }
  if(FS.phase==='reel'&&inRod(x,y)){ FS.rodId=id; FS.rodY0=y; return; }
  /* a swipe: up to cast, or to pull the rod and set the hook */
  if(FS.phase==='ready'||FS.phase==='wait'||FS.phase==='bite'){ FS.sw={id,x,y}; return; }
  fishHook();
}
/* winding: how far round the finger has gone since last time */
function fishMove(x,y,id){
  if(FS&&FS.sw&&FS.sw.id===id&&(FS.phase==='wait'||FS.phase==='bite')&&FS.sw.y-y>30){ FS.sw=null; fishPull(); return; }
  if(FS&&FS.sw&&FS.sw.id===id&&FS.phase==='ready') FS.charge=clamp((FS.sw.y-y)/220,0,1);
  if(FS&&FS.rodId===id){ FS.liftWant=clamp((FS.rodY0-y)/ROD.h*1.4,0,1); return; }
  if(!FS||FS.reelId!==id) return;
  const a=Math.atan2(y-reelY(),x-REEL.x);
  if(FS.lastA!==null){ let d=a-FS.lastA; if(d>Math.PI) d-=2*Math.PI; if(d<-Math.PI) d+=2*Math.PI; FS.spin+=Math.abs(d); FS.ang+=Math.abs(d); }
  FS.lastA=a;
}
function fishUp(id){
  if(FS&&FS.sw&&FS.sw.id===id){ const sw=FS.sw; FS.sw=null;
    if(FS.phase==='ready'){ if(FS.charge>0.15) fishCast(0.3+FS.charge*0.7); else FS.charge=0; } }
  if(FS&&FS.reelId===id){ FS.reelId=null; FS.lastA=null; } if(FS&&FS.rodId===id){ FS.rodId=null; FS.liftWant=0; } }
/* a splash where the line meets the water (k: how big, 0..1+): rings, droplets, a sound */
function fishSplash(k){
  const p=waterPt(lineNear(),FS.side);
  for(let i=0;i<2+Math.round(k*2);i++) FS.rings.push({x:p.x,y:p.y,t:0,dur:600+i*180,r:(8+k*14)*p.s,delay:i*90});
  for(let i=0;i<Math.round(6+k*14);i++){ const a=-Math.PI*rnd(0.1,0.9);
    FS.drops.push({x:p.x+rnd(-4,4)*p.s,y:p.y,vx:Math.cos(a)*rnd(0.02,0.07)*p.s,vy:Math.sin(a)*rnd(0.06,0.14)*(0.6+k*0.5)*p.s,t:0,g:0.0004*p.s}); }
  splashSound(0.25+k*0.35);
}
function updateFishing(dt){
  FS.t+=dt;
  FS.splash.forEach(s=>s.t-=dt); FS.splash=FS.splash.filter(s=>s.t>0);
  FS.rings.forEach(r=>r.t+=dt); FS.rings=FS.rings.filter(r=>r.t<r.dur+r.delay);
  FS.drops.forEach(d=>{ d.t+=dt; d.x+=d.vx*dt; d.y+=d.vy*dt; d.vy+=d.g*dt; }); FS.drops=FS.drops.filter(d=>d.t<900);
  if(FS.leap){ FS.leap.t+=dt; if(FS.leap.t>=FS.leap.dur){ FS.leap=null; fishSplash(1); } }
  /* the line's end drifts across the water: a hooked fish roams, darting in its bursts */
  const roam=FS.phase==='reel'?(FS.burst>0?1.4:0.35):0.08;
  if(Math.abs(FS.sideTo-FS.side)<0.05) FS.sideTo=FS.phase==='reel'?rnd(-0.85,0.85):rnd(-0.3,0.3);
  FS.side+=Math.sign(FS.sideTo-FS.side)*Math.min(Math.abs(FS.sideTo-FS.side),roam*dt/1000);
  /* getting ready: J held winds the cast up (back and forth), letting go throws it */
  if(FS.phase==='ready'){
    const key=keys['j']||keys[' ']||keys['enter'];
    if(key){ FS.held=(FS.held||0)+dt; FS.charge=0.5-0.5*Math.cos(FS.held/700*Math.PI); }
    else if(FS.held){ FS.held=0; fishCast(0.3+FS.charge*0.7); } }
  if(FS.phase==='cast'&&FS.t>THROW_MS){ FS.phase='wait'; FS.t=0; fishSplash(0.3); }
  else if(FS.phase==='wait'&&FS.t>FS.wait){ FS.phase='bite'; FS.t=0; FS.fish=pickFish();
    for(let i=0;i<8;i++) FS.splash.push({a:i*0.8,t:500}); blip(880,0.05,0.15,'sine'); }
  else if(FS.phase==='bite'&&FS.t>HOOK_MS){ FS.phase='lost'; FS.t=0; FS.msg="It nibbled the bait and swam off."; }
  else if(FS.phase==='reel'){
    const g=GOODS[FS.fish], s=dt/1000;
    /* how hard she's reeling: finger turns per second, or the key held */
    const key=keys['j']||keys[' ']||keys['enter'];
    const want=key?1:clamp(FS.spin/s/22,0,1.5); FS.spin=0;
    FS.reel+= (want-FS.reel)*Math.min(1,s*8);
    if(key) FS.ang+=s*9;
    /* the rod: raising it pulls the fish in, lowering it doesn't push it back */
    const up=keys['w']||keys['arrowup'];
    if(FS.rodId===null) FS.liftWant=up?1:0;
    const was=FS.lift; FS.lift+=(FS.liftWant-FS.lift)*Math.min(1,s*(FS.liftWant>FS.lift?5:3));
    const yank=Math.max(0,FS.lift-was);
    /* the fish: a steady tug, with bursts that get stronger the bigger it is */
    FS.burst-=dt;
    if(FS.burst<=-ri(900,2400)/g.power){ FS.burst=ri(500,1100);
      /* a new burst: it dashes off somewhere else with a splash, or leaps right out */
      FS.sideTo=clamp(FS.side+rnd(0.5,1.1)*(Math.random()<0.5?-1:1),-0.9,0.9);
      if(!FS.leap&&g.power>=0.8&&Math.random()<0.3){ FS.leap={t:0,dur:700,dir:Math.random()<0.5?-1:1}; fishSplash(0.8); }
      else fishSplash(0.35+g.power*0.25); }
    FS.pull=g.power*(FS.burst>0?0.9:0.3+0.15*Math.sin(FS.t/300));
    /* the fish runs (harder in a burst), reeling and pulling the rod bring it in */
    const RD=rodNow(), DRAG=dragAt(), strong=g.power>RD.max;
    let target=FS.reel*0.45+FS.pull*0.35+FS.lift*0.25, slip=0;
    if(target>DRAG){ slip=(target-DRAG)*0.3*s; target=DRAG+(target-DRAG)*0.3; }      /* the drag gives */
    FS.slipping=slip>0;
    FS.dist=clamp(FS.dist-(FS.reel*0.22*RD.reel*s+yank*0.14)*(1.15-FS.pull*0.25)+FS.pull*0.11*s+slip,strong?0.3:0,1.3);
    /* a fish too strong for this rod can't be landed: it wins in the end */
    if(strong&&FS.t>9000){ FS.phase='lost'; FS.t=0; FS.msg="Snap! That "+g.name+" was too strong for this rod."; blip(120,0.1,0.25,'sawtooth'); return; }
    FS.tension+=(target-FS.tension)*Math.min(1,s*3);
    FS.snapT=FS.tension>1?FS.snapT+dt:Math.max(0,FS.snapT-dt*2);
    FS.slackT=FS.tension<0.12?FS.slackT+dt:0;
    if(FS.snapT>SNAP_MS){ FS.phase='lost'; FS.t=0; FS.msg="Snap! The line broke."; blip(120,0.1,0.25,'sawtooth'); }
    else if(FS.slackT>SLACK_MS||FS.dist>=1.3){ FS.phase='lost'; FS.t=0; FS.msg="The line went slack and it got away."; }
    else if(FS.dist<=0){ FS.phase='caught'; FS.t=0; FS.size=Math.round(rnd(12,30)*(0.7+g.power*0.4)); fishSplash(1.2);
      FS.lunker=FS.size>=lunkerSize(FS.fish)*0.88;
      G.goods[FS.fish]=(G.goods[FS.fish]||0)+1;
      const L=G.lore.fish[FS.fish]||(G.lore.fish[FS.fish]={n:0,best:0}); L.n++; L.best=Math.max(L.best,FS.size);
      if(AC){ flute(9,AC.currentTime,.3,.6); flute(13,AC.currentTime+.12,.3,.6); flute(16,AC.currentTime+.24,.6,.6); } }
  }
}
/* The rod, reel and bobber pictures (fishing/Rod, Reel, Bobber in the art folder, packed
   into assets/sprites/fishing.png): drawn along a line (the rod, its handle at x0,y0 and
   tip at x1,y1) or centred and size tall. False until there's a picture. */
let IMG_FISHING=null;
const ROD_WIDEN=2.2;           /* the rod drawn this much wider than true, so its slim blank shows */
function drawFishingArt(k,x0,y0,x1,y1,size){
  const a=typeof FISH_ART!=='undefined'&&FISH_ART[k]; if(!a) return false;
  if(!IMG_FISHING){ IMG_FISHING=new Image(); IMG_FISHING.src='assets/sprites/fishing.png'; }
  if(!IMG_FISHING.complete||!IMG_FISHING.naturalWidth) return false;
  const [sx,sy,w,h]=a;
  b.save(); b.imageSmoothingEnabled=true; b.translate(x0,y0);
  if(size){ const s=size/Math.max(w,h); b.drawImage(IMG_FISHING,sx,sy,w,h,-w*s/2,-h*s/2,w*s,h*s); }
  else { const len=Math.hypot(x1-x0,y1-y0), s=len/h, ww=w*s*ROD_WIDEN; b.rotate(Math.atan2(y1-y0,x1-x0)+Math.PI/2);
    b.drawImage(IMG_FISHING,sx,sy,w,h,-ww/2,-len,ww,len); }
  b.restore(); return true;
}
/* the pond picture for the season (scenes/fishing_<season>, or scenes/fishing), once it
   has loaded; a drawn pond until then */
const FISH_IMG={};
const pondKey=()=>{ const k='fishing_'+season(); return typeof SCENES!=='undefined'&&SCENES.includes(k)?k:'fishing'; };
function fishImg(){
  const k=pondKey();
  if(!FISH_IMG[k]){ FISH_IMG[k]=new Image(); FISH_IMG[k].src='assets/scenes/'+k+'.jpg'; }
  return FISH_IMG[k].complete&&FISH_IMG[k].naturalWidth?FISH_IMG[k]:null;
}
function drawFishing(dt){
  updateFishing(dt);
  const T0=BAND_TOP(), T1=BAND_BOT(), im=fishImg();
  if(im){ const P=fishPic(); b.save(); b.imageSmoothingEnabled=true; b.drawImage(im,P.x,P.y,P.w,P.h); b.restore(); }
  else if(typeof SCENES!=='undefined'&&SCENES.includes(pondKey())){ b.fillStyle='#000'; b.fillRect(0,T0,LW,T1-T0); }   /* still loading */
  /* sky, far shore, the pond, and the bank she stands on */
  else { const sky=b.createLinearGradient(0,T0,0,140); sky.addColorStop(0,'#8ac8f0'); sky.addColorStop(1,'#e8f4e0');
  b.fillStyle=sky; b.fillRect(0,T0,LW,140-T0);
  b.fillStyle='#5a8a4a'; for(let i=-1;i<12;i++){ b.beginPath(); b.moveTo(i*36,140); b.lineTo(i*36+18,98+((i*17)%20)); b.lineTo(i*36+36,140); b.fill(); }
  const wat=b.createLinearGradient(0,140,0,T1); wat.addColorStop(0,'#5aa0d0'); wat.addColorStop(1,'#1e4a78');
  b.fillStyle=wat; b.fillRect(0,140,LW,T1-140);
  b.globalAlpha=.18; b.fillStyle='#ffffff';
  for(let i=0;i<14;i++){ const y=160+i*22, x=((G.t*0.02+i*53)%(LW+80))-40; b.fillRect(x,y,40,2); }
  b.globalAlpha=1;
  b.fillStyle='#6a5a3a'; b.beginPath(); b.moveTo(0,T1); b.lineTo(0,430); b.quadraticCurveTo(80,410,150,T1); b.fill(); }
  /* where the line meets the water: far away at first, closer as it's reeled, and
     wherever the fish has taken it across */
  const W=waterPt(lineNear(),FS.side);
  let fx=W.x, fy=W.y, ws=W.s;
  /* the rod, from the bottom left; its tip swings up as it is pulled back */
  const art=typeof FISH_ART!=='undefined'&&FISH_ART.rod;     /* the rod's picture is long and slim */
  const wind=FS.phase==='ready'?FS.charge:0;               /* winding up a cast tips the rod back */
  const baseX=26, baseY=T1-36, tipX=(art?74:52)+FS.lift*8-wind*40, tipY=T1-(art?290:170)-FS.lift*(art?50:42)+wind*30;
  /* in the air: the bobber arcs from the rod tip out to where it lands */
  if(FS.phase==='ready'){ fx=tipX+6; fy=tipY+40; }
  else if(FS.phase==='cast'){ const q=clamp(FS.t/THROW_MS,0,1);
    fx=tipX+(W.x-tipX)*q; fy=tipY+(W.y-tipY)*q-Math.sin(q*Math.PI)*90; ws=0.9+(W.s-0.9)*q; }
  if(!drawFishingArt('rod',baseX,baseY,tipX,tipY)){
    b.strokeStyle='#5a3a1e'; b.lineWidth=3; b.beginPath(); b.moveTo(baseX,baseY); b.lineTo(tipX,tipY); b.stroke(); }
  b.strokeStyle='rgba(255,255,255,.75)'; b.lineWidth=1;
  b.beginPath(); b.moveTo(tipX,tipY); b.quadraticCurveTo((tipX+fx)/2,(tipY+fy)/2+(1-FS.tension)*40,fx,fy); b.stroke();
  if(FS.phase==='cast'||FS.phase==='ready'){     /* the bobber dangling or flying */
    if(!drawFishingArt('bobber',fx,fy,0,0,14*ws)){ const r=4*ws; b.fillStyle='#e83a3a'; b.beginPath(); b.arc(fx,fy,r,Math.PI,0); b.fill();
      b.fillStyle='#ffffff'; b.beginPath(); b.arc(fx,fy,r,0,Math.PI); b.fill(); } }
  /* winding up a cast (keys): how far it'll go */
  if(FS.phase==='ready'&&FS.charge>0){ gauge(110,T1-150,140,8,FS.charge,1,'#f0c84a','#fff0b0'); }
  if(FS.phase!=='cast'&&FS.phase!=='ready'){
    if((FS.phase==='reel'||FS.phase==='caught')&&!FS.leap){       /* the fish's shadow under the line */
      const g=GOODS[FS.fish], dart=FS.burst>0?Math.sin(G.t/60)*3:Math.sin(G.t/160)*2;
      b.globalAlpha=.45; b.fillStyle='#0a1a2a';
      b.beginPath(); b.ellipse(fx+dart*ws,fy+7*ws,(10+g.power*5)*ws,(3.5+g.power*1.5)*ws,Math.sin(G.t/300)*0.3,0,7); b.fill(); b.globalAlpha=1; }
    FS.rings.forEach(r=>{ const q=clamp((r.t-r.delay)/r.dur,0,1); if(q<=0) return;
      b.globalAlpha=(1-q)*0.8; b.strokeStyle='#ffffff'; b.lineWidth=1.4;
      b.beginPath(); b.ellipse(r.x,r.y+2,r.r*(0.4+q*1.6),r.r*(0.4+q*1.6)*0.32,0,0,7); b.stroke(); });
    b.globalAlpha=1;
    FS.splash.forEach(s=>{ const r=(500-s.t)/500*22*ws; b.globalAlpha=s.t/500; b.strokeStyle='#ffffff'; b.lineWidth=1.5;
      b.beginPath(); b.ellipse(fx,fy+3,r,r*0.35,0,0,7); b.stroke(); b.globalAlpha=1; });
    /* a leap: the fish arcs out of the water and back in */
    if(FS.leap){ const q=FS.leap.t/FS.leap.dur, g=GOODS[FS.fish], hgt=Math.sin(q*Math.PI)*(30+g.power*10)*ws;
      const lx=fx+FS.leap.dir*(q-0.5)*28*ws, ly=fy-hgt;
      b.save(); b.translate(lx,ly); b.rotate(FS.leap.dir*(q-0.5)*2.2); b.scale(FS.leap.dir*ws*1.5,ws*1.5);
      b.fillStyle=g.col; b.beginPath(); b.ellipse(0,0,9+g.power*2,4,0,0,7); b.fill();
      b.beginPath(); b.moveTo(-8-g.power*2,0); b.lineTo(-14-g.power*2,-5); b.lineTo(-14-g.power*2,5); b.fill();
      b.fillStyle='rgba(255,255,255,.45)'; b.beginPath(); b.ellipse(1,-1.5,6,1.4,0,0,7); b.fill();
      b.fillStyle='#1a1a2a'; b.beginPath(); b.arc(6,-1,1,0,7); b.fill(); b.restore(); }
    /* the bobber (under the water while the fish runs with it) */
    const bob=FS.phase==='bite'?Math.sin(G.t/40)*4:Math.sin(G.t/400)*1.5, under=FS.phase==='reel'&&FS.burst>0;
    b.globalAlpha=under?0.45:1;
    if(!drawFishingArt('bobber',fx,fy+bob*ws,0,0,14*ws)){
      const r=4*ws; b.fillStyle='#e83a3a'; b.beginPath(); b.arc(fx,fy+bob*ws,r,Math.PI,0); b.fill();
      b.fillStyle='#ffffff'; b.beginPath(); b.arc(fx,fy+bob*ws,r,0,Math.PI); b.fill(); }
    b.globalAlpha=1;
    FS.drops.forEach(d=>{ b.globalAlpha=Math.max(0,1-d.t/900); b.fillStyle='#ffffff';
      b.beginPath(); b.arc(d.x,d.y,1.3*ws+0.4,0,7); b.fill(); });
    b.globalAlpha=1;
  }
  /* tension (left) and distance (top) gauges */
  if(FS.phase==='reel'){
    const gx=16, gy=170, gh=180;
    b.fillStyle='#0a0f2a'; b.beginPath(); b.roundRect(gx-2,gy-2,18,gh+4,6); b.fill();
    const at=t=>1-t/T_MAX;          /* a tension's place on the gauge, top = tight */
    const DRAG=dragAt();
    [['#d84a3a',0,at(1)],['#e8c84a',at(1),at(DRAG)],['#5ac85a',at(DRAG),at(0.15)],['#e8c84a',at(0.15),1]].forEach(([c,a,z])=>{ b.fillStyle=c; b.fillRect(gx,gy+a*gh,14,(z-a)*gh); });
    const ty=gy+clamp(at(FS.tension),0,1)*gh; b.fillStyle='#ffffff'; b.fillRect(gx-4,ty-2,22,4);
    gauge(70,T0+60,220,8,1.3-FS.dist,1.3,'#8fe07a','#e0ffd0');
  }
  /* the reel to wind */
  if(IS_TOUCH||FS.phase==='reel'){
    const R=REEL, ry=reelY(); b.fillStyle='rgba(0,0,0,.35)'; b.beginPath(); b.arc(R.x,ry+3,R.r+4,0,7); b.fill();
    if(!drawFishingArt('reel',R.x,ry,0,0,R.r*2.1)){            /* the reel's picture, or a drawn one */
      const rg=b.createRadialGradient(R.x-12,ry-14,4,R.x,ry,R.r); rg.addColorStop(0,'#d8dce4'); rg.addColorStop(1,'#6a707c');
      b.fillStyle='#2a2e38'; b.beginPath(); b.arc(R.x,ry,R.r+2,0,7); b.fill();
      b.fillStyle=rg; b.beginPath(); b.arc(R.x,ry,R.r,0,7); b.fill();
      b.strokeStyle='rgba(40,44,56,.5)'; b.lineWidth=2; b.beginPath(); b.arc(R.x,ry,R.r*0.6,0,7); b.stroke(); }
    /* the crank, sized to the reel */
    const hx=R.x+Math.cos(FS.ang)*R.r*0.66, hy=ry+Math.sin(FS.ang)*R.r*0.66, kr=R.r*0.17;
    b.strokeStyle='#3a3e48'; b.lineWidth=R.r*0.11; b.lineCap='round'; b.beginPath(); b.moveTo(R.x,ry); b.lineTo(hx,hy); b.stroke(); b.lineCap='butt';
    b.fillStyle='#3a3e48'; b.beginPath(); b.arc(R.x,ry,R.r*0.12,0,7); b.fill();
    b.fillStyle='#a8784a'; b.beginPath(); b.arc(hx,hy,kr,0,7); b.fill(); b.fillStyle='#d8a870'; b.beginPath(); b.arc(hx-kr*0.25,hy-kr*0.25,kr*0.45,0,7); b.fill();
  }
  /* the rod lever (touch): a slot with a grip that rides up as it's pulled */
  if(IS_TOUCH&&FS.phase==='reel'){
    const top=rodTop(), gy=top+ROD.h-FS.lift*ROD.h;
    b.fillStyle='rgba(0,0,0,.35)'; b.beginPath(); b.roundRect(ROD.x-13,top-11,26,ROD.h+24,13); b.fill();
    b.fillStyle='#2a2e38'; b.beginPath(); b.roundRect(ROD.x-5,top,10,ROD.h,5); b.fill();
    b.fillStyle='#a8784a'; b.beginPath(); b.roundRect(ROD.x-20,gy-9,40,18,8); b.fill();
    b.fillStyle='#d8a870'; b.beginPath(); b.roundRect(ROD.x-16,gy-7,32,6,3); b.fill();
  }
  rpgWin({x:FSTOP.x,y:FSTOP.y+T0,w:FSTOP.w,h:FSTOP.h});
  if(FS.phase==='lost') rpgWin({x:40,y:150,w:280,h:90});
  if(FS.phase==='caught'){ const key=GOODS[FS.fish].name.toLowerCase(), pic=typeof SHOP_ART!=='undefined'&&SHOP_ART[key];
    rpgWin(pic?{x:40,y:112,w:280,h:168}:{x:40,y:150,w:280,h:130});
    if(pic) drawShopPic(key,180,144,60,40); }      /* its picture (shop items/<name>), when there is one */
  /* coming in: a short fade from black */
  if(FS.inT<FISH_FADE){ FS.inT+=dt; b.fillStyle='rgba(0,0,0,'+(1-FS.inT/FISH_FADE)+')'; b.fillRect(0,T0,LW,T1-T0); }
  blit();
  TS("Stop",FSTOP.x+FSTOP.w/2,FSTOP.y+T0+18,18,'#f4f6ff','center',true);
  const say2=(t,y,sz,col)=>TS(t,180,y,sz,col||'#f4f6ff','center',true);
  if(FS.phase==='ready') say2(IS_TOUCH?"Swipe up to cast!":"Hold J, let go to cast!",T0+40,24,'#ffe08a');
  else if(FS.phase==='cast') say2("Casting...",T0+40,24);
  else if(FS.phase==='wait') say2("Waiting for a bite...",T0+40,22);
  else if(FS.phase==='bite'){ TO("!",fx,fy-18,64,'#ffe04a','center',true,2); say2(IS_TOUCH?"Swipe up — pull the rod!":"W / ↑ — pull the rod!",T0+40,24,'#ffe08a'); }
  else if(FS.phase==='reel'){
    TS("Line",24,165,15,'#f4f6ff','center',true); TS("Reel it in!",180,T0+48,20,'#f4f6ff','center',true);
    TS(IS_TOUCH?"wind the reel":"hold J / Space to reel",REEL.x,reelY()+REEL.r+22,15,'#e8eef8','center');
    TS(IS_TOUCH?"pull the rod ▲":"W / ↑ to pull the rod",IS_TOUCH?ROD.x:ROD.x+40,reelY()+REEL.r+22,15,'#e8eef8','center');
    if(FS.tension>1) say2("Too tight — ease off!",T0+90,20,'#ff8a7a');
    else if(FS.slipping) say2("Zzzz! The drag gives — keep reeling!",T0+90,20,'#ffe08a');
    else if(FS.tension<0.15) say2("The line's slack — reel!",T0+90,20,'#ffe08a'); }
  else if(FS.phase==='caught'){ const g=GOODS[FS.fish];
    say2("You caught a "+g.name+"!",190,24,'#ffe08a'); say2(FS.size+" cm · sells for "+goodsPrice(FS.fish)+"c",222,18,'#c8d4ff');
    if(FS.lunker) say2("That's a \"REEL\" lunker!",246,20,'#ffb04a');
    if(FS.t>500) say2(IS_TOUCH?"tap to continue":"J to continue",268,16,'#8a94c4'); }
  else if(FS.phase==='lost'){ say2(FS.msg,190,20); if(FS.t>500) say2(IS_TOUCH?"tap to continue":"J to continue",222,16,'#8a94c4'); }
}
