/* ================================================================
   PLACES BEYOND THE GARDEN: the town and the mountain
   Each place is a 720x720 map in garden px, seen the same way as the garden
   (G.area names it; 'garden' is the garden). Until real paintings are made,
   each map is painted here in code from its data: ground, paths, buildings,
   water and trees, all listed in PLACES below so they're easy to move or
   rename. People stand where they're listed and say their lines; some keep a
   shop (TOWN_SHOPS). The mountain has things to gather that grow back every
   day and change with the season (GOODS), and a pond to fish in.
   ================================================================ */
/* goods: things gathered or caught (G.goods), sold at the market stand; eat: like EAT */
const GOODS={
  daisy:      {name:"Wild Daisy",       value:10, kind:'forage', season:'spring', col:'#f6f0d0', flavor:"A cheerful little flower. Loves me, loves me not."},
  violet:     {name:"Wood Violet",      value:14, kind:'forage', season:'spring', col:'#9a6ad8', flavor:"Shy, purple and sweet-smelling."},
  wildberry:  {name:"Wild Strawberries",value:16, kind:'forage', season:'spring', col:'#e8433f', eat:{hp:6}, flavor:"Tiny but mighty flavorful."},
  raspberry:  {name:"Wild Raspberries", value:18, kind:'forage', season:'summer', col:'#d8406a', eat:{hp:8}, flavor:"Thorny to pick, worth every scratch."},
  mint:       {name:"Mountain Mint",    value:12, kind:'forage', season:'summer', col:'#6ad88a', eat:{mp:4}, flavor:"Clears the head like a mountain breeze."},
  chanterelle:{name:"Chanterelle",      value:26, kind:'forage', season:'fall',   col:'#f0a83a', eat:{hp:10}, flavor:"The good orange mushroom Old Pete keeps talking about."},
  porcini:    {name:"Porcini",          value:32, kind:'forage', season:'fall',   col:'#8a5a2a', eat:{hp:12,mp:3}, flavor:"Plump, nutty and adored by chefs."},
  chestnut:   {name:"Chestnuts",        value:14, kind:'forage', season:'fall',   col:'#7a4a22', flavor:"Roasts beautifully on an open fire."},
  pinecone:   {name:"Pinecone",         value:8,  kind:'forage', season:'winter', col:'#8a6a3a', flavor:"Nature's little wooden ornament."},
  winterberry:{name:"Winterberries",    value:20, kind:'forage', season:'winter', col:'#d8203a', eat:{mp:6}, flavor:"Bright red cheer in the snow."},
  snowdrop:   {name:"Snowdrop",         value:24, kind:'forage', season:'winter', col:'#f4f8ff', flavor:"The first flower brave enough to face winter."},
  /* fish: power = how hard it fights; seasons it bites in (all if none); night: only after dark */
  minnow:     {name:"Minnow",           value:8,  kind:'fish', col:'#a8b8c8', power:0.5, w:5, flavor:"Small fry. Literally."},
  perch:      {name:"Yellow Perch",     value:22, kind:'fish', col:'#e8c84a', power:0.8, w:4, flavor:"Yellow, stripy and a little grumpy."},
  trout:      {name:"Rainbow Trout",    value:40, kind:'fish', col:'#e88aa8', power:1.1, w:3, seasons:['spring','summer'], flavor:"Shimmers like a rainbow, fights like a bulldog."},
  bass:       {name:"Largemouth Bass",  value:55, kind:'fish', col:'#5a8a4a', power:1.4, w:2, seasons:['summer','fall'], flavor:"Big mouth, bigger attitude."},
  catfish:    {name:"Catfish",          value:70, kind:'fish', col:'#6a6a5a', power:1.7, w:2, seasons:['summer','fall'], night:true, flavor:"Whiskers, mystery and midnight snacks."},
  shad:       {name:"Shad",             value:18, kind:'fish', col:'#b8c4cc', power:0.7, w:4, seasons:['spring'], flavor:"Runs upriver every spring, bony but brave."},
  mullet:     {name:"Mullet",           value:24, kind:'fish', col:'#8a96a0', power:0.9, w:3, seasons:['summer','fall'], flavor:"Business in the front, splashing in the back."},
  flounder:   {name:"Flounder",         value:45, kind:'fish', col:'#9a7a5a', power:1.0, w:2, seasons:['summer','fall'], flavor:"Flat as a pancake, with both eyes on one side. Rude to stare."},
  speckled:   {name:"Speckled Trout",   value:50, kind:'fish', col:'#9aa8b4', power:1.2, w:2, seasons:['spring','fall'], flavor:"Spotted all over, like it rolled in pepper."},
  salmon:     {name:"Salmon",           value:85, kind:'fish', col:'#d8786a', power:1.8, w:1, seasons:['fall'], flavor:"Swims a long way home every fall. Strong and stubborn."},
  croaker:    {name:"Croaker",          value:22, kind:'fish', col:'#c8b48a', power:0.8, w:3, seasons:['summer','fall'], flavor:"Grunts and croaks when you pull it in. Rude, but delicious."},
  crab:       {name:"Crab",             value:40, kind:'fish', col:'#5a7ab8', power:1.0, w:2, seasons:['summer','fall'], flavor:"Walks sideways, pinches forwards. Handle with care."},
  octopus:    {name:"Octopus",          value:75, kind:'fish', col:'#c86a8a', power:1.5, w:1, seasons:['spring','summer'], flavor:"Eight arms, three hearts, and zero intention of letting go."},
  tarpon:     {name:"Tarpon",           value:240,kind:'fish', col:'#d8e0e8', power:2.4, w:0.35, seasons:['summer'], flavor:"The silver king. Leaps like it's showing off, because it is."},
  dolphin:    {name:"Dolphin",          value:320,kind:'fish', col:'#8aa8c8', power:2.8, w:0.12, flavor:"...you're actually keeping this?"},
  /* drops: what beaten pests leave behind (PEST_DROPS), sold at the market like forage */
  dungball:    {name:"Dung Ball",        value:3,   kind:'drop', col:'#7a5a2a', flavor:"Lovingly hand-rolled. Please wash your hands."},
  irishell:    {name:"Iridescent Shell", value:40,  kind:'drop', col:'#5ad8b0', flavor:"Shimmers green, gold and purple in the light."},
  paperscrap:  {name:"Paper Scrap",      value:4,   kind:'drop', col:'#d8c8a0', flavor:"A tiny wall from a wasp's paper house."},
  royaljelly:  {name:"Royal Jelly",      value:45,  kind:'drop', col:'#f0e08a', flavor:"Fit for a queen. Sticky for everyone else."},
  button:      {name:"Shiny Button",     value:5,   kind:'drop', col:'#c8a050', flavor:"Somebody's coat is missing this."},
  lostring:    {name:"Lost Ring",        value:60,  kind:'drop', col:'#e8c84a', flavor:"A little gold ring. Someone in town might miss it."},
  bristle:     {name:"Bristle Tuft",     value:5,   kind:'drop', col:'#8fc43a', flavor:"Don't touch the pointy end. Or any end."},
  cocoon:      {name:"Silk Cocoon",      value:50,  kind:'drop', col:'#f4f0e0', flavor:"Soft as a cloud, light as a sigh."},
  gullfeather: {name:"Gull Feather",     value:5,   kind:'drop', col:'#e8eef4', flavor:"Smells faintly of the beach, and of chips."},
  stolenfry:   {name:"Stolen Fry",       value:42,  kind:'drop', col:'#f0c84a', flavor:"Its prized possession. Somehow still warm."},
  ecto:        {name:"Ectoplasm",        value:6,   kind:'drop', col:'#bfe8e0', flavor:"Cool, wobbly and very slightly haunted."},
  locket:      {name:"Ghostly Locket",   value:70,  kind:'drop', col:'#c8d0e8', flavor:"Inside: a faded picture of someone smiling."},
  shellshard:  {name:"Shell Shard",      value:6,   kind:'drop', col:'#d88a5a', flavor:"A piece of a borrowed home."},
  pearl:       {name:"Pearl",            value:80,  kind:'drop', col:'#f4f0f8', flavor:"Round, white and worth a pretty penny."},
  blackfeather:{name:"Black Feather",    value:6,   kind:'drop', col:'#2a3a5a', flavor:"Glossy, blue-black and a little smug."},
  spoon:       {name:"Shiny Spoon",      value:60,  kind:'drop', col:'#c8ccd8', flavor:"It's been polished to a mirror shine. By a crow."},
  trinket:     {name:"Trash Treasure",   value:8,   kind:'drop', col:'#8a8f96', flavor:"One raccoon's trash is another raccoon's treasure."},
  mask:        {name:"Bandit Mask",      value:75,  kind:'drop', col:'#3a3a3a', flavor:"Tiny. Stylish. Suspicious."},
  chewball:    {name:"Chewed Ball",      value:8,   kind:'drop', col:'#e8d84a', flavor:"Soggy, beloved and slightly flat."},
  collar:      {name:"Fancy Collar",     value:80,  kind:'drop', col:'#d84a6a', flavor:"A jewelled collar. Woo looks better without it anyway."},
  wisp:        {name:"Wisp",             value:10,  kind:'drop', col:'#8ac4f0', flavor:"A little blue flame that won't go out."},
  ribbon:      {name:"Prize Ribbon",     value:120, kind:'drop', col:'#e8c84a', flavor:"First prize, giant pumpkin division. So that's what it was about."},
  goathair:    {name:"Goat Hair",        value:8,   kind:'drop', col:'#d8d0c0', flavor:"Itchy, warm and very well travelled."},
  bell:        {name:"Mountain Bell",    value:85,  kind:'drop', col:'#c8a050', flavor:"Rings sweetly with every step."},
  tusk:        {name:"Tusk",             value:12,  kind:'drop', col:'#f0e8d0', flavor:"Curved, chipped and still a bit muddy."},
  truffle:     {name:"Truffle",          value:130, kind:'drop', col:'#5a4030', flavor:"The boar's favorite snack. Chefs pay a fortune for these."},
  bearfur:     {name:"Bear Fur",         value:15,  kind:'drop', col:'#2e2a2a', flavor:"A thick, warm tuft. Smells like the woods."},
  honeycomb:   {name:"Honeycomb",        value:150, kind:'drop', col:'#f0b030', flavor:"Dripping with wild honey. The bear won't miss it. Probably."},
  citation:    {name:"Citation",         value:2,   kind:'drop', col:'#f4f4f4', flavor:"For excessive gardening. Frame it."},
  gavel:       {name:"Gavel",            value:200, kind:'drop', col:'#8a5a2a', flavor:"The symbol of his power. It's very small."},
  koi:        {name:"Golden Koi",       value:180,kind:'fish', col:'#ffb02a', power:2.1, w:0.4, flavor:"A living treasure. Rumored to grant wishes (it doesn't)."},
  /* food and drink bought in town or at the stall: kept until used (not sold back).
     use: hp/mp for whoever has it, hpAll/mpAll for the whole party, coffee: ms of speed */
  coffee:     {name:"Coffee",           value:0,  kind:'food', col:'#6a3a1a', use:{coffee:120000}, flavor:"Liquid motivation."},
  tea:        {name:"Herbal Tea",       value:0,  kind:'food', col:'#8ac86a', use:{mpAll:10}, flavor:"Calming herbs, steeped with care."},
  bun:        {name:"Honey Bun",        value:0,  kind:'food', col:'#e8b04a', use:{hpAll:20}, flavor:"Sticky, sweet and a little bit glazed. Just like Mabel."},
  cider:      {name:"Mug of Cider",     value:0,  kind:'food', col:'#d8902a', use:{hpAll:15,mpAll:5}, flavor:"Hot spiced apple cider from the Tipsy Toad. Warms you right down to your boots."},
  toddy:      {name:"Hot Toddy",        value:0,  kind:'food', col:'#c86a2a', use:{mpAll:15}, flavor:"Honey, lemon and a little something. Gus swears it cures everything."},
};
const goodsList=()=>Object.keys(GOODS).filter(k=>G.goods[k]>0);
const sellGoods=()=>goodsList().filter(k=>GOODS[k].kind!=='food'&&GOODS[k].kind!=='quest');   /* quest things are kept */
const addGood=(k,n)=>{ G.goods[k]=(G.goods[k]||0)+(n||1); };
const goodsPrice=k=>Math.round(GOODS[k].value*(G.yard.arch?1.15:1));

