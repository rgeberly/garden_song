/* ================================================================
   WORLD
   ================================================================ */
/* ------------------------------------------------------------------
   The garden is a painted map. Everything below is expressed as a
   fraction of the map so the numbers survive a change of resolution.
   ------------------------------------------------------------------ */
const F=n=>Math.round(n*WORLD_W);

const POOL={x:F(.216),y:F(.789),w:F(.539),h:F(.141)};
const STALL={x:F(.145),y:F(.505)};                 /* where you shop from */
const STAND_AT={x:F(.121),y:F(.531)};              /* foot of the market stand picture, covering the painted table */
const HOUSE_DOOR={x:F(.735),y:F(.245)};
/* yard decorations once bought: fountain below the pool, lantern by the house's
   south-east corner, arch and bird bath on the lawn north of the stone rings */
const DECOR_SPOT={fountain:[F(.479),F(.983)],lantern:[F(.906),F(.286)],
                  arch:[F(.597),F(.344)],bath:[F(.736),F(.364)]};
/* their solid footprints: [dx,dy,radius] circles around the spot (the arch's two posts) */
const DECOR_SOLID={fountain:[[0,-4,24]],lantern:[[0,0,10]],arch:[[-38,0,7],[38,0,7]],bath:[[0,0,9]]};
const FROGS=[{x:F(.20),y:F(.76),k:0},{x:F(.78),y:F(.76),k:1},
             {x:F(.36),y:F(.95),k:2},{x:F(.62),y:F(.955),k:3}];

/* plots: nine rows in the tilled ground, eight in the raised bed,
   one tree in each stone ring */
const plots=[];
const GROUND_X=[.16,.25,.34], GROUND_Y=[.52,.60,.68];
GROUND_Y.forEach((gy,ri)=>GROUND_X.forEach((gx,ci)=>{
  if(ri===0&&ci===0) return;                        /* corner sits off the soil */
  plots.push({x:F(gx),y:F(gy),tree:false,raised:false,bed:0,
    sp:null,stage:0,growth:0,health:100, lock: ri===2?'bed5':null});
}));
const RAISED_X=[.585,.655,.725,.795], RAISED_Y=[.615,.675];
RAISED_Y.forEach((gy,ri)=>RAISED_X.forEach(gx=>{
  plots.push({x:F(gx),y:F(gy),tree:false,raised:true,bed:1,
    sp:null,stage:0,growth:0,health:100, lock: ri===1?'bed6':null});
}));
[[.6055,.473],[.7735,.473]].forEach((c,i)=>plots.push({
  x:F(c[0]),y:F(c[1]),tree:true,raised:false,bed:2+i,
  sp:null,stage:0,growth:0,health:100,lock:null}));

const STAGE_COST=110, MAX_GROWTH=STAGE_COST*3;
const active=p=>!p.lock||G.yard[p.lock];

/* ambient wildlife */
const WILD=[];
/* Creatures that drift across the garden, animated from assets/sprites/creatures.png
   (frames listed in CREATURE_ART, all facing right). Each kind: how often it shows up,
   how fast it flies (world px per ms), one wing-beat cycle in ms, and whether it
   swoops (bird) or flutters (butterfly). New kinds in the sheet join in automatically. */
const IMG_CREATURES=new Image(); IMG_CREATURES.src=ASSET_CREATURES;
const CREATURE_KIND={bluebird:{weight:1,speed:0.08,cycle:620,bird:true},
                     monarch:{weight:2,speed:0.033,cycle:900}};
const creatureKind=k=>CREATURE_KIND[k]||{weight:1,speed:0.04,cycle:800};
function spawnWild(){
  const kinds=Object.keys(typeof CREATURE_ART!=='undefined'?CREATURE_ART:{});
  let kind='monarch';
  if(kinds.length){ let r=Math.random()*kinds.reduce((a,k)=>a+creatureKind(k).weight,0);
    kind=kinds.find(k=>(r-=creatureKind(k).weight)<0)||kinds[0]; }
  const K=creatureKind(kind), fromLeft=Math.random()<0.5;
  WILD.push({kind,bird:!!K.bird,x:fromLeft?-20:WORLD_W+20,y:rnd(45,WORLD_H-60),
    vx:(fromLeft?1:-1)*K.speed,vy:rnd(-0.009,0.009),
    t:rnd(0,1000),amp:rnd(6,16),per:rnd(500,1100)});
}
function drawWild(c,w,cam){
  const x=w.x-cam.x, y=w.y+Math.sin(w.t/w.per)*w.amp-cam.y;
  /* a faint shadow on the ground below */
  c.globalAlpha=w.bird?.18:.1; c.fillStyle='#2b3a20';
  c.beginPath(); c.ellipse(x,w.y-cam.y+24,w.bird?8:5,w.bird?3:2,0,0,7); c.fill(); c.globalAlpha=1;
  const F=typeof CREATURE_ART!=='undefined'&&CREATURE_ART[w.kind];
  if(F&&IMG_CREATURES.complete&&IMG_CREATURES.naturalWidth){
    const [sx,sy,fw,fh]=F[Math.floor(w.t/(creatureKind(w.kind).cycle/F.length))%F.length];
    c.save(); c.translate(x,y); c.scale((w.vx<0?-1:1)/SC,1/SC); c.imageSmoothingEnabled=true;
    c.drawImage(IMG_CREATURES,sx,sy,fw,fh,-fw/2,-fh/2,fw,fh); c.restore(); return;
  }
  /* until the sheet loads: a dot */
  px(c,Math.round(x)-1,Math.round(y)-1,3,3,w.bird?'#4a7ad0':'#f08a2a');
}


/* the painted map replaces the old procedurally drawn one */
function buildWorld(){ /* nothing to build — the map is an image */ }
function drawMap(cam){
  const map=currentMap();                /* this season's painting */
  if(!map.complete) return;
  b.save(); b.scale(1/SC,1/SC); b.imageSmoothingEnabled=true;   /* drawn zoomed out */
  b.drawImage(map,Math.round(-cam.x*SC),Math.round(-cam.y*SC),WORLD_W*SC,WORLD_H*SC);
  b.restore();
}
const inPool=(x,y)=> x>POOL.x+F(.02)&&x<POOL.x+POOL.w-F(.02)&&
                     y>POOL.y+F(.02)&&y<POOL.y+POOL.h-F(.01);
function solidAt(x,y){
  if(x<8||y<8||x>WORLD_W-8||y>WORLD_H-8) return true;
  for(const id in DECOR_SOLID){ if(!G.yard[id]) continue;
    const [sx,sy]=DECOR_SPOT[id];
    for(const [dx,dy,r] of DECOR_SOLID[id]) if(Math.hypot(x-sx-dx,y-sy-dy)<r) return true; }
  if(!COL) return false;
  const C=MAP_META.cells;
  const cx=Math.floor(x/WORLD_W*C), cy=Math.floor(y/WORLD_H*C);
  if(cx<0||cy<0||cx>=C||cy>=C) return true;
  return COL[cy*C+cx]===1;
}
