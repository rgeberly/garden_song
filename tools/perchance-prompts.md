# Perchance prompts

Generator: https://perchance.org/neonewgenerator. Save each image under the name shown, inside the
art folder (`kaitlyns-garden-song-art`). I'll run `tools/build_art.py` and wire them in.
JPEG is fine too: `Baby radish.jpeg` works just like `Baby radish.png`.

## Title screen: "painted anime style", Shape **Portrait**

The game plays a sunrise over this picture: it starts dark and blue, then the sun comes up and warms it.
Keep the horizon near the middle (the sun rises there) and the top third mostly open sky for the title.

| Save as | Description |
|---|---|
| `scenes/title.png` | painted anime style, peaceful early morning view over a cozy backyard vegetable garden, raised wooden garden beds with leafy crops and sunflowers, a wooden fence and flowering bushes, a small pond with lily pads, gentle rolling hills on the horizon in the middle of the picture, wide open pale sky above, soft golden light, calm and cozy, no people, no text, no sun |

## Fishing: "painted anime style", Shape **Portrait**

| Save as | Description |
|---|---|
| `scenes/fishing.png` | painted anime style, view from a grassy riverbank looking out over a calm mountain pond, the water fills most of the picture, a far shore of pine trees and grey rocky peaks along the top fifth, a little patch of the near bank in the bottom left corner, gentle ripples, daylight, no people, no fishing rod, no text |

Fish pictures, Style **No style**, white background, Shape **Square**. They show on the catch window
(and later in the bag). Save each in `shop items/` under the fish's exact name:

| Save as | Description |
|---|---|
| `shop items/Minnow.png` | a single tiny silver minnow fish, side view, cute game item icon, simple shading, centered, plain white background |
| `shop items/Yellow Perch.png` | a single yellow perch fish with dark vertical stripes and orange fins, side view, cute game item icon, centered, plain white background |
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

## Optional

- Townsfolk portraits (Mabel, Rosa, Mr. Hollis, Juniper, Old Pete, Milo), so they don't use stand-in figures.
- A Karate Kick row for `battle.png` (named `karate`); until then it uses the regular kick.
