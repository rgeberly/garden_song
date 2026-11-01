/* ================================================================
   CONTENT
   ================================================================ */
const SPECIES={
  strawberry:{name:"Strawberry",kind:'bed',fruit:'#e8433f',dk:'#9c1f1f',cost:20,value:40, xp:8, notes:10},
  tomato    :{name:"Tomato",    kind:'bed',fruit:'#f0503a',dk:'#a4281c',cost:26,value:52, xp:10,notes:12},
  sunflower :{name:"Sunflower", kind:'bed',fruit:'#f0c44a',dk:'#a4801a',cost:30,value:60, xp:11,notes:12},
  blueberry :{name:"Blueberry", kind:'bed',fruit:'#5a70c4',dk:'#2b3a66',cost:24,value:48, xp:9, notes:11},
  lemongrass:{name:"Lemongrass",kind:'bed',fruit:'#9ed860',dk:'#5f9436',cost:16,value:32, xp:7, notes:9},
  squash    :{name:"Squash",    kind:'bed',fruit:'#f0a02a',dk:'#a4610f',cost:34,value:68, xp:12,notes:13},
  melon     :{name:"Heirloom Melon",kind:'raised',fruit:'#8ad86a',dk:'#3f7a33',cost:48,value:118,xp:20,notes:14},
  satsuma   :{name:"Satsuma",   kind:'tree',fruit:'#ffa83a',dk:'#c06a12',cost:70,value:145,xp:20,notes:15},
  muscadine :{name:"Muscadine", kind:'tree',fruit:'#7d4aa8',dk:'#42245c',cost:64,value:132,xp:18,notes:14},
  avocado   :{name:"Avocado",   kind:'tree',fruit:'#4a7a33',dk:'#26421b',cost:82,value:168,xp:22,notes:16},
};
const SPECIES_ORDER=Object.keys(SPECIES);
/* What eating a harvested crop does (from the Items menu). hp/mp restore; the rest
   are timed in real ms: speed = walk 25% faster, calm = pests come half as often,
   lure = pests come twice as often (more battles, more XP). */
const EAT={
  strawberry:{hp:8},                 blueberry:{mp:5},
  tomato:    {hp:6,mp:3},            sunflower:{speed:60000},
  lemongrass:{calm:120000},          squash:   {hp:15},
  melon:     {hp:20,mp:8},           satsuma:  {mp:10,speed:30000},
  muscadine: {lure:120000},          avocado:  {hp:30,mp:30},
};
function eatText(sp){
  const e=EAT[sp]||{}, L=[];
  if(e.hp) L.push("+"+e.hp+" HP");
  if(e.mp) L.push("+"+e.mp+" MP");
  if(e.speed) L.push("faster for "+Math.round(e.speed/1000)+"s");
  if(e.calm) L.push("fewer pests for "+Math.round(e.calm/60000)+" min");
  if(e.lure) L.push("more pests for "+Math.round(e.lure/60000)+" min");
  return L.join(", ")||"tasty";
}
/* sale price of one harvested crop at the stall */
const sellPrice=sp=>Math.round(SPECIES[sp].value*(G.yard.arch?1.15:1));
const PESTS={
  beetle :{name:"June Beetle",  hp:26, atk:4, xp:14, coin:5,  col:'#3f3478',dk:'#241d47',hl:'#6f63b8',min:1},
  wasp   :{name:"Paper Wasp",   hp:20, atk:6, xp:16, coin:6,  col:'#e8b02a',dk:'#6b4a10',hl:'#fff0a0',min:1},
  rat    :{name:"Garden Rat",   hp:34, atk:5, xp:20, coin:8,  col:'#8a8072',dk:'#4a443c',hl:'#c4bcae',min:2},
  crab   :{name:"Hermit Crab",  hp:44, atk:5, xp:26, coin:10, col:'#c46a3a',dk:'#7d3a18',hl:'#e8a06a',min:3},
  raccoon:{name:"Raccoon",      hp:56, atk:8, xp:36, coin:14, col:'#8a8f96',dk:'#3f454c',hl:'#c4c9d0',min:4},
  hoa    :{name:"HOA President",hp:130,atk:12,xp:120,coin:60, col:'#c9b48a',dk:'#6b5c3a',hl:'#f7f3e0',min:5,boss:true},
};
const GEAR=[
  {id:'boots',  name:"Sturdy Boots",   cost:240, desc:"walk 35% faster"},
  {id:'can',    name:"Watering Can",   cost:300, desc:"+25% song growth"},
  {id:'charm',  name:"Frog Charm",     cost:340, desc:"frogs heal 2x as often"},
  {id:'polish', name:"Flute Polish",   cost:420, desc:"+30% song damage"},
  {id:'trellis',name:"Trellis Kit",    cost:560, desc:"double harmony bonus"},
  {id:'cloth',  name:"Cleaning Cloth", cost:480, desc:"+8 max Music Points"},
  {id:'kickers',name:"Garden Boots",   cost:380, desc:"kick hits 60% harder"},
  {id:'basket', name:"Harvest Basket", cost:680, desc:"harvest every ripe plot at once"},
  {id:'apron',  name:"Seed Apron",     cost:600, desc:"planting fills the whole bed"},
  {id:'silver', name:"Silver Flute",   cost:800, desc:"+15% song growth & damage"},
  {id:'dizi',   name:"Mystic Dizi",    cost:1800, desc:"+35% song growth & damage"},
];
const YARD=[
  {id:'bed5',    name:"Till the Back Row", cost:680, desc:"+3 spots in the ground plot"},
  {id:'bed6',    name:"Second Bed Row",    cost:840, desc:"+4 spots in the raised bed"},
  {id:'fountain',name:"Frog Fountain",    cost:520, desc:"+0.2 harmony"},
  {id:'lantern', name:"Stone Lantern",    cost:360, desc:"pests arrive 40% slower"},
  {id:'arch',    name:"Flower Arch",      cost:440, desc:"+15% harvest coins"},
  {id:'bath',    name:"Bird Bath",        cost:400, desc:"+10% song growth"},
];
const KICK_SHOUTS=["Hiya!","Take that!","May my boot aim true!","Not in MY garden!",
  "Shoo!","Out you go!","Mind the tomatoes!","Bastard!","I'll kill you!","You coward!",
  "Eat dirt!","That's for the melons!"];
