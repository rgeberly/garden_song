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
- In `?partytest`, `tinyTest('egg'|'nest'|'hatch'|'worms'|'grown'|'fight')` in the console jumps to a step of Tiny One's quest.
- Song editor: http://localhost:8000/tools/song-editor.html?song=NAME. It can only save while `serve.py` is running.
- There's no test suite. Verify in the Browser pane with `javascript_tool` and screenshots. `node` isn't installed; Python 3 is, with cv2, numpy, librosa and imageio_ffmpeg.
- After editing `tools/songs_data.py`, restart `serve.py`, because it imports that module.

## Layout
- `index.html` loads `js/assets.js`, then `js/data/*.js` (generated data), then `js/00-core.js` … `js/19-tiny.js` in order. These are shared globals, not modules.
- `G` is the game state (`js/04-state.js`). Save keys are short (`jm`, `nm`, `sh`, …), so keep them stable.
- Party member ids stay as they are (`bling` is shown as "Ivy" through `PARTY_INFO.bling.name`). Saves and art file names depend on the ids.
- New `SPECIES` go at the end, because saves store plots by their index in that list.

## Art pipeline (art folder: `C:\kaitlyns-garden-song-art`)
- `python tools/build_art.py` rebuilds all sprite sheets, `js/data/art.js` and the collision images from the art folder. It's slow, and GrabCut makes some outputs differ slightly from run to run.
- `named_pics()`: a loose file is used by its file name. A subfolder that holds exactly one picture is used under the subfolder's name (the user keeps one favorite out of several versions).
- Enemies are listed in `ENEMIES`. Painted-in checkerboards are handled by `ENEMY_CHECKERED`, and white gaps between legs by `ENEMY_POCKETS`. Studio-photo items are cut out with `SHOP_PHOTOS` (gentler settings for pale ones). Townsfolk portraits come from `people/` and are written to `PEOPLE_PORTRAITS`.
- Walls: in `maps/<place>_<season>_collision.png` (garden, town, mountain: one per season; the house has just `maps/house_collision.png`), black is blocked and white is open. The game uses the current season's (`SEASON_WALLS`, `placeCol`, `GARDEN_COL`). The town and mountain read them on a 4-pixel grid. `<place>_collision_guide.jpg` files are only for reference.
- Doors and ways in and out: `maps/<area>_transitions.png` (town, mountain, house; the garden's is `maps/transitions.png`), patches painted over a faded copy of the area, one colour per destination (`ZONE_COLS`): green garden (34,177,76), red town (237,28,36), gold mountain (255,201,14), blue house (0,162,232), orange café (255,127,39), purple music shop (163,73,164), indigo fishing shop (63,72,204), brown bar (185,122,87). Paths to the garden, town and mountain are walked into; doors take A. She arrives in the middle of the patch for where she came from (`zoneArrival`).
- `PARTY_IN_GAME` in `build_art.py` lists the party members built into `party.webp`. Future members (Tituba, Tex) sit in `party/` until they're added.
- Front layers (what she walks behind, drawn over everyone) are see-through pictures showing only the parts of the painting that overlap her: `maps/<season>_front.png` (garden), `maps/house_front.png`, and `maps/<place>_<season>_front.png` (town, mountain). The user edits these by hand and prefers this picture format over masks. Never overwrite them.
- Party art: loose `party/<Name>-<kind>-spritesheet.png`, or a folder `party/<Name>/` with `<Name> - <kind> - spritesheet.png` (Tiny One's). `PARTY_IDS` maps folder names to ids (`tiny one` is `tiny`). Crops' `harvest <Crop>` pictures are the bag icons; `<Tree> sapling` shop pictures replace the trees' seeds.
- Running animation: `python tools/build_run.py` produces `assets/sprites/run.png` and `js/data/run.js`.
- Perchance prompts are in `tools/perchance-prompts.md`. Save full-resolution images with the heart icon, then "save to your device". Downloads arrive as `<uuid>.tmp` in Downloads, and the save windows are dialogs titled `data:image/...`.

## Songs and the rhythm game
- Recordings are `rhythm/songs/<name>_flute.wav` and `<name>_backing.wav` in the art folder. Crop songs are named by species key; practice songs are `practice_<Title>`.
- `python tools/build_songs.py [names…]` converts them to `assets/audio/songs/*.m4a` and finds the notes in `js/data/songs.js`. Never chain it after other edits in the same command; it once wrote an empty song list.
- Hand edits made in the editor live in `tools/song_edits.json` and always win over the automatic note finder.
- `PARTS` in `tools/songs_data.py` defines songs made of other songs: Grow Little Croppies and Drink Up, Lovelies. `recompose()` rebuilds them, and the last note of each part keeps its own lane.
- Note format is `{t, d, s, l}` plus an optional `e` (end lane) and `b` (bends, `[[secondsIn, lane]]`). The game's hold rules are in `songHoldDur` (`js/11-rhythm.js`), and the editor's `gameDur` mirrors them.
