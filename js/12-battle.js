/* ================================================================
   BATTLE
   ================================================================ */
const EX=228, EY=110, KX=78, KY=228;
let B=null;
function startBattle(pest){
  const P=PESTS[pest.species];
  B={pest,species:pest.species,name:P.name,hp:pest.hp,maxhp:P.hp,boss:!!P.boss,atkMul:1,
     turn:'player',idx:0,log:(P.boss?"The HOA President demands a word!":"A "+P.name+" blocks your path!"),
     shake:0,over:null,pops:[],fx:[],anim:null,flash:0,shout:null};
  G.scene='battle'; setMusic(P.boss?'boss':'battle'); blip(220,0.1,0.2);
}
function pop(txt,x,y,col){ B.pops.push({txt,x,y,t:1100,col}); }
function burst(x,y,col,n,spd){ for(let i=0;i<(n||10);i++)
  B.fx.push({x,y,vx:rnd(-1,1)*(spd||0.13),vy:rnd(-0.19,0.03),t:520,col,g:0.001}); }
function anim(kind,dur,onHit){ B.anim={kind,t:0,dur,hit:false,onHit}; }
function battleKey(k){
  if(!B)return;
  if(B.over){ endBattle(); return; }
  if(B.turn!=='player')return;
  /* B.idx runs over the moves, and one past the last move is Flee */
  const ms=moveList(), flee=ms.length;
  if(isUp(k)) B.idx=B.idx===flee?ms.length-1:(B.idx+ms.length-1)%ms.length;
  if(isDown(k)) B.idx=B.idx===flee?0:(B.idx+1)%ms.length;
  if(isRight(k)) B.idx=flee;
  if(isLeft(k)&&B.idx===flee) B.idx=0;
  if(isOk(k)){ if(B.idx===flee) tryFlee(); else useMove(ms[B.idx]); }
  /* cancel points at Flee first, so a stray press doesn't run away */
  if(isBack(k)){ if(B.idx===flee) tryFlee(); else B.idx=flee; }
}
function battleTouch(x,y){
  if(!B)return;
  if(B.over){ endBattle(); return; }
  if(B.turn!=='player')return;
  const ms=moveList(), top=282, rowH=25;
  for(let i=0;i<ms.length;i++)
    if(y>top+i*rowH&&y<top+i*rowH+23&&x>15&&x<240){ B.idx=i; useMove(ms[i]); return; }
  if(x>249&&y>top&&y<top+26) tryFlee();
}
function tryFlee(){
  if(B.boss){ B.log="The HOA President blocks the gate!"; B.turn='enemy'; setTimeout(enemyTurn,700); return; }
  if(Math.random()<0.55){ B.over='flee'; B.log="You slipped away."; }
  else { B.log="Couldn't get away!"; B.turn='enemy'; setTimeout(enemyTurn,700); }
}
function hitEnemy(dmg,label){
  B.hp-=dmg; B.shake=340; B.flash=200;
  pop("-"+dmg,EX,EY-10,'#ffd24a'); thud(); B.log=label;
}
function afterHit(){
  if(B.hp<=0){ B.over='win'; B.log="The "+B.name+" flees the garden!"; playOne('victory',0.6); return; }
  B.turn='enemy'; setTimeout(enemyTurn,700);
}
function useMove(mv){
  if(G.player.mp<mv.mp){ B.log="Not enough Music Points!"; blip(150,0.08,0.2); return; }
  G.player.mp-=mv.mp; B.turn='busy';
  if(mv.id==='kick'){
    B.shout={txt:KICK_SHOUTS[ri(0,KICK_SHOUTS.length-1)],t:1500};
    B.kickVar=Math.random()<0.5?'kick':'kick2';
    playOne('kick',0.55);
    anim('kick',1100,()=>{
      const base=(6+G.player.lv*2)*(G.gear.kickers?1.6:1);
      const dmg=Math.max(1,Math.round(base*mv.pow*rnd(0.85,1.15)));
      burst(EX-20,EY+16,'#ffe6a0',16,0.19); burst(EX-30,EY+34,'#d8c49a',12,0.13);
      hitEnemy(dmg,"Quick Kick lands for "+dmg+"!");
    });
    return;
  }
  startRhythm(null,{notes:mv.notes,name:mv.name,mp:mv.mp,cb:(acc)=>{
    G.scene='battle'; playOne('flute',0.5);
    anim(mv.fx,1500,()=>{
      if(mv.heal){
        const h=Math.round(mv.heal*(0.5+acc));
        G.player.hp=Math.min(G.player.maxhp,G.player.hp+h);
        pop("+"+h,KX,KY-70,'#8fe07a');
      }
      if(mv.pow>0){
        const base=(6+G.player.lv*2)*(G.gear.polish?1.3:1)*fluteMul();
        const dmg=Math.max(1,Math.round(base*mv.pow*(0.35+acc*1.1)));
        hitEnemy(dmg,mv.name+" hits for "+dmg+"!  ("+Math.round(acc*100)+"%)");
      } else B.log=mv.name+" restores health.";
      if(mv.weaken){ B.atkMul=0.6; B.log+="  Its attack drops!"; }
    });
  }});
}
function enemyTurn(){
  if(!B||B.over)return;
  anim('enemy',700,()=>{
    if(!B||B.over)return;
    const P=PESTS[B.species];
    const dmg=Math.max(1,Math.round(P.atk*B.atkMul*rnd(0.7,1.3)));
    G.player.hp-=dmg; B.log="The "+B.name+" strikes for "+dmg+"!";
    pop("-"+dmg,KX,KY-70,'#ff8a8a'); burst(KX,KY-46,'#ff9a8a',10); blip(180,0.09,0.2);
    if(G.player.hp<=0){ G.player.hp=0; B.over='lose'; B.log="Kaitlyn is worn out..."; return; }
    B.turn='player';
  });
}
function endBattle(){
  const P=PESTS[B.species];
  if(B.over==='win'){ G.coins+=P.coin; addXp(P.xp);
    G.pests=G.pests.filter(p=>p!==B.pest);
    say((P.boss?"The HOA President retreats! ":"Won!  ")+"+"+P.coin+"c  +"+P.xp+"xp"); }
  else if(B.over==='lose'){ G.player.hp=Math.max(4,Math.floor(G.player.maxhp*0.4));
    G.pests=G.pests.filter(p=>p!==B.pest); G.player.x=338; G.player.y=396;
    const lost=Math.floor(G.coins*0.5); G.coins-=lost;
    say("A frog nudged you awake by the pool. You dropped "+lost+"c."); }
  else { B.pest.x+=rnd(-60,60); B.pest.y+=rnd(-60,60); say("You slipped away."); }
  B=null; G.scene='world'; setMusic('calm'); autoSave();
}
function wrapT(text,x,y,w,size,col){
  const words=text.split(' '); let line='',yy=y;
  for(const wd of words){ const test=line?line+' '+wd:wd;
    if(TW(test,size)>w){ T(line,x,yy,size,col); line=wd; yy+=17; } else line=test; }
  T(line,x,yy,size,col);
}
function drawSpellFx(kind,k){
  if(kind==='sprout'||kind==='hymn'){
    for(let i=0;i<7;i++){
      const h=Math.min(1,k*1.6)*62, a=i*1.05+Math.sin(G.t/200)*0.2;
      for(let s=0;s<h;s+=3){
        const x=EX+Math.sin(s/13+a)*(13+s*0.14), y=EY+34-s;
        px(b,Math.round(x),Math.round(y),3,3,s%12<6?'#4a9450':'#6fbc68'); } }
    if(k>0.55) for(let i=0;i<11;i++){
      const a=i*0.6+k*7, r=(k-0.55)*135;
      px(b,Math.round(EX+Math.cos(a)*r),Math.round(EY+Math.sin(a)*r),4,4,
        kind==='hymn'?'#ffe08a':'#8fe07a'); }
  } else if(kind==='waltz'){
    for(let s=0;s<3;s++){
      const p=clamp(k*1.5-s*0.18,0,1); if(p<=0||p>=1) continue;
      b.save(); b.translate(EX,EY+6); b.rotate(-0.9+p*2.4+s*0.5);
      for(let r=12;r<52;r+=4){ px(b,r,-2,4,4,'#7a4aa8'); px(b,r,-2,3,3,'#c88ae0'); }
      b.restore(); }
  } else if(kind==='req'){
    for(let i=0;i<10;i++){
      const a=i*0.63+k*9, r=48-k*36;
      px(b,Math.round(EX+Math.cos(a)*r),Math.round(EY+Math.sin(a)*r*0.6),5,4,'#e8b02a');
      px(b,Math.round(EX+Math.cos(a)*r),Math.round(EY+Math.sin(a)*r*0.6),3,2,'#3a2a12'); }
  } else if(kind==='thorn'){
    const rise=Math.min(1,k*1.8);
    for(let i=0;i<9;i++){
      const x=EX-45+i*11, h=rise*(66+((i*13)%26));
      for(let s=0;s<h;s+=3){
        px(b,x+Math.round(Math.sin(s/10+i)*4),Math.round(EY+45-s),4,4,s%15<7?'#3a2a5a':'#6b4a8a');
        if(s%21===0) px(b,x+5,Math.round(EY+45-s),3,3,'#e0d0f0'); } }
    if(k>0.62&&k<0.78){ b.globalAlpha=(0.78-k)/0.16; px(b,0,0,LW,LH,'#e8dcf7'); b.globalAlpha=1; }
  } else if(kind==='lull'){
    for(let i=0;i<11;i++){
      const a=i*0.63+G.t/400, r=24+Math.sin(G.t/300+i)*8;
      const y=KY-30-((k*90+i*10)%90);
      px(b,Math.round(KX+Math.cos(a)*r),Math.round(y),4,4,'#8fe07a');
      px(b,Math.round(KX+Math.cos(a)*r),Math.round(y),2,2,'#e0ffd0'); }
    const bo=Math.abs(Math.sin(G.t/180))*4;
    drawFrog(b,KX+34,KY-26-bo,G.t,0);
  } else if(kind==='kick'){
    if(k<0.5) for(let i=0;i<5;i++){
      const dx=KX+k*2*92-i*13;
      px(b,Math.round(dx),Math.round(KY-3-(i%2)*5),5,3,'#c9b48a'); }
    if(k>0.48&&k<0.72){
      const s=(k-0.48)/0.24;
      for(let i=0;i<11;i++){
        const a=-1.1+i*0.22, r=9+s*34;
        px(b,Math.round(EX-24+Math.cos(a)*r),Math.round(EY+16+Math.sin(a)*r),4,4,
          i%2?'#fff3b0':'#ffd24a'); }
      b.globalAlpha=1-s;
      px(b,EX-36,EY+9,15,4,'#ffffff'); px(b,EX-30,EY+3,4,15,'#ffffff');
      b.globalAlpha=1;
    }
  }
}
function drawBattle(dt){
  px(b,0,0,LW,LH,'#2c3a2a');
  for(let y=0;y<LH;y+=4) px(b,0,y,LW,2,'#2f3f2d');
  px(b,0,225,LW,LH-225,'#3f5a34');
  for(let x=0;x<LW;x+=7) px(b,x,225+((x*3)%9),3,3,'#4c6c3e');
  if(B.shake>0) B.shake-=dt;
  if(B.flash>0) B.flash-=dt;
  let k=0;
  if(B.anim){
    B.anim.t+=dt; k=clamp(B.anim.t/B.anim.dur,0,1);
    if(!B.anim.hit&&k>=0.55){ B.anim.hit=true; if(B.anim.onHit) B.anim.onHit(); }
    if(k>=1){ const kind=B.anim.kind; B.anim=null; if(kind!=='enemy') afterHit(); }
  }
  const sh=B.shake>0?Math.round(Math.sin(G.t/25)*3):0;
  const eL=(B.anim&&B.anim.kind==='enemy')?Math.round(Math.sin(k*Math.PI)*-38):0;
  const bob=Math.round(Math.sin(G.t/420)*2);
  b.globalAlpha=.22; b.fillStyle='#1a2810';
  b.beginPath(); b.ellipse(EX+sh+eL,EY+52,30,7,0,0,7); b.fill(); b.globalAlpha=1;
  if(!drawEnemyArt(b,B.species,EX+sh+eL,EY+52+bob,2)){
    b.save(); b.translate(EX+sh+eL-20,EY+bob-30); b.scale(2.2,2.2);
    blitS(b,S_HOA,M_HOA,0,0,1); b.restore();
  }
  if(B.flash>0){ b.globalAlpha=B.flash/600; px(b,EX-52,EY-40,104,96,'#ffffff'); b.globalAlpha=1; }
  let kx=KX,ky=KY,rot=0;
  if(B.anim&&B.anim.kind==='kick'){
    const run=k<0.5?(k/0.5):1-((k-0.5)/0.5);
    kx=KX+Math.pow(run,0.8)*54;
  } else if(B.anim&&B.anim.kind!=='enemy'){ kx=KX+Math.sin(k*Math.PI)*8; }
  b.save(); b.translate(kx,ky); b.rotate(rot);
  b.globalAlpha=.24; b.fillStyle='#1a2810';
  b.beginPath(); b.ellipse(0,0,21,6,0,0,7); b.fill(); b.globalAlpha=1;
  drawBattleK(b,0,0,G.swim,k);
  b.restore();
  if(B.anim) drawSpellFx(B.anim.kind,k);
  if(B.shout){ B.shout.t-=dt; if(B.shout.t<=0) B.shout=null; }
  B.fx.forEach(f=>{ f.t-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=dt*f.g;
    b.globalAlpha=Math.min(1,f.t/300); px(b,Math.round(f.x),Math.round(f.y),4,4,f.col); b.globalAlpha=1; });
  B.fx=B.fx.filter(f=>f.t>0);
  bar(18,46,180,10,B.hp,B.maxhp,'#e0603a','#4a2a20');
  bar(144,206,120,10,G.player.hp,G.player.maxhp,'#e04a4a','#5a2828');
  bar(144,221,120,9,G.player.mp,maxMp(),'#4aa8e0','#20415a');
  px(b,12,237,336,39,'#2b1c12'); px(b,15,240,330,33,'#f3ead2');
  const ms=moveList(), top=282, rowH=25;
  const pick=B.turn==='player';
  if(!B.over) ms.forEach((mv,i)=>menuRow(15,top+i*rowH,225,23,pick&&i===B.idx,G.player.mp<mv.mp));
  if(!B.over){ const sel=pick&&B.idx===ms.length;
    if(sel){ px(b,248,top-1,92,25,'#a8781e'); px(b,250,top+1,88,21,'#e8b8a0'); fluteCursor(282,top+11); }
    else px(b,249,top,90,23,'#c9a08a'); }
  if(B.over) panel(36,294,288,99);
  m.drawImage(buf,0,0);
  T(B.name+(B.boss?"  ★BOSS":""),18,40,28,'#f0e6d2',null,true);
  T("Kaitlyn  Lv."+G.player.lv,18,214,25,'#f0e6d2');
  T("HP",128,214,20,'#f0a0a0','right'); T("MP",128,229,20,'#8fd0f0','right');
  wrapT(B.log,24,258,318,24,'#3a2a1a');
  B.pops.forEach(p=>{ p.t-=dt; p.y-=dt*0.03;
    m.globalAlpha=Math.min(1,p.t/400); T(p.txt,p.x,p.y,40,p.col,'center',true); m.globalAlpha=1; });
  B.pops=B.pops.filter(p=>p.t>0);
  if(B.shout){
    const sx=clamp(kx,60,300), sy=KY-142;
    const w=TW(B.shout.txt,26,true)+22;
    m.globalAlpha=Math.min(1,B.shout.t/300);
    m.fillStyle='#2b1c12'; m.fillRect((sx-w/2-2)*SC,(sy-2)*SC,(w+4)*SC,26*SC);
    m.fillStyle='#fff6d8'; m.fillRect((sx-w/2)*SC,sy*SC,w*SC,22*SC);
    m.fillStyle='#2b1c12'; m.fillRect((sx-5)*SC,(sy+22)*SC,10*SC,7*SC);
    T(B.shout.txt,sx,sy+17,26,'#3a2a1a','center',true);
    m.globalAlpha=1;
  }
  if(B.over){
    T(B.over==='win'?"Victory!":B.over==='lose'?"Defeated":"Escaped",180,333,34,'#3a2a1a','center',true);
    T("tap to continue",180,366,22,'#7a6a4a','center'); return;
  }
  ms.forEach((mv,i)=>{ const y=top+i*rowH, ok=G.player.mp>=mv.mp;
    T(mv.name,15+ROW_PAD+2,y+16,24,ok?'#3a2a1a':'#8a7a68',null,pick&&i===B.idx);
    T(mv.mp?mv.mp+" MP":"free",232,y+16,20,mv.mp?(ok?'#2a6a9a':'#a09080'):'#5a7a3a','right'); });
  T("Flee",B.idx===ms.length&&pick?308:294,top+16,24,'#3a2a1a','center',B.idx===ms.length&&pick);
  if(B.turn!=='player') T("...",180,440,26,'#f0e6d2','center');
}
