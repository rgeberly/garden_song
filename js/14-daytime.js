/* ================================================================
   DAY CYCLE · SEASONS · SLEEP
   Half a real second is one game minute, and the clock only runs while
   she is out in the garden (the world scene, not indoors), so menus,
   songs and battles stop time.
   ================================================================ */
const WAKE_AT=6*60, EARLY_BED=22*60, MIDNIGHT=24*60;
const MS_PER_MINUTE=500, DAYS_PER_SEASON=10, SEASONS=['spring','summer','fall','winter'];
const SEASON_NAME={spring:'Spring',summer:'Summer',fall:'Fall',winter:'Winter'};
const isNight=()=>G.clock>=19.5*60;
const seasonOf=day=>SEASONS[Math.floor((day-1)/DAYS_PER_SEASON)%SEASONS.length];
const season=()=>seasonOf(G.day);

/* ---------- season maps: spring is the boot-time map, the rest load on demand ---------- */
const SEASON_IMG={spring:IMG_MAP};
function seasonMap(s){
  if(!SEASON_IMG[s]){ const im=new Image(); im.src=ASSET_MAPS[s]; SEASON_IMG[s]=im; }
  return SEASON_IMG[s];
}
/* fetch today's and the next season's paintings ahead of time */
function preloadSeasonMaps(){ seasonMap(season()); seasonMap(seasonOf(G.day+DAYS_PER_SEASON)); }
/* the painting to draw: today's season, or spring until it has arrived */
/* the season's painting, or nothing while it loads (black, rather than a flash of spring) */
function currentMap(){
  const im=seasonMap(season());
  return im.complete&&im.naturalWidth?im:null;
}

/* ---------- the clock ---------- */
function tickClock(dt){
  if(G.indoors) return;
  passTime(dt/MS_PER_MINUTE);
}
/* move the clock on (game minutes); at midnight she falls asleep */
function passTime(min){
  G.clock+=min;
  if(G.clock>=MIDNIGHT){ G.clock=MIDNIGHT; goToSleep(true); }
}
function clockText(){
  const mins=Math.floor(G.clock)%MIDNIGHT, h=Math.floor(mins/60), mm=mins%60;
  return {h:((h+11)%12)+1, mm:String(mm).padStart(2,'0'), ap:h<12?'AM':'PM'};
}
/* a cream tag in the bottom-right of the garden view, drawn at CK times its first size */
const CK=1.5, CLOCK={w:84*CK,h:27*CK,x:LW-84*CK-5};
const clockY=()=>VIEW_H-CLOCK.h-5;          /* bottom-right corner of the garden view */
function drawClockBack(){
  const {x,w,h}=CLOCK, y=clockY();
  b.fillStyle='rgba(20,14,8,.35)';
  b.beginPath(); b.roundRect(x+1,y+2,w,h,9*CK); b.fill();
  b.fillStyle='#2b1c12'; b.beginPath(); b.roundRect(x,y,w,h,9*CK); b.fill();
  b.fillStyle='#f3ead2'; b.beginPath(); b.roundRect(x+1.5,y+1.5,w-3,h-3,7.5*CK); b.fill();
  const hr=G.clock/60, cx=x+12*CK, cy=y+h/2;
  b.save(); b.translate(cx,cy); b.scale(CK,CK);
  if(hr>=SUNRISE&&hr<SUNSET){                        /* sun */
    b.strokeStyle='#e8a03a'; b.lineWidth=1.2;
    for(let i=0;i<8;i++){ const a=i*Math.PI/4;
      b.beginPath(); b.moveTo(Math.cos(a)*5.5,Math.sin(a)*5.5);
      b.lineTo(Math.cos(a)*7.5,Math.sin(a)*7.5); b.stroke(); }
    b.fillStyle='#f2c84b'; b.beginPath(); b.arc(0,0,4.2,0,7); b.fill();
  } else {                                            /* crescent moon */
    b.fillStyle='#7d8cc8'; b.beginPath(); b.arc(0,0,5.5,0,7); b.fill();
    b.fillStyle='#f3ead2'; b.beginPath(); b.arc(2.6,-1.8,4.6,0,7); b.fill();
  }
  b.restore();
}
function drawClockText(){
  const {x}=CLOCK, y=clockY(), t=clockText();
  // the colon blinks once a game minute
  const colon=Math.floor(G.clock*2)%2===0||G.scene!=='world'?':':' ';
  T(t.h+colon+t.mm,x+52*CK,y+14*CK,27*CK,'#3a2a1a','right',true);
  T(t.ap,x+54*CK,y+14*CK,17*CK,'#7a6a4a','left',true);
  T(SEASON_NAME[season()]+' · Day '+G.day,x+48*CK,y+24*CK,15*CK,'#8a7a5a','center');
}

