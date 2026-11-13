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



## Optional: more

- A Karate Kick row for `battle.png` (named `karate`); until then it uses the regular kick.
- More garden wildlife (`creatures/<Name>-spritesheet.png`, like the bluebird and monarch: frames in a
  grid of 256 px cells, facing right): a bumblebee, a dragonfly or a hummingbird would join in on their own.

- What she walks behind, like the garden's `<season>_front.png`: `maps/town_<season>_front.png` and
  `maps/mountain_<season>_front.png`, each showing just the bits of that season's painting that go over
  her, see-through everywhere else (a plain white background works too). Spring's are done; the other
  seasons will be copied from spring's outline.
