/* ================================================================
   PAUSE MENU: party, status, skills, items, gear, lore, settings, save
   ================================================================ */
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
   Classic blue windows: a page on the left, the tabs stacked down the right with the
   day, time and purse under them. The menu opens on its main screen (the party, this
   season's calendar and where she is), which stays up while the cursor moves down the
   tabs (up/down, or tap one); A (or a second tap) opens the highlighted tab. Status,
   Skills and Equip first ask whose page (the cursor moves onto the party on the main
   screen: sys.focus 'who'); on a page, left/right (or the arrows by the name) goes to
   the next member, in party order. B steps back a level at a time, and from the tabs
   closes the menu. */
let sys={tab:0,idx:0,focus:'tabs',who:0,top:0};
const SYSTABS=['Items','Skills','Equip','Status','Party','Lore','Settings','Save'];
const SAVE_ACTIONS=["Copy save code","Paste a save code","Save now","Quit to title"];
const SYSW={page:{x:8,y:8,w:256,h:464}, tab:{x:270,y:8,w:84,h:35,step:39}, info:{x:270,y:322,w:84,h:150}};
const sysTab=()=>SYSTABS[sys.tab];
const onHome=()=>sys.focus==='tabs'||sys.focus==='who';
/* rows start this far down the page (Status, Skills and Equip have a portrait above them) */
const pageRowsY=()=>pagesWho()?92:sysTab()==='Party'?44:sysTab()==='Lore'&&sys.lore==='songs'&&!sys.loreSel?68:48;   /* (Song Scores: room for Flute Mastery) */
function openSys(){ if(G.cast) return; G.code=exportCode();
  sys={tab:0,idx:0,focus:'tabs',who:Math.max(0,memberOrder().indexOf('kaitlyn')),top:0}; G.scene='sys'; }
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
   about:v=>"Depth blur, bloom, sunbeams and more. "+(IS_TOUCH?"Tap again to set each one.":"J to set each one."),
   get:()=>gfxPreset(),set:v=>gfxApplyPreset(v)},
  /* act: A asks, then does it (no choices to step through) */
  {id:'home',name:"Return to Home",act:true,opts:[],label:()=>"",get:()=>null,set:()=>{},
   about:()=>"Warps you to Kaitlyn's house, in case you're ever stuck. It takes 1 hour of the day."}];
/* Return to Home: an hour passes (or she falls asleep, if that's midnight), then she's home */
const HOME_COST=60;
function returnHome(){
  sys.ask=null;
  if(G.indoors&&G.area==='garden'){ say("You're already home."); sfx('cant_do_that'); return; }
  G.scene='world'; G.cast=null; passTime(HOME_COST); if(G.scene!=='world') return;
  seasonMap(season());
  travel(()=>{ G.area='garden'; G.swim=false; enterHouse(); say("Back home. An hour went by."); });
}
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
/* everyone, in the order the menu shows them: the party top to bottom, then anyone at home */
const memberOrder=()=>G.party.concat(Object.keys(G.allies).filter(id=>!G.party.includes(id)));
const whoId=()=>{ const L=memberOrder(); return L[((sys.who%L.length)+L.length)%L.length]; };
function stepWho(d){ const n=memberOrder().length; sys.who=((sys.who+d)%n+n)%n; sys.idx=0; sys.top=0; sys.eq=null; }
/* the class shown under each name */
const MEMBER_CLASS={kaitlyn:"Bard in Garden",ivy:"Venom Viper",tiny:"Carolina Cleric",tituba:"Cat Burglar",tex:"Turtle Tank"};
/* the days of the week: each season is one week of DAYS_PER_SEASON days */
const WEEKDAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Waterday','Songday','Holiday'];
const dayOfSeason=()=>(G.day-1)%DAYS_PER_SEASON+1;
const weekday=()=>WEEKDAYS[(dayOfSeason()-1)%WEEKDAYS.length];
function placeName(){
  if(G.indoors) return "Home";
  if(G.area==='garden') return "The Garden";
  return PLACES[G.area]&&PLACES[G.area].name||"Out and about";
}
const playText=()=>{ const s=Math.floor((G.play||0)/1000), h=Math.floor(s/3600), mm=Math.floor(s/60)%60; return h+":"+String(mm).padStart(2,'0'); };
/* ---------- Lore: what she's learned about the pests and the fish ----------
   Two choices (sys.lore null), then a list of every pest or fish (sys.lore 'beasts' or
   'fish'): the ones she's beaten or caught by name, the rest as ???. A known one opens
   its page (sys.loreSel); B steps back a level at a time. */
const LORE_KINDS=[{id:'beasts',name:"Bestiary",about:"The pests you've beaten"},{id:'fish',name:"Fish",about:"Every fish in the mountain pond"},
  {id:'songs',name:"Song Scores",about:"Your best at the music stand"},
  {id:'memories',name:"Memories",about:"Moments with your friends, to see again"}];
const beastKeys=()=>Object.keys(PESTS), fishKeys=()=>Object.keys(GOODS).filter(k=>GOODS[k].kind==='fish');
const knowBeast=k=>(G.lore.beat[k]||0)>0, knowFish=k=>!!G.lore.fish[k];
/* when a fish bites (the pond freezes over in winter) */
const fishWhen=g=>(g.seasons?g.seasons.map(s=>SEASON_NAME[s]).join(", "):"Spring, Summer, Fall")+(g.night?" · nights only":"");
function loreRows(){
  if(sys.loreSel) return {h:40,rows:[]};
  if(sys.lore==='beasts') return {h:40,rows:beastKeys().map(k=>({beast:k}))};
  if(sys.lore==='fish') return {h:40,rows:fishKeys().map(k=>({fish:k}))};
  if(sys.lore==='memories') return {h:40,rows:MEMORIES.map(M=>({mem:M}))};
  if(sys.lore==='songs') return {h:40,rows:allSongs().map(s=>({song:s}))};
  return {h:56,rows:LORE_KINDS.map(L=>({lore:L}))};
}
function loreActivate(R){
  if(R.lore){ sys.lore=R.lore.id; sys.idx=0; sys.top=0; sfx('menu_confirm'); return; }
  if(R.song) return;                                    /* (its score is all on its row) */
  if(R.mem){ if(!R.mem.seen()){ sfx('cant_do_that'); return; } playMemory(R.mem); return; }
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
  if(sys.lore==='songs'){ const L=allSongs(); return "Song Scores  "+L.filter(s=>songBest(s.key)).length+"/"+L.length; }
  if(sys.lore==='memories') return "Memories  "+MEMORIES.filter(M=>M.seen()).length+"/"+MEMORIES.length;
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
  if(r.lore){ TS(r.lore.name,P.x+40,y+24,21,'#f4f6ff',null,sel); TS(r.lore.about,P.x+40,y+42,15,'#aab6e8');
    if(r.lore.id==='songs'){ TS(fluteMastery().toLocaleString(),P.x+P.w-14,y+26,20,'#ffe08a','right',true); TS("Flute Mastery",P.x+P.w-14,y+42,12,'#aab6e8','right'); }
    return; }
  if(r.song){ const s=r.song, B=songBest(s.key), known=s.known||!!B;
    TS(known?s.name:"???",P.x+20,y+h/2+6,18,known?'#f4f6ff':'#7c84b0',null,sel);
    TS(s.kind,P.x+P.w-84,y+h/2+5,13,'#8a94c4','right');
    if(B){ TS(accRank(B.acc),P.x+P.w-12,y+h/2+6,18,B.acc>0.93?'#ffe08a':'#c8d4ff','right',true);
      TS(Math.round(B.acc*100)+"%",P.x+P.w-40,y+h/2+6,17,'#ffe08a','right',true); }
    else if(known) TS("not played",P.x+P.w-12,y+h/2+5,14,'#8a94c4','right');
    return; }
  if(r.mem){ const seen=r.mem.seen();
    TS(seen?r.mem.name:"???",P.x+44,y+h/2+6,18,seen?'#f4f6ff':'#7c84b0',null,sel);
    if(seen) TS("▶",P.x+P.w-14,y+h/2+6,15,'#ffe08a','right'); return; }
  if(r.beast){ const k=r.beast;
    if(knowBeast(k)){ TS(PESTS[k].name,P.x+70,y+h/2+6,18,'#f4f6ff',null,sel); TS("Lv."+PESTS[k].lv,P.x+P.w-12,y+h/2+6,16,'#ffe08a','right',true); }
    else TS("???",P.x+70,y+h/2+6,18,'#7c84b0',null,sel);
    return; }
  const g=GOODS[r.fish];
  if(knowFish(r.fish)){ TS(g.name,P.x+70,y+h/2+6,18,'#f4f6ff',null,sel); TS("x"+G.lore.fish[r.fish].n,P.x+P.w-12,y+h/2+6,16,'#ffe08a','right',true); }
  else { TS("???",P.x+70,y+h/2+6,18,'#7c84b0',null,sel); TS(fishWhen(g),P.x+P.w-12,y+h/2+5,13,'#8a94c4','right'); }
}
function loreFoot(R){
  if(R.song){ const s=R.song, B=songBest(s.key);
    if(!s.known&&!B) return ["???",s.how];
    return [s.name+"  ("+s.kind+")",B?"Best "+Math.round(B.acc*100)+"% (rank "+accRank(B.acc)+")  ·  best combo "+B.combo+"  ·  played "+B.n+" time"+(B.n===1?"":"s")+".  Flute Mastery "+songMastery(s)+" of "+s.pts+"."
                    :"Not played yet. Play it at the music stand at home. Worth up to "+s.pts+" Flute Mastery."]; }
  if(R.mem) return R.mem.seen()?[R.mem.name,R.mem.about+".  (A to watch)"]:["???","A moment still to come."];
  if(R.beast){ const k=R.beast; return knowBeast(k)?[PESTS[k].name,PESTS[k].about+"  (A for more)"]:["???","Not beaten yet."]; }
  if(R.fish){ const g=GOODS[R.fish]; return knowFish(R.fish)?[g.name,g.flavor+" Sells for "+goodsPrice(R.fish)+"c.  (A for more)"]
                                                            :["???","Not caught yet. Bites in: "+fishWhen(g)+"."]; }
  return null;
}
/* ---------- Items: sorted into kinds (sys.cat null: the kinds; else that kind's list) ----------
   A thing can be in more than one kind (a strawberry is both something to eat and a
   harvest). Garden Gear lists the tools and the yard upgrades with an effect, each of
   which can be switched off (G.gearOff, by id: the yard's don't share ids with the gear). */
