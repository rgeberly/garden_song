"use strict";
"use strict";
/* ==================================================================
   KAITLYN'S GARDEN SONG · v6   ·   360x480 logical, 1080x1440 out
   ================================================================== */
/* Scenes are laid out for a 360x480 screen. On taller screens (phones) the canvas
   grows to SCREEN_H: the garden view takes the EXTRA height (VIEW_H) with the HUD
   and controls pinned to the bottom, and the other scenes are centred in it. */
const LW=360, LH=480, SC=3, HUD_Y=300;
const WORLD_W=720, WORLD_H=720;
let SCREEN_H=LH, EXTRA=0, VIEW_H=HUD_Y;
const MAX_VIEW_H=560;       /* the whole map height at the garden's zoom (720 x 0.8, less a margin) */
/* touch screens get on-screen buttons only, no keyboard hints */
const IS_TOUCH=matchMedia('(pointer: coarse)').matches||'ontouchstart' in window;

const cv=document.getElementById('c');
const m=cv.getContext('2d');
const buf=document.createElement('canvas');
const b=buf.getContext('2d');
function layout(){
  const want=Math.round(LW*innerHeight/Math.max(1,innerWidth));
  const h=clamp(want,LH,LH+420);
  if(h===SCREEN_H&&cv.height===h*SC) return;
  SCREEN_H=h; EXTRA=h-LH; VIEW_H=Math.min(HUD_Y+EXTRA,MAX_VIEW_H);
  cv.width=buf.width=LW*SC; cv.height=buf.height=SCREEN_H*SC;   /* resets both contexts */
  m.imageSmoothingEnabled=false; b.imageSmoothingEnabled=false;
}
function fit(){ layout();
  const s=Math.min(innerWidth/(LW*SC),innerHeight/(SCREEN_H*SC));
  cv.style.width=(LW*SC*s)+'px'; cv.style.height=(SCREEN_H*SC*s)+'px'; }
addEventListener('resize',fit);

const px=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
const clamp=(v,a,z)=>v<a?a:v>z?z:v;
fit();
/* centred scenes: their own top and bottom edges, reaching into the extra space */
const BAND_TOP=()=>-EXTRA/2, BAND_BOT=()=>LH+EXTRA/2;
/* Scenes draw shapes into buf and text straight onto the screen (m), both shifted to
   where the scene sits; blit copies buf onto the screen as is (it is already shifted). */
function blit(){ m.save(); m.setTransform(1,0,0,1,0,0); m.drawImage(buf,0,0); m.restore(); }
function wipeBuf(){ b.save(); b.setTransform(1,0,0,1,0,0); b.clearRect(0,0,buf.width,buf.height); b.restore(); }
/* fill the whole screen, whatever the scene's shift */
function fillScreen(c,col,alpha){
  c.save(); c.setTransform(c===m?1:SC,0,0,c===m?1:SC,0,0); c.globalAlpha=alpha===undefined?1:alpha;
  c.fillStyle=col; c.fillRect(0,0,c===m?LW*SC:LW,c===m?SCREEN_H*SC:SCREEN_H); c.restore();
}
const rnd=(a,z)=>a+Math.random()*(z-a);
const ri=(a,z)=>Math.floor(rnd(a,z+1));
const FONT="Verdana, sans-serif";
function T(t,x,y,size,col,align,bold){
  m.font=(bold?'bold ':'')+size+'px '+FONT; m.fillStyle=col;
  m.textAlign=align||'left'; m.fillText(t,x*SC,y*SC);
}
function TW(t,size,bold){ m.font=(bold?'bold ':'')+size+'px '+FONT;
  return m.measureText(t).width/SC; }

/* ---------------- atlases ---------------- */
const IMG_PT=new Image(), IMG_EN=new Image(), IMG_BATL=new Image(),
      IMG_POSE=new Image(), IMG_FL=new Image();
