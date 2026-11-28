/* ---------- the HD look (Settings > Graphics: in battles and everywhere she walks) ----------
   Camera-like touches over the painted scene, in the spirit of "HD-2D" games, without
   touching the art:
   - depth of field: the far top of the backdrop and its very bottom edge go soft, the
     middle where everyone stands stays sharp (HD_DOF)
   - bloom: the bright parts of the painting glow a little (HD_BLOOM)
   Both are baked once into a copy of the backdrop (hdBackdrop), so they cost nothing per
   frame; the season's copies are made ahead (hdPrebake: at the start, each new day, and
   when a graphics setting changes), so a battle opens with them ready. Then, each frame:
   - a gentle grade, warm at the top and cool at the bottom (HD_GRADE)
   - shafts of sunlight slanting down from the upper left, swaying slowly, as strong as
     the daylight (HD_SHAFTS)
   - motes of dust drifting in the light by day, fireflies blinking at night (HD_MOTES)
   - a soft vignette darkening the corners (HD_VIGNETTE)
   Out of battle (hdField, over the garden, town, mountain and indoors) the light, motes and
   vignette are the same, the sunbeams and motes staying put on the ground as the view
   moves; the depth blur is a tilt-shift blur of the top and bottom of the view, and the
   bloom is worked out each frame from a small copy of the view (cheap: hdSoften). Fishing
   gets the same, its pond blurred at the far top only. */
/* Graphics settings: each effect 0 (off) to 10, kept in this browser like the volume
   (kgs-gfx), not in the save. Level GFX_TUNED is the strength the numbers below were
   tuned at; 10 goes a bit past it. The presets set them all at once. */
const GFX_ITEMS=[['dof',"Depth blur","The far edges of the scene go soft (top and bottom); the middle stays sharp."],
  ['bloom',"Bloom","The brightest parts of the scene glow a little."],
  ['shafts',"Sunbeams","Soft shafts of daylight slanting down."],
  ['motes',"Floating motes","Dust drifting in the light by day, fireflies at night."],
  ['grade',"Colour grade","Warm light up top, cool shade below."],
  ['vignette',"Vignette","Darker corners, to draw the eye to the middle."]];
const GFX_PRESETS={low:0,medium:5,high:8}, GFX_TUNED=7, GFX_DEFAULT='medium';
const GFX={};
GFX_ITEMS.forEach(([k])=>GFX[k]=GFX_PRESETS[GFX_DEFAULT]);
try{ const v=JSON.parse(localStorage.getItem('kgs-gfx')||'{}'); for(const k in GFX) if(v[k]>=0&&v[k]<=10) GFX[k]=Math.round(v[k]); }catch(e){}
const gfxK=k=>GFX[k]/GFX_TUNED;                         /* 1 at the tuned strength */
const HD=()=>GFX_ITEMS.some(([k])=>GFX[k]>0);            /* anything on at all */
let gfxBakeT=0;
function setGfx(k,v){ GFX[k]=clamp(Math.round(v),0,10); try{ localStorage.setItem('kgs-gfx',JSON.stringify(GFX)); }catch(e){}
  clearTimeout(gfxBakeT); gfxBakeT=setTimeout(hdPrebake,250); }        /* (once the presses settle) */
const gfxPreset=()=>{ for(const p in GFX_PRESETS) if(GFX_ITEMS.every(([k])=>GFX[k]===GFX_PRESETS[p])) return p; return 'custom'; };
function gfxApplyPreset(p){ GFX_ITEMS.forEach(([k])=>setGfx(k,GFX_PRESETS[p])); }
const GFX_PRESET_NAME={low:"Low",medium:"Medium",high:"High",custom:"Custom"};
const GFX_PRESET_ABOUT={low:"All the effects off: the plain painted look, and the fastest.",medium:"A touch of everything.",
  high:"The full look. Older phones may slow down.",custom:"Set one by one below."};
/* the rows of the Graphics window (Settings rows, see SETTINGS in 10-menu-pause.js) */
function gfxRows(){
  return [{id:'gpreset',name:"Preset",opts:['low','medium','high'],label:v=>GFX_PRESET_NAME[v],about:v=>GFX_PRESET_ABOUT[v],
    get:()=>gfxPreset(),set:v=>gfxApplyPreset(v)}]
    .concat(GFX_ITEMS.map(([k,name,what])=>({id:'g'+k,name,level:true,opts:[0,1,2,3,4,5,6,7,8,9,10],label:v=>v?String(v):"Off",
      about:v=>what+(v?"":" Off for now."),get:()=>GFX[k],set:v=>setGfx(k,v)})));
}
const HD_DOF={top:[0.45,1,1,0], bot:[0.86,0,1,0.85], px:9};   /* top: fully soft down to that share of the way to the horizon, sharp from that share; bottom: shares of the band */
const HD_BLOOM={from:0.74, gain:0.3, px:7};                   /* brighter than this glows, this much */
const HD_GRADE=0.4, HD_SHAFTS=0.2, HD_MOTES=6.8, HD_VIGNETTE=1.2;   /* (a vignette past 1 is laid on twice) */

