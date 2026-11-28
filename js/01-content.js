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
const sellPrice=sp=>Math.round(SPECIES[sp].value*(yardOn('arch')?1.15:1));
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
   on the mountain trail; size: drawn bigger or smaller in
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
  saddleback:{name:"Saddleback",hp:47, atk:8, def:4, agi:2,  xp:22, coin:9, min:2, col:'#8fc43a',lv:3,
          about:"Cute little saddle, very rude spines. Do not pet.",skills:[
    {name:"Sting",kind:'hit',pow:1,w:3,st:'poison',p:0.7,fx:'sting'},
    {name:"Spine Burst",kind:'all',pow:0.6,w:2,st:'poison',p:0.3,fx:'spines'}]},
  seagull:{name:"Seagull",      hp:45, atk:7, def:2, agi:12, xp:21, coin:9, min:2, col:'#e8eef4',lv:3,fly:true,
          about:"Miles from any beach and still screaming about chips.",skills:[
    {name:"Peck",kind:'hit',pow:1,w:3,fx:'peck'},
    {name:"Dive Bomb",kind:'hit',pow:1.6,w:2,miss:0.3,fx:'dive'},
    {name:"Snatch",kind:'steal',w:1,fx:'steal'}]},
  ghost  :{name:"Shy Ghost",    hp:47, atk:6, def:2, agi:7,  xp:27, coin:10,min:2, col:'#bfe8e0',night:true,lv:3,fly:true,
          about:"Only comes out after dark. Probably just wants a friend.",skills:[
    {name:"Boo!",kind:'hit',pow:0.5,w:2,st:'scared',p:0.7,fx:'boo'},
    {name:"Chill Touch",kind:'hit',pow:1,w:3,drain:0.5,fx:'chill'},
    {name:"Fade Away",kind:'guard',w:1,fx:'fade'}]},
  crab   :{name:"Hermit Crab",  hp:69, atk:7, def:8, agi:3,  xp:26, coin:10,min:3, col:'#c46a3a',lv:4,
          about:"Lives in a borrowed shell and pinches first, asks later.",skills:[
    {name:"Pinch",kind:'hit',pow:1,w:3,fx:'pinch'},
    {name:"Shell Up",kind:'guard',w:1,fx:'shell'},
    {name:"Claw Crush",kind:'hit',pow:1.5,w:1,fx:'pinch'}]},
  crow   :{name:"Spiteful Crow",hp:57, atk:8, def:3, agi:11, xp:28, coin:11,min:3, col:'#3a5aa8',lv:4,
          about:"Clever, petty and remembers your face. Forever.",skills:[
    {name:"Peck",kind:'hit',pow:1,w:3,fx:'peck'},
    {name:"Mocking Caw",kind:'hit',pow:0.4,w:2,st:'blind',p:0.8,fx:'caw'},
    {name:"Talon Rake",kind:'all',pow:0.7,w:2,fx:'claw'}]},
  raccoon:{name:"Raccoon",      hp:84, atk:12, def:5, agi:8,  xp:36, coin:14,min:4, col:'#8a8f96',lv:6,size:0.7,
          about:"A masked bandit with a gourmet taste for garbage.",skills:[
    {name:"Swipe",kind:'hit',pow:1,w:3,fx:'claw'},
    {name:"Trash Toss",kind:'all',pow:0.75,w:2,fx:'trash'},
    {name:"Snack Break",kind:'heal',heal:0.25,w:1,fx:'snack'}]},
  woo    :{name:"Tricky Woo",   hp:90, atk:13, def:4, agi:13, xp:40, coin:16,min:4, col:'#f4f4f4',lv:7,
          about:"The neighbors' dog. Too fast, too fluffy, too good at puppy eyes.",skills:[
    {name:"Nip",kind:'hit',pow:1,w:3,fx:'bite'},
    {name:"Puppy Eyes",kind:'hit',pow:0,w:2,st:'sleep',p:0.75,fx:'hearts'},
    {name:"Zoomies",kind:'multi',pow:0.6,hits:3,w:2,fx:'zoom'}]},
  vghost :{name:"Vengeful Ghost",hp:110,atk:19,def:4, agi:9,  xp:55, coin:20,min:5, col:'#8ac4f0',night:true,lv:9,fly:true,
          about:"A ghost with a grudge. Something about a lost prize pumpkin.",skills:[
    {name:"Wail",kind:'all',pow:0.8,w:2,st:'scared',p:0.3,fx:'wail'},
    {name:"Spectral Grasp",kind:'hit',pow:1.1,w:3,drain:0.5,fx:'chill'},
    {name:"Curse",kind:'hit',pow:0.5,w:1,st:'weak',p:1,fx:'curse'},
    {name:"Gather Gloom",kind:'charge',w:1,fx:'gloom'}]},
  /* the mountain's own (where:'mountain': never in the garden) */
  goat   :{name:"Mountain Goat",hp:74, atk:10, def:5, agi:10, xp:34, coin:13,min:1, col:'#d8d0c0',lv:5,where:'mountain',
          about:"Will eat your hat, your map and your lunch. Then headbutt you for dessert.",skills:[
    {name:"Headbutt",kind:'hit',pow:1,w:3,fx:'bash'},
    {name:"Bleat",kind:'all',pow:0.3,w:2,st:'scared',p:0.4,fx:'caw'},
    {name:"Ram Charge",kind:'charge',w:1,fx:'gloom'}]},
  boar   :{name:"Wild Boar",    hp:109, atk:14,def:6, agi:6,  xp:46, coin:18,min:1, col:'#6a5040',lv:7,where:'mountain',
          about:"Bristly, grumpy and built like a fridge. Snorts at everything, especially you.",skills:[
    {name:"Gore",kind:'hit',pow:1.1,w:3,fx:'bash'},
    {name:"Tusk Toss",kind:'hit',pow:1.5,w:1,miss:0.25,fx:'claw'},
    {name:"Mud Wallow",kind:'guard',w:1,fx:'shell'}]},
  bear   :{name:"Black Bear",   hp:176,atk:22,def:7, agi:5,  xp:80, coin:30,min:1, col:'#2e2a2a',lv:10,where:'mountain',
          about:"Mostly wants berries and naps. You are standing between it and both.",skills:[
    {name:"Swipe",kind:'hit',pow:1.1,w:3,fx:'claw'},
    {name:"Maul",kind:'hit',pow:1.7,w:1,fx:'bite'},
    {name:"Roar",kind:'all',pow:0.4,w:1,st:'scared',p:0.5,fx:'megaphone'},
    {name:"Honey Break",kind:'heal',heal:0.2,w:1,fx:'snack'}]},
  /* the Deep Forest's own (where:'forest'), past the mountain: Lv.11-16. pack: [min, max] more of
     its kind come with it; packBonus: each packmate still standing makes its hits that much harder;
     furyAt: the share of HP it gets furious at (FURY_AT otherwise); intro/noFlee/outro: a boss's lines;
     back: stands on the back row in battle; one: never more than one in a fight */
  wolf   :{name:"Timber Wolf",  hp:116,atk:21,def:6, agi:13, xp:70, coin:24,min:1, col:'#7a7a80',lv:11,where:'forest',pack:[1,2],packBonus:0.15,
          about:"Never alone. If you see one, count again.",skills:[
    {name:"Bite",kind:'hit',pow:1,w:3,fx:'bite'},
    {name:"Pack Howl",kind:'charge',w:1,fx:'megaphone'},
    {name:"Lunge",kind:'hit',pow:1.5,w:1,fx:'bite'}]},
  turkey :{name:"Wild Turkey",  hp:109,atk:20,def:5, agi:18, xp:68, coin:22,min:1, col:'#8a5a3a',lv:11,where:'forest',
          about:"Thinks it's the apex predator. Is extremely loud about it.",skills:[
    {name:"Peck",kind:'hit',pow:1,w:3,fx:'peck'},
    {name:"Peck Peck Peck",kind:'multi',pow:0.5,hits:3,w:2,fx:'peck'},
    {name:"Gobble",kind:'all',pow:0.3,w:1,st:'scared',p:0.3,fx:'megaphone'},
    {name:"Strut",kind:'guard',w:1,fx:'shell'}]},
  toadstool:{name:"Toadstool Sprite",hp:132,atk:21,def:7,agi:6,xp:76, coin:26,min:1, col:'#d04a3a',lv:12,where:'forest',
          about:"Mushrooms, mushrooms, crawlin' on your body.",skills:[
    {name:"Puff",kind:'hit',pow:0.8,w:3,st:'sleep',p:0.3,fx:'gloom'},
    {name:"Spore Cloud",kind:'all',pow:0.5,w:2,st:'poison',p:0.5,fx:'gloom'},
    {name:"Soak Up Rain",kind:'heal',heal:0.2,w:1,fx:'snack'}]},
  badger :{name:"Honey Badger", hp:162,atk:26,def:10,agi:9,  xp:85, coin:30,min:1, col:'#5a5a5a',lv:12,where:'forest',furyAt:0.5,
          about:"Doesn't care. About anything. Especially you.",skills:[
    {name:"Claw",kind:'hit',pow:1.1,w:3,fx:'claw'},
    {name:"Frenzy",kind:'multi',pow:0.6,hits:3,w:2,fx:'claw'},
    {name:"Dig In",kind:'guard',w:1,fx:'shell'}]},
  owl    :{name:"Great Horned Owl",hp:134,atk:28,def:5,agi:14,xp:90, coin:32,min:1, col:'#8a6a4a',lv:13,where:'forest',night:true,fly:true,
          about:"Asks 'who?' but already knows. It's you.",skills:[
    {name:"Silent Swoop",kind:'hit',pow:1.3,w:3,fx:'dive'},
    {name:"Glare",kind:'hit',pow:0.6,w:2,st:'blind',p:0.5,fx:'caw'},
    {name:"Hoot",kind:'all',pow:0.3,w:1,st:'hush',p:0.4,fx:'caw'}]},
  moose  :{name:"Bull Moose",   hp:252,atk:32,def:12,agi:7,  xp:120,coin:45,min:1, col:'#5a3a2a',lv:14,where:'forest',back:true,one:true,
          about:"Half a ton of bad mood on stilts.",skills:[
    {name:"Hoof",kind:'hit',pow:1,w:3,fx:'kick'},
    {name:"Antler Charge",kind:'hit',pow:1.4,w:2,st:'bound',p:0.3,fx:'zoom'},
    {name:"Stomp",kind:'all',pow:0.6,w:2,st:'weak',p:0.3,fx:'bash'},
    {name:"Bellow",kind:'charge',w:1,fx:'megaphone'}]},
  bigfoot:{name:"Bigfoot",      hp:605,atk:42,def:10,agi:9,  xp:400,coin:150,min:1,col:'#6a4a30',lv:16,where:'forest',boss:true,size:1.5,
          intro:"Bigfoot crashes out of the trees!",noFlee:"Bigfoot blocks the trail!",outro:"Bigfoot vanishes into the trees! ",
          about:"Real. Known as \"Meter\" in Europe.",skills:[
    {name:"Big Slap",kind:'hit',pow:1,w:3,fx:'bash'},
    {name:"Boulder Toss",kind:'hit',pow:1.5,w:2,fx:'bash'},
    {name:"Ground Pound",kind:'all',pow:0.8,w:2,st:'weak',p:0.4,fx:'bash'},
    {name:"Camera Shy",kind:'hide',heal:0.15,w:1,fx:'fade'}]},
  hoa    :{name:"HOA President",intro:"The HOA President demands a word!",noFlee:"The HOA President blocks the gate!",outro:"The HOA President retreats! ",hp:760,acts:2,atk:26,def:6, agi:6,  xp:120,coin:60,min:5, col:'#c9b48a',boss:true,size:1.4,lv:12,
          about:"Clipboard in hand and a bylaw for everything. Even your gnomes.",skills:[
    {name:"Citation",kind:'hit',pow:1.2,w:3,fx:'paper'},
    {name:"Noise Complaint",kind:'all',pow:0.8,w:2,fx:'megaphone'},
    {name:"Fine",kind:'steal',w:1,fx:'steal'},
    {name:"Bylaw Lecture",kind:'hit',pow:0,w:1,st:'sleep',p:0.8,fx:'paper'}]},
};
/* a pest's stats at a level: each level over its species' own (lv) adds a tenth */
/* A pest above its own level grows the way the party does: its HP in step with the party's
   (a straight line), its attack faster (the party's defence and HP both grow, so a hit must
   grow with both to hurt as much: PEST_ATK_CURVE). Its reward grows with its attack. */
