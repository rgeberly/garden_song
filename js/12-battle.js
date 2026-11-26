/* ================================================================
   BATTLE
   The party (Kaitlyn and up to four friends, G.party) against a pest and maybe a few
   of its friends (B.foes, never more than the party). Every round, everyone still
   standing acts once, quickest (Agility) first: party members pick Attack, Skills,
   Meditate, Items or Flee, then who it's for when there's a choice; each pest uses
   one of its skills (PESTS). Poison, sleep and the like (STATUS) tick at the start
   of each turn. If Kaitlyn falls the fight is lost; a friend who falls goes home
   hurt for a couple of days.
   ================================================================ */
/* the foe in focus (being hit, or acting): about its middle; see focus() */
let EX=262, EY=210;
/* Where the party stands (feet): one fixed spot for each of the five party spots
   (G.slots), top to bottom, an arrowhead with the middle one (Kaitlyn's, to begin with)
   at its tip. Whoever is in a spot stands there, however many are along.
   The foes stand on the right, a little smaller when there are more of them; four or
   five follow one of BATTLE_LAYOUTS (the first pest's spot first). */
/* (spread a little further apart top to bottom; Kaitlyn's spot, the middle, a little lower
   so she doesn't hide the face of whoever stands above her) */
const PARTY_SPOTS=[[86,194],[42,229],[132,270],[40,301],[88,334]];
const FOE_FORM={1:[[262,262]],2:[[250,236],[300,300]],3:[[300,206],[238,258],[306,316]]};   /* three zigzag so none hides another */
const BATTLE_LAYOUTS={
  rows: {4:[[240,262],[222,204],[228,318],[306,262]],              /* three in front, two behind */
         5:[[240,262],[222,204],[228,318],[306,232],[312,292]]},
  arrow:{4:[[232,262],[276,214],[276,310],[320,262]],              /* an arrowhead pointing at the party */
         5:[[232,262],[276,214],[276,310],[318,238],[320,288]]}};
let BATTLE_LAYOUT='rows';
const foeForm=n=>n>3?BATTLE_LAYOUTS[BATTLE_LAYOUT][n]:FOE_FORM[n];
const FOE_SCALE={1:1,2:0.9,3:0.8,4:0.74,5:0.68}, FLY_LIFT=30;   /* flyers hover this high over their shadow */
/* the backdrop's depth: anyone standing further back (higher up) is drawn a little smaller,
   anyone nearer a little bigger, all the same at Kaitlyn's usual spot */
const DEPTH_Y=262, DEPTH_K=0.0013;
const depthScale=y=>clamp(1+(y-DEPTH_Y)*DEPTH_K,0.8,1.1);
/* The spots above are for a screen of LH. On a taller one (the windows sit lower) the
   field stretches down to fill the space: everyone spreads out top to bottom, keeping the
   size their spot gives them. The same on every backdrop. */
const FIELD_TOP=196, FIELD_BOT=330;
function fieldY(y){
  const dn=Math.max(0,BAND_BOT()-LH), top=FIELD_TOP+dn*0.15, bot=FIELD_BOT+dn*0.9;
  return top+(y-FIELD_TOP)*(bot-top)/(FIELD_BOT-FIELD_TOP);
}
const CMDS=['attack','skills','meditate','focus','items','flee'];
const CMD_VIS=5;                     /* rows the commands window shows; it scrolls to the rest (Flee) */
const KILL_CHANCE=0.10;              /* Ivy's venom can finish a (non-boss) foe outright */
const EXTRA_FOE=0.7;                 /* the chance of one more pest for each friend along */
/* how many pests a full party of five meets: n pests, w the chance in 100 */
const FULL_PARTY_FOES=[{n:1,w:10},{n:2,w:20},{n:3,w:40},{n:4,w:20},{n:5,w:10}];
const KARATE_SHOUTS=["Hi-YAH!","KIAI!","Hwaa-CHA!","Tatsumaki senpukyaku!","Aboykiblooken!"];
let B=null;
const listAnd=L=>L.length<2?L.join(''):L.slice(0,-1).join(", ")+" and "+L[L.length-1];
/* kinds: exactly which pests (for tests); otherwise friends of the pest may tag along */
/* ---------- into a battle ----------
   The screen as it was freezes, flashes, and shatters: its pieces spin away from the
   middle and fall into the dark, with streaks of light bursting out. The battle is set up
   in the dark (startBattle, when BI_SETUP comes), then fades in over BI_FADE. Anything slow
   to set up happens out of sight. */
const BI_FLASH=170, BI_SETUP=900, BI_FADE=420, BI_COLS=7, BI_ROWS=12;
let BI=null;
function enterBattle(pest,kinds){
  const cv=m.canvas, snap=document.createElement('canvas'); snap.width=cv.width; snap.height=cv.height;
  snap.getContext('2d').drawImage(cv,0,0);
  const W=cv.width, H=cv.height, ox=W/2, oy=H*0.45, pw=W/BI_COLS, ph=H/BI_ROWS, shards=[];
  for(let r=0;r<BI_ROWS;r++) for(let c=0;c<BI_COLS;c++){
    const x=c*pw, y=r*ph, cx=x+pw/2-ox, cy=y+ph/2-oy, d=Math.hypot(cx,cy)||1, sp=rnd(0.5,1.1)*W/1000;
    shards.push({x,y,w:pw,h:ph,vx:cx/d*sp+rnd(-0.1,0.1)*W/1000,vy:cy/d*sp*0.7-rnd(0.1,0.35)*W/1000,
      vr:rnd(-0.006,0.006),delay:(d/Math.hypot(ox,oy))*120+rnd(0,40)}); }
  BI={t:0,pest,kinds,snap,shards,ox,oy,set:false};
  G.scene='battleIn'; sfx('battle_start'); setMusic(PESTS[pest.species].boss?'boss':'battle');
}
/* drawn over the whole screen, after everything else */
function drawBattleIn(dt){
  const I=BI; if(!I) return; I.t+=dt;
  const c=m, W=c.canvas.width, H=c.canvas.height, t=I.t;
  c.save(); c.setTransform(1,0,0,1,0,0); c.fillStyle='#000'; c.fillRect(0,0,W,H);
  if(t<BI_FLASH){                                 /* the frozen screen, flashing white */
    c.drawImage(I.snap,0,0); c.fillStyle='rgba(255,255,255,'+(0.75*Math.sin(Math.PI*t/BI_FLASH))+')'; c.fillRect(0,0,W,H); }
  else {
    const g=W/1000*0.0016, k=t-BI_FLASH;
    /* streaks of light bursting out from the middle */
    c.globalCompositeOperation='lighter';
    let sd=7; const r=()=>(sd=(sd*16807+11)%2147483647)/2147483647;
    for(let i=0;i<26;i++){ const a=r()*TAU, len=(0.2+r()*0.5)*W, p=Math.min(1,k/260), fade=Math.max(0,1-k/520);
      if(fade<=0) break; const r0=p*len*0.9, r1=r0+len*0.35*(1-p*0.5);
      c.strokeStyle='rgba(255,240,200,'+(0.9*fade)+')'; c.lineWidth=(3+r()*5)*W/1000*SC; c.lineCap='round';
      c.beginPath(); c.moveTo(I.ox+Math.cos(a)*r0,I.oy+Math.sin(a)*r0); c.lineTo(I.ox+Math.cos(a)*r1,I.oy+Math.sin(a)*r1); c.stroke(); }
    c.globalCompositeOperation='source-over';
    /* the pieces, spinning off and falling, shrinking and darkening as they go */
    I.shards.forEach(s=>{ const u=Math.max(0,k-s.delay); if(u<=0){ c.drawImage(I.snap,s.x,s.y,s.w,s.h,s.x,s.y,s.w,s.h); return; }
      const x=s.x+s.w/2+s.vx*u, y=s.y+s.h/2+s.vy*u+g*u*u, sc=Math.max(0,1-u/700), a=Math.max(0,1-u/620);
      if(a<=0) return;
      c.save(); c.translate(x,y); c.rotate(s.vr*u); c.scale(sc,sc); c.globalAlpha=a;
      c.drawImage(I.snap,s.x,s.y,s.w,s.h,-s.w/2,-s.h/2,s.w,s.h);
      c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=2*W/1000*SC/2; c.strokeRect(-s.w/2,-s.h/2,s.w,s.h);
      c.fillStyle='rgba(0,0,0,'+(1-a)*0.6+')'; c.fillRect(-s.w/2,-s.h/2,s.w,s.h);
      c.restore(); });
  }
  c.restore();
  /* in the dark: the battle is set up, then fades in */
  if(t>=BI_SETUP&&!I.set){ I.set=true; startBattle(I.pest,I.kinds,true); BI=null; B.introT=0; }
}
/* the battle fading in from black (over the windows and buttons too) */
function drawBattleFadeIn(dt){
  if(!B||B.introT==null||B.introT>=BI_FADE) return;
  B.introT+=Math.min(dt,40);
  const c=m, a=1-clamp(B.introT/BI_FADE,0,1); if(a<=0) return;
  c.save(); c.setTransform(1,0,0,1,0,0); c.fillStyle='rgba(0,0,0,'+a+')'; c.fillRect(0,0,c.canvas.width,c.canvas.height); c.restore();
}
function startBattle(pest,kinds,quiet){
  padVec={x:0,y:0}; padId=null; btnHeld=false;        /* a held pad must not scroll the menu */
  const slots=partySlots(), party=G.party.filter(id=>!isHurt(id)), boss=!!PESTS[pest.species].boss;
  const spot={}; slots.forEach((id,i)=>{ if(id) spot[id]=i; });       /* each one's spot (PARTY_SPOTS) */
  /* one more for each extra member, most of the time; a full party of five meets 1-5
     (FULL_PARTY_FOES) */
  if(!kinds){ kinds=[pest.species];
    const more=boss?0:party.length===5?pickWeighted(FULL_PARTY_FOES).n-1
      :Array.from({length:party.length-1}).filter(()=>Math.random()<EXTRA_FOE).length;
    for(let i=0;i<more;i++){ const pool=pestPool(); kinds.push(pool[ri(0,pool.length-1)]); } }
  const D=diff();                      /* the Settings tab's difficulty */
  const foes=kinds.map((sp,i)=>{ const lv=i?pestLevel(sp):(pest.lv||PESTS[sp].lv), S=pestStats(sp,lv);
    S.hp=Math.round(S.hp*D.hp); S.atk*=D.atk;
    return {sp,lv,...S,maxhp:S.hp,hp:S.hp,name:PESTS[sp].name,boss:!!PESTS[sp].boss,
            slot:i,st:{},fade:0,flash:0,shake:0}; });
  /* the first pest keeps the middle spot; of the rest, flyers take the spots furthest back
     (they hover up into the sky there, not into whoever stands behind them) */
  const F=foeForm(foes.length), rest=foes.slice(1), spots=rest.map(f=>f.slot).sort((a,z)=>F[a][1]-F[z][1]);
  rest.sort((a,z)=>(PESTS[z.sp].fly?1:0)-(PESTS[a.sp].fly?1:0)).forEach((f,i)=>f.slot=spots[i]);
  /* two of a kind get letters */
  foes.forEach(f=>{ const same=foes.filter(g=>g.sp===f.sp); if(same.length>1) f.name+=" "+"ABCDE"[same.indexOf(f)]; });
  B={pest,foes,boss,party,spot, act:0, menu:'cmd', idx:0, sub:0, top:0, readyT:0,
     guard:{},                       /* members braced by Meditate or Focus */
     shell:{},                       /* members in their shell (Tex's Shell Up): hits on them quartered */
     cover:null,                     /* Tex's Cover: {by, to}, hits aimed at `to` go to `by` */
     charged:{},                     /* members whose next hit is doubled (Focus) */
     regen:{},                       /* members mending each turn: {n turns left, share of max HP} */
     st:{},                          /* members' troubles: st[id][status]=turns left */
     order:[], turn:'busy', tgt:null, inspect:null, prep:null, banner:null, lastFoe:foes[0],
     log:boss?"The HOA President demands a word!":foes.length===1?"A "+foes[0].name+" blocks your path!"
        :foes.length===2?listAnd(foes.map(f=>f.name))+" block your path!":"A party of pests blocks your path!",
     stolen:[],                      /* what Tituba has snitched this fight */
     wane:null,                      /* the troubles to count down when the next one acts (see wane) */
     over:null,pops:[],fx:[],anim:null,shout:null};
  B.party.forEach(id=>B.st[id]={});
  G.scene='battle'; setMusic(boss?'boss':'battle'); if(!quiet) sfx('battle_start'); partyImg(); backdropImg();
  foeLines();
  setTimeout(nextActor,quiet?BI_FADE+400:900);
}
/* the pests' ground lines (see groundLine), worked out now, before the first frame: read
   back in the middle of drawing one, each cost that frame tens of milliseconds */
function foeLines(){
  B.foes.forEach(f=>{ const p=foeSpot(f); if(p.lift) return;
    const art=c=>drawEnemyArt(c,f.sp,0,0,p.s), rec=[]; silhouette(art,'#000',rec,true);
    const key=rec.join('|'); if(!GROUND_LINE.has(key)){ const g=groundLine(art); if(g) GROUND_LINE.set(key,g); } });
}
const standing=id=>member(id).hp>0;
const actor=()=>B.party[B.act];
const liveFoes=()=>B.foes.filter(f=>f.hp>0);
const allDown=()=>!B.foes.some(f=>f.hp>0);
/* just over a member's head, for numbers that pop up */
const headOf=id=>{ const s=slotOf(id); return s.y-(id==='kaitlyn'?110:36*(MEMBER_SIZE[id]||1))*s.s; };
/* where a member stands (feet) and how big they're drawn there */
function slotOf(id){ const [x,y]=PARTY_SPOTS[B.spot[id]!==undefined?B.spot[id]:2]; return {x,y:fieldY(y),s:depthScale(y)}; }
/* where a foe stands: feet, size and how high it hovers */
function foeSpot(f){ const n=B.foes.length, [x,y]=foeForm(n)[f.slot];
  return {x,y:fieldY(y),s:FOE_SCALE[n]*(PESTS[f.sp].size||1)*depthScale(y),lift:PESTS[f.sp].fly?FLY_LIFT:0}; }
/* each side numbered top to bottom on the screen: the order Up and Down step through */
/* (a flyer counts where it's drawn, up in the air) */
const shownY=x=>{ if(typeof x!=='object') return slotOf(x).y; const p=foeSpot(x); return p.y-p.lift; };
const topDown=L=>L.slice().sort((a,z)=>shownY(a)-shownY(z));
/* point EX,EY (where hits and effects land) at a foe */
function focus(f){ if(!f) return; const p=foeSpot(f); EX=p.x; EY=p.y-p.lift-52*p.s; }
/* a foe's picture, as a box (taps, tags and the target pointer) */
function foeBox(f){ const p=foeSpot(f), a=typeof ENEMY_ART!=='undefined'&&ENEMY_ART[f.sp], k=p.s/SC;
  const w=a?a.r[2]*k:60*p.s, h=a?a.r[3]*k:60*p.s;
  return {x:p.x-(a?a.ax*k:w/2),y:p.y-p.lift-(a?a.ay*k:h),w,h}; }
function pop(txt,x,y,col,size){ B.pops.push({txt,x,y,t:1100,col,size,fx2:FX2}); }
/* Critical hits: a party member's hit lands extra hard now and then, more often the
   luckier they are */
/* (Tituba's claws add PARTY_INFO crit, and some skills B.critUp for their own hits) */
const CRIT_MUL=1.75, critChance=id=>0.03+statOf(id,'luk')*0.004+((PARTY_INFO[id]&&PARTY_INFO[id].crit)||0)+((B&&B.critUp)||0);
function burst(x,y,col,n,spd){
  if(FX2){ for(let i=0;i<(n||10);i++){ const a=rnd(0,Math.PI*2), sp=rnd(0.35,1)*(spd||0.13);     /* glowing, in FX2 */
    glow({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*0.6-0.06,drag:0.05,g:0.0002,size:rnd(2.6,4.2),life:rnd(450,700),col}); } return; }
  for(let i=0;i<(n||10);i++)
  B.fx.push({x,y,vx:rnd(-1,1)*(spd||0.13),vy:rnd(-0.19,0.03),t:520,col,g:0.001}); }

/* ---------- livelier effects (FX2) ----------
   A hit freezes everything for a moment (hit-stop), shakes the scene, knocks the pest back
   with a squash, and throws off glowing sparks and a ring of light; damage numbers pop in.
   Glows are soft round lights drawn with 'lighter', so overlapping light adds up and
   shines. Sprout Strike's vines are drawn smooth and leafy instead of from squares.
   ?oldfx in the address turns all this off, to compare. */
let FX2=!/[?&]oldfx\b/.test(location.search);
const TAU=Math.PI*2, GLOW_IMG={};
const hexA=(h,a)=>'rgba('+parseInt(h.slice(1,3),16)+','+parseInt(h.slice(3,5),16)+','+parseInt(h.slice(5,7),16)+','+a+')';
/* a soft round light of that colour, white at its heart (made once per colour) */
function glowImg(col){
  if(GLOW_IMG[col]) return GLOW_IMG[col];
  const cv=document.createElement('canvas'); cv.width=cv.height=64; const c=cv.getContext('2d');
  const g=c.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.2,hexA(col,0.95)); g.addColorStop(0.5,hexA(col,0.35)); g.addColorStop(1,hexA(col,0));
  c.fillStyle=g; c.fillRect(0,0,64,64); return GLOW_IMG[col]=cv;
}
/* one glowing particle: x,y, vx,vy (px/ms), g (gravity), drag (share of speed lost per
   16 ms), size (radius), life (ms), col; streak: stretched along its motion; ring: an
   expanding ring from r0 to r1, w thick; fin: fades in (rising motes) */
/* (outside battle, in the rhythm game and the garden, they go in a list of the scene's own,
   cleared when the scene changes: drawSceneGlow) */
let SCENE_GLOW=[], SCENE_GLOW_AT=null;
function glowList(){
  if(G.scene==='battle'&&B) return B.glow||(B.glow=[]);
  if(SCENE_GLOW_AT!==G.scene){ SCENE_GLOW_AT=G.scene; SCENE_GLOW=[]; }
  return SCENE_GLOW;
}
function glow(p){ glowList().push({t:0,life:600,size:5,vx:0,vy:0,g:0,drag:0,a:1,...p}); }
function drawSceneGlow(dt){ if(SCENE_GLOW_AT===G.scene) SCENE_GLOW=drawGlowL(SCENE_GLOW,dt); }
function drawGlow(dt){ B.glow=drawGlowL(B.glow,dt); }
function drawGlowL(L,dt){
  if(!L||!L.length) return L||[];
  b.save(); b.globalCompositeOperation='lighter';
  L.forEach(p=>{ p.t+=dt; const k=p.t/p.life; if(k>=1) return;
    const d=Math.pow(1-p.drag,dt/16); p.vx*=d; p.vy*=d; p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
    const a=p.a*(p.fin&&k<0.2?k/0.2:1)*Math.pow(1-k,p.ring?1.5:1.1);
    b.globalAlpha=a;
    if(p.ring){ const r=p.r0+(p.r1-p.r0)*(1-Math.pow(1-k,3));
      b.strokeStyle=hexA(p.col,1); b.lineWidth=p.w*(1-k)+0.6;
      b.beginPath(); b.ellipse(p.x,p.y,r,r*0.62,0,0,TAU); b.stroke(); return; }
    const s=p.size*(1-k*0.4);
    if(p.streak){ const v=Math.hypot(p.vx,p.vy), len=s+v*60;
      b.save(); b.translate(p.x,p.y); b.rotate(Math.atan2(p.vy,p.vx));
      b.drawImage(glowImg(p.col),-len,-s*0.55,len*2,s*1.1); b.restore(); return; }
    b.drawImage(glowImg(p.col),p.x-s,p.y-s,s*2,s*2); });
  b.restore(); b.globalAlpha=1;
  return L.filter(p=>p.t<p.life);
}
/* the scene shakes (mag px, for ms), easing off */
function quake(mag,ms){ if(!B.quake||B.quake.mag*B.quake.t/B.quake.ms<mag) B.quake={mag,t:ms,ms}; }
/* a blow landing at x,y: a flash, a ring of light and a spray of sparks */
const IMPACT={gold:['#fff2c0','#ffd060','#ffb830'],crit:['#fff2c0','#ff9a30','#ff8a20'],
  hurt:['#ffe4e0','#ff8a7a','#ff6050'],shield:['#e8f6ff','#9ad4ff','#7ac0ff']};
function impactFx(x,y,crit,pal){
  const k=crit?1.5:1, [core,ring,hot]=IMPACT[pal||(crit?'crit':'gold')];
  glow({x,y,size:24*k,life:170,col:core});
  glow({x,y,ring:true,r0:4,r1:30*k,w:3.5*k,life:340,col:ring});
  for(let i=0;i<(crit?18:12);i++){ const a=rnd(0,TAU), sp=rnd(0.12,0.32)*k;
    glow({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*0.75-0.04,drag:0.09,g:0.0004,size:rnd(3.2,5.4)*k,life:rnd(320,560),col:hot,streak:true}); }
}
/* Sprout Strike, FX2: vines curl up around the pest, leafing out as they grow, with green
   motes rising; when it lands they burst into leaves and light, then wither away */
const VINE={sprout:{dark:'#24552b',stem:'#6cc35e',leafD:'#3f8f45',leaf:'#8fe07a',mote:['#8fe07a','#e8ffb0'],bud:'#b8f890',flash:'#c8f8a0',ring:'#9ee880',spark:['#8fe07a','#fff6b0']},
  hymn:{dark:'#7a5a18',stem:'#e8c050',leafD:'#b88a2a',leaf:'#ffe08a',mote:['#ffd060','#fff6c8'],bud:'#fff0a0',flash:'#fff0b0',ring:'#ffd870',spark:['#ffd060','#ffffff']}};
function drawSproutFx2(k,kind){
  const V=VINE[kind||'sprout'], A=B.anim, gx=EX, gy=EY+38, grow=Math.min(1,k*1.8), fade=k<0.6?1:Math.max(0,1-(k-0.6)/0.4);
  /* rising motes, a steady few per frame while it grows */
  A.emit=A.emit||0; while(A.emit<A.t&&k<0.6){ A.emit+=28;
    glow({x:gx+rnd(-26,26),y:gy-rnd(0,10),vx:rnd(-0.01,0.01),vy:-rnd(0.03,0.07),size:rnd(2,3.5),life:rnd(600,900),col:Math.random()<0.7?V.mote[0]:V.mote[1],fin:true}); }
  if(k>=0.55&&!A.burst){ A.burst=true;
    glow({x:gx,y:gy-34,size:26,life:220,col:V.flash});
    glow({x:gx,y:gy-30,ring:true,r0:6,r1:44,w:4,life:420,col:V.ring});
    for(let i=0;i<18;i++){ const a=rnd(0,TAU), sp=rnd(0.08,0.24);
      glow({x:gx,y:gy-30,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-0.05,drag:0.06,g:0.0003,size:rnd(2.5,4.5),life:rnd(450,750),col:i%3?V.spark[0]:V.spark[1],streak:i%2===0}); } }
  b.save(); b.globalAlpha=fade; b.lineCap='round'; b.lineJoin='round';
  for(let v=0;v<5;v++){
    const bx=gx+(v-2)*11, dir=v%2?1:-1, H=62+((v*17)%20), n=Math.max(2,Math.round(28*grow));
    const pt=s=>[bx+Math.sin(s*5.2+v)*(8+s*13)*dir, gy-s*H];
    /* the stem, thick at the root and thin at the tip: a dark edge, then its green */
    for(const [w0,col] of [[4.2,V.dark],[2.4,V.stem]]){
      for(let i=1;i<n;i++){ const s0=(i-1)/27, s1=i/27, [x0,y0]=pt(s0), [x1,y1]=pt(s1);
        b.lineWidth=w0*(1-s1*0.6); b.strokeStyle=col; b.beginPath(); b.moveTo(x0,y0); b.lineTo(x1,y1); b.stroke(); } }
    /* leaves along it, unfurling as the stem passes them */
    for(let j=1;j<=4;j++){ const s=j*0.2; if(s>grow) break;
      const open=Math.min(1,(grow-s)*5), [lx,ly]=pt(s), side=j%2?1:-1;
      b.save(); b.translate(lx,ly); b.rotate(side*0.9+dir*0.2); b.scale(open,open);
      b.fillStyle=V.leafD; b.beginPath(); b.ellipse(side*5,0,5.5,2.6,0,0,TAU); b.fill();
      b.fillStyle=V.leaf; b.beginPath(); b.ellipse(side*5,-0.6,3.6,1.4,0,0,TAU); b.fill(); b.restore(); }
    /* a bud of light at the growing tip */
    if(grow<1&&k<0.6){ const [tx,ty]=pt(grow); b.save(); b.globalCompositeOperation='lighter'; b.globalAlpha=0.8*fade;
      b.drawImage(glowImg(V.bud),tx-6,ty-6,12,12); b.restore(); }
  }
  b.restore(); b.globalAlpha=1;
}
/* --- FX2 drawing helpers --- */
/* a soft light at x,y (radius r) */
function glowAt(x,y,r,col,a){ if(a<=0) return; b.save(); b.globalCompositeOperation='lighter'; b.globalAlpha=Math.min(1,a);
  b.drawImage(glowImg(col),x-r,y-r,r*2,r*2); b.restore(); }
/* a line of light along pts: a wide soft glow, then a bright thin core */
function glowPath(pts,col,w,a){ if(a<=0||pts.length<2) return;
  b.save(); b.globalCompositeOperation='lighter'; b.lineCap='round'; b.lineJoin='round';
  for(const [lw,al,c] of [[w*3,0.22,col],[w*1.6,0.45,col],[w*0.6,0.9,'#ffffff']]){
    b.globalAlpha=a*al; b.strokeStyle=c; b.lineWidth=lw; b.beginPath(); b.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++) b.lineTo(pts[i][0],pts[i][1]); b.stroke(); }
  b.restore(); }
/* every `ms` of an animation's time, call fn (time-based, so the same on any frame rate) */
function emitEvery(A,key,ms,fn){ A[key]=A[key]==null?A.t-ms:A[key]; while(A[key]+ms<=A.t){ A[key]+=ms; fn(); } }
/* once, the first time an animation passes k */
function onceAt(A,key,k,at,fn){ if(k>=at&&!A[key]){ A[key]=true; fn(); } }
/* where each pest still in the fight is: its middle */
const foeMids=()=>liveFoes().map(f=>{ const r=foeBox(f); return {x:r.x+r.w*0.45,y:r.y+r.h*0.55,f}; });
/* the friends' spells, in their own colours (heals are always green) */
const SPELL_COL={ivy:['#b06ae0','#e8c0ff'],tituba:['#8aa8ff','#f0f4ff'],tex:['#d8a840','#fff0b0'],heal:['#7fd86a','#e8ffd8']};

/* FX2 versions of the party's moves (drawSpellFx falls back to the old ones without FX2):
   true if it drew one */
