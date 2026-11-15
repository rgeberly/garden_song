/* ================================================================
   FISHING at the mountain pond
   Each trip takes FISH_MIN minutes and needs a rod and reel (RODS, sold at Hollis Tools).
   Cast by swiping up (or holding J and letting go: the longer, the further), wait for a
   bite, set the hook by pulling the rod (swipe up, or W / up), then reel it in: on a touch screen wind the reel at the bottom right by circling
   your finger round it, and pull the rod back by dragging up over the bottom left (the
   rod rises; nothing else is drawn or said there); with keys hold J or Space to reel and
   W / up to pull. Pulling the
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
/* How long each fish is, in inches: [smallest usual, biggest usual, near-record], from
   typical sizes of the real species (a crab by its shell's width, an octopus arms and all,
   the dolphin a bottlenose). Most catches fall in the usual range, more often near its
   middle; now and then (LUNKER_P) a big one, up to the near-record: a "REEL" lunker. */
const FISH_SIZE={minnow:[1.5,3,4], perch:[6,10,15], trout:[10,18,26], bass:[12,18,26], catfish:[14,24,40],
  shad:[3,6,9], mullet:[10,18,24], flounder:[12,18,28], speckled:[14,22,30], salmon:[24,34,45],
  croaker:[8,14,20], crab:[4,6,9], octopus:[12,36,50], tarpon:[48,72,96], dolphin:[84,108,150], koi:[18,28,36]};
const LUNKER_P=0.1;
function fishLength(k){
  const [lo,hi,rec]=FISH_SIZE[k]||[6,12,20], big=Math.random()<LUNKER_P;
  const x=big?hi+(rec-hi)*Math.pow(Math.random(),1.5):lo+(hi-lo)*(Math.random()+Math.random())/2;
  return {len:Math.round(x*10)/10,big};
}
/* a length for showing: half inches under 10 inches, whole ones up to 4 feet, then feet and
   inches ("2.5 in", "17 in", "6 ft 3 in"); a crab's is across its shell */
function inchText(n,k){
  const r=Math.round(n), t=n>=48?Math.floor(r/12)+" ft"+(r%12?" "+r%12+" in":""):(n<10?Math.round(n*2)/2:r)+" in";
  return t+(k==='crab'?" across":"");
}
/* the reel's drag: past this tension the line slips out instead of breaking; the scale
   of the tension gauge (it only snaps above 1, held there for SNAP_MS) */
const T_MAX=1.15, dragAt=()=>rodNow().drag, FISH_FADE=400;
const REEL={x:280,r:64}, ROD={x:62,h:84}, FSTOP={x:LW-70,y:14,w:60,h:26};
let FS=null;
/* Where the line can meet the water: 'near' 0 (far away) to 1 (close by), 'side' -1..1
   across it. In each pond picture's own pixels (FISH_WATER, from the far end of the water
   to the near water), or in screen px for the drawn pond. */
const RIVER_WATER={far:{x:470,y:850,half:120},near:{x:830,y:1340,half:210}};   /* the river pictures */
const FISH_WATER={fishing:{far:{x:565,y:845,half:85},near:{x:760,y:1340,half:250}},
                  fishing_spring:RIVER_WATER, fishing_summer:RIVER_WATER, fishing_fall:RIVER_WATER};
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
/* the fish whose pictures (shop items/<name>) face right; the rest face left (the crab and
   octopus face out at you). Update this when a fish's picture changes. */
const FISH_FACES_RIGHT=['bass','catfish','flounder','salmon','dolphin'];
/* How often a hooked fish leaps clear of the water: never (0), a lot ('many', 4-7 times),
   or (anything not listed) once or twice. */
