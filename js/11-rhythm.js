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
/* A song with its own recordings: all of its flute notes, on the lanes worked out when
   it was built, starting a moment before the first note. */
/* A held note slides along its path: [ms into the note, lane] points with straight lines
   between them (without one, from its lane to its end lane). slideAt gives the lane, as
   a fraction, that many ms in. */
const holdPath=n=>n.path||(n.path=[[0,n.lane],[n.dur,n.endLane]]);
function slideAt(n,ms){ const P=holdPath(n);
  if(ms<=P[0][0]) return P[0][1];
  for(let i=1;i<P.length;i++) if(ms<=P[i][0]){ const [a,la]=P[i-1],[z,lz]=P[i];
    return z>a?la+(lz-la)*(ms-a)/(z-a):lz; }
  return P[P.length-1][1]; }
/* How long a song's held note lasts in the game (ms), or 0 if it's a tap: it lets go a
   moment (160 ms) before a note comes in the lane its slide is in by then, so there's
   time to press that lane again, and must still be 300 ms long. A slide that leads from
   another lane into the next note's lane runs right up to it, as it always has. (The
   song editor, tools/song-editor.html, works this out the same way to warn about it.) */
function songHoldDur(N,i){
  const n=N[i]; if(n.d<0.42) return 0;
  const endLane=n.e!=null?n.e:i<N.length-1?N[i+1].l:n.l;
  const P=[[0,n.l]].concat((n.b||[]).filter(q=>q[0]<n.d),[[n.d,endLane]]);
  const laneAt=s=>{ for(let j=1;j<P.length;j++) if(s<=P[j][0]){ const [a,la]=P[j-1],[z,lz]=P[j];
    return Math.round(z>a?la+(lz-la)*(s-a)/(z-a):lz); } return endLane; };
  let dur=n.d*1000;
  for(let j=i+1;j<N.length&&N[j].t<n.t+n.d+0.16;j++){
    if(j===i+1&&N[j].l===endLane&&endLane!==n.l) continue;      /* the note it slides into */
    if(laneAt(Math.min(N[j].t-n.t,n.d))===N[j].l) dur=Math.min(dur,(N[j].t-n.t)*1000-160); }
  return dur>=300?dur:0;
}
function songChart(D){
  const off=Math.max(0,D.n[0].t-2.2);
  const notes=D.n.map((n,i)=>{
    const aStart=n.t, aEnd=n.t+n.d, t=(aStart-off)*1000, nx=D.n[Math.min(D.n.length-1,i+1)];
    const dur=songHoldDur(D.n,i);
    if(dur){
      /* its slide: from its lane, through any bends set in the song editor, to its end lane
         (the next note's lane unless the editor says otherwise; the last note stays in its own) */
      const endLane=n.e!=null?n.e:i<D.n.length-1?nx.l:n.l;
      const path=[[0,n.l]].concat((n.b||[]).filter(q=>q[0]*1000<dur-20).map(q=>[q[0]*1000,q[1]]),[[dur,endLane]]);
      return {t,lane:n.l,semi:n.s,type:'hold',dur,endLane,path,done:false,score:0,reqLane:n.l,aStart,aEnd}; }
    return {t,lane:n.l,semi:n.s,type:'tap',done:false,aStart,aEnd};
  });
  /* the count-in keeps the song's own beat (doubled or halved into a comfortable pace) */
  let beat=60000/(D.bpm||100); while(beat<450) beat*=2; while(beat>750) beat/=2;
  return {notes,end:(D.len-off)*1000+600,offset:off,stem:true,beat,bpm:60000/beat};
}
/* which song a rhythm game plays: the crop's, the battle song's, or the practice piece */
const BATTLE_SONG={sprout:'sprout',lull:'lullaby',waltz:'waltz',req:'requiem',thorn:'nocturne',hymn:'hymn'};
const songKey=(plot,bc)=>bc?bc.song:plot&&plot.sp;
function startStemPlayback(chart,leadMs){
  const SB=chart.bufs;                     /* the song's own recordings */
  const t0=AC.currentTime+leadMs/1000;     /* song time 0 lands after the count-in */
  const bs=AC.createBufferSource(); bs.buffer=SB.backing;
  const bg=AC.createGain(); bg.gain.value=0.8;
  bs.connect(bg); bg.connect(songGain);
  const fs=AC.createBufferSource(); fs.buffer=SB.flute;
  const fg=AC.createGain(); fg.gain.value=1;
  fs.connect(fg); fg.connect(songGain);
  bs.start(t0,chart.offset); fs.start(t0,chart.offset);
  return {t0,bs,fs,fg};
}
function stopStemPlayback(){
  if(!R_||!R_.play) return;
  try{ R_.play.bs.stop(); R_.play.fs.stop(); }catch(e){}
  R_.play=null;
}
/* The flute plays along by default, and a missed note (or a hold let go) is muted until
   it's over. (Opening the flute up on a hit instead clipped the start of every note: a
   phone plays sound a little after the clock says, so a hit in time with what you hear
   comes after the note has begun.) */
function fluteMute(n){
  if(!R_||!R_.play||!AC) return;
  const g=R_.play.fg, now=AC.currentTime, e=R_.play.t0+(n.aEnd-R_.chart.offset);
  if(e<=now+0.02) return;                  /* already over */
  g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value,now);
  g.gain.linearRampToValueAtTime(0.0001,now+0.04);
  g.gain.setValueAtTime(0.0001,e); g.gain.linearRampToValueAtTime(1,e+0.02);
}
/* back on straight away (a hold taken up again) */
function fluteOn(){
  if(!R_||!R_.play||!AC) return;
  const g=R_.play.fg, now=AC.currentTime;
  g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value,now);
  g.gain.linearRampToValueAtTime(1,now+0.02);
}
/* A song's notes come from its own flute recording (SONG_DATA). If its recordings are
   still loading, wait a moment for them; if they can't load, the same notes play on a
   drawn flute over a drawn accompaniment instead. A song not recorded yet gets notes
   from the Grow Little Croppies phrases (makeChart), on the drawn flute. */
