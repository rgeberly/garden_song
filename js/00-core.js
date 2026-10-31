"use strict";
"use strict";
/* ==================================================================
   KAITLYN'S GARDEN SONG · v6   ·   360x480 logical, 1080x1440 out
   ================================================================== */
const LW=360, LH=480, SC=3, VIEW_H=300, HUD_Y=VIEW_H;
const WORLD_W=720, WORLD_H=720;

const cv=document.getElementById('c');
cv.width=LW*SC; cv.height=LH*SC;
const m=cv.getContext('2d');
const buf=document.createElement('canvas'); buf.width=LW*SC; buf.height=LH*SC;
const b=buf.getContext('2d');
m.imageSmoothingEnabled=false; b.imageSmoothingEnabled=false;
function fit(){ const s=Math.min(innerWidth/(LW*SC),innerHeight/(LH*SC));
  cv.style.width=(LW*SC*s)+'px'; cv.style.height=(LH*SC*s)+'px'; }
addEventListener('resize',fit); fit();

const px=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
const clamp=(v,a,z)=>v<a?a:v>z?z:v;
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
  COL=new Uint8Array(MAP_META.cells*MAP_META.cells);
  for(let i=0,j=0;i<COL.length;i++,j+=4) COL[i]=d[j]>128?0:1;   // 1 = blocked
};
[[IMG_PT,ASSET_PT],[IMG_EN,ASSET_EN],[IMG_BATL,ASSET_BATL],
 [IMG_POSE,ASSET_POSE],[IMG_FL,ASSET_FL],[IMG_FROG,ASSET_FROG],
 [IMG_FLBIG,ASSET_FLBIG],[IMG_MAP,ASSET_MAP],[IMG_MAPCOL,ASSET_MAPCOL]].forEach(([im,src])=>{
  im.onload=()=>assetsReady++;
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
/* Every walk row is 12 frames = four steps, starting on the left foot (walkT
   resets on stop). 940ms puts a step every 235ms: ~25px steps at ~108px/s,
   so the feet keep pace with the ground. Idle rows are 8 frames. */
const WALK_CYCLE=940, IDLE_CYCLE=1600;
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
function drawKaitlyn(c,cx,footY,dir,frameT,swim,moving){
  if(!animReady) return;
  const [dname,flip]=DIRMAP[dir&7];
  const row=ROWOF[(moving?'walk':'idle')+'_'+dname];
  const n=ROWN[row]||1;
  const per=(moving?WALK_CYCLE:IDLE_CYCLE)/n;
  const i=Math.floor(frameT/per)%n;
  drawDev(c,IMG_ANIM,i*AM.cw,row*AM.ch,AM.cw,AM.ch,cx,footY,1,3,flip);
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
function portrait(c,x,y,s){
  if(assetsReady<2) return;
  const z=s||1;
  c.save(); c.scale(z/SC,z/SC);
  c.drawImage(IMG_PT,0,0,ASSET_META.pw,ASSET_META.ph,
    Math.round(x*SC/z),Math.round(y*SC/z),ASSET_META.pw,ASSET_META.ph);
  c.restore();
}
