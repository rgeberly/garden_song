/* ================================================================
   STATE
   ================================================================ */
const G={
  scene:'title',
  player:{x:338,y:396,dir:4,animT:0,walkT:0,idleT:0,moving:false,hp:30,maxhp:30,mp:12,lv:1,xp:0,next:60},
  coins:60, gardenLv:1, gardenXp:0, gardenNext:60, harvests:0,
  seeds:{strawberry:3,tomato:2,sunflower:2},
  unlocked:['strawberry','tomato','sunflower'],
  gear:{}, yard:{}, flute:'recorder',
  crops:{},                                 /* harvested, not yet sold or eaten */
  coffeeT:0, swim:false, mpTick:0, wildT:4000,
  snackT:0, calmT:0, lureT:0,               /* timed effects from eating crops (ms) */
  pests:[], pestTimer:9000, mtnPests:[],   /* pests in the garden, and on the mountain trail */
  msg:'', msgT:0, frogT:0, t:0, code:'',
  clock:6*60, day:1, indoors:false,      /* game minutes since midnight; see 14-daytime.js */
  party:['kaitlyn'], allies:{},          /* who fights (up to PARTY_MAX); allies' own stats */
  story:{},                              /* how far each story has got; see 16-story.js */
  daily:{},                              /* once-a-day things: the day each was last done */
  area:'garden', goods:{}, gearOff:{},              /* where she is (17-places.js); things gathered and caught */
  diff:'normal',                         /* DIFFICULTY, from the Settings tab */
  slot:1,                                /* which save slot this game lives in */
  lore:{beat:{},fish:{}},                /* pests beaten (times) and fish caught ({n,best cm}), for the Lore tab */
  rod:0,                                 /* which rod and reel she has (RODS in 18-fishing.js; 0: none yet) */
  runMode:'hold', runOn:false,           /* how B runs (with the Sturdy Boots): RUN_MODES */
  sheets:[],                             /* practice songs bought as sheet music (PRACTICE_SONGS ids) */
  names:{},                              /* names the player has given (id: name) */
};
/* Difficulty: spawn scales how often pests turn up on the map, hp and atk their HP and
   attack in battle. */
const DIFFICULTY={
  easy:  {name:"Easy",  spawn:0.75,hp:1,  atk:0.75,about:"Pests turn up a quarter less often and hit a quarter softer."},
  normal:{name:"Normal",spawn:1,   hp:1,  atk:1,   about:"The garden as it was meant to be."},
  hard:  {name:"Hard",  spawn:1,   hp:1.5,atk:1.5, about:"Pests have half again as much HP and hit half again as hard."}};
const DIFF_ORDER=['easy','normal','hard'];
/* Running (with the Sturdy Boots on, twice walking speed): hold B to run, hold B to walk, or B switches */
const RUN_MODES={hold:"Hold B to run",walk:"Hold B to walk",toggle:"B switches"}, RUN_ORDER=['hold','walk','toggle'];
const runWanted=()=>{ const held=btnBHeld||keys['h']||keys['escape']||keys['shift'];
  return G.runMode==='walk'?!held:G.runMode==='toggle'?G.runOn:held; };
const running=()=>gearOn('boots')&&!G.swim&&runWanted();
const diff=()=>DIFFICULTY[G.diff]||DIFFICULTY.normal;
/* the equipped flute's power (FLUTE_INFO) */
const fluteMul=()=>(FLUTE_INFO[G.flute||'recorder']||{mul:1}).mul;
/* an accessory works when it's owned and not switched off in the Gear tab */
const gearOn=id=>!!G.gear[id]&&!G.gearOff[id];
const moveList=()=>MOVES.filter(mv=>mv.lv<=G.player.lv);
const fieldList=()=>FIELD.filter(f=>f.lv<=G.player.lv);
const growingCount=()=>plots.filter(p=>active(p)&&p.sp&&p.stage<3).length;
function harmony(){
  const n=growingCount(), per=gearOn('trellis')?0.24:0.12;
  let h=Math.min(gearOn('trellis')?2.6:1.8,1+Math.max(0,n-1)*per);
  if(G.yard.fountain) h+=0.2;
  return h;
}
function say(t){ G.msg=t; G.msgT=2900; }
/* ---------- party ----------
   Kaitlyn's stats live in G.player; friends who join keep theirs in G.allies (all of
   them, out or not), and G.party is who is out with her: Kaitlyn first, up to
   PARTY_MAX. Stats come from the level: base at Lv.1 plus grow for each level after.
   Strength powers plain attacks, Agility decides turn order, Defense softens hits,
   Intelligence powers songs and skills, Luck brings seeds and bonus coins.
   skills: what the second battle command is called for them; attack/pow: their free hit. */