let assetsReady=0; const loadErr=[];
const IMG_FROG=new Image(), IMG_FLBIG=new Image(),
      IMG_MAP=new Image(), IMG_MAPCOL=new Image();
/* collision comes straight out of a 1-bit mask painted from the map */
let COL=null;
IMG_MAPCOL.onload=()=>{
  const cc=document.createElement('canvas');
  cc.width=cc.height=MAP_META.cells;
  const g=cc.getContext('2d');
  g.drawImage(IMG_MAPCOL,0,0,MAP_META.cells,MAP_META.cells);
  const d=g.getImageData(0,0,MAP_META.cells,MAP_META.cells).data;
  const C=MAP_META.cells, raw=new Uint8Array(C*C);
  for(let i=0,j=0;i<raw.length;i++,j+=4) raw[i]=d[j]>128?0:1;   // 1 = blocked
  /* give her some wiggle room: a cell stays blocked only if every cell within
     COL_SLACK of it is blocked too, so blocked areas shrink by that many cells */
  COL=new Uint8Array(C*C);
  for(let y=0;y<C;y++) for(let x=0;x<C;x++){
    let all=raw[y*C+x];
    for(let dy=-COL_SLACK;all&&dy<=COL_SLACK;dy++) for(let dx=-COL_SLACK;all&&dx<=COL_SLACK;dx++){
      const xx=x+dx, yy=y+dy;
      if(xx>=0&&yy>=0&&xx<C&&yy<C&&!raw[yy*C+xx]) all=0;
    }
    COL[y*C+x]=all;
  }
};
const COL_SLACK=2;   // cells (2 world px each)
[[IMG_PT,ASSET_PT],[IMG_EN,ASSET_EN],[IMG_BATL,ASSET_BATL],
 [IMG_POSE,ASSET_POSE],[IMG_FL,ASSET_FL],[IMG_FROG,ASSET_FROG],
 [IMG_FLBIG,ASSET_FLBIG],[IMG_MAP,ASSET_MAP],[IMG_MAPCOL,ASSET_MAPCOL]].forEach(([im,src])=>{
  const own=im.onload;                    /* keep a handler set above (the collision mask's) */
  im.onload=()=>{ if(own) own(); assetsReady++; };
  im.onerror=()=>loadErr.push(src);
  im.src=src;
});
const BROW={}; BATL_META.rows.forEach((r,i)=>BROW[r.name]=i);
const BRN=BATL_META.rows.map(r=>r.n);
const BTC=ASSET_META.bt, ENC=ASSET_META.en;
/* Draw an atlas cell at its native device resolution, anchored bottom-centre
   on a logical coordinate. zoom 1 = one source pixel per screen pixel. */
function drawDev(c,img,sx,sy,sw,sh,cxL,footL,zoom,padBottom,flip){
  const z=zoom||1;
  c.save(); c.scale(z/SC,z/SC);
  if(flip) c.scale(-1,1);
  const dx=(flip? -cxL*SC/z-sw/2 : cxL*SC/z-sw/2);
  const dy=footL*SC/z-sh+(padBottom||0);
  c.drawImage(img,sx,sy,sw,sh,Math.round(dx),Math.round(dy),sw,sh);
  c.restore();
}
/* --- directional idle / walk animation set --- */
const IMG_ANIM=new Image(); let animReady=false;
IMG_ANIM.onload=()=>{animReady=true;assetsReady++;};
IMG_ANIM.onerror=()=>{loadErr.push('anim');};
IMG_ANIM.src=ASSET_ANIM;
const AM=ANIM_META;
/* Every walk row is 24 frames = four steps of 6 frames, starting on the left
   foot (walkT resets on stop). 1400ms puts a relaxed step every 350ms: ~25px
   steps at WALK_SPEED, so the feet keep pace with the ground. Idle rows are 8 frames. */
/* The garden is drawn at WORLD_ZOOM (zoomed out) while Kaitlyn keeps her own size,
   so she covers 1/WORLD_ZOOM more ground per step: her feet still keep pace. */
