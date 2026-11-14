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
                  arch:[F(.475),F(.322)],bath:[F(.736),F(.364)]};   /* the arch frames the gap between the two bushes */
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

/* Growth a plant needs to fill its bar (SPECIES grow, less in its best season); the
   bar's thirds are its stages. */
const BEST_SEASON=0.7, SONG_GROWTH=130;      /* about what a good song gives, for estimates */
const growNeed=(sp,s)=>Math.round(SPECIES[sp].grow*(SPECIES[sp].best===(s||season())?BEST_SEASON:1));
const plantNeed=p=>growNeed(p.sp);
/* Set a plant's growth and work out its stage. A full bar ripens (stage 3, ready to
   harvest) only from the day after it filled; until then it stays at stage 2. A full
   plant stays full when the season (and so what it needs) changes. */
function setGrowth(p,g){
  const need=plantNeed(p), full=g>=need||(p.fullDay&&g>=p.growth);
  p.growth=full?need:clamp(g,0,need);
  if(full){ if(!p.fullDay) p.fullDay=G.day; } else p.fullDay=0;
  p.stage=full&&G.day>p.fullDay?3:Math.min(2,Math.floor(p.growth/(need/3)));
}
/* a new morning: bars that filled yesterday are ripe now */
function ripenPlants(){ plots.forEach(p=>{ if(p.sp) setGrowth(p,p.growth); }); }
const active=p=>!p.lock||G.yard[p.lock];
/* which part of the garden a plot is in: the ground plots, the raised beds, or the trees
   (the Harvest Basket and Seed Apron work across one part at a time) */
const plotArea=p=>p.tree?'trees':p.raised?'raised':'ground';

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
  /* a soft shadow on the ground below */
  groundShadow(c,null,x,w.y-cam.y+24,w.bird?10:6,24);
  const F=typeof CREATURE_ART!=='undefined'&&CREATURE_ART[w.kind];
  if(F&&IMG_CREATURES.complete&&IMG_CREATURES.naturalWidth){
    const [sx,sy,fw,fh]=F[Math.floor(w.t/(creatureKind(w.kind).cycle/F.length))%F.length];
    c.save(); c.translate(x,y); c.scale((w.vx<0?-1:1)/SC,1/SC); c.imageSmoothingEnabled=true;
    c.drawImage(IMG_CREATURES,sx,sy,fw,fh,-fw/2,-fh/2,fw,fh); c.restore(); return;
  }
  /* until the sheet loads: a dot */
  px(c,Math.round(x)-1,Math.round(y)-1,3,3,w.bird?'#4a7ad0':'#f08a2a');
}


/* A little music note bobbing over a plant that has had its song today
   (FX_ART['music note'] in creatures.png), just above the top of the plant. */
function plantHeight(p){
  const a=CROP_ART[p.stage===0?'sprout':CROP_STAGE[p.stage]+' '+SPECIES[p.sp].name.toLowerCase()];
  return a?a.ay*CROP_STAGE_SCALE[p.stage]/SC:14;
}
/* Front layers (maps/<season>_front, maps/house_front): transparent pictures of the parts of
   a map she walks behind, drawn over her; each loads the first time it's wanted. */
const FRONT_IMG={};
function frontImg(key){
  if(typeof FRONT_LAYERS==='undefined'||!FRONT_LAYERS.includes(key)) return null;
  if(!FRONT_IMG[key]){ FRONT_IMG[key]=new Image(); FRONT_IMG[key].src='assets/sprites/front_'+key+'.webp'; }
  return FRONT_IMG[key].complete&&FRONT_IMG[key].naturalWidth?FRONT_IMG[key]:null;
}
/* a soft golden glow that breathes behind a plant that has had its song today */
function drawSungGlow(c,p,x,y){
  const h=Math.max(14,plantHeight(p)), cy=y-h*0.45, r=h*0.62+8, a=0.32+Math.sin(G.t/520+p.x)*0.1;
  const g=c.createRadialGradient(x,cy,1,x,cy,r);
  g.addColorStop(0,'rgba(255,236,150,'+a+')'); g.addColorStop(0.6,'rgba(255,214,110,'+a*0.45+')');
  g.addColorStop(1,'rgba(255,214,110,0)');
  c.save(); c.globalCompositeOperation='lighter'; c.fillStyle=g;
  c.beginPath(); c.ellipse(x,cy,r*0.85,r,0,0,7); c.fill(); c.restore();
}
function drawSungNote(c,p,x,y){
  const F=typeof FX_ART!=='undefined'&&FX_ART['music note'];
  const top=y-plantHeight(p)-6+Math.sin(G.t/420+p.x)*2;
  if(F&&IMG_CREATURES.complete&&IMG_CREATURES.naturalWidth){
    const [sx,sy,fw,fh]=F[Math.floor(G.t/45)%F.length];
    c.save(); c.translate(x+6,top); c.scale(1/SC,1/SC); c.imageSmoothingEnabled=true;
    c.drawImage(IMG_CREATURES,sx,sy,fw,fh,-fw/2,-fh,fw,fh); c.restore(); return;
  }
  noteGlyph(c,Math.round(x+3),Math.round(top-14),'#2b1c12',1);
}

