"""Animated battle effects from the art folder's effects/ sprite sheets (made in Effekseer).

    python tools/build_effects.py

Each effects/<name>.png is a sheet of square frames, COLS across (Effekseer's "X Count"),
read left to right and top to bottom. Empty frames at the start and end are dropped. It
becomes assets/effects/<key>.webp, and js/data/effects.js lists them (EFFECTS: key ->
{file, cell, cols, n, add}). The key is the name in lower case with spaces as underscores.

add: made on black ("Make transparent: None"), drawn with light that adds up, so black
is see-through. Otherwise (made with "Original image") its own transparency is kept.
Needs: pip install opencv-python numpy
"""
import os, re, glob, json
import cv2, numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(os.path.dirname(ROOT), 'kaitlyns-garden-song-art', 'effects')
OUT = os.path.join(ROOT, 'assets', 'effects')
OUT_JS = os.path.join(ROOT, 'js', 'data', 'effects.js')
COLS = 8                 # frames across, as set in Effekseer's recorder ("X Count")
EMPTY = 0.6              # a frame this dark on average (0-255) counts as empty
# sheets made with a transparent background ("Original image") instead of on black
SOLID = set()


def key_of(name):
    return re.sub(r'[\s\-]+', '_', name.strip().lower())


def main():
    os.makedirs(OUT, exist_ok=True)
    effects = {}
    for path in sorted(glob.glob(os.path.join(ART, '*.png'))):
        name = os.path.splitext(os.path.basename(path))[0]; key = key_of(name)
        im = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        cell = im.shape[1] // COLS; rows = im.shape[0] // cell
        frames = [im[r * cell:(r + 1) * cell, c * cell:(c + 1) * cell] for r in range(rows) for c in range(COLS)]
        add = key not in SOLID
        lit = [f[..., :3].mean() > EMPTY if add else (f.shape[2] == 4 and f[..., 3].max() > 0) for f in frames]
        first = lit.index(True); last = len(lit) - 1 - lit[::-1].index(True)
        frames = frames[first:last + 1]
        rows = -(-len(frames) // COLS)
        sheet = np.zeros((rows * cell, COLS * cell, 3 if add else 4), np.uint8)
        for i, f in enumerate(frames):
            r, c = divmod(i, COLS)
            sheet[r * cell:(r + 1) * cell, c * cell:(c + 1) * cell] = f[..., :3] if add else f
        dst = os.path.join(OUT, key + '.webp')
        cv2.imwrite(dst, sheet, [cv2.IMWRITE_WEBP_QUALITY, 85])
        effects[key] = {'file': 'assets/effects/' + key + '.webp', 'cell': cell, 'cols': COLS, 'n': len(frames), 'add': add}
        print(f'{key:20s} {len(frames)} frames of {cell}px (frames {first}-{last} of the sheet), '
              f'{os.path.getsize(dst) // 1024} KB')
    with open(OUT_JS, 'w', encoding='utf-8') as f:
        f.write('/* made by tools/build_effects.py from the art folder\'s effects/ sheets: key -> its sheet, frame\n'
                '   size, frames across, how many, and whether it\'s drawn as added light (made on black) */\n')
        f.write('const EFFECTS=' + json.dumps(effects, separators=(',', ':')) + ';\n')
    print(len(effects), 'effects ->', os.path.relpath(OUT_JS, ROOT))


if __name__ == '__main__':
    main()
