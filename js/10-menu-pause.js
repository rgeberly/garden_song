/* ================================================================
   PAUSE MENU: party, status, skills, items, gear, save
   ================================================================ */
function bonusLines(){
  const L=[];
  const g=Math.round(((gearOn('can')?1.25:1)*(G.yard.bath?1.1:1)*fluteMul()-1)*100);
  L.push(["Song growth", (g>=0?"+":"")+g+"%"]);
  const d=Math.round((( gearOn('polish')?1.3:1)*fluteMul()-1)*100);
  L.push(["Song damage", (d>=0?"+":"")+d+"%"]);
  L.push(["Kick power", gearOn('kickers')?"+60%":"—"]);
  L.push(["Walk speed", gearOn('boots')?"+35%":"—"]);
  L.push(["Max MP", maxMp()+(gearOn('cloth')?"  (+8)":"")]);
  L.push(["Harmony cap", (gearOn('trellis')?"x2.6":"x1.8")+(G.yard.fountain?" +0.2":"")]);
  return L;
}
/* ---------- field songs ----------
   Picking one closes the menu and Kaitlyn plays it out in the garden: her flute
   animation from battle, the song's own effect over the garden, and its work done
   partway through (CAST_HIT). Growth Reprise can be played once a day. */
const CAST_MS=2400, CAST_HIT=1300, REPRISE_SHARE=0.2;
const fieldUsable=f=>f.id!=='reprise'||G.daily.reprise!==G.day;
function castField(f){
  if(G.indoors){ say("Play field songs out in the garden."); blip(150,.08,.2); return; }
  if(!fieldUsable(f)){ say("Growth Reprise is spent for today. Try again tomorrow!"); blip(150,.08,.2); return; }
  if(G.player.mp<f.mp){ say("Not enough Music Points."); blip(150,.08,.2); return; }
  G.player.mp-=f.mp;
  if(f.id==='reprise') G.daily.reprise=G.day;
  G.cast={id:f.id,t:0,hit:false}; G.scene='world'; padVec={x:0,y:0};
  if(AC){ flute(9,AC.currentTime,.5,.6); flute(14,AC.currentTime+.24,.5,.6); flute(18,AC.currentTime+.48,.7,.6);
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
  if(!c.hit&&c.t>=CAST_HIT){ c.hit=true; castHit(c.id); }
  if(c.t>=CAST_MS) G.cast=null;
  if(G.msgT>0) G.msgT-=dt;
  return true;
}
/* the song's effect, in garden px (drawn inside the garden's zoom) */
function drawCastFx(cam){
  const c=G.cast, k=c.t/CAST_MS, P=G.player, kx=P.x-cam.x, ky=P.y-cam.y;
  /* notes floating up from the flute */
  for(let i=0;i<5;i++){ const p=(c.t/900+i/5)%1;
    noteGlyph(b,Math.round(kx+14+Math.sin(p*6+i)*10+p*16),Math.round(ky-46-p*44),i%2?'#ffe08a':'#fff6d8',Math.sin(p*Math.PI)); }
  if(c.id==='reprise'){
    /* a green wave rolls out across the garden, and every plant sends up sparks */
    const r=k*560; b.globalAlpha=Math.max(0,1-k)*0.5; b.strokeStyle='#8fe07a'; b.lineWidth=5;
    b.beginPath(); b.ellipse(kx,ky,r,r*0.62,0,0,7); b.stroke(); b.globalAlpha=1;
    plots.forEach(p=>{ if(!active(p)||!p.sp) return;
      for(let i=0;i<6;i++){ const q=(c.t/700+i/6+p.x*0.01)%1, a=i*1.05+c.t/300;
        b.globalAlpha=Math.sin(q*Math.PI)*Math.min(1,k*3);
        px(b,Math.round(p.x-cam.x+Math.cos(a)*(6+q*8)),Math.round(p.y-cam.y-q*36),3,3,i%2?'#8fe07a':'#e8ffb0'); } });
    b.globalAlpha=1;
  } else if(c.id==='ward'){
    /* golden rings ripple outward from her */
    for(let i=0;i<3;i++){ const q=clamp(k*1.6-i*0.25,0,1); if(q<=0||q>=1) continue;
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
  if(AC){ blip(620,0.06,0.1,'sine'); flute(9,AC.currentTime+.06,.25,.4); }
  autoSave();
}

/* ---------- the menu ----------
   Classic blue windows: the open tab's page on the left, the tabs stacked down the
   right with the purse, day and time under them. The cursor starts on the tabs
   (up/down, or tap one); A or right steps into the page, B steps back out (and from
   the tabs closes the menu). Status and Skills show one member at a time: left/right
   (or the arrows by the name) changes who. */
let sys={tab:0,idx:0,focus:'tabs',who:0,top:0};
const SYSTABS=['Party','Status','Skills','Items','Gear','Save'];
const SAVE_ACTIONS=["Copy save code","Paste a save code","Save in this browser"];
const SYSW={page:{x:8,y:8,w:256,h:464}, tab:{x:270,y:8,w:82,h:34,step:40}, info:{x:270,y:256,w:82,h:216}};
/* rows start this far down the page (Status and Skills have a portrait above them) */
const pageRowsY=()=>pagesWho()?92:SYSTABS[sys.tab]==='Party'?44:48;
function openSys(){ if(G.cast) return; G.code=exportCode(); sys={tab:0,idx:0,focus:'tabs',who:0,top:0}; G.scene='sys'; }
const allMembers=()=>['kaitlyn'].concat(Object.keys(G.allies));
const whoId=()=>{ const L=allMembers(); return L[((sys.who%L.length)+L.length)%L.length]; };
function ownedGearList(){ return GEAR.filter(g=>G.gear[g.id]&&g.id!=='silver'&&g.id!=='dizi'); }
/* the rows of the open page: [{label,...}] plus how tall each is */
function sysRows(){
  const t=SYSTABS[sys.tab];
  if(t==='Party'){ const res=Object.keys(G.allies).filter(id=>!G.party.includes(id));
    return {h:68,rows:G.party.map(id=>({id})).concat([{head:"Reserves"}],res.map(id=>({id})))}; }
  if(t==='Status') return {h:28,rows:STATS.map(k=>({stat:k}))};
  if(t==='Skills') return {h:34,rows:skillBook(whoId()).map(s=>({skill:s}))};
  if(t==='Items') return {h:34,rows:cropList().map(sp=>({crop:sp})).concat(goodsList().map(k=>({good:k}))).concat(
    Object.keys(G.seeds).filter(k=>G.seeds[k]>0).map(sp=>({seed:sp})))};
  if(t==='Gear') return {h:34,rows:FLUTE_META.order.map(id=>({flute:id})).concat(ownedGearList().map(g=>({gear:g})))};
  return {h:44,rows:SAVE_ACTIONS.map((a,i)=>({save:i}))};
}
const footH=()=>['Status','Skills','Items','Gear'].includes(SYSTABS[sys.tab])?78:0;
const rowsFit=()=>{ const R=sysRows(); return Math.max(1,Math.floor((SYSW.page.h-pageRowsY()-footH()-8)/R.h)); };
function sysSee(i){ const n=rowsFit(); if(i<sys.top) sys.top=i; if(i>=sys.top+n) sys.top=i-n+1; }
function sysSetTab(t){ sys.tab=(t+SYSTABS.length)%SYSTABS.length; sys.idx=0; sys.top=0; }
function sysActivate(i){
  const R=sysRows().rows[i], t=SYSTABS[sys.tab]; if(!R) return;
  if(t==='Party'){
    if(R.id==='kaitlyn'){ say("Kaitlyn always leads the way."); return; }
    if(isHurt(R.id)){ say(PARTY_INFO[R.id].name+" is still recovering at home."); blip(150,.08,.2); return; }
    const was=G.party.includes(R.id);
    if(toggleParty(R.id)){ say(PARTY_INFO[R.id].name+(was?" will wait at home.":" joins you!")); blip(was?400:620,.06,.1,'triangle'); autoSave(); }
    else { say("The party is full (3 at most)."); blip(150,.08,.2); }
  } else if(t==='Skills'){
    const s=R.skill, id=whoId();
    if(member(id).lv<s.lv){ blip(150,.08,.2); return; }
    if(s.field) castField(s);
    else say(s.name+" is used in battle.");
  } else if(t==='Items'){
    const k=R.crop||(R.good?'g:'+R.good:null); if(!k) return;
    if(R.good&&!goodEffect(R.good)){ eatGood(R.good); return; }
    /* something that helps one person: choose who (if there's a choice) */
    if(oneTarget(k)&&G.party.length>1){ sys.pick={k,idx:0}; return; }
    feed(k,'kaitlyn');
  }
  else if(t==='Gear'){
    if(R.flute){ const id=R.flute;
      if(fluteOwned(id)){ G.flute=id; say(FLUTE_INFO[id].name+" equipped."); if(AC) flute(11,AC.currentTime,.3,.5); }
      else { say("Not owned — buy it at the stall."); blip(150,.08,.2); } }
    else if(R.gear){ const id=R.gear.id; G.gearOff[id]=!G.gearOff[id];
      say(R.gear.name+(G.gearOff[id]?" switched off.":" switched on.")); blip(G.gearOff[id]?400:620,.05,.1,'triangle'); autoSave(); }
  } else if(t==='Save'){
    if(i===0){ try{navigator.clipboard.writeText(G.code);}catch(e){}
      say("Save code copied to clipboard."); G.scene='world'; }
    else if(i===1){ const s=prompt("Paste your save code:");
      if(s){ if(importCode(s)){ say("Game loaded!"); G.scene='world'; setMusic(areaMusic()); }
             else say("That code didn't work."); } }
    else { autoSave(); say("Saved in this browser."); G.scene='world'; }
  }
}
const pagesWho=()=>SYSTABS[sys.tab]==='Status'||SYSTABS[sys.tab]==='Skills';
/* does this crop or good ('g:'+key) help just one person (and so need a choice of who)? */
function oneTarget(k){
  const e=isGoodKey(k)?goodEffect(k.slice(2)):EAT[k];
  return !!e&&!!(e.hp||e.mp);
}
function feed(k,id){ sys.pick=null; if(isGoodKey(k)) eatGood(k.slice(2),id); else eatCrop(k,id); }
/* move the highlight, stepping over section headings */
function sysStep(d){ const L=sysRows().rows, n=L.length; if(!n) return;
  for(let g=0;g<n;g++){ sys.idx=(sys.idx+d+n)%n; if(!L[sys.idx].head) break; }
  sysSee(sys.idx); }
function sysKey(k){
  const n=sysRows().rows.length;
  if(sys.pick){ const P=G.party, m=P.length;
    if(isUp(k)) sys.pick.idx=(sys.pick.idx+m-1)%m;
    else if(isDown(k)) sys.pick.idx=(sys.pick.idx+1)%m;
    else if(isOk(k)) feed(sys.pick.k,P[sys.pick.idx]);
    else if(isBack(k)) sys.pick=null;
    return; }
  if(sys.focus==='tabs'){
    if(isUp(k)) sysSetTab(sys.tab-1);
    else if(isDown(k)) sysSetTab(sys.tab+1);
    else if((isOk(k)||isRight(k))&&n){ sys.focus='list'; if(sysRows().rows[sys.idx].head) sysStep(1); sysSee(sys.idx); }
    else if(isLeft(k)&&pagesWho()){ sys.who--; sys.idx=0; sys.top=0; }
    else if(isBack(k)||k==='m') G.scene='world';
    return;
  }
  if(isUp(k)&&n) sysStep(-1);
  else if(isDown(k)&&n) sysStep(1);
  else if((isLeft(k)||isRight(k))&&pagesWho()){ sys.who+=isLeft(k)?-1:1; sys.idx=0; sys.top=0; }
  else if(isOk(k)) sysActivate(sys.idx);
  else if(isBack(k)) sys.focus='tabs';
  else if(k==='m') G.scene='world';
}
const PICK={x:40,y:150,w:280,row:40};
function sysTouch(x,y){
  const T=SYSW.tab, P=SYSW.page;
  if(sys.pick){ const j=Math.floor((y-PICK.y-40)/PICK.row);
    if(x>PICK.x&&x<PICK.x+PICK.w&&j>=0&&j<G.party.length){ if(sys.pick.idx===j) feed(sys.pick.k,G.party[j]); else sys.pick.idx=j; }
    else sys.pick=null;
    return; }
  if(x>=T.x&&x<=T.x+T.w&&y>=T.y&&y<T.y+SYSTABS.length*T.step){ sysSetTab(Math.floor((y-T.y)/T.step)); sys.focus='tabs'; return; }
  if(x<P.x||x>P.x+P.w||y<P.y||y>P.y+P.h) return;
  if(pagesWho()&&y<P.y+pageRowsY()-6){ sys.who+=x<P.x+P.w/2?-1:1; sys.idx=0; sys.top=0; return; }
  /* the first tap picks a row, a second tap on it uses it */
  const R=sysRows(), j=Math.floor((y-P.y-pageRowsY())/R.h), i=sys.top+j;
  if(j>=0&&j<rowsFit()&&i<R.rows.length&&!R.rows[i].head){
    if(sys.focus==='list'&&sys.idx===i&&SYSTABS[sys.tab]!=='Status') sysActivate(i);
    else { sys.focus='list'; sys.idx=i; } }
}
/* what the highlighted row means, for the footer */
function sysFoot(){
  const R=sysRows().rows[sys.idx], t=SYSTABS[sys.tab]; if(!R) return null;
  if(t==='Status') return [STAT_NAME[R.stat],{hp:"Health. At 0 you're out of the fight.",mp:"Music Points, spent on songs and skills.",
    str:"Power of plain attacks.",agi:"Who moves first in battle.",def:"Softens the hits you take.",
    int:"Power of songs, spells and special moves.",luk:"Better odds of seeds and bonus coins."}[R.stat]];
  if(t==='Skills'){ const s=R.skill, known=member(whoId()).lv>=s.lv;
    return known?[s.name+(s.mp?"  ·  "+s.mp+" MP":""),s.desc+(s.field?(fieldUsable(s)?"  (A to play)":"  (spent today)"):"")]
                :["????","Learned at level "+s.lv+"."]; }
  if(t==='Items'&&R.good){ const g=GOODS[R.good];
    const e=goodEffect(R.good);
    return [g.name+"  x"+G.goods[R.good],(g.flavor?g.flavor+" ":"")+(e?(g.kind==='food'?"Use (A): ":"Eat (A): ")+effText(e):"")+(g.kind==='food'?"":(e?" · ":"")+"sells "+goodsPrice(R.good)+"c at the stall or market")]; }
  if(t==='Items') return R.crop?[SPECIES[R.crop].name+"  x"+G.crops[R.crop],(SPECIES[R.crop].flavor?SPECIES[R.crop].flavor+" ":"")+"Eat: "+eatText(R.crop)+" · sells "+sellPrice(R.crop)+"c"]
                               :[SPECIES[R.seed].name+" seed  x"+G.seeds[R.seed],"Plant it in an empty garden spot."];
  if(t==='Gear') return R.flute?[FLUTE_INFO[R.flute].name,"Songs x"+FLUTE_INFO[R.flute].mul.toFixed(2)+(fluteOwned(R.flute)?(G.flute===R.flute?" · equipped":" · A to equip"):" · not owned yet")]
                               :[R.gear.name+(gearOn(R.gear.id)?"  ·  on":"  ·  off"),cap(R.gear.desc)+". A to switch "+(gearOn(R.gear.id)?"off.":"on.")];
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
  const rowY=i=>P.y+pageRowsY()+(i-sys.top)*R.h, vis=R.rows.slice(sys.top,sys.top+fit);
  /* Status and Skills: whose page it is, with their portrait */
  if(pagesWho()){ b.fillStyle='#0a0f2a'; b.fillRect(P.x+12,P.y+10,64,76);
    const im=portraitImg(whoId()); if(im){ const ph=74, pw=ph*im.naturalWidth/im.naturalHeight;
      b.save(); b.beginPath(); b.rect(P.x+13,P.y+11,62,74); b.clip(); b.imageSmoothingEnabled=true; b.drawImage(im,P.x+44-pw/2,P.y+11,pw,ph); b.restore(); } }
  if(sys.focus==='list'&&R.rows.length) winCursor(P.x+6,rowY(sys.idx),P.w-12,R.h-2);
  /* pictures and bars for the visible rows */
  vis.forEach((r,j)=>{ const i=sys.top+j, y=rowY(i);
    if(t==='Party'&&r.head){ b.fillStyle='rgba(255,224,138,.25)'; b.fillRect(P.x+12,y+R.h/2+4,P.w-24,1); }
    else if(t==='Party'){ const M=member(r.id); b.fillStyle='#0a0f2a'; b.fillRect(P.x+30,y+6,46,R.h-14);
      const im=portraitImg(r.id); if(im){ const ph=R.h-16, pw=ph*im.naturalWidth/im.naturalHeight;
        b.save(); b.beginPath(); b.rect(P.x+31,y+7,44,R.h-16); b.clip(); b.imageSmoothingEnabled=true; b.drawImage(im,P.x+53-pw/2,y+7,pw,ph); b.restore(); }
      gauge(P.x+86,y+32,150,5,M.hp,M.maxhp,'#e8504a','#ffa8a0'); gauge(P.x+86,y+46,150,5,M.mp,memberMaxMp(r.id),'#4aa8f0','#b0e0ff'); }
    if(t==='Status'){ const v=statOf(whoId(),r.stat), mx={hp:300,mp:120}[r.stat]||80; gauge(P.x+150,y+12,90,5,v,mx,'#f0c84a','#fff0b0'); }
    if(t==='Items'&&r.crop) drawCropIcon(b,r.crop,P.x+46,y+R.h/2-1,24);
    if(t==='Items'&&r.good) drawGoodIcon(b,r.good,P.x+46,y+R.h/2-1,22);
    if(t==='Items'&&r.seed) drawShopPic(SPECIES[r.seed].name.toLowerCase()+" seed",P.x+46,y+R.h/2-1,18,26);
    if(t==='Gear'&&r.gear) drawShopPic(r.gear.name.toLowerCase(),P.x+46,y+R.h/2-1,26,26);
    if(t==='Gear'&&r.flute) drawShopPic(FLUTE_INFO[r.flute].name.toLowerCase(),P.x+46,y+R.h/2-1,26,26);
  });
  if(t==='Status'){ const id=whoId(), M=member(id);
    gauge(P.x+20,P.y+pageRowsY()+STATS.length*R.h+12,P.w-40,6,M.xp,M.next,'#f0c84a','#fff0b0'); }
  if(sys.pick){ const h=48+G.party.length*PICK.row; rpgWin({x:PICK.x,y:PICK.y,w:PICK.w,h});
    winCursor(PICK.x+6,PICK.y+40+sys.pick.idx*PICK.row,PICK.w-12,PICK.row-2);
    G.party.forEach((id,i)=>{ const M=member(id), y=PICK.y+40+i*PICK.row;
      gauge(PICK.x+150,y+12,110,5,M.hp,M.maxhp,'#e8504a','#ffa8a0'); gauge(PICK.x+150,y+26,110,5,M.mp,memberMaxMp(id),'#4aa8f0','#b0e0ff'); }); }
  if(footH()) rpgWin({x:P.x+6,y:P.y+P.h-footH()-4,w:P.w-12,h:footH()});
  blit();
  /* words */
  SYSTABS.forEach((n,i)=>TS(n,T.x+T.w/2,T.y+i*T.step+22,20,i===sys.tab?'#ffe08a':'#e4e8ff','center',i===sys.tab));
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
  else TS(t,P.x+14,P.y+26,24,'#f4f6ff',null,true);
  vis.forEach((r,j)=>{ const i=sys.top+j, y=rowY(i), sel=sys.focus==='list'&&i===sys.idx;
    if(t==='Party'&&r.head){ TS(r.head,P.x+14,y+R.h/2,22,'#ffe08a',null,true);
      if(i===R.rows.length-1) TS("no one waiting at home",P.x+P.w-12,y+R.h/2,15,'#8a94c4','right');
      else TS("tap twice to bring along",P.x+P.w-12,y+R.h/2,14,'#8a94c4','right'); }
    else if(t==='Party'){ const M=member(r.id), I2=PARTY_INFO[r.id];
      TS(I2.name,P.x+86,y+20,21,'#f4f6ff',null,true); TS("Lv."+M.lv,P.x+P.w-12,y+20,17,'#ffe08a','right',true);
      TS(M.hp+"/"+M.maxhp,P.x+P.w-12,y+30,13,'#ffb0a8','right');
      const where=r.id==='kaitlyn'?"Leader":isHurt(r.id)?"Hurt · back in "+(G.allies[r.id].hurtUntil-G.day)+" day(s)"
        :G.party.includes(r.id)?"In the party":"Waiting at home";
      TS(where,P.x+86,y+62,15,G.party.includes(r.id)?'#b8f0a0':isHurt(r.id)?'#ffb0a8':'#aab6e8'); }
    else if(t==='Status'){ const id=whoId(), v=statOf(id,r.stat)+(r.stat==='mp'&&id==='kaitlyn'&&gearOn('cloth')?8:0);
      TS(STAT_NAME[r.stat],P.x+38,y+17,19,'#e4e8ff',null,sel);
      TS(r.stat==='hp'?member(id).hp+"/"+v:r.stat==='mp'?member(id).mp+"/"+v:String(v),P.x+142,y+17,19,'#ffffff','right',true); }
    else if(t==='Skills'){ const s=r.skill, known=member(whoId()).lv>=s.lv;
      TS(known?s.name:"????",P.x+38,y+15,19,known?(s.field?'#b8f0a0':'#f4f6ff'):'#7c84b0',null,sel);
      TS(known?(s.field?"field song":"battle"):"Lv."+s.lv,P.x+38,y+29,13,'#8a94c4');
      if(known&&s.mp) TS(s.mp+" MP",P.x+P.w-12,y+20,16,'#a8d8ff','right'); }
    else if(t==='Items'){
      if(r.good){ TS(GOODS[r.good].name,P.x+66,y+21,18,'#f4f6ff',null,sel); TS("x"+G.goods[r.good],P.x+P.w-12,y+21,18,'#ffe08a','right',true); }
      else if(r.crop){ TS(SPECIES[r.crop].name,P.x+66,y+21,19,'#f4f6ff',null,sel); TS("x"+G.crops[r.crop],P.x+P.w-12,y+21,18,'#ffe08a','right',true); }
      else { TS(SPECIES[r.seed].name+" seed",P.x+66,y+21,17,'#c8d4ff'); TS("x"+G.seeds[r.seed],P.x+P.w-12,y+21,17,'#c8d4ff','right'); } }
    else if(t==='Gear'){
      if(r.flute){ const own=fluteOwned(r.flute), eq=G.flute===r.flute;
        TS(FLUTE_INFO[r.flute].name,P.x+66,y+21,19,own?'#f4f6ff':'#7c84b0',null,sel||eq);
        TS(eq?"equipped":own?"":"locked",P.x+P.w-12,y+21,15,eq?'#b8f0a0':'#7c84b0','right'); }
      else { const on=gearOn(r.gear.id); TS(r.gear.name,P.x+66,y+21,19,on?'#f4f6ff':'#7c84b0',null,sel);
        TS(on?"on":"off",P.x+P.w-12,y+21,15,on?'#b8f0a0':'#ff9a8a','right',true); } }
    else TS(SAVE_ACTIONS[r.save],P.x+P.w/2+10,y+28,21,'#f4f6ff','center',sel);
  });
  if(t==='Items'&&!R.rows.length) TS("Nothing yet — harvest some crops!",P.x+P.w/2,P.y+90,17,'#aab6e8','center');
  if(t==='Gear'&&!ownedGearList().length) TS("Accessories you buy show up here.",P.x+P.w/2,rowY(3)+22,16,'#aab6e8','center');
  if(t==='Save') TS("Lv."+G.player.lv+" · "+G.coins+"c · "+SEASON_NAME[season()]+" Day "+G.day,P.x+P.w/2,P.y+210,17,'#c8d4ff','center');
  if(t==='Status'){ const id=whoId(), M=member(id), y=P.y+pageRowsY()+STATS.length*R.h+8;
    TS("EXP "+M.xp+" / "+M.next+" to Lv."+(M.lv+1),P.x+20,y,17,'#ffe08a',null,true); }
  if(sys.pick){ TS("Who has the "+itemName(sys.pick.k)+"?",PICK.x+PICK.w/2,PICK.y+26,20,'#f4f6ff','center',true);
    G.party.forEach((id,i)=>{ const M=member(id), y=PICK.y+40+i*PICK.row;
      TS(PARTY_INFO[id].name,PICK.x+38,y+22,20,'#f4f6ff',null,i===sys.pick.idx);
      TS(M.hp+"/"+M.maxhp,PICK.x+PICK.w-14,y+10,13,'#ffb0a8','right'); TS(M.mp+"/"+memberMaxMp(id),PICK.x+PICK.w-14,y+38,13,'#a8d8ff','right'); }); }
  if(sys.top>0) TS("▲",P.x+P.w-20,P.y+pageRowsY()-4,14,'#c8d4ff','center');
  if(sys.top+fit<R.rows.length) TS("▼",P.x+P.w-20,P.y+P.h-footH()-10,14,'#c8d4ff','center');
  const f=footH()&&(sys.focus==='list'?sysFoot():null);
  if(footH()){ const fy=P.y+P.h-footH()-4;
    if(f){ TS(f[0],P.x+16,fy+22,18,'#f4f6ff',null,true);
      wrapLines(f[1],15,P.w-36).slice(0,3).forEach((ln,i)=>TS(ln,P.x+16,fy+41+i*15,15,'#c8d4ff')); }
    else TS(IS_TOUCH?"Tap a row to see it; tap again to use it.":"Press J to look closer.",P.x+P.w/2,fy+44,15,'#8a94c4','center'); }
  if(G.msgT>0) TS(G.msg,P.x+P.w/2,P.y+P.h-(footH()?footH()+14:12),15,'#ffe08a','center');
}
