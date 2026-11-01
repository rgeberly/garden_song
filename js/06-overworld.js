/* ================================================================
   WORLD SCENE
   ================================================================ */
function startGame(){ G.scene='world'; initMusic(); setMusic('calm');
  say("Plant several beds — songs carry across the garden."); preloadSeasonMaps(); shopArtImg(); partyImg(); autoLoad(); }
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
const nearDoor=(f=1)=>Math.hypot(HOUSE_DOOR.x-G.player.x,HOUSE_DOOR.y-G.player.y)<46*f;
function interact(){
  if(G.indoors){ houseInteract(); return; }
  if(nearBling()){ talkBling(); return; }
  if(nearStall()){ openShop(); return; }
  if(nearDoor()){ enterHouse(); return; }
  if(G.swim){ G.player.mp=maxMp(); say("Music Points fully restored!"); return; }
  const frog=nearestFrog();
  if(frog){
    if(G.frogT<=0){ G.player.hp=G.player.maxhp; G.frogT=G.gear.charm?12000:25000;
      say("A frog croaks a healing chord. HP full!");
      if(AC){flute(2,AC.currentTime,.7,.6);flute(9,AC.currentTime+.05,.8,.5);} }
    else say("The frog blinks sleepily.");
    return;
  }
  const plot=nearestPlot();
  if(!plot){ say("Nothing here. Find a garden bed."); return; }
  if(plot.dead){ plot.dead=false; say("Cleared away the ruined plant."); blip(260,0.08,0.12,'triangle'); return; }
  if(!plot.sp){ openSeedMenu(plot); return; }
  if(plot.stage>=3){ harvest(plot); return; }
  if(plot.growth>=MAX_GROWTH){ say("Fully grown! It will be ripe for harvest tomorrow."); return; }
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
  if(G.gear.basket){
    plots.forEach(p=>{ if(active(p)&&p.sp&&p.stage>=3){ xp+=harvestOne(p); n++; } });
  } else { xp=harvestOne(plot); n=1; }
  G.player.mp=Math.min(maxMp(),G.player.mp+2*n);
  say((n>1?"Harvested "+n+" crops!":"Harvested a "+name+"!")+"  +"+xp+" xp");
  if(AC){flute(6,AC.currentTime,.3,.6);flute(11,AC.currentTime+.1,.35,.6);flute(14,AC.currentTime+.2,.5,.6);}
  autoSave();
}
function spawnPest(){
  if(G.pests.length>=(G.lureT>0?5:3)) return;
  /* with nothing growing, pests still turn up now and then and just wander, so
     there is always a way to earn a few coins */
  const planted=plots.filter(p=>active(p)&&p.sp);
  if(!planted.length&&Math.random()>WANDER_SPAWN) return;
  let pool=Object.keys(PESTS).filter(k=>!PESTS[k].boss&&PESTS[k].min<=G.gardenLv);
  let sp=pool[ri(0,pool.length-1)];
  if(G.gardenLv>=5&&Math.random()<0.07) sp='hoa';

  let x,y,guard=0;
  do{ const e=ri(0,3);
      x=e===0?F(.12):e===1?F(.88):ri(F(.12),F(.88));
      y=e===2?F(.30):e===3?F(.72):ri(F(.30),F(.72));
  } while(solidAt(x,y)&&guard++<40);
  G.pests.push({species:sp,x,y,target:planted.length?planted[ri(0,planted.length-1)]:null,hp:PESTS[sp].hp,chew:0});
  if(sp==='hoa') say("The HOA President is inspecting your yard!");
}
const WANDER_SPAWN=0.35;   /* chance a pest still comes when nothing is planted */
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
    dx/=mm; dy/=mm;
    const mul=(G.gear.boots?1.35:1)*(G.coffeeT>0?1.5:1)*(G.snackT>0?1.25:1)*(G.swim?0.62:1);
    const sp=speed*mul*dt;
    const nx=P.x+dx*sp, ny=P.y+dy*sp;
    if(!blocked(nx,P.y)) P.x=nx;
    if(!blocked(P.x,ny)) P.y=ny;
    P.dir=dirFromVec(dx,dy);
    // steps quicken with boots/coffee (and slow in water) so her feet don't slide
    P.walkT+=dt*mul; P.moving=true; P.animT=P.walkT;
  } else {
    P.moving=false; P.walkT=0;
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
  if(G.indoors){ updateHouse(dt); return; }
  const P=G.player;
  walk(dt,WALK_SPEED,(x,y)=>solidAt(x,y+9));
  P.x=clamp(P.x,21,WORLD_W-21); P.y=clamp(P.y,24,WORLD_H-30);
  const wasSwim=G.swim;
  G.swim=season()!=='winter'&&inPool(P.x,P.y+9);   /* frozen in winter: she walks on the ice */
  if(G.swim&&!wasSwim){ say("Ahh. Music Points restoring..."); blip(500,0.12,0.15,'sine'); }
  if(G.swim){ G.mpTick+=dt; if(G.mpTick>380){ G.mpTick=0;
    if(P.mp<maxMp()){ P.mp++; if(P.mp===maxMp()) say("Music Points full!"); } } }
  for(const k of ['coffeeT','snackT','calmT','lureT']) if(G[k]>0) G[k]=Math.max(0,G[k]-dt);
  /* lantern and lemongrass keep pests away, muscadine draws them in */
  const pestMul=(G.yard.lantern?1.4:1)*(G.calmT>0?2:1)*(G.lureT>0?0.5:1);
  G.pestTimer-=dt;
  if(G.pestTimer<=0){ G.pestTimer=rnd(10000,17000)*pestMul; spawnPest(); }
  for(const p of G.pests){
    if(Math.hypot(p.x-P.x,p.y-(P.y+6))<20){ startBattle(p); return; }
    if(!p.target||!p.target.sp||!active(p.target)){
      const growing=plots.filter(q=>active(q)&&q.sp);
      p.target=growing.length?growing[ri(0,growing.length-1)]:null;
    }
    /* no crop to chew: amble between random open spots on the lawn */
    if(!p.target&&(!p.roam||Math.hypot(p.roam.x-p.x,p.roam.y-p.y)<6)) p.roam=wanderSpot();
    const goal=p.target||p.roam, ddx=goal.x-p.x, ddy=goal.y-p.y, d=Math.hypot(ddx,ddy)||1;
    const spd=(p.species==='hoa'?0.017:0.024)*(p.slow||1)*(p.target?1:0.6);
    if(d>9||!p.target){ p.x+=ddx/d*spd*dt; p.y+=ddy/d*spd*dt; }
    else if(p.target.sp){
      p.chew+=dt;
      if(p.chew>1600){ p.chew=0;
        const bite=p.species==='hoa'?12:6;
        p.target.health=Math.max(0,p.target.health-bite);
        setGrowth(p.target,p.target.growth-bite*1.5);
        if(p.target.health<=0){ say("A plant was ruined! Clear it away to replant.");
          Object.assign(p.target,{sp:null,stage:0,growth:0,health:100,dead:true,sungDay:0,fullDay:0}); } } }
  }
  if(G.frogT>0) G.frogT-=dt;
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
function camera(){ const vh=VIEW_H/WORLD_ZOOM;
  return {x:clamp(Math.round(G.player.x-VIEW_WW/2),0,WORLD_W-VIEW_WW),
          y:clamp(Math.round(G.player.y-vh/2+15),0,WORLD_H-vh)}; }
/* where a world point lands in the garden view, in logical screen px */
const toView=(wx,wy,cam)=>[(wx-cam.x)*WORLD_ZOOM,(wy-cam.y)*WORLD_ZOOM];
function drawWorld(){
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
      if(p.dead) drawRuined(b,x,y,p.tree);
      else if(p.sp){ drawPlant(b,x,y,p.sp,p.stage,p.tree);
        drawMeter(b,x,y+(p.tree?26:14),p.growth/MAX_GROWTH,p.stage>=3);
        if(p.sungDay===G.day) drawSungNote(b,p,x,y); } }}); });
  Object.keys(DECOR_SPOT).forEach(id=>{ if(!G.yard[id])return;
    const [x,y]=DECOR_SPOT[id]; ents.push({y,f:()=>drawDecor(b,id,x-cam.x,y-cam.y,G.t)}); });
  FROGS.forEach(f=>ents.push({y:f.y,f:()=>drawFrog(b,f.x-11-cam.x,f.y-11-cam.y,G.t,f.k)}));
  G.pests.forEach(p=>ents.push({y:p.y,f:()=>drawPestWorld(b,p.species,p.x-cam.x,p.y-cam.y,G.t)}));
  WILD.forEach(w=>ents.push({y:w.bird?WORLD_H+80:w.y,f:()=>drawWild(b,w,cam)}));
  /* Bling, at her own size like Kaitlyn (the zoom undone around her) */
  const bl=blingHere();
  if(bl&&!bl.inside) ents.push({y:bl.y,f:()=>{ const sx=bl.x-cam.x, sy=bl.y-cam.y;
    b.save(); b.translate(sx,sy); b.scale(1/WORLD_ZOOM,1/WORLD_ZOOM); b.translate(-sx,-sy);
    drawBlingMap(b,sx,sy,BLING_W,bl.mood,bl.flip,bl.moving); b.restore(); }});
  /* the market stand stands over the painted table; drawn goods until its picture loads */
  ents.push({y:STAND_AT.y,f:()=>{
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
    if(G.swim){
      b.save(); b.beginPath(); b.rect(sx-200,sy-1000,400,979); b.clip();
      drawKaitlyn(b,sx,sy,G.player.dir,G.player.animT||0,true,G.player.moving); b.restore();
      for(let i=-18;i<=18;i+=4) px(b,sx+i,sy-21+((i%3)?0:2),3,2,'#8fd8ee');
    } else drawKaitlyn(b,sx,sy,G.player.dir,G.player.animT||0,false,G.player.moving);
    b.restore();
  }});
  ents.sort((a,z)=>a.y-z.y).forEach(e=>e.f());
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
  else if(G.swim) label="Refill MP";
  else if(f) label="Frog";
  else if(p) label=p.dead?"Clear":!p.sp?"Plant":p.stage>=3?"Harvest":p.growth>=MAX_GROWTH?"Ripe tomorrow":p.sungDay===G.day?"Sung today":"Play song";
  if(label&&G.scene==='world'){ const [fx,fy]=toView(G.player.x,G.player.y+12,cam); drawPrompt(label,fx,fy-74); }
  drawHUD();
}
/* What A/J will do here: a cream speech bubble over her head that floats gently.
   cx, by are the bubble's centre and the tip of its pointer, in logical px. */