/* ---------- the places ----------
   ground/path colours; rects [x,y,w,h]; houses {x,y,w,h,roof,name}; exits back home;
   people {name,x,y,col,hair,lines,shop}; gather spots [x,y]; pond {x,y,rx,ry}. */
const PLACES={
  /* the town follows its paintings (maps/town_<season>). Its walls are painted in the art
     folder's maps/town_collision (black = blocked; built into assets/sprites/
     town_collision.png); blocks [x,y,w,h] are only used until that has loaded */
  town:{name:"Willowbrook", ground:'#8fbf6a', path:'#d8c8a0',
    paths:[[180,280,360,260],[440,520,120,200]], plaza:{x:360,y:400,r:150}, fountain:{x:362,y:374,r:40},
    houses:[], trees:[],
    blocks:[[0,0,190,245],[175,0,170,190],[345,0,110,105],[495,30,160,200],[650,0,70,250],[610,255,95,65],
            [0,245,100,260],[585,470,135,150],[0,560,330,160],[0,500,60,60],[240,530,120,60],[370,630,110,90],
            [620,620,100,100],[660,330,60,140]],
    exits:[{x:612,y:712,r:42,to:'garden',label:"Back to the garden"}],          /* where the road leaves, bottom right */
    /* doors into the buildings (where she stands to go in, with A); hours: TOWN_HOURS */
    doors:[{x:156,y:226,to:'cafe'},{x:258,y:204,to:'music'},{x:525,y:230,to:'fishshop'},{x:420,y:108,to:'bar'}],
    arrive:{garden:{x:556,y:640,dir:0}, cafe:{x:156,y:232,dir:4}, music:{x:258,y:210,dir:4},
            fishshop:{x:525,y:236,dir:4}, bar:{x:420,y:116,dir:4}},
    /* at: when they're out here (TOWN_HOURS); the shopkeepers are inside their shops */
    people:[
      {name:"Juniper",x:596,y:338,col:'#e8a03a',hair:'#a85a2a',shop:'junk',at:'shop',
       lines:["Juniper's Junk Shop! I'll buy anything you forage, catch, or pry off a pest. And if you miss it, you can buy it back!"]},
      {name:"Old Pete",x:286,y:450,col:'#7a6a5a',hair:'#d8d8d8',at:'day',
       lines:["The mountain path is north of your garden, you know.","Mushrooms come up in the fall. The good ones are orange."]},
      {name:"Milo",x:452,y:478,col:'#5aa85a',hair:'#e8c84a',at:'kid',
       lines:["Have you seen a snake with a gold ring around its neck? That'd be so cool!"]},
    ]},
  /* Inside the town's buildings: placeholder rooms drawn in code until they have paintings
     (room: floor and wall colours, wall: how deep the back wall is, furn [x,y,w,h,colour,label]
     solid furniture). Each is entered from its door in town and left by the doorway at the
     bottom. */
  cafe:{name:"Mabel's Café", room:true, w:450, h:520, floor:'#b88a5a', wallCol:'#e8d0a8', wall:120,
    furn:[[60,192,190,34,'#8a5a3a',"counter"],[40,124,120,40,'#6a4a2a',"ovens"],[290,250,70,46,'#a86a3a',"table"],
          [320,370,70,46,'#a86a3a',"table"],[80,360,70,46,'#a86a3a',"table"],[300,124,110,30,'#c8a07a',"pastry case"]],
    exits:[{x:225,y:520,r:44,to:'town',label:"Back outside"}], arrive:{town:{x:225,y:452,dir:0}},
    people:[{name:"Mabel",x:150,y:180,col:'#c8584a',hair:'#e8e0d0',shop:'cafe',at:'shop',reach:58,
      lines:["Welcome to the café, dear! Something warm for the road?"]}]},
  music:{name:"Rosa's Music Shop", room:true, w:450, h:520, floor:'#8a5a4a', wallCol:'#d8c8e8', wall:120,
    furn:[[150,192,150,34,'#6a3a2a',"counter"],[20,130,40,260,'#5a3a2a',"sheet music"],[390,130,40,260,'#5a3a2a',"flutes & fiddles"],
          [300,300,80,56,'#2a2020',"piano"],[90,330,60,40,'#a87a3a',"drum"]],
    exits:[{x:225,y:520,r:44,to:'town',label:"Back outside"}], arrive:{town:{x:225,y:452,dir:0}},
    people:[{name:"Rosa",x:225,y:180,col:'#4a8ad8',hair:'#3a2418',shop:'music',at:'shop',reach:58,
      lines:["Welcome to the music shop! New sheet music comes in all the time."]}]},
  fishshop:{name:"Hollis Fishing Supply", room:true, w:450, h:520, floor:'#7a8a8a', wallCol:'#c8d8d8', wall:120,
    furn:[[230,192,170,34,'#5a4a3a',"counter"],[20,130,34,250,'#6a4a2a',"rod rack"],[60,124,140,34,'#4a6a8a',"tackle"],
          [280,320,120,56,'#3a6a8a',"bait tanks"],[70,340,70,50,'#8a6a4a',"crates"]],
    exits:[{x:225,y:520,r:44,to:'town',label:"Back outside"}], arrive:{town:{x:225,y:452,dir:0}},
    people:[{name:"Mr. Hollis",x:315,y:180,col:'#6a6a6a',hair:'#8a8a8a',shop:'fishing',at:'shop',reach:58,
      lines:["Rods, reels and good advice. The advice is free."]}]},
  /* the bar opens at 6 PM, when the shops close: some of the townsfolk come here */
  bar:{name:"The Tipsy Toad", room:true, w:450, h:520, floor:'#5a3a2a', wallCol:'#7a4a3a', wall:120,
    furn:[[50,192,350,34,'#3a2416',"bar"],[50,124,350,30,'#2a1a10',"bottles"],[70,330,70,46,'#6a4a2a',"table"],
          [310,330,70,46,'#6a4a2a',"table"]],
    exits:[{x:225,y:520,r:44,to:'town',label:"Back outside"}], arrive:{town:{x:225,y:470,dir:0}},
    people:[
      {name:"Gus",x:225,y:180,col:'#3a5a3a',hair:'#5a3a2a',shop:'bar',at:'night',reach:58,
       lines:["Welcome to the Tipsy Toad! Pull up a stool. What'll it be?"]},
      {name:"Old Pete",x:110,y:318,col:'#7a6a5a',hair:'#d8d8d8',at:'night',
       lines:["Did I ever tell you about the summer my tomatoes grew as big as pumpkins?","...No? Well, neither did they. But it's a good story."]},
      {name:"Mr. Hollis",x:350,y:318,col:'#6a6a6a',hair:'#8a8a8a',at:'night',
       lines:["Nothing like a quiet drink after a day of tangled line.","Caught a catfish this big once. ...Well, maybe this big."]},
      {name:"Rosa",x:290,y:350,col:'#4a8ad8',hair:'#3a2418',at:'night',
       lines:["Gus says he'll play the old piano tonight. He says that every night."]},
      {name:"Juniper",x:160,y:350,col:'#e8a03a',hair:'#a85a2a',at:'night',
       lines:["You wouldn't believe what people try to sell me. Today: one left boot.","Bought it, of course. Somebody out there has the right one."]},
    ]},
  /* Bramble Peak (maps/mountain_<season>): a trail winds up from the garden at the
     bottom to the rocky top, a meadow beside it and a stream down the right side to fish
     in. Its walls come from the painting (assets/sprites/mountain_collision.png); paths
     and trees only draw the stand-in until the painting loads. */
  mountain:{name:"Bramble Peak", ground:'#7aa85a', path:'#c8b48a', w:1080, h:1446,
    paths:[[400,1200,150,246],[360,900,140,320],[330,600,130,320],[380,300,130,320],[440,120,120,200]],
    pond:{x:900,y:1050,rx:75,ry:150}, trees:[],
    exits:[{x:478,y:1446,r:50,to:'garden',label:"Back to the garden"}],
    arrive:{garden:{x:478,y:1360,dir:0}},
    gather:[[382,838],[662,146],[802,1318],[846,618],[446,462],[726,962],[214,1138],[506,1182],[586,678],
            [714,406],[198,674],[450,234],[378,1034],[566,866],[806,1130],[750,778],[390,626],[666,1222]],
    people:[]},
};
/* Town hours (minutes of the day): shops are open from 8 AM to 6 PM, the bar from 6 PM.
   A person's at: 'shop' (while the shops are open), 'day' (until 6 PM), 'kid' (until 8 PM),
   'night' (from 6 PM); no at: always there. */
