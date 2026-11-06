/* ================================================================
   BATTLE
   The party (Kaitlyn and up to two friends, G.party) against a pest and maybe a few
   of its friends (B.foes, never more than the party). Every round, everyone still
   standing acts once, quickest (Agility) first: party members pick Attack, Skills,
   Meditate, Items or Flee, then who it's for when there's a choice; each pest uses
   one of its skills (PESTS). Poison, sleep and the like (STATUS) tick at the start
   of each turn. If Kaitlyn falls the fight is lost; a friend who falls goes home
   hurt for a couple of days.
   ================================================================ */
/* the foe in focus (being hit, or acting): about its middle; see focus() */
let EX=262, EY=210;
/* where the party stands (feet), by party size: a staggered line on the left; the
   foes mirror it on the right, a little smaller when there are more of them */
const FORMATION={1:[[80,262]],2:[[102,236],[58,300]],3:[[112,208],[80,262],[48,318]]};
const FOE_FORM={1:[[262,262]],2:[[250,236],[300,300]],3:[[300,206],[238,258],[306,316]]};   /* three zigzag so none hides another */
const FOE_SCALE={1:1,2:0.9,3:0.8}, FLY_LIFT=30;          /* flyers hover this high over their shadow */
const CMDS=['attack','skills','meditate','items','flee'];
const KILL_CHANCE=0.10;              /* Bling's venom can finish a (non-boss) foe outright */
const KARATE_SHOUTS=["Hi-YAH!","KIAI!","Hwaa-CHA!","Feel the flower power!"];
let B=null;
const listAnd=L=>L.length<2?L.join(''):L.slice(0,-1).join(", ")+" and "+L[L.length-1];
function startBattle(pest){
  padVec={x:0,y:0}; padId=null; btnHeld=false;        /* a held pad must not scroll the menu */
  const party=G.party.filter(id=>!isHurt(id)), boss=!!PESTS[pest.species].boss;
  /* friends of the pest may tag along: one more for each extra member, half the time */
  const kinds=[pest.species];
  if(!boss) for(let i=1;i<party.length;i++) if(Math.random()<0.5){ const pool=pestPool(); kinds.push(pool[ri(0,pool.length-1)]); }
  const D=diff();                      /* the Settings tab's difficulty */
  const foes=kinds.map((sp,i)=>{ const lv=i?pestLevel(sp):(pest.lv||PESTS[sp].lv), S=pestStats(sp,lv);
    S.hp=Math.round(S.hp*D.hp); S.atk*=D.atk;
    return {sp,lv,...S,maxhp:S.hp,hp:S.hp,name:PESTS[sp].name,boss:!!PESTS[sp].boss,
            slot:i,st:{},fade:0,flash:0,shake:0}; });
  /* two of a kind get letters */
  foes.forEach(f=>{ const same=foes.filter(g=>g.sp===f.sp); if(same.length>1) f.name+=" "+"ABC"[same.indexOf(f)]; });
  B={pest,foes,boss,party, act:0, menu:'cmd', idx:0, sub:0, top:0, readyT:0,
     guard:{},                       /* members braced by Meditate */
     st:{},                          /* members' troubles: st[id][status]=turns left */
     order:[], turn:'busy', tgt:null, inspect:null, prep:null, banner:null, lastFoe:foes[0],
     log:boss?"The HOA President demands a word!":foes.length===1?"A "+foes[0].name+" blocks your path!"
        :listAnd(foes.map(f=>f.name))+" block your path!",
     over:null,pops:[],fx:[],anim:null,shout:null};
  B.party.forEach(id=>B.st[id]={});
  G.scene='battle'; setMusic(boss?'boss':'battle'); blip(220,0.1,0.2); partyImg(); backdropImg();
  setTimeout(nextActor,900);
}
const standing=id=>member(id).hp>0;
const actor=()=>B.party[B.act];
const liveFoes=()=>B.foes.filter(f=>f.hp>0);
const allDown=()=>!B.foes.some(f=>f.hp>0);
/* just over a member's head, for numbers that pop up */
const headOf=id=>slotOf(id).y-(id==='kaitlyn'?110:36);
function slotOf(id){ const [x,y]=FORMATION[B.party.length][Math.max(0,B.party.indexOf(id))]; return {x,y}; }
/* where a foe stands: feet, size and how high it hovers */
function foeSpot(f){ const n=B.foes.length, [x,y]=FOE_FORM[n][f.slot];
  return {x,y,s:FOE_SCALE[n]*(PESTS[f.sp].size||1),lift:PESTS[f.sp].fly?FLY_LIFT:0}; }
/* point EX,EY (where hits and effects land) at a foe */
function focus(f){ if(!f) return; const p=foeSpot(f); EX=p.x; EY=p.y-p.lift-52*p.s; }
/* a foe's picture, as a box (taps, tags and the target pointer) */
function foeBox(f){ const p=foeSpot(f), a=typeof ENEMY_ART!=='undefined'&&ENEMY_ART[f.sp], k=p.s/SC;
  const w=a?a.r[2]*k:60*p.s, h=a?a.r[3]*k:60*p.s;
  return {x:p.x-(a?a.ax*k:w/2),y:p.y-p.lift-(a?a.ay*k:h),w,h}; }
function pop(txt,x,y,col,size){ B.pops.push({txt,x,y,t:1100,col,size}); }
/* Critical hits: a party member's hit lands extra hard now and then, more often the
   luckier they are */
const CRIT_MUL=1.75, critChance=id=>0.03+statOf(id,'luk')*0.004;
function burst(x,y,col,n,spd){ for(let i=0;i<(n||10);i++)
  B.fx.push({x,y,vx:rnd(-1,1)*(spd||0.13),vy:rnd(-0.19,0.03),t:520,col,g:0.001}); }
function anim(kind,dur,onHit,extra){ B.anim={kind,t:0,dur,hit:false,onHit,who:kind==='enemy'?null:actor(),...extra}; }
const has=(id,s)=>B.st[id]&&B.st[id][s]>0;
function addStatus(id,s){ if(!B.st[id]) B.st[id]={}; B.st[id][s]=STATUS[s].turns+(s==='sleep'?ri(0,1):0); }
const foeDef=f=>f.def*(f.st.guard?2:1);
/* damage after the target's Defense softens it (magic only half minds it) */
const soften=(raw,def,magic)=>Math.max(1,Math.round(raw*16/(16+def*(magic?0.5:1))));

/* ---------- turn order ---------- */
function newRound(){
  const L=B.party.filter(standing).map(id=>({id,a:statOf(id,'agi')+rnd(0,4)}));
  B.foes.forEach((f,i)=>{ if(f.hp>0) L.push({id:i,a:f.agi+rnd(0,4)}); });
  B.order=L.sort((x,y)=>y.a-x.a).map(o=>o.id);
}
/* whoever is next acts: a party member gets the menu, a pest (by number) takes its turn */
function nextActor(){
  if(!B||B.over) return;
  if(allDown()){ winFight(); return; }
  if(!B.order.length) newRound();
  const id=B.order.shift();
  if(typeof id==='number'){ const f=B.foes[id]; if(f.hp<=0){ nextActor(); return; }
    B.turn='enemy'; setTimeout(()=>foeTurn(f),500); return; }
  if(!standing(id)){ nextActor(); return; }
  B.act=B.party.indexOf(id);
  const why=memberTicks(id);
  if(B.over) return;
  if(why){ B.turn='busy'; B.log=why; setTimeout(nextActor,1100); return; }
  startTurn();
}
function startTurn(){ B.turn='player'; B.menu='cmd'; B.idx=0; B.readyT=0; B.tgt=null; }
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
  if(allDown()){ winFight(); return; }
  setTimeout(nextActor,250); B.turn='busy';
}

/* ---------- what each member can pick ---------- */
const skillList=id=>id==='kaitlyn'?moveList().filter(mv=>mv.id!=='kick'):(ALLY_SKILLS[id]||[]).filter(s=>s.lv<=member(id).lv);
const battleFood=()=>battleItems();             /* crops and goods that heal (17-places.js) */
const subList=()=>B.menu==='items'?battleFood():skillList(actor());
/* Karate Kick and the like cost a share of max HP instead of MP */
const hpCostOf=(sk,id)=>Math.max(1,Math.ceil(member(id).maxhp*sk.hpCost));
const canPay=(sk,id)=>sk.hpCost?member(id).hp>hpCostOf(sk,id):member(id).mp>=sk.mp;
const costText=(sk,id)=>sk.hpCost?hpCostOf(sk,id)+" HP":sk.mp+" MP";
/* the chance to get away: better the quicker the party is than the pests */
function fleeChance(){
  const avg=L=>L.reduce((a,v)=>a+v,0)/Math.max(1,L.length);
  const pa=avg(B.party.filter(standing).map(id=>statOf(id,'agi'))), fa=avg(liveFoes().map(f=>f.agi));
  return clamp(0.5+(pa-fa)*0.04,0.15,0.95);
}
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
  if(c==='skills') return skillList(id).length?[I.skills,id==='kaitlyn'?"Flute songs (♪) and moves":"Use a skill · uses MP"]
                                              :[I.skills,"None learned yet"];
  if(c==='meditate') return ["Meditate","Next hit halved · restores 5–10% HP/MP"];
  if(c==='items') return battleFood().length?["Items","Eat something from your basket"]:["Items","No healing food in your basket"];
  return B.boss?["Flee","You can't run from the HOA President!"]
               :["Flee","Run back to the garden · "+Math.round(fleeChance()*100)+"% chance"];
}
function subInfo(x){
  if(!x) return B.menu==='items'?["Items","Harvest crops to eat them in battle"]:["Skills","None learned yet"];
  if(B.menu==='items') return [itemName(x),itemText(x)];
  const id=actor();
  if(id==='kaitlyn') return [(x.song?"♪ ":"")+x.name,moveDesc(x)+" · "+costText(x,id)];
  return [x.name,x.desc+" · "+costText(x,id)];
}