const hdCanvas=(w,h)=>{ const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w)); c.height=Math.max(1,Math.round(h)); return c; };
/* (can the canvas blur? Older Safari can't: then a cheaper blur by shrinking) */
const HD_FILTER=(()=>{ try{ const c=hdCanvas(1,1).getContext('2d'); c.filter='blur(2px)'; return c.filter==='blur(2px)'; }catch(e){ return false; } })();
/* src blurred by about px of its own, the same size; the edges are carried outward first
   so the blur doesn't fade to nothing at them */
function hdBlur(src,px){
  const w=src.width, h=src.height, p=Math.ceil(px*2.5), pad=hdCanvas(w+2*p,h+2*p), c=pad.getContext('2d');
  c.drawImage(src,p,p);
  c.drawImage(src,0,0,w,1,p,0,w,p); c.drawImage(src,0,h-1,w,1,p,h+p,w,p);
  c.drawImage(pad,p,0,1,h+2*p,0,0,p,h+2*p); c.drawImage(pad,w+p-1,0,1,h+2*p,w+p,0,p,h+2*p);
  const out=hdCanvas(w,h), o=out.getContext('2d'); o.imageSmoothingEnabled=true;
  if(HD_FILTER){ o.filter='blur('+px+'px)'; o.drawImage(pad,-p,-p); o.filter='none'; return out; }
  const k=Math.max(2,px/1.5), sm=hdCanvas(pad.width/k,pad.height/k), s=sm.getContext('2d');
  s.imageSmoothingEnabled=true; s.drawImage(pad,0,0,sm.width,sm.height);
  o.drawImage(sm,p/k,p/k,w/k,h/k,0,0,w,h); return out;
}
/* the bright parts only (the darker, the less), blurred: laid on as added light */
function hdBloom(src){
  const w=src.width, h=src.height, cv=hdCanvas(w,h), c=cv.getContext('2d',{willReadFrequently:true});
  c.drawImage(src,0,0); const d=c.getImageData(0,0,w,h), a=d.data, T=HD_BLOOM.from;
  for(let i=0;i<a.length;i+=4){ const l=(0.3*a[i]+0.59*a[i+1]+0.11*a[i+2])/255, k=l>T?Math.pow((l-T)/(1-T),1.4):0;
    a[i]*=k; a[i+1]*=k; a[i+2]*=k; a[i+3]=255; }
  c.putImageData(d,0,0); return hdBlur(cv,HD_BLOOM.px);
}
/* the backdrop as placed (im at x,y w x h, in scene px), for the band T0..T1, with its
   depth of field and bloom baked in: worked out once per backdrop and band */
