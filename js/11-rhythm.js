/* ================================================================
   RHYTHM  (melodic charts)
   ================================================================ */
const LANES=4, LANE_W=78, LANE_X0=24, HITLINE=369, FALL=1500;
const PENTA=[0,2,4,7,9,12,14,16,19,21];
/* degree index into PENTA, beats */
const PHRASES=[
  [[0,1],[2,1],[4,2],[3,1],[2,1],[0,2],[2,1],[4,1],[5,2],[4,1],[2,1],[0,2]],
  [[4,1],[3,1],[2,1],[3,1],[4,2],[5,1],[4,1],[2,2],[0,1],[2,1],[4,2]],
  [[0,2],[1,1],[2,1],[4,2],[2,1],[1,1],[0,1],[2,1],[3,2],[2,1],[0,3]],
  [[5,1],[4,1],[3,2],[2,1],[3,1],[4,2],[2,1],[0,1],[2,2],[4,1],[5,3]],
];
let R_=null;
/* Charts are transcribed straight out of the Grow Little Croppies recordings:
   real onsets, real pitches. Lane follows pitch, so the melody rises and falls
   across the screen and each hit sounds the note that was actually played. */
function makeChart(count,seed,bpm){
  let s=Math.abs(seed|0)||7;
  const rr=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
  const ph=CROP_PHRASES[Math.floor(rr()*CROP_PHRASES.length)];
  const lo=Math.min(...ph.map(n=>n.s)), hi=Math.max(...ph.map(n=>n.s));
  const span=Math.max(1,hi-lo);
  /* stretch out anything played faster than the touch screen can follow */
  const iois=[]; for(let i=1;i<ph.length;i++) iois.push(ph[i].t-ph[i-1].t);
  iois.sort((a,z)=>a-z);
  const med=iois.length?iois[iois.length>>1]:400;
  const stretch=clamp(300/Math.max(60,med),1,2.4);
  const laneOf=n=>clamp(Math.round((n.s-lo)/span*(LANES-1)),0,LANES-1);
  const notes=[]; let base=1500, k=0, last=1500;
  while(notes.length<count){
    const n=ph[k], nx=ph[(k+1)%ph.length];
    const t=base+(n.t-ph[0].t)*stretch;
    const dur=n.d*stretch;
    const lane=laneOf(n);
    if(dur>=430&&notes.length<count-1){
      notes.push({t,lane,semi:n.s,type:'hold',dur:Math.min(1500,dur*0.8),
        endLane:laneOf(nx),done:false,score:0,reqLane:lane});
    } else {
      notes.push({t,lane,semi:n.s,type:'tap',done:false});
    }
    last=t+dur; k++;
    if(k>=ph.length){ k=0; base=last+420; }
  }
  const beat=Math.max(320,med*stretch*2);
  return {notes,end:last+1700,beat,bpm:60000/beat};
}
function scheduleAccomp(chart,t0){
  if(!AC) return;
  const barMs=chart.beat*4;
  const bars=Math.ceil(chart.end/barMs);
  for(let i=0;i<bars;i++){
    const chord=THEME.prog[i%4], t=t0+(1.5+i*barMs/1000)-1.5+ (i*barMs)/1000;
    const tt=t0+(i*barMs)/1000;
    pad(chord.map(n=>n-12),tt,barMs/1000*0.95,0.75,musicGain);
    pluck(chord[0]-24,tt,0.9,0.8,musicGain);
    pluck(chord[0]-24,tt+(barMs/2)/1000,0.7,0.6,musicGain);
    pluck(chord[1],tt+(barMs/4)/1000,0.5,0.3,musicGain);
    pluck(chord[2],tt+(barMs*3/4)/1000,0.5,0.3,musicGain);
  }
}
/* Pick the phrase whose note count best matches what this song asks for,
   then lay its real onsets straight onto the lanes. */
