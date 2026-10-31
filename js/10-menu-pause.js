/* ================================================================
   PAUSE PANEL: field songs + save
   ================================================================ */
let sys={tab:0};
const SYSTABS=['Gear','Items','Songs','Save'];
function openSys(){ G.code=exportCode(); sys={tab:0}; G.scene='sys'; }
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
    plots.forEach(p=>{ if(active(p)&&p.sp&&p.stage<3){ p.growth=Math.min(MAX_GROWTH,p.growth+50);
      p.stage=clamp(Math.floor(p.growth/STAGE_COST),0,3); n++; } });
    say("Growth Reprise: +50 growth to "+n+" plants.");
  } else if(f.id==='ward'){
    const n=G.pests.length; G.pests=[]; say("Pest Ward: "+n+" pest"+(n===1?"":"s")+" fled the garden.");
  } else {
    let n=0; plots.forEach(p=>{ if(active(p)&&p.sp){ p.health=100; n++; } });
    say("Sun Shower: "+n+" plants restored to full health.");
  }
  if(AC){ flute(9,AC.currentTime,.5,.6); flute(14,AC.currentTime+.14,.5,.6); flute(18,AC.currentTime+.28,.7,.6); }
  G.scene='world'; autoSave();
}
function sysTouch(x,y){
  if(y>84&&y<114){ sys.tab=clamp(Math.floor((x-36)/72),0,3); return; }
  if(y>408){ G.scene='world'; return; }
  if(sys.tab===0){
    const ids=FLUTE_META.order;
    for(let i=0;i<3;i++){
      if(y>228&&y<258&&x>36+i*96&&x<36+i*96+90){
        if(fluteOwned(ids[i])){ G.flute=ids[i]; say(FLUTE_INFO[ids[i]].name+" equipped."); }
        else say("Not owned — buy it at the stall.");
        return;
      }
    }
    return;
  }
  if(sys.tab===2){
    const list=fieldList();
    for(let i=0;i<list.length;i++)
      if(y>135+i*45&&y<135+i*45+42&&x>36&&x<324){ castField(list[i]); return; }
    return;
  }
  if(sys.tab===3){
    if(y>186&&y<225){ try{navigator.clipboard.writeText(G.code);}catch(e){}
      say("Save code copied to clipboard."); G.scene='world'; return; }
    if(y>234&&y<273){ const t=prompt("Paste your save code:");
      if(t){ if(importCode(t)){ say("Game loaded!"); G.scene='world'; setMusic('calm'); }
             else say("That code didn't work."); } return; }
    if(y>282&&y<321){ autoSave(); say("Saved in this browser."); G.scene='world'; return; }
  }
}
function drawSys(){
  dim(); panel(24,48,312,384);
  for(let i=0;i<4;i++) px(b,36+i*72,84,71,30,sys.tab===i?'#d9c9a0':'#c9b894');
  const list=fieldList();
  const seeds=Object.keys(G.seeds).filter(k=>G.seeds[k]>0);
  if(sys.tab===0){
    px(b,36,120,288,86,'#e8dcc0'); px(b,36,120,288,2,'#c3b48c');
    const ids=FLUTE_META.order;
    for(let i=0;i<3;i++){
      const own=fluteOwned(ids[i]), sel=G.flute===ids[i];
      px(b,36+i*96,228,90,30,sel?'#c9a84a':(own?'#e8dcc0':'#c4bba8'));
      px(b,36+i*96,228,90,2,'#c3b48c');
    }
    px(b,36,266,288,160,'#efe6cd');
  } else if(sys.tab===1){
    px(b,36,126,288,260,'#efe6cd');
    seeds.forEach((k,i)=>{ const y=160+i*30; if(y>370) return;
      px(b,42,y,276,27,i%2?'#e8dcc0':'#f3ead2');
      px(b,50,y+8,12,12,SPECIES[k].fruit); px(b,50,y+8,6,6,SPECIES[k].dk); });
  } else if(sys.tab===2){
    list.forEach((f,i)=>{ const y=135+i*45; px(b,36,y,288,42,G.player.mp>=f.mp?'#e8dcc0':'#cfc4ae'); });
  } else {
    portrait(b,132,120,0.36);
    px(b,36,186,288,39,'#d9c9a0'); px(b,36,234,288,39,'#d9c9a0'); px(b,36,282,288,39,'#d9c9a0');
  }
  px(b,120,408,120,24,'#c9a08a');
  if(sys.tab===0){
    /* full-resolution flute art */
    if(assetsReady>=7){
      const fi=Math.max(0,FLUTE_META.order.indexOf(G.flute||'recorder'));
      b.save(); b.scale(1/SC,1/SC);
      b.drawImage(IMG_FLBIG,fi*FLBIG_META.cw,0,FLBIG_META.cw,FLBIG_META.ch,
        Math.round(180*SC-FLBIG_META.cw/2),Math.round(163*SC-FLBIG_META.ch/2),
        FLBIG_META.cw,FLBIG_META.ch);
      b.restore();
    }
  }
  m.drawImage(buf,0,0);
  SYSTABS.forEach((t,i)=>T(t,71+i*72,105,23,'#3a2a1a','center',sys.tab===i));

  if(sys.tab===0){
    const fi=FLUTE_INFO[G.flute||'recorder'];
    T(fi.name+"   x"+fi.mul.toFixed(2),180,220,24,'#3a2a1a','center',true);
    const ids=FLUTE_META.order;
    for(let i=0;i<3;i++){
      const own=fluteOwned(ids[i]);
      T(FLUTE_INFO[ids[i]].name.split(' ')[0],81+i*96,241,20,own?'#3a2a1a':'#8c8474','center',G.flute===ids[i]);
      T(own?(G.flute===ids[i]?"equipped":"tap to equip"):"locked",81+i*96,253,15,
        own?'#6a5a3a':'#9c9484','center');
    }
    T("Bonuses",180,282,22,'#3a2a1a','center',true);
    bonusLines().forEach(([k,v],i)=>{
      const y=300+i*17;
      T(k,48,y,19,'#6a5a3a'); T(v,312,y,19,'#3a2a1a','right',true);
    });
    const acc=ownedGear();
    T("Accessories",180,412,19,'#3a2a1a','center',true);
    if(!acc.length) T("none yet",180,426,17,'#7a6a4a','center');
    else {
      /* wrap onto at most two lines so a full inventory can't overflow */
      const names=acc.map(g=>g.name), lines=[]; let cur='';
      for(const n of names){
        const test=cur?cur+", "+n:n;
        if(TW(test,16)>276){ lines.push(cur); cur=n; } else cur=test;
        if(lines.length>=2) break;
      }
      if(lines.length<2&&cur) lines.push(cur);
      if(lines.length===2&&cur&&lines[1]!==cur) lines[1]=lines[1]+", …";
      lines.slice(0,2).forEach((ln,i)=>T(ln,180,424+i*14,16,'#7a6a4a','center'));
    }
  } else if(sys.tab===1){
    T("Inventory",180,146,26,'#3a2a1a','center',true);
    T(G.coins+"c",312,146,24,'#a06a1a','right',true);
    if(!seeds.length) T("No seeds — buy some at the stall.",180,210,22,'#7a6a4a','center');
    seeds.forEach((k,i)=>{ const y=160+i*30; if(y>370) return;
      const S=SPECIES[k];
      T(S.name,70,y+18,22,'#3a2a1a');
      T(S.value+"c",250,y+18,19,'#a06a1a','right');
      T("x"+G.seeds[k],310,y+18,22,'#3a2a1a','right',true); });
  } else if(sys.tab===2){
    if(!list.length) T("No field songs yet — reach Lv.4",180,180,24,'#7a6a4a','center');
    list.forEach((f,i)=>{ const y=135+i*45;
      T(f.name,48,y+19,26,'#3a2a1a',null,true);
      T(f.desc,48,y+35,19,'#7a6a4a');
      T(f.mp+" MP",312,y+19,22,G.player.mp>=f.mp?'#2a6a9a':'#a09080','right'); });
    T("MP "+G.player.mp+"/"+maxMp(),180,396,22,'#7a6a4a','center');
  } else {
    T("Lv."+G.player.lv+"  ·  "+G.coins+"c",180,172,24,'#3a2a1a','center',true);
    T("Copy save code",180,211,26,'#3a2a1a','center',true);
    T("Paste a save code",180,259,26,'#3a2a1a','center',true);
    T("Save in this browser",180,307,26,'#3a2a1a','center',true);
    T("Garden "+G.gardenLv+"  ·  "+G.harvests+" harvests",180,350,19,'#7a6a4a','center');
  }
  T("Back",180,425,24,'#3a2a1a','center');
}
