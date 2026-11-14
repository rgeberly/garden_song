/* ================================================================
   CONTENT
   ================================================================ */
/* grow: growth points to fill the bar (a good song gives ~130), less in its best season.
   New species go at the end: saves store plots by their place in this list. */
const SPECIES={
  strawberry:{name:"Strawberry",kind:'bed',fruit:'#e8433f',dk:'#9c1f1f',cost:20,value:40, xp:8, notes:10,grow:700, best:'spring',
              flavor:"Sweet, red and impossible to eat just one."},
  tomato    :{name:"Tomato",    kind:'bed',fruit:'#f0503a',dk:'#a4281c',cost:26,value:52, xp:10,notes:12,grow:820, best:'summer',
              flavor:"Technically a fruit. Emotionally a vegetable."},
  sunflower :{name:"Sunflower", kind:'bed',fruit:'#f0c44a',dk:'#a4801a',cost:30,value:60, xp:11,notes:12,grow:900, best:'summer',
              flavor:"A seed-packed face that always looks on the bright side."},
  blueberry :{name:"Blueberry", kind:'bed',fruit:'#5a70c4',dk:'#2b3a66',cost:24,value:48, xp:9, notes:11,grow:780, best:'spring',
              flavor:"Tiny blue bursts of brain fuel."},
  lemongrass:{name:"Lemongrass",kind:'bed',fruit:'#9ed860',dk:'#5f9436',cost:16,value:32, xp:7, notes:9, grow:600, best:'summer',
              flavor:"Smells so fresh that pests politely leave."},
  squash    :{name:"Squash",    kind:'bed',fruit:'#f0a02a',dk:'#a4610f',cost:34,value:68, xp:12,notes:13,grow:960, best:'fall',
              flavor:"Hearty and filling. Squash that hunger!"},
  melon     :{name:"Heirloom Melon",kind:'raised',fruit:'#8ad86a',dk:'#3f7a33',cost:48,value:118,xp:20,notes:14,grow:1150,best:'summer',
              flavor:"An old family variety, pampered in a raised bed."},
  satsuma   :{name:"Satsuma",   kind:'tree',fruit:'#ffa83a',dk:'#c06a12',cost:70,value:145,xp:20,notes:15,grow:1250,best:'winter',
              flavor:"Peels in one go if you're lucky. Zippy!"},
  muscadine :{name:"Muscadine", kind:'tree',fruit:'#7d4aa8',dk:'#42245c',cost:64,value:132,xp:18,notes:14,grow:1300,best:'fall',
              flavor:"Wild grapes with a musky perfume pests can't resist."},
  avocado   :{name:"Avocado",   kind:'tree',fruit:'#4a7a33',dk:'#26421b',cost:82,value:168,xp:22,notes:16,grow:1500,best:'spring',
              flavor:"Creamy, pricey and very good for you. Guac and roll!"},
  radish    :{name:"Radish",    kind:'bed',fruit:'#e0405a',dk:'#8a1f34',cost:12,value:26, xp:6, notes:8, grow:450, best:'spring',
              flavor:"Small, spicy and raring to go."},
  carrot    :{name:"Carrot",    kind:'bed',fruit:'#f0802a',dk:'#a4500f',cost:18,value:38, xp:7, notes:9, grow:640, best:'fall',
              flavor:"Crunchy and good for the eyes, or so the rabbits claim."},
  beet      :{name:"Beet",      kind:'bed',fruit:'#9a2050',dk:'#5a1030',cost:22,value:46, xp:8, notes:10,grow:720, best:'winter',
              flavor:"Earthy, sweet and impossible to beat."},
  /* pricey and quick, but not much of a meal */
  pumpkin   :{name:"Pumpkin",   kind:'ground',fruit:'#f08a2a',dk:'#a4520f',cost:56,value:132,xp:18,notes:12,grow:820,best:'fall',
              flavor:"Big, round and quick to grow, but mostly just good for pie."},
  collards  :{name:"Collard Greens",kind:'raised',fruit:'#3f8a4a',dk:'#1f5a2c',cost:42,value:104,xp:17,notes:13,grow:1050,best:'winter',
              flavor:"A little frost only makes them sweeter. Worth the long simmer."},
};
const SPECIES_ORDER=Object.keys(SPECIES);
/* what she buys and plants: a seed, or for a fruit tree a sapling */
const seedName=sp=>SPECIES[sp].name+(SPECIES[sp].kind==='tree'?" sapling":" seed");
/* seeds in the order of the seasons they do best in (for the shop and the bag) */
const SEASON_RANK={spring:0,summer:1,fall:2,winter:3};
const bySeason=L=>L.slice().sort((a,z)=>SEASON_RANK[SPECIES[a].best]-SEASON_RANK[SPECIES[z].best]||SPECIES_ORDER.indexOf(a)-SPECIES_ORDER.indexOf(z));
/* the order the shop gets them in: three to start, one more each garden level */
const UNLOCK_ORDER=['strawberry','tomato','sunflower','radish','blueberry','carrot','lemongrass','beet',
  'squash','melon','collards','pumpkin','satsuma','muscadine','avocado'];