const TOWN_HOURS={open:8*60,close:18*60,kidHome:20*60};
const shopsOpen=()=>G.clock>=TOWN_HOURS.open&&G.clock<TOWN_HOURS.close;
const barOpen=()=>G.clock>=TOWN_HOURS.close;
const atNow=at=>!at||(at==='shop'?shopsOpen():at==='day'?G.clock<TOWN_HOURS.close:at==='kid'?G.clock<TOWN_HOURS.kidHome:at==='night'?barOpen():true);
/* who is in a place right now */
const placePeople=P=>(P.people||[]).filter(p=>atNow(p.at));
/* a building's door is open: the bar after 6 PM, the shops during the day */
const doorOpen=d=>d.to==='bar'?barOpen():shopsOpen();
const nearTownDoor=(f=1)=>(curPlace().doors||[]).find(d=>Math.hypot(G.player.x-d.x,G.player.y-d.y)<24*f);
/* how big Kaitlyn is drawn in each place, next to its painting (1 = as in the garden) */
const PLACE_KAIT={town:0.8, mountain:0.7};
const placeKait=()=>PLACE_KAIT[G.area]||1;
/* a place's size (the mountain is bigger than a garden screen) */
const placeW=P=>(P&&P.w)||WORLD_W, placeH=P=>(P&&P.h)||WORLD_H;
/* the size of wherever she is now, for the camera */
const areaSize=()=>{ const P=G.area!=='garden'&&PLACES[G.area]; return [placeW(P),placeH(P)]; };
/* Walls painted for a place (PLACE_COLS, from build_art.py): one cell per PLACE_GRID
   world px, true where it's blocked. A place without them uses its paths, trees, pond and
   houses. */
const PLACE_GRID=4, PLACE_COL={};
(function loadPlaceWalls(){
  if(typeof PLACE_COLS==='undefined') return;
  PLACE_COLS.forEach(area=>{ const im=new Image();
    im.onload=()=>{ const w=im.naturalWidth, h=im.naturalHeight, cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      const g=cv.getContext('2d'); g.drawImage(im,0,0); const d=g.getImageData(0,0,w,h).data, M=new Uint8Array(w*h);
      for(let i=0;i<M.length;i++) M[i]=d[i*4]<128?1:0;
      PLACE_COL[area]={w,h,M};
      /* a save from before the walls: don't leave her stuck in a tree */
      if(G.area===area&&placeSolid(G.player.x,G.player.y+9)){ const a=PLACES[area].arrive.garden; G.player.x=a.x; G.player.y=a.y; } };
    im.src='assets/sprites/'+area+'_collision.png'; });
})();
/* where each place's door back to the garden leaves you in the garden */
const GARDEN_ARRIVE={town:{x:100,y:104,dir:2}, mountain:{x:306,y:44,dir:4}};
/* A path out (a garden zone, a place's exit) takes her through once she has stepped off
   it: she arrives standing on one, and shouldn't bounce straight back. */
