/* ================================================================
   BATTLE
   The party (Kaitlyn and up to two friends, G.party) against one pest. Every
   round, everyone still standing acts once, quickest (Agility) first: party
   members pick Attack, Songs (Skills for the others), Meditate, Items or Flee;
   the pest uses one of its skills (PESTS). Poison, sleep and the like (STATUS)
   tick at the start of each turn. If Kaitlyn falls the fight is lost; a friend
   who falls goes home hurt for a couple of days.
   ================================================================ */
const EX=228, EY=110;
/* where the party stands (feet), by party size: a staggered line on the left */
const FORMATION={1:[[80,262]],2:[[102,236],[58,300]],3:[[112,208],[80,262],[48,318]]};
const CMDS=['attack','skills','meditate','items','flee'];
const KILL_CHANCE=0.10;              /* Bling's venom can finish a (non-boss) foe outright */
let B=null;
function startBattle(pest){
  const P=PESTS[pest.species];
  padVec={x:0,y:0}; padId=null; btnHeld=false;        /* a held pad must not scroll the menu */
  B={pest,species:pest.species,name:P.name,hp:pest.hp,maxhp:P.hp,boss:!!P.boss,
     party:G.party.filter(id=>!isHurt(id)), act:0, menu:'cmd', idx:0, sub:0, top:0, readyT:0,
     guard:{},                       /* members braced by Meditate */
     st:{},                          /* members' troubles: st[id][status]=turns left */
     foe:{},                         /* the pest's: poison {n,dmg}, bound, weak, guard, charge */
     order:[], turn:'busy', log:(P.boss?"The HOA President demands a word!":"A "+P.name+" blocks your path!"),
     shake:0,over:null,pops:[],fx:[],anim:null,flash:0,shout:null};
  B.party.forEach(id=>B.st[id]={});
  G.scene='battle'; setMusic(P.boss?'boss':'battle'); blip(220,0.1,0.2); partyImg();
  setTimeout(nextActor,900);
}
const standing=id=>member(id).hp>0;
const actor=()=>B.party[B.act];
/* just over a member's head, for numbers that pop up */
const headOf=id=>slotOf(id).y-(id==='kaitlyn'?110:36);
function slotOf(id){ const [x,y]=FORMATION[B.party.length][Math.max(0,B.party.indexOf(id))]; return {x,y}; }
function pop(txt,x,y,col){ B.pops.push({txt,x,y,t:1100,col}); }
function burst(x,y,col,n,spd){ for(let i=0;i<(n||10);i++)
  B.fx.push({x,y,vx:rnd(-1,1)*(spd||0.13),vy:rnd(-0.19,0.03),t:520,col,g:0.001}); }
function anim(kind,dur,onHit,extra){ B.anim={kind,t:0,dur,hit:false,onHit,who:kind==='enemy'?null:actor(),...extra}; }
const has=(id,s)=>B.st[id]&&B.st[id][s]>0;
function addStatus(id,s){ if(!B.st[id]) B.st[id]={}; B.st[id][s]=STATUS[s].turns+(s==='sleep'?ri(0,1):0); }
const foeDef=()=>PESTS[B.species].def*(B.foe.guard?2:1);
/* damage after the target's Defense softens it (magic only half minds it) */
const soften=(raw,def,magic)=>Math.max(1,Math.round(raw*16/(16+def*(magic?0.5:1))));

/* ---------- turn order ---------- */
function newRound(){
  const P=PESTS[B.species];
  const L=B.party.filter(standing).map(id=>({id,a:statOf(id,'agi')+rnd(0,4)}));
  L.push({id:'foe',a:P.agi+rnd(0,4)});
  B.order=L.sort((x,y)=>y.a-x.a).map(o=>o.id);
}
/* whoever is next acts: a party member gets the menu, the pest takes its turn */
function nextActor(){
  if(!B||B.over) return;
  if(B.hp<=0){ winFight(); return; }
  if(!B.order.length) newRound();
  const id=B.order.shift();
  if(id==='foe'){ B.turn='enemy'; setTimeout(foeTurn,500); return; }
  if(!standing(id)){ nextActor(); return; }
  B.act=B.party.indexOf(id);
  const why=memberTicks(id);
  if(B.over) return;
  if(why){ B.turn='busy'; B.log=why; setTimeout(nextActor,1100); return; }
  startTurn();
}
function startTurn(){ B.turn='player'; B.menu='cmd'; B.idx=0; B.readyT=0; }
/* a member's troubles at the start of their turn; returns why they can't act, if so */
function memberTicks(id){
  const S=B.st[id], M=member(id), name=PARTY_INFO[id].name, s=slotOf(id);
  let why=null;
  if(S.poison>0){ const d=Math.max(1,Math.round(M.maxhp*0.07)); M.hp=Math.max(0,M.hp-d); S.poison--;
    pop("-"+d,s.x,headOf(id),'#c88ae0'); why=name+" takes "+d+" from poison."; if(!standing(id)){ downed(id); return why; } }
  if(S.sleep>0){ S.sleep--; return name+" is fast asleep..."; }
  if(S.scared>0){ S.scared--; if(Math.random()<0.5) return name+" is too scared to move!"; }
  ['blind','weak'].forEach(k=>{ if(S[k]>0) S[k]--; });
  return why&&!standing(id)?why:null;
}
/* a party member at 0 HP: Kaitlyn losing ends the fight */
function downed(id){
  if(id==='kaitlyn'){ B.over='lose'; B.log="Kaitlyn is worn out..."; return; }
  B.log+="  "+PARTY_INFO[id].name+" is down!";
}
/* the next one acts (or the fight is over); called when a move's animation ends */
function afterAction(){
  if(!B||B.over) return;
  if(B.hp<=0){ winFight(); return; }
  setTimeout(nextActor,250); B.turn='busy';
}

/* ---------- what each member can pick ---------- */
const skillList=id=>id==='kaitlyn'?moveList().filter(mv=>mv.id!=='kick'):(ALLY_SKILLS[id]||[]).filter(s=>s.lv<=member(id).lv);
/* harvested crops that restore HP or MP */
const battleFood=()=>cropList().filter(sp=>EAT[sp]&&(EAT[sp].hp||EAT[sp].mp));
const subList=()=>B.menu==='items'?battleFood():skillList(actor());
function cmdName(c,id){
  return {attack:"Attack",skills:PARTY_INFO[id].skills,meditate:"Meditate",items:"Items",flee:"Flee"}[c];
}
function cmdUsable(c,id){
  if(c==='skills') return skillList(id).length>0;
  if(c==='items') return battleFood().length>0;
  if(c==='flee') return !B.boss;
  return true;
}
/* title and one line of description for the info window */
function cmdInfo(c,id){
  const I=PARTY_INFO[id];
  if(c==='attack') return id==='kaitlyn'?[I.attack,"Free · power from Strength"]
                                        :[I.attack,"Free · always poisons · may finish the foe"];
  if(c==='skills') return skillList(id).length?[I.skills,id==='kaitlyn'?"Play a flute song · uses MP":"Use a skill · uses MP"]
                                              :[I.skills,"None learned yet"];
  if(c==='meditate') return ["Meditate","Next hit halved · restores 5–10% HP/MP"];
  if(c==='items') return battleFood().length?["Items","Eat something from your basket"]:["Items","No healing food in your basket"];
  return B.boss?["Flee","You can't run from the HOA President!"]:["Flee","Run back to the garden · 55% chance"];
}
function subInfo(x){
  if(!x) return B.menu==='items'?["Items","Harvest crops to eat them in battle"]:["Skills","None learned yet"];
  if(B.menu==='items') return [SPECIES[x].name,eatText(x)];
  if(x.notes) return [x.name,moveDesc(x)+" · "+x.mp+" MP"];
  return [x.name,x.desc+" · "+x.mp+" MP"];
}

