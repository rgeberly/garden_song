/* ================================================================
   INSIDE THE HOUSE
   One room, painted at 512 x 768. Inside, G.player.x/y are her feet in
   painting px; the room fills the width of the view and scrolls up and
   down when the view is shorter than it. The clock stands still in here
   (G.indoors), she sleeps in the bed, and the doorway at the bottom
   leads back out to the garden.
   ================================================================ */
const HOUSE={w:512,h:768, door:{x:256,y:640}, wake:{x:280,y:262}, out:692};
const IMG_HOUSE=new Image(); let houseAsked=false;
function houseImg(){ if(!houseAsked){ houseAsked=true; IMG_HOUSE.src=ASSET_HOUSE; } return IMG_HOUSE; }
const houseK=()=>LW/HOUSE.w;                  /* logical px per painting px */
const HOUSE_KAIT=1.35;                        /* she's drawn this much larger inside, to suit the furniture */

/* where she can walk: the floorboards, minus the furniture (painting px, x0,y0,x1,y1) */
const HOUSE_FLOOR={x0:62,y0:196,x1:458,y1:662};
const HOUSE_BED=[132,100,258,300];
const HOUSE_SOLID=[
  [40,0,118,395],    /* shelves and desk along the left wall */
  [40,395,100,490],  /* potted plants under the window */
  [40,490,122,665],  /* writing desk and clutter */
  [95,598,165,665],  /* plants by the front wall */
  HOUSE_BED,
  [250,90,298,192],  /* nightstand */
  [298,40,452,238],  /* fireplace */
  [395,215,470,262], /* pots by the hearth */
  [362,245,470,458], /* counter and stove */
  [372,455,458,592], /* table and stool */
  [380,592,470,665], /* kettle and boxes on the green rug */
  [122,420,190,488], /* the big potted plant */
  [122,500,172,578], /* stool */
  [296,492,344,516], /* the music stand */
];
/* where the music stand stands (feet, painting px) */
const HOUSE_STAND={x:320,y:512};
/* the walls as a mask (maps/house_collision: black = blocked, for her feet), once loaded;
   until then the rectangles above */
let HOUSE_COL=null;
if(typeof HOUSE_MASK!=='undefined'&&HOUSE_MASK){ const im=new Image();
  im.onload=()=>{ const c=document.createElement('canvas'); c.width=HOUSE.w; c.height=HOUSE.h;
    const g=c.getContext('2d'); g.drawImage(im,0,0,HOUSE.w,HOUSE.h);
    const d=g.getImageData(0,0,HOUSE.w,HOUSE.h).data; HOUSE_COL=new Uint8Array(HOUSE.w*HOUSE.h);
    for(let i=0;i<HOUSE_COL.length;i++) HOUSE_COL[i]=d[i*4]>128?0:1; };
  im.src='assets/sprites/house_collision.png'; }
function houseSolid(x,y){
  if(HOUSE_COL){ const xi=x|0, yi=y|0;
    return xi<0||yi<0||xi>=HOUSE.w||yi>=HOUSE.h||HOUSE_COL[yi*HOUSE.w+xi]===1; }
  const F=HOUSE_FLOOR;
  if(x<F.x0||x>F.x1||y<F.y0) return true;
  if(y>F.y1&&Math.abs(x-HOUSE.door.x)>28) return true;     /* the front wall, but for the doorway */
  if(y>HOUSE.out) return true;                              /* she goes out with A, not by walking */
  /* her feet are about 26 painting px across */
  return HOUSE_SOLID.some(r=>x>r[0]-13&&x<r[2]+13&&y>r[1]-4&&y<r[3]+4);
}
function nearBed(){ const P=G.player, [x0,y0,x1,y1]=HOUSE_BED;
  return Math.hypot(P.x-clamp(P.x,x0,x1),P.y-clamp(P.y,y0,y1))<28; }
const nearHouseDoor=()=>G.player.y>604&&Math.abs(G.player.x-HOUSE.door.x)<44;