const FISH_LEAPS={minnow:0,crab:0,octopus:0,tarpon:'many',dolphin:'many',bass:'many',mullet:'many'};
const leapsFor=k=>{ const L=FISH_LEAPS[k]; return L===0?0:L==='many'?ri(4,7):ri(1,2); };
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
/* the cast: power 0..1 decides how far out the line lands */
function fishCast(power){
  FS.phase='cast'; FS.t=0; FS.dist=0.55+0.45*clamp(power,0,1); FS.charge=0;
  blip(240,0.08,0.1,'triangle');
}
/* pulling the rod: sets the hook on a bite, scares the fish off before one */
function fishPull(){
  if(FS.phase==='bite'){ FS.phase='reel'; FS.t=0; FS.lift=1; FS.leaps=leapsFor(FS.fish); FS.leapAt=rnd(500,1300); blip(520,0.06,0.15,'square'); fishSplash(0.6); return; }
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
/* pulling the rod back (touch): drag up anywhere over the bottom left, by the rod (nothing
   drawn there: the rod itself rises as it's pulled) */
const rodTop=()=>reelY()-ROD.h/2;
const inRod=(x,y)=>x<REEL.x-REEL.r-24&&y>rodTop()-90&&y<BAND_BOT();
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
    for(let i=0;i<8;i++) FS.splash.push({a:i*0.8,t:500}); blip(880,0.05,0.15,'sine'); fishBuzz(); }
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
      fishSplash(0.35+g.power*0.25); }
    /* a leap clear of the water: the first soon after the hook, the rest spread out */
    if(!FS.leap&&FS.leaps>0&&FS.t>=FS.leapAt){ FS.leaps--; FS.leap={t:0,dur:700,dir:Math.random()<0.5?-1:1}; fishSplash(0.8);
      FS.leapAt=FS.t+(FISH_LEAPS[FS.fish]==='many'?rnd(1200,2600):rnd(2000,4000)); }
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
    else if(FS.dist<=0){ FS.phase='caught'; FS.t=0; const L0=fishLength(FS.fish); FS.size=L0.len; FS.lunker=L0.big; fishSplash(1.2);
      G.goods[FS.fish]=(G.goods[FS.fish]||0)+1;
      const L=G.lore.fish[FS.fish]||(G.lore.fish[FS.fish]={n:0,best:0}); L.n++; L.best=Math.max(L.best,FS.size);
      if(AC){ flute(9,AC.currentTime,.3,.6); flute(13,AC.currentTime+.12,.3,.6); flute(16,AC.currentTime+.24,.6,.6); } }
  }
}
/* The rod and reel pictures (fishing/Spinning Rod, Spinning Reel in the art folder, packed
   into assets/sprites/fishing.png), each with frames (rod_spin, reel_spin) played while the
   reel is wound: the rod laid along a line (its handle end at x0,y0, its tip at x1,y1; each
   rod picture carries where those are on it), the reel held at x0,y0 by FISH_ANCHOR and
   size across its longer side. False until there's a picture. */
let IMG_FISHING=null;
/* where on its picture each piece is held at x0,y0 (fractions across and down): the reel by
   the round cap on its side, where the crank turns (the still and its frames share one box) */
const FISH_ANCHOR={reel:[0.614,0.718]};
/* where the line leaves the rod: the bottom of the tip ring (fractions across and down the
   rod's picture; the same on the still and its frames) */
const ROD_EYE=[0.985,0.026];
/* winding: the frame for how far round the crank is, so many frames a turn (the reel's bail
   spins round twice for each turn of the handle); the still otherwise */
const FISH_SPIN_FRAMES_PER_TURN={rod:8,reel:16};
function fishArtNow(k){
  const F=FISH_ART[k+'_spin'];
  if(!F||!FS||FS.phase!=='reel'||FS.reel<0.08) return FISH_ART[k];
  const n=Math.floor(FS.ang/(Math.PI*2)*(FISH_SPIN_FRAMES_PER_TURN[k]||8));
  return F[((n%F.length)+F.length)%F.length];
}
const fishArtReady=()=>{
  if(typeof FISH_ART==='undefined') return false;
  if(!IMG_FISHING){ IMG_FISHING=new Image(); IMG_FISHING.src='assets/sprites/fishing.png'; }
  return IMG_FISHING.complete&&IMG_FISHING.naturalWidth>0;
};
/* laying a rod picture a along the line x0,y0 (handle end) to x1,y1 (tip): a point on the
   picture (px) to the screen */