/* ---------- input ---------- */
const SUB_ROWS=3, SUB_ROW=24, SUB_Y0=24;
function setSub(i){ B.sub=i; if(i<B.top) B.top=i; if(i>=B.top+SUB_ROWS) B.top=i-SUB_ROWS+1; }
function openSub(kind){ B.menu=kind; B.sub=0; B.top=0; blip(520,0.04,0.08,'triangle'); }
function battleKey(k){
  if(!B)return;
  if(B.over){ if(!winGuard()) endBattle(); return; }
  if(B.turn!=='player')return;
  if(B.menu==='cmd'){
    const n=CMDS.length, flee=CMDS.indexOf('flee');
    if(isUp(k)) B.idx=(B.idx+n-1)%n;
    if(isDown(k)) B.idx=(B.idx+1)%n;
    if(isOk(k)) pickCmd(CMDS[B.idx]);
    /* cancel points at Flee first, so a stray press doesn't run away */
    if(isBack(k)){ if(B.idx===flee) tryFlee(); else B.idx=flee; }
  } else {
    const L=subList(), n=L.length;
    if(isUp(k)&&n) setSub((B.sub+n-1)%n);
    if(isDown(k)&&n) setSub((B.sub+1)%n);
    if(isOk(k)&&n) useSub(L[B.sub]);
    else if(isBack(k)||isOk(k)) B.menu='cmd';
  }
}
function battleTouch(x,y){
  if(!B)return;
  if(B.over){ if(!winGuard()) endBattle(); return; }
  if(B.turn!=='player')return;
  const W=battleWins();
  if(B.menu==='cmd'){
    /* a tap on a command uses it straight away */
    const C=W.cmd; if(x<C.x||x>C.x+C.w) return;
    const i=Math.floor((y-cmdTop(W))/CMD_ROW);
    if(i>=0&&i<CMDS.length){ B.idx=i; pickCmd(CMDS[i]); }
  } else {
    /* a tap on a row uses it; anywhere outside the list goes back */
    const L=W.list;
    if(x<L.x||x>L.x+L.w||y<L.y||y>L.y+L.h){ B.menu='cmd'; return; }
    const j=Math.floor((y-L.y-SUB_Y0)/SUB_ROW), list=subList(), i=B.top+j;
    if(j>=0&&j<SUB_ROWS&&i<list.length){ setSub(i); useSub(list[i]); }
  }
}
function pickCmd(c){
  if(c==='attack') doAttack();
  else if(c==='skills') openSub('skills');
  else if(c==='meditate') doMeditate();
  else if(c==='items') openSub('items');
  else tryFlee();
}
function useSub(x){ if(B.menu==='items') eatInBattle(x); else if(x.notes) useSong(x); else useSkill(x); }

/* ---------- the party's moves ---------- */
function tryFlee(){
  B.turn='busy';
  if(B.boss){ B.log="The HOA President blocks the gate!"; afterAction(); return; }
  if(Math.random()<0.55){ B.over='flee'; B.log="You slipped away."; }
  else { B.log="Couldn't get away!"; afterAction(); }
}
function hitEnemy(dmg,label){
  B.hp=Math.max(0,B.hp-dmg); B.shake=340; B.flash=200;
  pop("-"+dmg,EX,EY-10,'#ffd24a'); thud(); B.log=label;
}
/* Blind members miss half their attacks */
function missed(id){ if(has(id,'blind')&&Math.random()<0.5){ B.log=PARTY_INFO[id].name+" can't see and misses!"; return true; } return false; }
const weakMul=id=>has(id,'weak')?0.6:1;
function doAttack(){
  const id=actor(), I=PARTY_INFO[id];
  B.turn='busy';
  const power=statOf(id,'str')*1.5*I.pow*weakMul(id)*(id==='kaitlyn'&&G.gear.kickers?1.6:1);
  if(id==='kaitlyn'){
    B.shout={txt:KICK_SHOUTS[ri(0,KICK_SHOUTS.length-1)],t:1500};
    B.kickVar=Math.random()<0.5?'kick':'kick2';
    playOne('kick',0.55);
    anim('kick',1100,()=>{
      if(missed(id)) return;
      const dmg=soften(power*rnd(0.85,1.15),foeDef());
      burst(EX-20,EY+16,'#ffe6a0',16,0.19); burst(EX-30,EY+34,'#d8c49a',12,0.13);
      hitEnemy(dmg,"Quick Kick lands for "+dmg+"!");
    });
    return;
  }
  /* Bling: a weak bite, but the venom always takes, and now and then it's too much */
  anim('lunge',900,()=>{
    if(missed(id)) return;
    const dmg=soften(power*rnd(0.85,1.15),foeDef());
    burst(EX-20,EY+20,'#ffe6a0',14,0.17);
    hitEnemy(dmg,I.name+"'s "+I.attack+" hits for "+dmg+"!");
    B.foe.poison={n:STATUS.poison.turns,dmg:Math.round(2+statOf(id,'int')*0.5)};
    burst(EX,EY+10,'#b06ae0',12,0.12);
    if(!B.boss&&B.hp>0&&Math.random()<KILL_CHANCE){ B.hp=0; B.log="Bling's venom overwhelms the "+B.name+"!"; }
    else B.log+="  It's poisoned!";
  });
}
const songPower=()=>statOf('kaitlyn','int')*1.3*(G.gear.polish?1.3:1)*fluteMul()*weakMul('kaitlyn');
function useSong(mv){
  if(G.player.mp<mv.mp){ B.log="Not enough Music Points!"; blip(150,0.08,0.2); return; }
  G.player.mp-=mv.mp; B.turn='busy';
  startRhythm(null,{notes:mv.notes,name:mv.name,mp:mv.mp,cb:(acc)=>{
    G.scene='battle'; B.menu='cmd'; playOne('flute',0.5);
    anim(mv.fx,1500,()=>{
      if(mv.heal){       /* healing songs reach the whole party */
        const h=Math.round(mv.heal*(0.5+acc)*(statOf('kaitlyn','int')/7*0.5+0.5));
        B.party.filter(standing).forEach(id=>{ const M=member(id), s=slotOf(id);
          M.hp=Math.min(M.maxhp,M.hp+h); pop("+"+h,s.x,headOf(id),'#8fe07a'); });
      }
      if(mv.pow>0){
        const dmg=soften(songPower()*mv.pow*(0.35+acc*1.1),foeDef(),true);
        hitEnemy(dmg,mv.name+" hits for "+dmg+"!  ("+Math.round(acc*100)+"%)");
      } else B.log=mv.name+" heals the party.";
      if(mv.weaken){ B.foe.weak=STATUS.weak.turns; B.log+="  Its attack drops!"; }
    });
  }});
}
/* a friend's skill (ALLY_SKILLS) */
function useSkill(sk){
  const id=actor(), M=member(id), name=PARTY_INFO[id].name;
  if(M.mp<sk.mp){ B.log="Not enough MP!"; blip(150,0.08,0.2); return; }
  M.mp-=sk.mp; B.turn='busy'; B.menu='cmd';
  anim(sk.heal?'meditate':'lunge',1000,()=>{
    if(sk.heal){
      const h=Math.round(M.maxhp*sk.heal), s=slotOf(id);
      M.hp=Math.min(M.maxhp,M.hp+h); pop("+"+h,s.x,headOf(id),'#8fe07a');
      if(sk.cure) ['poison','blind','weak'].forEach(k=>B.st[id][k]=0);
      B.log=name+" uses "+sk.name+": +"+h+" HP"+(sk.cure?" and feels clean":"")+".";
      return;
    }
    let mul=1; if(sk.burst&&B.foe.poison){ mul=3; B.foe.poison=null; }
    const dmg=soften(statOf(id,'int')*1.5*sk.pow*mul*weakMul(id)*rnd(0.9,1.1),foeDef(),true);
    hitEnemy(dmg,name+"'s "+sk.name+" hits for "+dmg+"!"+(mul>1?"  The venom bursts!":""));
    if(sk.bind&&Math.random()<sk.bind){ B.foe.bound=1; B.log+="  It's held fast!"; }
  });
}
/* half damage from the next attack, and 5-10% of HP and MP back */
function doMeditate(){
  const id=actor(), M=member(id), name=PARTY_INFO[id].name;
  B.turn='busy';
  anim('meditate',1100,()=>{
    const mx=memberMaxMp(id);
    const h=Math.max(1,Math.round(M.maxhp*rnd(0.05,0.10))), p=Math.max(1,Math.round(mx*rnd(0.05,0.10)));
    M.hp=Math.min(M.maxhp,M.hp+h); M.mp=Math.min(mx,M.mp+p); B.guard[id]=true;
    const s=slotOf(id); pop("+"+h,s.x,headOf(id),'#8fe07a');
    B.log=name+" meditates: +"+h+" HP, +"+p+" MP. The next hit is halved.";
    if(AC){ flute(9,AC.currentTime,.5,.35); flute(13,AC.currentTime+.18,.6,.3); }
  });
}
function eatInBattle(sp){
  const id=actor(), name=PARTY_INFO[id].name;
  B.turn='busy'; B.menu='cmd';
  anim('eat',800,()=>{
    const text=applyFood(sp,id), s=slotOf(id), e=EAT[sp];
    if(e.hp) pop("+"+e.hp,s.x,headOf(id),'#8fe07a');
    B.log=name+" eats a "+SPECIES[sp].name+": "+text+".";
    if(AC){ blip(620,0.06,0.1,'sine'); flute(9,AC.currentTime+.06,.25,.4); }
  });
}