/* ---------- sun, shadow and colour of the hour ---------- */
const SUNRISE=6, SUNSET=19.5, MAX_ELEV=62*Math.PI/180, GROUND_TILT=0.6, MAX_SHADOW=2.0;
/* the painted light suits shadows that swing east (morning) -> south (noon) -> west (evening) */
function sunAt(hour){
  const p=(hour-SUNRISE)/(SUNSET-SUNRISE), up=p>0&&p<1;
  const elev=up?MAX_ELEV*Math.sin(Math.PI*p):0, a=Math.PI*clamp(p,0,1);
  return {len:up?Math.min(MAX_SHADOW,1/Math.tan(Math.max(elev,0.05))):0,
          gx:Math.cos(a), gy:Math.sin(a),
          strength:up?Math.min(1,elev/(10*Math.PI/180)):0};   // fades in/out near the horizon
}
const SHADOW_RGB={spring:[16,32,12],summer:[16,32,12],fall:[34,24,10],winter:[28,40,82]}; // blue on snow
const TINT=[[5,'#26336e',.66],[6,'#ff9a6a',.38],[7.5,'#ffd6a8',.18],[10,'#ffffff',0],[15,'#ffffff',0],
            [17.5,'#ffd296',.18],[19,'#ff8a5a',.36],[20,'#6a5aa0',.5],[21,'#2c3a7a',.64],[22,'#1e2a62',.7]];
const hexRgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
function tintAt(hour){
  let i=0; while(i<TINT.length-2&&hour>TINT[i+1][0]) i++;
  const [h0,c0,a0]=TINT[i], [h1,c1,a1]=TINT[i+1];
  const t=clamp((hour-h0)/(h1-h0),0,1), A=hexRgb(c0), B=hexRgb(c1);
  return {rgb:A.map((v,k)=>Math.round(v+(B[k]-v)*t)), a:a0+(a1-a0)*t};
}
/* multiply the garden view by the colour of the hour (call inside the view clip) */
function tintView(c){
  const t=tintAt(G.clock/60);
  if(t.a<0.002) return;
  c.save(); c.globalCompositeOperation='multiply'; c.globalAlpha=t.a;
  c.fillStyle='rgb('+t.rgb.join(',')+')'; c.fillRect(0,0,LW,VIEW_H); c.restore();
}

/* Her shadow, made from her current frame: a soft patch under the boots plus the
   silhouette laid along the ground away from the sun. Scratch canvases hold the
   flat silhouette and a 1/3-size copy that softens its edges when scaled back up. */
const SIL=document.createElement('canvas'); SIL.width=AM.cw; SIL.height=AM.ch;
const SILG=SIL.getContext('2d');
const SOFT=document.createElement('canvas'); SOFT.width=Math.ceil(AM.cw/3); SOFT.height=Math.ceil(AM.ch/3);
const SOFTG=SOFT.getContext('2d');
function drawKaitlynShadow(c,cxL,footL,dir,frameT,moving,indoors){
  if(!animReady) return;
  const [r,g,bl]=SHADOW_RGB[season()], rgb=r+','+g+','+bl;
  const fx=cxL*SC, fy=footL*SC, s=sunAt(G.clock/60);
  c.save(); c.scale(1/SC,1/SC);
  /* contact patch, wider for side views */
  const side=(dir===2||dir===6)?1.25:(dir%2?1.12:1), rx=22*side, ry=8;
  c.save(); c.translate(fx,fy); c.scale(1,ry/rx);
  const grad=c.createRadialGradient(0,0,0,0,0,rx);
  grad.addColorStop(0,'rgba('+rgb+',.34)'); grad.addColorStop(.6,'rgba('+rgb+',.2)');
  grad.addColorStop(1,'rgba('+rgb+',0)');
  c.fillStyle=grad; c.beginPath(); c.arc(0,0,rx,0,7); c.fill(); c.restore();
  /* cast shadow: height runs along the shadow direction (ground y squashed for the
     top-down view), width across it, turned so her left and right stay on the same
     sides (gy>=0 all day, so (gy,-gx) never mirrors her); sprite y is negative
     above the feet */
  if(s.strength>0&&!indoors){           /* no sun indoors: just the patch under her */
    const f=kaitlynFrame(dir,frameT,moving);
    SILG.setTransform(1,0,0,1,0,0); SILG.globalCompositeOperation='source-over';
    SILG.clearRect(0,0,AM.cw,AM.ch);
    if(f.flip){ SILG.translate(AM.cw,0); SILG.scale(-1,1); }
    SILG.drawImage(IMG_ANIM,f.sx,f.sy,AM.cw,AM.ch,0,0,AM.cw,AM.ch);
    SILG.setTransform(1,0,0,1,0,0);
    SILG.globalCompositeOperation='source-in'; SILG.fillStyle='rgb('+rgb+')'; SILG.fillRect(0,0,AM.cw,AM.ch);
    SOFTG.clearRect(0,0,SOFT.width,SOFT.height); SOFTG.imageSmoothingEnabled=true;
    SOFTG.drawImage(SIL,0,0,SOFT.width,SOFT.height);
    const {gx,gy,len}=s;
    c.globalAlpha=0.30*s.strength; c.imageSmoothingEnabled=true;
    c.translate(fx,fy);
    c.transform(gy,-gx,-len*gx,-len*gy*GROUND_TILT,0,0);
    c.drawImage(SOFT,-AM.cw/2,-AM.foot,AM.cw,AM.ch);
    c.imageSmoothingEnabled=false;
  }
  c.restore();
}
/* The same kind of shadow for everything else in the garden (plants, yard decorations,
   the stand, pests, wildlife): draw(c) paints it with its feet at 0,0 in garden px, w is
   how wide its soft patch is. Its silhouette is laid along the ground away from the sun
   like hers. lift: how high it hovers; a flyer only gets a fainter patch on the ground. */
