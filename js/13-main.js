/* ================================================================
   TITLE + LOOP
   ================================================================ */
/* The title: a sunrise. The sky lightens from deep blue to morning, the stars fade and
   the sun climbs over the horizon, warming the scene below. The scene is the title
   picture (assets/scenes/title.jpg) once it has loaded, or a drawn garden until then. */
const TITLE_RISE=11000, TITLE_HORIZON=0.5;     /* how long the sunrise takes (ms); where the horizon is */
/* where the light comes from in the title picture (shares of its width and height) */
const TITLE_SUN={x:0.88,y:0.62};
let titleT0=null, TITLE_IMG=null;
function titleImg(){
  if(!TITLE_IMG){ TITLE_IMG=new Image(); TITLE_IMG.src='assets/scenes/title.jpg'; }
  return TITLE_IMG.complete&&TITLE_IMG.naturalWidth?TITLE_IMG:null;
}
/* the logo (logo or logo frame in the art folder, as assets/sprites/logo.png): with the
   words in it, or a frame the words are written over; plain gold words until then */
let LOGO_IMG=null;
function logoImg(){
  if(typeof TITLE_LOGO==='undefined'||!TITLE_LOGO) return null;
  if(!LOGO_IMG){ LOGO_IMG=new Image(); LOGO_IMG.src='assets/sprites/logo.png'; }
  return LOGO_IMG.complete&&LOGO_IMG.naturalWidth?LOGO_IMG:null;
}
const LOGO_W=320;                 /* how wide the logo is drawn (logical px), at most */
/* the title's entrance: the scene fades up from black (TITLE_FADE ms), then the logo rises
   into the sky with the sun (starting LOGO_DELAY ms in, over LOGO_RISE ms) to settle with
   its middle LOGO_Y of the way down the screen */
const TITLE_FADE=3000, LOGO_DELAY=1200, LOGO_RISE=4000, LOGO_Y=0.27;
const mixCol=(a,z,k)=>{ const A=parseInt(a.slice(1),16), Z=parseInt(z.slice(1),16), c=sh=>Math.round(((A>>sh)&255)*(1-k)+((Z>>sh)&255)*k);
  return 'rgb('+c(16)+','+c(8)+','+c(0)+')'; };
function drawTitle(){
  if(titleT0===null) titleT0=G.t;
  const top=BAND_TOP(), bot=BAND_BOT(), H=bot-top, hy=top+H*TITLE_HORIZON;
  const raw=clamp((G.t-titleT0)/TITLE_RISE,0,1), k=raw*raw*(3-2*raw);    /* eased */
  const im=titleImg();
  /* the picture covers the scene; the sun's glow and rays come from its bright spot */
  let pic=null, sunX=LW*0.66, sunY=hy+26-k*96;
  if(im){ const r=im.naturalWidth/im.naturalHeight, h=Math.max(H,LW/r), w=h*r;
    pic={x:(LW-w)/2,y:top+(H-h)/2,w,h}; sunX=pic.x+w*TITLE_SUN.x; sunY=pic.y+h*TITLE_SUN.y+(1-k)*24; }
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
    b.save(); b.imageSmoothingEnabled=true; b.drawImage(im,pic.x,pic.y,pic.w,pic.h); b.restore();
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
  const dawn=clamp((G.t-titleT0)/TITLE_FADE,0,1);
  if(dawn<1){ b.fillStyle='rgba(0,0,0,'+(1-dawn)+')'; b.fillRect(0,top,LW,H); }
  /* a dark band behind the words at the bottom */
  const fade=b.createLinearGradient(0,bot-110,0,bot); fade.addColorStop(0,'rgba(10,16,12,0)'); fade.addColorStop(1,'rgba(10,16,12,.7)');
  b.fillStyle=fade; b.fillRect(0,bot-110,LW,110);
  if(titleWoken) drawTitleMenuBack(bot);
  /* the logo rises into the sky as the sun comes up, fading in as it goes */
  const lk=clamp((G.t-titleT0-LOGO_DELAY)/LOGO_RISE,0,1), le=1-Math.pow(1-lk,3), lg=logoImg();
  const lcy=top+H*LOGO_Y+(1-le)*40;          /* where the logo's middle is */
  if(lg){ const lw=Math.min(LOGO_W,lg.naturalWidth/SC), lh=lw*lg.naturalHeight/lg.naturalWidth;
    b.save(); b.globalAlpha=le; b.imageSmoothingEnabled=true; b.drawImage(lg,180-lw/2,lcy-lh/2,lw,lh); b.restore(); }
  blit();
  m.globalAlpha=le;
  if(!lg||TITLE_LOGO==='frame'){ const cy=lcy-20;
    TO("Kaitlyn's",180,cy,54,'#ffcf3a','center',true,2);
    TO("Garden Song",180,cy+40,54,'#ffcf3a','center',true,2); }
  m.globalAlpha=1;
  if(titleWoken) drawTitleMenuWords(bot);
  else if(Math.floor(G.t/500)%2===0) TS("♪  TAP TO START  ♪",180,bot-36,28,'#f7f0dc','center',true);
  TS(IS_TOUCH?"move: stick    act: A    back: B":"move: stick / WASD    act: A / J / space    back: H / esc",
    180,bot-16,20,'#b8d0b0','center');
}
/* ---------- the title's menu ----------
   Once the music is awake: Continue (the slot played last), New Game, Load Game and
   pasting a save code. New Game, Load Game and the code open the slot list (TM.mode
   'slots', TM.for which), where a slot that's already in use asks before it's started
   over (TM.ask). */
