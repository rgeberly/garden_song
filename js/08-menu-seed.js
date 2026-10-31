/* ================================================================
   SEED MENU
   ================================================================ */
let menu={items:[],idx:0,plot:null};
function plotAccepts(plot,s){
  const k=SPECIES[s].kind;
  if(plot.tree) return k==='tree';
  if(k==='raised') return !!plot.raised;
  return k==='bed';
}
function openSeedMenu(plot){
  const items=Object.keys(G.seeds).filter(s=>G.seeds[s]>0&&plotAccepts(plot,s));
  if(!items.length){ say(plot.tree?"No saplings — buy one at the stall.":"No seeds for this bed."); return; }
  menu={items,idx:0,plot}; G.scene='menu';
}
function menuChoose(i){
  const sp=menu.items[i]; if(!sp)return;
  let n=0;
  const plant=p=>{ if(!G.seeds[sp])return false;
    G.seeds[sp]--; if(G.seeds[sp]<=0) delete G.seeds[sp];
    Object.assign(p,{sp,stage:0,growth:0,health:100}); n++; return true; };
  plant(menu.plot);
  if(G.gear.apron){
    plots.forEach(p=>{ if(p!==menu.plot&&active(p)&&!p.sp&&p.bed===menu.plot.bed&&plotAccepts(p,sp)) plant(p); });
  }
  G.scene='world';
  say((n>1?("Planted "+n+" "+SPECIES[sp].name+"s. "):("Planted "+SPECIES[sp].name+". "))
      +"Harmony x"+harmony().toFixed(2));
  if(AC) flute(4,AC.currentTime,.35,.5);
}
function menuKey(k){
  const n=menu.items.length;
  if(k==='arrowup'||k==='w') menu.idx=(menu.idx+n-1)%n;
  if(k==='arrowdown'||k==='s') menu.idx=(menu.idx+1)%n;
  if(k===' '||k==='enter') menuChoose(menu.idx);
  if(k==='escape') G.scene='world';
}
function menuTouch(x,y){
  const top=141;
  for(let i=0;i<menu.items.length;i++)
    if(y>top+i*36&&y<top+i*36+33&&x>39&&x<321){ menuChoose(i); return; }
  if(y>top+menu.items.length*36+9) G.scene='world';
}
function drawMenu(){
  drawWorldStatic(); dim();
  const h=48+menu.items.length*36+42;
  panel(24,87,312,h);
  menu.items.forEach((s,i)=>{ const S=SPECIES[s], y=141+i*36;
    px(b,39,y,282,33,i===menu.idx?'#d9c9a0':'#e8dcc0'); px(b,39,y,282,2,'#c3b48c');
    px(b,48,y+11,12,12,S.fruit); px(b,48,y+11,6,6,S.dk); });
  m.drawImage(buf,0,0);
  T(menu.plot.tree?"Plant a sapling":(menu.plot.raised?"Raised bed  ·  +30% growth":"Plant a seed"),
    180,117,30,'#3a2a1a','center',true);
  T(G.gear.apron?"Seed Apron fills the whole bed":"value shown per harvest",180,133,20,'#7a6a4a','center');
  menu.items.forEach((s,i)=>{ const S=SPECIES[s], y=141+i*36;
    T(S.name,69,y+16,26,'#3a2a1a');
    T(S.notes+"-note song",69,y+29,18,'#6a5a3a');
    T(S.value+"c",279,y+16,24,'#a06a1a','right',true);
    T(S.xp+" xp",279,y+29,18,'#5a7a3a','right');
    T("x"+G.seeds[s],316,y+23,22,'#7a6a4a','right'); });
  T("tap below to cancel",180,141+menu.items.length*36+24,20,'#8a7a5a','center');
}
