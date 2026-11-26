/* ================================================================
   SEED MENU
   ================================================================ */
let menu={items:[],idx:0,plot:null};
function plotAccepts(plot,s){
  const k=SPECIES[s].kind;
  if(plot.tree) return k==='tree';
  if(k==='raised') return !!plot.raised;
  if(k==='ground') return !plot.raised;
  return k==='bed';
}
function openSeedMenu(plot){
  const items=bySeason(Object.keys(G.seeds).filter(s=>G.seeds[s]>0&&plotAccepts(plot,s)));
  if(!items.length){ say(plot.tree?"No saplings — buy one at the stall.":"No seeds for this bed."); return; }
  menu={items,idx:0,top:0,plot}; G.scene='menu';
}
/* a crop's name for more than one: Strawberries, Radishes, Tomatoes; Lemongrass and
   Collard Greens stay as they are */
function plural(name){
  if(/(s|grass)$/i.test(name)) return name;
  if(/[^aeiou]y$/i.test(name)) return name.slice(0,-1)+"ies";
  if(/(sh|ch|x)$/i.test(name)||/tomato$/i.test(name)) return name+"es";
  return name+"s";
}
function menuChoose(i){
  const sp=menu.items[i]; if(!sp)return;
  let n=0;
  const plant=p=>{ if(!G.seeds[sp])return false;
    G.seeds[sp]--; if(G.seeds[sp]<=0) delete G.seeds[sp];
    Object.assign(p,{sp,stage:0,growth:0,health:100,sungDay:0,fullDay:0}); n++; return true; };
  plant(menu.plot);
  if(gearOn('apron')){
    plots.forEach(p=>{ if(p!==menu.plot&&active(p)&&!p.sp&&!p.dead&&plotArea(p)===plotArea(menu.plot)&&plotAccepts(p,sp)) plant(p); });
  }
  G.scene='world';
  say((n>1?("Planted "+n+" "+plural(SPECIES[sp].name)+". "):("Planted "+SPECIES[sp].name+". "))
      +"Harmony x"+harmony().toFixed(2));
  if(AC) flute(4,AC.currentTime,.35,.5);
}
/* a long list scrolls: SEED_FIT rows show at once (as many as fit above the bottom of the
   screen), from menu.top; the keys move through it, and on a touch screen the list can be
   dragged (a tap that doesn't drag plants) */
const SEED_TOP=141, SEED_ROW=36;
const seedFit=()=>Math.max(2,Math.min(menu.items.length,Math.floor((BAND_BOT()-8-42-SEED_TOP)/SEED_ROW)));
function seedSee(){ const F=seedFit(); menu.top=clamp(menu.top||0,Math.max(0,menu.idx-F+1),Math.min(menu.idx,Math.max(0,menu.items.length-F))); }
function menuKey(k){
  const n=menu.items.length;
  if(isUp(k)) menu.idx=(menu.idx+n-1)%n;
  if(isDown(k)) menu.idx=(menu.idx+1)%n;
  seedSee();
  if(isOk(k)) menuChoose(menu.idx);
  if(isBack(k)) G.scene='world';
}
const seedRowAt=y=>{ const j=Math.floor((y-SEED_TOP)/SEED_ROW); return j>=0&&j<seedFit()&&y-SEED_TOP-j*SEED_ROW<33?(menu.top||0)+j:-1; };
function menuTouch(x,y,id){
  if(y>SEED_TOP+seedFit()*SEED_ROW+9){ G.scene='world'; return; }
  menu.drag={id,y0:y,top0:menu.top||0,moved:false,x,y};
}
function menuMove(x,y,id){
  const D=menu.drag; if(!D||D.id!==id) return;
  if(Math.abs(y-D.y0)>8) D.moved=true;
  if(D.moved) menu.top=clamp(Math.round(D.top0-(y-D.y0)/SEED_ROW),0,Math.max(0,menu.items.length-seedFit()));
}
function menuUp(id){
  const D=menu.drag; if(!D||D.id!==id) return; menu.drag=null;
  if(D.moved) return;
  const i=seedRowAt(D.y); if(i>=0&&i<menu.items.length&&D.x>39&&D.x<321) menuChoose(i);
}
function drawMenu(){
  drawWorldStatic(); dim();
  const F=seedFit(), top=menu.top||0, shown=menu.items.slice(top,top+F);
  const h=48+F*SEED_ROW+42;
  panel(24,87,312,h);
  shown.forEach((s,j)=>{ const i=top+j, S=SPECIES[s], y=SEED_TOP+j*SEED_ROW;
    menuRow(39,y,282,33,i===menu.idx);
    /* its seed packet or sapling (shop items/<Crop> seed or <Tree> sapling) */
    if(!drawShopPic(seedName(s).toLowerCase(),39+ROW_PAD+6,y+16.5,20,30)){
      px(b,39+ROW_PAD,y+11,12,12,S.fruit); px(b,39+ROW_PAD,y+11,6,6,S.dk); } });
  blit();
  TS(menu.plot.tree?"Plant a sapling":(menu.plot.raised?"Raised bed  ·  +30% growth":"Plant a seed"),
    180,117,26,WIN_TXT.title,'center',true);
  TS(gearOn('apron')?"Seed Apron fills this part of the garden":"value shown per harvest",180,133,16,WIN_TXT.note,'center');
  shown.forEach((s,j)=>{ const i=top+j, S=SPECIES[s], y=SEED_TOP+j*SEED_ROW, x=39+ROW_PAD+18;
    TS(S.name,x,y+16,22,WIN_TXT.title,null,i===menu.idx);
    TS(S.notes+"-note song",x,y+29,16,WIN_TXT.note);
    TS(S.value+"c",279,y+16,20,WIN_TXT.gold,'right',true);
    TS(S.xp+" xp",279,y+29,16,WIN_TXT.good,'right');
    TS("x"+G.seeds[s],316,y+23,19,WIN_TXT.body,'right'); });
  /* more above or below */
  if(top>0) TS("▲",330,SEED_TOP+4,13,WIN_TXT.body,'right');
  if(top+F<menu.items.length) TS("▼",330,SEED_TOP+F*SEED_ROW-4,13,WIN_TXT.body,'right');
  keyHint("W/S choose  ·  J plant  ·  H cancel  (or tap below)",180,SEED_TOP+F*SEED_ROW+24,
    menu.items.length>F?"tap a seed to plant it  ·  drag to scroll  ·  tap below to cancel":"tap a seed to plant it  ·  tap below to cancel");
}