function drawSpellFx2(kind,k,ax,ay){
  const A=B.anim; if(!A) return false;
  if(kind==='sprout'||kind==='hymn'){ drawSproutFx2(k,kind); return true; }
  if(kind==='waltz'){
    /* Bramble Waltz: three thorny whips sweep round the pest, then snap tight round it */
    const thorny=(pts,a)=>{ if(a<=0) return; b.save(); b.globalAlpha=a; b.lineCap='round'; b.lineJoin='round';
      for(const [lw,c] of [[5,'#2c1838'],[2.6,'#8a5ab0']]){ b.strokeStyle=c; b.lineWidth=lw; b.beginPath(); b.moveTo(pts[0][0],pts[0][1]);
        for(let i=1;i<pts.length;i++) b.lineTo(pts[i][0],pts[i][1]); b.stroke(); }
      b.fillStyle='#e0c0f0';
      for(let i=2;i<pts.length-1;i+=3){ const [x0,y0]=pts[i-1],[x1,y1]=pts[i+1], nx=-(y1-y0), ny=x1-x0, l=Math.hypot(nx,ny)||1;
        const [x,y]=pts[i]; b.beginPath(); b.moveTo(x+nx/l*1.6,y+ny/l*1.6); b.lineTo(x+nx/l*6,y+ny/l*6); b.lineTo(x+(x1-x0)*0.3,y+(y1-y0)*0.3); b.fill(); }
      b.restore(); };
    const cx=EX, cy=EY+12, arc=(r,a0,len,n)=>{ const P=[]; for(let i=0;i<=n;i++){ const a=a0+len*i/n; P.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r*0.62]); } return P; };
    if(k<0.55){ for(let s=0;s<3;s++){ const r=52-k*36, a0=s*2.1+k*8, len=Math.min(1,k*2.2)*2.3;
        thorny(arc(r,a0,len,22),1); glowAt(...arc(r,a0+len,0,1)[0],5,'#d8a0ff',0.7); } }
    else { const q=(k-0.55)/0.45; thorny(arc(32-q*7,0,TAU,48),1-q*q); }
    onceAt(A,'snap',k,0.55,()=>{ glow({x:cx,y:cy,ring:true,r0:40,r1:22,w:4,life:360,col:'#c890f0'});
      for(let i=0;i<14;i++){ const a=rnd(0,TAU), sp=rnd(0.08,0.2); glow({x:cx+Math.cos(a)*26,y:cy+Math.sin(a)*16,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*0.6,drag:0.08,size:rnd(2.5,4),life:rnd(350,550),col:i%2?'#c890f0':'#ffe0ff',streak:true}); } });
    return true;
  }
  if(kind==='req'){
    /* Wasp Requiem: a swarm of glowing wasps spirals in on every pest, then poison blooms over each */
    if(k<0.6) liveFoes().forEach((f,n)=>{ const p=foeSpot(f), cx=p.x, cy=p.y-p.lift-52*p.s+10, sc=p.s;
      for(let i=0;i<10;i++){ const a=i*0.63+k*10+n*1.3, r=(60-k*60)*(0.7+0.3*Math.sin(i+n))*sc, x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r*0.55;
        const tx=cx+Math.cos(a-0.35)*(r+6), ty=cy+Math.sin(a-0.35)*(r+6)*0.55;
        glowPath([[tx,ty],[x,y]],'#e8a020',1.4,0.6); glowAt(x,y,5,'#ffc030',0.9);
        b.fillStyle='#2a1a0a'; b.beginPath(); b.ellipse(x,y,1.8,1.2,a,0,TAU); b.fill(); } });
    onceAt(A,'bloom',k,0.55,()=>foeMids().forEach(p=>{ glow({x:p.x,y:p.y,ring:true,r0:4,r1:30,w:3,life:420,col:'#a8e050'});
      for(let i=0;i<9;i++) glow({x:p.x+rnd(-14,14),y:p.y+rnd(-10,8),vx:rnd(-0.03,0.03),vy:-rnd(0.01,0.04),size:rnd(6,10),life:rnd(700,1000),col:i%3?'#8ccf40':'#b070e0',a:0.7,fin:true}); }));
    return true;
  }
  if(kind==='thorn'){
    /* Thorn Nocturne: the ground darkens under every pest and petals of moonlight fall;
       then with each of its hits a cluster of thorns bursts up under that pest (thornBurst) */
    const gather=Math.min(1,k/0.55)*(k<0.85?1:Math.max(0,1-(k-0.85)/0.15));
    liveFoes().forEach(f=>{ const p=foeSpot(f); b.save(); b.globalAlpha=0.35*gather; b.fillStyle='#1a1028';
      b.beginPath(); b.ellipse(p.x,p.y-2,34*p.s*gather,5*p.s,0,0,TAU); b.fill(); b.restore(); });
    if(k>0.55&&k<0.8) glowAt(EX,EY,90,'#c8b0f0',(0.8-k)/0.25*0.35);
    emitEvery(A,'petal',60,()=>{ if(k<0.85){ const L=liveFoes(), f=L[ri(0,Math.max(0,L.length-1))]; if(!f) return; const p=foeSpot(f);
      glow({x:p.x+rnd(-40,40),y:p.y-rnd(60,110)*p.s,vx:rnd(-0.02,0.02),vy:rnd(0.02,0.05),size:rnd(2,3),life:900,col:'#e0d0ff',fin:true}); } });
    return true;
  }
  if(kind==='lull'){
    /* Frog Lullaby: soft green notes and motes drift up round her, the frog bobbing along */
    emitEvery(A,'note',90,()=>glow({x:ax+rnd(-30,30),y:ay-rnd(20,60),vx:rnd(-0.01,0.01),vy:-rnd(0.02,0.05),size:rnd(2.5,4),life:1000,col:Math.random()<0.6?'#9ee880':'#f0fff0',fin:true}));
    for(let i=0;i<6;i++){ const q=(k*1.3+i/6)%1, x=ax+Math.sin(i*2.3+q*5)*28, y=ay-30-q*70, a=Math.sin(q*Math.PI);
      glowAt(x,y,9,'#b8f0a0',a*0.6); noteGlyph(b,Math.round(x),Math.round(y),i%2?'#e8ffe0':'#a8e890',a); }
    const bo=Math.abs(Math.sin(G.t/180))*4; glowAt(ax+34,ay-30-bo,18,'#a8e890',0.35); drawFrog(b,ax+34,ay-26-bo,G.t,0);
    return true;
  }
  if(kind==='kick'||kind==='lunge') return true;       /* a blow: its mark comes as it lands (drawMarks) */
  if(kind==='meditate'||kind==='focus'){
    /* calm rings of light settling round them, and motes rising (warm ones for Focus) */
    const fo=kind==='focus', C=fo?['#ffb070','#ffe0a0']:['#9ad4ff','#c8f0b0'];
    for(let i=0;i<3;i++){ const p=clamp(k*1.4-i*0.22,0,1); if(p<=0||p>=1) continue;
      const P=[]; for(let j=0;j<=32;j++){ const a=j/32*TAU; P.push([ax+Math.cos(a)*(46-p*30),ay-4+Math.sin(a)*(12-p*7)]); }
      glowPath(P,C[i%2],1.6,(1-p)*0.9); }
    emitEvery(A,'mote',70,()=>{ if(k<0.85) glow({x:ax+rnd(-26,26),y:ay-rnd(0,20),vy:-rnd(0.04,0.08),vx:rnd(-0.01,0.01),size:rnd(2.2,3.4),life:900,col:C[Math.random()<0.5?0:1],fin:true}); });
    return true;
  }
  if(kind==='spell'){
    /* a friend's magic in their own colour: motes gather round them, then (an attack) orbs
       streak at the pest */
    const C=A.heal?SPELL_COL.heal:SPELL_COL[A.who]||SPELL_COL.ivy;
    for(let i=0;i<10;i++){ const a=i*0.63+G.t/250, r=20+Math.sin(G.t/200+i)*6;
      glowAt(ax+Math.cos(a)*r,ay-14+Math.sin(a)*r*0.5,4.5,C[i%2],Math.sin(Math.min(1,k*1.4)*Math.PI)*0.9); }
    if(!A.heal&&!A.sheet&&k>0.45&&k<0.75){ const q=(k-0.45)/0.3;
      for(let i=0;i<5;i++){ const pt=t=>[ax+(EX-ax)*t+Math.sin(i*1.7+t*6)*6, ay-14+(EY+20-ay+14)*t-Math.sin(t*Math.PI)*24+i*3];
        const P=[]; for(let j=0;j<=6;j++) P.push(pt(Math.max(0,q-0.18+0.03*j)));
        glowPath(P,C[0],1.6,0.8); glowAt(...pt(q),6,C[1],1); } }
    return true;
  }
  if(kind==='sing'){
    /* a little bird's song: glowing notes bob up, then drift to the party (a heal) or fly at the pests */
    for(let i=0;i<6;i++){ const q=(k*1.6+i/6)%1, a=Math.sin(q*Math.PI)*(1-k*0.6);
      let x=ax+Math.sin(i*2.3+q*5)*14, y=ay-30-q*40;
      if(!A.heal&&k>0.4){ const p=clamp((k-0.4)/0.35,0,1); x+=(EX-x)*p; y+=(EY+10-y)*p; }
      glowAt(x,y,13,A.heal?'#b8f0a0':'#ffd890',a*0.9); noteGlyph(b,Math.round(x),Math.round(y),i%2?(A.heal?'#c8f0b0':'#ffd08a'):'#fff6d8',a); }
    return true;
  }
  if(kind==='eat'){
    emitEvery(A,'mote',60,()=>{ if(k<0.8) glow({x:ax+rnd(-20,20),y:ay-rnd(50,70),vy:-rnd(0.03,0.06),size:rnd(2.4,3.6),life:800,col:Math.random()<0.5?'#8fe07a':'#ffe08a',fin:true}); });
    return true;
  }
  return false;
}
/* FX2, Thorn Nocturne: a cluster of moonlit thorns bursts up under pest f (one per hit) */
const THORN_MS=620;
function thornBurst(f){ const p=foeSpot(f); (B.thorns||(B.thorns=[])).push({x:p.x,y:p.y-1,s:p.s,t:0,seed:Math.random()*100});
  glow({x:p.x,y:p.y-30*p.s,ring:true,r0:6,r1:34*p.s,w:3,life:360,col:'#c8b0f0'}); }
function drawThorns(dt){
  const L=B.thorns; if(!L||!L.length) return;
  L.forEach(T=>{ T.t+=dt; const t=T.t, rise=t<110?1-Math.pow(1-t/110,3):t<300?1:Math.max(0,1-(t-300)/(THORN_MS-300));
    if(rise<=0) return;
    b.save(); b.globalAlpha=0.5*rise; b.fillStyle='#1a1028'; b.beginPath(); b.ellipse(T.x,T.y,30*T.s,5*T.s,0,0,TAU); b.fill(); b.restore();
    /* five slim thorns fanning outward, the middle ones tallest */
    for(let i=0;i<5;i++){ const r=Math.sin(T.seed+i*7.3), off=(i-2)/2, x=T.x+off*16*T.s+r*2,
        h=rise*(62-Math.abs(off)*18+((i*13+T.seed)%14))*T.s, lean=off*0.42+r*0.08, w=2.8*T.s;
      if(h<2) continue;
      const tip=[x+h*lean,T.y-h], mid=[x+h*lean*0.35,T.y-h*0.5], g=b.createLinearGradient(x,T.y,tip[0],tip[1]);
      g.addColorStop(0,'#1e1230'); g.addColorStop(0.55,'#4a2e72'); g.addColorStop(1,'#cbb6f4');
      b.fillStyle=g; b.beginPath(); b.moveTo(x-w,T.y); b.quadraticCurveTo(mid[0]-w*0.6,mid[1],tip[0],tip[1]);
      b.quadraticCurveTo(mid[0]+w*0.6,mid[1],x+w,T.y); b.fill();
      b.strokeStyle='rgba(230,215,255,0.55)'; b.lineWidth=0.8; b.beginPath(); b.moveTo(x+w*0.3,T.y-h*0.15); b.quadraticCurveTo(mid[0]+w*0.2,mid[1],tip[0],tip[1]); b.stroke();
      glowAt(tip[0],tip[1],5,'#e0d0ff',0.6*rise); } });
  B.thorns=L.filter(T=>T.t<THORN_MS);
}
/* ---------- troubles taking hold (FX2) ----------
   When a trouble lands on a pest or a member, a short look of its own plays on them, with a
   sound, instead of words: poison (and venom, in green) drips down them, Z's float up from
   a sleeper, arrows sink past the weakened, sweat flies off the scared, ink puffs over the
   blinded, vines cinch round the bound. Then the usual marker shows. The sound is a
   recording, sfx/trouble <kind>.wav, once there is one; until then a little made-up one. */
const TROUBLE_MS={poison:1100,venom:1100,sleep:1400,weak:1000,scared:900,blind:1000,bound:900};
function troubleFx(who,kind){
  if(!B||!TROUBLE_MS[kind]) return;
  const r=typeof who==='object'?foeBox(who):(()=>{ const s=slotOf(who), top=headOf(who); return {x:s.x-18*s.s,y:top-4,w:36*s.s,h:s.y-top+4}; })();
  (B.tfx||(B.tfx=[])).push({kind,r,t:0,seed:Math.random()*10});
  if(!(sfx('trouble_'+kind)>0)) troubleSound(kind);
}
function troubleSound(kind){
  if(!AC) return; const t=AC.currentTime;
  const tone=(type,f0,f1,t0,dur,vol,vib)=>{ const o=AC.createOscillator(), g=AC.createGain(); o.type=type;
    o.frequency.setValueAtTime(f0,t+t0); o.frequency.exponentialRampToValueAtTime(f1,t+t0+dur);
    if(vib){ const l=AC.createOscillator(), lg=AC.createGain(); l.frequency.value=vib[0]; lg.gain.value=vib[1]; l.connect(lg); lg.connect(o.frequency); l.start(t+t0); l.stop(t+t0+dur); }
    g.gain.setValueAtTime(0.0001,t+t0); g.gain.exponentialRampToValueAtTime(vol,t+t0+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+t0+dur);
    o.connect(g); g.connect(sfxGain); o.start(t+t0); o.stop(t+t0+dur+0.02); };
  if(kind==='poison'||kind==='venom'){ const k=kind==='venom'?0.8:1;      /* bloop-bloop-bloop */
    for(let i=0;i<3;i++) tone('sine',700*k-i*120,260*k-i*40,i*0.11,0.1,0.18); }
  else if(kind==='sleep'){ tone('sine',1100,330,0,0.55,0.16,[7,25]); tone('sine',330,520,0.55,0.25,0.12,[7,20]); }   /* a sleepy slide whistle */
  else if(kind==='weak') tone('triangle',330,140,0,0.45,0.2,[5,8]);           /* wah-wahh */
  else if(kind==='scared') tone('square',620,1300,0,0.22,0.06,[28,60]);       /* eep! */
  else if(kind==='blind'){ const nz=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain();   /* poof */
    nz.buffer=noiseBuf; f.type='lowpass'; f.frequency.setValueAtTime(2400,t); f.frequency.exponentialRampToValueAtTime(300,t+0.35);
    g.gain.setValueAtTime(0.25,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.4); nz.connect(f); f.connect(g); g.connect(sfxGain); nz.start(t); nz.stop(t+0.42); }
  else if(kind==='bound'){ tone('sawtooth',150,110,0,0.18,0.08,[18,10]); tone('sawtooth',130,95,0.2,0.2,0.08,[18,10]); }   /* creak, creak */
}
function drawTroubles(dt){
  const L=B.tfx; if(!L||!L.length) return;
  L.forEach(T=>{ T.t+=dt; const k=T.t/TROUBLE_MS[T.kind]; if(k>=1) return;
    const {x,y,w,h}=T.r, cx=x+w*0.5, fade=k<0.75?1:1-(k-0.75)/0.25;
    b.save(); b.lineCap='round'; b.lineJoin='round';
    if(T.kind==='poison'||T.kind==='venom'){
      /* drops slide down the body, leaving a thin glowing trail, and splat near the bottom */
      const col=T.kind==='venom'?'#5ac86a':'#a060d0', hi=T.kind==='venom'?'#c8f0b0':'#e0b0ff';
      for(let i=0;i<3;i++){ const d=clamp((T.t-i*180)/700,0,1); if(d<=0) continue;
        const dx=cx+(i-1)*w*0.22+Math.sin(T.seed+i)*3, y0=y+h*0.12, y1=y+h*0.8, yy=y0+(y1-y0)*d*d;
        glowPath([[dx,y0],[dx,yy]],col,2,0.5*fade);
        if(d<1){ b.globalAlpha=fade; b.fillStyle=col; b.beginPath(); b.moveTo(dx,yy-10); b.quadraticCurveTo(dx+5.4,yy-1.5,dx,yy+4.5);
          b.quadraticCurveTo(dx-5.4,yy-1.5,dx,yy-10); b.fill(); b.fillStyle=hi; b.beginPath(); b.arc(dx-1.5,yy-1.5,1.5,0,TAU); b.fill(); b.globalAlpha=1; }
        else if(!T['s'+i]){ T['s'+i]=true; glow({x:dx,y:y1,ring:true,r0:2,r1:12,w:2,life:380,col}); } }
    } else if(T.kind==='sleep'){
      /* three Z's drift up and to the side, each bigger than the last */
      for(let i=0;i<3;i++){ const q=clamp((T.t-i*260)/900,0,1); if(q<=0||q>=1) continue;
        const zx=cx+w*0.25+q*22+i*8, zy=y+h*0.15-q*40-i*6, sz=10+i*4;
        glowAt(zx,zy,sz,'#c8b8ff',0.5*Math.sin(q*Math.PI));
        b.globalAlpha=Math.sin(q*Math.PI); b.fillStyle='#f4f0ff'; b.strokeStyle='#4a3a8a'; b.lineWidth=1.2;
        b.font='bold '+sz+'px Verdana'; b.textAlign='center'; b.strokeText('Z',zx,zy); b.fillText('Z',zx,zy); b.globalAlpha=1; }
    } else if(T.kind==='weak'){
      /* blue arrows sink down past them */
      for(let i=0;i<3;i++){ const q=clamp((T.t-i*120)/700,0,1); if(q<=0||q>=1) continue;
        const ax=cx+(i-1)*w*0.3, ay=y+h*0.1+q*h*0.6, a=Math.sin(q*Math.PI);
        glowPath([[ax-5,ay-5],[ax,ay],[ax+5,ay-5]],'#7aa0e0',2,a); glowPath([[ax,ay-12],[ax,ay]],'#7aa0e0',1.6,a*0.7); }
    } else if(T.kind==='scared'){
      /* sweat drops fly off the head, and a "!!" pops up */
      for(let i=0;i<4;i++){ const q=clamp(T.t/600,0,1), side=i%2?1:-1, sx=cx+side*(w*0.3+q*16+i*2), sy=y+h*0.15-Math.sin(q*Math.PI)*14+q*q*20;
        b.globalAlpha=fade*(1-q*0.5); b.fillStyle='#bfe8ff'; b.beginPath(); b.ellipse(sx,sy,2,3,side*0.5,0,TAU); b.fill(); }
      const pq=clamp(T.t/180,0,1), ps=8+pq*4-(pq>=1?Math.min(2,(T.t-180)/60):0);
      b.globalAlpha=fade; b.font='bold '+ps.toFixed(1)+'px Verdana'; b.textAlign='center'; b.fillStyle='#ffe060'; b.strokeStyle='#5a3a10'; b.lineWidth=1.2;
      b.strokeText('!!',cx+w*0.35,y-2); b.fillText('!!',cx+w*0.35,y-2); b.globalAlpha=1;
    } else if(T.kind==='blind'){
      /* a puff of dark ink over the head */
      for(let i=0;i<6;i++){ const q=clamp(T.t/700,0,1), a=i*1.05+T.seed, rr=(4+q*12)*(0.7+0.3*Math.sin(i*2.3));
        b.globalAlpha=0.55*fade*(1-q*0.5); b.fillStyle=i%2?'#2a2438':'#3e3850';
        b.beginPath(); b.arc(cx+Math.cos(a)*q*10,y+h*0.2+Math.sin(a)*q*6,rr,0,TAU); b.fill(); }
    } else if(T.kind==='bound'){
      /* two vine loops tighten round them */
      for(let i=0;i<2;i++){ const q=easeOut(T.t/450), rx=(w*0.75-q*w*0.25), ry=6+i*2, yy=y+h*(0.45+i*0.22), P=[];
        for(let j=0;j<=24;j++){ const a=j/24*TAU; P.push([cx+Math.cos(a)*rx,yy+Math.sin(a)*ry]); }
        b.globalAlpha=fade; b.strokeStyle='#3a6a2a'; b.lineWidth=3; b.beginPath(); P.forEach((p,j)=>j?b.lineTo(p[0],p[1]):b.moveTo(p[0],p[1])); b.stroke();
        b.strokeStyle='#8ad060'; b.lineWidth=1.4; b.stroke(); b.globalAlpha=1; }
    }
    b.restore(); b.globalAlpha=1; });
  B.tfx=L.filter(T=>T.t<TROUBLE_MS[T.kind]);
}
/* ---------- hit marks (FX2) ----------
   What a blow leaves where it lands, by what made it: Ivy's two fangs, Tituba's claw
   rake, Tex's big chomp, Kaitlyn's kick (a burst; Karate Kick's bigger), Tiny One's beak
   jabs, and the pests' bites, pinches, claws, pecks, stings and bashes on the party. Each
   plays on its own clock (B.marks) from the moment of the hit. dir: 1 when the blow comes
   from the left (the party hitting a pest), -1 from the right (a pest hitting the party). */
const MARK_MS={roll:760,fangs:620,claws:480,chomp:560,kick:360,karate:460,beak:320,pinch:520,sting:620,bash:400,bite:520};
/* each member's own hit (their regular attack), and skills that hit like it */
const ATTACK_MARK={kaitlyn:'kick',ivy:'fangs',tituba:'claws',tex:'chomp'};
const SKILL_MARK={peck:'beak',pounce:'claws',dswipe:'claws',slam:'bash'};
/* the pests' blows, by their effect */
const FOE_MARK={bite:'bite',pinch:'pinch',claw:'claws',peck:'beak',bash:'bash',dive:'bash',sting:'sting',spines:'sting'};
function hitMark(type,x,y,s,dir,opt){ if(!FX2||!MARK_MS[type]) return;
  (B.marks||(B.marks=[])).push({type,x,y,s:s||1,dir:dir||1,t:0,seed:Math.random()*100,...opt});
  if(type==='chomp'||type==='karate') quake(type==='karate'?5:3.5,260); }
/* on a pest (where a blow lands on it), or on a member; MARK_SCALE: how big they all are */
const MARK_SCALE=1.6;
function markFoe(type,f,opt){ const r=foeBox(f); hitMark(type,r.x+r.w*0.42,r.y+r.h*0.5,foeSpot(f).s*MARK_SCALE,1,opt); }
function markMember(type,id,opt){ const s=slotOf(id); hitMark(type,s.x+6*s.s,(s.y+headOf(id))/2,s.s*MARK_SCALE,-1,opt); }
const easeOut=q=>1-Math.pow(1-clamp(q,0,1),3);
function drawMarks(dt){
  const L=B.marks; if(!L||!L.length) return;
  L.forEach(M=>{ M.t+=dt; const T=MARK_MS[M.type], q=M.t/T; if(q>=1) return;
    const x=M.x, y=M.y, s=M.s, dir=M.dir, out=q<0.55?1:1-(q-0.55)/0.45;     /* out: fades over the last part */
    b.save(); b.lineCap='round'; b.lineJoin='round';
    if(M.type==='roll'){
      /* a death roll: a coil of dark green and violet spins round the pest, tighter and
         tighter, then bursts as it crushes */
      const q=M.t/T, spin=q*14, r=(30-q*16)*s;
      for(let c=0;c<2;c++){ const P=[]; for(let j=0;j<=40;j++){ const u=j/40, a=spin+c*Math.PI+u*TAU*1.4;
          P.push([x+Math.cos(a)*r*(0.6+0.4*u),y+Math.sin(a)*r*0.55*(0.6+0.4*u)+(u-0.5)*10*s]); }
        glowPath(P,c?'#9a6ad0':'#4ab060',2.4*s*(1-q*0.4),q<0.85?1:(1-q)/0.15); }
      if(q>0.7&&!M.burst){ M.burst=true; glow({x:x,y:y,size:26*s,life:220,col:'#e0c8ff'});
        glow({x:x,y:y,ring:true,r0:6*s,r1:44*s,w:4,life:420,col:'#9ae080'});
        for(let i=0;i<14;i++){ const a=rnd(0,TAU), sp=rnd(0.1,0.28); glow({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*0.7,drag:0.08,size:rnd(2.5,4.5),life:rnd(350,600),col:i%2?'#9a6ad0':'#7ad070',streak:true}); }
        quake(4,260); }
    } else if(M.type==='fangs'){
      /* two curved fangs stab in, then two glowing punctures and drips of venom */
      const stab=easeOut(M.t/110), lift=(1-stab)*-14*s;
      for(const side of [-1,1]){ const fx=x+side*6*s, tip=y+6*s, top=tip-24*s+lift;
        /* a snake's fang: slim as a needle, curving back toward the mouth (each side mirrored) */
        if(M.t<260){ b.globalAlpha=M.t<200?1:1-(M.t-200)/60;
          b.fillStyle='#fbf6ff'; b.strokeStyle='#8a6ab0'; b.lineWidth=0.8;
          const bw=1.8*s, tx=fx+side*1.5*s, ty=tip+lift, bend=-side*6*s;
          b.beginPath(); b.moveTo(fx-bw,top); b.quadraticCurveTo(fx-bw+bend,top+(ty-top)*0.6,tx,ty);
          b.quadraticCurveTo(fx+bw+bend,top+(ty-top)*0.55,fx+bw,top); b.closePath(); b.fill(); b.stroke(); b.globalAlpha=1; }
        if(stab>=1){ glowAt(fx+side*1.5*s,tip,7*s,'#ff7090',out*0.9); glowAt(fx+side*1.5*s,tip,3*s,'#ffffff',out); } }
      if(M.t>=110&&!M.drip){ M.drip=true;
        for(const side of [-1,1]) for(let i=0;i<3;i++) glow({x:x+side*8.5*s,y:y+7*s,vx:rnd(-0.01,0.01),vy:rnd(0.02,0.05),g:0.0002,size:rnd(2,3),life:rnd(500,800),col:i%2?'#8fe07a':'#c8f0a0'}); }
    } else if(M.type==='claws'){
      /* three curved slashes raked across, drawn in fast, then thinning away (silver for
         the party, red for a pest) */
      const col=dir>0?'#c8d8ff':'#ff8a7a';
      for(let i=0;i<3;i++){ const d=clamp((M.t-i*30)/90,0,1); if(d<=0) continue;
        /* spaced across the line of the slash (perpendicular to it), 11 px apart */
        const px_=0.68*(i-1)*11*s, py_=-0.73*(i-1)*11*s*dir;
        const P=[]; for(let j=0;j<=10;j++){ const u=j/10*d; P.push([x+(-16+u*32)*s*dir+px_, y+(-16+u*30)*s+py_*dir*dir-Math.sin(u*Math.PI)*4*s]); }
        glowPath(P,col,1.7*s*(0.4+0.6*out),out); }
    } else if(M.type==='chomp'){
      /* an old tortoise's toothless beak, in profile facing the pest: a horn upper beak with a
         strong hook at its front snaps down onto a short, chunky lower one */
      const snap=easeOut(M.t/150), gap=(1-snap)*20*s, w=20*s, d=dir;
      b.globalAlpha=M.t<300?1:out; b.save(); b.translate(x,y); b.scale(d,1);
      b.fillStyle='#a08a5a'; b.strokeStyle='#3e3220'; b.lineWidth=1.3;
      b.beginPath(); b.moveTo(-w,-gap-11*s); b.quadraticCurveTo(w*0.2,-gap-16*s,w*0.8,-gap-9*s);    /* over the top */
      b.quadraticCurveTo(w*1.15,-gap-4*s,w*0.95,-gap+8*s);                                        /* down into the hook */
      b.quadraticCurveTo(w*0.75,-gap+1*s,w*0.45,-gap-1*s); b.lineTo(-w,-gap-2*s); b.closePath(); b.fill(); b.stroke();
      b.strokeStyle='#e4d0a0'; b.lineWidth=1.6; b.beginPath(); b.moveTo(-w*0.8,-gap-11.5*s); b.quadraticCurveTo(w*0.2,-gap-14.5*s,w*0.75,-gap-8*s); b.stroke();
      b.fillStyle='#8c7848'; b.strokeStyle='#3e3220'; b.lineWidth=1.3;
      b.beginPath(); b.moveTo(-w,gap+1*s); b.lineTo(w*0.5,gap+1*s); b.quadraticCurveTo(w*0.45,gap+7*s,-w*0.1,gap+8.5*s);
      b.quadraticCurveTo(-w*0.6,gap+9*s,-w,gap+8*s); b.closePath(); b.fill(); b.stroke();
      b.restore(); b.globalAlpha=1;
      if(snap>=1&&!M.shut){ M.shut=true; glow({x:x,y:y,ring:true,r0:6*s,r1:36*s,w:4,life:380,col:'#ffe8b0'});
        for(let i=0;i<8;i++){ const a=rnd(0,TAU); glow({x:x,y:y,vx:Math.cos(a)*0.12,vy:Math.sin(a)*0.08,drag:0.1,size:rnd(2.5,4),life:rnd(300,450),col:'#ffe0a0',streak:true}); } }
    } else if(M.type==='bite'){
      /* a pest's bite: two curved jaw lines snap together, each with a row of small needle teeth */
      const snap=easeOut(M.t/110), gap=(1-snap)*14*s+1.5*s, R=15*s, a=M.t<260?1:out;
      for(const up of [-1,1]){
        const jaw=u=>[x+(u-0.5)*2*R, y+up*gap+up*Math.sin(u*Math.PI)*R*0.4];
        const P=[]; for(let j=0;j<=12;j++) P.push(jaw(j/12));
        glowPath(P,'#ff8a7a',1.6*s,a);
        b.globalAlpha=a; b.fillStyle='#fffaf6';
        for(let i=1;i<=5;i++){ const [tx,ty]=jaw(i/6), len=(3.6+Math.sin(i*1.7)*0.8)*s;
          b.beginPath(); b.moveTo(tx-1*s,ty); b.lineTo(tx,ty-up*len); b.lineTo(tx+1*s,ty); b.closePath(); b.fill(); }
        b.globalAlpha=1; }
      if(snap>=1&&!M.shut){ M.shut=true; glow({x:x,y:y,ring:true,r0:4*s,r1:22*s,w:2.5,life:300,col:'#ffb0a0'}); }
    } else if(M.type==='pinch'){
      /* a pinch: two slender crescent pincers close from either side */
      const snap=easeOut(M.t/120), gap=(1-snap)*16*s+2*s, a=M.t<260?1:out;
      for(const side of [-1,1]){
        /* each pincer: an outer and inner curve meeting in points at top and bottom */
        const cx=x+side*gap, outer=[], inner=[];
        for(let j=0;j<=12;j++){ const u=j/12, yy=y+(u-0.5)*26*s, bow=Math.sin(u*Math.PI);
          outer.push([cx+side*bow*11*s,yy]); inner.push([cx+side*bow*6*s,yy]); }
        b.globalAlpha=a; b.fillStyle='#e06a50'; b.strokeStyle='#7a2a20'; b.lineWidth=1;
        b.beginPath(); b.moveTo(outer[0][0],outer[0][1]); outer.forEach(p=>b.lineTo(p[0],p[1]));
        inner.slice().reverse().forEach(p=>b.lineTo(p[0],p[1])); b.closePath(); b.fill(); b.stroke();
        b.globalAlpha=1; glowPath(inner,'#ffc0a8',1*s,a*0.8); }
      if(snap>=1&&!M.shut){ M.shut=true; glow({x:x,y:y,ring:true,r0:4*s,r1:22*s,w:2.5,life:300,col:'#ffb0a0'}); }
    } else if(M.type==='kick'||M.type==='karate'||M.type==='bash'){
      /* a comic-style impact: spikes of light bursting out from the point of contact */
      const big=M.type==='karate', col=M.type==='bash'?'#ffd0c0':big?'#ffb050':'#fff0b0', n=big?14:10, k=easeOut(M.t/(big?160:120));
      b.save(); b.globalCompositeOperation='lighter';
      for(let i=0;i<n;i++){ const a=i/n*TAU+M.seed, len=(big?40:28)*s*(0.7+0.3*Math.sin(i*2.7+M.seed))*k, r0=6*s*k;
        const w=(big?6:4.5)*s*out, ca=Math.cos(a), sa=Math.sin(a)*0.8;
        b.globalAlpha=out; b.fillStyle=hexA(col,0.9);
        b.beginPath(); b.moveTo(x+ca*r0-sa*w,y+sa*r0+ca*w*0.8); b.lineTo(x+ca*(r0+len),y+sa*(r0+len)); b.lineTo(x+ca*r0+sa*w,y+sa*r0-ca*w*0.8); b.fill(); }
      b.restore(); glowAt(x,y,(big?22:16)*s,'#ffffff',out*(1-q));
    } else if(M.type==='beak'){
      /* a quick sharp jab: a wedge darting in, and a little star */
      const k=easeOut(M.t/80), ox=x+(M.jx||0)*s, oy=y+(M.jy||0)*s, back=(1-k)*14*s*dir;
      if(M.t<160){ b.globalAlpha=1-M.t/160; b.fillStyle='#ffe0a0'; b.strokeStyle='#8a5a20'; b.lineWidth=1;
        b.beginPath(); b.moveTo(ox-back-10*s*dir,oy-4*s); b.lineTo(ox-back,oy); b.lineTo(ox-back-10*s*dir,oy+4*s); b.closePath(); b.fill(); b.stroke(); b.globalAlpha=1; }
      if(k>=1) for(let i=0;i<4;i++){ const a=i*Math.PI/2+M.seed; glowPath([[ox,oy],[ox+Math.cos(a)*9*s*out,oy+Math.sin(a)*9*s*out]],'#ffe8a0',1.4*s,out); }
    } else if(M.type==='sting'){
      /* a puncture that glows, and a ring of venom spreading from it */
      const k=easeOut(M.t/100);
      if(M.t<160) glowPath([[x+18*s*(1-k)*-dir+4*s*-dir,y-3*s*(1-k)],[x,y]],'#e0e0e0',1.6*s,1);
      glowAt(x,y,6*s,'#c070ff',out); glowAt(x,y,2.5*s,'#ffffff',out);
      if(k>=1&&!M.ring){ M.ring=true; glow({x:x,y:y,ring:true,r0:3*s,r1:22*s,w:2.5,life:520,col:'#b070e0'});
        for(let i=0;i<5;i++) glow({x:x+rnd(-6,6)*s,y:y+rnd(-4,4)*s,vy:-rnd(0.01,0.03),size:rnd(3,5),life:rnd(500,700),col:'#a060d0',a:0.7,fin:true}); }
    }
    b.restore(); b.globalAlpha=1; });
  B.marks=L.filter(M=>M.t<MARK_MS[M.type]);
}
/* ---------- effect sheets (EFFECTS: animations made in Effekseer, tools/build_effects.py) ----------
   Loaded the first time they're wanted. A sheet made on black is drawn as added light, so
   its black is see-through. SKILL_SHEET: friends' skills with one; a skill with several
   hits plays an equal share of its frames on each hit's pest, as the hit lands. */