const HD_BACK=new Map(), HD_BACK_MAX=4;                    /* the last few made, newest last */
function hdBackdrop(im,x,y,w,h,T0,T1){
  const key=im.src+'|'+[x,y,w,h,T0,T1].map(v=>v.toFixed(1)).join(',')+'|'+GFX.dof+','+GFX.bloom;
  if(HD_BACK.has(key)) return HD_BACK.get(key);
  const S=SC, W=LW*S, H=(T1-T0)*S, cv=hdCanvas(W,H), c=cv.getContext('2d');
  c.imageSmoothingEnabled=true; c.drawImage(im,x*S,(y-T0)*S,w*S,h*S);
  /* (both worked out at a quarter size: soft things anyway) */
  const q=hdCanvas(W/4,H/4), qc=q.getContext('2d'); qc.imageSmoothingEnabled=true; qc.drawImage(cv,0,0,q.width,q.height);
  const dk=gfxK('dof'), bk=gfxK('bloom'), bloom=bk>0?hdBloom(q):null, soft=dk>0?hdBlur(q,HD_DOF.px*Math.min(1.3,0.4+0.6*dk)):null;
  if(soft){
  /* the soft copy, faded in at the top and bottom only (more of it, the higher the level) */
  const m=hdCanvas(W,H), mc=m.getContext('2d'); mc.imageSmoothingEnabled=true; mc.drawImage(soft,0,0,W,H);
  mc.globalCompositeOperation='destination-in';
  const g=mc.createLinearGradient(0,0,0,H), at=v=>clamp(v,0,1), hz=(HORIZON-T0)/(T1-T0);
  const [a0,s0,a1,s1]=HD_DOF.top.map((v,i)=>i%2?Math.min(1,v*dk):v), [b0,t0,b1,t1]=HD_DOF.bot.map((v,i)=>i%2?Math.min(1,v*dk):v);
  g.addColorStop(0,'rgba(0,0,0,'+s0+')'); g.addColorStop(at(hz*a0),'rgba(0,0,0,'+s0+')'); g.addColorStop(at(hz*a1),'rgba(0,0,0,'+s1+')');
  g.addColorStop(at(b0),'rgba(0,0,0,'+t0+')'); g.addColorStop(at(b1),'rgba(0,0,0,'+t1+')');
  mc.fillStyle=g; mc.fillRect(0,0,W,H);
  c.drawImage(m,0,0); }
  if(bloom){ c.globalCompositeOperation='lighter'; c.globalAlpha=HD_BLOOM.gain*bk; c.drawImage(bloom,0,0,W,H); }
  c.globalCompositeOperation='source-over'; c.globalAlpha=1;
  try{ b.drawImage(cv,0,0,1,1); }catch(e){}      /* (drawn once, tiny, so the browser has it uploaded before a fight needs it) */
  HD_BACK.set(key,cv); while(HD_BACK.size>HD_BACK_MAX) HD_BACK.delete(HD_BACK.keys().next().value);
  return cv;
}
/* the band a battle will have (BAND_TOP and BAND_BOT as they are during one), from outside it */
function battleBand(){ const off=IS_TOUCH?Math.max(0,(EXTRA-DECK_H)/2):EXTRA/2;
  return [-off,(IS_TOUCH?SCREEN_H-DECK_H:SCREEN_H)-off]; }
/* Make the season's battle backdrops (the garden's, and the mountain's if it has its own)
   with their blur and bloom ahead of time, and the vignette and the light's pictures, so
   nothing is worked out when a fight starts. A picture still loading is done when it
   arrives. */
function hdPrebake(){
  if(typeof BACKDROPS==='undefined') return;
  const [T0,T1]=battleBand(), s=season();
  hdShaftImg(); hdVignetteFor(T0,T1);
  if(!(GFX.dof||GFX.bloom)) return;
  [s,'mountain_'+s].filter(k=>BACKDROPS.includes(k)).forEach(k=>{ const im=backImgFor(k);
    const go=()=>{ if(im.naturalWidth) hdBackdrop(im,...backPlace(im,k,T0,T1),T0,T1); };
    if(im.complete) go(); else im.addEventListener('load',go,{once:true}); });
}
/* a shaft of light: soft across its width, strongest at the top and fading as it falls */
let HD_SHAFT=null;
function hdShaftImg(){
  if(HD_SHAFT) return HD_SHAFT;
  const cv=hdCanvas(64,256), c=cv.getContext('2d'), gx=c.createLinearGradient(0,0,64,0);
  gx.addColorStop(0,'rgba(255,244,214,0)'); gx.addColorStop(0.5,'rgba(255,244,214,1)'); gx.addColorStop(1,'rgba(255,244,214,0)');
  c.fillStyle=gx; c.fillRect(0,0,64,256);
  c.globalCompositeOperation='destination-in'; const gy=c.createLinearGradient(0,0,0,256);
  gy.addColorStop(0,'rgba(0,0,0,1)'); gy.addColorStop(0.55,'rgba(0,0,0,.45)'); gy.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=gy; c.fillRect(0,0,64,256); return HD_SHAFT=cv;
}
/* the grade, the light shafts and the motes, over everyone (k: how much of it shows: less
   while the Pep Rally's dark stage is up). ox, oy: how far the view has moved over the
   ground (view px), so the beams and motes stay where they are on it as she walks. */
