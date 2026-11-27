/* ================================================================
   INPUT
   ================================================================ */
const keys={};
/* rhythm lanes: H J K L (number keys and arrows also work) */
const KEYLANE={'h':0,'j':1,'k':2,'l':3,'1':0,'2':1,'3':2,'4':3,
  'arrowleft':0,'arrowdown':1,'arrowup':2,'arrowright':3};
/* outside the rhythm game: J / Space / Enter accept, H / Esc cancel, WASD or arrows move */
const isOk=k=>k===' '||k==='enter'||k==='j';
const isBack=k=>k==='escape'||k==='h';
const isUp=k=>k==='arrowup'||k==='w', isDown=k=>k==='arrowdown'||k==='s';
const isLeft=k=>k==='arrowleft'||k==='a', isRight=k=>k==='arrowright'||k==='d';
addEventListener('keydown',e=>{ const k=e.key.toLowerCase();
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
  initAudio(); if(!keys[k]) onPress(k); keys[k]=true; });
addEventListener('keyup',e=>{ const k=e.key.toLowerCase(); keys[k]=false;
  if(G.scene==='rhythm'&&k in KEYLANE) laneUp(KEYLANE[k]); });
const touches={};
/* pointer position in the scene's own coordinates (see sceneOff), plus hy: where it is
   in the HUD/deck layout, which sits EXTRA lower than its 300..480 coordinates */
function cpos(e){ const r=cv.getBoundingClientRect();
  const y=(e.clientY-r.top)/r.height*SCREEN_H;
  return {x:(e.clientX-r.left)/r.width*LW, y:y-sceneOff(), hy:y-EXTRA}; }
cv.addEventListener('pointerdown',e=>{ e.preventDefault(); initAudio();
  if(AC&&AC.state==='suspended')AC.resume();
  const p=cpos(e); touches[e.pointerId]=p;
  if(!deckTouch(p.x,p.hy,e.pointerId)) onTouch(p.x,p.y,e.pointerId,p.hy);
  try{cv.setPointerCapture(e.pointerId);}catch(_){} });
cv.addEventListener('pointermove',e=>{ if(touches[e.pointerId]){ const p=cpos(e);
  touches[e.pointerId].x=p.x; touches[e.pointerId].y=p.y; onTouchMove(p.x,p.y,e.pointerId,p.hy);} });
function endT(e){ if(touches[e.pointerId]){ onTouchEnd(e.pointerId); delete touches[e.pointerId]; } }
cv.addEventListener('pointerup',endT); cv.addEventListener('pointercancel',endT);

const PAD={cx:66,cy:420,r:46}, BTN={cx:297,cy:420,r:39}, BTNB={cx:228,cy:448,r:26},
      SYS={x:318,y:307,w:36,h:27};
let padVec={x:0,y:0}, padId=null, btnHeld=false, btnBHeld=false;
/* The deck's pad and buttons, in any scene that shows them (hy in HUD coordinates).
   In the garden the pad walks and A acts; elsewhere the pad works like the arrow keys
   (held, it repeats), A like J / Enter and B like H / Esc. Returns true if it took the
   touch. Outside the garden the rest of the deck is dead space, so a tap there can't
   reach a menu row hidden under it. */
function deckTouch(x,hy,id){
  if(!deckShown()&&G.scene!=='world') return false;     /* the garden HUD's pad works with a mouse too */
  if(Math.hypot(x-PAD.cx,hy-PAD.cy)<PAD.r+26){ padId=id; setPad(x,hy); return true; }
  if(Math.hypot(x-BTNB.cx,hy-BTNB.cy)<BTNB.r+8){ btnBHeld=true; onPress('escape'); return true; }
  if(Math.hypot(x-BTN.cx,hy-BTN.cy)<BTN.r+18){ btnHeld=true;
    if(G.scene==='world') interact(); else onPress('enter'); return true; }
  return G.scene!=='world'&&hy>LH-DECK_H;
}
/* outside the garden, a held pad direction presses that arrow, then repeats */
const PAD_DELAY=380, PAD_EVERY=140;
let padDir=null, padRep=0;
function padRepeat(dt){
  let d=null;
  if(padId!==null&&G.scene!=='world'&&deckShown()&&(padVec.x||padVec.y))
    d=Math.abs(padVec.x)>Math.abs(padVec.y)?(padVec.x>0?'arrowright':'arrowleft'):(padVec.y>0?'arrowdown':'arrowup');
  if(d!==padDir){ padDir=d; padRep=PAD_DELAY; if(d) onPress(d); }
  else if(d&&(padRep-=dt)<=0){ padRep=PAD_EVERY; onPress(d); }
}
/* ---- the menus' own clicks ----
   Each key or tap is looked at before and after. If it played no sound of its own but
   changed a menu's tab, opened or closed something, or moved the cursor, the matching
   click plays (menu_tab, menu_confirm, menu_cancel, menu_move). */
