"""Turn the hand-made crop, soil, market stand and shop item pictures into
game-ready sprite sheets.

    python tools/build_art.py [source folder]      (needs: pip install numpy opencv-python)

The source folder (default: the kaitlyns-garden-song-art folder next to the game,
where the full-size originals live) holds
    crops/Sprout.png, crops/Baby <crop>.png, crops/Mature <crop>.png
    Soil.png, MarketStand.png
    shop items/<exact shop item name>.png
    creatures/<Name>-spritesheet.png     animation frames in a grid of 256px cells
    crops/<Name>-spritesheet.png         garden effects (the music note), same layout
    crops/harvest <Crop>.png             the picked crop, shown in the bag and at the stall
    shop items/<Tree> sapling.png        a fruit tree's sapling: sold instead of a seed, and
                                         what stands in the stone ring just after planting
    party/<Name>-ready-spritesheet.png   a party member's ready-for-their-turn loop, same layout
    party/<Name>-battle.png              their still battle stance (Kaitlyn's is pose.png)
    party/<Name>-attack-spritesheet.png  their attack, same layout
    party/<Name>-portrait.png            their face for menus and conversations
    party/<Name>/<Name> - ready - spritesheet.png   (and so on) the same, kept in a folder
    party/<Name>/<Name> - baby.png, <Name> (baby)-beg.png, <Name> - baby portrait.png
                                         a member who starts out as a baby (Tiny One)
    scenes/<name>.png                    full pictures shown in story scenes
    fishing/Rod.png, Reel.png, Bobber.png   the fishing game's tackle (white background)
    logo.png  or  logo frame.png          the title screen's logo (white background):
                                          with the words, or a frame the game writes them on
Pictures can be PNG or JPEG (animation sheets must be PNG, for their transparency) and
may have a white background: white touching the edge of the picture is
removed (light grey shadows on it become see-through shadows). Each picture is
trimmed, shrunk to game size and packed into
    assets/sprites/crops.png        crops, soil and the stand
    assets/sprites/shop_items.png   shop pictures
    assets/sprites/creatures.png    creature and garden-effect animation frames
    assets/sprites/party.webp       party members' battle frames (drawn at 2x, like pose.png)
    assets/sprites/portrait_<name>.png   party portraits, as tall as Kaitlyn's portrait.png
    assets/scenes/<name>.jpg        story pictures, 1080 px wide
with their positions written to js/data/art.js.
"""
import cv2, numpy as np, os, sys, glob, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(ROOT), 'kaitlyns-garden-song-art')
OUT = os.path.join(ROOT, 'assets', 'sprites')

# On-screen size, in device px (3 per game px), of a full 1024px source picture.
# Pictures keep their sizes relative to each other within a group.
CANVAS_PX = {'sprout': 84, 'baby': 126, 'mature': 162, 'soil': 108, 'stand': 300,
             'baby tree': 150, 'mature tree': 228, 'damaged': 126, 'harvest': 120, 'sapling': 120}
# harvest pictures named in the plural: the crop's name in the game
HARVEST_ALIAS = {'blueberries': 'blueberry', 'muscadines': 'muscadine', 'strawberries': 'strawberry',
                 'tomatoes': 'tomato', 'beets': 'beet', 'carrots': 'carrot', 'radishes': 'radish'}
# planted, a sapling's roots are underground: the share of its picture's height kept, from the top
SAPLING_KEEP = {'avocado': 0.78, 'muscadine': 0.82, 'satsuma': 0.67}
# the fruit trees' seed pictures, made by mistake (they're sold as saplings): left out
SHOP_SKIP = {t + ' seed' for t in ('satsuma', 'muscadine', 'avocado')}
# fruit trees grow in the stone rings and stand taller than the bed crops
TREES = {'satsuma', 'muscadine', 'avocado'}
CROP_GROUPS = ('sprout', 'baby', 'mature', 'baby tree', 'mature tree', 'damaged')
SHOP_BOX = 240          # shop pictures are fitted into this square, in device px
# Pure white enclosed by the picture (between leaves, inside a handle) is also
# background, but only where the art itself has no big white parts: every crop,
# and these shop items. Smallest hole cleared, in source px.
CROP_HOLE = 40
# Yard decorations shown in the garden reuse their shop pictures, at this height
# (device px) on the map: {key in the game: shop item name}.
DECOR = {'fountain': ('frog fountain', 168), 'bath': ('bird bath', 162),
         'arch': ('flower arch', 300), 'lantern': ('stone lantern', 186)}
# Creatures that flutter around the garden: width of one frame in device px.
CREATURE_W = {'bluebird': 66, 'monarch': 48, 'music note': 39, 'earthworm': 48}
# creatures that stay on the ground instead of flying across the garden (garden effects)
GROUND_CREATURES = {'earthworm'}
CREATURE_CELL = 256
# ...and these, where the background caught inside is off-white too (between legs, inside loops)
SHOP_SOFT_HOLES = {'music stand': 40}
# ...and these, white themselves on white: cut out by their outline instead
SHOP_CUTOUT = {'snowdrop'}
# ...and studio photos of what pests leave behind: cut out with photo_cutout. Pale ones,
# on a pale backdrop, need gentler settings (see photo_cutout).
SHOP_PHOTOS = {n: (7.0, 26) for n in ('dung ball', 'iridescent shell', 'royal jelly', 'shiny button', 'lost ring',
    'bristle tuft', 'stolen fry', 'ectoplasm', 'ghostly locket', 'shell shard', 'black feather', 'shiny spoon',
    'trash treasure', 'bandit mask', 'chewed ball', 'fancy collar', 'wisp', 'prize ribbon', 'mountain bell', 'tusk',
    'truffle', 'bear fur', 'honeycomb', 'gavel')}
SHOP_PHOTOS.update({'silk cocoon': (2.0, 6), 'pearl': (2.0, 6), 'goat hair': (2.0, 6), 'gull feather': (1.2, 8),
                    'paper scrap': (1.2, 8), 'citation': (0.5, 12)})
