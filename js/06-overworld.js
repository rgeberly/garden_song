/* ================================================================
   WORLD SCENE
   ================================================================ */
/* into the garden with whatever game is loaded (see the title's menu in 13-main.js) */
function startGame(){ G.scene='world'; initMusic(); setMusic(areaMusic());
  say("Plant several beds — songs carry across the garden."); preloadSeasonMaps(); shopArtImg(); partyImg(); }
/* "near" checks take a reach factor: 1 for what A/J acts on, PROMPT_REACH for when the
   overhead prompt shows, so prompts only appear once she is right beside something */
const PROMPT_REACH=0.5;
const SEED_DROP=0.15;    /* chance a harvest also gives back a seed */
function nearestPlot(f=1){
  let best=null,bd=1e9;
  for(const p of plots){ if(!active(p))continue;
    const d=Math.hypot(p.x-G.player.x,p.y-G.player.y); if(d<bd){bd=d;best=p;} }
  return bd<40*f?best:null;
}
const nearestFrog=(f=1)=>FROGS.find(fr=>Math.hypot(fr.x-G.player.x,fr.y-G.player.y)<32*f);
const nearestPest=()=>G.pests.find(p=>Math.hypot(p.x-G.player.x,p.y-G.player.y)<26);
const nearStall=(f=1)=>Math.hypot(STALL.x-G.player.x,STALL.y+6-G.player.y)<44*f;
const nearDoor=(f=1)=>ZONES?herZone(10*f)===3||zoneAt(G.player.x,G.player.y+9-8*f)===3
                          :Math.hypot(HOUSE_DOOR.x-G.player.x,HOUSE_DOOR.y-G.player.y)<46*f;
function interact(){
  if(G.cast) return;                       /* mid-song */
  if(G.area!=='garden'){ placeInteract(); return; }
  if(G.indoors){ houseInteract(); return; }
  if(nearBling()){ talkBling(); return; }
  if(nearStall()){ openShop(); return; }
  if(nearDoor()){ travel(enterHouse); return; }
  const way=!ZONES&&nearGardenExit(); if(way){ goTo(way.to); return; }
  if(G.swim){ G.party.forEach(id=>member(id).mp=memberMaxMp(id)); say("Music Points fully restored!"); return; }
  const frog=nearestFrog();
  if(frog){
    if(G.frogT<=0){ G.party.forEach(id=>member(id).hp=member(id).maxhp); G.frogT=gearOn('charm')?12000:25000;
      say(G.party.length>1?"A frog croaks a healing chord. Everyone's HP is full!":"A frog croaks a healing chord. HP full!");
      G.croak={t:0,x:frog.x,y:frog.y};
      if(AC){flute(2,AC.currentTime,.7,.6);flute(9,AC.currentTime+.05,.8,.5);} }
    else say("The frog blinks sleepily.");
    return;
  }
  const plot=nearestPlot();
  if(!plot){ say("Nothing here. Find a garden bed."); return; }
  if(plot.dead&&wormIn(plot)){ pickWorm(plot); return; }          /* for Tiny One */
  if(plot.dead){ plot.dead=false; plot.deadSp=null; say("Cleared away the ruined plant."); blip(260,0.08,0.12,'triangle'); return; }
  if(!plot.sp){ openSeedMenu(plot); return; }
  if(plot.stage>=3){ harvest(plot); return; }
  if(plot.growth>=plantNeed(plot)){ say("Fully grown! It will be ripe for harvest tomorrow."); return; }
  /* one song per plant per day keeps the days moving */
  if(plot.sungDay===G.day){ say("This plant already had its song today. Come back tomorrow!"); return; }
  startRhythm(plot);
}
/* Harvest goes into the basket (G.crops) for selling at the stall or eating;
   it earns XP, not coins. Returns the XP gained. */