/* ---------- picking who a move is for ----------
   With more than one to choose from the menu waits (B.menu 'target', B.tgt) for a
   pick: arrows and A, or a tap on them; back returns to where it came from. */
function chooseFoe(then){
  const L=liveFoes(); if(L.length===1){ then(L[0]); return; }
  B.tgt={kind:'foe',list:L,i:Math.max(0,L.indexOf(B.lastFoe)),then,back:B.menu}; B.menu='target';
  blip(520,0.04,0.08,'triangle');
}
function chooseAlly(then){
  const L=B.party.filter(standing); if(L.length===1){ then(L[0]); return; }
  B.tgt={kind:'ally',list:L,i:Math.max(0,L.indexOf(actor())),then,back:B.menu}; B.menu='target';
  blip(520,0.04,0.08,'triangle');
}
function pickTarget(i){
  const t=B.tgt, x=t.list[i]; B.tgt=null; B.menu='cmd';
  if(t.kind==='foe') B.lastFoe=x;
  t.then(x);
}
function cancelTarget(){ B.menu=B.tgt.back; B.tgt=null; blip(330,0.04,0.08,'triangle'); }
/* the foe or member drawn at x,y, if any */
function whoAt(x,y){
  for(const f of liveFoes()){ const r=foeBox(f); if(x>=r.x-6&&x<=r.x+r.w+6&&y>=r.y-6&&y<=r.y+r.h+6) return f; }
  for(const id of B.party){ const s=slotOf(id), h=id==='kaitlyn'?104:52;
    if(Math.abs(x-s.x)<=26&&y>=s.y-h&&y<=s.y+8) return id; }
  return null;
}

