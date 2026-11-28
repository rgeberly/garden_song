/* ================================================================
   FESTIVALS
   Holiday (the last day of each season's week) is a festival in town: bunting over the
   plaza, a booth (FEST_BOOTH) open FEST_OPEN to FEST_CLOSE, and a contest. Kaitlyn enters
   once; the host judges her entry against three townsfolk (their scores are rolled once
   for the day) and hands out prizes (FEST_PRIZES). G.fest (save key fs) keeps each
   placing by festival and year ('harvest1': {place, entry}), for ribbons later.
   FESTIVALS is all the wording and who takes part: the townsfolk are expected to change.
     entries(): what she could enter now ({type, key, name}); score(e): how good it is
     rhythm: the entry is a song played in the rhythm game (score from accuracy)
   ================================================================ */
const FEST_BOOTH={x:470,y:330}, FEST_OPEN=9*60, FEST_CLOSE=18*60;
const FEST_PRIZES=[500,250,120,40];                     /* 1st, 2nd, 3rd, and for taking part */
const FLOWERS=['daisy','violet','snowdrop','mtnlily','edelweiss','gentian','frostrose'];
const bagGoods=keys=>keys.filter(k=>GOODS[k]&&(G.goods[k]||0)>0).map(k=>({type:'good',key:k,name:GOODS[k].name}));
const bagCrops=keys=>keys.filter(k=>SPECIES[k]&&(G.crops[k]||0)>0).map(k=>({type:'crop',key:k,name:SPECIES[k].name}));
const FESTIVALS={
  spring:{id:'blossom',name:"Blossom Festival",contest:"Flower Show",host:"Rosa",icon:'#f6a8c8',
    intro:["Welcome to the Blossom Festival!","Enter your loveliest flower in the Flower Show. Wildflowers, summit blooms, anything that's blooming!"],
    none:"You'll need a flower to enter: wildflowers from the mountain, a summit bloom, or a sunflower from your garden.",
    entries:()=>bagGoods(FLOWERS).concat(bagCrops(['sunflower'])),
    score:e=>e.type==='crop'?SPECIES[e.key].value*1.1:GOODS[e.key].value*(GOODS[e.key].rare?1.2:1),
    rivals:[["Milo","a dandelion chain",8,14],["Mabel","a teacup rose",13,22],["Old Pete","his prize tulips",18,30]]},
  summer:{id:'derby',name:"Fishing Derby",contest:"Fishing Derby",host:"Mr. Hollis",icon:'#7ab8ff',
    intro:["Welcome to the Fishing Derby!","Biggest, finest fish wins. Show me what you've caught!"],
    none:"You'll need a fish to enter. Try the pond up the mountain trail.",
    entries:()=>bagGoods(Object.keys(GOODS).filter(k=>GOODS[k].kind==='fish')),
    score:e=>GOODS[e.key].value,
    rivals:[["Milo","a very proud minnow",6,12],["Gus","a big mullet",22,38],["Old Pete","a speckled trout",34,52]]},
  fall:{id:'harvest',name:"Harvest Fair",contest:"Harvest Fair",host:"Mabel",icon:'#e8702a',
    intro:["Welcome to the Harvest Fair!","Bring your finest crop for the judging. The judges are partial to a big pumpkin."],
    none:"You'll need a crop from your garden to enter.",
    entries:()=>bagCrops(Object.keys(SPECIES)),
    score:e=>SPECIES[e.key].value*(e.key==='pumpkin'?1.5:1)*(SPECIES[e.key].best==='fall'?1.15:1),
    rivals:[["Milo","a lumpy potato",18,36],["Gus","a bunch of muscadines",42,70],["Old Pete","a giant turnip",55,88]]},
  winter:{id:'recital',name:"Winter Recital",contest:"Winter Recital",host:"Rosa",icon:'#bfe0ff',rhythm:true,
    intro:["Welcome to the Winter Recital!","Play us a song on your flute. Any song you know!"],
    none:"You'll need to know a song to play.",
    entries:()=>practiceSongs().map(s=>({type:'song',key:s.key,name:s.name,kind:s.kind})),
    score:e=>Math.round((e.acc||0)*100)+(e.kind==='Song'?8:e.kind==='Pep Rally'?4:0),
    rivals:[["Milo","a kazoo solo",42,64],["Gus","a sea shanty",58,80],["Mabel","a carol, sung sweetly",70,90]]}};

const festYear=day=>Math.floor((day-1)/(DAYS_PER_SEASON*SEASONS.length))+1;
const festOn=(day=G.day)=>weekdayOf(day)==='Holiday';
const festNow=()=>festOn()?FESTIVALS[season()]:null;
const festKey=()=>festNow().id+festYear(G.day);
const festState=()=>G.fest||(G.fest={});
const festEntered=()=>!!festState()[festKey()];
const festOpen=()=>G.clock>=FEST_OPEN&&G.clock<FEST_CLOSE;
/* the festival on a day (the menu's calendar, the morning news) */
const festOf=day=>festOn(day)?FESTIVALS[seasonOf(day)]:null;
const nearBooth=(f=1)=>G.area==='town'&&!!festNow()&&Math.hypot(G.player.x-FEST_BOOTH.x,G.player.y-FEST_BOOTH.y-12)<30*f;
const boothSolid=(x,y)=>G.area==='town'&&!!festNow()&&Math.abs(x-FEST_BOOTH.x)<24&&y>FEST_BOOTH.y-8&&y<FEST_BOOTH.y+4;

