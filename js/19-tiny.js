/* ================================================================
   TINY ONE, the little brown bird
   From the first fall on, an egg lies at the foot of the big pine near the bottom of the
   mountain trail. Kaitlyn takes it (G.story.tiny 'egg'), and twigs and pinestraw start
   turning up among the trail's gathering spots until she has TINY_NEED of each. With
   them she builds a nest on the hearth ('nest'; G.story.tinyNest: that day) and the egg
   hatches the next day ('baby'). The baby begs for worms: they come up in garden plots
   left ruined since an earlier day (the plot's deadDay), one a day each, and Old Pete has a
   hint (a "!" over his head until she has heard it). Once he's eaten TINY_WORMS
   (G.story.tinyFed; tinyFull: the day of the last one), the next day he's a fledgling,
   and talking to him he joins ('joined'). After that he waits in the nest when he isn't
   out with her. His battle moves are in 12-battle.js (doTweet, the song skills).
   ================================================================ */
const TINY_EGG={x:452,y:1258};             /* mountain px, at the foot of the big pine */
const TINY_NEST={x:352,y:236};             /* house painting px: on the hearth */
const TINY_NEED=3, TINY_WORMS=5;
const TINY_BABY_UP=5.5;                        /* how far above the nest's foot the baby's feet are (logical px): in the bowl */
const TINY_EGG_H=8;                        /* the egg's height in the nest (logical px) */
const TINY_FALL=2*DAYS_PER_SEASON+1;       /* the first day of the first fall */
SPEAKER.tiny={get name(){ return PARTY_INFO.tiny.name; },col:'#7a5a2a'};
Object.assign(GOODS,{
  egg:      {name:"Tiny Egg",  value:0, kind:'quest', col:'#efe6d6', flavor:"Speckled, warm and somehow not broken. Something's in there."},
  twig:     {name:"Twig",      value:0, kind:'quest', col:'#8a6a3a', flavor:"A good bendy twig. Nest material."},
  pinestraw:{name:"Pinestraw", value:0, kind:'quest', col:'#b07a3a', flavor:"Soft, dry pine needles, for lining a nest."},
  worm:     {name:"Earthworm", value:0, kind:'quest', col:'#d8848a', flavor:"Wriggly, and Tiny One's very favorite food."},
});
/* where the quest is: null (no egg yet), 'lost' (the egg is out on the trail), 'egg',
   'nest', 'hatching' (the day after the nest), 'baby', 'grown' (the day after his last
   worm) or 'joined' */
function tinyStage(){
  const S=G.story, s=S.tiny;
  if(!s) return G.day>=TINY_FALL?'lost':null;
  if(s==='nest') return G.day>S.tinyNest?'hatching':'nest';
  if(s==='baby') return S.tinyFull&&G.day>S.tinyFull?'grown':'baby';
  return s;
}
const tinyHungry=()=>tinyStage()==='baby'&&!G.story.tinyFull;
const have=k=>G.goods[k]||0;

/* ---------- the egg on the mountain ---------- */
const nearTinyEgg=(f=1)=>G.area==='mountain'&&tinyStage()==='lost'&&Math.hypot(G.player.x-TINY_EGG.x,G.player.y+9-TINY_EGG.y)<28*f;
function drawTinyEgg(c,x,y){
  c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x,y,6,2,0,0,7); c.fill();
  if(!drawShopPic('tiny egg',x,y-4,8,10)){ c.fillStyle='#efe6d6'; c.beginPath(); c.ellipse(x,y-5,4,5,0,0,7); c.fill(); }
  const tw=Math.sin(G.t/300)*0.5+0.5;
  c.globalAlpha=tw*0.9; c.fillStyle='#ffffff'; c.fillRect(x+4,y-12,2,2); c.fillRect(x+3,y-11,4,0.8); c.globalAlpha=1;
}
const tinyEggFound=()=>[
  {say:'kaitlyn',text:"Oh no! This egg must have fallen out of its nest. I can't believe it didn't break."},
  {say:'kaitlyn',text:"Maybe I need to...rehabilitate it. I'll need to build a nest."},
  {run:()=>{ G.story.tiny='egg'; addGood('egg');
    say("Got the Tiny Egg! Gather "+TINY_NEED+" Twigs and "+TINY_NEED+" Pinestraw on the trail."); }},
];
/* Twigs and pinestraw among the trail's gathering spots, while she still needs them:
   about one spot in five (three or four a day) (s: the spot's number for the day, from gatherAt) */
