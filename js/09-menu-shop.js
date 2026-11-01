/* ================================================================
   SHOP  (paged + opaque confirm)
   ================================================================ */
const TABS=['Seeds','Gear','Yard'];
const PER_PAGE=8;
let shop={tab:0,idx:0,page:0,confirm:null};
function openShop(){ shop={tab:0,idx:0,page:0,confirm:null}; G.scene='shop'; }
function shopItems(){
  if(shop.tab===0){
    const l=G.unlocked.map(s=>({type:'seed',id:s,name:SPECIES[s].name+" seed",
      cost:SPECIES[s].cost,desc:"sells for "+SPECIES[s].value+"c"}));
    l.push({type:'coffee',id:'coffee',name:"Coffee",cost:30,desc:"+50% speed, 2 min"});
    return l;
  }
  if(shop.tab===1) return GEAR.filter(g=>!G.gear[g.id]).map(g=>({type:'gear',...g}));
  return YARD.filter(g=>!G.yard[g.id]).map(g=>({type:'yard',...g}));
}
const pageCount=()=>Math.max(1,Math.ceil(shopItems().length/PER_PAGE));
function pageItems(){ return shopItems().slice(shop.page*PER_PAGE,(shop.page+1)*PER_PAGE); }
function askBuy(i){
  const it=pageItems()[i]; if(!it) return;
  if(G.coins<it.cost){ say("Not enough coins."); blip(150,0.08,0.2); return; }
  shop.confirm=it; shop.cIdx=0;
}
function doBuy(){
  const it=shop.confirm; shop.confirm=null;
  if(!it||G.coins<it.cost) return;
  G.coins-=it.cost;
  if(it.type==='seed'){ G.seeds[it.id]=(G.seeds[it.id]||0)+1; say("Bought a "+SPECIES[it.id].name+" seed."); }
  else if(it.type==='coffee'){ G.coffeeT=120000; say("Coffee! Speed boost for 2 minutes."); }
  else if(it.type==='gear'){ G.gear[it.id]=true; say(it.name+" — "+it.desc+".");
    if(it.id==='cloth') G.player.mp=maxMp();
    if(it.id==='silver'&&G.flute==='recorder') G.flute='silver';
    if(it.id==='dizi') G.flute='dizi'; }
  else if(it.type==='yard'){ G.yard[it.id]=true; buildWorld(); say(it.name+" installed!"); }
  if(AC) flute(11,AC.currentTime,.3,.5);
  shop.page=Math.min(shop.page,pageCount()-1); shop.idx=0; autoSave();
}
function shopKey(k){
  if(shop.confirm){
    if(isLeft(k)||isRight(k)||isUp(k)||isDown(k)) shop.cIdx=1-shop.cIdx;
    if(isOk(k)){ if(shop.cIdx===0) doBuy(); else shop.confirm=null; }
    if(isBack(k)) shop.confirm=null;
    return;
  }
  const n=pageItems().length||1;
  if(isUp(k)) shop.idx=(shop.idx+n-1)%n;
  if(isDown(k)) shop.idx=(shop.idx+1)%n;
  if(isLeft(k)){ shop.tab=(shop.tab+2)%3; shop.idx=0; shop.page=0; }
  if(isRight(k)){ shop.tab=(shop.tab+1)%3; shop.idx=0; shop.page=0; }
  if(k==='q') shop.page=(shop.page+pageCount()-1)%pageCount();
  if(k==='e') shop.page=(shop.page+1)%pageCount();
  if(isOk(k)) askBuy(shop.idx);
  if(isBack(k)){ G.scene='world'; autoSave(); }
}
function shopTouch(x,y){
  if(shop.confirm){
    if(y>306&&y<348){ if(x<180) doBuy(); else shop.confirm=null; }
    return;
  }
  if(y>444){ G.scene='world'; autoSave(); return; }
  if(y>162&&y<189){ shop.tab=clamp(Math.floor((x-21)/106),0,2); shop.idx=0; shop.page=0; return; }
  if(y>414&&y<440){
    if(x<90){ shop.page=(shop.page+pageCount()-1)%pageCount(); return; }
    if(x>270){ shop.page=(shop.page+1)%pageCount(); return; }
    return;
  }
  const items=pageItems(), top=198;
  for(let i=0;i<items.length;i++)
    if(y>top+i*26&&y<top+i*26+25&&x>21&&x<339){ shop.idx=i; askBuy(i); return; }
}
function drawShop(){
  drawWorldStatic(); dim();
  panel(12,30,336,432);
  portrait(b,24,42,1);
  for(let i=0;i<3;i++) tabPill(21+i*106,162,104,27,i===shop.tab);
  const items=pageItems();
  items.forEach((it,i)=>{ const y=198+i*26;
    menuRow(21,y,318,25,i===shop.idx,G.coins<it.cost);
    const sx=21+ROW_PAD;
    if(it.type==='seed'){ const S=SPECIES[it.id];
      px(b,sx,y+8,10,10,S.fruit); px(b,sx,y+8,5,5,S.dk); }
    else px(b,sx,y+8,10,10,'#8a6a2e'); });
  if(pageCount()>1){ px(b,21,414,69,26,'#c9b894'); px(b,270,414,69,26,'#c9b894'); }
  if(shop.confirm){
    px(b,0,0,LW,LH,'#0d1410');
    panel(30,180,300,180);
    px(b,39,189,282,51,'#e2d3ae');
    [[51,'#9fc48a'],[192,'#d8a89a']].forEach(([bx,col],i)=>{ const sel=shop.cIdx===i;
      px(b,bx,306,117,42,sel?'#a8781e':'#2b1c12'); px(b,bx+3,309,111,36,col);
      if(sel){ px(b,bx+3,309,111,3,'#fff3c0'); fluteCursor(bx+33,327); } });
  }
  m.drawImage(buf,0,0);
  if(shop.confirm){
    T("Confirm purchase",180,216,32,'#3a2a1a','center',true);
    T(shop.confirm.name,180,258,28,'#3a2a1a','center',true);
    if(shop.confirm.desc) T(shop.confirm.desc,180,278,20,'#7a6a4a','center');
    T("Cost "+shop.confirm.cost+"c",180,296,22,'#a06a1a','center',true);
    T("you have "+G.coins+"c",180,296+16,18,'#7a6a4a','center');
    T("Buy",118,333,30,'#1f3d20','center',true);
    T("Cancel",259,333,30,'#5a2a20','center',true);
    keyHint("A/D choose  ·  J confirm  ·  H back",180,375);
    return;
  }
  T("Garden Stall",228,78,34,'#3a2a1a','center',true);
  T("you have",228,104,22,'#7a6a4a','center');
  T(G.coins+"c",228,134,38,'#a06a1a','center',true);
  TABS.forEach((t,i)=>T(t,73+i*106,181,24,'#3a2a1a','center',i===shop.tab));
  items.forEach((it,i)=>{ const y=198+i*26;
    T(it.name,21+ROW_PAD+16,y+17,24,'#3a2a1a',null,i===shop.idx);
    if(it.desc) T(it.desc,192,y+17,18,'#7a6a4a');
    T(it.cost+"c",334,y+17,22,G.coins>=it.cost?'#a06a1a':'#b09a86','right'); });
  if(pageCount()>1){
    T("< prev  Q",55,432,22,'#3a2a1a','center',true);
    T("E  next >",304,432,22,'#3a2a1a','center',true);
    T("page "+(shop.page+1)+" / "+pageCount(),180,432,22,'#7a6a4a','center');
  }
  keyHint("W/S choose  ·  A/D tabs  ·  J buy  ·  H leave  (or tap here)",180,456);
}
