/* ================================================================
   INSIDE THE HOUSE
   One room, painted at 512 x 768. Inside, G.player.x/y are her feet in
   painting px; the room fills the width of the view and scrolls up and
   down when the view is shorter than it. The clock stands still in here
   (G.indoors), she sleeps in the bed, and the doorway at the bottom
   leads back out to the garden.
   ================================================================ */
const HOUSE={w:512,h:768, door:{x:256,y:640}, wake:{x:280,y:262}, out:692};
const IMG_HOUSE=new Image(); let houseAsked=false;
function houseImg(){ if(!houseAsked){ houseAsked=true; IMG_HOUSE.src=ASSET_HOUSE; } return IMG_HOUSE; }
const houseK=()=>LW/HOUSE.w;                  /* logical px per painting px */
const HOUSE_KAIT=1.35;                        /* she's drawn this much larger inside, to suit the furniture */

/* where she can walk: the floorboards, minus the furniture (painting px, x0,y0,x1,y1) */
const HOUSE_FLOOR={x0:62,y0:196,x1:458,y1:662};
const HOUSE_BED=[132,100,258,300];
const HOUSE_SOLID=[
  [40,0,118,395],    /* shelves and desk along the left wall */
  [40,395,100,490],  /* potted plants under the window */
  [40,490,122,665],  /* writing desk and clutter */
  [95,598,165,665],  /* plants by the front wall */
  HOUSE_BED,
  [250,90,298,192],  /* nightstand */
  [298,40,452,238],  /* fireplace */
  [395,215,470,262], /* pots by the hearth */
  [362,245,470,458], /* counter and stove */
  [372,455,458,592], /* table and stool */
  [380,592,470,665], /* kettle and boxes on the green rug */
  [122,420,190,488], /* the big potted plant */
  [122,500,172,578], /* stool */
  [296,492,344,516], /* the music stand */
];
/* where the music stand stands (feet, painting px) */
const HOUSE_STAND={x:320,y:512};
/* the walls as a mask (maps/house_collision: black = blocked, for her feet), once loaded;
   until then the rectangles above */
let HOUSE_COL=null;
if(typeof HOUSE_MASK!=='undefined'&&HOUSE_MASK){ const im=new Image();
  im.onload=()=>{ const c=document.createElement('canvas'); c.width=HOUSE.w; c.height=HOUSE.h;
    const g=c.getContext('2d'); g.drawImage(im,0,0,HOUSE.w,HOUSE.h);
    const d=g.getImageData(0,0,HOUSE.w,HOUSE.h).data; HOUSE_COL=new Uint8Array(HOUSE.w*HOUSE.h);
    for(let i=0;i<HOUSE_COL.length;i++) HOUSE_COL[i]=d[i*4]>128?0:1; };
  im.src='assets/sprites/house_collision.png'; }
function houseSolid(x,y){
  if(tinyNestSolid(x,y)) return true;                      /* Tiny One's nest on the hearth */
  if(HOUSE_COL){ const xi=x|0, yi=y|0;
    return xi<0||yi<0||xi>=HOUSE.w||yi>=HOUSE.h||HOUSE_COL[yi*HOUSE.w+xi]===1; }
  const F=HOUSE_FLOOR;
  if(x<F.x0||x>F.x1||y<F.y0) return true;
  if(y>F.y1&&Math.abs(x-HOUSE.door.x)>28) return true;     /* the front wall, but for the doorway */
  if(y>HOUSE.out) return true;                              /* she goes out with A, not by walking */
  /* her feet are about 26 painting px across */
  return HOUSE_SOLID.some(r=>x>r[0]-13&&x<r[2]+13&&y>r[1]-4&&y<r[3]+4);
}
function nearBed(){ const P=G.player, [x0,y0,x1,y1]=HOUSE_BED;
  return Math.hypot(P.x-clamp(P.x,x0,x1),P.y-clamp(P.y,y0,y1))<28; }
/* by the way out: the house's entry/exit map (maps/house_transitions), or near the doorway */
const nearHouseDoor=()=>AREA_ZONE.house?areaZoneAt('house',G.player.x,G.player.y,12)==='garden'
  :G.player.y>604&&Math.abs(G.player.x-HOUSE.door.x)<44;