function rodToScreen(a,x0,y0,x1,y1,px,py){
  const [,,w,h]=a, [bx,by,tx,ty]=a.length>=8?a.slice(4):[w/2,h,w/2,0];      /* its handle end and tip */
  const s=Math.hypot(x1-x0,y1-y0)/Math.hypot(tx-bx,ty-by), r=Math.atan2(y1-y0,x1-x0)-Math.atan2(ty-by,tx-bx);
  const dx=(px-bx)*s, dy=(py-by)*s;
  return {x:x0+dx*Math.cos(r)-dy*Math.sin(r), y:y0+dx*Math.sin(r)+dy*Math.cos(r), s, r, bx, by};
}
function drawFishingArt(k,x0,y0,x1,y1,size){
  if(!fishArtReady()||!FISH_ART[k]) return false;
  const a=fishArtNow(k), [sx,sy,w,h]=a, [ax,ay]=FISH_ANCHOR[k]||[0.5,0.5];
  b.save(); b.imageSmoothingEnabled=true; b.translate(x0,y0);
  if(size){ const s=size/Math.max(w,h); b.drawImage(IMG_FISHING,sx,sy,w,h,-w*s*ax,-h*s*ay,w*s,h*s); }
  else { const T=rodToScreen(a,x0,y0,x1,y1,0,0);
    b.rotate(T.r); b.scale(T.s,T.s); b.drawImage(IMG_FISHING,sx,sy,w,h,-T.bx,-T.by,w,h); }
  b.restore(); return true;
}
/* The lure on the end of the line: a little firetiger crankbait, nose along angle a, k as big
   as things look there, alpha see-through and deep (0..1) sinking into the water */
const LURE_SINK_MS=450;
function drawLure(x,y,a,k,alpha,deep){
  b.save(); b.translate(x,y); b.rotate(a); b.scale(k*1.15,k*1.15); b.globalAlpha=Math.max(0,alpha);
  b.lineCap='round';
  b.strokeStyle='#5a5e66'; b.lineWidth=0.5;                       /* the treble hooks, belly and tail */
  [[0.4,2.2],[-4.6,0.6]].forEach(([hx,hy])=>{ b.beginPath(); b.moveTo(hx,hy-0.6); b.lineTo(hx,hy+0.9);
    b.moveTo(hx-1.1,hy+0.4); b.quadraticCurveTo(hx-1.2,hy+1.8,hx,hy+1.8); b.quadraticCurveTo(hx+1.2,hy+1.8,hx+1.1,hy+0.4); b.stroke(); });
  b.fillStyle='rgba(220,236,250,.75)'; b.beginPath();             /* the clear diving lip */
  b.moveTo(4.6,0.4); b.lineTo(7.4,2.2); b.lineTo(6.6,3.0); b.lineTo(4.0,1.4); b.closePath(); b.fill();
  const g=b.createLinearGradient(0,-2.4,0,2.4);                   /* the body: dark back, bright sides, orange belly */
  g.addColorStop(0,'#2d5a24'); g.addColorStop(0.35,'#a8c832'); g.addColorStop(0.62,'#e4e04a'); g.addColorStop(1,'#f07a28');
  b.fillStyle=g; b.beginPath(); b.ellipse(0,0,5.4,2.4,0,0,7); b.fill();
  b.save(); b.clip(); b.fillStyle='rgba(20,30,16,.75)';            /* tiger stripes */
  [-2.6,-0.8,1.0].forEach(sx=>{ b.beginPath(); b.moveTo(sx,-2.6); b.lineTo(sx+0.9,-2.6); b.lineTo(sx+0.3,0.6); b.lineTo(sx-0.4,0.6); b.fill(); });
  b.restore();
  b.strokeStyle='rgba(16,24,12,.8)'; b.lineWidth=0.35; b.beginPath(); b.ellipse(0,0,5.4,2.4,0,0,7); b.stroke();
  b.fillStyle='rgba(255,255,255,.55)'; b.beginPath(); b.ellipse(0.4,-1.3,3.4,0.45,0,0,7); b.fill();   /* shine */
  b.fillStyle='#fff6d0'; b.beginPath(); b.arc(3.3,-0.5,0.85,0,7); b.fill();                            /* eye */
  b.fillStyle='#141414'; b.beginPath(); b.arc(3.5,-0.5,0.45,0,7); b.fill();
  if(deep>0){ b.fillStyle='rgba(30,90,120,'+Math.min(0.9,deep)+')';                                   /* under the water */
    b.beginPath(); b.ellipse(0,0,5.6,2.6,0,0,7); b.fill(); }
  b.restore();
}
/* The line's tension meter at the left while reeling: a brushed-metal frame like the reel's,
   coloured bands (top to bottom: snapping, the drag slipping, just right, slack) behind
   glass, and a pointer at the tension; it glows red when the line is about to snap. */