/* the morning's news: a festival today, or tomorrow */
function festMorning(){
  const f=festOf(G.day), t=festOf(G.day+1);
  return f?"It's the "+f.name+" in town today!":t?"Tomorrow is the "+t.name+" in town.":"";
}
/* the townsfolk's scores, the same all day */
function rivalScores(F){
  let s=G.day*9301+49297; const rr=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
  return F.rivals.map(([who,entry,lo,hi])=>({who,entry,score:Math.round(lo+rr()*(hi-lo))}));
}

/* at the booth */
function boothTalk(){
  const F=festNow(), host=personNamed(F.host), line=t=>({say:'npc',who:host,text:t});
  if(festEntered()){ const P=festState()[festKey()];
    playStory([line(P.place===1?"Our champion! Congratulations again, Kaitlyn.":"Thanks for taking part this year, Kaitlyn! There's always next year.")]); return; }
  if(!festOpen()){ playStory([line(G.clock<FEST_OPEN?"We're still setting up! The "+F.contest+" opens at 9 AM.":"That's all for this year's "+F.name+". See you next year!")]); return; }
  const E=F.entries();
  if(!E.length){ playStory(F.intro.map(line).concat([line(F.none)])); return; }
  playStory(F.intro.map(line).concat([{run:()=>{ G.scene='world'; ask={idx:0,top:0,kind:'fest'}; G.scene='ask'; }}]));
}
const festChoices=()=>festNow().entries().map(e=>({id:'enter',name:e.name,e})).concat([{id:'no',name:"Not now"}]);
/* her entry: in it goes (a thing from the bag is given over), then the judging */
function festEnter(e){
  const F=festNow();
  if(F.rhythm){                                          /* the recital: play the song */
    startRhythm(null,{practice:true,free:true,notes:0,name:e.name,mp:0,song:e.key,cb:(acc,combo)=>{
      G.scene='world'; recordSong(e.key,acc,combo); e.acc=acc; festJudge(F,e,"playing "+e.name); }});
    return; }
  if(e.type==='crop'){ G.crops[e.key]--; if(G.crops[e.key]<=0) delete G.crops[e.key]; }
  else { G.goods[e.key]--; if(G.goods[e.key]<=0) delete G.goods[e.key]; }
  festJudge(F,e,"her "+e.name);
}
function festJudge(F,e,what){
  const me={who:"Kaitlyn",entry:what,score:F.score(e),me:true};
  const L=rivalScores(F).concat([me]).sort((a,b)=>b.score-a.score||(a.me?-1:1));   /* (a tie goes her way) */
  const place=L.indexOf(me)+1, prize=FEST_PRIZES[Math.min(place,4)-1];
  festState()[festKey()]={place,entry:e.name};
  const host=personNamed(F.host), line=t=>({say:'npc',who:host,text:t}), nm=x=>x.me?"Kaitlyn, "+(F.rhythm?x.entry:"with "+x.entry):x.who+", with "+x.entry;
  const steps=[line("Thank you, everyone! The judges have decided.")];
  steps.push(line("In third place... "+nm(L[2])+"!"));
  steps.push(line("Second place goes to "+nm(L[1])+"!"));
  steps.push(line("And the winner of this year's "+F.contest+" is... "+nm(L[0])+"!"));
  if(place>3) steps.push(line("Thank you for entering, Kaitlyn! Here's a little something for taking part."));
  steps.push({say:'kaitlyn',face:place===1?'kaitlyn-big-smile':place===2?'kaitlyn-grin':'kaitlyn-warm-smile',
    text:place===1?"I won?! Oh, wow!":place===2?"Second place! Not bad at all.":place===3?"Third! I'll take it.":"Next year, for sure."});
  steps.push({run:()=>{ G.coins+=prize; sfx(place===1?'level_up':'buy');
    say((place===1?"1st place":place===2?"2nd place":place===3?"3rd place":"Thanks for entering")+" at the "+F.name+"! +"+prize+"c"); autoSave(); }});
  G.scene='world'; playStory(steps);
}