function enterHouse(){
  const P=G.player;
  G.indoors=true; G.swim=false; padVec={x:0,y:0};
  const z=zoneArrival('house','garden');
  P.x=z?z.x:HOUSE.door.x; P.y=z?z.y:HOUSE.door.y; P.dir=0; P.moving=false; P.walkT=0;
  houseImg();
}
function leaveHouse(){
  const P=G.player, z=zoneArrival('garden','house'), p=z?{x:z.x,y:z.y-9}:doorstep();
  G.indoors=false; P.x=p.x; P.y=p.y; P.dir=4; P.moving=false; P.walkT=0;
}
const nearStand=()=>Math.hypot(G.player.x-HOUSE_STAND.x,G.player.y-HOUSE_STAND.y-14)<46;
/* ---------- flute practice at the music stand ----------
   Once a day: the whole song, an hour of the day, and EXP worth about five fights
   with the pests about at her garden level, more the better she plays. */
/* The songs she can practice. Each one's recordings go in the art folder as
   rhythm/songs/practice_<file>_flute.wav and practice_<file>_backing.wav.
   xp: times the usual practice EXP · min: minutes of the day it takes ·
   cost: the price of its sheet music at Rosa's (0: she knows it from the start). */
const PRACTICE_SONGS=[
  {id:'croppies',name:"Grow Little Croppies",file:"Grow Little Croppies",xp:1,min:60,cost:0},
  {id:'lovelies',name:"Drink Up, Lovelies",file:"Drink Up, Lovelies",xp:0.4,min:20,cost:0},
  {id:'home',name:"Home Sweet Home",file:"Home Sweet Home",xp:1.5,min:90,cost:300},
  /* the Pep Rally songs, three in a row: Rally Cry, Tangleroot Reel, Clean Slate; and Safe
     and Sound, Hype Up, Grand Finale (and a last stretch without flute) */
  {id:'mouth',name:"Croppies In Your Mouth!",file:"Croppies In Your Mouth!",xp:1.2,min:60,cost:250},
  {id:'peprally',name:"Not in My Pep Rally!",file:"Not in My Pep Rally!",xp:1.2,min:60,cost:250},
];
const songKnown=s=>!s.cost||G.sheets.includes(s.id);
const knownSongs=()=>PRACTICE_SONGS.filter(songKnown);
function practiceXp(acc,song){
  const L=Object.values(PESTS).filter(P=>!P.boss&&P.min<=G.gardenLv), avg=L.reduce((a,P)=>a+P.xp,0)/L.length;
  return Math.round(5*avg*(0.3+acc*0.9)*((song&&song.xp)||1));
}
/* Song test: open the game with ?songtest on the end of its address, and the music stand
   lists every recorded song (SONG_DATA) to play any number of times, for no EXP or time.
   Autoplay hits every note, to hear how the notes line up with the recording. */
const SONG_TEST=/[?&]songtest\b/.test(location.search);
let songAuto=false;
function songTitle(key){
  if(key.startsWith('practice_')) return key.slice(9);
  if(SPECIES[key]) return SPECIES[key].name+" (crop)";
  const id=Object.keys(BATTLE_SONG).find(k=>BATTLE_SONG[k]===key), mv=id&&MOVES.find(m=>m.id===id);
  const f=FIELD.find(f=>f.id===key);
  return mv?mv.name+" (battle)":f?f.name+" (field)":key;
}
function testSong(key){
  startRhythm(null,{practice:true,test:true,notes:0,name:songTitle(key),mp:0,song:key,
    cb:acc=>{ G.scene='world'; say(songTitle(key)+": "+Math.round(acc*100)+"%"); }});
}
/* The music stand (askStand, in the bed's window) asks first how she'll play:
   for EXP (once a day, a full song from her sheet music; it takes its minutes of the
   day) or for practice (any song she knows, any number of times; no time passes, no
   rewards). Either way her best for each song is kept (G.lore.songs, by song key: best
   accuracy, best combo, times played), shown in Lore > Song Scores. */
function startPractice(song){
  if(G.daily.practice===G.day){ say("You've already played for EXP today. Your fingers need a rest!"); return; }
  const min=song.min||60, key='practice_'+song.file;
  startRhythm(null,{practice:true,notes:0,name:song.name,mp:0,song:key,cb:(acc,combo)=>{
    G.daily.practice=G.day; G.scene='world';
    const best=recordSong(key,acc,combo), xp=practiceXp(acc,song); addXp(xp); passTime(min);
    say(song.name+" ("+Math.round(acc*100)+"%): "+xpEach(xp)+"!"+(best?" A new best!":"")+titleNews()); autoSave(); }});
}
/* Every song with a recording, in the order Lore lists them: the full songs (sheet music),
   the Pep Rallies, then the crops' songs; known: she can practice it. */