/* SHEET_GAIN: an added-light sheet is drawn this many times over, so it still shows on the
   bright garden (it was made on black) */
const SKILL_SHEET={swipes:'fury_swipes'}, SHEET_FPS=60, SHEET_GAIN=2, SHEET_IMG={};
const haveSheet=key=>typeof EFFECTS!=='undefined'&&!!EFFECTS[key];
function sheetImg(key){
  if(!haveSheet(key)) return null;
  if(!SHEET_IMG[key]){ const im=new Image(); im.src=EFFECTS[key].file; SHEET_IMG[key]=im; }
  const im=SHEET_IMG[key]; return im.complete&&im.naturalWidth?im:null;
}
/* play frames from..to of a sheet, centred on x,y, size across (scene px) */
function playSheet(key,x,y,size,from,to){ if(!haveSheet(key)) return; sheetImg(key);
  (B.sheets||(B.sheets=[])).push({key,x,y,size,from,to,t:0}); }
/* hit i of n lands on pest f: its share of the sheet, over the pest */
function sheetHit(key,f,i,n){ if(!haveSheet(key)) return;
  const E=EFFECTS[key], r=foeBox(f), size=clamp(r.w*2.2,100,210);
  playSheet(key,r.x+r.w*0.5,r.y+r.h*0.55,size,Math.floor(i*E.n/n),Math.floor((i+1)*E.n/n)-1); }
const sheetFrame=S=>S.from+Math.floor(S.t*SHEET_FPS/1000);
function drawSheets(dt){
  const L=B.sheets; if(!L||!L.length) return;
  L.forEach(S=>{ S.t+=dt; const E=EFFECTS[S.key], im=sheetImg(S.key), f=sheetFrame(S); if(!im||f>S.to) return;
    b.save(); if(E.add) b.globalCompositeOperation='lighter'; b.imageSmoothingEnabled=true;
    for(let g=0;g<(E.add?SHEET_GAIN:1);g++)
      b.drawImage(im,(f%E.cols)*E.cell,Math.floor(f/E.cols)*E.cell,E.cell,E.cell,S.x-S.size/2,S.y-S.size/2,S.size,S.size);
    b.restore(); });
  B.sheets=L.filter(S=>sheetFrame(S)<=S.to);
}
/* FX2: HP coming back: a ring of light at their feet and a column of rising motes */
function healFx(id){
  const s=slotOf(id), top=headOf(id);
  glow({x:s.x,y:s.y-2,ring:true,r0:8*s.s,r1:30*s.s,w:2.5,life:500,col:'#8fe07a'});
  for(let i=0;i<10;i++) glow({x:s.x+rnd(-14,14)*s.s,y:s.y-rnd(0,s.y-top),vy:-rnd(0.03,0.07),size:rnd(2.4,3.8),life:rnd(600,900),col:i%2?'#8fe07a':'#e8ffd8',fin:true});
}
/* hold (ms): a recorded voice that runs longer than the move; its animation loops until
   the voice is done. The move lands at its usual time, or with atEnd (Kaitlyn's songs)
   its effect plays last, landing as the song ends (it runs a little past the hold) */
function anim(kind,dur,onHit,extra){ B.anim={kind,t:0,dur,hit:false,onHit,who:kind==='enemy'?null:actor(),...extra};
  const A=B.anim;
  if(A.hold>dur){ A.loopMs=dur;
    if(A.atEnd){ A.fxFrom=A.hold-dur*0.55; A.dur=A.fxFrom+dur; }
    else { A.fxFrom=0; A.dur=A.hold; }
    A.hitAt=A.fxFrom+dur*0.55; } }
/* friends' skills with a recorded voice of their own (other Tiny One songs: tiny_songs) */
const SKILL_SOUND={peck:'tiny_peckpeckpeck',trill:'tiny_disarmingtrill',wake:'tiny_wakeupcall'};
const has=(id,s)=>B.st[id]&&B.st[id][s]>0;
function addStatus(id,s){ if(!B.st[id]) B.st[id]={}; B.st[id][s]=STATUS[s].turns+(s==='sleep'?ri(0,1):0); troubleFx(id,s); }
/* a trouble on a pest: turns left, or for Venom {n turns left, dmg each turn} */
function foeStatus(f,s,dmg){ if(s==='venom') f.st.venom={n:STATUS.venom.turns,dmg}; else f.st[s]=STATUS[s].turns+(s==='sleep'?ri(0,1):0); troubleFx(f,s); }
const venomDmg=id=>Math.round(2+statOf(id,'int')*0.5);
/* Blind and Weak count down once the turn they hampered is over (B.wane: whose they are),
   so they last all their turns */
function wane(S){ ['blind','weak'].forEach(k=>{ if(S[k]>0) S[k]--; }); }
/* who got which trouble, for the log: {"Poisoned":[foes], ...} -> "  Poisoned: Paper Wasp." */
/* (troubles now show as a look and a sound, troubleFx, rather than words) */
function gotLog(by){ return ""; }
const total=got=>got.reduce((a,t)=>a+(parseInt(t)||0),0);
function gotLogOld(by){ return Object.keys(by).filter(k=>by[k].length).map(k=>"  "+k+": "+listAnd(by[k].map(t=>t.name))+".").join(""); }
/* Tituba's Snitch: (25 + 0.7 Luck + 0.5 Agility)% to steal from a pest, once per pest. It's
   the pest's rare thing Luck% of the time, otherwise its ordinary one. */
const stealChance=id=>clamp((25+0.7*statOf(id,'luk')+0.5*statOf(id,'agi'))/100,0,1);
function trySteal(id,f){
  const D=PEST_DROPS[f.sp];
  if(!D||f.stolen) return {why:'empty'};
  if(Math.random()>=stealChance(id)) return {why:'miss'};
  const k=Math.random()<statOf(id,'luk')/100?D[1]:D[0];
  G.goods[k]=(G.goods[k]||0)+1; f.stolen=k; B.stolen.push(k);
  focus(f); pop(GOODS[k].name+"!",EX,EY-34,'#ffe08a',20); burst(EX,EY,'#ffe08a',10,0.12);
  return {k};
}
const foeDef=f=>f.def;
/* A move that hits every foe hits each one a little softer the more there are: x1 for one,
   0.9 for two, down to 0.6 for five (so the total still grows a little with each one) */
const spreadMul=n=>1-0.1*(clamp(n,1,5)-1);
/* damage after the target's Defense softens it (magic only half minds it) */
const soften=(raw,def,magic)=>Math.max(1,Math.round(raw*16/(16+def*(magic?0.5:1))));

/* ---------- a round ----------
   Everyone standing picks their move first, one at a time top to bottom as they stand
   (B.inputs; B.plan[id] is what they picked; Back goes to the one before). Then, after a
   Pep Rally if the meter was full and she plays one, everyone and every pest acts,
   quickest (Agility) first (B.order). Guarding moves take hold as the round starts. */
function beginRound(){
  if(!B||B.over) return;
  if(allDown()){ winFight(); return; }
  B.plan={}; B.pepPick=null; B.shieldAll=false; B.skipParty=false;
  B.inputs=topDown(B.party).filter(id=>standing(id)&&!(B.st[id].sleep>0));
  B.inputAt=0;
  if(B.inputs.length) askInput(); else startActions();
}
function askInput(){ B.act=B.party.indexOf(B.inputs[B.inputAt]); startTurn(); B.log=PARTY_INFO[actor()].name+"'s move?"; }
/* a member's move is picked (P: {kind, x the skill, song or item, f the foe, to the friend}):
   on to the next, then maybe a Pep Rally, then the actions */
function plan(P){
  B.plan[actor()]=P; B.tgt=null; B.inputAt++;
  if(B.inputAt<B.inputs.length){ askInput(); return; }
  if(pepReady()){ B.act=B.party.indexOf('kaitlyn'); startTurn(); B.menu='pep'; B.sub=0; B.top=0;
    B.log="The Pep meter is full! Play a Pep Rally?"; blip(880,0.06,0.12,'triangle'); return; }
  startActions();
}
/* Back: the one before picks again (false if this is the first) */
function unplan(){
  if(!B.inputAt) return false;
  B.inputAt--; delete B.plan[B.inputs[B.inputAt]]; askInput(); sfx('menu_cancel'); return true;
}
const pepReady=()=>pepKnown()&&(G.pep||0)>=PEP_MAX&&standing('kaitlyn')&&!(B.st.kaitlyn&&B.st.kaitlyn.sleep>0)&&pepSongs().length>0;
/* the moves are picked: guards go up, the order is set, a Pep Rally plays, and away */
function startActions(){
  B.turn='busy'; B.menu='cmd'; B.tgt=null;
  for(const id in B.plan){ const P=B.plan[id], x=P.x||{};
    if(P.kind==='meditate'||P.kind==='focus'||x.shell||x.cover||x.coverAll) B.guard[id]=true;
    if(x.shell) B.shell[id]=true;
    if(x.cover&&P.to) B.cover={by:id,to:P.to};
    if(x.coverAll) B.cover={by:id,all:true};
    if(x.guardAll) B.party.filter(standing).forEach(m=>{ B.guard[m]=true; }); }
  newRound();
  if(B.pepPick){ const s=B.pepPick; B.pepPick=null; playRally(s); return; }
  setTimeout(nextActor,300);
}
function newRound(){
  const L=B.party.filter(standing).map(id=>({id,a:statOf(id,'agi')+rnd(0,4)}));
  B.foes.forEach((f,i)=>{ if(f.hp>0) L.push({id:i,a:f.agi+rnd(0,4)}); });
  B.order=L.sort((x,y)=>y.a-x.a).map(o=>o.id);
}
/* whoever is next acts: a party member does what they picked, a pest (by number) takes
   its turn; when everyone has, a new round */
function nextActor(){
  if(!B||B.over) return;
  if(B.wane){ wane(B.wane); B.wane=null; }
  if(allDown()){ winFight(); return; }
  if(!B.order.length){ beginRound(); return; }
  const id=B.order.shift();
  if(typeof id==='number'){ const f=B.foes[id]; if(f.hp<=0){ nextActor(); return; }
    B.turn='enemy'; setTimeout(()=>foeTurn(f),TURN_GAP); return; }
  if(!standing(id)||B.skipParty){ nextActor(); return; }
  B.act=B.party.indexOf(id);
  const why=memberTicks(id);
  if(B.over) return;
  if(why){ B.turn='busy'; B.log=why; setTimeout(nextActor,1100); return; }
  runPlan(id);
}
function startTurn(){ B.turn='player'; B.menu='cmd'; B.idx=0; B.ctop=0; B.readyT=0; B.tgt=null; }
/* a member does what they picked: a foe that's gone is swapped for another; a friend
   who's down can't be helped (but Wake-Up Call is for them) */
function runPlan(id){
  const P=B.plan[id]; delete B.plan[id];
  const nm=PARTY_INFO[id].name, x=P&&P.x, L=liveFoes();
  const fizzle=t=>{ B.turn='busy'; B.log=t; setTimeout(nextActor,1000); };
  if(!P){ B.turn='busy'; setTimeout(nextActor,150); return; }      /* (asleep when the moves were picked) */
  let f=P.f; if(f&&f.hp<=0) f=L[ri(0,L.length-1)];
  if(P.to&&!standing(P.to)&&!(x&&x.revive)) return fizzle(nm+" turns to help "+PARTY_INFO[P.to].name+", but they're down.");
  if(P.kind==='item'&&!(itemCount(x)>0)) return fizzle("There's no "+itemName(x)+" left!");
  if(x&&P.kind!=='item'&&!canPay(x,id)) return fizzle(nm+" is too worn out for "+x.name+".");
  /* a skill, song or item shows its name for a moment first (NAME_MS); a plain attack
     (or Meditate, Focus, Tiny One's Tweet) just goes, with the text box clear */
  const plain=P.kind==='attack'||P.kind==='tweet'||P.kind==='meditate'||P.kind==='focus';
  if(plain) B.log="";
  else { B.turn='busy'; B.log=P.kind==='item'?itemName(x):x.name;
    setTimeout(()=>{ if(B&&!B.over) runMove(id,P,f,x,L); },NAME_MS); return; }
  runMove(id,P,f,x,L);
}
function runMove(id,P,f,x,L){
  if(P.kind==='item'){ if(itemCount(x)>0) eatInBattle(x,P.to||id); return; }
  if(P.kind==='attack') doAttack(f);
  else if(P.kind==='tweet') doTweet();
  else if(P.kind==='meditate') doMeditate();
  else if(P.kind==='focus') doFocus();
  else if(P.kind==='karate') useKarate(x,f);
  else if(P.kind==='song') useSong(x,x.pow>0?(!x.all&&!x.hits?f:L[0]):null);
  else useSkill(x,P.f?f:null,P.to);
}
/* the highlighted command, keeping it in view */
function setCmd(i){ B.idx=i; B.ctop=clamp(B.ctop||0,Math.max(0,i-CMD_VIS+1),i); }
/* a member's troubles at the start of their turn; returns why they can't act, if so */
function memberTicks(id){
  const S=B.st[id], M=member(id), name=PARTY_INFO[id].name, s=slotOf(id);
  B.wane=S;                              /* Blind and Weak count this turn when it's over */
  B.guard[id]=false;                    /* Meditate's or Focus's bracing lasts until now */
  B.shell[id]=false; if(B.cover&&B.cover.by===id) B.cover=null;     /* and Shell Up's and Cover's */
  const R=B.regen[id]; if(R&&R.n>0){ R.n--; mendMember(id,M.maxhp*R.share); }   /* A True Bird's Nest */
  let why=null;
  if(S.poison>0&&B.shieldAll) S.poison--;            /* (Safe and Sound keeps even poison off) */
  else if(S.poison>0){ const d=Math.max(1,Math.round(M.maxhp*0.07)); M.hp=Math.max(0,M.hp-d); S.poison--;
    pop("-"+d,s.x,headOf(id),'#c88ae0'); why=name+" takes "+d+" from poison."; if(!standing(id)){ downed(id); return why; } }
  if(S.sleep>0){ S.sleep--; return name+" is fast asleep..."; }
  if(S.scared>0){ S.scared--; if(Math.random()<0.5) return name+" is too scared to move!"; }
  return why&&!standing(id)?why:null;
}
/* a party member at 0 HP: Kaitlyn losing ends the fight */
function downed(id){
  if(id==='kaitlyn'){ B.over='lose'; B.log="Kaitlyn is worn out..."; return; }
  B.log+="  "+PARTY_INFO[id].name+" is down!";
}
/* the next one acts (or the fight is over); called when a move's animation ends */
function afterAction(){
  if(!B||B.over) return;
  if(B.pending>0){ setTimeout(afterAction,120); return; }      /* a flurry's last hits still to land */
  if(allDown()){ winFight(); return; }
  setTimeout(nextActor,TURN_GAP); B.turn='busy';
}

/* ---------- what each member can pick ---------- */
const skillList=id=>id==='kaitlyn'?moveList().filter(mv=>mv.id!=='kick'):(ALLY_SKILLS[id]||[]).filter(s=>s.lv<=member(id).lv);
const battleFood=()=>battleItems();             /* crops and goods that heal (17-places.js) */
const PEP_SAVE={save:true,name:"Save it for later"};
const subList=()=>B.menu==='items'?battleFood():B.menu==='pep'?pepSongs().concat([PEP_SAVE]):skillList(actor());
/* Karate Kick and the like cost a share of max HP instead of MP */
const hpCostOf=(sk,id)=>Math.max(1,Math.ceil(member(id).maxhp*sk.hpCost));
const canPay=(sk,id)=>sk.hpCost?member(id).hp>hpCostOf(sk,id):member(id).mp>=sk.mp;
const costText=(sk,id)=>sk.hpCost?hpCostOf(sk,id)+" HP":sk.mp+" MP";
/* the chance to get away: better the quicker the party is than the pests */
function fleeChance(){
  const avg=L=>L.reduce((a,v)=>a+v,0)/Math.max(1,L.length);
  const pa=avg(B.party.filter(standing).map(id=>statOf(id,'agi'))), fa=avg(liveFoes().map(f=>f.agi));
  return clamp(0.5+(pa-fa)*0.04,0.15,0.95);
}
function cmdName(c,id){
  return {attack:"Attack",skills:PARTY_INFO[id].skills,meditate:"Meditate",focus:"Focus",items:"Items",flee:"Flee"}[c];
}
function cmdUsable(c,id){
  if(c==='skills') return skillList(id).length>0;
  if(c==='items') return battleFood().length>0;
  if(c==='flee') return !B.boss;
  return true;
}
/* title and one line of description for the info window */
function cmdInfo(c,id){
  const I=PARTY_INFO[id];
  if(c==='attack') return id==='kaitlyn'?[I.attack,"Free · power from Strength"]
                        :I.tweet?[I.attack,"Free · heals everyone "+Math.round(I.tweet*100)+"% of their max HP"]
                        :I.venom?[I.attack,"Free · always gives Venom · may finish the foe"]
                        :[I.attack,"Free · power from Strength"+(I.crit?" · sharp: more critical hits":"")];
  if(c==='skills') return skillList(id).length?[I.skills,id==='kaitlyn'?"Flute songs (♪) and moves":I.tweet?"Songs (♪) and pecks · uses MP":"Use a skill · uses MP"]
                                              :[I.skills,"None learned yet"];
  if(c==='meditate') return ["Meditate","Half damage till your turn · 5–10% HP/MP back"];
  if(c==='focus') return ["Focus","Half damage till your turn · next hit doubled"];
  if(c==='items') return battleFood().length?["Items","Eat something from your basket"]:["Items","No healing food in your basket"];
  return B.boss?["Flee","You can't run from the HOA President!"]
               :["Flee","Run back to the garden · "+Math.round(fleeChance()*100)+"% chance"];
}
function subInfo(x){
  if(!x) return B.menu==='items'?["Items","Harvest crops to eat them in battle"]:["Skills","None learned yet"];
  if(B.menu==='items') return [itemName(x),itemText(x)];
  if(B.menu==='pep') return x.save?[x.name,"Keep the meter full for another time."]:["♪ "+x.name,x.desc];
  const id=actor();
  if(id==='kaitlyn') return [(x.song?"♪ ":"")+x.name,moveDesc(x)];
  return [(x.song?"♪ ":"")+x.name,x.desc];
}

/* ---------- picking who a move is for ----------
   With more than one to choose from the menu waits (B.menu 'target', B.tgt) for a
   pick: arrows and A, or a tap on them; back returns to where it came from. */
/* Always a pick, even with only one to choose (so the foe's HP shows, and no misfires).
   The lists run top to bottom on the screen. */
function chooseFoe(then){
  const L=topDown(liveFoes());
  B.tgt={kind:'foe',list:L,i:Math.max(0,L.indexOf(B.lastFoe)),then,back:B.menu}; B.menu='target';
  sfx('menu_confirm');
}
/* a friend: anyone standing, or those in `list`; the pointer starts on `start` (or whoever's turn it is) */
function chooseAlly(then,list,start){
  const L=topDown(list||B.party.filter(standing));
  B.tgt={kind:'ally',list:L,i:Math.max(0,L.indexOf(start||actor())),then,back:B.menu}; B.menu='target';
  sfx('menu_confirm');
}
/* a move on every foe (or every friend, or those in `list`): all of them are pointed at,
   and one press lets it go */
function chooseAll(kind,then,list){
  const L=topDown(list||(kind==='foe'?liveFoes():B.party.filter(standing)));
  B.tgt={kind,all:true,list:L,i:0,then:()=>then(),back:B.menu}; B.menu='target';
  sfx('menu_confirm');
}
function pickTarget(i){
  const t=B.tgt, x=t.list[i]; B.tgt=null; B.menu='cmd';
  if(t.kind==='foe'&&!t.all) B.lastFoe=x;
  t.then(x);
}
function cancelTarget(){ B.menu=B.tgt.back; B.tgt=null; sfx('menu_cancel'); }
/* the foe or member drawn at x,y, if any */
function whoAt(x,y){
  for(const f of liveFoes()){ const r=foeBox(f); if(x>=r.x-6&&x<=r.x+r.w+6&&y>=r.y-6&&y<=r.y+r.h+6) return f; }
  for(const id of B.party){ const s=slotOf(id), h=(id==='kaitlyn'?104:52)*s.s;
    if(Math.abs(x-s.x)<=26*s.s&&y>=s.y-h&&y<=s.y+8) return id; }
  return null;
}

/* ---------- input ---------- */
const SUB_ROWS=3, SUB_ROW=21, SUB_Y0=20;
function setSub(i){ B.sub=i; if(i<B.top) B.top=i; if(i>=B.top+SUB_ROWS) B.top=i-SUB_ROWS+1; }
function openSub(kind){ B.menu=kind; B.sub=0; B.top=0; sfx('menu_confirm'); }
function battleKey(k){
  if(!B)return;
  if(B.over){ if(!winSkip()&&!winGuard()) endBattle(); return; }
  if(B.inspect){ B.inspect=null; return; }
  if(B.turn!=='player')return;
  if(B.menu==='target'){
    const n=B.tgt.list.length;
    if(isUp(k)||isLeft(k)) B.tgt.i=(B.tgt.i+n-1)%n;
    if(isDown(k)||isRight(k)) B.tgt.i=(B.tgt.i+1)%n;
    if(isOk(k)) pickTarget(B.tgt.i);
    else if(isBack(k)) cancelTarget();
  } else if(B.menu==='cmd'){
    const n=CMDS.length, flee=CMDS.indexOf('flee');
    if(isUp(k)) setCmd((B.idx+n-1)%n);
    if(isDown(k)) setCmd((B.idx+1)%n);
    if(isOk(k)) pickCmd(CMDS[B.idx]);
    /* cancel goes back to the one before; for the first, it points at Flee first, so a
       stray press doesn't run away */
    if(isBack(k)&&!unplan()){ if(B.idx===flee) tryFlee(); else setCmd(flee); }
  } else {
    const L=subList(), n=L.length;
    if(isUp(k)&&n) setSub((B.sub+n-1)%n);
    if(isDown(k)&&n) setSub((B.sub+1)%n);
    if(isOk(k)&&n) useSub(L[B.sub]);
    else if(isBack(k)&&B.menu==='pep') unplan();
    else if(isBack(k)||isOk(k)) B.menu='cmd';
  }
}
const inRect=(r,x,y)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
function battleTouch(x,y){
  if(!B)return;
  if(B.over){ if(!winSkip()&&!winGuard()) endBattle(); return; }
  if(B.inspect){ B.inspect=null; return; }
  const W=battleWins(), who=whoAt(x,y);
  if(B.turn==='player'&&B.menu==='target'){
    const i=who?B.tgt.list.indexOf(who):-1;
    if(i>=0) pickTarget(i); else cancelTarget();
    return;
  }
  const list=B.menu==='skills'||B.menu==='items'||B.menu==='pep';
  const onWin=B.turn==='player'&&(list?inRect(W.list,x,y)||inRect(W.linfo,x,y):inRect(W.cmd,x,y)||inRect(W.party,x,y)||inRect(W.info,x,y));
  /* a tap on anyone in the scene: what they're like and what's troubling them */
  if(who&&!onWin){ B.inspect=who; sfx('menu_confirm'); return; }
  if(B.turn!=='player')return;
  if(!list){
    /* a tap on a command uses it straight away */
    const C=W.cmd; if(x<C.x||x>C.x+C.w) return;
    const j=Math.floor((y-cmdTop(W))/CMD_ROW), i=j>=0&&j<CMD_VIS?j+(B.ctop||0):-1;
    if(i>=0&&i<CMDS.length){ setCmd(i); pickCmd(CMDS[i]); }
  } else {
    /* a tap on a row uses it; anywhere outside the list goes back */
    const L=W.list;
    if(!inRect(L,x,y)){ if(B.menu!=='pep') B.menu='cmd'; return; }
    const j=Math.floor((y-L.y-SUB_Y0)/SUB_ROW), sl=subList(), i=B.top+j;
    if(j>=0&&j<SUB_ROWS&&i<sl.length){ setSub(i); useSub(sl[i]); }
  }
}
/* a command picked: the move (and who it's for) is set down for when their turn comes */
function pickCmd(c){
  if(c==='attack'){ if(PARTY_INFO[actor()].tweet) chooseAll('ally',()=>plan({kind:'tweet'})); else chooseFoe(f=>plan({kind:'attack',f})); }
  else if(c==='skills') openSub('skills');
  else if(c==='meditate') plan({kind:'meditate'});
  else if(c==='focus') plan({kind:'focus'});
  else if(c==='items') openSub('items');
  else tryFlee();
}
/* a skill, song or item from the list (or a Pep Rally): check it can be paid for, then
   who it's for */
