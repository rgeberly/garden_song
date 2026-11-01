/* ================================================================
   WORLD SCENE
   ================================================================ */
function startGame(){ G.scene='world'; initMusic(); setMusic('calm');
  say("Plant several beds — songs carry across the garden."); preloadSeasonMaps(); autoLoad(); }
function nearestPlot(){
  let best=null,bd=1e9;
  for(const p of plots){ if(!active(p))continue;
    const d=Math.hypot(p.x-G.player.x,p.y-G.player.y); if(d<bd){bd=d;best=p;} }
  return bd<40?best:null;
}
const nearestFrog=()=>FROGS.find(f=>Math.hypot(f.x-G.player.x,f.y-G.player.y)<32);
const nearestPest=()=>G.pests.find(p=>Math.hypot(p.x-G.player.x,p.y-G.player.y)<26);
const nearStall=()=>Math.hypot(STALL.x-G.player.x,STALL.y+6-G.player.y)<44;
const nearDoor=()=>Math.hypot(HOUSE_DOOR.x-G.player.x,HOUSE_DOOR.y-G.player.y)<46;
function interact(){
  if(nearStall()){ openShop(); return; }
  /* bedtime at the front door for now; later the bed inside the house */
  if(nearDoor()){
    if(G.clock>=BED_FROM) goToSleep(false);
    else say("Too early for bed. Kaitlyn can turn in after 6 PM.");
    return;
  }
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
  if(!plot.sp){ openSeedMenu(plot); return; }
  if(plot.stage>=3){ harvest(plot); return; }
  startRhythm(plot);
}
function harvestOne(plot){
  const S=SPECIES[plot.sp];
  let bonus=Math.round(S.value*(0.6+plot.health/250));
  if(G.yard.arch) bonus=Math.round(bonus*1.15);
  G.coins+=bonus; addXp(S.xp); addGardenXp(Math.round(S.xp*1.2)); G.harvests++;
  if(Math.random()<0.5) G.seeds[plot.sp]=(G.seeds[plot.sp]||0)+1;
  Object.assign(plot,{sp:null,stage:0,growth:0,health:100});
  return bonus;
}
function harvest(plot){
  let total=0,n=0;
  if(G.gear.basket){
    plots.forEach(p=>{ if(active(p)&&p.sp&&p.stage>=3){ total+=harvestOne(p); n++; } });
  } else { total=harvestOne(plot); n=1; }
  G.player.mp=Math.min(maxMp(),G.player.mp+2*n);
  say(n>1?("Harvested "+n+" crops!  +"+total+"c"):("Harvested!  +"+total+"c"));
  if(AC){flute(6,AC.currentTime,.3,.6);flute(11,AC.currentTime+.1,.35,.6);flute(14,AC.currentTime+.2,.5,.6);}
  autoSave();
}
function spawnPest(){
  if(G.pests.length>=3) return;
  const planted=plots.filter(p=>active(p)&&p.sp); if(!planted.length) return;
  let pool=Object.keys(PESTS).filter(k=>!PESTS[k].boss&&PESTS[k].min<=G.gardenLv);
  let sp=pool[ri(0,pool.length-1)];
  if(G.gardenLv>=5&&Math.random()<0.07) sp='hoa';

  let x,y,guard=0;
  do{ const e=ri(0,3);
      x=e===0?F(.12):e===1?F(.88):ri(F(.12),F(.88));
      y=e===2?F(.30):e===3?F(.72):ri(F(.30),F(.72));
  } while(solidAt(x,y)&&guard++<40);
  G.pests.push({species:sp,x,y,target:planted[ri(0,planted.length-1)],hp:PESTS[sp].hp,chew:0});
  if(sp==='hoa') say("The HOA President is inspecting your yard!");
}
function updateWorld(dt){
  tickClock(dt);
  if(G.scene!=='world') return;          /* midnight sent her to bed */
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
    const mul=(G.gear.boots?1.35:1)*(G.coffeeT>0?1.5:1)*(G.swim?0.62:1);
    const sp=WALK_SPEED*mul*dt;
    const nx=P.x+dx*sp, ny=P.y+dy*sp;
    if(!solidAt(nx,P.y+9)) P.x=nx;
    if(!solidAt(P.x,ny+9)) P.y=ny;
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
  P.x=clamp(P.x,21,WORLD_W-21); P.y=clamp(P.y,24,WORLD_H-30);
  const wasSwim=G.swim;
  G.swim=inPool(P.x,P.y+9);
  if(G.swim&&!wasSwim){ say("Ahh. Music Points restoring..."); blip(500,0.12,0.15,'sine'); }
  if(G.swim){ G.mpTick+=dt; if(G.mpTick>380){ G.mpTick=0;
    if(P.mp<maxMp()){ P.mp++; if(P.mp===maxMp()) say("Music Points full!"); } } }
  if(G.coffeeT>0) G.coffeeT-=dt;
  const lanternMul=G.yard.lantern?1.4:1;
  G.pestTimer-=dt;
  if(G.pestTimer<=0){ G.pestTimer=rnd(10000,17000)*lanternMul; spawnPest(); }
  for(const p of G.pests){
    if(Math.hypot(p.x-P.x,p.y-(P.y+6))<20){ startBattle(p); return; }
    if(!p.target.sp||!active(p.target)) p.target=plots.find(q=>active(q)&&q.sp)||p.target;
    const ddx=p.target.x-p.x, ddy=p.target.y-p.y, d=Math.hypot(ddx,ddy)||1;
    const spd=(p.species==='hoa'?0.017:0.024)*(p.slow||1);
    if(d>9){ p.x+=ddx/d*spd*dt; p.y+=ddy/d*spd*dt; }
    else if(p.target.sp){
      p.chew+=dt;
      if(p.chew>1600){ p.chew=0;
        const bite=p.species==='hoa'?12:6;
        p.target.health=Math.max(0,p.target.health-bite);
        p.target.growth=Math.max(0,p.target.growth-bite*1.5);
        p.target.stage=clamp(Math.floor(p.target.growth/STAGE_COST),0,3);
        if(p.target.health<=0){ say("A plant was ruined!");
          Object.assign(p.target,{sp:null,stage:0,growth:0,health:100}); } } }
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
const camera=()=>({x:clamp(Math.round(G.player.x-LW/2),0,WORLD_W-LW),
                   y:clamp(Math.round(G.player.y-VIEW_H/2+15),0,WORLD_H-VIEW_H)});
function drawWorld(){
  const cam=camera();
  b.save(); b.beginPath(); b.rect(0,0,LW,VIEW_H); b.clip();
  drawMap(cam);
  for(let i=0;i<7;i++){
    const yy=POOL.y+18+i*13, off=Math.round(Math.sin(G.t/450+i)*13);
    b.globalAlpha=.35;
    px(b,POOL.x+24+off+i*46-cam.x,yy-cam.y,18,2,'#dff4ff');
    b.globalAlpha=1;
  }
  const ents=[];
  plots.forEach(p=>{ if(!active(p))return;
    if(p.sp) ents.push({y:p.y,f:()=>{ drawPlant(b,p.x-cam.x,p.y-cam.y,p.sp,p.stage,p.tree);
      drawMeter(b,p.x-cam.x,p.y-cam.y+(p.tree?26:14),p.growth/MAX_GROWTH,p.stage>=3); }});
    else ents.push({y:p.y,f:()=>{
      const x=p.x-cam.x,y=p.y-cam.y;
      b.globalAlpha=.55;
      px(b,x-7,y-4,14,9,'#3a2716'); px(b,x-5,y-2,10,5,'#7a5330');
      b.globalAlpha=1;
      px(b,x-5,y-2,10,1,'#9c6c44'); }}); });
  Object.keys(DECOR_SPOT).forEach(id=>{ if(!G.yard[id])return;
    const [x,y]=DECOR_SPOT[id]; ents.push({y,f:()=>drawDecor(b,id,x-cam.x,y-cam.y,G.t)}); });
  FROGS.forEach(f=>ents.push({y:f.y,f:()=>drawFrog(b,f.x-11-cam.x,f.y-11-cam.y,G.t,f.k)}));
  G.pests.forEach(p=>ents.push({y:p.y,f:()=>drawPestWorld(b,p.species,p.x-cam.x,p.y-cam.y,G.t)}));
  WILD.forEach(w=>ents.push({y:w.bird?WORLD_H+80:w.y,f:()=>drawWild(b,w,cam)}));
  /* the stall now lives under the painted shed, so only its goods are drawn */
  ents.push({y:STALL.y,f:()=>{
    const x=STALL.x-cam.x,y=STALL.y-cam.y;
    px(b,x-16,y-10,32,10,'#6b4a2a'); px(b,x-16,y-10,32,2,'#8f6a3c');
    px(b,x-12,y-16,7,7,'#e8433f'); px(b,x-3,y-16,7,7,'#f0c44a'); px(b,x+6,y-16,7,7,'#5a70c4');
  }});
  ents.push({y:G.player.y+9,f:()=>{
    const sx=G.player.x-cam.x, sy=G.player.y+12-cam.y;
    if(!G.swim) drawKaitlynShadow(b,sx,sy,G.player.dir,G.player.animT||0,G.player.moving);
    if(G.swim){
      b.save(); b.beginPath(); b.rect(0,0,LW,sy-21); b.clip();
      drawKaitlyn(b,sx,sy,G.player.dir,G.player.animT||0,true,G.player.moving); b.restore();
      for(let i=-18;i<=18;i+=4) px(b,sx+i,sy-21+((i%3)?0:2),3,2,'#8fd8ee');
    } else drawKaitlyn(b,sx,sy,G.player.dir,G.player.animT||0,false,G.player.moving);
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
      if(sx<-220||sx>LW+220) continue;
      b.beginPath(); b.ellipse(sx,sy,120,44,0,0,7); b.fill();
      b.beginPath(); b.ellipse(sx+70,sy+22,74,30,0,0,7); b.fill();
    }
  }
  b.globalAlpha=1;
  /* the painting is lit from the upper right — follow it */
  const sun=b.createLinearGradient(LW,0,0,VIEW_H);
  sun.addColorStop(0,'rgba(255,244,205,0.13)');
  sun.addColorStop(0.6,'rgba(255,240,190,0.03)');
  sun.addColorStop(1,'rgba(30,50,25,0.10)');
  b.globalAlpha=day; b.fillStyle=sun; b.fillRect(0,0,LW,VIEW_H); b.globalAlpha=1;
  tintView(b);
  b.restore();
  drawClockBack();
  m.drawImage(buf,0,0);
  drawClockText();
  const p=nearestPlot(),f=nearestFrog();
  let label=null;
  if(nearStall()) label="Shop";
  else if(nearDoor()) label=G.clock>=BED_FROM?"Sleep":"Home";
  else if(G.swim) label="Refill MP";
  else if(f) label="Frog";
  else if(p) label=!p.sp?"Plant":(p.stage>=3?"Harvest":"Play song");
  if(label&&Math.floor(G.t/400)%2===0){
    const cx=Math.round(G.player.x-cam.x), cy=Math.round(G.player.y-72-cam.y);
    const w=TW(label,26)+16;
    m.fillStyle='#2b1c12'; m.fillRect((cx-w/2-2)*SC,(cy-2)*SC,(w+4)*SC,20*SC);
    m.fillStyle='#f7f0dc'; m.fillRect((cx-w/2)*SC,cy*SC,w*SC,16*SC);
    T(label,cx,cy+13,26,'#3a2a1a','center');
  }
  drawHUD();
}
