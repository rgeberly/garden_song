"""Kaitlyn's battle sheet: assets/sprites/battle.png and BATL_META in js/assets.js.

The kick, kick2, flute and victory rows come from party/Kaitlyn/battle.png in the art
folder (14 frames of 190x196 each). The karate row is built from
party/Kaitlyn/kaitlyn - karate kick - spritesheet.png (a 7-wide grid of 512px cells),
every other frame, shrunk to the same height as her in the other rows.

The cells are made bigger than 190x196 so the jump and the high kick fit: the old rows
are padded evenly left and right and at the top only, so they draw exactly where they
did (the game anchors each cell at its bottom centre).

    python tools/build_battle.py
"""
import json, os, re
import cv2
import numpy as np

ART = r'C:\kaitlyns-garden-song-art\party\Kaitlyn'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OLD_CW, OLD_CH, OLD_N = 190, 196, 14
OLD_ROWS = ['kick', 'kick2', 'flute', 'victory']
CW, CH = 234, 220                  # the new cells
KARATE_CELL, KARATE_COLS, KARATE_STEP = 512, 7, 2
GROUND = 470                       # her feet in the karate sheet's first frame (cell px)


def bbox(a):
    m = a[..., 3] > 40
    ys, xs = np.nonzero(m.any(1))[0], np.nonzero(m.any(0))[0]
    return xs[0], ys[0], xs[-1], ys[-1]


def shrink(a, k):
    """Scale an RGBA picture by k without dark fringes (colour weighted by alpha)."""
    f = a.astype(np.float32); al = f[..., 3:4] / 255
    pre = np.dstack([f[..., :3] * al, f[..., 3:4]])
    size = (max(1, round(a.shape[1] * k)), max(1, round(a.shape[0] * k)))
    s = cv2.resize(pre, size, interpolation=cv2.INTER_AREA)
    al2 = np.clip(s[..., 3:4] / 255, 1e-6, 1)
    out = np.dstack([s[..., :3] / al2, s[..., 3:4]])
    out[..., 3:4][s[..., 3:4] < 1] = 0
    return np.clip(out + 0.5, 0, 255).astype(np.uint8)


def paste(dst, src, x, y):
    """Copy src onto dst at x,y, clipped to dst."""
    h, w = src.shape[:2]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(dst.shape[1], x + w), min(dst.shape[0], y + h)
    if x1 > x0 and y1 > y0:
        dst[y0:y1, x0:x1] = src[y0 - y:y1 - y, x0 - x:x1 - x]


def main():
    old = cv2.imread(os.path.join(ART, 'battle.png'), cv2.IMREAD_UNCHANGED)
    kar = cv2.imread(os.path.join(ART, 'kaitlyn - karate kick - spritesheet.png'), cv2.IMREAD_UNCHANGED)
    n_kar = (kar.shape[0] // KARATE_CELL) * KARATE_COLS
    cells = [kar[(i // KARATE_COLS) * KARATE_CELL:(i // KARATE_COLS + 1) * KARATE_CELL,
                 (i % KARATE_COLS) * KARATE_CELL:(i % KARATE_COLS + 1) * KARATE_CELL] for i in range(n_kar)]
    cells = [c for c in cells if (c[..., 3] > 40).any()][::KARATE_STEP]

    # her size and spot in the old kick row's first frame, matched by the karate row's first
    kx0, ky0, kx1, ky1 = bbox(old[0:OLD_CH, 0:OLD_CW])
    fx0, fy0, fx1, fy1 = bbox(cells[0])
    k = (ky1 - ky0) / (fy1 - fy0)
    pad_x, pad_y = (CW - OLD_CW) // 2, CH - OLD_CH
    feet_y = ky1 + pad_y                                 # the old rows' feet, in a new cell
    mid_x = (kx0 + kx1) / 2 + pad_x

    rows = OLD_ROWS + ['karate']
    sheet = np.zeros((CH * len(rows), CW * max(OLD_N, len(cells)), 4), np.uint8)
    for r in range(len(OLD_ROWS)):
        for i in range(OLD_N):
            paste(sheet, old[r * OLD_CH:(r + 1) * OLD_CH, i * OLD_CW:(i + 1) * OLD_CW], i * CW + pad_x, r * CH + pad_y)
    r = len(OLD_ROWS)
    for i, c in enumerate(cells):
        # a frame whose feet drift below the ground is lifted back onto it (jumps stay up)
        lift = max(0, bbox(c)[3] - GROUND)
        s = shrink(c, k)
        x = round(mid_x - (fx0 + fx1) / 2 * k)
        y = round(feet_y - (GROUND + lift) * k)
        cell = np.zeros((CH, CW, 4), np.uint8); paste(cell, s, x, y)
        sheet[r * CH:(r + 1) * CH, i * CW:(i + 1) * CW] = cell

    cv2.imwrite(os.path.join(ROOT, 'assets', 'sprites', 'battle.png'), sheet, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    meta = {'cw': CW, 'ch': CH, 'rows': [{'name': n, 'n': OLD_N} for n in OLD_ROWS] + [{'name': 'karate', 'n': len(cells)}]}
    path = os.path.join(ROOT, 'js', 'assets.js')
    src = open(path, encoding='utf-8').read()
    src, hits = re.subn(r'const BATL_META=\{.*?\};', lambda m: 'const BATL_META=' + json.dumps(meta) + ';', src, count=1)
    if not hits: raise SystemExit('BATL_META not found in js/assets.js')
    open(path, 'w', encoding='utf-8', newline='').write(src)
    print('battle.png', sheet.shape[1], 'x', sheet.shape[0], '| karate frames:', len(cells), '| scale', round(k, 3))


if __name__ == '__main__':
    main()
