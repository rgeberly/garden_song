/* ================================================================
   HUD
   ================================================================ */
function bar(x,y,w,h,v,max,col,bg){
  px(b,x-2,y-2,w+4,h+4,'#241a12'); px(b,x,y,w,h,bg);
  px(b,x,y,Math.round(w*clamp(v/max,0,1)),h,col);
}
/* The HUD is laid out for y 300..480 and pinned to the bottom of the screen; any
   gap between the garden view and it is filled with the HUD's wood colour. */
function drawHUD(){
  wipeBuf();
  px(b,0,VIEW_H,LW,SCREEN_H-VIEW_H,'#2b241c');
  b.save(); b.translate(0,EXTRA); m.save(); m.translate(0,EXTRA*SC);
  px(b,0,HUD_Y,LW,LH-HUD_Y,'#2b241c'); px(b,0,HUD_Y,LW,3,'#4a3d2e');
  px(b,0,357,LW,2,'#4a3d2e');
  bar(57,HUD_Y+9,96,10,G.player.hp,G.player.maxhp,'#e04a4a','#5a2828');
  bar(57,HUD_Y+25,96,9,G.player.mp,maxMp(),'#4aa8e0','#20415a');
  bar(57,HUD_Y+40,96,7,G.player.xp,G.player.next,'#e8c34a','#5a4a20');
  px(b,SYS.x,SYS.y,SYS.w,SYS.h,'#4a3d2e');
  for(let i=0;i<3;i++) px(b,SYS.x+9,SYS.y+7+i*6,18,3,'#cdbfa6');
  blit();
  drawControls();
  if(G.msgT>0){ m.fillStyle='#1c1610'; m.fillRect(6*SC,366*SC,(LW-12)*SC,22*SC); }
  T("Lv."+G.player.lv,9,HUD_Y+19,28,'#f0e6d2');
  T("HP",46,HUD_Y+19,22,'#f0a0a0','right');
  T("MP",46,HUD_Y+34,22,'#8fd0f0','right');
  T("XP",46,HUD_Y+47,22,'#e8c34a','right');
  T(G.player.hp+"/"+G.player.maxhp,159,HUD_Y+19,22,'#cdbfa6');
  T(G.player.mp+"/"+maxMp(),159,HUD_Y+34,22,'#8fd0f0');
  T("Garden "+G.gardenLv,225,HUD_Y+19,25,'#f0e6d2');
  T(G.coins+"c",225,HUD_Y+37,28,'#e8c34a',null,true);
  const h=harmony();
  if(h>1.001) T("Harmony x"+h.toFixed(2),225,HUD_Y+50,20,'#8fe07a');
  if(G.msgT>0){ m.globalAlpha=Math.min(1,G.msgT/400);
    T(G.msg,14,381,23,'#f7f0dc'); m.globalAlpha=1; }
  b.restore(); m.restore();
}
/* ---------- the pad and the A/B buttons ----------
   Drawn straight onto the screen canvas (crisp at any size) in HUD coordinates: a
   brass-rimmed wooden well with a thumb knob and engraved arrows, a gold A and a
   sage-green B that sink a little while held. */