const STEM_WAIT=5000;
/* just a stretch of a song (bc.section: [from, to] in seconds; a Pep Rally) */
function songSection(D,sec){
  const [a,z]=sec; return {...D,n:D.n.filter(n=>n.t>=a-0.01&&n.t<z-0.05),len:z};
}
function startRhythm(plot,bc,waited){
  initAudio();
  let D=songData(songKey(plot,bc)); const SB=D&&loadSong(songKey(plot,bc));
  if(D&&bc&&bc.section) D=songSection(D,bc.section);
  if(D&&SB&&!SB.ready&&!SB.failed&&(waited||0)<STEM_WAIT){
    if(!waited&&!bc) say("Tuning the flute...");
    setTimeout(()=>startRhythm(plot,bc,(waited||0)+150),150); return;
  }
  const count=bc?bc.notes:SPECIES[plot.sp].notes;
  const bpm=bc?112:96+G.gardenLv*2;
  const seed=(plot?plot.x*7+plot.y*13:917)+count*31;
  const chart=D?songChart(D):makeChart(bc&&bc.practice?64:count,seed,bc&&bc.practice?100:bpm);
  if(D){ if(SB&&SB.ready) chart.bufs=SB; else chart.stem=false; }    /* hits play a drawn flute instead */
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
  /* (the count-in ticks play now, like the music: on the clock as it is, not as heard) */
  const c=R_.count, t=R_.time+(R_.play&&AC?RHYTHM_LAG:0);
  return t<c.start?-1:Math.min(COUNT_BEATS,Math.floor((t-c.start)/c.beat));
}
/* a hit: a flash and a ring of light on the lane at the hit line, and sparks (gold for a
   perfect, blue for a good), like the battles' */