function useSub(x){
  const id=actor();
  if(B.menu==='pep'){ B.pepPick=x.save?null:x;
    if(x.save) B.log="Kaitlyn saves the rally for later.";
    startActions(); return; }
  if(B.menu==='items'){
    const e=isGoodKey(x)?goodEffect(x.slice(2)):null;
    if(e&&(e.hpAll||e.mpAll)) chooseAll('ally',()=>plan({kind:'item',x,to:id})); else chooseAlly(to=>plan({kind:'item',x,to}));
    return;
  }
  if(!canPay(x,id)){ B.log=x.hpCost?"Too worn out for that!":id==='kaitlyn'?"Not enough Music Points!":"Not enough MP!"; sfx('cant_do_that'); return; }
  const others=B.party.filter(m=>m!==id&&standing(m));
  const go=(f,to)=>plan({kind:x.hpCost?'karate':x.notes?'song':'skill',x,f,to});
  if(x.hpCost) chooseFoe(f=>go(f));
  else if(x.notes){ if(x.pow>0&&!x.all&&!x.hits) chooseFoe(f=>go(f));
    else chooseAll(x.pow>0?'foe':'ally',()=>go()); }
  else if(x.mend||x.clear) chooseAlly(to=>go(null,to));
  else if(x.cover||x.coverAll){
    /* friends still standing, not Tex himself */
    if(!others.length){ B.log="There's no one to cover!"; sfx('cant_do_that'); return; }
    if(x.cover) chooseAlly(to=>go(null,to),others,others[0]);
    else chooseAll('ally',()=>go(),others); }
  /* Wake-Up Call: anyone, down or up (the pointer starts on the first one who's down) */
  else if(x.revive) chooseAlly(to=>go(null,to),B.party,B.party.find(m=>!standing(m)));
  else if(x.heal||x.shell||x.graze) chooseAlly(()=>go(),[id]);        /* on themselves */
  else if(x.mendAll||x.cureAll||x.guardAll) chooseAll('ally',()=>go());
  else if(x.all||x.pecks||x.weakAll||x.scareAll) chooseAll('foe',()=>go());
  else chooseFoe(f=>go(f));
}

/* ---------- the party's moves ---------- */
/* Flee: tried at once, for everyone. If it fails the party loses the round (the pests
   still get theirs). */
function tryFlee(){
  if(B.boss){ B.log="The HOA President blocks the gate!"; sfx('cant_do_that'); return; }
  B.turn='busy';
  if(Math.random()<fleeChance()){ B.over='flee'; B.log="You slipped away."; return; }
  B.plan={}; B.skipParty=true; startActions(); B.log="Couldn't get away!";
}
function hitFoe(f,dmg,label){
  const crit=B.turn!=='enemy'&&Math.random()<critChance(actor());
  if(crit){ const d=Math.round(dmg*CRIT_MUL); label=label.replace(String(dmg),String(d))+"  Critical hit!"; dmg=d; }
  /* a guarding pest takes half from every hit until its next turn (when it lets its guard down) */
  if(f.st.guard){ const d=Math.max(1,Math.round(dmg/2)); label=label.replace(String(dmg),String(d))+"  It's guarding!"; dmg=d; }
  f.hp=Math.max(0,f.hp-dmg); f.shake=crit?520:340; f.flash=crit?320:200; focus(f);
  if(FX2){ const r=foeBox(f); f.hitT=0; f.hitBig=crit;
    B.stopT=Math.max(B.stopT||0,crit?130:70); quake(crit?5:2.2,crit?340:200);
    impactFx(r.x+r.w*0.42,r.y+r.h*0.5,crit); }
  if(crit){ pop("-"+dmg+"!",EX,EY-10,'#ff9a3a',52); pop("CRITICAL!",EX,EY-42,'#fff07a',28); B.critT=260; blip(980,0.05,0.18,'square'); }
  else pop("-"+dmg,EX,EY-10,'#ffd24a');
  thud();
  if(f.hp>0&&f.st.sleep&&Math.random()<0.4) f.st.sleep=0;   /* a hit may wake it */
}
/* Blind members miss half their attacks */
function missed(id){ if(has(id,'blind')&&Math.random()<0.5){ B.log=PARTY_INFO[id].name+" misses!"; return true; } return false; }
const weakMul=id=>has(id,'weak')?0.6:1;
const kickPower=pow=>statOf('kaitlyn','str')*1.5*pow*weakMul('kaitlyn')*(wears('kaitlyn','kickers')?1.6:1);
/* Kaitlyn's kicks: the battle row (battle.png) plays, the hit lands partway through */
/* Focus: a member's next hit (every hit of that one move) is twice as hard; this uses it up */
function useCharge(id){ const m=B.charged[id]?2:1; B.charged[id]=false; return m; }
const KICK_SHOUT=0.25;               /* how often a kick comes with a shout */
function kick(f,pow,name,row,shouts,shout,dur){
  if(Math.random()<(shout===undefined?1:shout)) B.shout={txt:shouts[ri(0,shouts.length-1)],t:1500};
  B.kickVar=row; playOne('kick',0.55);
  anim('kick',dur||1100,()=>{
    if(missed('kaitlyn')) return;
    focus(f); const cm=useCharge('kaitlyn'), dmg=soften(kickPower(pow)*rnd(0.85,1.15)*cm,foeDef(f));
    if(FX2) markFoe(row==='karate'?'karate':'kick',f); else { burst(EX-20,EY+16,'#ffe6a0',16,0.19); burst(EX-30,EY+34,'#d8c49a',12,0.13); }
    hitFoe(f,dmg,name+" lands for "+dmg+"!"+(cm>1?"  A focused blow!":""));
  },{tgt:f});
}
function doAttack(f){
  const id=actor(), I=PARTY_INFO[id];
  B.turn='busy';
  if(id==='kaitlyn'){ kick(f,I.pow,"Quick Kick",Math.random()<0.5?'kick':'kick2',KICK_SHOUTS,KICK_SHOUT); return; }
  /* the others' free hit, from Strength. Ivy's is a weak bite, but the venom always takes,
     and now and then it's too much */
  anim('lunge',900,()=>{
    if(missed(id)) return;
    focus(f); const cm=useCharge(id), power=statOf(id,'str')*1.5*I.pow*weakMul(id)*cm*(wears(id,'fangpolish')?1.5:1);
    const dmg=soften(power*rnd(0.85,1.15),foeDef(f));
    if(FX2&&ATTACK_MARK[id]) markFoe(ATTACK_MARK[id],f); else burst(EX-20,EY+20,'#ffe6a0',14,0.17);
    hitFoe(f,dmg,I.name+"'s "+I.attack+" hits for "+dmg+"!"+(cm>1?"  A focused blow!":""));
    if(f.hp<=0||!I.venom) return;
    foeStatus(f,'venom',venomDmg(id));
    burst(EX,EY+10,'#5ab06a',12,0.12);
    if(!f.boss&&Math.random()<KILL_CHANCE){ f.hp=0; B.log=PARTY_INFO.ivy.name+"'s venom finishes it!"; }
  },{tgt:f});
}
/* Karate Kick: twice a Quick Kick, paid for with a little of her HP (its own battle row
   when battle.png has one) */
function useKarate(mv,f){
  const id=actor(), M=member(id), c=hpCostOf(mv,id), s=slotOf(id);
  M.hp=Math.max(1,M.hp-c); pop("-"+c,s.x,headOf(id),'#ffb0a8');
  B.turn='busy'; B.menu='cmd';
  kick(f,mv.pow,mv.name,BROW.karate!==undefined?'karate':'kick',KARATE_SHOUTS,KICK_SHOUT,1500);
}
const songPower=()=>statOf('kaitlyn','int')*1.3*(wears('kaitlyn','polish')?1.3:1)*weakMul('kaitlyn');
/* Tiny One's healing, with the Silver Bell on */
const healMul=id=>wears(id,'bell')?1.2:1;
/* Kaitlyn's songs play out on their own like anyone's skill (no rhythm game): as strong
   as a song played at SONG_ACC */
const SONG_ACC=0.82;
function useSong(mv,f){
  G.player.mp-=mv.mp; B.turn='busy'; B.menu='cmd';
  /* the song's own recording (sfx/<song name>): she plays it through, and its effect lands
     as it ends (anim's atEnd) */
  const acc=SONG_ACC, len=sfx(soundKey(mv.name));
  if(len) duckMusic(len); else playOne('flute',0.5);
  B.log=mv.name;
  {
    anim(mv.fx,1500,()=>{
      /* healing songs reach the whole party: a share of each one's max HP */
      if(mv.heal) B.party.filter(standing).forEach(id=>mendMember(id,member(id).maxhp*mv.heal));
      const pc="", healed=mv.heal?"  Everyone heals!":"";
      const songHit=(t,cm)=>soften(songPower()*mv.pow*(0.35+acc*1.1)*cm,foeDef(t),true);
      if(mv.pow>0&&mv.hits){
        /* hits at whoever's still there, a moment apart (every one lands: see flurry) */
        const cm=useCharge('kaitlyn'), got=[];
        flurry(mv.hits,(t,up)=>{ const dmg=songHit(t,cm);
          if(FX2&&mv.fx==='thorn') thornBurst(t);
          hitFoe(t,dmg,""); got.push(up&&t.hp<=0?dmg+" (it runs off)":String(dmg));
          B.log=total(got)+" damage in all!"; });
      } else if(mv.pow>0&&f){
        /* a song for everyone hits every pest still there; then each may be troubled */
        const T=mv.all?liveFoes():[f], cm=useCharge('kaitlyn'), by={Weakened:[],Bound:[],Poisoned:[]}, sp=spreadMul(T.length);
        T.forEach(t=>{ const dmg=songHit(t,cm*sp);
          hitFoe(t,dmg,mv.name+" hits for "+dmg+"!"+pc);
          if(t.hp<=0) return;
          if(mv.weak&&Math.random()<mv.weak){ foeStatus(t,'weak'); by.Weakened.push(t); }
          if(mv.bind&&Math.random()<mv.bind){ foeStatus(t,'bound'); by.Bound.push(t); }
          if(mv.poison&&Math.random()<mv.poison){ foeStatus(t,'poison'); by.Poisoned.push(t); } });
        B.log="";
      } else B.log="";
    },{tgt:f,hold:len*1000,atEnd:true});
  }
}
/* ---------- Pep Rally (PEP_SONGS) ----------
   Played before anyone moves: the meter empties, the rhythm game plays the song's stretch,
   then it lands, as strong as it was played (attacks and Tangleroot Reel; the others
   always work). Then the round goes on. */
function playRally(s){
  B.turn='busy'; B.act=B.party.indexOf('kaitlyn'); G.pep=0;
  startRhythm(null,{notes:0,name:s.name,mp:0,song:s.song,section:s.sec,pep:s,cb:acc=>{
    G.scene='battle'; B.menu='cmd'; B.log=""; startUlt(s,acc);
  }});
}
/* ---------- the Pep Rally's "ultimate" moment ----------
   After the rhythm game: a flash, and the field goes dark behind everyone, with focus
   lines rushing in on Kaitlyn and staves of notes waving past. A cut-in sweeps across
   (her portrait, the song's name, notes racing by) with a whoosh, a boom and a bright
   chord (a recording, sfx/pep cutin.wav, if there is one). Then she plays on the dark
   stage, notes and comic pops flying off her flute, and as the song lands there's a flash
   and the light comes back.
   Times from the start: the cut-in slides in over ULT_IN, starts to go at ULT_OUT and is
   gone at ULT_GONE, when she starts to play (for ULT_PLAY); the dark lifts over ULT_FADE
   once the song lands. */
const ULT_IN=260, ULT_OUT=1300, ULT_GONE=1520, ULT_PLAY=1800, ULT_FADE=450;
function startUlt(s,acc){
  B.ult={t:0,s,acc,seed:Math.floor(Math.random()*9999)+1,notes:[],pops:[],lit:null,lastPop:0};
  B.critT=200; duckMusic(3.6); ultStinger();
}
function ultStinger(){
  if(sfx('pep_cutin')>0||!AC) return;
  const t=AC.currentTime;
  /* a whoosh: noise through a filter sweeping up */
  const nz=AC.createBufferSource(), bp=AC.createBiquadFilter(), ng=AC.createGain();
  nz.buffer=noiseBuf; bp.type='bandpass'; bp.Q.value=1.1; bp.frequency.setValueAtTime(350,t); bp.frequency.exponentialRampToValueAtTime(5200,t+0.3);
  ng.gain.setValueAtTime(0.0001,t); ng.gain.exponentialRampToValueAtTime(0.55,t+0.14); ng.gain.exponentialRampToValueAtTime(0.001,t+0.42);
  nz.connect(bp); bp.connect(ng); ng.connect(sfxGain); nz.start(t); nz.stop(t+0.45);
  /* a deep boom as it lands */
  const o=AC.createOscillator(), og=AC.createGain(); o.type='sine';
  o.frequency.setValueAtTime(150,t+0.2); o.frequency.exponentialRampToValueAtTime(38,t+0.75);
  og.gain.setValueAtTime(0.0001,t); og.gain.setValueAtTime(0.0001,t+0.19); og.gain.exponentialRampToValueAtTime(0.7,t+0.21); og.gain.exponentialRampToValueAtTime(0.001,t+0.85);
  o.connect(og); og.connect(sfxGain); o.start(t); o.stop(t+0.9);
  /* and a bright chord, rolled up quickly, that rings */
  [1046.5,1318.5,1568,2093].forEach((f,i)=>{ const o=AC.createOscillator(), g=AC.createGain(), st=t+0.2+i*0.03;
    o.type=i%2?'triangle':'square'; o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,st); g.gain.exponentialRampToValueAtTime(i%2?0.13:0.045,st+0.02); g.gain.exponentialRampToValueAtTime(0.001,st+1.1);
    o.connect(g); g.connect(sfxGain); o.start(st); o.stop(st+1.15); });
}
/* moves the moment on; returns how dark the stage is (0 once it's over) */
function updateUlt(dt){
  const U=B.ult; if(!U) return 0;
  U.t+=dt;
  if(!U.played&&U.t>=ULT_GONE){ U.played=true; const s=U.s; playOne('flute',0.5); B.log=s.name;
    anim(s.pow?'hymn':'lull',ULT_PLAY,()=>{ rallyLands(s,U.acc); U.lit=U.t; B.critT=320; quake(6,360); },
      {tgt:s.pow?liveFoes()[0]:null,heal:!s.pow&&!s.bindAll}); }
  if(U.lit!==null&&U.t-U.lit>=ULT_FADE){ B.ult=null; return 0; }
  return U.lit!==null?1-(U.t-U.lit)/ULT_FADE:Math.min(1,U.t/160);
}
/* a music note, drawn smooth: head, stem and flag, or two joined by a beam (sz: its height) */
function ultNote(c,x,y,sz,col,rot,two){
  c.save(); c.translate(x,y); c.rotate(rot||0); c.fillStyle=col; c.strokeStyle=col;
  const r=sz*0.2, sx=r*1.05;
  c.beginPath(); c.ellipse(0,0,r*1.25,r*0.9,-0.4,0,TAU); c.fill();
  if(two){ c.beginPath(); c.ellipse(sz*0.62,-sz*0.12,r*1.25,r*0.9,-0.4,0,TAU); c.fill(); }
  c.lineWidth=Math.max(0.8,sz*0.09);
  c.beginPath(); c.moveTo(sx,0); c.lineTo(sx,-sz);
  if(two){ c.moveTo(sz*0.62+sx,-sz*0.12); c.lineTo(sz*0.62+sx,-sz*1.12); c.stroke();
    c.lineWidth=sz*0.18; c.beginPath(); c.moveTo(sx,-sz+sz*0.08); c.lineTo(sz*0.62+sx,-sz*1.12+sz*0.08); }
  else { c.stroke(); c.beginPath(); c.moveTo(sx,-sz); c.quadraticCurveTo(sx+sz*0.45,-sz*0.72,sx+sz*0.3,-sz*0.4); }
  c.stroke(); c.restore();
}
const ULT_COLS=['#ffe08a','#ff9ad0','#a8e0ff','#b8f0a0'];
/* the dark stage, over the backdrop and behind everyone: deep purple round Kaitlyn going
   black at the edges, focus lines rushing in on her (dealt afresh every few frames), and
   two staves of notes waving past */
function drawUltStage(a){
  const U=B.ult, T0=BAND_TOP(), T1=BAND_BOT(), H=T1-T0, P=slotOf('kaitlyn'), cx=P.x, cy=P.y-44*P.s;
  b.save(); b.globalAlpha=a*0.94;
  const g=b.createRadialGradient(cx,cy,8,cx,cy,H*0.85); g.addColorStop(0,'#4a1a5e'); g.addColorStop(0.45,'#1a0a28'); g.addColorStop(1,'#040208');
  b.fillStyle=g; b.fillRect(-10,T0,LW+20,H);
  let sd=Math.floor(U.t/55)*7919+U.seed; const r=()=>(sd=(sd*16807+11)%2147483647)/2147483647;
  b.fillStyle='#ffffff';
  for(let i=0;i<58;i++){ const an=r()*TAU, w=0.004+r()*0.014, r0=62+r()*80, R=H*1.3;
    b.globalAlpha=a*(0.1+r()*0.28);
    b.beginPath(); b.moveTo(cx+Math.cos(an)*r0,cy+Math.sin(an)*r0);
    b.lineTo(cx+Math.cos(an-w)*R,cy+Math.sin(an-w)*R); b.lineTo(cx+Math.cos(an+w)*R,cy+Math.sin(an+w)*R); b.fill(); }
  const notes=[];
  b.globalAlpha=1; b.globalCompositeOperation='lighter'; b.lineWidth=0.9;
  for(let k=0;k<2;k++){ const y0=T0+H*(0.2+k*0.36), ph=U.t/320+k*2.2, dir=k?-1:1, wav=x=>Math.sin(x/62+ph)*15*dir;
    b.strokeStyle=k?'rgba(255,130,200,'+(0.4*a)+')':'rgba(255,215,120,'+(0.4*a)+')';
    for(let l=0;l<5;l++){ b.beginPath(); for(let x=-12;x<=LW+12;x+=8){ const y=y0+l*4.2+wav(x); x===-12?b.moveTo(x,y):b.lineTo(x,y); } b.stroke(); }
    for(let n=0;n<6;n++){ const span=LW+80, x=((n*67+U.t*0.3*dir)%span+span)%span-40;
      notes.push([x,y0+8.4+wav(x)+((n*3)%5-2)*2.1,k,n]); } }
  b.restore();
  notes.forEach(([x,y,k,n])=>{ glowAt(x,y-4,9,k?'#ff8ac8':'#ffd860',a*0.55); b.globalAlpha=a; ultNote(b,x,y,10,k?'#ffd0ea':'#fff2c0',0,n%3===0); });
  b.globalAlpha=1;
}
/* in front of everyone while she plays: notes flying off her flute, and comic pops */
function drawUltFront(dt,a){
  const U=B.ult, T0=BAND_TOP(), H=BAND_BOT()-T0, P=slotOf('kaitlyn'), fx=P.x+16*P.s, fy=P.y-66*P.s;
  if(U.played&&U.lit===null){
    if(Math.random()<dt/55) U.notes.push({x:fx,y:fy,vx:rnd(-0.02,0.2),vy:rnd(-0.16,-0.03),t:0,life:rnd(650,1050),col:ULT_COLS[ri(0,3)],rot:rnd(-0.5,0.5),vr:rnd(-0.004,0.004),sz:rnd(8,13)});
    if(U.t-U.lastPop>330&&U.pops.length<3){ U.lastPop=U.t;
      U.pops.push({x:rnd(36,LW-36),y:rnd(T0+30,T0+H*0.55),t:0,r:rnd(18,26),rot:rnd(-0.35,0.35),col:ULT_COLS[ri(0,3)],word:['♪','♫','!!','♪!'][ri(0,3)]}); }
  }
  U.notes.forEach(n=>{ n.t+=dt; n.x+=n.vx*dt; n.y+=n.vy*dt; n.rot+=n.vr*dt; const q=1-n.t/n.life;
    glowAt(n.x+2,n.y-n.sz*0.5,n.sz,n.col,q*a*0.7); b.globalAlpha=Math.max(0,q*a); ultNote(b,n.x,n.y,n.sz,n.col,n.rot,n.sz>11); });
  U.notes=U.notes.filter(n=>n.t<n.life);
  U.pops.forEach(p=>{ p.t+=dt; const sc=p.t<120?p.t/120*1.25:p.t<200?1.25-0.25*(p.t-120)/80:1, al=p.t>420?1-(p.t-420)/140:1;
    if(al<=0) return;
    b.save(); b.translate(p.x,p.y); b.rotate(p.rot); b.scale(sc,sc); b.globalAlpha=al*a;
    b.beginPath(); for(let i=0;i<28;i++){ const an=i/28*TAU, rr=i%2?p.r*0.62:p.r*(i%4?1:1.18); b.lineTo(Math.cos(an)*rr,Math.sin(an)*rr*0.8); } b.closePath();
    b.fillStyle='#fffbe8'; b.fill(); b.lineWidth=1.6; b.strokeStyle='#2a1430'; b.stroke();
    b.beginPath(); for(let i=0;i<28;i++){ const an=i/28*TAU, rr=(i%2?p.r*0.62:p.r)*0.72; b.lineTo(Math.cos(an)*rr,Math.sin(an)*rr*0.8); } b.closePath();
    b.fillStyle=p.col; b.fill();
    b.font='bold '+Math.round(p.r*0.9)+'px '+FONT; b.textAlign='center'; b.textBaseline='middle'; b.lineJoin='round'; b.lineWidth=2.4; b.strokeStyle='#2a1430';
    b.strokeText(p.word,0,1); b.fillStyle='#ffffff'; b.fillText(p.word,0,1);
    b.restore(); });
  U.pops=U.pops.filter(p=>p.t<560); b.globalAlpha=1;
}
/* The cut-in, over everything (windows too), on the screen canvas so her portrait stays
   sharp: a tilted band sweeping in from the right, plum to pink to gold, with streaks and a
   staff of notes racing through it, her portrait sliding in at the left with two
   afterimages, and the song's name slamming in at the right. It squashes away at ULT_OUT. */
function drawUltBand(){
  const U=B.ult; if(!U||U.t>=ULT_GONE) return;
  const t=U.t, T0=BAND_TOP(), T1=BAND_BOT(), cy=T0+(T1-T0)*0.4, BH=96;
  const e=1-Math.pow(1-clamp(t/ULT_IN,0,1),3), o=clamp((t-ULT_OUT)/(ULT_GONE-ULT_OUT),0,1);
  const h=BH*(1-o*o), slide=(1-e)*LW*1.35-o*o*LW*0.25; if(h<1) return;
  m.save(); m.scale(SC,SC); m.translate(LW/2+slide,cy); m.rotate(-0.075);
  const X0=-LW*0.75, W=LW*1.5;
  /* its glow and rims */
  m.fillStyle='rgba(255,240,200,.9)'; m.fillRect(X0,-h/2-3,W,h+6);
  m.fillStyle='#ffd24a'; m.fillRect(X0,-h/2-1.6,W,h+3.2);
  m.save(); m.beginPath(); m.rect(X0,-h/2,W,h); m.clip();
  const g=m.createLinearGradient(-LW/2,0,LW/2,0);
  g.addColorStop(0,'#2a0a3a'); g.addColorStop(0.32,'#9a1a5a'); g.addColorStop(0.62,'#f0506a'); g.addColorStop(1,'#ffb43c');
  m.fillStyle=g; m.fillRect(X0,-h/2,W,h);
  /* slanted darker bars and white streaks racing left */
  m.fillStyle='rgba(20,0,30,.16)';
  for(let i=0;i<20;i++){ const x=X0+((i*34-t*0.22)%(34*20)+34*20)%(34*20); m.beginPath(); m.moveTo(x,-h/2); m.lineTo(x+14,-h/2); m.lineTo(x-8,h/2); m.lineTo(x-22,h/2); m.fill(); }
  let sd=U.seed; const r=()=>(sd=(sd*16807+11)%2147483647)/2147483647;
  m.fillStyle='#ffffff';
  for(let i=0;i<30;i++){ const y=(r()-0.5)*h*0.95, len=30+r()*90, sp=1.1+r()*1.4, x=X0+((r()*W-t*sp)%W+W)%W;
    m.globalAlpha=0.18+r()*0.45; m.fillRect(x,y,len,0.5+r()*1.3); }
  m.globalAlpha=1;
  /* a staff across its lower part, notes racing along it */
  const sy=h*0.16; m.strokeStyle='rgba(255,236,170,.55)'; m.lineWidth=0.7;
  for(let l=0;l<5;l++){ m.beginPath(); m.moveTo(X0,sy+l*4); m.lineTo(X0+W,sy+l*4); m.stroke(); }
  for(let n=0;n<9;n++){ const x=X0+((n*57-t*0.55)%W+W)%W; ultNote(m,x,sy+4+((n*5)%7-3)*2,11,n%2?'#fff2c0':'#ffffff',0,n%3===1); }
  /* her portrait, two afterimages trailing it */
  const im=IMG_PT; if(im.complete&&im.naturalWidth){
    const ph=BH*1.62, pw=ph*im.naturalWidth/im.naturalHeight, pin=1-Math.pow(1-clamp((t-60)/300,0,1),3);
    const px0=-LW/2+4-(1-pin)*120+t*0.012, py=-10-0.39*ph;
    m.imageSmoothingEnabled=true;
    [[-26,0.16],[-13,0.3]].forEach(([dx,al])=>{ m.globalAlpha=al*pin; m.drawImage(im,px0+dx,py,pw,ph); });
    m.globalAlpha=1; m.drawImage(im,px0,py,pw,ph); }
  m.restore();
  /* the song's name, slammed in from the right */
  const nk=clamp((t-140)/200,0,1), nx=LW/2-12+Math.pow(1-nk,3)*220, name=U.s.name.toUpperCase()+"!";
  let size=32; m.font='italic bold '+size+'px '+FONT; const tw=m.measureText(name).width;
  if(tw>LW*0.6){ size=Math.floor(size*LW*0.6/tw); m.font='italic bold '+size+'px '+FONT; }
  m.textAlign='right'; m.textBaseline='alphabetic'; m.lineJoin='round';
  m.globalAlpha=nk*(1-o); m.lineWidth=5; m.strokeStyle='#2a0a24'; m.strokeText(name,nx,h*0.02+6);
  const tg=m.createLinearGradient(0,-size*0.6,0,6); tg.addColorStop(0,'#ffffff'); tg.addColorStop(1,'#ffe48a');
  m.fillStyle=tg; m.fillText(name,nx,h*0.02+6);
  m.font='bold 12px '+FONT; m.lineWidth=3; m.strokeText("★ PEP RALLY ★",nx-4,-size*0.78+6); m.fillStyle='#ffd24a'; m.fillText("★ PEP RALLY ★",nx-4,-size*0.78+6);
  m.globalAlpha=1; m.restore();
}
function rallyLands(s,acc){
  const pc="  ("+Math.round(acc*100)+"%)", up=B.party.filter(standing);
  const sparkle=m=>{ const p=slotOf(m); burst(p.x,headOf(m)+14*p.s,'#fff6c8',8,0.08); };
  /* (a song may do more than one of these: Tangleroot Reel hits and binds, Clean Slate
     cures and heals) */
  const said=[];
  if(s.pow){ const T=liveFoes(), sp=spreadMul(T.length); T.forEach(t=>hitFoe(t,soften(songPower()*s.pow*sp*(0.35+acc*1.1),foeDef(t),true),"")); }
  if(s.bindAll){ const got=liveFoes().filter(t=>Math.random()<0.4+0.6*acc); got.forEach(t=>{ foeStatus(t,'bound'); focus(t); burst(EX,EY+10,'#8a6a3a',10,0.1); });
    if(!got.length) said.push("The pests wriggle free."); }
  if(s.cureAll){ up.forEach(m=>{ Object.keys(STATUS).forEach(k=>B.st[m][k]=0); sparkle(m); }); said.push("Troubles shaken off!"); }
  if(s.heal) up.forEach(m=>mendMember(m,member(m).maxhp*s.heal));
  if(s.chargeAll){ up.forEach(m=>{ B.charged[m]=true; sparkle(m); }); said.push("Everyone's fired up!"); }
  if(s.shieldAll){ B.shieldAll=true; up.forEach(sparkle); said.push("Everyone's safe this turn!"); }
  B.log=said.join("  ");
}
/* the Pep meter fills a little with every hit the party takes (more for a big one):
   PEP_HIT for any hit, plus PEP_HURT times the share of max HP it took */