const PEST_ATK_CURVE=L=>(4+L)*(18+1.4*L);
function pestStats(sp,lv){
  const P=PESTS[sp], b=P.lv, L=Math.max(b,lv||b), d=L-b, kh=(L+2)/(b+2), ka=PEST_ATK_CURVE(L)/PEST_ATK_CURVE(b);
  return {hp:Math.round(P.hp*kh),atk:P.atk*ka,def:P.def*(1+0.06*d),agi:P.agi+d*0.5,xp:Math.round(P.xp*ka),coin:Math.round(P.coin*kh)};
}
/* the party's level: the average of who's out */
const partyLevel=()=>{ const L=(G.party||[]).map(id=>member(id)&&member(id).lv).filter(Boolean); return L.length?L.reduce((a,v)=>a+v,0)/L.length:1; };
/* The level a new pest turns up at: near the party's (0-2 below), but never below its own and
   at most PEST_LV_REACH above it, so the first garden pests stay small; or its own plus a
   little as the garden grows, whichever is more. */
const PEST_LV_REACH=8;
function pestLevel(sp){
  const b=PESTS[sp].lv, grown=b+ri(0,Math.min(3,Math.floor((G.gardenLv-1)/2)));
  return Math.max(grown,Math.min(Math.round(partyLevel())-ri(0,2),b+PEST_LV_REACH));
}
/* Grumpy pests: now and then (CHAMP_P; never a boss) one turns up in a foul mood, glowing,
   tougher (CHAMP) and worth more, with a better chance of its rare drop (CHAMP_RARE x RARE_P,
   and always its ordinary one) */
