/* ================================================================
   STATE
   ================================================================ */
const G={
  scene:'title',
  player:{x:338,y:396,dir:4,animT:0,walkT:0,idleT:0,moving:false,hp:30,maxhp:30,mp:12,lv:1,xp:0,next:40},
  coins:60, gardenLv:1, gardenXp:0, gardenNext:60, harvests:0,
  seeds:{strawberry:3,tomato:2,sunflower:2},
  unlocked:['strawberry','tomato','sunflower'],
  gear:{}, yard:{}, flute:'recorder',
  crops:{},                                 /* harvested, not yet sold or eaten */
  coffeeT:0, swim:false, mpTick:0, wildT:4000,
  snackT:0, calmT:0, lureT:0,               /* timed effects from eating crops (ms) */
  pests:[], pestTimer:9000,
  msg:'', msgT:0, frogT:0, t:0, code:'',
  clock:6*60, day:1, indoors:false,      /* game minutes since midnight; see 14-daytime.js */
  party:['kaitlyn'], allies:{},          /* who fights (up to 3); allies' own stats */
};
const maxMp=()=>14+G.player.lv*2+(G.gear.cloth?8:0);
const fluteMul=()=>G.gear.dizi?1.35:(G.gear.silver?1.15:1);
const moveList=()=>MOVES.filter(mv=>mv.lv<=G.player.lv);
const fieldList=()=>FIELD.filter(f=>f.lv<=G.player.lv);
const growingCount=()=>plots.filter(p=>active(p)&&p.sp&&p.stage<3).length;
function harmony(){
  const n=growingCount(), per=G.gear.trellis?0.24:0.12;
  let h=Math.min(G.gear.trellis?2.6:1.8,1+Math.max(0,n-1)*per);
  if(G.yard.fountain) h+=0.2;
  return h;
}
function say(t){ G.msg=t; G.msgT=2900; }
/* ---------- party ----------
   Kaitlyn's stats are G.player; anyone who joins her keeps theirs in G.allies.
   skills: what the second battle command is called for them; attack: their free hit. */
const PARTY_MAX=3;
const PARTY_INFO={
  kaitlyn:{name:"Kaitlyn", skills:"Songs",  attack:"Quick Kick"},
  bling:  {name:"Bling",   skills:"Skills", attack:"Bite", hp:24, mp:8, pow:0.6},
};
const member=id=>id==='kaitlyn'?G.player:G.allies[id];
const memberMaxMp=id=>id==='kaitlyn'?maxMp():G.allies[id].maxmp;
function joinParty(id){
  if(G.party.includes(id)||G.party.length>=PARTY_MAX) return;
  const I=PARTY_INFO[id];
  if(!G.allies[id]) G.allies[id]={lv:1,hp:I.hp,maxhp:I.hp,mp:I.mp,maxmp:I.mp};
  G.party.push(id);
}
function addXp(n){
  G.player.xp+=n;
  while(G.player.xp>=G.player.next){
    G.player.xp-=G.player.next; G.player.lv++;
    G.player.next=Math.floor(G.player.next*1.45);
    G.player.maxhp+=6; G.player.hp=G.player.maxhp; G.player.mp=maxMp();
    const newMove=MOVES.find(mv=>mv.lv===G.player.lv);
    const newField=FIELD.find(f=>f.lv===G.player.lv);
    if(newMove) say("Lv."+G.player.lv+"!  Learned "+newMove.name+"!");
    else if(newField) say("Lv."+G.player.lv+"!  Learned "+newField.name+" (field song)!");
    else say("Kaitlyn reached Lv."+G.player.lv+"!");
    if(AC){flute(14,AC.currentTime,.3,.7);flute(18,AC.currentTime+.12,.4,.7);flute(21,AC.currentTime+.24,.6,.7);}
  }
}
function addGardenXp(n){
  G.gardenXp+=n;
  while(G.gardenXp>=G.gardenNext){
    G.gardenXp-=G.gardenNext; G.gardenLv++;
    G.gardenNext=Math.floor(G.gardenNext*1.5);
    const nx=SPECIES_ORDER.find(s=>!G.unlocked.includes(s));
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
    s:G.seeds,u:G.unlocked,ge:G.gear,y:G.yard,fl:G.flute,cr:G.crops,t:[G.day,Math.floor(G.clock),G.indoors?1:0],
    pa:G.party,al:G.allies,
    pl:plots.map(p=>[p.dead?-2:p.sp?SPECIES_ORDER.indexOf(p.sp):-1,p.stage,Math.round(p.growth),Math.round(p.health),p.sungDay||0,p.fullDay||0])};
}
function exportCode(){ try{ return btoa(unescape(encodeURIComponent(JSON.stringify(saveObj())))); }catch(e){ return ''; } }
function applySave(o){
  if(!o||o.v!==7) return false;
  const P=G.player;
  [P.lv,P.xp,P.next,P.hp,P.maxhp,P.mp,P.x,P.y]=o.p;
  G.coins=o.c; [G.gardenLv,G.gardenXp,G.gardenNext,G.harvests]=o.g;
  G.seeds=o.s||{}; G.unlocked=o.u||['strawberry']; G.gear=o.ge||{}; G.yard=o.y||{}; G.crops=o.cr||{};
  G.flute=o.fl||'recorder';
  G.allies=o.al||{}; G.party=(o.pa||['kaitlyn']).filter(id=>id==='kaitlyn'||G.allies[id]);
  if(o.t){ [G.day,G.clock]=o.t; G.indoors=!!o.t[2]; preloadSeasonMaps(); }
  (o.pl||[]).forEach((v,i)=>{ const p=plots[i]; if(!p)return;
    p.sp=v[0]>=0?SPECIES_ORDER[v[0]]:null; p.dead=v[0]===-2; p.stage=v[1]; p.growth=v[2]; p.health=v[3]; p.sungDay=v[4]||0; p.fullDay=v[5]||0; });
  buildWorld(); return true;
}
function importCode(s){ try{ return applySave(JSON.parse(decodeURIComponent(escape(atob(s.trim()))))); }catch(e){ return false; } }
/* Saves go to Claude's artifact storage when the game runs as an artifact, and to
   this browser's localStorage everywhere else (a website, or python serve.py). */
function autoSave(){
  try{ if(window.storage){ window.storage.set('kgs7',exportCode()).catch(()=>{}); return; } }catch(e){}
  try{ localStorage.setItem('kgs7',exportCode()); }catch(e){}
}
function autoLoad(){
  try{ if(window.storage){ window.storage.get('kgs7')
    .then(r=>{ if(r&&r.value) importCode(r.value); }).catch(()=>{}); return; } }catch(e){}
  try{ const s=localStorage.getItem('kgs7'); if(s) importCode(s); }catch(e){}
}
setInterval(()=>{ if(G.scene==='world') autoSave(); },15000);
