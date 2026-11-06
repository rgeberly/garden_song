# Perchance prompts

Generator: https://perchance.org/neonewgenerator. Save each image under the name shown, inside the
art folder (`kaitlyns-garden-song-art`). I'll run `tools/build_art.py` and wire them in.
JPEG is fine too: `Baby radish.jpeg` works just like `Baby radish.png`.

## Title logo: Art Style **No style**, Shape **Landscape**

It sits at the top of the title screen, over the sky of the title picture, so keep the background pure
white (the game cuts it out). Image generators often misspell words, so make a few and check the
spelling. If the words won't come out right, make the second one instead: a frame with an empty banner,
and the game writes "Kaitlyn's Garden Song" across it in gold.

Anti-description: `watermark, photo, people, scenery, background, blurry, misspelled`

| Save as | Description |
|---|---|
| `logo.png` | a cute cozy video game title logo that reads "Kaitlyn's Garden Song", chunky rounded golden letters with a dark brown outline, a little flute and curling green vines with tiny leaves and pink flowers woven around the letters, a few small music notes floating up, storybook fantasy style, centered, isolated on a pure white background |
| `logo frame.png` | a cute cozy video game title banner with no text, a wide empty cream ribbon banner in the middle, framed by curling green vines with tiny leaves, pink and yellow flowers, a golden flute across the top and small floating music notes, storybook fantasy style, centered, isolated on a pure white background |

Save it straight in the art folder (not in a subfolder). Only one is used: `logo` if it's there.

## Fishing tackle: Art Style **No style**, white background

These replace the drawn rod, reel and bobber in the fishing game. Save them in a new `fishing` folder.

Anti-description: `text, watermark, people, hands, fish, water, scenery, background objects, cartoon`

| Save as | Shape | Description |
|---|---|---|
| `fishing/Rod.png` | **Portrait** | realistic studio product photo of a single fishing rod standing straight up and down, cork handle at the bottom, slim dark green rod with small silver line guides, the thin tip at the very top, the whole rod visible, isolated on a pure white background, centered |
| `fishing/Reel.png` | **Square** | realistic studio product photo of a single round fly fishing reel seen straight from the side, a flat round silver and dark green face with a hub in the middle, no crank handle, isolated on a pure white background, centered |
| `fishing/Bobber.png` | **Square** | realistic studio product photo of a single round fishing bobber, top half bright red, bottom half white, a small stem on top, isolated on a pure white background, centered |

The rod has to stand straight up and down with its tip at the top: the game turns it to point at the water.
The reel is the round wheel you wind; the game draws its spinning handle on top, so leave the crank off.

## Fish still missing: Style **No style**, white background, Shape **Square**

They show on the catch window and in the bag. Save each in `shop items/` under the fish's exact name:

| Save as | Description |
|---|---|
| `shop items/Rainbow Trout.png` | a single rainbow trout with a pink stripe and speckles, side view, cute game item icon, centered, plain white background |
| `shop items/Largemouth Bass.png` | a single green largemouth bass with a big mouth, side view, cute game item icon, centered, plain white background |
| `shop items/Catfish.png` | a single grey-brown catfish with long whiskers, side view, cute game item icon, centered, plain white background |
| `shop items/Golden Koi.png` | a single shining golden koi fish with flowing fins, side view, cute game item icon, sparkles, centered, plain white background |

## Music stand: Style **No style**, white background, Shape **Portrait**

The practice stand in Kaitlyn's bedroom; it replaces the drawn one.

| Save as | Description |
|---|---|
| `shop items/Music Stand.png` | a small wooden music stand with a page of sheet music on it, three-legged folding stand, warm brown wood, three-quarter view from slightly above, cute cozy game object, simple shading, centered, plain white background |

## Placeholder maps: "painted anime style", Shape **Portrait**

The same top-down three-quarter view as the garden. The mountain is now a tall map, about four screens
high (3 wide by 5 tall). Once a painting arrives, I'll move the trail, trees and gathering spots in
`js/17-places.js` to match it.

| Save as | Description |
|---|---|
| `maps/mountain_spring.png` | painted anime style video game map, top-down three-quarter view of a tall mountainside, a dirt trail zigzags up from the bottom middle in switchbacks to a round stone lookout near the top, rocky snow-capped cliffs along the top edge, pine forest on both sides of the trail, a round blue pond on the right side in the lower third, wildflowers in the grass, no people, no text |

(The same with `summer`, `fall` and `winter` in the name and the season described, if you'd like them.)

## Optional: townsfolk portraits, "painted anime style", Shape **Portrait**

They'd show in the talk box instead of the little stand-in figures. These need a small hookup in the
build, which I'll do when they arrive. Keep them in a matching style: head and shoulders, facing
slightly left, plain white background.

| Save as | Description |
|---|---|
| `people/Mabel.png` | painted anime style head and shoulders portrait of a kind plump elderly woman café owner, white hair in a bun, rosy cheeks, red apron over a cream blouse, warm smile, plain white background |
| `people/Rosa.png` | painted anime style head and shoulders portrait of a cheerful young woman shopkeeper with dark brown wavy hair, blue overalls, a pencil behind her ear, plain white background |
| `people/Mr. Hollis.png` | painted anime style head and shoulders portrait of a gruff but friendly older man tool shop owner, grey hair and grey mustache, grey work shirt, reading glasses on his nose, plain white background |
| `people/Juniper.png` | painted anime style head and shoulders portrait of an energetic young woman market trader with copper red hair in a messy ponytail, orange scarf, freckles, big grin, plain white background |
| `people/Old Pete.png` | painted anime style head and shoulders portrait of a weathered old mountain hiker with a white beard, brown flannel shirt and a battered hat, twinkling eyes, plain white background |
| `people/Milo.png` | painted anime style head and shoulders portrait of an excited young boy with spiky blond hair, green t-shirt, a bandage on his cheek, wide curious eyes, plain white background |

## Optional: more

- A Karate Kick row for `battle.png` (named `karate`); until then it uses the regular kick.
- More garden wildlife (`creatures/<Name>-spritesheet.png`, like the bluebird and monarch: frames in a
  grid of 256 px cells, facing right): a bumblebee, a dragonfly or a hummingbird would join in on their own.