const PEP_HIT=3, PEP_HURT=8;
function pepFill(id,dmg){
  if(!pepKnown()||dmg<=0) return;
  const was=G.pep||0; G.pep=Math.min(PEP_MAX,was+PEP_HIT+Math.round(PEP_HURT*dmg/Math.max(1,member(id).maxhp)));
  if(was<PEP_MAX&&G.pep>=PEP_MAX) B.pepFlash=1200;
}
/* A move of n quick hits, a moment apart: each lands on someone still standing, or, once
   they're all beaten, on the last one it hit, so a flurry is never cut short. hit(t, up):
   up, whether t was standing. B.pending keeps beaten pests from fading, and the win from
   coming, until the last hit has landed. */
function flurry(n,hit){
  let last=null; B.pending=(B.pending||0)+n;
  for(let i=0;i<n;i++) setTimeout(()=>{
    if(!B) return; B.pending--;
    if(B.over) return;
    const L=liveFoes(), t=L.length?L[ri(0,L.length-1)]:last||B.foes[B.foes.length-1];
    last=t; hit(t,t.hp>0);
  },i*170);
}
/* healing: +h HP to member id, with a pop and a few sparkles */
function mendMember(id,h){
  const M=member(id), s=slotOf(id); h=Math.max(1,Math.round(h));
  M.hp=Math.min(M.maxhp,M.hp+h); pop("+"+h,s.x,headOf(id),'#8fe07a');
  if(FX2) healFx(id); else burst(s.x,headOf(id)+14*s.s,'#c8f0b0',7,0.08); return h;
}
/* Tiny One's Tweet: everyone standing gets back a share of their max HP (PARTY_INFO tweet) */
function doTweet(){
  const id=actor(), I=PARTY_INFO[id];
  B.turn='busy';
  const len=sfx('tiny_tweet');
  anim('sing',1100,()=>{
    B.party.filter(standing).forEach(m=>mendMember(m,member(m).maxhp*I.tweet*healMul(id)));
    B.log="";
    if(!len&&AC){ flute(19,AC.currentTime,.12,.3); flute(23,AC.currentTime+.1,.14,.3); }
  },{heal:true,hold:len*1000-200});
}
/* a friend's skill (ALLY_SKILLS); f is the foe it's aimed at, to the friend it's for */
function useSkill(sk,f,to){
  const id=actor(), M=member(id), name=PARTY_INFO[id].name;
  const sings=sk.song?" sings ":" uses ", st=sk.stat||'int', magic=!sk.stat;   /* power from Intelligence is magic */
  M.mp-=sk.mp; B.turn='busy'; B.menu='cmd';
  const spell=PARTY_ART[id]&&PARTY_ART[id].spell;      /* their own spell animation, when they have one */
  const kind=sk.graze?'meditate':sk.deathroll||sk.steal&&!sk.pecks?'lunge':spell?'spell':sk.song?'sing':sk.heal?'meditate':'lunge';
  const kind_heal=!!(sk.heal||sk.mend||sk.mendAll||sk.cureAll||sk.guardAll||sk.clear||sk.revive||sk.shell||sk.cover||sk.coverAll||sk.graze);
  /* their recorded voice: from the start, or (pecks) with the hits */
  const voice=SKILL_SOUND[sk.id]||(id==='tiny'&&sk.song?'tiny_songs':null), atHit=voice&&sk.pecks;
  const sheet=FX2&&haveSheet(SKILL_SHEET[sk.id])&&SKILL_SHEET[sk.id]; if(sheet) sheetImg(sheet);     /* (start loading it) */
  const len=voice&&!atHit?sfx(voice):0;
  anim(kind,spell?1400:sk.song?1300:1000,()=>{
    if(atHit) sfx(voice);
    /* Tiny One's songs */
    if(sk.mend){ const h=mendMember(to,member(to).maxhp*sk.mend*healMul(id));
      B.log=""; return; }
    /* Tex */
    if(sk.shell){ B.shell[id]=true; B.guard[id]=true; const s=slotOf(id); burst(s.x,headOf(id)+20*s.s,'#bfe8ff',8,0.06);
      B.log=name+" pulls into his shell."; return; }
    if(sk.cover){ B.cover={by:id,to}; B.guard[id]=true; const s=slotOf(to); burst(s.x,headOf(to)+20*s.s,'#bfe8ff',8,0.06);
      B.log=name+" guards "+PARTY_INFO[to].name+"."; return; }
    /* VitaShell: Cover for everyone at once */
    if(sk.coverAll){ B.cover={by:id,all:true}; B.guard[id]=true;
      B.party.filter(m=>m!==id&&standing(m)).forEach(m=>{ const s=slotOf(m); burst(s.x,headOf(m)+20*s.s,'#bfe8ff',6,0.06); });
      B.log=name+" guards everyone."; return; }
    /* Graze: Tex mends himself at the start of each of his next few turns */
    if(sk.graze){ B.regen[id]={n:sk.graze.n,share:sk.graze.share}; const s=slotOf(id); burst(s.x,headOf(id)+20*s.s,'#8fe07a',8,0.06);
      B.log=name+" will mend for "+sk.graze.n+" turns."; return; }
    /* Tituba's Hiss: each foe may be scared, and may be weakened */
    if(sk.weakAll||sk.scareAll){ const by={Scared:[],Weakened:[]};
      liveFoes().forEach(t=>{ let any=false;
        if(sk.scareAll&&Math.random()<sk.scareAll){ foeStatus(t,'scared'); by.Scared.push(t); any=true; }
        if(sk.weakAll&&Math.random()<sk.weakAll){ foeStatus(t,'weak'); by.Weakened.push(t); any=true; }
        if(any){ focus(t); burst(EX,EY+10,'#f0b070',8,0.1); } });
      B.log=by.Scared.length||by.Weakened.length?"":"No one's impressed."; return; }
    /* Ivy's Ssssss: one foe is scared */
    if(sk.scare){
      if(Math.random()<sk.scare){ foeStatus(f,'scared'); B.log=""; }
      else B.log="The "+f.name+" isn't scared.";
      return; }
    /* Tituba's Snitch */
    if(sk.steal&&!sk.pecks){ const r=trySteal(id,f);
      B.log=r.k?"Snitched a "+GOODS[r.k].name+"!"
        :r.why==='miss'?"Nothing snitched."
        :"Nothing left to steal.";
      return; }
    if(sk.mendAll){ B.party.filter(standing).forEach(m=>{ mendMember(m,member(m).maxhp*sk.mendAll*healMul(id));
        if(sk.regen) B.regen[m]={n:sk.regen.n,share:sk.regen.share*healMul(id)}; });
      B.log=sk.regen?"Everyone will keep mending for "+sk.regen.n+" turns.":""; return; }
    if(sk.clear){ const S=B.st[to]||(B.st[to]={}); Object.keys(STATUS).forEach(k=>S[k]=0);
      const s=slotOf(to); burst(s.x,headOf(to)+14*s.s,'#fff6c8',8,0.08);
      B.log=PARTY_INFO[to].name+"'s troubles are gone!"; return; }
    if(sk.revive){ const T=member(to);
      if(standing(to)){ const h=T.maxhp-T.hp;          /* someone who's up is filled to full */
        if(h>0) mendMember(to,h);
        B.log=h>0?"":PARTY_INFO[to].name+" was already at full HP."; return; }
      B.st[to]={}; B.regen[to]=null; mendMember(to,T.maxhp*sk.revive*healMul(id));
      B.log=PARTY_INFO[to].name+" is back up!"; return; }
    if(sk.pecks){
      /* quick pecks at whoever's still there, a moment apart */
      /* (full: each at a single hit's full power; steal: each also tries to steal first) */
      const cm=useCharge(id), got=[], took=[]; let hitN=0;
      flurry(sk.pecks,(t,up)=>{
        if(sheet) sheetHit(sheet,t,hitN++,sk.pecks);
        else if(FX2&&SKILL_MARK[sk.id]) markFoe(SKILL_MARK[sk.id],t,{jx:rnd(-10,10),jy:rnd(-10,10)});
        if(sk.steal&&up){ const r=trySteal(id,t); if(r.k) took.push(GOODS[r.k].name); }
        if(has(id,'blind')&&Math.random()<0.5){ focus(t); pop("miss",EX,EY-10,'#e8eef8'); got.push("miss"); }
        else { const dmg=soften(statOf(id,sk.stat||'agi')*(sk.full?1.5:1)*sk.pow*weakMul(id)*cm*rnd(0.85,1.15),foeDef(t));
          hitFoe(t,dmg,""); burst(EX-10,EY+16,'#ffe6a0',8,0.14); got.push(up&&t.hp<=0?dmg+" (it runs off)":String(dmg)); }
        B.log=total(got)+" damage in all!"+(took.length?"  Snitched "+listAnd(took)+"!":""); });
      return;
    }
    if(sk.cureAll){ B.party.filter(standing).forEach(m=>{ const S=B.st[m]||(B.st[m]={});
        Object.keys(STATUS).forEach(k=>S[k]=0); const s=slotOf(m); burst(s.x,headOf(m)+14*s.s,'#fff6c8',7,0.08); });
      B.log="Every trouble is shaken off!"; return; }
    if(sk.guardAll){ B.party.filter(standing).forEach(m=>{ B.guard[m]=true; const s=slotOf(m); burst(s.x,headOf(m)+20*s.s,'#bfe8ff',6,0.06); });
      B.log="Everyone braces."; return; }
    if(sk.all&&sk.pow){
      const cm=useCharge(id), T=liveFoes(), moon=sk.night&&isNight()?sk.night:1, sp=spreadMul(T.length);
      const by={Weakened:[],Poisoned:[],Envenomed:[],Blinded:[]};
      B.critUp=sk.crit||0;
      T.forEach(t=>{ const dmg=soften(statOf(id,st)*1.5*sk.pow*moon*sp*cm*weakMul(id)*rnd(0.9,1.1),foeDef(t),magic);
        hitFoe(t,dmg,"");
        if(t.hp<=0) return;
        if(sk.weak&&Math.random()<sk.weak){ foeStatus(t,'weak'); by.Weakened.push(t); }
        /* Snakespit: a separate chance of each */
        if(sk.spit){
          if(Math.random()<sk.spit){ foeStatus(t,'poison'); by.Poisoned.push(t); }
          if(Math.random()<sk.spit){ foeStatus(t,'venom',venomDmg(id)); by.Envenomed.push(t); }
          if(Math.random()<sk.spit){ foeStatus(t,'blind'); by.Blinded.push(t); } } });
      B.critUp=0;
      B.log=moon>1?"The moon makes it stronger!":"";
      return;
    }
    if(sk.sleep){      /* Hypnosis: the foe nods off for a few turns (a boss shrugs it off more often) */
      if(Math.random()<sk.sleep*(f.boss?0.5:1)){ f.st.sleep=2+ri(0,1); troubleFx(f,'sleep'); B.log=""; }
      else B.log="The "+f.name+" shakes it off.";
      return;
    }
    if(sk.heal){
      const h=Math.round(M.maxhp*sk.heal), s=slotOf(id);
      M.hp=Math.min(M.maxhp,M.hp+h); pop("+"+h,s.x,headOf(id),'#8fe07a');
      if(sk.cure) ['poison','blind','weak'].forEach(k=>B.st[id][k]=0);
      B.log="";
      return;
    }
    /* Deathroll: a sleeping foe is finished at once (a boss takes x6) and Ivy mends; awake,
       a hard hit */
    if(sk.deathroll){ const cm=useCharge(id), asleep=f.st.sleep>0;
      if(FX2) markFoe('roll',f);
      if(asleep&&!f.boss){ hitFoe(f,f.hp,""); B.log="The "+f.name+" never woke up."; }
      else { const dmg=soften(statOf(id,st)*1.5*sk.pow*(asleep?6:1)*cm*weakMul(id)*rnd(0.9,1.1),foeDef(f),magic);
        hitFoe(f,dmg,""); B.log=asleep?"A crushing roll! (x6)":""; }
      if(asleep) mendMember(id,M.maxhp*sk.rollHeal);
      return; }
    /* Venom Burst: x3 for Venom, x2 for Poison (x6 with both), and they're used up */
    const cm=useCharge(id); let bm=1;
    if(sk.burst){ if(f.st.venom) bm*=3; if(f.st.poison>0) bm*=2; if(bm>1){ f.st.venom=null; f.st.poison=0; } }
    const dmg=soften(statOf(id,st)*1.5*sk.pow*cm*bm*weakMul(id)*rnd(0.9,1.1),foeDef(f),magic);
    B.critUp=sk.crit||0;
    if(FX2&&SKILL_MARK[sk.id]) markFoe(SKILL_MARK[sk.id],f);
    hitFoe(f,dmg,name+"'s "+sk.name+" hits for "+dmg+"!"+(bm>1?"  The venom bursts! (x"+bm+")":"")+(cm>1?"  A focused blow!":""));
    B.critUp=0;
    if(f.hp>0&&sk.bind&&Math.random()<sk.bind){ f.st.bound=1; troubleFx(f,'bound'); }
  },{heal:kind_heal,tgt:f,hold:len*1000-200,sheet:!!sheet});
}
/* Focus: braced like Meditate (half damage until their next turn), and the next hit they
   land is twice as hard */
function doFocus(){
  const id=actor(), name=PARTY_INFO[id].name;
  B.turn='busy';
  anim('focus',1100,()=>{ B.guard[id]=true; B.charged[id]=true;
    B.log=name+" focuses.";
    if(AC){ flute(14,AC.currentTime,.4,.35); flute(19,AC.currentTime+.15,.5,.3); } });
}
/* half damage until their next turn, and 5-10% of HP and MP back */
function doMeditate(){
  const id=actor(), M=member(id), name=PARTY_INFO[id].name;
  B.turn='busy';
  anim('meditate',1100,()=>{
    const mx=memberMaxMp(id);
    const h=Math.max(1,Math.round(M.maxhp*rnd(0.05,0.10))), p=Math.max(1,Math.round(mx*rnd(0.05,0.10)));
    M.hp=Math.min(M.maxhp,M.hp+h); M.mp=Math.min(mx,M.mp+p); B.guard[id]=true;
    const s=slotOf(id); pop("+"+h,s.x,headOf(id),'#8fe07a');
    B.log="";
    if(AC){ flute(9,AC.currentTime,.5,.35); flute(13,AC.currentTime+.18,.6,.3); }
  });
}
/* the one whose turn it is eats, or hands it to `to` */
function eatInBattle(sp,to){
  const id=actor(), name=PARTY_INFO[id].name;
  to=to||id;
  B.turn='busy'; B.menu='cmd';
  anim('eat',800,()=>{
    const before=member(to).hp, item=itemName(sp), text=useItem(sp,to), gain=member(to).hp-before, s=slotOf(to);
    if(gain>0) pop("+"+gain,s.x,headOf(to),'#8fe07a');
    B.log="";
    if(isDrink(sp)) sfx('drink'); else if(AC){ blip(620,0.06,0.1,'sine'); flute(9,AC.currentTime+.06,.25,.4); }
  },{eater:to});
}

/* ---------- a pest's turn ----------
   Anything but its plain first skill is a special move: it flashes and the move's
   name shows (B.prep, B.banner) a moment before it lets loose. */
const PREP_MS=1800;
/* the pause between one fighter's move and the next (ms), and how long a move's name shows
   before it happens (NAME_MS) */
const TURN_GAP=650, NAME_MS=1800;
function foeTurn(f){
  if(!B||B.over) return;
  const P=PESTS[f.sp], F=f.st;
  F.guard=0; focus(f); B.wane=F;
  /* Venom (a set amount) and Poison (7% of its max HP, as for the party) */
  const ven=!!F.venom, poi=F.poison>0;
  if(ven||poi){ let d=0;
    if(ven){ d+=F.venom.dmg; if(--F.venom.n<=0) F.venom=null; }
    if(poi){ d+=Math.max(1,Math.round(f.maxhp*0.07)); F.poison--; }
    f.hp=Math.max(0,f.hp-d); pop("-"+d,EX,EY-10,'#c88ae0'); burst(EX,EY+10,ven?'#5ab06a':'#b06ae0',8,0.1);
    B.log="";
    if(f.hp<=0){ setTimeout(()=>{ if(!B||B.over) return; if(allDown()) winFight(); else nextActor(); },900); return; } }
  if(F.bound>0){ F.bound--; B.log="The "+f.name+" can't move!"; setTimeout(nextActor,1400); return; }
  if(F.sleep>0){ F.sleep--; B.log="The "+f.name+" is asleep."; setTimeout(nextActor,1400); return; }
  if(F.scared>0){ F.scared--; if(Math.random()<0.5){ B.log="The "+f.name+" is too scared to move!"; setTimeout(nextActor,1400); return; } }
  const charged=F.charge; F.charge=0;
  /* a charged-up pest always lets loose with its strongest hit */
  const sk=charged?P.skills.filter(s=>s.kind==='hit').sort((a,z)=>z.pow-a.pow)[0]:pickWeighted(P.skills);
  const live=B.party.filter(standing);
  let targets=sk.kind==='all'?live:sk.kind==='multi'?Array.from({length:sk.hits},()=>live[ri(0,live.length-1)])
               :sk.kind==='hit'||sk.kind==='steal'?[live[ri(0,live.length-1)]]:[];
  /* Tex's Cover: what's aimed at the one he covers (or anyone, with VitaShell) hits him
     (not a hit on everyone) */
  const C=B.cover, moved=t=>!!(C&&sk.kind!=='all'&&standing(C.by)&&t!==C.by&&(C.all||t===C.to));
  const savedFrom=[...new Set(targets.filter(moved))];
  if(savedFrom.length) targets=targets.map(t=>moved(t)?C.by:t);
  const cover=savedFrom.length?{by:C.by,to:savedFrom}:null;
  const go=()=>{ if(!B||B.over) return; B.prep=null;
    if(sk===P.skills[0]&&!charged) B.log="";
    anim('enemy',sk.kind==='multi'?1300:900,()=>foeHits(f,sk,targets,charged,cover),{fx:sk.fx,targets,self:!targets.length,foe:f}); };
  if(sk!==P.skills[0]||charged){
    B.prep={f,t:0};
    B.log=sk.name;
    blip(740,0.05,0.12,'triangle'); setTimeout(go,PREP_MS);
  } else go();
}
function pickWeighted(list){ let t=list.reduce((a,s)=>a+s.w,0)*Math.random();
  for(const s of list){ t-=s.w; if(t<=0) return s; } return list[0]; }
function foeHits(f,sk,targets,charged,cover){
  if(!B||B.over) return;
  const F=f.st; focus(f);
  if(FX2&&(sk.kind==='guard'||sk.kind==='charge'||sk.kind==='heal')){ const r=foeBox(f), cx=r.x+r.w/2, cy=r.y+r.h*0.6;
    if(sk.kind==='guard') glow({x:cx,y:cy,ring:true,r0:r.w*0.7,r1:r.w*0.45,w:3,life:600,col:'#9ad4ff'});
    else for(let i=0;i<12;i++) glow({x:cx+rnd(-r.w/2,r.w/2),y:r.y+r.h-rnd(0,8),vy:-rnd(0.03,0.07),size:rnd(2.5,4),life:rnd(600,900),
      col:sk.kind==='charge'?(i%2?'#ff7050':'#ffc070'):(i%2?'#8fe07a':'#e8ffd8'),fin:true}); }
  if(sk.kind==='guard'){ F.guard=1; B.log="The "+f.name+" is guarding."; return; }
  if(sk.kind==='charge'){ F.charge=1; B.log="The "+f.name+" is powering up!"; return; }
  if(sk.kind==='heal'){ const h=Math.round(f.maxhp*sk.heal); f.hp=Math.min(f.maxhp,f.hp+h);
    pop("+"+h,EX,EY-10,'#8fe07a'); B.log=""; return; }
  if(sk.kind==='steal'){
    const id=targets[0], luck=statOf(id,'luk');
    if(F.blind>0&&Math.random()<0.5){ B.log="It grabs at thin air!"; return; }
    if(Math.random()<luck*0.02){ B.log=PARTY_INFO[id].name+" keeps a tight grip on the coin purse!"; return; }
    const n=Math.min(G.coins,Math.round(f.atk*1.5+ri(0,6))); G.coins-=n;
    const s=slotOf(id); pop("-"+n+"c",s.x,headOf(id),'#ffd24a');
    B.log="The "+f.name+" makes off with "+n+"c!"; return;
  }
  const lines=[];
  targets.forEach(id=>{
    if(!standing(id)) return;
    const name=PARTY_INFO[id].name, s=slotOf(id), M=member(id);
    if(sk.miss&&Math.random()<sk.miss){ pop("miss",s.x,headOf(id),'#e8eef8'); return; }
    if(F.blind>0&&Math.random()<0.5){ pop("miss",s.x,headOf(id),'#e8eef8'); return; }
    if(sk.pow>0&&B.shieldAll){          /* Safe and Sound: nothing gets through this round */
      pop("0",s.x,headOf(id),'#bfe8ff'); if(FX2) impactFx(s.x+8*s.s,(s.y+headOf(id))/2,false,'shield'); else burst(s.x,s.y-80,'#bfe8ff',8);
      if(!lines.includes("Nothing gets through!")) lines.push("Nothing gets through!"); }
    else if(sk.pow>0){
      const braced=B.guard[id];         /* braced: half damage until their next turn (a quarter in a shell) */
      const raw=f.atk*sk.pow*rnd(0.8,1.2)*(F.weak>0?0.6:1)*(charged?2:1)*(B.shell[id]?0.25:braced?0.5:1);
      const dmg=soften(raw,statOf(id,'def'));
      M.hp=Math.max(0,M.hp-dmg); pepFill(id,dmg);
      /* a hit may wake you, as it may a pest */
      const S=B.st[id]; if(S&&S.sleep>0&&M.hp>0&&Math.random()<0.4) S.sleep=0;
      pop("-"+dmg,s.x,headOf(id),'#ff8a8a');
      if(FX2){ (B.mhit||(B.mhit={}))[id]={t:0,big:!!charged}; impactFx(s.x+8*s.s,(s.y+headOf(id))/2,charged,'hurt');
        if(FOE_MARK[sk.fx]) markMember(FOE_MARK[sk.fx],id,{jx:rnd(-6,6),jy:rnd(-6,6)});
        B.stopT=Math.max(B.stopT||0,charged?110:60); quake(charged?4:1.8,charged?300:180); }
      else burst(s.x,s.y-80,'#ff9a8a',8);
      if(sk.drain){ const h=Math.round(dmg*sk.drain); f.hp=Math.min(f.maxhp,f.hp+h); pop("+"+h,EX,EY-10,'#8fe07a'); }
      if(charged&&!lines.includes("A huge blow!")) lines.push("A huge blow!");
    }
    if(standing(id)&&sk.st&&Math.random()<sk.p) addStatus(id,sk.st);
    if(!standing(id)){ lines.push(name+" is down!"); if(id==='kaitlyn'){ B.over='lose'; } }
  });
  if(cover) lines.unshift(PARTY_INFO[cover.by].name+" takes it for "+listAnd(cover.to.map(m=>PARTY_INFO[m].name))+"!");
  B.log=lines.join("  ");
  blip(180,0.09,0.2);
  if(B.over==='lose') B.log="Kaitlyn is worn out...";
}

/* ---------- victory: rewards are given at once, the screen then shows them ---------- */
/* A win: everyone strikes their victory pose until a press (winSkip), then the results fade in over
   the whole screen and each EXP bar fills (WIN_FILL ms, ticking as it goes). */
const SEED_LOOT=0.10, POSE_MS=2500, RESULTS_FADE=400, WIN_DELAY=POSE_MS+RESULTS_FADE+150, WIN_FILL=1400, WIN_GUARD=WIN_DELAY+300;
/* the victory window, along the bottom under the party: the rewards, then a row (name,
   level, EXP bar) for each one standing */
const VW={top:32,step:38,foot:30};
const vwHeight=n=>VW.top+n*VW.step+VW.foot;
function winFight(){
  if(B.over) return;
  B.over='win'; B.log=B.foes.length>1?"The pests flee the garden!":"The "+B.foes[0].name+" flees the garden!";
  setMusic('victory'); winRewards();
}
/* Luck (the luckiest one standing) helps find seeds and sometimes bonus coins */
function winRewards(){
  const up=B.party.filter(standing);
  const luck=Math.max(...up.map(id=>statOf(id,'luk')));
  const seed=Math.random()<SEED_LOOT+luck*0.004&&G.unlocked.length?G.unlocked[ri(0,G.unlocked.length-1)]:null;
  const bonus=Math.random()<luck*0.015;
  const xp=B.foes.reduce((a,f)=>a+f.xp,0);
  const coins=Math.round(B.foes.reduce((a,f)=>a+f.coin,0)*(bonus?1.5:1));
  const from={}; up.forEach(id=>{ const M=member(id); from[id]={lv:M.lv,xp:M.xp,next:M.next}; });
  /* drops: each pest may leave an ordinary thing, or (rarely) a special one */
  const drops=B.stolen.slice();            /* what Tituba snitched is already in the basket */
  B.foes.forEach(f=>{ const D=PEST_DROPS[f.sp]; if(!D) return;
    const k=Math.random()<RARE_P?D[1]:Math.random()<DROP_P?D[0]:null;
    if(k){ G.goods[k]=(G.goods[k]||0)+1; drops.push(k); } });
  B.win={xp,coins,bonus,seed,from,who:up,t:0,drops,tick:0};
  G.coins+=coins; if(seed) G.seeds[seed]=(G.seeds[seed]||0)+1;
  G.pests=G.pests.filter(p=>p!==B.pest); G.mtnPests=G.mtnPests.filter(p=>p!==B.pest);
  B.foes.forEach(f=>G.lore.beat[f.sp]=(G.lore.beat[f.sp]||0)+1);      /* for the Bestiary */
  up.forEach(id=>addXpTo(id,xp));          /* everyone still standing learns from it */
}
/* a moment's pause so the key that won the fight doesn't also close the screen */
const winGuard=()=>B.over==='win'&&B.win&&B.win.t<WIN_GUARD;
/* the poses hold until a key or tap (after a moment, so the press that won the fight
   doesn't count); then the results come in */
const POSE_GUARD=700;
function winSkip(){
  if(B.over!=='win'||!B.win||B.win.posed) return false;
  if(B.win.t>=POSE_GUARD){ B.win.posed=true; B.win.t=POSE_MS; }
  return true;
}
/* a member's EXP bar as it fills, levelling up the same way addXpTo does */
function xpShown(id){
  const w=B.win, k=clamp((w.t-WIN_DELAY)/WIN_FILL,0,1), f=w.from[id||'kaitlyn'];
  let lv=f.lv, xp=f.xp+w.xp*k, next=f.next;
  while(xp>=next){ xp-=next; lv++; next=xpNeed(lv); }
  return {lv,xp:Math.floor(xp),next,k};
}
function endBattle(){
  if(B.over==='win'){ const w=B.win;      /* rewards were given when the fight was won */
    say((B.boss?"The HOA President retreats! ":"Won!  ")+"+"+w.coins+"c"+(w.bonus?" (lucky!)":"")+"  +"+w.xp+"xp"+(w.seed?"  + a seed":"")); }
  else if(B.over==='lose'){
    G.player.hp=Math.max(4,Math.floor(G.player.maxhp*0.4));
    G.pests=G.pests.filter(p=>p!==B.pest); G.mtnPests=G.mtnPests.filter(p=>p!==B.pest); G.player.x=338; G.player.y=396; G.indoors=false; G.area='garden';
    const lost=Math.floor(G.coins*0.5); G.coins-=lost;
    say("A frog nudged you awake by the pool. You dropped "+lost+"c."); }
  else { B.pest.x+=rnd(-60,60); B.pest.y+=rnd(-60,60); say("You slipped away."); }
  /* friends who fell go home to recover */
  const hurt=B.party.filter(id=>id!=='kaitlyn'&&!standing(id));
  hurt.forEach(id=>{ const A=G.allies[id]; A.hurtUntil=G.day+HURT_DAYS; A.hp=0; G.party=G.party.filter(x=>x!==id); });
  if(hurt.length) say(hurt.map(id=>PARTY_INFO[id].name).join(" and ")+" got hurt and went home to rest (back in "+HURT_DAYS+" days).");
  B=null; G.scene='world'; setMusic(areaMusic()); autoSave();
}

