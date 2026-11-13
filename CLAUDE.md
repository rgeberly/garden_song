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
- Song editor: http://localhost:8000/tools/song-editor.html?song=NAME. It can only save while `serve.py` is running.
- There's no test suite. Verify in the Browser pane with `javascript_tool` and screenshots. `node` isn't installed; Python 3 is, with cv2, numpy, librosa and imageio_ffmpeg.
- After editing `tools/songs_data.py`, restart `serve.py`, because it imports that module.

## Layout
- `index.html` loads `js/assets.js`, then `js/data/*.js` (generated data), then `js/00-core.js` … `js/18-fishing.js` in order. These are shared globals, not modules.
- `G` is the game state (`js/04-state.js`). Save keys are short (`jm`, `nm`, `sh`, …), so keep them stable.
- Party member ids stay as they are (`bling` is shown as "Ivy" through `PARTY_INFO.bling.name`). Saves and art file names depend on the ids.
- New `SPECIES` go at the end, because saves store plots by their index in that list.

## Art pipeline (art folder: `C:\kaitlyns-garden-song-art`)
- `python tools/build_art.py` rebuilds all sprite sheets, `js/data/art.js` and the collision images from the art folder. It's slow, and GrabCut makes some outputs differ slightly from run to run.
- `named_pics()`: a loose file is used by its file name. A subfolder that holds exactly one picture is used under the subfolder's name (the user keeps one favorite out of several versions).
- Enemies are listed in `ENEMIES`. Painted-in checkerboards are handled by `ENEMY_CHECKERED`, and white gaps between legs by `ENEMY_POCKETS`. Studio-photo items are cut out with `SHOP_PHOTOS` (gentler settings for pale ones). Townsfolk portraits come from `people/` and are written to `PEOPLE_PORTRAITS`.
- Walls: in `maps/<place>_collision.png` (town, mountain, house, garden), black is blocked and white is open. The game reads them on a 4-pixel grid. `<place>_collision_guide.jpg` files are only for reference.
- Front layers (what she walks behind, drawn over everyone) are see-through pictures showing only the parts of the painting that overlap her: `maps/<season>_front.png` (garden), `maps/house_front.png`, and `maps/<place>_<season>_front.png` (town, mountain). The user edits these by hand and prefers this picture format over masks. Never overwrite them.
- Running animation: `python tools/build_run.py` produces `assets/sprites/run.png` and `js/data/run.js`.
- Perchance prompts are in `tools/perchance-prompts.md`. Save full-resolution images with the heart icon, then "save to your device". Downloads arrive as `<uuid>.tmp` in Downloads, and the save windows are dialogs titled `data:image/...`.

## Songs and the rhythm game
- Recordings are `rhythm/songs/<name>_flute.wav` and `<name>_backing.wav` in the art folder. Crop songs are named by species key; practice songs are `practice_<Title>`.
- `python tools/build_songs.py [names…]` converts them to `assets/audio/songs/*.m4a` and finds the notes in `js/data/songs.js`. Never chain it after other edits in the same command; it once wrote an empty song list.
- Hand edits made in the editor live in `tools/song_edits.json` and always win over the automatic note finder.
- `PARTS` in `tools/songs_data.py` defines songs made of other songs: Grow Little Croppies and Drink Up, Lovelies. `recompose()` rebuilds them, and the last note of each part keeps its own lane.
- Note format is `{t, d, s, l}` plus an optional `e` (end lane) and `b` (bends, `[[secondsIn, lane]]`). The game's hold rules are in `songHoldDur` (`js/11-rhythm.js`), and the editor's `gameDur` mirrors them.