function harvestOne(plot){
  const S=SPECIES[plot.sp];
  G.crops[plot.sp]=(G.crops[plot.sp]||0)+1;
  addXp(S.xp); addGardenXp(Math.round(S.xp*1.2)); G.harvests++;
  if(Math.random()<SEED_DROP) G.seeds[plot.sp]=(G.seeds[plot.sp]||0)+1;   /* seeds are mostly bought */
  Object.assign(plot,{sp:null,stage:0,growth:0,health:100,sungDay:0,fullDay:0});
  return S.xp;
}
function harvest(plot){
  let xp=0,n=0; const name=SPECIES[plot.sp].name;
  if(gearOn('basket')){
    plots.forEach(p=>{ if(active(p)&&p.sp&&p.stage>=3&&plotArea(p)===plotArea(plot)){ xp+=harvestOne(p); n++; } });
  } else { xp=harvestOne(plot); n=1; }
  G.player.mp=Math.min(maxMp(),G.player.mp+2*n);
  say((n>1?"Harvested "+n+" crops!":"Harvested a "+name+"!")+"  "+xpEach(xp));
  if(AC){flute(6,AC.currentTime,.3,.6);flute(11,AC.currentTime+.1,.35,.6);flute(14,AC.currentTime+.2,.5,.6);}
  autoSave();
}
/* the pests that can turn up now (ghosts only come out after dark) */
const pestPool=()=>G.area==='mountain'?mtnPool():
  Object.keys(PESTS).filter(k=>!PESTS[k].boss&&!PESTS[k].where&&PESTS[k].min<=G.gardenLv&&(!PESTS[k].night||isNight()));
function spawnPest(){
  if(G.pests.length>=(G.lureT>0?5:3)) return;
  /* with nothing growing, pests still turn up now and then and just wander, so
     there is always a way to earn a few coins */
  const planted=plots.filter(p=>active(p)&&p.sp);
  if(!planted.length&&Math.random()>WANDER_SPAWN) return;
  const pool=pestPool();
  let sp=pool[ri(0,pool.length-1)];
  if(G.gardenLv>=5&&Math.random()<0.07) sp='hoa';

  let x,y,guard=0;
  do{ const e=ri(0,3);
      x=e===0?F(.12):e===1?F(.88):ri(F(.12),F(.88));
      y=e===2?F(.30):e===3?F(.72):ri(F(.30),F(.72));
  } while(solidAt(x,y)&&guard++<40);
  const lv=pestLevel(sp);
  G.pests.push({species:sp,lv,x,y,target:planted.length?planted[ri(0,planted.length-1)]:null,hp:pestStats(sp,lv).hp,chew:0});
  if(sp==='hoa') say("The HOA President is inspecting your yard!");
}
const WANDER_SPAWN=0.35;
const TIMID_GAP=3, TIMID_NEAR=90;   /* see updateWorld */   /* chance a pest still comes when nothing is planted */
function wanderSpot(){
  let x,y,guard=0;
  do{ x=ri(F(.15),F(.85)); y=ri(F(.28),F(.72)); } while(solidAt(x,y)&&guard++<30);
  return {x,y};
}
/* WASD / arrows / the pad move her at speed (px per ms) unless blocked(x,y) says no;
   used in the garden and in the house */
