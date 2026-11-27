# Art still to make

Most art is now made in AutoSprite (see the notes below each list); Perchance's generator
(https://perchance.org/neonewgenerator) works too. Save each image under the name shown, inside the
art folder (`kaitlyns-garden-song-art`). I'll run `tools/build_art.py` and wire them in.
JPEG is fine too: `Badger.jpeg` works just like `Badger.png`.
Everything from the earlier lists (Kaitlyn's faces, collard greens, the Tipsy Toad's drinks, the
summit flowers, the blueberry packet, the rhythm game's rail and stamp, all fifteen pests and the Deep Forest's seven) is in the
art folder and the game.

## The Deep Forest's drops: Assets, Ultra, style "painted", white background, folder "Items"

Prompt for each: "**<description>**, realistic studio product photo, isolated on pure white
background, centered". The rare ones marked *gear* can also be worn.

| Save as | Description |
|---|---|
| `shop items/Wolf Fur.png` | a thick tuft of grey wolf fur with a few burrs caught in it |
| `shop items/Silver Fang.png` | a single wolf fang with a gleaming silver shine (*gear*: Ivy's weapon) |
| `shop items/Turkey Feather.png` | a single striped brown wild turkey tail feather |
| `shop items/Golden Wishbone.png` | a gleaming golden wishbone (*gear*) |
| `shop items/Puffball Spores.png` | a small round puffball mushroom releasing a little puff of brown spores |
| `shop items/Morel.png` | a single morel mushroom with its honeycomb cap |
| `shop items/Badger Bristles.png` | a small bundle of stiff black-and-white badger bristles tied with string |
| `shop items/Claw Charm.png` | a curved badger claw hanging on a leather cord, like a necklace charm (*gear*) |
| `shop items/Owl Feather.png` | a single soft speckled brown owl feather |
| `shop items/Moonlit Feather.png` | a single pale silvery-blue feather that glows faintly with moonlight (*gear*) |
| `shop items/Shed Antler.png` | a single shed moose antler, broad and flat with points |
| `shop items/Velvet Antler.png` | a single young moose antler still covered in soft brown velvet |
| `shop items/Plaster Footprint.png` | a plaster cast of an enormous hairy humanoid footprint |
| `shop items/Blurry Photo.png` | an old blurry instant photo of a big hairy figure walking through a forest |

## Tituba's and Tex's gear: Assets, Ultra, style "painted", white background, folder "Items"

Sold at Juniper's. Same prompt as the drops above.

| Save as | Description |
|---|---|
| `shop items/Silver Claw Tips.png` | a set of five tiny shiny silver caps for a cat's claws, laid out in a row |
| `shop items/Velvet Ribbon.png` | a soft deep blue velvet ribbon tied in a bow |
| `shop items/Catnip Sachet.png` | a small cloth sachet of dried catnip tied with a string, a few green leaves peeking out |
| `shop items/Moonstone Collar.png` | a slim cat collar with a glowing milky-blue moonstone pendant |
| `shop items/Discarded Dentures.png` | an old pair of false teeth dentures, slightly worn |
| `shop items/Mossy Shell Cover.png` | a cozy round cover of green moss and little leaves, shaped to fit a tortoise's shell |
| `shop items/Sun-Warmed Stone.png` | a smooth flat river stone glowing warm orange as if heated by the sun |
| `shop items/Shell Polish.png` | a small tin of shell polish with a cloth, a tortoise on the label |

## Optional: more

- More garden wildlife (`creatures/<Name>-spritesheet.png`, like the bluebird and monarch: frames in a
  grid of 256 px cells, facing right): a bumblebee, a dragonfly or a hummingbird would join in on their own.
- The Deep Forest itself: a painted map (with `maps/forest_<season>_collision`, `_transitions` and a
  front layer if trees should stand in front of Kaitlyn) and battle backdrops `backdrops/forest_<season>`.
