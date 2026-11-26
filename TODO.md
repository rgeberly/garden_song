# Garden Song to-do list
What's still to make or do, as of Nov 26, 2026. Tick a box by changing `[ ]` to `[x]`.

## Songs
Rhythm game songs go in the art folder as `rhythm/songs/<name>_flute.wav` and `<name>_backing.wav`
(then `python tools/build_songs.py <name>`). Every crop, practice song and Pep Rally has its own.
- [x] Pep Rally songs: Rally Cry, Tangleroot Reel, Clean Slate, Hype Up, Safe and Sound, Grand Finale
- [x] Practice songs made of them: Croppies In Your Mouth! and Not in My Pep Rally! (250 coins each at Rosa's)
- [x] Kaitlyn's battle songs, as sound effects: Sprout Strike, Frog Lullaby, Bramble Waltz, Wasp Requiem,
      Thorn Nocturne, Harvest Hymn
- [x] Field songs, as sound effects: Growth Reprise, Pest Ward, Sun Shower
- [ ] Decide what `graveyard.wav`, `graveyard battle.wav` and `graveyard boss.wav` are for (in `rhythm/songs`, not used yet)

## Sound effects
Recorded ones go in the art folder's `sfx/` (then `python tools/build_sfx.py`). A name ending in a
number ("catch fish 2") is another take of the same sound. These still play synthesized beeps:
- [ ] Garden: planting, harvesting, clearing a dead plant, eating a crop from the menu
- [ ] Frog's healing croak (garden frogs fill everyone's HP)
- [ ] Wading into the pool ("Ahh. Music Points restoring...")
- [ ] Level up
- [ ] Battle hits, a few generic ones the game can share (each matches a hit mark). A couple of takes
      each ("kick hit 2") keeps them from sounding samey:
  - [ ] `kick hit`: a blunt thump (Kaitlyn's kick, pests' headbutts and dives)
  - [ ] `heavy hit`: a bigger, deeper thump (Karate Kick, Shell Slam, Grand Finale)
  - [ ] `slash`: a quick claw swipe (Tituba's claws, pests' claws and Talon Rake)
  - [ ] `bite`: a sharp snap of small teeth (Ivy's fangs, pests' bites and nips)
  - [ ] `chomp`: a big, slow crunch (Tex's bite)
  - [ ] `pinch`: a clack of pincers (crabs and beetles)
  - [ ] `peck`: a tiny tap (Tiny One's pecks, birds)
  - [ ] `sting`: a thin jab with a fizz (wasps, spines)
  - [ ] `whoosh`: a swing through the air (any lunge or kick, before it lands)
  - [ ] `miss`: a whiff (a blind miss, a dodge)
  - [ ] `critical hit`: a bright extra crack on top of a hit
  - [ ] `blocked`: a soft shield ping (Safe and Sound, a guarding pest)
- [ ] Battle: a pest winding up its move, a pest running off, a member going down
- [ ] Battle troubles, one each (they play a made-up sound until then): `trouble poison`, `trouble venom`,
      `trouble sleep` (something silly and confused), `trouble weak`, `trouble scared`, `trouble blind`,
      `trouble bound`; and a heal chime
- [ ] `stamp`: the rating stamped on at the end of a song (a made-up thump until then)
- [ ] `pep cutin`: the Pep Rally's cut-in sweeping across, like an ultimate move (whoosh, boom and a bright chord made up until then)
- [ ] Battle: Focus, Meditate, eating a crop, the Pep meter filling up, the EXP tally ticking on the results
- [ ] Battle voices for Ivy, Tituba and Tex's skills (Tiny One has his): e.g. Ivy's hiss (Ssssss),
      Tituba's Hiss and swipes, Tex's Shell Up and Slam
- [ ] Pest voices or noises (none yet)
- [x] Fishing: starting, casting, a bite, setting the hook, reeling, the line snapping
- [ ] Rhythm game: the count-in beeps, a "perfect" fanfare (the frog's), tapping during the count-in
- [ ] Tiny One as a baby: begging, and gulping a worm

## Animations
- [ ] Fix Ivy's victory animation
- [ ] Tiny One: a singing animation for his songs and Tweet (they use his attack loop now)
- [ ] Tituba curled up asleep (at night she stands on the quilt with sleeping Z's)
- [ ] Townsfolk walking art (they're simple drawn stand-ins in town; only their portraits are art)
- [ ] Optional: more garden wildlife (bumblebee, dragonfly or hummingbird), like the bluebird and monarch

## Pictures (prompts in `tools/perchance-prompts.md`)
- [ ] Kaitlyn's talk-box faces: smile, sad, angry, concerned, questioning, determined, amazed
- [ ] Collard Greens: young plant, grown plant and harvest pictures (it's the only crop drawn in code)
- [ ] Redo the Blueberry seed picture
- [x] Mature radish: the bulb's lower half now sits in a mound of soil (edited from the old picture, which is in the
      art folder's `backup/`)
- [ ] Mug of Cider and Hot Toddy pictures
- [ ] Tituba's gear: Silver Claw Tips, Velvet Ribbon, Catnip Sachet, Moonstone Collar (the gear isn't in the game yet either)
- [ ] Tex's gear: Old Oak Cane, Mossy Shell Cover, Sun-Warmed Stone, Shell Polish (likewise)

## Shop interiors
- [ ] Touch up the starter walls: `maps/cafe_collision.png`, `music_collision.png`, `fishshop_collision.png`, `bar_collision.png`
- [ ] Touch up the starter doorways: `maps/<room>_transitions.png`
- [ ] Front layers for the rooms (what Kaitlyn walks behind: counters, tables), like the house's

## Story and game
- [ ] The later area, then move the Muramatsu there (sold at Rosa's for 10,000 coins until then)
- [ ] After the phone test: tune Tituba's and Tex's stats and skills
- [ ] After the phone test: check their spots in town and at home
- [ ] After the phone test: check how easy each meeting is to find
- [ ] Optional, smaller downloads: Tiny One's quest animations (hatching, begging, falling asleep) are
      about 15% of `party.webp` and could load only during his quest
