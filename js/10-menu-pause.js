/* ================================================================
   PAUSE MENU: party, status, skills, items, gear, lore, settings, save
   ================================================================ */
function bonusLines(){
  const L=[];
  const g=Math.round(((gearOn('can')?1.25:1)*(G.yard.bath?1.1:1)-1)*100);
  L.push(["Song growth", (g>=0?"+":"")+g+"%"]);
  L.push(["Song damage", wears('kaitlyn','polish')?"+30%":"—"]);
  L.push(["Kick power", wears('kaitlyn','kickers')?"+60%":"—"]);
  L.push(["Run speed", gearOn('boots')?"×2 (B)":"—"]);
  L.push(["Max MP", String(maxMp())]);
  L.push(["Harmony cap", (gearOn('trellis')?"x2.6":"x1.8")+(G.yard.fountain?" +0.2":"")]);
  return L;
}
/* ---------- field songs ----------
   Picking one closes the menu and Kaitlyn plays it out in the garden: her flute
   animation from battle, the song's own effect over the garden, and its work done
   partway through it (CAST_HIT). With a recording she plays it through first: the effect
   starts at G.cast.fxFrom, so its work is done as the song ends. The clock waits meanwhile.
   Growth Reprise can be played once a day. */
const CAST_MS=2400, CAST_HIT=1300, REPRISE_SHARE=0.2;
const fieldUsable=f=>f.id!=='reprise'||G.daily.reprise!==G.day;
function castField(f){
  if(G.indoors){ say("Play field songs out in the garden."); sfx('cant_do_that'); return; }
  if(!fieldUsable(f)){ say("Growth Reprise is spent for today. Try again tomorrow!"); sfx('cant_do_that'); return; }
  if(G.player.mp<f.mp){ say("Not enough Music Points."); sfx('cant_do_that'); return; }
  G.player.mp-=f.mp;
  if(f.id==='reprise') G.daily.reprise=G.day;
  /* its own recording (sfx/<song name>): she plays it through, the music stepping back, and
     its effect plays last (from fxFrom), its work done just as the song ends */
  const len=sfx(soundKey(f.name)), fxFrom=Math.max(0,len*1000-CAST_HIT);
  G.cast={id:f.id,t:0,hit:false,fxFrom,ms:fxFrom+CAST_MS}; G.scene='world'; padVec={x:0,y:0};
  if(len) duckMusic(len);
  else if(AC){ flute(9,AC.currentTime,.5,.6); flute(14,AC.currentTime+.24,.5,.6); flute(18,AC.currentTime+.48,.7,.6);
          flute(21,AC.currentTime+.8,.9,.5); }
}
function castHit(id){
  if(id==='reprise'){
    let n=0;
    plots.forEach(p=>{ if(active(p)&&p.sp&&p.stage<3){ setGrowth(p,p.growth+plantNeed(p)*REPRISE_SHARE); n++; } });
    say("Growth Reprise: +20% growth to "+n+" plant"+(n===1?"":"s")+".");
  } else if(id==='ward'){
    const n=G.pests.length; G.pests=[]; say("Pest Ward: "+n+" pest"+(n===1?"":"s")+" fled the garden.");
  } else {
    let n=0, back=0;
    plots.forEach(p=>{ if(!active(p)) return;
      if(p.dead&&p.deadSp){ Object.assign(p,{sp:p.deadSp,deadSp:null,dead:false,stage:0,growth:0,health:100,sungDay:0,fullDay:0}); back++; }
      else if(p.sp){ p.health=100; n++; } });
    say("Sun Shower: "+n+" plant"+(n===1?"":"s")+" refreshed"+(back?", "+back+" ruined one"+(back===1?"":"s")+" sprouting again":"")+".");
  }
  autoSave();
}
/* while a field song plays she stands still; returns true until it's over */
function updateCast(dt){
  const c=G.cast; if(!c) return false;
  c.t+=dt;
  if(!c.hit&&c.t>=(c.fxFrom||0)+CAST_HIT){ c.hit=true; castHit(c.id); }
  if(c.t>=(c.ms||CAST_MS)) G.cast=null;
  if(G.msgT>0) G.msgT-=dt;
  return true;
}
/* the song's effect, in garden px (drawn inside the garden's zoom) */
function drawCastFx(cam){
  /* its effect takes CAST_MS from fxFrom (the end of the song); the notes float up all along */
  const c=G.cast, k=clamp((c.t-(c.fxFrom||0))/CAST_MS,0,1), fx=c.t>=(c.fxFrom||0), P=G.player, kx=P.x-cam.x, ky=P.y-cam.y;
  /* notes floating up from the flute */
  for(let i=0;i<5;i++){ const p=(c.t/900+i/5)%1;
    const nx=kx+14+Math.sin(p*6+i)*10+p*16, ny=ky-46-p*44;
    if(FX2) glowAt(nx,ny-2,7,'#ffd860',Math.sin(p*Math.PI)*0.6);
    noteGlyph(b,Math.round(nx),Math.round(ny),i%2?'#ffe08a':'#fff6d8',Math.sin(p*Math.PI)); }
  if(!fx) return;                          /* the song's own effect waits for its end */
  if(c.id==='reprise'){
    /* a green wave rolls out across the garden, and every plant sends up sparks */
    const r=k*560;
    if(FX2){ const P=[]; for(let j=0;j<=48;j++){ const a=j/48*TAU; P.push([kx+Math.cos(a)*r,ky+Math.sin(a)*r*0.62]); } glowPath(P,'#8fe07a',3,Math.max(0,1-k)*0.8); }
    else { b.globalAlpha=Math.max(0,1-k)*0.5; b.strokeStyle='#8fe07a'; b.lineWidth=5;
      b.beginPath(); b.ellipse(kx,ky,r,r*0.62,0,0,7); b.stroke(); b.globalAlpha=1; }
    plots.forEach(p=>{ if(!active(p)||!p.sp) return;
      for(let i=0;i<6;i++){ const q=(c.t/700+i/6+p.x*0.01)%1, a=i*1.05+c.t/300;
        b.globalAlpha=Math.sin(q*Math.PI)*Math.min(1,k*3);
        const sx=p.x-cam.x+Math.cos(a)*(6+q*8), sy=p.y-cam.y-q*36, col=i%2?'#8fe07a':'#e8ffb0';
        if(FX2) glowAt(sx,sy,4,col,b.globalAlpha); else px(b,Math.round(sx),Math.round(sy),3,3,col); } });
    b.globalAlpha=1;
  } else if(c.id==='ward'){
    /* golden rings ripple outward from her */
    for(let i=0;i<3;i++){ const q=clamp(k*1.6-i*0.25,0,1); if(q<=0||q>=1) continue;
      if(FX2){ const P=[]; for(let j=0;j<=48;j++){ const a=j/48*TAU; P.push([kx+Math.cos(a)*q*520,ky-10+Math.sin(a)*q*330]); } glowPath(P,i%2?'#fff0a0':'#ffc83a',4-i,(1-q)*0.9); continue; }
      b.globalAlpha=(1-q)*0.8; b.strokeStyle=i%2?'#fff0a0':'#ffc83a'; b.lineWidth=6-i;
      b.beginPath(); b.ellipse(kx,ky-10,q*520,q*330,0,0,7); b.stroke(); }
    b.globalAlpha=1;
  } else {
    /* a sun shower: slanting rain lit gold, with shafts of light */
    const vw=VIEW_WW, vh=VIEW_H/WORLD_ZOOM, a=Math.sin(Math.min(1,k*1.3)*Math.PI)*0.9;
    b.globalAlpha=a*0.18; b.fillStyle='#fff3c0';
    for(let i=0;i<4;i++){ const x0=cam.x*0+i*vw/3-40;
      b.beginPath(); b.moveTo(x0,0); b.lineTo(x0+60,0); b.lineTo(x0+180,vh); b.lineTo(x0+110,vh); b.fill(); }
    b.globalAlpha=a*0.75; b.strokeStyle='#d8eeff'; b.lineWidth=1.5;
    for(let i=0;i<70;i++){ const x=(i*53.3+c.t*0.12)%(vw+60)-30, y=(i*97.1+c.t*0.55)%(vh+40)-20;
      b.beginPath(); b.moveTo(x,y); b.lineTo(x-4,y+11); b.stroke(); }
    b.globalAlpha=1;
  }
}
/* ---------- food ---------- */
const cropList=()=>SPECIES_ORDER.filter(s=>G.crops[s]>0);
/* eat one harvested crop for its effect (EAT in 01-content.js); its HP and MP go to
   party member id (Kaitlyn unless said). Returns what it did, as text. */
