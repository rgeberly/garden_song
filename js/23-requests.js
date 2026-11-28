/* ================================================================
   THE REQUEST BOARD
   A notice board on the town plaza (BOARD) where the townsfolk pin up little jobs: bring
   so many of something (a crop, a fish, something foraged or a pest's find) for coins and
   sometimes a small gift. Up to REQ_MAX at a time; each morning one more goes up if
   there's room, and one left REQ_DAYS days comes down. Each asks only for what she could
   get now: crops she's unlocked, forage and fish in season, finds from pests she's beaten.
   Handing one in is done at the board (the asker thanks her in the talk box).
   G.req (save key rq): {list:[{who,type,key,n,coins,gift,posted,until,text}], seen, done:{name:n}}
   ================================================================ */
const BOARD={x:300,y:352}, REQ_MAX=3, REQ_DAYS=6;
/* who asks for what: crops, goods (by key), or kinds of goods; their way of putting it
   (n and the item's name fill in); what they might add as a gift */
const REQUESTERS={
  "Mabel":     {crops:['strawberry','blueberry','pumpkin','melon','satsuma','carrot','beet'], goods:['wildberry','raspberry','chestnut','winterberry','royaljelly'],
                asks:["Baking day! Could you bring me {what}?","My regulars keep asking for pie. I'd need {what}.","I'm short for the breakfast rush. Could you spare {what}?"],
                thanks:["Oh, these are perfect! The café will smell wonderful.","You're a treasure, dear. Here, for your trouble."], gift:['bun','coffee','tea']},
  "Mr. Hollis":{kinds:['fish'],
                asks:["A customer wants a catch mounted on the wall. Could you bring me {what}?","Need {what} for a bait study. Don't ask.","Bet you can't land {what}. Prove me wrong."],
                thanks:["Now that's a fine catch. You've got the knack.","Ha! Well done. Here's what I owe you."]},
  "Juniper":   {kinds:['drop'], goods:['lostring','pearl','button','irishell'],
                asks:["A collector's asking for {what}. We'll split the money!","I'll take {what}, good price.","Shelf's looking bare. Could you find {what}?"],
                thanks:["Ooh, these'll sell in a heartbeat. Pleasure doing business!","Perfect condition. Well, close enough!"]},
  "Old Pete":  {crops:['tomato','collards','radish','beet','carrot','squash'], goods:['chanterelle','porcini','mint','chestnut','pinecone'],
                asks:["Got a hankering. {what} would do me.","My knees won't let me fetch things anymore. Could you bring {what}, if you're passing?","Making my famous stew. Need {what}."],
                thanks:["Much obliged. Reminds me of my garden, years back.","Bless you. Here, take this. I insist."], gift:['tea']},
  "Milo":      {goods:['dungball','shellshard','blackfeather','gullfeather','bristle','pinecone','daisy','minnow','turkeyfeather'],
                asks:["I'm starting a collection! Can you find {what}?","Mom says it's gross. I need {what}. For science.","Bet you can't find {what}!"],
                thanks:["WHOA. These are SO cool. Thanks!!","Best. Day. Ever! Here, you can have my allowance."], gift:['bun']},
  "Rosa":      {goods:['gullfeather','blackfeather','owlfeather','turkeyfeather','cocoon','violet','snowdrop','daisy'],
                asks:["I'm making something pretty for the shop. {what}, please?","An instrument maker wants {what}. Could you help?","For a window display, I'd love {what}!"],
                thanks:["Lovely! These will look beautiful in the shop.","Thank you! Come by and hear the new pieces sometime."]},
  "Gus":       {crops:['muscadine','lemongrass','satsuma','strawberry'], goods:['mint','winterberry','royaljelly','honeycomb'],
                asks:["New drink on the menu. Needs {what}.","The Toad's running dry. {what} would save my night.","Brewing something special. {what}, friend?"],
                thanks:["Ha! You're a lifesaver. First round's on me.","Perfect. Come by after six and try it."], gift:['cider','toddy']}};