const HD_MOTE=[], HD_BEAM={gap:78, slant:Math.tan(0.42)};
function hdLight(dt,k,T0,T1,indoors,ox=0,oy=0){
  if(k<=0) return;
  if(T0===undefined){ T0=BAND_TOP(); T1=BAND_BOT(); }
  const H=T1-T0, day=indoors?0.6:daylight(), night=indoors?0:1-Math.min(1,day*1.5);
  b.save();
  /* warm at the top, cool at the bottom */
  b.globalCompositeOperation='soft-light'; b.globalAlpha=Math.min(1,HD_GRADE*gfxK('grade'))*k;
  const g=b.createLinearGradient(0,T0,0,T1); g.addColorStop(0,'#ffcf8a'); g.addColorStop(0.55,'#808080'); g.addColorStop(1,'#4a6aa8');
  b.fillStyle=g; b.fillRect(-20,T0,LW+40,H);
  /* sunbeams from the upper left */
  b.globalCompositeOperation='lighter'; const im=hdShaftImg();
  /* (one every HD_BEAM.gap along the ground; a slanting beam moved down the view slides
     along itself, so going up or down it shifts sideways by the slant) */
  const u=ox-oy*HD_BEAM.slant, n0=Math.floor((u-H*HD_BEAM.slant-60)/HD_BEAM.gap), n1=Math.ceil((u+LW+60)/HD_BEAM.gap);
  if(!indoors&&day>0.02&&GFX.shafts>0) for(let i=n0;i<=n1;i++){ const sw=Math.sin(G.t/4200+i*1.7), x=-30+i*HD_BEAM.gap-u+sw*10, w=34+(((i*23)%3+3)%3)*16;
    b.globalAlpha=Math.min(1,HD_SHAFTS*gfxK('shafts'))*k*day*wxSun()*(0.55+0.45*Math.sin(G.t/3100+i*2.3));
    b.save(); b.translate(x,T0-10); b.rotate(-0.42+sw*0.025); b.drawImage(im,-w/2,0,w,H*1.15); b.restore(); }
  b.restore();
  /* motes: dust in the light by day, fireflies at night */
  /* (kept on the ground: x, y where they'd be with the view unmoved; new ones fade in) */
  const nm=Math.round(HD_MOTES*gfxK('motes')*0.85), first=!HD_MOTE.length; if(HD_MOTE.length>nm) HD_MOTE.length=nm;
  while(HD_MOTE.length<nm) HD_MOTE.push({x:rnd(0,LW)+ox,y:rnd(T0,T0+H*0.8)+oy,t:first?rnd(0,6000):0,life:rnd(4000,8000),
    vx:rnd(-0.004,0.008),vy:rnd(-0.006,0.002),ph:rnd(0,TAU),s:rnd(1.6,3)});
  HD_MOTE.forEach(p=>{ p.t+=dt; p.x+=p.vx*dt+Math.sin(G.t/900+p.ph)*0.02; p.y+=p.vy*dt+Math.cos(G.t/1100+p.ph)*0.015;
    const q=Math.sin(Math.PI*clamp(p.t/p.life,0,1)), x=p.x-ox, y=p.y-oy;
    if(night>0.5){ const blink=Math.max(0,Math.sin(G.t/380+p.ph*3)); glowAt(x,y,p.s*2.6,'#d8ff70',q*k*blink*0.9); }
    else glowAt(x,y,p.s*1.6,'#fff4d0',q*k*(0.25+0.5*day)); });
  for(let i=HD_MOTE.length-1;i>=0;i--){ const p=HD_MOTE[i], x=p.x-ox, y=p.y-oy;
    if(p.t>p.life||x<-10||x>LW+10||y<T0-10||y>T1+10) HD_MOTE.splice(i,1); }
}
/* the vignette: worked out once per band, laid over the scene last */
let HD_VIG={key:null,cv:null};
function hdVignetteFor(T0,T1){
  const H=T1-T0, key=T0+'|'+T1; if(HD_VIG.key===key) return;
  const cv=hdCanvas(180,H/2), c=cv.getContext('2d'), R=Math.hypot(90,H/4);
  c.save(); c.translate(90,H/4); c.scale(1,H/4/Math.max(90,H/4)*1.15);
  const g=c.createRadialGradient(0,0,R*0.35,0,0,R*1.05); g.addColorStop(0,'rgba(12,6,24,0)'); g.addColorStop(0.6,'rgba(12,6,24,.35)'); g.addColorStop(1,'rgba(12,6,24,1)');
  c.fillStyle=g; c.fillRect(-200,-H,400,H*2); c.restore(); HD_VIG={key,cv};
}
function hdVignette(T0,T1){
  if(T0===undefined){ T0=BAND_TOP(); T1=BAND_BOT(); }
  const H=T1-T0;
  hdVignetteFor(T0,T1);
  if(!GFX.vignette) return;
  const a=HD_VIGNETTE*gfxK('vignette');                  /* (past 1: a second coat, darker still) */
  b.save(); b.imageSmoothingEnabled=true;
  b.globalAlpha=Math.min(1,a); b.drawImage(HD_VIG.cv,0,T0,LW,H);
  if(a>1){ b.globalAlpha=Math.min(1,a-1); b.drawImage(HD_VIG.cv,0,T0,LW,H); }
  b.restore();
}

