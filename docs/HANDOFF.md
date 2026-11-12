# Handoff (2026-11-12)

## State
- Last push was `1018686` (new enemy art, item pictures and townsfolk portraits). Live with `sw.js` cache `kgs-v40`.
- **Not pushed yet:** the town now reads its walls from a collision image.
  - `js/17-places.js`: when painted walls exist, `placeSolid` uses them and still blocks townsfolk. The old `blocks` rectangles are only a fallback.
  - `tools/build_art.py`: `PLACE_SIZE` now includes the town.
  - `js/data/art.js`: `PLACE_COLS` is now `["mountain","town"]`.
  - New file `assets/sprites/town_collision.png`, plus a note in `tools/perchance-prompts.md`.
  - Bump `sw.js` past `kgs-v40` when pushing. `CLAUDE.md` and this file are also new and uncommitted.
- Checked in the game: the town walls load, the plaza and road are open, buildings and the fountain block, and townsfolk still block.

- The user's hand-edited walls (art folder `maps/`: town, mountain, house) are built into `assets/sprites/*_collision.png` (only those images were regenerated, not the full `build_art.py`). Checked: all three load, arrival spots are open, and every exit, townsperson, the mountain stream, the bed and the music stand can be reached. Also unpushed.

## In progress
- The user is trying out the new walls in the game.
- Home Sweet Home's notes are still the automatic ones. The user is editing them in the song editor.

## Next steps / backlog
- **Five fish still need art:** Croaker, Crab, Octopus, Tarpon and Dolphin (prompts in `tools/perchance-prompts.md`). Perchance hit "Anti-bot verification failed" on Croaker, and the user said to stop. Its settings are left as No style, Square, a batch of 3.
- Battle songs and field songs, once their recordings arrive.
- Graveyard music is in the art folder ("graveyard battle.wav", "graveyard boss.wav", "graveyard.wav") for a future area. The user said to leave it alone for now.
- Longer-term ideas that need the user's art or design: a 5-member party, Cherish and Tiny One, a cemetery and Metroid-style area, church, equipment screen and outfits, bar, villager hearts, the Muramatsu flute, and a capture scenario.

## Known issues / gotchas
- `shop_items.png` grew to about 5.8 MB and is in the service worker's precache list, so the first load is slower.
- Saving several Perchance images in a row sometimes keeps only 2 of 3. The pause between saves matters.
- The Browser pane's `localStorage` was wiped once when its last tab was closed. Avoid closing the last tab, because `tabs_create` can replace the `seed` tab.
- Perchance's page layout shifts between runs. Re-read positions from a screenshot; anchoring image positions to the bottom of the page was the reliable way.
- The mountain walls still let her onto a strip of far-off slope on the right. That's one of the things the user may fix in the new collision image.
- Mute (Settings, then Sound) is per browser tab, kept in `sessionStorage`.