const MENU_SCENES=['title','menu','shop','sys','battle','ask','levelup'];
function menuState(){
  const s=G.scene, J=JSON.stringify; let tab='',cur='',depth=0,step=0;     /* step: a battle's member picking */
  if(s==='sys'){ const picking=sys.focus==='who';
    tab=J([sys.tab,picking?0:sys.who,sys.cat||'']); cur=J([sys.idx,sys.top,picking?sys.who:-1,sys.eq&&sys.eq.idx,sys.pick&&sys.pick.idx,sys.ask&&sys.ask.idx]);
    depth=(sys.focus==='tabs'?0:picking?1:2)+!!sys.lore+!!sys.loreSel+!!sys.cat+(sys.held!=null)+!!sys.eq+!!sys.pick+!!sys.ask; }
  else if(s==='shop'){ tab=J(shop.tab); cur=J([shop.idx,shop.page,shop.cIdx]); depth=shop.confirm?1:0; }
  else if(s==='menu') cur=J(menu.idx);
  else if(s==='title'){ cur=J(TM.idx); depth=(TM.mode==='main'?0:1)+!!TM.ask; }
  else if(s==='ask'&&ask) cur=J(ask.idx);
  else if(s==='battle'&&B){ cur=J([B.idx,B.sub,B.tgt&&B.tgt.i]); depth=(B.menu==='cmd'?0:1)+!!B.tgt+!!B.inspect; step=B.inputAt+(B.turn==='player'?0:99); }
  return {scene:s,tab,cur,depth,step};
}
function menuClick(k,run){
  const n=sndN, a=menuState(); run();
  if(sndN!==n) return;                       /* it made its own sound */
  const b=menuState(), menuish=s=>MENU_SCENES.includes(s);
  if(a.scene!==b.scene){
    if(a.scene==='title') sfx('menu_confirm');                /* into the game */
    else if(a.scene==='world'&&(b.scene==='sys'||b.scene==='shop'||b.scene==='menu')) sfx('menu_confirm');
    else if(b.scene==='world'&&(a.scene==='sys'||a.scene==='shop'||a.scene==='menu'||a.scene==='ask')) sfx(k&&isOk(k)?'menu_confirm':'menu_cancel');
    return; }
  if(!menuish(b.scene)) return;
  if(a.tab!==b.tab) sfx('menu_tab');
  else if(b.step>a.step) sfx('menu_confirm');               /* a move picked: on to the next one */
  else if(b.depth>a.depth) sfx('menu_confirm');
  else if(b.depth<a.depth) sfx('menu_cancel');
  else if(a.cur!==b.cur) sfx('menu_move');
}
const onPress=k=>menuClick(k,()=>pressKey(k));
const onTouch=(x,y,id,hy)=>menuClick(null,()=>touchAt(x,y,id,hy));
function touchAt(x,y,id,hy){
  if(G.scene==='title'){ if(!titleWoken){ titleMusic(); return; } titleTouch(x,y); return; }
  if(G.scene==='rhythm'){ rhythmTouch(x,y,id); return; }
  if(G.scene==='battle'){ battleTouch(x,y); return; }
  if(G.scene==='menu'){ menuTouch(x,y,id); return; }
  if(G.scene==='shop'){ shopTouch(x,y); return; }
  if(G.scene==='sys'){ sysTouch(x,y); return; }
  if(G.scene==='sleep'){ sleepTap(); return; }
  if(G.scene==='ask'){ askTouch(x,y); return; }
  if(G.scene==='story'){ storyTap(); return; }
  if(G.scene==='levelup'){ levelUpTap(); return; }
  if(G.scene==='fishing'){ fishTouch(x,y,id); return; }
  if(G.scene==='world'&&x>SYS.x&&x<SYS.x+SYS.w&&hy>SYS.y&&hy<SYS.y+SYS.h) openSys();
}
function onTouchMove(x,y,id,hy){
  if(padId===id) setPad(x,hy);
  if(G.scene==='rhythm') rhythmMove(x,y,id);
  if(G.scene==='fishing') fishMove(x,y,id);
  if(G.scene==='menu') menuMove(x,y,id);
}
function onTouchEnd(id){
  if(padId===id){ padId=null; padVec={x:0,y:0}; }
  btnHeld=false; btnBHeld=false;
  if(G.scene==='fishing') fishUp(id);
  if(G.scene==='menu') menuUp(id);
  if(G.scene==='rhythm') rhythmRelease(id);
}
/* the pad's direction, and how far it's pushed (padAmp, 0 just past the dead zone to 1
   near the rim): boots and coffee only kick in as it's pushed further */
let padAmp=0;
function setPad(x,y){ const dx=x-PAD.cx,dy=y-PAD.cy,mm=Math.hypot(dx,dy)||1;
  padVec = mm>7?{x:dx/mm,y:dy/mm}:{x:0,y:0};
  padAmp = clamp((mm-7)/(PAD.r*0.8-7),0,1); }
function pressKey(k){
  if(G.scene==='title'&&!titleWoken){ initAudio(); titleMusic(); }    /* the first press wakes the music */
  else if(G.scene==='title') titleKey(k);
  else if(G.scene==='world'&&(isOk(k)||k==='e')) interact();
  else if(G.scene==='world'&&k==='m') openSys();
  else if(G.scene==='world'&&isBack(k)&&G.runMode==='toggle'&&gearOn('boots')){ G.runOn=!G.runOn; say(G.runOn?"Running.":"Walking."); }
  else if(G.scene==='menu') menuKey(k);
  else if(G.scene==='shop') shopKey(k);
  else if(G.scene==='sys') sysKey(k);
  else if(G.scene==='battle') battleKey(k);
  else if(G.scene==='rhythm') rhythmKey(k);
  else if(G.scene==='sleep'&&(isOk(k)||k==='e')) sleepTap();
  else if(G.scene==='ask') askKey(k);
  else if(G.scene==='story'&&(isOk(k)||k==='e')) storyTap();
  else if(G.scene==='levelup'&&isOk(k)) levelUpTap();
  else if(G.scene==='fishing') fishKey(k);
}