/* ---------- out of battle ----------
   Over the finished view (0..VIEW_H, inside its clip, in screen px), before the clock and
   the windows. A small copy of the view (HD_SMALL of its size) gives both the tilt-shift
   blur (spread back up, faded in at the top and bottom: HD_TILT) and the bloom (the copy
   multiplied by itself until only the bright parts are left, laid on as added light). */
const HD_SMALL=1/6, HD_TILT={top:0.3, bot:0.16, indoors:0.6}, HD_FIELD_BLOOM=0.5;
let HD_FIELD=null;
function hdFieldCanvases(w,h){
  if(HD_FIELD&&HD_FIELD.w===w&&HD_FIELD.h===h) return HD_FIELD;
  const sw=Math.max(8,Math.round(w*HD_SMALL)), sh=Math.max(8,Math.round(h*HD_SMALL));
  return HD_FIELD={w,h,small:hdCanvas(sw,sh),glow:hdCanvas(sw,sh),mask:hdCanvas(Math.round(w/2),Math.round(h/2)),grad:null};
}
/* the tilt-shift blur and the bloom over the band T0..T0+H (screen px): tilt {top, bot}
   scales how far each blur reaches in (0: none there) */
function hdSoften(T0,H,tilt){
  const dk=gfxK('dof'), bk=gfxK('bloom');
  if(!(dk>0||bk>0)) return;
  const t=b.getTransform(), F=hdFieldCanvases(Math.round(LW*t.a),Math.round(H*t.d));
  /* the band, small */
  const s=F.small.getContext('2d'); s.imageSmoothingEnabled=true;
  s.globalCompositeOperation='copy'; s.drawImage(b.canvas,t.e,t.f+T0*t.d,F.w,F.h,0,0,F.small.width,F.small.height);
  s.globalCompositeOperation='source-over';
  if(dk>0){
    /* tilt-shift: the small copy spread back up (soft), shown only at the top and bottom */
    const m=F.mask.getContext('2d'); m.imageSmoothingEnabled=true; m.globalCompositeOperation='copy';
    m.drawImage(F.small,0,0,F.mask.width,F.mask.height);
    m.globalCompositeOperation='destination-in';
    const top=HD_TILT.top*tilt.top, bot=HD_TILT.bot*tilt.bot, a=Math.min(1,dk);
    const g=m.createLinearGradient(0,0,0,F.mask.height);
    g.addColorStop(0,'rgba(0,0,0,'+(top>0?a:0)+')'); g.addColorStop(Math.max(top,0.001),'rgba(0,0,0,0)');
    g.addColorStop(Math.min(1-bot,0.999),'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,'+(bot>0?a*0.85:0)+')');
    m.fillStyle=g; m.fillRect(0,0,F.mask.width,F.mask.height); m.globalCompositeOperation='source-over';
    b.save(); b.imageSmoothingEnabled=true; b.drawImage(F.mask,0,T0,LW,H); b.restore(); }
  if(bk>0){
    /* bloom: the small copy times itself (three times: only the brightest stays), spread up as light */
    const gc=F.glow.getContext('2d'); gc.globalCompositeOperation='copy'; gc.drawImage(F.small,0,0);
    gc.globalCompositeOperation='multiply'; gc.drawImage(F.small,0,0); gc.drawImage(F.small,0,0); gc.drawImage(F.small,0,0);
    gc.globalCompositeOperation='source-over';
    b.save(); b.globalCompositeOperation='lighter'; b.globalAlpha=Math.min(1,HD_FIELD_BLOOM*bk); b.imageSmoothingEnabled=true;
    b.drawImage(F.glow,0,T0,LW,H); b.restore(); }
}
/* the whole look over the view where she walks; ox, oy: how far the view has moved over
   the ground (view px) */
function hdField(indoors,ox,oy){
  if(!HD()) return;
  const now=performance.now(), dt=Math.min(50,now-(hdField.last||now)); hdField.last=now;   /* (its own frame time, for the motes) */
  const H=VIEW_H, soft=indoors?HD_TILT.indoors:1;
  hdSoften(0,H,{top:soft,bot:soft});
  hdLight(dt,1,0,H,indoors,ox,oy);
  hdVignette(0,H);
}