/* ---------- input ---------- */
const SUB_ROWS=3, SUB_ROW=24, SUB_Y0=24;
function setSub(i){ B.sub=i; if(i<B.top) B.top=i; if(i>=B.top+SUB_ROWS) B.top=i-SUB_ROWS+1; }
function openSub(kind){ B.menu=kind; B.sub=0; B.top=0; blip(520,0.04,0.08,'triangle'); }
function battleKey(k){
  if(!B)return;
  if(B.over){ if(!winSkip()&&!winGuard()) endBattle(); return; }
  if(B.inspect){ B.inspect=null; return; }
  if(B.turn!=='player')return;
  if(B.menu==='target'){
    const n=B.tgt.list.length;
    if(isUp(k)||isLeft(k)) B.tgt.i=(B.tgt.i+n-1)%n;
    if(isDown(k)||isRight(k)) B.tgt.i=(B.tgt.i+1)%n;
    if(isOk(k)) pickTarget(B.tgt.i);
    else if(isBack(k)) cancelTarget();
  } else if(B.menu==='cmd'){
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
const inRect=(r,x,y)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
function battleTouch(x,y){
  if(!B)return;
  if(B.over){ if(!winSkip()&&!winGuard()) endBattle(); return; }
  if(B.inspect){ B.inspect=null; return; }
  const W=battleWins(), who=whoAt(x,y);
  if(B.turn==='player'&&B.menu==='target'){
    const i=who?B.tgt.list.indexOf(who):-1;
    if(i>=0) pickTarget(i); else cancelTarget();
    return;
  }
  const list=B.menu==='skills'||B.menu==='items';
  const onWin=B.turn==='player'&&(list?inRect(W.list,x,y)||inRect(W.linfo,x,y):inRect(W.cmd,x,y)||inRect(W.party,x,y)||inRect(W.info,x,y));
  /* a tap on anyone in the scene: what they're like and what's troubling them */
  if(who&&!onWin){ B.inspect=who; blip(620,0.04,0.08,'triangle'); return; }
  if(B.turn!=='player')return;
  if(!list){
    /* a tap on a command uses it straight away */
    const C=W.cmd; if(x<C.x||x>C.x+C.w) return;
    const i=Math.floor((y-cmdTop(W))/CMD_ROW);
    if(i>=0&&i<CMDS.length){ B.idx=i; pickCmd(CMDS[i]); }
  } else {
    /* a tap on a row uses it; anywhere outside the list goes back */
    const L=W.list;
    if(!inRect(L,x,y)){ B.menu='cmd'; return; }
    const j=Math.floor((y-L.y-SUB_Y0)/SUB_ROW), sl=subList(), i=B.top+j;
    if(j>=0&&j<SUB_ROWS&&i<sl.length){ setSub(i); useSub(sl[i]); }
  }
}
function pickCmd(c){
  if(c==='attack') chooseFoe(doAttack);
  else if(c==='skills') openSub('skills');
  else if(c==='meditate') doMeditate();
  else if(c==='items') openSub('items');
  else tryFlee();
}
/* a skill, song or item from the list: check it can be paid for, then who it's for */
function useSub(x){
  const id=actor();
  if(B.menu==='items'){
    const e=isGoodKey(x)?goodEffect(x.slice(2)):null;
    if(e&&(e.hpAll||e.mpAll)) eatInBattle(x,id); else chooseAlly(to=>eatInBattle(x,to));
    return;
  }
  if(!canPay(x,id)){ B.log=x.hpCost?"Too worn out for that!":id==='kaitlyn'?"Not enough Music Points!":"Not enough MP!"; blip(150,0.08,0.2); return; }
  if(x.hpCost) chooseFoe(f=>useKarate(x,f));
  else if(x.notes){ if(x.pow>0&&!x.all) chooseFoe(f=>useSong(x,f)); else useSong(x,x.all?liveFoes()[0]:null); }
  else if(x.heal) useSkill(x,null);
  else chooseFoe(f=>useSkill(x,f));
}

/* ---------- the party's moves ---------- */
function tryFlee(){
  B.turn='busy';
  if(B.boss){ B.log="The HOA President blocks the gate!"; afterAction(); return; }
  if(Math.random()<fleeChance()){ B.over='flee'; B.log="You slipped away."; }
  else { B.log="Couldn't get away!"; afterAction(); }
}
function hitFoe(f,dmg,label){
  const crit=B.turn!=='enemy'&&Math.random()<critChance(actor());
  if(crit){ const d=Math.round(dmg*CRIT_MUL); label=label.replace(String(dmg),String(d))+"  Critical hit!"; dmg=d; }
  f.hp=Math.max(0,f.hp-dmg); f.shake=crit?520:340; f.flash=crit?320:200; focus(f);
  if(crit){ pop("-"+dmg+"!",EX,EY-10,'#ff9a3a',52); pop("CRITICAL!",EX,EY-42,'#fff07a',28); B.critT=260; blip(980,0.05,0.18,'square'); }
  else pop("-"+dmg,EX,EY-10,'#ffd24a');
  thud(); B.log=label;
  if(f.hp>0&&f.st.sleep&&Math.random()<0.4){ f.st.sleep=0; B.log+="  It wakes up!"; }   /* a hit may wake it */
  if(f.hp<=0&&liveFoes().length) B.log+="  The "+f.name+" runs off!";
}
/* Blind members miss half their attacks */
function missed(id){ if(has(id,'blind')&&Math.random()<0.5){ B.log=PARTY_INFO[id].name+" can't see and misses!"; return true; } return false; }
const weakMul=id=>has(id,'weak')?0.6:1;
const kickPower=pow=>statOf('kaitlyn','str')*1.5*pow*weakMul('kaitlyn')*(gearOn('kickers')?1.6:1);
/* Kaitlyn's kicks: the battle row (battle.png) plays, the hit lands partway through */
function kick(f,pow,name,row,shouts){
  B.shout={txt:shouts[ri(0,shouts.length-1)],t:1500};
  B.kickVar=row; playOne('kick',0.55);
  anim('kick',1100,()=>{
    if(missed('kaitlyn')) return;
    focus(f); const dmg=soften(kickPower(pow)*rnd(0.85,1.15),foeDef(f));
    burst(EX-20,EY+16,'#ffe6a0',16,0.19); burst(EX-30,EY+34,'#d8c49a',12,0.13);
    hitFoe(f,dmg,name+" lands for "+dmg+"!");
  },{tgt:f});
}
function doAttack(f){
  const id=actor(), I=PARTY_INFO[id];
  B.turn='busy';
  if(id==='kaitlyn'){ kick(f,I.pow,"Quick Kick",Math.random()<0.5?'kick':'kick2',KICK_SHOUTS); return; }
  /* Bling: a weak bite, but the venom always takes, and now and then it's too much */
  anim('lunge',900,()=>{
    if(missed(id)) return;
    focus(f); const power=statOf(id,'str')*1.5*I.pow*weakMul(id);
    const dmg=soften(power*rnd(0.85,1.15),foeDef(f));
    burst(EX-20,EY+20,'#ffe6a0',14,0.17);
    hitFoe(f,dmg,I.name+"'s "+I.attack+" hits for "+dmg+"!");
    if(f.hp<=0) return;
    f.st.poison={n:STATUS.poison.turns,dmg:Math.round(2+statOf(id,'int')*0.5)};
    burst(EX,EY+10,'#b06ae0',12,0.12);
    if(!f.boss&&Math.random()<KILL_CHANCE){ f.hp=0; B.log="Bling's venom overwhelms the "+f.name+"!"; }
    else B.log+="  It's poisoned!";
  },{tgt:f});
}
/* Karate Kick: twice a Quick Kick, paid for with a little of her HP (its own battle row
   when battle.png has one) */
function useKarate(mv,f){
  const id=actor(), M=member(id), c=hpCostOf(mv,id), s=slotOf(id);
  M.hp=Math.max(1,M.hp-c); pop("-"+c,s.x,headOf(id),'#ffb0a8');
  B.turn='busy'; B.menu='cmd';
  kick(f,mv.pow,mv.name,BROW.karate!==undefined?'karate':'kick',KARATE_SHOUTS);
}
const songPower=()=>statOf('kaitlyn','int')*1.3*(gearOn('polish')?1.3:1)*fluteMul()*weakMul('kaitlyn');
function useSong(mv,f){
  G.player.mp-=mv.mp; B.turn='busy';
  startRhythm(null,{notes:mv.notes,name:mv.name,mp:mv.mp,cb:(acc)=>{
    G.scene='battle'; B.menu='cmd'; playOne('flute',0.5);
    anim(mv.fx,1500,()=>{
      if(mv.heal){       /* healing songs reach the whole party */
        const h=Math.round(mv.heal*(0.5+acc)*(statOf('kaitlyn','int')/7*0.5+0.5));
        B.party.filter(standing).forEach(id=>{ const M=member(id), s=slotOf(id);
          M.hp=Math.min(M.maxhp,M.hp+h); pop("+"+h,s.x,headOf(id),'#8fe07a'); });
      }
      if(mv.pow>0&&f){
        /* a song for everyone hits every pest still there */
        const T=mv.all?liveFoes():[f];
        T.forEach(t=>{ const dmg=soften(songPower()*mv.pow*(0.35+acc*1.1),foeDef(t),true);
          hitFoe(t,dmg,mv.name+" hits for "+dmg+"!  ("+Math.round(acc*100)+"%)");
          if(mv.weaken&&t.hp>0){ t.st.weak=STATUS.weak.turns; B.log+="  Its attack drops!"; } });
        if(T.length>1) B.log=mv.name+" sweeps over every pest!  ("+Math.round(acc*100)+"%)";
      } else B.log=mv.name+" heals the party.";
    },{tgt:f});
  }});
}
/* a friend's skill (ALLY_SKILLS); f is the foe it's aimed at */
function useSkill(sk,f){
  const id=actor(), M=member(id), name=PARTY_INFO[id].name;
  M.mp-=sk.mp; B.turn='busy'; B.menu='cmd';
  const spell=PARTY_ART[id]&&PARTY_ART[id].spell;      /* their own spell animation, when they have one */
  anim(spell?'spell':sk.heal?'meditate':'lunge',spell?1400:1000,()=>{
    if(sk.sleep){      /* Hypnosis: the foe nods off for a few turns (a boss shrugs it off more often) */
      if(Math.random()<sk.sleep*(f.boss?0.5:1)){ f.st.sleep=2+ri(0,1); B.log=name+"'s "+sk.name+" sends the "+f.name+" to sleep!"; }
      else B.log="The "+f.name+" shakes off "+name+"'s "+sk.name+".";
      return;
    }
    if(sk.heal){
      const h=Math.round(M.maxhp*sk.heal), s=slotOf(id);
      M.hp=Math.min(M.maxhp,M.hp+h); pop("+"+h,s.x,headOf(id),'#8fe07a');
      if(sk.cure) ['poison','blind','weak'].forEach(k=>B.st[id][k]=0);
      B.log=name+" uses "+sk.name+": +"+h+" HP"+(sk.cure?" and feels clean":"")+".";
      return;
    }
    let mul=1; if(sk.burst&&f.st.poison){ mul=3; f.st.poison=null; }
    const dmg=soften(statOf(id,'int')*1.5*sk.pow*mul*weakMul(id)*rnd(0.9,1.1),foeDef(f),true);
    hitFoe(f,dmg,name+"'s "+sk.name+" hits for "+dmg+"!"+(mul>1?"  The venom bursts!":""));
    if(f.hp>0&&sk.bind&&Math.random()<sk.bind){ f.st.bound=1; B.log+="  It's held fast!"; }
  },{heal:!!sk.heal,tgt:f});
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
/* the one whose turn it is eats, or hands it to `to` */
function eatInBattle(sp,to){
  const id=actor(), name=PARTY_INFO[id].name;
  to=to||id;
  B.turn='busy'; B.menu='cmd';
  anim('eat',800,()=>{
    const before=member(to).hp, item=itemName(sp), text=useItem(sp,to), gain=member(to).hp-before, s=slotOf(to);
    if(gain>0) pop("+"+gain,s.x,headOf(to),'#8fe07a');
    B.log=(to===id?name+" has the ":name+" gives "+PARTY_INFO[to].name+" the ")+item+": "+text+".";
    if(AC){ blip(620,0.06,0.1,'sine'); flute(9,AC.currentTime+.06,.25,.4); }
  },{eater:to});
}

/* ---------- a pest's turn ----------
   Anything but its plain first skill is a special move: it flashes and the move's
   name shows (B.prep, B.banner) a moment before it lets loose. */
const PREP_MS=700;
function foeTurn(f){
  if(!B||B.over) return;
  const P=PESTS[f.sp], F=f.st;
  F.guard=0; focus(f);
  if(F.poison){ const d=F.poison.dmg; f.hp=Math.max(0,f.hp-d); pop("-"+d,EX,EY-10,'#c88ae0'); burst(EX,EY+10,'#b06ae0',8,0.1);
    B.log="The "+f.name+" takes "+d+" from poison."; if(--F.poison.n<=0) F.poison=null;
    if(f.hp<=0){ B.log+="  It runs off!"; setTimeout(()=>{ if(!B||B.over) return; if(allDown()) winFight(); else nextActor(); },900); return; } }
  if(F.bound>0){ F.bound--; B.log="The "+f.name+" struggles but can't move!"; setTimeout(nextActor,1000); return; }
  if(F.sleep>0){ F.sleep--; B.log="The "+f.name+" is fast asleep..."; setTimeout(nextActor,1000); return; }
  if(F.weak>0) F.weak--;
  const charged=F.charge; F.charge=0;
  /* a charged-up pest always lets loose with its strongest hit */
  const sk=charged?P.skills.filter(s=>s.kind==='hit').sort((a,z)=>z.pow-a.pow)[0]:pickWeighted(P.skills);
  const live=B.party.filter(standing);
  const targets=sk.kind==='all'?live:sk.kind==='multi'?Array.from({length:sk.hits},()=>live[ri(0,live.length-1)])
               :sk.kind==='hit'||sk.kind==='steal'?[live[ri(0,live.length-1)]]:[];
  const go=()=>{ if(!B||B.over) return; B.prep=null;
    B.log="The "+f.name+" uses "+sk.name+"!";
    anim('enemy',sk.kind==='multi'?1300:900,()=>foeHits(f,sk,targets,charged),{fx:sk.fx,targets,self:!targets.length,foe:f}); };
  if(sk!==P.skills[0]||charged){
    B.prep={f,t:0}; B.banner={txt:sk.name,f,t:PREP_MS+1100};
    B.log="The "+f.name+" is up to something...";
    blip(740,0.05,0.12,'triangle'); setTimeout(go,PREP_MS);
  } else go();
}
function pickWeighted(list){ let t=list.reduce((a,s)=>a+s.w,0)*Math.random();
  for(const s of list){ t-=s.w; if(t<=0) return s; } return list[0]; }
function foeHits(f,sk,targets,charged){
  if(!B||B.over) return;
  const F=f.st; focus(f);
  if(sk.kind==='guard'){ F.guard=1; B.log="The "+f.name+" uses "+sk.name+". Hits on it are halved!"; return; }
  if(sk.kind==='charge'){ F.charge=1; B.log="The "+f.name+" gathers its strength..."; return; }
  if(sk.kind==='heal'){ const h=Math.round(f.maxhp*sk.heal); f.hp=Math.min(f.maxhp,f.hp+h);
    pop("+"+h,EX,EY-10,'#8fe07a'); B.log="The "+f.name+" uses "+sk.name+" and recovers "+h+" HP."; return; }
  if(sk.kind==='steal'){
    const id=targets[0], luck=statOf(id,'luk');
    if(Math.random()<luck*0.02){ B.log=PARTY_INFO[id].name+" keeps a tight grip on the coin purse!"; return; }
    const n=Math.min(G.coins,Math.round(f.atk*1.5+ri(0,6))); G.coins-=n;
    const s=slotOf(id); pop("-"+n+"c",s.x,headOf(id),'#ffd24a');
    B.log="The "+f.name+" uses "+sk.name+" and makes off with "+n+"c!"; return;
  }
  const lines=[];
  targets.forEach(id=>{
    if(!standing(id)) return;
    const name=PARTY_INFO[id].name, s=slotOf(id), M=member(id);
    if(sk.miss&&Math.random()<sk.miss){ pop("miss",s.x,headOf(id),'#e8eef8'); lines.push("It misses "+name+"."); return; }
    if(sk.pow>0){
      const braced=B.guard[id]; B.guard[id]=false;
      const raw=f.atk*sk.pow*rnd(0.8,1.2)*(F.weak>0?0.6:1)*(charged?2:1)*(braced?0.5:1);
      const dmg=soften(raw,statOf(id,'def'));
      M.hp=Math.max(0,M.hp-dmg); if(B.st[id]) B.st[id].sleep=0;            /* a hit wakes you */
      pop("-"+dmg,s.x,headOf(id),'#ff8a8a'); burst(s.x,s.y-80,'#ff9a8a',8);
      if(sk.drain){ const h=Math.round(dmg*sk.drain); f.hp=Math.min(f.maxhp,f.hp+h); pop("+"+h,EX,EY-10,'#8fe07a'); }
      if(targets.length===1) lines.push("It hits "+name+" for "+dmg+"!"+(braced?" (braced)":"")+(charged?" A huge blow!":""));
    }
    if(standing(id)&&sk.st&&Math.random()<sk.p){ addStatus(id,sk.st); lines.push(name+" is "+STATUS[sk.st].name.toLowerCase()+"!"); }
    if(!standing(id)){ lines.push(name+" is down!"); if(id==='kaitlyn'){ B.over='lose'; } }
  });
  if(targets.length>1&&sk.pow>0) lines.unshift(sk.kind==='multi'?"It hits again and again!":"It hits the whole party!");
  B.log="The "+f.name+" uses "+sk.name+"!  "+lines.join("  ");
  blip(180,0.09,0.2);
  if(B.over==='lose') B.log="Kaitlyn is worn out...";
}

/* ---------- victory: rewards are given at once, the screen then shows them ---------- */
/* A win: everyone strikes their victory pose for POSE_MS, then the results fade in over
   the whole screen and each EXP bar fills (WIN_FILL ms, ticking as it goes). */
const SEED_LOOT=0.10, POSE_MS=2500, RESULTS_FADE=400, WIN_DELAY=POSE_MS+RESULTS_FADE+150, WIN_FILL=1400, WIN_GUARD=WIN_DELAY+300;
/* the victory window, along the bottom under the party: the rewards, then a row (name,
   level, EXP bar) for each one standing */
const VW={top:32,step:38,foot:30};
const vwHeight=n=>VW.top+n*VW.step+VW.foot;
function winFight(){
  if(B.over) return;
  B.over='win'; B.log=B.foes.length>1?"The pests flee the garden!":"The "+B.foes[0].name+" flees the garden!";
  setMusic('victory'); winRewards();
}
/* Luck (the luckiest one standing) helps find seeds and sometimes bonus coins */
function winRewards(){
  const up=B.party.filter(standing);
  const luck=Math.max(...up.map(id=>statOf(id,'luk')));
  const seed=Math.random()<SEED_LOOT+luck*0.004&&G.unlocked.length?G.unlocked[ri(0,G.unlocked.length-1)]:null;
  const bonus=Math.random()<luck*0.015;
  const xp=B.foes.reduce((a,f)=>a+f.xp,0);
  const coins=Math.round(B.foes.reduce((a,f)=>a+f.coin,0)*(bonus?1.5:1));
  const from={}; up.forEach(id=>{ const M=member(id); from[id]={lv:M.lv,xp:M.xp,next:M.next}; });
  /* drops: each pest may leave an ordinary thing, or (rarely) a special one */
  const drops=[];
  B.foes.forEach(f=>{ const D=PEST_DROPS[f.sp]; if(!D) return;
    const k=Math.random()<RARE_P?D[1]:Math.random()<DROP_P?D[0]:null;
    if(k){ G.goods[k]=(G.goods[k]||0)+1; drops.push(k); } });
  B.win={xp,coins,bonus,seed,from,who:up,t:0,drops,tick:0};
  G.coins+=coins; if(seed) G.seeds[seed]=(G.seeds[seed]||0)+1;
  G.pests=G.pests.filter(p=>p!==B.pest); G.mtnPests=G.mtnPests.filter(p=>p!==B.pest);
  B.foes.forEach(f=>G.lore.beat[f.sp]=(G.lore.beat[f.sp]||0)+1);      /* for the Bestiary */
  up.forEach(id=>addXpTo(id,xp));          /* everyone still standing learns from it */
}
/* a moment's pause so the key that won the fight doesn't also close the screen */
const winGuard=()=>B.over==='win'&&B.win&&B.win.t<WIN_GUARD;
/* a key or tap during the poses skips ahead to the results */
function winSkip(){ if(B.over==='win'&&B.win&&B.win.t<POSE_MS){ B.win.t=POSE_MS; return true; } return false; }
/* a member's EXP bar as it fills, levelling up the same way addXpTo does */
function xpShown(id){
  const w=B.win, k=clamp((w.t-WIN_DELAY)/WIN_FILL,0,1), f=w.from[id||'kaitlyn'];
  let lv=f.lv, xp=f.xp+w.xp*k, next=f.next;
  while(xp>=next){ xp-=next; lv++; next=xpNeed(lv); }
  return {lv,xp:Math.floor(xp),next,k};
}
function endBattle(){
  if(B.over==='win'){ const w=B.win;      /* rewards were given when the fight was won */
    say((B.boss?"The HOA President retreats! ":"Won!  ")+"+"+w.coins+"c"+(w.bonus?" (lucky!)":"")+"  +"+w.xp+"xp"+(w.seed?"  + a seed":"")); }
  else if(B.over==='lose'){
    G.player.hp=Math.max(4,Math.floor(G.player.maxhp*0.4));
    G.pests=G.pests.filter(p=>p!==B.pest); G.mtnPests=G.mtnPests.filter(p=>p!==B.pest); G.player.x=338; G.player.y=396; G.indoors=false; G.area='garden';
    const lost=Math.floor(G.coins*0.5); G.coins-=lost;
    say("A frog nudged you awake by the pool. You dropped "+lost+"c."); }
  else { B.pest.x+=rnd(-60,60); B.pest.y+=rnd(-60,60); say("You slipped away."); }
  /* friends who fell go home to recover */
  const hurt=B.party.filter(id=>id!=='kaitlyn'&&!standing(id));
  hurt.forEach(id=>{ const A=G.allies[id]; A.hurtUntil=G.day+HURT_DAYS; A.hp=0; G.party=G.party.filter(x=>x!==id); });
  if(hurt.length) say(hurt.map(id=>PARTY_INFO[id].name).join(" and ")+" got hurt and went home to rest (back in "+HURT_DAYS+" days).");
  B=null; G.scene='world'; setMusic(areaMusic()); autoSave();
}

/* ---------- drawing the party ----------
   Out of turn a member holds their battle stance (Kaitlyn's is pose.png, the others'
   come from party.webp); on their turn they ease into their ready loop. Kaitlyn's
   kick, flute and victory rows come from battle.png. Each draws onto c (the scene, or
   the silhouette canvas for shadows and flashes). */
let IMG_PARTY=null;
function partyImg(){
  if(!IMG_PARTY){ IMG_PARTY=new Image(); IMG_PARTY.src=ASSET_PARTY; }
  return IMG_PARTY.complete&&IMG_PARTY.naturalWidth?IMG_PARTY:null;
}
const READY_MS={kaitlyn:70,bling:50}, READY_FADE=220;
/* a party.webp frame at 2 device px per sheet px, its ax,ay on the given feet */
function partyFrame(c,r,ax,ay,x,y){
  const img=partyImg(); if(!img||!r) return false;
  const [sx,sy,w,h]=r;
  c.save(); c.translate(x,y); c.scale(2/SC,2/SC);
  c.drawImage(img,sx,sy,w,h,-ax,-ay,w,h); c.restore(); return true;
}
function drawStance(c,id,x,y){
  if(id==='kaitlyn'){ drawPose(c,0,x,y); return; }
  const A=PARTY_ART[id], s=A&&A.stance;
  if(s) partyFrame(c,s.r,s.ax,s.ay,x,y);
  else if(A) partyFrame(c,A.ready[0],A.ax,A.ay,x,y);
}
function drawReady(c,id,x,y,t){
  const A=PARTY_ART[id];
  if(!A){ drawStance(c,id,x,y); return; }
  const i=Math.floor(t/(READY_MS[id]||60))%A.ready.length;
  partyFrame(c,A.ready[i],A.ax,A.ay,x,y);
}
const SONG_FX=['sprout','lull','waltz','req','thorn','hymn'];
function drawMember(c,id,x,y,k){
  const mine=B.anim&&B.anim.who===id, kind=mine?B.anim.kind:null;
  if(id==='kaitlyn'){
    if(B.over==='lose'||!standing(id)){ drawPose(c,1,x,y); return; }
    if(B.over==='win'){ const n=BRN[BROW.victory]||1; drawBattleRow(c,'victory',Math.floor(G.t/85)%n,x,y); return; }
    if(kind==='kick'){ const v=B.kickVar||'kick', n=BRN[BROW[v]]||1; drawBattleRow(c,v,Math.floor(k*n),x,y); return; }
    if(SONG_FX.includes(kind)){ const n=BRN[BROW.flute]||1; drawBattleRow(c,'flute',Math.floor(k*n),x,y); return; }
  }
  if(!standing(id)){ c.globalAlpha=.45; drawStance(c,id,x,y); c.globalAlpha=1; return; }
  /* a win: their victory loop, or until they have one, a happy bounce on their spell's
     coiled-up frames */
  if(B.over==='win'){ const A=PARTY_ART[id]||{}, v=A.victory||A.spell;
    if(v){ const f=A.victory?v.f:v.f.slice(4,7), i=Math.floor(G.t/(A.victory?80:160))%f.length;
      partyFrame(c,f[i],v.ax,v.ay,x,y-(A.victory?0:Math.abs(Math.sin(G.t/240))*5)); return; } }
  if(kind==='spell'){ const a=PARTY_ART[id].spell;
    partyFrame(c,a.f[Math.min(a.f.length-1,Math.floor(k*a.f.length))],a.ax,a.ay,x,y); return; }
  if(kind==='lunge'){ const a=PARTY_ART[id]&&PARTY_ART[id].attack;
    if(a) partyFrame(c,a.f[Math.min(a.f.length-1,Math.floor(k*a.f.length))],a.ax,a.ay,x,y);
    else drawReady(c,id,x,y,B.anim.t+1500);                       /* the strike part of the loop */
    return; }
  const ready=B.turn==='player'&&!B.over&&actor()===id;
  const f=ready?clamp(B.readyT/READY_FADE,0,1):0;
  if(f<1) drawStance(c,id,x,y);
  if(f>0){ c.globalAlpha=f; drawReady(c,id,x,y,B.readyT); c.globalAlpha=1; }
}
/* ---------- shadows and flashes ----------
   A sprite drawn (feet at 0,0) into a spare canvas and filled with one colour: laid
   flat on the ground for its shadow (the light is up and to the left, so it falls
   down and to the right), or over the sprite for a white flash. */
const SHAPE=document.createElement('canvas'), shapeC=SHAPE.getContext('2d'), SHAPE_W=200, SHAPE_H=200, SHAPE_FX=100, SHAPE_FY=190;
function silhouette(draw,col){
  if(SHAPE.width!==SHAPE_W*SC){ SHAPE.width=SHAPE_W*SC; SHAPE.height=SHAPE_H*SC; }
  shapeC.setTransform(1,0,0,1,0,0); shapeC.globalCompositeOperation='source-over'; shapeC.globalAlpha=1;
  shapeC.clearRect(0,0,SHAPE.width,SHAPE.height);
  shapeC.setTransform(SC,0,0,SC,SHAPE_FX*SC,SHAPE_FY*SC); draw(shapeC);
  shapeC.setTransform(1,0,0,1,0,0); shapeC.globalAlpha=1; shapeC.globalCompositeOperation='source-in';
  shapeC.fillStyle=col; shapeC.fillRect(0,0,SHAPE.width,SHAPE.height); shapeC.globalCompositeOperation='source-over';
  return SHAPE;
}
/* its shadow on the ground at x,y; lift: how high it hovers (the shadow drops further
   away and fainter) */
function castShadow(draw,x,y,lift,a){
  const S=silhouette(draw,'#14200c'), l=lift||0;
  b.save(); b.globalAlpha=a*(l?0.75:1);
  b.translate(x+l*0.45,y+l*0.12); b.transform(1,0,-0.55,-0.26*(l?0.8:1),0,0);
  b.drawImage(S,-SHAPE_FX,-SHAPE_FY,SHAPE_W,SHAPE_H); b.restore();
}
function flashOver(draw,x,y,a){
  if(a<=0) return;
  const S=silhouette(draw,'#ffffff');
  b.save(); b.globalAlpha=Math.min(1,a); b.drawImage(S,x-SHAPE_FX,y-SHAPE_FY,SHAPE_W,SHAPE_H); b.restore();
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
  } else if(kind==='spell'){
    /* venom magic: purple motes gather round them, then (for an attack) fly at the foe */
    const heal=B.anim&&B.anim.heal;
    for(let i=0;i<10;i++){ const a=i*0.63+G.t/250, r=18+Math.sin(G.t/200+i)*6;
      b.globalAlpha=Math.sin(Math.min(1,k*1.4)*Math.PI)*0.85;
      px(b,Math.round(ax+Math.cos(a)*r),Math.round(ay-14+Math.sin(a)*r*0.5),3,3,heal?(i%2?'#c8f0b0':'#e8fff0'):(i%2?'#b06ae0':'#e0b0ff')); }
    b.globalAlpha=1;
    if(!heal&&k>0.45&&k<0.75){ const q=(k-0.45)/0.3;
      for(let i=0;i<5;i++){ const x=ax+(EX-ax)*q+Math.sin(i*1.7+q*6)*6, y=ay-14+(EY+20-ay+14)*q-Math.sin(q*Math.PI)*24+i*3;
        b.fillStyle='#8a3ac8'; b.beginPath(); b.arc(x,y,3.4,0,7); b.fill(); b.fillStyle='#e0b0ff'; b.beginPath(); b.arc(x-1,y-1,1.4,0,7); b.fill(); } }
  } else if(kind==='eat'){
    for(let i=0;i<7;i++){
      const y=ay-60-k*50-i*6, x=ax+Math.sin(i*2.1)*22;
      b.globalAlpha=1-k; px(b,Math.round(x),Math.round(y),4,4,i%2?'#8fe07a':'#ffe08a'); }
    b.globalAlpha=1;
  }
}
/* ---------------- the battle screen ----------------
   A painted garden backdrop for the season and hour, and classic RPG windows:
   message along the top with each pest's name, level and HP below it; along the bottom the
   commands, the party (room for three) and what the highlighted choice does. The
   Songs / Skills / Items lists open over the commands and the party. */
const BWIN={msg:{x:8,y:8,w:344,h:40}, foe:{x:8,y:54,w:196,h:32},
            cmd:{x:8,y:322,w:128,h:152}, party:{x:142,y:322,w:210,h:100}, info:{x:142,y:428,w:210,h:46},
            list:{x:8,y:322,w:344,h:100}, linfo:{x:8,y:428,w:344,h:46}};
const CMD_ROW=26, HORIZON=150, PARTY_ROW=30, FOE_ROW=24;
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
/* The season's painted backdrop (backdrops/<season>), placed so where its lawn begins
   (BACK_HORIZON, a share of its height) lines up with HORIZON, and big enough to
   cover the whole scene. Until it loads, a drawn one stands in. */
const BACK_HORIZON={spring:0.50,summer:0.53,fall:0.53,winter:0.57}, BACK_IMG={};
function backdropImg(){
  const s=season(); if(typeof BACKDROPS==='undefined'||!BACKDROPS.includes(s)) return null;
  if(!BACK_IMG[s]){ BACK_IMG[s]=new Image(); BACK_IMG[s].src='assets/scenes/backdrop_'+s+'.jpg'; }
  return BACK_IMG[s].complete&&BACK_IMG[s].naturalWidth?BACK_IMG[s]:null;
}
function drawBattleBackdrop(dt){
  const P=BACKDROP[season()]||BACKDROP.spring, T0=BAND_TOP(), T1=BAND_BOT(), im=backdropImg();
  if(im){
    const f=BACK_HORIZON[season()]||0.5, r=im.naturalWidth/im.naturalHeight;
    const h=Math.max((T1-HORIZON)/(1-f),(HORIZON-T0)/f,LW/r), w=h*r;
    b.save(); b.imageSmoothingEnabled=true; b.drawImage(im,(LW-w)/2,HORIZON-f*h,w,h); b.restore();
  } else if(typeof BACKDROPS==='undefined'||!BACKDROPS.includes(season())) drawnBackdrop(P,T0,T1);
  else { b.fillStyle='#000'; b.fillRect(0,T0,LW,T1-T0); }        /* its painting is still loading */
  backdropLife(P,T0,T1,dt);
}
/* the stand-in: sky, clouds, trees, hedge and a striped lawn */
function drawnBackdrop(P,T0,T1){
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
}
/* over either backdrop: light where everyone stands, drifting petals/leaves/snow, the hour */
function backdropLife(P,T0,T1,dt){
  /* light pools where the pests and each of the party stand */
  b.fillStyle='rgba(255,255,240,.16)';
  B.foes.forEach(f=>{ if(f.fade>=1) return; const p=foeSpot(f); b.beginPath(); b.ellipse(p.x,p.y+2,56*p.s,13*p.s,0,0,7); b.fill(); });
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
function foeTags(f){ const F=f.st, L=[];
  if(F.poison) L.push(["PSN",STATUS.poison.col]); if(F.bound) L.push(["BND",STATUS.bound.col]);
  if(F.weak) L.push(["WK",STATUS.weak.col]); if(F.sleep) L.push(["SLP",STATUS.sleep.col]);
  if(F.guard) L.push(["GRD",'#3a8a5a']); if(F.charge) L.push(["!!",'#d84a3a']);
  return L; }
function memberTags(id){ const S=B.st[id]||{};
  const L=Object.keys(STATUS).filter(k=>S[k]>0).map(k=>[STATUS[k].tag,STATUS[k].col]);
  if(B.guard[id]) L.push(["GRD",'#3a8a5a']);
  return L; }
function drawStatusTags(){
  const tag=(x,y,list)=>{ list.forEach(([t,col],i)=>{ const w=t.length*4.6+7, xx=x-(list.length*(w+2))/2+i*(w+2);
    b.fillStyle='#0a0f2a'; b.beginPath(); b.roundRect(xx-0.5,y-0.5,w+1,10,3); b.fill();
    b.fillStyle=col; b.beginPath(); b.roundRect(xx,y,w,9,2.5); b.fill();
    b.fillStyle='#ffffff'; b.font='bold 6.5px '+FONT; b.textAlign='center'; b.fillText(t,xx+w/2,y+7); });
    b.textAlign='left'; };
  if(B.over==='win') return;
  B.party.forEach(id=>{ if(!standing(id)) return; const s=slotOf(id), L=memberTags(id);
    if(L.length) tag(s.x,s.y-(id==='kaitlyn'?138:58),L); });
  if(!B.over) liveFoes().forEach(f=>{ const L=foeTags(f), r=foeBox(f); if(L.length) tag(r.x+r.w/2,Math.max(BAND_TOP()+4,r.y-12),L); });
}
/* what a tap on someone shows: who they are, how they're doing, and what each of their
   troubles does */
const ST_DESC={poison:"loses a little HP every turn",blind:"attacks miss half the time",
  sleep:"can't act (a hit may wake them)",weak:"hits do 40% less damage",scared:"half the time too scared to move",
  bound:"held fast: loses a turn",guard:"braced: hits on it are halved",charge:"its next hit is twice as hard",
  braced:"braced: the next hit is halved"};
function inspectInfo(x){
  const out={lines:[]}, add=(t,col,size,bold)=>out.lines.push({t,col:col||'#c8d4ff',size:size||17,bold});
  const trouble=(name,col,what,left)=>add("• "+name+": "+what+(left?" ("+left+" turn"+(left===1?"":"s")+" left)":"")+".",col,17);
  if(typeof x==='object'){ const f=x, P=PESTS[f.sp], F=f.st;
    out.title=f.name+(f.boss?"  ★":""); out.lv=f.lv; out.col=f.boss?'#ffd870':'#f4f6ff';
    add("HP "+f.hp+" / "+f.maxhp+"    Attack "+Math.round(f.atk)+"    Defense "+Math.round(f.def)+"    Agility "+Math.round(f.agi),'#f4f6ff',17);
    if(P.about) add(P.about,'#c8d4ff',17);
    const S=[];
    if(F.poison) S.push(["Poison",STATUS.poison.col,"takes "+F.poison.dmg+" HP every turn",F.poison.n]);
    if(F.bound) S.push(["Bound",'#d8b07a',ST_DESC.bound,0]);
    if(F.weak) S.push(["Weak",'#f0b070',ST_DESC.weak,F.weak]);
    if(F.sleep) S.push(["Asleep",'#9ac0ff',ST_DESC.sleep,F.sleep]);
    if(F.guard) S.push(["Guarding",'#8fe0a8',ST_DESC.guard,0]);
    if(F.charge) S.push(["Charged up",'#ff9a8a',ST_DESC.charge,0]);
    if(S.length){ add("Troubles","#ffe08a",18,true); S.forEach(s=>trouble(...s)); } else add("Nothing troubling it.",'#8a94c4',16);
    return out;
  }
  const id=x, I=PARTY_INFO[id], M=member(id), St=B.st[id]||{};
  out.title=I.name; out.lv=M.lv; out.col='#f4f6ff';
  add("HP "+M.hp+" / "+M.maxhp+"    MP "+M.mp+" / "+memberMaxMp(id),'#f4f6ff',17);
  add(["str","agi","def","int","luk"].map(k=>STAT_NAME[k].slice(0,3)+" "+statOf(id,k)).join("   "),'#c8d4ff',16);
  add(I.role,'#aab6e8',16);
  const S=Object.keys(STATUS).filter(k=>St[k]>0).map(k=>[STATUS[k].name,'#e0b0ff',ST_DESC[k],St[k]]);
  if(B.guard[id]) S.push(["Braced",'#8fe0a8',ST_DESC.braced,0]);
  if(S.length){ add("Troubles","#ffe08a",18,true); S.forEach(s=>trouble(...s)); } else add("Feeling fine.",'#8a94c4',16);
  return out;
}
const INSPECT={x:14,w:332,pad:12};
/* the inspect window's lines, wrapped, and its height */
function inspectLayout(){
  const I=inspectInfo(B.inspect), rows=[];
  I.lines.forEach(l=>wrapLines(l.t,l.size,INSPECT.w-INSPECT.pad*2).forEach((t,i)=>rows.push({...l,t:i&&l.t.startsWith("•")?"   "+t:t})));
  return {I,rows,h:40+rows.length*15+20};
}
function drawBattle(dt){
  if(B.turn==='player') B.readyT+=dt;
  let k=0;
  if(B.anim){
    B.anim.t+=dt; k=clamp(B.anim.t/B.anim.dur,0,1);
    if(!B.anim.hit&&k>=0.55){ B.anim.hit=true; if(B.anim.onHit) B.anim.onHit(); }
    if(k>=1){ B.anim=null; afterAction(); }
  }
  if(B.win) B.win.t+=dt;
  if(B.prep) B.prep.t+=dt;
  if(B.banner){ B.banner.t-=dt; if(B.banner.t<=0) B.banner=null; }
  if(B.inspect&&typeof B.inspect==='object'&&B.inspect.hp<=0) B.inspect=null;
  drawBattleBackdrop(dt);
  /* the pests, back to front: shadow, sprite, and a white flash when hit or about to
     use a special move. One lunges at whoever it attacks (further for a dive, a dash
     for zoomies). */
  const A=B.anim&&B.anim.kind==='enemy'?B.anim:null;
  B.foes.slice().sort((a,z)=>foeSpot(a).y-foeSpot(z).y).forEach(f=>{
    if(f.shake>0) f.shake-=dt; if(f.flash>0) f.flash-=dt;
    if(f.hp<=0||B.over==='win') f.fade=Math.min(1,f.fade+dt/450);     /* a beaten pest fades away */
    if(f.fade>=1) return;
    const p=foeSpot(f), me=A&&A.foe===f, sh=f.shake>0?Math.round(Math.sin(G.t/25)*3):0;
    const eL=me&&!A.self?Math.round(Math.sin(k*Math.PI)*(A.fx==='dive'?-110:A.fx==='zoom'?-150:-38)):0;
    const eY=me&&A.fx==='dive'?Math.round(Math.sin(k*Math.PI)*(40+p.lift)):0;
    /* ground pests stand still on their shadows; flyers hover and bob */
    const night=PESTS[f.sp].night, bob=p.lift?Math.sin(G.t/420+f.slot*2.1)*4:0;
    const x=p.x+sh+eL, y=p.y-p.lift+bob+eY, art=c=>drawEnemyArt(c,f.sp,0,0,p.s);
    castShadow(art,x,p.y,p.lift-eY,0.36*(1-f.fade));
    b.globalAlpha=(1-f.fade)*(night?.88:1)*(me&&A.fx==='fade'?1-Math.sin(k*Math.PI)*0.7:1);
    drawEnemyArt(b,f.sp,x,y,p.s);
    b.globalAlpha=1;
    const prep=B.prep&&B.prep.f===f?Math.abs(Math.sin(B.prep.t/90))*0.75:0;
    flashOver(art,x,y,Math.max(f.flash/250,prep)*(1-f.fade));
  });
  /* the party, back to front, each in place playing their own animations */
  let who=null;
  const placed=B.party.map(id=>{ const s=slotOf(id);
    if(B.anim&&B.anim.who===id) who={id,x:s.x,y:s.y};
    return {id,x:s.x,y:s.y}; }).sort((a,z)=>a.y-z.y);
  placed.forEach(p=>castShadow(c=>drawMember(c,p.id,0,0,k),p.x,p.y,0,0.32));
  placed.forEach(p=>{
    if(B.turn==='player'&&!B.over&&actor()===p.id){        /* a warm glow under whoever's turn it is */
      b.globalAlpha=.35+Math.sin(G.t/260)*.12; b.fillStyle='#ffe08a';
      b.beginPath(); b.ellipse(p.x,p.y+1,30,8,0,0,7); b.fill(); b.globalAlpha=1; }
    drawMember(b,p.id,p.x,p.y,k);
  });
  if(A){ focus(A.foe); drawFoeFx(A.fx,k,A.targets); }
  else if(B.anim&&who){ if(B.anim.tgt) focus(B.anim.tgt); drawSpellFx(B.anim.kind,k,who.x,who.y); }
  drawStatusTags();
  /* picking a target: a bouncing pointer over whoever is picked */
  const picking=B.turn==='player'&&B.menu==='target'&&B.tgt, tg=picking?B.tgt.list[B.tgt.i]:null;
  if(picking){
    let tx,ty; if(B.tgt.kind==='foe'){ const r=foeBox(tg); tx=r.x+r.w/2; ty=Math.max(BAND_TOP()+14,r.y-4); }
    else { tx=slotOf(tg).x; ty=headOf(tg)-14; }
    ty+=Math.sin(G.t/140)*3;
    b.fillStyle='#0a0f2a'; b.beginPath(); b.moveTo(tx-9,ty-13); b.lineTo(tx+9,ty-13); b.lineTo(tx,ty+1); b.fill();
    b.fillStyle='#ffe08a'; b.beginPath(); b.moveTo(tx-7,ty-12); b.lineTo(tx+7,ty-12); b.lineTo(tx,ty-1.5); b.fill();
  }
  if(B.shout){ B.shout.t-=dt; if(B.shout.t<=0) B.shout=null; }
  const won=B.over==='win'&&B.win, xs=won?xpShown(B.win.who[0]):null;
  /* victory sparkles */
  if(won&&B.win.t<1600&&Math.random()<dt/40)
    B.fx.push({x:rnd(30,330),y:rnd(40,200),vx:rnd(-0.02,0.02),vy:rnd(-0.06,-0.01),t:700,col:Math.random()<0.5?'#ffe08a':'#ffffff',g:0.00005});
  B.fx.forEach(f=>{ f.t-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=dt*f.g;
    b.globalAlpha=Math.min(1,f.t/300); px(b,Math.round(f.x),Math.round(f.y),3,3,f.col); b.globalAlpha=1; });
  B.fx=B.fx.filter(f=>f.t>0);

  const pick=B.turn==='player'&&!B.over, W=battleWins(), dn=W.dn, id=actor();
  const list=(B.menu==='skills'||B.menu==='items')&&pick, L=list?subList():null;
  const FW={x:W.foe.x,y:W.foe.y,w:W.foe.w,h:8+B.foes.length*FOE_ROW};
  /* Kaitlyn's shout, a special move's name: little windows by whoever it is */
  let shoutAt=null, bannerAt=null;
  if(B.shout){ const s=slotOf('kaitlyn'), kx=who&&who.id==='kaitlyn'?who.x:s.x, w=TW(B.shout.txt,24,true)+20;
    shoutAt={x:clamp(kx-w/2,6,LW-6-w),y:s.y-150,w,h:24,tx:clamp(kx,6+w/2,LW-6-w/2),kx:clamp(kx,20,LW-20)}; }
  if(B.banner){ const r=foeBox(B.banner.f), w=TW(B.banner.txt,24,true)+24, cx=clamp(r.x+r.w/2,6+w/2,LW-6-w/2);
    bannerAt={x:cx-w/2,y:Math.max(FW.y+FW.h+6,r.y-34),w,h:24,cx}; }
  const fadeIn=t=>Math.min(1,t/250);
  if(!B.over){
    rpgWin(W.msg); rpgWin(FW);
    B.foes.forEach((f,i)=>gauge(FW.x+10,FW.y+22+i*FOE_ROW,FW.w-20,5,f.hp,f.maxhp,'#e8604a','#ffb09a'));
    if(picking&&B.tgt.kind==='foe'){ const i=B.foes.indexOf(tg);
      b.fillStyle='rgba(150,180,255,.25)'; b.beginPath(); b.roundRect(FW.x+5,FW.y+4+i*FOE_ROW,FW.w-10,FOE_ROW,4); b.fill(); }
    if(list){
      rpgWin(W.list); rpgWin(W.linfo);
      if(L.length) winCursor(W.list.x+6,W.list.y+SUB_Y0+(B.sub-B.top)*SUB_ROW,W.list.w-12,SUB_ROW-1);
    } else {
      rpgWin(W.cmd); rpgWin(W.party); rpgWin(W.info);
      B.party.forEach((m,i)=>{ const y=W.party.y+6+i*PARTY_ROW, M=member(m);
        const lit=pick&&(picking&&B.tgt.kind==='ally'?m===tg:m===id);
        if(lit){ b.fillStyle='rgba(150,180,255,.22)'; b.beginPath(); b.roundRect(W.party.x+5,y,W.party.w-10,PARTY_ROW-2,4); b.fill(); }
        gauge(W.party.x+82,y+20,58,5,M.hp,M.maxhp,'#e8504a','#ffa8a0');
        gauge(W.party.x+150,y+20,50,5,M.mp,memberMaxMp(m),'#4aa8f0','#b0e0ff'); });
      if(pick&&!picking) winCursor(W.cmd.x+6,cmdTop(W)+B.idx*CMD_ROW,W.cmd.w-12,CMD_ROW-2);
    }
  } else if(won&&B.win.t>=POSE_MS) drawResultsBack();
  else if(won){}
  else rpgWin({x:60,y:300+dn,w:240,h:84});
  const tail=(x,y,a)=>{ b.globalAlpha=a; b.fillStyle='#0a0f2a'; b.beginPath(); b.moveTo(x-7,y-1); b.lineTo(x+7,y-1); b.lineTo(x,y+8); b.fill();
    b.fillStyle='#e6eaf6'; b.beginPath(); b.moveTo(x-5,y-2); b.lineTo(x+5,y-2); b.lineTo(x,y+5.5); b.fill(); b.globalAlpha=1; };
  if(shoutAt){ const a=Math.min(1,B.shout.t/300); b.globalAlpha=a; rpgWin(shoutAt); b.globalAlpha=1; tail(shoutAt.kx,shoutAt.y+shoutAt.h,a); }
  if(bannerAt&&!B.inspect){ b.globalAlpha=Math.min(1,B.banner.t/250); rpgWin(bannerAt); b.globalAlpha=1; }
  const insp=B.inspect?inspectLayout():null, IY=FW.y+FW.h+8;   /* under the pests' window */
  if(insp) rpgWin({x:INSPECT.x,y:IY,w:INSPECT.w,h:insp.h});
  /* a critical hit flashes the whole scene */
  if(B.critT>0){ B.critT-=dt; b.fillStyle='rgba(255,250,220,'+(Math.max(0,B.critT)/260*0.45)+')'; b.fillRect(0,BAND_TOP(),LW,BAND_BOT()-BAND_TOP()); }
  blit();

  if(!B.over){
    const log=picking?(B.tgt.kind==='foe'?"Who at? Tap a pest, or pick one and press A.":"Who for? Tap a friend, or pick one and press A."):B.log;
    wrapLines(log,21,W.msg.w-16).slice(0,2).forEach((ln,i,a)=>
      TS(ln,W.msg.x+10,W.msg.y+(a.length>1?16:24)+i*15,21,'#f4f6ff'));
    B.foes.forEach((f,i)=>{ const y=FW.y+17+i*FOE_ROW, down=f.hp<=0;
      TS(f.name+(f.boss?"  ★":""),FW.x+10,y,21,down?'#7c84b0':f.boss?'#ffd870':'#f4f6ff',null,true);
      TS("Lv."+f.lv,FW.x+FW.w-10,y,18,down?'#7c84b0':'#c8d4ff','right',true); });
    if(list){
      const R=W.list, title=B.menu==='items'?"Items":PARTY_INFO[id].skills;
      TS(title,R.x+12,R.y+16,21,'#ffe08a',null,true);
      TS(B.menu==='items'?"from your basket":"HP "+member(id).hp+"   MP "+member(id).mp+"/"+memberMaxMp(id),R.x+R.w-12,R.y+16,17,'#c8d4ff','right');
      if(!L.length) TS(B.menu==='items'?"Nothing to eat yet — harvest some crops!":"No skills learned yet.",
        R.x+R.w/2,R.y+SUB_Y0+30,18,'#aab6e8','center');
      L.slice(B.top,B.top+SUB_ROWS).forEach((x,j)=>{ const i=B.top+j, y=R.y+SUB_Y0+j*SUB_ROW+17, sel=i===B.sub;
        if(B.menu==='items'){
          TS(itemName(x),R.x+40,y,22,'#f4f6ff',null,sel);
          TS(itemText(x),R.x+200,y,17,'#b8f0a0');
          TS("x"+itemCount(x),R.x+R.w-12,y,19,'#f4f6ff','right');
        } else { const ok=canPay(x,id);
          TS((x.song?"♪ ":"")+x.name,R.x+40,y,22,ok?'#f4f6ff':'#7c84b0',null,sel);
          TS(costText(x,id),R.x+R.w-12,y,19,!ok?'#7c84b0':x.hpCost?'#ffb0a8':'#a8d8ff','right'); } });
      if(B.top>0) TS("▲",R.x+R.w-50,R.y+SUB_Y0+8,14,'#c8d4ff','center');
      if(B.top+SUB_ROWS<L.length) TS("▼",R.x+R.w-50,R.y+R.h-4,14,'#c8d4ff','center');
      /* the row shows the name, so the window is all description (two lines) */
      const [t1,t2]=subInfo(L[B.sub]), dl=wrapLines(t2,17,W.linfo.w-20);
      if(dl.length>2){ dl.length=2; dl[1]=dl[1].replace(/\s*\S*$/,"…"); }
      if(!L.length) TS(t1,W.linfo.x+10,W.linfo.y+19,20,'#f4f6ff',null,true);
      dl.forEach((ln,i)=>TS(ln,W.linfo.x+10,W.linfo.y+(L.length?19:37)+i*16,17,'#c8d4ff'));
    } else {
      CMDS.forEach((c,i)=>{ const y=cmdTop(W)+i*CMD_ROW+18, ok=cmdUsable(c,id);
        TS(cmdName(c,id),W.cmd.x+40,y,25,!pick||picking?'#9aa4d0':ok?'#f4f6ff':'#7c84b0',null,pick&&!picking&&i===B.idx); });
      B.party.forEach((m,i)=>{ const y=W.party.y+6+i*PARTY_ROW, M=member(m), mx=memberMaxMp(m);
        TS(PARTY_INFO[m].name,W.party.x+9,y+14,21,standing(m)?"#f4f6ff":"#8a90b8",null,true);
        TS("Lv."+M.lv,W.party.x+9,y+27,16,'#aab6e8');
        TS("HP",W.party.x+80,y+14,16,'#ffb0a8',null,true);
        TS(M.hp+"/"+M.maxhp,W.party.x+141,y+14,18,'#f4f6ff','right');
        TS("MP",W.party.x+148,y+14,16,'#a8d8ff',null,true);
        TS(M.mp+"/"+mx,W.party.x+201,y+14,18,'#f4f6ff','right'); });
      const ac=B.anim&&B.anim.kind==='enemy'?B.anim.foe:B.prep?B.prep.f:null;
      const [t1,t2]=picking?(B.tgt.kind==='foe'?[tg.name,"HP "+tg.hp+"/"+tg.maxhp+" · Lv."+tg.lv]:[PARTY_INFO[tg].name,"HP "+member(tg).hp+"/"+member(tg).maxhp])
        :pick?cmdInfo(CMDS[B.idx],id):[B.turn==='enemy'&&ac?"The "+ac.name+"'s turn":"…",""];
      TS(t1,W.info.x+10,W.info.y+19,20,'#f4f6ff',null,true);
      wrapLines(t2,17,W.info.w-16).slice(0,1).forEach(ln=>TS(ln,W.info.x+10,W.info.y+37,17,'#c8d4ff'));
    }
  }
  if(shoutAt){ m.globalAlpha=Math.min(1,B.shout.t/300); TS(B.shout.txt,shoutAt.tx,shoutAt.y+17,24,'#f4f6ff','center',true); m.globalAlpha=1; }
  if(bannerAt&&!B.inspect){ m.globalAlpha=Math.min(1,B.banner.t/250); TS(B.banner.txt,bannerAt.cx,bannerAt.y+17,24,'#ffe08a','center',true); m.globalAlpha=1; }
  B.pops.forEach(p=>{ p.t-=dt; p.y-=dt*0.03;
    const hop=Math.max(0,Math.sin((1100-p.t)/140))*6*Math.max(0,(p.t-600)/500);
    m.globalAlpha=Math.min(1,p.t/400); TO(p.txt,p.x,p.y-hop,p.size||40,p.col,'center',true,p.size?2:1.6); m.globalAlpha=1; });
  B.pops=B.pops.filter(p=>p.t>0);
  if(insp){
    const {I,rows}=insp, X=INSPECT.x+INSPECT.pad;
    TS(I.title,X,IY+22,23,I.col,null,true);
    TS("Lv."+I.lv,INSPECT.x+INSPECT.w-INSPECT.pad,IY+22,20,'#c8d4ff','right',true);
    rows.forEach((r,i)=>TS(r.t,X,IY+42+i*15,r.size,r.col,null,r.bold));
    TS(IS_TOUCH?"tap to close":"any key to close",INSPECT.x+INSPECT.w-INSPECT.pad,IY+insp.h-8,15,'#8a94c4','right');
  }
  if(won&&B.win.t>=POSE_MS){ drawResultsWords(); return; }
  if(won){
    const w=B.win, pop=clamp(w.t/280,0,1);
    /* the banner drops in and settles */
    const size=Math.round(58+(1-pop)*30), by=96-(1-pop)*20;
    m.globalAlpha=pop; TO("VICTORY!",180,by,size,'#ffd24a','center',true,2.2);
    T("VICTORY!",180,by-size*0.04,size,'rgba(255,250,210,.35)','center',true); m.globalAlpha=1;
    return;
  }
  if(B.over){
    TS(B.over==='lose'?"Defeated...":"Got away!",180,334+dn,30,'#f4f6ff','center',true);
    TS(IS_TOUCH?"tap or press A to continue":"J / tap to continue",180,364+dn,17,'#c8d4ff','center');
  }
}

/* ---------------- the results ----------------
   After the poses, a window over the whole screen: what was won (coins and the purse,
   anything left behind, a seed) and a row per member standing (portrait, level, the EXP
   bar filling with a tick, LEVEL UP!). Room for five. */
const RES={pad:10, head:96, row:62};
function resultsBox(){ const T0=BAND_TOP(), T1=BAND_BOT(); return {x:RES.pad,y:T0+RES.pad,w:LW-RES.pad*2,h:T1-T0-RES.pad*2}; }
function drawResultsBack(){
  const w=B.win, a=clamp((w.t-POSE_MS)/RESULTS_FADE,0,1), R=resultsBox();
  b.save(); b.globalAlpha=a;
  b.fillStyle='rgba(6,10,30,.55)'; b.fillRect(0,BAND_TOP(),LW,BAND_BOT()-BAND_TOP());
  rpgWin(R);
  w.who.forEach((id,i)=>{ const y=R.y+RES.head+i*RES.row, x=xpShown(id);
    b.fillStyle='#0a0f2a'; b.fillRect(R.x+12,y+4,44,RES.row-12);
    const im=portraitImg(id);
    if(im){ const ph=RES.row-14, pw=ph*im.naturalWidth/im.naturalHeight;
      b.save(); b.beginPath(); b.rect(R.x+13,y+5,42,RES.row-14); b.clip(); b.imageSmoothingEnabled=true;
      b.drawImage(im,R.x+34-pw/2,y+5,pw,ph); b.restore(); }
    gauge(R.x+66,y+36,R.w-80,7,x.xp,x.next,'#f0c84a','#fff0b0'); });
  const dy=R.y+RES.head+w.who.length*RES.row+8;
  (w.drops||[]).forEach((k,i)=>drawGoodIcon(b,k,R.x+26,dy+30+i*22,18));
  if(w.seed) drawShopPic(SPECIES[w.seed].name.toLowerCase()+" seed",R.x+26,dy+30+(w.drops||[]).length*22,14,18);
  b.restore();
  /* the bars fill with a ticking sound */
  const k=clamp((w.t-WIN_DELAY)/WIN_FILL,0,1);
  if(k>0&&k<1&&w.t-w.tick>70){ w.tick=w.t; if(AC) blip(520+k*520,0.025,0.05,'triangle'); }
}
function drawResultsWords(){
  const w=B.win, a=clamp((w.t-POSE_MS)/RESULTS_FADE,0,1), R=resultsBox(), xs=xpShown(w.who[0]);
  m.globalAlpha=a;
  TO("VICTORY!",180,R.y+40,44,'#ffd24a','center',true,2);
  const got=Math.round(w.coins*xs.k);
  TS("EXP +"+Math.round(w.xp*xs.k)+(w.who.length>1?" each":""),R.x+16,R.y+72,20,'#ffe08a',null,true);
  TS((w.bonus?"lucky!  ":"")+"+"+got+"c",R.x+R.w-16,R.y+66,21,'#ffe08a','right',true);
  TS("purse: "+(G.coins-w.coins+got)+"c",R.x+R.w-16,R.y+84,15,'#aab6e8','right');
  w.who.forEach((id,i)=>{ const x=xpShown(id), f=w.from[id], y=R.y+RES.head+i*RES.row;
    TS(PARTY_INFO[id].name,R.x+66,y+20,21,'#f4f6ff',null,true);
    TS("Lv."+x.lv,R.x+R.w-16,y+20,19,x.lv>f.lv?'#ffe08a':'#c8d4ff','right',true);
    if(x.lv>f.lv&&Math.floor(G.t/240)%2===0) TS("LEVEL UP!",R.x+66+TW(PARTY_INFO[id].name,21,true)+12,y+20,17,'#ffb04a',null,true);
    TS(x.xp+" / "+x.next+" EXP",R.x+R.w-16,y+56,14,'#aab6e8','right'); });
  const dy=R.y+RES.head+w.who.length*RES.row+8;
  TS("Found",R.x+16,dy+12,17,'#c8d4ff',null,true);
  const L=(w.drops||[]).map(k=>[GOODS[k].name,GOODS[k].value>=40?'#ffb0ff':'#f4f6ff',GOODS[k].value>=40?"  ★ rare!":""]);
  if(w.seed) L.push([SPECIES[w.seed].name+" seed",'#b8f0a0',""]);
  if(!L.length) TS("nothing this time",R.x+44,dy+34,16,'#8a94c4');
  L.forEach(([n,c,r],i)=>TS(n+r,R.x+44,dy+36+i*22,18,c,null,true));
  if(!winGuard()&&xs.k>=1) TS(IS_TOUCH?"tap to continue":"J to continue",180,R.y+R.h-14,16,'#8a94c4','center');
  m.globalAlpha=1;
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