const unlockedFor=lv=>UNLOCK_ORDER.slice(0,2+lv);
/* What eating a harvested crop does (from the Items menu). hp/mp restore; the rest
   are timed in real ms: speed = walk 25% faster, calm = pests come half as often,
   lure = pests come twice as often (more battles, more XP). */
const EAT={
  strawberry:{hp:8},                 blueberry:{mp:5},
  tomato:    {hp:6,mp:3},            sunflower:{speed:60000},
  lemongrass:{calm:120000},          squash:   {hp:15},
  melon:     {hp:20,mp:8},           satsuma:  {mp:10,speed:30000},
  muscadine: {lure:120000},          avocado:  {hp:30,mp:30},
  radish:    {hp:5},                 carrot:   {mp:6},
  beet:      {hp:10,mp:3},           pumpkin:  {hp:6},
  collards:  {hp:14,mp:5},
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
/* Pests. def softens hits on them, agi decides when they act; min: garden level they
   start turning up at; night: only after dark. On its turn a pest picks one of its
   skills by weight w:
     kind 'hit' one of the party, 'all' the whole party, 'multi' hits random members
     `hits` times, 'steal' takes coins, 'heal' mends itself (share of max HP),
     'guard' halves damage to it until its next turn, 'charge' makes its next hit
     double. pow scales its attack; st a status it may leave (chance p): poison,
     blind, sleep, weak, scared; drain heals it by that share of the damage; miss a
     chance to miss. fx is the effect drawn (see drawFoeFx). lv: the level it turns up
   at (stats grow from there, see pestStats); fly: hovers in battle; where:'mountain': only
   on the mountain trail; big: how big its stand-in is until it has a picture; size: drawn bigger or smaller in
   battle (the HOA President towers over Kaitlyn; the raccoon is 0.7); about: its flavor. */
const PESTS={
  beetle :{name:"Dung Beetle",  hp:26, atk:4, def:3, agi:3,  xp:14, coin:5, min:1, col:'#a8781e',lv:1,
          about:"Rolls its lunch around all day. Proud of it, too.",skills:[
    {name:"Headbutt",kind:'hit',pow:1,w:3,fx:'bash'},
    {name:"Dung Ball",kind:'all',pow:0.6,w:2,fx:'ball'}]},
  wasp   :{name:"Paper Wasp",   hp:20, atk:6, def:2, agi:10, xp:16, coin:6, min:1, col:'#e8b02a',lv:1,fly:true,
          about:"Builds paper houses and takes zero visitors.",skills:[
    {name:"Sting",kind:'hit',pow:1,w:3,st:'poison',p:0.4,fx:'sting'},
    {name:"Swarm Buzz",kind:'all',pow:0.55,w:2,fx:'buzz'}]},
  rat    :{name:"Garden Rat",   hp:34, atk:5, def:3, agi:8,  xp:20, coin:8, min:2, col:'#8a8072',lv:2,
          about:"Twitchy whiskers, sticky paws. Keep an eye on your coin purse.",skills:[
    {name:"Bite",kind:'hit',pow:1,w:3,fx:'bite'},
    {name:"Gnaw",kind:'hit',pow:0.7,w:2,st:'weak',p:0.6,fx:'bite'},
    {name:"Pilfer",kind:'steal',w:1,fx:'steal'}]},
  saddleback:{name:"Saddleback",hp:30, atk:7, def:4, agi:2,  xp:22, coin:9, min:2, col:'#8fc43a',lv:3,
          about:"Cute little saddle, very rude spines. Do not pet.",skills:[
    {name:"Sting",kind:'hit',pow:1,w:3,st:'poison',p:0.7,fx:'sting'},
    {name:"Spine Burst",kind:'all',pow:0.6,w:2,st:'poison',p:0.3,fx:'spines'}]},
  seagull:{name:"Seagull",      hp:28, atk:6, def:2, agi:12, xp:21, coin:9, min:2, col:'#e8eef4',lv:3,fly:true,
          about:"Miles from any beach and still screaming about chips.",skills:[
    {name:"Peck",kind:'hit',pow:1,w:3,fx:'peck'},
    {name:"Dive Bomb",kind:'hit',pow:1.6,w:2,miss:0.3,fx:'dive'},
    {name:"Snatch",kind:'steal',w:1,fx:'steal'}]},
  ghost  :{name:"Shy Ghost",    hp:32, atk:5, def:2, agi:7,  xp:27, coin:10,min:2, col:'#bfe8e0',night:true,lv:3,fly:true,
          about:"Only comes out after dark. Probably just wants a friend.",skills:[
    {name:"Boo!",kind:'hit',pow:0.5,w:2,st:'scared',p:0.7,fx:'boo'},
    {name:"Chill Touch",kind:'hit',pow:1,w:3,drain:0.5,fx:'chill'},
    {name:"Fade Away",kind:'guard',w:1,fx:'fade'}]},
  crab   :{name:"Hermit Crab",  hp:44, atk:5, def:8, agi:3,  xp:26, coin:10,min:3, col:'#c46a3a',lv:4,
          about:"Lives in a borrowed shell and pinches first, asks later.",skills:[
    {name:"Pinch",kind:'hit',pow:1,w:3,fx:'pinch'},
    {name:"Shell Up",kind:'guard',w:1,fx:'shell'},
    {name:"Claw Crush",kind:'hit',pow:1.5,w:1,fx:'pinch'}]},
  crow   :{name:"Spiteful Crow",hp:36, atk:7, def:3, agi:11, xp:28, coin:11,min:3, col:'#3a5aa8',lv:4,
          about:"Clever, petty and remembers your face. Forever.",skills:[
    {name:"Peck",kind:'hit',pow:1,w:3,fx:'peck'},
    {name:"Mocking Caw",kind:'hit',pow:0.4,w:2,st:'blind',p:0.8,fx:'caw'},
    {name:"Talon Rake",kind:'all',pow:0.7,w:2,fx:'claw'}]},
  raccoon:{name:"Raccoon",      hp:56, atk:8, def:5, agi:8,  xp:36, coin:14,min:4, col:'#8a8f96',lv:6,size:0.7,
          about:"A masked bandit with a gourmet taste for garbage.",skills:[
    {name:"Swipe",kind:'hit',pow:1,w:3,fx:'claw'},
    {name:"Trash Toss",kind:'all',pow:0.75,w:2,fx:'trash'},
    {name:"Snack Break",kind:'heal',heal:0.25,w:1,fx:'snack'}]},
  woo    :{name:"Tricky Woo",   hp:60, atk:8, def:4, agi:13, xp:40, coin:16,min:4, col:'#f4f4f4',lv:7,
          about:"The neighbors' dog. Too fast, too fluffy, too good at puppy eyes.",skills:[
    {name:"Nip",kind:'hit',pow:1,w:3,fx:'bite'},
    {name:"Puppy Eyes",kind:'hit',pow:0,w:2,st:'sleep',p:0.75,fx:'hearts'},
    {name:"Zoomies",kind:'multi',pow:0.6,hits:3,w:2,fx:'zoom'}]},
  vghost :{name:"Vengeful Ghost",hp:80,atk:10,def:4, agi:9,  xp:55, coin:20,min:5, col:'#8ac4f0',night:true,lv:9,fly:true,
          about:"A ghost with a grudge. Something about a lost prize pumpkin.",skills:[
    {name:"Wail",kind:'all',pow:0.8,w:2,st:'scared',p:0.3,fx:'wail'},
    {name:"Spectral Grasp",kind:'hit',pow:1.1,w:3,drain:0.5,fx:'chill'},
    {name:"Curse",kind:'hit',pow:0.5,w:1,st:'weak',p:1,fx:'curse'},
    {name:"Gather Gloom",kind:'charge',w:1,fx:'gloom'}]},
  /* the mountain's own (where:'mountain': never in the garden) */
  goat   :{name:"Mountain Goat",hp:52, atk:8, def:5, agi:10, xp:34, coin:13,min:1, col:'#d8d0c0',lv:5,where:'mountain',big:0.9,
          about:"Will eat your hat, your map and your lunch. Then headbutt you for dessert.",skills:[
    {name:"Headbutt",kind:'hit',pow:1,w:3,fx:'bash'},
    {name:"Bleat",kind:'all',pow:0.3,w:2,st:'scared',p:0.4,fx:'caw'},
    {name:"Ram Charge",kind:'charge',w:1,fx:'gloom'}]},
  boar   :{name:"Wild Boar",    hp:74, atk:10,def:6, agi:6,  xp:46, coin:18,min:1, col:'#6a5040',lv:7,where:'mountain',big:1.05,
          about:"Bristly, grumpy and built like a fridge. Snorts at everything, especially you.",skills:[
    {name:"Gore",kind:'hit',pow:1.1,w:3,fx:'bash'},
    {name:"Tusk Toss",kind:'hit',pow:1.5,w:1,miss:0.25,fx:'claw'},
    {name:"Mud Wallow",kind:'guard',w:1,fx:'shell'}]},
  bear   :{name:"Black Bear",   hp:130,atk:13,def:7, agi:5,  xp:80, coin:30,min:1, col:'#2e2a2a',lv:10,where:'mountain',big:1.4,
          about:"Mostly wants berries and naps. You are standing between it and both.",skills:[
    {name:"Swipe",kind:'hit',pow:1.1,w:3,fx:'claw'},
    {name:"Maul",kind:'hit',pow:1.7,w:1,fx:'bite'},
    {name:"Roar",kind:'all',pow:0.4,w:1,st:'scared',p:0.5,fx:'megaphone'},
    {name:"Honey Break",kind:'heal',heal:0.2,w:1,fx:'snack'}]},
  hoa    :{name:"HOA President",hp:130,atk:12,def:6, agi:6,  xp:120,coin:60,min:5, col:'#c9b48a',boss:true,size:1.4,lv:12,
          about:"Clipboard in hand and a bylaw for everything. Even your gnomes.",skills:[
    {name:"Citation",kind:'hit',pow:1.2,w:3,fx:'paper'},
    {name:"Noise Complaint",kind:'all',pow:0.8,w:2,fx:'megaphone'},
    {name:"Fine",kind:'steal',w:1,fx:'steal'},
    {name:"Bylaw Lecture",kind:'hit',pow:0,w:1,st:'sleep',p:0.8,fx:'paper'}]},
};
/* a pest's stats at a level: each level over its species' own (lv) adds a tenth */
function pestStats(sp,lv){
  const P=PESTS[sp], d=Math.max(0,(lv||P.lv)-P.lv), k=1+0.1*d;
  return {hp:Math.round(P.hp*k),atk:P.atk*k,def:P.def*(1+0.05*d),agi:P.agi+d*0.5,xp:Math.round(P.xp*k),coin:Math.round(P.coin*k)};
}
/* the level a new pest turns up at: its own, or a little more as the garden grows */
const pestLevel=sp=>PESTS[sp].lv+ri(0,Math.min(3,Math.floor((G.gardenLv-1)/2)));
/* what each pest may leave behind when it's beaten: [ordinary, rare] (GOODS keys), and
   the chances of each */
const PEST_DROPS={beetle:['dungball','irishell'],wasp:['paperscrap','royaljelly'],rat:['button','lostring'],saddleback:['bristle','cocoon'],seagull:['gullfeather','stolenfry'],ghost:['ecto','locket'],crab:['shellshard','pearl'],crow:['blackfeather','spoon'],raccoon:['trinket','mask'],woo:['chewball','collar'],vghost:['wisp','ribbon'],goat:['goathair','bell'],boar:['tusk','truffle'],bear:['bearfur','honeycomb'],hoa:['citation','gavel']};
const DROP_P=0.45, RARE_P=0.06;
/* the troubles anyone can be in, with how long they last (turns) and a tag colour */
const STATUS={poison:{name:"Poison",tag:"PSN",col:'#a05ad8',turns:3}, blind:{name:"Blind",tag:"BLD",col:'#5a5a6a',turns:3},
  sleep:{name:"Asleep",tag:"SLP",col:'#5a8ad8',turns:2}, weak:{name:"Weak",tag:"WK",col:'#d88a3a',turns:3},
  scared:{name:"Scared",tag:"SCR",col:'#6a4aa8',turns:2}, bound:{name:"Bound",tag:"BND",col:'#8a6a3a',turns:1}};
/* Garden gear: always working once bought (each can be switched off in the Equip tab).
   Sold at Juniper's, but the Trellis Kit at the stall's Yard tab. */
const GEAR=[
  {id:'boots',  name:"Sturdy Boots",   cost:240, desc:"run twice as fast with B (see Settings)"},
  {id:'can',    name:"Watering Can",   cost:300, desc:"+25% song growth"},
  {id:'charm',  name:"Frog Charm",     cost:340, desc:"frogs heal 2x as often"},
  {id:'trellis',name:"Trellis Kit",    cost:560, desc:"double harmony bonus"},
  {id:'basket', name:"Harvest Basket", cost:680, desc:"harvest every ripe plant in that part of the garden at once"},
  {id:'apron',  name:"Seed Apron",     cost:600, desc:"planting fills every empty spot in that part of the garden"},
];
/* Equipment: what each party member wears, in four slots. EQUIP lists what can be worn:
   key: {name, slot 'weapon'|'clothes'|'acc' (either accessory slot), who: ids who can wear it
   (anyone if left out), desc, own(): whether she has it}. Empty until the items are chosen. */
const EQUIP_SLOTS=[['weapon',"Weapon"],['clothes',"Clothes"],['acc1',"Accessory 1"],['acc2',"Accessory 2"]];
const EQUIP={
  /* Kaitlyn's weapons: her flutes (stats from FLUTE_INFO). Sold at Rosa's. */
  recorder:{name:"Wooden Recorder",slot:'weapon',who:['kaitlyn'],desc:"Her trusty first flute. No bonus.",own:()=>true,stats:{}},
  silver:  {name:"Silver Flute",   slot:'weapon',who:['kaitlyn'],cost:800, desc:"+3 Intelligence, +4 max MP.",own:()=>!!G.gear.silver,stats:FLUTE_INFO.silver.stats},
  dizi:    {name:"Mystic Dizi",    slot:'weapon',who:['kaitlyn'],cost:1800,desc:"+7 Intelligence, +10 max MP.",own:()=>!!G.gear.dizi,stats:FLUTE_INFO.dizi.stats},
  /* clothes */
  flannel: {name:"Evergreen Flannel",slot:'clothes',who:['kaitlyn'],desc:"Her favorite green plaid shirt. +2 Defense.",own:()=>true,stats:{def:2}},
  /* accessories (owned once bought: G.gear[key]) */
  polish:  {name:"Flute Polish",   slot:'acc',who:['kaitlyn'],cost:420,desc:"Songs do 30% more damage.",own:()=>!!G.gear.polish},
  cloth:   {name:"Cleaning Cloth", slot:'acc',cost:480,desc:"+8 max MP.",own:()=>!!G.gear.cloth,stats:{mp:8}},
  kickers: {name:"Garden Boots",   slot:'acc',who:['kaitlyn'],cost:380,desc:"Kicks hit 60% harder.",own:()=>!!G.gear.kickers},
  fangpolish:{name:"Fang Polish",  slot:'acc',who:['bling'],cost:450,desc:"Ivy's Venom Bite hits 50% harder.",own:()=>!!G.gear.fangpolish},
  scalecharm:{name:"Scale Charm",  slot:'acc',cost:380,desc:"+3 Defense.",own:()=>!!G.gear.scalecharm,stats:{def:3}},
  bell:    {name:"Silver Bell",    slot:'acc',who:['tiny'],cost:520,desc:"Tiny One's Tweet and healing songs heal 20% more.",own:()=>!!G.gear.bell},
  scarf:   {name:"Downy Scarf",    slot:'acc',cost:400,desc:"+10 max HP.",own:()=>!!G.gear.scarf,stats:{hp:10}},
};
/* is member id wearing key? what does their equipment add to stat k? */
const wears=(id,key)=>EQUIP_SLOTS.some(([s])=>(G.equip[id]||{})[s]===key);
function equipBonus(id,k){ const E=G.equip[id]; if(!E) return 0; let n=0;
  for(const [s] of EQUIP_SLOTS){ const it=EQUIP[E[s]]; if(it&&it.stats&&it.stats[k]) n+=it.stats[k]; } return n; }
/* after equipment changes: max HP follows, and HP and MP stay inside their new limits */
function refitMember(id){ const M=member(id); if(!M) return;
  M.maxhp=statOf(id,'hp'); M.hp=Math.min(M.hp,M.maxhp); M.mp=Math.min(M.mp,memberMaxMp(id));
  if(id==='kaitlyn') G.flute=equipOf('kaitlyn').weapon||'recorder'; }
/* a save from before equipment: Kaitlyn holds her flute and wears her flannel, with up to
   two of the accessories she'd bought (they used to just work) */
function fitOutKaitlyn(){
  const E=equipOf('kaitlyn'); if('clothes' in E||'weapon' in E) return;
  E.weapon=G.flute||'recorder'; E.clothes='flannel';
  const acc=['polish','kickers','cloth'].filter(k=>G.gear[k]); E.acc1=acc[0]||null; E.acc2=acc[1]||null;
}
const equipOf=id=>G.equip[id]||(G.equip[id]={});
const slotKind=slot=>slot.startsWith('acc')?'acc':slot;
/* what could go in a member's slot: nothing, or anything of that kind they can wear that
   nobody else has on (and isn't in their other accessory slot) */
function equipChoices(id,slot){
  const worn=new Set(); for(const m in G.equip) for(const s in G.equip[m]) if(!(m===id&&s===slot)&&G.equip[m][s]) worn.add(G.equip[m][s]);
  return [null].concat(Object.keys(EQUIP).filter(k=>{ const E=EQUIP[k];
    return E.slot===slotKind(slot)&&(!E.who||E.who.includes(id))&&(!E.own||E.own())&&!worn.has(k); }));
}
/* A on a slot: the next thing that fits, round to nothing */
function cycleEquip(id,slot){
  const L=equipChoices(id,slot), cur=equipOf(id)[slot]||null;
  if(L.length<2){ say("Nothing to wear here yet."); blip(150,.08,.2); return; }
  const nx=L[(L.indexOf(cur)+1)%L.length]; equipOf(id)[slot]=nx; refitMember(id);
  say(nx?PARTY_INFO[id].name+" puts on the "+EQUIP[nx].name+".":PARTY_INFO[id].name+" takes it off."); blip(620,.05,.1,'triangle'); autoSave();
}
const YARD=[
  {id:'bed5',    name:"Till the Back Row", cost:680, desc:"+3 spots in the ground plot"},
  {id:'bed6',    name:"Second Bed Row",    cost:840, desc:"+4 spots in the raised bed"},
  {id:'fountain',name:"Frog Fountain",    cost:520, desc:"+0.2 harmony"},
  {id:'lantern', name:"Stone Lantern",    cost:360, desc:"pests arrive 40% slower"},
  {id:'arch',    name:"Flower Arch",      cost:440, desc:"+15% harvest coins"},
  {id:'trellis', name:"Trellis Kit",      cost:560, desc:"double harmony bonus", gear:true},   /* garden gear (G.gear), sold here*/
  {id:'bath',    name:"Bird Bath",        cost:400, desc:"+10% song growth"},
];
const KICK_SHOUTS=["Hiya!","Take that!","May my boot aim true!","Not in MY garden!",
  "Shoo!","Out you go!","Mind the tomatoes!","Bastard!","I'll kill you!","You coward!",
  "Eat dirt!","Cruisin' for a bruisin'!"];
/* one new song every two levels */
/* Kaitlyn's moves. song: played on the flute (the rhythm game, notes long); hpCost: a
   share of her max HP instead of MP. flavor: what it's like, for descriptions. */
const MOVES=[
  {id:'kick',  name:"Quick Kick",      lv:1, mp:0,  notes:0,  pow:0.55, heal:0, fx:'kick',
   flavor:"A quick, no-nonsense boot to the pest."},
  {id:'sprout',name:"Sprout Strike",   lv:1, mp:3,  notes:4,  pow:1.0,  heal:0, fx:'sprout', song:true,
   flavor:"A peppy tune that makes roots burst up underfoot."},
  {id:'karate',name:"Karate Kick",     lv:10,mp:0,  hpCost:0.1, pow:1.1, heal:0, fx:'kick',
   flavor:"Hi-YAH! She puts her whole heart (and a little of her health) into it."},
  {id:'lull',  name:"Frog Lullaby",    lv:3, mp:4,  notes:4,  pow:0,    heal:16,fx:'lull', song:true,
   flavor:"A croaky little bedtime song. The frogs harmonize, mostly in tune."},
  {id:'waltz', name:"Bramble Waltz",   lv:5, mp:6,  notes:6,  pow:1.3,  heal:0, fx:'waltz', song:true, all:true,
   flavor:"One-two-three, thorns-thorns-thorns! Brambles whirl into the foe."},
  {id:'req',   name:"Wasp Requiem",    lv:7, mp:7,  notes:6,  pow:1.3,  heal:0, fx:'req', weaken:true, song:true,
   flavor:"Summons an angry swarm."},
  {id:'thorn', name:"Thorn Nocturne",  lv:9, mp:9,  notes:8,  pow:2.0,  heal:0, fx:'thorn', song:true, all:true,
   flavor:"A moody midnight melody that grows a forest of thorns."},
  {id:'hymn',  name:"Harvest Hymn",    lv:11,mp:12, notes:10, pow:2.6,  heal:12,fx:'hymn', song:true, all:true,
   flavor:"A golden anthem of plenty: smites the foe and feeds the soul."},
];
/* a move or skill in words: its flavor, then what it does (MP is shown beside it) */
function moveDesc(mv){
  const L=[];
  if(mv.pow>0) L.push((mv.all?"every foe":"one foe")+", power x"+mv.pow);
  if(mv.weaken) L.push("weakens the foe");
  if(mv.heal) L.push("heals the whole party ~"+mv.heal+" HP");
  if(mv.hpCost) L.push("costs "+Math.round(mv.hpCost*100)+"% of max HP");
  const what=L.join(", ");
  return (mv.flavor?mv.flavor+" ":"")+what.charAt(0).toUpperCase()+what.slice(1)+".";
}
/* friends' skills (MP): pow scales with Intelligence; bind: chance the foe loses a turn;
   heal: share of max HP; cure: clears poison, blindness and weakness; burst: x3 if poisoned */
const ALLY_SKILLS={
  bling:[
    {id:'constrict',name:"Constrict",  lv:3, mp:3, pow:0.9, bind:0.6,
     desc:"A big, crushing hug. Not the friendly kind. One foe, power x0.9, may hold it still for a turn."},
    {id:'shed',     name:"Shed Skin",  lv:6, mp:4, heal:0.4, cure:true,
     desc:"Out with the old scales! Heals 40% of HP and cures poison, blindness and weakness."},
    {id:'burst',    name:"Venom Burst",lv:9, mp:6, pow:1.1, burst:true,
     desc:"Wakes up all that venom at once. Ouch. One foe, power x1.1, triple if it's poisoned."},
    {id:'hypno',    name:"Hypnosis",   lv:11,mp:5, sleep:0.75,
     desc:"Look into my eyesss... Puts one foe to sleep for 2-3 turns."},
  ],
  /* Tiny One. mend (one friend) and mendAll (everyone standing) heal that share of their
     own max HP; regen: {n,share}, everyone also gets that share back at the start of each
     of their next n turns; clear: cures one friend's troubles; revive: wakes a friend who's
     down with that share of HP; pecks: that many hits at random foes, power pow from
     Agility; all: hits every foe (power from Intelligence), weak: chance each one's attack drops */
  tiny:[
    {id:'chirp',  name:"Cheery Chirp",  lv:1, mp:3, mend:0.5, song:true,
     desc:"A bright little chirp that perks anyone right up. Heals one friend 50% of their max HP."},
    {id:'peck',   name:"Peck Peck Peck",lv:2, mp:3, pecks:3, pow:0.45,
     desc:"Tiny beak, terrible manners. Three quick pecks at random foes, power x0.45 each from Agility."},
    {id:'clear',  name:"Clear Note",    lv:4, mp:3, clear:true, song:true,
     desc:"One pure, ringing note that shakes off whatever's wrong. Cures all of one friend's troubles."},
    {id:'chorus', name:"Dawn Chorus",   lv:6, mp:7, mendAll:0.3, song:true,
     desc:"The whole morning's worth of birdsong at once. Heals everyone 30% of their max HP."},
    {id:'trill',  name:"Piercing Trill",lv:8, mp:5, pow:0.7, all:true, weak:0.35, song:true,
     desc:"Small bird, very big voice. Every foe, power x0.7, may rattle them so their attacks drop."},
    {id:'nest',   name:"A True Bird's Nest",lv:10,mp:10, mendAll:0.15, regen:{n:3,share:0.15}, song:true,
     desc:"A song about home, and everyone in it. Heals everyone 15% of their max HP, then 15% more at the start of each of their next 3 turns."},
    {id:'wake',   name:"Wake-Up Call",  lv:12,mp:8, revive:0.3, song:true,
     desc:"The loudest, most insistent good morning. Brings a friend who's down back into the fight with 30% of their max HP."},
  ],
};
const FIELD=[
  {id:'reprise',name:"Growth Reprise",lv:4, mp:6, desc:"+20% growth to every plant · once a day",
   flavor:"An encore for the garden. The plants can't help but grow along."},
  {id:'ward',   name:"Pest Ward",     lv:6, mp:8, desc:"drives every pest away",
   flavor:"A shrill, off-putting trill. Pests suddenly remember they left the stove on."},
  {id:'shower', name:"Sun Shower",    lv:8, mp:7, desc:"heals plants · ruined ones sprout again",
   flavor:"Rain and sunshine at once, like the sky can't make up its mind."},
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
/* a pest out in the garden: its battle picture, small, with a little bob (ghosts float) */
/* a pest on the garden map; flip: facing right (the art faces left) */
/* ph: its own phase, so each one bobs in its own steady rhythm */
function drawPestWorld(c,sp,x,y,t,flip,ph){
  const P=PESTS[sp], bob=Math.abs(Math.sin(t/180+(ph||0)))*(P.fly?3:1.5), lift=P.fly?8:0, s=P.boss?0.72:0.36;
  /* its shadow: cast along the ground, or for a flyer a soft patch below it */
  groundShadow(c,cc=>{ if(flip) cc.scale(-1,1); drawEnemyArt(cc,sp,0,0,s); },x,y,P.boss?20:9,lift);
  c.globalAlpha=P.night?.85:1;
  c.save(); if(flip){ c.translate(x,0); c.scale(-1,1); c.translate(-x,0); }
  if(!drawEnemyArt(c,sp,x,y-bob-lift,s)) px(c,x-6,y-8,12,8,P.col);
  c.restore(); c.globalAlpha=1;
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
  /* a fruit tree starts out as the sapling she planted */
  const sap=stage===0&&tree&&CROP_ART['sapling '+SPECIES[sp].name.toLowerCase()];
  const key=sap?'sapling '+SPECIES[sp].name.toLowerCase():stage===0?'sprout':CROP_STAGE[stage]+' '+SPECIES[sp].name.toLowerCase();
  if(drawCropArt(c,key,x,y,CROP_STAGE_SCALE[stage])) return;
  const a=plantArt(sp,stage,tree);
  c.drawImage(a.cv,Math.round(x-a.ox),Math.round(y-a.oy));
}
/* what is left when pests eat a plant's health to zero; cleared with A/J */
function drawRuined(c,x,y,tree){
  if(drawCropArt(c,'damaged',x,y,tree?1.2:1)) return;
  px(c,x-1,y-12,2,12,'#6b5a3a'); px(c,x-6,y-8,5,2,'#8a6a3a'); px(c,x+1,y-10,5,2,'#8a6a3a');
}
/* a small picture of a picked crop (crops/harvest <name>; the grown plant until it has
   one) fitted into a box centred on cx,cy */
function drawCropIcon(c,sp,cx,cy,box){
  const n=SPECIES[sp].name.toLowerCase(), a=CROP_ART['harvest '+n]||CROP_ART['mature '+n];
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