/* ---------- how a festival day looks: bunting over the plaza, lanterns after dark, the booth ---------- */
const BUNTING=[[[225,300],[352,286],[480,300]],[[240,452],[362,470],[490,452]],[[225,300],[232,376],[240,452]],[[480,300],[488,376],[490,452]]];
const FLAG_COLS=['#e8433f','#f0c44a','#5aa8e8','#7ec850','#f6a8c8','#ffffff'];
function drawFestDecor(cam){
  if(G.area!=='town'||!festNow()) return;
  const s=placeKait(), night=1-daylight();
  b.save(); b.translate(-cam.x,-cam.y);
  BUNTING.forEach((pts,j)=>{
    const [a,m,z]=pts, q=t=>[(1-t)*(1-t)*a[0]+2*(1-t)*t*m[0]+t*t*z[0],(1-t)*(1-t)*a[1]+2*(1-t)*t*(m[1]+14)+t*t*z[1]-40*s];
    b.strokeStyle='rgba(60,40,20,.7)'; b.lineWidth=0.8; b.beginPath();
    for(let i=0;i<=20;i++){ const [x,y]=q(i/20); i?b.lineTo(x,y):b.moveTo(x,y); } b.stroke();
    for(let i=1;i<20;i++){ const [x,y]=q(i/20), sw=Math.sin(G.t/500+i+j)*0.8;
      b.fillStyle=FLAG_COLS[(i+j)%FLAG_COLS.length]; b.beginPath(); b.moveTo(x-3,y); b.lineTo(x+3,y); b.lineTo(x+sw,y+6); b.closePath(); b.fill();
      if(night>0.3&&i%4===0) glowAt(x,y+3,5,'#ffd890',0.55*night); } });
  b.restore();
}
function drawBooth(c,x,y,t){
  const F=festNow(), s=placeKait();
  c.save(); c.translate(x,y); c.scale(s,s);
  c.fillStyle='rgba(20,14,6,.3)'; c.beginPath(); c.ellipse(0,1,30,6,0,0,TAU); c.fill();
  c.fillStyle='#6b4524'; c.fillRect(-26,-46,3,46); c.fillRect(23,-46,3,46);             /* poles */
  c.fillStyle='#a8743e'; c.fillRect(-28,-16,56,16); c.fillStyle='#8a5a30'; c.fillRect(-28,-16,56,3);   /* counter */
  for(let i=0;i<7;i++){ c.fillStyle=i%2?'#ffffff':F.icon; c.beginPath();                    /* striped canopy */
    c.moveTo(-30+i*60/7,-46); c.lineTo(-30+(i+1)*60/7,-46); c.lineTo(-30+(i+1)*60/7,-40); c.quadraticCurveTo(-30+(i+0.5)*60/7,-35,-30+i*60/7,-40); c.closePath(); c.fill(); }
  c.fillStyle='#f4ecd8'; c.fillRect(-14,-31,28,10); c.fillStyle=F.icon; c.fillRect(-12,-29,24,6);   /* the sign */
  /* a prize ribbon pinned to the counter */
  c.fillStyle='#3a6ad8'; c.beginPath(); c.arc(0,-9,4,0,TAU); c.fill(); c.fillRect(-3,-7,2.5,6); c.fillRect(0.5,-7,2.5,6);
  c.fillStyle='#ffe08a'; c.beginPath(); c.arc(0,-9,1.6,0,TAU); c.fill();
  c.restore();
  if(!festEntered()&&festOpen()){ const by=y-58*s+Math.sin(t/250)*2;          /* come and enter */
    c.fillStyle='#ffe08a'; c.beginPath(); c.arc(x,by,6,0,TAU); c.fill();
    c.fillStyle='#5a3a10'; c.fillRect(x-1,by-4,2,5); c.fillRect(x-1,by+2,2,1.6); }
}
/* a little flag for the calendar */
function festFlag(c,x,y,r,col){
  c.save(); c.translate(x,y); c.strokeStyle='#e8e0d0'; c.lineWidth=r*0.18; c.beginPath(); c.moveTo(-r*0.5,r); c.lineTo(-r*0.5,-r); c.stroke();
  c.fillStyle=col; c.beginPath(); c.moveTo(-r*0.45,-r); c.lineTo(r*0.9,-r*0.55); c.lineTo(-r*0.45,-r*0.1); c.closePath(); c.fill(); c.restore();
}
/* the entry window (drawn by drawAsk) */
function drawFestAsk(V){
  const F=festNow();
  TS(F.contest,LW/2,ASK.y+32,28,WIN_TXT.title,'center',true);
  TS(F.rhythm?"Pick a song to play for the town.":"Pick your entry. It goes to the judges!",LW/2,ASK.y+56,16,WIN_TXT.body,'center');
  TS("1st: "+FEST_PRIZES[0]+"c  ·  2nd: "+FEST_PRIZES[1]+"c  ·  3rd: "+FEST_PRIZES[2]+"c",LW/2,ASK.y+75,14,WIN_TXT.note,'center');
  V.forEach((c,j)=>{ const y=ASK.y+ASK.top+j*askRow()+20;
    if(c.id!=='enter'){ TS(c.name,LW/2+12,y+9,22,WIN_TXT.title,'center',true); return; }
    const e=c.e, n=e.type==='crop'?G.crops[e.key]:e.type==='good'?G.goods[e.key]:null;
    TS(e.name,ASK.x+46,y+2,fitSize(e.name,20,ASK.w-90,true),WIN_TXT.title,'left',true);
    TS(n!=null?"x"+n:e.kind||"",ASK.x+46,y+19,14,WIN_TXT.mp,'left'); });
}