let exitArmed=false;
/* the garden's way out to each place (garden px), with its prompt */
const GARDEN_EXITS=[{x:214,y:96,r:22,to:'town',label:"Path to town"},{x:288,y:30,r:22,to:'mountain',label:"Trail to the mountain"}];

const curPlace=()=>PLACES[G.area];
function goTo(area){
  if(area!=='garden') placeImg(area);           /* start loading its painting during the fade */
  else seasonMap(season());
  if(area==='mountain'&&typeof fishImg==='function') fishImg();      /* and the pond, for fishing */
  travel(()=>{
    const from=G.area; G.area=area; G.swim=false;
    const a=area==='garden'?GARDEN_ARRIVE[from]:PLACES[area].arrive[from]||PLACES[area].arrive.garden;
    G.player.x=a.x; G.player.y=a.y; G.player.dir=a.dir; G.player.moving=false; exitArmed=false;
    if(area==='mountain') gatherToday();
  });
}
const nearGardenExit=(f=1)=>GARDEN_EXITS.find(e=>Math.hypot(G.player.x-e.x,G.player.y-e.y)<e.r*f);
/* is x,y blocked by a place's painted walls? */
function placeSolidIn(area,x,y){ const C=PLACE_COL[area]; if(!C) return false;
  const cx=Math.floor(x/PLACE_GRID), cy=Math.floor(y/PLACE_GRID);
  return cx<0||cy<0||cx>=C.w||cy>=C.h||C.M[cy*C.w+cx]===1; }
function placeSolid(x,y){
  const P=curPlace();
  if(x<16||y<20||x>placeW(P)-16||y>placeH(P)-14) return true;
  const C=PLACE_COL[G.area];
  if(C){ const cx=Math.floor(x/PLACE_GRID), cy=Math.floor(y/PLACE_GRID);
    if(cx<0||cy<0||cx>=C.w||cy>=C.h||C.M[cy*C.w+cx]===1) return true;
    return placePeople(P).some(p=>Math.hypot(x-p.x,y-p.y)<10); }      /* and the townsfolk */
  if(P.cliffs&&y<150) return true;
  if(P.room&&(y<P.wall+14||(P.furn||[]).some(([fx,fy,fw,fh])=>x>fx-8&&x<fx+fw+8&&y>fy-2&&y<fy+fh+8))) return true;
  if(P.fountain&&Math.hypot(x-P.fountain.x,y-P.fountain.y)<P.fountain.r+6) return true;
  if(P.pond&&(((x-P.pond.x)/(P.pond.rx))**2+((y-P.pond.y)/(P.pond.ry))**2<1)) return true;
  if((P.houses||[]).some(h=>x>h.x-6&&x<h.x+h.w+6&&y>h.y&&y<h.y+h.h+8)) return true;
  if((P.blocks||[]).some(([bx,by,bw,bh])=>x>bx&&x<bx+bw&&y>by&&y<by+bh)) return true;
  if((P.trees||[]).some(([tx,ty])=>Math.hypot(x-tx,y-ty)<16)) return true;
  return placePeople(P).some(p=>Math.hypot(x-p.x,y-p.y)<10);
}

/* ---------- pests on the mountain trail ----------
   The mountain's own (goat, boar, bear: once she's near their level) and a few garden
   ones roam the open ground and come at her when she's close. Never the HOA President. */
const MTN_MAX=4, MTN_ALSO=['crow','raccoon','seagull','wasp','rat'];
function mtnPool(){
  const lv=G.player.lv;
  return Object.keys(PESTS).filter(k=>{ const P=PESTS[k]; if(P.boss) return false;
    return P.where==='mountain'?P.lv<=lv+3:MTN_ALSO.includes(k)&&(!P.night||isNight()); });
}
function spawnMtnPest(){
  const P=G.player, pool=mtnPool(), M=curPlace(); if(!pool.length) return;
  for(let i=0;i<30;i++){ const x=rnd(40,placeW(M)-40), y=rnd(160,placeH(M)-60);
    if(placeSolid(x,y+9)||Math.hypot(x-P.x,y-P.y)<180) continue;
    const sp=pool[ri(0,pool.length-1)], lv=pestLevel(sp);
    G.mtnPests.push({species:sp,lv,x,y,hp:pestStats(sp,lv).hp,roam:null}); return; }
}
/* true when a fight starts */
function updateMountainPests(dt){
  const P=G.player;
  if(PLACE_COL.mountain&&(!G.daily.spots||G.daily.gatherDay!==G.day)) gatherToday();   /* a new day, or the walls just loaded */
  G.mtnT=(G.mtnT===undefined?3000:G.mtnT)-dt;
  if(G.mtnT<=0){ G.mtnT=rnd(9000,15000)/diff().spawn; if(G.mtnPests.length<MTN_MAX) spawnMtnPest(); }
  for(const p of G.mtnPests){
    const near=Math.hypot(p.x-P.x,p.y-(P.y+6));
    if(near<20){ startBattle(p); return true; }
    if(near<110) p.roam={x:P.x,y:P.y+6};                    /* it's seen her */
    else if(!p.roam||Math.hypot(p.roam.x-p.x,p.roam.y-p.y)<6||p.stuck>600){ p.stuck=0; p.roam=null;
      for(let i=0;i<10;i++){ const x=p.x+rnd(-120,120), y=p.y+rnd(-120,120); if(!placeSolid(x,y+9)){ p.roam={x,y}; break; } } }
    if(!p.roam) continue;
    const dx=p.roam.x-p.x, dy=p.roam.y-p.y, d=Math.hypot(dx,dy)||1, sp=(near<110?0.03:0.02)*dt;
    const nx=p.x+dx/d*sp, ny=p.y+dy/d*sp;
    if(placeSolid(nx,ny+9)) p.stuck=(p.stuck||0)+dt; else { p.x=nx; p.y=ny; p.face=dx>0; }
  }
  return false;
}
/* ---------- gathering on the mountain: today's spots and what grows there ---------- */
/* Each day the things to gather turn up in new places: GATHER_N spots picked at random
   on open ground (once the mountain's walls have loaded; its fixed spots until then). */
const GATHER_N=18;
function gatherToday(){
  if(G.daily.gatherDay===G.day&&G.daily.spots) return;
  if(G.daily.gatherDay!==G.day) G.daily.picked=[];
  G.daily.gatherDay=G.day; G.daily.spots=null;
  const M=PLACES.mountain; if(!PLACE_COL.mountain) return;
  let s=G.day*48271+7; const rr=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
  const L=[];
  for(let i=0;i<4000&&L.length<GATHER_N;i++){ const x=Math.round(30+rr()*(placeW(M)-60)), y=Math.round(150+rr()*(placeH(M)-200));
    const open=!placeSolidIn('mountain',x,y)&&!placeSolidIn('mountain',x-10,y)&&!placeSolidIn('mountain',x+10,y)&&!placeSolidIn('mountain',x,y-10);
    if(open&&L.every(([a,b])=>Math.hypot(a-x,b-y)>70)) L.push([x,y]); }
  G.daily.spots=L;
}
/* today's gathering spots where she is */
const gatherSpots=()=>G.area==='mountain'&&G.daily.spots&&G.daily.gatherDay===G.day?G.daily.spots:(curPlace().gather||null);
/* what grows at spot i today (the same all day), or null if it's been picked */
function gatherAt(i){
  if((G.daily.picked||[]).includes(i)) return null;
  const opts=Object.keys(GOODS).filter(k=>GOODS[k].kind==='forage'&&GOODS[k].season===season());
  let s=(G.day*7919+i*104729)%2147483647; s=(s*16807)%2147483647;
  const q=tinyGather(s); if(q) return q;        /* twigs and pinestraw for Tiny One's nest */
  if(s%5===0) return null;                    /* not every spot has something every day */
  return opts[s%opts.length];
}
function nearGather(f=1){
  const S=gatherSpots(); if(!S) return -1;
  return S.findIndex(([x,y],i)=>gatherAt(i)&&Math.hypot(G.player.x-x,G.player.y+8-y)<26*f);
}
function nearPond(f=1){
  const P=curPlace(); if(!P.pond) return false;
  const d=Math.hypot((G.player.x-P.pond.x)/(P.pond.rx+30),(G.player.y+9-P.pond.y)/(P.pond.ry+30));
  return d<1+0.15*(f-0.5);
}
const nearPerson=(f=1)=>placePeople(curPlace()).find(p=>Math.hypot(G.player.x-p.x,G.player.y-p.y)<(p.reach||30*f));   /* reach: across a counter */
const nearPlaceExit=(f=1)=>curPlace().exits.find(e=>Math.hypot(G.player.x-e.x,G.player.y-e.y)<e.r*f);