function tinyGather(s){
  if(G.story.tiny!=='egg') return null;
  const tw=have('twig')<TINY_NEED, pn=have('pinestraw')<TINY_NEED;
  if(!(tw||pn)||(s>>3)%5!==0) return null;
  return tw&&pn?((s>>5)%2?'twig':'pinestraw'):tw?'twig':'pinestraw';
}
/* "Found a Twig! (2/3)" */
const tinyFoundText=k=>(k==='twig'||k==='pinestraw')&&G.story.tiny==='egg'?"  ("+Math.min(have(k),TINY_NEED)+"/"+TINY_NEED+")":"";

/* ---------- the nest on the hearth ---------- */
function nearTinyNest(f=1){
  const st=tinyStage();
  if(!G.indoors||!st||st==='lost'||(st==='joined'&&!tinyHome())) return false;
  return Math.hypot(G.player.x-TINY_NEST.x,G.player.y-(TINY_NEST.y+16))<40*f;
}
/* the nest is in the way once it's built */
const tinyNestSolid=(x,y)=>{ const st=tinyStage(); return !!st&&st!=='lost'&&st!=='egg'&&Math.hypot(x-TINY_NEST.x,(y-TINY_NEST.y)*1.4)<16; };
/* he's at home in the nest (when joined: left at home, or hurt) */
const tinyHome=()=>!G.party.includes('tiny')||isHurt('tiny');
function tinyLabel(){
  const st=tinyStage();
  if(st==='egg') return have('twig')>=TINY_NEED&&have('pinestraw')>=TINY_NEED?"Build a nest":"Nest spot";
  if(st==='nest'||st==='hatching') return "Egg";
  if(st==='baby') return tinyHungry()&&have('worm')?"Feed a worm":PARTY_INFO.tiny.name;
  return st==='grown'?PARTY_INFO.tiny.name:"Talk";
}
function tinyInteract(){
  const st=tinyStage(), name=PARTY_INFO.tiny.name;
  if(st==='egg'){
    if(have('twig')<TINY_NEED||have('pinestraw')<TINY_NEED){
      say("A warm spot by the fire for a nest. It needs "+TINY_NEED+" Twigs (you have "+have('twig')+") and "+TINY_NEED+" Pinestraw (you have "+have('pinestraw')+")."); return; }
    playStory(tinyBuildsNest()); return; }
  if(st==='nest'){ say("The egg is snug and warm. Maybe tomorrow..."); return; }
  if(st==='hatching'){ playStory(tinyHatches()); return; }
  if(st==='baby'){
    if(!tinyHungry()){ say(name+" is full and fast asleep. He'll be bigger tomorrow!"); return; }
    if(!have('worm')){ say(name+" begs for food. Baby birds eat worms... where could you find some?"); blip(880,0.03,0.05,'triangle'); return; }
    G.goods.worm--; if(G.goods.worm<=0) delete G.goods.worm;
    G.story.tinyFed=(G.story.tinyFed||0)+1; TINY_GULP.t=900;
    if(G.story.tinyFed>=TINY_WORMS){ G.story.tinyFull=G.day; TINY_ANIM.sleep=G.t; say(name+" gobbles it down and settles in, full and sleepy. He'll be bigger tomorrow!"); }
    else say(name+" gobbles up the worm! ("+G.story.tinyFed+"/"+TINY_WORMS+")");
    if(AC){ flute(21,AC.currentTime,.08,.3); flute(24,AC.currentTime+.09,.1,.3); }
    autoSave(); return; }
  if(st==='grown'){ playStory(tinyJoins()); return; }
  const left=isHurt('tiny')?G.allies.tiny.hurtUntil-G.day:0;
  playStory([{say:'tiny',text:left?"tweet... (He's still sore. Back in "+left+" day"+(left===1?"":"s")+".)"
                                :"Tweet! (Add "+name+" to your party from the menu.)"}]);
}
const tinyBuildsNest=()=>[
  {fade:'out'},
  {run:()=>{ ['twig','pinestraw'].forEach(k=>{ G.goods[k]-=TINY_NEED; if(G.goods[k]<=0) delete G.goods[k]; });
    delete G.goods.egg; G.story.tiny='nest'; G.story.tinyNest=G.day; }},
  {fade:'in'},
  {say:'kaitlyn',text:"There. A cozy nest, nice and warm by the fire. Sleep tight, little egg."},
];
/* the egg hatches in the nest (its animation, once through, holding on the last frame), then the picture */
const TINY_HATCH_MS=60;                       /* per frame */
const tinyHatches=()=>[
  {say:'kaitlyn',text:"Oh goodness! It's hatching!"},
  {run:()=>{ TINY_ANIM.hatch=G.t; }},
  {wait:((PARTY_ART.tiny&&PARTY_ART.tiny.hatch?PARTY_ART.tiny.hatch.f.length:0)*TINY_HATCH_MS)+900},
  {fade:'out',ms:900},
  {pic:'hatch_tiny_one'},
  {fade:'in',ms:2400},
  {say:'kaitlyn',text:"Oh! Hello, tiny one. Sorry you had to come out of that cozy egg...but I'll take care of you now, okay?"},
  {say:'tiny',face:'tiny-baby',text:"Peep...?"},
  {fade:'out',ms:900},
  {pic:null},
  {run:()=>{ G.story.tiny='baby'; G.story.tinyFed=0; TINY_ANIM.hatch=0; }},
  {fade:'in',ms:700},
  {run:()=>say("He's hungry already! Baby birds need worms.")},
];
const tinyJoins=()=>[
  {say:'tiny',text:"Tweet! Tweet tweet!"},
  {say:'kaitlyn',text:"Look at you, all grown up! Want to come along with me?"},
  {say:'tiny',text:"Tweeeet!"},
  {run:()=>{ G.story.tiny='joined'; joinParty('tiny'); delete G.goods.worm; }},
  {popup:"Tiny One the little brown bird joins the party!",who:'tiny'},
];
/* a little hop when he eats */
const TINY_GULP={t:0};
/* when the hatching and falling-asleep animations started (G.t; 0: not playing). Not saved:
   come back later and he's simply asleep. */