/* ---------- drawing the party ----------
   Out of turn a member holds their battle stance (Kaitlyn's is pose.png, the others'
   come from party.webp); on their turn they ease into their ready loop. Kaitlyn's
   kick, flute and victory rows come from battle.png. Each draws onto c (the scene, or
   the silhouette canvas for shadows and flashes). */
let IMG_PARTY=null;
function partyImg(){
  if(!IMG_PARTY){ IMG_PARTY=new Image(); IMG_PARTY.src=ASSET_PARTY; }
  return IMG_PARTY.complete&&IMG_PARTY.naturalWidth?IMG_PARTY:null;
}
const READY_MS={kaitlyn:70,ivy:50,tituba:60,tex:80}, READY_FADE=220;
/* a party.webp frame at 2 device px per sheet px, its ax,ay on the given feet */
function partyFrame(c,r,ax,ay,x,y){
  const img=partyImg(); if(!img||!r) return false;
  const [sx,sy,w,h]=r;
  c.save(); c.translate(x,y); c.scale(2/SC,2/SC);
  c.drawImage(img,sx,sy,w,h,-ax,-ay,w,h); c.restore(); return true;
}
function drawStance(c,id,x,y){
  if(id==='kaitlyn'){ drawPose(c,0,x,y); return; }
  const A=PARTY_ART[id], s=A&&A.stance;
  if(s) partyFrame(c,s.r,s.ax,s.ay,x,y);
  else if(A) partyFrame(c,A.ready[0],A.ax,A.ay,x,y);
}
function drawReady(c,id,x,y,t){
  const A=PARTY_ART[id];
  if(!A){ drawStance(c,id,x,y); return; }
  const i=Math.floor(t/(READY_MS[id]||60))%A.ready.length;
  partyFrame(c,A.ready[i],A.ax,A.ay,x,y);
}
const SONG_FX=['sprout','lull','waltz','req','thorn','hymn'];
/* a member at their size for where they stand (see depthScale), around their feet */
const MEMBER_SIZE={tiny:0.75};               /* drawn smaller (or bigger) in battle than their art */
function drawMember(c,id,x,y,k){
  const s=slotOf(id).s*(MEMBER_SIZE[id]||1);
  if(s===1){ drawMemberAt(c,id,x,y,k); return; }
  c.save(); c.translate(x,y); c.scale(s,s); drawMemberAt(c,id,0,0,k); c.restore();
}
function drawMemberAt(c,id,x,y,k){
  const mine=B.anim&&B.anim.who===id, kind=mine?B.anim.kind:null;
  if(mine&&B.anim.loopMs) k=(B.anim.t%B.anim.loopMs)/B.anim.loopMs;     /* looping while their voice goes on */
  if(id==='kaitlyn'){
    if(B.over==='lose'||!standing(id)){ drawPose(c,1,x,y); return; }
    if(B.over==='win'){ const n=BRN[BROW.victory]||1; drawBattleRow(c,'victory',Math.floor(G.t/85)%n,x,y); return; }
    if(kind==='kick'){ const v=B.kickVar||'kick', n=BRN[BROW[v]]||1; drawBattleRow(c,v,Math.floor(k*n),x,y); return; }
    if(SONG_FX.includes(kind)){ const n=BRN[BROW.flute]||1; drawBattleRow(c,'flute',Math.floor(k*n),x,y); return; }
  }
  if(!standing(id)){ c.globalAlpha=.45; drawStance(c,id,x,y); c.globalAlpha=1; return; }
  /* a win: their victory loop, or until they have one, a happy bounce on their spell's
     coiled-up frames */
  if(B.over==='win'){ const A=PARTY_ART[id]||{}, v=A.victory||A.spell;
    if(v){ const f=A.victory?v.f:v.f.slice(4,7), i=Math.floor(G.t/(A.victory?80:160))%f.length;
      partyFrame(c,f[i],v.ax,v.ay,x,y-(A.victory?0:Math.abs(Math.sin(G.t/240))*5)); return; } }
  if(kind==='spell'){ const a=PARTY_ART[id].spell;
    partyFrame(c,a.f[Math.min(a.f.length-1,Math.floor(k*a.f.length))],a.ax,a.ay,x,y); return; }
  if(kind==='lunge'||kind==='sing'){ const a=PARTY_ART[id]&&PARTY_ART[id].attack;
    if(a) partyFrame(c,a.f[Math.min(a.f.length-1,Math.floor(k*a.f.length))],a.ax,a.ay,x,y);
    else drawReady(c,id,x,y,B.anim.t+1500);                       /* the strike part of the loop */
    return; }
  const ready=B.turn==='player'&&!B.over&&actor()===id;
  const f=ready?clamp(B.readyT/READY_FADE,0,1):0;
  if(f<1) drawStance(c,id,x,y);
  if(f>0){ c.globalAlpha=f; drawReady(c,id,x,y,B.readyT); c.globalAlpha=1; }
}
/* ---------- shadows and flashes ----------
   A sprite drawn (feet at 0,0) into a spare canvas and filled with one colour: laid
   flat on the ground for its shadow (the light is up and to the left, so it falls
   down and to the right), or over the sprite for a white flash. */
const SHAPE_W=200, SHAPE_H=200, SHAPE_FX=100, SHAPE_FY=190;
/* Two spare canvases: full size for flashes (over the sprite, so they stay sharp), and
   SHADE_RES px per game px for shadows (soft dark shapes anyway). Drawing every shadow at
   full size each frame was what made big fights crawl on phones. */
const SHADE_RES=1;
const mkShape=()=>{ const cv=document.createElement('canvas'), c=cv.getContext('2d'); return {cv,c,res:0}; };
const FLASH_CV=mkShape(), SHADE_CV=mkShape();
/* what's drawn into the spare canvas (each picture, its part and how it's placed), so a
   shadow's ground line is worked out once per animation frame */
let shapeRec=null;
const shapeDraw=CanvasRenderingContext2D.prototype.drawImage;
for(const S of [FLASH_CV,SHADE_CV]) S.c.drawImage=function(img,...a){
  if(shapeRec){ const t=this.getTransform(); shapeRec.push((img.src||img.width)+':'+a.slice(0,4).join(',')+':'+[t.a,t.b,t.e,t.f].map(v=>v.toFixed(1)).join(',')); }
  return shapeDraw.call(this,img,...a); };
function silhouette(draw,col,rec,shade){
  const S=shade?SHADE_CV:FLASH_CV, r=shade?SHADE_RES:SC, c=S.c;
  if(S.res!==r){ S.res=r; S.cv.width=SHAPE_W*r; S.cv.height=SHAPE_H*r; }
  c.setTransform(1,0,0,1,0,0); c.globalCompositeOperation='source-over'; c.globalAlpha=1;
  c.clearRect(0,0,S.cv.width,S.cv.height);
  shapeRec=rec||null;
  c.setTransform(r,0,0,r,SHAPE_FX*r,SHAPE_FY*r); draw(c);
  shapeRec=null;
  c.setTransform(1,0,0,1,0,0); c.globalAlpha=1; c.globalCompositeOperation='source-in';
  c.fillStyle=col; c.fillRect(0,0,S.cv.width,S.cv.height); c.globalCompositeOperation='source-over';
  return S.cv;
}
/* Where a sprite stands on the ground, as a line through its two feet: y=a+b*x in sprite
   px (feet at 0,0, y down). In a three-quarter view the back foot stands a little higher
   up the screen than the front one, so a shadow folded down from one flat line leaves a
   gap under the back foot; folding it along this line keeps both feet on their shadow.
   Flat (0,0) when it can't find two feet close enough in height. */
const GROUND_LINE=new Map();
/* draw(c) paints the sprite with its feet at 0,0. It's painted for this into a canvas
   kept in ordinary memory (willReadFrequently), just the strip around its feet, and read
   from there: reading back a canvas the graphics card draws (the shadow canvas, as this
   used to) made the browser stop and wait for it, up to 50 ms at the start of a fight. */
const PROBE=document.createElement('canvas'), probeC=PROBE.getContext('2d',{willReadFrequently:true});
function groundLine(draw){
  const R=SHADE_RES, top=Math.round((SHAPE_FY-48)*R), H=Math.round(58*R), W=SHAPE_W*R;
  if(PROBE.width!==W||PROBE.height!==H){ PROBE.width=W; PROBE.height=H; }
  probeC.setTransform(1,0,0,1,0,0); probeC.globalAlpha=1; probeC.clearRect(0,0,W,H);
  probeC.setTransform(R,0,0,R,SHAPE_FX*R,SHAPE_FY*R-top); draw(probeC); probeC.setTransform(1,0,0,1,0,0);
  const d=probeC.getImageData(0,0,W,H).data, bot=new Int32Array(W).fill(-1);
  for(let x=0;x<W;x++) for(let y=H-1;y>=0;y--) if(d[(y*W+x)*4+3]>100){ bot[x]=y; break; }
  let x1=-1; for(let x=0;x<W;x++) if(bot[x]>=0&&(x1<0||bot[x]>bot[x1])) x1=x;
  if(x1<0) return null;                                  /* nothing drawn (yet) */
  let x2=-1; for(let x=0;x<W;x++) if(bot[x]>=0&&Math.abs(x-x1)>=12*R&&(x2<0||bot[x]>bot[x2])) x2=x;
  if(x2<0||bot[x1]-bot[x2]>14*R) return [0,0];          /* one foot only, or the other is in the air */
  const L=(x,y)=>[x/R-SHAPE_FX,(top+y)/R-SHAPE_FY], [ax,ay]=L(x1,bot[x1]), [bx,by]=L(x2,bot[x2]);
  const sl=clamp((by-ay)/(bx-ax),-0.6,0.6);
  return [ay-sl*ax,sl];
}
/* its shadow on the ground at x,y; lift: how high it hovers (the shadow drops further
   away and fainter). Folded along the ground line through its feet (see groundLine). */
const SHADOW_K=0.55, SHADOW_T=0.26;
/* line: a ground line to fold along (a party member's, from their stance), instead of
   working one out from this frame */
function castShadow(draw,x,y,lift,a,line){
  const rec=lift?null:[], S=silhouette(draw,'#14200c',rec,true), l=lift||0;
  b.save(); b.globalAlpha=a*(l?0.75:1);
  if(l){ b.translate(x+l*0.45,y+l*0.12); b.transform(1,0,-SHADOW_K,-SHADOW_T*0.8,0,0); }
  else {
    const key=rec.join('|'); let g=line||GROUND_LINE.get(key);
    if(!g){ g=groundLine(draw)||[0,0]; if(GROUND_LINE.size>600) GROUND_LINE.clear(); GROUND_LINE.set(key,g); }
    const [ga,gb]=g, K=SHADOW_K, T=SHADOW_T;
    b.translate(x,y); b.transform(1+K*gb,gb*(1+T),-K,-T,K*ga,(1+T)*ga);
  }
  b.drawImage(S,-SHAPE_FX,-SHAPE_FY,SHAPE_W,SHAPE_H); b.restore();
}
/* A party member's ground line, worked out once from their standing pose and kept for
   every pose. Worked out frame by frame, a raised foot, a lowered head or a tail could
   pass for a foot and tip the whole shadow to a new angle (Tex's shifting as only his
   foot moved, Ivy's going to a thin slit, Tiny One's to a long streak). */
const MEMBER_LINE=new Map();
function memberLine(id,s){
  if(s===undefined) s=slotOf(id).s*(MEMBER_SIZE[id]||1);
  const key=id+':'+s.toFixed(3);
  let g=MEMBER_LINE.get(key); if(g) return g;
  g=groundLine(c=>{ c.save(); c.scale(s,s); drawStance(c,id,0,0); c.restore(); }); if(!g) return null;                     /* the art isn't loaded yet */
  if(Math.abs(g[1])>0.3) g=[0,0];          /* a steep one is a tail taken for a foot (Tiny One's): level instead */
  MEMBER_LINE.set(key,g); return g;
}
function flashOver(draw,x,y,a){
  if(a<=0) return;
  const S=silhouette(draw,'#ffffff');
  b.save(); b.globalAlpha=Math.min(1,a); b.drawImage(S,x-SHAPE_FX,y-SHAPE_FY,SHAPE_W,SHAPE_H); b.restore();
}

function wrapT(text,x,y,w,size,col){
  const words=text.split(' '); let line='',yy=y;
  for(const wd of words){ const test=line?line+' '+wd:wd;
    if(TW(test,size)>w){ T(line,x,yy,size,col); line=wd; yy+=17; } else line=test; }
  T(line,x,yy,size,col);
}
/* effects for the move playing; ax,ay are the feet of whoever is acting */
function drawSpellFx(kind,k,ax,ay){
  if(FX2&&drawSpellFx2(kind,k,ax,ay)) return;
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
      const y=ay-30-((k*90+i*10)%90);
      px(b,Math.round(ax+Math.cos(a)*r),Math.round(y),4,4,'#8fe07a');
      px(b,Math.round(ax+Math.cos(a)*r),Math.round(y),2,2,'#e0ffd0'); }
    const bo=Math.abs(Math.sin(G.t/180))*4;
    drawFrog(b,ax+34,ay-26-bo,G.t,0);
  } else if(kind==='kick'||kind==='lunge'){
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
  } else if(kind==='meditate'||kind==='focus'){
    /* calm rings settling around them, and motes drifting up (warm ones for Focus) */
    const fo=kind==='focus';
    for(let i=0;i<3;i++){
      const p=clamp(k*1.4-i*0.22,0,1); if(p<=0||p>=1) continue;
      b.globalAlpha=(1-p)*0.8; b.strokeStyle=fo?(i%2?'#ffd08a':'#ff9a6a'):(i%2?'#bfe8ff':'#c8f0b0'); b.lineWidth=2;
      b.beginPath(); b.ellipse(ax,ay-4,46-p*30,12-p*7,0,0,7); b.stroke(); }
    b.globalAlpha=1;
    for(let i=0;i<9;i++){
      const y=ay-((k*120+i*14)%120), x=ax+Math.sin(i*1.7+G.t/300)*26;
      b.globalAlpha=Math.min(1,(ay-y)/30)*0.9; px(b,Math.round(x),Math.round(y),3,3,fo?(i%2?'#fff0c8':'#ffc07a'):(i%2?'#e8fff0':'#bfe8ff')); }
    b.globalAlpha=1;
  } else if(kind==='spell'){
    /* venom magic: purple motes gather round them, then (for an attack) fly at the foe */
    const heal=B.anim&&B.anim.heal;
    for(let i=0;i<10;i++){ const a=i*0.63+G.t/250, r=18+Math.sin(G.t/200+i)*6;
      b.globalAlpha=Math.sin(Math.min(1,k*1.4)*Math.PI)*0.85;
      px(b,Math.round(ax+Math.cos(a)*r),Math.round(ay-14+Math.sin(a)*r*0.5),3,3,heal?(i%2?'#c8f0b0':'#e8fff0'):(i%2?'#b06ae0':'#e0b0ff')); }
    b.globalAlpha=1;
    if(!heal&&k>0.45&&k<0.75){ const q=(k-0.45)/0.3;
      for(let i=0;i<5;i++){ const x=ax+(EX-ax)*q+Math.sin(i*1.7+q*6)*6, y=ay-14+(EY+20-ay+14)*q-Math.sin(q*Math.PI)*24+i*3;
        b.fillStyle='#8a3ac8'; b.beginPath(); b.arc(x,y,3.4,0,7); b.fill(); b.fillStyle='#e0b0ff'; b.beginPath(); b.arc(x-1,y-1,1.4,0,7); b.fill(); } }
  } else if(kind==='sing'){
    /* a little bird's song: notes bob up from them, then drift over to the party (a heal)
       or fly at the pests */
    const heal=B.anim&&B.anim.heal;
    for(let i=0;i<6;i++){ const q=(k*1.6+i/6)%1, a=Math.sin(q*Math.PI)*(1-k*0.6);
      let x=ax+Math.sin(i*2.3+q*5)*14, y=ay-30-q*40;
      if(!heal&&k>0.4){ const p=clamp((k-0.4)/0.35,0,1); x+=(EX-x)*p; y+=(EY+10-y)*p; }
      noteGlyph(b,Math.round(x),Math.round(y),i%2?(heal?'#c8f0b0':'#ffd08a'):'#fff6d8',a); }
  } else if(kind==='eat'){
    for(let i=0;i<7;i++){
      const y=ay-60-k*50-i*6, x=ax+Math.sin(i*2.1)*22;
      b.globalAlpha=1-k; px(b,Math.round(x),Math.round(y),4,4,i%2?'#8fe07a':'#ffe08a'); }
    b.globalAlpha=1;
  }
}
/* ---------------- the battle screen ----------------
   A painted garden backdrop for the season and hour, and classic RPG windows:
   message along the top (and below it, while picking a pest, its name, level and HP); along the bottom the
   commands, the party (room for three) and what the highlighted choice does. The
   Songs / Skills / Items lists open over the commands and the party. */
const BWIN={msg:{x:8,y:8,w:344,h:42}, foe:{x:8,y:56,w:196,h:32},
            cmd:{x:8,y:348,w:128,h:126}, party:{x:142,y:348,w:210,h:86}, info:{x:142,y:440,w:210,h:34},
            list:{x:8,y:348,w:344,h:86}, linfo:{x:8,y:440,w:344,h:34}};
const CMD_ROW=23, HORIZON=150, PARTY_ROW=27, FOE_ROW=24;
/* the message along the top shows each new line for this long, then goes; centred, in
   MSG_FONT, the window growing for a second line */
const MSG_MS=3000, MSG_FONT=30;
const msgLines=W=>wrapLines(B.log||"",MSG_FONT,W.msg.w-24).slice(0,2);
const msgWin=W=>({...W.msg,h:msgLines(W).length>1?62:W.msg.h});
/* with more than three in the party, its rows shrink to fit (one line each) */
const partyRow=()=>B.party.length>3?16:PARTY_ROW;
/* The top windows sit at the top of the scene and the bottom ones at its bottom edge,
   so on tall screens the fight fills the space (above the deck on touch screens). */
function battleWins(){
  const t=BAND_TOP(), dn=BAND_BOT()-LH, s=(r,d)=>({x:r.x,y:r.y+d,w:r.w,h:r.h}), W={dn};
  for(const k in BWIN) W[k]=s(BWIN[k],k==='msg'||k==='foe'?t:dn);
  return W;
}
const cmdTop=W=>W.cmd.y+6;
/* what drifts across each season's battles */
const BACKDROP={spring:{drift:'petal'},summer:{drift:null},fall:{drift:'leaf'},winter:{drift:'snow'}};
/* Every window in the game: a smooth gradient from light blue at the top to deep blue at
   the bottom, a white rim and a dark outline, a little see-through (WIN_GLASS; `glass`
   overrides it, e.g. the clock). Words on windows use WIN_TXT's colours, drawn with TS. */
const WIN_GLASS=0.85;
function rpgWin(r,glass){
  const {x,y,w,h}=r, a=b.globalAlpha, rad=Math.min(5.5,h/2-1);
  b.globalAlpha=a*(glass===undefined?WIN_GLASS:glass);
  const g=b.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#6a88dc'); g.addColorStop(0.45,'#33489e'); g.addColorStop(1,'#10164a');
  b.fillStyle=g; b.beginPath(); b.roundRect(x+1,y+1,w-2,h-2,rad); b.fill();
  b.globalAlpha=a; b.lineWidth=2; b.strokeStyle='#e6eaf6'; b.beginPath(); b.roundRect(x+1,y+1,w-2,h-2,rad); b.stroke();
  b.lineWidth=1; b.strokeStyle='#0a0f2a'; b.beginPath(); b.roundRect(x-0.5,y-0.5,w+1,h+1,rad+1); b.stroke();
}
/* the colours of words on windows: titles and names, body text, quieter notes, hints and
   things you can't have, prices and highlights, good news, bad news, MP */
const WIN_TXT={title:'#f4f6ff',body:'#c8d4ff',note:'#aab6e8',dim:'#8a94c4',off:'#7c84b0',gold:'#ffe08a',good:'#b8f0a0',bad:'#ff9a8a',mp:'#a8d8ff'};
/* a gauge in a window: dark track, bright fill with a highlight */
function gauge(x,y,w,h,v,max,col,hi){
  b.fillStyle='#0a0f2a'; b.beginPath(); b.roundRect(x-1,y-1,w+2,h+2,(h+2)/2); b.fill();
  b.fillStyle='#262c5c'; b.beginPath(); b.roundRect(x,y,w,h,h/2); b.fill();
  const f=Math.max(0,Math.round(w*clamp(v/max,0,1)));
  if(f>0){ b.fillStyle=col; b.beginPath(); b.roundRect(x,y,f,h,h/2); b.fill();
    b.fillStyle=hi; b.fillRect(x+h/2,y+1,Math.max(0,f-h),Math.max(1,h/3)); }
}
/* the highlighted row in a window: a soft blue bar and the flute cursor */
function winCursor(x,y,w,h){
  b.fillStyle='rgba(150,180,255,.28)'; b.beginPath(); b.roundRect(x,y,w,h,4); b.fill();
  fluteCursor(x+26,y+h/2);
}
/* text with a dark shadow, for the blue windows and the scene */
function TS(t,x,y,size,col,align,bold){ T(t,x+0.8,y+0.8,size,'#0a0f2a',align,bold); T(t,x,y,size,col,align,bold); }
/* text with a full dark outline (damage numbers, the victory banner) */
function TO(t,x,y,size,col,align,bold,w){ const o=w||1.2;
  for(const [dx,dy] of [[-o,0],[o,0],[0,-o],[0,o],[-o,-o],[o,o],[-o,o],[o,-o]]) T(t,x+dx,y+dy,size,'#1a1430',align,bold);
  T(t,x,y,size,col,align,bold); }
/* The season's painted backdrop (backdrops/<season>; on the mountain its own,
   backdrops/mountain_<season>), placed so where its ground begins (BACK_HORIZON, a share of
   its height) lines up with HORIZON, and big enough to cover the whole scene (black until
   it loads; it's made ready ahead, see prebakeBattle). */
const BACK_HORIZON={spring:0.50,summer:0.53,fall:0.53,winter:0.57,
  mountain_spring:0.56,mountain_summer:0.56,mountain_fall:0.50,mountain_winter:0.60}, BACK_IMG={};
const backdropKey=()=>{ const s=season(), m='mountain_'+s;
  return G.area==='mountain'&&typeof BACKDROPS!=='undefined'&&BACKDROPS.includes(m)?m:s; };
const hasBackdrop=()=>typeof BACKDROPS!=='undefined'&&BACKDROPS.includes(backdropKey());
/* Everything a battle draws that's slow the first time, done ahead (when the game starts
   and each new day), so a fight opens without a stall: the sprite sheets decoded, each
   friend's ground line for every spot they could stand in (memberLine), and the HD
   backdrops (hdPrebake). The first fight used to freeze for a quarter of a second. */
function prebakeBattle(){
  hdPrebake(); partyImg();
  fishArtReady(); fishImg(); rhythmArt(); rhythmPic('vine'); rhythmPic('flute');   /* (fishing's and the rhythm game's pictures, loading early too) */
  const sheets=[IMG_PARTY,IMG_EN,IMG_BATL,IMG_POSE,IMG_PT].filter(Boolean);
  Promise.all(sheets.map(im=>im.decode?im.decode().catch(()=>{}):null)).then(()=>{
    /* (drawn once, tiny, into the canvases a battle draws them into, so they're uploaded
       and ready there too) */
    /* (a corner at full size: drawn shrunk, the browser decodes a small copy instead) */
    [SHADE_CV.c,FLASH_CV.c,b,probeC].forEach(c=>sheets.forEach(im=>{ try{ if(im.naturalWidth) c.drawImage(im,0,0,8,8,0,0,8,8); }catch(e){} }));
    if(assetsReady<5) return;
    allMembers().forEach(id=>PARTY_SPOTS.forEach(([,y])=>memberLine(id,depthScale(y)*(MEMBER_SIZE[id]||1))));
    pestPool().forEach(sp=>groundLine(c=>drawEnemyArt(c,sp,0,0,1)));        /* (the pests' sheet, ready for reading too) */
    /* and a shadow, a flyer's shadow and a flash drawn once, faintly (the next frame covers
       them): the browser readies its way of drawing them, which took 40 ms the first time */
    const st=c=>drawStance(c,'kaitlyn',0,0);
    castShadow(st,180,240,0,0.01,[0,0.05]); castShadow(st,180,240,20,0.01); flashOver(st,180,240,0.01); });
}
/* a backdrop's picture (loading it the first time it's asked for) */
function backImgFor(s){
  if(!BACK_IMG[s]){ BACK_IMG[s]=new Image(); BACK_IMG[s].src='assets/scenes/backdrop_'+s+'.jpg'; }
  return BACK_IMG[s];
}
function backdropImg(){
  if(!hasBackdrop()) return null; const im=backImgFor(backdropKey());
  return im.complete&&im.naturalWidth?im:null;
}
/* where backdrop s's picture goes for the band T0..T1: covering it, its ground line
   (BACK_HORIZON) on HORIZON. [x,y,w,h] in scene px. */
function backPlace(im,s,T0,T1){
  const f=BACK_HORIZON[s]||0.5, r=im.naturalWidth/im.naturalHeight;
  const h=Math.max((T1-HORIZON)/(1-f),(HORIZON-T0)/f,LW/r), w=h*r;
  return [(LW-w)/2,HORIZON-f*h,w,h];
}
function drawBattleBackdrop(dt){
  const P=BACKDROP[season()]||BACKDROP.spring, T0=BAND_TOP(), T1=BAND_BOT(), im=backdropImg();
  if(im){
    const [x,y,w,h]=backPlace(im,backdropKey(),T0,T1);
    b.save(); b.imageSmoothingEnabled=true;
    /* with depth of field and bloom (Settings > Graphics; made ahead, hdPrebake) */
    if(GFX.dof||GFX.bloom) b.drawImage(hdBackdrop(im,x,y,w,h,T0,T1),0,T0,LW,T1-T0);
    else b.drawImage(im,x,y,w,h); b.restore();
  } else { b.fillStyle='#000'; b.fillRect(0,T0,LW,T1-T0); }      /* its painting is still loading */
  backdropLife(P,T0,T1,dt);
}
/* over the backdrop: drifting petals/leaves/snow, the hour */
function backdropLife(P,T0,T1,dt){
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
  /* (the colour of the hour goes over the whole scene, fighters and all: tintBand, in drawBattle) */
}
/* ---------- the pest's attack effects ----------
   fx (PESTS skills) drawn from the pest to each target over the attack's k (0..1);
   contact is a little past halfway. */
