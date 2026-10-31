/* ================================================================
   INPUT
   ================================================================ */
const keys={};
const KEYLANE={'d':0,'f':1,'j':2,'k':3,'1':0,'2':1,'3':2,'4':3,
  'arrowleft':0,'arrowdown':1,'arrowup':2,'arrowright':3};
addEventListener('keydown',e=>{ const k=e.key.toLowerCase();
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
  initAudio(); if(!keys[k]) onPress(k); keys[k]=true; });
addEventListener('keyup',e=>{ const k=e.key.toLowerCase(); keys[k]=false;
  if(G.scene==='rhythm'&&k in KEYLANE) laneUp(KEYLANE[k]); });
const touches={};
function cpos(e){ const r=cv.getBoundingClientRect();
  return {x:(e.clientX-r.left)/r.width*LW,y:(e.clientY-r.top)/r.height*LH}; }
cv.addEventListener('pointerdown',e=>{ e.preventDefault(); initAudio();
  if(AC&&AC.state==='suspended')AC.resume();
  const p=cpos(e); touches[e.pointerId]=p; onTouch(p.x,p.y,e.pointerId);
  try{cv.setPointerCapture(e.pointerId);}catch(_){} });
cv.addEventListener('pointermove',e=>{ if(touches[e.pointerId]){ const p=cpos(e);
  touches[e.pointerId].x=p.x; touches[e.pointerId].y=p.y; onTouchMove(p.x,p.y,e.pointerId);} });
function endT(e){ if(touches[e.pointerId]){ onTouchEnd(e.pointerId); delete touches[e.pointerId]; } }
cv.addEventListener('pointerup',endT); cv.addEventListener('pointercancel',endT);

const PAD={cx:66,cy:420,r:46}, BTN={cx:297,cy:420,r:39}, SYS={x:318,y:307,w:36,h:27};
let padVec={x:0,y:0}, padId=null, btnHeld=false;
function onTouch(x,y,id){
  if(G.scene==='title'){ if(y>376&&y<412) openSys(); else startGame(); return; }
  if(G.scene==='rhythm'){ rhythmTouch(x,y,id); return; }
  if(G.scene==='battle'){ battleTouch(x,y); return; }
  if(G.scene==='menu'){ menuTouch(x,y); return; }
  if(G.scene==='shop'){ shopTouch(x,y); return; }
  if(G.scene==='sys'){ sysTouch(x,y); return; }
  if(G.scene==='world'){
    if(x>SYS.x&&x<SYS.x+SYS.w&&y>SYS.y&&y<SYS.y+SYS.h){ openSys(); return; }
    if(Math.hypot(x-PAD.cx,y-PAD.cy)<PAD.r+26){ padId=id; setPad(x,y); }
    else if(Math.hypot(x-BTN.cx,y-BTN.cy)<BTN.r+18){ btnHeld=true; interact(); }
  }
}
function onTouchMove(x,y,id){
  if(G.scene==='world'&&padId===id) setPad(x,y);
  if(G.scene==='rhythm') rhythmMove(x,y,id);
}
function onTouchEnd(id){
  if(padId===id){ padId=null; padVec={x:0,y:0}; }
  btnHeld=false;
  if(G.scene==='rhythm') rhythmRelease(id);
}
function setPad(x,y){ const dx=x-PAD.cx,dy=y-PAD.cy,mm=Math.hypot(dx,dy)||1;
  padVec = mm>7?{x:dx/mm,y:dy/mm}:{x:0,y:0}; }
function onPress(k){
  if(G.scene==='title'&&(k===' '||k==='enter')) startGame();
  else if(G.scene==='world'&&(k===' '||k==='enter'||k==='e')) interact();
  else if(G.scene==='world'&&k==='m') openSys();
  else if(G.scene==='menu') menuKey(k);
  else if(G.scene==='shop') shopKey(k);
  else if(G.scene==='sys'&&k==='escape') G.scene='world';
  else if(G.scene==='battle') battleKey(k);
  else if(G.scene==='rhythm') rhythmKey(k);
}