const TINY_ANIM={hatch:0,sleep:0};
/* frame i of an animation that plays once and holds its last frame */
const onceFrame=(A,t0,ms)=>A.f[Math.min(A.f.length-1,Math.floor((G.t-t0)/ms))];
/* one of his pictures from party.webp at s logical px per sheet px, feet (ax,ay) on x,y */
function tinyFrame(c,r,ax,ay,x,y,s,flip){
  const img=partyImg(); if(!img||!r) return false;
  const [sx,sy,w,h]=r;
  c.save(); c.translate(x,y); c.scale(flip?-s:s,s); c.imageSmoothingEnabled=true;
  c.drawImage(img,sx,sy,w,h,-ax,-ay,w,h); c.restore(); return true;
}
/* Tiny One as he is now, standing on x,y and about h logical px tall: the baby (how:
   'beg', 'asleep', or still), or the fledgling (how 'tweet': excited, his tweet loop) */
function drawTinyBird(c,x,y,h,baby,how){
  const A=PARTY_ART.tiny; if(!A) return;
  if(baby){
    const k=h/BABY_SHEET_H;
    if(how==='beg'&&A.beg){ const f=A.beg.f[Math.floor(G.t/55)%A.beg.f.length]; tinyFrame(c,f,A.beg.ax,A.beg.ay,x,y,k); return; }
    if(how==='asleep'&&A.asleep){
      /* just fed his last worm: he nods off (once), then sleeps on */
      const F=A.fallasleep, dozing=F&&TINY_ANIM.sleep&&G.t-TINY_ANIM.sleep<F.f.length*TINY_DOZE_MS;
      if(dozing){ tinyFrame(c,onceFrame(F,TINY_ANIM.sleep,TINY_DOZE_MS),F.ax,F.ay,x,y,k); return; }
      tinyFrame(c,A.asleep.f[Math.floor(G.t/90)%A.asleep.f.length],A.asleep.ax,A.asleep.ay,x,y,k); return; }
    if(A.baby){ tinyFrame(c,A.baby.r,A.baby.ax,A.baby.ay,x,y,k); return; }
  }
  if(how==='tweet'&&A.attack){ const a=A.attack; tinyFrame(c,a.f[Math.floor(G.t/60)%a.f.length],a.ax,a.ay,x,y,h/TINY_SHEET_H); return; }
  const s=A.stance||{r:A.ready[0],ax:A.ax,ay:A.ay};
  tinyFrame(c,s.r,s.ax,s.ay,x,y,h/TINY_SHEET_H);
}
const TINY_DOZE_MS=70;                        /* per frame of his falling asleep */
const BABY_SHEET_H=90, TINY_SHEET_H=66;      /* their heights in party.webp (BABY_H and PARTY_FIT in build_art.py) */
/* the nest (once built) and whoever is in it, for drawHouse: k logical px per painting px */
function tinyHouseEnt(k,cam){
  const st=tinyStage();
  if(!st||st==='lost'||st==='egg') return null;
  return {y:TINY_NEST.y,f:()=>{
    const x=TINY_NEST.x*k, y=cam.top+(TINY_NEST.y-cam.y)*k, P=G.player;
    b.fillStyle='rgba(30,14,4,.32)'; b.beginPath(); b.ellipse(x,y+1,16,4,0,0,7); b.fill();
    const back=()=>drawShopPic('tiny nest',x,y-6,34,22);
    back();
    if(st==='nest'||st==='hatching'){
      const H=PARTY_ART.tiny&&PARTY_ART.tiny.hatch;
      if(TINY_ANIM.hatch&&H){ tinyFrame(b,onceFrame(H,TINY_ANIM.hatch,TINY_HATCH_MS),H.ax,H.ay,x,y-5,TINY_EGG_H/H.eh); return; }
      const wob=st==='hatching'&&Math.sin(G.t/90)>0.6?Math.sin(G.t/30)*1.2:0;
      b.save(); b.translate(x+wob,y-5-TINY_EGG_H/2); b.rotate(wob*0.06); drawShopPic('tiny egg',0,0,TINY_EGG_H*0.8,TINY_EGG_H); b.restore(); return; }
    if(st==='joined'&&!tinyHome()) return;                  /* out with her: the nest waits */
    const near=Math.hypot(P.x-TINY_NEST.x,P.y-TINY_NEST.y)<110, hop=TINY_GULP.t>0?Math.abs(Math.sin(TINY_GULP.t/90))*3:0;
    if(st==='baby') drawTinyBird(b,x,y-TINY_BABY_UP-hop,22,true,!tinyHungry()?'asleep':near?'beg':null);
    else drawTinyBird(b,x,y-6-hop,22,false,st==='grown'&&near?'tweet':null);
    /* asleep in the nest at night, like Ivy at the foot of the bed */
    if(st==='joined'&&G.clock>=BLING_SLEEPS) drawMood(b,x+8,y-34,'sleep');
  }};
}
function updateTiny(dt){ if(TINY_GULP.t>0) TINY_GULP.t-=dt; }