/* ---------- the pest's turn ---------- */
function foeTurn(){
  if(!B||B.over) return;
  const P=PESTS[B.species], F=B.foe;
  F.guard=0;
  if(F.poison){ const d=F.poison.dmg; B.hp=Math.max(0,B.hp-d); pop("-"+d,EX,EY-10,'#c88ae0'); burst(EX,EY+10,'#b06ae0',8,0.1);
    B.log="The "+B.name+" takes "+d+" from poison."; if(--F.poison.n<=0) F.poison=null;
    if(B.hp<=0){ setTimeout(winFight,700); return; } }
  if(F.bound>0){ F.bound--; B.log="The "+B.name+" struggles but can't move!"; setTimeout(nextActor,1000); return; }
  if(F.weak>0) F.weak--;
  const charged=F.charge; F.charge=0;
  /* a charged-up pest always lets loose with its strongest hit */
  const sk=charged?P.skills.filter(s=>s.kind==='hit').sort((a,z)=>z.pow-a.pow)[0]:pickWeighted(P.skills);
  const live=B.party.filter(standing);
  const targets=sk.kind==='all'?live:sk.kind==='multi'?Array.from({length:sk.hits},()=>live[ri(0,live.length-1)])
               :sk.kind==='hit'||sk.kind==='steal'?[live[ri(0,live.length-1)]]:[];
  B.log="The "+B.name+" uses "+sk.name+"!";
  anim('enemy',sk.kind==='multi'?1300:900,()=>foeHits(sk,targets,charged),{fx:sk.fx,targets,self:!targets.length});
}
function pickWeighted(list){ let t=list.reduce((a,s)=>a+s.w,0)*Math.random();
  for(const s of list){ t-=s.w; if(t<=0) return s; } return list[0]; }
function foeHits(sk,targets,charged){
  if(!B||B.over) return;
  const P=PESTS[B.species], F=B.foe;
  if(sk.kind==='guard'){ F.guard=1; B.log="The "+B.name+" uses "+sk.name+". Hits on it are halved!"; return; }
  if(sk.kind==='charge'){ F.charge=1; B.log="The "+B.name+" gathers its strength..."; return; }
  if(sk.kind==='heal'){ const h=Math.round(B.maxhp*sk.heal); B.hp=Math.min(B.maxhp,B.hp+h);
    pop("+"+h,EX,EY-10,'#8fe07a'); B.log="The "+B.name+" uses "+sk.name+" and recovers "+h+" HP."; return; }
  if(sk.kind==='steal'){
    const id=targets[0], luck=statOf(id,'luk');
    if(Math.random()<luck*0.02){ B.log=PARTY_INFO[id].name+" keeps a tight grip on the coin purse!"; return; }
    const n=Math.min(G.coins,Math.round(P.atk*1.5+ri(0,6))); G.coins-=n;
    const s=slotOf(id); pop("-"+n+"c",s.x,headOf(id),'#ffd24a');
    B.log="The "+B.name+" uses "+sk.name+" and makes off with "+n+"c!"; return;
  }
  const lines=[];
  targets.forEach(id=>{
    if(!standing(id)) return;
    const name=PARTY_INFO[id].name, s=slotOf(id), M=member(id);
    if(sk.miss&&Math.random()<sk.miss){ pop("miss",s.x,headOf(id),'#e8eef8'); lines.push("It misses "+name+"."); return; }
    if(sk.pow>0){
      const braced=B.guard[id]; B.guard[id]=false;
      const raw=P.atk*sk.pow*rnd(0.8,1.2)*(F.weak>0?0.6:1)*(charged?2:1)*(braced?0.5:1);
      const dmg=soften(raw,statOf(id,'def'));
      M.hp=Math.max(0,M.hp-dmg); if(B.st[id]) B.st[id].sleep=0;            /* a hit wakes you */
      pop("-"+dmg,s.x,headOf(id),'#ff8a8a'); burst(s.x,s.y-80,'#ff9a8a',8);
      if(sk.drain){ const h=Math.round(dmg*sk.drain); B.hp=Math.min(B.maxhp,B.hp+h); pop("+"+h,EX,EY-10,'#8fe07a'); }
      if(targets.length===1) lines.push("It hits "+name+" for "+dmg+"!"+(braced?" (braced)":"")+(charged?" A huge blow!":""));
    }
    if(standing(id)&&sk.st&&Math.random()<sk.p){ addStatus(id,sk.st); lines.push(name+" is "+STATUS[sk.st].name.toLowerCase()+"!"); }
    if(!standing(id)){ lines.push(name+" is down!"); if(id==='kaitlyn'){ B.over='lose'; } }
  });
  if(targets.length>1&&sk.pow>0) lines.unshift("It hits the whole party!".replace("the whole party",sk.kind==='multi'?"again and again":"the whole party"));
  B.log="The "+B.name+" uses "+sk.name+"!  "+lines.join("  ");
  blip(180,0.09,0.2);
  if(B.over==='lose') B.log="Kaitlyn is worn out...";
}

/* ---------- victory: rewards are given at once, the screen then shows them ---------- */
const SEED_LOOT=0.10, WIN_DELAY=250, WIN_FILL=900, WIN_GUARD=350;
function winFight(){
  if(B.over) return;
  B.over='win'; B.log="The "+B.name+" flees the garden!"; playOne('victory',0.6); winRewards();
}
/* Luck (the luckiest one standing) helps find seeds and sometimes bonus coins */
function winRewards(){
  const P=PESTS[B.species], pl=G.player, up=B.party.filter(standing);
  const luck=Math.max(...up.map(id=>statOf(id,'luk')));
  const seed=Math.random()<SEED_LOOT+luck*0.004&&G.unlocked.length?G.unlocked[ri(0,G.unlocked.length-1)]:null;
  const bonus=Math.random()<luck*0.015;
  const coins=Math.round(P.coin*(bonus?1.5:1));
  B.win={xp:P.xp,coins,bonus,seed,from:{lv:pl.lv,xp:pl.xp,next:pl.next},t:0};
  G.coins+=coins; if(seed) G.seeds[seed]=(G.seeds[seed]||0)+1;
  G.pests=G.pests.filter(p=>p!==B.pest);
  up.forEach(id=>addXpTo(id,P.xp));          /* everyone still standing learns from it */
}
/* a moment's pause so the key that won the fight doesn't also close the screen */
const winGuard=()=>B.over==='win'&&B.win&&B.win.t<WIN_GUARD;
/* the XP bar as it fills, levelling up the same way addXp does */
function xpShown(){
  const w=B.win, k=clamp((w.t-WIN_DELAY)/WIN_FILL,0,1);
  let lv=w.from.lv, xp=w.from.xp+w.xp*k, next=w.from.next;
  while(xp>=next){ xp-=next; lv++; next=xpNeed(lv); }
  return {lv,xp:Math.floor(xp),next,k};
}
function endBattle(){
  const P=PESTS[B.species];
  if(B.over==='win'){ const w=B.win;      /* rewards were given when the fight was won */
    say((P.boss?"The HOA President retreats! ":"Won!  ")+"+"+w.coins+"c"+(w.bonus?" (lucky!)":"")+"  +"+w.xp+"xp"+(w.seed?"  + a seed":"")); }
  else if(B.over==='lose'){
    G.player.hp=Math.max(4,Math.floor(G.player.maxhp*0.4));
    G.pests=G.pests.filter(p=>p!==B.pest); G.player.x=338; G.player.y=396; G.indoors=false; G.area='garden';
    const lost=Math.floor(G.coins*0.5); G.coins-=lost;
    say("A frog nudged you awake by the pool. You dropped "+lost+"c."); }
  else { B.pest.x+=rnd(-60,60); B.pest.y+=rnd(-60,60); say("You slipped away."); }
  /* friends who fell go home to recover */
  const hurt=B.party.filter(id=>id!=='kaitlyn'&&!standing(id));
  hurt.forEach(id=>{ const A=G.allies[id]; A.hurtUntil=G.day+HURT_DAYS; A.hp=0; G.party=G.party.filter(x=>x!==id); });
  if(hurt.length) say(hurt.map(id=>PARTY_INFO[id].name).join(" and ")+" got hurt and went home to rest (back in "+HURT_DAYS+" days).");
  B=null; G.scene='world'; setMusic('calm'); autoSave();
}

/* ---------- drawing the party ----------
   Out of turn a member holds their battle stance (Kaitlyn's is pose.png, the others'
   come from party.webp); on their turn they ease into their ready loop. Kaitlyn's
   kick, flute and victory rows come from battle.png. */
