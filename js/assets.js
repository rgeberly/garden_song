/* Asset paths and sprite-sheet metadata. */
const ASSET_BASE="";
const ASSET_ANIM="assets/sprites/anim.png";
const ASSET_BATL="assets/sprites/battle.png";
const ASSET_POSE="assets/sprites/pose.png";
const ASSET_PT="assets/sprites/portrait.png";
const ASSET_FL="assets/sprites/flutes.png";
const ASSET_EN="assets/sprites/enemies.png";
const ASSET_FROG="assets/sprites/frogs.png";
const ASSET_FLBIG="assets/sprites/flutes_big.png";
const ASSET_SFX={
 "idle_up": "assets/audio/sfx_idle_up.mp3",
 "walk_up": "assets/audio/sfx_walk_up.mp3",
 "idle_northeast": "assets/audio/sfx_idle_northeast.mp3",
 "walk_northeast": "assets/audio/sfx_walk_northeast.mp3",
 "idle_east": "assets/audio/sfx_idle_east.mp3",
 "walk_east": "assets/audio/sfx_walk_east.mp3",
 "idle_southeast": "assets/audio/sfx_idle_southeast.mp3",
 "walk_southeast": "assets/audio/sfx_walk_southeast.mp3",
 "idle_down": "assets/audio/sfx_idle_down.mp3",
 "walk_down": "assets/audio/sfx_walk_down.mp3",
 "kick": "assets/audio/sfx_kick.mp3",
 "flute": "assets/audio/sfx_flute.mp3",
 "victory": "assets/audio/sfx_victory.mp3"
};
const ASSET_MUS={
 "title": "assets/audio/music_title.m4a",
 "calm": "assets/audio/music_calm.m4a",
 "battle": "assets/audio/music_battle.m4a",
 "boss": "assets/audio/music_boss.m4a"
};
const ANIM_META={"cw": 85, "ch": 176, "dirs": ["up", "northeast", "east", "southeast", "down"], "rows": [{"dir": "up", "anim": "idle", "n": 8}, {"dir": "up", "anim": "walk", "n": 24}, {"dir": "northeast", "anim": "idle", "n": 8}, {"dir": "northeast", "anim": "walk", "n": 24}, {"dir": "east", "anim": "idle", "n": 8}, {"dir": "east", "anim": "walk", "n": 24}, {"dir": "southeast", "anim": "idle", "n": 8}, {"dir": "southeast", "anim": "walk", "n": 24}, {"dir": "down", "anim": "idle", "n": 8}, {"dir": "down", "anim": "walk", "n": 24}]};
const BATL_META={"cw": 190, "ch": 196, "rows": [{"name": "kick", "n": 14}, {"name": "kick2", "n": 14}, {"name": "flute", "n": 14}, {"name": "victory", "n": 14}]};
const POSE_META={"cw": 130, "ch": 196};
const FLUTE_META={"cw": 62, "ch": 25, "order": ["recorder", "silver", "dizi"]};
const FROG_META={"cw": 57, "ch": 68, "n": 4};
const FLBIG_META={"cw": 210, "ch": 150};
const ASSET_META={"ow": {"cw": 150, "ch": 208}, "bt": {"cw": 150, "ch": 196}, "pw": 244, "ph": 312, "en": {"cw": 165, "ch": 135, "order": ["beetle", "wasp", "rat", "crab", "raccoon"]}};
const ASSET_STEM_BACKING="assets/audio/stem_backing.mp3";
const ASSET_STEM_FLUTE="assets/audio/stem_flute.mp3";
const ASSET_MAP="assets/sprites/map_spring.jpg";
const ASSET_MAPCOL="assets/sprites/map_collision.png";
const MAP_META={"world":720,"cells":360};
const IMG_TOTAL=10;