# Shop pictures with a pale painted shadow under them (the game draws its own): below this
# share of the picture's height, pale greyish beige is cleared.
SHOP_FLOOR = {'music stand': 0.65}
SHOP_HOLES = {'harvest basket': 2000, 'coffee': 2000, 'watering can': 2000, 'seed apron': 2000}
# Party members in battle, sized on their first ready frame, in sheet px (the game draws
# these at 2 device px each): Kaitlyn as tall as her pose.png battle stance (189 px),
# Bling by her length.
PARTY_FIT = {'kaitlyn': ('h', 189), 'bling': ('w', 70), 'tiny': ('h', 66)}
# party members the game has (PARTY_INFO in js/04-state.js); others in party/ (future
# members like Tituba and Tex) are left out of party.webp until they join the game
PARTY_IN_GAME = {'kaitlyn', 'bling', 'tiny'}
# party folders named differently from the member's id in the game
PARTY_IDS = {'tiny one': 'tiny', 'ivy': 'bling'}
# a baby's still picture and begging loop, by their height in sheet px (drawn smaller in the nest)
BABY_H = 90
HATCH_H = 90            # an egg hatching: the egg's height in sheet px
# Places with painted maps and their own walls: their size in the game (world px, as in
# js/17-places.js) and the walls' grid (world px per cell). The mountain's walls come from
# its painting unless maps/mountain_collision is there; MOUNTAIN_OPEN marks parts of the
# painting as open anyway (shares of its width and height: x, y, w, h).
# Enemies with white background caught between their legs: clear pure-white pockets
# whose middle is below this share of the picture's height, at least this big (px).
ENEMY_POCKETS = {'seagull': (0.58, 60), 'crow': (0.5, 200), 'goat': (0.0, 1500), 'boar': (0.5, 2000), 'bear': (0.5, 2000)}
# Enemy pictures with a transparency checkerboard painted in (no real transparency)
ENEMY_CHECKERED = {'dung beetle', 'hoa president', 'raccoon'}
PLACE_SIZE = {'mountain': (1080, 1446), 'town': (720, 720)}
PLACE_GRID = 4
SEASON_NAMES = ('spring', 'summer', 'fall', 'winter')
# entry/exit maps (maps/<area>_transitions): the colour for each place a patch leads to
# (Paint's palette; the garden's maps/transitions uses the same red, gold and blue)
ZONE_DESTS = ('garden', 'town', 'mountain', 'house', 'cafe', 'music', 'fishshop', 'bar')
ZONE_COLS = {'garden': (34, 177, 76), 'town': (237, 28, 36), 'mountain': (255, 201, 14), 'house': (0, 162, 232),
             'cafe': (255, 127, 39), 'music': (163, 73, 164), 'fishshop': (63, 72, 204), 'bar': (185, 122, 87)}
# the areas with entry/exit maps, and their size in the game (world px; the house in painting px)
AREA_ZONE_SIZE = {'town': (720, 720), 'mountain': (1080, 1446), 'house': (512, 768)}
MOUNTAIN_OPEN = [(0.34, 0.90, 0.21, 0.10)]
# Enemies (enemies/<Name>.png|jpg): their key in the game and height in battle (device px).
# Pixel art smaller than that is enlarged with hard edges.
ENEMIES = {'dung beetle': ('beetle', 190), 'paper wasp': ('wasp', 220), 'garden rat': ('rat', 250),
           'saddleback': ('saddleback', 190), 'seagull': ('seagull', 230), 'hermit crab': ('crab', 240),
           'spiteful crow': ('crow', 260), 'shy ghost': ('ghost', 250), 'raccoon': ('raccoon', 230),
           'tricky woo': ('woo', 250), 'vengeful ghost': ('vghost', 300), 'hoa president': ('hoa', 360),
           'mountain goat': ('goat', 240), 'wild boar': ('boar', 230), 'black bear': ('bear', 320)}
PORTRAIT_H = 312        # Kaitlyn's portrait.png height, in px
STANCE_HOLE = 400       # white showing through a coil of a battle stance is background too
SCENE_W = 1080          # story pictures fill the 360-wide screen at 3 device px each


PIC_EXT = ('.png', '.jpg', '.jpeg')


def pics(folder):
    """Every picture (PNG or JPEG) in a folder of the art folder."""
    return sorted(f for f in glob.glob(os.path.join(SRC, folder, '*.*'))
                  if os.path.splitext(f)[1].lower() in PIC_EXT and '-spritesheet' not in f.lower())


def named_pics(folder):
    """(lower-case name, path) of each picture in a folder of the art folder: loose pictures
    by their file name, and for a subfolder holding exactly one picture (the favorite left
    after trying several versions), that picture under the subfolder's name."""
    found = {os.path.splitext(os.path.basename(f))[0].strip().lower(): f for f in pics(folder)}
    for d in sorted(glob.glob(os.path.join(glob.escape(os.path.join(SRC, folder)), '*', ''))):
        name = os.path.basename(os.path.dirname(d)).strip().lower()
        inside = pics(os.path.join(folder, os.path.basename(os.path.dirname(d))))
        if len(inside) == 1: found.setdefault(name, inside[0])
        elif inside: print('  skipped', folder + '/' + name, '-', len(inside), 'pictures (keep just one)')
    return sorted(found.items())


def find_pic(base):
    """base + .png/.jpg/.jpeg, whichever exists (or None)."""
    for e in PIC_EXT:
        if os.path.exists(base + e): return base + e
    return None


def load(path):
    a = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if a.ndim == 2: a = cv2.cvtColor(a, cv2.COLOR_GRAY2BGRA)
    if a.shape[2] == 3: a = cv2.cvtColor(a, cv2.COLOR_BGR2BGRA)
    return a