const PARTY_MAX=5, HURT_DAYS=2;
const STATS=['hp','mp','str','agi','def','int','luk'];
const STAT_NAME={hp:"HP",mp:"MP",str:"Strength",agi:"Agility",def:"Defense",int:"Intelligence",luk:"Luck"};
const PARTY_INFO={
  kaitlyn:{name:"Kaitlyn", skills:"Skills", attack:"Quick Kick", pow:0.55, role:"Gardener · plays the flute · talks to her tomatoes, and they listen",
           base:{hp:30,mp:16,str:6,agi:6,def:4,int:7,luk:5}, grow:{hp:6,mp:2,str:2,agi:1.4,def:1.3,int:2,luk:1}},
  bling:  {name:"Ivy",     skills:"Skills", attack:"Venom Bite", pow:0.55, role:"Ring-necked snake · venomous bite · small, shy, and secretly very brave",
           base:{hp:24,mp:8,str:3,agi:9,def:3,int:5,luk:7}, grow:{hp:4,mp:1.5,str:1,agi:2,def:1,int:1.5,luk:1.5}},
  /* the healer: his free move is a Tweet that heals everyone (tweet: share of their max HP) */
  tiny:   {name:"Tiny One",skills:"Songs",  attack:"Tweet", pow:0, tweet:0.05, role:"Little brown bird · sings to heal · hatched by the fireplace, raised on worms",
           base:{hp:20,mp:14,str:2,agi:10,def:2,int:8,luk:6}, grow:{hp:3.5,mp:2.4,str:0.6,agi:1.8,def:0.8,int:2.2,luk:1.2}},
};
/* names: the ones they start with, and any the player has given them */
const BORN_NAMES={}; for(const id in PARTY_INFO) BORN_NAMES[id]=PARTY_INFO[id].name;
function applyNames(){ for(const id in PARTY_INFO) PARTY_INFO[id].name=(G.names&&G.names[id])||BORN_NAMES[id]; }
function renameMember(id){
  const v=prompt("A new name for "+PARTY_INFO[id].name+":",PARTY_INFO[id].name);
  if(v===null) return;
  const n=v.trim().slice(0,12);
  if(!n){ say("Names can't be blank."); return; }
  G.names[id]=n; applyNames(); say("From now on, "+n+"!"); autoSave();
}
const member=id=>id==='kaitlyn'?G.player:G.allies[id];
function statOf(id,k,lv){ const I=PARTY_INFO[id]; lv=lv||member(id).lv;
  return Math.floor(I.base[k]+I.grow[k]*(lv-1)+1e-9); }