function placeInteract(){
  const ex=nearPlaceExit(); if(ex){ goTo(ex.to); return; }
  const who=nearPerson();
  const dr=nearTownDoor();
  if(dr){ if(doorOpen(dr)){ goTo(dr.to); return; }
    say(dr.to==='bar'?PLACES.bar.name+" opens at 6 PM.":PLACES[dr.to].name+" is closed. Open 8 AM to 6 PM."); blip(150,.08,.2); return; }
  if(nearTinyEgg()){ playStory(tinyEggFound()); return; }
  if(who){ const lines=personLines(who).map(t=>({say:'npc',who,text:t}));
    if(who.shop) lines.push({run:()=>openTownShop(who.shop,who)});
    playStory(lines); return; }
  const g=nearGather();
  if(g>=0){ const k=gatherAt(g); G.daily.picked.push(g); G.goods[k]=(G.goods[k]||0)+1;
    say("Found "+GOODS[k].name+"!"+tinyFoundText(k)); blip(700,0.05,0.1,'sine'); passTime(5); autoSave(); return; }
  if(nearPond()){ if(!G.rod) say("You'll need a rod and reel. Mr. Hollis sells them in town."); else startFishing(); return; }
  say("The mountain air is lovely.".replace("The mountain air is lovely.",G.area==='town'?"Willowbrook is bustling today.":"The mountain air is lovely."));
}
function placeLabel(){
  const R=PROMPT_REACH;
  const who=nearPerson(R); if(who) return who.shop?who.name+" (shop)":who.name;
  const dr=nearTownDoor(R*1.6); if(dr) return doorOpen(dr)?PLACES[dr.to].name:"Closed";
  if(nearTinyEgg(R)) return "Check";
  if(nearGather(R)>=0) return "Gather";
  if(nearPond(R)) return season()==='winter'?"Frozen":G.rod?"Fish ("+FISH_MIN+" min)":"Fish (needs a rod)";
  return null;
}
function updatePlace(dt){
  if(updateCast(dt)) return;
  if(G.area==='mountain'&&updateMountainPests(dt)) return;
  walk(dt,WALK_SPEED,(x,y)=>placeSolid(x,y+9));
  const [W,H]=areaSize(), P=G.player; P.x=clamp(P.x,21,W-21); P.y=clamp(P.y,24,H-30);
  /* the way back to the garden is a path: walking onto it takes her home */
  const ex=nearPlaceExit();
  if(ex&&exitArmed){ goTo(ex.to); return; }
  if(!ex) exitArmed=true;
  for(const k of ['coffeeT','snackT','calmT','lureT']) if(G[k]>0) G[k]=Math.max(0,G[k]-dt);
  if(G.msgT>0) G.msgT-=dt;
}

/* ---------- painting a place (until it has a real picture) ---------- */
const PLACE_CANVAS={}, PLACE_PX=1.5;        /* canvas px per garden px */
/* a place's painting for this season (maps/<place>_<season>), once it has loaded */
const PLACE_IMG={};
function placeImg(area){
  const s=season(), key=area+'_'+s;
  if(typeof PLACE_MAPS==='undefined'||!(PLACE_MAPS[area]||[]).includes(s)) return null;
  if(!PLACE_IMG[key]){ PLACE_IMG[key]=new Image(); PLACE_IMG[key].src='assets/places/'+key+'.jpg'; }
  return PLACE_IMG[key].complete&&PLACE_IMG[key].naturalWidth?PLACE_IMG[key]:null;
}
function placeCanvas(area){
  const key=area+'|'+season();
  if(PLACE_CANVAS[key]) return PLACE_CANVAS[key];
  const P=PLACES[area], cv2=document.createElement('canvas'), wint=season()==='winter', fall=season()==='fall';
  const W=placeW(P), H=placeH(P), s=P.w?1:PLACE_PX;          /* a big place at 1 px each, to keep it light */
  cv2.width=W*s; cv2.height=H*s; const c=cv2.getContext('2d'); c.scale(s,s);
  if(P.room){ drawRoom(c,P); PLACE_CANVAS[key]=cv2; return cv2; }
  c.fillStyle=wint?'#e8eef4':fall?'#a8a05a':P.ground; c.fillRect(0,0,W,H);
  for(let i=0;i<900*W*H/(WORLD_W*WORLD_H);i++){ const x=(i*97.3)%W, y=(i*61.7)%H;   /* grass flecks */
    c.fillStyle=wint?'rgba(255,255,255,.5)':'rgba(40,80,30,.18)'; c.fillRect(x,y,2,3); }
  if(P.cliffs){ const g=c.createLinearGradient(0,0,0,160); g.addColorStop(0,'#6a7080'); g.addColorStop(1,'#8a8a8a');
    c.fillStyle=g; c.beginPath(); c.moveTo(0,160);
    for(let x=0;x<=W;x+=60) c.lineTo(x,40+((x*37)%70)); c.lineTo(W,160); c.closePath(); c.fill();
    c.fillStyle='#f4f8ff'; for(let x=0;x<W;x+=120){ c.beginPath(); c.moveTo(x+20,70); c.lineTo(x+60,40+((x*37)%40)); c.lineTo(x+100,70); c.fill(); } }
  c.fillStyle=wint?'#dcd4c4':P.path; P.paths.forEach(([x,y,w,h])=>{ c.beginPath(); c.roundRect(x,y,w,h,18); c.fill(); });
  if(P.plaza){ c.fillStyle='#cfc4b0'; c.beginPath(); c.arc(P.plaza.x,P.plaza.y,P.plaza.r,0,7); c.fill();
    c.strokeStyle='rgba(90,80,60,.25)'; for(let r=20;r<P.plaza.r;r+=20){ c.beginPath(); c.arc(P.plaza.x,P.plaza.y,r,0,7); c.stroke(); } }
  if(P.fountain){ const f=P.fountain; c.fillStyle='#9a9488'; c.beginPath(); c.arc(f.x,f.y,f.r,0,7); c.fill();
    c.fillStyle=wint?'#dff0ff':'#6ab8e0'; c.beginPath(); c.arc(f.x,f.y,f.r-6,0,7); c.fill(); }
  if(P.pond){ const p=P.pond; c.fillStyle='#5a7a4a'; c.beginPath(); c.ellipse(p.x,p.y,p.rx+8,p.ry+6,0,0,7); c.fill();
    c.fillStyle=wint?'#d8ecf8':'#4a90c8'; c.beginPath(); c.ellipse(p.x,p.y,p.rx,p.ry,0,0,7); c.fill();
    c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(p.x-20,p.y-14,p.rx*0.5,p.ry*0.3,0,0,7); c.fill(); }
  (P.houses||[]).forEach(h=>{
    c.fillStyle='rgba(0,0,0,.2)'; c.fillRect(h.x+6,h.y+h.h-6,h.w,12);
    if(h.tent){ c.fillStyle='#f6f0e0'; c.fillRect(h.x,h.y+20,h.w,h.h-20);
      for(let i=0;i<h.w;i+=20){ c.fillStyle=i%40?'#f6f0e0':h.roof; c.beginPath(); c.moveTo(h.x+i,h.y+22); c.lineTo(h.x+i+10,h.y); c.lineTo(h.x+i+20,h.y+22); c.fill(); } }
    else { c.fillStyle='#e8dcc0'; c.fillRect(h.x,h.y+h.h*0.4,h.w,h.h*0.6);
      c.fillStyle=h.roof; c.beginPath(); c.moveTo(h.x-8,h.y+h.h*0.45); c.lineTo(h.x+h.w/2,h.y); c.lineTo(h.x+h.w+8,h.y+h.h*0.45); c.fill();
      c.fillStyle='#6a4a2a'; c.fillRect(h.x+h.w/2-10,h.y+h.h-28,20,28);
      c.fillStyle='#a8d0e8'; c.fillRect(h.x+14,h.y+h.h*0.55,18,14); c.fillRect(h.x+h.w-32,h.y+h.h*0.55,18,14); }
    if(wint){ c.fillStyle='#f8fbff'; c.beginPath(); c.moveTo(h.x-8,h.y+h.h*0.45); c.lineTo(h.x+h.w/2,h.y); c.lineTo(h.x+h.w+8,h.y+h.h*0.45); c.lineTo(h.x+h.w/2,h.y+10); c.fill(); }
    if(h.name){ c.fillStyle='#3a2a1a'; c.font='bold 12px '+FONT; c.textAlign='center'; c.fillText(h.name,h.x+h.w/2,h.y+h.h*0.4-6); } });
  P.trees.forEach(([x,y])=>{ c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x+4,y+8,20,8,0,0,7); c.fill();
    c.fillStyle='#6a4a2a'; c.fillRect(x-3,y-6,6,14);
    c.fillStyle=wint?'#e8f0f4':fall?'#d8782a':(P.cliffs?'#3a6a3a':'#4a8a3a');
    if(P.cliffs){ c.beginPath(); c.moveTo(x,y-46); c.lineTo(x-18,y); c.lineTo(x+18,y); c.fill(); }
    else { c.beginPath(); c.arc(x,y-18,20,0,7); c.fill(); c.beginPath(); c.arc(x-10,y-10,13,0,7); c.arc(x+10,y-10,13,0,7); c.fill(); } });
  PLACE_CANVAS[key]=cv2; return cv2;
}
/* a placeholder room: floorboards, the back wall with windows, furniture with labels, and
   the doorway at the bottom */
