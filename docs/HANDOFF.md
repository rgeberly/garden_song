# Handoff (2026-11-12)

## State
- Last push: front layers for the town and mountain in spring (the user's hand-edited `maps/town_spring_front.png` and `maps/mountain_spring_front.png`), built to `assets/sprites/front_<place>_spring.webp` and drawn over everyone by `drawPlace` (`js/17-places.js`). Live with `sw.js` cache `kgs-v42`.
- **Not pushed yet:** summer, fall and winter fronts for the town and mountain, copied from the user's spring outlines (`maps/<place>_<season>_front.png`, built and listed in `FRONT_LAYERS`). Also `PLACE_KAIT` in `js/17-places.js`: how big Kaitlyn is drawn in each place (1 = garden size). The town is 0.8 (the user's choice); the mountain is 1. Bump `sw.js` when pushing.
- Walls for the town, mountain and house are the user's hand-painted ones (pushed). The town's `blocks` rectangles in `js/17-places.js` are only a fallback.

## In progress
- The user may still touch up the spring fronts. Rebuild just those two webps and reload them in the game when asked.
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
