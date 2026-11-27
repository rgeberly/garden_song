/* ================================================================
   TITUBA AND TEX, the friends who join after Ivy and Tiny One
   Tituba, a Siamese stray, hangs around outside the Tipsy Toad in the evenings (from 6 PM,
   while the bar is open) from the first summer on. The first time Kaitlyn says hello she
   turns her nose up ('aloof'); Gus has a hint (a "!" over him until she's heard it): she only
   warms to the fishermen. Bring her a fish and she walks Kaitlyn home ('joined').
   Tex, an old tortoise, woke too early one winter and slid out onto the garden pool's ice,
   where he's stuck on his back (every winter from the first one, until he's helped).
   Kaitlyn rights him and warms him by the fire ('warm', within the scene), and he joins.
   At home: Tituba naps on the quilt, Tex sits in front of the hearth; at night she sleeps
   there and he pulls into his shell. G.story.titu: 'aloof' | 'joined', G.story.tituHint:
   Gus's hint heard; G.story.tex: 'warm' | 'joined'. Their battle moves are ALLY_SKILLS.
   ================================================================ */
SPEAKER.tituba={get name(){ return PARTY_INFO.tituba.name; },col:'#d8c8ff'};
SPEAKER.tex={get name(){ return PARTY_INFO.tex.name; },col:'#b8d890'};
const TITU_DAY=DAYS_PER_SEASON+1;                /* the first day of the first summer */
const TEX_DAY=3*DAYS_PER_SEASON+1;               /* the first day of the first winter */
const TITU_TOWN={x:398,y:142};                   /* town px: on the cobbles in front of the Tipsy Toad */
const TITU_BED={x:200,y:262}, TEX_HEARTH={x:296,y:280};       /* house painting px */
const texIce=()=>({x:POOL.x+POOL.w*0.6,y:POOL.y+POOL.h*0.55});    /* garden px: out on the frozen pool */
const FRIEND_SLEEPS=21*60;                        /* from 9 PM they sleep */
/* their size away from battle, as a share of their battle size (Ivy's is about the same) */
const FRIEND_MAP=0.44;

function tituStage(){ return G.story.titu||(G.day>=TITU_DAY?'stray':null); }
function texStage(){ return G.story.tex||(G.day>=TEX_DAY&&season()==='winter'?'stuck':null); }
/* where a friend is now: {id,x,y,where:'garden'|'house'|'town',anim,mood}, or null.
   anim: a loop of theirs to play ('fumble', 'tuck': Tex's shell), else their still stance */
function friendHere(id){
  const night=G.clock>=FRIEND_SLEEPS;
  const home=(p,tuck)=>{
    /* hurt in battle, left at home, or asleep: in their spot in the house */
    if(isHurt(id)) return {...p,where:'house',mood:'sad'};
    if(night) return {...p,where:'house',mood:'sleep',anim:tuck};
    if(!G.party.includes(id)) return {...p,where:'house',mood:'happy'};
    return null;
  };
  if(id==='tituba'){ const s=tituStage();
    if(s==='stray'||s==='aloof') return barOpen()?{id,...TITU_TOWN,where:'town',flip:true}:null;
    if(s==='joined') return home({id,...TITU_BED});
  }
  if(id==='tex'){ const s=texStage();
    if(s==='stuck') return {id,...texIce(),where:'garden',anim:'fumble'};
    if(s==='warm') return {id,...TEX_HEARTH,where:'house'};
    if(s==='joined') return home({id,...TEX_HEARTH},'tuck');
  }
  return null;
}
const FRIENDS=['tituba','tex'];
const friendsHere=where=>FRIENDS.map(friendHere).filter(f=>f&&f.where===where);
const hereNow=()=>G.area==='garden'?(G.indoors?'house':'garden'):G.area;
/* the friend she's next to, awake (f: reach factor, as for prompts) */
function nearFriend(f=1){
  const P=G.player, where=hereNow();
  return friendsHere(where).find(fr=>fr.mood!=='sleep'&&
    (where==='house'?Math.hypot(P.x-fr.x,P.y-fr.y)<64*f:Math.hypot(P.x-fr.x,P.y+10-fr.y)<(fr.id==='tex'?40:30)*f));
}
function friendLabel(fr){
  if(fr.id==='tex'&&texStage()==='stuck') return "Help";
  return "Talk";
}
function talkFriend(fr){
  const id=fr.id;
  if(id==='tituba'){ const s=tituStage();
    if(s==='stray') playStory(tituMeets());
    else if(s==='aloof') playStory(bestFish()?tituFed(bestFish()):[{say:'tituba',label:"Siamese cat",text:"Mrrow. (She flicks her tail and stares at your empty hands.)"}]);
    else playStory([{say:'tituba',text:isHurt(id)?"Mrrrow... (She's licking her wounds. Back in "+daysLeft(id)+".)"
                                                  :"Mrrp. (She stretches, then goes right back to her nap. Add "+PARTY_INFO.tituba.name+" to your party from the menu.)"}]);
    return; }
  if(id==='tex'){ const s=texStage();
    if(s==='stuck') playStory(texMeets());
    else playStory([{say:'tex',text:isHurt(id)?"Oof... these old bones need a little more rest. ("+daysLeft(id)+" to go.)"
                                              :"Hmm? Oh... just resting my eyes. (Add "+PARTY_INFO.tex.name+" to your party from the menu.)"}]);
  }
}
const daysLeft=id=>{ const n=G.allies[id].hurtUntil-G.day; return n+" day"+(n===1?"":"s"); };
/* the fish she'd give Tituba: the least valuable one in her bag */
function bestFish(){
  const L=Object.keys(G.goods).filter(k=>G.goods[k]>0&&GOODS[k]&&GOODS[k].kind==='fish');
  return L.sort((a,z)=>GOODS[a].value-GOODS[z].value)[0]||null;
}

