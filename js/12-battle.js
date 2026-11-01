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
  if(B.over){ if(!winGuard()) endBattle(); return; }
  if(B.turn!=='player')return;
  /* B.idx runs over the moves, and one past the last move is Flee */
  const ms=moveList(), flee=ms.length, n=ms.length+1;
  if(isUp(k)) B.idx=(B.idx+n-1)%n;
  if(isDown(k)) B.idx=(B.idx+1)%n;
  if(isOk(k)){ if(B.idx===flee) tryFlee(); else useMove(ms[B.idx]); }
  /* cancel points at Flee first, so a stray press doesn't run away */
  if(isBack(k)){ if(B.idx===flee) tryFlee(); else B.idx=flee; }
}
function battleTouch(x,y){
  if(!B)return;
  if(B.over){ if(!winGuard()) endBattle(); return; }
  if(B.turn!=='player')return;
  /* a tap on a command uses it straight away (the last line is Flee) */
  const ms=moveList(), W=battleWins(), C=W.cmd;
  if(x<C.x||x>C.x+C.w) return;
  const i=Math.floor((y-cmdTop(W))/CMD_ROW);
  if(i>=0&&i<ms.length){ B.idx=i; useMove(ms[i]); }
  else if(i===ms.length){ B.idx=i; tryFlee(); }
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
/* ---------- victory: rewards are given at once, the screen then shows them ---------- */
const SEED_LOOT=0.10, WIN_DELAY=250, WIN_FILL=900, WIN_GUARD=350;
function winRewards(){
  const P=PESTS[B.species], pl=G.player;
  const seed=Math.random()<SEED_LOOT&&G.unlocked.length?G.unlocked[ri(0,G.unlocked.length-1)]:null;
  B.win={xp:P.xp,coins:P.coin,seed,from:{lv:pl.lv,xp:pl.xp,next:pl.next},t:0};
  G.coins+=P.coin; if(seed) G.seeds[seed]=(G.seeds[seed]||0)+1;
  G.pests=G.pests.filter(p=>p!==B.pest);
  addXp(P.xp);
}
/* a moment's pause so the key that won the fight doesn't also close the screen */
const winGuard=()=>B.over==='win'&&B.win&&B.win.t<WIN_GUARD;
/* the XP bar as it fills, levelling up the same way addXp does */
function xpShown(){
  const w=B.win, k=clamp((w.t-WIN_DELAY)/WIN_FILL,0,1);
  let lv=w.from.lv, xp=w.from.xp+w.xp*k, next=w.from.next;
  while(xp>=next){ xp-=next; lv++; next=Math.floor(next*1.45); }
  return {lv,xp:Math.floor(xp),next,k};
}
function afterHit(){
  if(B.hp<=0){ B.over='win'; B.log="The "+B.name+" flees the garden!"; playOne('victory',0.6); winRewards(); return; }
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
  if(B.over==='win'){ const w=B.win;      /* rewards were given when the fight was won */
    if(G.player.lv===w.from.lv)
      say((P.boss?"The HOA President retreats! ":"Won!  ")+"+"+w.coins+"c  +"+w.xp+"xp"+(w.seed?"  + a seed":"")); }
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
/* ---------------- the battle screen ----------------
   A painted garden backdrop for the season and hour, and classic RPG windows:
   message along the top, the pest's name and HP, then commands, Kaitlyn's status
   and the highlighted move's details along the bottom. */
const BWIN={msg:{x:8,y:8,w:344,h:34}, foe:{x:8,y:48,w:176,h:38},
            cmd:{x:8,y:318,w:202,h:156}, stat:{x:216,y:318,w:136,h:78}, info:{x:216,y:400,w:136,h:74}};
const CMD_ROW=17, HORIZON=150;
/* On tall screens the top windows move up to the screen's top edge and the bottom
   ones down to its bottom edge, so the fight fills the whole phone. */
function battleWins(){
  const up=-EXTRA/2, dn=EXTRA/2, s=(r,d)=>({x:r.x,y:r.y+d,w:r.w,h:r.h});
  return {msg:s(BWIN.msg,up),foe:s(BWIN.foe,up),cmd:s(BWIN.cmd,dn),stat:s(BWIN.stat,dn),info:s(BWIN.info,dn),dn};
}
const cmdTop=W=>W.cmd.y+8;
const BACKDROP={
  spring:{sky:['#86c4ee','#e6f2dc'],far:'#6aa45e',near:'#4f8c48',ground:['#78b45a','#4a8638'],dots:['#f4a8c8','#f7e48a','#ffffff'],drift:'petal'},
  summer:{sky:['#5eb2ee','#f2f0cc'],far:'#4a944a',near:'#357a36',ground:['#68aa4c','#3c7a2e'],dots:['#f6d64a','#ff8a5a','#ffffff'],drift:null},
  fall:  {sky:['#e6a874','#fae2c2'],far:'#c8682c',near:'#a04a22',ground:['#b8923e','#86662a'],dots:['#e8743a','#f0b040'],drift:'leaf'},
  winter:{sky:['#a6c6e6','#f0f5fa'],far:'#d4e0ec',near:'#b8cadc',ground:['#f2f6fa','#cad8e6'],dots:[],drift:'snow'}};
/* a classic window: dark outline, light rim, deep-blue gradient with a soft sheen */
function rpgWin(r){
  const {x,y,w,h}=r;
  b.fillStyle='rgba(0,0,0,.35)'; b.beginPath(); b.roundRect(x+1.5,y+2.5,w,h,6); b.fill();
  b.fillStyle='#0a0f2a'; b.beginPath(); b.roundRect(x-1,y-1,w+2,h+2,7); b.fill();
  b.fillStyle='#e6eaf6'; b.beginPath(); b.roundRect(x,y,w,h,6); b.fill();
  const g=b.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#3d55b0'); g.addColorStop(1,'#141b52');
  b.fillStyle=g; b.beginPath(); b.roundRect(x+2,y+2,w-4,h-4,4.5); b.fill();
  b.fillStyle='rgba(255,255,255,.07)'; b.beginPath(); b.roundRect(x+3,y+3,w-6,(h-6)*0.42,3.5); b.fill();
}
/* a gauge in a window: dark track, bright fill with a highlight */
function gauge(x,y,w,h,v,max,col,hi){
  b.fillStyle='#0a0f2a'; b.beginPath(); b.roundRect(x-1,y-1,w+2,h+2,(h+2)/2); b.fill();
  b.fillStyle='#262c5c'; b.beginPath(); b.roundRect(x,y,w,h,h/2); b.fill();
  const f=Math.max(0,Math.round(w*clamp(v/max,0,1)));
  if(f>0){ b.fillStyle=col; b.beginPath(); b.roundRect(x,y,f,h,h/2); b.fill();
    b.fillStyle=hi; b.fillRect(x+h/2,y+1,Math.max(0,f-h),Math.max(1,h/3)); }
}
/* text with a dark shadow, for the blue windows and the scene */
function TS(t,x,y,size,col,align,bold){ T(t,x+0.8,y+0.8,size,'#0a0f2a',align,bold); T(t,x,y,size,col,align,bold); }
/* text with a full dark outline (damage numbers, the victory banner) */
function TO(t,x,y,size,col,align,bold,w){ const o=w||1.2;
  for(const [dx,dy] of [[-o,0],[o,0],[0,-o],[0,o],[-o,-o],[o,o],[-o,o],[o,-o]]) T(t,x+dx,y+dy,size,'#1a1430',align,bold);
  T(t,x,y,size,col,align,bold); }
function drawBattleBackdrop(dt){
  const P=BACKDROP[season()]||BACKDROP.spring, T0=BAND_TOP(), T1=BAND_BOT();
  const sky=b.createLinearGradient(0,T0,0,HORIZON);
  sky.addColorStop(0,P.sky[0]); sky.addColorStop(1,P.sky[1]);
  b.fillStyle=sky; b.fillRect(0,T0,LW,HORIZON-T0);
  /* soft clouds */
  b.fillStyle='rgba(255,255,255,.5)';
  for(let i=0;i<4;i++){ const cx=((G.t*0.006+i*110)%(LW+160))-80, cy=40+((i*37)%60);
    b.beginPath(); b.ellipse(cx,cy,34,9,0,0,7); b.fill(); b.beginPath(); b.ellipse(cx+18,cy-5,20,8,0,0,7); b.fill(); }
  /* distant trees, then the near hedge along the horizon */
  b.fillStyle=P.far;
  for(let i=-1;i<13;i++){ const x=i*32+((i*13)%11); b.beginPath(); b.ellipse(x,HORIZON-4,24,20+((i*7)%10),0,0,7); b.fill(); }
  b.fillStyle=P.near;
  for(let i=-1;i<20;i++){ const x=i*20+((i*7)%9); b.beginPath(); b.ellipse(x,HORIZON+4,14,11+((i*5)%5),0,0,7); b.fill(); }
  P.dots.forEach((c,k)=>{ b.fillStyle=c; for(let i=0;i<14;i++){ const x=((i*53+k*29)%LW), y=HORIZON-2+((i*17+k*11)%10);
    b.beginPath(); b.arc(x,y,1.6,0,7); b.fill(); } });
  /* the lawn, with mowing stripes that widen toward the front */
  const gr=b.createLinearGradient(0,HORIZON,0,T1);
  gr.addColorStop(0,P.ground[0]); gr.addColorStop(1,P.ground[1]);
  b.fillStyle=gr; b.fillRect(0,HORIZON+8,LW,T1-HORIZON-8);
  b.fillStyle='rgba(255,255,255,.05)';
  for(let i=0,y=HORIZON+10;y<T1;i++){ const hgt=4+i*3; if(i%2===0) b.fillRect(0,y,LW,hgt); y+=hgt; }
  /* light pools where the two of them stand */
  b.fillStyle='rgba(255,255,240,.16)';
  b.beginPath(); b.ellipse(EX,EY+54,62,14,0,0,7); b.fill();
  b.beginPath(); b.ellipse(KX+6,KY+2,48,11,0,0,7); b.fill();
  /* petals, leaves or snow drifting across */
  if(P.drift){
    if(!B.amb) B.amb=[];
    if(B.amb.length<18&&Math.random()<dt/260) B.amb.push({x:rnd(-20,LW),y:T0-6,vx:rnd(0.004,0.02),vy:rnd(0.012,0.03),
      a:rnd(0,6.3),t:0});
    const col=P.drift==='snow'?'#ffffff':P.drift==='leaf'?'#d8642a':'#f6b8d0';
    B.amb.forEach(p=>{ p.t+=dt; p.x+=p.vx*dt+Math.sin((p.t+p.a*300)/500)*0.12; p.y+=p.vy*dt;
      b.fillStyle=col; b.globalAlpha=.85; b.beginPath();
      if(P.drift==='snow') b.arc(p.x,p.y,1.4,0,7); else b.ellipse(p.x,p.y,2.6,1.4,p.t/300+p.a,0,7);
      b.fill(); b.globalAlpha=1; });
    B.amb=B.amb.filter(p=>p.y<T1+6);
  }
  /* the colour of the hour, gentler than in the garden so the fight stays readable */
  const t=tintAt(G.clock/60);
  if(t.a>0.002){ b.save(); b.globalCompositeOperation='multiply'; b.globalAlpha=t.a*0.6;
    b.fillStyle='rgb('+t.rgb.join(',')+')'; b.fillRect(0,T0,LW,T1-T0); b.restore(); }
}
/* what the highlighted command does, for the info window */
function cmdInfo(mv){
  if(!mv) return B.boss?["You can't run from","the HOA President!"]:["Run back to the","garden (55% chance)"];
  if(mv.id==='kick') return ["A quick kick","Free · power x"+mv.pow];
  const L=[mv.notes+"-note song · "+mv.mp+" MP"];
  if(mv.pow>0) L.push("Power x"+mv.pow+(mv.weaken?", weakens":""));
  if(mv.heal) L.push("Heals about "+mv.heal+" HP");
  return L;
}
function drawBattle(dt){
  if(B.shake>0) B.shake-=dt;
  if(B.flash>0) B.flash-=dt;
  let k=0;
  if(B.anim){
    B.anim.t+=dt; k=clamp(B.anim.t/B.anim.dur,0,1);
    if(!B.anim.hit&&k>=0.55){ B.anim.hit=true; if(B.anim.onHit) B.anim.onHit(); }
    if(k>=1){ const kind=B.anim.kind; B.anim=null; if(kind!=='enemy') afterHit(); }
  }
  if(B.win) B.win.t+=dt;
  drawBattleBackdrop(dt);
  const sh=B.shake>0?Math.round(Math.sin(G.t/25)*3):0;
  const eL=(B.anim&&B.anim.kind==='enemy')?Math.round(Math.sin(k*Math.PI)*-38):0;
  const bob=Math.round(Math.sin(G.t/420)*2);
  const gone=B.win?clamp(B.win.t/450,0,1):0;          /* the beaten pest fades away */
  b.globalAlpha=.25*(1-gone); b.fillStyle='#1a2810';
  b.beginPath(); b.ellipse(EX+sh+eL,EY+52,30,7,0,0,7); b.fill(); b.globalAlpha=1-gone;
  if(!drawEnemyArt(b,B.species,EX+sh+eL,EY+52+bob,2)){
    b.save(); b.translate(EX+sh+eL-20,EY+bob-30); b.scale(2.2,2.2);
    blitS(b,S_HOA,M_HOA,0,0,1); b.restore();
  }
  b.globalAlpha=1;
  if(B.flash>0){ b.globalAlpha=B.flash/600; px(b,EX-52,EY-40,104,96,'#ffffff'); b.globalAlpha=1; }
  let kx=KX,ky=KY;
  if(B.anim&&B.anim.kind==='kick'){
    const run=k<0.5?(k/0.5):1-((k-0.5)/0.5);
    kx=KX+Math.pow(run,0.8)*54;
  } else if(B.anim&&B.anim.kind!=='enemy'){ kx=KX+Math.sin(k*Math.PI)*8; }
  b.save(); b.translate(kx,ky);
  b.globalAlpha=.25; b.fillStyle='#1a2810';
  b.beginPath(); b.ellipse(0,0,21,6,0,0,7); b.fill(); b.globalAlpha=1;
  drawBattleK(b,0,0,G.swim,k);
  b.restore();
  if(B.anim) drawSpellFx(B.anim.kind,k);
  if(B.shout){ B.shout.t-=dt; if(B.shout.t<=0) B.shout=null; }
  const won=B.over==='win'&&B.win, xs=won?xpShown():null;
  /* victory sparkles */
  if(won&&B.win.t<1600&&Math.random()<dt/40)
    B.fx.push({x:rnd(30,330),y:rnd(40,200),vx:rnd(-0.02,0.02),vy:rnd(-0.06,-0.01),t:700,col:Math.random()<0.5?'#ffe08a':'#ffffff',g:0.00005});
  B.fx.forEach(f=>{ f.t-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=dt*f.g;
    b.globalAlpha=Math.min(1,f.t/300); px(b,Math.round(f.x),Math.round(f.y),3,3,f.col); b.globalAlpha=1; });
  B.fx=B.fx.filter(f=>f.t>0);

  const ms=moveList(), pick=B.turn==='player'&&!B.over, W=battleWins(), dn=W.dn, CMD_TOP=cmdTop(W);
  if(!B.over){
    rpgWin(W.msg); rpgWin(W.foe); rpgWin(W.cmd); rpgWin(W.stat); rpgWin(W.info);
    gauge(W.foe.x+10,W.foe.y+25,W.foe.w-20,6,B.hp,B.maxhp,'#e8604a','#ffb09a');
    gauge(W.stat.x+30,W.stat.y+30,W.stat.w-40,6,G.player.hp,G.player.maxhp,'#e8504a','#ffa8a0');
    gauge(W.stat.x+30,W.stat.y+56,W.stat.w-40,6,G.player.mp,maxMp(),'#4aa8f0','#b0e0ff');
    if(pick){ const y=CMD_TOP+B.idx*CMD_ROW;
      b.fillStyle='rgba(150,180,255,.28)'; b.beginPath(); b.roundRect(W.cmd.x+6,y,W.cmd.w-12,CMD_ROW-1,4); b.fill();
      fluteCursor(W.cmd.x+32,y+CMD_ROW/2); }
  } else if(won){
    rpgWin({x:20,y:250+dn,w:320,h:190});
    gauge(40,334+dn,280,9,xs.xp,xs.next,'#f0c84a','#fff0b0');
    if(B.win.seed) drawShopPic(SPECIES[B.win.seed].name.toLowerCase()+" seed",52,392+dn,18,24);
  } else rpgWin({x:60,y:300+dn,w:240,h:84});
  blit();

  if(!B.over){
    wrapLines(B.log,19,W.msg.w-16).slice(0,2).forEach((ln,i,a)=>
      TS(ln,W.msg.x+10,W.msg.y+(a.length>1?14:21)+i*13,19,'#f4f6ff'));
    TS(B.name+(B.boss?"  ★":""),W.foe.x+10,W.foe.y+17,20,B.boss?'#ffd870':'#f4f6ff',null,true);
    TS("Kaitlyn",W.stat.x+8,W.stat.y+16,20,'#f4f6ff',null,true);
    TS("Lv."+G.player.lv,W.stat.x+W.stat.w-8,W.stat.y+16,18,'#c8d4ff','right');
    TS("HP",W.stat.x+8,W.stat.y+37,16,'#ffb0a8',null,true);
    TS(G.player.hp+"/"+G.player.maxhp,W.stat.x+W.stat.w-8,W.stat.y+27,15,'#f4f6ff','right');
    TS("MP",W.stat.x+8,W.stat.y+63,16,'#a8d8ff',null,true);
    TS(G.player.mp+"/"+maxMp(),W.stat.x+W.stat.w-8,W.stat.y+53,15,'#f4f6ff','right');
    ms.concat([null]).forEach((mv,i)=>{ const y=CMD_TOP+i*CMD_ROW+12.5, ok=!mv||G.player.mp>=mv.mp;
      const col=!pick?'#9aa4d0':ok?'#f4f6ff':'#7c84b0';
      TS(mv?mv.name:"Flee",W.cmd.x+36,y,19,col,null,pick&&i===B.idx);
      if(mv) TS(mv.mp?mv.mp+" MP":"free",W.cmd.x+W.cmd.w-10,y,16,ok?(mv.mp?'#a8d8ff':'#b8f0a0'):'#7c84b0','right'); });
    const info=pick?cmdInfo(ms[B.idx]):["..."];
    info.forEach((ln,i)=>TS(ln,W.info.x+9,W.info.y+18+i*15,16,i?'#c8d4ff':'#f4f6ff',null,i===0));
  }
  B.pops.forEach(p=>{ p.t-=dt; p.y-=dt*0.03;
    const hop=Math.max(0,Math.sin((1100-p.t)/140))*6*Math.max(0,(p.t-600)/500);
    m.globalAlpha=Math.min(1,p.t/400); TO(p.txt,p.x,p.y-hop,40,p.col,'center',true,1.6); m.globalAlpha=1; });
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
  if(won){
    const w=B.win, up=xs.lv>w.from.lv, pop=clamp(w.t/280,0,1);
    /* the banner drops in and settles */
    const size=Math.round(58+(1-pop)*30), by=96-(1-pop)*20;
    m.globalAlpha=pop; TO("VICTORY!",180,by,size,'#ffd24a','center',true,2.2);
    T("VICTORY!",180,by-size*0.04,size,'rgba(255,250,210,.35)','center',true); m.globalAlpha=1;
    TS("EXP",40,278+dn,20,'#c8d4ff',null,true); TS("+"+Math.round(w.xp*xs.k),320,278+dn,22,'#ffe08a','right',true);
    TS("Coins",40,300+dn,20,'#c8d4ff',null,true); TS("+"+Math.round(w.coins*xs.k)+"c",320,300+dn,22,'#ffe08a','right',true);
    TS("Kaitlyn  Lv."+xs.lv,40,327+dn,20,'#f4f6ff',null,true);
    if(up&&Math.floor(G.t/240)%2===0) TS("LEVEL UP!",168,327+dn,19,'#ffb04a',null,true);
    TS(xs.xp+" / "+xs.next,320,327+dn,17,'#c8d4ff','right');
    TS((xs.next-xs.xp)+" EXP to the next level",180,358+dn,17,'#aab6e8','center');
    if(w.seed) TS("Found: "+SPECIES[w.seed].name+" seed!",70,397+dn,20,'#b8f0a0',null,true);
    else TS("No seeds this time.",180,397+dn,18,'#8a94c4','center');
    if(!winGuard()&&Math.floor(G.t/500)%2===0) TS(IS_TOUCH?"tap to continue":"J / tap to continue",180,428+dn,17,'#c8d4ff','center');
    return;
  }
  if(B.over){
    TS(B.over==='lose'?"Defeated...":"Got away!",180,334+dn,30,'#f4f6ff','center',true);
    TS(IS_TOUCH?"tap to continue":"J / tap to continue",180,364+dn,17,'#c8d4ff','center');
  }
}