function walk(dt,speed,blocked){
  const P=G.player;
  let dx=0,dy=0;
  if(keys['arrowleft']||keys['a']) dx-=1;
  if(keys['arrowright']||keys['d']) dx+=1;
  if(keys['arrowup']||keys['w']) dy-=1;
  if(keys['arrowdown']||keys['s']) dy+=1;
  dx+=padVec.x; dy+=padVec.y;
  const mm=Math.hypot(dx,dy);
  if(mm>0.15){
    dx/=mm; dy/=mm; P.aimX=dx; P.aimY=dy;
    /* boosts (running in the boots: twice as fast; coffee, a snack); on the touch pad they
       grow with how far it's pushed */
    P.running=running();
    const boost=(P.running?2:1)*(G.coffeeT>0?1.5:1)*(G.snackT>0?1.25:1);
    const onPad=padId!==null&&!(keys['w']||keys['a']||keys['s']||keys['d']||keys['arrowup']||keys['arrowdown']||keys['arrowleft']||keys['arrowright']);
    const mul=(onPad?1+(boost-1)*padAmp:boost)*(G.swim?0.62:1);
    const sp=speed*mul*dt;
    const nx=P.x+dx*sp, ny=P.y+dy*sp;
    if(!blocked(nx,P.y)) P.x=nx;
    if(!blocked(P.x,ny)) P.y=ny;
    P.dir=dirFromVec(dx,dy);
    // steps quicken with boots/coffee (and slow in water) so her feet don't slide
    P.walkT+=dt*mul; P.moving=true; P.animT=P.walkT;
  } else {
    P.moving=false; P.running=false; P.walkT=0;
    P.idleT=(P.idleT||0)+dt; P.animT=P.idleT;
  }
  if(sfxOn){
    // idle has its breathing loop; walking is silent (no footstep loop)
    const want=P.moving?'walk':'idle';
    if(want!==sfxAnim){ sfxAnim=want; setSfx(P.moving?null:'idle_'+DIRMAP[P.dir&7][0]); }
  }
}
function updateWorld(dt){
  tickClock(dt);
  if(G.scene!=='world') return;          /* midnight sent her to bed */
  if(G.area!=='garden'){ updatePlace(dt); return; }
  if(G.indoors){ updateHouse(dt); return; }
  if(updateCast(dt)) return;               /* she stands and plays a field song */
  const P=G.player;
  walk(dt,WALK_SPEED,(x,y)=>solidAt(x,y+9));
  P.x=clamp(P.x,21,WORLD_W-21); P.y=clamp(P.y,24,WORLD_H-30);
  /* walking down the path to town or up the trail takes her there */
  const z=herZone();
  if((z===1||z===2)&&exitArmed){ goTo(z===1?'town':'mountain'); return; }
  if(z!==1&&z!==2) exitArmed=true;
  const wasSwim=G.swim;
  G.swim=season()!=='winter'&&inPool(P.x,P.y+9);   /* frozen in winter: she walks on the ice */
  if(G.swim&&!wasSwim){ say("Ahh. Music Points restoring..."); blip(500,0.12,0.15,'sine'); }
  if(G.swim){ G.mpTick+=dt; if(G.mpTick>380){ G.mpTick=0;
    G.party.forEach(id=>{ const M=member(id); if(M.mp<memberMaxMp(id)) M.mp++; });
    if(P.mp===maxMp()&&!G.party.some(id=>member(id).mp<memberMaxMp(id))) { if(!G.mpFullSaid) say("Music Points full!"); G.mpFullSaid=true; } else G.mpFullSaid=false; } }
  for(const k of ['coffeeT','snackT','calmT','lureT']) if(G[k]>0) G[k]=Math.max(0,G[k]-dt);
  /* lantern and lemongrass keep pests away, muscadine draws them in */
  const pestMul=(G.yard.lantern?1.4:1)*(G.calmT>0?2:1)*(G.lureT>0?0.5:1);
  G.pestTimer-=dt;
  if(G.pestTimer<=0){ G.pestTimer=rnd(10000,17000)*pestMul/diff().spawn; spawnPest(); }
  const meanLv=G.party.reduce((a,id)=>a+member(id).lv,0)/G.party.length;
  for(const p of G.pests){
    if(Math.hypot(p.x-P.x,p.y-(P.y+6))<20){ startBattle(p); return; }
    /* a pest well below the party (more than TIMID_GAP levels) turns tail when she comes near */
    const near=Math.hypot(p.x-P.x,p.y-P.y);
    p.flee=!PESTS[p.species].boss&&(p.lv||PESTS[p.species].lv)<meanLv-TIMID_GAP&&near<TIMID_NEAR;
    if(p.flee){ const fx=(p.x-P.x)/(near||1), fy=(p.y-P.y)/(near||1), sp=0.05*dt;
      const nx=clamp(p.x+fx*sp,F(.06),F(.94)), ny=clamp(p.y+fy*sp,F(.2),F(.8));
      if(!solidAt(nx,p.y)) p.x=nx; if(!solidAt(p.x,ny)) p.y=ny;
      p.face=fx>0; p.roam=null; continue; }
    if(!p.target||!p.target.sp||!active(p.target)){
      const growing=plots.filter(q=>active(q)&&q.sp);
      p.target=growing.length?growing[ri(0,growing.length-1)]:null;
    }
    /* no crop to chew: amble between random open spots on the lawn */
    if(!p.target&&(!p.roam||Math.hypot(p.roam.x-p.x,p.roam.y-p.y)<6)) p.roam=wanderSpot();
    const goal=p.target||p.roam, ddx=goal.x-p.x, ddy=goal.y-p.y, d=Math.hypot(ddx,ddy)||1;
    const spd=(p.species==='hoa'?0.017:0.024)*(p.slow||1)*(p.target?1:0.6);
    if(d>9||!p.target){ p.x+=ddx/d*spd*dt; p.y+=ddy/d*spd*dt; p.face=false; }
    else if(p.target.sp){
      p.chew+=dt;
      if(p.chew>1600){ p.chew=0;
        const bite=p.species==='hoa'?12:6;
        p.target.health=Math.max(0,p.target.health-bite);
        setGrowth(p.target,p.target.growth-bite*1.5);
        if(p.target.health<=0){ say("A plant was ruined! Clear it away to replant.");
          Object.assign(p.target,{deadSp:p.target.sp,sp:null,stage:0,growth:0,health:100,dead:true,deadDay:G.day,sungDay:0,fullDay:0}); } } }
  }
  if(G.frogT>0) G.frogT-=dt;
  if(G.croak){ G.croak.t+=dt; if(G.croak.t>CROAK_MS) G.croak=null; }
  if(G.msgT>0) G.msgT-=dt;
  G.wildT-=dt;
  if(G.wildT<=0){ G.wildT=rnd(5000,12000); if(WILD.length<4) spawnWild(); }
  for(let i=WILD.length-1;i>=0;i--){
    const w=WILD[i]; w.t+=dt; w.x+=w.vx*dt; w.y+=w.vy*dt;
    if(w.x<-40||w.x>WORLD_W+40) WILD.splice(i,1);
  }
}
/* The camera works in world px; the view shows LW/WORLD_ZOOM by VIEW_H/WORLD_ZOOM of
   them (VIEW_H grows on tall screens). */
