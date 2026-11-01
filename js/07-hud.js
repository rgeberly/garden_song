/* ================================================================
   HUD
   ================================================================ */
function bar(x,y,w,h,v,max,col,bg){
  px(b,x-2,y-2,w+4,h+4,'#241a12'); px(b,x,y,w,h,bg);
  px(b,x,y,Math.round(w*clamp(v/max,0,1)),h,col);
}
function drawHUD(){
  b.clearRect(0,0,LW,LH);
  px(b,0,HUD_Y,LW,LH-HUD_Y,'#2b241c'); px(b,0,HUD_Y,LW,3,'#4a3d2e');
  px(b,0,357,LW,2,'#4a3d2e');
  bar(57,HUD_Y+9,96,10,G.player.hp,G.player.maxhp,'#e04a4a','#5a2828');
  bar(57,HUD_Y+25,96,9,G.player.mp,maxMp(),'#4aa8e0','#20415a');
  bar(57,HUD_Y+40,96,7,G.player.xp,G.player.next,'#e8c34a','#5a4a20');
  px(b,SYS.x,SYS.y,SYS.w,SYS.h,'#4a3d2e');
  for(let i=0;i<3;i++) px(b,SYS.x+9,SYS.y+7+i*6,18,3,'#cdbfa6');
  b.globalAlpha=.92;
  b.beginPath(); b.arc(PAD.cx,PAD.cy,PAD.r,0,7); b.fillStyle='#3a3228'; b.fill();
  b.strokeStyle='#5c5040'; b.lineWidth=3; b.stroke();
  b.beginPath(); b.arc(PAD.cx+padVec.x*18,PAD.cy+padVec.y*18,18,0,7);
  b.fillStyle='#7d6b52'; b.fill();
  b.beginPath(); b.arc(BTN.cx,BTN.cy,BTN.r,0,7);
  b.fillStyle=btnHeld?'#c9a84a':'#8a6a2e'; b.fill();
  b.strokeStyle='#5c4520'; b.stroke(); b.globalAlpha=1;
  if(G.msgT>0) px(b,6,366,LW-12,22,'#1c1610');
  m.drawImage(buf,0,0);
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
  if(G.coffeeT>0) T("COFFEE "+Math.ceil(G.coffeeT/1000)+"s",159,HUD_Y+48,20,'#e8a86a');
  if(G.msgT>0){ m.globalAlpha=Math.min(1,G.msgT/400);
    T(G.msg,14,381,23,'#f7f0dc'); m.globalAlpha=1; }
  T("A",BTN.cx,BTN.cy+9,34,'#2b1c12','center',true);
}
function panel(x,y,w,h){ px(b,x,y,w,h,'#2b1c12'); px(b,x+3,y+3,w-6,h-6,'#f3ead2'); }
function dim(){ b.globalAlpha=.76; px(b,0,0,LW,LH,'#0d1410'); b.globalAlpha=1; }
function drawWorldStatic(){
  const cam=camera();
  b.save(); b.beginPath(); b.rect(0,0,LW,VIEW_H); b.clip();
  drawMap(cam); tintView(b); b.restore();
  px(b,0,VIEW_H,LW,LH-VIEW_H,'#2b241c');
}
