const CACHE='kgs-v25';
const FILES=[
 "./",
 "assets/audio/music_battle.m4a",
 "assets/audio/music_boss.m4a",
 "assets/audio/music_calm.m4a",
 "assets/audio/music_title.m4a",
 "assets/audio/sfx_flute.mp3",
 "assets/audio/sfx_idle_down.mp3",
 "assets/audio/sfx_idle_east.mp3",
 "assets/audio/sfx_idle_northeast.mp3",
 "assets/audio/sfx_idle_southeast.mp3",
 "assets/audio/sfx_idle_up.mp3",
 "assets/audio/sfx_kick.mp3",
 "assets/audio/sfx_victory.mp3",
 "assets/audio/stem_backing.mp3",
 "assets/audio/stem_flute.mp3",
 "assets/icons/icon-192.png",
 "assets/icons/icon-512.png",
 "assets/sprites/anim.png",
 "assets/sprites/battle.png",
 "assets/sprites/creatures.png",
 "assets/sprites/crops.png",
 "assets/sprites/enemies.webp",
 "assets/sprites/flutes.png",
 "assets/sprites/flutes_big.png",
 "assets/sprites/frogs.png",
 "assets/sprites/map_collision.png",
 "assets/sprites/map_house.jpg",
 "assets/sprites/party.webp",
 "assets/sprites/portrait_bling.png",
 "assets/scenes/join_bling.jpg",
 "assets/sprites/map_fall.jpg",
 "assets/sprites/map_spring.jpg",
 "assets/sprites/map_summer.jpg",
 "assets/sprites/map_winter.jpg",
 "assets/sprites/portrait.png",
 "assets/sprites/pose.png",
 "assets/sprites/shop_items.png",
 "css/style.css",
 "index.html",
 "js/00-core.js",
 "js/01-content.js",
 "js/02-world.js",
 "js/03-audio.js",
 "js/04-state.js",
 "js/05-input.js",
 "js/06-overworld.js",
 "js/07-hud.js",
 "js/08-menu-seed.js",
 "js/09-menu-shop.js",
 "js/10-menu-pause.js",
 "js/11-rhythm.js",
 "js/12-battle.js",
 "js/13-main.js",
 "js/14-daytime.js",
 "js/15-house.js",
 "js/16-story.js",
 "js/17-places.js",
 "js/18-fishing.js",
 "js/assets.js",
 "js/data/phrases.js",
 "js/data/art.js",
 "js/data/stem.js",
 "manifest.json"
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));});
// Network first so edits and updates show up right away; the cache is only the offline fallback.
// Full (200) responses to plain URLs refresh the cached copy as we go.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  e.respondWith(fetch(e.request).then(r=>{
    if(r.status===200&&url.origin===location.origin&&!url.search){
      const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy));
    }
    return r;
  }).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
