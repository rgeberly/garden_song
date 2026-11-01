/* ================================================================
   TITLE + LOOP
   ================================================================ */
function drawTitle(){
  const top=BAND_TOP(), bot=BAND_BOT();
  px(b,0,top,LW,bot-top,'#20302a');
  for(let y=Math.floor(top/3)*3;y<bot;y+=3) px(b,0,y,LW,2,'#233429');
  for(let i=0;i<8;i++) px(b,0,90+i*4,LW,3,'#2a3d31');
  px(b,0,309,LW,bot-309,'#4a7a3a');
  for(let x=0;x<LW;x+=6) px(b,x,309+((x*5)%7),3,4,'#5a9046');
  drawKaitlyn(b,112,322,4,G.t,false,false);
  drawFrog(b,222,296,G.t,1);
  drawPlant(b,294,312,'sunflower',3,false);
  drawPlant(b,46,314,'strawberry',3,false);
  px(b,90,376,180,36,'#3a4a3a');
  blit();
  T("Kaitlyn's",182,68,54,'#2b1c12','center',true);
  T("Garden Song",182,108,54,'#2b1c12','center',true);
  T("Kaitlyn's",180,66,54,'#ffcf3a','center',true);
  T("Garden Song",180,106,54,'#ffcf3a','center',true);
  T("play the golden flute · grow the garden",180,134,22,'#cfe0c4','center');
  T("Load a save code",180,399,26,'#e8dcc0','center',true);
  if(Math.floor(G.t/500)%2===0) T("TAP ANYWHERE TO BEGIN",180,444,28,'#f7f0dc','center',true);
  T(IS_TOUCH?"move: stick    act: A    back: B":"move: stick / WASD    act: A / J / space    back: H / esc",
    180,464,20,'#8fae86','center');
}
let last=performance.now();
function loop(now){
  const dt=Math.min(50,now-last); last=now; G.t+=dt;
  if(G.scene==='world') updateWorld(dt);
  else { if(sfxKey) stopSfx();
         if(G.scene==='rhythm') updateRhythm(dt);
         else if(G.scene==='sleep') updateSleep(dt);
         else if(G.scene==='story') updateStory(dt);
         else if(G.msgT>0) G.msgT-=dt; }
  if(G.scene==='world'||G.scene==='story') updateBling(dt);
  padRepeat(dt);
  /* the garden scenes use the whole screen; the others sit centred in it */
  const off=sceneOff();
  m.setTransform(1,0,0,1,0,0); m.fillStyle='#141c14'; m.fillRect(0,0,LW*SC,SCREEN_H*SC);
  m.setTransform(1,0,0,1,0,off*SC);
  b.setTransform(SC,0,0,SC,0,off*SC);
  wipeBuf();
  if(G.scene==='title') drawTitle();
  else if(G.scene==='world') drawWorld();
  else if(G.scene==='menu') drawMenu();
  else if(G.scene==='shop') drawShop();
  else if(G.scene==='sys') drawSys();
  else if(G.scene==='rhythm') drawRhythm();
  else if(G.scene==='battle') drawBattle(dt);
  else if(G.scene==='sleep') drawSleep();
  else if(G.scene==='ask') drawAsk();
  else if(G.scene==='story') drawStory();
  /* the garden's HUD draws the deck itself; everywhere else it goes on top */
  if(deckShown()&&G.scene!=='world'&&G.scene!=='ask') drawDeck();
  requestAnimationFrame(loop);
}
/* ---- loading screen: assets now arrive over the network ---- */
function drawLoading(){
  m.setTransform(1,0,0,1,0,0);
  m.fillStyle='#1a2a1e'; m.fillRect(0,0,LW*SC,SCREEN_H*SC);
  const done=assetsReady, tot=IMG_TOTAL, p=Math.min(1,done/tot);
  const w=LW*0.6, x=(LW-w)/2, y=SCREEN_H*0.54;
  m.fillStyle='#2b1c12'; m.fillRect((x-3)*SC,(y-3)*SC,(w+6)*SC,20*SC);
  m.fillStyle='#3d5240'; m.fillRect(x*SC,y*SC,w*SC,14*SC);
  m.fillStyle='#c9a84a'; m.fillRect(x*SC,y*SC,w*p*SC,14*SC);
  T("Kaitlyn's Garden Song",LW/2,SCREEN_H*0.44,40,'#ffcf3a','center',true);
  T(loadErr.length?("Could not load "+loadErr.length+" file(s)"):("Loading  "+Math.round(p*100)+"%"),
    LW/2,y+34,24,loadErr.length?'#e08a7a':'#cfe0c4','center');
  if(loadErr.length)
    T("Run this from a web server, not file://",LW/2,y+56,18,'#9fb2c6','center');
}
let booted=false;
function boot(){
  if(booted) return;
  if(assetsReady<IMG_TOTAL){ drawLoading(); requestAnimationFrame(boot); return; }
  booted=true;
  buildWorld();
  requestAnimationFrame(loop);
}
requestAnimationFrame(boot);