function hitBurst(lane,perfect){
  const x=LANE_X0+lane*LANE_W+LANE_W/2-1.5, y=HITLINE, col=perfect?'#ffd860':'#8ac8ff';
  glow({x,y,size:perfect?20:15,life:180,col:'#ffffff'});
  glow({x,y,ring:true,r0:5,r1:perfect?30:22,w:perfect?3.5:2.5,life:340,col});
  for(let i=0;i<(perfect?10:6);i++){ const a=-Math.PI*rnd(0.05,0.95), sp=rnd(0.08,0.22);
    glow({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,drag:0.06,g:0.0004,size:rnd(2.4,3.8),life:rnd(320,520),col,streak:true}); }
}
function spawnFx(lane,kind){
  R_.fx.push({x:LANE_X0+lane*LANE_W+LANE_W/2+rnd(-14,14),y:HITLINE-9,
    vy:rnd(-0.082,-0.045),vx:rnd(-0.018,0.018),t:900,kind});
}
function laneDown(lane){
  if(!R_)return;
  R_.press[lane]=1; R_.flash[lane]=200;
  let best=null,bd=1e9; const now=R_.play&&AC?songNow():R_.time;   /* (the moment of the press, not the last frame) */
  for(const n of R_.chart.notes){ if(n.done||n.lane!==lane)continue;
    const d=Math.abs(n.t-now); if(d<bd){bd=d;best=n;} }
  if(best&&bd<170){
    if(best.type==='tap'){
      best.done=true; const perfect=bd<60;
      if(perfect){ R_.perfect++; R_.shine=180; spawnFx(lane,'note'); spawnFx(lane,'note'); }
      else R_.good++;
      R_.combo++; R_.maxcombo=Math.max(R_.maxcombo,R_.combo); hitBurst(lane,perfect);
      R_.pop.push({t:650,txt:perfect?'PERFECT':'GOOD',x:LANE_X0+lane*LANE_W+LANE_W/2,
        c:perfect?'#ffe08a':'#a8e0ff'});
      if(!R_.chart.stem&&AC) flute(best.semi,AC.currentTime,.5,.85);   /* (the recorded flute is already playing) */
    } else if(!R_.chart.stem&&AC) flute(best.semi,AC.currentTime,Math.min(2.4,best.dur/1000),.7);
  } else if(bd>400&&countBeat()>=COUNT_BEATS) blip(150,0.05,0.1);   /* free practice during the count-in */
}
function laneUp(l){ if(R_) R_.press[l]=0; }
const CANCEL={x:LW-64,y:52,w:58,h:26};
function cancelRhythm(){
  if(!R_) return;
  stopStemPlayback();
  const bc=R_.battle;
  if(musicGain) musicGain.gain.value=0.34;
  if(bc&&bc.practice){ R_=null; G.scene='world'; setMusic(areaMusic()); say(bc.free||bc.test?"You put the flute down.":"You put the flute down. (Play for EXP again any time today.)"); return; }
  R_=null;
  if(bc&&bc.pep){                           /* a Pep Rally stopped: the meter stays full, and the round goes on */
    G.pep=PEP_MAX; G.scene='battle'; setMusic(B&&B.boss?'boss':'battle');
    if(B){ B.log="Kaitlyn saves the rally for later."; setTimeout(nextActor,600); }
    return; }
  if(bc){                                   /* give the Music Points back */
    G.player.mp=Math.min(maxMp(),G.player.mp+(bc.mp||0));
    G.scene='battle'; if(B){ B.turn='player'; B.log="Kaitlyn lowers the flute."; }
    setMusic(B&&B.boss?'boss':'battle');
  } else {
    G.scene='world'; setMusic(areaMusic()); say("Song cancelled.");
  }
}
function rhythmTouch(x,y,id){
  if(R_&&R_.done){ if(R_.stamped) finishRhythm(); return; }    /* (once the rating is stamped on) */
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
  if(R_&&R_.done){ if(R_.stamped) finishRhythm(); return; }
  if(k==='escape'){ cancelRhythm(); return; }   /* H is a lane here, so only Esc stops */
  if(k in KEYLANE) laneDown(KEYLANE[k]);
}
function updateRhythm(dt){
  if(!R_)return;
  if(R_.play&&AC) R_.time=songNow();
  else R_.time+=dt;
  /* song test autoplay: press each note right on time (and hold the long ones) */
  if(songAuto&&R_.battle&&R_.battle.test&&!R_.done) for(const n of R_.chart.notes)
    if(!n.done&&!n.auto&&n.t<=R_.time){ n.auto=1; const L=n.lane; laneDown(L);
      if(n.type==='hold') n.autoL=L; else setTimeout(()=>laneUp(L),60); }   /* a hold's finger follows its slide, below */
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
      if(R_.time-n.t>170){ n.done=true; R_.miss++; R_.combo=0; if(R_.chart.stem) fluteMute(n);
        R_.pop.push({t:520,txt:'MISS',x:LANE_X0+n.lane*LANE_W+LANE_W/2,c:'#ff8a8a'}); }
    } else {
      if(R_.time>=n.t&&R_.time<=n.t+n.dur){
        const ms=R_.time-n.t, pos=slideAt(n,ms);
        n.reqLane=clamp(Math.round(pos),0,LANES-1);
        /* autoplay's finger follows the slide (pressing again each frame: a hold ending as
           this one starts lets go of the lane they share) */
        if(n.autoL!=null){ if(n.autoL!==n.reqLane){ R_.press[n.autoL]=0; n.autoL=n.reqLane; } R_.press[n.reqLane]=1; }
        /* held in the lane the slide is on, either lane while it's between two, or the lane
           it left a moment ago (so a trill up a lane and back has to be followed) */
        let ok=false;
        for(let l=0;l<LANES;l++) if(R_.press[l]&&(Math.abs(l-pos)<0.75||Math.abs(l-slideAt(n,ms-150))<0.5)) ok=true;
        /* each bend (a trill's turn) has to be reached: its lane held within 150 ms of it */
        holdPath(n).forEach((q,j)=>{ if(j&&j<n.path.length-1&&Math.abs(ms-q[0])<=150&&R_.press[q[1]]) (n.bent=n.bent||{})[j]=1; });
        n.holding=ok;
        if(ok){ n.score+=dt; if(Math.random()<dt/90) spawnFx(n.reqLane,'spark'); }
        /* not held (a moment's grace to get there): the flute goes quiet until it's held again */
        if(R_.chart.stem){
          if(!ok&&ms>170&&!n.muted){ n.muted=true; fluteMute(n); }
          else if(ok&&n.muted){ n.muted=false; fluteOn(); } }
      }
      if(R_.time>n.t+n.dur){
        n.done=true; if(n.autoL!=null){ R_.press[n.autoL]=0; n.autoL=null; }
        const ratio=n.score/n.dur, lx=LANE_X0+n.endLane*LANE_W+LANE_W/2;
        const bends=holdPath(n).length-2, missedBend=Object.keys(n.bent||{}).length<bends;
        if(ratio>0.55&&!missedBend){ R_.perfect++; R_.combo++; R_.maxcombo=Math.max(R_.maxcombo,R_.combo);
          R_.pop.push({t:700,txt:'LEGATO!',x:lx,c:'#c8ffb0'});
          spawnFx(n.endLane,'note'); spawnFx(n.endLane,'note'); spawnFx(n.endLane,'note'); }
        else if(ratio>0.22){ R_.good++; R_.combo++; R_.pop.push({t:520,txt:'GOOD',x:lx,c:'#a8e0ff'}); }
        else { R_.miss++; R_.combo=0; R_.pop.push({t:520,txt:'MISS',x:lx,c:'#ff8a8a'}); }
      }
    }
  }
  if(R_.done&&!R_.stamped&&R_.time-R_.doneAt>=STAMP_MS){ R_.stamped=true; stampThump(); }
  if(!R_.done&&R_.time>R_.chart.end){ R_.done=true; R_.doneAt=R_.time;
    if(rhythmAcc()>0.93){ R_.frogT=4000; if(AC){flute(21,AC.currentTime,.4,.7);
      flute(26,AC.currentTime+.14,.5,.7); flute(30,AC.currentTime+.28,.8,.7);} } }
}
/* the rating: blank for STAMP_MS after the song, then stamped on */
const STAMP_MS=1000, STAMP_IN=170;
function stampThump(){
  sfx('stamp')>0||(()=>{ if(!AC) return; const t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain();
    o.type='sine'; o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(55,t+0.14);
    g.gain.setValueAtTime(0.45,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t+0.22);
    const nz=AC.createBufferSource(), f=AC.createBiquadFilter(), ng=AC.createGain(); nz.buffer=noiseBuf; f.type='lowpass'; f.frequency.value=900;
    ng.gain.setValueAtTime(0.25,t); ng.gain.exponentialRampToValueAtTime(0.001,t+0.08); nz.connect(f); f.connect(ng); ng.connect(sfxGain); nz.start(t); nz.stop(t+0.1); })();
}
const accRank=acc=>acc>0.93?'S':acc>0.8?'A':acc>0.62?'B':acc>0.4?'C':'D';
const rhythmAcc=()=>{ const tot=R_.perfect+R_.good+R_.miss||1;
  return (R_.perfect+R_.good*0.55)/tot; };