const ITEM_CATS=[
  {id:'use',     name:"Consumables",  about:"Things to eat and drink"},
  {id:'harvest', name:"Harvest",      about:"Crops, fish and things foraged"},
  {id:'seeds',   name:"Seeds",        about:"Seeds and saplings to plant"},
  {id:'trinkets',name:"Trinkets",     about:"Pest finds, only good for selling"},
  {id:'gear',    name:"Garden Gear",  about:"Tools and yard upgrades: switch them on or off"},
  {id:'key',     name:"Key Items",    about:"Things to keep"}];
const YARD_TOGGLES=['fountain','lantern','arch','bath'];
function gardenGear(){
  return GEAR.filter(g=>G.gear[g.id]).map(g=>({...g,yard:false}))
    .concat(YARD.filter(y=>YARD_TOGGLES.includes(y.id)&&G.yard[y.id]).map(y=>({...y,yard:true})));
}
const gardenGearOn=g=>g.yard?yardOn(g.id):gearOn(g.id);
const KIND_RANK={food:0,forage:1,fish:2,drop:3,quest:4};
const byKind=L=>L.slice().sort((a,z)=>KIND_RANK[GOODS[a].kind]-KIND_RANK[GOODS[z].kind]);
function keyItems(){
  const L=[];
  if(G.rod>0) L.push({key:{name:RODS[G.rod].name,desc:RODS[G.rod].about,pic:'fishing rod'}});
  if(G.sheets.length){ const names=G.sheets.map(id=>{ const s=PRACTICE_SONGS.find(x=>x.id===id); return s?s.name:null; }).filter(Boolean);
    L.push({key:{name:"Sheet Music",count:G.sheets.length,pic:'sheet music',desc:"Songs to practice at the music stand at home: "+names.join(", ")+"."}}); }
  return L.concat(goodsList().filter(k=>GOODS[k].kind==='quest').map(k=>({good:k})));
}
function itemRows(cat){
  const crops=cropList().map(sp=>({crop:sp})), goods=goodsList();
  if(cat==='use') return byKind(goods.filter(k=>GOODS[k].kind==='food')).map(k=>({good:k})).concat(crops,
    byKind(goods.filter(k=>GOODS[k].kind!=='food'&&goodEffect(k))).map(k=>({good:k})));
  if(cat==='harvest') return crops.concat(byKind(goods.filter(k=>['forage','fish'].includes(GOODS[k].kind)||(GOODS[k].kind==='drop'&&goodEffect(k)))).map(k=>({good:k})));
  if(cat==='seeds') return bySeason(Object.keys(G.seeds).filter(k=>G.seeds[k]>0)).map(sp=>({seed:sp}));
  if(cat==='trinkets') return goods.filter(k=>GOODS[k].kind==='drop'&&!goodEffect(k)).map(k=>({good:k}));
  if(cat==='gear') return gardenGear().map(g=>({gear:g}));
  return keyItems();
}
const catCount=id=>itemRows(id).reduce((a,r)=>a+(r.crop?G.crops[r.crop]:r.good?G.goods[r.good]:r.seed?G.seeds[r.seed]:1),0);
const catNow=()=>ITEM_CATS.find(c=>c.id===sys.cat);
function stepCat(d){ const i=ITEM_CATS.findIndex(c=>c.id===sys.cat), n=ITEM_CATS.length;
  sys.cat=ITEM_CATS[((i+d)%n+n)%n].id; sys.idx=0; sys.top=0; }
function itemBack(){ if(!sys.cat) return false; const i=ITEM_CATS.findIndex(c=>c.id===sys.cat); sys.cat=null; sys.idx=Math.max(0,i); sys.top=0; return true; }
/* the highlighted item: its name, what it's like, and its picture */
function itemInfo(r){
  if(r.crop){ const S=SPECIES[r.crop];
    return {name:S.name,n:G.crops[r.crop],desc:(S.flavor?S.flavor+" ":"")+"Eat (A): "+eatText(r.crop)+". Sells for "+sellPrice(r.crop)+"c at the stall.",pic:()=>(cx,cy,s)=>drawCropIcon(b,r.crop,cx,cy,s)}; }
  if(r.good){ const g=GOODS[r.good], e=goodEffect(r.good);
    const use=e?(g.kind==='food'?"Use (A): ":"Eat (A): ")+effText(e)+".":"", sell=g.kind==='food'||g.kind==='quest'?"":" Sells for "+goodsPrice(r.good)+"c at Juniper's.";
    return {name:g.name,n:G.goods[r.good],desc:(g.flavor?g.flavor+" ":"")+use+sell,pic:()=>(cx,cy,s)=>drawGoodIcon(b,r.good,cx,cy,s)}; }
  if(r.seed){ const S=SPECIES[r.seed];
    return {name:seedName(r.seed),n:G.seeds[r.seed],desc:(S.kind==='tree'?"Plant it in a stone ring.":S.kind==='raised'?"Plant it in a raised bed.":S.kind==='ground'?"Plant it in the ground plot.":"Plant it in an empty garden spot.")+" Does best in "+SEASON_NAME[S.best]+".",
      pic:()=>(cx,cy,s)=>drawShopPic(seedName(r.seed).toLowerCase(),cx,cy,s*0.75,s)}; }
  if(r.gear){ const g=r.gear, on=gardenGearOn(g);
    return {name:g.name,on,desc:cap(g.desc)+". "+(on?"On":"Off")+": A to switch "+(on?"off.":"on."),pic:()=>(cx,cy,s)=>drawShopPic(g.name.toLowerCase(),cx,cy,s,s)}; }
  const k=r.key; return {name:k.name,n:k.count,desc:k.desc,pic:()=>(cx,cy,s)=>drawShopPic(k.pic||k.name.toLowerCase(),cx,cy,s,s)};
}
function itemActivate(R){
  if(R.cat){ sys.cat=R.cat.id; sys.idx=0; sys.top=0; return; }
  if(R.gear){ const g=R.gear; G.gearOff[g.id]=!G.gearOff[g.id];
    say(g.name+(G.gearOff[g.id]?" switched off.":" switched on.")); sfx('menu_toggle'); autoSave(); return; }
  if(R.seed){ say("Plant seeds from the garden: walk up to an empty spot."); sfx('cant_do_that'); return; }
  if(R.key){ say(R.key.name+": "+R.key.desc); return; }
  const k=R.crop||'g:'+R.good;
  if(R.good&&!goodEffect(R.good)){ eatGood(R.good); return; }
  /* something that helps one person: choose who (if there's a choice); anything else
     is asked about first */
  if(oneTarget(k)&&G.party.length>1){ sys.pick={k,idx:0}; return; }
  sys.ask={k,idx:0};
}
function ownedGearList(){ return GEAR.filter(g=>G.gear[g.id]); }
/* ---------- Tiny One's songs outside battle (fieldUse): the same as in battle ---------- */
function fieldSkill(id,s,to){
  const M=member(id), nm=n=>PARTY_INFO[n].name, no=t=>{ say(t); sfx('cant_do_that'); };
  if(M.lv<s.lv) return no("Not learned yet.");
  if(M.mp<s.mp) return no(nm(id)+" doesn't have enough MP.");
  const heal=(n,h)=>{ const T=member(n), was=T.hp; T.hp=Math.min(T.maxhp,T.hp+Math.max(1,Math.round(h))); return T.hp-was; };
  let msg;
  if(s.mendAll){ const L=G.party.filter(n=>member(n).hp>0&&member(n).hp<member(n).maxhp);
    if(!L.length) return no("Everyone's already at full HP.");
    L.forEach(n=>heal(n,member(n).maxhp*s.mendAll*healMul(id))); msg=s.name+": everyone feels better!"; }
  else if(s.mend){ const T=member(to);
    if(T.hp<=0) return no(nm(to)+" is down. Wake-Up Call can help.");
    if(T.hp>=T.maxhp) return no(nm(to)+" is already at full HP.");
    msg=s.name+": "+nm(to)+" gets back "+heal(to,T.maxhp*s.mend*healMul(id))+" HP."; }
  else if(s.revive){ const T=member(to);
    if(T.hp>0&&T.hp>=T.maxhp) return no(nm(to)+" is already at full HP.");
    if(T.hp<=0){ T.hp=0; heal(to,T.maxhp*s.revive*healMul(id)); msg=nm(to)+" is back up!"; }
    else { heal(to,T.maxhp); msg=s.name+": "+nm(to)+" is at full HP!"; } }
  else return no(s.name+" is used in battle.");
  M.mp-=s.mp; sys.pick=null; say(msg);
  const v=SKILL_SOUND[s.id]||(id==='tiny'&&s.song?'tiny_songs':null)||skillVoice(s);
  if(!(v&&sfx(v)>0)) sfx('menu_confirm');
  autoSave();
}
function skillActivate(s){
  const id=whoId();
  if(member(id).lv<s.lv){ sfx('cant_do_that'); return; }
  if(s.field){ castField(s); return; }
  if(!s.fieldUse){ say(s.name+" is used in battle."); return; }
  if((s.mend||s.revive)&&G.party.length>1){ sys.pick={skill:s,by:id,idx:0}; return; }
  fieldSkill(id,s,s.mend||s.revive?G.party[0]:null);
}
/* ---------- the Party page ----------
   The active team's five spots, top to bottom as they stand in battle (G.slots; Kaitlyn
   in the middle to begin with), empty ones too, then the friends waiting at home as
   portraits. Pick one (a spot, empty or not, or someone at home), then where it goes:
   two spots swap, and someone at home takes a spot (its friend going home). The Home
   box after the reserves sends a friend home without anyone taking their place. Kaitlyn
   can move to another spot but never home. sys.held: the row picked first. */