const LINE_METER={x:14,y:178,h:176,w:14};
function drawLineMeter(x,y,h){
  const w=LINE_METER.w, at=t=>y+clamp(1-t/T_MAX,0,1)*h, DRAG=dragAt(), ty=at(FS.tension);
  b.save();
  if(FS.tension>1){ b.shadowColor='rgba(255,60,40,'+(0.6+0.4*Math.sin(G.t/90))+')'; b.shadowBlur=14; }
  const m=b.createLinearGradient(x-6,0,x+w+6,0);                       /* the frame */
  m.addColorStop(0,'#3e4148'); m.addColorStop(0.25,'#c4c7cd'); m.addColorStop(0.5,'#8e9299'); m.addColorStop(0.8,'#d6d9de'); m.addColorStop(1,'#4a4d54');
  b.fillStyle=m; b.beginPath(); b.roundRect(x-6,y-12,w+12,h+24,9); b.fill(); b.restore();
  b.strokeStyle='#15171b'; b.lineWidth=1; b.beginPath(); b.roundRect(x-6,y-12,w+12,h+24,9); b.stroke();
  [y-6,y+h+6].forEach(sy=>{ b.fillStyle='#2a2c32'; b.beginPath(); b.arc(x+w/2,sy,2.6,0,7); b.fill();   /* screws */
    b.fillStyle='#b8bcc3'; b.beginPath(); b.arc(x+w/2-0.6,sy-0.6,1.4,0,7); b.fill(); });
  b.fillStyle='#0b0e14'; b.beginPath(); b.roundRect(x-1.5,y-1.5,w+3,h+3,6); b.fill();
  b.save(); b.beginPath(); b.roundRect(x,y,w,h,5); b.clip();
  [['#c8322a','#ff7a62',y,at(1)],['#d8a420','#ffe27a',at(1),at(DRAG)],['#2f9e44','#8ff08a',at(DRAG),at(0.15)],['#d8a420','#ffe27a',at(0.15),y+h]]
    .forEach(([c,hi,y0,y1])=>{ const g=b.createLinearGradient(x,0,x+w,0); g.addColorStop(0,c); g.addColorStop(0.45,hi); g.addColorStop(1,c);
      b.fillStyle=g; b.fillRect(x,y0,w,y1-y0); b.fillStyle='rgba(0,0,0,.45)'; b.fillRect(x,y1-0.5,w,1); });
  const sh=b.createLinearGradient(0,y,0,y+h); sh.addColorStop(0,'rgba(0,0,0,.25)'); sh.addColorStop(0.1,'rgba(0,0,0,0)');
  sh.addColorStop(0.9,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,.3)'); b.fillStyle=sh; b.fillRect(x,y,w,h);
  b.fillStyle='rgba(255,255,255,.28)'; b.fillRect(x+2,y+3,2.5,h-6);   /* the glass's shine */
  b.restore();
  /* the pointer: a bar across the glass and an arrow on the frame */
  b.fillStyle='#15171b'; b.beginPath(); b.roundRect(x-3,ty-2.5,w+6,5,2.5); b.fill();
  b.fillStyle='#ffffff'; b.beginPath(); b.roundRect(x-2,ty-1.5,w+4,3,1.5); b.fill();
  b.beginPath(); b.moveTo(x+w+5,ty); b.lineTo(x+w+12,ty-5.5); b.lineTo(x+w+12,ty+5.5); b.closePath();
  b.fillStyle='#15171b'; b.fill(); b.beginPath(); b.moveTo(x+w+6.5,ty); b.lineTo(x+w+11,ty-3.6); b.lineTo(x+w+11,ty+3.6); b.closePath();
  b.fillStyle=FS.tension>1?'#ff7a62':FS.tension>DRAG?'#ffe27a':'#f4f6ff'; b.fill();
}
/* a bite: a buzz on a phone that can (not iPhones, whose browsers don't allow it) */
function fishBuzz(){ try{ if(navigator.vibrate) navigator.vibrate([90,60,140]); }catch(e){} }
/* where the line leaves the rod laid from x0,y0 to x1,y1 (the tip itself without a picture) */
function rodEye(x0,y0,x1,y1){
  if(!fishArtReady()||!FISH_ART.rod) return {x:x1,y:y1};
  const a=fishArtNow('rod'); return rodToScreen(a,x0,y0,x1,y1,a[2]*ROD_EYE[0],a[3]*ROD_EYE[1]);
}
/* the pond picture for the season (scenes/fishing_<season>, or scenes/fishing; none for
   winter, when the pond is frozen and there's no fishing), once it has loaded; a drawn pond
   until then */