const CHAMP_P=0.06, CHAMP={hp:1.8,atk:1.3,def:1.2,reward:2.5}, CHAMP_RARE=4;
const rollChamp=sp=>!PESTS[sp].boss&&Math.random()<CHAMP_P;
/* what each pest may leave behind when it's beaten: [ordinary, rare] (GOODS keys), and
   the chances of each */
const PEST_DROPS={wolf:['wolffur','silverfang'],turkey:['turkeyfeather','wishbone'],toadstool:['puffball','morel'],badger:['badgerbristle','clawcharm'],
  owl:['owlfeather','moonfeather'],moose:['shedantler','velvetantler'],bigfoot:['footprint','blurryphoto'],beetle:['dungball','irishell'],wasp:['paperscrap','royaljelly'],rat:['button','lostring'],saddleback:['bristle','cocoon'],seagull:['gullfeather','stolenfry'],ghost:['ecto','locket'],crab:['shellshard','pearl'],crow:['blackfeather','spoon'],raccoon:['trinket','mask'],woo:['chewball','collar'],vghost:['wisp','ribbon'],goat:['goathair','bell'],boar:['tusk','truffle'],bear:['bearfur','honeycomb'],hoa:['citation','gavel']};
const DROP_P=0.45, RARE_P=0.06;
/* the troubles anyone can be in, with how long they last (turns) and a tag colour */
const STATUS={poison:{name:"Poison",tag:"PSN",col:'#a05ad8',turns:3}, blind:{name:"Blind",tag:"BLD",col:'#5a5a6a',turns:3},
  sleep:{name:"Asleep",tag:"SLP",col:'#5a8ad8',turns:2}, weak:{name:"Weak",tag:"WK",col:'#d88a3a',turns:3},
  hush:{name:"Hushed",tag:"HSH",col:'#8a9ab0',turns:2},      /* no songs or skills (the owl's Hoot) */
  scared:{name:"Scared",tag:"SCR",col:'#6a4aa8',turns:2}, bound:{name:"Bound",tag:"BND",col:'#8a6a3a',turns:1},
  /* Ivy's venom: only pests get it (a fixed amount each turn, from her Intelligence) */
  venom:{name:"Venom",tag:"VNM",col:'#2f7a3a',turns:3}};
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
  /* the finest flute there is: for sale at Rosa's for now, found in a later area one day */
  muramatsu:{name:"Muramatsu",     slot:'weapon',who:['kaitlyn'],cost:10000,desc:"A master's handmade gold flute. +14 Intelligence, +20 max MP, +3 Luck.",own:()=>!!G.gear.muramatsu,stats:FLUTE_INFO.muramatsu.stats},
  fife:    {name:"Bamboo Fife",    slot:'weapon',who:['kaitlyn'],cost:450, desc:"A light little fife. +2 Intelligence, +2 Agility.",own:()=>!!G.gear.fife,stats:FLUTE_INFO.fife.stats},
  /* the others' weapons */
  fangcaps:{name:"Fang Caps",pic:'silver fang caps',slot:'weapon',who:['ivy'],cost:480,desc:"Shiny caps for her fangs. +3 Strength.",own:()=>!!G.gear.fangcaps,stats:{str:3}},
  reedwhistle:{name:"Reed Whistle", slot:'weapon',who:['tiny'],cost:480,desc:"A tiny carved whistle to sing along with. +3 Intelligence, +3 max MP.",own:()=>!!G.gear.reedwhistle,stats:{int:3,mp:3}},
  /* clothes */
  flannel: {name:"Evergreen Flannel",slot:'clothes',who:['kaitlyn'],desc:"Her favorite green plaid shirt. +2 Defense.",own:()=>true,stats:{def:2}},
  overalls:{name:"Garden Overalls",slot:'clothes',who:['kaitlyn'],cost:520,desc:"Sturdy denim with deep pockets. +2 Defense, +2 Strength.",own:()=>!!G.gear.overalls,stats:{def:2,str:2}},
  mosswrap:{name:"Mossy Wrap",     slot:'clothes',who:['ivy'],cost:400,desc:"Soft moss and ivy leaves. +2 Defense, +2 Agility.",own:()=>!!G.gear.mosswrap,stats:{def:2,agi:2}},
  acorncap:{name:"Acorn Cap",      slot:'clothes',who:['tiny'],cost:360,desc:"A little hat just her size. +2 Defense, +5 max HP.",own:()=>!!G.gear.acorncap,stats:{def:2,hp:5}},
  /* accessories (owned once bought: G.gear[key]) */
  polish:  {name:"Flute Polish",   slot:'acc',who:['kaitlyn'],cost:420,desc:"Songs do 30% more damage.",own:()=>!!G.gear.polish},
  cloth:   {name:"Cleaning Cloth", slot:'acc',cost:480,desc:"+8 max MP.",own:()=>!!G.gear.cloth,stats:{mp:8}},
  kickers: {name:"Spiked Boots",pic:'garden boots',slot:'acc',who:['kaitlyn'],cost:380,desc:"Kicks hit 25% harder.",own:()=>!!G.gear.kickers},
  fangpolish:{name:"Fang Polish",  slot:'acc',who:['ivy'],cost:450,desc:"Ivy's Venom Bite hits 50% harder.",own:()=>!!G.gear.fangpolish},
  scalecharm:{name:"Scale Charm",  slot:'acc',cost:380,desc:"+3 Defense.",own:()=>!!G.gear.scalecharm,stats:{def:3}},
  bell:    {name:"Silver Bell",    slot:'acc',who:['tiny'],cost:520,desc:"Tiny One's Tweet and healing songs heal 20% more.",own:()=>!!G.gear.bell},
  scarf:   {name:"Downy Scarf",    slot:'acc',cost:400,desc:"+10 max HP.",own:()=>!!G.gear.scarf,stats:{hp:10}},
  clover:  {name:"Four-Leaf Clover",slot:'acc',cost:300,desc:"+4 Luck.",own:()=>!!G.gear.clover,stats:{luk:4}},
  /* Tituba's and Tex's (sold at Juniper's) */
  clawtips:{name:"Silver Claw Tips",slot:'weapon',who:['tituba'],cost:520,desc:"Sharp little silver tips. +4 Strength, more critical hits.",own:()=>!!G.gear.clawtips,stats:{str:4}},
  ribbon:  {name:"Velvet Ribbon",  slot:'clothes',who:['tituba'],cost:420,desc:"A soft ribbon with a bow. +1 Defense, +4 Agility.",own:()=>!!G.gear.ribbon,stats:{def:1,agi:4}},
  catnip:  {name:"Catnip Sachet",  slot:'acc',who:['tituba'],cost:450,desc:"Focus charges her next hit to x2.5 instead of x2.",own:()=>!!G.gear.catnip},
  moonstone:{name:"Moonstone Collar",slot:'acc',who:['tituba'],cost:600,desc:"+4 Luck, and a 10% chance to dodge a pest's hit.",own:()=>!!G.gear.moonstone,stats:{luk:4}},
  dentures:{name:"Wooden Dentures",slot:'weapon',who:['tex'],cost:480,desc:"Someone's old wooden false teeth. +4 Strength, and pests go for him more.",own:()=>!!G.gear.dentures,stats:{str:4}},
  mossshell:{name:"Mossy Shell Cover",slot:'clothes',who:['tex'],cost:520,desc:"A cozy coat of moss for his shell. +3 Defense, +12 max HP.",own:()=>!!G.gear.mossshell,stats:{def:3,hp:12}},
  sunstone:{name:"Sun-Warmed Stone",slot:'acc',who:['tex'],cost:500,desc:"Mends 5% of his max HP at the start of each of his turns.",own:()=>!!G.gear.sunstone},
  shellpolish:{name:"Shell Polish", slot:'acc',who:['tex'],cost:450,desc:"+2 Defense, and he takes 30% less while covering someone.",own:()=>!!G.gear.shellpolish,stats:{def:2}},
  /* found, not bought: rare drops in the Deep Forest (the first one found is kept to wear) */
  silverfang:{name:"Silver Wolf Fang",pic:'silver fang',slot:'weapon',who:['ivy'],desc:"A wolf's silver fang, fitted for Ivy. +7 Strength, +3 Luck.",own:()=>!!G.gear.silverfang,stats:{str:7,luk:3}},
  clawcharm:{name:"Claw Charm",    slot:'acc',desc:"A badger's claw on a cord. +5 Strength.",own:()=>!!G.gear.clawcharm,stats:{str:5}},
  wishbone:{name:"Golden Wishbone",slot:'acc',desc:"Make a wish. +12 Luck.",own:()=>!!G.gear.wishbone,stats:{luk:12}},
  moonfeather:{name:"Moonlit Feather",slot:'acc',desc:"Hits 25% harder at night.",own:()=>!!G.gear.moonfeather},
};
/* its picture (shop items/<name>; pic: when it was renamed since), and its description,
   which starts with whose it is when only one of them can wear it ("Tex only.") */
