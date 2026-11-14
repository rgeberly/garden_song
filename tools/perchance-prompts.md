# Perchance prompts

Generator: https://perchance.org/neonewgenerator. Save each image under the name shown, inside the
art folder (`kaitlyns-garden-song-art`). I'll run `tools/build_art.py` and wire them in.
JPEG is fine too: `Baby radish.jpeg` works just like `Baby radish.png`.

## Fall pond: "painted anime style", Shape **Portrait**

The fishing game's backdrop in fall (spring has its own, and summer uses `scenes/fishing`). Keep the
water where it is in the others: a river coming from the far middle and widening toward the bottom
right, with a rocky bank down the left side, so the bobber lands on the water.

| Save as | Description |
|---|---|
| `scenes/fishing_fall.png` | painted anime style, view from a grassy riverbank in autumn looking out over a calm mountain river, the water starts narrow in the far middle and widens toward the bottom right, a rocky bank along the left side, orange red and gold autumn trees and dark pines on both shores, grey rocky peaks under a clear sky, a few falling leaves on the water, no people, no fishing rod, no text |

## Fishing: a spinning reel (reminder), Art Style **No style**, white background, Shape **Square**

Replaces the fly reel. The game draws its own crank on top, so leave the handle off.

| Save as | Description |
|---|---|
| `fishing/Reel.png` | realistic studio product photo of a single spinning fishing reel seen from the side, silver and dark green, the round spool and bail on top, no crank handle, isolated on a pure white background, centered |

## New fish: Style **No style**, white background, Shape **Square**

| Save as | Description |
|---|---|
| `shop items/Croaker.png` | a single silvery-tan croaker fish with faint wavy bars, side view, cute game item icon, centered, plain white background |
| `shop items/Crab.png` | a single blue crab with big claws, seen from above, cute game item icon, centered, plain white background |
| `shop items/Octopus.png` | a single pink-red octopus with curling arms, cute game item icon, centered, plain white background |
| `shop items/Tarpon.png` | a single big silver tarpon fish with huge shiny scales and an upturned mouth, side view, cute game item icon, centered, plain white background |
| `shop items/Dolphin.png` | a single smiling grey bottlenose dolphin, side view, cute game item icon, centered, plain white background |

## A better wild daisy: Style **No style**, Shape **Square**

The white petals on a white background get eaten when the background is cut out. On a solid dark green
background the build cuts it out cleanly instead (it handles any plain colour).

| Save as | Description |
|---|---|
| `shop items/Wild Daisy.png` | realistic studio product photo of a small bunch of three wild white daisies with yellow centers and green stems, isolated on a plain solid dark green background, centered, soft even lighting |


## Rhythm game vines: Style **No style**, white background, Shape **Portrait**

The vines that climb both sides of the rhythm game as your combo grows. I'll wire it in when it arrives.

| Save as | Description |
|---|---|
| `rhythm/vine.png` | a single long climbing green vine growing straight up, curling tendrils, heart-shaped leaves and a few small yellow and pink flowers, the whole vine visible from bottom to top, game art, isolated on a pure white background |

## Kaitlyn's faces: match her current portrait (`portrait.png`), Shape **Portrait**

For the talk box, so her face shows how she feels. Same framing and style as her current portrait,
plain white background. I'll wire them in when they arrive.

| Save as | Description |
|---|---|
| `party/Kaitlyn-portrait-smile.png` | the same young woman with long red hair and a green plaid shirt, head and shoulders, smiling warmly with her eyes |
| `party/Kaitlyn-portrait-sad.png` | the same, looking sad, eyebrows drawn together, mouth turned down |
| `party/Kaitlyn-portrait-angry.png` | the same, looking angry, frowning, cheeks a little red |
| `party/Kaitlyn-portrait-concerned.png` | the same, looking worried and concerned |
| `party/Kaitlyn-portrait-questioning.png` | the same, one eyebrow raised, puzzled and questioning |
| `party/Kaitlyn-portrait-determined.png` | the same, determined, fist raised, a confident little smile |
| `party/Kaitlyn-portrait-amazed.png` | the same, amazed, eyes wide and mouth open in wonder |