function drawFoeFx(fx,k,targets){
  const from={x:EX-24,y:EY+18};
  const T=(targets||[]).map(id=>{ const s=slotOf(id); return {x:s.x+8*s.s,y:s.y-62*s.s}; });
  const hit=clamp((k-0.45)/0.4,0,1), on=k>0.45&&k<0.9;
  const along=(t,arc)=>T.map(p=>({x:from.x+(p.x-from.x)*t,y:from.y+(p.y-from.y)*t-Math.sin(t*Math.PI)*arc}));
  /* FX2: slashes, sparks, venom and wisps glow; thrown things (and the swarm) stay solid */
  const soft=FX2&&!['ball','trash','paper','steal','buzz'].includes(fx);
  const dot=(x,y,r,col,a)=>{ b.globalAlpha=a===undefined?1:a; b.fillStyle=col; b.beginPath(); b.arc(x,y,r,0,7); b.fill(); b.globalAlpha=1;
    if(soft) glowAt(x,y,r*3,col,(a===undefined?1:a)*0.5); };
  const line=(x1,y1,x2,y2,col,w,a)=>{ b.globalAlpha=a===undefined?1:a; b.strokeStyle=col; b.lineWidth=w;
    b.beginPath(); b.moveTo(x1,y1); b.lineTo(x2,y2); b.stroke(); b.globalAlpha=1;
    if(soft) glowPath([[x1,y1],[x2,y2]],col,w*0.8,(a===undefined?1:a)*0.5); };
  if(['bash','pinch','bite','peck','claw','dive'].includes(fx)){
    /* slashes, bite marks or an impact star where it lands (FX2: the hit marks, drawMarks) */
    if(on&&!FX2) T.forEach(p=>{ const a=1-hit;
      if(fx==='claw') for(let i=0;i<3;i++) line(p.x-14+i*8,p.y-16,p.x-2+i*8,p.y+14,'#ffffff',2.5,a);
      else if(fx==='bite'||fx==='pinch'){ for(let i=0;i<4;i++){ dot(p.x-9+i*6,p.y-8+hit*6,2.2,'#ffffff',a); dot(p.x-9+i*6,p.y+8-hit*6,2.2,'#ffffff',a); } }
      else { for(let i=0;i<8;i++){ const an=i*0.785, r=6+hit*16; line(p.x+Math.cos(an)*r*0.4,p.y+Math.sin(an)*r*0.4,p.x+Math.cos(an)*r,p.y+Math.sin(an)*r,i%2?'#ffe08a':'#ffffff',2,a); } } });
    if(fx==='dive'&&k<0.5) for(let i=0;i<5;i++) line(EX+20+i*6,EY-20+i*9,EX+50+i*6,EY-50+i*9,'#ffffff',1.5,0.6);
  } else if(fx==='sting'||fx==='spines'){
    /* needles fly in, then a puff of venom */
    if(k<0.55) along(k/0.55,8).forEach(p=>{ for(let i=0;i<(fx==='spines'?4:1);i++) line(p.x+i*5,p.y+i*3-4,p.x+i*5+9,p.y+i*3-6,'#3a2a1a',2); });
    else if(on) T.forEach(p=>{ for(let i=0;i<7;i++) dot(p.x+Math.cos(i)*hit*16,p.y+Math.sin(i*1.7)*hit*12,2.5,'#b06ae0',1-hit); });
  } else if(fx==='ball'||fx==='trash'||fx==='paper'){
    /* something lobbed at them: dung balls, trash, citations */
    if(k<0.55) along(k/0.55,fx==='paper'?20:60).forEach((p,i)=>{
      if(fx==='paper'){ b.save(); b.translate(p.x,p.y); b.rotate(k*12+i); b.fillStyle='#ffffff'; b.fillRect(-6,-8,12,16);
        b.fillStyle='#8a94c4'; for(let j=0;j<4;j++) b.fillRect(-4,-5+j*3.5,8,1); b.restore(); }
      else { dot(p.x,p.y,fx==='ball'?7:6,fx==='ball'?'#6a4a22':'#8a8f96'); if(fx==='trash') dot(p.x+3,p.y-3,3,'#c4c9d0'); } });
    else if(on) T.forEach(p=>{ for(let i=0;i<9;i++){ const an=i*0.7; dot(p.x+Math.cos(an)*hit*20,p.y+Math.sin(an)*hit*14,3,fx==='ball'?'#7a5a2a':fx==='paper'?'#ffffff':'#9aa0a8',1-hit); } });
  } else if(fx==='buzz'){
    /* a swarm all over them */
    T.forEach(p=>{ for(let i=0;i<10;i++){ const an=G.t/90+i*0.63; dot(p.x+Math.cos(an*1.3)*18*Math.min(1,k*2),p.y+Math.sin(an)*14*Math.min(1,k*2),1.8,'#2a2a1a',0.9); dot(p.x+Math.cos(an*1.3)*18*Math.min(1,k*2)+1,p.y+Math.sin(an)*14*Math.min(1,k*2),1.2,'#f0c03a',0.9); } });
  } else if(fx==='caw'||fx==='megaphone'){
    /* sound waves rolling from the pest over them */
    for(let i=0;i<4;i++){ const q=clamp(k*1.6-i*0.18,0,1); if(q<=0||q>=1) continue;
      if(FX2){ const P=[]; for(let j=0;j<=16;j++){ const a=Math.PI*(0.75+0.5*j/16); P.push([from.x+20+Math.cos(a)*q*220,from.y+Math.sin(a)*q*220]); }
        glowPath(P,fx==='caw'?'#8a7ad8':'#ffd24a',2.4,(1-q)*0.9); continue; }
      b.globalAlpha=(1-q)*0.8; b.strokeStyle=fx==='caw'?'#2a2a4a':'#ffd24a'; b.lineWidth=3;
      b.beginPath(); b.arc(from.x+20,from.y,q*220,Math.PI*0.75,Math.PI*1.25); b.stroke(); }
    b.globalAlpha=1;
  } else if(['boo','wail','gloom','curse','chill'].includes(fx)){
    /* ghostly wisps around them (and the drain back to the pest) */
    const col=fx==='chill'?'#bfe8ff':fx==='curse'?'#a05ad8':'#8a7ad8';
    if(fx==='wail'){ b.globalAlpha=Math.sin(k*Math.PI)*0.25; px(b,0,BAND_TOP(),LW,BAND_BOT()-BAND_TOP(),'#2a1a4a'); b.globalAlpha=1; }
    (fx==='gloom'?[{x:EX,y:EY}]:T).forEach(p=>{ for(let i=0;i<7;i++){ const an=G.t/220+i*0.9, r=10+Math.sin(G.t/150+i)*6+(1-Math.min(1,k*2))*20;
      dot(p.x+Math.cos(an)*r,p.y+Math.sin(an)*r*0.7,fx==='chill'?2:3,col,Math.sin(k*Math.PI)*0.85); } });
    if(fx==='chill'&&k>0.6) T.forEach(p=>{ const q=(k-0.6)/0.4; for(let i=0;i<4;i++) dot(p.x+(from.x-p.x)*q+Math.sin(i+k*9)*6,p.y+(from.y-p.y)*q+i*3,2,'#8fe07a',1-q*0.5); });
  } else if(fx==='hearts'){
    along(Math.min(1,k*1.3),30).forEach((p,i)=>{ for(let j=0;j<3;j++){ const x=p.x+j*9-9, y=p.y+Math.sin(G.t/120+j)*4;
      if(FX2) glowAt(x,y+2,9,'#ff8ab8',0.7);
      b.fillStyle='#ff8ab8'; b.beginPath(); b.arc(x-2,y,2.6,0,7); b.arc(x+2,y,2.6,0,7); b.fill();
      b.beginPath(); b.moveTo(x-4.6,y+1); b.lineTo(x,y+6); b.lineTo(x+4.6,y+1); b.fill(); } });
  } else if(fx==='zoom'){
    for(let i=0;i<8;i++){ const y=200+i*16, x=LW-(k*1.4%1)*LW*1.2+i*14; line(x,y,x+46,y,'#ffffff',2,0.6); }
  } else if(fx==='shell'){
    b.globalAlpha=Math.sin(k*Math.PI)*0.5; b.fillStyle='#c8ccd8'; b.beginPath(); b.ellipse(EX,EY+20,46,44,0,Math.PI,0); b.fill(); b.globalAlpha=1;
    if(FX2){ const P=[]; for(let j=0;j<=20;j++){ const a=Math.PI+Math.PI*j/20; P.push([EX+Math.cos(a)*46,EY+20+Math.sin(a)*44]); }
      glowPath(P,'#bfe0ff',2,Math.sin(k*Math.PI)*0.8); glowAt(EX-14,EY-6,10,'#ffffff',Math.sin(k*Math.PI)*0.5); }
  } else if(fx==='snack'){
    for(let i=0;i<8;i++) dot(EX+Math.cos(i*0.8+k*6)*30,EY+20-k*40+Math.sin(i)*8,2.5,i%2?'#8fe07a':'#ffe08a',1-k);
  } else if(fx==='steal'){
    if(k>0.5) T.forEach(p=>{ const q=(k-0.5)/0.5; for(let i=0;i<3;i++){ const x=p.x+(from.x-p.x)*q+i*6, y=p.y+(from.y-p.y)*q-Math.sin(q*Math.PI)*30+i*4;
      dot(x,y,3.6,'#a8781e'); dot(x,y,2.6,'#ffd24a'); } });
  }
}
/* Troubles as little round icons by each fighter's back (the party faces right, the pests
   left), one under another; a tap on them tells what each one does. Also a pest that's
   guarding or charging, and a member braced by Meditate. */
const ICON_COL={guard:'#3a8a5a',charge:'#d84a3a',regen:'#4aa84a'}, ICON_ALPHA=0.5;
function foeIcons(f){ const F=f.st;
  return ['venom','poison','blind','scared','bound','weak','sleep','guard','charge'].filter(k=>!!F[k]); }
function memberIcons(id){ const S=B.st[id]||{};
  return Object.keys(STATUS).filter(k=>S[k]>0).concat(B.guard[id]?['guard']:[],B.charged[id]?['charge']:[],B.regen[id]&&B.regen[id].n>0?['regen']:[]); }
function statusIcon(x,y,k){
  const r=3.9, col=ICON_COL[k]||(STATUS[k]&&STATUS[k].col)||'#888';
  b.fillStyle='#0a0f2a'; b.beginPath(); b.arc(x,y,r+0.8,0,7); b.fill();
  b.fillStyle=col; b.beginPath(); b.arc(x,y,r,0,7); b.fill();
  b.fillStyle='#ffffff'; b.strokeStyle='#ffffff'; b.lineWidth=0.9; b.lineCap='round'; b.lineJoin='round';
  b.beginPath();
  if(k==='venom'){       /* a little skull and crossbones */
    b.lineWidth=0.7; b.moveTo(x-2.3,y-0.3); b.lineTo(x+2.3,y+2.5); b.moveTo(x+2.3,y-0.3); b.lineTo(x-2.3,y+2.5); b.stroke();
    [[-2.3,-0.3],[2.3,-0.3],[-2.3,2.5],[2.3,2.5]].forEach(([dx,dy])=>{ b.beginPath(); b.arc(x+dx,y+dy,0.55,0,7); b.fill(); });
    b.beginPath(); b.arc(x,y-1.1,1.75,0,7); b.fill(); b.fillRect(x-0.95,y+0.1,1.9,1.0);
    b.fillStyle=STATUS.venom.col; b.fillRect(x-1.0,y-1.45,0.75,0.75); b.fillRect(x+0.25,y-1.45,0.75,0.75); }
  else if(k==='poison'){ b.moveTo(x,y-2.6); b.quadraticCurveTo(x+2.1,y+0.2,x+1.6,y+1.2); b.arc(x,y+1,1.65,0.1,Math.PI-0.1); b.quadraticCurveTo(x-2.1,y+0.2,x,y-2.6); b.fill(); }
  else if(k==='blind'){ b.ellipse(x,y,2.5,1.4,0,0,7); b.stroke(); b.beginPath(); b.moveTo(x-2.2,y+2); b.lineTo(x+2.2,y-2); b.stroke(); }
  else if(k==='sleep'){ b.moveTo(x-1.6,y-1.7); b.lineTo(x+1.6,y-1.7); b.lineTo(x-1.6,y+1.7); b.lineTo(x+1.6,y+1.7); b.stroke(); }
  else if(k==='weak'){ b.moveTo(x,y-2.3); b.lineTo(x,y+1.8); b.moveTo(x-1.7,y+0.2); b.lineTo(x,y+2.1); b.lineTo(x+1.7,y+0.2); b.stroke(); }
  else if(k==='scared'){ b.moveTo(x,y-2.3); b.lineTo(x,y+0.6); b.stroke(); b.beginPath(); b.arc(x,y+2,0.6,0,7); b.fill(); }
  else if(k==='bound'){ b.arc(x-0.9,y,1.5,0,7); b.stroke(); b.beginPath(); b.arc(x+0.9,y,1.5,0,7); b.stroke(); }
  else if(k==='guard'){ b.moveTo(x-2,y-2); b.lineTo(x+2,y-2); b.lineTo(x+2,y); b.quadraticCurveTo(x+1.6,y+1.8,x,y+2.5); b.quadraticCurveTo(x-1.6,y+1.8,x-2,y); b.closePath(); b.fill(); }
  else if(k==='regen'){ b.moveTo(x,y-2.3); b.lineTo(x,y+2.3); b.moveTo(x-2.3,y); b.lineTo(x+2.3,y); b.stroke(); }
  else if(k==='charge'){ b.moveTo(x+0.6,y-2.6); b.lineTo(x-1.4,y+0.3); b.lineTo(x+0.2,y+0.3); b.lineTo(x-0.6,y+2.6); b.lineTo(x+1.4,y-0.4); b.lineTo(x-0.2,y-0.4); b.closePath(); b.fill(); }
  b.lineCap='butt'; b.lineJoin='miter';
}
function drawStatusTags(){
  const column=(x,y,list)=>{ b.globalAlpha=ICON_ALPHA; list.forEach((k,i)=>statusIcon(x,y+i*9.5,k)); b.globalAlpha=1; };
  if(B.over==='win') return;
  B.party.forEach(id=>{ if(!standing(id)) return; const s=slotOf(id), L=memberIcons(id), big=id==='kaitlyn';
    if(L.length) column(s.x-(big?21:20)*s.s,s.y-(big?88:24)*s.s,L); });      /* Kaitlyn's by her shoulder */
  if(!B.over) liveFoes().forEach(f=>{ const L=foeIcons(f), r=foeBox(f); if(L.length) column(r.x+r.w+1,r.y+r.h*0.3,L); });
}
/* what a tap on someone shows: who they are, how they're doing, and what each of their
   troubles does */
const ST_DESC={poison:"loses 7% of max HP every turn",blind:"attacks miss half the time",
  sleep:"can't act (a hit may wake them)",weak:"hits do 40% less damage",scared:"half the time too scared to move",
  bound:"held fast: loses a turn",guard:"braced: hits on it are halved until its next turn",charge:"its next hit is twice as hard",
  braced:"braced: hits on them are halved until their next turn", charged:"focused: their next hit is twice as hard"};
function inspectInfo(x){
  const out={lines:[]}, add=(t,col,size,bold)=>out.lines.push({t,col:col||'#c8d4ff',size:size||17,bold});
  const trouble=(name,col,what,left)=>add("• "+name+": "+what+(left?" ("+left+" turn"+(left===1?"":"s")+" left)":"")+".",col,17);
  if(typeof x==='object'){ const f=x, P=PESTS[f.sp], F=f.st;
    out.title=f.name+(f.boss?"  ★":""); out.lv=f.lv; out.col=f.boss?'#ffd870':'#f4f6ff';
    add("HP "+f.hp+" / "+f.maxhp+"    Attack "+Math.round(f.atk)+"    Defense "+Math.round(f.def)+"    Agility "+Math.round(f.agi),'#f4f6ff',17);
    if(P.about) add(P.about,'#c8d4ff',17);
    const S=[];
    if(F.venom) S.push(["Venom",'#8fe0a0',"takes "+F.venom.dmg+" HP every turn",F.venom.n]);
    if(F.poison>0) S.push(["Poison",'#e0b0ff',ST_DESC.poison,F.poison]);
    if(F.blind>0) S.push(["Blind",'#c8c8d8',ST_DESC.blind,F.blind]);
    if(F.scared>0) S.push(["Scared",'#c0a8ff',ST_DESC.scared,F.scared]);
    if(F.bound) S.push(["Bound",'#d8b07a',ST_DESC.bound,0]);
    if(F.weak) S.push(["Weak",'#f0b070',ST_DESC.weak,F.weak]);
    if(F.sleep) S.push(["Asleep",'#9ac0ff',ST_DESC.sleep,F.sleep]);
    if(F.guard) S.push(["Guarding",'#8fe0a8',ST_DESC.guard,0]);
    if(F.charge) S.push(["Charged up",'#ff9a8a',ST_DESC.charge,0]);
    if(S.length){ add("Troubles","#ffe08a",18,true); S.forEach(s=>trouble(...s)); } else add("Nothing troubling it.",'#8a94c4',16);
    return out;
  }
  const id=x, I=PARTY_INFO[id], M=member(id), St=B.st[id]||{};
  out.title=I.name; out.lv=M.lv; out.col='#f4f6ff';
  add("HP "+M.hp+" / "+M.maxhp+"    MP "+M.mp+" / "+memberMaxMp(id),'#f4f6ff',17);
  add(["str","agi","def","int","luk"].map(k=>STAT_NAME[k].slice(0,3)+" "+statOf(id,k)).join("   "),'#c8d4ff',16);
  add(I.role,'#aab6e8',16);
  const S=Object.keys(STATUS).filter(k=>St[k]>0).map(k=>[STATUS[k].name,'#e0b0ff',ST_DESC[k],St[k]]);
  if(B.guard[id]) S.push(["Braced",'#8fe0a8',ST_DESC.braced,0]);
  if(B.charged[id]) S.push(["Charged up",'#ff9a8a',ST_DESC.charged,0]);
  if(B.regen[id]&&B.regen[id].n>0) S.push(["Mending",'#8fe07a',"gets "+Math.round(B.regen[id].share*100)+"% of max HP back each turn",B.regen[id].n]);
  if(S.length){ add("Troubles","#ffe08a",18,true); S.forEach(s=>trouble(...s)); } else add("Feeling fine.",'#8a94c4',16);
  return out;
}
const INSPECT={x:14,w:332,pad:12};
/* the inspect window's lines, wrapped, and its height */
function inspectLayout(){
  const I=inspectInfo(B.inspect), rows=[];
  I.lines.forEach(l=>wrapLines(l.t,l.size,INSPECT.w-INSPECT.pad*2).forEach((t,i)=>rows.push({...l,t:i&&l.t.startsWith("•")?"   "+t:t})));
  return {I,rows,h:40+rows.length*15+20};
}
function drawBattle(dt){ drawBattleScene(dt); drawUltBand(); }
function drawBattleScene(dt){
  if(B.stopT>0){ B.stopT-=dt; dt=0; }          /* FX2 hit-stop: a blow freezes everything for a moment */
  if(B.turn==='player') B.readyT+=dt;
  let k=0;
  if(B.anim){
    /* k: how far its effect has got (a move held for a long voice plays its effect once,
       at the usual speed, from fxFrom; the rest is just the looping pose: fxOn) */
    B.anim.t+=dt; k=clamp((B.anim.t-(B.anim.fxFrom||0))/(B.anim.loopMs||B.anim.dur),0,1);
    if(!B.anim.hit&&(B.anim.hitAt!=null?B.anim.t>=B.anim.hitAt:k>=0.55)){ B.anim.hit=true; if(B.anim.onHit) B.anim.onHit(); }
    if(B.anim.t>=B.anim.dur){ B.anim=null; afterAction(); }
  }
  const fxOn=!B.anim||!B.anim.loopMs||(B.anim.t>=B.anim.fxFrom&&B.anim.t<B.anim.fxFrom+B.anim.loopMs);
  /* the victory poses hold until a press (winSkip), then the results come in */
  if(B.win) B.win.t=B.win.posed?B.win.t+dt:Math.min(B.win.t+dt,POSE_MS-1);
  if(B.prep) B.prep.t+=dt;
  if(B.banner){ B.banner.t-=dt; if(B.banner.t<=0) B.banner=null; }
  if(B.inspect&&typeof B.inspect==='object'&&B.inspect.hp<=0) B.inspect=null;
  /* FX2: the scene (not the windows) shakes after a blow */
  let qx=0,qy=0; if(B.quake){ B.quake.t-=dt; if(B.quake.t<=0) B.quake=null;
    else { const q=B.quake.mag*B.quake.t/B.quake.ms; qx=Math.round(rnd(-1,1)*q); qy=Math.round(rnd(-1,1)*q*0.6); } }
  b.save(); b.translate(qx,qy);
  drawBattleBackdrop(dt);
  const ultA=updateUlt(dt); if(ultA>0) drawUltStage(ultA);
  /* the pests, back to front: shadow, sprite, and a white flash when hit or about to
     use a special move. One lunges at whoever it attacks (further for a dive, a dash
     for zoomies). */
  const A=B.anim&&B.anim.kind==='enemy'?B.anim:null;
  B.foes.slice().sort((a,z)=>foeSpot(a).y-foeSpot(z).y).forEach(f=>{
    if(f.shake>0) f.shake-=dt; if(f.flash>0) f.flash-=dt;
    if((f.hp<=0&&!(B.pending>0))||B.over==='win') f.fade=Math.min(1,f.fade+dt/450);     /* a beaten pest fades away (once a flurry's done) */
    if(f.fade>=1) return;
    if(f.hitT!=null) f.hitT+=dt;
    const rc=FX2&&f.hitT!=null&&f.hitT<300?1-f.hitT/300:0;                /* FX2 recoil, 1 -> 0 */
    const p=foeSpot(f), me=A&&A.foe===f, sh=FX2?Math.round(rc*rc*(f.hitBig?12:8)):f.shake>0?Math.round(Math.sin(G.t/25)*3):0;
    const eL=me&&!A.self?Math.round(Math.sin(k*Math.PI)*(A.fx==='dive'?-110:A.fx==='zoom'?-150:-38)):0;
    const eY=me&&A.fx==='dive'?Math.round(Math.sin(k*Math.PI)*(40+p.lift)):0;
    /* ground pests stand still on their shadows; flyers hover and bob */
    const night=PESTS[f.sp].night, bob=p.lift?Math.sin(G.t/420+f.slot*2.1)*4:0;
    const x=p.x+sh+eL, y=p.y-p.lift+bob+eY, art=c=>drawEnemyArt(c,f.sp,0,0,p.s);
    castShadow(art,x,p.y,p.lift-eY,0.36*(1-f.fade));
    b.globalAlpha=(1-f.fade)*(night?.88:1)*(me&&A.fx==='fade'?1-Math.sin(k*Math.PI)*0.7:1);
    const sq=rc*rc*(f.hitBig?0.18:0.12)*Math.cos((1-rc)*9);                /* a squash that springs back */
    if(sq){ b.save(); b.translate(x,y); b.scale(1+sq,1-sq); b.translate(-x,-y); }
    drawEnemyArt(b,f.sp,x,y,p.s);
    b.globalAlpha=1;
    const prep=B.prep&&B.prep.f===f?Math.abs(Math.sin(B.prep.t/90))*0.75:0;
    flashOver(art,x,y,Math.max(f.flash/250,prep)*(1-f.fade));
    if(sq) b.restore();
  });
  /* the party, back to front, each in place playing their own animations */
  let who=null;
  const placed=B.party.map(id=>{ const s=slotOf(id);
    if(B.anim&&B.anim.who===id) who={id,x:s.x,y:s.y};
    return {id,x:s.x,y:s.y}; }).sort((a,z)=>a.y-z.y);
  /* FX2: a member just hit is knocked back (left) and flashes */
  const mrc=id=>{ const h=B.mhit&&B.mhit[id]; return h&&h.t<300?1-h.t/300:0; };
  if(B.mhit) for(const id in B.mhit){ B.mhit[id].t+=dt; if(B.mhit[id].t>400) delete B.mhit[id]; }
  placed.forEach(p=>{ const r=mrc(p.id); if(r) p.x-=Math.round(r*r*(B.mhit[p.id].big?12:8)); });
  placed.forEach(p=>{ const g=memberLine(p.id); castShadow(c=>drawMember(c,p.id,0,0,k),p.x,p.y,0,0.32,g); });
  /* Meditate's and Focus's rings and motes go behind the party */
  const behind=B.anim&&who&&(B.anim.kind==='meditate'||B.anim.kind==='focus');
  if(behind&&fxOn) drawSpellFx(B.anim.kind,k,who.x,who.y);
  placed.forEach(p=>{
    if(B.turn==='player'&&!B.over&&actor()===p.id){        /* a warm glow under whoever's turn it is */
      b.globalAlpha=.35+Math.sin(G.t/260)*.12; b.fillStyle='#ffe08a';
      const s=slotOf(p.id).s; b.beginPath(); b.ellipse(p.x,p.y+1,30*s,8*s,0,0,7); b.fill(); b.globalAlpha=1; }
    drawMember(b,p.id,p.x,p.y,k);
    const r=mrc(p.id); if(r>0.3) flashOver(c=>drawMember(c,p.id,0,0,k),p.x,p.y,(r-0.3)/0.7);
  });
  tintBand(b,BAND_TOP(),BAND_BOT());       /* the hour's light over the field and everyone on it (the effects shine on top) */
  if(HD()) hdLight(dt,1-ultA);
  if(B.ult&&ultA>0) drawUltFront(dt,ultA);
  if(A){ focus(A.foe); drawFoeFx(A.fx,k,A.targets); }
  else if(B.anim&&who&&!behind&&fxOn){ if(B.anim.tgt) focus(B.anim.tgt); drawSpellFx(B.anim.kind,k,who.x,who.y); }
  drawStatusTags();
  /* picking a target: a bouncing pointer over whoever is picked */
  const picking=B.turn==='player'&&B.menu==='target'&&B.tgt, tg=picking&&!B.tgt.all?B.tgt.list[B.tgt.i]:null;
  /* a pointer over a head: gold for who it's aimed at, a smaller white one over whoever's
     turn it is */
  const pointer=(tx,ty,big,col)=>{ const w=big?9:6, h=big?13:9;
    b.fillStyle='#0a0f2a'; b.beginPath(); b.moveTo(tx-w,ty-h); b.lineTo(tx+w,ty-h); b.lineTo(tx,ty+1); b.fill();
    b.fillStyle=col; b.beginPath(); b.moveTo(tx-w+2,ty-h+1); b.lineTo(tx+w-2,ty-h+1); b.lineTo(tx,ty-1.5); b.fill(); };
  const overHead=x=>typeof x==='object'?(r=>({x:r.x+r.w/2,y:Math.max(BAND_TOP()+14,r.y-4)}))(foeBox(x)):{x:slotOf(x).x,y:headOf(x)-14};
  if(B.turn==='player'&&!B.over&&!(picking&&B.tgt.kind==='ally'&&B.tgt.list.includes(actor()))){
    const p=overHead(actor()); pointer(p.x,p.y+Math.sin(G.t/200)*2,false,'#f4f6ff'); }
  if(picking) (B.tgt.all?B.tgt.list:[tg]).forEach(x=>{ const p=overHead(x); pointer(p.x,p.y+Math.sin(G.t/140)*3,true,'#ffe08a'); });
  if(B.shout){ B.shout.t-=dt; if(B.shout.t<=0) B.shout=null; }
  const won=B.over==='win'&&B.win, xs=won?xpShown(B.win.who[0]):null;
  /* victory sparkles */
  if(won&&B.win.t<1600&&Math.random()<dt/40)
    { const sp={x:rnd(30,330),y:rnd(40,200),vx:rnd(-0.02,0.02),vy:rnd(-0.06,-0.01),t:700,col:Math.random()<0.5?'#ffe08a':'#ffffff',g:0.00005};
      if(FX2) glow({x:sp.x,y:sp.y,vx:sp.vx,vy:sp.vy,size:rnd(2.5,4),life:900,col:sp.col,fin:true}); else B.fx.push(sp); }
  B.fx.forEach(f=>{ f.t-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=dt*f.g;
    b.globalAlpha=Math.min(1,f.t/300); px(b,Math.round(f.x),Math.round(f.y),3,3,f.col); b.globalAlpha=1; });
  B.fx=B.fx.filter(f=>f.t>0);
  drawThorns(dt);
  drawMarks(dt);
  drawTroubles(dt);
  drawSheets(dt);
  drawGlow(dt);
  if(HD()) hdVignette();
  b.restore();                                   /* (the shake ends here: the windows stay put) */

  const pick=B.turn==='player'&&!B.over, W=battleWins(), dn=W.dn, id=actor(), pepBar=W=>({x:40,y:W.cmd.y-11,w:312,h:5});
  /* a name in the party window: dim when down, green once they've picked their move */
  const nameCol=m=>!standing(m)?"#8a90b8":pick&&B.plan&&B.plan[m]?'#b8f0a0':"#f4f6ff";
  const list=(B.menu==='skills'||B.menu==='items'||B.menu==='pep')&&pick, L=list?subList():null;
  const PR=partyRow(), compact=PR<PARTY_ROW; let msgA=0;
  /* the pests' window shows only while picking one: its name, HP and level */
  const FW=tg&&B.tgt.kind==='foe'?{x:W.foe.x,y:W.foe.y,w:W.foe.w,h:8+FOE_ROW}:null, FB=FW?FW.y+FW.h:W.foe.y;
  /* Kaitlyn's shout, a special move's name: little windows by whoever it is */
  let shoutAt=null, bannerAt=null;
  if(B.shout){ const s=slotOf('kaitlyn'), kx=who&&who.id==='kaitlyn'?who.x:s.x, w=TW(B.shout.txt,24,true)+20;
    shoutAt={x:clamp(kx-w/2,6,LW-6-w),y:s.y-150*s.s,w,h:24,tx:clamp(kx,6+w/2,LW-6-w/2),kx:clamp(kx,20,LW-20)}; }
  if(B.banner){ const r=foeBox(B.banner.f), w=TW(B.banner.txt,24,true)+24, cx=clamp(r.x+r.w/2,6+w/2,LW-6-w/2);
    bannerAt={x:cx-w/2,y:Math.max(FB+6,r.y-34),w,h:24,cx}; }
  const fadeIn=t=>Math.min(1,t/250);
  if(!B.over){
    if(B.log!==B.logSeen){ B.logSeen=B.log; B.logT=0; } else B.logT+=dt;
    msgA=B.log?clamp((MSG_MS-B.logT)/250,0,1):0;
    if(msgA>0){ b.globalAlpha=msgA; rpgWin(msgWin(W)); b.globalAlpha=1; }
    if(FW){ rpgWin(FW); gauge(FW.x+10,FW.y+22,FW.w-20,5,tg.hp,tg.maxhp,'#e8604a','#ffb09a'); }
    if(list){
      rpgWin(W.list); rpgWin(W.linfo);
      if(L.length) winCursor(W.list.x+6,W.list.y+SUB_Y0+(B.sub-B.top)*SUB_ROW,W.list.w-12,SUB_ROW-1);
    } else {
      rpgWin(W.cmd); rpgWin(W.party); rpgWin(W.info);
      topDown(B.party).forEach((m,i)=>{ const y=W.party.y+3+i*PR, M=member(m);     /* top to bottom, as they stand */
        const lit=pick&&(picking&&B.tgt.kind==='ally'?(B.tgt.all?B.tgt.list.includes(m):m===tg):m===id);
        if(lit){ b.fillStyle='rgba(150,180,255,.22)'; b.beginPath(); b.roundRect(W.party.x+5,y,W.party.w-10,PR-(compact?1:2),4); b.fill(); }
        gauge(W.party.x+82,y+(compact?11:17),58,compact?3:5,M.hp,M.maxhp,'#e8504a','#ffa8a0');
        gauge(W.party.x+150,y+(compact?11:17),50,compact?3:5,M.mp,memberMaxMp(m),'#4aa8f0','#b0e0ff'); });
      if(pick&&!picking) winCursor(W.cmd.x+6,cmdTop(W)+(B.idx-(B.ctop||0))*CMD_ROW,W.cmd.w-12,CMD_ROW-2);
    }
    /* the Pep meter, just above the windows: gold and glowing when full */
    if(pepKnown()){ const P=pepBar(W), full=(G.pep||0)>=PEP_MAX, glow=full?0.5+Math.sin(G.t/160)*0.5:0;
      if(B.pepFlash>0) B.pepFlash-=dt;
      if(full){ b.globalAlpha=0.2+glow*0.3+(B.pepFlash>0?0.4:0); b.fillStyle='#ffe08a'; b.beginPath(); b.roundRect(P.x-3,P.y-3,P.w+6,P.h+6,(P.h+6)/2); b.fill(); b.globalAlpha=1; }
      gauge(P.x,P.y,P.w,P.h,G.pep||0,PEP_MAX,full?'#ffc84a':'#e8709a',full?'#fff3b0':'#ffc0d8'); }
  } else if(won&&B.win.t>=POSE_MS) drawResultsBack();
  else if(won){}
  else rpgWin({x:60,y:300+dn,w:240,h:84});
  const tail=(x,y,a)=>{ b.globalAlpha=a; b.fillStyle='#0a0f2a'; b.beginPath(); b.moveTo(x-7,y-1); b.lineTo(x+7,y-1); b.lineTo(x,y+8); b.fill();
    b.fillStyle='#e6eaf6'; b.beginPath(); b.moveTo(x-5,y-2); b.lineTo(x+5,y-2); b.lineTo(x,y+5.5); b.fill(); b.globalAlpha=1; };
  if(shoutAt){ const a=Math.min(1,B.shout.t/300); b.globalAlpha=a; rpgWin(shoutAt); b.globalAlpha=1; tail(shoutAt.kx,shoutAt.y+shoutAt.h,a); }
  if(bannerAt&&!B.inspect){ b.globalAlpha=Math.min(1,B.banner.t/250); rpgWin(bannerAt); b.globalAlpha=1; }
  const insp=B.inspect?inspectLayout():null, IY=FB+8;   /* under the pests' window, if it's up */
  if(insp) rpgWin({x:INSPECT.x,y:IY,w:INSPECT.w,h:insp.h});
  /* a critical hit flashes the whole scene */
  if(B.critT>0){ B.critT-=dt; b.fillStyle='rgba(255,250,220,'+(Math.max(0,B.critT)/260*0.45)+')'; b.fillRect(0,BAND_TOP(),LW,BAND_BOT()-BAND_TOP()); }
  blit();

  if(!B.over){
    const log=B.log;
    if(pepKnown()){ const P=pepBar(W); TS("Pep",10,P.y+6,16,(G.pep||0)>=PEP_MAX?'#ffe08a':'#ffc0d8',null,true); }
    if(msgA>0){ m.globalAlpha=msgA; const M=msgWin(W);
      msgLines(W).forEach((ln,i,a)=>TS(ln,M.x+M.w/2,M.y+(a.length>1?23:28)+i*20,MSG_FONT,'#f4f6ff','center'));
      m.globalAlpha=1; }
    if(FW){ const f=tg, y=FW.y+17;
      TS(f.name+(f.boss?"  ★":""),FW.x+10,y,23,f.boss?'#ffd870':'#f4f6ff',null,true);
      TS("Lv."+f.lv,FW.x+FW.w-10,y,20,'#c8d4ff','right',true); }
    if(list){
      const R=W.list, pep=B.menu==='pep', title=B.menu==='items'?"Items":pep?"Pep Rally":PARTY_INFO[id].skills;
      TS(title,R.x+12,R.y+15,23,'#ffe08a',null,true);
      TS(B.menu==='items'?"from your basket":pep?"":"HP "+member(id).hp+"   MP "+member(id).mp+"/"+memberMaxMp(id),R.x+R.w-12,R.y+15,19,'#c8d4ff','right');
      if(!L.length) TS(B.menu==='items'?"Nothing to eat yet — harvest some crops!":"No skills learned yet.",
        R.x+R.w/2,R.y+SUB_Y0+30,20,'#aab6e8','center');
      L.slice(B.top,B.top+SUB_ROWS).forEach((x,j)=>{ const i=B.top+j, y=R.y+SUB_Y0+j*SUB_ROW+15, sel=i===B.sub;
        if(pep) TS((x.save?"":"♪ ")+x.name,R.x+40,y,24,x.save?'#c8d4ff':'#f4f6ff',null,sel);
        else if(B.menu==='items'){
          TS(itemName(x),R.x+40,y,24,'#f4f6ff',null,sel);
          TS(itemText(x),R.x+200,y,19,'#b8f0a0');
          TS("x"+itemCount(x),R.x+R.w-12,y,21,'#f4f6ff','right');
        } else { const ok=canPay(x,id);
          TS((x.song?"♪ ":"")+x.name,R.x+40,y,24,ok?'#f4f6ff':'#7c84b0',null,sel);
          TS(costText(x,id),R.x+R.w-12,y,21,!ok?'#7c84b0':x.hpCost?'#ffb0a8':'#a8d8ff','right'); } });
      if(B.top>0) TS("▲",R.x+R.w-50,R.y+SUB_Y0+8,14,'#c8d4ff','center');
      if(B.top+SUB_ROWS<L.length) TS("▼",R.x+R.w-50,R.y+R.h-4,14,'#c8d4ff','center');
      /* the row shows the name, so the window is all description (two lines) */
      const [t1,t2]=subInfo(L[B.sub]), dl=L.length?wrapLines(t2,19,W.linfo.w-20):[t1];
      if(dl.length>2){ dl.length=2; dl[1]=dl[1].replace(/\s*\S*$/,"…"); }
      dl.forEach((ln,i)=>TS(ln,W.linfo.x+10,W.linfo.y+15+i*14,19,L.length?'#c8d4ff':'#f4f6ff',null,!L.length));
    } else {
      const ct=B.ctop||0;
      CMDS.slice(ct,ct+CMD_VIS).forEach((c,j)=>{ const i=ct+j, y=cmdTop(W)+j*CMD_ROW+16, ok=cmdUsable(c,id);
        TS(cmdName(c,id),W.cmd.x+40,y,27,!pick||picking?'#9aa4d0':ok?'#f4f6ff':'#7c84b0',null,pick&&!picking&&i===B.idx); });
      if(ct>0) TS("▲",W.cmd.x+W.cmd.w-14,W.cmd.y+12,13,'#c8d4ff','center');
      if(ct+CMD_VIS<CMDS.length) TS("▼",W.cmd.x+W.cmd.w-14,W.cmd.y+W.cmd.h-5,13,'#c8d4ff','center');
      topDown(B.party).forEach((m,i)=>{ const y=W.party.y+3+i*PR, M=member(m), mx=memberMaxMp(m);
        if(compact){     /* one line: name, then HP and MP over thin gauges (level on a tap) */
          TS(PARTY_INFO[m].name,W.party.x+9,y+11.5,20,nameCol(m),null,true);
          TS(M.hp+"/"+M.maxhp,W.party.x+141,y+9.5,17,'#ffd0c8','right');
          TS(M.mp+"/"+mx,W.party.x+201,y+9.5,17,'#c8e8ff','right'); return; }
        TS(PARTY_INFO[m].name,W.party.x+9,y+12,23,nameCol(m),null,true);
        TS("Lv."+M.lv,W.party.x+9,y+24,17,'#aab6e8');
        TS("HP",W.party.x+80,y+12,17,'#ffb0a8',null,true);
        TS(M.hp+"/"+M.maxhp,W.party.x+141,y+12,19,'#f4f6ff','right');
        TS("MP",W.party.x+148,y+12,17,'#a8d8ff',null,true);
        TS(M.mp+"/"+mx,W.party.x+201,y+12,19,'#f4f6ff','right'); });
      const ac=B.anim&&B.anim.kind==='enemy'?B.anim.foe:B.prep?B.prep.f:null;
      const allOf=L=>L.length===1?(typeof L[0]==='object'?L[0].name:PARTY_INFO[L[0]].name):B.tgt.kind==='foe'?"Every foe":L.length===B.party.filter(standing).length?"Everyone":listAnd(L.map(m=>PARTY_INFO[m].name));
      const [t1,t2]=picking&&B.tgt.all?[allOf(B.tgt.list),"Press again to go"]
        :picking?(B.tgt.kind==='foe'?[tg.name,"HP "+tg.hp+"/"+tg.maxhp+" · Lv."+tg.lv]:[PARTY_INFO[tg].name,"HP "+member(tg).hp+"/"+member(tg).maxhp])
        :pick?cmdInfo(CMDS[B.idx],id):[B.turn==='enemy'&&ac?"The "+ac.name+"'s turn":"…",""];
      TS(t1,W.info.x+10,W.info.y+14,21,'#f4f6ff',null,true);
      wrapLines(t2,18,W.info.w-16).slice(0,1).forEach(ln=>TS(ln,W.info.x+10,W.info.y+28,18,'#c8d4ff'));
    }
  }
  if(shoutAt){ m.globalAlpha=Math.min(1,B.shout.t/300); TS(B.shout.txt,shoutAt.tx,shoutAt.y+17,24,'#f4f6ff','center',true); m.globalAlpha=1; }
  if(bannerAt&&!B.inspect){ m.globalAlpha=Math.min(1,B.banner.t/250); TS(B.banner.txt,bannerAt.cx,bannerAt.y+17,24,'#ffe08a','center',true); m.globalAlpha=1; }
  B.pops.forEach(p=>{ p.t-=dt; p.y-=dt*0.03;
    if(p.fx2){ /* FX2: it pops in big, settles, and springs up a little */
      const e=1100-p.t, sc=e<90?0.6+0.9*e/90:e<230?1.5-0.5*(e-90)/140:1, up=16*(1-Math.pow(1-Math.min(1,e/320),3));
      m.globalAlpha=Math.min(1,p.t/400); TO(p.txt,p.x,p.y-up,(p.size||40)*sc,p.col,'center',true,(p.size?2:1.6)*sc); m.globalAlpha=1; return; }
    const hop=Math.max(0,Math.sin((1100-p.t)/140))*6*Math.max(0,(p.t-600)/500);
    m.globalAlpha=Math.min(1,p.t/400); TO(p.txt,p.x,p.y-hop,p.size||40,p.col,'center',true,p.size?2:1.6); m.globalAlpha=1; });
  B.pops=B.pops.filter(p=>p.t>0);
  if(insp){
    const {I,rows}=insp, X=INSPECT.x+INSPECT.pad;
    TS(I.title,X,IY+22,23,I.col,null,true);
    TS("Lv."+I.lv,INSPECT.x+INSPECT.w-INSPECT.pad,IY+22,20,'#c8d4ff','right',true);
    rows.forEach((r,i)=>TS(r.t,X,IY+42+i*15,r.size,r.col,null,r.bold));
    TS(IS_TOUCH?"tap to close":"any key to close",INSPECT.x+INSPECT.w-INSPECT.pad,IY+insp.h-8,15,'#8a94c4','right');
  }
  if(won&&B.win.t>=POSE_MS){ drawResultsWords(); return; }
  if(won){
    const w=B.win, pop=clamp(w.t/280,0,1);
    /* the banner drops in and settles */
    const size=Math.round(58+(1-pop)*30), by=96-(1-pop)*20;
    m.globalAlpha=pop; TO("VICTORY!",180,by,size,'#ffd24a','center',true,2.2);
    T("VICTORY!",180,by-size*0.04,size,'rgba(255,250,210,.35)','center',true); m.globalAlpha=1;
    return;
  }
  if(B.over){
    TS(B.over==='lose'?"Defeated...":"Got away!",180,334+dn,30,'#f4f6ff','center',true);
    TS(IS_TOUCH?"tap or press A to continue":"J / tap to continue",180,364+dn,17,'#c8d4ff','center');
  }
}