const equipPic=k=>EQUIP[k].pic||EQUIP[k].name.toLowerCase();
const equipDesc=k=>{ const E=EQUIP[k]; return (E.who&&E.who.length===1?PARTY_INFO[E.who[0]].name+" only. ":"")+E.desc; };
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
/* put k (an EQUIP key, or null for nothing) in one of a member's slots */
function wearEquip(id,slot,k){
  const cur=equipOf(id)[slot]||null; if(k===cur) return;
  equipOf(id)[slot]=k; refitMember(id);
  say(k?PARTY_INFO[id].name+" puts on the "+EQUIP[k].name+".":PARTY_INFO[id].name+" takes off the "+EQUIP[cur].name+".");
  if(!(sfx('equip')>0)) sfx('menu_confirm');            /* (sfx/equip.wav, once it's recorded) */
  autoSave();
}
/* what a piece of equipment adds, in short: "+3 Int  +4 MP" */
const equipStats=k=>{ const s=k&&EQUIP[k].stats||{}; return Object.keys(s).map(st=>(s[st]>0?"+":"")+s[st]+" "+(st==='hp'||st==='mp'?st.toUpperCase():STAT_NAME[st].slice(0,3))).join("  "); };
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
  /* Karate Kick first, before the songs, so it reads as a move of its own */
  {id:'karate',name:"Karate Kick",     lv:10,mp:0,  hpCost:0.1, pow:1.1, heal:0, fx:'kick',
   flavor:"Hi-YAH! She puts her whole heart (and a little of her health) into it."},
  {id:'sprout',name:"Sprout Strike",   lv:1, mp:3,  notes:4,  pow:0.9,  heal:0, fx:'sprout', song:true, weak:0.75,
   flavor:"A peppy tune that makes roots burst up underfoot."},
  {id:'lull',  name:"Frog Lullaby",    lv:3, mp:4,  notes:4,  pow:0,    heal:0.25,fx:'lull', song:true,
   flavor:"A croaky little bedtime song. The frogs harmonize, mostly in tune."},
  {id:'waltz', name:"Bramble Waltz",   lv:5, mp:6,  notes:6,  pow:1.5,  heal:0, fx:'waltz', song:true, bind:0.25,
   flavor:"One-two-three, thorns-thorns-thorns! Brambles whirl into the foe."},
  {id:'req',   name:"Wasp Requiem",    lv:7, mp:7,  notes:6,  pow:1.2,  heal:0, fx:'req', song:true, all:true, poison:0.75,
   flavor:"Summons an angry swarm."},
  {id:'thorn', name:"Thorn Nocturne",  lv:9, mp:9,  notes:8,  pow:0.5,  heal:0, fx:'thorn', song:true, hits:5,
   flavor:"A moody midnight melody that grows a forest of thorns."},
  {id:'hymn',  name:"Harvest Hymn",    lv:11,mp:12, notes:10, pow:2.0,  heal:0.25,fx:'hymn', song:true, all:true,
   flavor:"A golden anthem of plenty: smites the foe and feeds the soul."},
];
/* Pep Rally songs. Kaitlyn learns them once she has a friend to fight beside (pepKnown),
   and more as friends join and when she finds the Muramatsu (learn). The Pep meter
   (G.pep, out of PEP_MAX) fills as the party takes hits, from fight to fight; when it's
   full she can play one after the last friend has chosen their move: a short rhythm game
   (song: its own recording; sec [from, to] in seconds would play just a stretch of it) before anyone moves,
   as strong as it's played. pow: a hit on every foe (from Intelligence, like her songs);
   bindAll: each foe may be Bound; cureAll: the party's troubles go; heal: a share of
   everyone's max HP back; chargeAll: everyone's
   next hit is doubled; shieldAll: no damage to the party this round. */
