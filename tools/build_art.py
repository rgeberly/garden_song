"""Turn the hand-made crop, soil, market stand and shop item pictures into
game-ready sprite sheets.

    python tools/build_art.py [source folder]      (needs: pip install numpy opencv-python)

The source folder (default: the kaitlyns-garden-song-art folder next to the game,
where the full-size originals live) holds
    crops/Sprout.png, crops/Baby <crop>.png, crops/Mature <crop>.png
    Soil.png, MarketStand.png
    shop items/<exact shop item name>.png
    creatures/<Name>-spritesheet.png     animation frames in a grid of 256px cells
Pictures may have a white background: white touching the edge of the picture is
removed (light grey shadows on it become see-through shadows). Each picture is
trimmed, shrunk to game size and packed into
    assets/sprites/crops.png        crops, soil and the stand
    assets/sprites/shop_items.png   shop pictures
    assets/sprites/creatures.png    creature animation frames
with their positions written to js/data/art.js.
"""
import cv2, numpy as np, os, sys, glob, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(ROOT), 'kaitlyns-garden-song-art')
OUT = os.path.join(ROOT, 'assets', 'sprites')

# On-screen size, in device px (3 per game px), of a full 1024px source picture.
# Pictures keep their sizes relative to each other within a group.
CANVAS_PX = {'sprout': 84, 'baby': 126, 'mature': 162, 'soil': 108, 'stand': 300,
             'baby tree': 150, 'mature tree': 228, 'damaged': 126}
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
CREATURE_W = {'bluebird': 66, 'monarch': 48}
CREATURE_CELL = 256
SHOP_HOLES = {'harvest basket': 2000, 'coffee': 2000, 'watering can': 2000, 'seed apron': 2000}


def load(path):
    a = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if a.ndim == 2: a = cv2.cvtColor(a, cv2.COLOR_GRAY2BGRA)
    if a.shape[2] == 3: a = cv2.cvtColor(a, cv2.COLOR_BGR2BGRA)
    return a


def remove_white(a, hole=0):
    """Clear the white background that touches the picture's edge (and enclosed
    pure-white holes of at least `hole` px, when asked)."""
    if (a[..., 3] < 250).mean() > 0.02:          # already has real transparency
        return a
    c = a[..., :3].astype(np.float32)
    dist = 255 - c.min(axis=2)                     # how far from white
    chroma = c.max(axis=2) - c.min(axis=2)
    # background-ish: near white, or a light colourless shadow
    soft = ((dist < 70) & (chroma < 16)).astype(np.uint8)
    n, lab = cv2.connectedComponents(soft, connectivity=8)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0])
    if hole:
        n, lab, st, _ = cv2.connectedComponentsWithStats(((dist < 8) & ~bg).astype(np.uint8), connectivity=8)
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


def main():
    crops, meta = [], {}
    def add(key, path, group):
        a = load(path); s = CANVAS_PX[group] / max(a.shape[:2])
        im = shrink(trim(remove_white(a, CROP_HOLE if group in CROP_GROUPS else 0)), s)
        ax, ay = foot(im)
        crops.append((key, im)); meta[key] = {'ax': ax, 'ay': ay}
    for f in sorted(glob.glob(os.path.join(SRC, 'crops', '*.png'))):
        base = os.path.splitext(os.path.basename(f))[0].lower()
        if base == 'sprout': add('sprout', f, 'sprout')
        elif base == 'damaged plant': add('damaged', f, 'damaged')
        else:
            for stage in ('baby', 'mature'):
                if base.startswith(stage + ' '):
                    crop = base[len(stage) + 1:].strip()
                    add(stage + ' ' + crop, f, stage + (' tree' if crop in TREES else ''))
    for key, name, group in (('soil', 'Soil.png', 'soil'), ('stand', 'MarketStand.png', 'stand')):
        p = os.path.join(SRC, name)
        if os.path.exists(p): add(key, p, group)
    for key, (item, h) in DECOR.items():
        hits = [f for f in glob.glob(os.path.join(SRC, 'shop items', '*.png'))
                if os.path.splitext(os.path.basename(f))[0].strip().lower() == item]
        if not hits: continue
        im = trim(remove_white(load(hits[0]), SHOP_HOLES.get(item, 0)))
        im = shrink(im, h / im.shape[0]); ax, ay = foot(im)
        crops.append(('decor ' + key, im)); meta['decor ' + key] = {'ax': ax, 'ay': ay}
    sheet, pos = pack(crops)
    cv2.imwrite(os.path.join(OUT, 'crops.png'), sheet, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    for k in meta: meta[k]['r'] = pos[k]

    shop, smeta = [], {}
    for f in sorted(glob.glob(os.path.join(SRC, 'shop items', '*.png'))):
        name = os.path.splitext(os.path.basename(f))[0].strip().lower()
        im = trim(remove_white(load(f), SHOP_HOLES.get(name, 0)))
        im = shrink(im, SHOP_BOX / max(im.shape[:2]))
        shop.append((name, im))
    ssheet, spos = pack(shop)
    cv2.imwrite(os.path.join(OUT, 'shop_items.png'), ssheet, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    smeta = {k: spos[k] for k, _ in shop}

    # creatures: every non-empty grid cell is a frame, in reading order; all frames
    # share one crop box so the animation doesn't wobble
    frames, cmeta = [], {}
    for f in sorted(glob.glob(os.path.join(SRC, 'creatures', '*-spritesheet.png'))):
        name = os.path.basename(f)[:-len('-spritesheet.png')].strip().lower()
        a = load(f); C = CREATURE_CELL
        cells = [a[r*C:(r+1)*C, c*C:(c+1)*C] for r in range(a.shape[0] // C) for c in range(a.shape[1] // C)]
        n = [int((x[..., 3] > 20).sum()) for x in cells]
        cells = [x for x, k in zip(cells, n) if k > max(n) * 0.05]   # skip empty cells and stray specks
        m = np.zeros((C, C), bool)
        for x in cells: m |= x[..., 3] > 20
        ys, xs = np.nonzero(m)
        box = [x[ys.min():ys.max() + 1, xs.min():xs.max() + 1] for x in cells]
        sc = CREATURE_W.get(name, 54) / box[0].shape[1]
        for i, x in enumerate(box): frames.append((name + ' %d' % i, shrink(x, sc)))
        cmeta[name] = len(box)
    if frames:
        csheet, cpos = pack(frames)
        cv2.imwrite(os.path.join(OUT, 'creatures.png'), csheet, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        cmeta = {n: [cpos['%s %d' % (n, i)] for i in range(k)] for n, k in cmeta.items()}

    with open(os.path.join(ROOT, 'js', 'data', 'art.js'), 'w', encoding='utf-8') as fh:
        fh.write('/* Made by tools/build_art.py: sheet positions [x,y,w,h] in device px;\n'
                 '   ax,ay is where a crop/soil/stand picture stands on the ground. */\n')
        fh.write('const CROP_ART=' + json.dumps(meta, separators=(',', ':')) + ';\n')
        fh.write('const SHOP_ART=' + json.dumps(smeta, separators=(',', ':')) + ';\n')
        fh.write('const CREATURE_ART=' + json.dumps(cmeta, separators=(',', ':')) + ';\n')
    print('crops.png', sheet.shape[1], 'x', sheet.shape[0], '-', len(crops), 'pictures:', ', '.join(sorted(meta)))
    print('shop_items.png', ssheet.shape[1], 'x', ssheet.shape[0], '-', len(shop), 'pictures')
    print('creatures.png', ', '.join('%s %d frames' % (n, len(v)) for n, v in cmeta.items()))


if __name__ == '__main__':
    main()