/* ---------- Tituba ---------- */
const tituMeets=()=>[
  {say:'kaitlyn',face:'kaitlyn-warm-smile',text:"Oh! Hello there, kitty. Aren't you a pretty thing?"},
  {say:'tituba',label:"Siamese cat",text:"..."},
  {say:'kaitlyn',face:'kaitlyn-questioning',text:"Look at those big blue eyes. Are you lost? Do you have a home?"},
  {say:'tituba',label:"Siamese cat",text:"Hmph."},
  {say:'kaitlyn',face:'kaitlyn-side-eye',text:"(She turned her nose up at me! Maybe someone at the Tipsy Toad knows about her.)"},
  {run:()=>{ G.story.titu='aloof'; }},
];
/* Gus, while she's still aloof */
const GUS_HINT=[
  "That Siamese out front? She's been hanging around the Toad for weeks. Won't let a soul near her.",
  "Folks call her Tituba...after a wicked witch. You can see the devil in her eyes. The only ones she's ever warmed up to are the fishermen, after a good day on the water, if you catch my meaning.",
];
const tituFed=k=>[
  {say:'kaitlyn',face:'kaitlyn-big-smile',text:"I brought you something. A fresh "+GOODS[k].name+"!"},
  {say:'tituba',label:"Siamese cat",text:"...!"},
  {run:()=>{ G.goods[k]--; if(G.goods[k]<=0) delete G.goods[k]; }},
  /* her name: from Gus, or Kaitlyn's own idea if she never asked him */
  G.story.tituHint?{say:'kaitlyn',face:'kaitlyn-grin',text:"Ha! I knew it. You're not so tough after all, are you, Tituba?"}
                  :{say:'kaitlyn',face:'kaitlyn-grin',text:"Ha! I knew it. You're not so tough after all. You look like a Tituba to me."},
  {fade:'out',ms:900},
  {pic:'meet_tituba'},
  {fade:'in',ms:2400},
  {say:'kaitlyn',face:'kaitlyn-bashful',text:"Oh! Are you...walking me home?"},
  {say:'tituba',text:"Mrrp."},
  {say:'kaitlyn',face:'kaitlyn-warm-smile',text:"Well, if you're coming with me, there's plenty more fish where that came from. Well...I have a fishing rod, anyway."},
  {say:'tituba',text:"...I'm just a cat."},
  {say:'kaitlyn',face:'kaitlyn-questioning',text:"...Did you just say something?"},
  {say:'tituba',text:"Mrrow?"},
  {fade:'out',ms:900},
  {pic:null},
  {run:()=>{ G.story.titu='joined'; joinParty('tituba'); }},
  {fade:'in',ms:700},
  {popup:"Tituba the Siamese cat joins the party!",who:'tituba'},
];