function applyFood(sp,id){
  id=id||'kaitlyn';
  const e=EAT[sp]||{}, M=member(id);
  G.crops[sp]--; if(G.crops[sp]<=0) delete G.crops[sp];
  if(e.hp) M.hp=Math.min(M.maxhp,M.hp+e.hp);
  if(e.mp) M.mp=Math.min(memberMaxMp(id),M.mp+e.mp);
  if(e.speed) G.snackT=Math.max(G.snackT,e.speed);
  if(e.calm){ G.calmT=Math.max(G.calmT,e.calm); G.lureT=0; }
  if(e.lure){ G.lureT=Math.max(G.lureT,e.lure); G.calmT=0; }
  return eatText(sp);
}
function eatCrop(sp,id){
  if(!(G.crops[sp]>0)) return;
  id=id||'kaitlyn';
  say(PARTY_INFO[id].name+" ate a "+SPECIES[sp].name+": "+applyFood(sp,id)+".");
  if(!(sfx('eat_crop')>0)&&AC){ blip(620,0.06,0.1,'sine'); flute(9,AC.currentTime+.06,.25,.4); }
  autoSave();
}

/* ---------- the menu ----------
   Classic blue windows: the open tab's page on the left, the tabs stacked down the
   right with the purse, day and time under them. The cursor starts on the tabs
   (up/down, or tap one); A or right steps into the page, B steps back out (and from
   the tabs closes the menu). Status and Skills show one member at a time: left/right
   (or the arrows by the name) changes who. */
let sys={tab:0,idx:0,focus:'tabs',who:0,top:0};
const SYSTABS=['Party','Status','Skills','Items','Equip','Lore','Settings','Save'];
const SAVE_ACTIONS=["Copy save code","Paste a save code","Save now","Quit to title"];
const SYSW={page:{x:8,y:8,w:256,h:464}, tab:{x:270,y:8,w:82,h:29,step:33}, info:{x:270,y:278,w:82,h:194}};
/* rows start this far down the page (Status and Skills have a portrait above them) */
const pageRowsY=()=>pagesWho()?92:SYSTABS[sys.tab]==='Party'?44:48;
function openSys(){ if(G.cast) return; G.code=exportCode(); sys={tab:0,idx:0,focus:'tabs',who:0,top:0}; G.scene='sys'; }
/* the Settings page: each row a choice that A (or left/right) steps through */
const SETTINGS=[{id:'diff',name:"Difficulty",opts:DIFF_ORDER,label:v=>DIFFICULTY[v].name,
  about:v=>DIFFICULTY[v].about,get:()=>G.diff,set:v=>{ G.diff=v; }},
  {id:'run',name:"Running",opts:RUN_ORDER,label:v=>RUN_MODES[v],
   about:v=>(gearOn('boots')?"":"Needs the Sturdy Boots. ")+{hold:"Hold B to run, let go to walk.",walk:"Run all the time; hold B to slow to a walk.",toggle:"Press B to switch between running and walking."}[v],
   get:()=>G.runMode,set:v=>{ G.runMode=v; G.runOn=false; }},
  volRow('music',"Music","The music, and the songs in the rhythm game."),
  volRow('sfx',"Sound effects","Footsteps, menus, battles, doors, fishing and the friends' voices."),
  /* opens the Graphics window (gfxRows in 21-hd.js); left/right steps through its presets */
  {id:'gfx',name:"Graphics",opens:true,opts:['low','medium','high'],label:v=>GFX_PRESET_NAME[v],
   about:v=>"Depth blur, bloom, sunbeams and more, in battles for now. "+(IS_TOUCH?"Tap again to set each one.":"J to set each one."),
   get:()=>gfxPreset(),set:v=>gfxApplyPreset(v)}];
/* a volume row: 0 (off) to 10, kept in this browser rather than the save (setVolume) */
function volRow(k,name,what){
  return {id:k,name,level:true,opts:[0,1,2,3,4,5,6,7,8,9,10],label:v=>v?String(v):"Off",
    about:v=>what+(v?"":" Off for now."),get:()=>VOL[k],set:v=>setVolume(k,v)}; }
/* d: +1 or -1. Levels stop at their ends; the other choices go round. */
function stepSetting(S,d){ const o=S.opts, i=o.indexOf(S.get());
  const j=S.level?clamp(i+d,0,o.length-1):(i+d+o.length)%o.length;
  if(j===i){ sfx('cant_do_that'); return; }
  S.set(o[j]); sfx('menu_toggle'); if(!S.level) autoSave(); }
const allMembers=()=>['kaitlyn'].concat(Object.keys(G.allies));
const whoId=()=>{ const L=allMembers(); return L[((sys.who%L.length)+L.length)%L.length]; };
/* ---------- Lore: what she's learned about the pests and the fish ----------
   Two choices (sys.lore null), then a list of every pest or fish (sys.lore 'beasts' or
   'fish'): the ones she's beaten or caught by name, the rest as ???. A known one opens
   its page (sys.loreSel); B steps back a level at a time. */