function drawRoom(c,P){
  const W=P.w, H=P.h;
  c.fillStyle=P.floor; c.fillRect(0,0,W,H);
  c.fillStyle='rgba(0,0,0,.12)'; for(let y=P.wall;y<H;y+=22) c.fillRect(0,y,W,2);
  for(let y=P.wall,r=0;y<H;y+=22,r++) for(let x=(r%2)*60;x<W;x+=120) c.fillRect(x,y,2,22);
  c.fillStyle=P.wallCol; c.fillRect(0,0,W,P.wall);
  c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(0,P.wall-26,W,26);                 /* wainscot */
  c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(0,P.wall-3,W,3);
  [[70,20],[330,20]].forEach(([x,y])=>{ c.fillStyle='#4a3a2a'; c.fillRect(x-4,y-4,58,48); c.fillStyle='#a8c8e8'; c.fillRect(x,y,50,40);
    c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(x+4,y+4,16,32); });
  (P.furn||[]).forEach(([x,y,w,h,col,label])=>{
    c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(x+4,y+h-2,w,8);
    c.fillStyle=col; c.fillRect(x,y,w,h); c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(x,y,w,5);
    c.fillStyle='rgba(255,246,216,.85)'; c.font='bold 9px '+FONT; c.textAlign='center'; c.fillText(label,x+w/2,y+h/2+3); });
  c.fillStyle='#2a1a10'; c.fillRect(W/2-40,H-14,80,14);                       /* the doorway */
  c.fillStyle='#8a3a3a'; c.fillRect(W/2-34,H-34,68,16);                       /* the mat */
  c.fillStyle='rgba(255,246,216,.5)'; c.font='bold 10px '+FONT; c.textAlign='center';
  c.fillText(P.name+" (placeholder)",W/2,P.wall-34); c.textAlign='left';
}
/* a townsperson: a simple stand-in figure until they have art */
function drawPerson(c,p){
  const x=p.x, y=p.y, bob=Math.sin(G.t/600+p.x)*0.6;
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x,y,7,2.5,0,0,7); c.fill();
  c.fillStyle='#3a2a1a'; c.fillRect(x-4,y-8,3,8); c.fillRect(x+1,y-8,3,8);
  c.fillStyle=p.col; c.beginPath(); c.roundRect(x-6,y-22+bob,12,15,4); c.fill();
  c.fillStyle='#f0c8a0'; c.beginPath(); c.arc(x,y-27+bob,5.5,0,7); c.fill();
  c.fillStyle=p.hair; c.beginPath(); c.arc(x,y-29+bob,5.8,Math.PI,0); c.fill();
}
function drawGatherSpot(c,x,y,k){
  const g=GOODS[k], tw=Math.sin(G.t/300+x)*0.5+0.5;
  /* its own picture (shop items/<name>) when there is one, with a glint so it stands out */
  if(c===b&&typeof SHOP_ART!=='undefined'&&SHOP_ART[g.name.toLowerCase()]){
    c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x,y,8,2.6,0,0,7); c.fill();
    const bx=g.kind==='quest'?24:18;                          /* twigs and pinestraw are thin: a little bigger */
    drawShopPic(g.name.toLowerCase(),x,y-bx/2,bx,bx);
    c.globalAlpha=tw*0.9; c.fillStyle='#ffffff'; c.fillRect(x+6,y-19,2,2); c.fillRect(x+5,y-18,4,0.8); c.globalAlpha=1;
    return; }
  c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x,y,6,2,0,0,7); c.fill();
  c.fillStyle='#4a7a3a'; c.fillRect(x-1,y-6,2,6); c.fillRect(x-4,y-4,3,2); c.fillRect(x+1,y-5,3,2);
  c.fillStyle=g.col; c.beginPath(); c.arc(x,y-8,3.4,0,7); c.fill();
  c.globalAlpha=tw*0.8; c.fillStyle='#ffffff'; c.fillRect(x+3,y-14,2,2); c.globalAlpha=1;
}
function drawPlace(){
  const cam=camera(), P=curPlace();
  b.save(); b.beginPath(); b.rect(0,0,LW,VIEW_H); b.clip();
  b.save(); b.scale(WORLD_ZOOM,WORLD_ZOOM);
  /* the painting; black while it loads (the drawn stand-in only for a place without one) */
  const pim=placeImg(G.area), painted=typeof PLACE_MAPS!=='undefined'&&(PLACE_MAPS[G.area]||[]).includes(season());
  b.imageSmoothingEnabled=true;
  if(pim||!painted) b.drawImage(pim||placeCanvas(G.area),-cam.x,-cam.y,placeW(P),placeH(P));
  const ents=[];
  placePeople(P).forEach(p=>ents.push({y:p.y,f:()=>drawPerson(b,{...p,x:p.x-cam.x,y:p.y-cam.y})}));
  if(nearTinyEgg(9)) ents.push({y:TINY_EGG.y,f:()=>drawTinyEgg(b,TINY_EGG.x-cam.x,TINY_EGG.y-cam.y)});   /* Tiny One's egg, under the pine */
  if(gatherSpots()) gatherSpots().forEach(([x,y],i)=>{ const k=gatherAt(i); if(k) ents.push({y,f:()=>drawGatherSpot(b,x-cam.x,y-cam.y,k)}); });
  /* the pests, scaled like her here (shadow and all), around their feet */
  if(G.area==='mountain') G.mtnPests.forEach(p=>ents.push({y:p.y,f:()=>{ const x=p.x-cam.x, y=p.y-cam.y, s=placeKait();
    b.save(); b.translate(x,y); b.scale(s,s); b.translate(-x,-y);
    drawPestWorld(b,p.species,x,y,G.t,p.face,p.ph||(p.ph=Math.random()*6.3)); b.restore(); }}));
  ents.push({y:G.player.y+9,f:()=>{
    const sx=G.player.x-cam.x, sy=G.player.y+12-cam.y;
    const K=placeKait()/WORLD_ZOOM;                 /* her size here, around her feet */
    b.save(); b.translate(sx,sy); b.scale(K,K); b.translate(-sx,-sy); b.imageSmoothingEnabled=placeKait()!==1;
    drawKaitlynShadow(b,sx,sy,G.player.dir,G.player.animT||0,G.player.moving);
    if(G.cast){ const n=BRN[BROW.flute]||1; drawBattleRow(b,'flute',Math.floor(G.cast.t/90)%n,sx,sy,1); }
    else drawKaitlyn(b,sx,sy,G.player.dir,G.player.animT||0,false,G.player.moving);
    b.restore(); }});
  ents.sort((a,z)=>a.y-z.y).forEach(e=>e.f());
  /* what she walks behind (maps/<place>_<season>_front: tree tops and the like) goes over everyone */
  const fr=frontImg(G.area+'_'+season()); if(fr){ b.imageSmoothingEnabled=true; b.drawImage(fr,-cam.x,-cam.y,placeW(P),placeH(P)); }
  placePeople(P).forEach(p=>{ b.font='bold 7px '+FONT; b.textAlign='center'; b.fillStyle='rgba(20,12,4,.55)';
    const w=b.measureText(p.name).width+6; b.fillRect(p.x-cam.x-w/2,p.y-cam.y-46,w,10);
    b.fillStyle='#fff6d8'; b.fillText(p.name,p.x-cam.x,p.y-cam.y-38.5); b.textAlign='left';
    if(personMarked(p)) drawMarker(b,p.x-cam.x,p.y-cam.y-54); });
  b.restore();
  if(!P.room) tintView(b);                    /* lamps are lit indoors */
  b.restore();
  drawClockBack(); drawBuffsBack();
  blit();
  drawClockText(); drawBuffsText();
  T(P.name,8,16,20,'#fff6d8','left',true);
  const label=placeLabel();
  if(label&&G.scene==='world'){ const [fx,fy]=toView(G.player.x,G.player.y+12,cam); drawPrompt(label,fx,fy-74*placeKait()); }
  drawHUD();
}

