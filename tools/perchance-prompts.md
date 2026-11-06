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
- Walls for the mountain (`maps/mountain_collision.png`, black = blocked, white = open, the same size as
  the mountain maps): right now they're worked out from the spring painting's colours, which mostly works
  but lets her onto a strip of far-off slope on the right. Painting this file replaces them.