function stemChart(count,seed){
  let s=Math.abs(seed|0)||7;
  const rr=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
  const ranked=STEM_PHRASES.map((p,i)=>({p,d:Math.abs(p.n.length-count)}))
                           .sort((a,z)=>a.d-z.d);
  const pool=ranked.slice(0,Math.min(4,ranked.length));
  const ph=pool[Math.floor(rr()*pool.length)].p;
  const LEAD=2.2, off=Math.max(0,ph.a-LEAD);
  const span=Math.max(1,ph.hi-ph.lo);
  const laneOf=s2=>clamp(Math.round((s2-ph.lo)/span*(LANES-1)),0,LANES-1);
  const notes=ph.n.map((n,i)=>{
    const aStart=ph.a+n.t, aEnd=aStart+n.d;
    const t=(aStart-off)*1000, lane=laneOf(n.s);
    const nx=ph.n[Math.min(ph.n.length-1,i+1)];
    if(n.d>=0.42&&i<ph.n.length-1)
      return {t,lane,semi:n.s,type:'hold',dur:n.d*1000,endLane:laneOf(nx.s),
              done:false,score:0,reqLane:lane,aStart,aEnd};
    return {t,lane,semi:n.s,type:'tap',done:false,aStart,aEnd};
  });
  return {notes,end:(ph.b-off)*1000+1500,offset:off,stem:true,beat:600,bpm:100};
}
/* Practice: the whole flute part, every phrase in a row over the backing track, on
   lanes set by the whole song's range. */