/* a leaping fish: where it is, its tilt, and where its mouth is (the line stays on it) */
function leapPose(fx,fy,ws){
  const q=FS.leap.t/FS.leap.dur, g=GOODS[FS.fish], dir=FS.leap.dir, hgt=Math.sin(q*Math.PI)*(30+g.power*10)*ws;
  const x=fx+dir*(q-0.5)*28*ws, y=fy-hgt, a=dir*(q-0.5)*2.2;
  const r=typeof SHOP_ART!=='undefined'&&SHOP_ART[g.name.toLowerCase()];
  const hw=r?(20+g.power*7)*ws*1.5*r[2]/Math.max(r[2],r[3])/2:(9+g.power*2)*ws*1.5;      /* half its length as drawn */
  return {q,x,y,a,dir,mx:x+Math.cos(a)*dir*hw*0.9,my:y+Math.sin(a)*dir*hw*0.9};
}
/* The hooked fish's shadow under the water: its own picture (shop items/<name>) as a dark
   silhouette, flattened, facing the way it swims; a drawn fish shape when it has none. */
const FISH_SIL={};
function fishSilhouette(k){
  if(FISH_SIL[k]) return FISH_SIL[k];
  const r=typeof SHOP_ART!=='undefined'&&SHOP_ART[GOODS[k].name.toLowerCase()], img=r&&shopArtImg();
  if(!img||!img.complete||!img.naturalWidth) return null;
  const [sx,sy,w,h]=r, c=document.createElement('canvas'); c.width=w; c.height=h;
  const x=c.getContext('2d'); x.drawImage(img,sx,sy,w,h,0,0,w,h);
  x.globalCompositeOperation='source-in'; x.fillStyle='#0a1a2a'; x.fillRect(0,0,w,h);
  return FISH_SIL[k]={c,w,h};
}
function drawFishShadow(k,x,y,ws,dir){
  const g=GOODS[k], S=fishSilhouette(k), L=(20+g.power*7)*ws*1.3;
  b.save(); b.translate(x,y); b.rotate(Math.sin(G.t/300)*0.12); b.globalAlpha=0.42;
  if(S){ const s=L/Math.max(S.w,S.h);
    b.scale(dir*(FISH_FACES_RIGHT.includes(k)?1:-1),0.55); b.imageSmoothingEnabled=true;
    b.drawImage(S.c,-S.w*s/2,-S.h*s/2,S.w*s,S.h*s); }
  else { b.scale(dir*ws,ws*0.6); b.fillStyle='#0a1a2a';
    b.beginPath(); b.ellipse(0,0,10+g.power*5,4+g.power*1.5,0,0,7); b.fill();
    b.beginPath(); b.moveTo(-9-g.power*5,0); b.lineTo(-16-g.power*5,-5); b.lineTo(-16-g.power*5,5); b.fill(); }
  b.restore();
}
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
  const LP=FS.leap&&FS.fish?leapPose(fx,fy,ws):null;        /* a fish leaping clear, the line on its mouth */
  /* the rod, from the bottom left; its tip swings up as it is pulled back */
  const art=typeof FISH_ART!=='undefined'&&FISH_ART.rod;     /* the rod's picture is long and slim */
  const wind=FS.phase==='ready'?FS.charge:0;               /* winding up a cast tips the rod back */
  const baseX=26, baseY=T1-36, tipX=(art?74:52)+FS.lift*8-wind*40, tipY=T1-(art?290:170)-FS.lift*(art?50:42)+wind*30;
  const eye=rodEye(baseX,baseY,tipX,tipY);                 /* where the line leaves the rod */
  /* in the air: the line's end (the lure) arcs from the rod tip out to where it lands */
  let lureA=0;
  if(FS.phase==='ready'){ fx=eye.x+6; fy=eye.y+40; }
  else if(FS.phase==='cast'){ const q=clamp(FS.t/THROW_MS,0,1);
    fx=eye.x+(W.x-eye.x)*q; fy=eye.y+(W.y-eye.y)*q-Math.sin(q*Math.PI)*90; ws=0.9+(W.s-0.9)*q;
    lureA=Math.atan2((W.y-eye.y)-Math.cos(q*Math.PI)*Math.PI*90,W.x-eye.x); }   /* nose along its flight */
  if(!drawFishingArt('rod',baseX,baseY,tipX,tipY)){
    b.strokeStyle='#5a3a1e'; b.lineWidth=3; b.beginPath(); b.moveTo(baseX,baseY); b.lineTo(tipX,tipY); b.stroke(); }
  /* the line, half see-through; in the water its end bobs (hard when something bites) */
  const inWater=FS.phase!=='cast'&&FS.phase!=='ready';
  const bob=!inWater?0:(FS.phase==='bite'?Math.sin(G.t/40)*4:Math.sin(G.t/400)*1.5)*ws;
  b.strokeStyle='rgba(255,255,255,.5)'; b.lineWidth=1;
  const ex=LP?LP.mx:fx, ey=LP?LP.my:fy+bob;
  b.beginPath(); b.moveTo(eye.x,eye.y); b.quadraticCurveTo((eye.x+ex)/2,(eye.y+ey)/2+(1-FS.tension)*40,ex,ey); b.stroke();
  /* the lure: seen only while it flies out, then it sinks out of sight */
  if(FS.phase==='cast') drawLure(fx,fy,lureA,ws,1,0);
  else if(FS.phase==='wait'&&FS.t<LURE_SINK_MS){ const q=FS.t/LURE_SINK_MS; drawLure(fx,fy+q*5*ws,0.5*q,ws,1-q,q); }
  /* winding up a cast (keys): how far it'll go */
  if(FS.phase==='ready'&&FS.charge>0){ gauge(110,T1-150,140,8,FS.charge,1,'#f0c84a','#fff0b0'); }
  if(FS.phase!=='cast'&&FS.phase!=='ready'){
    if((FS.phase==='reel'||FS.phase==='caught')&&!FS.leap){       /* the fish's shadow under the line */
      const dart=FS.burst>0?Math.sin(G.t/60)*3:Math.sin(G.t/160)*2;
      if(Math.abs(FS.sideTo-FS.side)>0.02) FS.swimDir=FS.sideTo>FS.side?1:-1;
      drawFishShadow(FS.fish,fx+dart*ws,fy+7*ws,ws,FS.swimDir||1); }
    FS.rings.forEach(r=>{ const q=clamp((r.t-r.delay)/r.dur,0,1); if(q<=0) return;
      b.globalAlpha=(1-q)*0.8; b.strokeStyle='#ffffff'; b.lineWidth=1.4;
      b.beginPath(); b.ellipse(r.x,r.y+2,r.r*(0.4+q*1.6),r.r*(0.4+q*1.6)*0.32,0,0,7); b.stroke(); });
    b.globalAlpha=1;
    FS.splash.forEach(s=>{ const r=(500-s.t)/500*22*ws; b.globalAlpha=s.t/500; b.strokeStyle='#ffffff'; b.lineWidth=1.5;
      b.beginPath(); b.ellipse(fx,fy+3,r,r*0.35,0,0,7); b.stroke(); b.globalAlpha=1; });
    /* a leap: the fish arcs out of the water and back in */
    if(LP){ const q=LP.q, g=GOODS[FS.fish];
      b.save(); b.translate(LP.x,LP.y); b.rotate(LP.a);
      /* its own picture (shop items/<name>), nose first; a drawn fish when there's none */
      const pk=g.name.toLowerCase(), r=typeof SHOP_ART!=='undefined'&&SHOP_ART[pk], img=r&&shopArtImg();
      if(img){ const [sx,sy,w,h]=r, L=(20+g.power*7)*ws*1.5, s=L/Math.max(w,h);
        b.scale(FS.leap.dir*(FISH_FACES_RIGHT.includes(FS.fish)?1:-1),1); b.imageSmoothingEnabled=true;
        b.globalAlpha=clamp(Math.min(q,1-q)*8,0,1);             /* coming out of and back into the water */
        b.drawImage(img,sx,sy,w,h,-w*s/2,-h*s/2,w*s,h*s); b.restore(); }
      else { b.scale(FS.leap.dir*ws*1.5,ws*1.5);
      b.fillStyle=g.col; b.beginPath(); b.ellipse(0,0,9+g.power*2,4,0,0,7); b.fill();
      b.beginPath(); b.moveTo(-8-g.power*2,0); b.lineTo(-14-g.power*2,-5); b.lineTo(-14-g.power*2,5); b.fill();
      b.fillStyle='rgba(255,255,255,.45)'; b.beginPath(); b.ellipse(1,-1.5,6,1.4,0,0,7); b.fill();
      b.fillStyle='#1a1a2a'; b.beginPath(); b.arc(6,-1,1,0,7); b.fill(); b.restore(); } }
    FS.drops.forEach(d=>{ b.globalAlpha=Math.max(0,1-d.t/900); b.fillStyle='#ffffff';
      b.beginPath(); b.arc(d.x,d.y,1.3*ws+0.4,0,7); b.fill(); });
    b.globalAlpha=1;
  }
  /* tension (left) and distance (top) gauges */
  if(FS.phase==='reel'){
    drawLineMeter(LINE_METER.x,LINE_METER.y,LINE_METER.h);
    gauge(70,T0+60,220,8,1.3-FS.dist,1.3,'#8fe07a','#e0ffd0');
  }
  /* the reel to wind */
  if(IS_TOUCH||FS.phase==='reel'){
    const R=REEL, ry=reelY();
    b.save(); b.shadowColor='rgba(0,0,0,.5)'; b.shadowBlur=8; b.shadowOffsetY=3;
    const pic=drawFishingArt('reel',R.x,ry,0,0,R.r*2.1); b.restore();
    if(!pic){                                                   /* the reel's picture, or a drawn one */
      b.fillStyle='rgba(0,0,0,.35)'; b.beginPath(); b.arc(R.x,ry+3,R.r+4,0,7); b.fill();
      const rg=b.createRadialGradient(R.x-12,ry-14,4,R.x,ry,R.r); rg.addColorStop(0,'#d8dce4'); rg.addColorStop(1,'#6a707c');
      b.fillStyle='#2a2e38'; b.beginPath(); b.arc(R.x,ry,R.r+2,0,7); b.fill();
      b.fillStyle=rg; b.beginPath(); b.arc(R.x,ry,R.r,0,7); b.fill();
      b.strokeStyle='rgba(40,44,56,.5)'; b.lineWidth=2; b.beginPath(); b.arc(R.x,ry,R.r*0.6,0,7); b.stroke(); }
    /* the crank, sized to the reel */
    /* the crank, sized to the reel, in the art's colours: a silver arm, a black knob */
    const hx=R.x+Math.cos(FS.ang)*R.r*0.66, hy=ry+Math.sin(FS.ang)*R.r*0.66, kr=R.r*0.17;
    b.lineCap='round'; b.beginPath(); b.moveTo(R.x,ry); b.lineTo(hx,hy);
    b.strokeStyle='#1c1e23'; b.lineWidth=R.r*0.14; b.stroke();
    b.strokeStyle='#a4a8b0'; b.lineWidth=R.r*0.08; b.stroke();
    b.strokeStyle='rgba(255,255,255,.45)'; b.lineWidth=R.r*0.025; b.stroke(); b.lineCap='butt';
    b.fillStyle='#1c1e23'; b.beginPath(); b.arc(R.x,ry,R.r*0.14,0,7); b.fill();
    b.fillStyle='#8a8e96'; b.beginPath(); b.arc(R.x,ry,R.r*0.09,0,7); b.fill();
    b.fillStyle='#0c0d10'; b.beginPath(); b.arc(hx,hy,kr,0,7); b.fill();
    const kg=b.createRadialGradient(hx-kr*0.35,hy-kr*0.35,kr*0.1,hx,hy,kr*0.9); kg.addColorStop(0,'#5a5d66'); kg.addColorStop(1,'#141519');
    b.fillStyle=kg; b.beginPath(); b.arc(hx,hy,kr*0.82,0,7); b.fill();
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
    TS("Line",LINE_METER.x+LINE_METER.w/2,LINE_METER.y-18,15,'#f4f6ff','center',true); TS("Reel it in!",180,T0+48,20,'#f4f6ff','center',true);
    if(FS.tension>1) say2("Too tight — ease off!",T0+90,20,'#ff8a7a');
    else if(FS.slipping) say2("Zzzz! The drag gives — keep reeling!",T0+90,20,'#ffe08a');
    else if(FS.tension<0.15) say2("The line's slack — reel!",T0+90,20,'#ffe08a'); }
  else if(FS.phase==='caught'){ const g=GOODS[FS.fish];
    say2("You caught a "+g.name+"!",190,24,'#ffe08a'); say2(inchText(FS.size,FS.fish)+" · sells for "+goodsPrice(FS.fish)+"c",222,18,'#c8d4ff');
    if(FS.lunker) say2("That's a \"REEL\" lunker!",246,20,'#ffb04a');
    if(FS.t>500) say2(IS_TOUCH?"tap to continue":"J to continue",268,16,'#8a94c4'); }
  else if(FS.phase==='lost'){ say2(FS.msg,190,20); if(FS.t>500) say2(IS_TOUCH?"tap to continue":"J to continue",222,16,'#8a94c4'); }
}