const GSH=document.createElement('canvas'), GSHG=GSH.getContext('2d'), GSH_W=180, GSH_H=180, GSH_FX=90, GSH_FY=170;
GSH.width=GSH_W; GSH.height=GSH_H;
function groundShadow(c,draw,x,y,w,lift){
  const [r,g,bl]=SHADOW_RGB[season()], rgb=r+','+g+','+bl, s=sunAt(G.clock/60);
  c.save(); c.translate(x,y); c.scale(1,0.36);
  const grad=c.createRadialGradient(0,0,0,0,0,w);
  grad.addColorStop(0,'rgba('+rgb+','+(lift?0.18:0.3)+')'); grad.addColorStop(1,'rgba('+rgb+',0)');
  c.fillStyle=grad; c.beginPath(); c.arc(0,0,w,0,7); c.fill(); c.restore();
  if(lift||!draw||s.strength<=0) return;
  GSHG.setTransform(1,0,0,1,0,0); GSHG.globalCompositeOperation='source-over'; GSHG.globalAlpha=1;
  GSHG.clearRect(0,0,GSH_W,GSH_H);
  GSHG.setTransform(1,0,0,1,GSH_FX,GSH_FY); draw(GSHG);
  GSHG.setTransform(1,0,0,1,0,0); GSHG.globalAlpha=1; GSHG.globalCompositeOperation='source-in';
  GSHG.fillStyle='rgb('+rgb+')'; GSHG.fillRect(0,0,GSH_W,GSH_H); GSHG.globalCompositeOperation='source-over';
  const {gx,gy,len}=s;
  c.save(); c.globalAlpha=0.28*s.strength; c.imageSmoothingEnabled=true; c.translate(x,y);
  c.transform(gy,-gx,-len*gx,-len*gy*GROUND_TILT,0,0);
  c.drawImage(GSH,-GSH_FX,-GSH_FY,GSH_W,GSH_H); c.restore();
}
/* 0 at night, 1 in full day: scales the drifting cloud shadows and sunlight wash */
const daylight=()=>sunAt(G.clock/60).strength;

/* ---------- going to bed ---------- */
/* Bed is allowed any time: sleep till morning, or (earlier in the day) a nap till noon or
   till 6 PM, or stay up. W/S choose, J/Space confirm, H/Esc (or tapping outside) cancels.
   The clock stays still while it is open. */