def remove_white(a, hole=0, soft_holes=False):
    """Clear the white background that touches the picture's edge (and enclosed
    pure-white holes of at least `hole` px, when asked)."""
    if (a[..., 3] < 250).mean() > 0.02:          # already has real transparency
        return a
    c = a[..., :3].astype(np.float32)
    # how far from the background: white, or the picture's own off-white (a light grey or
    # cream along its edges is treated as its white)
    lo = c.min(axis=2)
    ref = float(np.median(np.concatenate([lo[0], lo[-1], lo[:, 0], lo[:, -1]])))
    dist = np.clip((ref if 190 < ref < 240 else 255) - lo, 0, 255)
    chroma = c.max(axis=2) - c.min(axis=2)
    # background-ish: near white, or a light colourless shadow
    soft = ((dist < 70) & (chroma < 16)).astype(np.uint8)
    n, lab = cv2.connectedComponents(soft, connectivity=8)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0])
    if hole:
        # enclosed pockets: pure white, or (soft_holes) any light colourless white
        pocket = ((dist < 40) & (chroma < 20)) if soft_holes else (dist < 8)
        n, lab, st, _ = cv2.connectedComponentsWithStats((pocket & ~bg).astype(np.uint8), connectivity=8)
        for i in range(1, n):
            if st[i, 4] >= hole: bg |= lab == i
    alpha = np.ones(dist.shape, np.float32)
    # shadows on the white become a see-through dark tint, pure white goes away
    alpha[bg] = np.clip((dist[bg] - 10) / 110, 0, 1)
    out = c.copy()
    shadow = bg & (alpha > 0)
    out[shadow] = 40                               # shadow colour (dark, tinted by alpha)
    # soften the cut edge and take the white glow out of edge colours
    band = cv2.dilate(bg.astype(np.uint8), np.ones((3, 3), np.uint8)) & (~bg)
    band = band.astype(bool)
    ea = np.clip((dist[band] - 6) / 50, 0.15, 1)
    alpha[band] = ea
    out[band] = np.clip((c[band] - (1 - ea)[:, None] * 255) / ea[:, None], 0, 255)
    res = np.dstack([out, alpha * 255]).astype(np.float32)
    # drop specks that are not part of the main picture
    solid = (alpha > 0.5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(solid, connectivity=8)
    if n > 2:
        big = st[1:, 4].max()
        for i in range(1, n):
            if st[i, 4] < big * 0.002: res[lab == i, 3] = 0
    return np.clip(res, 0, 255).astype(np.uint8)


def remove_edge_colour(a, tol=14):
    """Clear a plain background of any colour (black, grey...) that touches the edge:
    pixels within tol of the edge's typical colour, connected to the edge. White
    backgrounds go through remove_white, which keeps soft shadows."""
    if (a[..., 3] < 250).mean() > 0.02:
        return a
    c = a[..., :3].astype(np.float32)
    edge = np.concatenate([c[0], c[-1], c[:, 0], c[:, -1]])
    bgc = np.median(edge, axis=0)
    if bgc.min() > 225:
        return remove_white(a)
    near = (np.abs(c - bgc).max(axis=2) < tol).astype(np.uint8)
    n, lab = cv2.connectedComponents(near, connectivity=4)
    ids = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, ids[ids > 0])
    out = a.copy(); out[..., 3] = np.where(bg, 0, 255).astype(np.uint8)
    # a 1px soft edge
    soft = cv2.erode((~bg).astype(np.uint8), np.ones((3, 3), np.uint8))
    out[..., 3] = np.where((~bg) & (soft == 0), 160, out[..., 3])
    solid = (out[..., 3] > 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(solid, connectivity=8)
    if n > 2:
        big = st[1:, 4].max()
        for i in range(1, n):
            if st[i, 4] < big * 0.002: out[lab == i, 3] = 0
    return out


def remove_checker(a):
    """Clear a transparency checkerboard painted into a picture: colourless pixels at the
    checks' two levels, joined to the edge, plus enclosed pockets of the pattern (between
    legs and arms). Recognised by being flat at those two levels, unlike grey fur."""
    c = a[..., :3].astype(np.float32); grey = c.mean(axis=2); chroma = c.max(axis=2) - c.min(axis=2)
    edge = np.concatenate([grey[:6].ravel(), grey[-6:].ravel(), grey[:, :6].ravel(), grey[:, -6:].ravel()])
    lo, hi = np.percentile(edge, 8), np.percentile(edge, 92)
    near = (chroma < 16) & (grey > lo - 14) & (grey < hi + 14)
    n, lab, st, _ = cv2.connectedComponentsWithStats(near.astype(np.uint8), connectivity=4)
    ids = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, ids[ids > 0])
    atlo, athi = np.abs(grey - lo) < 9, np.abs(grey - hi) < 9
    for i in range(1, n):
        if i in ids or st[i, 4] < 120: continue
        m = lab == i
        if (atlo[m] | athi[m]).mean() > 0.85 and atlo[m].mean() > 0.2 and athi[m].mean() > 0.2: bg |= m
    # JPEG smudges around the outline belong to the background too
    grown = cv2.dilate(bg.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    bg |= grown & (chroma < 30) & (grey > lo - 30)
    out = a.copy(); out[..., 3] = np.where(bg, 0, 255).astype(np.uint8)
    keep = (~bg).astype(np.uint8)
    out[..., 3] = np.where((keep == 1) & (cv2.erode(keep, np.ones((3, 3), np.uint8)) == 0), 170, out[..., 3])
    solid = (out[..., 3] > 0).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(solid, connectivity=8)
    if n > 2:
        big = st[1:, 4].max()
        for i in range(1, n):
            if st[i, 4] < big * 0.01: out[lab == i, 3] = 0
    return out


def clear_low_pockets(a, below, least):
    """Clear pure-white pockets of background caught inside a picture (between legs)
    whose middle is below this share of its height and at least `least` px big, for
    pictures whose subject has white parts of its own higher up."""
    c = a[..., :3].astype(np.float32)
    white = (a[..., 3] > 200) & ((255 - c.min(axis=2)) < 14) & ((c.max(axis=2) - c.min(axis=2)) < 10)
    n, lab, st, cen = cv2.connectedComponentsWithStats(white.astype(np.uint8), connectivity=8)
    out = a.copy()
    for i in range(1, n):
        if st[i, 4] >= least and cen[i][1] > below * a.shape[0]: out[lab == i, 3] = 0
    return out


def cutout(a):
    """Cut a picture's subject out of a plain background by its outline (GrabCut), for
    pictures where the subject itself is partly white and remove_white would eat it."""
    bgr = np.ascontiguousarray(a[..., :3]); h, w = bgr.shape[:2]
    mask = np.zeros((h, w), np.uint8); bgd = np.zeros((1, 65), np.float64); fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, (int(w * 0.04), int(h * 0.04), int(w * 0.92), int(h * 0.92)), bgd, fgd, 6, cv2.GC_INIT_WITH_RECT)
    fg = np.isin(mask, [1, 3]).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg)
    if n > 1: fg = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)     # just the biggest piece
    out = a.copy(); out[..., 3] = cv2.GaussianBlur(fg * 255, (3, 3), 0)
    return out


