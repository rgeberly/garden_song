# Handoff (2026-11-12)

## State
- Last push: front layers for the town and mountain in spring (the user's hand-edited `maps/town_spring_front.png` and `maps/mountain_spring_front.png`), built to `assets/sprites/front_<place>_spring.webp` and drawn over everyone by `drawPlace` (`js/17-places.js`). Live with `sw.js` cache `kgs-v42`.
- Pushed in `b04f9dc` (cache `kgs-v43`): summer, fall and winter fronts for the town and mountain, copied from the user's spring outlines (`maps/<place>_<season>_front.png`, built and listed in `FRONT_LAYERS`). Also `PLACE_KAIT` in `js/17-places.js`: how big Kaitlyn is drawn in each place (1 = garden size). The town is 0.8 and the mountain 0.7 (the user's choices). Mountain pests are scaled by the same factor, shadows included.
- Pushed: the mountain at 0.7 and the scaled pests (cache `kgs-v44`).
- Walls for the town, mountain and house are the user's hand-painted ones (pushed). The town's `blocks` rectangles in `js/17-places.js` are only a fallback.

- **Pushed: shadows.** Battle shadows fold along a line through both feet, worked out once per animation frame (`groundLine` / `GROUND_LINE` in `js/12-battle.js`), so the back foot isn't floating. Garden shadows (`groundShadow` in `js/14-daytime.js`) keep their base where the thing stands (x axis no longer turned with the sun) and tuck 2.5 px under it (`SHADOW_TUCK`). The arch gets a soft patch under each post (`DECOR_SHADOW_W`).

## In progress
- **Pushed: battles for up to 5 a side.** `PARTY_MAX` is 5. Each friend along brings a 70% chance of one more pest (`EXTRA_FOE`). Four or five a side use one of `BATTLE_LAYOUTS` (`rows`, `arrow`, `mix` = arrowhead party with three-and-two pests, `line`; `BATTLE_LAYOUT` picks it; the default is `mix`, the user's choice). The pest window is hidden except while picking a pest, when it shows that pest's name, HP and level. The top message shows each new line for 3 seconds (`MSG_MS`), then goes; there's no "Who at?" prompt any more. Battle windows are 15% see-through with one smooth gradient (`WIN_GLASS`, in `rpgWin`). Three or more pests open with "A party of pests blocks your path!". The light ovals under everyone are gone; the yellow glow under whoever's turn it is stays. Troubles show as small round icons at each fighter's back (`statusIcon`), not text tags over their heads. Skill and song descriptions no longer repeat the MP cost. Icons are 50% see-through (`ICON_ALPHA`); Kaitlyn's sit by her shoulder. Kicks (Quick and Karate) shout 25% of the time (`KICK_SHOUT`). New command **Focus** (under Meditate): braced like Meditate (half damage until their next turn), and the member's next damaging move does double (`B.charged`, `useCharge`). The commands window shows 5 rows and scrolls (Flee starts out of view, `CMD_VIS`). A guarding pest now takes half damage from every hit until its next turn (it used to double its Defense, which only cut damage about 10-20%). The bottom windows are 126 tall (were 152) with bigger text. Everyone is drawn slightly smaller further back (`depthScale`). The party window switches to one-line rows above three. Flyers take the back spots. In a party of three, Kaitlyn now stands in the middle spot so the pest list doesn't cover her head. Test with `?partytest`. The user is making new party members, smaller like Ivy.
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