/* one new song every two levels */
const MOVES=[
  {id:'kick',  name:"Quick Kick",      lv:1, mp:0,  notes:0,  pow:0.55, heal:0, fx:'kick'},
  {id:'sprout',name:"Sprout Strike",   lv:1, mp:3,  notes:4,  pow:1.0,  heal:0, fx:'sprout'},
  {id:'lull',  name:"Frog Lullaby",    lv:3, mp:4,  notes:4,  pow:0,    heal:16,fx:'lull'},
  {id:'waltz', name:"Bramble Waltz",   lv:5, mp:6,  notes:6,  pow:1.7,  heal:0, fx:'waltz'},
  {id:'req',   name:"Wasp Requiem",    lv:7, mp:7,  notes:6,  pow:1.3,  heal:0, fx:'req', weaken:true},
  {id:'thorn', name:"Thorn Nocturne",  lv:9, mp:9,  notes:8,  pow:2.5,  heal:0, fx:'thorn'},
  {id:'hymn',  name:"Harvest Hymn",    lv:11,mp:12, notes:10, pow:3.2,  heal:12,fx:'hymn'},
];
const FIELD=[
  {id:'reprise',name:"Growth Reprise",lv:4, mp:6, desc:"+150 growth to every plant"},
  {id:'ward',   name:"Pest Ward",     lv:6, mp:8, desc:"drives every pest away"},
  {id:'shower', name:"Sun Shower",    lv:8, mp:7, desc:"restores plant health"},
];

/* ---------------- small sprites ---------------- */
function blitS(c,S,M,x,y,s){
  s=s||1;
  for(let yy=0;yy<S.length;yy++)for(let xx=0;xx<S[yy].length;xx++){
    const col=M[S[yy][xx]]; if(col) px(c,x+xx*s,y+yy*s,s,s,col); } }
/* four hand-drawn frogs; the toad is the fourth */
function drawFrog(c,x,y,t,idx){
  if(assetsReady<7) return;
  const i=((idx|0)%FROG_META.n+FROG_META.n)%FROG_META.n;
  const hop=Math.sin(t/500+i)>0.94?-3:0;
  drawDev(c,IMG_FROG,i*FROG_META.cw,0,FROG_META.cw,FROG_META.ch,
    x+11,y+24+hop,1,2);
}
const S_HOA=[
"......OOOOOOOO......",".....OvvvvvvvvO.....",".....OhhhhhhhhO.....",".....OFFFFFFFFO.....",
".....OFssssssFO.....",".....OFssssssFO.....",".....OFFFFFFFFO.....",".....OFFFmmFFFO.....",
".....OOFFFFFFOO.....","...OPPPPPPPPPPPPO...","...OPPPPPPPPPPPPO...","...OPPCCCCCCCCPPO...",
"...OPPCttttttCPPO...","...OPPCttttttCPPO...","...OPPCCCCCCCCPPO...","...OPPPPPPPPPPPPO...",
"....OKKKKKKKKKKO....","....OKKKKKKKKKKO....",".....OKKKOOKKKO.....",".....OFFFOOFFFO.....",
".....OFFFOOFFFO.....",".....OWWWOOWWWO.....",".....OWWWOOWWWO.....","....OWWWWOOWWWWO....",
"....OOOOO..OOOOO...."];
const M_HOA={O:'#2b1c12',v:'#2f6fc4',h:'#6b4a2a',F:'#f2cd9e',s:'#1a1410',
  m:'#a04a3a',P:'#e8e2be',C:'#8a6d45',t:'#f7f3e0',K:'#c9b48a',W:'#f0f0f0'};