const maxMp=()=>statOf('kaitlyn','mp')+(gearOn('cloth')?8:0);
const memberMaxMp=id=>id==='kaitlyn'?maxMp():statOf(id,'mp');
/* hurt in battle: home recovering, can't go out until HURT_DAYS later */
const isHurt=id=>id!=='kaitlyn'&&!!G.allies[id]&&G.allies[id].hurtUntil>G.day;
/* lv: the level they join at; by default two under Kaitlyn's, so a new friend can keep up */
function joinParty(id,lv){
  lv=lv||Math.max(1,G.player.lv-2);
  if(!G.allies[id]){ const hp=statOf(id,'hp',lv); G.allies[id]={lv,xp:0,next:xpNeed(lv),hp,maxhp:hp,mp:statOf(id,'mp',lv),hurtUntil:0}; }
  if(!G.party.includes(id)&&G.party.length<PARTY_MAX) G.party.push(id);
}
/* send a friend out with Kaitlyn, or back home (returns false if they can't go) */
function toggleParty(id){
  if(id==='kaitlyn') return false;
  if(G.party.includes(id)){ G.party=G.party.filter(x=>x!==id); return true; }
  if(isHurt(id)||G.party.length>=PARTY_MAX) return false;
  G.party.push(id); return true;
}
/* EXP needed to go from level lv to the next */
const xpNeed=lv=>Math.round(60*Math.pow(1.45,lv-1));
/* what a member learns on reaching a level (names) */
function learnedAt(id,lv){
  return skillBook(id).filter(s=>s.lv===lv).map(s=>s.name);
}
/* every skill a member has or will have, in order: {name,lv,mp,desc,field?} */
function skillBook(id){
  if(id==='kaitlyn') return MOVES.filter(mv=>mv.id!=='kick').map(mv=>({...mv,desc:moveDesc(mv)}))
    .concat(FIELD.map(f=>({...f,field:true,song:true,desc:f.flavor+" Field song: "+f.desc+"."})))
    .sort((a,z)=>a.lv-z.lv);
  return (ALLY_SKILLS[id]||[]);
}
/* Level-ups wait on G.lvUps for the level-up screen (shown when back in the garden). */
const LV_UPS=[];
function addXpTo(id,n){
  const M=member(id);
  M.xp+=n;
  while(M.xp>=M.next){
    M.xp-=M.next; const from=M.lv; M.lv++; M.next=xpNeed(M.lv);
    const gains={}; STATS.forEach(k=>{ const d=statOf(id,k,M.lv)-statOf(id,k,from); if(d) gains[k]=d; });
    M.maxhp=statOf(id,'hp');           /* HP and MP are not refilled: that's for sleep, frogs and the pool */
    LV_UPS.push({id,from,lv:M.lv,gains,learned:learnedAt(id,M.lv)});
    if(AC){flute(14,AC.currentTime,.3,.7);flute(18,AC.currentTime+.12,.4,.7);flute(21,AC.currentTime+.24,.6,.7);}
  }
}
/* EXP from the garden and the music stand goes to everyone in the party, so friends keep up */
const addXp=n=>G.party.forEach(id=>addXpTo(id,n));
const xpEach=n=>"+"+n+" EXP"+(G.party.length>1?" each":"");
function addGardenXp(n){
  G.gardenXp+=n;
  while(G.gardenXp>=G.gardenNext){
    G.gardenXp-=G.gardenNext; G.gardenLv++;
    G.gardenNext=Math.floor(G.gardenNext*1.5);
    const nx=UNLOCK_ORDER.find(s=>!G.unlocked.includes(s));
    if(nx){ G.unlocked.push(nx); G.seeds[nx]=(G.seeds[nx]||0)+1;
      say("Garden Lv."+G.gardenLv+"! "+SPECIES[nx].name+" now in the shop."); }
    else say("Garden reached Lv."+G.gardenLv+"!");
  }
}
/* ---------- save ---------- */
function saveObj(){
  return {v:7,p:[G.player.lv,G.player.xp,G.player.next,G.player.hp,G.player.maxhp,G.player.mp,
    Math.round(G.player.x),Math.round(G.player.y)],
    c:G.coins,g:[G.gardenLv,G.gardenXp,G.gardenNext,G.harvests],
    s:G.seeds,u:G.unlocked,ge:G.gear,y:G.yard,fl:G.flute,cr:G.crops,t:[G.day,Math.floor(G.clock),G.indoors?1:0,G.area],gd:G.goods,
    pa:G.party,al:G.allies,st:G.story,dl:G.daily,gf:G.gearOff,df:G.diff,lr:G.lore,rd:G.rod,jm:G.runMode,nm:G.names,sh:G.sheets,
    /* a plot: species index, -1 empty; ruined: -10-index of what it was (-2 if unknown) */
    pl:plots.map(p=>[p.dead?(p.deadSp?-10-SPECIES_ORDER.indexOf(p.deadSp):-2):p.sp?SPECIES_ORDER.indexOf(p.sp):-1,p.stage,Math.round(p.growth),Math.round(p.health),p.sungDay||0,p.fullDay||0,p.deadDay||0])};
}
function exportCode(){ try{ return btoa(unescape(encodeURIComponent(JSON.stringify(saveObj())))); }catch(e){ return ''; } }
function applySave(o){
  if(!o||o.v!==7) return false;
  const P=G.player;
  [P.lv,P.xp,P.next,P.hp,P.maxhp,P.mp,P.x,P.y]=o.p; P.next=xpNeed(P.lv);
  G.coins=o.c; [G.gardenLv,G.gardenXp,G.gardenNext,G.harvests]=o.g;
  G.seeds=o.s||{}; G.unlocked=[...new Set([...(o.u||[]),...unlockedFor(o.g?o.g[0]:1)])]; G.gear=o.ge||{}; G.yard=o.y||{}; G.crops=o.cr||{};
  G.flute=o.fl||'recorder';
  G.allies=o.al||{}; G.party=(o.pa||['kaitlyn']).filter(id=>id==='kaitlyn'||G.allies[id]);
  for(const id in G.allies){ const A=G.allies[id];          /* older saves had no EXP for friends */
    if(A.xp===undefined) A.xp=0; A.next=xpNeed(A.lv); A.hurtUntil=A.hurtUntil||0; A.maxhp=statOf(id,'hp'); }
  P.maxhp=statOf('kaitlyn','hp');
  G.runMode=o.jm||'hold';
  G.names=o.nm||{}; applyNames();
  G.sheets=o.sh||[];
  G.story=o.st||{}; G.daily=o.dl||{}; G.gearOff=o.gf||{}; G.diff=DIFFICULTY[o.df]?o.df:'normal';
  if(o.t){ [G.day,G.clock]=o.t; G.indoors=!!o.t[2]; G.area=PLACES[o.t[3]]?o.t[3]:'garden'; preloadSeasonMaps(); }
  G.goods=o.gd||{};
  G.lore=o.lr||{beat:{},fish:{}};
  /* saves from before rods were sold: anyone who has fished keeps a starter rod */
  G.rod=o.rd!==undefined?o.rd:Object.keys(G.lore.fish).length||Object.keys(G.goods).some(k=>GOODS[k]&&GOODS[k].kind==='fish')?1:0;
  /* saves from before the Lore tab: the fish in the bag were surely caught */
  for(const k in G.goods) if(GOODS[k]&&GOODS[k].kind==='fish'&&G.goods[k]>0&&!G.lore.fish[k]) G.lore.fish[k]={n:G.goods[k],best:0};
  /* a place whose layout changed since the save: don't leave her stuck in a tree */
  if(G.area!=='garden'&&placeSolid(P.x,P.y+9)){ const a=PLACES[G.area].arrive.garden; P.x=a.x; P.y=a.y; }
  (o.pl||[]).forEach((v,i)=>{ const p=plots[i]; if(!p)return;
    p.sp=v[0]>=0?SPECIES_ORDER[v[0]]:null; p.dead=v[0]===-2||v[0]<=-10; p.deadSp=v[0]<=-10?SPECIES_ORDER[-10-v[0]]:null; p.stage=v[1]; p.growth=v[2]; p.health=v[3]; p.sungDay=v[4]||0; p.fullDay=v[5]||0; p.deadDay=v[6]||0; });
  buildWorld(); return true;
}
function importCode(s){ try{ return applySave(JSON.parse(decodeURIComponent(escape(atob(s.trim()))))); }catch(e){ return false; } }
/* Saves go to Claude's artifact storage when the game runs as an artifact, and to
   this browser's localStorage everywhere else (a website, or python serve.py). There are
   SAVE_SLOTS games side by side; slot 1 keeps the key the single save always had, and
   kgs7_last remembers the one played last. */