/* ---------- Tex ---------- */
const texMeets=()=>[
  {say:'kaitlyn',face:'kaitlyn-amazed',text:"What on earth...? A tortoise?! Out here on the ice?"},
  {say:'tex',label:"Tortoise",text:"Sigh..."},
  {say:'kaitlyn',face:'kaitlyn-determined',text:"Oh, you poor thing! Hang on, I've got you!"},
  {fade:'out',ms:900},
  {pic:'meet_tex'},
  {fade:'in',ms:2400},
  {say:'kaitlyn',face:'kaitlyn-battle-shout',text:"Okay...one, two, three...hup!"},
  {say:'tex',label:"Tortoise",text:"Hnnngghhh..."},
  {say:'kaitlyn',face:'kaitlyn-concerned',text:"You're freezing! What are you doing out of your burrow in the middle of winter?"},
  {say:'tex',label:"Tortoise",text:"Sigh..."},
  {say:'kaitlyn',face:'kaitlyn-warm-smile',text:"Come on, let's get you warmed up by the fire."},
  {fade:'out',ms:900},
  {pic:null},
  {run:()=>{ G.story.tex='warm'; G.indoors=true; houseImg(); place(TEX_HEARTH.x+58,TEX_HEARTH.y+14,6); }},
  {fade:'in',ms:900},
  {say:'tex',label:"Tortoise",text:"Ahhh..."},
  {say:'kaitlyn',face:'kaitlyn-grin',text:"Bro...you're bigger than Texas. Maybe I'll call you Tex."},
  {say:'tex',text:"...mhmm."},
  {say:'tex',text:"Much obliged, puddin'. I'll be your plastron from here on out."},
  {say:'kaitlyn',face:'kaitlyn-big-smile',text:"...shell yeah, Tex."},
  {run:()=>{ G.story.tex='joined'; joinParty('tex'); }},
  {popup:"Tex the old tortoise joins the party!",who:'tex'},
];

/* ---------- drawing them ----------
   A friend's battle art, small: s is their size as a share of their battle size, around
   their feet (x,y). anim: 'fumble' (Tex stuck on his back) or 'tuck' (Tex in his shell, the
   middle of his withdraw); otherwise their still stance. mood floats over them. */
function drawFriendMap(c,id,x,y,s,anim,mood,flip){
  const A=PARTY_ART[id], img=partyImg();
  let r=null, ax=0, ay=0, st=1;                     /* st: the share of its size a loop is stored at */
  if(A&&anim==='fumble'&&A.fumble){ const f=A.fumble.f; r=f[Math.floor(G.t/180)%f.length]; ax=A.fumble.ax; ay=A.fumble.ay; st=A.fumble.k||1; }
  else if(A&&anim==='tuck'&&A.spell){ const f=A.spell.f; r=f[Math.floor(f.length/2)]; ax=A.spell.ax; ay=A.spell.ay; }
  else if(A&&A.stance){ r=A.stance.r; ax=A.stance.ax; ay=A.stance.ay; }
  else if(A){ r=A.ready[0]; ax=A.ax; ay=A.ay; }
  const k=2/SC*s/st, w=r?r[2]*k:20*s;
  c.globalAlpha=.28; c.fillStyle='#1a2810';
  c.beginPath(); c.ellipse(x,y,w*0.42,Math.max(2,w*0.09),0,0,7); c.fill(); c.globalAlpha=1;
  let top=y-24*s;
  if(r&&img){ c.save(); c.translate(x,y); c.scale((flip?-1:1)*k,k); c.imageSmoothingEnabled=true;
    c.drawImage(img,r[0],r[1],r[2],r[3],-ax,-ay,r[2],r[3]); c.restore(); top=y-ay*k; }
  if(mood) drawMood(c,x,top-6,mood);
}
/* in the garden (world px, inside the world zoom): at their size like Kaitlyn's */
function friendGardenEnts(cam){
  return friendsHere('garden').map(fr=>({y:fr.y,f:()=>drawFriendMap(b,fr.id,fr.x-cam.x,fr.y-cam.y,FRIEND_MAP/WORLD_ZOOM,fr.anim,fr.mood,fr.flip)}));
}
/* in the house (screen px; k: the painting's scale) */
function friendHouseEnts(k,cam){
  return friendsHere('house').map(fr=>({y:fr.y,f:()=>drawFriendMap(b,fr.id,fr.x*k,cam.top+(fr.y-cam.y)*k,FRIEND_MAP*HOUSE_KAIT,fr.anim,fr.mood,fr.flip)}));
}
/* in town (world px, inside the world zoom), scaled like Kaitlyn there */
function friendPlaceEnts(cam){
  return friendsHere(G.area).map(fr=>({y:fr.y,f:()=>drawFriendMap(b,fr.id,fr.x-cam.x,fr.y-cam.y,FRIEND_MAP*placeKait()/WORLD_ZOOM,fr.anim,fr.mood,fr.flip)}));
}