function allSongs(){
  const L=[], has=k=>typeof SONG_DATA!=='undefined'&&!!SONG_DATA[k];
  PRACTICE_SONGS.forEach(s=>L.push({key:'practice_'+s.file,name:s.name,kind:"Song",pts:MASTERY_PTS.Song,known:songKnown(s),
    how:"Its sheet music is sold at Rosa's store in town."}));
  PEP_SONGS.forEach(s=>L.push({key:s.song,name:s.name,kind:"Pep Rally",pts:MASTERY_PTS['Pep Rally'],known:pepKnown()&&s.learn(),
    how:"A Pep Rally song still to learn."}));
  Object.keys(SPECIES).forEach(k=>L.push({key:k,name:SPECIES[k].name,kind:"Crop",pts:MASTERY_PTS.Crop,known:G.unlocked.includes(k),
    how:"A crop's song, learned along with its seeds."}));
  return L.filter(s=>has(s.key));
}
const practiceSongs=()=>allSongs().filter(s=>s.known);
/* practice: any song she knows, as often as she likes; just her score */
function playForPractice(s){
  startRhythm(null,{practice:true,free:true,notes:0,name:s.name,mp:0,song:s.key,cb:(acc,combo)=>{
    G.scene='world';
    const best=recordSong(s.key,acc,combo);
    say(s.name+" ("+Math.round(acc*100)+"%)"+(best?": a new best!":". Best: "+Math.round(songBest(s.key).acc*100)+"%")+titleNews()); autoSave(); }});
}
const songBest=key=>(G.lore.songs||{})[key];
/* Flute Mastery, to compare with friends: each song's best is worth up to its kind's
   points (the longer the song, the more), all added up */
const MASTERY_PTS={Song:500,'Pep Rally':200,Crop:100};
const songMastery=s=>{ const B=songBest(s.key); return B?Math.round(B.acc*s.pts):0; };
const fluteMastery=()=>allSongs().reduce((a,s)=>a+songMastery(s),0);
const masteryMax=()=>allSongs().reduce((a,s)=>a+s.pts,0);
/* titles along the way, by Flute Mastery (shown in Lore and on the share card) */
const MASTERY_TITLES=[[0,"Humble Hummer"],[150,"Backyard Busker"],[400,"Porch Piper"],[800,"Garden Troubadour"],
  [1300,"Meadow Minstrel"],[1900,"Garden Virtuoso"],[2600,"Harvest Maestro"],[3400,"Legend of the Grove"],
  [4200,"Maestro of the Meadow"],[5000,"Songbird Supreme"]];
