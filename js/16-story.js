/* ================================================================
   STORY: conversations, cutscenes, and how Bling joins
   A story scene ('story') plays a list of steps over the garden or the house
   (or over a full picture): lines of talk with the speaker's portrait, fades
   to and from black, a picture, a "joins the party" window, and plain
   functions that move people around between them. A tap or A moves on.
   ================================================================ */
const SPEAKER={kaitlyn:{name:"Kaitlyn",col:'#a06a1a'}, bling:{name:"Bling",col:'#7a5a12'}};
const TALK_MS=28;                 /* typing speed: ms per letter */
let story=null;
function playStory(steps){
  story={steps,i:-1,t:0,fade:0,from:0,to:0,pic:null};
  padVec={x:0,y:0}; padId=null; btnHeld=false; G.scene='story';
  nextStep();
}
function nextStep(){
  story.i++; story.t=0;
  const s=story.steps[story.i];
  if(!s){ story=null; if(G.scene==='story') G.scene='world'; autoSave(); return; }   /* unless a step opened something */
  if(s.run){ s.run(); if(G.scene!=='story'&&story.i>=story.steps.length-1){ story=null; return; } nextStep(); return; }
  if(s.pic!==undefined){ story.pic=s.pic; if(s.pic) sceneImg(s.pic); nextStep(); return; }
  if(s.fade){ story.from=story.fade; story.to=s.fade==='out'?1:0; }
  if(s.popup&&AC){ flute(9,AC.currentTime,.3,.6); flute(13,AC.currentTime+.12,.3,.6); flute(16,AC.currentTime+.24,.6,.6); }
}
function updateStory(dt){
  const s=story.steps[story.i]; story.t+=dt;
  if(s.fade){ const k=clamp(story.t/(s.ms||600),0,1); story.fade=story.from+(story.to-story.from)*k; if(k>=1) nextStep(); }
}
const typed=s=>Math.min(s.text.length,Math.floor(story.t/TALK_MS));
/* a tap first finishes the line being typed, then moves on */
function storyTap(){
  const s=story&&story.steps[story.i]; if(!s) return;
  if(s.say){ if(typed(s)<s.text.length) story.t=1e9; else { blip(520,0.03,0.06,'triangle'); nextStep(); } }
  else if(s.popup&&story.t>450) nextStep();
}
/* pictures for story scenes load on first use */
const SCENE_IMG={};
function sceneImg(name){
  if(!SCENE_IMG[name]){ SCENE_IMG[name]=new Image(); SCENE_IMG[name].src=ASSET_SCENES[name]; }
  const im=SCENE_IMG[name]; return im.complete&&im.naturalWidth?im:null;
}
/* the screen above the deck (all of it without one) */
const storyArea=()=>deckShown()?SCREEN_H-DECK_H:SCREEN_H;
function drawStory(){
  let bottom=VIEW_H;
  if(story.pic){
    /* the picture fills the screen above the deck, trimmed at the edges to fit */
    bottom=storyArea();
    fillScreen(b,'#0d1410');
    const im=sceneImg(story.pic);
    if(im){ const s=Math.max(LW/im.naturalWidth,bottom/im.naturalHeight), w=im.naturalWidth*s, h=im.naturalHeight*s;
      b.save(); b.beginPath(); b.rect(0,0,LW,bottom); b.clip(); b.imageSmoothingEnabled=true;
      b.drawImage(im,(LW-w)/2,(bottom-h)/2,w,h); b.restore(); }
    blit();
  } else drawWorld();
  const s=story.steps[story.i];
  if(s&&s.say) drawTalk(s,bottom);
  if(s&&s.popup) drawPopup(s.popup,s.who);
  if(story.fade>0){ m.save(); m.setTransform(1,0,0,1,0,0); m.globalAlpha=story.fade;
    m.fillStyle='#0d1410'; m.fillRect(0,0,LW*SC,SCREEN_H*SC); m.restore(); }
}
/* the talk box along the bottom of the view: portrait, name, the line typing out */
function drawTalk(s,bottom){
  const x=10, h=112, y=bottom-h-12, w=LW-20, who=s.who?{name:s.who.name,col:'#5a4a8a'}:SPEAKER[s.say];
  wipeBuf();
  panel(x,y,w,h);
  px(b,x+9,y+9,86,h-18,'#e2d3ae');
  const im=portraitImg(s.say);
  if(im){ const ph=h-22, pw=ph*im.naturalWidth/im.naturalHeight;
    b.save(); b.beginPath(); b.rect(x+9,y+9,86,h-18); b.clip(); b.imageSmoothingEnabled=true;
    b.drawImage(im,x+9+(86-pw)/2,y+11,pw,ph); b.restore(); }
  else if(s.who){ b.save(); b.translate(x+52,y+h-8); b.scale(2.6,2.6); drawPerson(b,{...s.who,x:0,y:0}); b.restore(); }
  blit();
  T(who.name,x+108,y+26,22,who.col,'left',true);
  const n=typed(s);
  wrapLines(s.text,23,w-120).reduce((acc,ln,i)=>{
    const left=Math.max(0,n-acc); if(left>0) T(ln.slice(0,left),x+108,y+50+i*19,23,'#3a2a1a');
    return acc+ln.length+1; },0);
  if(n>=s.text.length&&Math.floor(G.t/400)%2===0) T("▼",x+w-14,y+h-10,18,'#a06a1a','center');
}
/* a window in the middle of the view, e.g. someone joining the party (who: shown in it) */
function drawPopup(text,who){
  const w=300, h=who?118:76, x=(LW-w)/2, y=Math.round(VIEW_H/2-h/2), ty=y+(who?84:34);
  wipeBuf();
  b.globalAlpha=.35; px(b,0,0,LW,VIEW_H,'#0d1410'); b.globalAlpha=1;
  panel(x,y,w,h);
  px(b,x+8,y+8,w-16,3,'#e8c34a');
  if(who==='bling') drawBlingMap(b,LW/2,y+62,64,null,false,false);
  blit();
  wrapLines(text,24,w-28).forEach((ln,i)=>T(ln,LW/2,ty+i*18,24,'#3a2a1a','center',true));
  if(story.t>450&&Math.floor(G.t/500)%2===0) T(IS_TOUCH?"tap or press A":"press J",LW/2,y+h-6,16,'#8a7a5a','center');
}
/* going from one place to another: footsteps over a fade to black and back (~2 s) */
const TRAVEL_MS=1000;
function travel(arrive){
  playStory([{run:()=>playOne('walk_down',0.55)},{fade:'out',ms:TRAVEL_MS},{run:()=>{ arrive(); restartTrack('battle'); }},
             {fade:'in',ms:TRAVEL_MS},{run:()=>stopOne('walk_down')}]);
}
function place(x,y,dir){ const P=G.player; P.x=x; P.y=y; P.dir=dir; P.moving=false; P.walkT=0; G.swim=false; }