/* ---------- trying it out ----------
   With ?partytest (nothing is saved), in the console: tituTest('stray'|'aloof'|'fish'|'home'|'fight')
   ('aloof': met, no fish; 'fish': met, with a perch in the bag) and texTest('stuck'|'home'|'fight');
   lv: their level in a fight (default 10). */
function friendTestStart(){
  if(!PARTY_TEST) return false;
  if(G.scene==='title'){ newGameState(); startGame(); }
  G.scene='world'; story=null; G.pests=[]; G.mtnPests=[]; return true;
}
function friendFight(id,lv){
  lv=lv||10; joinParty(id);
  const P=G.player, hp=statOf(id,'hp',lv);
  Object.assign(G.allies[id],{lv,xp:0,next:xpNeed(lv),hp,maxhp:hp,mp:statOf(id,'mp',lv),hurtUntil:0});
  P.lv=Math.max(P.lv,lv); P.maxhp=statOf('kaitlyn','hp'); P.hp=P.maxhp; P.mp=maxMp();
  if(!G.party.includes(id)) G.party=['kaitlyn',id];
  G.area='garden'; G.indoors=false;
  startBattle({species:TEST_PESTS[0],lv:Math.max(5,lv-2),x:0,y:0},TEST_PESTS.slice(0,2));
  return PARTY_INFO[id].name+" Lv."+lv+" in a fight";
}
function tituTest(step,lv){
  if(!friendTestStart()) return "Open the game with ?partytest first.";
  const S=G.story; delete S.titu; delete S.tituHint; G.party=G.party.filter(id=>id!=='tituba');
  G.day=Math.max(G.day,TITU_DAY); G.clock=19*60;
  const town=()=>{ G.area='town'; G.indoors=false; placeImg('town'); place(TITU_TOWN.x-30,TITU_TOWN.y+14,2); };
  if(step==='stray') town();
  else if(step==='aloof'){ S.titu='aloof'; town(); }
  else if(step==='fish'){ S.titu='aloof'; addGood('perch'); town(); }
  else if(step==='home'){ S.titu='joined'; joinParty('tituba'); G.party=G.party.filter(id=>id!=='tituba'); G.clock=10*60;
    G.area='garden'; G.indoors=true; houseImg(); place(TITU_BED.x+10,TITU_BED.y+60,0); }
  else if(step==='fight'){ S.titu='joined'; return friendFight('tituba',lv); }
  else return "Steps: stray, aloof, fish, home, fight";
  return "Tituba: "+step+" (day "+G.day+", "+season()+")";
}
function texTest(step,lv){
  if(!friendTestStart()) return "Open the game with ?partytest first.";
  const S=G.story; delete S.tex; G.party=G.party.filter(id=>id!=='tex');
  G.day=Math.max(G.day,TEX_DAY); G.clock=10*60;
  if(step==='stuck'){ G.area='garden'; G.indoors=false; seasonMap(season()); const p=texIce(); place(p.x-34,p.y-4,2); }
  else if(step==='home'){ S.tex='joined'; joinParty('tex'); G.party=G.party.filter(id=>id!=='tex');
    G.area='garden'; G.indoors=true; houseImg(); place(TEX_HEARTH.x,TEX_HEARTH.y+52,0); }
  else if(step==='fight'){ S.tex='joined'; return friendFight('tex',lv); }
  else return "Steps: stuck, home, fight";
  return "Tex: "+step+" (day "+G.day+", "+season()+")";
}