let IMG_PARTY=null;
function partyImg(){
  if(!IMG_PARTY){ IMG_PARTY=new Image(); IMG_PARTY.src=ASSET_PARTY; }
  return IMG_PARTY.complete&&IMG_PARTY.naturalWidth?IMG_PARTY:null;
}
const READY_MS={kaitlyn:70,bling:50}, READY_FADE=220;
/* a party.webp frame at 2 device px per sheet px, its ax,ay on the given feet */
function partyFrame(r,ax,ay,x,y){
  const img=partyImg(); if(!img||!r) return false;
  const [sx,sy,w,h]=r;
  b.save(); b.translate(x,y); b.scale(2/SC,2/SC);
  b.drawImage(img,sx,sy,w,h,-ax,-ay,w,h); b.restore(); return true;
}
function drawStance(id,x,y){
  if(id==='kaitlyn'){ drawPose(b,0,x,y); return; }
  const A=PARTY_ART[id], s=A&&A.stance;
  if(s) partyFrame(s.r,s.ax,s.ay,x,y);
  else if(A) partyFrame(A.ready[0],A.ax,A.ay,x,y);
}
function drawReady(id,x,y,t){
  const A=PARTY_ART[id];
  if(!A){ drawStance(id,x,y); return; }
  const i=Math.floor(t/(READY_MS[id]||60))%A.ready.length;
  partyFrame(A.ready[i],A.ax,A.ay,x,y);
}
const SONG_FX=['sprout','lull','waltz','req','thorn','hymn'];
function drawMember(id,x,y,k){
  const mine=B.anim&&B.anim.who===id, kind=mine?B.anim.kind:null;
  if(id==='kaitlyn'){
    if(B.over==='lose'||!standing(id)){ drawPose(b,1,x,y); return; }
    if(B.over==='win'){ const n=BRN[BROW.victory]||1; drawBattleRow(b,'victory',Math.floor(G.t/85)%n,x,y); return; }
    if(kind==='kick'){ const v=B.kickVar||'kick', n=BRN[BROW[v]]||1; drawBattleRow(b,v,Math.floor(k*n),x,y); return; }
    if(SONG_FX.includes(kind)){ const n=BRN[BROW.flute]||1; drawBattleRow(b,'flute',Math.floor(k*n),x,y); return; }
  }
  if(!standing(id)){ b.globalAlpha=.45; drawStance(id,x,y); b.globalAlpha=1; return; }
  if(kind==='lunge'){ const a=PARTY_ART[id]&&PARTY_ART[id].attack;
    if(a) partyFrame(a.f[Math.min(a.f.length-1,Math.floor(k*a.f.length))],a.ax,a.ay,x,y);
    else drawReady(id,x,y,B.anim.t+1500);                       /* the strike part of the loop */
    return; }
  const ready=B.turn==='player'&&!B.over&&actor()===id;
  const f=ready?clamp(B.readyT/READY_FADE,0,1):0;
  if(f<1) drawStance(id,x,y);
  if(f>0){ b.globalAlpha=f; drawReady(id,x,y,B.readyT); b.globalAlpha=1; }
}

function wrapT(text,x,y,w,size,col){
  const words=text.split(' '); let line='',yy=y;
  for(const wd of words){ const test=line?line+' '+wd:wd;
    if(TW(test,size)>w){ T(line,x,yy,size,col); line=wd; yy+=17; } else line=test; }
  T(line,x,yy,size,col);
}
/* effects for the move playing; ax,ay are the feet of whoever is acting */
function drawSpellFx(kind,k,ax,ay){
  if(kind==='sprout'||kind==='hymn'){
    for(let i=0;i<7;i++){
      const h=Math.min(1,k*1.6)*62, a=i*1.05+Math.sin(G.t/200)*0.2;
      for(let s=0;s<h;s+=3){
        const x=EX+Math.sin(s/13+a)*(13+s*0.14), y=EY+34-s;
        px(b,Math.round(x),Math.round(y),3,3,s%12<6?'#4a9450':'#6fbc68'); } }
    if(k>0.55) for(let i=0;i<11;i++){
      const a=i*0.6+k*7, r=(k-0.55)*135;
      px(b,Math.round(EX+Math.cos(a)*r),Math.round(EY+Math.sin(a)*r),4,4,
        kind==='hymn'?'#ffe08a':'#8fe07a'); }
  } else if(kind==='waltz'){
    for(let s=0;s<3;s++){
      const p=clamp(k*1.5-s*0.18,0,1); if(p<=0||p>=1) continue;
      b.save(); b.translate(EX,EY+6); b.rotate(-0.9+p*2.4+s*0.5);
      for(let r=12;r<52;r+=4){ px(b,r,-2,4,4,'#7a4aa8'); px(b,r,-2,3,3,'#c88ae0'); }
      b.restore(); }
  } else if(kind==='req'){
    for(let i=0;i<10;i++){
      const a=i*0.63+k*9, r=48-k*36;
      px(b,Math.round(EX+Math.cos(a)*r),Math.round(EY+Math.sin(a)*r*0.6),5,4,'#e8b02a');
      px(b,Math.round(EX+Math.cos(a)*r),Math.round(EY+Math.sin(a)*r*0.6),3,2,'#3a2a12'); }
  } else if(kind==='thorn'){
    const rise=Math.min(1,k*1.8);
    for(let i=0;i<9;i++){
      const x=EX-45+i*11, h=rise*(66+((i*13)%26));
      for(let s=0;s<h;s+=3){
        px(b,x+Math.round(Math.sin(s/10+i)*4),Math.round(EY+45-s),4,4,s%15<7?'#3a2a5a':'#6b4a8a');
        if(s%21===0) px(b,x+5,Math.round(EY+45-s),3,3,'#e0d0f0'); } }
    if(k>0.62&&k<0.78){ b.globalAlpha=(0.78-k)/0.16; px(b,0,0,LW,LH,'#e8dcf7'); b.globalAlpha=1; }
  } else if(kind==='lull'){
    for(let i=0;i<11;i++){
      const a=i*0.63+G.t/400, r=24+Math.sin(G.t/300+i)*8;
      const y=ay-30-((k*90+i*10)%90);
      px(b,Math.round(ax+Math.cos(a)*r),Math.round(y),4,4,'#8fe07a');
      px(b,Math.round(ax+Math.cos(a)*r),Math.round(y),2,2,'#e0ffd0'); }
    const bo=Math.abs(Math.sin(G.t/180))*4;
    drawFrog(b,ax+34,ay-26-bo,G.t,0);
  } else if(kind==='kick'||kind==='lunge'){
    if(k<0.5) for(let i=0;i<5;i++){
      const dx=ax+k*2*92-i*13;
      px(b,Math.round(dx),Math.round(ay-3-(i%2)*5),5,3,'#c9b48a'); }
    if(k>0.48&&k<0.72){
      const s=(k-0.48)/0.24;
      for(let i=0;i<11;i++){
        const a=-1.1+i*0.22, r=9+s*34;
        px(b,Math.round(EX-24+Math.cos(a)*r),Math.round(EY+16+Math.sin(a)*r),4,4,
          i%2?'#fff3b0':'#ffd24a'); }
      b.globalAlpha=1-s;
      px(b,EX-36,EY+9,15,4,'#ffffff'); px(b,EX-30,EY+3,4,15,'#ffffff');
      b.globalAlpha=1;
    }
  } else if(kind==='meditate'){
    /* calm rings settling around them, and motes drifting up */
    for(let i=0;i<3;i++){
      const p=clamp(k*1.4-i*0.22,0,1); if(p<=0||p>=1) continue;
      b.globalAlpha=(1-p)*0.8; b.strokeStyle=i%2?'#bfe8ff':'#c8f0b0'; b.lineWidth=2;
      b.beginPath(); b.ellipse(ax,ay-4,46-p*30,12-p*7,0,0,7); b.stroke(); }
    b.globalAlpha=1;
    for(let i=0;i<9;i++){
      const y=ay-((k*120+i*14)%120), x=ax+Math.sin(i*1.7+G.t/300)*26;
      b.globalAlpha=Math.min(1,(ay-y)/30)*0.9; px(b,Math.round(x),Math.round(y),3,3,i%2?'#e8fff0':'#bfe8ff'); }
    b.globalAlpha=1;
  } else if(kind==='eat'){
    for(let i=0;i<7;i++){
      const y=ay-60-k*50-i*6, x=ax+Math.sin(i*2.1)*22;
      b.globalAlpha=1-k; px(b,Math.round(x),Math.round(y),4,4,i%2?'#8fe07a':'#ffe08a'); }
    b.globalAlpha=1;
  }
}
/* ---------------- the battle screen ----------------
   A painted garden backdrop for the season and hour, and classic RPG windows:
   message along the top with the pest's name and HP below it; along the bottom the
   commands, the party (room for three) and what the highlighted choice does. The
   Songs / Skills / Items lists open over the commands and the party. */
const BWIN={msg:{x:8,y:8,w:344,h:34}, foe:{x:8,y:48,w:176,h:38},
            cmd:{x:8,y:322,w:128,h:152}, party:{x:142,y:322,w:210,h:100}, info:{x:142,y:428,w:210,h:46},
            list:{x:8,y:322,w:344,h:100}, linfo:{x:8,y:428,w:344,h:46}};
const CMD_ROW=26, HORIZON=150, PARTY_ROW=30;
/* The top windows sit at the top of the scene and the bottom ones at its bottom edge,
   so on tall screens the fight fills the space (above the deck on touch screens). */