const VIEW_WW=LW/WORLD_ZOOM;
function camera(){ const vh=VIEW_H/WORLD_ZOOM, [W,H]=areaSize();
  return {x:clamp(Math.round(G.player.x-VIEW_WW/2),0,W-VIEW_WW),
          y:clamp(Math.round(G.player.y-vh/2+15),0,H-vh)}; }
/* where a world point lands in the garden view, in logical screen px */
const toView=(wx,wy,cam)=>[(wx-cam.x)*WORLD_ZOOM,(wy-cam.y)*WORLD_ZOOM];
/* how wide the soft patch under each yard decoration is (garden px) */
const DECOR_SHADOW_W={fountain:22,arch:[[-32,13],[32,13]],lantern:12,bath:14};   /* the arch: one under each post */
/* a frog's healing croak: green rings ripple out from it, notes rise, and sparkles
   lift off Kaitlyn as she's healed */
const CROAK_MS=1800;
function drawCroakFx(cam){
  const c=G.croak, k=c.t/CROAK_MS, fx=c.x-cam.x, fy=c.y-cam.y, P=G.player, kx=P.x-cam.x, ky=P.y-cam.y;
  for(let i=0;i<3;i++){ const q=clamp(k*1.5-i*0.2,0,1); if(q<=0||q>=1) continue;
    b.globalAlpha=(1-q)*0.7; b.strokeStyle=i%2?'#c8f0a0':'#7cd06a'; b.lineWidth=3-i*0.6;
    b.beginPath(); b.ellipse(fx,fy,q*140,q*80,0,0,7); b.stroke(); }
  for(let i=0;i<4;i++){ const q=(k*1.4+i/4)%1;
    noteGlyph(b,Math.round(fx+Math.sin(i*2+q*5)*10),Math.round(fy-14-q*34),i%2?'#c8f0a0':'#fff6d8',Math.sin(q*Math.PI)*(1-k)); }
  for(let i=0;i<8;i++){ const q=clamp(k*1.6-i*0.07,0,1), a=i*0.8;
    b.globalAlpha=Math.sin(q*Math.PI)*0.9;
    px(b,Math.round(kx+Math.cos(a)*14),Math.round(ky-q*40-6+Math.sin(a)*4),3,3,i%2?'#a8f0a0':'#e8ffd8'); }
  b.globalAlpha=1;
}
function drawWorld(){
  if(G.area!=='garden'){ drawPlace(); return; }
  if(G.indoors){ drawHouse(); return; }
  const cam=camera();
  b.save(); b.beginPath(); b.rect(0,0,LW,VIEW_H); b.clip();
  b.save(); b.scale(WORLD_ZOOM,WORLD_ZOOM);           /* the zoomed-out garden */
  drawMap(cam);
  if(season()!=='winter') for(let i=0;i<7;i++){       /* ripples on the water (not on ice) */
    const yy=POOL.y+18+i*13, off=Math.round(Math.sin(G.t/450+i)*13);
    b.globalAlpha=.35;
    px(b,POOL.x+24+off+i*46-cam.x,yy-cam.y,18,2,'#dff4ff');
    b.globalAlpha=1;
  }
  const ents=[];
  plots.forEach(p=>{ if(!active(p))return;
    ents.push({y:p.y,f:()=>{ const x=p.x-cam.x, y=p.y-cam.y;
      if(!p.tree) drawSoil(b,x,y);
      if(p.dead){ drawRuined(b,x,y,p.tree); if(wormIn(p)) drawWorms(b,p,x,y); }
      else if(p.sp){ if(p.sungDay===G.day) drawSungGlow(b,p,x,y);
        if(p.stage>0) groundShadow(b,c=>drawPlant(c,0,0,p.sp,p.stage,p.tree),x,y,p.tree?14:8);
        drawPlant(b,x,y,p.sp,p.stage,p.tree);
        drawMeter(b,x,y+(p.tree?26:14),p.growth/plantNeed(p),p.stage>=3);
        if(p.sungDay===G.day) drawSungNote(b,p,x,y); } }}); });
  Object.keys(DECOR_SPOT).forEach(id=>{ if(!G.yard[id])return;
    const [x,y]=DECOR_SPOT[id]; ents.push({y,f:()=>{
      groundShadow(b,c=>drawDecor(c,id,0,0,G.t),x-cam.x,y-cam.y,DECOR_SHADOW_W[id]||16);
      drawDecor(b,id,x-cam.x,y-cam.y,G.t); }}); });
  FROGS.forEach(f=>ents.push({y:f.y,f:()=>drawFrog(b,f.x-11-cam.x,f.y-11-cam.y,G.t,f.k)}));
  G.pests.forEach(p=>ents.push({y:p.y,f:()=>drawPestWorld(b,p.species,p.x-cam.x,p.y-cam.y,G.t,p.face,p.ph||(p.ph=Math.random()*6.3))}));
  WILD.forEach(w=>ents.push({y:w.bird?WORLD_H+80:w.y,f:()=>drawWild(b,w,cam)}));
  /* Bling, at her own size like Kaitlyn (the zoom undone around her) */
  const bl=blingHere();
  if(bl&&!bl.inside) ents.push({y:bl.y,f:()=>{ const sx=bl.x-cam.x, sy=bl.y-cam.y;
    b.save(); b.translate(sx,sy); b.scale(1/WORLD_ZOOM,1/WORLD_ZOOM); b.translate(-sx,-sy);
    drawBlingMap(b,sx,sy,BLING_W,bl.mood,bl.flip,bl.moving); b.restore(); }});
  /* the market stand stands over the painted table; drawn goods until its picture loads */
  ents.push({y:STAND_AT.y,f:()=>{
    if(cropsReady()&&CROP_ART.stand) groundShadow(b,c=>drawCropArt(c,'stand',0,0),STAND_AT.x-cam.x,STAND_AT.y-cam.y,40);
    if(drawCropArt(b,'stand',STAND_AT.x-cam.x,STAND_AT.y-cam.y)) return;
    const x=STALL.x-cam.x,y=STALL.y-cam.y;
    px(b,x-16,y-10,32,10,'#6b4a2a'); px(b,x-16,y-10,32,2,'#8f6a3c');
    px(b,x-12,y-16,7,7,'#e8433f'); px(b,x-3,y-16,7,7,'#f0c44a'); px(b,x+6,y-16,7,7,'#5a70c4');
  }});
  /* Kaitlyn is drawn at her own size: undo the zoom around her feet */
  ents.push({y:G.player.y+9,f:()=>{
    const sx=G.player.x-cam.x, sy=G.player.y+12-cam.y;
    b.save(); b.translate(sx,sy); b.scale(1/WORLD_ZOOM,1/WORLD_ZOOM); b.translate(-sx,-sy);
    b.imageSmoothingEnabled=false;
    if(!G.swim) drawKaitlynShadow(b,sx,sy,G.player.dir,G.player.animT||0,G.player.moving);
    if(G.cast){                            /* playing a field song: her battle flute animation */
      const n=BRN[BROW.flute]||1; drawBattleRow(b,'flute',Math.floor(G.cast.t/90)%n,sx,sy,1);
    } else if(G.swim){
      b.save(); b.beginPath(); b.rect(sx-200,sy-1000,400,979); b.clip();
      drawKaitlyn(b,sx,sy,G.player.dir,G.player.animT||0,true,G.player.moving); b.restore();
      for(let i=-18;i<=18;i+=4) px(b,sx+i,sy-21+((i%3)?0:2),3,2,'#8fd8ee');
    } else drawKaitlyn(b,sx,sy,G.player.dir,G.player.animT||0,false,G.player.moving);
    b.restore();
  }});
  ents.sort((a,z)=>a.y-z.y).forEach(e=>e.f());
  /* the front layer (tree tops and the like) goes over everyone */
  const fr=frontImg(season()); if(fr){ b.imageSmoothingEnabled=true; b.drawImage(fr,-cam.x,-cam.y,WORLD_W,WORLD_H); }
  if(G.cast) drawCastFx(cam);
  if(G.croak) drawCroakFx(cam);
  /* shadows drift across the ground in world space, so they stay put
     relative to the garden while the camera moves */
  const day=daylight();
  b.globalAlpha=.07*day; b.fillStyle='#1d3018';
  const CP=WORLD_W+300;
  for(let i=0;i<3;i++){
    const wy=110+i*190;
    const wx=((G.t*0.010+i*260)%CP);
    for(const off of [0,-CP]){
      const sx=wx+off-cam.x, sy=wy-cam.y;
      if(sx<-220||sx>VIEW_WW+220) continue;
      b.beginPath(); b.ellipse(sx,sy,120,44,0,0,7); b.fill();
      b.beginPath(); b.ellipse(sx+70,sy+22,74,30,0,0,7); b.fill();
    }
  }
  b.globalAlpha=1;
  b.restore();                                         /* back to screen px */
  /* the painting is lit from the upper right — follow it */
  const sun=b.createLinearGradient(LW,0,0,VIEW_H);
  sun.addColorStop(0,'rgba(255,244,205,0.13)');
  sun.addColorStop(0.6,'rgba(255,240,190,0.03)');
  sun.addColorStop(1,'rgba(30,50,25,0.10)');
  b.globalAlpha=day; b.fillStyle=sun; b.fillRect(0,0,LW,VIEW_H); b.globalAlpha=1;
  tintView(b);
  b.restore();
  drawClockBack(); drawBuffsBack();
  blit();
  drawClockText(); drawBuffsText();
  const R=PROMPT_REACH, p=nearestPlot(R), f=nearestFrog(R);
  let label=null;
  if(nearBling(R)) label=blingLabel();
  else if(nearStall(R)) label="Shop";
  else if(nearDoor(R)) label="Go inside";
  else if(!ZONES&&nearGardenExit(R)) label=nearGardenExit(R).label;
  else if(G.swim) label="Refill MP";
  else if(f) label="Frog";
  else if(p) label=p.dead?(wormIn(p)?"Pick up worm":"Clear"):!p.sp?"Plant":p.stage>=3?"Harvest":p.growth>=plantNeed(p)?"Ripe tomorrow":p.sungDay===G.day?"Sung today":"Play song";
  if(label&&G.scene==='world'){ const [fx,fy]=toView(G.player.x,G.player.y+12,cam); drawPrompt(label,fx,fy-74); }
  drawHUD();
}
/* What A/J will do here: a little blue speech bubble over her head that floats gently.
   cx, by are the bubble's centre and the tip of its pointer, in logical px. */
