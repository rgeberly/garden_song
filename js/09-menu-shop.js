/* ================================================================
   SHOP  (paged list of names and prices; the highlighted item's
   picture and details pop up beside it; opaque confirm). The Sell
   tab buys back harvested crops.
   ================================================================ */
const TABS=['Seeds','Yard','Sell'];
const TAB_W=104, TAB_STEP=106;
const TAB_YARD=1, TAB_SELL=2;     /* (gear is sold in town now: Rosa's and Juniper's) */
const PER_PAGE=8;
let shop={tab:0,idx:0,page:0,confirm:null};
/* opens on Sell when she is carrying a harvest */
function openShop(){
  shopArtImg();
  shop={tab:cropList().length?TAB_SELL:0,idx:0,page:0,confirm:null}; G.scene='shop';
}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function shopItems(){
  if(shop.tab===0) return bySeason(UNLOCK_ORDER.filter(s=>G.unlocked.includes(s))).map(s=>{ const S=SPECIES[s];
    return {type:'seed',id:s,name:seedName(s),cost:S.cost,
      desc:S.flavor+" "+(S.kind==='raised'?"Raised beds only. ":S.kind==='ground'?"Ground plots only. ":S.kind==='tree'?"Grows in a stone ring. ":"")+
        "Needs "+S.grow+" growth (about "+Math.ceil(S.grow/SONG_GROWTH)+" songs), "+growNeed(s,S.best)+
        " in "+SEASON_NAME[S.best]+". Sells for "+sellPrice(s)+"c.",
      note:"you have x"+(G.seeds[s]||0)}; });
  if(shop.tab===TAB_YARD) return YARD.filter(g=>!(g.gear?G.gear:G.yard)[g.id]).map(g=>({type:'yard',...g,desc:cap(g.desc)+"."}));
  /* Sell: one row per crop carried, then Sell all */
  const l=cropList().map(sp=>{ const S=SPECIES[sp], n=G.crops[sp];
    return {type:'crop',id:sp,sell:true,name:S.name,cost:sellPrice(sp),art:{crop:sp},
      desc:"Sells for "+sellPrice(sp)+"c each. Or eat it: "+eatText(sp)+".",
      note:"you have x"+n,btn:"Sell 1  ·  "+sellPrice(sp)+"c"}; });
  /* (forage, fish and what pests leave behind go to Juniper's Junk Shop in town) */
  if(l.length){ const n=cropList().reduce((a,sp)=>a+G.crops[sp],0), total=sellAllTotal();
    l.unshift({type:'sellall',sell:true,name:"Sell all",cost:total,art:{shop:'harvest basket'},
      desc:"Sell all "+n+" things you are carrying.",btn:"Sell all  ·  "+total+"c"}); }
  return l;
}
const sellAllTotal=()=>cropList().reduce((a,sp)=>a+sellPrice(sp)*G.crops[sp],0);
function sellCrop(sp,n){
  const k=Math.min(n,G.crops[sp]||0); if(!k) return 0;
  G.crops[sp]-=k; if(G.crops[sp]<=0) delete G.crops[sp];
  const got=sellPrice(sp)*k; G.coins+=got; return got;
}
function sellAll(){
  let got=0, n=0; cropList().forEach(sp=>{ n+=G.crops[sp]; got+=sellCrop(sp,G.crops[sp]); });
  say("Sold "+n+" things for "+got+"c!"); coinChime(); autoSave();
}
function coinChime(){ if(AC){ flute(14,AC.currentTime,.18,.5); flute(19,AC.currentTime+.08,.3,.5); } }
/* keep the highlight on a real row after the list shrinks */
function shopClampIdx(){
  shop.page=Math.min(shop.page,pageCount()-1);
  shop.idx=Math.min(shop.idx,Math.max(0,pageItems().length-1));
}
const pageCount=()=>Math.max(1,Math.ceil(shopItems().length/PER_PAGE));
function pageItems(){ return shopItems().slice(shop.page*PER_PAGE,(shop.page+1)*PER_PAGE); }
function askBuy(i){
  const it=pageItems()[i]; if(!it) return;
  if(it.type==='good'){ G.goods[it.id]--; if(G.goods[it.id]<=0) delete G.goods[it.id]; G.coins+=it.cost;
    say("Sold a "+it.name+" for "+it.cost+"c."); coinChime(); shopClampIdx(); autoSave(); return; }
  if(it.type==='crop'){ sellCrop(it.id,1); say("Sold a "+it.name+" for "+it.cost+"c.");
    coinChime(); shopClampIdx(); autoSave(); return; }
  if(it.type==='sellall'){ shop.confirm=it; shop.cIdx=0; return; }
  if(G.coins<it.cost){ say("Not enough coins."); blip(150,0.08,0.2); return; }
  shop.confirm=it; shop.cIdx=0;
}
function doBuy(){
  const it=shop.confirm; shop.confirm=null;
  if(it&&it.type==='sellall'){ sellAll(); shopClampIdx(); return; }
  if(!it||G.coins<it.cost) return;
  G.coins-=it.cost;
  if(it.type==='seed'){ G.seeds[it.id]=(G.seeds[it.id]||0)+1; say("Bought a "+seedName(it.id)+"."); }
  else if(it.type==='coffee'){ addGood('coffee'); say("Coffee's in your bag. Drink it from the menu's Items."); }
  else if(it.type==='gear'){ G.gear[it.id]=true; say(it.name+" — "+it.desc);
    if(it.id==='cloth') G.player.mp=maxMp();
    if(it.id==='silver'&&G.flute==='recorder') G.flute='silver';
    if(it.id==='dizi') G.flute='dizi'; }
  else if(it.type==='yard'&&it.gear){ G.gear[it.id]=true; say(it.name+" — "+it.desc+"."); }
  else if(it.type==='yard'){ G.yard[it.id]=true; buildWorld(); say(it.name+" installed!"); }
  if(AC) flute(11,AC.currentTime,.3,.5);
  shopClampIdx(); autoSave();
}
function shopSetTab(t){ shop.tab=(t+TABS.length)%TABS.length; shop.idx=0; shop.page=0; }
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
  if(isLeft(k)) shopSetTab(shop.tab-1);
  if(isRight(k)) shopSetTab(shop.tab+1);
  if(k==='q'){ shop.page=(shop.page+pageCount()-1)%pageCount(); shop.idx=0; }
  if(k==='e'){ shop.page=(shop.page+1)%pageCount(); shop.idx=0; }
  if(isOk(k)) askBuy(shop.idx);
  if(isBack(k)){ G.scene='world'; autoSave(); }
}
/* layout: the list down the left, the item card beside it */
const SHOP_LIST={x:21,y:198,w:166,step:26,h:25}, SHOP_CARD={x:196,y:196,w:143,h:212};
const SHOP_BUY={x:SHOP_CARD.x+12,y:SHOP_CARD.y+178,w:SHOP_CARD.w-24,h:24};
function shopTouch(x,y){
  if(shop.confirm){
    if(y>306&&y<348){ if(x<180) doBuy(); else shop.confirm=null; }
    return;
  }
  if(y>444){ G.scene='world'; autoSave(); return; }
  if(y>162&&y<189){ shopSetTab(clamp(Math.floor((x-21)/TAB_STEP),0,TABS.length-1)); return; }
  if(y>414&&y<440){
    if(x<90){ shop.page=(shop.page+pageCount()-1)%pageCount(); shop.idx=0; return; }
    if(x>270){ shop.page=(shop.page+1)%pageCount(); shop.idx=0; return; }
    return;
  }
  const BUY=SHOP_BUY;
  if(x>BUY.x&&x<BUY.x+BUY.w&&y>BUY.y&&y<BUY.y+BUY.h){ askBuy(shop.idx); return; }
  /* first tap shows an item, a second tap on it buys */
  const L=SHOP_LIST, items=pageItems();
  for(let i=0;i<items.length;i++)
    if(y>L.y+i*L.step&&y<L.y+i*L.step+L.h&&x>L.x&&x<L.x+L.w){
      if(shop.idx===i) askBuy(i); else shop.idx=i; return; }
}
/* split text into lines no wider than w (logical px) at this font size */
function wrapLines(text,size,w){
  const out=[]; let line='';
  for(const wd of text.split(' ')){ const t=line?line+' '+wd:wd;
    if(line&&TW(t,size)>w){ out.push(line); line=wd; } else line=t; }
  if(line) out.push(line); return out;
}
/* the item's picture, fitted into a box centred on cx with its top at y: a crop's
   own picture when selling, otherwise the shop picture named after it */