function battleWins(){
  const t=BAND_TOP(), dn=BAND_BOT()-LH, s=(r,d)=>({x:r.x,y:r.y+d,w:r.w,h:r.h}), W={dn};
  for(const k in BWIN) W[k]=s(BWIN[k],k==='msg'||k==='foe'?t:dn);
  return W;
}
const cmdTop=W=>W.cmd.y+10;
const BACKDROP={
  spring:{sky:['#86c4ee','#e6f2dc'],far:'#6aa45e',near:'#4f8c48',ground:['#78b45a','#4a8638'],dots:['#f4a8c8','#f7e48a','#ffffff'],drift:'petal'},
  summer:{sky:['#5eb2ee','#f2f0cc'],far:'#4a944a',near:'#357a36',ground:['#68aa4c','#3c7a2e'],dots:['#f6d64a','#ff8a5a','#ffffff'],drift:null},
  fall:  {sky:['#e6a874','#fae2c2'],far:'#c8682c',near:'#a04a22',ground:['#b8923e','#86662a'],dots:['#e8743a','#f0b040'],drift:'leaf'},
  winter:{sky:['#a6c6e6','#f0f5fa'],far:'#d4e0ec',near:'#b8cadc',ground:['#f2f6fa','#cad8e6'],dots:[],drift:'snow'}};
/* a classic window: dark outline, light rim, deep-blue gradient with a soft sheen */
function rpgWin(r){
  const {x,y,w,h}=r;
  b.fillStyle='rgba(0,0,0,.35)'; b.beginPath(); b.roundRect(x+1.5,y+2.5,w,h,6); b.fill();
  b.fillStyle='#0a0f2a'; b.beginPath(); b.roundRect(x-1,y-1,w+2,h+2,7); b.fill();
  b.fillStyle='#e6eaf6'; b.beginPath(); b.roundRect(x,y,w,h,6); b.fill();
  const g=b.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#3d55b0'); g.addColorStop(1,'#141b52');
  b.fillStyle=g; b.beginPath(); b.roundRect(x+2,y+2,w-4,h-4,4.5); b.fill();
  b.fillStyle='rgba(255,255,255,.07)'; b.beginPath(); b.roundRect(x+3,y+3,w-6,(h-6)*0.42,3.5); b.fill();
}
/* a gauge in a window: dark track, bright fill with a highlight */
function gauge(x,y,w,h,v,max,col,hi){
  b.fillStyle='#0a0f2a'; b.beginPath(); b.roundRect(x-1,y-1,w+2,h+2,(h+2)/2); b.fill();
  b.fillStyle='#262c5c'; b.beginPath(); b.roundRect(x,y,w,h,h/2); b.fill();
  const f=Math.max(0,Math.round(w*clamp(v/max,0,1)));
  if(f>0){ b.fillStyle=col; b.beginPath(); b.roundRect(x,y,f,h,h/2); b.fill();
    b.fillStyle=hi; b.fillRect(x+h/2,y+1,Math.max(0,f-h),Math.max(1,h/3)); }
}
/* the highlighted row in a window: a soft blue bar and the flute cursor */
function winCursor(x,y,w,h){
  b.fillStyle='rgba(150,180,255,.28)'; b.beginPath(); b.roundRect(x,y,w,h,4); b.fill();
  fluteCursor(x+26,y+h/2);
}
/* text with a dark shadow, for the blue windows and the scene */
function TS(t,x,y,size,col,align,bold){ T(t,x+0.8,y+0.8,size,'#0a0f2a',align,bold); T(t,x,y,size,col,align,bold); }
/* text with a full dark outline (damage numbers, the victory banner) */
function TO(t,x,y,size,col,align,bold,w){ const o=w||1.2;
  for(const [dx,dy] of [[-o,0],[o,0],[0,-o],[0,o],[-o,-o],[o,o],[-o,o],[o,-o]]) T(t,x+dx,y+dy,size,'#1a1430',align,bold);
  T(t,x,y,size,col,align,bold); }
function drawBattleBackdrop(dt){
  const P=BACKDROP[season()]||BACKDROP.spring, T0=BAND_TOP(), T1=BAND_BOT();
  const sky=b.createLinearGradient(0,T0,0,HORIZON);
  sky.addColorStop(0,P.sky[0]); sky.addColorStop(1,P.sky[1]);
  b.fillStyle=sky; b.fillRect(0,T0,LW,HORIZON-T0);
  /* soft clouds */
  b.fillStyle='rgba(255,255,255,.5)';
  for(let i=0;i<4;i++){ const cx=((G.t*0.006+i*110)%(LW+160))-80, cy=40+((i*37)%60);
    b.beginPath(); b.ellipse(cx,cy,34,9,0,0,7); b.fill(); b.beginPath(); b.ellipse(cx+18,cy-5,20,8,0,0,7); b.fill(); }
  /* distant trees, then the near hedge along the horizon */
  b.fillStyle=P.far;
  for(let i=-1;i<13;i++){ const x=i*32+((i*13)%11); b.beginPath(); b.ellipse(x,HORIZON-4,24,20+((i*7)%10),0,0,7); b.fill(); }
  b.fillStyle=P.near;
  for(let i=-1;i<20;i++){ const x=i*20+((i*7)%9); b.beginPath(); b.ellipse(x,HORIZON+4,14,11+((i*5)%5),0,0,7); b.fill(); }
  P.dots.forEach((c,k)=>{ b.fillStyle=c; for(let i=0;i<14;i++){ const x=((i*53+k*29)%LW), y=HORIZON-2+((i*17+k*11)%10);
    b.beginPath(); b.arc(x,y,1.6,0,7); b.fill(); } });
  /* the lawn, with mowing stripes that widen toward the front */
  const gr=b.createLinearGradient(0,HORIZON,0,T1);
  gr.addColorStop(0,P.ground[0]); gr.addColorStop(1,P.ground[1]);
  b.fillStyle=gr; b.fillRect(0,HORIZON+8,LW,T1-HORIZON-8);
  b.fillStyle='rgba(255,255,255,.05)';
  for(let i=0,y=HORIZON+10;y<T1;i++){ const hgt=4+i*3; if(i%2===0) b.fillRect(0,y,LW,hgt); y+=hgt; }
  /* light pools where the pest and each of the party stand */
  b.fillStyle='rgba(255,255,240,.16)';
  b.beginPath(); b.ellipse(EX,EY+54,62,14,0,0,7); b.fill();
  B.party.forEach(id=>{ const s=slotOf(id), big=id==='kaitlyn'; b.beginPath(); b.ellipse(s.x+(big?6:0),s.y+2,big?48:28,big?11:7,0,0,7); b.fill(); });
  /* petals, leaves or snow drifting across */
  if(P.drift){
    if(!B.amb) B.amb=[];
    if(B.amb.length<18&&Math.random()<dt/260) B.amb.push({x:rnd(-20,LW),y:T0-6,vx:rnd(0.004,0.02),vy:rnd(0.012,0.03),
      a:rnd(0,6.3),t:0});
    const col=P.drift==='snow'?'#ffffff':P.drift==='leaf'?'#d8642a':'#f6b8d0';
    B.amb.forEach(p=>{ p.t+=dt; p.x+=p.vx*dt+Math.sin((p.t+p.a*300)/500)*0.12; p.y+=p.vy*dt;
      b.fillStyle=col; b.globalAlpha=.85; b.beginPath();
      if(P.drift==='snow') b.arc(p.x,p.y,1.4,0,7); else b.ellipse(p.x,p.y,2.6,1.4,p.t/300+p.a,0,7);
      b.fill(); b.globalAlpha=1; });
    B.amb=B.amb.filter(p=>p.y<T1+6);
  }
  /* the colour of the hour, gentler than in the garden so the fight stays readable */
  const t=tintAt(G.clock/60);
  if(t.a>0.002){ b.save(); b.globalCompositeOperation='multiply'; b.globalAlpha=t.a*0.6;
    b.fillStyle='rgb('+t.rgb.join(',')+')'; b.fillRect(0,T0,LW,T1-T0); b.restore(); }
}
/* ---------- the pest's attack effects ----------
   fx (PESTS skills) drawn from the pest to each target over the attack's k (0..1);
   contact is a little past halfway. */