function drawPestWorld(c,sp,x,y,t){
  if(sp==='hoa'){ blitS(c,S_HOA,M_HOA,x-20,y-48,2); return; }
  if(!drawEnemyArt(c,sp,x,y,1)){ px(c,x-6,y-8,12,8,PESTS[sp].col); }
}

/* ---------------- cached plant rendering ---------------- */
const plantCache={};
function plantArt(sp,stage,tree){
  const key=sp+'|'+stage+'|'+(tree?'t':'b');
  if(plantCache[key]) return plantCache[key];
  const S=SPECIES[sp];
  let r,W,H,cx,cy;
  if(stage===0){ W=12;H=14;cx=6;cy=10; }
  else {
    r=tree?(stage===1?10:stage===2?15:20):(stage===1?5:stage===2?8:9);
    W=(r+3)*2; H=(r+3)*2+(tree?16:0); cx=W/2; cy=r+3;
  }
  const cvv=document.createElement('canvas'); cvv.width=W; cvv.height=H;
  const g=cvv.getContext('2d');
  if(stage===0){
    px(g,cx,cy-2,2,6,'#4a7d2e'); px(g,cx-4,cy-4,4,2,'#6fae4e'); px(g,cx+2,cy-6,4,2,'#6fae4e');
    px(g,cx-1,cy-1,1,1,'#8fce68');
  } else {
    if(tree){ px(g,cx-3,cy+r-4,7,15,'#2b1e12'); px(g,cx-2,cy+r-4,5,14,'#6b4a2a');
              px(g,cx-2,cy+r-4,2,14,'#8a6236'); }
    for(let y=-r-2;y<=r+2;y++)for(let x=-r-2;x<=r+2;x++){
      const d=x*x+y*y; if(d>(r+2)*(r+2))continue;
      if(d>r*r){ px(g,cx+x,cy+y,1,1,'#1c2a14'); continue; }
      let col=((x*2+y)%5===0)?'#4f9442':'#3a7132';
      if(d>(r-2)*(r-2)) col='#2b5527';
      if(x<-r*0.35&&y<-r*0.35) col='#6cb452';
      if((x*3-y)%7===0) col='#5aa347';
      px(g,cx+x,cy+y,1,1,col);
    }
    if(stage>=3){
      const n=tree?9:5;
      for(let i=0;i<n;i++){ const a=i*1.7,d=r*0.55;
        const fx=cx+Math.round(Math.cos(a)*d), fy=cy+Math.round(Math.sin(a)*d);
        px(g,fx-1,fy-1,4,4,S.dk); px(g,fx,fy,3,3,S.fruit); px(g,fx,fy,1,1,'#ffffff'); }
    }
  }
  return plantCache[key]={cv:cvv,ox:cx,oy:cy};
}
/* ---------------- painted crops, soil and stand (assets/sprites/crops.png) ----------------
   Stage 0 is the shared sprout, 1 a smaller baby, 2 the baby, 3 mature (fruit trees are
   built larger). Crops without pictures yet fall back to the drawn ones above. */