function finishRhythm(){
  stopStemPlayback();
  const acc=rhythmAcc();
  setMusic(B?(B.boss?'boss':'battle'):areaMusic());
  if(R_.battle){ const cb=R_.battle.cb, combo=R_.maxcombo; R_=null; cb(acc,combo); return; }
  const plot=R_.plot,S=SPECIES[plot.sp];
  plot.sungDay=G.day;
  const h=harmony(), mul=(gearOn('can')?1.25:1)*(yardOn('bath')?1.1:1)*(plot.raised?1.3:1);
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
/* at the foot of each lane, when she's singing to a plant: the crop in a patch of soil
   (the garden's), growing with the combo (its sprout, young and mature pictures, or a
   drawn sprout). Nothing there for other songs. */
function rhythmPlant(c,x,base,grow,pulse){
  const sp=R_&&R_.plot&&R_.plot.sp;
  if(!sp) return;
  const h=9+Math.round(grow*26)+(pulse?2:0);
  drawSoil(c,x,base+3);
  if(cropsReady()){
    const key=grow<0.34?'sprout':(grow<0.7?'baby ':'mature ')+SPECIES[sp].name.toLowerCase(), a=CROP_ART[key];
    if(a){ const tall=(grow<0.34?18:grow<0.7?30:40)+(pulse?2:0);
      if(drawCropArt(c,key,x,base+3,tall*SC/a.ay)) return; } }
  px(c,x-2,base-h,3,h,'#4a8a3e');
  for(let i=5;i<h;i+=6){
    px(c,x-2-Math.min(8,i/2),base-i,6,3,'#5fae4c');
    px(c,x+2,base-i-3,6,3,'#5fae4c');
  }
  if(grow>0.35){ px(c,x-4,base-h-4,7,7,pulse?'#ffe08a':'#e8c34a'); px(c,x-2,base-h-2,3,3,'#fff3c0'); }
  if(grow>0.7){ px(c,x-9,base-h+7,5,5,'#e8433f'); px(c,x+6,base-h+11,5,5,'#e8433f'); }
}
/* the painted background (rhythm/background) and note gems (rhythm/notes), when there */
let RHY_BG=null, RHY_GEMS=null;
function rhythmArt(){
  if(!RHY_BG&&typeof RHYTHM_BG!=='undefined'&&RHYTHM_BG){ RHY_BG=new Image(); RHY_BG.src='assets/scenes/rhythm_bg.jpg'; }
  if(!RHY_GEMS&&typeof NOTE_ART!=='undefined'&&NOTE_ART.length){ RHY_GEMS=new Image(); RHY_GEMS.src='assets/sprites/notes.png'; }
  const ok=im=>im&&im.complete&&im.naturalWidth?im:null;
  return {bg:ok(RHY_BG),gems:ok(RHY_GEMS)};
}
/* the painted flute and vine (rhythm/flute, rhythm/vine: RHYTHM_PICS), once loaded */
const RHY_PIC={}, RVINE_H=150;          /* each copy of the vine this tall (logical px) */
function rhythmPic(k){
  if(typeof RHYTHM_PICS==='undefined'||!RHYTHM_PICS.includes(k)) return null;
  if(!RHY_PIC[k]){ RHY_PIC[k]=new Image(); RHY_PIC[k].src='assets/sprites/rhythm_'+k+'.png'; }
  return RHY_PIC[k].complete&&RHY_PIC[k].naturalWidth?RHY_PIC[k]:null;
}
/* a lane's gem, size px across, centred on x,y */
function drawGem(gems,lane,x,y,size){
  const [sx,sy,w,h]=NOTE_ART[lane%NOTE_ART.length], k=size/Math.max(w,h);
  b.save(); b.imageSmoothingEnabled=true; b.drawImage(gems,sx,sy,w,h,x-w*k/2,y-h*k/2,w*k,h*k); b.restore();
}
/* ---------- held notes: a ribbon of light in the gems' colours, flowing lane to lane ---------- */
const HOLD_COL=[[[102,214,60],[34,104,26]],[[244,185,35],[150,88,12]],[[240,85,159],[150,28,98]],[[63,184,238],[20,88,150]]];
const laneCx=l=>LANE_X0+l*LANE_W+LANE_W/2-1.5;
/* the colour at a fractional lane, blended between the two lanes' gems */
function holdColour(lane,shade){ const i=clamp(Math.floor(lane),0,LANES-1), j=Math.min(LANES-1,i+1), k=clamp(lane-i,0,1),
  A=HOLD_COL[i][shade], Z=HOLD_COL[j][shade];
  return 'rgb('+A.map((v,c)=>Math.round(v+(Z[c]-v)*k)).join(',')+')'; }
/* where the ribbon is drawn, ms into the note: the slide's path with each stretch eased, so
   it curves away from one lane and settles into the next */
function ribbonLane(n,ms){ const P=holdPath(n);
  if(ms<=P[0][0]) return P[0][1];
  for(let i=1;i<P.length;i++) if(ms<=P[i][0]){ const [a,la]=P[i-1],[z,lz]=P[i], k=z>a?(ms-a)/(z-a):1;
    return la+(lz-la)*k*k*(3-2*k); }
  return P[P.length-1][1]; }
function drawHold(n,art,T0){
  const yOf=ms=>HITLINE-((n.t+ms-R_.time)/FALL)*HITLINE;
  const act=R_.time>=n.t, now=R_.time-n.t, bright=!act||n.holding;
  /* what's left to play, as far as the top of the screen */
  const ms0=Math.max(0,now), ms1=Math.min(n.dur,now+(HITLINE-T0+40)/HITLINE*FALL), pts=[];
  const gem=(lane,x,y,size,a)=>{ b.globalAlpha=a;
    if(art.gems) drawGem(art.gems,lane,x,y,size);
    else { b.fillStyle=holdColour(lane,0); b.beginPath(); b.arc(x,y,size/2,0,7); b.fill(); }
    b.globalAlpha=1; };
  if(ms1>ms0){
    for(let ms=ms0;;ms+=14){ const at=Math.min(ms,ms1); pts.push([laneCx(ribbonLane(n,at)),yOf(at),at]); if(at>=ms1) break; }
    const ramp=shade=>{ const g=b.createLinearGradient(0,pts[0][1],0,pts[pts.length-1][1]||pts[0][1]-1), N=Math.min(16,pts.length-1)||1;
      for(let i=0;i<=N;i++){ const k=i/N, p=pts[Math.round(k*(pts.length-1))]; g.addColorStop(k,holdColour(ribbonLane(n,p[2]),shade)); }
      return g; };
    const stroke=(w,style,a)=>{ b.globalAlpha=a; b.lineWidth=w; b.strokeStyle=style; b.beginPath();
      pts.forEach(([x,y],i)=>i?b.lineTo(x,y):b.moveTo(x,y)); b.stroke(); b.globalAlpha=1; };
    b.save(); b.lineCap='round'; b.lineJoin='round';
    const pulse=Math.sin(G.t/110);
    b.globalCompositeOperation='lighter';
    stroke(act&&n.holding?36+pulse*3:28,ramp(0),act&&n.holding?.34:bright?.2:.08);
    b.globalCompositeOperation='source-over';
    stroke(21,ramp(1),bright?.85:.45);
    stroke(16,ramp(0),bright?.96:.4);
    stroke(6,'#ffffff',act&&n.holding?.85:bright?.5:.16);
    /* little lights flowing down it */
    if(bright){ const gap=170, drift=G.t*.11;
      for(let i=0;i<Math.ceil(n.dur/gap);i++){ const ms=((i*gap-drift)%n.dur+n.dur)%n.dur; if(ms<ms0||ms>ms1) continue;
        b.globalAlpha=.9*Math.min(1,Math.min(ms-ms0,ms1-ms)/50); b.fillStyle='#ffffff';
        b.beginPath(); b.arc(laneCx(ribbonLane(n,ms)),yOf(ms),2.1,0,7); b.fill(); }
      b.globalAlpha=1; }
    b.restore();
    /* small gems where it bends and where it ends, so you can see where it's going */
    const P=holdPath(n);
    for(let i=1;i<P.length-1;i++) if(P[i][0]>ms0&&P[i][0]<=ms1) gem(P[i][1],laneCx(P[i][1]),yOf(P[i][0]),20,bright?1:.5);
    if(n.dur<=ms1) gem(n.endLane,laneCx(n.endLane),yOf(n.dur),20,bright?1:.5);
  }
  if(!act){ const y=yOf(0); if(y>T0-20) gem(n.lane,laneCx(n.lane),y,36,1); return; }
  /* being played: its gem rides along the flute, with a ring showing how much is held */
  const x=laneCx(ribbonLane(n,now));
  if(n.holding){ b.save(); b.globalCompositeOperation='lighter';
    const r=36+Math.sin(G.t/90)*4, g=b.createRadialGradient(x,HITLINE,4,x,HITLINE,r);
    g.addColorStop(0,'rgba(255,250,220,.75)'); g.addColorStop(.45,holdColour(ribbonLane(n,now),0).replace('rgb','rgba').replace(')',',.4)')); g.addColorStop(1,'rgba(0,0,0,0)');
    b.fillStyle=g; b.beginPath(); b.arc(x,HITLINE,r,0,7); b.fill(); b.restore(); }
  gem(n.reqLane,x,HITLINE,36,n.holding?1:.6);
  b.save(); b.lineCap='round';
  b.globalAlpha=.6; b.strokeStyle='#14101e'; b.lineWidth=5; b.beginPath(); b.arc(x,HITLINE,23,0,7); b.stroke(); b.globalAlpha=1;
  b.strokeStyle=n.holding?'#fff3b0':'#ff9a6a'; b.lineWidth=3.5; b.beginPath();
  b.arc(x,HITLINE,23,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(n.score/n.dur,0,1)+.001); b.stroke();
  b.restore();
}
/* the carved wooden rail down a margin, x to x+RAIL_W: the painted pillar (rhythm/rail),
   whole pillars stacked end to end from the bottom, with a soft shadow over the lanes */
const RAIL_W=21;
function drawWoodRail(x,T0,T1,right){
  const im=rhythmPic('rail');
  if(im){ const h=RAIL_W*im.naturalHeight/im.naturalWidth;
    b.save(); b.beginPath(); b.rect(x,T0,RAIL_W,T1-T0); b.clip(); b.imageSmoothingEnabled=true;
    for(let y=T1;y>T0;y-=h) b.drawImage(im,x,y-h,RAIL_W,h);
    b.restore(); }
  const sh=b.createLinearGradient(right?x:x+RAIL_W,0,right?x-5:x+RAIL_W+5,0); sh.addColorStop(0,'rgba(0,0,0,.35)'); sh.addColorStop(1,'rgba(0,0,0,0)');
  b.fillStyle=sh; b.fillRect(right?x-5:x+RAIL_W,T0,5,T1-T0);
}
/* the painted ink stamp (rhythm/stamp), in a rank's colour: made once per colour */
const STAMP_TINT={};
function stampTinted(col){
  const im=rhythmPic('stamp'); if(!im) return null;
  if(!STAMP_TINT[col]){ const c=document.createElement('canvas'); c.width=im.naturalWidth; c.height=im.naturalHeight;
    const x=c.getContext('2d'); x.drawImage(im,0,0); x.globalCompositeOperation='source-in'; x.fillStyle=col; x.fillRect(0,0,c.width,c.height);
    STAMP_TINT[col]=c; }
  return STAMP_TINT[col];
}
/* the rating, stamped on like an ink stamp (scale and tilt as it lands), rank's colour */
const STAMP_SIZE=62;
function drawStamp(rank,x,y){
  const t=R_.time-R_.doneAt-STAMP_MS; if(t<0) return;
  const q=Math.min(1,t/STAMP_IN), sc=1+(1-q)*(1-q)*1.6, col=rank==='S'?'#e8b030':rank==='A'?'#d84a3a':rank==='B'?'#4a88d8':'#7a8a9a';
  b.save(); b.translate(x,y); b.rotate(-0.16); b.scale(sc,sc); b.globalAlpha=Math.min(1,q*1.4);
  const st=stampTinted(col);
  if(st){ const h=STAMP_SIZE*st.height/st.width; b.imageSmoothingEnabled=true; b.drawImage(st,-STAMP_SIZE/2,-h/2,STAMP_SIZE,h); }
  b.fillStyle=col; b.font='bold 40px Verdana'; b.textAlign='center'; b.textBaseline='middle'; b.fillText(rank,0,2);
  b.restore(); b.globalAlpha=1;
  if(q>=1&&!R_.stampPuff){ R_.stampPuff=true; glow({x,y,ring:true,r0:24,r1:52,w:3,life:380,col});
    for(let i=0;i<10;i++){ const a=rnd(0,TAU); glow({x:x+Math.cos(a)*30,y:y+Math.sin(a)*30,vx:Math.cos(a)*0.08,vy:Math.sin(a)*0.08,drag:0.1,size:rnd(2.4,3.6),life:rnd(300,500),col}); } }
}
function drawRhythm(){
  const grow=clamp(R_.combo/14,0,1), art=rhythmArt();
  const T0=BAND_TOP(), T1=BAND_BOT(), TH=T1-T0;     /* the full screen, on tall phones too */
  if(art.bg){
    const im=art.bg, r=im.naturalWidth/im.naturalHeight, h=Math.max(TH,LW/r), w=h*r;
    b.save(); b.imageSmoothingEnabled=true; b.drawImage(im,(LW-w)/2,T0+(TH-h)/2,w,h); b.restore();
    b.globalAlpha=.18; px(b,0,T0,LW,TH,'#0a1020'); b.globalAlpha=1;
  } else px(b,0,T0,LW,TH,'#000');                                  /* (still loading) */
  /* the lanes: see-through rails over the painted background */
  for(let i=0;i<LANES;i++){ const x=LANE_X0+i*LANE_W;
    b.globalAlpha=.34; px(b,x,T0,LANE_W-3,TH,(i%2)?'#1e2731':'#222c37'); b.globalAlpha=1;
    b.globalAlpha=.35; px(b,x,T0,1,TH,'#fff6d8'); px(b,x+LANE_W-4,T0,1,TH,'#fff6d8'); b.globalAlpha=1;
    if(R_.flash[i]>0){ b.globalAlpha=R_.flash[i]/500; px(b,x,T0,LANE_W-3,TH,'#5ea8d8'); b.globalAlpha=1; } }
  /* carved wooden frame down both margins */
  for(const fx of [0,LW-21]) drawWoodRail(fx,T0,T1,fx>0);
  /* vine + leaves climbing the frame, growing with the combo: the painted vine (rhythm/vine),
     copies stacked up each side, uncovered from the bottom */
  const vine=rhythmPic('vine');
  if(vine){ const h=LH*(0.25+grow*0.75), vh=RVINE_H, vw=vh*vine.naturalWidth/vine.naturalHeight;
    b.save(); b.beginPath(); b.rect(0,LH-h,LW,h); b.clip(); b.imageSmoothingEnabled=true;
    for(const [cx,flip] of [[10,1],[LW-10,-1]]){
      for(let i=0,y=LH;y>T0-vh;i++,y-=vh*0.92){                  /* a little overlap, every other one mirrored */
        b.save(); b.translate(cx,y); b.scale(flip*(i%2?-1:1),1); b.drawImage(vine,-vw/2,-vh,vw,vh); b.restore(); } }
    b.restore(); }
  if(R_.shine>0){ b.globalAlpha=R_.shine/900; px(b,0,0,LW,LH,'#ffe08a'); b.globalAlpha=1; }
  /* the hit line is a flute: the painted one (rhythm/flute) with a finger hole over each lane
     that lights up as it's played */
  const fl=rhythmPic('flute');
  if(fl){ const w=LW-12, h=w*fl.naturalHeight/fl.naturalWidth;
    b.globalAlpha=.35; px(b,8,HITLINE+h/2-2,LW-16,6,'#101820'); b.globalAlpha=1;
    b.save(); b.imageSmoothingEnabled=true; b.drawImage(fl,6,HITLINE-h/2,w,h); b.restore();
    for(let i=0;i<LANES;i++){ const x=LANE_X0+i*LANE_W+LANE_W/2-1.5, on=R_.press[i];
      b.fillStyle='rgba(40,22,8,.9)'; b.beginPath(); b.arc(x,HITLINE,7.5,0,7); b.fill();
      b.strokeStyle=on?'#ffe08a':'rgba(214,176,96,.9)'; b.lineWidth=on?2.4:1.6; b.beginPath(); b.arc(x,HITLINE,7.5,0,7); b.stroke();
      if(on){ b.fillStyle='#fff3b0'; b.beginPath(); b.arc(x,HITLINE,4.5,0,7); b.fill();
        b.globalAlpha=.5; px(b,LANE_X0+i*LANE_W,T0,LANE_W-3,TH,'#ffe08a'); b.globalAlpha=1; } }
  }
  for(let i=0;i<LANES;i++) rhythmPlant(b,LANE_X0+i*LANE_W+LANE_W/2,LH-26,grow,R_.flash[i]>60);
  for(const n of R_.chart.notes){
    if(n.done) continue;
    if(n.type==='tap'){
      const y=HITLINE-((n.t-R_.time)/FALL)*HITLINE;
      if(y<T0-20||y>T1)continue;
      const x=LANE_X0+n.lane*LANE_W;
      if(art.gems) drawGem(art.gems,n.lane,x+LANE_W/2-1.5,y,30);
    } else if(HITLINE-((n.t-R_.time)/FALL)*HITLINE>T0-40) drawHold(n,art,T0);
  }
  R_.fx.forEach(f=>{ const a=Math.min(1,f.t/400);
    if(f.kind==='note'){ glowAt(f.x,f.y-2,9,'#ffd860',a*0.6); noteGlyph(b,Math.round(f.x),Math.round(f.y),'#ffe08a',a); }
    else glowAt(f.x,f.y,4,'#c8ffb0',a); });
  if(!R_.done) drawSceneGlow(16);          /* (once the song's over, over the rating panel instead) */
  px(b,0,T0,LW,46,'#101820'); px(b,0,T0+46,LW,2,'#2a3a48');   /* header pinned to the top edge */
  drawFluteIcon(b,LW-52,T0+26,1.3);
  if(!R_.done) rpgWin({x:CANCEL.x,y:CANCEL.y+T0,w:CANCEL.w,h:CANCEL.h});
  let liveHold=null;
  for(const n of R_.chart.notes) if(n.type==='hold'&&R_.time>=n.t&&R_.time<=n.t+n.dur) liveHold=n;
  if(R_.done){
    b.globalAlpha=.86; px(b,0,T0,LW,TH,'#0d1410'); b.globalAlpha=1;
    panel(36,150,288,180);
    if(R_.frogT>0){ const bo=Math.abs(Math.sin(G.t/220))*6;
      drawFrog(b,74,292-bo,G.t,2);                        /* (to the side of the stamp) */
      for(let i=0;i<3;i++){ const a=G.t/300+i*2.1;
        noteGlyph(b,Math.round(84+Math.cos(a)*28),Math.round(292-bo-6+Math.sin(a)*14),'#ffe08a',1); } }
    const acc=rhythmAcc(); drawStamp(accRank(acc),180,284);
    drawSceneGlow(16);
  }
  blit();
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
  if(!R_.done) TS("✕  Stop",CANCEL.x+CANCEL.w/2,CANCEL.y+T0+18,18,WIN_TXT.title,'center',true);
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
    const rank=accRank(acc);
    TS("Song Complete",180,183,28,WIN_TXT.title,'center',true);
    TS("Accuracy   "+Math.round(acc*100)+"%",180,213,21,WIN_TXT.body,'center');
    TS("Max combo   "+R_.maxcombo,180,236,21,WIN_TXT.body,'center');
    if(R_.stamped&&rank==='S') TS("the frogs approve!",180,327,19,WIN_TXT.good,'center',true);
    else if(R_.stamped) TS("tap to continue",180,327,17,WIN_TXT.dim,'center');
  }
}