const PEP_MAX=100;
const PEP_SONGS=[
  {id:'rally', name:"Rally Cry",      song:'Rally Cry', pow:1.6, learn:()=>true,
   desc:"Everyone cheers, and the pests feel it. A hit on every foe."},
  {id:'tangle',name:"Tangleroot Reel",song:'Tangleroot Reel', pow:0.8, bindAll:true, learn:()=>!!G.allies.ivy,
   desc:"A twisty jig that whips roots around the pests. A hit on every foe, and each may be Bound for a turn."},
  {id:'clean', name:"Clean Slate",    song:'Clean Slate', cureAll:true, heal:0.25, learn:()=>!!G.allies.tiny,
   desc:"A bright, clear tune that shakes off every trouble on the whole party and heals everyone 25% of their max HP."},
  {id:'hype',  name:"Hype Up",        song:'Hype Up', chargeAll:true, learn:()=>!!G.allies.tituba,
   desc:"Everyone's fired up: each one's next hit is twice as hard."},
  {id:'safe',  name:"Safe and Sound", song:'Safe and Sound', shieldAll:true, learn:()=>!!G.allies.tex,
   desc:"A slow, steady song like a shell around everyone. No one takes any damage this turn."},
  {id:'finale',name:"Grand Finale",   song:'Grand Finale', pow:3.2, learn:()=>!!G.gear.muramatsu,
   desc:"Everything she's got, on the finest flute there is. A huge hit on every foe."},
];
const pepKnown=()=>Object.keys(G.allies).length>0;
const pepSongs=()=>PEP_SONGS.filter(s=>s.learn());
/* a move or skill in words: its flavor, then what it does (MP is shown beside it).
   Songs: heal is a share of everyone's max HP; hits: that many hits at random foes;
   weak, bind, poison: the chance of each on every foe it hits */