/* ---------- worms in ruined plots ---------- */
/* a plot ruined on an earlier day has a worm today (one a day), while Tiny One is hungry */
function wormIn(p){
  if(!p.dead||!tinyHungry()||(p.deadDay||0)>=G.day) return false;
  if(G.daily.wormDay!==G.day) return true;
  return !(G.daily.wormed||[]).includes(plots.indexOf(p));
}
function pickWorm(p){
  if(G.daily.wormDay!==G.day){ G.daily.wormDay=G.day; G.daily.wormed=[]; }
  G.daily.wormed.push(plots.indexOf(p)); addGood('worm');
  say("Picked up an Earthworm! You have "+have('worm')+"."); blip(700,0.05,0.1,'sine'); autoSave();
}
/* two worms wriggling in and out of the rotten plant (garden px, inside the garden's zoom) */
function drawWorms(c,p,x,y){
  const F=typeof FX_ART!=='undefined'&&FX_ART.earthworm, img=IMG_CREATURES;
  for(let i=0;i<2;i++){
    const t=G.t+i*700+p.x*13, wx=x+(i?7:-8)+Math.sin(t/900)*2, wy=y+(i?3:1);
    if(F&&img.complete&&img.naturalWidth){ const [sx,sy,fw,fh]=F[Math.floor(t/70)%F.length];
      c.save(); c.translate(wx,wy); c.scale((i?-1:1)/SC,1/SC); c.imageSmoothingEnabled=true;
      c.drawImage(img,sx,sy,fw,fh,-fw/2,-fh,fw,fh); c.restore(); }
    else { c.strokeStyle='#d8848a'; c.lineWidth=1.6; c.beginPath(); c.moveTo(wx-5,wy);
      c.quadraticCurveTo(wx,wy-3+Math.sin(t/120)*2,wx+5,wy); c.stroke(); }
  }
}