const IMG_CROPS=new Image(); IMG_CROPS.src=ASSET_CROPS;
const CROP_STAGE=['sprout','baby','baby','mature'], CROP_STAGE_SCALE=[1,0.8,1,1];
const cropsReady=()=>IMG_CROPS.complete&&IMG_CROPS.naturalWidth>0;
/* draw a crops.png picture standing on logical point x,y at scale s */
function drawCropArt(c,key,x,y,s){
  const a=CROP_ART[key]; if(!a||!cropsReady()) return false;
  const [sx,sy,w,h]=a.r, k=s||1;
  c.save(); c.scale(1/SC,1/SC); c.imageSmoothingEnabled=true;
  c.drawImage(IMG_CROPS,sx,sy,w,h,Math.round(x*SC-a.ax*k),Math.round(y*SC-a.ay*k),Math.round(w*k),Math.round(h*k));
  c.restore(); return true;
}
function drawPlant(c,x,y,sp,stage,tree){
  const key=stage===0?'sprout':CROP_STAGE[stage]+' '+SPECIES[sp].name.toLowerCase();
  if(drawCropArt(c,key,x,y,CROP_STAGE_SCALE[stage])) return;
  const a=plantArt(sp,stage,tree);
  c.drawImage(a.cv,Math.round(x-a.ox),Math.round(y-a.oy));
}
/* what is left when pests eat a plant's health to zero; cleared with A/J */
function drawRuined(c,x,y,tree){
  if(drawCropArt(c,'damaged',x,y,tree?1.2:1)) return;
  px(c,x-1,y-12,2,12,'#6b5a3a'); px(c,x-6,y-8,5,2,'#8a6a3a'); px(c,x+1,y-10,5,2,'#8a6a3a');
}
/* a small picture of a crop or seed packet fitted into a box centred on cx,cy */
function drawCropIcon(c,sp,cx,cy,box){
  const a=CROP_ART['mature '+SPECIES[sp].name.toLowerCase()];
  if(a&&cropsReady()){ const [sx,sy,w,h]=a.r, s=Math.min(box*SC/w,box*SC/h);
    c.save(); c.scale(1/SC,1/SC); c.imageSmoothingEnabled=true;
    c.drawImage(IMG_CROPS,sx,sy,w,h,Math.round(cx*SC-w*s/2),Math.round(cy*SC-h*s/2),w*s,h*s);
    c.restore(); return; }
  const S=SPECIES[sp]; px(c,cx-5,cy-5,10,10,S.fruit); px(c,cx-5,cy-5,5,5,S.dk);
}
/* a mound of soil for a garden spot (the plant stands in its middle) */
function drawSoil(c,x,y){
  if(drawCropArt(c,'soil',x,y+4,0.85)) return;
  c.globalAlpha=.55;
  px(c,x-7,y-4,14,9,'#3a2716'); px(c,x-5,y-2,10,5,'#7a5330');
  c.globalAlpha=1;
  px(c,x-5,y-2,10,1,'#9c6c44');
}
function drawMeter(c,cx,cy,pct,ready){
  const w=26;
  px(c,cx-w/2-2,cy-2,w+4,8,'#241a12'); px(c,cx-w/2,cy,w,4,'#5a4a34');
  if(ready) px(c,cx-w/2,cy,w,4,Math.floor(Date.now()/300)%2?'#ffe08a':'#f0c44a');
  else { px(c,cx-w/2,cy,Math.round(w*clamp(pct,0,1)),4,'#7bc44a');
         px(c,cx-w/2,cy,Math.round(w*clamp(pct,0,1)),2,'#a8e070'); }
}
function drawStall(c,x,y){
  px(c,x-24,y-36,48,6,'#2b1c12');
  for(let i=0;i<8;i++) px(c,x-23+i*6,y-35,6,4,i%2?'#e8e2be':'#c9564a');
  px(c,x-21,y-30,42,21,'#a8865a'); px(c,x-21,y-30,42,2,'#c2a072');
  px(c,x-21,y-11,42,5,'#7d6238');
  px(c,x-23,y-9,5,15,'#6b4a2a'); px(c,x+18,y-9,5,15,'#6b4a2a');
  px(c,x-15,y-26,6,6,'#e8433f'); px(c,x-5,y-26,6,6,'#f0c44a'); px(c,x+6,y-26,6,6,'#5a70c4');
}
function drawDecor(c,id,x,y,t){
  if(drawCropArt(c,'decor '+id,x,y)) return;          /* painted, from the shop picture */
  if(id==='fountain'){ px(c,x-14,y-6,28,12,'#9aa6ac'); px(c,x-11,y-3,22,6,'#57b6d6');
    px(c,x-3,y-18,6,13,'#8f9aa0'); px(c,x-2,y-24+Math.sin(t/300)*3,3,6,'#8fd8ee');
    drawFrog(c,x-11,y-38,t,1); }
  else if(id==='lantern'){ px(c,x-8,y-3,16,6,'#8f9aa0'); px(c,x-5,y-15,10,12,'#a8b0b4');
    px(c,x-3,y-12,6,6,Math.floor(t/500)%2?'#ffe8a0':'#f0c44a'); px(c,x-11,y-20,22,5,'#8f9aa0'); }
  else if(id==='arch'){ px(c,x-21,y-33,5,33,'#8a6d45'); px(c,x+17,y-33,5,33,'#8a6d45');
    px(c,x-21,y-36,43,5,'#8a6d45');
    for(let i=0;i<14;i++) px(c,x-20+i*3,y-40+((i%3)*2),4,4,i%2?'#e88ab0':'#f0c44a'); }
  else if(id==='bath'){ px(c,x-11,y-5,22,8,'#c9d4d8'); px(c,x-8,y-3,16,5,'#57b6d6');
    px(c,x-3,y-14,6,10,'#a8b0b4'); px(c,x-9,y-17,18,5,'#c9d4d8'); }
}
