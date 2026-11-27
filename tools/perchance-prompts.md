# Art still to make

Most art is now made in AutoSprite (see the notes below each list); Perchance's generator
(https://perchance.org/neonewgenerator) works too. Save each image under the name shown, inside the
art folder (`kaitlyns-garden-song-art`). I'll run `tools/build_art.py` and wire them in.
JPEG is fine too: `Badger.jpeg` works just like `Badger.png`.
Everything from the earlier lists (Kaitlyn's faces, collard greens, the Tipsy Toad's drinks, the
summit flowers, the blueberry packet, the rhythm game's rail and stamp, all fifteen pests and the Deep Forest's seven, their drops, Tituba's and Tex's gear, the bumblebee
and hummingbird) is in the
art folder and the game.

## The Deep Forest's map: "painted anime style", Shape **Portrait**

The second stretch of the mountain trail, through deep old woods. The same top-down three-quarter view
as the garden and the mountain, and a tall map like the mountain's (about 3 screens wide by 5 tall).
The trail comes in from the mountain at the bottom edge and winds up to a clearing near the top, where
Bigfoot turns up. Once a painting arrives I'll lay the paths and walls to match it.

| Save as | Description |
|---|---|
| `maps/forest_spring.png` | painted anime style video game map, top-down three-quarter view of a deep old forest on a mountainside, a narrow dirt trail enters from the bottom middle and winds up between huge old trees to a round sunlit clearing near the top, thick tall pines and big oaks with mossy roots on both sides of the trail, ferns, mushrooms and fallen logs among the trees, a small stream with a little wooden footbridge crossing the trail in the middle, shafts of light through the canopy, wildflowers along the trail, no people, no animals, no text |
| `maps/forest_summer.png` | the same deep forest in summer, lush dark green canopy, dense ferns and moss, dappled sunlight on the trail, the stream sparkling, no people, no animals, no text |
| `maps/forest_fall.png` | the same deep forest in autumn, the oaks turned orange, red and gold among the dark pines, fallen leaves covering the trail and the clearing, clusters of red-capped mushrooms, no people, no animals, no text |
| `maps/forest_winter.png` | the same deep forest in winter, deep snow on the ground and the branches, snow-covered pines, the stream frozen, the trail a path trodden through the snow, a pale cold light, no people, no animals, no text |

Then, like the mountain's, from each painting:
- `maps/forest_<season>_collision.png`: black where she can't walk, white where she can.
- `maps/forest_transitions.png`: a patch at the bottom edge where the trail leaves for the mountain,
  painted gold (255,201,14). On the mountain's `maps/mountain_transitions.png`, a patch where its trail
  leads into the forest, in a colour I'll add for the forest (dark green, (0,100,40), unless you'd like another).
- `maps/forest_<season>_front.png` (optional): the parts of the trees she should walk behind.

## The Deep Forest's battle backdrops: "Painted Anime", Shape **Portrait**

Like the garden's and the mountain's: the flat ground the fight stands on fills the lower half, the
scenery behind it the upper half. Save as `backdrops/forest_<season>`.

| Save as | Description |
|---|---|
| `backdrops/forest_spring.png` | painted anime style game battle background, a mossy clearing deep in an old forest in spring, the flat open ground of soft moss, short grass and small wildflowers filling the lower half, behind it huge old tree trunks, ferns and mushrooms, shafts of sunlight through a green canopy, no people, no animals, no text |
| `backdrops/forest_summer.png` | the same forest clearing in summer, lush green moss and grass on the lower half, dense ferns, thick trunks and a deep green canopy with dappled light, no people, no animals, no text |
| `backdrops/forest_fall.png` | the same forest clearing in autumn, fallen orange and gold leaves over the ground on the lower half, orange, red and gold oaks among dark pines, red-capped mushrooms by the roots, no people, no animals, no text |
| `backdrops/forest_winter.png` | the same forest clearing in winter, smooth deep snow on the lower half, snow-laden pines and bare oaks, a pale cold light with a little falling snow, no people, no animals, no text |

## Optional: more

- More garden wildlife (`creatures/<Name>-spritesheet.png`, like the bluebird, monarch, bumblebee and
  hummingbird: frames in a grid of 256 px cells, facing right): a dragonfly or a ladybug would join in on their own.
