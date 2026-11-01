/* ================================================================
   PAUSE PANEL: field songs + save
   ================================================================ */
let sys={tab:0,idx:0};
const SYSTABS=['Gear','Items','Songs','Save'];
function openSys(){ G.code=exportCode(); sysSetTab(0); G.scene='sys'; }
function ownedGear(){ return GEAR.filter(g=>G.gear[g.id]&&g.id!=='silver'&&g.id!=='dizi'); }
function bonusLines(){
  const L=[];
  const g=Math.round(((G.gear.can?1.25:1)*(G.yard.bath?1.1:1)*fluteMul()-1)*100);
  L.push(["Song growth", (g>=0?"+":"")+g+"%"]);
  const d=Math.round((( G.gear.polish?1.3:1)*fluteMul()-1)*100);
  L.push(["Song damage", (d>=0?"+":"")+d+"%"]);
  L.push(["Kick power", G.gear.kickers?"+60%":"—"]);
  L.push(["Walk speed", G.gear.boots?"+35%":"—"]);
  L.push(["Max MP", maxMp()+(G.gear.cloth?"  (+8)":"")]);
  L.push(["Harmony cap", (G.gear.trellis?"x2.6":"x1.8")+(G.yard.fountain?" +0.2":"")]);
  return L;
}
function castField(f){
  if(G.player.mp<f.mp){ say("Not enough Music Points."); blip(150,.08,.2); return; }
  G.player.mp-=f.mp;
  if(f.id==='reprise'){
    let n=0;
    plots.forEach(p=>{ if(active(p)&&p.sp&&p.stage<3){ setGrowth(p,p.growth+150); n++; } });
    say("Growth Reprise: +150 growth to "+n+" plants.");
  } else if(f.id==='ward'){
    const n=G.pests.length; G.pests=[]; say("Pest Ward: "+n+" pest"+(n===1?"":"s")+" fled the garden.");
  } else {
    let n=0; plots.forEach(p=>{ if(active(p)&&p.sp){ p.health=100; n++; } });
    say("Sun Shower: "+n+" plants restored to full health.");
  }
  if(AC){ flute(9,AC.currentTime,.5,.6); flute(14,AC.currentTime+.14,.5,.6); flute(18,AC.currentTime+.28,.7,.6); }
  G.scene='world'; autoSave();
}
/* ---------- layout: tabs across the top, one list per tab, key hints + Back below ---------- */
const SYS_TAB_Y=36, SYS_TAB_W=74, SYS_BACK={x:272,y:436,w:62,h:24};
const SYS_ROWS={0:{y:130,step:29,h:26}, 1:{y:100,step:31,h:29}, 2:{y:80,step:46,h:42}, 3:{y:160,step:44,h:38}};
const SAVE_ACTIONS=["Copy save code","Paste a save code","Save in this browser"];
function sysCount(){
  if(sys.tab===0) return FLUTE_META.order.length;
  if(sys.tab===2) return fieldList().length;
  if(sys.tab===3) return SAVE_ACTIONS.length;
  return cropList().length;                  /* Items: harvested crops can be eaten */
}
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
function eatCrop(sp){
  if(!(G.crops[sp]>0)) return;
  say("Ate a "+SPECIES[sp].name+": "+applyFood(sp)+".");
  if(AC){ blip(620,0.06,0.1,'sine'); flute(9,AC.currentTime+.06,.25,.4); }
  sys.idx=Math.min(sys.idx,Math.max(0,cropList().length-1)); autoSave();
}
function sysSetTab(t){
  sys.tab=(t+4)%4;
  sys.idx=sys.tab===0?Math.max(0,FLUTE_META.order.indexOf(G.flute||'recorder')):0;
}
function sysActivate(i){
  if(sys.tab===0){
    const id=FLUTE_META.order[i];
    if(fluteOwned(id)){ G.flute=id; say(FLUTE_INFO[id].name+" equipped."); if(AC) flute(11,AC.currentTime,.3,.5); }
    else { say("Not owned — buy it at the stall."); blip(150,.08,.2); }
  } else if(sys.tab===1){ const sp=cropList()[i]; if(sp) eatCrop(sp); }
  else if(sys.tab===2){ const f=fieldList()[i]; if(f) castField(f); }
  else if(sys.tab===3){
    if(i===0){ try{navigator.clipboard.writeText(G.code);}catch(e){}
      say("Save code copied to clipboard."); G.scene='world'; }
    else if(i===1){ const t=prompt("Paste your save code:");
      if(t){ if(importCode(t)){ say("Game loaded!"); G.scene='world'; setMusic('calm'); }
             else say("That code didn't work."); } }
    else { autoSave(); say("Saved in this browser."); G.scene='world'; }
  }
}
function sysKey(k){
  const n=sysCount();
  if(isLeft(k)||k==='q') sysSetTab(sys.tab-1);
  else if(isRight(k)||k==='e') sysSetTab(sys.tab+1);
  else if(isUp(k)&&n) sys.idx=(sys.idx+n-1)%n;
  else if(isDown(k)&&n) sys.idx=(sys.idx+1)%n;
  else if(isOk(k)&&n) sysActivate(sys.idx);
  else if(isBack(k)||k==='m') G.scene='world';
}
function sysTouch(x,y){
  if(y>SYS_TAB_Y&&y<SYS_TAB_Y+30){ sysSetTab(clamp(Math.floor((x-26)/(SYS_TAB_W+4)),0,3)); return; }
  if(y>430){ G.scene='world'; return; }
  const R=SYS_ROWS[sys.tab]; if(!R) return;
  for(let i=0;i<sysCount();i++)
    if(y>R.y+i*R.step&&y<R.y+i*R.step+R.h&&x>26&&x<334){ sys.idx=i; sysActivate(i); return; }
}
/* Items tab rows: harvested crops (eat with J), then seeds, as far as the panel goes */
function itemsLayout(){
  const R=SYS_ROWS[1], crops=cropList().map((sp,i)=>({sp,y:R.y+i*R.step}));
  const seedsY=(crops.length?R.y+crops.length*R.step:R.y+22)+20;
  const seeds=Object.keys(G.seeds).filter(k=>G.seeds[k]>0).map((sp,i)=>({sp,y:seedsY+i*24}))
    .filter(s=>s.y<=396);
  return {crops,seedsY,seeds};
}
function drawSys(){
  dim(); panel(14,26,332,442);
  for(let i=0;i<4;i++) tabPill(26+i*(SYS_TAB_W+4),SYS_TAB_Y,SYS_TAB_W,28,sys.tab===i);
  px(b,26,68,308,2,'#c3b48c');
  const list=fieldList(), R=SYS_ROWS[sys.tab];
  const seeds=Object.keys(G.seeds).filter(k=>G.seeds[k]>0);
  if(sys.tab===0){
    FLUTE_META.order.forEach((id,i)=>menuRow(26,R.y+i*R.step,308,R.h,sys.idx===i,!fluteOwned(id)));
    px(b,26,226,308,2,'#c3b48c');
    /* full-resolution art of the equipped flute */
    if(assetsReady>=7){
      const fi=Math.max(0,FLUTE_META.order.indexOf(G.flute||'recorder'));
      b.save(); b.scale(1/SC,1/SC);
      b.drawImage(IMG_FLBIG,fi*FLBIG_META.cw,0,FLBIG_META.cw,FLBIG_META.ch,
        Math.round(180*SC-FLBIG_META.cw/2),Math.round(99*SC-FLBIG_META.ch/2),
        FLBIG_META.cw,FLBIG_META.ch);
      b.restore();
    }
  } else if(sys.tab===1){
    const L=itemsLayout();
    L.crops.forEach(({sp,y},i)=>{ menuRow(26,y,308,R.h,sys.idx===i); drawCropIcon(b,sp,26+ROW_PAD+11,y+R.h/2,24); });
    L.seeds.forEach(({sp,y},i)=>{ px(b,26,y,308,22,i%2?'#e8dcc0':'#efe6cd');
      if(!drawShopPic(SPECIES[sp].name.toLowerCase()+" seed",40,y+11,14,19)){
        px(b,35,y+6,11,11,SPECIES[sp].fruit); px(b,35,y+6,6,6,SPECIES[sp].dk); } });
  } else if(sys.tab===2){
    list.forEach((f,i)=>menuRow(26,R.y+i*R.step,308,R.h,sys.idx===i,G.player.mp<f.mp));
  } else {
    portrait(b,155,76,0.5);
    SAVE_ACTIONS.forEach((_,i)=>menuRow(26,R.y+i*R.step,308,R.h,sys.idx===i));
  }
  px(b,SYS_BACK.x,SYS_BACK.y,SYS_BACK.w,SYS_BACK.h,'#2b1c12');
  px(b,SYS_BACK.x+2,SYS_BACK.y+2,SYS_BACK.w-4,SYS_BACK.h-4,'#c9a08a');
  blit();
  SYSTABS.forEach((t,i)=>T(t,26+i*(SYS_TAB_W+4)+SYS_TAB_W/2,SYS_TAB_Y+20,23,'#3a2a1a','center',sys.tab===i));

  if(sys.tab===0){
    FLUTE_META.order.forEach((id,i)=>{ const y=R.y+i*R.step, fi=FLUTE_INFO[id], own=fluteOwned(id), eq=G.flute===id;
      T(fi.name,26+ROW_PAD+4,y+18,23,own?'#3a2a1a':'#8c8474',null,eq);
      T("x"+fi.mul.toFixed(2),236,y+18,20,own?'#a06a1a':'#9c9484','right');
      T(eq?"equipped":own?"equip":"locked",326,y+18,18,eq?'#5a7a3a':own?'#6a5a3a':'#9c9484','right',eq); });
    T("Bonuses",180,244,21,'#3a2a1a','center',true);
    bonusLines().forEach(([k,v],i)=>{ const y=260+i*15;
      T(k,40,y,19,'#6a5a3a'); T(v,320,y,19,'#3a2a1a','right',true); });
    const acc=ownedGear();
    T("Accessories",180,362,19,'#3a2a1a','center',true);
    if(!acc.length) T("none yet",180,377,17,'#7a6a4a','center');
    else {
      /* wrap onto at most two lines so a full inventory can't overflow */
      const names=acc.map(g=>g.name), lines=[]; let cur='';
      for(const n of names){
        const test=cur?cur+", "+n:n;
        if(TW(test,16)>290){ lines.push(cur); cur=n; } else cur=test;
        if(lines.length>=2) break;
      }
      if(lines.length<2&&cur) lines.push(cur);
      if(lines.length===2&&cur&&lines[1]!==cur) lines[1]=lines[1]+", …";
      lines.slice(0,2).forEach((ln,i)=>T(ln,180,377+i*14,16,'#7a6a4a','center'));
    }
  } else if(sys.tab===1){
    const L=itemsLayout();
    T("Harvest",30,90,22,'#3a2a1a',null,true);
    T(G.coins+"c",330,90,22,'#a06a1a','right',true);
    if(!L.crops.length) T("Nothing harvested yet.",180,112,19,'#7a6a4a','center');
    L.crops.forEach(({sp,y},i)=>{ const x=26+ROW_PAD+26;
      T(SPECIES[sp].name+"  x"+G.crops[sp],x,y+13,21,'#3a2a1a',null,true);
      T("Eat: "+eatText(sp),x,y+25,16,'#5a7a3a');
      T("sells "+sellPrice(sp)+"c",326,y+13,16,'#a06a1a','right'); });
    T("Seeds",30,L.seedsY-6,22,'#3a2a1a',null,true);
    if(!L.seeds.length) T("No seeds — buy some at the stall.",180,L.seedsY+14,19,'#7a6a4a','center');
    L.seeds.forEach(({sp,y})=>{
      T(SPECIES[sp].name+" seed",54,y+15,20,'#3a2a1a');
      T("x"+G.seeds[sp],326,y+15,20,'#3a2a1a','right',true); });
    if(G.msgT>0&&G.msg.startsWith("Ate")) T(G.msg,180,426,17,'#5a7a3a','center',true);
  } else if(sys.tab===2){
    if(!list.length) T("No field songs yet — reach Lv.4",180,140,24,'#7a6a4a','center');
    list.forEach((f,i)=>{ const y=R.y+i*R.step, ok=G.player.mp>=f.mp;
      T(f.name,26+ROW_PAD+4,y+19,25,ok?'#3a2a1a':'#8a7a68',null,true);
      T(f.desc,26+ROW_PAD+4,y+35,18,'#7a6a4a');
      T(f.mp+" MP",326,y+19,22,ok?'#2a6a9a':'#a09080','right'); });
    T("MP "+G.player.mp+"/"+maxMp(),180,410,22,'#2a6a9a','center',true);
  } else {
    T("Lv."+G.player.lv+"  ·  "+G.coins+"c  ·  "+SEASON_NAME[season()]+" Day "+G.day,180,150,22,'#3a2a1a','center',true);
    SAVE_ACTIONS.forEach((a,i)=>T(a,180+ROW_PAD/2,R.y+i*R.step+25,25,'#3a2a1a','center',sys.idx===i));
    T("Garden "+G.gardenLv+"  ·  "+G.harvests+" harvests",180,312,19,'#7a6a4a','center');
  }
  T("Back",SYS_BACK.x+SYS_BACK.w/2,SYS_BACK.y+17,22,'#3a2a1a','center',true);
  keyHint((sysCount()?"W/S choose  ·  J select  ·  ":"")+"A/D tabs  ·  H back",146,452);
}
