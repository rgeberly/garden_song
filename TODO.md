# Garden Song to-do list
What's still to make or do, as of Nov 27, 2026. Tick a box by changing `[ ]` to `[x]`.

## Recently done (Nov 26-27)
The Deep Forest (map, walls, front layer, its seven pests with AutoSprite art and their drops), stronger
pests that keep up with the party (and Grumpy ones), the new menu (main screen, Equip, Items, Lore >
Memories), the HD look everywhere, the pool's splash and MP bar, the music stand's Play for EXP / Play for
Practice with Song Scores and Flute Mastery, hand-placed notes for all six Pep Rally songs, and many
recorded sounds (hits, troubles, fishing, garden, menus, doors, equip, the friends' big skills).

## The Deep Forest (in the game to try; the map may change)
- [ ] An unlock: it's open to anyone now. Idea: after beating a Black Bear, or at Lv.11
- [ ] Battle backdrops: `backdrops/forest_<season>` (it borrows the mountain's until then)
- [ ] Its own music (it borrows the mountain's)
- [ ] Touch up my walls and front layer: `maps/forest_spring_collision.png`, `maps/forest_spring_front.png`
- [ ] Optional: summer, fall and winter paintings (spring's is used all year until then)
- [ ] Optional: split it into a couple of screens (each needs its own painting and exit map)
- [ ] Optional: gathering spots like the mountain's (mushrooms, pinecones...), and a set place where Bigfoot turns up

## The Graveyard (later, higher level than the forest: about Lv.17-22)
Music is ready: `graveyard.wav`, `graveyard battle.wav` and `graveyard boss.wav` in `rhythm/songs`.
- [ ] Decide where it is, how it opens (idea: after the Vengeful Ghost, maybe only at night) and its levels
- [ ] Map painting, `maps/graveyard_transitions.png` (and a patch for it on the map that leads there), walls,
      front layer
- [ ] Battle backdrops: `backdrops/graveyard_<season>`
- [ ] Its pests, drafted Nov 27 (art in AutoSprite, prompts in `tools/perchance-prompts.md`):
  - [ ] Zombie Lawn Gnome: slow and tough, comes in pairs, gets back up once unless finished off
  - [ ] Bat Swarm: flies, several quick hits, hard to hit but fragile
  - [ ] Gravedigger Mole: burrows for a turn where it can't be hit, then pops up with a big hit
  - [ ] Will-o'-the-Wisp: flies, drains MP, blinds
  - [ ] Possessed Scarecrow: calls crows in mid-fight
  - [ ] Boss: the Rotten Prize Pumpkin (the Vengeful Ghost's lost pumpkin, now a jack-o'-lantern with a grudge)
- [ ] New moves they need in code: getting back up, burrowing (can't be hit), MP drain, calling for help
- [ ] Their stats, skills, drops and Lore (I'll draft them for you to review)
- [ ] Maybe the Muramatsu flute's new home (sold at Rosa's for 10,000 coins until a later area has it)

## The villagers (townsfolk: Mabel, Rosa, Mr. Hollis, Juniper, Old Pete, Milo, Gus)
- [ ] Walking art in AutoSprite, like the pests (they're simple drawn stand-ins; only their portraits are art).
      A walk and a standing loop each
- [ ] Shop interiors: touch up my starter walls and doorways (`maps/<room>_collision.png`,
      `maps/<room>_transitions.png` for cafe, music, fishshop, bar)
- [ ] Front layers for the rooms (counters, tables), like the house's
- [ ] Ideas from before: friendship hearts with each villager, gifts, little requests or quests,
      more to say as the seasons change

## Songs
- [ ] Forest music (and its battle music), if it shouldn't share the mountain's
- [ ] The graveyard's three tracks, once the area exists

## Sound effects
Recorded ones go in the art folder's `sfx/` (then `python tools/build_sfx.py`). A name ending in a number
("bite 2") is another take. The ones marked with a file name are already asked for by the game and play
a made-up sound until they exist.

**General**
- [ ] `splash.wav`: jumping into the garden pool (borrows the fish jump now); a smaller one climbing out
- [ ] `save.wav`: saving the game (plays menu_confirm now)
- [ ] The frog's healing croak (garden frogs fill everyone's HP)
- [ ] Rhythm game: the count-in beeps, a "perfect" fanfare (the frog's), tapping during the count-in
- [ ] Baby Tiny One begging, and gulping a worm

**Battle**
- [ ] `pep cutin.wav`: the Pep Rally's cut-in sweeping across, like an ultimate move
- [ ] `trouble sleep.wav` (something silly and drowsy) and `trouble hush.wav` (the owl's Hoot: songs and
      skills blocked)
- [ ] A heal chime (healing skills, Snack Break, Soak Up Rain)
- [ ] `rain.wav` (a steady loop; a made-up hiss plays until then) and `thunder.wav` (a made-up rumble until then)
- [ ] A member going down; a pest running off; the party fleeing
- [ ] The Pep meter filling up; the EXP tally ticking on the results
- [ ] Meditate (Focus has its own)

**Friends' skills without a voice yet** (a skill with a recording named after it plays it, e.g.
`sfx/Venom Burst.wav`; these are the ones most worth it)
- [ ] Kaitlyn: Karate Kick (a shout and a big thump)
- [ ] Ivy: Venom Burst, Deathroll, Snakespit, Hypnosis (also Constrict, Shed Skin)
- [ ] Tituba: Double Swipe, Pounce, Hiss, Nine Lives (also Snitch)
- [ ] Tex: Slow and Steady, Graze
- [ ] Tiny One: Dawn Chorus, A True Bird's Nest, Clear Note, Cheery Chirp (they share `tiny_songs` now)

**Pests' special moves** (none have their own sounds; hits share the generic ones). Grouped by the
sound each could share:
- [ ] A roar or bellow: Bear's Roar, Moose's Bellow, Wolf's Pack Howl, Turkey's Gobble, HOA's Noise Complaint
- [ ] A caw or call: Crow's Mocking Caw, Goat's Bleat, Owl's Hoot and Glare
- [ ] Spooky: the ghosts' Boo!, Wail, Chill Touch, Spectral Grasp, Curse, Fade Away, Gather Gloom
- [ ] Munching (healing): Bear's Honey Break, Raccoon's Snack Break
- [ ] A puff of spores: Toadstool's Spore Cloud, Puff, Soak Up Rain
- [ ] Stealing: Rat's Pilfer, Seagull's Snatch, HOA's Fine (a coin jingle)
- [ ] Odd ones: Beetle's Dung Ball (a rolling thud), Raccoon's Trash Toss (clattering cans), HOA's Citation
      and Bylaw Lecture (paper, a stamp), Wasp's Swarm Buzz, Woo's Puppy Eyes (a whimper)
- [ ] Bigfoot: Boulder Toss (a heavy crash), Ground Pound (a quake), Camera Shy (rustling leaves), a roar
- [ ] Pest voices in general: a squeak, a growl, a hiss... for when they're hit or beaten

## Battle effects (animated, made in Effekseer)
Only Fury Swipes has one so far; every other move uses drawn-in-code light effects. Any move can have one
now: save it in the art folder named after the move, e.g. `effects/harvest hymn.png` (see
`effects/instructions.txt`), and run `python tools/build_effects.py`. It plays by itself as the move lands,
on whoever it lands on, in place of the drawn effect, and a multi-hit move plays a share on each hit.
A pest's own version: `effects/<pest> <move>.png` (e.g. `effects/hermit crab shell up.png`). General ones:
`effects/heal.png` (anyone healed) and a trouble's (`effects/poison.png`, `sleep.png`...). Tell me if one
should play once over a whole group, or on whoever used it, or bigger or smaller. The ones that would show
off most:

**Kaitlyn**
- [ ] Karate Kick: a big impact burst on the pest
- [ ] Harvest Hymn (her strongest song, Lv.11): vines and a burst of light over every pest
- [ ] Thorn Nocturne, Wasp Requiem, Bramble Waltz: one each over the pests
- [ ] Frog Lullaby (sleep): drifting notes and Z's

**Ivy**
- [ ] Venom Burst: a green-purple poison explosion
- [ ] Deathroll: a spinning coil
- [ ] Snakespit: a spit of venom flying to the pest
- [ ] Hypnosis: swirling rings

**Tituba**
- [ ] Moonlight Slash: a pale crescent slash
- [ ] Double Swipe: two claw slashes
- [ ] Pounce: an impact
- [ ] Nine Lives: a soft glow around her

**Tex**
- [ ] Shell Slam: a heavy ground impact
- [ ] VitaShell and Shell Up: a shell-shaped shield of light
- [ ] Cover: a shield in front of a friend

**Tiny One**
- [ ] Disarming Trill: sound waves over every pest
- [ ] Dawn Chorus: a warm sunrise glow over the party
- [ ] A True Bird's Nest: a ring of feathers and light
- [ ] Wake-Up Call: a burst that brings a friend back

**Pep Rallies** (they could each have a big one after the cut-in)
- [ ] Rally Cry, Tangleroot Reel (roots), Clean Slate (a sparkling wave), Hype Up (flames of energy),
      Safe and Sound (a dome), Grand Finale (the biggest burst there is)

**Pests**
- [ ] Bigfoot: Boulder Toss (a flying boulder and a crash), Ground Pound (a shockwave across the party)
- [ ] Toadstool: Spore Cloud (a purple cloud over the party)
- [ ] Moose: Antler Charge; Owl: Hoot (sound rings)
- [ ] Vengeful Ghost: Wail, Curse; HOA President: Noise Complaint (sound waves from a megaphone)

**General**
- [ ] Healing (one friend and everyone), reviving, poison, levelling up

## Animations
- [ ] Fix Ivy's victory animation
- [ ] Tiny One: a singing animation for his songs and Tweet (they use his attack loop now)
- [ ] Tituba curled up asleep (at night she stands on the quilt with sleeping Z's)
- [ ] Optional: more garden wildlife (a dragonfly or ladybug), like the bluebird, monarch, bumblebee and hummingbird

## Story and game
- [ ] After the phone test: tune Tituba's and Tex's stats and skills, their spots in town and at home,
      and how easy each meeting is to find
- [ ] Optional, smaller downloads: Tiny One's quest animations (hatching, begging, falling asleep) are
      about 15% of `party.webp` and could load only during his quest