const PTY={top:40,row:56,resY:330,res:52,resStep:60};
const partyReserves=()=>Object.keys(G.allies).filter(id=>!G.party.includes(id));
function partyRows(){ return partySlots().map((id,slot)=>({slot,id})).concat(partyReserves().map(id=>({res:id})),[{home:true}]); }
/* the boxes along the bottom (the reserves, then Home): smaller when there are many */
function resLayout(){ const n=partyReserves().length+1, size=Math.min(PTY.res,Math.floor((SYSW.page.w-28)/n)-8); return {n,size,step:size+8}; }
function partyPick(i){
  const R=partyRows();
  if(sys.held==null){ sys.held=i; sfx('menu_confirm'); return; }
  const a=R[sys.held], z=R[i]; sys.held=null;
  if(a&&z&&a!==z&&!(a.res&&z.res&&a.res===z.res)) partySwap(a,z);
}
function partySwap(a,z){
  const S=G.slots, nm=id=>PARTY_INFO[id].name, no=t=>{ say(t); sfx('cant_do_that'); };
  if(a.home||z.home){ const o=a.home?z:a;                /* Home: whoever's in that spot goes home */
    if(o.home||o.res){ no(o.res?nm(o.res)+" is already at home.":"Pick someone in the team to send home."); return; }
    if(!o.id){ no("No one's in that spot."); return; }
    if(o.id==='kaitlyn'){ no("Kaitlyn always leads the way."); return; }
    S[o.slot]=null; say(nm(o.id)+" heads home to rest."); G.party=S.filter(Boolean); partySlots(); sfx('menu_confirm'); autoSave(); return; }
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
  const L=resLayout(), ry=P.y+PTY.resY+24; if(y<ry||y>ry+L.size) return -1;
  const k=Math.floor((x-P.x-14)/L.step);
  return k>=0&&k<L.n&&x-P.x-14-k*L.step<=L.size?PARTY_MAX+k:-1;
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
/* a lit row: the one picked first glows gold, the highlighted one is lit blue */
function litBox(x,y,w,h,sel,held){
  b.fillStyle=held?'rgba(255,214,110,.32)':sel?'rgba(150,180,255,.3)':'rgba(10,15,42,.25)';
  b.beginPath(); b.roundRect(x,y,w,h,5); b.fill();
  if(sel||held){ b.strokeStyle=held?'rgba(255,224,138,.95)':'rgba(255,224,138,.6)'; b.lineWidth=1.2; b.beginPath(); b.roundRect(x+0.5,y+0.5,w-1,h-1,5); b.stroke(); }
}
const partyLit=(x,y,w,h,i)=>litBox(x,y,w,h,sys.focus==='list'&&sys.idx===i,sys.held===i);
function drawPartyBack(P){
  partySlots().forEach((id,i)=>{ const y=P.y+PTY.top+i*PTY.row;
    partyLit(P.x+6,y,P.w-12,PTY.row-4,i);
    if(!id){ b.strokeStyle='rgba(200,212,255,.25)'; b.setLineDash([3,3]); b.strokeRect(P.x+11.5,y+3.5,45,45); b.setLineDash([]); return; }
    memberRowBack(P,id,y); });
  b.fillStyle='rgba(255,224,138,.25)'; b.fillRect(P.x+12,P.y+PTY.resY+18,P.w-24,1);
  const L=resLayout(), res=partyReserves();
  res.forEach((id,k)=>{ const x=P.x+14+k*L.step, y=P.y+PTY.resY+24;
    partyLit(x-3,y-3,L.size+6,L.size+6,PARTY_MAX+k); portraitBox(id,x,y,L.size,L.size);
    if(isHurt(id)){ b.fillStyle='rgba(60,10,20,.5)'; b.fillRect(x,y,L.size,L.size); } });
  /* Home: a dashed box with a little house in it */
  { const k=res.length, x=P.x+14+k*L.step, y=P.y+PTY.resY+24, s=L.size;
    partyLit(x-3,y-3,s+6,s+6,PARTY_MAX+k);
    b.strokeStyle='rgba(200,212,255,.45)'; b.setLineDash([3,3]); b.strokeRect(x+0.5,y+0.5,s-1,s-1); b.setLineDash([]);
    const cx=x+s/2, cy=y+s/2+2, r=s*0.22;
    b.fillStyle='rgba(255,224,138,.8)'; b.beginPath(); b.moveTo(cx-r*1.3,cy-r*0.2); b.lineTo(cx,cy-r*1.4); b.lineTo(cx+r*1.3,cy-r*0.2); b.closePath(); b.fill();
    b.fillRect(cx-r,cy-r*0.2,r*2,r*1.4); b.fillStyle='rgba(10,15,42,.8)'; b.fillRect(cx-r*0.3,cy+r*0.4,r*0.6,r*0.8); }
}
function drawPartyText(P){
  partySlots().forEach((id,i)=>{ const y=P.y+PTY.top+i*PTY.row;
    if(!id){ TS("Empty spot",P.x+66,y+30,18,'#7c84b0'); return; }
    memberRowText(P,id,y); });
  const res=partyReserves();
  TS("Reserves",P.x+14,P.y+PTY.resY+12,20,'#ffe08a',null,true);
  TS(res.length?"waiting at home":"no one waiting at home",P.x+P.w-12,P.y+PTY.resY+12,14,'#8a94c4','right');
  const L=resLayout();
  res.forEach((id,k)=>{ const x=P.x+14+k*L.step+L.size/2, y=P.y+PTY.resY+24+L.size+13;
    TS(isHurt(id)?"hurt "+(G.allies[id].hurtUntil-G.day)+"d":PARTY_INFO[id].name,x,y,fitSize(PARTY_INFO[id].name,13,L.step-2,false,9),isHurt(id)?'#ffb0a8':'#c8d4ff','center'); });
  TS("Send home",P.x+14+res.length*L.step+L.size/2,P.y+PTY.resY+24+L.size+13,fitSize("Send home",13,L.step+4,false,9),'#ffe08a','center');
  const R=partyRows(), h=sys.held!=null&&R[sys.held];
  const hint=h?(h.home?"Now pick who goes home.":h.res||h.id?"Now pick where "+PARTY_INFO[h.res||h.id].name+" goes (or Home).":"Now pick who goes in this spot."):
    sys.focus!=='list'?"":IS_TOUCH?"Tap someone or a spot, then where it goes.":"J: pick someone or a spot, then where it goes.";
  if(hint&&!(G.msgT>0)) TS(hint,P.x+P.w/2,P.y+P.h-12,14,h?'#ffe08a':'#8a94c4','center');
}
/* ---------- a member's row (the main screen and the Party page) ----------
   Portrait, name and class, level, and HP and MP with their numbers and bars. The HP/MP
   labels line up, with room for numbers up to 999/999. */
function memberRowBack(P,id,y){
  const M=member(id), away=!G.party.includes(id);
  portraitBox(id,P.x+11,y+3,46,46);
  if(away){ b.fillStyle='rgba(10,15,42,.45)'; b.fillRect(P.x+11,y+3,46,46); }
  const gx=P.x+186, gw=P.w-198;
  gauge(gx,y+25,gw,5,M.hp,M.maxhp,'#e8504a','#ffa8a0'); gauge(gx,y+39,gw,5,M.mp,memberMaxMp(id),'#4aa8f0','#b0e0ff');
}
function memberRowText(P,id,y){
  const M=member(id), away=!G.party.includes(id), nm=PARTY_INFO[id].name;
  TS(nm,P.x+66,y+21,fitSize(nm,20,80,true),away?'#aab6e8':'#f4f6ff',null,true);
  const cl=MEMBER_CLASS[id]||""; TS(cl,P.x+66,y+40,fitSize(cl,14,84),'#ffe08a');
  TS("Lv."+M.lv,P.x+186,y+17,16,'#ffe08a',null,true);
  if(away) TS(isHurt(id)?"hurt "+(G.allies[id].hurtUntil-G.day)+"d":"at home",P.x+P.w-12,y+17,13,isHurt(id)?'#ffb0a8':'#8a94c4','right');
  const lx=P.x+182-TW("999/999",13)-4;
  [["HP",M.hp+"/"+M.maxhp,y+30,'#ffb0a8'],["MP",M.mp+"/"+memberMaxMp(id),y+44,'#a8d8ff']].forEach(([lab,v,ty,col])=>{
    TS(v,P.x+182,ty,13,col,'right'); TS(lab,lx,ty,12,'#c8d4ff','right',true); });
}
/* ---------- the main screen ----------
   The party (and anyone at home) with their class, level, HP and MP; this season's
   week as a calendar (days gone crossed out, today circled); where she is, and the
   season. While picking whose page to open (sys.focus 'who') a row is lit. */
const HOME={top:10,row:56,cal:308,calH:32,loc:378};
/* the main screen shows the five spots as they stand (G.slots), an empty one left blank;
   friends at home aren't shown (their pages are still a left/right away) */
const homeRowAt=(P,y)=>{ const j=Math.floor((y-P.y-HOME.top)/HOME.row); return j>=0&&j<PARTY_MAX&&partySlots()[j]?j:-1; };
const whoInParty=()=>clamp(sys.who,0,G.party.length-1);
function drawHomeBack(P){
  partySlots().forEach((id,i)=>{ if(!id) return; const y=P.y+HOME.top+i*HOME.row;
    litBox(P.x+6,y,P.w-12,HOME.row-4,sys.focus==='who'&&whoId()===id,false); memberRowBack(P,id,y); });
  /* the calendar: one box a day */
  const cx0=P.x+12, cw=(P.w-24)/DAYS_PER_SEASON, cy=P.y+HOME.cal+8, today=dayOfSeason();
  b.fillStyle='rgba(10,15,42,.35)'; b.fillRect(cx0,cy,cw*DAYS_PER_SEASON,HOME.calH);
  b.strokeStyle='rgba(230,234,246,.85)'; b.lineWidth=1;
  for(let d=0;d<DAYS_PER_SEASON;d++){ const x=cx0+d*cw;
    b.strokeRect(Math.round(x)+0.5,cy+0.5,Math.round(cw),HOME.calH);
    if(d+1<today){ b.strokeStyle='rgba(255,224,138,.8)'; b.lineWidth=1.4;
      b.beginPath(); b.moveTo(x+cw*0.25,cy+HOME.calH-4); b.lineTo(x+cw*0.75,cy+4); b.stroke();
      b.strokeStyle='rgba(230,234,246,.85)'; b.lineWidth=1; }
    if(d+1===today){ b.strokeStyle='#7ee08a'; b.lineWidth=1.8; b.beginPath(); b.ellipse(x+cw/2,cy+HOME.calH/2,cw/2-2,HOME.calH/2-2,0,0,7); b.stroke();
      b.strokeStyle='rgba(230,234,246,.85)'; b.lineWidth=1; } }
  /* where she is, and the season */
  const sy=P.y+HOME.loc, sx=P.x+P.w-64;
  b.fillStyle='rgba(10,15,42,.35)'; b.beginPath(); b.roundRect(sx-6,sy-14,64,28,6); b.fill();
  seasonIcon(b,season(),P.x+P.w-20,sy,9);
}
/* a little picture of the season: a blossom, the sun, a maple leaf or a snowflake */
function seasonIcon(c,s,x,y,r){
  c.save(); c.translate(x,y);
  if(s==='spring'){ c.fillStyle='#f6a8c8';
    for(let i=0;i<5;i++){ const a=i*TAU/5-Math.PI/2; c.beginPath(); c.ellipse(Math.cos(a)*r*0.55,Math.sin(a)*r*0.55,r*0.45,r*0.32,a,0,7); c.fill(); }
    c.fillStyle='#ffe08a'; c.beginPath(); c.arc(0,0,r*0.28,0,7); c.fill(); }
  else if(s==='summer'){ c.strokeStyle='#f0a83a'; c.lineWidth=r*0.16;
    for(let i=0;i<8;i++){ const a=i*Math.PI/4; c.beginPath(); c.moveTo(Math.cos(a)*r*0.68,Math.sin(a)*r*0.68); c.lineTo(Math.cos(a)*r,Math.sin(a)*r); c.stroke(); }
    c.fillStyle='#f6cc4a'; c.beginPath(); c.arc(0,0,r*0.5,0,7); c.fill(); }
  else if(s==='fall'){ c.fillStyle='#e8702a'; c.beginPath();
    const pts=[[0,-1],[0.22,-0.45],[0.62,-0.62],[0.48,-0.18],[0.95,0.02],[0.42,0.22],[0.5,0.58],[0.08,0.4],[0,0.62],[-0.08,0.4],[-0.5,0.58],[-0.42,0.22],[-0.95,0.02],[-0.48,-0.18],[-0.62,-0.62],[-0.22,-0.45]];
    pts.forEach(([px,py],i)=>i?c.lineTo(px*r,py*r):c.moveTo(px*r,py*r)); c.closePath(); c.fill();
    c.strokeStyle='#8a3a12'; c.lineWidth=r*0.1; c.beginPath(); c.moveTo(0,r*0.62); c.lineTo(0,r); c.stroke(); }
  else { c.strokeStyle='#d8eeff'; c.lineWidth=r*0.14; c.lineCap='round';
    for(let i=0;i<6;i++){ const a=i*Math.PI/3, ex=Math.cos(a)*r, ey=Math.sin(a)*r;
      c.beginPath(); c.moveTo(0,0); c.lineTo(ex,ey); c.stroke();
      const bx=Math.cos(a)*r*0.6, by=Math.sin(a)*r*0.6;
      for(const s2 of [-1,1]){ const b2=a+s2*0.7; c.beginPath(); c.moveTo(bx,by); c.lineTo(bx+Math.cos(b2)*r*0.32,by+Math.sin(b2)*r*0.32); c.stroke(); } } }
  c.restore();
}
/* the largest size (down to lo) at which t fits in w */
const fitSize=(t,size,w,bold,lo)=>{ let s=size; while(s>(lo||9)&&TW(t,s,bold)>w) s--; return s; };
function drawHomeText(P){
  partySlots().forEach((id,i)=>{ if(id) memberRowText(P,id,P.y+HOME.top+i*HOME.row); });
  const cx0=P.x+12, cw=(P.w-24)/DAYS_PER_SEASON, cy=P.y+HOME.cal+8, today=dayOfSeason();
  WEEKDAYS.forEach((d,i)=>TS(d,cx0+i*cw+cw/2,cy-3,fitSize(d,11,cw-1,false,7),i+1===today?'#b8f0a0':'#aab6e8','center'));
  for(let d=0;d<DAYS_PER_SEASON;d++) TS(String(d+1),cx0+d*cw+cw/2,cy+HOME.calH/2+7,21,d+1<today?'#8a94c4':'#f4f6ff','center',true);
  const sy=P.y+HOME.loc, pl=placeName();
  TS(pl,P.x+14,sy+2,fitSize(pl,24,P.w-100,true),'#f4f6ff',null,true);
  TS(weekday()+", "+SEASON_NAME[season()]+" "+dayOfSeason(),P.x+14,sy+22,15,'#c8d4ff');
  TS(SEASON_NAME[season()],P.x+P.w-34,sy+6,16,'#f4f6ff','right',true);
  const t=sysTab(), hint=sys.focus==='who'?(IS_TOUCH?"Tap whose "+t+" to see":"Whose "+t+"?  J: pick · H: back")
    :IS_TOUCH?"Tap "+t+" again to open it":"J: open "+t+" · H: close";
  if(!(G.msgT>0)) TS(hint,P.x+P.w/2,P.y+P.h-14,14,sys.focus==='who'?'#ffe08a':'#8a94c4','center');
}
/* a chance as a percent, to a tenth where it isn't whole */
const critText=c=>{ const v=Math.round(c*1000)/10; return v+"%"; };
/* ---------- the Equip page ----------
   Her four slots down the left, her stats on the right. The highlighted slot's choices
   are listed below; A on a slot moves the cursor into them (sys.eq), and the stats show
   what wearing the highlighted one would change. */
const EQP={slotY:96,slotH:38,slotW:126,statX:140,statY:108,statH:18,listY:268,row:20,foot:82};
const EQ_STATS=STATS.concat(['crit']);
const eqFit=()=>Math.floor((SYSW.page.h-EQP.listY-EQP.foot-8)/EQP.row);
function openEquipPick(id,slot){
  const L=equipChoices(id,slot);
  if(L.length<2&&!equipOf(id)[slot]){ say("Nothing to wear here yet."); sfx('cant_do_that'); return; }
  const i=Math.max(0,L.indexOf(equipOf(id)[slot]||null));
  sys.eq={id,slot,list:L,idx:i,top:Math.max(0,i-eqFit()+1)}; sfx('menu_confirm');
}
function eqSee(){ const E=sys.eq, n=eqFit(); if(E.idx<E.top) E.top=E.idx; if(E.idx>=E.top+n) E.top=E.idx-n+1; }
function eqWear(){ const E=sys.eq; sys.eq=null; wearEquip(E.id,E.slot,E.list[E.idx]); }
/* a member's stats as they'd be with k in that slot (worked out, then put back) */
function statsWith(id,slot,k){
  const E=equipOf(id), was=E[slot]; E[slot]=k;
  const o={}; STATS.forEach(s=>o[s]=statOf(id,s)); o.crit=critBase(id); E[slot]=was; return o;
}
const eqSlotNow=()=>EQUIP_SLOTS[clamp(sys.idx,0,EQUIP_SLOTS.length-1)][0];
/* what the list below shows: the open choice list, or the highlighted slot's choices */
const eqShown=()=>sys.eq?sys.eq:{list:equipChoices(whoId(),eqSlotNow()),idx:-1,top:0};
function drawEquipBack(P){
  const id=whoId();
  EQUIP_SLOTS.forEach(([slot],i)=>{ const y=P.y+EQP.slotY+i*EQP.slotH, k=equipOf(id)[slot];
    litBox(P.x+6,y,EQP.slotW,EQP.slotH-3,sys.focus==='list'&&sys.idx===i&&!sys.eq,sys.eq&&sys.eq.slot===slot);
    if(k) drawShopPic(equipPic(k),P.x+26,y+EQP.slotH/2-1,26,26); });
  b.fillStyle='rgba(10,15,42,.3)'; b.beginPath(); b.roundRect(P.x+EQP.statX-4,P.y+EQP.slotY,P.w-EQP.statX-6,EQP.slotH*4-3,5); b.fill();
  b.fillStyle='rgba(200,212,255,.3)'; b.fillRect(P.x+12,P.y+EQP.listY-20,P.w-24,1);
  const L=eqShown();
  if(sys.eq&&L.idx>=0) winCursor(P.x+6,P.y+EQP.listY+(L.idx-L.top)*EQP.row,P.w-12,EQP.row-1);
  /* the footer: the picture of what's highlighted */
  const F={x:P.x+6,y:P.y+P.h-EQP.foot-4,w:P.w-12,h:EQP.foot}; rpgWin(F);
  const k=sys.eq?sys.eq.list[sys.eq.idx]:equipOf(id)[eqSlotNow()];
  b.fillStyle='rgba(10,15,42,.4)'; b.beginPath(); b.roundRect(F.x+8,F.y+10,48,48,5); b.fill();
  if(k) drawShopPic(equipPic(k),F.x+32,F.y+34,42,42);
}
function drawEquipText(P){
  const id=whoId(), E=sys.eq;
  EQUIP_SLOTS.forEach(([slot,name],i)=>{ const y=P.y+EQP.slotY+i*EQP.slotH, k=equipOf(id)[slot], nm=k?EQUIP[k].name:"—";
    TS(name,P.x+46,y+13,12,'#8a94c4');
    TS(nm,P.x+46,y+28,fitSize(nm,16,EQP.slotW-44),k?'#f4f6ff':'#7c84b0',null,sys.idx===i); });
  /* the stats, and what the highlighted choice would change */
  const now={}; STATS.forEach(s=>now[s]=statOf(id,s)); now.crit=critBase(id);
  const then=E?statsWith(id,E.slot,E.list[E.idx]):null, M=member(id);
  EQ_STATS.forEach((s,i)=>{ const y=P.y+EQP.statY+i*EQP.statH, v=then?then[s]:now[s], d=then?then[s]-now[s]:0, cr=s==='crit';
    const dd=cr?Math.round(d*1000)/10:d;
    TS(cr?"Crit rate":STAT_NAME[s],P.x+EQP.statX,y,13,cr?'#ffd0a0':'#c8d4ff');
    const vt=cr?critText(v):s==='hp'?Math.min(M.hp,v)+"/"+v:s==='mp'?Math.min(M.mp,v)+"/"+v:String(v);
    TS(vt,P.x+P.w-36,y,15,dd>0?'#b8f0a0':dd<0?'#ff9a8a':'#ffffff','right',true);
    if(dd) TS((dd>0?"+":"")+dd+(cr?"%":""),P.x+P.w-12,y,12,dd>0?'#b8f0a0':'#ff9a8a','right',true);
    else if(!then&&!cr&&equipBonus(id,s)) TS("+"+equipBonus(id,s),P.x+P.w-12,y,12,'#8fc88a','right'); });
  /* the choices for the highlighted slot */
  const L=eqShown(), cur=equipOf(id)[E?E.slot:eqSlotNow()]||null, n=eqFit();
  TS(E?"Choose for "+EQUIP_SLOTS.find(s=>s[0]===E.slot)[1]:"For "+EQUIP_SLOTS.find(s=>s[0]===eqSlotNow())[1]+":",P.x+14,P.y+EQP.listY-6,13,E?'#ffe08a':'#8a94c4');
  L.list.slice(L.top,L.top+n).forEach((k,j)=>{ const i=L.top+j, y=P.y+EQP.listY+j*EQP.row+14;
    TS(k?EQUIP[k].name:"Nothing",P.x+48,y,15,!E?'#aab6e8':k?'#f4f6ff':'#aab6e8',null,E&&i===L.idx);
    TS(k===cur?"worn":equipStats(k),P.x+P.w-14,y,12,k===cur?'#b8f0a0':'#ffe08a','right'); });
  if(L.top>0) TS("▲",P.x+P.w-20,P.y+EQP.listY-2,12,'#c8d4ff','center');
  if(L.top+n<L.list.length) TS("▼",P.x+P.w-20,P.y+EQP.listY+n*EQP.row+4,12,'#c8d4ff','center');
  const F={x:P.x+6,y:P.y+P.h-EQP.foot-4,w:P.w-12,h:EQP.foot};
  const k=E?E.list[E.idx]:equipOf(id)[eqSlotNow()];
  TS(k?EQUIP[k].name:E?"Nothing":"Empty",F.x+64,F.y+22,17,'#f4f6ff',null,true);
  const desc=k?equipDesc(k):E?"Take off what's in this slot.":"Nothing in this slot yet.";
  const hint=E?(IS_TOUCH?"Tap again to wear it.":"J: wear · H: back"):(IS_TOUCH?"Tap the slot again to change it.":"J: change · ◀ ▶: who");
  const lines=wrapLines(desc,13,F.w-76).slice(0,3);
  lines.forEach((ln,i)=>TS(ln,F.x+64,F.y+38+i*13,13,'#c8d4ff'));
  if(G.msgT>0) TS(G.msg,F.x+F.w-10,F.y+F.h-8,13,'#ffe08a','right',true);      /* (what just happened, in place of the hint) */
  else TS(hint,F.x+F.w-10,F.y+F.h-8,12,'#8a94c4','right');
}
/* ---------- the pages' rows ---------- */
/* the rows of the open page: [{label,...}] plus how tall each is */
function sysRows(){
  const t=sysTab();
  if(t==='Party') return {h:PTY.row,rows:partyRows()};        /* (its own page: drawPartyBack) */
  if(t==='Status') return {h:28,rows:STATS.map(k=>({stat:k})).concat([{crit:true},{rename:true}])};
  if(t==='Skills') return {h:24,rows:skillBook(whoId()).map(s=>({skill:s}))};
  if(t==='Items') return sys.cat?{h:22,rows:itemRows(sys.cat)}:{h:44,rows:ITEM_CATS.map(c=>({cat:c}))};
  if(t==='Equip') return {h:EQP.slotH,rows:EQUIP_SLOTS.map(([slot])=>({slot}))};
  if(t==='Settings') return {h:44,rows:(sys.gfx?gfxRows():SETTINGS).map(S=>({set:S}))};
  if(t==='Lore') return loreRows();
  return {h:44,rows:SAVE_ACTIONS.map((a,i)=>({save:i}))};
}
/* an Items list is two columns: row i at line i>>1, left or right */
const twoCol=()=>sysTab()==='Items'&&!!sys.cat;
const ITEM_COL={gap:4};
function itemCell(i){ const P=SYSW.page, w=(P.w-12-ITEM_COL.gap)/2, line=Math.floor(i/2)-sys.top;
  return {x:P.x+6+(i%2)*(w+ITEM_COL.gap),y:P.y+pageRowsY()+line*22,w,h:21}; }
const footH=()=>{ const t=sysTab();
  if(t==='Items') return sys.cat?96:0;
  return ['Status','Skills','Settings'].includes(t)||(t==='Lore'&&sys.lore&&!sys.loreSel)?78:0; };
const rowsFit=()=>{ const R=sysRows(); return Math.max(1,Math.floor((SYSW.page.h-pageRowsY()-footH()-8)/R.h)-(twoCol()?1:0)); };   /* (two columns: a line kept for the message) */
function sysSee(i){ const n=rowsFit(); if(twoCol()) i=Math.floor(i/2); if(i<sys.top) sys.top=i; if(i>=sys.top+n) sys.top=i-n+1; }
/* the Graphics window, opened from Settings, and B back out of it */
function gfxOpen(){ sys.gfx=true; sys.idx=0; sys.top=0; sfx('menu_confirm'); }
function gfxBack(){ if(!sys.gfx) return false; sys.gfx=false; sys.idx=SETTINGS.findIndex(S=>S.opens); sys.top=0; sysSee(sys.idx); return true; }
function sysSetTab(t){ sys.tab=(t+SYSTABS.length)%SYSTABS.length; sys.idx=0; sys.top=0; sys.lore=null; sys.gfx=false; sys.loreSel=null; sys.held=null; sys.eq=null; sys.cat=null; }
/* A on a tab: Status, Skills and Equip ask who first; the others open */
function sysOpenTab(){
  const t=sysTab();
  if(pagesWho()){ sys.focus='who'; sys.who=whoInParty(); return; }
  if(t==='Party'){ sys.focus='list'; sys.idx=Math.max(0,partySlots().indexOf('kaitlyn')); return; }
  sys.focus='list'; sys.idx=0; sys.top=0;
}
/* picked whose page (from the main screen) */
function sysOpenWho(i){ sys.who=i; sys.focus='list'; sys.idx=0; sys.top=0; sys.eq=null; }
function sysActivate(i){
  const R=sysRows().rows[i], t=sysTab(); if(!R) return;
  if(t==='Party') partyPick(i);
  else if(t==='Status'){ if(R.rename) renameMember(whoId()); }
  else if(t==='Skills') skillActivate(R.skill);
  else if(t==='Items') itemActivate(R);
  else if(t==='Settings'){ if(R.set.act) sys.ask={home:true,idx:1}; else if(R.set.opens) gfxOpen(); else stepSetting(R.set,1); }
  else if(t==='Lore') loreActivate(R);
  else if(t==='Equip') openEquipPick(whoId(),R.slot);
  else if(t==='Save'){
    if(i===0){ try{navigator.clipboard.writeText(G.code);}catch(e){}
      say("Save code copied to clipboard."); G.scene='world'; }
    else if(i===1){ const s=prompt("Paste your save code:");
      if(s){ if(importCode(s)){ say("Game loaded!"); G.scene='world'; setMusic(areaMusic()); }
             else say("That code didn't work."); } }
    else if(i===2){ sys.slotPick={idx:(G.slot||1)-1,sure:false}; readSlots(); }
    else { autoSave(); toTitle(); }
  }
}
const pagesWho=()=>['Status','Skills','Equip'].includes(sysTab());
/* does this crop or good ('g:'+key) help just one person (and so need a choice of who)? */
function oneTarget(k){
  const e=isGoodKey(k)?goodEffect(k.slice(2)):EAT[k];
  return !!e&&!!(e.hp||e.mp);
}
function feed(k,id){ sys.pick=null; sys.ask=null; if(isGoodKey(k)) eatGood(k.slice(2),id); else eatCrop(k,id); }
/* choosing who in the window over the page: an item, or Tiny One's song */
function pickWho(id){ const p=sys.pick; if(p.skill) fieldSkill(p.by,p.skill,id); else feed(p.k,id); }
/* a window over the page (who has it, or are you sure) */
const modal=()=>sys.pick||sys.ask||sys.slotPick;
/* Save now: into this game's own slot, or a copy into another (to come back to that moment
   later: this game goes on saving in its own slot). Another game's slot is asked about first. */
function slotSave(n){
  const cur=n===(G.slot||1), was=SLOTS[n-1];
  if(!cur&&was&&!sys.slotPick.sure){ sys.slotPick.sure=true; return; }
  sys.slotPick=null; const code=exportCode();
  if(cur){ autoSave(); say("Saved in slot "+n+"."); }
  else { storeSet(slotKey(n),code); say("Saved a copy in slot "+n+". You're still playing in slot "+(G.slot||1)+"."); }
  SLOTS[n-1]=peekSave(code); sfx('save')>0||sfx('menu_confirm');
}
const slotLine=s=>s?"Lv."+s.lv+" · Day "+s.day+" · "+s.coins+"c"+(s.pt?" · "+Math.floor(s.pt/3600)+":"+String(Math.floor(s.pt/60)%60).padStart(2,'0'):""):"Empty";
/* the ask window's Yes: eat the thing, or go home */
function askYes(){ if(sys.ask.home) returnHome(); else feed(sys.ask.k,'kaitlyn'); }
/* move the highlight, stepping over section headings */
function sysStep(d){ const L=sysRows().rows, n=L.length; if(!n) return;
  if(twoCol()){ let j=sys.idx+2*d;                   /* up and down a line, staying in the column */
    if(j>=n) j=sys.idx%2; if(j<0){ j=n-1-((n-1)%2!==sys.idx%2?1:0); if(j<0) j=0; }
    sys.idx=Math.min(j,n-1); sysSee(sys.idx); return; }
  for(let g=0;g<n;g++){ sys.idx=(sys.idx+d+n)%n; if(!L[sys.idx].head) break; }
  sysSee(sys.idx); }
function sysKey(k){
  const n=sysRows().rows.length, t=sysTab();
  if(sys.pick){ const P=G.party, m=P.length;
    if(isUp(k)) sys.pick.idx=(sys.pick.idx+m-1)%m;
    else if(isDown(k)) sys.pick.idx=(sys.pick.idx+1)%m;
    else if(isOk(k)) pickWho(P[sys.pick.idx]);
    else if(isBack(k)) sys.pick=null;
    return; }
  if(sys.ask){
    if(isUp(k)||isDown(k)) sys.ask.idx=1-sys.ask.idx;
    else if(isOk(k)){ if(sys.ask.idx===0) askYes(); else sys.ask=null; }
    else if(isBack(k)) sys.ask=null;
    return; }
  if(sys.slotPick){ const SP=sys.slotPick;
    if(isUp(k)||isDown(k)){ SP.idx=(SP.idx+(isUp(k)?SAVE_SLOTS-1:1))%SAVE_SLOTS; SP.sure=false; }
    else if(isOk(k)) slotSave(SP.idx+1);
    else if(isBack(k)){ if(SP.sure) SP.sure=false; else sys.slotPick=null; }
    return; }
  if(sys.eq){ const E=sys.eq, m=E.list.length;
    if(isUp(k)){ E.idx=(E.idx+m-1)%m; eqSee(); }
    else if(isDown(k)){ E.idx=(E.idx+1)%m; eqSee(); }
    else if(isOk(k)) eqWear();
    else if(isBack(k)) sys.eq=null;
    return; }
  if(sys.loreSel&&(isOk(k)||isBack(k))){ sys.loreSel=null; return; }      /* a Lore page closes */
  if(sys.focus==='tabs'){
    if(isUp(k)) sysSetTab(sys.tab-1);
    else if(isDown(k)) sysSetTab(sys.tab+1);
    else if(isOk(k)||isRight(k)) sysOpenTab();
    else if(isBack(k)||k==='m') G.scene='world';
    return;
  }
  if(sys.focus==='who'){ const m=G.party.length;     /* (up and down the team, top to bottom) */
    if(isUp(k)) sys.who=(sys.who+m-1)%m;
    else if(isDown(k)) sys.who=(sys.who+1)%m;
    else if(isOk(k)||isRight(k)) sysOpenWho(sys.who);
    else if(isBack(k)||isLeft(k)) sys.focus='tabs';
    else if(k==='m') G.scene='world';
    return;
  }
  if(t==='Party'){ partyKey(k); return; }
  if(isUp(k)&&n) sysStep(-1);
  else if(isDown(k)&&n) sysStep(1);
  else if((isLeft(k)||isRight(k))&&pagesWho()) stepWho(isLeft(k)?-1:1);
  else if((isLeft(k)||isRight(k))&&twoCol()){           /* across the columns; past the edge, the next kind */
    if(isLeft(k)&&sys.idx%2===1) sys.idx--;
    else if(isRight(k)&&sys.idx%2===0&&sys.idx+1<n) sys.idx++;
    else stepCat(isLeft(k)?-1:1); }
  else if((isLeft(k)||isRight(k))&&t==='Settings'){ const R=sysRows().rows[sys.idx]; if(R&&!R.set.act) stepSetting(R.set,isLeft(k)?-1:1); }
  else if(isOk(k)) sysActivate(sys.idx);
  else if(isBack(k)){
    if(t==='Lore'&&loreBack()) return;
    if(t==='Settings'&&gfxBack()) return;
    if(t==='Items'&&itemBack()) return;
    sys.focus=pagesWho()?'who':'tabs'; }
  else if(k==='m') G.scene='world';
}
const PICK={x:40,y:150,w:280,row:40};
function sysTouch(x,y){
  const T=SYSW.tab, P=SYSW.page, t=sysTab();
  if(sys.pick){ const j=Math.floor((y-PICK.y-40)/PICK.row);
    if(x>PICK.x&&x<PICK.x+PICK.w&&j>=0&&j<G.party.length){ if(sys.pick.idx===j) pickWho(G.party[j]); else sys.pick.idx=j; }
    else sys.pick=null;
    return; }
  if(sys.ask){ const j=Math.floor((y-PICK.y-40)/PICK.row);
    if(x>PICK.x&&x<PICK.x+PICK.w&&j===0) askYes();
    else sys.ask=null;
    return; }
  if(sys.slotPick){ const j=Math.floor((y-PICK.y-40)/PICK.row);
    if(x>PICK.x&&x<PICK.x+PICK.w&&j>=0&&j<SAVE_SLOTS){ if(sys.slotPick.idx===j) slotSave(j+1); else { sys.slotPick.idx=j; sys.slotPick.sure=false; } }
    else sys.slotPick=null;
    return; }
  /* a tab: the first tap shows the main screen with it highlighted, a second opens it */
  if(x>=T.x&&x<=T.x+T.w&&y>=T.y&&y<T.y+SYSTABS.length*T.step){ const i=Math.floor((y-T.y)/T.step);
    if(i===sys.tab&&sys.focus==='tabs') sysOpenTab();
    else { sysSetTab(i); sys.focus='tabs'; }
    return; }
  if(x<P.x||x>P.x+P.w||y<P.y||y>P.y+P.h) return;
  /* the main screen: a tap on someone opens their page (Status, Skills or Equip) */
  if(onHome()){ const j=homeRowAt(P,y);
    if(j>=0&&pagesWho()) sysOpenWho(memberOrder().indexOf(partySlots()[j]));
    return; }
  /* Party: a tap picks someone (or a spot), the next tap where it goes */
  if(t==='Party'){ const i=partyAt(x,y); if(i<0){ sys.held=null; return; }
    sys.focus='list'; sys.idx=i; partyPick(i); return; }
  /* Lore: a tap on a page, or on a list's title, goes back a level */
  if(t==='Lore'&&(sys.loreSel||(sys.lore&&y<P.y+pageRowsY()-6))){ loreBack(); return; }
  if(t==='Settings'&&sys.gfx&&y<P.y+pageRowsY()-6){ gfxBack(); return; }
  if(t==='Items'&&sys.cat&&y<P.y+pageRowsY()-6){ if(x>P.x+P.w-70) stepCat(x>P.x+P.w-35?1:-1); else itemBack(); return; }
  if(pagesWho()&&y<P.y+pageRowsY()-6){ stepWho(x<P.x+P.w/2?-1:1); return; }
  /* Equip: a slot (tap again to change it), or one of the choices below (tap again to wear it) */
  if(t==='Equip'){
    const si=Math.floor((y-P.y-EQP.slotY)/EQP.slotH);
    if(x<P.x+6+EQP.slotW&&si>=0&&si<EQUIP_SLOTS.length){
      if(sys.eq&&sys.eq.slot===EQUIP_SLOTS[si][0]){ sys.eq=null; return; }
      sys.eq=null; if(sys.focus==='list'&&sys.idx===si) sysActivate(si); else { sys.focus='list'; sys.idx=si; } return; }
    const L=eqShown(), j=Math.floor((y-P.y-EQP.listY)/EQP.row), i=L.top+j;
    if(j>=0&&j<eqFit()&&i<L.list.length){
      if(!sys.eq){ openEquipPick(whoId(),eqSlotNow()); if(sys.eq){ sys.eq.idx=i; eqSee(); } return; }
      if(sys.eq.idx===i) eqWear(); else sys.eq.idx=i; }
    return; }
  if(twoCol()){ const R=sysRows(), j=Math.floor((y-P.y-pageRowsY())/22), c=x<P.x+P.w/2?0:1, i=(sys.top+j)*2+c;
    if(j>=0&&j<rowsFit()&&i<R.rows.length){ if(sys.focus==='list'&&sys.idx===i) sysActivate(i); else { sys.focus='list'; sys.idx=i; } }
    return; }
  /* the first tap picks a row, a second tap on it uses it */
  const R=sysRows(), j=Math.floor((y-P.y-pageRowsY())/R.h), i=sys.top+j;
  if(j>=0&&j<rowsFit()&&i<R.rows.length&&!R.rows[i].head){
    /* a volume: a tap on ◀ turns it down, on ▶ up */
    const S=R.rows[i].set;
    if(S&&S.level){ const right=P.x+P.w-14, w=TW("◀  "+S.label(S.get())+"  ▶",19,true);   /* as drawn */
      if(x>right-w-24){ sys.focus='list'; sys.idx=i; stepSetting(S,x<right-w/2?-1:1); return; } }
    if(sys.focus==='list'&&sys.idx===i&&(t!=='Status'||R.rows[i].rename)) sysActivate(i);
    else { sys.focus='list'; sys.idx=i; } }
}
/* what the highlighted row means, for the footer */
function sysFoot(){
  const R=sysRows().rows[sys.idx], t=sysTab(); if(!R) return null;
  if(t==='Status'&&R.rename) return ["Rename",IS_TOUCH?"Tap again to give "+PARTY_INFO[whoId()].name+" a new name.":"Press J to give "+PARTY_INFO[whoId()].name+" a new name."];
  if(t==='Status'&&R.crit) return ["Crit rate","The chance a hit is critical (x"+CRIT_MUL+" damage). Luck raises it, and so does some gear"+(PARTY_INFO[whoId()].crit?"; her claws find the soft spots too.":".")];
  if(t==='Status') return [STAT_NAME[R.stat],{hp:"Health. At 0 you're out of the fight.",mp:"Music Points, spent on songs and skills.",
    str:"Power of plain attacks.",agi:"Who moves first in battle.",def:"Softens the hits you take.",
    int:"Power of songs, spells and special moves.",luk:"Better odds of seeds and bonus coins."}[R.stat]];
  if(t==='Skills'){ const s=R.skill, known=member(whoId()).lv>=s.lv;
    return known?[s.name+(s.mp?"  ·  "+s.mp+" MP":""),s.desc+(s.field?(fieldUsable(s)?"  (A to play)":"  (spent today)"):s.fieldUse?"  (A to sing it now)":"")]
                :["????","Learned at level "+s.lv+"."]; }
  if(t==='Lore') return loreFoot(R);
  if(t==='Settings'&&R.set.act) return [R.set.name,R.set.about()+(IS_TOUCH?"  Tap again to go.":"  J to go.")];
  if(t==='Settings'){ const S=R.set; return [S.name+":  "+S.label(S.get()),S.about(S.get())+(S.opens?"  ◀ ▶ for a preset.":S.level?(IS_TOUCH?"  Tap ◀ or ▶ to change.":"  ◀ ▶ to change."):IS_TOUCH?"  Tap again to change.":"  ◀ ▶ or J to change.")]; }
  return null;
}
function drawSysTabs(T){
  SYSTABS.forEach((n,i)=>{ const y=T.y+i*T.step, on=i===sys.tab; rpgWin({x:T.x,y,w:T.w,h:T.h});
    if(on){ b.fillStyle=sys.focus==='tabs'?'rgba(255,214,110,.35)':'rgba(150,180,255,.25)'; b.beginPath(); b.roundRect(T.x+3,y+3,T.w-6,T.h-6,4); b.fill(); } });
}
function drawSysInfo(I){
  b.fillStyle='rgba(10,15,42,.5)'; b.beginPath(); b.roundRect(I.x+7,I.y+8,I.w-14,20,4); b.fill();
  b.fillStyle='rgba(255,214,110,.18)'; b.beginPath(); b.roundRect(I.x+5,I.y+I.h-29,I.w-10,23,4); b.fill();
}
function drawSysInfoText(I){
  const ct=clockText(); TS(ct.h+":"+ct.mm+" "+ct.ap,I.x+I.w/2,I.y+23,16,'#f4f6ff','center',true);
  [["Day",String(G.day)],["Garden","Lv."+G.gardenLv],["Harvests",String(G.harvests)],["Play time",playText()]].forEach(([a,v],i)=>{
    const y=I.y+48+i*20; TS(a,I.x+8,y,14,'#aab6e8'); TS(v,I.x+I.w-8,y,15,'#f4f6ff','right',true); });
  TS("Coins",I.x+9,I.y+I.h-13,14,'#c8d4ff');
  const c=G.coins+"c"; TS(c,I.x+I.w-9,I.y+I.h-12,fitSize(c,19,I.w-50,true),'#ffe08a','right',true);
}
function drawSys(){
  const P=SYSW.page, T=SYSW.tab, I=SYSW.info, t=sysTab(), home=onHome();
  /* deep blue backdrop over the whole screen */
  const g=b.createLinearGradient(0,BAND_TOP(),0,BAND_BOT()); g.addColorStop(0,'#141c4a'); g.addColorStop(1,'#070b22');
  b.fillStyle=g; b.fillRect(0,BAND_TOP(),LW,BAND_BOT()-BAND_TOP());
  rpgWin(P); rpgWin(I); drawSysTabs(T); drawSysInfo(I);
  const R=home?{h:1,rows:[]}:sysRows(), fit=home?0:rowsFit();
  const rowY=i=>P.y+pageRowsY()+(i-sys.top)*R.h, two=!home&&twoCol();
  const vis=home||t==='Party'||t==='Equip'||two?[]:R.rows.slice(sys.top,sys.top+fit);
  const cells=two?R.rows.slice(sys.top*2,(sys.top+fit)*2).map((r,j)=>({r,i:sys.top*2+j})):[];
  if(home) drawHomeBack(P);
  else {
    /* Status, Skills and Equip: whose page it is, with their portrait */
    if(pagesWho()) portraitBox(whoId(),P.x+12,P.y+10,64,76);
    if(t==='Party') drawPartyBack(P);
    else if(t==='Equip') drawEquipBack(P);
    else if(two) cells.forEach(({i})=>{ const C=itemCell(i); litBox(C.x,C.y,C.w,C.h,sys.focus==='list'&&i===sys.idx,false); });
    else if(sys.focus==='list'&&R.rows.length) winCursor(P.x+6,rowY(sys.idx),P.w-12,R.h-2);
    vis.forEach((r,j)=>{ const i=sys.top+j, y=rowY(i);
      if(t==='Status'&&r.stat){ const v=statOf(whoId(),r.stat), mx={hp:300,mp:120}[r.stat]||80; gauge(P.x+150,y+12,90,5,v,mx,'#f0c84a','#fff0b0'); }
      if(t==='Status'&&r.crit) gauge(P.x+150,y+12,90,5,critBase(whoId()),0.4,'#ff9a3a','#ffd0a0');
      if(t==='Lore') loreRowPic(r,P,y,R.h); });
    if(t==='Status'){ const id=whoId(), M=member(id);
      gauge(P.x+20,P.y+pageRowsY()+(STATS.length+2)*R.h+12,P.w-40,6,M.xp,M.next,'#f0c84a','#fff0b0'); }
    if(t==='Lore'&&sys.loreSel) loreDetailBack(P);
    if(footH()) rpgWin({x:P.x+6,y:P.y+P.h-footH()-4,w:P.w-12,h:footH()});
    /* Items: the highlighted thing's picture in the footer (the only one shown) */
    if(t==='Items'&&sys.cat&&sys.focus==='list'){ const r=R.rows[sys.idx];
      if(r){ const fy=P.y+P.h-footH()-4; b.fillStyle='rgba(10,15,42,.4)'; b.beginPath(); b.roundRect(P.x+14,fy+10,60,60,6); b.fill();
        itemInfo(r).pic()(P.x+44,fy+40,52); } }
  }
  /* a window over the page: the page dims behind it, and its words are left out below */
  if(modal()){ b.fillStyle='rgba(4,6,20,.6)'; b.fillRect(0,BAND_TOP(),LW,BAND_BOT()-BAND_TOP()); }
  if(sys.slotPick){ rpgWin({x:PICK.x,y:PICK.y,w:PICK.w,h:48+SAVE_SLOTS*PICK.row+22});
    winCursor(PICK.x+6,PICK.y+40+sys.slotPick.idx*PICK.row,PICK.w-12,PICK.row-2); }
  if(sys.ask){ rpgWin({x:PICK.x,y:PICK.y,w:PICK.w,h:48+2*PICK.row+22});
    winCursor(PICK.x+6,PICK.y+40+sys.ask.idx*PICK.row,PICK.w-12,PICK.row-2); }
  if(sys.pick){ const h=48+G.party.length*PICK.row; rpgWin({x:PICK.x,y:PICK.y,w:PICK.w,h});
    winCursor(PICK.x+6,PICK.y+40+sys.pick.idx*PICK.row,PICK.w-12,PICK.row-2);
    G.party.forEach((id,i)=>{ const M=member(id), y=PICK.y+40+i*PICK.row;
      gauge(PICK.x+150,y+12,110,5,M.hp,M.maxhp,'#e8504a','#ffa8a0'); gauge(PICK.x+150,y+26,110,5,M.mp,memberMaxMp(id),'#4aa8f0','#b0e0ff'); }); }
  blit();
  if(modal()){ drawModalWords(); return; }      /* the dimmed page's words stay hidden */
  /* words */
  SYSTABS.forEach((n,i)=>TS(n,T.x+T.w/2,T.y+i*T.step+T.h/2+4,23,i===sys.tab?'#ffe08a':'#e4e8ff','center',i===sys.tab));
  drawSysInfoText(I);
  if(home){ drawHomeText(P); if(G.msgT>0) TS(G.msg,P.x+P.w/2,P.y+P.h-14,15,'#ffe08a','center'); return; }
  /* the page's title (and who, for Status, Skills and Equip) */
  if(pagesWho()){ const id=whoId(), many=memberOrder().length>1, M=member(id);
    TS(PARTY_INFO[id].name,P.x+88,P.y+30,26,'#f4f6ff',null,true);
    TS("Lv."+M.lv+"   "+(MEMBER_CLASS[id]||""),P.x+88,P.y+50,17,'#ffe08a',null,true);
    if(many) TS("◀  ▶",P.x+P.w-14,P.y+30,22,'#c8d4ff','right',true);
    wrapLines(PARTY_INFO[id].role,13,P.w-100).slice(0,2).forEach((ln,i)=>TS(ln,P.x+88,P.y+66+i*12,13,'#aab6e8')); }
  else if(t==='Party') TS("Active team  "+G.party.length+"/"+PARTY_MAX,P.x+14,P.y+26,24,'#f4f6ff',null,true);
  else if(t==='Lore'){ TS(loreTitle(),P.x+14,P.y+26,sys.loreSel?22:24,'#f4f6ff',null,true);
    if(sys.lore&&!sys.loreSel) TS("◀ back",P.x+P.w-12,P.y+26,15,'#8a94c4','right');
    if(sys.lore==='songs'&&!sys.loreSel){ TS("Flute Mastery",P.x+14,P.y+54,17,'#c8d4ff');
      TS(fluteMastery().toLocaleString(),P.x+14+TW("Flute Mastery ",17),P.y+54,20,'#ffe08a',null,true);
      TS("of "+masteryMax().toLocaleString()+", longer songs worth more",P.x+P.w-12,P.y+54,13,'#8a94c4','right'); } }
  else if(t==='Settings'&&sys.gfx){ TS("Graphics",P.x+14,P.y+26,24,'#f4f6ff',null,true); TS("◀ back",P.x+P.w-12,P.y+26,15,'#8a94c4','right'); }
  else if(t==='Items'&&sys.cat){ TS(catNow().name,P.x+14,P.y+26,24,'#f4f6ff',null,true); TS("◀  ▶",P.x+P.w-14,P.y+26,20,'#c8d4ff','right',true); }
  else TS(t,P.x+14,P.y+26,24,'#f4f6ff',null,true);
  if(t==='Party') drawPartyText(P);
  if(t==='Equip') drawEquipText(P);
  vis.forEach((r,j)=>{ const i=sys.top+j, y=rowY(i), sel=sys.focus==='list'&&i===sys.idx;
    if(t==='Status'&&r.rename) TS("✎  Rename "+PARTY_INFO[whoId()].name,P.x+38,y+17,18,'#ffe08a',null,sel);
    else if(t==='Status'&&r.crit){ TS("Crit rate",P.x+38,y+17,19,'#e4e8ff',null,sel); TS(critText(critBase(whoId())),P.x+142,y+17,19,'#ffffff','right',true); }
    else if(t==='Status'){ const id=whoId(), v=statOf(id,r.stat), eb=equipBonus(id,r.stat);
      TS(STAT_NAME[r.stat],P.x+38,y+17,19,'#e4e8ff',null,sel);
      TS(r.stat==='hp'?member(id).hp+"/"+v:r.stat==='mp'?member(id).mp+"/"+v:String(v),P.x+142,y+17,19,'#ffffff','right',true);
      if(eb) TS("+"+eb,P.x+P.w-12,y+17,15,'#b8f0a0','right'); }
    else if(t==='Skills'){ const s=r.skill, known=member(whoId()).lv>=s.lv;
      TS(known?s.name:"????",P.x+44,y+16,18,known?(s.field||s.fieldUse?'#b8f0a0':'#f4f6ff'):'#7c84b0',null,sel);
      if(!known) TS("Lv."+s.lv,P.x+P.w-12,y+16,14,'#8a94c4','right');
      else if(s.mp) TS(s.mp+" MP",P.x+P.w-12,y+16,15,'#a8d8ff','right'); }
    else if(t==='Items'&&r.cat){ const c=catCount(r.cat.id);
      TS(r.cat.name,P.x+44,y+19,20,c?'#f4f6ff':'#8a94c4',null,sel); TS(r.cat.about,P.x+44,y+35,13,'#aab6e8');
      TS(c?String(c):"—",P.x+P.w-14,y+26,16,c?'#ffe08a':'#7c84b0','right',true); }

    else if(t==='Lore') loreRowText(r,P,y,R.h,sel);
    else if(t==='Settings'){ const S=r.set;
      TS(S.name,P.x+38,y+28,20,S.act?'#ffe08a':'#f4f6ff',null,sel);
      if(!S.act) TS("◀  "+S.label(S.get())+"  ▶",P.x+P.w-14,y+28,19,'#ffe08a','right',true); }
    else if(t==='Save') TS(SAVE_ACTIONS[r.save],P.x+P.w/2+10,y+28,21,'#f4f6ff','center',sel);
  });
  cells.forEach(({r,i})=>{ const C=itemCell(i), I2=itemInfo(r), sel=sys.focus==='list'&&i===sys.idx;
    const right=r.gear?(I2.on?"on":"off"):I2.n!==undefined?"x"+I2.n:"", rw=right?TW(right,13,true)+4:0;
    TS(I2.name,C.x+7,C.y+15,fitSize(I2.name,14,C.w-12-rw,sel,10),r.gear&&!I2.on?'#8a94c4':'#f4f6ff',null,sel);
    if(right) TS(right,C.x+C.w-5,C.y+15,13,r.gear?(I2.on?'#b8f0a0':'#ff9a8a'):'#ffe08a','right',true); });
  if(t==='Lore'&&sys.loreSel) loreDetailText(P);
  if(t==='Items'&&sys.cat&&!R.rows.length) TS({use:"Nothing to eat or drink yet.",harvest:"Nothing harvested yet.",seeds:"No seeds. The stall sells them.",
    trinkets:"No trinkets. Pests drop them.",gear:"No garden gear yet.",key:"Nothing here yet."}[sys.cat],P.x+P.w/2,P.y+90,16,'#aab6e8','center');
  if(t==='Save') TS("Slot "+G.slot+" · Lv."+G.player.lv+" · "+G.coins+"c · "+SEASON_NAME[season()]+" Day "+G.day,P.x+P.w/2,P.y+250,17,'#c8d4ff','center');
  if(t==='Status'){ const id=whoId(), M=member(id), y=P.y+pageRowsY()+(STATS.length+2)*R.h+8;
    TS("EXP "+M.xp+" / "+M.next+" to Lv."+(M.lv+1),P.x+20,y,17,'#ffe08a',null,true); }
  if(t!=='Party'&&t!=='Equip'&&sys.top>0) TS("▲",P.x+P.w-20,P.y+pageRowsY()-4,14,'#c8d4ff','center');
  if(t!=='Party'&&t!=='Equip'&&sys.top+fit<(two?Math.ceil(R.rows.length/2):R.rows.length)) TS("▼",P.x+P.w-20,P.y+P.h-footH()-10,14,'#c8d4ff','center');
  if(footH()){ const fy=P.y+P.h-footH()-4;
    if(t==='Items'){ const r=sys.focus==='list'&&R.rows[sys.idx];
      if(r){ const I2=itemInfo(r); TS(I2.name+(I2.n?"  x"+I2.n:""),P.x+84,fy+22,17,'#f4f6ff',null,true);
        wrapLines(I2.desc,13,P.w-100).slice(0,5).forEach((ln,i)=>TS(ln,P.x+84,fy+38+i*13,13,'#c8d4ff')); } }
    else { const f=sys.focus==='list'?sysFoot():null;
      if(f){ TS(f[0],P.x+16,fy+22,18,'#f4f6ff',null,true);
        wrapLines(f[1],15,P.w-36).slice(0,3).forEach((ln,i)=>TS(ln,P.x+16,fy+41+i*15,15,'#c8d4ff')); }
      else TS(IS_TOUCH?"Tap a row to see it; tap again to use it.":"Press J to look closer.",P.x+P.w/2,fy+44,15,'#8a94c4','center'); } }
  if(G.msgT>0&&t!=='Equip') TS(G.msg,P.x+P.w/2,P.y+P.h-(footH()?footH()+14:12),15,'#ffe08a','center');
}
/* the words of the window over the page */
function drawModalWords(){
  if(sys.slotPick){ const SP=sys.slotPick, n=SP.idx+1;
    TS(SP.sure?"Save over slot "+n+"?":"Save in which slot?",PICK.x+PICK.w/2,PICK.y+26,20,SP.sure?'#ffe08a':'#f4f6ff','center',true);
    for(let i=0;i<SAVE_SLOTS;i++){ const y=PICK.y+40+i*PICK.row, cur=i+1===(G.slot||1);
      TS("Slot "+(i+1)+(cur?"  (playing)":""),PICK.x+38,y+17,18,cur?'#b8f0a0':'#f4f6ff',null,i===SP.idx);
      TS(slotLine(SLOTS[i]),PICK.x+38,y+33,13,'#aab6e8'); }
    const note=SP.sure?"That game's save will be replaced. J again to save over it.":n===(G.slot||1)?"This game saves here on its own as you play.":"A copy of this moment, to come back to later.";
    TS(note,PICK.x+PICK.w/2,PICK.y+48+SAVE_SLOTS*PICK.row+8,13,SP.sure?'#ff9a8a':'#b8f0a0','center');
    return; }
  if(sys.ask&&sys.ask.home){
    TS("Return home?",PICK.x+PICK.w/2,PICK.y+26,20,'#f4f6ff','center',true);
    ["Yes","No"].forEach((t,i)=>TS(t,PICK.x+48,PICK.y+40+i*PICK.row+25,21,'#f4f6ff',null,i===sys.ask.idx));
    TS("It takes 1 hour of the day.",PICK.x+PICK.w/2,PICK.y+48+2*PICK.row+8,15,'#ffe08a','center');
    return; }
  if(sys.ask){ const k=sys.ask.k, e=isGoodKey(k)?goodEffect(k.slice(2)):EAT[k];
    TS((isGoodKey(k)&&GOODS[k.slice(2)].kind==='food'?"Use the ":"Eat the ")+itemName(k)+"?",PICK.x+PICK.w/2,PICK.y+26,20,'#f4f6ff','center',true);
    ["Yes","No"].forEach((t,i)=>TS(t,PICK.x+48,PICK.y+40+i*PICK.row+25,21,'#f4f6ff',null,i===sys.ask.idx));
    TS(isGoodKey(k)?effText(e):eatText(k),PICK.x+PICK.w/2,PICK.y+48+2*PICK.row+8,15,'#b8f0a0','center'); }
  if(sys.pick){ const p=sys.pick;
    TS(p.skill?p.skill.name+": for whom?":"Who has the "+itemName(p.k)+"?",PICK.x+PICK.w/2,PICK.y+26,20,'#f4f6ff','center',true);
    G.party.forEach((id,i)=>{ const M=member(id), y=PICK.y+40+i*PICK.row;
      TS(PARTY_INFO[id].name,PICK.x+38,y+22,20,'#f4f6ff',null,i===p.idx);
      TS(M.hp+"/"+M.maxhp,PICK.x+PICK.w-14,y+10,13,'#ffb0a8','right'); TS(M.mp+"/"+memberMaxMp(id),PICK.x+PICK.w-14,y+38,13,'#a8d8ff','right'); }); }
}