/* ---------- town shops ----------
   Placeholders to fill in later: each shop is a list of {name,cost,desc,buy} where
   buy() does the buying (return false to refuse), or for the market, things to sell.
   They open after the shopkeeper's lines, in a blue window like the menu. */
const TOWN_SHOPS={
  cafe:{title:"Mabel's Café", items:()=>[
    {name:"Coffee",cost:30,desc:"Walk 50% faster for 2 minutes. Goes in your bag.",buy:()=>addGood('coffee')},
    {name:"Herbal Tea",cost:24,desc:"Restores 10 MP to everyone in the party. Goes in your bag.",buy:()=>addGood('tea')},
    {name:"Honey Bun",cost:28,desc:"Restores 20 HP to everyone in the party. Goes in your bag.",buy:()=>addGood('bun')}]},
  /* Rosa's music shop: sheet music for new songs to practice at the music stand */
  music:{title:"Rosa's Music Shop", empty:"Nothing new in yet. Check back soon!", items:()=>
    gearRows(['silver','dizi','polish','cloth']).concat(
    PRACTICE_SONGS.filter(s=>!songKnown(s)).map(s=>({name:"Sheet music: "+s.name,cost:s.cost,
      desc:"A new song to practice at home: up to "+practiceXp(1,s)+" EXP a day.",buy:()=>{ G.sheets.push(s.id); }})))},
  /* Mr. Hollis: the next rod and reel up, one set at a time */
  fishing:{title:"Hollis Fishing Supply", empty:"You've got the best rod I sell!", items:()=>{
    const n=(G.rod||0)+1;
    return n<RODS.length?[{name:RODS[n].name,cost:RODS[n].cost,desc:RODS[n].about+(n===1?" You need one to fish.":""),buy:()=>{ G.rod=n; }}]:[]; }},
  /* Juniper buys forage, fish and what pests leave behind, and sells back anything she
     bought from you (G.pawn) for half again as much */
  junk:{title:"Juniper's Junk Shop", empty:"Nothing to sell — try foraging on the mountain!", items:()=>{
    const L=sellGoods().map(k=>({sell:true,name:GOODS[k].name+"  x"+G.goods[k],cost:goodsPrice(k),desc:"Sell one for "+goodsPrice(k)+"c. You can buy it back later for "+buyBackPrice(k)+"c.",
      buy:()=>{ G.goods[k]--; if(G.goods[k]<=0) delete G.goods[k]; G.coins+=goodsPrice(k); pawn(k,1); }}));
    if(L.length){ const tot=sellGoods().reduce((a,k)=>a+goodsPrice(k)*G.goods[k],0);
      L.push({sell:true,name:"Sell everything",cost:tot,desc:"Sell all your forage, fish and pest finds for "+tot+"c.",
        buy:()=>{ G.coins+=tot; sellGoods().forEach(k=>{ pawn(k,G.goods[k]); delete G.goods[k]; }); }}); }
    return L.concat(gearRows(['charm','boots','can','basket','apron','kickers','scalecharm','scarf','fangpolish','bell']),
      Object.keys(G.pawn).filter(k=>G.pawn[k]>0&&GOODS[k]).map(k=>({name:"Buy back: "+GOODS[k].name+"  x"+G.pawn[k],cost:buyBackPrice(k),
      desc:GOODS[k].flavor+" Buy one back for "+buyBackPrice(k)+"c.",buy:()=>{ G.pawn[k]--; if(G.pawn[k]<=0) delete G.pawn[k]; addGood(k); }}))); }},
  /* the Tipsy Toad, from 6 PM */
  bar:{title:"The Tipsy Toad", items:()=>[
    {name:"Mug of Cider",cost:40,desc:"Restores 15 HP and 5 MP to everyone in the party. Goes in your bag.",buy:()=>addGood('cider')},
    {name:"Hot Toddy",cost:45,desc:"Restores 15 MP to everyone in the party. Goes in your bag.",buy:()=>addGood('toddy')}]},
};
const buyBackPrice=k=>Math.ceil(goodsPrice(k)*1.5);
/* shop rows for garden gear (GEAR) and equipment (EQUIP) not bought yet; G.gear[key] marks either */
function gearRows(keys){
  return keys.filter(k=>!G.gear[k]).map(k=>{ const E=EQUIP[k], g=GEAR.find(x=>x.id===k), it=E||g;
    const who=E&&E.who?" For "+E.who.map(id=>PARTY_INFO[id].name).join(" and ")+".":"";
    return {name:it.name,cost:it.cost,desc:cap(it.desc)+(E?(E.slot==='weapon'?" A weapon":" An accessory")+" (Equip tab)."+who:" Garden gear."),
      buy:()=>{ G.gear[k]=1;
        /* a better flute goes straight into her hands */
        if(k==='dizi'||(k==='silver'&&equipOf('kaitlyn').weapon!=='dizi')){ equipOf('kaitlyn').weapon=k; refitMember('kaitlyn'); } }}; });
}
const pawn=(k,n)=>{ G.pawn[k]=(G.pawn[k]||0)+n; };
let tshop=null;
function openTownShop(kind,who){ tshop={kind,who,idx:0,top:0}; G.scene='tshop'; }
function tshopBuy(i){
  const S=TOWN_SHOPS[tshop.kind], it=S.items()[i]; if(!it) return;
  if(!it.sell&&G.coins<it.cost){ say("Not enough coins."); blip(150,.08,.2); return; }
  if(it.buy()===false) return;
  if(!it.sell) G.coins-=it.cost;
  say(it.sell?"Sold!":"Bought "+it.name.replace(/^Buy back: /,'').replace(/  x\d+$/,'')+"."); blip(660,0.05,0.1,'triangle');
  tshop.idx=Math.min(tshop.idx,Math.max(0,S.items().length-1)); autoSave();
}
const TSHOP={x:14,y:40,w:332,h:400,row:30,top:62};
const tshopFit=()=>Math.floor((TSHOP.h-TSHOP.top-80)/TSHOP.row);
function tshopKey(k){
  const n=TOWN_SHOPS[tshop.kind].items().length, fit=tshopFit();
  if(isUp(k)&&n) tshop.idx=(tshop.idx+n-1)%n;
  else if(isDown(k)&&n) tshop.idx=(tshop.idx+1)%n;
  else if(isOk(k)&&n) tshopBuy(tshop.idx);
  else if(isBack(k)){ G.scene='world'; tshop=null; return; }
  if(tshop.idx<tshop.top) tshop.top=tshop.idx; if(tshop.idx>=tshop.top+fit) tshop.top=tshop.idx-fit+1;
}
function tshopTouch(x,y){
  const W=TSHOP, j=Math.floor((y-W.y-W.top)/W.row), i=tshop.top+j;
  if(x<W.x||x>W.x+W.w||y<W.y||y>W.y+W.h){ G.scene='world'; tshop=null; return; }
  if(j>=0&&j<tshopFit()&&i<TOWN_SHOPS[tshop.kind].items().length){ if(tshop.idx===i) tshopBuy(i); tshop.idx=i; }
}
function drawTownShop(){
  const S=TOWN_SHOPS[tshop.kind], L=S.items(), W=TSHOP, fit=tshopFit();
  const g=b.createLinearGradient(0,BAND_TOP(),0,BAND_BOT()); g.addColorStop(0,'#141c4a'); g.addColorStop(1,'#070b22');
  b.fillStyle=g; b.fillRect(0,BAND_TOP(),LW,BAND_BOT()-BAND_TOP());
  rpgWin(W); rpgWin({x:W.x+8,y:W.y+W.h-74,w:W.w-16,h:66});
  if(L.length) winCursor(W.x+6,W.y+W.top+(tshop.idx-tshop.top)*W.row,W.w-12,W.row-2);
  blit();
  TS(S.title,W.x+14,W.y+28,24,'#f4f6ff',null,true);
  TS(G.coins+"c",W.x+W.w-14,W.y+28,22,'#ffe08a','right',true);
  if(!L.length) TS(S.empty||"Sold out!",W.x+W.w/2,W.y+120,17,'#aab6e8','center');
  L.slice(tshop.top,tshop.top+fit).forEach((it,j)=>{ const i=tshop.top+j, y=W.y+W.top+j*W.row+20, ok=it.sell||G.coins>=it.cost;
    TS(it.name,W.x+40,y,19,ok?(it.sell?'#f4f6ff':'#e4e8ff'):'#7c84b0',null,i===tshop.idx);
    TS((it.sell?"+":"")+it.cost+"c",W.x+W.w-14,y,18,ok?(it.sell?'#b8f0a0':'#ffe08a'):'#7c84b0','right'); });
  const it=L[tshop.idx];
  if(it) wrapLines(it.desc,16,W.w-44).slice(0,2).forEach((ln,i)=>TS(ln,W.x+20,W.y+W.h-48+i*17,16,'#c8d4ff'));
  const verb=it&&it.sell?"sell":"buy";
  TS(IS_TOUCH?"tap twice to "+verb+" · B to leave":"J "+verb+" · H leave",W.x+W.w/2,W.y+W.h+18,16,'#8a94c4','center');
  if(G.msgT>0) TS(G.msg,W.x+W.w/2,W.y+W.h-82,16,'#ffe08a','center');
}