def photo_cutout(a, grad=7.0, tint=26):
    """Cut a studio photo's subject out by its outline, then peel off the soft shadow and
    leftover backdrop around it: smooth, colourless areas joined to the cut's rim. Pale
    subjects need a lower grad and tint or the peel eats into them."""
    fg = (cutout(a)[..., 3] > 128).astype(np.uint8)
    bl = cv2.GaussianBlur(np.ascontiguousarray(a[..., :3]).astype(np.float32), (0, 0), 1.6)
    grey = bl.mean(axis=2); chroma = bl.max(axis=2) - bl.min(axis=2)
    slope = np.hypot(cv2.Sobel(grey, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(grey, cv2.CV_32F, 0, 1, ksize=3)) / 4
    smooth = ((slope < grad) & (chroma < tint) & (fg == 1)).astype(np.uint8)
    n, lab = cv2.connectedComponents(smooth, connectivity=4)
    rim = cv2.dilate(1 - fg, np.ones((3, 3), np.uint8)) & fg
    ids = np.unique(lab[(rim == 1) & (smooth == 1)])
    keep = cv2.morphologyEx(((fg == 1) & ~np.isin(lab, ids[ids > 0])).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(keep, connectivity=8)
    if n > 1:
        keep = np.isin(lab, [i for i in range(1, n) if st[i, 4] >= st[1:, 4].max() * 0.04]).astype(np.uint8)
    # fill pinholes the peel left inside
    h, w = keep.shape
    n, lab, st, _ = cv2.connectedComponentsWithStats(1 - keep, connectivity=4)
    for i in range(1, n):
        x, y, bw, bh, area = st[i]
        if area < keep.sum() * 0.02 and x > 0 and y > 0 and x + bw < w and y + bh < h: keep[lab == i] = 1
    out = a.copy(); out[..., 3] = cv2.GaussianBlur(keep * 255, (3, 3), 0)
    return out


def trim(a, pad=2):
    ys, xs = np.nonzero(a[..., 3] > 8)
    y0, y1 = max(0, ys.min() - pad), min(a.shape[0], ys.max() + 1 + pad)
    x0, x1 = max(0, xs.min() - pad), min(a.shape[1], xs.max() + 1 + pad)
    return a[y0:y1, x0:x1]


def shrink(a, s):
    f = a.astype(np.float32); al = f[..., 3:4] / 255; f[..., :3] *= al
    w, h = max(1, round(a.shape[1] * s)), max(1, round(a.shape[0] * s))
    g = cv2.resize(f, (w, h), interpolation=cv2.INTER_AREA)
    al = g[..., 3:4] / 255
    g[..., :3] = np.where(al > 1e-3, g[..., :3] / np.maximum(al, 1e-3), 0)
    return np.clip(g + 0.5, 0, 255).astype(np.uint8)


def foot(a):
    """Where it stands: middle of the lowest solid rows, and the bottom row."""
    m = a[..., 3] > 128
    ys = np.nonzero(m.any(1))[0]; bot = ys.max()
    xs = np.nonzero(m[max(0, bot - max(2, a.shape[0] // 16)):bot + 1].any(0))[0]
    return int(round((xs.min() + xs.max()) / 2)), int(bot)


def grid_frames(path, C=CREATURE_CELL, offset=False):
    """Every non-empty CxC grid cell of an animation sheet, in reading order, all cut
    to one shared box so the animation doesn't wobble (offset: also where that box starts
    in the cell, x and y)."""
    a = load(path)
    cells = [a[r*C:(r+1)*C, c*C:(c+1)*C] for r in range(a.shape[0] // C) for c in range(a.shape[1] // C)]
    n = [int((x[..., 3] > 20).sum()) for x in cells]
    cells = [x for x, k in zip(cells, n) if k > max(n) * 0.05]   # skip empty cells and stray specks
    m = np.zeros((C, C), bool)
    for x in cells: m |= x[..., 3] > 20
    ys, xs = np.nonzero(m)
    out = [x[ys.min():ys.max() + 1, xs.min():xs.max() + 1] for x in cells]
    return (out, int(xs.min()), int(ys.min())) if offset else out


def bbox(a):
    ys, xs = np.nonzero(a[..., 3] > 20)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def pack(items, width=1024):
    """Shelf-pack (name, image) pairs; returns the sheet and {name: [x,y,w,h]}."""
    items = sorted(items, key=lambda it: -it[1].shape[0])
    x = y = shelf = 0; pos = {}
    for name, im in items:
        h, w = im.shape[:2]
        if x + w > width: x, y, shelf = 0, y + shelf + 2, 0
        pos[name] = [x, y, w, h]; x += w + 2; shelf = max(shelf, h)
    sheet = np.zeros((y + shelf, width, 4), np.uint8)
    for name, im in items:
        x, y, w, h = pos[name]; sheet[y:y + h, x:x + w] = im
    return sheet, pos


def party_files():
    """Each party member's pictures: {id: {kind: path}}, kind being ready, battle, attack,
    spell, victory, portrait, baby, babybeg or babyportrait. Loose in party/ as
    <Name>-<kind>[-spritesheet].png, or in a folder party/<Name>/ as
    "<Name> - <kind> - spritesheet.png", "<Name> (baby)-beg.png" and the like."""
    out = {}
    def kind_of(stem, name):
        k = stem.lower()
        if k.startswith(name): k = k[len(name):]
        k = k.replace('spritesheet', '')
        return ''.join(ch for ch in k if ch.isalnum())
    files = [(f, None) for f in glob.glob(os.path.join(SRC, 'party', '*.*'))]
    for d in glob.glob(os.path.join(glob.escape(os.path.join(SRC, 'party')), '*', '')):
        folder = os.path.basename(os.path.dirname(d)).strip().lower()
        files += [(f, folder) for f in glob.glob(os.path.join(glob.escape(d), '*.*'))]
    for f, folder in files:
        if os.path.splitext(f)[1].lower() not in PIC_EXT: continue
        stem = os.path.splitext(os.path.basename(f))[0].strip()
        name = folder or stem.split('-')[0].strip().lower()
        # in a member's folder, a picture not named after them is its own kind ("Tiny Egg hatching")
        kind = kind_of(stem, name) if not folder or stem.lower().startswith(folder) else kind_of(stem, '')
        out.setdefault(PARTY_IDS.get(name, name), {})[kind] = f
    return out


def main():
    crops, meta = [], {}
    def add(key, path, group, keep=1.0):
        a = load(path); s = CANVAS_PX[group] / max(a.shape[:2])
        im = trim(remove_white(a, CROP_HOLE if group in CROP_GROUPS else 0))
        if keep < 1: im = trim(im[:round(im.shape[0] * keep)])
        im = shrink(im, s)
        ax, ay = foot(im)
        crops.append((key, im)); meta[key] = {'ax': ax, 'ay': ay}
    for f in pics('crops'):
        base = os.path.splitext(os.path.basename(f))[0].lower()
        if base == 'sprout': add('sprout', f, 'sprout')
        elif base == 'damaged plant': add('damaged', f, 'damaged')
        elif base.startswith('harvest '):
            crop = base[len('harvest '):].strip()
            add('harvest ' + HARVEST_ALIAS.get(crop, crop), f, 'harvest')
        else:
            for stage in ('baby', 'mature'):
                if base.startswith(stage + ' '):
                    crop = base[len(stage) + 1:].strip()
                    add(stage + ' ' + crop, f, stage + (' tree' if crop in TREES else ''))
    for key, name, group in (('soil', 'Soil.png', 'soil'), ('stand', 'MarketStand.png', 'stand')):
        p = os.path.join(SRC, name)
        if os.path.exists(p): add(key, p, group)
    for name, f in named_pics('shop items'):
        if name.endswith(' sapling'):
            tree = name[:-len(' sapling')].strip()
            add('sapling ' + tree, f, 'sapling', SAPLING_KEEP.get(tree, 1.0))
    for key, (item, h) in DECOR.items():
        hits = [f for f in pics('shop items')
                if os.path.splitext(os.path.basename(f))[0].strip().lower() == item]
        if not hits: continue
        im = trim(remove_white(load(hits[0]), SHOP_HOLES.get(item, 0)))
        im = shrink(im, h / im.shape[0]); ax, ay = foot(im)
        crops.append(('decor ' + key, im)); meta['decor ' + key] = {'ax': ax, 'ay': ay}
    sheet, pos = pack(crops)
    cv2.imwrite(os.path.join(OUT, 'crops.png'), sheet, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    for k in meta: meta[k]['r'] = pos[k]

    shop, smeta = [], {}
    for name, f in named_pics('shop items'):
        if name in SHOP_SKIP: continue
        src = load(f)
        edge = np.concatenate([src[0, :, :3], src[-1, :, :3], src[:, 0, :3], src[:, -1, :3]])
        if name in SHOP_PHOTOS: im = photo_cutout(src, *SHOP_PHOTOS[name])
        elif np.median(edge, axis=0).min() < 200: im = remove_edge_colour(src)          # a plain coloured background
        elif name in SHOP_CUTOUT: im = cutout(src)
        elif name in SHOP_SOFT_HOLES: im = remove_white(src, SHOP_SOFT_HOLES[name], soft_holes=True)
        else: im = remove_white(src, SHOP_HOLES.get(name, 0))
        if name in SHOP_FLOOR:
            hsv = cv2.cvtColor(np.ascontiguousarray(im[..., :3]), cv2.COLOR_BGR2HSV)
            floor = (hsv[..., 2] > 140) & (hsv[..., 1] < 85); floor[:int(im.shape[0] * SHOP_FLOOR[name])] = False
            im[floor, 3] = 0
        im = trim(im)
        im = shrink(im, SHOP_BOX / max(im.shape[:2]))
        shop.append((name, im))
    ssheet, spos = pack(shop)
    cv2.imwrite(os.path.join(OUT, 'shop_items.png'), ssheet, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    smeta = {k: spos[k] for k, _ in shop}

    # creatures and garden effects: every non-empty grid cell is a frame, in reading
    # order; all frames share one crop box so the animation doesn't wobble
    frames, cmeta, kind = [], {}, {}
    sheets = [(f, 'creature') for f in sorted(glob.glob(os.path.join(SRC, 'creatures', '*-spritesheet.png')))]
    sheets += [(f, 'fx') for f in sorted(glob.glob(os.path.join(SRC, 'crops', '*-spritesheet.png')))]
    for f, k in sheets:
        name = os.path.basename(f)[:-len('-spritesheet.png')].strip().lower()
        if name in GROUND_CREATURES: k = 'fx'
        kind[name] = k
        box = grid_frames(f)
        sc = CREATURE_W.get(name, 54) / box[0].shape[1]
        for i, x in enumerate(box): frames.append((name + ' %d' % i, shrink(x, sc)))
        cmeta[name] = len(box)
    if frames:
        csheet, cpos = pack(frames)
        cv2.imwrite(os.path.join(OUT, 'creatures.png'), csheet, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        cmeta = {n: [cpos['%s %d' % (n, i)] for i in range(k)] for n, k in cmeta.items()}

    # party members: the ready loop, sized by PARTY_FIT on its first frame; the still
    # battle stance is fitted to the width of that first frame and stands where it does.
    # ax,ay is where the feet (or belly) touch the ground, within each frame.
    pframes, pmeta, pfaces = [], {}, []
    for name, F in sorted(party_files().items()):
        if name not in PARTY_IN_GAME:
            print('  party/' + name + ': not in the game yet (add it to PARTY_IN_GAME once it is)'); continue
        if 'ready' not in F: continue
        box = grid_frames(F['ready'])
        x0, y0, x1, y1 = bbox(box[0])
        how, size = PARTY_FIT.get(name, ('h', 189))
        sc = size / ((y1 - y0) if how == 'h' else (x1 - x0))
        for i, x in enumerate(box): pframes.append((name + ' %d' % i, shrink(x, sc)))
        ax, ay = round((x0 + x1) / 2 * sc), round(box[0].shape[0] * sc) - 1
        pmeta[name] = {'n': len(box), 'ax': ax, 'ay': ay}
        still = F.get('battle')
        if still:
            im = trim(remove_white(load(still), STANCE_HOLE), 0)
            im = shrink(im, (x1 - x0) * sc / im.shape[1])
            pframes.append((name + ' stance', im))
            # its bottom-centre on the first ready frame's
            pmeta[name]['stance'] = {'ax': im.shape[1] // 2, 'ay': im.shape[0] - 1 + (round(box[0].shape[0] * sc) - round(y1 * sc))}
        # the attack and spell: their first frame is the resting pose, sized and grounded like the ready loop's
        # (a victory loop may not start from the resting pose: it's drawn at the spell's scale)
        msc = {}
        for move in ('attack', 'spell', 'victory'):
            hit = F.get(move)
            if not hit: continue
            abox = grid_frames(hit)
            ax0, ay0, ax1, ay1 = bbox(abox[0])
            asc = size / ((ay1 - ay0) if how == 'h' else (ax1 - ax0))
            if move == 'victory': asc = msc.get('spell', msc.get('attack', asc))
            msc[move] = asc
            for i, x in enumerate(abox): pframes.append((name + ' ' + move + ' %d' % i, shrink(x, asc)))
            pmeta[name][move] = {'n': len(abox), 'ax': round((ax0 + ax1) / 2 * asc), 'ay': round(ay1 * asc) - 1}
        # a baby: its still picture and begging loop, BABY_H tall, standing on their bottom-centre
        if F.get('baby'):
            im = trim(remove_white(load(F['baby']), STANCE_HOLE), 0)
            im = shrink(im, BABY_H / im.shape[0])
            pframes.append((name + ' baby', im)); ax, ay = foot(im)
            pmeta[name]['baby'] = {'ax': ax, 'ay': ay}
        # the baby's loops (begging, falling asleep, asleep) are painted at one scale in their
        # cells: all sized by the begging loop's first frame and placed on its feet, so one
        # follows on from another without a jump
        if F.get('babybeg'):
            beg, ox, oy = grid_frames(F['babybeg'], offset=True)
            bx0, by0, bx1, by1 = bbox(beg[0]); bsc = BABY_H / (by1 - by0)
            fx, fy = (bx0 + bx1) / 2 + ox, by1 + oy                  # the feet, in cell px
            for bk, key in (('babybeg', 'beg'), ('babyfallasleep', 'fallasleep'), ('babyasleep', 'asleep')):
                if not F.get(bk): continue
                fr, ox, oy = grid_frames(F[bk], offset=True)
                for i, x in enumerate(fr): pframes.append((name + ' ' + key + ' %d' % i, shrink(x, bsc)))
                pmeta[name][key] = {'n': len(fr), 'ax': round((fx - ox) * bsc), 'ay': round((fy - oy) * bsc) - 1}
        # an egg hatching (in the member's folder, named for the egg): the egg HATCH_H tall
        hatch = next((v for k, v in F.items() if 'hatching' in k), None)
        if hatch:
            fr = grid_frames(hatch)
            ex0, ey0, ex1, ey1 = bbox(fr[0]); hsc = HATCH_H / (ey1 - ey0)
            for i, x in enumerate(fr): pframes.append((name + ' hatch %d' % i, shrink(x, hsc)))
            pmeta[name]['hatch'] = {'n': len(fr), 'ax': round((ex0 + ex1) / 2 * hsc), 'ay': round(ey1 * hsc) - 1, 'eh': HATCH_H}
        for pk, out in (('portrait', name), ('babyportrait', name + '-baby')):
            if not F.get(pk): continue
            im = trim(remove_white(load(F[pk])), 0)
            cv2.imwrite(os.path.join(OUT, 'portrait_' + out + '.png'), shrink(im, PORTRAIT_H / im.shape[0]),
                        [cv2.IMWRITE_PNG_COMPRESSION, 9])
            pfaces.append(out)
    if pframes:
        psheet, ppos = pack(pframes)
        # lossy WebP (with alpha) is well under half the size of a PNG for these painted frames
        cv2.imwrite(os.path.join(OUT, 'party.webp'), psheet, [cv2.IMWRITE_WEBP_QUALITY, 95])
        for n, d in pmeta.items():
            d['ready'] = [ppos['%s %d' % (n, i)] for i in range(d.pop('n'))]
            if 'stance' in d: d['stance']['r'] = ppos[n + ' stance']
            for move in ('attack', 'spell', 'victory'):
                if move in d: d[move]['f'] = [ppos['%s %s %d' % (n, move, i)] for i in range(d[move].pop('n'))]
            if 'baby' in d: d['baby']['r'] = ppos[n + ' baby']
            for key in ('beg', 'fallasleep', 'asleep', 'hatch'):
                if key in d: d[key]['f'] = [ppos['%s %s %d' % (n, key, i)] for i in range(d[key].pop('n'))]

    # enemies: background cleared, trimmed and sized for battle, standing on their bottom
    eframes, emeta = [], {}
    for name, f in named_pics('enemies'):
        if name not in ENEMIES: continue
        key, h = ENEMIES[name]
        im = remove_checker(load(f)) if name in ENEMY_CHECKERED else remove_edge_colour(load(f))
        if key in ENEMY_POCKETS: im = clear_low_pockets(im, *ENEMY_POCKETS[key])
        im = trim(im, 0)
        s = h / im.shape[0]
        if s > 1:   # small pixel art: hard-edged enlargement
            im = cv2.resize(im, (round(im.shape[1] * s), round(im.shape[0] * s)), interpolation=cv2.INTER_NEAREST)
        else:
            im = shrink(im, s)
        ax, ay = foot(im)
        eframes.append((key, im)); emeta[key] = {'ax': ax, 'ay': ay}
    if eframes:
        esheet, epos = pack(eframes)
        cv2.imwrite(os.path.join(OUT, 'enemies.webp'), esheet, [cv2.IMWRITE_WEBP_QUALITY, 95])
        for k in emeta: emeta[k]['r'] = epos[k]
        print('enemies.webp', esheet.shape[1], 'x', esheet.shape[0], '-', ', '.join(sorted(emeta)))

    # battle backdrops (backdrops/<season>), the rhythm game's background and its four
    # note gems (rhythm/background, rhythm/notes), and maps of other places
    # (maps/<place>_<season>): JPEGs for the game, no wider than the screen needs
    def save_jpg(src, out, maxw=SCENE_W):
        a = load(src); s = min(1.0, maxw / a.shape[1])
        im = shrink(a, s) if s < 1 else a
        al = im[..., 3:4] / 255.0
        cv2.imwrite(out, (im[..., :3] * al).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
    os.makedirs(os.path.join(ROOT, 'assets', 'scenes'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'assets', 'places'), exist_ok=True)
    backs = []
    for f in pics('backdrops'):
        k = os.path.splitext(os.path.basename(f))[0].lower(); backs.append(k)
        save_jpg(f, os.path.join(ROOT, 'assets', 'scenes', 'backdrop_' + k + '.jpg'))
    bg = find_pic(os.path.join(SRC, 'rhythm', 'background 2')) or find_pic(os.path.join(SRC, 'rhythm', 'background'))
    if bg: save_jpg(bg, os.path.join(ROOT, 'assets', 'scenes', 'rhythm_bg.jpg'))
    nmeta = []
    gems = find_pic(os.path.join(SRC, 'rhythm', 'notes'))
    if gems:
        a = remove_white(load(gems), 0)
        n, lab, st, _ = cv2.connectedComponentsWithStats((a[..., 3] > 128).astype(np.uint8), connectivity=8)
        big = sorted(range(1, n), key=lambda i: -st[i, 4])[:4]
        cells = []
        for i in sorted(big, key=lambda i: st[i, 0]):           # left to right: one per lane
            x, y, w, h = st[i, :4]
            g = a[max(0, y - 2):y + h + 2, max(0, x - 2):x + w + 2]
            cells.append(shrink(g, 96 / max(g.shape[:2])))
        gsheet, gpos = pack([('gem %d' % i, c) for i, c in enumerate(cells)], width=512)
        cv2.imwrite(os.path.join(OUT, 'notes.png'), gsheet, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        nmeta = [gpos['gem %d' % i] for i in range(len(cells))]
    # walls: maps/garden_<season>_collision (one per season; an older single
    # maps/garden_collision works too) and maps/house_collision (black = blocked, white =
    # open; any size, scaled to the game's masks). The spring one (or the single one) is also
    # map_collision.png, which the game loads first; each season's is map_collision_<season>.png.
    season_walls = {}
    def garden_wall(f, out):
        m = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
        cv2.imwrite(os.path.join(OUT, out), np.where(cv2.resize(m, (360, 360), interpolation=cv2.INTER_AREA) > 128, 255, 0).astype(np.uint8))
    gcol = find_pic(os.path.join(SRC, 'maps', 'garden_collision')) or find_pic(os.path.join(SRC, 'maps', 'garden_spring_collision'))
    if gcol: garden_wall(gcol, 'map_collision.png')
    for when in SEASON_NAMES:
        f = find_pic(os.path.join(SRC, 'maps', 'garden_' + when + '_collision'))
        if f: garden_wall(f, 'map_collision_' + when + '.png'); season_walls.setdefault('garden', []).append(when)
    # walk-through zones: maps/transitions, painted over the walls (red: the path to town,
    # yellow: the trail to the mountain, blue: the house door), saved on the walls' grid in
    # pure colours for the game to read
    tr = find_pic(os.path.join(SRC, 'maps', 'transitions'))
    if tr:
        t = cv2.imread(tr)[..., ::-1].astype(int)
        z = np.zeros(t.shape[:2] + (3,), np.uint8)
        for col, out in (((237, 28, 36), (0, 0, 255)), ((255, 201, 14), (0, 255, 255)), ((0, 162, 232), (255, 0, 0))):
            z[np.abs(t - np.array(col)).sum(2) < 90] = out          # BGR
        cv2.imwrite(os.path.join(OUT, 'garden_zones.png'), cv2.resize(z, (360, 360), interpolation=cv2.INTER_NEAREST))
    # doors and ways in and out of the town, mountain and house: maps/<area>_transitions,
    # painted over a faded copy of the area (ZONE_COLS: one colour per place it leads to).
    # Saved on a 4-px grid as assets/sprites/<area>_zones.png, each cell the number of the place
    # in ZONE_DESTS (0: nothing). She also arrives in the middle of the patch for where she came
    # from. (The garden's own is maps/transitions, above.)
    azones = {}
    for area, (W, H) in AREA_ZONE_SIZE.items():
        f = find_pic(os.path.join(SRC, 'maps', area + '_transitions'))
        if not f: continue
        t = cv2.imread(f)[..., ::-1].astype(int)
        idx = np.zeros(t.shape[:2], np.uint8)
        for i, dest in enumerate(ZONE_DESTS):
            idx[np.abs(t - np.array(ZONE_COLS[dest])).sum(2) < 90] = i + 1
        gw, gh = W // 4, H // 4
        cv2.imwrite(os.path.join(OUT, area + '_zones.png'), cv2.resize(idx, (gw, gh), interpolation=cv2.INTER_NEAREST))
        azones[area] = [gw, gh]
        print(area + '_zones.png', gw, 'x', gh, '-', ', '.join(d for i, d in enumerate(ZONE_DESTS) if (idx == i + 1).any()))
    # walls for the places with painted maps: maps/<place>_collision if there is one
    # (black = blocked, white = open), or for the mountain worked out from its spring
    # painting: the light grass and the tan trail are open (all of it that joins the
    # trail), dark trees, rock, water and sky are not. Saved at a quarter of the place's
    # size (PLACE_GRID world px per cell) as assets/sprites/<place>_collision.png.
    pcols = []
    for place, size in PLACE_SIZE.items():
        gw, gh = size[0] // PLACE_GRID, size[1] // PLACE_GRID
        def place_wall(m, out):
            cv2.imwrite(os.path.join(OUT, out), np.where(cv2.resize(m.astype(np.uint8) * 255, (gw, gh), interpolation=cv2.INTER_AREA) > 128, 255, 0).astype(np.uint8))
        # each season's own (maps/<place>_<season>_collision), as <place>_collision_<season>.png
        for when in SEASON_NAMES:
            f = find_pic(os.path.join(SRC, 'maps', place + '_' + when + '_collision'))
            if f: place_wall(cv2.imread(f, cv2.IMREAD_GRAYSCALE) > 128, place + '_collision_' + when + '.png'); season_walls.setdefault(place, []).append(when)
        cf = find_pic(os.path.join(SRC, 'maps', place + '_collision')) or find_pic(os.path.join(SRC, 'maps', place + '_spring_collision'))
        if cf:
            m = cv2.imread(cf, cv2.IMREAD_GRAYSCALE) > 128
        elif place == 'mountain' and find_pic(os.path.join(SRC, 'maps', 'mountain_spring')):
            a = cv2.imread(find_pic(os.path.join(SRC, 'maps', 'mountain_spring')))
            hsv = cv2.cvtColor(cv2.GaussianBlur(a, (5, 5), 0), cv2.COLOR_BGR2HSV).astype(int)
            H, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
            trail = (H >= 6) & (H <= 26) & (S >= 40) & (V >= 100)
            grass = (H >= 26) & (H <= 52) & (S >= 80) & (V >= 100)
            walk = (trail | grass).astype(np.uint8)
            h0, w0 = walk.shape
            for fx, fy, fw, fh in MOUNTAIN_OPEN:            # the shaded foot of the trail
                walk[int(fy * h0):int((fy + fh) * h0), int(fx * w0):int((fx + fw) * w0)] = 1
            walk = cv2.morphologyEx(walk, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
            walk = cv2.morphologyEx(walk, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
            n, lab = cv2.connectedComponents(walk)
            m = lab == lab[int(0.5 * h0), int(0.46 * w0)]   # what joins the trail mid-way up
        else:
            continue
        place_wall(m, place + '_collision.png')
        pcols.append(place); print(place + '_collision.png', gw, 'x', gh, '(' + ('painted' if cf else 'from the map') + ')')
    hcol = find_pic(os.path.join(SRC, 'maps', 'house_collision'))
    if hcol:
        m = cv2.imread(hcol, cv2.IMREAD_GRAYSCALE)
        cv2.imwrite(os.path.join(OUT, 'house_collision.png'), np.where(cv2.resize(m, (512, 768), interpolation=cv2.INTER_NEAREST) > 128, 255, 0).astype(np.uint8))
    # front layers: maps/<season>_front and maps/house_front, transparent pictures of what
    # Kaitlyn walks behind (tree tops, the roof...), drawn over her
    fronts = []
    for key in ('spring', 'summer', 'fall', 'winter', 'house'):
        f = find_pic(os.path.join(SRC, 'maps', key + '_front'))
        if not f: continue
        a = load(f)
        cv2.imwrite(os.path.join(OUT, 'front_' + key + '.webp'), a, [cv2.IMWRITE_WEBP_QUALITY, 90])
        fronts.append(key)
    # and the places' the same way: maps/<place>_<season>_front (the town's and mountain's).
    # One saved with no see-through at all (a white background) has its white taken as empty.
    for place in PLACE_SIZE:
        for when in ('spring', 'summer', 'fall', 'winter'):
            f = find_pic(os.path.join(SRC, 'maps', place + '_' + when + '_front'))
            if not f: continue
            a = load(f)
            if a[..., 3].min() == 255: a[a[..., :3].min(2) > 240, 3] = 0
            if not a[..., 3].any(): continue
            cv2.imwrite(os.path.join(OUT, 'front_' + place + '_' + when + '.webp'), a, [cv2.IMWRITE_WEBP_QUALITY, 90])
            fronts.append(place + '_' + when)
    pmaps = {}
    for f in pics('maps'):
        base = os.path.splitext(os.path.basename(f))[0].lower()
        # only <place>_<season>: not walls, front layers, drafts or working copies
        if '_' not in base or any(w in base for w in ('collision', 'front', 'draft', 'copy', 'transitions')): continue
        where, when = base.split('_', 1)
        save_jpg(f, os.path.join(ROOT, 'assets', 'places', base + '.jpg'), 2160)
        pmaps.setdefault(where, []).append(when)

    # story pictures: flattened onto black and saved as JPEG at screen width
    os.makedirs(os.path.join(ROOT, 'assets', 'scenes'), exist_ok=True)
    scene_names = []
    for f in pics('scenes'):
        a = load(f); s = SCENE_W / a.shape[1]
        im = shrink(a, s); al = im[..., 3:4] / 255.0
        flat = (im[..., :3] * al).astype(np.uint8)
        name = '_'.join(os.path.splitext(os.path.basename(f))[0].strip().lower().split())
        cv2.imwrite(os.path.join(ROOT, 'assets', 'scenes', name + '.jpg'), flat, [cv2.IMWRITE_JPEG_QUALITY, 88])
        print('scene', name, flat.shape[1], 'x', flat.shape[0]); scene_names.append(name)

    # the fishing game's rod, reel and bobber: each at most this tall/wide (device px)
    FISH_BOX = {'rod': 900, 'reel': 360, 'bobber': 120}
    FISH_CUTOUT = {'bobber'}                     # half white: cut out by its outline instead
    tackle = []
    for f in pics('fishing'):
        name = os.path.splitext(os.path.basename(f))[0].strip().lower()
        im = trim(cutout(load(f)) if name in FISH_CUTOUT else remove_white(load(f)))
        tackle.append((name, shrink(im, FISH_BOX.get(name, 360) / max(im.shape[:2]))))
    fmeta = {}
    if tackle:
        fsheet, fmeta = pack(tackle)
        cv2.imwrite(os.path.join(OUT, 'fishing.png'), fsheet, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        print('fishing.png -', ', '.join(sorted(fmeta)))
    # the title logo: logo (with the words) or logo frame (the game writes the words on it)
    logo_kind = None
    for lk, name in (('words', 'logo'), ('frame', 'logo frame')):
        f = find_pic(os.path.join(SRC, name))
        if not f: continue
        im = trim(remove_white(load(f), 40, soft_holes=True))    # and the white caught inside the vines
        im = shrink(im, min(1.0, 1020 / im.shape[1]))
        cv2.imwrite(os.path.join(OUT, 'logo.png'), im, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        logo_kind = lk; print('logo.png', im.shape[1], 'x', im.shape[0], '(' + lk + ')')
        break

    # townsfolk portraits (people/<Name>, or people/<Name>/ holding one picture), as tall as Kaitlyn's
    people = {}
    for name, f in named_pics('people'):
        fn = 'portrait_' + '-'.join(''.join(ch if ch.isalnum() else ' ' for ch in name).split()) + '.png'
        im = trim(remove_white(load(f), 150), 0)                 # and the white caught between strands of hair
        cv2.imwrite(os.path.join(OUT, fn), shrink(im, PORTRAIT_H / im.shape[0]), [cv2.IMWRITE_PNG_COMPRESSION, 9])
        people[name] = 'assets/sprites/' + fn

    with open(os.path.join(ROOT, 'js', 'data', 'art.js'), 'w', encoding='utf-8') as fh:
        fh.write('/* Made by tools/build_art.py: sheet positions [x,y,w,h] in device px;\n'
                 '   ax,ay is where a crop/soil/stand picture stands on the ground. */\n')
        fh.write('const CROP_ART=' + json.dumps(meta, separators=(',', ':')) + ';\n')
        fh.write('const SHOP_ART=' + json.dumps(smeta, separators=(',', ':')) + ';\n')
        fh.write('const CREATURE_ART=' + json.dumps({n: v for n, v in cmeta.items() if kind[n] == 'creature'}, separators=(',', ':')) + ';\n')
        fh.write('const FX_ART=' + json.dumps({n: v for n, v in cmeta.items() if kind[n] == 'fx'}, separators=(',', ':')) + ';\n')
        fh.write('const PARTY_ART=' + json.dumps(pmeta, separators=(',', ':')) + ';\n')
        fh.write('const PARTY_PORTRAITS=' + json.dumps(sorted(pfaces)) + ';\n')
        fh.write('const ENEMY_ART=' + json.dumps(emeta, separators=(',', ':')) + ';\n')
        fh.write('const NOTE_ART=' + json.dumps(nmeta, separators=(',', ':')) + ';\n')
        fh.write('const PLACE_MAPS=' + json.dumps(pmaps, separators=(',', ':')) + ';\n')
        fh.write('const GARDEN_ZONES=' + ('true' if tr else 'false') + ';\n')
        fh.write('const FISH_ART=' + json.dumps(fmeta, separators=(',', ':')) + ';\n')
        fh.write('const PLACE_COLS=' + json.dumps(pcols) + ';\n')
        fh.write('const SEASON_WALLS=' + json.dumps(season_walls) + ';\n')
        fh.write('const ZONE_DESTS=' + json.dumps(list(ZONE_DESTS)) + ';\n')
        fh.write('const AREA_ZONES=' + json.dumps(azones) + ';\n')
        fh.write('const SCENES=' + json.dumps(sorted(scene_names)) + ';\n')
        fh.write('const TITLE_LOGO=' + json.dumps(logo_kind) + ';\n')
        fh.write('const BACKDROPS=' + json.dumps(sorted(backs)) + ';\n')
        fh.write('const RHYTHM_BG=' + ('true' if bg else 'false') + ';\n')
        fh.write('const FRONT_LAYERS=' + json.dumps(fronts) + ';\n')
        fh.write('const HOUSE_MASK=' + ('true' if hcol else 'false') + ';\n')
        fh.write('const PEOPLE_PORTRAITS=' + json.dumps(people, separators=(',', ':')) + ';\n')
    print('crops.png', sheet.shape[1], 'x', sheet.shape[0], '-', len(crops), 'pictures:', ', '.join(sorted(meta)))
    print('shop_items.png', ssheet.shape[1], 'x', ssheet.shape[0], '-', len(shop), 'pictures')
    print('creatures.png', ', '.join('%s %d frames' % (n, len(v)) for n, v in cmeta.items()))
    if pframes:
        print('party.webp', psheet.shape[1], 'x', psheet.shape[0], '-',
              ', '.join('%s %d frames%s' % (n, len(d['ready']), ' + stance' if 'stance' in d else '') for n, d in pmeta.items()))


if __name__ == '__main__':
    main()