function masteryTitle(m){
  if(m===undefined) m=fluteMastery();
  let i=0; while(i+1<MASTERY_TITLES.length&&m>=MASTERY_TITLES[i+1][0]) i++;
  return {i,name:MASTERY_TITLES[i][1],next:MASTERY_TITLES[i+1]||null};
}
/* note a song's score; true when it's her best yet */
function recordSong(id,acc,combo){
  const was=masteryTitle().i;
  const L=G.lore.songs||(G.lore.songs={}), o=L[id]||(L[id]={acc:0,combo:0,n:0}), best=acc>o.acc;
  o.n++; o.acc=Math.max(o.acc,acc); o.combo=Math.max(o.combo,combo||0);
  const T=masteryTitle(); if(T.i>was) G.titleUp=T.name;
  return best;
}
/* after a song's score: a new title, if it earned one */
function titleNews(){ if(!G.titleUp) return ""; const t=G.titleUp; G.titleUp=null; sfx('level_up'); return "  New title: "+t+"!"; }
/* a little wooden music stand with a page of music on it */
function drawStand(x,y,k){
  const s=k*2.4;
  /* its picture (shop items/Music Stand), when there is one */
  if(typeof SHOP_ART!=='undefined'&&SHOP_ART['music stand']){
    /* a soft shadow on the floor under its legs (indoors, like hers: no sun to cast one) */
    b.save(); b.translate(x,y); b.scale(1,0.32);
    const g=b.createRadialGradient(0,0,0,0,0,15*s); g.addColorStop(0,'rgba(20,12,4,.42)'); g.addColorStop(0.6,'rgba(20,12,4,.22)'); g.addColorStop(1,'rgba(20,12,4,0)');
    b.fillStyle=g; b.beginPath(); b.arc(0,0,15*s,0,7); b.fill(); b.restore();
    if(drawShopPic('music stand',x,y-18*s,28*s,38*s)) return; }
  b.fillStyle='rgba(20,12,4,.3)'; b.beginPath(); b.ellipse(x,y,9*s,3*s,0,0,7); b.fill();
  b.strokeStyle='#5a3a1e'; b.lineWidth=1.6*s;
  b.beginPath(); b.moveTo(x,y-20*s); b.lineTo(x,y); b.moveTo(x-7*s,y); b.lineTo(x,y-6*s); b.lineTo(x+7*s,y); b.stroke();
  b.fillStyle='#6b4524'; b.fillRect(x-11*s,y-33*s,22*s,14*s);
  b.fillStyle='#f6f0dc'; b.fillRect(x-9.5*s,y-32*s,19*s,11.5*s);
  b.fillStyle='#3a2a1a'; for(let i=0;i<4;i++) b.fillRect(x-8.5*s,y-30*s+i*2.6*s,17*s,0.4*s);
  b.beginPath(); b.arc(x-4*s,y-27*s,0.9*s,0,7); b.arc(x+2*s,y-25*s,0.9*s,0,7); b.arc(x+5*s,y-28*s,0.9*s,0,7); b.fill();
}
function houseInteract(){
  if(nearIvy()){ talkIvy(); return; }
  if(nearTinyNest()){ tinyInteract(); return; }
  const fr=nearFriend(); if(fr){ talkFriend(fr); return; }       /* Tituba and Tex at home */
  if(nearStand()){ askStand(); return; }
  if(nearBed()){ askSleep(); return; }
  if(nearHouseDoor()){ travel(leaveHouse,true); return; }
  say("Home sweet home.");
}
function updateHouse(dt){
  /* outside's pace on screen, stretched with her size so her feet don't slide */
  walk(dt,WALK_SPEED*WORLD_ZOOM*HOUSE_KAIT/houseK(),houseSolid);
  updateTiny(dt);
  if(G.msgT>0) G.msgT-=dt;
}
/* the slice of the painting in view: top is the gap above it when the view is taller */
function houseCam(){
  const k=houseK(), vh=VIEW_H/k;
  return {y:clamp(G.player.y-vh/2-10,0,Math.max(0,HOUSE.h-vh)), top:Math.max(0,(VIEW_H-HOUSE.h*k)/2)};
}
function drawHouse(){
  const k=houseK(), cam=houseCam(), P=G.player, im=houseImg();
  b.save(); b.beginPath(); b.rect(0,0,LW,VIEW_H); b.clip();
  px(b,0,0,LW,VIEW_H,'#0f1a14');
  if(im.complete&&im.naturalWidth){ b.imageSmoothingEnabled=true;
    b.drawImage(im,0,cam.top-cam.y*k,LW,HOUSE.h*k); }
  const sx=P.x*k, sy=cam.top+(P.y-cam.y)*k;              /* her feet on screen */
  const kait=()=>{ b.save();
    b.translate(sx,sy); b.scale(HOUSE_KAIT,HOUSE_KAIT); b.translate(-sx,-sy);   /* larger, around her feet */
    b.imageSmoothingEnabled=true;
    drawKaitlynShadow(b,sx,sy,P.dir,P.animT||0,P.moving,true);
    drawKaitlyn(b,sx,sy,P.dir,P.animT||0,false,P.moving);
    b.restore(); };
  /* Ivy, when she's in (recovering on the rug, or asleep by the bed), in front or behind */
  /* the music stand, Ivy when she's in, and Kaitlyn, back to front */
  const ents=[{y:P.y,f:kait},{y:HOUSE_STAND.y,f:()=>drawStand(HOUSE_STAND.x*k,cam.top+(HOUSE_STAND.y-cam.y)*k,k)}];
  const bl=ivyHere();
  if(bl&&bl.inside) ents.push({y:bl.y,f:()=>drawIvyMap(b,bl.x*k,cam.top+(bl.y-cam.y)*k,IVY_W*HOUSE_KAIT,bl.mood,false,false)});
  const tn=tinyHouseEnt(k,cam); if(tn) ents.push(tn);
  ents.push(...friendHouseEnts(k,cam));
  ents.sort((a,z)=>a.y-z.y).forEach(e=>e.f());
  const fr=frontImg('house'); if(fr) b.drawImage(fr,0,cam.top-cam.y*k,LW,HOUSE.h*k);   /* what she walks behind */
  hdField(true,0,cam.y*k-cam.top);                     /* the HD look (Settings > Graphics) */
  b.restore();
  drawClockBack(); drawBuffsBack();
  blit();
  drawClockText(); drawBuffsText();
  const pal=nearFriend(PROMPT_REACH);
  const label=nearIvy(PROMPT_REACH)?ivyLabel():nearTinyNest(PROMPT_REACH*1.4)?tinyLabel():pal?friendLabel(pal):nearStand()?"Play flute"
    :nearBed()?"Sleep":nearHouseDoor()?"Go outside":null;
  if(label&&G.scene==='world') drawPrompt(label,sx,sy-74*HOUSE_KAIT);
  drawHUD();
}