/* the painted map replaces the old procedurally drawn one */
function buildWorld(){ /* nothing to build — the map is an image */ }
function drawMap(cam){
  const map=currentMap();                /* this season's painting */
  if(!map||!map.complete) return;
  b.save(); b.scale(1/SC,1/SC); b.imageSmoothingEnabled=true;   /* drawn zoomed out */
  b.drawImage(map,Math.round(-cam.x*SC),Math.round(-cam.y*SC),WORLD_W*SC,WORLD_H*SC);
  b.restore();
}
const inPool=(x,y)=> x>POOL.x+F(.02)&&x<POOL.x+POOL.w-F(.02)&&
                     y>POOL.y+F(.02)&&y<POOL.y+POOL.h-F(.01);
/* Walk-through zones (maps/transitions, as assets/sprites/garden_zones.png on the walls'
   grid): 1 the path to town, 2 the trail to the mountain, 3 the house door. Walking into
   a path takes her there; the door still waits for A. */
let ZONES=null, ZONES_RAW=null; const DOOR_REACH=7;   /* ZONES_RAW: as painted (where she arrives) */     /* cells, 2 garden px each */
(function loadZones(){
  if(typeof GARDEN_ZONES==='undefined'||!GARDEN_ZONES) return;
  const im=new Image();
  im.onload=()=>{ const C=MAP_META.cells, cv=document.createElement('canvas'); cv.width=cv.height=C;
    const g=cv.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(im,0,0,C,C);
    const d=g.getImageData(0,0,C,C).data, Z=new Uint8Array(C*C);
    for(let i=0,j=0;i<Z.length;i++,j+=4){ const r=d[j], gr=d[j+1], bl=d[j+2];
      Z[i]=r>200&&gr<80?1:r>200&&gr>150?2:bl>200&&r<80?3:0; }
    /* the door reaches a little further up and to the right (DOOR_REACH cells), so the
       prompt stays while she walks right up to it */
    const Z0=Z.slice();
    for(let y=0;y<C;y++) for(let x=0;x<C;x++) if(Z0[y*C+x]===3)
      for(let d=1;d<=DOOR_REACH;d++) for(let e=0;e<=DOOR_REACH;e++){
        const xx=x+e, yy=y-d; if(xx<C&&yy>=0&&!Z[yy*C+xx]) Z[yy*C+xx]=3; }
    ZONES=Z; ZONES_RAW=Z0; };
  im.src='assets/sprites/garden_zones.png';
})();
function zoneAt(x,y){
  if(!ZONES) return 0;
  const C=MAP_META.cells, cx=Math.floor(x/WORLD_W*C), cy=Math.floor(y/WORLD_H*C);
  return cx<0||cy<0||cx>=C||cy>=C?0:ZONES[cy*C+cx];
}
/* the zone under her feet, or a little ahead of her while she's walking (the trail's zone
   is right at the map's edge, where she can't quite stand) */
function herZone(reach){
  const P=G.player, fx=P.x, fy=P.y+9, r=reach||24;
  return zoneAt(fx,fy)||(P.moving?zoneAt(fx+(P.aimX||0)*r,fy+(P.aimY||0)*r):0);
}
function solidAt(x,y){
  if(x<8||y<8||x>WORLD_W-8||y>WORLD_H-8) return true;
  for(const id in DECOR_SOLID){ if(!G.yard[id]) continue;
    const [sx,sy]=DECOR_SPOT[id];
    for(const [dx,dy,r] of DECOR_SOLID[id]) if(Math.hypot(x-sx-dx,y-sy-dy)<r) return true; }
  const M=GARDEN_COL[season()]||COL;           /* this season's walls (or the first ones) */
  if(!M) return false;
  const C=MAP_META.cells;
  const cx=Math.floor(x/WORLD_W*C), cy=Math.floor(y/WORLD_H*C);
  if(cx<0||cy<0||cx>=C||cy>=C) return true;
  return M[cy*C+cx]===1;
}
