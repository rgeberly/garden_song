"""Kaitlyn's running animation: the art folder's "kaitlyn run <n|ne|e|se|s>.png" sheets
(frames in a grid of 256 px cells, in order) become one game sheet,

    assets/sprites/run.png     a row per direction (up, northeast, east, southeast, down)
    js/data/run.js             RUN_META: cell size, ground row, frames per row

    python tools/build_run.py [art folder]      (needs: pip install numpy opencv-python)

Each direction's frames keep the places they were drawn in, relative to each other (so
the bounce of her stride stays as drawn), lined up so the middle of her head and body
sits in the middle of the cell and her lowest boot on the ground row. They're shrunk to
match her walking frames (assets/sprites/anim.png). West-facing views are the east ones
mirrored, as for walking."""
import cv2, numpy as np, os, sys, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(ROOT), 'kaitlyns-garden-song-art')
CELL = 256
DIRS = [('up', 'n'), ('northeast', 'ne'), ('east', 'e'), ('southeast', 'se'), ('down', 's')]
SCALE = 0.75            # the run art is drawn bigger than the walk art: this matches her size
PAD = 3                 # px of empty edge kept around the frames
# how far below the walk sheet's ground row her boots usually reach, per direction (the
# median over the walk frames: the nearer boot sits lower in this top-down view). The
# run frames are set so their boots usually reach the same, so she doesn't hop up or
# down when she starts running.
WALK_DROP = {'up': 7, 'northeast': 8, 'east': 1, 'southeast': 8, 'down': 12}

def frames(path):
    a = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if a is None or a.shape[2] != 4: sys.exit('needs a PNG with transparency: ' + path)
    out = []
    for r in range(a.shape[0] // CELL):
        for c in range(a.shape[1] // CELL):
            cell = a[r * CELL:(r + 1) * CELL, c * CELL:(c + 1) * CELL]
            if (cell[..., 3] > 40).sum() > 50: out.append(cell)
    return out

def main():
    rows = []
    for name, short in DIRS:
        fs = frames(os.path.join(SRC, 'kaitlyn run %s.png' % short))
        fs = [cv2.resize(f, None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_AREA) for f in fs]
        al = np.stack([f[..., 3] > 40 for f in fs])
        ys, xs = np.where(al.any(0))
        top, bottom, left, right = ys.min(), ys.max(), xs.min(), xs.max()
        # her middle: where the head and body are (the top 45% of her), across every frame
        upper = al[:, top:top + int((bottom - top) * 0.45)]
        mid = float(np.where(upper)[2].mean())
        # her ground: where her boots usually reach, less how far they usually reach below it walking
        ground = int(np.median([np.where(a.any(1))[0].max() for a in al])) - WALK_DROP[name]
        rows.append(dict(name=name, fs=fs, top=top, bottom=bottom, left=left, right=right, mid=mid, ground=ground))
    half = int(np.ceil(max(max(r['mid'] - r['left'], r['right'] - r['mid']) for r in rows))) + PAD
    foot = int(max(r['ground'] - r['top'] for r in rows)) + PAD
    cw = half * 2
    ch = foot + int(max(r['bottom'] - r['ground'] for r in rows)) + PAD
    n = max(len(r['fs']) for r in rows)
    sheet = np.zeros((ch * len(rows), cw * n, 4), np.uint8)
    for i, r in enumerate(rows):
        ox = int(round(half - r['mid'])); oy = foot - r['ground']
        for j, f in enumerate(r['fs']):
            cell = np.zeros((ch, cw, 4), np.uint8)
            h, w = f.shape[:2]
            # place the frame so its column r['mid'] lands on the cell's middle, row r['ground'] on foot
            x0, y0 = ox, oy
            sx0, sy0 = max(0, -x0), max(0, -y0)
            dx0, dy0 = max(0, x0), max(0, y0)
            ww, hh = min(w - sx0, cw - dx0), min(h - sy0, ch - dy0)
            cell[dy0:dy0 + hh, dx0:dx0 + ww] = f[sy0:sy0 + hh, sx0:sx0 + ww]
            sheet[i * ch:(i + 1) * ch, j * cw:(j + 1) * cw] = cell
    cv2.imwrite(os.path.join(ROOT, 'assets', 'sprites', 'run.png'), sheet, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    meta = {'cw': cw, 'ch': ch, 'foot': foot, 'rows': [{'dir': r['name'], 'n': len(r['fs'])} for r in rows]}
    with open(os.path.join(ROOT, 'js', 'data', 'run.js'), 'w', encoding='utf-8') as fh:
        fh.write('/* Kaitlyn running: built by tools/build_run.py from the art folder\'s "kaitlyn run" sheets */\n')
        fh.write('const RUN_META=' + json.dumps(meta, separators=(',', ':')) + ';\n')
    print('run.png: %d x %d cells of %dx%d, ground row %d, frames %s'
          % (n, len(rows), cw, ch, foot, [len(r['fs']) for r in rows]))

if __name__ == '__main__':
    main()