let ask=null;
function askSleep(){
  ask={idx:0}; padVec={x:0,y:0}; padId=null; btnHeld=false; G.scene='ask';
}
function sleepChoices(){
  const L=[{id:'night',name:"Sleep till morning"}];
  if(G.clock<12*60-30) L.push({id:'nap',name:"Nap till noon",to:12*60});
  if(G.clock<18*60-30) L.push({id:'nap',name:"Nap till 6 PM",to:18*60});
  L.push({id:'no',name:"Stay up"});
  return L;
}
const ASK={x:40,y:70,w:280,top:92,row:40};
const askH=()=>ASK.top+sleepChoices().length*ASK.row+10;
function askKey(k){
  const n=sleepChoices().length;
  if(isUp(k)||isLeft(k)) ask.idx=(ask.idx+n-1)%n;
  else if(isDown(k)||isRight(k)) ask.idx=(ask.idx+1)%n;
  else if(isOk(k)||k==='e') askAnswer(sleepChoices()[ask.idx]);
  else if(isBack(k)) askAnswer(null);
}
/* how far the window is moved down to sit in the middle of a taller garden view */
const askY=()=>Math.max(0,Math.round(VIEW_H/2-162));
function askTouch(x,y){
  y-=askY();
  const L=sleepChoices(), j=Math.floor((y-ASK.y-ASK.top)/ASK.row);
  if(x>ASK.x+16&&x<ASK.x+ASK.w-16&&j>=0&&j<L.length){ if(ask.idx===j) askAnswer(L[j]); else ask.idx=j; }
  else if(!(x>ASK.x&&x<ASK.x+ASK.w&&y>ASK.y&&y<ASK.y+askH())) askAnswer(null);
}
function askAnswer(c){ ask=null; G.scene='world';
  if(c&&c.id==='night') goToSleep(false);
  else if(c&&c.id==='nap') goToSleep(false,c.to); }