const LORE_KINDS=[{id:'beasts',name:"Bestiary",about:"The pests you've beaten"},{id:'fish',name:"Fish",about:"Every fish in the mountain pond"}];
const beastKeys=()=>Object.keys(PESTS), fishKeys=()=>Object.keys(GOODS).filter(k=>GOODS[k].kind==='fish');
const knowBeast=k=>(G.lore.beat[k]||0)>0, knowFish=k=>!!G.lore.fish[k];
/* when a fish bites (the pond freezes over in winter) */
const fishWhen=g=>(g.seasons?g.seasons.map(s=>SEASON_NAME[s]).join(", "):"Spring, Summer, Fall")+(g.night?" · nights only":"");
function loreRows(){
  if(sys.loreSel) return {h:40,rows:[]};
  if(sys.lore==='beasts') return {h:40,rows:beastKeys().map(k=>({beast:k}))};
  if(sys.lore==='fish') return {h:40,rows:fishKeys().map(k=>({fish:k}))};
  return {h:56,rows:LORE_KINDS.map(L=>({lore:L}))};
}
function loreActivate(R){
  if(R.lore){ sys.lore=R.lore.id; sys.idx=0; sys.top=0; sfx('menu_confirm'); return; }
  const k=R.beast||R.fish;
  if(!(R.beast?knowBeast(k):knowFish(k))){ sfx('cant_do_that'); return; }
  sys.loreSel={kind:R.beast?'beast':'fish',k}; sfx('menu_confirm');
}
/* B: from a page back to its list, from a list back to the two choices (false at the top) */
function loreBack(){
  if(sys.loreSel){ sys.loreSel=null; return true; }
  if(sys.lore){ const i=LORE_KINDS.findIndex(L=>L.id===sys.lore); sys.lore=null; sys.idx=Math.max(0,i); sys.top=0; return true; }
  return false;
}
function loreTitle(){
  const S=sys.loreSel;
  if(S) return S.kind==='beast'?PESTS[S.k].name:GOODS[S.k].name;
  if(sys.lore==='beasts') return "Bestiary  "+beastKeys().filter(knowBeast).length+"/"+beastKeys().length;
  if(sys.lore==='fish') return "Fish  "+fishKeys().filter(knowFish).length+"/"+fishKeys().length;
  return "Lore";
}
/* a pest's or fish's page, as lines of text (the same as tapping a pest in battle shows) */
function loreLines(){
  const S=sys.loreSel, L=[], add=(t,col,size,bold)=>L.push({t,col:col||'#c8d4ff',size:size||17,bold});
  if(S.kind==='beast'){ const P=PESTS[S.k], st=pestStats(S.k,P.lv), n=G.lore.beat[S.k];
    add("Lv."+P.lv+(P.boss?"  ·  Boss":"")+(P.night?"  ·  comes out at night":"")+(P.fly?"  ·  flies":""),'#ffe08a',17,true);
    add("HP "+st.hp+"    Attack "+Math.round(st.atk)+"    Defense "+Math.round(st.def)+"    Agility "+Math.round(st.agi),'#f4f6ff');
    add(P.about);
    add("Moves: "+P.skills.map(s=>s.name).join(", "),'#b8f0a0');
    const D=PEST_DROPS[S.k]; if(D) add("Drops: "+GOODS[D[0]].name+"  ·  rare: "+GOODS[D[1]].name,'#ffd0a0');
    add("Leaves behind "+P.xp+" EXP and "+P.coin+"c",'#c8d4ff');
    add("Beaten "+n+" time"+(n===1?"":"s"),'#aab6e8');
  } else { const g=GOODS[S.k], F=G.lore.fish[S.k];
    add(g.flavor);
    add("Sells for "+goodsPrice(S.k)+"c",'#ffe08a',17,true);
    add("Bites in: "+fishWhen(g),'#b8f0a0');
    add("Caught "+F.n+(F.best?"  ·  biggest "+inchText(F.best,S.k):""),'#aab6e8'); }
  return L;
}
const LORE_PIC={y:58,h:124};          /* the picture on a page: top and height, from the page's top */
function loreDetailBack(P){
  const S=sys.loreSel, cx=P.x+P.w/2;
  b.fillStyle='rgba(10,15,42,.55)'; b.beginPath(); b.roundRect(P.x+16,P.y+LORE_PIC.y,P.w-32,LORE_PIC.h,8); b.fill();
  if(S.kind==='beast'){ const a=typeof ENEMY_ART!=='undefined'&&ENEMY_ART[S.k];
    if(a){ const s=Math.min((LORE_PIC.h-16)*SC/a.r[3],(P.w-56)*SC/a.r[2]); drawEnemyArt(b,S.k,cx,P.y+LORE_PIC.y+LORE_PIC.h-8,s); } }
  else drawGoodIcon(b,S.k,cx,P.y+LORE_PIC.y+LORE_PIC.h/2,90);
}
function loreDetailText(P){
  let y=P.y+LORE_PIC.y+LORE_PIC.h+26;
  loreLines().forEach(l=>{ wrapLines(l.t,l.size,P.w-36).forEach(ln=>{ TS(ln,P.x+18,y,l.size,l.col,null,l.bold); y+=l.size>16?19:17; }); y+=6; });
  TS(IS_TOUCH?"tap to go back":"B: back",P.x+P.w/2,P.y+P.h-14,15,'#8a94c4','center');
}
function loreRowPic(r,P,y,h){
  if(r.beast&&knowBeast(r.beast)){ const a=typeof ENEMY_ART!=='undefined'&&ENEMY_ART[r.beast];
    if(a) drawEnemyArt(b,r.beast,P.x+46,y+h-6,Math.min(28*SC/a.r[3],34*SC/a.r[2])); }
  if(r.fish&&knowFish(r.fish)) drawGoodIcon(b,r.fish,P.x+46,y+h/2-1,24);
}
function loreRowText(r,P,y,h,sel){
  if(r.lore){ TS(r.lore.name,P.x+40,y+24,21,'#f4f6ff',null,sel); TS(r.lore.about,P.x+40,y+42,15,'#aab6e8'); return; }
  if(r.beast){ const k=r.beast;
    if(knowBeast(k)){ TS(PESTS[k].name,P.x+70,y+h/2+6,18,'#f4f6ff',null,sel); TS("Lv."+PESTS[k].lv,P.x+P.w-12,y+h/2+6,16,'#ffe08a','right',true); }
    else TS("???",P.x+70,y+h/2+6,18,'#7c84b0',null,sel);
    return; }
  const g=GOODS[r.fish];
  if(knowFish(r.fish)){ TS(g.name,P.x+70,y+h/2+6,18,'#f4f6ff',null,sel); TS("x"+G.lore.fish[r.fish].n,P.x+P.w-12,y+h/2+6,16,'#ffe08a','right',true); }
  else { TS("???",P.x+70,y+h/2+6,18,'#7c84b0',null,sel); TS(fishWhen(g),P.x+P.w-12,y+h/2+5,13,'#8a94c4','right'); }
}
function loreFoot(R){
  if(R.beast){ const k=R.beast; return knowBeast(k)?[PESTS[k].name,PESTS[k].about+"  (A for more)"]:["???","Not beaten yet."]; }
  if(R.fish){ const g=GOODS[R.fish]; return knowFish(R.fish)?[g.name,g.flavor+" Sells for "+goodsPrice(R.fish)+"c.  (A for more)"]
                                                            :["???","Not caught yet. Bites in: "+fishWhen(g)+"."]; }
  return null;
}
function ownedGearList(){ return GEAR.filter(g=>G.gear[g.id]); }
/* ---------- the Party page ----------
   The active team's five spots, top to bottom as they stand in battle (G.slots; Kaitlyn
   in the middle to begin with), empty ones too, then the friends waiting at home as
   portraits. Pick one (a spot, empty or not, or someone at home), then where it goes:
   two spots swap, and someone at home takes a spot (its friend going home). Kaitlyn
   can move to another spot but never home. sys.held: the row picked first. */