## Town interiors: "painted anime style", Shape **Portrait**

The inside of the town's shops and the bar, painted like the house (`map_house.jpg`): seen from above at a
slant, warm and cozy, one room filling the picture, with the doorway at the bottom middle so she walks in from
the bottom. Leave space in the middle of the floor to walk around, and a counter across the upper part with
room behind it for the shopkeeper. They're drawn in code as plain placeholder rooms until these arrive.
Walls for each (black blocked, white open, like the house) can come after: `maps/<name>_collision.png`.

| Save as | Description |
|---|---|
| `maps/cafe.png` | painted anime style, top-down three-quarter view of the inside of a small cozy country café, wooden floorboards, a long wooden counter across the upper part with a glass pastry case of pies and honey buns, a brick bread oven on the back wall, three little round tables with chairs on the floor, warm morning light through the windows, potted herbs, the front doorway at the bottom center, no people, no text |
| `maps/music.png` | painted anime style, top-down three-quarter view of the inside of a small old-fashioned music shop, wooden floor, a counter across the upper part, shelves of sheet music along the left wall, flutes, fiddles and guitars hanging on the right wall, an upright piano and a drum on the floor, warm lamplight, the front doorway at the bottom center, no people, no text |
| `maps/fishshop.png` | painted anime style, top-down three-quarter view of the inside of a small rustic fishing tackle shop, worn wooden floor, a counter across the upper part, fishing rods standing in a rack along the left wall, nets and lures on the back wall, a few bubbling bait tanks and wooden crates on the floor, a mounted fish above the counter, the front doorway at the bottom center, no people, no text |
| `maps/bar.png` | painted anime style, top-down three-quarter view of the inside of a cozy small-town tavern at night, dark wooden floor, a long polished bar across the upper part with stools in front of it, shelves of bottles behind it, three small round tables with chairs, an old upright piano in a corner, glowing lanterns and warm golden light, a little frog sign on the wall, the front doorway at the bottom center, no people, no text |

## Gus, the bartender: match the townsfolk portraits (`people/`), Shape **Portrait**

He runs the Tipsy Toad in town, open from 6 PM. Same framing and style as the other townsfolk.

| Save as | Description |
|---|---|
| `people/Gus.png` | portrait of a friendly middle-aged bartender with a bushy brown beard and rolled-up sleeves, a dark green vest over a white shirt, a towel over one shoulder, a warm grin, head and shoulders, same style as the other townsfolk portraits, plain white background |

## New equipment: Style **No style**, white background, Shape **Square**

Kaitlyn's starting shirt, and the first accessories for Ivy and Tiny One (sold at Juniper's). Until these
arrive they show without a picture.

| Save as | Description |
|---|---|
| `shop items/Evergreen Flannel.png` | realistic studio product photo of a single folded green and dark green plaid flannel shirt, soft and cozy, isolated on a pure white background, centered |
| `shop items/Fang Polish.png` | realistic studio product photo of a tiny glass bottle of shiny violet polish with a small brush cap, isolated on a pure white background, centered |
| `shop items/Scale Charm.png` | realistic studio product photo of a small charm made of a single iridescent green snake scale on a thin gold ring, isolated on a pure white background, centered |
| `shop items/Silver Bell.png` | realistic studio product photo of a single small shiny silver bell on a thin red ribbon, isolated on a pure white background, centered |
| `shop items/Downy Scarf.png` | realistic studio product photo of a tiny soft cream-colored knitted scarf, folded, fluffy like down feathers, isolated on a pure white background, centered |

## Mountain battle backdrops: "Painted Anime", Shape **Portrait**

Fights on Bramble Peak get their own backdrop for each season, like the garden's (`backdrops/<season>`):
a clearing seen from the side, the ground filling the lower half (the fighters stand on it), and
the scenery behind in the upper half. Save as `backdrops/mountain_<season>`.