/* ---------- the share card (Lore > Song Scores > Share my Flute Mastery) ----------
   A 1080 x 1350 picture: the logo, Kaitlyn, her Flute Mastery and title, a few numbers and
   her three best songs. Made when asked (makeShareCard), then shared through the phone's
   share sheet where there is one, or saved as a file. */
const loadImg=src=>new Promise(r=>{ if(!src){ r(null); return; } const im=new Image(); im.onload=()=>r(im); im.onerror=()=>r(null); im.src=src; });
function shareFace(){
  const tier=masteryTitle().i, want=tier>=6?'kaitlyn-big-smile':tier>=3?'kaitlyn-grin':'kaitlyn-warm-smile';
  return typeof PARTY_PORTRAITS!=='undefined'&&PARTY_PORTRAITS.includes(want)?'assets/sprites/portrait_'+want+'.png':IMG_PT.src;
}
async function makeShareCard(){
  const W=1080, H=1350, cv=document.createElement('canvas'); cv.width=W; cv.height=H; const c=cv.getContext('2d');
  const [face,logo]=await Promise.all([loadImg(shareFace()),typeof TITLE_LOGO!=='undefined'&&TITLE_LOGO?loadImg('assets/sprites/logo.png'):null]);
  const F=(sz,bold)=>(bold?'bold ':'')+sz+'px '+FONT;
  const txt=(t,x,y,sz,col,align,bold,shadow)=>{ c.font=F(sz,bold); c.textAlign=align||'left'; c.fillStyle=col;
    if(shadow){ c.save(); c.shadowColor='rgba(0,0,0,.55)'; c.shadowBlur=sz*0.18; c.shadowOffsetY=sz*0.06; c.fillText(t,x,y); c.restore(); } else c.fillText(t,x,y); };
  const fit=(t,sz,w,bold)=>{ c.font=F(sz,bold); while(sz>14&&c.measureText(t).width>w){ sz--; c.font=F(sz,bold); } return sz; };
  /* a night-blue card with a white rim, like the game's windows */
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2a3f8f'); g.addColorStop(0.55,'#16225c'); g.addColorStop(1,'#0a1030');
  c.fillStyle=g; c.fillRect(0,0,W,H);
  /* sparkles and music notes, the same every time */
  let sd=7; const rn=()=>((sd=(sd*16807)%2147483647)/2147483647);
  for(let i=0;i<70;i++){ const x=rn()*W, y=rn()*H*0.8, r=0.8+rn()*2.2; c.fillStyle='rgba(255,255,255,'+(0.15+rn()*0.5)+')'; c.beginPath(); c.arc(x,y,r,0,TAU); c.fill(); }
  c.font=F(54,true); for(let i=0;i<12;i++){ c.fillStyle='rgba(200,215,255,'+(0.06+rn()*0.08)+')'; c.fillText(rn()<0.5?'♪':'♫',rn()*W,140+rn()*H*0.75); }
  /* vines along the bottom, with leaves and a few flowers */
  c.save(); c.strokeStyle='#3f8a3a'; c.lineWidth=7; c.lineCap='round';
  for(const off of [0,1]){ c.beginPath(); for(let x=-20;x<=W+20;x+=10){ const y=H-38-off*18+Math.sin(x/90+off*2)*12; x<0?c.moveTo(x,y):c.lineTo(x,y); } c.stroke(); }
  for(let x=30;x<W;x+=70){ const y=H-38+Math.sin(x/90)*12, a=Math.sin(x)*0.8; c.fillStyle=x%140?'#5fae4a':'#4a9a3c';
    c.beginPath(); c.ellipse(x,y-12,20,9,a-0.6,0,TAU); c.fill(); }
  [[120,'#f6a8c8'],[400,'#ffe08a'],[700,'#f6a8c8'],[960,'#bfe0ff']].forEach(([x,col])=>{ const y=H-58+Math.sin(x/90)*12;
    c.fillStyle=col; for(let i=0;i<5;i++){ const a=i*TAU/5; c.beginPath(); c.arc(x+Math.cos(a)*10,y+Math.sin(a)*10,8,0,TAU); c.fill(); }
    c.fillStyle='#ffd04a'; c.beginPath(); c.arc(x,y,6,0,TAU); c.fill(); });
  c.restore();
  c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=8; c.beginPath(); c.roundRect(14,14,W-28,H-28,40); c.stroke();
  /* the logo, or the name */
  if(logo){ const lh=Math.min(230,logo.height*2), lw=lh*logo.width/logo.height; c.drawImage(logo,(W-lw)/2,36,lw,lh); }
  else txt("Garden Song",W/2,150,92,'#ffe08a','center',true,true);
  /* Kaitlyn, in a warm glow */
  const cx=290, cy=690, gl=c.createRadialGradient(cx,cy,20,cx,cy,330); gl.addColorStop(0,'rgba(255,224,138,.35)'); gl.addColorStop(1,'rgba(255,224,138,0)');
  c.fillStyle=gl; c.fillRect(cx-340,cy-340,680,680);
  if(face){ const s=Math.min(480/face.width,610/face.height), fw=face.width*s, fh=face.height*s;
    c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high'; c.drawImage(face,cx-fw/2,985-fh,fw,fh); }
  /* her Flute Mastery and title */
  const m=fluteMastery(), T=masteryTitle(m), x0=560, x1=W-60;
  txt("FLUTE MASTERY",(x0+x1)/2,330,38,'#aab6e8','center',true);
  txt(m.toLocaleString(),(x0+x1)/2,460,fit(m.toLocaleString(),130,x1-x0,true),'#ffe08a','center',true,true);
  txt("of "+masteryMax().toLocaleString(),(x0+x1)/2,515,34,'#c8d4ff','center');
  const rg=c.createLinearGradient(0,560,0,650); rg.addColorStop(0,'#ffe9a8'); rg.addColorStop(1,'#e8a03a');
  c.fillStyle=rg; c.beginPath(); c.roundRect(x0,560,x1-x0,90,45); c.fill();
  txt(T.name,(x0+x1)/2,620,fit(T.name,44,x1-x0-40,true),'#3a2208','center',true);
  txt(T.next?"Next: "+T.next[1]+" at "+T.next[0].toLocaleString():"The highest title of all!",(x0+x1)/2,700,fit(T.next?"Next: "+T.next[1]+" at "+T.next[0].toLocaleString():"x",28,x1-x0,false),'#c8d4ff','center');
  /* a few numbers */
  const L=allSongs(), played=L.filter(s=>songBest(s.key)), ranksS=played.filter(s=>songBest(s.key).acc>0.93).length,
        combo=played.reduce((a,s)=>Math.max(a,songBest(s.key).combo),0);
  [["Songs played",played.length+" / "+L.length],["S ranks",String(ranksS)],["Best combo",String(combo)]].forEach(([k,v],i)=>{
    const y=790+i*62; c.fillStyle='rgba(10,15,42,.45)'; c.beginPath(); c.roundRect(x0,y-42,x1-x0,54,14); c.fill();
    txt(k,x0+22,y-6,30,'#aab6e8'); txt(v,x1-22,y-4,34,'#f4f6ff','right',true); });
  /* her three best songs */
  txt("Best songs",70,1040,38,'#ffe08a','left',true,true);
  const top=played.slice().sort((a,z)=>songBest(z.key).acc-songBest(a.key).acc||z.pts-a.pts).slice(0,3);
  if(!top.length) txt("None yet: play at the music stand at home!",70,1100,30,'#c8d4ff');
  top.forEach((s,i)=>{ const y=1100+i*62, B=songBest(s.key), r=accRank(B.acc);
    c.fillStyle='rgba(10,15,42,.5)'; c.beginPath(); c.roundRect(60,y-44,W-120,56,14); c.fill();
    txt(s.name,84,y-6,fit(s.name,32,W-460,true),'#f4f6ff','left',true);
    txt(s.kind,W-330,y-8,24,'#8a94c4','right');
    txt(Math.round(B.acc*100)+"%",W-170,y-6,34,'#ffe08a','right',true);
    txt(r,W-96,y-4,40,r==='S'?'#ffe08a':'#c8d4ff','center',true,true); });
  /* where to play */
  const site=(location.host+location.pathname).replace(/index\.html$/,'').replace(/\/$/,'');
  txt("Play Garden Song at "+site,W/2,1262,24,'rgba(220,228,255,.8)','center');
  const blob=await new Promise(r=>cv.toBlob(r,'image/png'));
  const file=blob&&typeof File!=='undefined'?new File([blob],'garden-song-flute-mastery.png',{type:'image/png'}):null;
  return {cv,blob,file,text:"My Flute Mastery in Garden Song: "+m.toLocaleString()+" ("+T.name+")"};
}
const canShareCard=S=>!!(S&&S.file&&navigator.canShare&&navigator.canShare({files:[S.file]}));
/* share it (the phone's share sheet), or save the picture where there's no sheet */
function shareCard(){
  const S=sys&&sys.share; if(!S||S.busy||!S.blob) return;
  if(canShareCard(S)){
    navigator.share({files:[S.file],title:"Garden Song",text:S.text}).then(()=>{ S.msg="Shared!"; })
      .catch(e=>{ if(!e||e.name!=='AbortError'){ saveCard(S); } });
    return; }
  saveCard(S);
}
function saveCard(S){
  const a=document.createElement('a'); a.href=URL.createObjectURL(S.blob); a.download='garden-song-flute-mastery.png';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  S.msg="Saved as garden-song-flute-mastery.png"; sfx('menu_confirm');
}
function openShareCard(){
  sys.share={busy:true}; sfx('menu_confirm');
  makeShareCard().then(o=>{ if(sys&&sys.share) Object.assign(sys.share,o,{busy:false}); })
    .catch(()=>{ if(sys&&sys.share) sys.share={busy:false,msg:"Couldn't make the picture."}; });
}
/* the card over the menu, with Share (or Save) and Close */
const SHARE_BTN=()=>{ const y=BAND_BOT()-52; return {go:{x:LW/2-150,y,w:140,h:40},close:{x:LW/2+10,y,w:140,h:40}}; };
function drawShareCard(){
  const S=sys.share, T0=BAND_TOP(), T1=BAND_BOT(), Bt=SHARE_BTN();
  b.fillStyle='rgba(4,6,20,.88)'; b.fillRect(0,T0,LW,T1-T0);
  const ch=T1-T0-80, cw=ch*0.8, x=(LW-cw)/2, y=T0+14;
  if(S.cv){ b.save(); b.imageSmoothingEnabled=true; b.imageSmoothingQuality='high'; b.drawImage(S.cv,x,y,cw,ch); b.restore(); }
  menuRow(Bt.go.x,Bt.go.y,Bt.go.w,Bt.go.h,true); menuRow(Bt.close.x,Bt.close.y,Bt.close.w,Bt.close.h,false);
  blit();
  if(!S.cv) TS(S.msg||"Making the picture...",LW/2,y+ch/2,18,'#c8d4ff','center');
  TS(canShareCard(S)?"Share":"Save picture",Bt.go.x+Bt.go.w/2,Bt.go.y+26,19,WIN_TXT.title,'center',true);
  TS("Close",Bt.close.x+Bt.close.w/2,Bt.close.y+26,19,WIN_TXT.title,'center',true);
  if(S.msg&&S.cv) TS(S.msg,LW/2,Bt.go.y-8,14,'#ffe08a','center');
}
function shareKey(k){ if(isOk(k)) shareCard(); else if(isBack(k)){ sys.share=null; sfx('menu_cancel'); } }
function shareTouch(x,y){
  const Bt=SHARE_BTN(), inB=R=>x>R.x&&x<R.x+R.w&&y>R.y&&y<R.y+R.h;
  if(inB(Bt.go)) shareCard(); else if(inB(Bt.close)){ sys.share=null; sfx('menu_cancel'); }
}