function drawShopArt(it,cx,y,bw,bh){
  if(it.art&&it.art.crop){ drawCropIcon(b,it.art.crop,cx,y+bh/2,Math.min(bw,bh)); return; }
  if(it.art&&it.art.good){ drawGoodIcon(b,it.art.good,cx,y+bh/2,Math.min(bw,bh)); return; }
  if(drawShopPic((it.art&&it.art.shop)||it.name.toLowerCase(),cx,y+bh/2,bw,bh)) return;
  /* no picture: a seed-coloured packet or a plain crate */
  if(it.type==='seed'){ const S=SPECIES[it.id];
    px(b,cx-16,y+bh/2-20,32,40,'#e8dcc0'); px(b,cx-10,y+bh/2-8,20,20,S.fruit); px(b,cx-10,y+bh/2-8,10,10,S.dk); }
  else { px(b,cx-18,y+bh/2-14,36,28,'#8a6a2e'); px(b,cx-18,y+bh/2-14,36,4,'#a8865a'); }
}
function drawShop(){
  drawWorldStatic(); dim();
  panel(12,30,336,432);
  portrait(b,24,42,1);
  TABS.forEach((t,i)=>tabPill(21+i*TAB_STEP,162,TAB_W,27,i===shop.tab));
  const items=pageItems(), L=SHOP_LIST, C=SHOP_CARD, sel=items[shop.idx];
  const can=it=>it.sell||G.coins>=it.cost;
  items.forEach((it,i)=>menuRow(L.x,L.y+i*L.step,L.w,L.h,i===shop.idx,!can(it)));
  if(sel){
    /* the pop-up card, pointing at the highlighted row */
    const py=clamp(L.y+shop.idx*L.step+L.h/2,C.y+12,C.y+C.h-12);
    rpgWin(C,1);
    b.fillStyle='#e6eaf6'; b.beginPath(); b.moveTo(C.x+1,py-7); b.lineTo(C.x-6,py); b.lineTo(C.x+1,py+7); b.fill();
    b.fillStyle='#4a64c0'; b.beginPath(); b.moveTo(C.x+2,py-4.6); b.lineTo(C.x-3,py); b.lineTo(C.x+2,py+4.6); b.fill();
    b.fillStyle='rgba(200,212,255,.3)'; b.fillRect(C.x+8,C.y+96,C.w-16,1);
    drawShopArt(sel,C.x+C.w/2,C.y+8,C.w-20,84);
    const ok=can(sel), BUY=SHOP_BUY;
    winButton(BUY.x,BUY.y,BUY.w,BUY.h,ok,!ok);
  }
  if(pageCount()>1){ winButton(21,414,69,26,false); winButton(270,414,69,26,false); }
  if(shop.confirm){
    b.globalAlpha=.6; px(b,0,0,LW,LH,'#0d1410'); b.globalAlpha=1;
    panel(30,180,300,180);
    [51,192].forEach((bx,i)=>{ const on=shop.cIdx===i;
      winButton(bx,306,117,42,on); if(on) fluteCursor(bx+33,327); });
  }
  blit();
  if(shop.confirm){
    const sellAllAsk=shop.confirm.type==='sellall';
    TS(sellAllAsk?"Sell everything?":"Confirm purchase",180,216,26,WIN_TXT.title,'center',true);
    TS(sellAllAsk?shop.confirm.desc:shop.confirm.name,180,256,sellAllAsk?19:22,WIN_TXT.body,'center',true);
    TS((sellAllAsk?"You get ":"Cost ")+shop.confirm.cost+"c",180,282,20,WIN_TXT.gold,'center',true);
    TS("you have "+G.coins+"c",180,298,16,WIN_TXT.note,'center');
    TS(sellAllAsk?"Sell":"Buy",118,333,24,WIN_TXT.title,'center',true);
    TS("Cancel",259,333,24,WIN_TXT.title,'center',true);
    keyHint("A/D choose  ·  J confirm  ·  H back",180,375);
    return;
  }
  TS("Garden Stall",228,78,28,WIN_TXT.title,'center',true);
  TS("you have",228,104,17,WIN_TXT.note,'center');
  TS(G.coins+"c",228,134,30,WIN_TXT.gold,'center',true);
  TABS.forEach((t,i)=>TS(t,21+i*TAB_STEP+TAB_W/2,181,20,i===shop.tab?WIN_TXT.gold:WIN_TXT.body,'center',i===shop.tab));
  items.forEach((it,i)=>{ const y=L.y+i*L.step, afford=can(it);
    TS(it.name+(it.type==='crop'?" x"+G.crops[it.id]:it.type==='good'?" x"+G.goods[it.id]:""),L.x+ROW_PAD+1,y+17,19,afford?WIN_TXT.title:WIN_TXT.off,null,i===shop.idx||it.type==='sellall');
    TS((it.sell?"+":"")+it.cost+"c",L.x+L.w-6,y+17,18,it.sell?WIN_TXT.good:afford?WIN_TXT.gold:WIN_TXT.off,'right',true); });
  if(!items.length) TS(shop.tab===TAB_SELL?"Nothing to sell yet.":"Sold out — you have it all!",104,230,20,WIN_TXT.note,'center');
  if(!items.length&&shop.tab===TAB_SELL) TS("Harvest crops to sell them here.",104,248,17,WIN_TXT.dim,'center');
  if(sel){
    const cx=C.x+C.w/2;
    wrapLines(sel.name,20,C.w-14).slice(0,2).forEach((ln,i)=>TS(ln,cx,C.y+114+i*15,20,WIN_TXT.title,'center',true));
    const top=C.y+114+(TW(sel.name,20,true)>C.w-14?30:16);
    wrapLines(sel.desc,16,C.w-16).slice(0,4).forEach((ln,i)=>TS(ln,cx,top+i*13,16,WIN_TXT.body,'center'));
    if(sel.note) TS(sel.note,C.x+8,C.y+16,14,WIN_TXT.note,'left');      /* (up in the corner: long descriptions fill the bottom) */
    const ok=can(sel), BUY=SHOP_BUY;
    TS(sel.btn||(ok?"Buy  ·  "+sel.cost+"c":"Need "+sel.cost+"c"),BUY.x+BUY.w/2,BUY.y+16.5,18,ok?WIN_TXT.gold:WIN_TXT.off,'center',true);
  }
  if(pageCount()>1){
    TS(IS_TOUCH?"< prev":"< prev  Q",55,432,18,WIN_TXT.title,'center',true);
    TS(IS_TOUCH?"next >":"E  next >",304,432,18,WIN_TXT.title,'center',true);
    TS("page "+(shop.page+1)+" / "+pageCount(),180,432,17,WIN_TXT.note,'center');
  }
  keyHint("W/S choose  ·  A/D tabs  ·  J "+(shop.tab===TAB_SELL?"sell":"buy")+"  ·  H leave  (or tap here)",180,456,
    "tap an item, then tap it again or the button  ·  tap here to leave");
}
