/* ================================================================
   TITLE + LOOP
   ================================================================ */
/* The title: a sunrise. The sky lightens from deep blue to morning, the stars fade and
   the sun climbs over the horizon, warming the scene below. The scene is the title
   picture (assets/scenes/title.jpg) once it has loaded, or a drawn garden until then. */
const TITLE_RISE=11000, TITLE_HORIZON=0.5;     /* how long the sunrise takes (ms); where the horizon is */
let titleT0=null, TITLE_IMG=null;
function titleImg(){
  if(!TITLE_IMG){ TITLE_IMG=new Image(); TITLE_IMG.src='assets/scenes/title.jpg'; }
  return TITLE_IMG.complete&&TITLE_IMG.naturalWidth?TITLE_IMG:null;
}
const mixCol=(a,z,k)=>{ const A=parseInt(a.slice(1),16), Z=parseInt(z.slice(1),16), c=sh=>Math.round(((A>>sh)&255)*(1-k)+((Z>>sh)&255)*k);
  return 'rgb('+c(16)+','+c(8)+','+c(0)+')'; };
function drawTitle(){
  if(titleT0===null) titleT0=G.t;
  const top=BAND_TOP(), bot=BAND_BOT(), H=bot-top, hy=top+H*TITLE_HORIZON;
  const raw=clamp((G.t-titleT0)/TITLE_RISE,0,1), k=raw*raw*(3-2*raw);    /* eased */
  const sunX=LW*0.66, sunY=hy+26-k*96, im=titleImg();
  /* the sky: night blue to dawn pink to morning */
  const sky=b.createLinearGradient(0,top,0,hy);
  sky.addColorStop(0,mixCol('#141a44','#78b8ec',k)); sky.addColorStop(0.65,mixCol('#4a3a78','#bcdcf0',k));
  sky.addColorStop(1,mixCol('#e8784a','#fff0c8',k));
  b.fillStyle=sky; b.fillRect(0,top,LW,hy-top+2);
  /* the last stars */
  for(let i=0;i<34;i++){ const x=(i*97.1)%LW, y=top+((i*53.7)%(H*0.42));
    b.globalAlpha=Math.max(0,1-k*2.2)*(0.5+0.5*Math.sin(G.t/400+i)); px(b,x,y,1.5,1.5,'#ffffff'); }
  b.globalAlpha=1;
  /* the sun and its glow */
  const glow=b.createRadialGradient(sunX,sunY,4,sunX,sunY,190);
  glow.addColorStop(0,'rgba(255,240,200,'+(0.55+0.3*k)+')'); glow.addColorStop(0.25,'rgba(255,200,120,'+(0.35*(1-k*0.4))+')');
  glow.addColorStop(1,'rgba(255,170,100,0)');
  b.fillStyle=glow; b.fillRect(0,top,LW,H);
  b.fillStyle=mixCol('#ffb070','#fff6dc',k); b.beginPath(); b.arc(sunX,sunY,20,0,7); b.fill();
  /* soft clouds drifting by, pink at first */
  b.fillStyle=k<0.5?'rgba(255,190,200,.45)':'rgba(255,255,255,.55)';
  for(let i=0;i<4;i++){ const cx=((G.t*0.004+i*120)%(LW+160))-80, cy=top+40+i*26;
    b.beginPath(); b.ellipse(cx,cy,38,8,0,0,7); b.fill(); b.beginPath(); b.ellipse(cx+20,cy-5,22,7,0,0,7); b.fill(); }
  if(im){
    /* the picture, covering the scene; it's dark before the sun is up */
    const r=im.naturalWidth/im.naturalHeight, h=Math.max(H,LW/r), w=h*r;
    b.save(); b.imageSmoothingEnabled=true; b.drawImage(im,(LW-w)/2,top+(H-h)/2,w,h); b.restore();
  } else {
    /* a drawn garden: far hills, near hills, the lawn with Kaitlyn and friends */
    b.fillStyle=mixCol('#2a2a4a','#6a9a7a',k);
    b.beginPath(); b.moveTo(0,hy+10); for(let x=0;x<=LW;x+=30) b.lineTo(x,hy-14-Math.sin(x/70)*16-((x*7)%11)); b.lineTo(LW,hy+30); b.lineTo(0,hy+30); b.fill();
    b.fillStyle=mixCol('#203024','#4f8c48',k);
    b.beginPath(); b.moveTo(0,hy+40); for(let x=0;x<=LW;x+=20) b.lineTo(x,hy+12-Math.sin(x/45+1)*10); b.lineTo(LW,bot); b.lineTo(0,bot); b.fill();
    b.fillStyle=mixCol('#26402a','#5a9a46',k); b.fillRect(0,hy+60,LW,bot-hy-60);
    for(let x=0;x<LW;x+=6) px(b,x,hy+58+((x*5)%7),3,4,mixCol('#2e4a30','#6aaa52',k));
    const gy=hy+120;
    drawPlant(b,46,gy-8,'strawberry',3,false); drawPlant(b,300,gy-10,'sunflower',3,false);
    drawKaitlyn(b,112,gy,4,G.t,false,false); drawFrog(b,226,gy-26,G.t,1);
  }
  /* before sunrise everything is in shadow; the warm light comes up with the sun */
  b.save(); b.globalCompositeOperation='multiply'; b.globalAlpha=(1-k)*0.55;
  b.fillStyle='#3a3a78'; b.fillRect(0,top,LW,H); b.restore();
  b.save(); b.globalCompositeOperation='screen'; b.globalAlpha=0.35*Math.sin(Math.PI*Math.min(1,k*1.3));
  const warm=b.createRadialGradient(sunX,sunY,10,sunX,sunY,LW); warm.addColorStop(0,'#ffb060'); warm.addColorStop(1,'rgba(255,176,96,0)');
  b.fillStyle=warm; b.fillRect(0,top,LW,H); b.restore();
  /* rays once it's up */
  if(k>0.35){ b.save(); b.globalCompositeOperation='screen'; b.globalAlpha=(k-0.35)*0.15;
    for(let i=0;i<9;i++){ const a=Math.PI*(0.62+i*0.11)+Math.sin(G.t/3000+i)*0.02;
      b.fillStyle='#fff2c8'; b.beginPath(); b.moveTo(sunX,sunY);
      b.lineTo(sunX+Math.cos(a-0.03)*600,sunY+Math.sin(a-0.03)*600); b.lineTo(sunX+Math.cos(a+0.03)*600,sunY+Math.sin(a+0.03)*600); b.fill(); }
    b.restore(); }
  /* a dark band behind the words at the bottom */
  const fade=b.createLinearGradient(0,bot-110,0,bot); fade.addColorStop(0,'rgba(10,16,12,0)'); fade.addColorStop(1,'rgba(10,16,12,.7)');
  b.fillStyle=fade; b.fillRect(0,bot-110,LW,110);
  b.fillStyle='rgba(20,28,22,.55)'; b.beginPath(); b.roundRect(90,bot-104,180,34,8); b.fill();   /* the Load button */
  blit();
  const ta=clamp((G.t-titleT0-600)/1400,0,1), ty=top+66+(1-ta)*10;
  m.globalAlpha=ta;
  TO("Kaitlyn's",180,ty,54,'#ffcf3a','center',true,2);
  TO("Garden Song",180,ty+40,54,'#ffcf3a','center',true,2);
  TS("play the golden flute · grow the garden",180,ty+68,22,'#fff6e0','center');
  m.globalAlpha=1;
  T("Load a save code",180,bot-81,26,'#e8dcc0','center',true);
  if(Math.floor(G.t/500)%2===0) TS(titleWoken?"TAP ANYWHERE TO BEGIN":"♪  TAP TO START  ♪",180,bot-36,28,'#f7f0dc','center',true);
  TS(IS_TOUCH?"move: stick    act: A    back: B":"move: stick / WASD    act: A / J / space    back: H / esc",
    180,bot-16,20,'#b8d0b0','center');
}
const AREA_SCENES=['world','sys','shop','menu','tshop','ask','fishing','story','levelup'];
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
  if(G.scene==='world'&&LV_UPS.length){ G.scene='levelup'; lvT=0; padVec={x:0,y:0}; padId=null; }
  padRepeat(dt);
  /* out and about (and in the menus over it), the music follows the place and season */
  if(musicOn&&AREA_SCENES.includes(G.scene)) setMusic(areaMusic());
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
  else if(G.scene==='levelup') drawLevelUp(dt);
  else if(G.scene==='tshop') drawTownShop();
  else if(G.scene==='fishing') drawFishing(dt);
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
  /* the title theme is tried straight away, while the pictures are still loading */
  if(!boot.tried){ boot.tried=true; titleMusic(true); titleImg(); }
  if(assetsReady<IMG_TOTAL){ drawLoading(); requestAnimationFrame(boot); return; }
  booted=true;
  buildWorld();
  requestAnimationFrame(loop);
}
requestAnimationFrame(boot);