const PTY={top:40,row:56,resY:330,res:52,resStep:60};
const partyReserves=()=>Object.keys(G.allies).filter(id=>!G.party.includes(id));
function partyRows(){ return partySlots().map((id,slot)=>({slot,id})).concat(partyReserves().map(id=>({res:id}))); }
function partyPick(i){
  const R=partyRows();
  if(sys.held==null){ sys.held=i; sfx('menu_confirm'); return; }
  const a=R[sys.held], z=R[i]; sys.held=null;
  if(a&&z&&a!==z&&!(a.res&&z.res&&a.res===z.res)) partySwap(a,z);
}
function partySwap(a,z){
  const S=G.slots, nm=id=>PARTY_INFO[id].name, no=t=>{ say(t); sfx('cant_do_that'); };
  if(a.res&&z.res){ no("Pick a spot in the team for them."); return; }
  if(a.res) [a,z]=[z,a];                         /* a is a spot from here on */
  if(!z.res){ const i=a.slot, j=z.slot, x=S[i], y=S[j]; if(!x&&!y) return;
    S[i]=y; S[j]=x;
    say(x&&y?nm(x)+" and "+nm(y)+" swap places.":nm(x||y)+" moves to another spot."); }
  else { const r=z.res, out=S[a.slot];
    if(isHurt(r)){ no(nm(r)+" is still recovering at home."); return; }
    if(out==='kaitlyn'){ no("Kaitlyn always leads the way."); return; }
    S[a.slot]=r; say(nm(r)+" joins the team!"+(out?" "+nm(out)+" will wait at home.":"")); }
  G.party=S.filter(Boolean); partySlots(); sfx('menu_confirm'); autoSave();
}
/* which row is at x,y on the page (-1 for none) */
function partyAt(x,y){
  const P=SYSW.page, j=Math.floor((y-P.y-PTY.top)/PTY.row);
  if(x>P.x+4&&x<P.x+P.w-4&&j>=0&&j<PARTY_MAX) return j;
  const ry=P.y+PTY.resY+24; if(y<ry||y>ry+PTY.res) return -1;
  const k=Math.floor((x-P.x-14)/PTY.resStep);
  return k>=0&&k<partyReserves().length&&x-P.x-14-k*PTY.resStep<=PTY.res?PARTY_MAX+k:-1;
}
function partyKey(k){
  const n=partyRows().length, S=PARTY_MAX;
  if(isUp(k)) sys.idx=sys.idx>=S?S-1:(sys.idx+S-1)%S;
  else if(isDown(k)) sys.idx=sys.idx<S-1?sys.idx+1:sys.idx===S-1&&n>S?S:sys.idx>=S?sys.idx:0;
  else if(isLeft(k)&&sys.idx>S) sys.idx--;
  else if(isRight(k)&&sys.idx>=S&&sys.idx<n-1) sys.idx++;
  else if(isOk(k)) partyPick(sys.idx);
  else if(isBack(k)){ if(sys.held!=null) sys.held=null; else sys.focus='tabs'; }
  else if(k==='m') G.scene='world';
}
/* a portrait in a dark box */
function portraitBox(id,x,y,w,h){
  b.fillStyle='#0a0f2a'; b.fillRect(x,y,w,h);
  const im=portraitImg(id); if(!im) return;
  const ph=h-2, pw=ph*im.naturalWidth/im.naturalHeight;
  b.save(); b.beginPath(); b.rect(x+1,y+1,w-2,h-2); b.clip(); b.imageSmoothingEnabled=true;
  b.drawImage(im,x+w/2-pw/2,y+1,pw,ph); b.restore();
}
/* the row picked first glows gold; the highlighted one is lit blue */
function partyLit(x,y,w,h,i){
  const sel=sys.focus==='list'&&sys.idx===i, held=sys.held===i;
  b.fillStyle=held?'rgba(255,214,110,.32)':sel?'rgba(150,180,255,.3)':'rgba(10,15,42,.25)';
  b.beginPath(); b.roundRect(x,y,w,h,5); b.fill();
  if(sel||held){ b.strokeStyle=held?'rgba(255,224,138,.95)':'rgba(255,224,138,.6)'; b.lineWidth=1.2; b.beginPath(); b.roundRect(x+0.5,y+0.5,w-1,h-1,5); b.stroke(); }
}
function drawPartyBack(P){
  partySlots().forEach((id,i)=>{ const y=P.y+PTY.top+i*PTY.row;
    partyLit(P.x+6,y,P.w-12,PTY.row-4,i);
    if(!id){ b.strokeStyle='rgba(200,212,255,.25)'; b.setLineDash([3,3]); b.strokeRect(P.x+12.5,y+4.5,43,43); b.setLineDash([]); return; }
    portraitBox(id,P.x+12,y+4,44,44); const M=member(id);
    gauge(P.x+66,y+27,P.w-84,4,M.hp,M.maxhp,'#e8504a','#ffa8a0'); gauge(P.x+66,y+37,P.w-84,4,M.mp,memberMaxMp(id),'#4aa8f0','#b0e0ff'); });
  b.fillStyle='rgba(255,224,138,.25)'; b.fillRect(P.x+12,P.y+PTY.resY+18,P.w-24,1);
  partyReserves().forEach((id,k)=>{ const x=P.x+14+k*PTY.resStep, y=P.y+PTY.resY+24;
    partyLit(x-3,y-3,PTY.res+6,PTY.res+6,PARTY_MAX+k); portraitBox(id,x,y,PTY.res,PTY.res);
    if(isHurt(id)){ b.fillStyle='rgba(60,10,20,.5)'; b.fillRect(x,y,PTY.res,PTY.res); } });
}
function drawPartyText(P){
  partySlots().forEach((id,i)=>{ const y=P.y+PTY.top+i*PTY.row;
    if(!id){ TS("Empty spot",P.x+66,y+29,18,'#7c84b0'); return; }
    const M=member(id);
    TS(PARTY_INFO[id].name,P.x+66,y+18,20,'#f4f6ff',null,true); TS("Lv."+M.lv,P.x+P.w-12,y+18,16,'#ffe08a','right',true);
    TS(M.hp+"/"+M.maxhp,P.x+P.w-80,y+18,13,'#ffb0a8','right');
    TS(id==='kaitlyn'?"Leader":"In the party",P.x+66,y+50,13,id==='kaitlyn'?'#ffe08a':'#b8f0a0'); });
  const res=partyReserves();
  TS("Reserves",P.x+14,P.y+PTY.resY+12,20,'#ffe08a',null,true);
  TS(res.length?"waiting at home":"no one waiting at home",P.x+P.w-12,P.y+PTY.resY+12,14,'#8a94c4','right');
  res.forEach((id,k)=>{ const x=P.x+14+k*PTY.resStep+PTY.res/2, y=P.y+PTY.resY+24+PTY.res+13;
    TS(isHurt(id)?"hurt "+(G.allies[id].hurtUntil-G.day)+"d":PARTY_INFO[id].name,x,y,13,isHurt(id)?'#ffb0a8':'#c8d4ff','center'); });
  const R=partyRows(), h=sys.held!=null&&R[sys.held];
  const hint=h?(h.res||h.id?"Now pick where "+PARTY_INFO[h.res||h.id].name+" goes.":"Now pick who goes in this spot."):
    sys.focus!=='list'?"":IS_TOUCH?"Tap someone or a spot, then where it goes.":"J: pick someone or a spot, then where it goes.";
  if(hint&&!(G.msgT>0)) TS(hint,P.x+P.w/2,P.y+P.h-12,14,h?'#ffe08a':'#8a94c4','center');
}
/* ---------- the Equip page's list: everything that fits a slot (sys.eq) ---------- */
const EQW={x:24,y:44,w:312,row:32,head:40,foot:62};
const eqFit=()=>Math.max(3,Math.floor((LH-EQW.y-EQW.head-EQW.foot-16)/EQW.row));
function openEquipPick(id,slot){
  const L=equipChoices(id,slot);
  if(L.length<2&&!equipOf(id)[slot]){ say("Nothing to wear here yet."); sfx('cant_do_that'); return; }
  const i=Math.max(0,L.indexOf(equipOf(id)[slot]||null));
  sys.eq={id,slot,list:L,idx:i,top:Math.max(0,i-eqFit()+1)}; sfx('menu_confirm');
}
function eqSee(){ const E=sys.eq, n=eqFit(); if(E.idx<E.top) E.top=E.idx; if(E.idx>=E.top+n) E.top=E.idx-n+1; }
function eqWear(){ const E=sys.eq; sys.eq=null; wearEquip(E.id,E.slot,E.list[E.idx]); }
const eqH=()=>EQW.head+Math.min(sys.eq.list.length,eqFit())*EQW.row+EQW.foot;
function drawEquipPickBack(){
  const E=sys.eq, W={x:EQW.x,y:EQW.y,w:EQW.w,h:eqH()}; rpgWin(W,0.97);
  E.list.slice(E.top,E.top+eqFit()).forEach((k,j)=>{ const y=W.y+EQW.head+j*EQW.row;
    if(E.top+j===E.idx) winCursor(W.x+6,y,W.w-12,EQW.row-2);
    if(k) drawShopPic(EQUIP[k].name.toLowerCase(),W.x+70,y+EQW.row/2-1,24,24); });
  b.fillStyle='rgba(200,212,255,.3)'; b.fillRect(W.x+10,W.y+W.h-EQW.foot,W.w-20,1);
}
function drawEquipPickText(){
  const E=sys.eq, W={x:EQW.x,y:EQW.y,w:EQW.w,h:eqH()}, cur=equipOf(E.id)[E.slot]||null;
  TS(PARTY_INFO[E.id].name+" · "+EQUIP_SLOTS.find(s=>s[0]===E.slot)[1],W.x+14,W.y+26,20,'#f4f6ff',null,true);
  E.list.slice(E.top,E.top+eqFit()).forEach((k,j)=>{ const i=E.top+j, y=W.y+EQW.head+j*EQW.row+21;
    TS(k?EQUIP[k].name:"Nothing",W.x+90,y,18,k?'#f4f6ff':'#aab6e8',null,i===E.idx);
    TS(k===cur?"worn":equipStats(k),W.x+W.w-12,y,14,k===cur?'#b8f0a0':'#ffe08a','right'); });
  if(E.top>0) TS("▲",W.x+W.w-20,W.y+EQW.head-4,13,'#c8d4ff','center');
  if(E.top+eqFit()<E.list.length) TS("▼",W.x+W.w-20,W.y+W.h-EQW.foot-2,13,'#c8d4ff','center');
  const k=E.list[E.idx];
  wrapLines(k?EQUIP[k].desc:"Take off what's in this slot.",15,W.w-28).slice(0,2).forEach((ln,i)=>TS(ln,W.x+14,W.y+W.h-EQW.foot+20+i*16,15,'#c8d4ff'));
  TS(IS_TOUCH?"tap again to wear · tap outside to close":"J wear · H back",W.x+W.w/2,W.y+W.h-8,13,'#8a94c4','center');
}
/* the rows of the open page: [{label,...}] plus how tall each is */
function sysRows(){
  const t=SYSTABS[sys.tab];
  if(t==='Party') return {h:PTY.row,rows:partyRows()};        /* (its own page: drawPartyBack) */
  if(t==='Status') return {h:28,rows:STATS.map(k=>({stat:k})).concat([{rename:true}])};
  if(t==='Skills') return {h:34,rows:skillBook(whoId()).map(s=>({skill:s}))};
  if(t==='Items') return {h:34,rows:cropList().map(sp=>({crop:sp})).concat(goodsList().map(k=>({good:k}))).concat(
    bySeason(Object.keys(G.seeds).filter(k=>G.seeds[k]>0)).map(sp=>({seed:sp})))};
  /* Equip: each member's four slots (her flutes are Kaitlyn's weapons); for Kaitlyn also the
     garden gear, which can be switched off */
  if(t==='Equip') return {h:34,rows:EQUIP_SLOTS.map(([slot])=>({slot})).concat(whoId()!=='kaitlyn'?[]:
    (ownedGearList().length?[{head:"Garden gear"}]:[]).concat(ownedGearList().map(g=>({gear:g}))))};
  if(t==='Settings') return {h:44,rows:(sys.gfx?gfxRows():SETTINGS).map(S=>({set:S}))};
  if(t==='Lore') return loreRows();
  return {h:44,rows:SAVE_ACTIONS.map((a,i)=>({save:i}))};
}
const footH=()=>['Status','Skills','Items','Equip','Settings'].includes(SYSTABS[sys.tab])||(SYSTABS[sys.tab]==='Lore'&&sys.lore&&!sys.loreSel)?78:0;
const rowsFit=()=>{ const R=sysRows(); return Math.max(1,Math.floor((SYSW.page.h-pageRowsY()-footH()-8)/R.h)); };
function sysSee(i){ const n=rowsFit(); if(i<sys.top) sys.top=i; if(i>=sys.top+n) sys.top=i-n+1; }
/* the Graphics window, opened from Settings, and B back out of it */
function gfxOpen(){ sys.gfx=true; sys.idx=0; sys.top=0; sfx('menu_confirm'); }
function gfxBack(){ if(!sys.gfx) return false; sys.gfx=false; sys.idx=SETTINGS.findIndex(S=>S.opens); sys.top=0; sysSee(sys.idx); return true; }
function sysSetTab(t){ sys.tab=(t+SYSTABS.length)%SYSTABS.length; sys.idx=0; sys.top=0; sys.lore=null; sys.gfx=false; sys.loreSel=null; sys.held=null; sys.eq=null; }
function sysActivate(i){
  const R=sysRows().rows[i], t=SYSTABS[sys.tab]; if(!R) return;
  if(t==='Party') partyPick(i);
  else if(t==='Status'){ if(R.rename) renameMember(whoId());
  } else if(t==='Skills'){
    const s=R.skill, id=whoId();
    if(member(id).lv<s.lv){ sfx('cant_do_that'); return; }
    if(s.field) castField(s);
    else say(s.name+" is used in battle.");
  } else if(t==='Items'){
    const k=R.crop||(R.good?'g:'+R.good:null); if(!k) return;
    if(R.good&&!goodEffect(R.good)){ eatGood(R.good); return; }
    /* something that helps one person: choose who (if there's a choice); anything else
       is asked about first */
    if(oneTarget(k)&&G.party.length>1){ sys.pick={k,idx:0}; return; }
    sys.ask={k,idx:0};
  }
  else if(t==='Settings'){ if(R.set.opens) gfxOpen(); else stepSetting(R.set,1); }
  else if(t==='Lore') loreActivate(R);
  else if(t==='Equip'){
    if(R.slot){ openEquipPick(whoId(),R.slot); return; }
    if(R.head) return;
    if(R.gear){ const id=R.gear.id; G.gearOff[id]=!G.gearOff[id];
      say(R.gear.name+(G.gearOff[id]?" switched off.":" switched on.")); sfx('menu_toggle'); autoSave(); }
  } else if(t==='Save'){
    if(i===0){ try{navigator.clipboard.writeText(G.code);}catch(e){}
      say("Save code copied to clipboard."); G.scene='world'; }
    else if(i===1){ const s=prompt("Paste your save code:");
      if(s){ if(importCode(s)){ say("Game loaded!"); G.scene='world'; setMusic(areaMusic()); }
             else say("That code didn't work."); } }
    else if(i===2){ autoSave(); say("Saved in slot "+G.slot+"."); G.scene='world'; }
    else { autoSave(); toTitle(); }
  }
}
const pagesWho=()=>['Status','Skills','Equip'].includes(SYSTABS[sys.tab]);
/* does this crop or good ('g:'+key) help just one person (and so need a choice of who)? */
function oneTarget(k){
  const e=isGoodKey(k)?goodEffect(k.slice(2)):EAT[k];
  return !!e&&!!(e.hp||e.mp);
}
function feed(k,id){ sys.pick=null; sys.ask=null; if(isGoodKey(k)) eatGood(k.slice(2),id); else eatCrop(k,id); }
/* a window over the page (who has it, or are you sure) */
const modal=()=>sys.pick||sys.ask||sys.eq;
/* move the highlight, stepping over section headings */
function sysStep(d){ const L=sysRows().rows, n=L.length; if(!n) return;
  for(let g=0;g<n;g++){ sys.idx=(sys.idx+d+n)%n; if(!L[sys.idx].head) break; }
  sysSee(sys.idx); }
