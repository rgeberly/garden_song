# Perchance prompts

Generator: https://perchance.org/neonewgenerator. Save each image under the name shown, inside the
art folder (`kaitlyns-garden-song-art`). I'll run `tools/build_art.py` and wire them in.

## New crops: Art Style **No style**, Shape **Square**

Anti-description for all crop pictures:
`text, watermark, pot, planter, people, hands, scenery, background objects, multiple plants, cartoon, illustration`

| Save as | Description |
|---|---|
| `crops/Baby radish.png` | realistic studio product photo of a single young radish seedling plant, small fresh green leaves on a short stem, a few crumbs of soil at its base, isolated on a pure white background, centered, whole plant visible, soft even lighting |
| `crops/Mature radish.png` | realistic studio product photo of a single mature radish plant, leafy green tops with a round bright red radish root half showing at its base, isolated on a pure white background, centered, whole plant visible, soft even lighting |
| `crops/Baby carrot.png` | realistic studio product photo of a single young carrot seedling, a few thin feathery green fronds, a few crumbs of soil at its base, isolated on a pure white background, centered, whole plant visible, soft even lighting |
| `crops/Mature carrot.png` | realistic studio product photo of a single mature carrot plant, tall feathery green fronds with the orange top of the carrot root showing at its base, isolated on a pure white background, centered, whole plant visible, soft even lighting |
| `crops/Baby beet.png` | realistic studio product photo of a single young beet seedling, small green leaves with red stems and veins, a few crumbs of soil at its base, isolated on a pure white background, centered, whole plant visible, soft even lighting |
| `crops/Mature beet.png` | realistic studio product photo of a single mature beet plant, big glossy green leaves with deep red stems, the round dark red-purple beet root half showing at its base, isolated on a pure white background, centered, whole plant visible, soft even lighting |
| `crops/Baby pumpkin.png` | realistic studio product photo of a young pumpkin vine plant with a few big rounded green leaves and one yellow pumpkin flower, isolated on a pure white background, centered, whole plant visible, soft even lighting |
| `crops/Mature pumpkin.png` | realistic studio product photo of a pumpkin vine with large green leaves and one big ripe orange pumpkin sitting at its base, isolated on a pure white background, centered, whole plant visible, soft even lighting |

## Seed packets: **No style**, **Square**

Anti-description: `watermark, people, hands, scenery, background objects, multiple packets, cartoon`

| Save as | Description |
|---|---|
| `shop items/Radish seed.png` | realistic product photo of a paper seed packet for radish seeds, the front label says RADISH SEEDS with a photo of fresh red radishes, isolated on a pure white background, front view, centered |
| `shop items/Carrot seed.png` | realistic product photo of a paper seed packet for carrot seeds, the front label says CARROT SEEDS with a photo of fresh orange carrots, isolated on a pure white background, front view, centered |
| `shop items/Beet seed.png` | realistic product photo of a paper seed packet for beet seeds, the front label says BEET SEEDS with a photo of fresh red beets, isolated on a pure white background, front view, centered |
| `shop items/Pumpkin seed.png` | realistic product photo of a paper seed packet for pumpkin seeds, the front label says PUMPKIN SEEDS with a photo of a ripe orange pumpkin, isolated on a pure white background, front view, centered |

## Battle backgrounds: put "painted anime style" at the start, Shape **Portrait**

Anti-description: `people, characters, animals, text, watermark, frame, ui`

| Save as | Description |
|---|---|
| `backdrops/spring.png` | painted anime style background art for a side-view RPG battle, a cozy backyard garden in spring, pink and yellow flower beds, a wooden fence and leafy trees in the distance, soft blue sky with fluffy clouds, a wide open stretch of grass in the lower half for characters to stand on, no people, no text |
| `backdrops/summer.png` | the same, *in summer, sunflowers, deep green trees, bright blue sky* |
| `backdrops/fall.png` | the same, *in autumn, orange and red trees, falling leaves, pumpkins by the fence, warm golden sky* |
| `backdrops/winter.png` | the same, *in winter, snow on the ground and the fence, bare frosty trees, pale winter sky* |

## Rhythm game: "painted anime style", Shape **Portrait**

| Save as | Description |
|---|---|
| `rhythm/background.png` | painted anime style vertical background for a music rhythm game, a magical garden at dusk seen from above, four softly glowing paths of light running from the top to the bottom of the picture, fireflies and floating music notes, flowers along the edges, cozy and calm, no people, no text |
| `rhythm/notes.png` (Square, No style) | four glossy round musical note gems for a game, one green, one gold, one pink, one blue, each shaped like a flower, in a row, on a plain white background, game icons |

## Placeholder maps: "painted anime style", Shape **Square**

These are the same top-down three-quarter view as the garden. Once a painting arrives, I'll move the
buildings, people, paths and walls in `js/17-places.js` to match it.

| Save as | Description |
|---|---|
| `maps/town.png` | painted anime style video game map, top-down three-quarter view looking down on a small cozy village, a round stone plaza with a fountain in the middle, a café with a red roof, a general store with a blue roof and a tool shop with a grey roof along the top, a yellow striped market tent on the right, two small cottages at the bottom left, a dirt road leaving to the east, trees around the edges, no people, no text |
| `maps/mountain.png` | painted anime style video game map, top-down three-quarter view looking down on a mountain meadow, rocky snow-capped cliffs along the top edge, pine trees scattered around, a round blue pond on the right side, a winding dirt trail coming in from the bottom middle, wildflowers in the grass, no people, no text |

## Optional

- Townsfolk portraits (Mabel, Rosa, Mr. Hollis, Juniper, Old Pete, Milo), so they don't use stand-in figures.
- Forage and fish icons (`goods/<Name>.png`, No style, white background), to replace the drawn ones.