const reqState=()=>G.req||(G.req={list:[],seen:0,done:{}});
/* someone in town (or in a shop) by name, for their picture in the talk box */
function personNamed(n){ for(const k in PLACES){ const p=(PLACES[k].people||[]).find(q=>q.name===n); if(p) return p; } return {name:n}; }
const reqName=r=>r.type==='crop'?SPECIES[r.key].name:GOODS[r.key].name;
/* "a Pumpkin", "3 Pumpkins", "2 Rainbow Trout", "a jar of Royal Jelly", "3 tufts of Wolf Fur" */
const MEASURE={mint:'sprig',royaljelly:'jar',ecto:'glob',wolffur:'tuft',bearfur:'tuft',goathair:'tuft',puffball:'pouch',honeycomb:'piece'};
const SAME_PLURAL=['Trout','Perch','Bass','Catfish','Shad','Mullet','Flounder','Salmon','Tarpon','Fry','Porcini','Koi'];
function plural(name){
  if(/[^u]s$/.test(name)||SAME_PLURAL.some(w=>name.endsWith(w))) return name;
  if(/[^aeiou]y$/.test(name)) return name.slice(0,-1)+'ies';
  if(/(ch|sh|x)$/.test(name)||name.endsWith('Octopus')) return name+'es';
  return name+'s';
}
const aOrAn=w=>(/^([aeiou]|heir|hour|hon)/i.test(w)?'an ':'a ')+w;
function howMany(r,n){
  if(n===undefined) n=r.n;
  const nm=reqName(r), m=MEASURE[r.key];
  if(m) return (n===1?aOrAn(m):n+' '+m+'s')+' of '+nm;
  if(n===1) return /[^u]s$/.test(nm)?'some '+nm:aOrAn(nm);      /* (Collard Greens: some; an Octopus) */
  return n+' '+plural(nm);
}
const reqValue=r=>r.type==='crop'?SPECIES[r.key].value:GOODS[r.key].value;
const reqHave=r=>r.type==='crop'?(G.crops[r.key]||0):(G.goods[r.key]||0);
/* what she could get her hands on now, of what someone wants */
function reqOptions(name){
  const W=REQUESTERS[name], L=[], s=season();
  (W.crops||[]).forEach(k=>{ if(SPECIES[k]&&G.unlocked.includes(k)) L.push({type:'crop',key:k}); });
  const goodOk=k=>{ const g=GOODS[k]; if(!g||!g.value) return false;
    if(g.kind==='forage') return !g.rare&&g.season===s;
    if(g.kind==='fish') return s!=='winter'&&(!g.seasons||g.seasons.includes(s));      /* (the pond's frozen in winter) */
    if(g.kind==='drop') return Object.keys(PEST_DROPS).some(p=>PEST_DROPS[p][0]===k&&knowBeast(p))||(G.goods[k]>0);
    return false; };
  (W.goods||[]).forEach(k=>{ if(goodOk(k)) L.push({type:'good',key:k}); });
  (W.kinds||[]).forEach(kind=>Object.keys(GOODS).forEach(k=>{ if(GOODS[k].kind===kind&&goodOk(k)&&GOODS[k].value<120&&!L.some(o=>o.key===k)) L.push({type:'good',key:k}); }));
  return L.filter(o=>!reqState().list.some(r=>r.key===o.key));
}
/* a new request from someone who hasn't one up already */
function newRequest(){
  const S=reqState(), names=Object.keys(REQUESTERS).filter(n=>!S.list.some(r=>r.who===n));
  for(let tries=0;tries<10&&names.length;tries++){
    const who=names.splice(ri(0,names.length-1),1)[0], O=reqOptions(who); if(!O.length) continue;
    const o=O[ri(0,O.length-1)], v=o.type==='crop'?SPECIES[o.key].value:GOODS[o.key].value;
    const n=v<12?ri(3,5):v<30?ri(2,4):v<60?ri(1,3):1;
    const W=REQUESTERS[who], r={who,type:o.type,key:o.key,n,posted:G.day,until:G.day+REQ_DAYS};
    r.coins=Math.round((v*n*1.7+25)/5)*5;
    if(W.gift&&Math.random()<0.5) r.gift=W.gift[ri(0,W.gift.length-1)];
    const t=W.asks[ri(0,W.asks.length-1)].replace('{what}',howMany(r));
    r.text=(t.charAt(0).toUpperCase()+t.slice(1)).replace(/([.!?] )([a-z])/g,(m,p,c)=>p+c.toUpperCase());   /* (a sentence that starts with it) */
    S.list.push(r); return r; }
  return null;
}
/* the morning: old requests come down, a new one goes up if there's room */
function boardMorning(){
  const S=reqState(); S.list=S.list.filter(r=>r.until>G.day);
  if(S.list.length<REQ_MAX) return !!newRequest();
  return false;
}
/* a first look at the board: it's never empty */
function boardFill(){ const S=reqState(); S.list=S.list.filter(r=>r.until>G.day); while(S.list.length<2&&newRequest()); }
const boardNew=()=>{ const S=reqState(); return !S.seen||S.list.some(r=>r.posted>S.seen); };   /* (never read yet counts too) */
const nearBoard=(f=1)=>G.area==='town'&&Math.hypot(G.player.x-BOARD.x,G.player.y-BOARD.y-14)<26*f;
const boardSolid=(x,y)=>G.area==='town'&&Math.abs(x-BOARD.x)<17&&y>BOARD.y-6&&y<BOARD.y+4;

/* reading it: the ask window, one row a request */
function openBoard(){
  boardFill(); reqState().seen=G.day;
  ask={idx:0,top:0,kind:'board'}; padVec={x:0,y:0}; padId=null; btnHeld=false; G.scene='ask'; sfx('menu_confirm');
}
const boardChoices=()=>reqState().list.map(r=>({id:'req',name:r.who,r})).concat([{id:'no',name:"Not now"}]);
/* handing one in: the things go, the asker thanks her, and pays */
function handIn(r){
  const have=reqHave(r);
  if(have<r.n){ say(r.who+" needs "+howMany(r)+". You have "+have+"."); sfx('cant_do_that'); return false; }
  if(r.type==='crop'){ G.crops[r.key]-=r.n; if(G.crops[r.key]<=0) delete G.crops[r.key]; }
  else { G.goods[r.key]-=r.n; if(G.goods[r.key]<=0) delete G.goods[r.key]; }
  const S=reqState(); S.list=S.list.filter(q=>q!==r); S.done[r.who]=(S.done[r.who]||0)+1;
  G.coins+=r.coins; if(r.gift) G.goods[r.gift]=(G.goods[r.gift]||0)+1;
  const W=REQUESTERS[r.who], who=personNamed(r.who), T=W.thanks[ri(0,W.thanks.length-1)];
  G.scene='world';
  playStory([{say:'npc',who,text:T},
    {run:()=>{ sfx('buy'); say("Request done! +"+r.coins+"c"+(r.gift?" and "+GOODS[r.gift].name:"")+"."); autoSave(); }}]);
  return true;
}