function drawPrompt(label,cx,by){
  const tw=TW(label,24,true), h=19, w=tw+18;
  const x=Math.round(cx-w/2), y=Math.round(by-h-5+Math.sin(G.t/520)*1.2);
  m.save(); m.scale(SC,SC);
  m.fillStyle='rgba(20,12,4,.28)';                 /* soft shadow */
  m.beginPath(); m.roundRect(x+1,y+2,w,h,8); m.fill();
  m.fillStyle='#5a3d22';                            /* border, with the pointer */
  m.beginPath(); m.roundRect(x-1.2,y-1.2,w+2.4,h+2.4,9); m.fill();
  m.beginPath(); m.moveTo(cx-5,y+h); m.lineTo(cx,y+h+6); m.lineTo(cx+5,y+h); m.fill();
  m.fillStyle='#fbf3dc';
  m.beginPath(); m.roundRect(x,y,w,h,8); m.fill();
  m.beginPath(); m.moveTo(cx-3.6,y+h-0.5); m.lineTo(cx,y+h+4); m.lineTo(cx+3.6,y+h-0.5); m.fill();
  m.fillStyle='#fff9ea'; m.fillRect(x+4,y+1.5,w-8,2);   /* top highlight */
  m.restore();
  T(label,cx,y+h/2+3.6,24,'#3a2a1a','center',true);
}