function roundBtn(c,{cx,cy,r},cols,down){
  const y=cy+(down?1.5:0);
  c.fillStyle='rgba(0,0,0,.38)'; c.beginPath(); c.arc(cx,cy+3,r+1.5,0,7); c.fill();
  c.fillStyle='#2a1a0c'; c.beginPath(); c.arc(cx,y,r+1.6,0,7); c.fill();
  const g=c.createRadialGradient(cx-r*0.35,y-r*0.45,r*0.08,cx,y,r);
  g.addColorStop(0,cols[0]); g.addColorStop(0.55,cols[1]); g.addColorStop(1,cols[2]);
  c.fillStyle=g; c.beginPath(); c.arc(cx,y,r,0,7); c.fill();
  c.strokeStyle='rgba(255,255,255,.22)'; c.lineWidth=1; c.beginPath(); c.arc(cx,y,r-2,Math.PI*1.1,Math.PI*1.9); c.stroke();
  c.fillStyle='rgba(255,255,255,.26)'; c.beginPath(); c.ellipse(cx-r*0.12,y-r*0.46,r*0.58,r*0.28,-0.2,0,7); c.fill();
  if(down){ c.fillStyle='rgba(40,20,0,.16)'; c.beginPath(); c.arc(cx,y,r,0,7); c.fill(); }
}
function drawControls(){
  const c=m, {cx,cy,r}=PAD;
  c.save(); c.scale(SC,SC);
  /* the pad: brass rim, dark wooden well, arrows (the held one lights up), knob */
  c.fillStyle='rgba(0,0,0,.38)'; c.beginPath(); c.arc(cx,cy+3,r+4,0,7); c.fill();
  const rim=c.createLinearGradient(0,cy-r-4,0,cy+r+4);
  rim.addColorStop(0,'#d8b46a'); rim.addColorStop(0.5,'#a07a3a'); rim.addColorStop(1,'#5e4120');
  c.fillStyle='#2a1a0c'; c.beginPath(); c.arc(cx,cy,r+4.6,0,7); c.fill();
  c.fillStyle=rim; c.beginPath(); c.arc(cx,cy,r+3.4,0,7); c.fill();
  const well=c.createRadialGradient(cx,cy-r*0.35,r*0.1,cx,cy,r);
  well.addColorStop(0,'#45341f'); well.addColorStop(1,'#1d140b');
  c.fillStyle=well; c.beginPath(); c.arc(cx,cy,r,0,7); c.fill();
  c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=2.5; c.beginPath(); c.arc(cx,cy,r-1.2,Math.PI*1.05,Math.PI*1.95); c.stroke();
  const lit=Math.hypot(padVec.x,padVec.y)>0;
  [[0,-1],[1,0],[0,1],[-1,0]].forEach(([dx,dy])=>{
    const on=lit&&(dx?Math.sign(padVec.x)===dx&&Math.abs(padVec.x)>Math.abs(padVec.y)
                    :Math.sign(padVec.y)===dy&&Math.abs(padVec.y)>=Math.abs(padVec.x));
    const ax=cx+dx*r*0.74, ay=cy+dy*r*0.74, s=5.5;
    c.fillStyle=on?'#ffe39a':'#8c7550';
    c.beginPath(); c.moveTo(ax+dx*s,ay+dy*s); c.lineTo(ax-dy*s-dx*s*0.6,ay+dx*s-dy*s*0.6);
    c.lineTo(ax+dy*s-dx*s*0.6,ay-dx*s-dy*s*0.6); c.fill();
  });
  const kx=cx+padVec.x*18, ky=cy+padVec.y*18;
  c.fillStyle='rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(kx,ky+3.5,19,17,0,0,7); c.fill();
  c.fillStyle='#3a2814'; c.beginPath(); c.arc(kx,ky,19.4,0,7); c.fill();
  const kn=c.createRadialGradient(kx-6,ky-7,2,kx,ky,19);
  kn.addColorStop(0,'#f5e2b0'); kn.addColorStop(0.5,'#c49c60'); kn.addColorStop(1,'#6e5030');
  c.fillStyle=kn; c.beginPath(); c.arc(kx,ky,18,0,7); c.fill();
  c.strokeStyle='rgba(70,45,20,.4)'; c.lineWidth=1.2; c.beginPath(); c.arc(kx,ky,11,0,7); c.stroke();
  c.fillStyle='rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(kx-4,ky-8,8,4,-0.3,0,7); c.fill();
  /* B: back / cancel, A: act / accept */
  roundBtn(c,BTNB,['#eef6dc','#93b27c','#4a663a'],btnBHeld);
  roundBtn(c,BTN,['#fff4cc','#e4b250','#8e5c1a'],btnHeld);
  c.restore();
  const ay=BTN.cy+(btnHeld?1.5:0), by=BTNB.cy+(btnBHeld?1.5:0);
  T("A",BTN.cx,ay+8.6,60,'rgba(255,244,210,.7)','center',true);
  T("A",BTN.cx,ay+7.8,60,'#5a3610','center',true);
  T("B",BTNB.cx,by+6.3,42,'#2c3f22','center',true);
  T("B",BTNB.cx,by+5.5,42,'#f6fbef','center',true);
}
/* the deck along the bottom of the screen for the scenes without the garden's HUD */
function drawDeck(){
  m.save(); m.setTransform(1,0,0,1,0,EXTRA*SC);
  const y0=LH-DECK_H;
  m.fillStyle='#2b241c'; m.fillRect(0,y0*SC,LW*SC,DECK_H*SC);
  m.fillStyle='rgba(255,235,200,.035)';
  for(let i=0;i<6;i++) m.fillRect(0,(y0+12+i*19)*SC,LW*SC,SC);       /* faint wood grain */
  m.fillStyle='#4a3d2e'; m.fillRect(0,y0*SC,LW*SC,3*SC);
  m.fillStyle='rgba(0,0,0,.3)'; m.fillRect(0,(y0+3)*SC,LW*SC,2*SC);
  drawControls();
  m.restore();
}
function panel(x,y,w,h){ px(b,x,y,w,h,'#2b1c12'); px(b,x+3,y+3,w-6,h-6,'#f3ead2'); }
/* The menu cursor is the flute you have equipped (its big art), laid at a slight
   tilt with a warm glow and bobbing beside the highlighted row; tipX is where its
   foot ends, y the row's middle. FLUTE_PTR holds each flute's centre, the angle of
   its mouthpiece-to-foot line (degrees) and its length, in flutes_big.png cells. */