function drawFoeFx(fx,k,targets){
  const from={x:EX-24,y:EY+18};
  const T=(targets||[]).map(id=>{ const s=slotOf(id); return {x:s.x+8,y:s.y-62}; });
  const hit=clamp((k-0.45)/0.4,0,1), on=k>0.45&&k<0.9;
  const along=(t,arc)=>T.map(p=>({x:from.x+(p.x-from.x)*t,y:from.y+(p.y-from.y)*t-Math.sin(t*Math.PI)*arc}));
  const dot=(x,y,r,col,a)=>{ b.globalAlpha=a===undefined?1:a; b.fillStyle=col; b.beginPath(); b.arc(x,y,r,0,7); b.fill(); b.globalAlpha=1; };
  const line=(x1,y1,x2,y2,col,w,a)=>{ b.globalAlpha=a===undefined?1:a; b.strokeStyle=col; b.lineWidth=w;
    b.beginPath(); b.moveTo(x1,y1); b.lineTo(x2,y2); b.stroke(); b.globalAlpha=1; };
  if(['bash','pinch','bite','peck','claw','dive'].includes(fx)){
    /* slashes, bite marks or an impact star where it lands */
    if(on) T.forEach(p=>{ const a=1-hit;
      if(fx==='claw') for(let i=0;i<3;i++) line(p.x-14+i*8,p.y-16,p.x-2+i*8,p.y+14,'#ffffff',2.5,a);
      else if(fx==='bite'||fx==='pinch'){ for(let i=0;i<4;i++){ dot(p.x-9+i*6,p.y-8+hit*6,2.2,'#ffffff',a); dot(p.x-9+i*6,p.y+8-hit*6,2.2,'#ffffff',a); } }
      else { for(let i=0;i<8;i++){ const an=i*0.785, r=6+hit*16; line(p.x+Math.cos(an)*r*0.4,p.y+Math.sin(an)*r*0.4,p.x+Math.cos(an)*r,p.y+Math.sin(an)*r,i%2?'#ffe08a':'#ffffff',2,a); } } });
    if(fx==='dive'&&k<0.5) for(let i=0;i<5;i++) line(EX+20+i*6,EY-20+i*9,EX+50+i*6,EY-50+i*9,'#ffffff',1.5,0.6);
  } else if(fx==='sting'||fx==='spines'){
    /* needles fly in, then a puff of venom */
    if(k<0.55) along(k/0.55,8).forEach(p=>{ for(let i=0;i<(fx==='spines'?4:1);i++) line(p.x+i*5,p.y+i*3-4,p.x+i*5+9,p.y+i*3-6,'#3a2a1a',2); });
    else if(on) T.forEach(p=>{ for(let i=0;i<7;i++) dot(p.x+Math.cos(i)*hit*16,p.y+Math.sin(i*1.7)*hit*12,2.5,'#b06ae0',1-hit); });
  } else if(fx==='ball'||fx==='trash'||fx==='paper'){
    /* something lobbed at them: dung balls, trash, citations */
    if(k<0.55) along(k/0.55,fx==='paper'?20:60).forEach((p,i)=>{
      if(fx==='paper'){ b.save(); b.translate(p.x,p.y); b.rotate(k*12+i); b.fillStyle='#ffffff'; b.fillRect(-6,-8,12,16);
        b.fillStyle='#8a94c4'; for(let j=0;j<4;j++) b.fillRect(-4,-5+j*3.5,8,1); b.restore(); }
      else { dot(p.x,p.y,fx==='ball'?7:6,fx==='ball'?'#6a4a22':'#8a8f96'); if(fx==='trash') dot(p.x+3,p.y-3,3,'#c4c9d0'); } });
    else if(on) T.forEach(p=>{ for(let i=0;i<9;i++){ const an=i*0.7; dot(p.x+Math.cos(an)*hit*20,p.y+Math.sin(an)*hit*14,3,fx==='ball'?'#7a5a2a':fx==='paper'?'#ffffff':'#9aa0a8',1-hit); } });
  } else if(fx==='buzz'){
    /* a swarm all over them */
    T.forEach(p=>{ for(let i=0;i<10;i++){ const an=G.t/90+i*0.63; dot(p.x+Math.cos(an*1.3)*18*Math.min(1,k*2),p.y+Math.sin(an)*14*Math.min(1,k*2),1.8,'#2a2a1a',0.9); dot(p.x+Math.cos(an*1.3)*18*Math.min(1,k*2)+1,p.y+Math.sin(an)*14*Math.min(1,k*2),1.2,'#f0c03a',0.9); } });
  } else if(fx==='caw'||fx==='megaphone'){
    /* sound waves rolling from the pest over them */
    for(let i=0;i<4;i++){ const q=clamp(k*1.6-i*0.18,0,1); if(q<=0||q>=1) continue;
      b.globalAlpha=(1-q)*0.8; b.strokeStyle=fx==='caw'?'#2a2a4a':'#ffd24a'; b.lineWidth=3;
      b.beginPath(); b.arc(from.x+20,from.y,q*220,Math.PI*0.75,Math.PI*1.25); b.stroke(); }
    b.globalAlpha=1;
  } else if(['boo','wail','gloom','curse','chill'].includes(fx)){
    /* ghostly wisps around them (and the drain back to the pest) */
    const col=fx==='chill'?'#bfe8ff':fx==='curse'?'#a05ad8':'#8a7ad8';
    if(fx==='wail'){ b.globalAlpha=Math.sin(k*Math.PI)*0.25; px(b,0,BAND_TOP(),LW,BAND_BOT()-BAND_TOP(),'#2a1a4a'); b.globalAlpha=1; }
    (fx==='gloom'?[{x:EX,y:EY}]:T).forEach(p=>{ for(let i=0;i<7;i++){ const an=G.t/220+i*0.9, r=10+Math.sin(G.t/150+i)*6+(1-Math.min(1,k*2))*20;
      dot(p.x+Math.cos(an)*r,p.y+Math.sin(an)*r*0.7,fx==='chill'?2:3,col,Math.sin(k*Math.PI)*0.85); } });
    if(fx==='chill'&&k>0.6) T.forEach(p=>{ const q=(k-0.6)/0.4; for(let i=0;i<4;i++) dot(p.x+(from.x-p.x)*q+Math.sin(i+k*9)*6,p.y+(from.y-p.y)*q+i*3,2,'#8fe07a',1-q*0.5); });
  } else if(fx==='hearts'){
    along(Math.min(1,k*1.3),30).forEach((p,i)=>{ for(let j=0;j<3;j++){ const x=p.x+j*9-9, y=p.y+Math.sin(G.t/120+j)*4;
      b.fillStyle='#ff8ab8'; b.beginPath(); b.arc(x-2,y,2.6,0,7); b.arc(x+2,y,2.6,0,7); b.fill();
      b.beginPath(); b.moveTo(x-4.6,y+1); b.lineTo(x,y+6); b.lineTo(x+4.6,y+1); b.fill(); } });
  } else if(fx==='zoom'){
    for(let i=0;i<8;i++){ const y=200+i*16, x=LW-(k*1.4%1)*LW*1.2+i*14; line(x,y,x+46,y,'#ffffff',2,0.6); }
  } else if(fx==='shell'){
    b.globalAlpha=Math.sin(k*Math.PI)*0.5; b.fillStyle='#c8ccd8'; b.beginPath(); b.ellipse(EX,EY+20,46,44,0,Math.PI,0); b.fill(); b.globalAlpha=1;
  } else if(fx==='snack'){
    for(let i=0;i<8;i++) dot(EX+Math.cos(i*0.8+k*6)*30,EY+20-k*40+Math.sin(i)*8,2.5,i%2?'#8fe07a':'#ffe08a',1-k);
  } else if(fx==='steal'){
    if(k>0.5) T.forEach(p=>{ const q=(k-0.5)/0.5; for(let i=0;i<3;i++){ const x=p.x+(from.x-p.x)*q+i*6, y=p.y+(from.y-p.y)*q-Math.sin(q*Math.PI)*30+i*4;
      dot(x,y,3.6,'#a8781e'); dot(x,y,2.6,'#ffd24a'); } });
  }
}
/* little tags over anyone with a status (and over a pest that's guarding or charging) */
function drawStatusTags(){
  const tag=(x,y,list)=>{ list.forEach(([t,col],i)=>{ const w=t.length*4.2+6, xx=x-(list.length*(w+2))/2+i*(w+2);
    b.fillStyle='#0a0f2a'; b.beginPath(); b.roundRect(xx-0.5,y-0.5,w+1,9,3); b.fill();
    b.fillStyle=col; b.beginPath(); b.roundRect(xx,y,w,8,2.5); b.fill();
    b.fillStyle='#ffffff'; b.font='bold 6px '+FONT; b.textAlign='center'; b.fillText(t,xx+w/2,y+6.3); });
    b.textAlign='left'; };
  B.party.forEach(id=>{ if(!standing(id)) return; const s=slotOf(id), S=B.st[id]||{};
    const L=Object.keys(STATUS).filter(k=>S[k]>0).map(k=>[STATUS[k].tag,STATUS[k].col]);
    if(B.guard[id]) L.push(["GRD",'#3a8a5a']);
    if(L.length) tag(s.x,s.y-(id==='kaitlyn'?138:58),L); });
  const F=B.foe, L=[];
  if(F.poison) L.push(["PSN",STATUS.poison.col]); if(F.bound) L.push(["BND",STATUS.bound.col]);
  if(F.weak) L.push(["WK",STATUS.weak.col]); if(F.guard) L.push(["GRD",'#3a8a5a']); if(F.charge) L.push(["!!",'#d84a3a']);
  if(L.length&&!B.over) tag(EX,EY-58,L);
}
function drawBattle(dt){
  if(B.shake>0) B.shake-=dt;
  if(B.flash>0) B.flash-=dt;
  if(B.turn==='player') B.readyT+=dt;
  let k=0;
  if(B.anim){
    B.anim.t+=dt; k=clamp(B.anim.t/B.anim.dur,0,1);
    if(!B.anim.hit&&k>=0.55){ B.anim.hit=true; if(B.anim.onHit) B.anim.onHit(); }
    if(k>=1){ B.anim=null; afterAction(); }
  }
  if(B.win) B.win.t+=dt;
  drawBattleBackdrop(dt);
  const sh=B.shake>0?Math.round(Math.sin(G.t/25)*3):0;
  /* the pest lunges at whoever it attacks (further for a dive, a dash for zoomies) */
  const A=B.anim&&B.anim.kind==='enemy'?B.anim:null;
  const eL=A&&!A.self?Math.round(Math.sin(k*Math.PI)*(A.fx==='dive'?-110:A.fx==='zoom'?-150:-38)):0;
  const eY=A&&A.fx==='dive'?Math.round(Math.sin(k*Math.PI)*60):0;
  const night=PESTS[B.species].night, bob=Math.round(Math.sin(G.t/420)*(night?5:2));
  const gone=B.win?clamp(B.win.t/450,0,1):0;          /* the beaten pest fades away */
  b.globalAlpha=.25*(1-gone); b.fillStyle='#1a2810';
  b.beginPath(); b.ellipse(EX+sh+eL,EY+52,30,7,0,0,7); b.fill();
  b.globalAlpha=(1-gone)*(night?.88:1)*(A&&A.fx==='fade'?1-Math.sin(k*Math.PI)*0.7:1);
  drawEnemyArt(b,B.species,EX+sh+eL,EY+52+bob+eY-(night?8:0),1);
  b.globalAlpha=1;
  if(B.flash>0){ b.globalAlpha=B.flash/600; px(b,EX-52,EY-40,104,96,'#ffffff'); b.globalAlpha=1; }
  /* the party, back to front; whoever is acting steps toward the pest */
  let who=null;
  const placed=B.party.map(id=>{ const s=slotOf(id); let x=s.x;
    if(B.anim&&B.anim.who===id){
      if(B.anim.kind==='kick'||B.anim.kind==='lunge'){
        const run=k<0.5?(k/0.5):1-((k-0.5)/0.5);
        x=s.x+Math.pow(run,0.8)*Math.max(30,132-s.x);
      } else if(B.anim.kind!=='enemy') x=s.x+Math.sin(k*Math.PI)*8;
      who={id,x,y:s.y};
    }
    return {id,x,y:s.y}; }).sort((a,z)=>a.y-z.y);
  placed.forEach(p=>{
    b.globalAlpha=.25; b.fillStyle='#1a2810';
    b.beginPath(); b.ellipse(p.x,p.y,21,6,0,0,7); b.fill(); b.globalAlpha=1;
    if(B.turn==='player'&&!B.over&&actor()===p.id){        /* a warm glow under whoever's turn it is */
      b.globalAlpha=.35+Math.sin(G.t/260)*.12; b.fillStyle='#ffe08a';
      b.beginPath(); b.ellipse(p.x,p.y+1,30,8,0,0,7); b.fill(); b.globalAlpha=1; }
    drawMember(p.id,p.x,p.y,k);
  });
  if(A) drawFoeFx(A.fx,k,A.targets);
  else if(B.anim&&who) drawSpellFx(B.anim.kind,k,who.x,who.y);
  drawStatusTags();
  if(B.shout){ B.shout.t-=dt; if(B.shout.t<=0) B.shout=null; }
  const won=B.over==='win'&&B.win, xs=won?xpShown():null;
  /* victory sparkles */
  if(won&&B.win.t<1600&&Math.random()<dt/40)
    B.fx.push({x:rnd(30,330),y:rnd(40,200),vx:rnd(-0.02,0.02),vy:rnd(-0.06,-0.01),t:700,col:Math.random()<0.5?'#ffe08a':'#ffffff',g:0.00005});
  B.fx.forEach(f=>{ f.t-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=dt*f.g;
    b.globalAlpha=Math.min(1,f.t/300); px(b,Math.round(f.x),Math.round(f.y),3,3,f.col); b.globalAlpha=1; });
  B.fx=B.fx.filter(f=>f.t>0);

  const pick=B.turn==='player'&&!B.over, W=battleWins(), dn=W.dn, id=actor();
  const list=B.menu!=='cmd'&&pick, L=list?subList():null;
  if(!B.over){
    rpgWin(W.msg); rpgWin(W.foe);
    gauge(W.foe.x+10,W.foe.y+25,W.foe.w-20,6,B.hp,B.maxhp,'#e8604a','#ffb09a');
    if(list){
      rpgWin(W.list); rpgWin(W.linfo);
      if(L.length) winCursor(W.list.x+6,W.list.y+SUB_Y0+(B.sub-B.top)*SUB_ROW,W.list.w-12,SUB_ROW-1);
    } else {
      rpgWin(W.cmd); rpgWin(W.party); rpgWin(W.info);
      B.party.forEach((m,i)=>{ const y=W.party.y+6+i*PARTY_ROW, M=member(m);
        if(pick&&m===id){ b.fillStyle='rgba(150,180,255,.22)'; b.beginPath(); b.roundRect(W.party.x+5,y,W.party.w-10,PARTY_ROW-2,4); b.fill(); }
        gauge(W.party.x+82,y+19,58,5,M.hp,M.maxhp,'#e8504a','#ffa8a0');
        gauge(W.party.x+150,y+19,50,5,M.mp,memberMaxMp(m),'#4aa8f0','#b0e0ff'); });
      if(pick) winCursor(W.cmd.x+6,cmdTop(W)+B.idx*CMD_ROW,W.cmd.w-12,CMD_ROW-2);
    }
  } else if(won){
    rpgWin({x:20,y:250+dn,w:320,h:190});
    gauge(40,334+dn,280,9,xs.xp,xs.next,'#f0c84a','#fff0b0');
    if(B.win.seed) drawShopPic(SPECIES[B.win.seed].name.toLowerCase()+" seed",52,392+dn,18,24);
  } else rpgWin({x:60,y:300+dn,w:240,h:84});
  blit();

  if(!B.over){
    wrapLines(B.log,19,W.msg.w-16).slice(0,2).forEach((ln,i,a)=>
      TS(ln,W.msg.x+10,W.msg.y+(a.length>1?14:21)+i*13,19,'#f4f6ff'));
    TS(B.name+(B.boss?"  ★":""),W.foe.x+10,W.foe.y+17,20,B.boss?'#ffd870':'#f4f6ff',null,true);
    if(list){
      const R=W.list, title=B.menu==='items'?"Items":PARTY_INFO[id].skills;
      TS(title,R.x+12,R.y+16,20,'#ffe08a',null,true);
      TS(B.menu==='items'?"from your basket":"MP "+member(id).mp+"/"+memberMaxMp(id),R.x+R.w-12,R.y+16,16,'#c8d4ff','right');
      if(!L.length) TS(B.menu==='items'?"Nothing to eat yet — harvest some crops!":"No skills learned yet.",
        R.x+R.w/2,R.y+SUB_Y0+30,17,'#aab6e8','center');
      L.slice(B.top,B.top+SUB_ROWS).forEach((x,j)=>{ const i=B.top+j, y=R.y+SUB_Y0+j*SUB_ROW+16.5, sel=i===B.sub;
        if(B.menu==='items'){
          TS(SPECIES[x].name,R.x+40,y,21,'#f4f6ff',null,sel);
          TS(eatText(x),R.x+200,y,16,'#b8f0a0');
          TS("x"+G.crops[x],R.x+R.w-12,y,18,'#f4f6ff','right');
        } else { const ok=member(id).mp>=x.mp;
          TS(x.name,R.x+40,y,21,ok?'#f4f6ff':'#7c84b0',null,sel);
          TS(x.mp+" MP",R.x+R.w-12,y,18,ok?'#a8d8ff':'#7c84b0','right'); } });
      if(B.top>0) TS("▲",R.x+R.w-40,R.y+SUB_Y0+8,13,'#c8d4ff','center');
      if(B.top+SUB_ROWS<L.length) TS("▼",R.x+R.w-40,R.y+R.h-4,13,'#c8d4ff','center');
      const [t1,t2]=subInfo(L[B.sub]);
      TS(t1,W.linfo.x+10,W.linfo.y+19,19,'#f4f6ff',null,true);
      TS(t2,W.linfo.x+10,W.linfo.y+36,16,'#c8d4ff');
    } else {
      CMDS.forEach((c,i)=>{ const y=cmdTop(W)+i*CMD_ROW+17, ok=cmdUsable(c,id);
        TS(cmdName(c,id),W.cmd.x+40,y,23,!pick?'#9aa4d0':ok?'#f4f6ff':'#7c84b0',null,pick&&i===B.idx); });
      B.party.forEach((m,i)=>{ const y=W.party.y+6+i*PARTY_ROW, M=member(m), mx=memberMaxMp(m);
        TS(PARTY_INFO[m].name,W.party.x+9,y+14,20,standing(m)?"#f4f6ff":"#8a90b8",null,true);
        TS("Lv."+M.lv,W.party.x+9,y+27,15,'#aab6e8');
        TS("HP",W.party.x+80,y+13,15,'#ffb0a8',null,true);
        TS(M.hp+"/"+M.maxhp,W.party.x+141,y+13,16,'#f4f6ff','right');
        TS("MP",W.party.x+148,y+13,15,'#a8d8ff',null,true);
        TS(M.mp+"/"+mx,W.party.x+201,y+13,16,'#f4f6ff','right'); });
      const [t1,t2]=pick?cmdInfo(CMDS[B.idx],id):[B.turn==='enemy'?"The "+B.name+"'s turn":"…",""];
      TS(t1,W.info.x+10,W.info.y+19,19,'#f4f6ff',null,true);
      wrapLines(t2,16,W.info.w-16).slice(0,1).forEach(ln=>TS(ln,W.info.x+10,W.info.y+36,16,'#c8d4ff'));
    }
  }
  B.pops.forEach(p=>{ p.t-=dt; p.y-=dt*0.03;
    const hop=Math.max(0,Math.sin((1100-p.t)/140))*6*Math.max(0,(p.t-600)/500);
    m.globalAlpha=Math.min(1,p.t/400); TO(p.txt,p.x,p.y-hop,40,p.col,'center',true,1.6); m.globalAlpha=1; });
  B.pops=B.pops.filter(p=>p.t>0);
  if(B.shout){
    const s=slotOf('kaitlyn'), kx=who&&who.id==='kaitlyn'?who.x:s.x;
    const sx=clamp(kx,60,300), sy=s.y-142;
    const w=TW(B.shout.txt,26,true)+22;
    m.globalAlpha=Math.min(1,B.shout.t/300);
    m.fillStyle='#2b1c12'; m.fillRect((sx-w/2-2)*SC,(sy-2)*SC,(w+4)*SC,26*SC);
    m.fillStyle='#fff6d8'; m.fillRect((sx-w/2)*SC,sy*SC,w*SC,22*SC);
    m.fillStyle='#2b1c12'; m.fillRect((sx-5)*SC,(sy+22)*SC,10*SC,7*SC);
    T(B.shout.txt,sx,sy+17,26,'#3a2a1a','center',true);
    m.globalAlpha=1;
  }
  if(won){
    const w=B.win, up=xs.lv>w.from.lv, pop=clamp(w.t/280,0,1);
    /* the banner drops in and settles */
    const size=Math.round(58+(1-pop)*30), by=96-(1-pop)*20;
    m.globalAlpha=pop; TO("VICTORY!",180,by,size,'#ffd24a','center',true,2.2);
    T("VICTORY!",180,by-size*0.04,size,'rgba(255,250,210,.35)','center',true); m.globalAlpha=1;
    TS("EXP",40,278+dn,20,'#c8d4ff',null,true); TS("+"+Math.round(w.xp*xs.k),320,278+dn,22,'#ffe08a','right',true);
    TS("Coins",40,300+dn,20,'#c8d4ff',null,true); TS("+"+Math.round(w.coins*xs.k)+"c",320,300+dn,22,'#ffe08a','right',true);
    TS("Kaitlyn  Lv."+xs.lv,40,327+dn,20,'#f4f6ff',null,true);
    if(up&&Math.floor(G.t/240)%2===0) TS("LEVEL UP!",168,327+dn,19,'#ffb04a',null,true);
    TS(xs.xp+" / "+xs.next,320,327+dn,17,'#c8d4ff','right');
    TS((xs.next-xs.xp)+" EXP to the next level",180,358+dn,17,'#aab6e8','center');
    if(w.seed) TS("Found: "+SPECIES[w.seed].name+" seed!",70,397+dn,20,'#b8f0a0',null,true);
    else TS("No seeds this time.",180,397+dn,18,'#8a94c4','center');
    if(!winGuard()&&Math.floor(G.t/500)%2===0) TS(IS_TOUCH?"tap or press A to continue":"J / tap to continue",180,428+dn,17,'#c8d4ff','center');
    return;
  }
  if(B.over){
    TS(B.over==='lose'?"Defeated...":"Got away!",180,334+dn,30,'#f4f6ff','center',true);
    TS(IS_TOUCH?"tap or press A to continue":"J / tap to continue",180,364+dn,17,'#c8d4ff','center');
  }
}