const SAVE_SLOTS=3, slotKey=n=>n>1?'kgs7_'+n:'kgs7';
function storeGet(k){
  try{ if(window.storage) return window.storage.get(k).then(r=>r&&r.value||null).catch(()=>null); }catch(e){}
  try{ return Promise.resolve(localStorage.getItem(k)); }catch(e){ return Promise.resolve(null); }
}
/* the party test (?partytest, see 12-battle.js) never saves anything */
const NO_SAVE=/[?&]partytest\b/.test(location.search);
function storeSet(k,v){
  if(NO_SAVE) return;
  try{ if(window.storage){ window.storage.set(k,v).catch(()=>{}); return; } }catch(e){}
  try{ localStorage.setItem(k,v); }catch(e){}
}
function autoSave(){ storeSet(slotKey(G.slot||1),exportCode()); }
/* load this slot's game (resolves true if there was one) */
function autoLoad(){ return storeGet(slotKey(G.slot||1)).then(s=>!!(s&&importCode(s))); }
/* what's in each slot, for the title screen: null (empty) or {lv,day,coins} */
const SLOTS=Array(SAVE_SLOTS).fill(null); let lastSlot=1;
function peekSave(s){
  try{ const o=JSON.parse(decodeURIComponent(escape(atob(s.trim())))); if(!o||o.v!==7) return null;
    return {lv:o.p[0],coins:o.c,day:o.t?o.t[0]:1}; }catch(e){ return null; }
}
function readSlots(){
  return Promise.all(SLOTS.map((_,i)=>storeGet(slotKey(i+1)))).then(L=>{ L.forEach((s,i)=>SLOTS[i]=s?peekSave(s):null); })
    .then(()=>storeGet('kgs7_last')).then(v=>{ const n=+v;
      lastSlot=n>=1&&n<=SAVE_SLOTS&&SLOTS[n-1]?n:(SLOTS.findIndex(x=>x)+1||1); });
}
/* a brand-new game: the state everything starts in (taken before anything loads) */
let FRESH_SAVE=null;
function newGameState(){
  applySave(JSON.parse(JSON.stringify(FRESH_SAVE)));
  G.pests=[]; LV_UPS.length=0; G.cast=null; G.swim=false; G.msgT=0;
}
setInterval(()=>{ if(G.scene==='world') autoSave(); },15000);