/* ---------------- Bling ----------------
   From day 5 she lies hurt in the shade of the house. Kaitlyn takes her in, and she
   recovers on the rug over three days (sad, unsure, happy), is let go in the
   north-west corner of the garden, comes back, and joins the party. After that she
   sleeps at the foot of the bed from 8 PM. G.story.bling: 'recover' | 'released' |
   'joined' (unset before), G.story.blingDay: the day she was taken in. */
const BLING_DAY=5, BLING_SLEEPS=20*60, BLING_W=20;
const BLING_HURT={x:622,y:198}, BLING_FREE={x:185,y:190};      /* garden px */
const BLING_RUG={x:250,y:398}, BLING_BED={x:196,y:322};         /* house painting px */
/* where she wanders after being let go (not saved: she starts at BLING_FREE) */
const BL={x:BLING_FREE.x,y:BLING_FREE.y,tx:0,ty:0,wait:1200,flip:false,moving:false};
function blingStage(){ return G.story.bling||(G.day>=BLING_DAY?'hurt':null); }
const recoverDay=()=>G.day-G.story.blingDay+1;          /* 1 on the day she is taken in */
/* where she is now and how she feels: {x,y,inside,mood,flip,moving}, or null */
function blingHere(){
  const s=blingStage();
  if(s==='hurt') return {x:BLING_HURT.x,y:BLING_HURT.y,inside:false,mood:'sad'};
  if(s==='recover'){ const d=recoverDay();
    return {x:BLING_RUG.x,y:BLING_RUG.y,inside:true,mood:d<=1?'sad':d===2?'unsure':'happy'}; }
  if(s==='released') return {x:BL.x,y:BL.y,inside:false,mood:'happy',flip:BL.flip,moving:BL.moving};
  if(s==='joined'){
    /* hurt in battle she rests on the rug; left at home she waits there; at night she sleeps */
    if(isHurt('bling')) return {x:BLING_RUG.x,y:BLING_RUG.y,inside:true,mood:'sad'};
    if(G.clock>=BLING_SLEEPS) return {x:BLING_BED.x,y:BLING_BED.y,inside:true,mood:'sleep'};
    if(!G.party.includes('bling')) return {x:BLING_RUG.x,y:BLING_RUG.y,inside:true,mood:'happy'};
  }
  return null;
}
function nearBling(f=1){
  const bl=blingHere(), P=G.player;
  if(!bl||bl.mood==='sleep'||bl.inside!==G.indoors) return false;
  return G.indoors?Math.hypot(P.x-bl.x,P.y-bl.y)<52*f:Math.hypot(P.x-bl.x,P.y+10-bl.y)<34*f;
}
const blingLabel=()=>blingStage()==='hurt'?"Check":"Talk";
function talkBling(){
  const s=blingStage();
  if(s==='hurt') playStory(blingMeets());
  else if(s==='recover'){ const d=recoverDay();
    if(d<=1) playStory([{say:'bling',text:"Ssss..."}]);
    else if(d===2) playStory([{say:'bling',text:"Ssss...?"}]);
    else playStory(blingLetGo()); }
  else if(s==='released') playStory(blingJoins());
  else if(s==='joined') playStory([{say:'bling',text:isHurt('bling')?"Ssss... (She's still sore. Back in "+(G.allies.bling.hurtUntil-G.day)+" day"+(G.allies.bling.hurtUntil-G.day===1?"":"s")+".)"
                                                                    :"Ssss! (Add Bling to your party from the menu.)"}]);
}
const blingMeets=()=>[
  {say:'kaitlyn',text:"Oh no! This poor snake looks hurt..."},
  {say:'kaitlyn',text:"...but maybe I can rehabilitate her. Let's get you inside, poor baby."},
  {fade:'out'},
  {run:()=>{ G.story.bling='recover'; G.story.blingDay=G.day; G.indoors=true; houseImg(); place(318,412,6); }},
  {fade:'in'},
  {say:'kaitlyn',text:"You're so pretty, with your little ring around your neck...like a little golden necklace."},
  {say:'kaitlyn',text:"...you're so fancy, I think I'll call you Bling!"},
];
const blingLetGo=()=>[
  {say:'bling',text:"Ssss!"},
  {say:'kaitlyn',text:"Wow Bling, you're looking much better! I'll miss you, but I think it's time to let you go."},
  {fade:'out'},
  {run:()=>{ G.story.bling='released'; G.indoors=false; place(BLING_FREE.x+30,BLING_FREE.y-8,6);
    Object.assign(BL,{x:BLING_FREE.x,y:BLING_FREE.y,tx:0,ty:0,wait:1400}); }},
  {fade:'in'},
  {say:'kaitlyn',text:"Go on, Bling! You're free now."},
];
const blingJoins=()=>[
  {say:'bling',text:"Ssss! Sssss! ...sssss?"},
  {say:'kaitlyn',text:"Huh? Are you saying...you want to stay with me?"},
  {fade:'out',ms:900},
  {pic:'join_bling'},
  {fade:'in',ms:2400},
  {say:'kaitlyn',text:"Well, I could certainly use a helper! Let's look after each other from here on out, okay?"},
  {say:'bling',text:"Yesssss!"},
  {say:'kaitlyn',text:"What?! You can...talk?"},
  {say:'bling',text:"Ssss...?"},
  {fade:'out',ms:900},
  {pic:null},
  {run:()=>{ G.story.bling='joined'; joinParty('bling'); }},
  {fade:'in',ms:700},
  {popup:"Bling the ring-necked snake joins the party!",who:'bling'},
];
/* let go, she ambles around near where she was set down */
function updateBling(dt){
  if(blingStage()!=='released') return;
  if(BL.wait>0){ BL.wait-=dt; BL.moving=false; return; }
  const dx=BL.tx-BL.x, dy=BL.ty-BL.y, d=Math.hypot(dx,dy);
  if(!BL.tx||d<1.5){
    let guard=0;
    do{ const a=rnd(0,6.28), r=rnd(10,36); BL.tx=BLING_FREE.x+Math.cos(a)*r; BL.ty=BLING_FREE.y+Math.sin(a)*r*0.6; }
    while(solidAt(BL.tx,BL.ty)&&guard++<12);
    if(solidAt(BL.tx,BL.ty)){ BL.tx=BLING_FREE.x; BL.ty=BLING_FREE.y; }
    BL.wait=rnd(700,2400); BL.moving=false; return;
  }
  const step=Math.min(0.02*dt,d);
  BL.x+=dx/d*step; BL.y+=dy/d*step; BL.flip=dx<0; BL.moving=true;
}
/* Her battle stance, small, with a shadow and how she feels floating over her head.
   x,y is where she lies, w her length (logical px); flip faces her left. */