const FLUTE_PTR=[[102.4,71.1,76.5,152],[98.6,79.4,134.2,204],[94.2,78.0,121.0,159]];
const PTR_LEN=30, PTR_TILT=-14*Math.PI/180;
function fluteCursor(tipX,y){
  if(!IMG_FLBIG.complete||!IMG_FLBIG.naturalWidth) return;
  const fi=Math.max(0,FLUTE_META.order.indexOf(G.flute||'recorder'));
  const [cx,cy,ang,len]=FLUTE_PTR[fi], bob=Math.sin(G.t/170)*1.6;
  const mx=tipX+bob-Math.cos(PTR_TILT)*PTR_LEN/2, my=y-Math.sin(PTR_TILT)*PTR_LEN/2;
  b.save();
  const g=b.createRadialGradient(mx,my,0,mx,my,PTR_LEN*0.6);
  g.addColorStop(0,'rgba(255,214,110,.6)'); g.addColorStop(1,'rgba(255,214,110,0)');
  b.fillStyle=g; b.beginPath(); b.ellipse(mx,my,PTR_LEN*0.6,PTR_LEN*0.3,PTR_TILT,0,7); b.fill();
  b.translate(mx,my); b.rotate(PTR_TILT-ang*Math.PI/180);
  const s=PTR_LEN/len; b.scale(s,s); b.imageSmoothingEnabled=true;
  b.shadowColor='rgba(70,45,10,.75)'; b.shadowBlur=2;     /* keeps the silver flute visible on cream */
  b.drawImage(IMG_FLBIG,fi*FLBIG_META.cw,0,FLBIG_META.cw,FLBIG_META.ch,-cx,-cy,FLBIG_META.cw,FLBIG_META.ch);
  b.restore();
}
/* a list row; the highlighted one gets a gold frame and the flute cursor in its
   first ROW_PAD px, where row content starts */
const ROW_PAD=34;
function menuRow(x,y,w,h,sel,off){
  if(sel){ px(b,x-1,y-1,w+2,h+2,'#a8781e'); px(b,x+1,y+1,w-2,h-2,'#fbf0c4'); fluteCursor(x+30,y+h/2); }
  else { px(b,x,y,w,h,off?'#d8cfbb':'#e8dcc0'); px(b,x,y,w,2,'#c3b48c'); }
}
/* a tab along the top of a menu; the open one is gold and stands a little taller */
function tabPill(x,y,w,h,sel){
  if(sel){ px(b,x,y,w,h,'#a8781e'); px(b,x+2,y+2,w-4,h-2,'#f0cf6a'); px(b,x+2,y+2,w-4,3,'#fff0b0'); }
  else { px(b,x,y+3,w,h-3,'#c9b894'); px(b,x,y+3,w,2,'#b8a67e'); }
}
/* Shop pictures (assets/sprites/shop_items.png, keyed by lower-case item name) load the
   first time a menu needs them. drawShopPic fits one into a box centred on cx,cy. */