/* ---------- Old Pete's hint ---------- */
const PETE_HINT=[
  "Oh, Kaitlyn! Don't do what I did. I forgot to look after my garden for a few days, and the pests got in and chewed every last plant down to the stems.",
  "Then I left the ruined plants sitting out to rot a day, and now the whole plot's crawling with worms, eating up the dead crops. The birds think it's a buffet!",
];
/* what a townsperson says (Old Pete has the hint while Tiny One is hungry) */
function personLines(who){
  if(who.name==="Old Pete"&&tinyHungry()){ G.story.peteHint=true; return PETE_HINT; }
  return who.lines;
}
/* a "!" over someone with something new to say */
const personMarked=who=>who.name==="Old Pete"&&tinyHungry()&&!G.story.peteHint;
function drawMarker(c,x,y){
  y+=Math.sin(G.t/260)*1.6;
  c.fillStyle='rgba(20,12,4,.35)'; c.beginPath(); c.arc(x+0.6,y+0.8,5.4,0,7); c.fill();
  c.fillStyle='#ffd54a'; c.strokeStyle='#7a4a10'; c.lineWidth=0.9;
  c.beginPath(); c.arc(x,y,5.2,0,7); c.fill(); c.stroke();
  c.fillStyle='#4a2a08'; c.fillRect(x-0.9,y-3.4,1.8,4.2); c.fillRect(x-0.9,y+1.6,1.8,1.6);
}

/* ---------- trying it out ----------
   With ?partytest (nothing is saved), tinyTest(step) in the console jumps to a step of the
   quest on the first day of fall: 'egg' (by the egg on the mountain), 'nest' (by the
   hearth with the egg, twigs and pinestraw), 'hatch' (the morning it hatches), 'worms'
   (in the garden by two plots ruined yesterday, Old Pete's hint not heard yet), 'grown'
   (the morning he's a fledgling) or 'fight' (Tiny One at Lv.lv, default 10, in a fight). */
function tinyTest(step,lv){
  if(!PARTY_TEST) return "Open the game with ?partytest first.";
  if(G.scene==='title'){ newGameState(); startGame(); }
  const P=G.player, S=G.story;
  G.day=TINY_FALL; G.clock=9*60; G.scene='world'; story=null; G.pests=[]; G.mtnPests=[];
  ['tiny','tinyNest','tinyFed','tinyFull','peteHint'].forEach(k=>delete S[k]);
  ['egg','twig','pinestraw','worm'].forEach(k=>delete G.goods[k]);
  const inside=(x,y)=>{ G.area='garden'; G.indoors=true; houseImg(); place(x,y,0); };
  if(step==='egg'){ G.area='mountain'; G.indoors=false; placeImg('mountain'); place(TINY_EGG.x+16,TINY_EGG.y+24,6); gatherToday(); }
  else if(step==='nest'){ S.tiny='egg'; G.goods.egg=1; G.goods.twig=TINY_NEED; G.goods.pinestraw=TINY_NEED; inside(TINY_NEST.x,TINY_NEST.y+30); }
  else if(step==='hatch'){ S.tiny='nest'; S.tinyNest=G.day-1; inside(TINY_NEST.x,TINY_NEST.y+30); }
  else if(step==='worms'){ S.tiny='baby'; S.tinyFed=0; G.daily.wormDay=0;
    const L=plots.filter(p=>active(p)&&!p.tree&&!p.raised).slice(0,2);
    L.forEach(p=>Object.assign(p,{sp:null,dead:true,deadSp:'tomato',deadDay:G.day-1,stage:0,growth:0,health:100}));
    G.area='garden'; G.indoors=false; seasonMap(season()); place(L[0].x+18,L[0].y-4,6); }
  else if(step==='grown'){ S.tiny='baby'; S.tinyFed=TINY_WORMS; S.tinyFull=G.day-1; inside(TINY_NEST.x,TINY_NEST.y+30); }
  else if(step==='fight'){ S.tiny='joined'; joinParty('tiny'); lv=lv||10;
    const hp=statOf('tiny','hp',lv); Object.assign(G.allies.tiny,{lv,xp:0,next:xpNeed(lv),hp,maxhp:hp,mp:statOf('tiny','mp',lv),hurtUntil:0});
    P.lv=Math.max(P.lv,lv); P.maxhp=statOf('kaitlyn','hp'); P.hp=Math.round(P.maxhp*0.6); P.mp=maxMp(); G.allies.tiny.hp=Math.round(hp*0.7);
    G.area='garden'; G.indoors=false; G.day=1;
    startBattle({species:TEST_PESTS[0],lv:Math.max(5,lv-2),x:0,y:0},TEST_PESTS.slice(0,2)); return "Tiny One Lv."+lv+" in a fight"; }
  else return "Steps: egg, nest, hatch, worms, grown, fight";
  return "Tiny One quest: "+step+" (day "+G.day+", "+season()+")";
}
