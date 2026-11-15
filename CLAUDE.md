# Kaitlyn's Garden Song

A canvas PWA farming/RPG game: plain JavaScript with no bundler, served as static files.
Live site: https://rgeberly.github.io/garden_song/ (GitHub Pages, deployed from `main`).
The logo says "Garden Song", without "Kaitlyn's".

## Working rules (from the user)
- Commit and push only when the user says "Yes, push" or asks to push. Push straight to `main`.
- End commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Before each push, bump `CACHE` in `sw.js` (`kgs-vNN`). The service worker caches network-first.
- Never ask the user to paste credentials.
- Check that the Browser pane is visible and the game loop is running (`G.t` advancing) before testing. A hidden pane pauses `requestAnimationFrame`. Stop and check in if something takes long.
- The user may be playing in the Browser pane. Check `G.scene` and the editor's `changed()` before reloading. Back up `localStorage` before tests that might save, then restore it.
- In Perchance, if a bot or verification check appears, stop and hand it to the user. Never work around it.

## Running and testing
- `python serve.py` serves the game at http://localhost:8000. It's also the "game" preview in `.claude/launch.json`. Its POST API (localhost only) saves song edits.
- Add `?songtest` to the URL to list every recorded song at the music stand, with autoplay, no EXP and no time passing.
- Add `?partytest` to try big fights: nothing is saved, Kaitlyn (Lv.6) has four Ivys, and it's spring. In the console, `partyTestFight(5,'rows')` starts a fight with that many pests in that layout (`BATTLE_LAYOUTS` in `js/12-battle.js`).
- Add `?alltest` to play with everything: nothing is saved, and any game started or loaded gets Kaitlyn and all four friends at Lv.12 in the party, every item, gear and yard upgrade, the best rod, all sheet music and 50,000 coins (`everythingTest` in `js/12-battle.js`). The `?partytest` console helpers work there too.
- In `?partytest`, `ivyTest('hurt'|'recover'|'better'|'released'|'home')` jumps to a step of Ivy's story (she first appears on day 5).
- In `?partytest`, `tinyTest('egg'|'nest'|'hatch'|'worms'|'grown'|'fight')` in the console jumps to a step of Tiny One's quest.
- In `?partytest`, `tituTest('stray'|'aloof'|'fish'|'home'|'fight')` and `texTest('stuck'|'home'|'fight')` jump to steps of meeting Tituba (outside the Tipsy Toad from 6 PM, from day 11) and Tex (on the garden pool's ice in winter, from day 31). Both are in `js/20-friends.js`.
- Song editor: http://localhost:8000/tools/song-editor.html?song=NAME. It can only save while `serve.py` is running.
- There's no test suite. Verify in the Browser pane with `javascript_tool` and screenshots. `node` isn't installed; Python 3 is, with cv2, numpy, librosa and imageio_ffmpeg.
- After editing `tools/songs_data.py`, restart `serve.py`, because it imports that module.

## Layout
- `index.html` loads `js/assets.js`, then `js/data/*.js` (generated data), then `js/00-core.js` … `js/20-friends.js` in order. These are shared globals, not modules.
- `G` is the game state (`js/04-state.js`). Save keys are short (`jm`, `nm`, `sh`, …), so keep them stable.
- The party stands in five spots, top to bottom (`G.slots`, save key `ps`, Kaitlyn in the middle by default). `G.party` is who's out, in spot order; `partySlots()` keeps the two in step. Battles put each member at `PARTY_SPOTS[spot]`.
- Battle rounds: everyone picks a move top to bottom (`plan`, `B.plan`), then all act by Agility (`startActions`, `nextActor`, `runPlan`). The Pep meter (`G.pep`, save key `pp`) fills on hits; when it's full, a Pep Rally (`PEP_SONGS` in `js/01-content.js`) can be played after the last pick, as a rhythm game over a stretch of a practice song (`bc.section`).
- Town shops (`TOWN_SHOPS` in `js/17-places.js`, each with `tabs`) open in the garden stall's window (`openTownShop` in `js/09-menu-shop.js`).
- Party member ids are `kaitlyn`, `ivy`, `tiny`, `tituba` and `tex`. Saves and art file names depend on them, so keep them stable. (Ivy's id was `bling` until Nov 14, 2026; saves from before then don't carry over.)
- New `SPECIES` go at the end, because saves store plots by their index in that list.

## Art pipeline (art folder: `C:\kaitlyns-garden-song-art`)
- `python tools/build_art.py` rebuilds all sprite sheets, `js/data/art.js` and the collision images from the art folder. It's slow, and GrabCut makes some outputs differ slightly from run to run.
- `named_pics()`: a loose file is used by its file name. A subfolder that holds exactly one picture is used under the subfolder's name (the user keeps one favorite out of several versions).
- Enemies are listed in `ENEMIES`. Painted-in checkerboards are handled by `ENEMY_CHECKERED`, and white gaps between legs by `ENEMY_POCKETS`. Studio-photo items are cut out with `SHOP_PHOTOS` (gentler settings for pale ones). Townsfolk portraits come from `people/` and are written to `PEOPLE_PORTRAITS`.
- Walls: in `maps/<place>_<season>_collision.png` (garden, town, mountain: one per season; the house has just `maps/house_collision.png`), black is blocked and white is open. The game uses the current season's (`SEASON_WALLS`, `placeCol`, `GARDEN_COL`). The town and mountain read them on a 4-pixel grid. `<place>_collision_guide.jpg` files are only for reference.
- Doors and ways in and out: `maps/<area>_transitions.png` (town, mountain, house; the garden's is `maps/transitions.png`), patches painted over a faded copy of the area, one colour per destination (`ZONE_COLS`): green garden (34,177,76), red town (237,28,36), gold mountain (255,201,14), blue house (0,162,232), orange café (255,127,39), purple music shop (163,73,164), indigo fishing shop (63,72,204), brown bar (185,122,87). Paths to the garden, town and mountain are walked into; doors take A. She arrives in the middle of the patch for where she came from (`zoneArrival`).
- Town interiors (`ROOMS`: cafe, music, fishshop, bar): `maps/<room>` painted at 512x768 like the house, with `maps/<room>_collision.png` and `maps/<room>_transitions.png` (red: the doorway back to town). Kaitlyn and the townsfolk are drawn at `ROOM_KAIT` in them.
- Battle backdrops: `backdrops/<season>`, and `backdrops/mountain_<season>` for fights on the mountain. Where each one's ground begins is `BACK_HORIZON` in `js/12-battle.js`.
- The rhythm game's hit line and side vines: `rhythm/flute` and `rhythm/vine`.
- `PARTY_IN_GAME` in `build_art.py` lists the party members built into `party.webp`. Future members sit in `party/` until they're added. `PARTY_MOVE_NAMES` maps a member's own move names to the game's (`bite` is the attack; `special slash` and `withdraw` play for skills). Tex's `fumble` loop is him stuck on his back.
- Kaitlyn's flutes (`flutes.png` in her hand, `flutes_big.png` as the menu cursor) are built from the `shop items/` pictures listed in `FLUTES` in `build_art.py`, with mouthpieces at the top.
- Front layers (what she walks behind, drawn over everyone) are see-through pictures showing only the parts of the painting that overlap her: `maps/<season>_front.png` (garden), `maps/house_front.png`, and `maps/<place>_<season>_front.png` (town, mountain). The user edits these by hand and prefers this picture format over masks. Never overwrite them.
- Party art: loose `party/<Name>-<kind>-spritesheet.png`, or a folder `party/<Name>/` with `<Name> - <kind> - spritesheet.png` (Tiny One's). `PARTY_IDS` maps folder names to ids (`tiny one` is `tiny`). Crops' `harvest <Crop>` pictures are the bag icons; `<Tree> sapling` shop pictures replace the trees' seeds.
- Kaitlyn's battle sheet: `python tools/build_battle.py` builds `assets/sprites/battle.png` and `BATL_META` (in `js/assets.js`) from `party/Kaitlyn/battle.png` (kick, kick2, flute and victory rows) and her `karate kick` spritesheet (the `karate` row).
- Portraits: a member's `portrait2` (or `portrait 2`) picture wins over `portrait` and keeps its whole square, so the animal looks smaller. Ivy, Tituba and Tiny One (and his baby portrait) use theirs.
- Running animation: `python tools/build_run.py` produces `assets/sprites/run.png` and `js/data/run.js`.
- Perchance prompts are in `tools/perchance-prompts.md`. Save full-resolution images with the heart icon, then "save to your device". Downloads arrive as `<uuid>.tmp` in Downloads, and the save windows are dialogs titled `data:image/...`.

## Sound effects
- Recordings are `sfx/<name>.wav` in the art folder. `python tools/build_sfx.py` cleans them up (DC offset, leading silence, fades, even loudness), writes `assets/audio/sfx/<key>.m4a` and lists them in `js/data/sounds.js` (`SOUNDS`). The key is the name in lower case with spaces and dashes as underscores. A name ending in a number ("close door 2") is another take, picked at random.
- `sfx(key, vol)` in `js/03-audio.js` plays one (Web Audio, decoded at start-up). `SOUND_VOL` there sets how loud each plays.
- Menu clicks are automatic: `menuClick` in `js/05-input.js` compares the menus before and after each key or tap. If nothing played a sound, it plays `menu_tab`, `menu_confirm`, `menu_cancel` or `menu_move`.
- Tiny One's skill voices are in `SKILL_SOUND` (`js/12-battle.js`). A voice longer than the move holds the turn (`anim`'s `hold`) while his animation loops.

## Songs and the rhythm game
- Recordings are `rhythm/songs/<name>_flute.wav` and `<name>_backing.wav` in the art folder. Crop songs are named by species key; practice songs are `practice_<Title>`.
- `python tools/build_songs.py [names…]` converts them to `assets/audio/songs/*.m4a` and finds the notes in `js/data/songs.js`. Never chain it after other edits in the same command; it once wrote an empty song list.
- Hand edits made in the editor live in `tools/song_edits.json` and always win over the automatic note finder.
- `PARTS` in `tools/songs_data.py` defines songs made of other songs: Grow Little Croppies and Drink Up, Lovelies. `recompose()` rebuilds them, and the last note of each part keeps its own lane.
- Note format is `{t, d, s, l}` plus an optional `e` (end lane) and `b` (bends, `[[secondsIn, lane]]`). The game's hold rules are in `songHoldDur` (`js/11-rhythm.js`), and the editor's `gameDur` mirrors them.