| Save as | Description |
|---|---|
| `backdrops/mountain_spring.png` | painted anime style game battle background, a grassy mountain clearing on a trail in spring, the flat open meadow ground filling the lower half with small wildflowers, behind it pine trees, mossy boulders and tall grey rocky peaks with snow on top under a bright blue sky with soft clouds, no people, no animals, no text |
| `backdrops/mountain_summer.png` | the same mountain clearing in summer, lush deep green grass on the lower half, tall pines, sunlit rocky peaks without snow, a hazy warm sky, a few butterflies, no people, no animals, no text |
| `backdrops/mountain_fall.png` | the same mountain clearing in autumn, golden and orange grass and fallen leaves on the lower half, orange red and gold trees among dark pines, grey peaks, a clear crisp sky, no people, no animals, no text |
| `backdrops/mountain_winter.png` | the same mountain clearing in winter, deep smooth snow on the lower half, snow-covered pines, white peaks, a pale cold sky with light falling snow, no people, no animals, no text |

## The rhythm game's flute: Style **No style**, white background, Shape **Landscape**

The hit line across the rhythm game. Flutes are equipment now, so one handsome flute for all of them.

| Save as | Description |
|---|---|
| `rhythm/flute.png` | realistic studio product photo of a single long polished wooden transverse flute lying perfectly horizontal, warm honey-colored wood with brass rings and a row of finger holes, the whole flute visible from end to end, isolated on a pure white background, centered |

## New equipment: Style **No style**, white background, Shape **Square**

Weapons, clothes and accessories for Kaitlyn, Ivy and Tiny One (in the game once their pictures are in).

| Save as | Description |
|---|---|
| `shop items/Bamboo Fife.png` | realistic studio product photo of a single short bamboo fife flute with a red tassel, isolated on a pure white background, centered |
| `shop items/Garden Overalls.png` | realistic studio product photo of a single pair of folded faded blue denim garden overalls with brass buttons and a patched knee, isolated on a pure white background, centered |
| `shop items/Silver Fang Caps.png` | realistic studio product photo of two tiny curved silver fang caps side by side, like little jewelry for a snake, isolated on a pure white background, centered |
| `shop items/Mossy Wrap.png` | realistic studio product photo of a small soft wrap of green moss and woven ivy leaves rolled into a ring, isolated on a pure white background, centered |
| `shop items/Reed Whistle.png` | realistic studio product photo of a single small hand-carved reed whistle tied with twine, isolated on a pure white background, centered |
| `shop items/Acorn Cap.png` | realistic studio product photo of a single tiny acorn cap worn as a little hat, with a short stem on top, isolated on a pure white background, centered |
| `shop items/Four-Leaf Clover.png` | realistic studio product photo of a single four-leaf clover pressed in a small round glass charm, isolated on a pure white background, centered |

## Ideas for Tituba and Tex (not made yet)

- **Tituba** (Siamese cat, claw attacks): weapon *Silver Claw Tips* (+Strength, more critical hits);
  clothes *Velvet Ribbon* (+Agility); accessories *Catnip Sachet* (Focus charges her up faster) and
  *Moonstone Collar* (+Luck, a chance to dodge).
- **Tex** (old tortoise, the tank): weapon *Old Oak Cane* (+Strength, covering allies costs less);
  clothes *Mossy Shell Cover* (+Defense, +HP); accessories *Sun-Warmed Stone* (mends a little HP
  each turn) and *Shell Polish* (+Defense, takes less from hits while covering).

## Optional: more

- A Karate Kick row for `battle.png` (named `karate`); until then it uses the regular kick.
- More garden wildlife (`creatures/<Name>-spritesheet.png`, like the bluebird and monarch: frames in a
  grid of 256 px cells, facing right): a bumblebee, a dragonfly or a hummingbird would join in on their own.

- What she walks behind, like the garden's `<season>_front.png`: `maps/town_<season>_front.png` and
  `maps/mountain_<season>_front.png`, each showing just the bits of that season's painting that go over
  her, see-through everywhere else (a plain white background works too). Spring's are done; the other
  seasons will be copied from spring's outline.