/* a small drawn picture of a good (until they have art): a fish shape, or a sprig */
function drawGoodIcon(c,k,cx,cy,box){
  const g=GOODS[k], s=box/24;
  /* its picture (shop items/<name>), when there is one */
  if(c===b&&drawShopPic(g.name.toLowerCase(),cx,cy,box,box)) return;
  c.save(); c.translate(cx,cy); c.scale(s,s);
  if(g.kind==='fish'){
    c.fillStyle=g.col; c.beginPath(); c.ellipse(-2,0,9,4.5,0,0,7); c.fill();
    c.beginPath(); c.moveTo(6,0); c.lineTo(11,-5); c.lineTo(11,5); c.fill();
    c.fillStyle='#1a1a2a'; c.beginPath(); c.arc(-7,-1,1,0,7); c.fill();
    c.fillStyle='rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-3,-2,5,1.4,0,0,7); c.fill();
  } else {
    c.strokeStyle='#4a7a3a'; c.lineWidth=1.5; c.beginPath(); c.moveTo(0,10); c.lineTo(0,-2); c.moveTo(0,4); c.lineTo(-5,0); c.moveTo(0,2); c.lineTo(5,-2); c.stroke();
    c.fillStyle=g.col;
    [[0,-5],[-5,-1],[5,-4]].forEach(([x,y])=>{ c.beginPath(); c.arc(x,y,3.4,0,7); c.fill(); });
    c.fillStyle='rgba(255,255,255,.4)'; c.beginPath(); c.arc(-1,-6,1.1,0,7); c.fill();
  }
  c.restore();
}
/* what eating or drinking a good does (forage: eat, food: use), in words */
const goodEffect=k=>GOODS[k].eat||GOODS[k].use;
function effText(e){
  if(!e) return "";
  return [e.hp&&"+"+e.hp+" HP",e.mp&&"+"+e.mp+" MP",e.hpAll&&"+"+e.hpAll+" HP to everyone",
          e.mpAll&&"+"+e.mpAll+" MP to everyone",e.coffee&&"walk faster for "+Math.round(e.coffee/60000)+" min"].filter(Boolean).join(", ");
}
/* use one good: its HP/MP go to member id, party-wide ones to everyone out with her */
function useGood(k,id){
  const e=goodEffect(k), M=member(id||'kaitlyn');
  G.goods[k]--; if(G.goods[k]<=0) delete G.goods[k];
  if(e.hp) M.hp=Math.min(M.maxhp,M.hp+e.hp);
  if(e.mp) M.mp=Math.min(memberMaxMp(id||'kaitlyn'),M.mp+e.mp);
  G.party.forEach(p=>{ const N=member(p); if(e.hpAll) N.hp=Math.min(N.maxhp,N.hp+e.hpAll); if(e.mpAll) N.mp=Math.min(memberMaxMp(p),N.mp+e.mpAll); });
  if(e.coffee) G.coffeeT=Math.max(G.coffeeT,e.coffee);
  return effText(e);
}
function eatGood(k,id){
  const g=GOODS[k]; if(!goodEffect(k)){ say(g.kind==='quest'?g.flavor:"Better to sell the "+g.name+"."); blip(150,.08,.2); return; }
  id=id||'kaitlyn';
  say(PARTY_INFO[id].name+(g.kind==='food'?" had the ":" ate the ")+g.name+": "+useGood(k,id)+"."); blip(620,0.06,0.1,'sine'); autoSave();
}
/* what can be eaten or drunk in battle: crops (by species) and goods ('g:'+key) that heal */
function battleItems(){
  return cropList().filter(sp=>EAT[sp]&&(EAT[sp].hp||EAT[sp].mp)).concat(
    goodsList().filter(k=>{ const e=goodEffect(k); return e&&(e.hp||e.mp||e.hpAll||e.mpAll); }).map(k=>'g:'+k));
}
const isGoodKey=k=>k.startsWith('g:');
const itemName=k=>isGoodKey(k)?GOODS[k.slice(2)].name:SPECIES[k].name;
const itemCount=k=>isGoodKey(k)?G.goods[k.slice(2)]:G.crops[k];
const itemText=k=>isGoodKey(k)?effText(goodEffect(k.slice(2))):eatText(k);
const useItem=(k,id)=>isGoodKey(k)?useGood(k.slice(2),id):applyFood(k,id);