function sysKey(k){
  const n=sysRows().rows.length;
  if(sys.eq){ const E=sys.eq, m=E.list.length;
    if(isUp(k)){ E.idx=(E.idx+m-1)%m; eqSee(); }
    else if(isDown(k)){ E.idx=(E.idx+1)%m; eqSee(); }
    else if(isOk(k)) eqWear();
    else if(isBack(k)) sys.eq=null;
    return; }
  if(sys.pick){ const P=G.party, m=P.length;
    if(isUp(k)) sys.pick.idx=(sys.pick.idx+m-1)%m;
    else if(isDown(k)) sys.pick.idx=(sys.pick.idx+1)%m;
    else if(isOk(k)) feed(sys.pick.k,P[sys.pick.idx]);
    else if(isBack(k)) sys.pick=null;
    return; }
  if(sys.ask){
    if(isUp(k)||isDown(k)) sys.ask.idx=1-sys.ask.idx;
    else if(isOk(k)){ if(sys.ask.idx===0) feed(sys.ask.k,'kaitlyn'); else sys.ask=null; }
    else if(isBack(k)) sys.ask=null;
    return; }
  if(sys.loreSel&&(isOk(k)||isBack(k))){ sys.loreSel=null; return; }      /* a Lore page closes */
  if(sys.focus==='tabs'){
    if(isUp(k)) sysSetTab(sys.tab-1);
    else if(isDown(k)) sysSetTab(sys.tab+1);
    else if((isOk(k)||isRight(k))&&SYSTABS[sys.tab]==='Party'){ sys.focus='list'; sys.idx=Math.max(0,partySlots().indexOf('kaitlyn')); }
    else if((isOk(k)||isRight(k))&&n){ sys.focus='list'; if(sysRows().rows[sys.idx].head) sysStep(1); sysSee(sys.idx); }
    else if(isLeft(k)&&pagesWho()){ sys.who--; sys.idx=0; sys.top=0; }
    else if(isBack(k)||k==='m') G.scene='world';
    return;
  }
  if(SYSTABS[sys.tab]==='Party'){ partyKey(k); return; }
  if(isUp(k)&&n) sysStep(-1);
  else if(isDown(k)&&n) sysStep(1);
  else if((isLeft(k)||isRight(k))&&pagesWho()){ sys.who+=isLeft(k)?-1:1; sys.idx=0; sys.top=0; }
  else if((isLeft(k)||isRight(k))&&SYSTABS[sys.tab]==='Settings'){ const R=sysRows().rows[sys.idx]; if(R) stepSetting(R.set,isLeft(k)?-1:1); }
  else if(isOk(k)) sysActivate(sys.idx);
  else if(isBack(k)){ if(!(SYSTABS[sys.tab]==='Lore'&&loreBack())&&!(SYSTABS[sys.tab]==='Settings'&&gfxBack())) sys.focus='tabs'; }
  else if(k==='m') G.scene='world';
}
const PICK={x:40,y:150,w:280,row:40};
function sysTouch(x,y){
  const T=SYSW.tab, P=SYSW.page;
  if(sys.eq){ const E=sys.eq, j=Math.floor((y-EQW.y-EQW.head)/EQW.row), i=E.top+j;
    if(x<EQW.x||x>EQW.x+EQW.w||y<EQW.y||y>EQW.y+eqH()){ sys.eq=null; return; }
    if(j>=0&&j<eqFit()&&i<E.list.length){ if(E.idx===i) eqWear(); else E.idx=i; }
    return; }
  if(sys.pick){ const j=Math.floor((y-PICK.y-40)/PICK.row);
    if(x>PICK.x&&x<PICK.x+PICK.w&&j>=0&&j<G.party.length){ if(sys.pick.idx===j) feed(sys.pick.k,G.party[j]); else sys.pick.idx=j; }
    else sys.pick=null;
    return; }
  if(sys.ask){ const j=Math.floor((y-PICK.y-40)/PICK.row);
    if(x>PICK.x&&x<PICK.x+PICK.w&&j===0) feed(sys.ask.k,'kaitlyn');
    else sys.ask=null;
    return; }
  if(x>=T.x&&x<=T.x+T.w&&y>=T.y&&y<T.y+SYSTABS.length*T.step){ sysSetTab(Math.floor((y-T.y)/T.step)); sys.focus='tabs'; return; }
  if(x<P.x||x>P.x+P.w||y<P.y||y>P.y+P.h) return;
  /* Party: a tap picks someone (or a spot), the next tap where it goes */
  if(SYSTABS[sys.tab]==='Party'){ const i=partyAt(x,y); if(i<0){ sys.held=null; return; }
    sys.focus='list'; sys.idx=i; partyPick(i); return; }
  /* Lore: a tap on a page, or on a list's title, goes back a level */
  if(SYSTABS[sys.tab]==='Lore'&&(sys.loreSel||(sys.lore&&y<P.y+pageRowsY()-6))){ loreBack(); return; }
  if(SYSTABS[sys.tab]==='Settings'&&sys.gfx&&y<P.y+pageRowsY()-6){ gfxBack(); return; }
  if(pagesWho()&&y<P.y+pageRowsY()-6){ sys.who+=x<P.x+P.w/2?-1:1; sys.idx=0; sys.top=0; return; }
  /* the first tap picks a row, a second tap on it uses it */
  const R=sysRows(), j=Math.floor((y-P.y-pageRowsY())/R.h), i=sys.top+j;
  if(j>=0&&j<rowsFit()&&i<R.rows.length&&!R.rows[i].head){
    /* a volume: a tap on ◀ turns it down, on ▶ up */
    const S=R.rows[i].set;
    if(S&&S.level){ const right=P.x+P.w-14, w=TW("◀  "+S.label(S.get())+"  ▶",19,true);   /* as drawn */
      if(x>right-w-24){ sys.focus='list'; sys.idx=i; stepSetting(S,x<right-w/2?-1:1); return; } }
    if(sys.focus==='list'&&sys.idx===i&&(SYSTABS[sys.tab]!=='Status'||R.rows[i].rename)) sysActivate(i);
    else { sys.focus='list'; sys.idx=i; } }
}
/* what the highlighted row means, for the footer */
function sysFoot(){
  const R=sysRows().rows[sys.idx], t=SYSTABS[sys.tab]; if(!R) return null;
  if(t==='Status'&&R.rename) return ["Rename",IS_TOUCH?"Tap again to give "+PARTY_INFO[whoId()].name+" a new name.":"Press J to give "+PARTY_INFO[whoId()].name+" a new name."];
  if(t==='Status') return [STAT_NAME[R.stat],{hp:"Health. At 0 you're out of the fight.",mp:"Music Points, spent on songs and skills.",
    str:"Power of plain attacks.",agi:"Who moves first in battle.",def:"Softens the hits you take.",
    int:"Power of songs, spells and special moves.",luk:"Better odds of seeds and bonus coins."}[R.stat]];
  if(t==='Skills'){ const s=R.skill, known=member(whoId()).lv>=s.lv;
    return known?[s.name+(s.mp?"  ·  "+s.mp+" MP":""),s.desc+(s.field?(fieldUsable(s)?"  (A to play)":"  (spent today)"):"")]
                :["????","Learned at level "+s.lv+"."]; }
  if(t==='Items'&&R.good){ const g=GOODS[R.good];
    const e=goodEffect(R.good);
    if(g.kind==='quest') return [g.name+"  x"+G.goods[R.good],g.flavor];
    return [g.name+"  x"+G.goods[R.good],(g.flavor?g.flavor+" ":"")+(e?(g.kind==='food'?"Use (A): ":"Eat (A): ")+effText(e):"")+(g.kind==='food'?"":(e?" · ":"")+"sells "+goodsPrice(R.good)+"c at Juniper's in town")]; }
  if(t==='Items') return R.crop?[SPECIES[R.crop].name+"  x"+G.crops[R.crop],(SPECIES[R.crop].flavor?SPECIES[R.crop].flavor+" ":"")+"Eat: "+eatText(R.crop)+" · sells "+sellPrice(R.crop)+"c"]
                               :[seedName(R.seed)+"  x"+G.seeds[R.seed],SPECIES[R.seed].kind==='tree'?"Plant it in a stone ring.":"Plant it in an empty garden spot."];
  if(t==='Equip'&&R.head) return null;
  if(t==='Equip'&&R.slot){ const id=whoId(), k=equipOf(id)[R.slot], name=EQUIP_SLOTS.find(s=>s[0]===R.slot)[1];
    return k?[name+": "+EQUIP[k].name,EQUIP[k].desc+(IS_TOUCH?"  Tap again to change.":"  J to change.")]
            :[name+": nothing",equipChoices(id,R.slot).length>1?(IS_TOUCH?"Tap again to put something on.":"J to put something on."):"Nothing to wear here yet."]; }
  if(t==='Equip') return [R.gear.name+(gearOn(R.gear.id)?"  ·  on":"  ·  off"),cap(R.gear.desc)+". A to switch "+(gearOn(R.gear.id)?"off.":"on.")];
  if(t==='Lore') return loreFoot(R);
  if(t==='Settings'){ const S=R.set; return [S.name+":  "+S.label(S.get()),S.about(S.get())+(S.opens?"  ◀ ▶ for a preset.":S.level?(IS_TOUCH?"  Tap ◀ or ▶ to change.":"  ◀ ▶ to change."):IS_TOUCH?"  Tap again to change.":"  ◀ ▶ or J to change.")]; }
  if(t==='Party'&&R.id) return null;
  return null;
}
function drawSys(){
  const P=SYSW.page, T=SYSW.tab, I=SYSW.info, t=SYSTABS[sys.tab], R=sysRows(), fit=rowsFit();
  /* deep blue backdrop over the whole screen */
  const g=b.createLinearGradient(0,BAND_TOP(),0,BAND_BOT()); g.addColorStop(0,'#141c4a'); g.addColorStop(1,'#070b22');
  b.fillStyle=g; b.fillRect(0,BAND_TOP(),LW,BAND_BOT()-BAND_TOP());
  rpgWin(P); rpgWin(I);
  SYSTABS.forEach((n,i)=>{ const y=T.y+i*T.step, on=i===sys.tab; rpgWin({x:T.x,y,w:T.w,h:T.h});
    if(on){ b.fillStyle=sys.focus==='tabs'?'rgba(255,214,110,.35)':'rgba(150,180,255,.25)'; b.beginPath(); b.roundRect(T.x+3,y+3,T.w-6,T.h-6,4); b.fill(); } });
  const rowY=i=>P.y+pageRowsY()+(i-sys.top)*R.h, vis=t==='Party'?[]:R.rows.slice(sys.top,sys.top+fit);
  /* Status and Skills: whose page it is, with their portrait */
  if(pagesWho()){ b.fillStyle='#0a0f2a'; b.fillRect(P.x+12,P.y+10,64,76);
    const im=portraitImg(whoId()); if(im){ const ph=74, pw=ph*im.naturalWidth/im.naturalHeight;
      b.save(); b.beginPath(); b.rect(P.x+13,P.y+11,62,74); b.clip(); b.imageSmoothingEnabled=true; b.drawImage(im,P.x+44-pw/2,P.y+11,pw,ph); b.restore(); } }
  if(t==='Party') drawPartyBack(P);
  else if(sys.focus==='list'&&R.rows.length) winCursor(P.x+6,rowY(sys.idx),P.w-12,R.h-2);
  /* pictures and bars for the visible rows */
  vis.forEach((r,j)=>{ const i=sys.top+j, y=rowY(i);
    if(t==='Status'&&r.stat){ const v=statOf(whoId(),r.stat), mx={hp:300,mp:120}[r.stat]||80; gauge(P.x+150,y+12,90,5,v,mx,'#f0c84a','#fff0b0'); }
    if(t==='Items'&&r.crop) drawCropIcon(b,r.crop,P.x+46,y+R.h/2-1,24);
    if(t==='Items'&&r.good) drawGoodIcon(b,r.good,P.x+46,y+R.h/2-1,22);
    if(t==='Items'&&r.seed) drawShopPic(seedName(r.seed).toLowerCase(),P.x+46,y+R.h/2-1,18,26);
    if(t==='Equip'&&r.head){ b.fillStyle='rgba(255,224,138,.25)'; b.fillRect(P.x+12,y+R.h/2+6,P.w-24,1); }
    if(t==='Equip'&&r.slot){ const k=equipOf(whoId())[r.slot]; if(k) drawShopPic(EQUIP[k].name.toLowerCase(),P.x+46,y+R.h/2-1,26,26); }
    if(t==='Equip'&&r.gear) drawShopPic(r.gear.name.toLowerCase(),P.x+46,y+R.h/2-1,26,26);
    if(t==='Lore') loreRowPic(r,P,y,R.h);
  });
  if(t==='Status'){ const id=whoId(), M=member(id);
    gauge(P.x+20,P.y+pageRowsY()+(STATS.length+1)*R.h+12,P.w-40,6,M.xp,M.next,'#f0c84a','#fff0b0'); }
  /* a window over the page: the page dims behind it, and its words are left out below */
  if(modal()){ b.fillStyle='rgba(4,6,20,.6)'; b.fillRect(0,BAND_TOP(),LW,BAND_BOT()-BAND_TOP()); }
  if(sys.ask){ rpgWin({x:PICK.x,y:PICK.y,w:PICK.w,h:48+2*PICK.row+22});
    winCursor(PICK.x+6,PICK.y+40+sys.ask.idx*PICK.row,PICK.w-12,PICK.row-2); }
  if(sys.pick){ const h=48+G.party.length*PICK.row; rpgWin({x:PICK.x,y:PICK.y,w:PICK.w,h});
    winCursor(PICK.x+6,PICK.y+40+sys.pick.idx*PICK.row,PICK.w-12,PICK.row-2);
    G.party.forEach((id,i)=>{ const M=member(id), y=PICK.y+40+i*PICK.row;
      gauge(PICK.x+150,y+12,110,5,M.hp,M.maxhp,'#e8504a','#ffa8a0'); gauge(PICK.x+150,y+26,110,5,M.mp,memberMaxMp(id),'#4aa8f0','#b0e0ff'); }); }
  if(sys.eq) drawEquipPickBack();
  if(t==='Lore'&&sys.loreSel) loreDetailBack(P);
  if(footH()&&!modal()) rpgWin({x:P.x+6,y:P.y+P.h-footH()-4,w:P.w-12,h:footH()});
  blit();
  if(modal()){ drawModalWords(); return; }      /* the dimmed page's words stay hidden */
  /* words */
  SYSTABS.forEach((n,i)=>TS(n,T.x+T.w/2,T.y+i*T.step+20,n.length>6?17:19,i===sys.tab?'#ffe08a':'#e4e8ff','center',i===sys.tab));
  TS(G.coins+"c",I.x+I.w-8,I.y+24,22,'#ffe08a','right',true);
  TS(SEASON_NAME[season()],I.x+8,I.y+52,17,'#c8d4ff');
  TS("Day "+G.day,I.x+8,I.y+72,17,'#c8d4ff');
  const ct=clockText(); TS(ct.h+":"+ct.mm+" "+ct.ap,I.x+8,I.y+92,17,'#c8d4ff');
  TS("Garden",I.x+8,I.y+122,15,'#8a94c4'); TS("Lv."+G.gardenLv,I.x+I.w-8,I.y+122,17,'#f4f6ff','right',true);
  TS("Harvests",I.x+8,I.y+144,15,'#8a94c4'); TS(String(G.harvests),I.x+I.w-8,I.y+144,17,'#f4f6ff','right',true);
  if(IS_TOUCH) TS(sys.focus==='tabs'?"A: open":"B: back",I.x+I.w/2,I.y+I.h-12,15,'#8a94c4','center');
  else TS(sys.focus==='tabs'?"J: open":"H: back",I.x+I.w/2,I.y+I.h-12,15,'#8a94c4','center');
  /* the page's title (and who, for Status and Skills) */
  if(pagesWho()){ const id=whoId(), many=allMembers().length>1, M=member(id);
    TS(PARTY_INFO[id].name,P.x+88,P.y+34,26,'#f4f6ff',null,true);
    TS("Lv."+M.lv,P.x+88,P.y+56,19,'#ffe08a',null,true);
    if(many) TS("◀  ▶",P.x+P.w-14,P.y+34,22,'#c8d4ff','right',true);
    wrapLines(PARTY_INFO[id].role,14,P.w-100).slice(0,2).forEach((ln,i)=>TS(ln,P.x+88,P.y+72+i*12,14,'#aab6e8')); }
  else if(t==='Party') TS("Active team  "+G.party.length+"/"+PARTY_MAX,P.x+14,P.y+26,24,'#f4f6ff',null,true);
  else if(t==='Lore'){ TS(loreTitle(),P.x+14,P.y+26,sys.loreSel?22:24,'#f4f6ff',null,true);
    if(sys.lore&&!sys.loreSel) TS("◀ back",P.x+P.w-12,P.y+26,15,'#8a94c4','right'); }
  else if(t==='Settings'&&sys.gfx){ TS("Graphics",P.x+14,P.y+26,24,'#f4f6ff',null,true); TS("◀ back",P.x+P.w-12,P.y+26,15,'#8a94c4','right'); }
  else TS(t,P.x+14,P.y+26,24,'#f4f6ff',null,true);
  if(t==='Party') drawPartyText(P);
  vis.forEach((r,j)=>{ const i=sys.top+j, y=rowY(i), sel=sys.focus==='list'&&i===sys.idx;
    if(t==='Status'&&r.rename) TS("✎  Rename "+PARTY_INFO[whoId()].name,P.x+38,y+17,18,'#ffe08a',null,sel);
    else if(t==='Status'){ const id=whoId(), v=statOf(id,r.stat), eb=equipBonus(id,r.stat);
      TS(STAT_NAME[r.stat],P.x+38,y+17,19,'#e4e8ff',null,sel);
      TS(r.stat==='hp'?member(id).hp+"/"+v:r.stat==='mp'?member(id).mp+"/"+v:String(v),P.x+142,y+17,19,'#ffffff','right',true);
      if(eb) TS("+"+eb,P.x+P.w-12,y+17,15,'#b8f0a0','right'); }
    else if(t==='Skills'){ const s=r.skill, known=member(whoId()).lv>=s.lv;
      TS(known?s.name:"????",P.x+38,y+15,19,known?(s.field?'#b8f0a0':'#f4f6ff'):'#7c84b0',null,sel);
      TS(known?(s.field?"field song":"battle"):"Lv."+s.lv,P.x+38,y+29,13,'#8a94c4');
      if(known&&s.mp) TS(s.mp+" MP",P.x+P.w-12,y+20,16,'#a8d8ff','right'); }
    else if(t==='Items'){
      if(r.good){ TS(GOODS[r.good].name,P.x+66,y+21,18,'#f4f6ff',null,sel); TS("x"+G.goods[r.good],P.x+P.w-12,y+21,18,'#ffe08a','right',true); }
      else if(r.crop){ TS(SPECIES[r.crop].name,P.x+66,y+21,19,'#f4f6ff',null,sel); TS("x"+G.crops[r.crop],P.x+P.w-12,y+21,18,'#ffe08a','right',true); }
      else { TS(seedName(r.seed),P.x+66,y+21,17,'#c8d4ff'); TS("x"+G.seeds[r.seed],P.x+P.w-12,y+21,17,'#c8d4ff','right'); } }
    else if(t==='Equip'&&r.head) TS(r.head,P.x+14,y+R.h/2+2,18,'#ffe08a',null,true);
    else if(t==='Equip'&&r.slot){ const k=equipOf(whoId())[r.slot];
      TS(EQUIP_SLOTS.find(s=>s[0]===r.slot)[1],P.x+66,y+14,14,'#8a94c4');
      TS(k?EQUIP[k].name:"—",P.x+66,y+29,18,k?'#f4f6ff':'#7c84b0',null,sel); }
    else if(t==='Equip'){
      { const on=gearOn(r.gear.id); TS(r.gear.name,P.x+66,y+21,19,on?'#f4f6ff':'#7c84b0',null,sel);
        TS(on?"on":"off",P.x+P.w-12,y+21,15,on?'#b8f0a0':'#ff9a8a','right',true); } }
    else if(t==='Lore') loreRowText(r,P,y,R.h,sel);
    else if(t==='Settings'){ const S=r.set;
      TS(S.name,P.x+38,y+28,20,'#f4f6ff',null,sel);
      TS("◀  "+S.label(S.get())+"  ▶",P.x+P.w-14,y+28,19,'#ffe08a','right',true); }
    else TS(SAVE_ACTIONS[r.save],P.x+P.w/2+10,y+28,21,'#f4f6ff','center',sel);
  });
  if(t==='Lore'&&sys.loreSel) loreDetailText(P);
  if(t==='Items'&&!R.rows.length) TS("Nothing yet — harvest some crops!",P.x+P.w/2,P.y+90,17,'#aab6e8','center');

  if(t==='Save') TS("Slot "+G.slot+" · Lv."+G.player.lv+" · "+G.coins+"c · "+SEASON_NAME[season()]+" Day "+G.day,P.x+P.w/2,P.y+250,17,'#c8d4ff','center');
  if(t==='Status'){ const id=whoId(), M=member(id), y=P.y+pageRowsY()+(STATS.length+1)*R.h+8;
    TS("EXP "+M.xp+" / "+M.next+" to Lv."+(M.lv+1),P.x+20,y,17,'#ffe08a',null,true); }
  if(t!=='Party'&&sys.top>0) TS("▲",P.x+P.w-20,P.y+pageRowsY()-4,14,'#c8d4ff','center');
  if(t!=='Party'&&sys.top+fit<R.rows.length) TS("▼",P.x+P.w-20,P.y+P.h-footH()-10,14,'#c8d4ff','center');
  const f=footH()&&(sys.focus==='list'?sysFoot():null);
  if(footH()){ const fy=P.y+P.h-footH()-4;
    if(f){ TS(f[0],P.x+16,fy+22,18,'#f4f6ff',null,true);
      wrapLines(f[1],15,P.w-36).slice(0,3).forEach((ln,i)=>TS(ln,P.x+16,fy+41+i*15,15,'#c8d4ff')); }
    else TS(IS_TOUCH?"Tap a row to see it; tap again to use it.":"Press J to look closer.",P.x+P.w/2,fy+44,15,'#8a94c4','center'); }
  if(G.msgT>0) TS(G.msg,P.x+P.w/2,P.y+P.h-(footH()?footH()+14:12),15,'#ffe08a','center');
}
/* the words of the window over the page */
function drawModalWords(){
  if(sys.eq){ drawEquipPickText(); return; }
  if(sys.ask){ const k=sys.ask.k, e=isGoodKey(k)?goodEffect(k.slice(2)):EAT[k];
    TS((isGoodKey(k)&&GOODS[k.slice(2)].kind==='food'?"Use the ":"Eat the ")+itemName(k)+"?",PICK.x+PICK.w/2,PICK.y+26,20,'#f4f6ff','center',true);
    ["Yes","No"].forEach((t,i)=>TS(t,PICK.x+48,PICK.y+40+i*PICK.row+25,21,'#f4f6ff',null,i===sys.ask.idx));
    TS(isGoodKey(k)?effText(e):eatText(k),PICK.x+PICK.w/2,PICK.y+48+2*PICK.row+8,15,'#b8f0a0','center'); }
  if(sys.pick){ TS("Who has the "+itemName(sys.pick.k)+"?",PICK.x+PICK.w/2,PICK.y+26,20,'#f4f6ff','center',true);
    G.party.forEach((id,i)=>{ const M=member(id), y=PICK.y+40+i*PICK.row;
      TS(PARTY_INFO[id].name,PICK.x+38,y+22,20,'#f4f6ff',null,i===sys.pick.idx);
      TS(M.hp+"/"+M.maxhp,PICK.x+PICK.w-14,y+10,13,'#ffb0a8','right'); TS(M.mp+"/"+memberMaxMp(id),PICK.x+PICK.w-14,y+38,13,'#a8d8ff','right'); }); }
}