/* ---------- rhythm timing (Settings > Rhythm timing) ----------
   Phones and Bluetooth headphones play sound a little after the game asks for it, so a
   player who hits in time with what they hear hits late. RHYTHM_LAG (ms, this device's,
   kept in localStorage like the volume) is taken off the song's clock: notes reach the
   line, and are judged, when they're heard. The calibration plays steady clicks and
   takes the middle of how late the taps land. */
let RHYTHM_LAG=0;
try{ const v=parseFloat(localStorage.getItem('kgs-lag')); if(isFinite(v)) RHYTHM_LAG=clamp(Math.round(v),-200,400); }catch(e){}
function setLag(v){ RHYTHM_LAG=clamp(Math.round(v),-200,400); try{ localStorage.setItem('kgs-lag',String(RHYTHM_LAG)); }catch(e){} }
const songNow=()=>(AC.currentTime-R_.play.t0)*1000-RHYTHM_LAG;
const CAL_BEAT=0.6, CAL_LEAD=4, CAL_N=16;      /* 100 per minute; 4 to settle in, then 16 counted */
let calib=null;
function calibOpen(){
  initAudio(); if(!AC){ say("Sound isn't available here."); return; }
  if(AC.state==='suspended') AC.resume();
  setMusic(null);
  const t0=AC.currentTime+1.2, beats=[];
  for(let i=0;i<CAL_LEAD+CAL_N;i++){ const t=t0+i*CAL_BEAT; beats.push(t); calibClick(t,i<CAL_LEAD); }
  calib={beats,taps:[],flash:0,result:null,was:G.scene}; G.scene='calib';
}
/* a woodblock click on the songs' own volume (the lead-in ones softer) */
function calibClick(t,soft){
  const o=AC.createOscillator(), g=AC.createGain(), f=AC.createBiquadFilter();
  o.type='triangle'; o.frequency.setValueAtTime(soft?900:1250,t); o.frequency.exponentialRampToValueAtTime(soft?600:800,t+0.05);
  f.type='bandpass'; f.frequency.value=1100; f.Q.value=2;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(soft?0.5:0.9,t+0.003); g.gain.exponentialRampToValueAtTime(0.001,t+0.09);
  o.connect(f); f.connect(g); g.connect(songGain||AC.destination); o.start(t); o.stop(t+0.12);
  calibClick.all=(calibClick.all||[]).concat([o]);
}
function calibStopClicks(){ (calibClick.all||[]).forEach(o=>{ try{ o.stop(); }catch(e){} }); calibClick.all=[]; }
function calibTap(){
  const C=calib; if(!C||C.result) return;
  const now=AC.currentTime; C.flash=1;
  let best=-1,bd=1e9; C.beats.forEach((t,i)=>{ const d=Math.abs(now-t); if(d<bd){ bd=d; best=i; } });
  if(best>=CAL_LEAD&&bd<0.35&&!C.taps.some(x=>x.i===best)) C.taps.push({i:best,d:(now-C.beats[best])*1000});
}
function calibFinish(){
  const C=calib, L=C.taps.map(x=>x.d).sort((a,b)=>a-b);
  if(L.length<8){ C.result={ok:false}; return; }
  /* the middle half's average: steady against a stray early or late tap */
  const q=L.slice(Math.floor(L.length/4),Math.ceil(L.length*3/4)), ms=q.reduce((a,b)=>a+b,0)/q.length;
  const spread=Math.sqrt(q.reduce((a,b)=>a+(b-ms)**2,0)/q.length);
  setLag(Math.round(ms/5)*5); C.result={ok:true,ms:RHYTHM_LAG,spread:Math.round(spread)}; sfx('menu_confirm');
}
function calibClose(){ calibStopClicks(); const C=calib; calib=null; G.scene=C?C.was:'sys'; }
function updateCalib(dt){
  const C=calib; if(!C) return;
  if(C.flash>0) C.flash=Math.max(0,C.flash-dt/180);
  if(!C.result&&AC.currentTime>C.beats[C.beats.length-1]+0.5) calibFinish();
}
function calibKey(k){
  const C=calib; if(!C) return;
  if(isBack(k)){ calibClose(); return; }
  if(C.result){ if(isOk(k)) calibOpenAgain(); else if(isLeft(k)||isRight(k)){ setLag(RHYTHM_LAG+(isLeft(k)?-5:5)); C.result.ms=RHYTHM_LAG; C.result.ok=true; } return; }
  calibTap();
}
function calibOpenAgain(){ const was=calib.was; calibStopClicks(); calibOpen(); calib.was=was; }
const CAL_WIN={x:20,y:24,w:LW-40,h:430};
const CAL_BTN={done:{x:LW/2-130,y:CAL_WIN.y+CAL_WIN.h-58,w:120,h:42},again:{x:LW/2+10,y:CAL_WIN.y+CAL_WIN.h-58,w:120,h:42}};
function calibTouch(x,y){
  const C=calib; if(!C) return;
  const inB=B2=>x>B2.x&&x<B2.x+B2.w&&y>B2.y&&y<B2.y+B2.h;
  if(inB(CAL_BTN.done)){ calibClose(); return; }
  if(C.result){ if(inB(CAL_BTN.again)) calibOpenAgain(); return; }
  calibTap();
}
function drawCalib(){
  const C=calib; if(!C) return;
  drawSys(); wipeBuf();
  b.fillStyle='rgba(6,10,26,.72)'; b.fillRect(0,-20,LW,SCREEN_H+40);
  const X=CAL_WIN.x,Y=CAL_WIN.y,W=CAL_WIN.w,H=CAL_WIN.h;
  panel(X,Y,W,H);
  const cx=LW/2, cy=Y+258, now=AC?AC.currentTime:0;
  /* the beat dots: lit when a tap landed on that click */
  const counted=C.beats.length-CAL_LEAD;
  for(let i=0;i<counted;i++){ const bi=i+CAL_LEAD, dx=cx+(i-(counted-1)/2)*16, hit=C.taps.some(t=>t.i===bi), past=now>C.beats[bi];
    b.fillStyle=hit?'#ffe08a':past?'rgba(255,140,140,.6)':'rgba(200,212,255,.25)'; b.beginPath(); b.arc(dx,Y+178,4.5,0,7); b.fill(); }
  /* the ring that pulses on each tap */
  const r=46+C.flash*10;
  b.save(); b.globalCompositeOperation='lighter'; b.strokeStyle='rgba(255,224,138,'+(0.35+C.flash*0.6)+')'; b.lineWidth=4+C.flash*4;
  b.beginPath(); b.arc(cx,cy,r,0,7); b.stroke(); b.restore();
  b.fillStyle='rgba(255,224,138,'+(0.08+C.flash*0.25)+')'; b.beginPath(); b.arc(cx,cy,r-6,0,7); b.fill();
  menuRow(CAL_BTN.done.x,CAL_BTN.done.y,CAL_BTN.done.w,CAL_BTN.done.h,false);
  if(C.result) menuRow(CAL_BTN.again.x,CAL_BTN.again.y,CAL_BTN.again.w,CAL_BTN.again.h,true);
  blit();
  TS("Rhythm timing",cx,Y+34,28,WIN_TXT.title,'center',true);
  if(!C.result){
    const lead=now<C.beats[CAL_LEAD]-0.2;
    TS("Tap along with the clicks.",cx,Y+70,20,WIN_TXT.body,'center');
    TS("Listen rather than watch: tap when you hear each click.",cx,Y+94,15,WIN_TXT.note,'center');
    TS(IS_TOUCH?"Tap anywhere.":"Any key (B to stop).",cx,Y+114,15,WIN_TXT.note,'center');
    TS(lead?"Get ready...":C.taps.length+" / "+counted,cx,Y+146,18,WIN_TXT.mp,'center',true);
    TS(IS_TOUCH?"TAP":"TAP",cx,cy+8,24,WIN_TXT.title,'center',true);
  } else if(!C.result.ok){
    TS("Not enough taps to tell.",cx,Y+76,20,WIN_TXT.bad,'center',true);
    TS("Try again, tapping on every click.",cx,Y+100,16,WIN_TXT.note,'center');
  } else {
    const ms=C.result.ms;
    TS("Saved: "+(ms>0?"+":"")+ms+" ms",cx,Y+76,24,WIN_TXT.good,'center',true);
    TS(ms>=25?"Sound reaches you a little late here; notes now wait for it.":ms<=-25?"You tap a little early; notes now come sooner.":"Right on time.",cx,Y+102,15,WIN_TXT.body,'center');
    TS("Steadiness: "+(C.result.spread<25?"very steady":C.result.spread<50?"steady":"a bit uneven (try again?)"),cx,Y+124,15,WIN_TXT.note,'center');
    TS(IS_TOUCH?"":"◀ ▶ to nudge it by 5 ms",cx,Y+146,15,WIN_TXT.note,'center');
    TS((ms>0?"+":"")+ms,cx,cy+9,26,WIN_TXT.title,'center',true);
  }
  TS("Done",CAL_BTN.done.x+CAL_BTN.done.w/2,CAL_BTN.done.y+26,19,WIN_TXT.title,'center',true);
  if(C.result) TS(IS_TOUCH?"Again":"Again (A)",CAL_BTN.again.x+CAL_BTN.again.w/2,CAL_BTN.again.y+26,19,WIN_TXT.title,'center',true);
}
