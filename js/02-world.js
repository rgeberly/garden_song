/* ================================================================
   WORLD
   ================================================================ */
/* ------------------------------------------------------------------
   The garden is a painted map. Everything below is expressed as a
   fraction of the map so the numbers survive a change of resolution.
   ------------------------------------------------------------------ */
const F=n=>Math.round(n*WORLD_W);

const POOL={x:F(.216),y:F(.789),w:F(.539),h:F(.141)};
const STALL={x:F(.145),y:F(.505)};                 /* under the open shed */
const HOUSE_DOOR={x:F(.735),y:F(.245)};
const DECOR_SPOT={fountain:[F(.46),F(.40)],lantern:[F(.155),F(.60)],
                  arch:[F(.88),F(.62)],bath:[F(.50),F(.29)]};
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
const BFLY=['#f7e08a','#e8a0c0','#a8d8f0','#f7f3d8','#e8c34a'];
function spawnWild(){
  const bird=Math.random()<0.34, fromLeft=Math.random()<0.5;
  WILD.push({bird,x:fromLeft?-20:WORLD_W+20,y:rnd(45,WORLD_H-60),
    vx:(fromLeft?1:-1)*(bird?0.08:0.033),vy:rnd(-0.009,0.009),
    t:0,col:BFLY[ri(0,BFLY.length-1)],amp:rnd(6,16),per:rnd(500,1100)});
}
function drawWild(c,w,cam){
  const x=Math.round(w.x-cam.x), y=Math.round(w.y+Math.sin(w.t/w.per)*w.amp-cam.y);
  if(w.bird){
    const f=Math.floor(w.t/110)%2;
    c.globalAlpha=.18; c.fillStyle='#2b3a20';
    c.beginPath(); c.ellipse(x,Math.round(w.y-cam.y)+24,8,3,0,0,7); c.fill(); c.globalAlpha=1;
    px(c,x-2,y,6,5,'#4a5a6e'); px(c,x+4,y,3,3,'#5a6a80'); px(c,x+6,y+2,2,2,'#f0c44a');
    px(c,x,y-2,2,2,'#26303c');
    if(f){ px(c,x-6,y-3,6,2,'#5a6a80'); px(c,x+2,y-3,6,2,'#5a6a80'); }
    else { px(c,x-6,y+3,6,2,'#42505f'); px(c,x+2,y+3,6,2,'#42505f'); }
  } else {
    const f=Math.floor(w.t/90)%2;
    px(c,x,y,2,3,'#3a2a1a');
    if(f){ px(c,x-5,y-2,5,5,w.col); px(c,x+2,y-2,5,5,w.col);
           px(c,x-5,y-2,3,3,'#ffffff'); px(c,x+4,y-2,3,3,'#ffffff'); }
    else { px(c,x-3,y,3,3,w.col); px(c,x+2,y,3,3,w.col); }
  }
}


/* the painted map replaces the old procedurally drawn one */
function buildWorld(){ /* nothing to build — the map is an image */ }
function drawMap(cam){
  const map=currentMap();                /* this season's painting */
  if(!map.complete) return;
  b.save(); b.scale(1/SC,1/SC);
  b.drawImage(map,Math.round(-cam.x*SC),Math.round(-cam.y*SC),WORLD_W*SC,WORLD_H*SC);
  b.restore();
}
const inPool=(x,y)=> x>POOL.x+F(.02)&&x<POOL.x+POOL.w-F(.02)&&
                     y>POOL.y+F(.02)&&y<POOL.y+POOL.h-F(.01);
function solidAt(x,y){
  if(x<8||y<8||x>WORLD_W-8||y>WORLD_H-8) return true;
  if(!COL) return false;
  const C=MAP_META.cells;
  const cx=Math.floor(x/WORLD_W*C), cy=Math.floor(y/WORLD_H*C);
  if(cx<0||cy<0||cx>=C||cy>=C) return true;
  return COL[cy*C+cx]===1;
}
