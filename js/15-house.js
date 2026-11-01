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
];
function houseSolid(x,y){
  const F=HOUSE_FLOOR;
  if(x<F.x0||x>F.x1||y<F.y0) return true;
  if(y>F.y1&&Math.abs(x-HOUSE.door.x)>28) return true;     /* the front wall, but for the doorway */
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
  houseImg(); blip(330,0.06,0.1,'triangle');
}
function leaveHouse(){
  const P=G.player, p=doorstep();
  G.indoors=false; P.x=p.x; P.y=p.y; P.dir=4; P.moving=false; P.walkT=0;
  blip(260,0.06,0.1,'triangle');
}
function houseInteract(){
  if(nearBling()){ talkBling(); return; }
  if(nearBed()){ askSleep(); return; }
  if(nearHouseDoor()){ leaveHouse(); return; }
  say("Home sweet home.");
}
function updateHouse(dt){
  /* outside's pace on screen, stretched with her size so her feet don't slide */
  walk(dt,WALK_SPEED*WORLD_ZOOM*HOUSE_KAIT/houseK(),houseSolid);
  if(G.player.y>HOUSE.out){ leaveHouse(); return; }        /* out through the doorway */
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
  const bl=blingHere();
  if(bl&&bl.inside){
    const bling=()=>drawBlingMap(b,bl.x*k,cam.top+(bl.y-cam.y)*k,BLING_W*HOUSE_KAIT,bl.mood,false,false);
    if(bl.y<P.y){ bling(); kait(); } else { kait(); bling(); }
  } else kait();
  b.restore();
  drawClockBack(); drawBuffsBack();
  blit();
  drawClockText(); drawBuffsText();
  const label=nearBling(PROMPT_REACH)?blingLabel():nearBed()?"Sleep":nearHouseDoor()?"Go outside":null;
  if(label&&G.scene==='world') drawPrompt(label,sx,sy-74*HOUSE_KAIT);
  drawHUD();
}
