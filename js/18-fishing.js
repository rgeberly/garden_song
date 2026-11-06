/* ================================================================
   FISHING at the mountain pond
   Each cast takes 15 minutes. Wait for a bite, hook it in time (tap / A), then
   reel it in: on a touch screen wind the reel at the bottom right by circling
   your finger round it, and pull the rod back with the lever at the bottom left
   (drag it up); with keys hold J or Space to reel and W / up to pull. Pulling the
   rod back yanks the fish a good way closer (pump it: pull, ease down while
   reeling, pull again) but both tighten the line, and the fish fights back in
   bursts, running line out. Past DRAG the reel's drag lets line slip instead of
   breaking it, so a snap is rare; a slack line (stop reeling) loses it. The usual pad and buttons are hidden here; Stop is top right.
   ================================================================ */
const FISH_MIN=15, HOOK_MS=900, SNAP_MS=2000, SLACK_MS=2600;
/* the reel's drag: past this tension the line slips out instead of breaking; the scale
   of the tension gauge (it only snaps above 1, held there for SNAP_MS) */
const DRAG=0.85, T_MAX=1.15;
const REEL={x:286,r:54}, ROD={x:62,h:84}, FSTOP={x:LW-70,y:14,w:60,h:26};
let FS=null;
/* the reel sits near the bottom right of the screen, where a thumb can reach it */
const reelY=()=>Math.max(392,BAND_BOT()-90);
function pickFish(){
  const L=Object.keys(GOODS).filter(k=>{ const g=GOODS[k]; return g.kind==='fish'&&(!g.seasons||g.seasons.includes(season()))&&(!g.night||isNight()); });
  let t=L.reduce((a,k)=>a+GOODS[k].w,0)*Math.random();
  for(const k of L){ t-=GOODS[k].w; if(t<=0) return k; } return L[0];
}
function startFishing(){
  if(season()==='winter'){ say("The pond is frozen solid. Come back in spring!"); return; }
  passTime(FISH_MIN); if(G.scene!=='world') return;          /* it might have got late */
  FS={phase:'cast',t:0,wait:rnd(1500,4800),fish:null,dist:1,tension:0.15,pull:0,burst:0,
     snapT:0,slackT:0,reel:0,ang:0,reelId:null,lastA:null,spin:0,size:0,splash:[],
     lift:0,liftWant:0,rodId:null,rodY0:0};
  padVec={x:0,y:0}; padId=null; G.scene='fishing';
  blip(300,0.05,0.12,'triangle');
}
function endFishing(msg){ FS=null; G.scene='world'; if(msg) say(msg); autoSave(); }
function fishHook(){
  if(FS.phase==='bite'){ FS.phase='reel'; FS.t=0; blip(520,0.06,0.15,'square'); return; }
  if(FS.phase==='wait'){ FS.phase='lost'; FS.t=0; FS.msg="Too soon — you scared it off."; }
  else if(FS.phase==='caught'||FS.phase==='lost'){ if(FS.t>500) endFishing(FS.phase==='caught'?null:FS.msg); }
}
function fishKey(k){
  if(!FS) return;
  if(isBack(k)){ endFishing("You reel in your line."); return; }
  if(isOk(k)||k==='e') fishHook();
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
  fishHook();
}
/* winding: how far round the finger has gone since last time */
function fishMove(x,y,id){
  if(FS&&FS.rodId===id){ FS.liftWant=clamp((FS.rodY0-y)/ROD.h*1.4,0,1); return; }
  if(!FS||FS.reelId!==id) return;
  const a=Math.atan2(y-reelY(),x-REEL.x);
  if(FS.lastA!==null){ let d=a-FS.lastA; if(d>Math.PI) d-=2*Math.PI; if(d<-Math.PI) d+=2*Math.PI; FS.spin+=Math.abs(d); FS.ang+=Math.abs(d); }
  FS.lastA=a;
}
function fishUp(id){ if(FS&&FS.reelId===id){ FS.reelId=null; FS.lastA=null; } if(FS&&FS.rodId===id){ FS.rodId=null; FS.liftWant=0; } }
function updateFishing(dt){
  FS.t+=dt;
  FS.splash.forEach(s=>s.t-=dt); FS.splash=FS.splash.filter(s=>s.t>0);
  if(FS.phase==='cast'&&FS.t>650){ FS.phase='wait'; FS.t=0; }
  else if(FS.phase==='wait'&&FS.t>FS.wait){ FS.phase='bite'; FS.t=0; FS.fish=pickFish();
    for(let i=0;i<8;i++) FS.splash.push({a:i*0.8,t:500}); blip(880,0.05,0.15,'sine'); }
  else if(FS.phase==='bite'&&FS.t>HOOK_MS){ FS.phase='lost'; FS.t=0; FS.msg="It nibbled the bait and swam off."; }
  else if(FS.phase==='reel'){
    const g=GOODS[FS.fish], s=dt/1000;
    /* how hard she's reeling: finger turns per second, or the key held */
    const key=keys['j']||keys[' ']||keys['enter'];
    const want=key?0.9:clamp(FS.spin/s/18,0,1.5); FS.spin=0;
    FS.reel+= (want-FS.reel)*Math.min(1,s*8);
    if(key) FS.ang+=s*9;
    /* the rod: raising it pulls the fish in, lowering it doesn't push it back */
    const up=keys['w']||keys['arrowup'];
    if(FS.rodId===null) FS.liftWant=up?1:0;
    const was=FS.lift; FS.lift+=(FS.liftWant-FS.lift)*Math.min(1,s*(FS.liftWant>FS.lift?5:3));
    const yank=Math.max(0,FS.lift-was);
    /* the fish: a steady tug, with bursts that get stronger the bigger it is */
    FS.burst-=dt; if(FS.burst<=-ri(900,2400)/g.power) FS.burst=ri(500,1100);
    FS.pull=g.power*(FS.burst>0?0.9:0.3+0.15*Math.sin(FS.t/300));
    /* the fish runs (harder in a burst), reeling and pulling the rod bring it in */
    let target=FS.reel*0.45+FS.pull*0.35+FS.lift*0.25, slip=0;
    if(target>DRAG){ slip=(target-DRAG)*0.3*s; target=DRAG+(target-DRAG)*0.3; }      /* the drag gives */
    FS.slipping=slip>0;
    FS.dist=clamp(FS.dist-(FS.reel*0.42*s+yank*0.22)*(1.15-FS.pull*0.3)+FS.pull*0.11*s+slip,0,1.3);
    FS.tension+=(target-FS.tension)*Math.min(1,s*3);
    FS.snapT=FS.tension>1?FS.snapT+dt:Math.max(0,FS.snapT-dt*2);
    FS.slackT=FS.tension<0.12?FS.slackT+dt:0;
    if(FS.snapT>SNAP_MS){ FS.phase='lost'; FS.t=0; FS.msg="Snap! The line broke."; blip(120,0.1,0.25,'sawtooth'); }
    else if(FS.slackT>SLACK_MS||FS.dist>=1.3){ FS.phase='lost'; FS.t=0; FS.msg="The line went slack and it got away."; }
    else if(FS.dist<=0){ FS.phase='caught'; FS.t=0; FS.size=Math.round(rnd(12,30)*(0.7+g.power*0.4));
      G.goods[FS.fish]=(G.goods[FS.fish]||0)+1;
      if(AC){ flute(9,AC.currentTime,.3,.6); flute(13,AC.currentTime+.12,.3,.6); flute(16,AC.currentTime+.24,.6,.6); } }
  }
}
/* the pond picture (scenes/fishing), once it has loaded; a drawn pond until then */
let FISH_IMG=null;
function fishImg(){
  if(!FISH_IMG){ FISH_IMG=new Image(); FISH_IMG.src='assets/scenes/fishing.jpg'; }
  return FISH_IMG.complete&&FISH_IMG.naturalWidth?FISH_IMG:null;
}
function drawFishing(dt){
  updateFishing(dt);
  const T0=BAND_TOP(), T1=BAND_BOT(), im=fishImg();
  if(im){ const r=im.naturalWidth/im.naturalHeight, h=Math.max(T1-T0,LW/r), w=h*r;
    b.save(); b.imageSmoothingEnabled=true; b.drawImage(im,(LW-w)/2,T1-h,w,h); b.restore(); }
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
  /* where the line meets the water: far away at first, closer as it's reeled */
  const fx=200+Math.sin(G.t/700)*30*(FS.phase==='reel'?FS.pull:0.2), fy=170+(1-clamp(FS.dist,0,1))*170;
  /* the rod tip swings up as it is pulled back */
  const tipX=48+FS.lift*8, tipY=314-FS.lift*42;
  b.strokeStyle='#5a3a1e'; b.lineWidth=3; b.beginPath(); b.moveTo(30,440); b.lineTo(tipX,tipY); b.stroke();
  b.strokeStyle='rgba(255,255,255,.75)'; b.lineWidth=1;
  b.beginPath(); b.moveTo(tipX,tipY); b.quadraticCurveTo((tipX+fx)/2,(tipY+fy)/2+(1-FS.tension)*40,fx,fy); b.stroke();
  if(FS.phase!=='cast'){
    if(FS.phase==='reel'||FS.phase==='caught'){       /* the fish's shadow under the line */
      const g=GOODS[FS.fish]; b.globalAlpha=.45; b.fillStyle='#0a1a2a';
      b.beginPath(); b.ellipse(fx+Math.sin(G.t/120)*4,fy+10,14+g.power*6,5+g.power*2,Math.sin(G.t/300)*0.3,0,7); b.fill(); b.globalAlpha=1; }
    const bob=FS.phase==='bite'?Math.sin(G.t/40)*4:Math.sin(G.t/400)*1.5;
    b.fillStyle='#e83a3a'; b.beginPath(); b.arc(fx,fy+bob,4,Math.PI,0); b.fill();
    b.fillStyle='#ffffff'; b.beginPath(); b.arc(fx,fy+bob,4,0,Math.PI); b.fill();
    FS.splash.forEach(s=>{ const r=(500-s.t)/500*22; b.globalAlpha=s.t/500; b.strokeStyle='#ffffff'; b.lineWidth=1.5;
      b.beginPath(); b.ellipse(fx,fy+3,r,r*0.35,0,0,7); b.stroke(); b.globalAlpha=1; });
  }
  /* tension (left) and distance (top) gauges */
  if(FS.phase==='reel'){
    const gx=16, gy=170, gh=180;
    b.fillStyle='#0a0f2a'; b.beginPath(); b.roundRect(gx-2,gy-2,18,gh+4,6); b.fill();
    const at=t=>1-t/T_MAX;          /* a tension's place on the gauge, top = tight */
    [['#d84a3a',0,at(1)],['#e8c84a',at(1),at(DRAG)],['#5ac85a',at(DRAG),at(0.15)],['#e8c84a',at(0.15),1]].forEach(([c,a,z])=>{ b.fillStyle=c; b.fillRect(gx,gy+a*gh,14,(z-a)*gh); });
    const ty=gy+clamp(at(FS.tension),0,1)*gh; b.fillStyle='#ffffff'; b.fillRect(gx-4,ty-2,22,4);
    gauge(70,T0+60,220,8,1.3-FS.dist,1.3,'#8fe07a','#e0ffd0');
  }
  /* the reel to wind */
  if(IS_TOUCH||FS.phase==='reel'){
    const R=REEL, ry=reelY(); b.fillStyle='rgba(0,0,0,.35)'; b.beginPath(); b.arc(R.x,ry+3,R.r+4,0,7); b.fill();
    const rg=b.createRadialGradient(R.x-12,ry-14,4,R.x,ry,R.r); rg.addColorStop(0,'#d8dce4'); rg.addColorStop(1,'#6a707c');
    b.fillStyle='#2a2e38'; b.beginPath(); b.arc(R.x,ry,R.r+2,0,7); b.fill();
    b.fillStyle=rg; b.beginPath(); b.arc(R.x,ry,R.r,0,7); b.fill();
    b.strokeStyle='rgba(40,44,56,.5)'; b.lineWidth=2; b.beginPath(); b.arc(R.x,ry,R.r*0.6,0,7); b.stroke();
    const hx=R.x+Math.cos(FS.ang)*R.r*0.72, hy=ry+Math.sin(FS.ang)*R.r*0.72;
    b.strokeStyle='#3a3e48'; b.lineWidth=5; b.beginPath(); b.moveTo(R.x,ry); b.lineTo(hx,hy); b.stroke();
    b.fillStyle='#a8784a'; b.beginPath(); b.arc(hx,hy,9,0,7); b.fill(); b.fillStyle='#d8a870'; b.beginPath(); b.arc(hx-2,hy-2,4,0,7); b.fill();
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
  blit();
  TS("Stop",FSTOP.x+FSTOP.w/2,FSTOP.y+T0+18,18,'#f4f6ff','center',true);
  const say2=(t,y,sz,col)=>TS(t,180,y,sz,col||'#f4f6ff','center',true);
  if(FS.phase==='cast') say2("Casting...",T0+40,24);
  else if(FS.phase==='wait') say2("Waiting for a bite...",T0+40,22);
  else if(FS.phase==='bite'){ TO("!",fx,fy-18,64,'#ffe04a','center',true,2); say2(IS_TOUCH?"Tap now!":"Press J now!",T0+40,26,'#ffe08a'); }
  else if(FS.phase==='reel'){
    TS("Line",24,165,15,'#f4f6ff','center',true); TS("Reel it in!",180,T0+48,20,'#f4f6ff','center',true);
    TS(IS_TOUCH?"wind the reel":"hold J / Space to reel",REEL.x,reelY()+REEL.r+22,15,'#e8eef8','center');
    TS(IS_TOUCH?"pull the rod ▲":"W / ↑ to pull the rod",IS_TOUCH?ROD.x:ROD.x+40,reelY()+REEL.r+22,15,'#e8eef8','center');
    if(FS.tension>1) say2("Too tight — ease off!",T0+90,20,'#ff8a7a');
    else if(FS.slipping) say2("Zzzz! The drag gives — keep reeling!",T0+90,20,'#ffe08a');
    else if(FS.tension<0.15) say2("The line's slack — reel!",T0+90,20,'#ffe08a'); }
  else if(FS.phase==='caught'){ const g=GOODS[FS.fish];
    say2("You caught a "+g.name+"!",190,24,'#ffe08a'); say2(FS.size+" cm · sells for "+goodsPrice(FS.fish)+"c",222,18,'#c8d4ff');
    if(FS.t>500) say2(IS_TOUCH?"tap to continue":"J to continue",262,16,'#8a94c4'); }
  else if(FS.phase==='lost'){ say2(FS.msg,190,20); if(FS.t>500) say2(IS_TOUCH?"tap to continue":"J to continue",222,16,'#8a94c4'); }
}
