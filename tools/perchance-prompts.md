# Art still to make

Most art is now made in AutoSprite (see the notes below each list); Perchance's generator
(https://perchance.org/neonewgenerator) works too. Save each image under the name shown, inside the
art folder (`kaitlyns-garden-song-art`). I'll run `tools/build_art.py` and wire them in.
JPEG is fine too: `Badger.jpeg` works just like `Badger.png`.
Everything from the earlier lists (Kaitlyn's faces, collard greens, the Tipsy Toad's drinks, the
summit flowers, the blueberry packet, the rhythm game's rail and stamp, all fifteen pests and the Deep
Forest's seven, their drops, Tituba's and Tex's gear, the bumblebee and hummingbird, and the Deep
Forest's spring map) is in the art folder and the game.

## The Deep Forest's battle backdrops: "Painted Anime", Shape **Portrait**

Like the garden's and the mountain's: the flat ground the fight stands on fills the lower half, the
scenery behind it the upper half. Save as `backdrops/forest_<season>`. Until they exist, forest fights
use the mountain's.

| Save as | Description |
|---|---|
| `backdrops/forest_spring.png` | painted anime style game battle background, a mossy clearing deep in an old forest in spring, the flat open ground of soft moss, short grass and small wildflowers filling the lower half, behind it huge old tree trunks, ferns and mushrooms, shafts of sunlight through a green canopy, no people, no animals, no text |
| `backdrops/forest_summer.png` | the same forest clearing in summer, lush green moss and grass on the lower half, dense ferns, thick trunks and a deep green canopy with dappled light, no people, no animals, no text |
| `backdrops/forest_fall.png` | the same forest clearing in autumn, fallen orange and gold leaves over the ground on the lower half, orange, red and gold oaks among dark pines, red-capped mushrooms by the roots, no people, no animals, no text |
| `backdrops/forest_winter.png` | the same forest clearing in winter, smooth deep snow on the lower half, snow-laden pines and bare oaks, a pale cold light with a little falling snow, no people, no animals, no text |

## Optional: the Deep Forest in other seasons

The spring painting (`maps/forest_spring.png`) is used all year until these exist. Each one needs its
own walls and front layer too (I can trace them like spring's).

| Save as | Description |
|---|---|
| `maps/forest_summer.png` | the same forest clearing as the spring map, in summer, lush dark green canopy, dense ferns and moss, dappled sunlight on the trails |
| `maps/forest_fall.png` | the same forest clearing in autumn, the oaks turned orange, red and gold among the dark pines, fallen leaves on the trails, red-capped mushrooms |
| `maps/forest_winter.png` | the same forest clearing in winter, deep snow on the ground and branches, the trails trodden through the snow, a pale cold light |

## The Graveyard's map: "painted anime style"

An old churchyard for the later, higher-level area. The same top-down three-quarter view as the
garden, town, mountain and forest. Spooky but cozy, like the rest of the game.

| Save as | Description |
|---|---|
| `maps/graveyard_spring.png` | painted anime style video game map, top-down three-quarter view of an old country graveyard, a winding gravel path through rows of mossy tilted headstones, a small stone chapel with a crooked bell tower, an iron fence and gate where the path comes in from the bottom, old yew trees and a gnarled oak, a little caretaker's shed, a patch of overgrown pumpkin vines in one corner, soft evening light, no people, no animals, no text |
| `maps/graveyard_fall.png` | the same graveyard in autumn at dusk, orange leaves over the graves, jack-o'-lanterns by the chapel door, mist low on the ground, no people, no animals, no text |
| `maps/graveyard_winter.png` | the same graveyard in winter, snow on the headstones and the chapel roof, bare black trees, a pale moon, no people, no animals, no text |
| `maps/graveyard_summer.png` | the same graveyard on a warm summer night, fireflies, tall grass and wildflowers between the graves, a big moon, no people, no animals, no text |

Then: `maps/graveyard_transitions.png` (where the path leaves, in the colour of where it goes), walls and
front layer (I can trace them, like the forest's).

## The Graveyard's battle backdrops: "Painted Anime", Shape **Portrait**

| Save as | Description |
|---|---|
| `backdrops/graveyard_spring.png` | painted anime style game battle background, a clearing in an old graveyard at dusk, flat open grass and gravel filling the lower half, behind it mossy tilted headstones, an iron fence and a small stone chapel, a purple evening sky, no people, no animals, no text |
| `backdrops/graveyard_summer.png` | the same graveyard clearing on a summer night, tall grass and wildflowers on the lower half, fireflies, a big moon behind the chapel, no people, no animals, no text |
| `backdrops/graveyard_fall.png` | the same graveyard clearing in autumn, orange leaves and low mist over the ground on the lower half, jack-o'-lanterns by the headstones, no people, no animals, no text |
| `backdrops/graveyard_winter.png` | the same graveyard clearing in winter, smooth snow on the lower half, snowy headstones and bare black trees, a pale moon, no people, no animals, no text |

## The Graveyard's pests: AutoSprite

The same way as the forest's: a base image, then walk, stance and attack. Prompt: "high quality pixel
art, a <description>, facing toward the left side of the screen. RPG enemy sprite, thin black outline,
plain empty background, no shadow". They should look troublesome, not friendly.

| Save as | Description |
|---|---|
| `enemies/gnome/` | a zombie garden gnome, cracked and mossy, glowing green eyes, a chipped pointy red hat |
| `enemies/bats/` | a small swarm of three bats flapping together |
| `enemies/mole/` | a grumpy mole with huge digging claws, a little miner's lamp on its head |
| `enemies/wisp/` | a will-o'-the-wisp, a floating flame of pale blue-green light with a sly face |
| `enemies/scarecrow/` | a possessed scarecrow in a tattered coat and straw hat, a stitched sack face with glowing eyes |
| `enemies/pumpkin/` | the boss: a huge rotting prize pumpkin turned jack-o'-lantern, a blue ribbon still pinned on, vines for arms, a mean carved grin |

## The villagers walking: AutoSprite

They're simple drawn stand-ins in town now; only their portraits are art. Use each portrait in
`people/` as the reference so they match. Each needs a walk and a standing (idle) loop, like the party.

| Who | Reference |
|---|---|
| Mabel (the café) | `people/mabel.jpeg` |
| Rosa (the music shop) | `people/rosa.jpeg` |
| Mr. Hollis (the fishing shop) | `people/mr. hollis.jpeg` |
| Juniper (the junk stand) | `people/juniper.jpeg` |
| Old Pete | `people/old pete.jpeg` |
| Milo (the kid) | `people/milo.jpeg` |
| Gus (the Tipsy Toad) | `people/Gus/` |

## The town's notice board: AutoSprite (or Perchance)

The request board on the town plaza is drawn in code for now. A picture saved as
`shop items/Notice Board.png` replaces it on its own once the art is rebuilt (it stands about as tall
as Kaitlyn, so a squarish picture a little taller than wide works best).

| Save as | Description |
|---|---|
| `shop items/Notice Board.png` | a small wooden village notice board standing on two posts with a little shingled roof, a cork board with several paper notes and requests pinned to it with red pins, cozy painted style to match a pixel-art farming game, front view, isolated on a plain white background, no text |

## Optional: more

- More garden wildlife (`creatures/<Name>-spritesheet.png`, like the bluebird, monarch, bumblebee and
  hummingbird: frames in a grid of 256 px cells, facing right): a dragonfly or a ladybug would join in on their own.