function fullStemChart(){
  const P=STEM_PHRASES, lo=Math.min(...P.map(p=>p.lo)), hi=Math.max(...P.map(p=>p.hi)), span=Math.max(1,hi-lo);
  const off=Math.max(0,P[0].a-2.2), laneOf=s2=>clamp(Math.round((s2-lo)/span*(LANES-1)),0,LANES-1);
  const notes=[];
  P.forEach(ph=>ph.n.forEach((n,i)=>{
    const aStart=ph.a+n.t, aEnd=aStart+n.d, t=(aStart-off)*1000, lane=laneOf(n.s);
    const nx=ph.n[Math.min(ph.n.length-1,i+1)];
    notes.push(n.d>=0.42&&i<ph.n.length-1
      ?{t,lane,semi:n.s,type:'hold',dur:n.d*1000,endLane:laneOf(nx.s),done:false,score:0,reqLane:lane,aStart,aEnd}
      :{t,lane,semi:n.s,type:'tap',done:false,aStart,aEnd}); }));
  notes.sort((a,z)=>a.t-z.t);
  return {notes,end:(P[P.length-1].b-off)*1000+1500,offset:off,stem:true,beat:600,bpm:100};
}
function startStemPlayback(chart,leadMs){
  const t0=AC.currentTime+leadMs/1000;     /* song time 0 lands after the count-in */
  const bs=AC.createBufferSource(); bs.buffer=STEM.backing;
  const bg=AC.createGain(); bg.gain.value=0.8;
  bs.connect(bg); bg.connect(master);
  const fs=AC.createBufferSource(); fs.buffer=STEM.flute;
  const fg=AC.createGain(); fg.gain.value=0.0001;
  fs.connect(fg); fg.connect(master);
  bs.start(t0,chart.offset); fs.start(t0,chart.offset);
  return {t0,bs,fs,fg};
}
function stopStemPlayback(){
  if(!R_||!R_.play) return;
  try{ R_.play.bs.stop(); R_.play.fs.stop(); }catch(e){}
  R_.play=null;
}
/* open the flute up for exactly this note, then close it again */
function fluteOn(n){
  if(!R_||!R_.play||!AC) return;
  const g=R_.play.fg, now=AC.currentTime;
  const s=Math.max(now, R_.play.t0+(n.aStart-R_.chart.offset));
  const e=Math.max(s+0.05, R_.play.t0+(n.aEnd-R_.chart.offset));
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(Math.max(0.0001,g.gain.value),now);
  g.gain.linearRampToValueAtTime(1,s+0.008);
  g.gain.setValueAtTime(1,Math.max(s+0.012,e-0.03));
  g.gain.linearRampToValueAtTime(0.0001,e+0.10);
}
function startRhythm(plot,bc){
  const count=bc?bc.notes:SPECIES[plot.sp].notes;
  const bpm=bc?112:96+G.gardenLv*2;
  const seed=(plot?plot.x*7+plot.y*13:917)+count*31;
  const useStem=STEM.ready&&typeof STEM_PHRASES!=='undefined'&&STEM_PHRASES.length;
  const chart=bc&&bc.practice?(useStem?fullStemChart():makeChart(64,seed,100))
             :useStem?stemChart(count,seed):makeChart(count,seed,bpm);
  /* Count-in: "3, 2, 1, Go!" one beat each, ending just before the first note
     starts to fall, so there is time to get your fingers on H J K L. */
  const first=chart.notes.length?chart.notes[0].t:0;
  const beat=clamp(chart.beat||600,450,750);
  const goEnd=first-FALL-250, countStart=goEnd-COUNT_BEATS*beat;
  const lead=Math.max(700,-countStart);     /* ms before song time 0 */
  R_={plot,battle:bc||null,chart,mpSpent:bc?bc.mp:0,play:null,
    time:-lead,count:{start:countStart,beat,last:-1},
    perfect:0,good:0,miss:0,combo:0,maxcombo:0,
    press:[0,0,0,0],flash:[0,0,0,0],pop:[],fx:[],done:false,shine:0,frogT:0};
  G.scene='rhythm'; initAudio();
  setMusic(null);
  if(chart.stem&&AC) R_.play=startStemPlayback(chart,lead);
  else if(AC) scheduleAccomp(chart,AC.currentTime+lead/1000);
}
const COUNT_BEATS=4, COUNT_WORDS=['3','2','1','Go!'];
/* which count word is showing (-1 before the count, COUNT_BEATS once it is over) */
function countBeat(){
  const c=R_.count;
  return R_.time<c.start?-1:Math.min(COUNT_BEATS,Math.floor((R_.time-c.start)/c.beat));
}
function spawnFx(lane,kind){
  R_.fx.push({x:LANE_X0+lane*LANE_W+LANE_W/2+rnd(-14,14),y:HITLINE-9,
    vy:rnd(-0.082,-0.045),vx:rnd(-0.018,0.018),t:900,kind});
}
function laneDown(lane){
  if(!R_)return;
  R_.press[lane]=1; R_.flash[lane]=200;
  let best=null,bd=1e9;
  for(const n of R_.chart.notes){ if(n.done||n.lane!==lane)continue;
    const d=Math.abs(n.t-R_.time); if(d<bd){bd=d;best=n;} }
  if(best&&bd<170){
    if(best.type==='tap'){
      best.done=true; const perfect=bd<60;
      if(perfect){ R_.perfect++; R_.shine=180; spawnFx(lane,'note'); spawnFx(lane,'note'); }
      else R_.good++;
      R_.combo++; R_.maxcombo=Math.max(R_.maxcombo,R_.combo);
      R_.pop.push({t:650,txt:perfect?'PERFECT':'GOOD',x:LANE_X0+lane*LANE_W+LANE_W/2,
        c:perfect?'#ffe08a':'#a8e0ff'});
      if(R_.chart.stem) fluteOn(best);
      else if(AC) flute(best.semi,AC.currentTime,.5,.85);
    } else if(R_.chart.stem) fluteOn(best);
      else if(AC) flute(best.semi,AC.currentTime,Math.min(2.4,best.dur/1000),.7);
  } else if(bd>400&&countBeat()>=COUNT_BEATS) blip(150,0.05,0.1);   /* free practice during the count-in */
}
function laneUp(l){ if(R_) R_.press[l]=0; }
const CANCEL={x:LW-64,y:52,w:58,h:26};
function cancelRhythm(){
  if(!R_) return;
  stopStemPlayback();
  const bc=R_.battle;
  if(musicGain) musicGain.gain.value=0.34;
  if(bc&&bc.practice){ R_=null; G.scene='world'; setMusic('calm'); say("You put the flute down. (Practice again any time today.)"); return; }
  R_=null;
  if(bc){                                   /* give the Music Points back */
    G.player.mp=Math.min(maxMp(),G.player.mp+(bc.mp||0));
    G.scene='battle'; if(B){ B.turn='player'; B.log="Kaitlyn lowers the flute."; }
    setMusic(B&&B.boss?'boss':'battle');
  } else {
    G.scene='world'; setMusic('calm'); say("Song cancelled.");
  }
}
function rhythmTouch(x,y,id){
  if(R_&&R_.done){ finishRhythm(); return; }
  const cy=CANCEL.y+BAND_TOP();            /* the Stop button rides at the top of the screen */
  if(x>CANCEL.x&&x<CANCEL.x+CANCEL.w&&y>cy&&y<cy+CANCEL.h){ cancelRhythm(); return; }
  if(y<165) return;
  const lane=clamp(Math.floor((x-LANE_X0)/LANE_W),0,LANES-1);
  touches[id].lane=lane; laneDown(lane);
}
function rhythmMove(x,y,id){
  if(!R_||!touches[id]||touches[id].lane===undefined)return;
  const lane=clamp(Math.floor((x-LANE_X0)/LANE_W),0,LANES-1), old=touches[id].lane;
  if(lane!==old){ R_.press[old]=0; R_.press[lane]=1; touches[id].lane=lane; R_.flash[lane]=160; }
}
function rhythmRelease(id){
  if(!R_||!touches[id]||touches[id].lane===undefined)return;
  R_.press[touches[id].lane]=0;
}
function rhythmKey(k){
  if(R_&&R_.done){finishRhythm();return;}
  if(k==='escape'){ cancelRhythm(); return; }   /* H is a lane here, so only Esc stops */
  if(k in KEYLANE) laneDown(KEYLANE[k]);
}
function updateRhythm(dt){
  if(!R_)return;
  if(R_.play&&AC) R_.time=(AC.currentTime-R_.play.t0)*1000;
  else R_.time+=dt;
  /* a soft woodblock tick on each count, a brighter one on "Go!" */
  const cb=countBeat();
  if(cb>=0&&cb<COUNT_BEATS&&cb!==R_.count.last){ R_.count.last=cb;
    blip(cb<COUNT_BEATS-1?880:1320,0.08,0.12,'sine'); }
  for(let i=0;i<LANES;i++) if(R_.flash[i]>0) R_.flash[i]-=dt;
  if(R_.shine>0) R_.shine-=dt;
  if(R_.frogT>0) R_.frogT-=dt;
  R_.pop.forEach(p=>p.t-=dt); R_.pop=R_.pop.filter(p=>p.t>0);
  R_.fx.forEach(f=>{f.t-=dt;f.y+=f.vy*dt;f.x+=f.vx*dt;}); R_.fx=R_.fx.filter(f=>f.t>0);
  for(const n of R_.chart.notes){
    if(n.done)continue;
    if(n.type==='tap'){
      if(R_.time-n.t>170){ n.done=true; R_.miss++; R_.combo=0;
        R_.pop.push({t:520,txt:'MISS',x:LANE_X0+n.lane*LANE_W+LANE_W/2,c:'#ff8a8a'}); }
    } else {
      if(R_.time>=n.t&&R_.time<=n.t+n.dur){
        const k=(R_.time-n.t)/n.dur;
        n.reqLane=clamp(Math.round(n.lane+(n.endLane-n.lane)*k),0,LANES-1);
        let ok=false;
        for(let l=Math.max(0,n.reqLane-1);l<=Math.min(LANES-1,n.reqLane+1);l++) if(R_.press[l]) ok=true;
        n.holding=ok;
        if(ok){ n.score+=dt; if(Math.random()<dt/90) spawnFx(n.reqLane,'spark');
                if(R_.chart.stem&&!n.sounding){ n.sounding=true; fluteOn(n); } }
      }
      if(R_.time>n.t+n.dur){
        n.done=true;
        const ratio=n.score/n.dur, lx=LANE_X0+n.endLane*LANE_W+LANE_W/2;
        if(ratio>0.55){ R_.perfect++; R_.combo++; R_.maxcombo=Math.max(R_.maxcombo,R_.combo);
          R_.pop.push({t:700,txt:'LEGATO!',x:lx,c:'#c8ffb0'});
          spawnFx(n.endLane,'note'); spawnFx(n.endLane,'note'); spawnFx(n.endLane,'note'); }
        else if(ratio>0.22){ R_.good++; R_.combo++; R_.pop.push({t:520,txt:'GOOD',x:lx,c:'#a8e0ff'}); }
        else { R_.miss++; R_.combo=0; R_.pop.push({t:520,txt:'MISS',x:lx,c:'#ff8a8a'}); }
      }
    }
  }
  if(!R_.done&&R_.time>R_.chart.end){ R_.done=true;
    if(rhythmAcc()>0.93){ R_.frogT=4000; if(AC){flute(21,AC.currentTime,.4,.7);
      flute(26,AC.currentTime+.14,.5,.7); flute(30,AC.currentTime+.28,.8,.7);} } }
}
const rhythmAcc=()=>{ const tot=R_.perfect+R_.good+R_.miss||1;
  return (R_.perfect+R_.good*0.55)/tot; };