function moveDesc(mv){
  const L=[], pct=p=>Math.round(p*100)+"%";
  if(mv.pow>0) L.push((mv.hits?mv.hits+" hits at random foes":mv.all?"every foe":"one foe")+", power x"+mv.pow+(mv.hits?" each":""));
  if(mv.weak) L.push(pct(mv.weak)+" chance to weaken");
  if(mv.bind) L.push(pct(mv.bind)+" chance to bind");
  if(mv.poison) L.push(pct(mv.poison)+" chance to poison each one");
  if(mv.heal) L.push("heals the whole party "+pct(mv.heal)+" of their max HP");
  if(mv.hpCost) L.push("costs "+Math.round(mv.hpCost*100)+"% of max HP");
  const what=L.join(", ");
  return (mv.flavor?mv.flavor+" ":"")+what.charAt(0).toUpperCase()+what.slice(1)+".";
}
/* friends' skills (MP): pow scales with Intelligence; bind: chance the foe loses a turn;
   heal: share of max HP; cure: clears poison, blindness and weakness; burst: x3 if the
   foe has Venom, x2 if Poison (x6 with both), and uses them up; scare: chance one foe is
   scared; spit: the chance of each of poison, venom and blindness on every foe hit */
const ALLY_SKILLS={
  ivy:[
    {id:'constrict',name:"Constrict",  lv:3, mp:3, pow:0.9, bind:0.6,
     desc:"A big, crushing hug. Not the friendly kind. One foe, power x0.9, may hold it still for a turn."},
    {id:'sss',      name:"Ssssss",     lv:5, mp:3, scare:1,
     desc:"She rears up and hisses her very scariest hiss. One foe is scared."},
    {id:'shed',     name:"Shed Skin",  lv:6, mp:4, heal:0.4, cure:true,
     desc:"Out with the old scales! Heals 40% of HP and cures poison, blindness and weakness."},
    {id:'spit',     name:"Snakespit",  lv:9, mp:8, pow:0.55, all:true, stat:'str', spit:0.5,
     desc:"Ptoo! A spray of venom over every foe, about as hard as her bite. Each one may be poisoned, envenomed or blinded (50% each)."},
    {id:'hypno',    name:"Hypnosis",   lv:11,mp:5, sleep:0.75,
     desc:"Look into my eyesss... Puts one foe to sleep for 2-3 turns."},
    {id:'burst',    name:"Venom Burst",lv:12,mp:10, pow:1.1, burst:true,
     desc:"Wakes up all that venom at once. Ouch. One foe, power x1.1: triple if it has Venom, double if Poison, six times with both. Uses them up."},
    {id:'deathroll',name:"Deathroll", lv:14,mp:14, pow:1.4, stat:'str', deathroll:true, rollHeal:0.3,
     desc:"She coils tight and spins. A sleeping foe never wakes up (a boss takes six times the damage), and Ivy gets back 30% of her HP. Awake, a crushing hit, power x1.4 from Strength."},
  ],
  /* Tiny One (fieldUse: can be sung from the menu's Skills page too, to the same effect).
     mend (one friend) and mendAll (everyone standing) heal that share of their
     own max HP; regen: {n,share}, everyone also gets that share back at the start of each
     of their next n turns; clear: cures one friend's troubles; revive: wakes a friend who's
     down with that share of HP (or fills a friend who's up to full HP); pecks: that many hits at random foes, power pow from
     Agility; all: hits every foe (power from Intelligence), weak: chance each one's attack drops */
  tiny:[
    {id:'chirp',  name:"Cheery Chirp",  lv:1, mp:3, mend:0.5, song:true, fieldUse:true,
     desc:"A bright little chirp that perks anyone right up. Heals one friend 50% of their max HP."},
    {id:'peck',   name:"Peck Peck Peck",lv:2, mp:3, pecks:3, pow:0.5,
     desc:"Tiny beak, terrible manners. Three quick pecks at random foes, power x0.5 each from Agility."},
    {id:'clear',  name:"Clear Note",    lv:4, mp:3, clear:true, song:true,
     desc:"One pure, ringing note that shakes off whatever's wrong. Cures all of one friend's troubles."},
    {id:'chorus', name:"Dawn Chorus",   lv:6, mp:7, mendAll:0.3, song:true, fieldUse:true,
     desc:"The whole morning's worth of birdsong at once. Heals everyone 30% of their max HP."},
    {id:'trill',  name:"Disarming Trill",lv:8, mp:5, pow:0.7, all:true, weak:0.75, song:true,
     desc:"Small bird, very big voice. Every foe, power x0.7, and a 75% chance each one is weakened."},
    {id:'nest',   name:"A True Bird's Nest",lv:10,mp:10, mendAll:0.15, regen:{n:3,share:0.15}, song:true,
     desc:"A song about home, and everyone in it. Heals everyone 15% of their max HP, then 15% more at the start of each of their next 3 turns."},
    {id:'wake',   name:"Wake-Up Call",  lv:12,mp:8, revive:0.3, song:true, fieldUse:true,
     desc:"The loudest, most insistent good morning. Brings a friend who's down back into the fight with 30% of their max HP, or fills a friend who's still up to full HP."},
  ],
  /* Tituba. stat: the stat a skill's power comes from (Intelligence if not given; Strength
     and Defense hits are physical, so Defense softens them fully); crit: added chance of a
     critical hit; weakAll, scareAll: chance each foe is weakened, scared; steal: tries to
     steal from the foe (see stealChance); full: pecks at full power (x1.5 like a single
     hit); night: power multiplied at night */
  tituba:[
    {id:'snitch',  name:"Snitch",         lv:1, mp:0, steal:true,
     desc:"Now you see it, now it's hers. Tries to steal an item from one foe (better with Luck and Agility)."},
    {id:'pounce',  name:"Pounce",         lv:1, mp:3, pow:1.2, stat:'str', crit:0.25,
     desc:"Wiggle, wiggle... leap! One foe, power x1.2 from Strength, with a big chance of a critical hit."},
    {id:'hiss',    name:"Hiss",           lv:3, mp:3, weakAll:0.5, scareAll:0.5,
     desc:"Ears back, fur up, very rude noise. Each foe may be scared (50%) and weakened (50%)."},
    {id:'swipes',  name:"Fury Swipes",    lv:6, mp:5, pecks:4, pow:0.5, stat:'str',
     desc:"A blur of claws. Four slashes at random foes, power x0.5 each from Strength."},
    {id:'ninelives',name:"Nine Lives",    lv:9, mp:6, heal:0.35, cure:true,
     desc:"A cat always lands on her feet. Heals 35% of her HP and shakes off poison, blindness and weakness."},
    {id:'moonslash',name:"Moonlight Slash",lv:11,mp:9, pow:1.0, all:true, stat:'str', crit:0.15, night:1.25,
     desc:"One silver arc under the moon. Every foe, power x1.0 from Strength, with more critical hits. 25% stronger at night."},
    {id:'dswipe',  name:"Double Swipe",   lv:12,mp:10, pecks:2, pow:1.1, stat:'str', full:true, steal:true,
     desc:"Swipe, swipe, and something shiny's gone. Two hits at random foes, power x1.1 each from Strength, each trying to steal."},
  ],
  /* Tex. shell: hits on him are quartered until his next turn; cover: until his next turn
     he takes the hits aimed at the friend he picks (braced); coverAll: at everyone;
     graze: he mends himself at the start of each of his next n turns (like the Nest) */
  tex:[
    {id:'shell',   name:"Shell Up",       lv:1, mp:2, shell:true,
     desc:"In he goes. Hits on Tex do a quarter of the damage until his next turn."},
    {id:'cover',   name:"Cover",          lv:3, mp:3, cover:true,
     desc:"He plods in front of a friend. Until his next turn, hits meant for them hit Tex instead, and he's braced."},
    {id:'steady',  name:"Slow and Steady",lv:6, mp:6, guardAll:true,
     desc:"A calm old voice: no rush, no panic. Hits on everyone are halved until their next turn."},
    {id:'slam',    name:"Shell Slam",     lv:9, mp:6, pow:1.4, stat:'def',
     desc:"All that shell, all at once. One foe, power x1.4 from Defense."},
    {id:'graze',   name:"Graze",          lv:11,mp:5, graze:{n:3,share:0.15},
     desc:"A slow, thoughtful munch on some grass. Tex gets back 15% of his max HP at the start of each of his next 3 turns."},
    {id:'vitashell',name:"VitaShell",     lv:12,mp:9, coverAll:true,
     desc:"The biggest, bravest shell there ever was. Until his next turn, hits meant for anyone else hit Tex instead, and he's braced."},
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
/* the warm, pulsing glow behind a grumpy pest (r: its size, about half its height) */
function champAura(c,x,y,r,t){
  const a=0.42+0.18*Math.sin(t/260), g=c.createRadialGradient(x,y,0,x,y,r*1.6);
  g.addColorStop(0,'rgba(255,120,60,'+a+')'); g.addColorStop(0.55,'rgba(255,70,40,'+a*0.45+')'); g.addColorStop(1,'rgba(255,60,30,0)');
  c.save(); c.globalCompositeOperation='lighter'; c.fillStyle=g; c.beginPath(); c.arc(x,y,r*1.6,0,7); c.fill(); c.restore();
}
/* flyers that walk on the ground on the map (still flying in battle): the seagull hops around after food */
const MAP_WALKERS=['seagull'];
function drawPestWorld(c,sp,x,y,t,flip,ph,moving,champ){
  /* (one with animations walks while it moves, and stands in its battle stance while it stops to chew, instead of bobbing;
     a flyer that walks on the map, the seagull, stands still on its first walking frame instead, on the ground) */
  const P=PESTS[sp], onFoot=MAP_WALKERS.includes(sp), walk=enemyAnim(sp,'walk');
  const pose=walk?(moving===false?(onFoot?{kind:'walk',f:0}:{kind:'stance',t:t+(ph||0)*1000}):{kind:'walk',t:t+(ph||0)*1000}):null;
  const fly=P.fly&&!onFoot, bob=walk?0:Math.abs(Math.sin(t/180+(ph||0)))*(fly?3:1.5), lift=fly?8:0, s=P.boss?0.72:0.36;
  /* its shadow: cast along the ground, or for a flyer a soft patch below it */
  groundShadow(c,cc=>{ if(flip) cc.scale(-1,1); drawEnemyArt(cc,sp,0,0,s,pose); },x,y,P.boss?20:9,lift);
  if(champ&&c===b){ champAura(c,x,y-bob-lift-8,14,t);          /* a grumpy one glows, edged in red */
    champOutline(cc=>{ if(flip) cc.scale(-1,1); drawEnemyArt(cc,sp,0,0,s,pose); },x,y-bob-lift,0.65+0.25*Math.sin(t/260)); }
  c.globalAlpha=P.night?.85:1;
  c.save(); if(flip){ c.translate(x,0); c.scale(-1,1); c.translate(-x,0); }
  drawEnemyArt(c,sp,x,y-bob-lift,s,pose);
  c.restore(); c.globalAlpha=1;
}

/* ---------------- painted crops, soil and stand (assets/sprites/crops.png) ----------------
   Stage 0 is the shared sprout, 1 a smaller baby, 2 the baby, 3 mature (fruit trees are
   built larger). */
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
  drawCropArt(c,key,x,y,CROP_STAGE_SCALE[stage]);
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
/* a plant's meter: its growth (the bar), and under it its health (0..100) in a thin second
   bar, green to orange to red, blinking when nearly gone. A bar that's completely full is a
   soft blue, like the light part of the menu windows (a ripe plant's glows). Soft rounded
   pills over a see-through backing, each with a little shine along its top. */
function pill(c,x,y,w,h,fill){ if(w<=0) return; c.fillStyle=fill; c.beginPath(); c.roundRect(x,y,Math.max(w,h),h,h/2); c.fill(); }
const shade=(c,y,h,top,bot)=>{ const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,top); g.addColorStop(1,bot); return g; };
const FULL_BAR=['#c8d4ff','#6a88dc'];
function drawMeter(c,cx,cy,pct,ready,health){
  const w=26, hasHp=health!==undefined, x0=cx-w/2, full=ready||pct>=1;
  c.save();
  pill(c,x0-2,cy-2,w+4,hasHp?10.5:8,'rgba(24,16,10,0.42)');               /* the backing */
  pill(c,x0,cy,w,4,'rgba(255,255,255,0.14)');                              /* the empty track */
  if(full){ if(ready){ c.shadowColor='rgba(170,200,255,'+(0.55+0.35*Math.sin(Date.now()/240))+')'; c.shadowBlur=4; }
    pill(c,x0,cy,w,4,shade(c,cy,4,...FULL_BAR)); c.shadowBlur=0; }
  else { const fw=w*clamp(pct,0,1); if(fw>0) pill(c,x0,cy,fw,4,shade(c,cy,4,'#b8ec7a','#5aa83a')); }
  pill(c,x0+1,cy+0.6,(full?w:w*clamp(pct,0,1))-2,1.1,'rgba(255,255,255,0.45)');   /* the shine */
  if(hasHp){ const h=clamp(health/100,0,1), col=h>=1?FULL_BAR:h>0.6?['#d8f070','#9ac83a']:h>0.3?['#ffc070','#e08a30']:['#ff8a70','#d8402e'];
    pill(c,x0,cy+5.2,w,2.6,'rgba(255,255,255,0.12)');
    if(h>0.2||Math.floor(Date.now()/250)%2) pill(c,x0,cy+5.2,Math.max(2.6,w*h),2.6,shade(c,cy+5.2,2.6,...col)); }
  c.restore();
}
/* Kaitlyn's MP as she soaks in the pool: a bar like a plant's, in blue, glowing when full */
function drawMpMeter(c,cx,cy,pct){
  const w=30, x0=cx-w/2, full=pct>=1;
  c.save();
  pill(c,x0-2,cy-2,w+4,8,'rgba(10,18,40,0.5)');
  pill(c,x0,cy,w,4,'rgba(255,255,255,0.14)');
  if(full){ c.shadowColor='rgba(150,210,255,'+(0.55+0.35*Math.sin(Date.now()/240))+')'; c.shadowBlur=5; }
  const fw=w*clamp(pct,0,1); if(fw>0) pill(c,x0,cy,fw,4,shade(c,cy,4,'#b8e8ff','#3a8ae8'));
  c.shadowBlur=0;
  if(fw>2) pill(c,x0+1,cy+0.6,fw-2,1.1,'rgba(255,255,255,0.5)');      /* the shine */
  c.restore();
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