/* ---------------- the results ----------------
   After the poses, a window over the whole screen: what was won (coins and the purse,
   anything left behind, a seed) and a row per member standing (portrait, level, the EXP
   bar filling with a tick, LEVEL UP!). Room for five. */
const RES={pad:10, head:96, row:62};
function resultsBox(){ const T0=BAND_TOP(), T1=BAND_BOT(); return {x:RES.pad,y:T0+RES.pad,w:LW-RES.pad*2,h:T1-T0-RES.pad*2}; }
/* Fitting the results in: what was found, the same things stacked ("Rat Tail x3"); then,
   if the list doesn't fit under the party, two columns, then shorter party rows, then
   tighter lines, and at worst "+N more" */
function resultsLayout(){
  const w=B.win, R=resultsBox(), n=w.who.length, items=[];
  (w.drops||[]).forEach(k=>{ const it=items.find(t=>t.good===k); if(it) it.n++; else items.push({good:k,n:1}); });
  if(w.seed) items.push({seed:w.seed,n:1});
  const FOUND=26, FOOT=26;
  let row=RES.row, cols=1, lh=22;
  const avail=()=>R.h-RES.head-n*row-8-FOUND-FOOT, need=()=>Math.ceil(Math.max(1,items.length)/cols)*lh;
  if(need()>avail()) cols=2;
  if(need()>avail()) row=Math.max(46,Math.floor((R.h-RES.head-8-FOUND-FOOT-need())/n));
  if(need()>avail()) lh=17;
  const perCol=Math.max(1,Math.floor(avail()/lh)), room=perCol*cols;
  return {R,row,cols,lh,perCol,items,more:items.length>room?items.length-(room-1):0,dy:R.y+RES.head+n*row+8};
}
/* where found item i goes: its column's left edge and its line's middle */
const foundAt=(L,i)=>({x:L.R.x+16+Math.floor(i/L.perCol)*(L.R.w-32)/L.cols, y:L.dy+30+(i%L.perCol)*L.lh});
function drawResultsBack(){
  const w=B.win, a=clamp((w.t-POSE_MS)/RESULTS_FADE,0,1), R=resultsBox();
  b.save(); b.globalAlpha=a;
  b.fillStyle='rgba(6,10,30,.55)'; b.fillRect(0,BAND_TOP(),LW,BAND_BOT()-BAND_TOP());
  rpgWin(R);
  const L=resultsLayout(), row=L.row;
  w.who.forEach((id,i)=>{ const y=R.y+RES.head+i*row, x=xpShown(id);
    b.fillStyle='#0a0f2a'; b.fillRect(R.x+12,y+4,44,row-12);
    const im=portraitImg(id);
    if(im){ const ph=row-14, pw=ph*im.naturalWidth/im.naturalHeight;
      b.save(); b.beginPath(); b.rect(R.x+13,y+5,42,row-14); b.clip(); b.imageSmoothingEnabled=true;
      b.drawImage(im,R.x+34-pw/2,y+5,pw,ph); b.restore(); }
    gauge(R.x+66,y+Math.round(row*0.58),R.w-80,7,x.xp,x.next,'#f0c84a','#fff0b0'); });
  const sz=L.lh<22?14:18;
  L.items.slice(0,L.more?L.perCol*L.cols-1:L.items.length).forEach((it,i)=>{ const p=foundAt(L,i);
    if(it.good) drawGoodIcon(b,it.good,p.x+10,p.y,sz); else drawShopPic(seedName(it.seed).toLowerCase(),p.x+10,p.y,sz*0.8,sz); });
  b.restore();
  /* the bars fill with a ticking sound */
  const k=clamp((w.t-WIN_DELAY)/WIN_FILL,0,1);
  if(k>0&&k<1&&w.t-w.tick>70){ w.tick=w.t; if(AC) blip(520+k*520,0.025,0.05,'triangle'); }
}
function drawResultsWords(){
  const w=B.win, a=clamp((w.t-POSE_MS)/RESULTS_FADE,0,1), R=resultsBox(), xs=xpShown(w.who[0]);
  m.globalAlpha=a;
  TO("VICTORY!",180,R.y+40,44,'#ffd24a','center',true,2);
  const got=Math.round(w.coins*xs.k);
  TS("EXP +"+Math.round(w.xp*xs.k)+(w.who.length>1?" each":""),R.x+16,R.y+72,20,'#ffe08a',null,true);
  TS((w.bonus?"lucky!  ":"")+"+"+got+"c",R.x+R.w-16,R.y+66,21,'#ffe08a','right',true);
  TS("purse: "+(G.coins-w.coins+got)+"c",R.x+R.w-16,R.y+84,15,'#aab6e8','right');
  const LY=resultsLayout(), row=LY.row;
  w.who.forEach((id,i)=>{ const x=xpShown(id), f=w.from[id], y=R.y+RES.head+i*row;
    TS(PARTY_INFO[id].name,R.x+66,y+20,21,'#f4f6ff',null,true);
    TS("Lv."+x.lv,R.x+R.w-16,y+20,19,x.lv>f.lv?'#ffe08a':'#c8d4ff','right',true);
    if(x.lv>f.lv&&Math.floor(G.t/240)%2===0) TS("LEVEL UP!",R.x+66+TW(PARTY_INFO[id].name,21,true)+12,y+20,17,'#ffb04a',null,true);
    TS(x.xp+" / "+x.next+" EXP",R.x+R.w-16,y+row-6,14,'#aab6e8','right'); });
  const dy=LY.dy, fs=LY.lh<22?15:18, colW=(R.w-32)/LY.cols;
  TS("Found",R.x+16,dy+12,17,'#c8d4ff',null,true);
  if(!LY.items.length) TS("nothing this time",R.x+44,dy+34,16,'#8a94c4');
  const shown=LY.more?LY.perCol*LY.cols-1:LY.items.length;
  LY.items.slice(0,shown).forEach((it,i)=>{ const p=foundAt(LY,i), g=it.good&&GOODS[it.good], rare=g&&g.value>=40;
    let t=(g?g.name:seedName(it.seed))+(it.n>1?" x"+it.n:"")+(rare?(LY.cols>1?" ★":"  ★ rare!"):"");
    while(t.length>3&&TW(t,fs,true)>colW-34) t=t.slice(0,-2)+"…";
    TS(t,p.x+28,p.y+6,fs,rare?'#ffb0ff':g?'#f4f6ff':'#b8f0a0',null,true); });
  if(LY.more){ const p=foundAt(LY,shown); TS("+"+LY.more+" more",p.x+28,p.y+6,fs,'#aab6e8',null,true); }
  if(!winGuard()&&xs.k>=1) TS(IS_TOUCH?"tap to continue":"J to continue",180,R.y+R.h-14,16,'#8a94c4','center');
  m.globalAlpha=1;
}
/* ---------------- level up ----------------
   Each level gained (LV_UPS, from battles, songs and the rest) gets its own blue
   screen once she's back in the garden: who, the new level, every stat with what it
   rose by, and anything learned. A tap or A moves on. */
let lvT=0;
function levelUpTap(){ if(lvT<400) return; LV_UPS.shift(); lvT=0; if(!LV_UPS.length) G.scene='world'; sfx('menu_confirm'); }
function drawLevelUp(dt){
  lvT+=dt;
  const U=LV_UPS[0], I=PARTY_INFO[U.id], T0=BAND_TOP(), T1=BAND_BOT();
  const g=b.createLinearGradient(0,T0,0,T1); g.addColorStop(0,'#1c2a6e'); g.addColorStop(1,'#0a1030');
  b.fillStyle=g; b.fillRect(0,T0,LW,T1-T0);
  for(let i=0;i<24;i++){ const x=(i*67+G.t*0.02*(1+i%3))%LW, y=T0+((i*131)%(T1-T0)); b.globalAlpha=.25+.25*Math.sin(G.t/300+i);
    px(b,Math.round(x),Math.round(y),2,2,i%3?'#ffe08a':'#ffffff'); }
  b.globalAlpha=1;
  const W={x:16,y:118,w:328,h:322};
  rpgWin(W);
  b.fillStyle='#0a0f2a'; b.fillRect(W.x+14,W.y+14,88,100);
  const im=portraitImg(U.id);
  if(im){ const ph=96, pw=ph*im.naturalWidth/im.naturalHeight;
    b.save(); b.beginPath(); b.rect(W.x+16,W.y+16,84,96); b.clip(); b.imageSmoothingEnabled=true;
    b.drawImage(im,W.x+58-pw/2,W.y+16,pw,ph); b.restore(); }
  STATS.forEach((k,i)=>{ if(U.gains[k]){ b.fillStyle='rgba(255,224,138,.10)'; b.fillRect(W.x+12,W.y+128+i*21-14,W.w-24,19); } });
  blit();
  const pop=clamp(lvT/280,0,1), size=Math.round(56+(1-pop)*26);
  m.globalAlpha=pop; TO("LEVEL UP!",180,92-(1-pop)*16,size,'#ffd24a','center',true,2.2); m.globalAlpha=1;
  TS(I.name,W.x+114,W.y+40,30,'#f4f6ff',null,true);
  TS("Lv."+U.from+"  →  Lv."+U.lv,W.x+114,W.y+70,26,'#ffe08a',null,true);
  TS(I.role,W.x+114,W.y+92,16,'#aab6e8');
  STATS.forEach((k,i)=>{ const y=W.y+128+i*21, d=U.gains[k]||0, now=statOf(U.id,k,U.lv);
    TS(STAT_NAME[k],W.x+24,y,20,d?'#f4f6ff':'#8a94c4',null,!!d);
    TS(String(now-d),W.x+200,y,20,'#aab6e8','right');
    TS("→",W.x+222,y,18,'#8a94c4','center');
    TS(String(now),W.x+262,y,20,d?'#ffffff':'#aab6e8','right',!!d);
    if(d) TS("+"+d,W.x+W.w-20,y,20,'#ffe08a','right',true); });
  let y=W.y+128+STATS.length*21+6;
  if(U.learned.length) U.learned.forEach(n=>{ TS("Learned "+n+"!",180,y,21,'#b8f0a0','center',true); y+=20; });
  if(LV_UPS.length>1) TS("("+(LV_UPS.length-1)+" more)",W.x+W.w-12,W.y+W.h-10,15,'#8a94c4','right');
  if(lvT>400&&Math.floor(G.t/500)%2===0) TS(IS_TOUCH?"tap or press A to continue":"J / tap to continue",180,W.y+W.h+22,17,'#c8d4ff','center');
}

/* ---------- the party test ----------
   Open the game with ?partytest on the end of its address to try out big fights: nothing
   is saved, Kaitlyn (Lv.6) is joined by four Ivys, and it's spring. In the console,
   partyTestFight(5,'rows') starts a fight with that many pests in that layout
   (BATTLE_LAYOUTS); the party is as big as the number of pests, at least 4. */
const PARTY_TEST=NO_SAVE, TEST_PESTS=['raccoon','beetle','crow','rat','crab'];   /* none of them fly */
function partyTestSetup(){
  if(G.scene==='title'){ newGameState(); startGame(); }
  const lv=6, ivys=['ivy','ivy2','ivy3','ivy4'];
  ivys.forEach((id,i)=>{
    if(!PARTY_INFO[id]){ PARTY_INFO[id]={...PARTY_INFO.ivy,name:"Ivy "+(i+1)}; BORN_NAMES[id]=PARTY_INFO[id].name;
      ALLY_SKILLS[id]=ALLY_SKILLS.ivy; if(PARTY_ART.ivy) PARTY_ART[id]=PARTY_ART.ivy; READY_MS[id]=READY_MS.ivy; }
    const hp=statOf(id,'hp',lv);
    G.allies[id]={lv,xp:0,next:xpNeed(lv),hp,maxhp:hp,mp:statOf(id,'mp',lv),hurtUntil:0}; });
  const P=G.player; P.lv=lv; P.maxhp=statOf('kaitlyn','hp',lv); P.hp=P.maxhp; P.mp=maxMp();
  G.day=1;                                   /* spring, for its roomy backdrop */
}
/* ?alltest (nothing is saved): Kaitlyn and all four friends at Lv.lv (14), all of them out
   with her and their stories done, and every item: all gear, flutes and things to wear,
   the yard all built, every seed (10) and crop (5), five of every good, the best rod,
   all the sheet music, and 50,000 coins. */
function everythingTest(lv){
  lv=lv||14; const P=G.player, S=G.story;
  P.lv=lv; P.xp=0; P.next=xpNeed(lv); P.maxhp=statOf('kaitlyn','hp',lv); P.hp=P.maxhp;
  ['ivy','tiny','tituba','tex'].forEach(id=>{ const hp=statOf(id,'hp',lv);
    G.allies[id]={lv,xp:0,next:xpNeed(lv),hp,maxhp:hp,mp:statOf(id,'mp',lv),hurtUntil:0}; });
  Object.assign(S,{ivy:'joined',ivyDay:G.day-10,tiny:'joined',titu:'joined',tituHint:true,tex:'joined'});
  G.slots=['tex','ivy','kaitlyn','tiny','tituba']; G.party=G.slots.slice(); partySlots();   /* the test line-up, top to bottom */
  Object.keys(EQUIP).forEach(k=>G.gear[k]=true); GEAR.forEach(g=>G.gear[g.id]=true);
  YARD.forEach(y=>(y.gear?G.gear:G.yard)[y.id]=true); buildWorld();
  G.unlocked=Object.keys(SPECIES); G.unlocked.forEach(sp=>{ G.seeds[sp]=10; G.crops[sp]=5; });
  Object.keys(GOODS).filter(k=>k!=='egg').forEach(k=>G.goods[k]=5);     /* (not Tiny One's egg) */
  G.rod=RODS.length-1; G.sheets=PRACTICE_SONGS.filter(s=>s.cost).map(s=>s.id);
  G.coins=Math.max(G.coins,50000); P.mp=maxMp();
}
function partyTestFight(n,layout){
  if(!PARTY_TEST) return "Open the game with ?partytest first.";
  partyTestSetup(); if(layout) BATTLE_LAYOUT=layout;
  n=clamp(n||5,1,5); G.party=['kaitlyn','ivy','ivy2','ivy3','ivy4'].slice(0,Math.max(n,4));
  startBattle({species:TEST_PESTS[0],lv:5,x:0,y:0},TEST_PESTS.slice(0,n));
  return n+" pests, "+G.party.length+" in the party, layout "+BATTLE_LAYOUT;
}