/* ---------------- level up ----------------
   Each level gained (LV_UPS, from battles, songs and the rest) gets its own blue
   screen once she's back in the garden: who, the new level, every stat with what it
   rose by, and anything learned. A tap or A moves on. */
let lvT=0;
function levelUpTap(){ if(lvT<400) return; LV_UPS.shift(); lvT=0; if(!LV_UPS.length) G.scene='world'; blip(520,0.04,0.08,'triangle'); }
function drawLevelUp(dt){
  lvT+=dt;
  const U=LV_UPS[0], I=PARTY_INFO[U.id], T0=BAND_TOP(), T1=BAND_BOT();
  const g=b.createLinearGradient(0,T0,0,T1); g.addColorStop(0,'#1c2a6e'); g.addColorStop(1,'#0a1030');
  b.fillStyle=g; b.fillRect(0,T0,LW,T1-T0);
  for(let i=0;i<24;i++){ const x=(i*67+G.t*0.02*(1+i%3))%LW, y=T0+((i*131)%(T1-T0)); b.globalAlpha=.25+.25*Math.sin(G.t/300+i);
    px(b,Math.round(x),Math.round(y),2,2,i%3?'#ffe08a':'#ffffff'); }
  b.globalAlpha=1;
  const W={x:16,y:118,w:328,h:322};
  rpgWin(W);
  b.fillStyle='#0a0f2a'; b.fillRect(W.x+14,W.y+14,88,100);
  const im=portraitImg(U.id);
  if(im){ const ph=96, pw=ph*im.naturalWidth/im.naturalHeight;
    b.save(); b.beginPath(); b.rect(W.x+16,W.y+16,84,96); b.clip(); b.imageSmoothingEnabled=true;
    b.drawImage(im,W.x+58-pw/2,W.y+16,pw,ph); b.restore(); }
  STATS.forEach((k,i)=>{ if(U.gains[k]){ b.fillStyle='rgba(255,224,138,.10)'; b.fillRect(W.x+12,W.y+128+i*21-14,W.w-24,19); } });
  blit();
  const pop=clamp(lvT/280,0,1), size=Math.round(56+(1-pop)*26);
  m.globalAlpha=pop; TO("LEVEL UP!",180,92-(1-pop)*16,size,'#ffd24a','center',true,2.2); m.globalAlpha=1;
  TS(I.name,W.x+114,W.y+40,30,'#f4f6ff',null,true);
  TS("Lv."+U.from+"  →  Lv."+U.lv,W.x+114,W.y+70,26,'#ffe08a',null,true);
  TS(I.role,W.x+114,W.y+92,16,'#aab6e8');
  STATS.forEach((k,i)=>{ const y=W.y+128+i*21, d=U.gains[k]||0, now=statOf(U.id,k,U.lv);
    TS(STAT_NAME[k],W.x+24,y,20,d?'#f4f6ff':'#8a94c4',null,!!d);
    TS(String(now-d),W.x+200,y,20,'#aab6e8','right');
    TS("→",W.x+222,y,18,'#8a94c4','center');
    TS(String(now),W.x+262,y,20,d?'#ffffff':'#aab6e8','right',!!d);
    if(d) TS("+"+d,W.x+W.w-20,y,20,'#ffe08a','right',true); });
  let y=W.y+128+STATS.length*21+6;
  if(U.learned.length) U.learned.forEach(n=>{ TS("Learned "+n+"!",180,y,21,'#b8f0a0','center',true); y+=20; });
  if(LV_UPS.length>1) TS("("+(LV_UPS.length-1)+" more)",W.x+W.w-12,W.y+W.h-10,15,'#8a94c4','right');
  if(lvT>400&&Math.floor(G.t/500)%2===0) TS(IS_TOUCH?"tap or press A to continue":"J / tap to continue",180,W.y+W.h+22,17,'#c8d4ff','center');
}