function enterHouse(){
  const P=G.player;
  G.indoors=true; G.swim=false; padVec={x:0,y:0};
  P.x=HOUSE.door.x; P.y=HOUSE.door.y; P.dir=0; P.moving=false; P.walkT=0;
  houseImg();
}
function leaveHouse(){
  const P=G.player, p=doorstep();
  G.indoors=false; P.x=p.x; P.y=p.y; P.dir=4; P.moving=false; P.walkT=0;
}
const nearStand=()=>Math.hypot(G.player.x-HOUSE_STAND.x,G.player.y-HOUSE_STAND.y-14)<46;
/* ---------- flute practice at the music stand ----------
   Once a day: the whole song, an hour of the day, and EXP worth about five fights
   with the pests about at her garden level, more the better she plays. */
/* The songs she can practice. Each one's recordings go in the art folder as
   rhythm/songs/practice_<file>_flute.wav and practice_<file>_backing.wav.
   xp: times the usual practice EXP · min: minutes of the day it takes ·
   cost: the price of its sheet music at Rosa's (0: she knows it from the start). */
const PRACTICE_SONGS=[
  {id:'croppies',name:"Grow Little Croppies",file:"Grow Little Croppies",xp:1,min:60,cost:0},
  {id:'lovelies',name:"Drink Up, Lovelies",file:"Drink Up, Lovelies",xp:0.4,min:20,cost:0},
  {id:'home',name:"Home Sweet Home",file:"Home Sweet Home",xp:1.5,min:90,cost:300},
];
const songKnown=s=>!s.cost||G.sheets.includes(s.id);
const knownSongs=()=>PRACTICE_SONGS.filter(songKnown);
function practiceXp(acc,song){
  const L=Object.values(PESTS).filter(P=>!P.boss&&P.min<=G.gardenLv), avg=L.reduce((a,P)=>a+P.xp,0)/L.length;
  return Math.round(5*avg*(0.3+acc*0.9)*((song&&song.xp)||1));
}
/* Song test: open the game with ?songtest on the end of its address, and the music stand
   lists every recorded song (SONG_DATA) to play any number of times, for no EXP or time.
   Autoplay hits every note, to hear how the notes line up with the recording. */