let TM={mode:'main',idx:0,ask:null,for:null,err:null};
function titleItems(){
  const L=[];
  if(SLOTS[lastSlot-1]) L.push({id:'continue',name:"Continue"});
  L.push({id:'new',name:"New Game"});
  if(SLOTS.some(s=>s)) L.push({id:'load',name:"Load Game"});
  L.push({id:'code',name:"Load a save code"});
  return L;
}
const TBTN={x:70,w:220,h:32,step:40};
const tbtnY=(bot,i,n)=>bot-34-(n-i)*TBTN.step;
const TSLOT={x:20,w:320,row:50,top:44};
const tslotY=bot=>bot-34-(TSLOT.top+(SAVE_SLOTS+1)*TSLOT.row+10);
const TASK={x:40,w:280,h:120};
const taskY=bot=>tslotY(bot)+40;
function titleKey(k){
  if(TM.ask){
    if(isUp(k)||isDown(k)||isLeft(k)||isRight(k)) TM.ask.idx=1-TM.ask.idx;
    else if(isOk(k)){ const n=TM.ask.n; if(TM.ask.idx===0) slotChosen(n); TM.ask=null; }
    else if(isBack(k)) TM.ask=null;
    return; }
  const n=TM.mode==='main'?titleItems().length:SAVE_SLOTS+1;
  if(isUp(k)) TM.idx=(TM.idx+n-1)%n;
  else if(isDown(k)) TM.idx=(TM.idx+1)%n;
  else if(isOk(k)) titlePick(TM.idx);
  else if(isBack(k)&&TM.mode==='slots'){ TM={mode:'main',idx:0,ask:null}; }
}
function titleTouch(x,y){
  const bot=BAND_BOT();
  if(TM.ask){ const Y=taskY(bot);
    if(y>Y+TASK.h-46&&y<Y+TASK.h-10&&x>TASK.x&&x<TASK.x+TASK.w){ const yes=x<TASK.x+TASK.w/2, n=TM.ask.n; TM.ask=null; if(yes) slotChosen(n); }
    else TM.ask=null;
    return; }
  if(TM.mode==='main'){ const L=titleItems();
    L.forEach((it,i)=>{ const Y=tbtnY(bot,i,L.length); if(x>TBTN.x&&x<TBTN.x+TBTN.w&&y>Y&&y<Y+TBTN.h){ TM.idx=i; titlePick(i); } });
    return; }
  const Y=tslotY(bot), j=Math.floor((y-Y-TSLOT.top)/TSLOT.row);
  if(x>TSLOT.x&&x<TSLOT.x+TSLOT.w&&j>=0&&j<=SAVE_SLOTS){ TM.idx=j; titlePick(j); }
  else TM={mode:'main',idx:0,ask:null};
}
function titlePick(i){
  TM.err=null;
  if(TM.mode==='main'){ const it=titleItems()[i]; if(!it) return;
    blip(520,0.04,0.08,'triangle');
    if(it.id==='continue'){ beginSlot(lastSlot,'load'); return; }
    const empty=SLOTS.findIndex(s=>!s), used=SLOTS.findIndex(s=>s);
    TM={mode:'slots',for:it.id,ask:null,idx:it.id==='load'?Math.max(0,used):Math.max(0,empty)};
    return; }
  if(i===SAVE_SLOTS){ TM={mode:'main',idx:0,ask:null}; return; }          /* Back */
  const n=i+1, used=!!SLOTS[i];
  if(TM.for==='load'){ if(used) beginSlot(n,'load'); else blip(150,.08,.2); return; }
  if(used){ TM.ask={n,idx:1}; return; }                                    /* start over in a used slot? */
  slotChosen(n);
}
/* a slot for a new game, or for a pasted code */
function slotChosen(n){
  if(TM.for==='new'){ beginSlot(n,'fresh'); return; }
  const s=prompt("Paste your save code:"); if(!s) return;
  if(importCode(s)) beginSlot(n,'have'); else { TM.err="That code didn't work."; blip(150,.08,.2); }
}
/* play slot n: load it, start it fresh, or keep the game just pasted in */
function beginSlot(n,how){
  G.slot=n; lastSlot=n; storeSet('kgs7_last',String(n));
  TM={mode:'main',idx:0,ask:null};
  if(how==='load'){ autoLoad().then(()=>startGame()); return; }
  if(how==='fresh') newGameState();
  startGame(); autoSave();
}
/* back to the title (from the menu's Save tab): the slots are read again */
function toTitle(){
  G.scene='title'; titleT0=null; TM={mode:'main',idx:0,ask:null};
  readSlots(); titleMusic();
}
const slotText=s=>s?"Lv."+s.lv+" · "+SEASON_NAME[seasonOf(s.day)]+", Day "+s.day+" · "+s.coins+"c":"Empty";
function drawTitleMenuBack(bot){
  if(TM.mode==='main'){ const L=titleItems();
    L.forEach((it,i)=>{ const Y=tbtnY(bot,i,L.length);
      rpgWin({x:TBTN.x,y:Y,w:TBTN.w,h:TBTN.h});
      if(i===TM.idx){ b.fillStyle='rgba(255,214,110,.3)'; b.beginPath(); b.roundRect(TBTN.x+3,Y+3,TBTN.w-6,TBTN.h-6,4); b.fill(); } });
    return; }
  const Y=tslotY(bot);
  rpgWin({x:TSLOT.x,y:Y,w:TSLOT.w,h:TSLOT.top+(SAVE_SLOTS+1)*TSLOT.row+10});
  winCursor(TSLOT.x+6,Y+TSLOT.top+TM.idx*TSLOT.row,TSLOT.w-12,TSLOT.row-4);
  if(TM.ask){ const A=taskY(bot); b.fillStyle='rgba(4,6,20,.55)'; b.fillRect(0,BAND_TOP(),LW,bot-BAND_TOP());
    rpgWin({x:TASK.x,y:A,w:TASK.w,h:TASK.h});
    [0,1].forEach(i=>{ const bx=TASK.x+14+i*(TASK.w/2-7);
      b.fillStyle=i===TM.ask.idx?'rgba(255,214,110,.35)':'rgba(150,180,255,.15)'; b.beginPath(); b.roundRect(bx,A+TASK.h-44,TASK.w/2-21,34,6); b.fill(); }); }
}
function drawTitleMenuWords(bot){
  if(TM.mode==='main'){ const L=titleItems();
    L.forEach((it,i)=>{ const Y=tbtnY(bot,i,L.length);
      TS(it.name,180,Y+23,22,i===TM.idx?WIN_TXT.gold:WIN_TXT.title,'center',true); });
    if(TM.err) TS(TM.err,180,tbtnY(bot,0,L.length)-10,17,'#ff9a8a','center');
    return; }
  const Y=tslotY(bot);
  if(TM.ask){ const A=taskY(bot);
    TS("Start over in Slot "+TM.ask.n+"?",180,A+30,22,'#f4f6ff','center',true);
    TS("The game saved there will be erased.",180,A+52,16,'#ffb0a8','center');
    ["Yes, start over","No"].forEach((t,i)=>TS(t,TASK.x+14+i*(TASK.w/2-7)+(TASK.w/2-21)/2,A+TASK.h-21,18,i===TM.ask.idx?'#ffe08a':'#f4f6ff','center',true));
    return; }                               /* the slot list's words stay hidden behind it */
  TS(TM.for==='load'?"Load which game?":TM.for==='new'?"Start a new game in…":"Put the pasted game in…",TSLOT.x+14,Y+28,22,'#f4f6ff',null,true);
  SLOTS.forEach((s,i)=>{ const y=Y+TSLOT.top+i*TSLOT.row;
    TS("Slot "+(i+1),TSLOT.x+40,y+20,21,'#f4f6ff',null,i===TM.idx);
    TS(slotText(s),TSLOT.x+40,y+38,16,s?'#c8d4ff':'#7c84b0');
    if(s&&i+1===lastSlot) TS("last played",TSLOT.x+TSLOT.w-14,y+20,14,'#ffe08a','right'); });
  TS("Back",TSLOT.x+40,Y+TSLOT.top+SAVE_SLOTS*TSLOT.row+28,21,'#c8d4ff',null,TM.idx===SAVE_SLOTS);
  if(TM.err) TS(TM.err,180,Y-10,17,'#ff9a8a','center');
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
  if(G.scene==='world'||G.scene==='story') updateIvy(dt);
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
  FRESH_SAVE=saveObj();                    /* a new game starts from exactly this */
  readSlots();
  requestAnimationFrame(loop);
}
requestAnimationFrame(boot);