/* ---------- the board itself: two posts, a little roof, and the notes pinned to it ---------- */
const NOTE_COLS=['#fff6d8','#e8f4ff','#ffe8ee'];
function drawBoard(c,x,y,t){
  const s=placeKait();
  /* its picture (shop items/Notice Board), when there is one; drawn in code till then */
  if(typeof SHOP_ART!=='undefined'&&SHOP_ART['notice board']){
    c.fillStyle='rgba(20,14,6,.3)'; c.beginPath(); c.ellipse(x,y+1,22*s,5*s,0,0,TAU); c.fill();
    drawShopPic('notice board',x,y-30*s,50*s,62*s); boardBang(c,x,y,t,s); return; }
  c.save(); c.translate(x,y); c.scale(s,s);
  c.fillStyle='rgba(20,14,6,.3)'; c.beginPath(); c.ellipse(0,1,22,5,0,0,TAU); c.fill();
  c.fillStyle='#5a3a1e'; c.fillRect(-18,-34,4,35); c.fillRect(14,-34,4,35);            /* posts */
  c.fillStyle='#8a5a30'; c.fillRect(-22,-46,44,28); c.fillStyle='#6b4524'; c.fillRect(-22,-46,44,3); c.fillRect(-22,-21,44,3);
  c.fillStyle='#a8743e'; c.fillRect(-20,-43,40,22);                                    /* cork */
  c.fillStyle='#4a2e16'; c.beginPath(); c.moveTo(-26,-46); c.lineTo(0,-56); c.lineTo(26,-46); c.closePath(); c.fill();   /* roof */
  const L=reqState().list;
  L.slice(0,3).forEach((r,i)=>{ const nx=-17+i*12.5, ny=-41+(i%2)*3;
    c.fillStyle=NOTE_COLS[i%3]; c.fillRect(nx,ny,10,13);
    c.fillStyle='rgba(60,40,20,.5)'; for(let l=0;l<3;l++) c.fillRect(nx+2,ny+4+l*3,6,0.8);
    c.fillStyle='#d8403a'; c.beginPath(); c.arc(nx+5,ny+1.5,1.4,0,TAU); c.fill(); });
  c.restore(); boardBang(c,x,y,t,s);
}
/* something new on it: a bobbing "!" */
function boardBang(c,x,y,t,s){
  if(boardNew()){ const by=y-66*s+Math.sin(t/250)*2;
    c.fillStyle='#ffe08a'; c.beginPath(); c.arc(x,by,6,0,TAU); c.fill();
    c.fillStyle='#5a3a10'; c.fillRect(x-1,by-4,2,5); c.fillRect(x-1,by+2,2,1.6); }
}

/* the board's window: drawn by drawAsk */
function drawBoardAsk(V,top){
  const L=askChoices(), cur=L[ask.idx];
  TS("Notice Board",LW/2,ASK.y+32,30,WIN_TXT.title,'center',true);
  if(cur&&cur.r){ wrapLines('"'+cur.r.text+'"',15,ASK.w-30).slice(0,2).forEach((ln,i)=>TS(ln,LW/2,ASK.y+54+i*17,15,WIN_TXT.body,'center')); }
  else TS(L.length>1?"Pick a request to hand it in.":"Nothing pinned up today. Check back tomorrow!",LW/2,ASK.y+62,16,WIN_TXT.note,'center');
  V.forEach((c,j)=>{ const y=ASK.y+ASK.top+j*askRow()+20;
    if(c.id!=='req'){ TS(c.name,LW/2+12,y+9,22,WIN_TXT.title,'center',true); return; }
    const r=c.r, have=reqHave(r), ok=have>=r.n, left=r.until-G.day;
    const what=r.who+":  "+(MEASURE[r.key]?howMany(r):r.n===1?"1 "+reqName(r):r.n+" "+plural(reqName(r)));
    TS(what,ASK.x+46,y,fitSize(what,19,ASK.w-80,true),WIN_TXT.title,'left',true);
    TS(r.coins+"c"+(r.gift?" + "+GOODS[r.gift].name:"")+"  ·  "+(left<=1?"last day":left+" days left"),ASK.x+46,y+18,14,WIN_TXT.mp,'left');
    TS(have+"/"+r.n,ASK.x+ASK.w-20,y+8,17,ok?WIN_TXT.good:WIN_TXT.off,'right',true); });
}