const SONG_TEST=/[?&]songtest\b/.test(location.search);
let songAuto=false;
function songTitle(key){
  if(key.startsWith('practice_')) return key.slice(9);
  if(SPECIES[key]) return SPECIES[key].name+" (crop)";
  const id=Object.keys(BATTLE_SONG).find(k=>BATTLE_SONG[k]===key), mv=id&&MOVES.find(m=>m.id===id);
  const f=FIELD.find(f=>f.id===key);
  return mv?mv.name+" (battle)":f?f.name+" (field)":key;
}
function testSong(key){
  startRhythm(null,{practice:true,test:true,notes:0,name:songTitle(key),mp:0,song:key,
    cb:acc=>{ G.scene='world'; say(songTitle(key)+": "+Math.round(acc*100)+"%"); }});
}
/* the music stand opens a list of the songs she knows (askStand, in the bed's window) */
function startPractice(song){
  if(G.daily.practice===G.day){ say("You've already practiced today. Your fingers need a rest!"); return; }
  const min=song.min||60;
  startRhythm(null,{practice:true,notes:0,name:song.name,mp:0,song:'practice_'+song.file,cb:(acc)=>{
    G.daily.practice=G.day; G.scene='world';
    const xp=practiceXp(acc,song); addXp(xp); passTime(min);
    say(song.name+" ("+Math.round(acc*100)+"%): "+xpEach(xp)+"!"); autoSave(); }});
}
/* a little wooden music stand with a page of music on it */
function drawStand(x,y,k){
  const s=k*2.4;
  /* its picture (shop items/Music Stand), when there is one */
  if(typeof SHOP_ART!=='undefined'&&SHOP_ART['music stand']){
    /* a soft shadow on the floor under its legs (indoors, like hers: no sun to cast one) */
    b.save(); b.translate(x,y); b.scale(1,0.32);
    const g=b.createRadialGradient(0,0,0,0,0,15*s); g.addColorStop(0,'rgba(20,12,4,.42)'); g.addColorStop(0.6,'rgba(20,12,4,.22)'); g.addColorStop(1,'rgba(20,12,4,0)');
    b.fillStyle=g; b.beginPath(); b.arc(0,0,15*s,0,7); b.fill(); b.restore();
    if(drawShopPic('music stand',x,y-18*s,28*s,38*s)) return; }
  b.fillStyle='rgba(20,12,4,.3)'; b.beginPath(); b.ellipse(x,y,9*s,3*s,0,0,7); b.fill();
  b.strokeStyle='#5a3a1e'; b.lineWidth=1.6*s;
  b.beginPath(); b.moveTo(x,y-20*s); b.lineTo(x,y); b.moveTo(x-7*s,y); b.lineTo(x,y-6*s); b.lineTo(x+7*s,y); b.stroke();
  b.fillStyle='#6b4524'; b.fillRect(x-11*s,y-33*s,22*s,14*s);
  b.fillStyle='#f6f0dc'; b.fillRect(x-9.5*s,y-32*s,19*s,11.5*s);
  b.fillStyle='#3a2a1a'; for(let i=0;i<4;i++) b.fillRect(x-8.5*s,y-30*s+i*2.6*s,17*s,0.4*s);
  b.beginPath(); b.arc(x-4*s,y-27*s,0.9*s,0,7); b.arc(x+2*s,y-25*s,0.9*s,0,7); b.arc(x+5*s,y-28*s,0.9*s,0,7); b.fill();
}
function houseInteract(){
  if(nearBling()){ talkBling(); return; }
  if(nearStand()){ askStand(); return; }
  if(nearBed()){ askSleep(); return; }
  if(nearHouseDoor()){ travel(leaveHouse); return; }
  say("Home sweet home.");
}
function updateHouse(dt){
  /* outside's pace on screen, stretched with her size so her feet don't slide */
  walk(dt,WALK_SPEED*WORLD_ZOOM*HOUSE_KAIT/houseK(),houseSolid);
  if(G.msgT>0) G.msgT-=dt;
}
/* the slice of the painting in view: top is the gap above it when the view is taller */
function houseCam(){
  const k=houseK(), vh=VIEW_H/k;
  return {y:clamp(G.player.y-vh/2-10,0,Math.max(0,HOUSE.h-vh)), top:Math.max(0,(VIEW_H-HOUSE.h*k)/2)};
}
function drawHouse(){
  const k=houseK(), cam=houseCam(), P=G.player, im=houseImg();
  b.save(); b.beginPath(); b.rect(0,0,LW,VIEW_H); b.clip();
  px(b,0,0,LW,VIEW_H,'#0f1a14');
  if(im.complete&&im.naturalWidth){ b.imageSmoothingEnabled=true;
    b.drawImage(im,0,cam.top-cam.y*k,LW,HOUSE.h*k); }
  const sx=P.x*k, sy=cam.top+(P.y-cam.y)*k;              /* her feet on screen */
  const kait=()=>{ b.save();
    b.translate(sx,sy); b.scale(HOUSE_KAIT,HOUSE_KAIT); b.translate(-sx,-sy);   /* larger, around her feet */
    b.imageSmoothingEnabled=true;
    drawKaitlynShadow(b,sx,sy,P.dir,P.animT||0,P.moving,true);
    drawKaitlyn(b,sx,sy,P.dir,P.animT||0,false,P.moving);
    b.restore(); };
  /* Bling, when she's in (recovering on the rug, or asleep by the bed), in front or behind */
  /* the music stand, Bling when she's in, and Kaitlyn, back to front */
  const ents=[{y:P.y,f:kait},{y:HOUSE_STAND.y,f:()=>drawStand(HOUSE_STAND.x*k,cam.top+(HOUSE_STAND.y-cam.y)*k,k)}];
  const bl=blingHere();
  if(bl&&bl.inside) ents.push({y:bl.y,f:()=>drawBlingMap(b,bl.x*k,cam.top+(bl.y-cam.y)*k,BLING_W*HOUSE_KAIT,bl.mood,false,false)});
  ents.sort((a,z)=>a.y-z.y).forEach(e=>e.f());
  const fr=frontImg('house'); if(fr) b.drawImage(fr,0,cam.top-cam.y*k,LW,HOUSE.h*k);   /* what she walks behind */
  b.restore();
  drawClockBack(); drawBuffsBack();
  blit();
  drawClockText(); drawBuffsText();
  const label=nearBling(PROMPT_REACH)?blingLabel():nearStand()?(G.daily.practice===G.day?"Practiced today":"Practice flute")
    :nearBed()?"Sleep":nearHouseDoor()?"Go outside":null;
  if(label&&G.scene==='world') drawPrompt(label,sx,sy-74*HOUSE_KAIT);
  drawHUD();
}