function drawPrompt(label,cx,by){
  const tw=TW(label,24,true), h=19, w=tw+18;
  const x=Math.round(cx-w/2), y=Math.round(by-h-5+Math.sin(G.t/520)*1.2);
  m.save(); m.scale(SC,SC);
  m.fillStyle='#0a0f2a';                            /* outline, with the pointer */
  m.beginPath(); m.roundRect(x-1.5,y-1.5,w+3,h+3,9); m.fill();
  m.beginPath(); m.moveTo(cx-5.5,y+h); m.lineTo(cx,y+h+6.5); m.lineTo(cx+5.5,y+h); m.fill();
  m.fillStyle='#e6eaf6';                            /* white rim */
  m.beginPath(); m.roundRect(x-0.5,y-0.5,w+1,h+1,8.5); m.fill();
  m.beginPath(); m.moveTo(cx-4.5,y+h); m.lineTo(cx,y+h+5); m.lineTo(cx+4.5,y+h); m.fill();
  const g=m.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#6a88dc'); g.addColorStop(0.45,'#33489e'); g.addColorStop(1,'#10164a');
  m.fillStyle=g; m.beginPath(); m.roundRect(x+0.8,y+0.8,w-1.6,h-1.6,7); m.fill();
  m.fillStyle='#10164a'; m.beginPath(); m.moveTo(cx-3,y+h-0.8); m.lineTo(cx,y+h+3); m.lineTo(cx+3,y+h-0.8); m.fill();
  m.restore();
  TS(label,cx,y+h/2+3.6,22,WIN_TXT.title,'center',true);
}