const WORLD_ZOOM=0.8;
const WALK_CYCLE=1400, IDLE_CYCLE=1600, WALK_SPEED=0.072/WORLD_ZOOM;   // world px per ms
/* game dir 0 N,1 NE,2 E,3 SE,4 S,5 SW,6 W,7 NW  ->  sheet + horizontal flip.
   SW, W and NW are mirrors of SE, E and NE. */
const DIRMAP=[['up',0],['northeast',0],['east',0],['southeast',0],
              ['down',0],['southeast',1],['east',1],['northeast',1]];
const ROWOF={};
AM.rows.forEach((r,i)=>{ ROWOF[r.anim+'_'+r.dir]=i; });
const ROWN=AM.rows.map(r=>r.n);

/* --- footstep / breathing loops that ride along with the animation --- */
const SFX={}; let sfxKey=null, sfxAnim=null, sfxOn=false;
function initSfx(){
  if(sfxOn) return; sfxOn=true;
  for(const k in ASSET_SFX){
    try{ const a=new Audio(ASSET_SFX[k]); a.loop=true; a.volume=0.22; a.preload='auto'; SFX[k]=a; }
    catch(e){}
  }
}
function setSfx(key){
  if(key===sfxKey) return;
  const prev=SFX[sfxKey]; if(prev){ try{prev.pause();}catch(e){} }
  sfxKey=key;
  const a=SFX[key];
  if(a){ try{ a.currentTime=0; const p=a.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
}
const ONESHOT={};
function playOne(key,vol){
  if(!ASSET_SFX[key]) return;
  try{
    let a=ONESHOT[key];
    if(!a){ a=new Audio(ASSET_SFX[key]); ONESHOT[key]=a; }
    a.volume=vol===undefined?0.5:vol; a.currentTime=0;
    const p=a.play(); if(p&&p.catch) p.catch(()=>{});
  }catch(e){}
}
function stopSfx(){ const a=SFX[sfxKey]; if(a){ try{a.pause();}catch(e){} } sfxKey=null; sfxAnim=null; }
function dirFromVec(dx,dy){
  const a=Math.atan2(dy,dx);
  return ((Math.round(a/(Math.PI/4))+2)%8+8)%8;
}
const FLUTE_INFO={
  recorder:{name:"Wooden Recorder", mul:1.00, body:'#c98a4a',hi:'#f2c68e',dark:'#8a5a28'},
  silver  :{name:"Silver Flute",    mul:1.15, body:'#c6ced6',hi:'#ffffff',dark:'#79848c'},
  dizi    :{name:"Mystic Dizi",     mul:1.35, body:'#dfe4ea',hi:'#fff6cf',dark:'#8a7a3a'},
};
const fluteOwned=id=>id==='recorder'||!!G.gear[id];
function drawFluteIcon(c,cx,cy,zoom){
  if(assetsReady<5) return;
  const fi=Math.max(0,FLUTE_META.order.indexOf(G.flute||'recorder')), z=zoom||1;
  c.save(); c.scale(z/SC,z/SC);
  c.drawImage(IMG_FL,fi*FLUTE_META.cw,0,FLUTE_META.cw,FLUTE_META.ch,
    Math.round(cx*SC/z-FLUTE_META.cw/2),Math.round(cy*SC/z-FLUTE_META.ch/2),
    FLUTE_META.cw,FLUTE_META.ch);
  c.restore();
}
/* flute held in hand: x offset, y above the feet, tilt — per source facing */
const FLUTE_HOLD=[[9,-30,-0.20],[9,-31,-0.24],[6,-30,-0.14],[-7,-30,0.14],[-9,-29,0.19]];
const FLUTE_ORDER=FLUTE_META.order;
function drawFluteInHand(c,cx,footY,dir){
  if(assetsReady<5) return;
  const [dname,flip]=DIRMAP[dir&7];
  const di=AM.dirs.indexOf(dname);
  let [ox,oy,ang]=FLUTE_HOLD[di<0?4:di];
  if(flip){ ox=-ox; ang=-ang; }
  const fi=Math.max(0,FLUTE_ORDER.indexOf(G.flute||'recorder'));
  c.save();
  c.translate(cx+ox,footY+oy); c.rotate(ang); c.scale(1/SC,1/SC);
  c.drawImage(IMG_FL,fi*FLUTE_META.cw,0,FLUTE_META.cw,FLUTE_META.ch,
    Math.round(-FLUTE_META.cw/2),Math.round(-FLUTE_META.ch/2),FLUTE_META.cw,FLUTE_META.ch);
  c.restore();
}
/* which sheet cell she shows: shared by her sprite and her cast shadow */
function kaitlynFrame(dir,frameT,moving){
  const [dname,flip]=DIRMAP[dir&7];
  const row=ROWOF[(moving?'walk':'idle')+'_'+dname];
  const n=ROWN[row]||1;
  const per=(moving?WALK_CYCLE:IDLE_CYCLE)/n;
  const i=Math.floor(frameT/per)%n;
  return {sx:i*AM.cw, sy:row*AM.ch, flip};
}
function drawKaitlyn(c,cx,footY,dir,frameT,swim,moving){
  if(!animReady) return;
  const f=kaitlynFrame(dir,frameT,moving);
  // cell row AM.foot is her ground point; the rows below leave room for the back boot
  drawDev(c,IMG_ANIM,f.sx,f.sy,AM.cw,AM.ch,cx,footY,1,AM.ch-AM.foot,f.flip);
}
/* pose 0 = battle stance, pose 1 = defeated */
function drawPose(c,i,cx,footY){
  if(assetsReady<5) return;
  drawDev(c,IMG_POSE,i*POSE_META.cw,0,POSE_META.cw,POSE_META.ch,cx,footY,2,3);
}
function drawBattleRow(c,name,idx,cx,footY){
  if(assetsReady<3) return;
  const row=BROW[name], n=BRN[row]||1;
  const i=clamp(idx,0,n-1);
  drawDev(c,IMG_BATL,i*BATL_META.cw,row*BATL_META.ch,
    BATL_META.cw,BATL_META.ch,cx,footY,2,3);
}
function drawBattleK(c,cx,footY,swim,k){
  if(B&&B.over==='lose'){ drawPose(c,1,cx,footY); return; }
  if(B&&B.over==='win'){
    const n=BRN[BROW.victory]||1;
    drawBattleRow(c,'victory',Math.floor(G.t/85)%n,cx,footY); return;
  }
  if(B&&B.anim){
    const kind=B.anim.kind;
    if(kind==='kick'){
      const n=BRN[BROW[B.kickVar||'kick']]||1;
      drawBattleRow(c,B.kickVar||'kick',Math.floor(k*n),cx,footY); return;
    }
    if(kind!=='enemy'){
      const n=BRN[BROW.flute]||1;
      drawBattleRow(c,'flute',Math.floor(k*n),cx,footY); return;
    }
  }
  drawPose(c,0,cx,footY);
}
function drawEnemyArt(c,species,cx,footY,zoom){
  const i=ENC.order.indexOf(species);
  if(i<0||assetsReady<2) return false;
  drawDev(c,IMG_EN,i*ENC.cw,0,ENC.cw,ENC.ch,cx,footY,zoom||1,0);
  return true;
}
/* the whole portrait image at its own size (times s), top-left at x,y */
function portrait(c,x,y,s){
  if(assetsReady<2) return;
  const z=s||1, w=IMG_PT.naturalWidth, h=IMG_PT.naturalHeight;
  c.save(); c.scale(z/SC,z/SC); c.imageSmoothingEnabled=z!==1;
  c.drawImage(IMG_PT,0,0,w,h,Math.round(x*SC/z),Math.round(y*SC/z),w,h);
  c.restore();
}