let IMG_SHOPART=null;
function shopArtImg(){
  if(!IMG_SHOPART){ IMG_SHOPART=new Image(); IMG_SHOPART.src=ASSET_SHOPART; }
  return IMG_SHOPART.complete&&IMG_SHOPART.naturalWidth?IMG_SHOPART:null;
}
/* a party member's portrait (Kaitlyn's comes with the game; the others load when first
   needed); null until it has arrived */
const PORTRAIT_IMG={};
function portraitImg(id){
  if(id==='kaitlyn') return IMG_PT.complete&&IMG_PT.naturalWidth?IMG_PT:null;
  if(!PORTRAIT_IMG[id]){ PORTRAIT_IMG[id]=new Image(); PORTRAIT_IMG[id].src=ASSET_PORTRAITS[id]; }
  const im=PORTRAIT_IMG[id]; return im.complete&&im.naturalWidth?im:null;
}
function drawShopPic(key,cx,cy,bw,bh){
  const r=SHOP_ART[key], img=shopArtImg(); if(!r||!img) return false;
  const [sx,sy,w,h]=r, s=Math.min(1,bw*SC/w,bh*SC/h);
  b.save(); b.scale(1/SC,1/SC); b.imageSmoothingEnabled=true;
  b.drawImage(img,sx,sy,w,h,Math.round(cx*SC-w*s/2),Math.round(cy*SC-h*s/2),w*s,h*s);
  b.restore(); return true;
}
/* Timed effects (coffee, snacks) as small cream pills stacked in the bottom-left of
   the garden view, each with a coloured dot and the seconds left. */
const BUFFS=[['coffeeT','Coffee','#a8682a'],['snackT','Quick feet','#5aa347'],
             ['calmT','Calm garden','#5a9ad8'],['lureT','Pest lure','#c0563a']];
const activeBuffs=()=>BUFFS.filter(([k])=>G[k]>0);
function drawBuffsBack(){
  activeBuffs().forEach(([k,name,col],i)=>{
    const w=TW(name+" 000s",16,true)+20, x=5, y=VIEW_H-24-i*20;
    b.fillStyle='rgba(20,14,8,.3)'; b.beginPath(); b.roundRect(x+1,y+2,w,16,8); b.fill();
    b.fillStyle='#2b1c12'; b.beginPath(); b.roundRect(x,y,w,16,8); b.fill();
    b.fillStyle='#f3ead2'; b.beginPath(); b.roundRect(x+1.5,y+1.5,w-3,13,6.5); b.fill();
    b.fillStyle=col; b.beginPath(); b.arc(x+9,y+8,3.2,0,7); b.fill();
  });
}
function drawBuffsText(){
  activeBuffs().forEach(([k,name],i)=>{
    T(name+" "+Math.ceil(G[k]/1000)+"s",5+16,VIEW_H-24-i*20+11.5,16,'#3a2a1a','left',true);
  });
}
/* small key reminder along the bottom of a menu */
/* keyboard hints show on computers only; touch screens get touchTxt, if any */
function keyHint(txt,x,y,touchTxt){ const t=IS_TOUCH?touchTxt:txt; if(t) T(t,x,y,16,'#8a7a5a','center'); }
function dim(){ fillScreen(b,'#0d1410',.76); }
/* the garden (no one in it) filling the screen behind a menu */
function drawWorldStatic(){
  const cam=camera();
  b.save(); b.setTransform(SC,0,0,SC,0,0);
  b.save(); b.beginPath(); b.rect(0,0,LW,VIEW_H); b.clip();
  b.save(); b.scale(WORLD_ZOOM,WORLD_ZOOM); drawMap(cam); b.restore();
  tintView(b); b.restore();
  px(b,0,VIEW_H,LW,SCREEN_H-VIEW_H,'#2b241c');
  b.restore();
}