function drawBlingMap(c,x,y,w,mood,flip,moving){
  const A=PARTY_ART.bling, s=A&&A.stance, img=partyImg();
  c.globalAlpha=.28; c.fillStyle='#1a2810';
  c.beginPath(); c.ellipse(x,y,w*0.46,w*0.1,0,0,7); c.fill(); c.globalAlpha=1;
  let top=y-w*0.6;
  if(s&&img){
    const [sx,sy,sw,sh]=s.r, k=w/sw, wob=moving?Math.sin(G.t/110)*0.06:0;
    c.save(); c.translate(x,y); c.scale((flip?-1:1)*k*(1+wob),k*(1-wob)); c.imageSmoothingEnabled=true;
    c.drawImage(img,sx,sy,sw,sh,-s.ax,-s.ay,sw,sh); c.restore();
    top=y-s.ay*k;
  }
  if(mood) drawMood(c,x+(flip?-1:1)*w*0.22,top-8,mood);
}
/* a little emoji face (sad, unsure, happy), or Zzz for sleep */
function drawMood(c,x,y,mood){
  y+=Math.sin(G.t/380)*1.5;
  if(mood==='sleep'){
    c.save(); c.textAlign='center'; c.lineWidth=1.4; c.strokeStyle='#2a3050'; c.fillStyle='#eef2ff';
    for(let i=0;i<3;i++){ const p=(G.t/1500+i/3)%1, sz=5+i*2;
      c.globalAlpha=Math.sin(p*Math.PI); c.font='bold '+sz+'px '+FONT;
      const zx=x+p*9+i*3, zy=y-p*12;
      c.strokeText('z',zx,zy); c.fillText('z',zx,zy); }
    c.restore(); return;
  }
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.arc(x+0.6,y+1,6.6,0,7); c.fill();
  c.fillStyle='#ffd54a'; c.strokeStyle='#7a4a10'; c.lineWidth=0.9;
  c.beginPath(); c.arc(x,y,6.2,0,7); c.fill(); c.stroke();
  c.fillStyle='rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(x-2,y-3.2,2.4,1.2,-0.4,0,7); c.fill();
  c.fillStyle='#4a2a08';
  c.beginPath(); c.ellipse(x-2.1,y-1,0.9,1.2,0,0,7); c.fill();
  c.beginPath(); c.ellipse(x+2.1,y-1,0.9,1.2,0,0,7); c.fill();
  c.strokeStyle='#4a2a08'; c.lineWidth=1; c.lineCap='round'; c.beginPath();
  if(mood==='sad') c.arc(x,y+4.4,2.6,1.15*Math.PI,1.85*Math.PI);
  else if(mood==='happy') c.arc(x,y+0.8,2.8,0.15*Math.PI,0.85*Math.PI);
  else { c.moveTo(x-2.3,y+2.6); c.lineTo(x+2.3,y+2.6); }
  c.stroke(); c.lineCap='butt';
  if(mood==='sad'){ c.fillStyle='#7cc4f0'; c.beginPath(); c.ellipse(x+4.2,y+1.6,0.9,1.4,0,0,7); c.fill(); }
}