function drawAsk(){
  drawWorld();
  wipeBuf();
  b.globalAlpha=.45; px(b,0,0,LW,VIEW_H,'#0d1410'); b.globalAlpha=1;
  b.save(); b.translate(0,askY()); m.save(); m.translate(0,askY()*SC);
  const L=sleepChoices();
  panel(ASK.x,ASK.y,ASK.w,askH());
  L.forEach((c,i)=>{ const on=ask.idx===i, x=ASK.x+16, y=ASK.y+ASK.top+i*ASK.row, w=ASK.w-32, h=ASK.row-6;
    px(b,x,y,w,h,on?'#a8781e':'#2b1c12');
    px(b,x+2,y+2,w-4,h-4,c.id==='no'?'#e2d3ae':'#c8d8f0');
    if(on){ px(b,x+2,y+2,w-4,3,'#fff3c0'); fluteCursor(x+26,y+h/2); } });
  blit();
  const early=G.clock<=EARLY_BED, t=clockText();
  T("Time for bed?",LW/2,ASK.y+32,30,'#3a2a1a','center',true);
  T("It's "+t.h+":"+t.mm+" "+t.ap+".",LW/2,ASK.y+54,20,'#6a5a3a','center');
  T(early?"Asleep by 10 PM: a free coffee in the morning!":"A night's sleep: she'll wake at 6 AM.",LW/2,ASK.y+73,17,early?'#5a7a3a':'#7a6a4a','center');
  L.forEach((c,i)=>T(c.name,LW/2+12,ASK.y+ASK.top+i*ASK.row+23,22,'#3a2a1a','center',true));
  b.restore(); m.restore();
}
let sleep=null;
/* nap: the time to wake at the same day (a nap), instead of the next morning */
function goToSleep(midnight,nap){
  sleep={phase:midnight?'yawn':'out', t:0, early:!midnight&&!nap&&G.clock<=EARLY_BED, nap:nap||0};
  padVec={x:0,y:0}; padId=null; btnHeld=false;
  G.scene='sleep'; G.msgT=0;
}
/* somewhere she can stand in the garden, just below the front door */
function doorstep(){
  for(let dy=24;dy<90;dy+=3) if(!solidAt(HOUSE_DOOR.x,HOUSE_DOOR.y+dy+9)) return {x:HOUSE_DOOR.x,y:HOUSE_DOOR.y+dy};
  return {x:HOUSE_DOOR.x,y:HOUSE_DOOR.y+40};
}
function wakeUp(){
  const before=season();
  G.day++; G.clock=WAKE_AT; ripenPlants(); restartTrack('battle');   /* a new day's first fight starts its theme fresh */
  /* a night's sleep: everyone rested, and the pests have wandered off */
  G.party.forEach(id=>{ const M=member(id); M.hp=M.maxhp; M.mp=memberMaxMp(id); });
  G.pests=[];
  /* friends hurt in battle are back on their feet after HURT_DAYS, and rejoin if there's room */
  const back=[];
  for(const id in G.allies){ const A=G.allies[id];
    if(A.hurtUntil&&A.hurtUntil<=G.day){ A.hurtUntil=0; A.hp=A.maxhp; A.mp=memberMaxMp(id);
      if(G.party.length<PARTY_MAX&&!G.party.includes(id)) G.party.push(id); back.push(PARTY_INFO[id].name); } }
  G.area='garden'; G.indoors=true; G.player.x=HOUSE.wake.x; G.player.y=HOUSE.wake.y; G.player.dir=4;   /* up beside the bed */
  G.player.moving=false; G.player.walkT=0; G.swim=false;
  preloadSeasonMaps();
  sleep.say=season()!==before?SEASON_NAME[season()]+" is here!":"Good morning! Day "+G.day+".";
  if(sleep.early){ G.coffeeT=120000; sleep.say+="  Early to bed: free coffee!"; }
  if(back.length) sleep.say+="  "+back.join(" and ")+" is feeling better!";
}
/* a nap: the clock moves on, and everyone gets back half of what they're missing */
function napDone(){
  passTime(sleep.nap-G.clock);
  G.party.forEach(id=>{ const M=member(id); M.hp+=Math.ceil((M.maxhp-M.hp)/2); M.mp+=Math.ceil((memberMaxMp(id)-M.mp)/2); });
  const t=clockText(); sleep.say="What a nice nap! It's "+t.h+":"+t.mm+" "+t.ap+".";
}
const SLEEP_FADE=900, SLEEP_NIGHT=1700, YAWN_WAIT=4200;
function updateSleep(dt){
  sleep.t+=dt;
  if(sleep.phase==='yawn'&&sleep.t>YAWN_WAIT) sleepNext();
  else if(sleep.phase==='out'&&sleep.t>SLEEP_FADE) sleepNext();
  else if(sleep.phase==='night'&&sleep.t>SLEEP_NIGHT) sleepNext();
  else if(sleep.phase==='in'&&sleep.t>SLEEP_FADE) sleepNext();
}
function sleepNext(){
  const next={yawn:'out',out:'night',night:'in',in:null}[sleep.phase];
  if(next==='night'){ if(sleep.nap) napDone(); else wakeUp(); }    /* swap the day (or the hour) while the screen is dark */
  if(!next){ G.scene='world'; say(sleep.say); sleep=null; autoSave(); return; }
  sleep.phase=next; sleep.t=0;
}
/* a tap or key during the yawn skips straight to bed */
function sleepTap(){ if(sleep&&sleep.phase==='yawn') sleepNext(); }
function drawSleep(){
  const ph=sleep.phase;
  if(ph==='night'){
    m.setTransform(1,0,0,1,0,0); m.fillStyle='#0d1410'; m.fillRect(0,0,LW*SC,SCREEN_H*SC);
    const z='Zzz'.slice(0,1+Math.floor(sleep.t/350)%3);
    T(z,LW/2,SCREEN_H*0.44,48,'#c9d4f0','center',true);
    T(SEASON_NAME[season()]+' · Day '+G.day,LW/2,SCREEN_H*0.44+40,26,'#8a96b8','center');
    return;
  }
  drawWorld();
  if(ph==='yawn') drawYawn();
  const a=ph==='out'?sleep.t/SLEEP_FADE:ph==='in'?1-sleep.t/SLEEP_FADE:0;
  if(a>0){ m.setTransform(1,0,0,1,0,0); m.globalAlpha=clamp(a,0,1);
    m.fillStyle='#0d1410'; m.fillRect(0,0,LW*SC,SCREEN_H*SC); m.globalAlpha=1; }
}
/* her portrait and a sleepy line, over the bottom of the garden view */
function drawYawn(){
  const x=10, y=VIEW_H-124, w=LW-20, h=112;     /* along the bottom of the garden view */
  wipeBuf();
  b.globalAlpha=.35; px(b,0,0,LW,VIEW_H,'#0d1410'); b.globalAlpha=1;
  panel(x,y,w,h);
  px(b,x+9,y+9,86,h-18,'#e2d3ae');
  if(IMG_PT.complete&&IMG_PT.naturalWidth){
    const ph=h-22, pw=ph*IMG_PT.naturalWidth/IMG_PT.naturalHeight;
    b.save(); b.beginPath(); b.rect(x+9,y+9,86,h-18); b.clip(); b.imageSmoothingEnabled=true;
    b.drawImage(IMG_PT,x+9+(86-pw)/2,y+11,pw,ph); b.restore();
  }
  blit();
  T("Kaitlyn",x+108,y+28,22,'#a06a1a','left',true);
  T("*Yawn*",x+108,y+56,30,'#3a2a1a','left',true);
  T("Ohhhh I'm so sleepy!",x+108,y+82,27,'#3a2a1a','left');
  if(Math.floor(G.t/500)%2===0) T("tap to sleep",x+w-12,y+h-10,17,'#8a7a5a','right');
}