function finishRhythm(){
  stopStemPlayback();
  const acc=rhythmAcc();
  setMusic(B?'battle':'calm');
  if(R_.battle){ const cb=R_.battle.cb; R_=null; cb(acc); return; }
  const plot=R_.plot,S=SPECIES[plot.sp];
  plot.sungDay=G.day;
  const h=harmony(), mul=(G.gear.can?1.25:1)*(G.yard.bath?1.1:1)*(plot.raised?1.3:1)*fluteMul();
  const gain=Math.round((38+acc*72+R_.maxcombo*1.6)*h*mul);
  const before=plot.stage;
  setGrowth(plot,plot.growth+gain);
  plot.health=Math.min(100,plot.health+Math.round(acc*15));
  const share=Math.round(gain*0.32); let spread=0;
  plots.forEach(q=>{ if(q!==plot&&active(q)&&q.sp&&q.stage<3){
    setGrowth(q,q.growth+share); spread++; } });
  addXp(Math.round(6+acc*S.xp)); addGardenXp(Math.round(4+acc*8));
  G.player.mp=Math.min(maxMp(),G.player.mp+1);
  let msg="+"+gain+" growth"+(plot.raised?" (raised +30%)":"");
  if(h>1.001) msg+=" · harmony x"+h.toFixed(2);
  if(spread) msg+=" · +"+share+" to "+spread+" more";
  R_=null; G.scene='world'; say(msg); autoSave();
  passTime(SONG_MINUTES);
}
const SONG_MINUTES=10;              /* singing to a plant takes this long (game minutes) */
function noteGlyph(c,x,y,col,a){
  c.globalAlpha=a; px(c,x+3,y,3,11,col); px(c,x,y+9,5,5,col); px(c,x+6,y-2,3,5,col); c.globalAlpha=1;
}
function rhythmPlant(c,x,base,grow,pulse){
  const h=9+Math.round(grow*26)+(pulse?2:0);
  px(c,x-9,base,18,11,'#2b1c12'); px(c,x-8,base+2,16,8,'#a8653a');
  px(c,x-8,base+2,16,2,'#c9865a');
  px(c,x-2,base-h,3,h,'#4a8a3e');
  for(let i=5;i<h;i+=6){
    px(c,x-2-Math.min(8,i/2),base-i,6,3,'#5fae4c');
    px(c,x+2,base-i-3,6,3,'#5fae4c');
  }
  if(grow>0.35){ px(c,x-4,base-h-4,7,7,pulse?'#ffe08a':'#e8c34a'); px(c,x-2,base-h-2,3,3,'#fff3c0'); }
  if(grow>0.7){ px(c,x-9,base-h+7,5,5,'#e8433f'); px(c,x+6,base-h+11,5,5,'#e8433f'); }
}
function drawRhythm(){
  const grow=clamp(R_.combo/14,0,1);
  const T0=BAND_TOP(), T1=BAND_BOT(), TH=T1-T0;     /* the full screen, on tall phones too */
  const sky=b.createLinearGradient(0,0,0,LH);
  sky.addColorStop(0,'#1b2f46'); sky.addColorStop(0.34,'#3a5a72');
  sky.addColorStop(0.62,'#6a7f6a'); sky.addColorStop(1,'#25341f');
  px(b,0,T0,LW,-T0,'#1b2f46');
  b.fillStyle=sky; b.fillRect(0,0,LW,LH);
  /* low sun and its glow, brightening with the combo */
  b.globalAlpha=.20+grow*0.28;
  const gl=b.createRadialGradient(300,150,4,300,150,190);
  gl.addColorStop(0,'#ffe6a8'); gl.addColorStop(1,'rgba(255,220,150,0)');
  b.fillStyle=gl; b.fillRect(0,0,LW,LH); b.globalAlpha=1;
  b.fillStyle='#ffdca0'; b.globalAlpha=.5+grow*0.3;
  b.beginPath(); b.arc(300,150,17,0,7); b.fill(); b.globalAlpha=1;
  /* drifting clouds */
  b.globalAlpha=.16; b.fillStyle='#dfe8ee';
  for(let i=0;i<4;i++){
    const cxp=((G.t*0.008+i*130)%(LW+200))-100;
    b.beginPath(); b.ellipse(cxp,54+i*26,44,11,0,0,7); b.fill();
    b.beginPath(); b.ellipse(cxp+26,60+i*26,28,8,0,0,7); b.fill();
  }
  b.globalAlpha=1;
  /* three ridges of hills */
  [[248,'#3d5a4a',44],[262,'#33503c',34],[276,'#2b4531',26]].forEach(([hy,col,r],li)=>{
    b.fillStyle=col;
    for(let i=-1;i<12;i++){
      const hx=i*34+(li*11), hh=r+((i*7+li*5)%16);
      b.beginPath(); b.ellipse(hx,hy,34,hh,0,0,7); b.fill();
    }
  });
  px(b,0,282,LW,T1-282,'#25381f');
  /* fireflies */
  for(let i=0;i<14;i++){
    const fx=(i*53+G.t*0.011*(1+i%3))%LW;
    const fy=200+((i*37)%150)+Math.sin(G.t/420+i)*9;
    b.globalAlpha=.35+0.35*Math.sin(G.t/300+i*1.7);
    px(b,Math.round(fx),Math.round(fy),3,3,'#f7f0a0'); b.globalAlpha=1;
  }
  for(let i=0;i<LANES;i++){ const x=LANE_X0+i*LANE_W;
    b.globalAlpha=.72; px(b,x,T0,LANE_W-3,TH,(i%2)?'#1e2731':'#222c37'); b.globalAlpha=1;
    if(R_.flash[i]>0){ b.globalAlpha=R_.flash[i]/500; px(b,x,T0,LANE_W-3,TH,'#5ea8d8'); b.globalAlpha=1; } }
  /* carved wooden frame down both margins */
  for(const fx of [0,LW-21]){
    px(b,fx,T0,21,TH,'#3b2a18');
    px(b,fx+3,T0,15,TH,'#7d5c34');
    px(b,fx+3,T0,4,TH,'#a8845a');
    for(let y=6-Math.ceil(-T0/27)*27;y<T1;y+=27){
      px(b,fx+3,y,15,4,'#5e4526'); px(b,fx+5,y+8,11,11,'#8f6a3c');
      px(b,fx+7,y+10,7,7,'#c9a05a');
    }
  }
  /* vine + leaves climbing the frame, growing with the combo */
  for(const [fx,dir] of [[21,1],[LW-22,-1]]){
    const h=LH*(0.25+grow*0.75);
    for(let yv=0;yv<h;yv+=4){
      const xv=fx+dir*Math.round(Math.sin(yv/26)*4);
      px(b,xv,LH-yv,3,4,'#3f7a35');
      if(yv%24===0){ px(b,xv+dir*3,LH-yv-2,6,4,'#5aa347'); px(b,xv+dir*3,LH-yv-2,3,2,'#7cc45c'); }
      if(grow>0.6&&yv%48===0) px(b,xv+dir*4,LH-yv-4,5,5,'#e8c34a');
    }
  }
  if(R_.shine>0){ b.globalAlpha=R_.shine/900; px(b,0,0,LW,LH,'#ffe08a'); b.globalAlpha=1; }
  /* the hit line is the flute you have equipped */
  const FS=FLUTE_INFO[G.flute||'recorder'];
  b.globalAlpha=.35; px(b,6,HITLINE+10,LW-12,7,'#101820'); b.globalAlpha=1;
  px(b,6,HITLINE-10,LW-12,22,'#241a10');
  px(b,8,HITLINE-8,LW-16,18,FS.body);
  px(b,8,HITLINE-8,LW-16,5,FS.hi);
  px(b,8,HITLINE+7,LW-16,3,FS.dark);
  px(b,8,HITLINE-8,13,18,FS.hi); px(b,LW-21,HITLINE-8,13,18,FS.hi);
  px(b,LW-24,HITLINE-11,7,24,FS.dark);
  px(b,23,HITLINE-5,9,7,'#241a10');
  if(G.flute==='dizi'){ px(b,30,HITLINE-8,4,18,'#7ad0a0'); px(b,LW-30,HITLINE-8,4,18,'#e8c34a'); }
  for(let i=0;i<LANES;i++){
    const x=LANE_X0+i*LANE_W+LANE_W/2-7;
    px(b,x-2,HITLINE-7,18,16,FS.dark);
    px(b,x,HITLINE-5,14,12,R_.press[i]?'#fff3b0':'#241a10');
    if(R_.press[i]){ px(b,x+2,HITLINE-3,10,8,'#ffe08a');
      b.globalAlpha=.5; px(b,LANE_X0+i*LANE_W,T0,LANE_W-3,TH,'#ffe08a'); b.globalAlpha=1; }
  }
  for(let i=0;i<LANES;i++) rhythmPlant(b,LANE_X0+i*LANE_W+LANE_W/2,LH-26,grow,R_.flash[i]>60);
  const holdLabels=[];
  for(const n of R_.chart.notes){
    if(n.done&&n.type==='tap') continue;
    if(n.type==='tap'){
      const y=HITLINE-((n.t-R_.time)/FALL)*HITLINE;
      if(y<T0-20||y>T1)continue;
      const x=LANE_X0+n.lane*LANE_W;
      px(b,x+7,Math.round(y)-8,LANE_W-17,16,'#2b1c12');
      px(b,x+9,Math.round(y)-6,LANE_W-21,12,'#f2701c');
      px(b,x+9,Math.round(y)-6,LANE_W-21,4,'#ffcf3a');
    } else {
      const act=R_.time>=n.t&&R_.time<=n.t+n.dur, steps=22;
      for(let s=0;s<=steps;s++){
        const k=s/steps, tt=n.t+n.dur*k;
        const yy=HITLINE-((tt-R_.time)/FALL)*HITLINE;
        if(yy<T0-16||yy>T1)continue;
        const lane=n.lane+(n.endLane-n.lane)*k;
        const x=Math.round(LANE_X0+lane*LANE_W+LANE_W/2-16);
        const filled=act&&k<=(R_.time-n.t)/n.dur;
        px(b,x-2,Math.round(yy)-6,36,13,'#2b1c12');
        px(b,x,Math.round(yy)-4,32,10,filled?(n.holding?'#c8ffb0':'#c07a4a'):'#e8c34a');
        px(b,x,Math.round(yy)-4,32,3,filled?'#ffffff':'#fff3b0');
      }
      const yh=HITLINE-((n.t-R_.time)/FALL)*HITLINE;
      if(yh>T0-16&&yh<T1){ const x=LANE_X0+n.lane*LANE_W;
        px(b,x+6,Math.round(yh)-10,LANE_W-15,20,'#2b1c12');
        px(b,x+9,Math.round(yh)-7,LANE_W-21,14,'#ffcf3a');
        holdLabels.push({x:x+LANE_W/2-2,y:Math.round(yh)+5}); }
      if(act){
        const gx=LANE_X0+n.reqLane*LANE_W+LANE_W/2, pulse=3+Math.sin(G.t/90)*2;
        b.globalAlpha=.9; b.beginPath(); b.arc(gx,HITLINE,11+pulse,0,7);
        b.strokeStyle=n.holding?'#c8ffb0':'#ff9a6a'; b.lineWidth=3; b.stroke(); b.globalAlpha=1;
        const w=94,r=n.score/n.dur;
        px(b,LW/2-w/2-2,HITLINE+50,w+4,9,'#2b1c12');
        px(b,LW/2-w/2,HITLINE+52,w,6,'#3a4650');
        px(b,LW/2-w/2,HITLINE+52,Math.round(w*clamp(r,0,1)),6,'#c8ffb0');
      }
    }
  }
  R_.fx.forEach(f=>{ const a=Math.min(1,f.t/400);
    if(f.kind==='note') noteGlyph(b,Math.round(f.x),Math.round(f.y),'#ffe08a',a);
    else { b.globalAlpha=a; px(b,Math.round(f.x),Math.round(f.y),3,3,'#c8ffb0'); b.globalAlpha=1; } });
  px(b,0,T0,LW,46,'#101820'); px(b,0,T0+46,LW,2,'#2a3a48');   /* header pinned to the top edge */
  drawFluteIcon(b,LW-52,T0+26,1.3);
  if(!R_.done){ px(b,CANCEL.x,CANCEL.y+T0,CANCEL.w,CANCEL.h,'#3a2a2a');
    px(b,CANCEL.x+2,CANCEL.y+T0+2,CANCEL.w-4,CANCEL.h-4,'#c9a08a'); }
  let liveHold=null;
  for(const n of R_.chart.notes) if(n.type==='hold'&&R_.time>=n.t&&R_.time<=n.t+n.dur) liveHold=n;
  if(R_.done){
    b.globalAlpha=.86; px(b,0,T0,LW,TH,'#0d1410'); b.globalAlpha=1;
    panel(36,150,288,180);
    if(R_.frogT>0){ const bo=Math.abs(Math.sin(G.t/220))*6;
      drawFrog(b,168,292-bo,G.t,2);
      for(let i=0;i<3;i++){ const a=G.t/300+i*2.1;
        noteGlyph(b,Math.round(178+Math.cos(a)*33),Math.round(292-bo-6+Math.sin(a)*14),'#ffe08a',1); } }
  }
  blit();
  holdLabels.forEach(h=>T("HOLD",h.x,h.y,20,'#2b1c12','center',true));
  if(liveHold&&!liveHold.holding){
    const gx=LANE_X0+liveHold.reqLane*LANE_W+LANE_W/2;
    T("slide here",gx,HITLINE+38,22,'#ff9a6a','center',true);
  }
  R_.pop.forEach(p=>{ m.globalAlpha=Math.min(1,p.t/300);
    T(p.txt,p.x,HITLINE-42-(700-p.t)/16,28,p.c,'center',true); m.globalAlpha=1; });
  T(R_.battle?R_.battle.name:("Growing "+SPECIES[R_.plot.sp].name),9,T0+19,26,'#f0e6d2');
  T("Combo "+R_.combo+"    Max "+R_.maxcombo+"    P"+R_.perfect+" G"+R_.good+" M"+R_.miss,
    9,T0+37,20,'#e8c34a');
  T(FLUTE_INFO[G.flute||'recorder'].name,LW-52,T0+44,15,'#9fb2c6','center');
  if(!R_.done) T("✕  Stop",CANCEL.x+CANCEL.w/2,CANCEL.y+T0+18,20,'#3a2a1a','center',true);
  /* the count-in, and which key plays which lane until the first note arrives */
  const cb=countBeat();
  if(!R_.done&&cb<COUNT_BEATS){
    if(!IS_TOUCH) "HJKL".split('').forEach((ch,i)=>T(ch,LANE_X0+i*LANE_W+LANE_W/2-2,HITLINE+34,26,'#f7f0dc','center',true));
    if(cb<0) T("Get ready...",LW/2,210,34,'#f7f0dc','center',true);
    else {
      const f=(R_.time-R_.count.start)/R_.count.beat-cb;          /* 0..1 through this beat */
      m.globalAlpha=clamp(1.25-f,0,1);
      T(COUNT_WORDS[cb],LW/2,225,Math.round(96-f*26),cb===COUNT_BEATS-1?'#ffe08a':'#f7f0dc','center',true);
      m.globalAlpha=1;
    }
  }
  if(R_.done){
    const acc=rhythmAcc();
    const rank=acc>0.93?'S':acc>0.8?'A':acc>0.62?'B':acc>0.4?'C':'D';
    T("Song Complete",180,183,34,'#3a2a1a','center',true);
    T("Accuracy   "+Math.round(acc*100)+"%",180,213,26,'#3a2a1a','center');
    T("Max combo   "+R_.maxcombo,180,236,26,'#3a2a1a','center');
    T(rank,180,275,52,rank==='S'?'#c9701c':'#8a6a3a','center',true);
    if(rank==='S') T("the frogs approve!",180,320,22,'#5a7a3a','center',true);
    else T("tap to continue",180,315,22,'#7a6a4a','center');
  }
}
