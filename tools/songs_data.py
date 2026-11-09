"""The rhythm game's song data (js/data/songs.js) and the hand edits made in the song
editor (tools/song_edits.json). Shared by tools/build_songs.py and serve.py.
No audio libraries needed here, so the local server can save edits quickly."""
import os, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SONGS_JS = os.path.join(ROOT, 'js', 'data', 'songs.js')
EDITS = os.path.join(ROOT, 'tools', 'song_edits.json')

# practice songs made of other songs played one after another: their notes are those
# songs' notes exactly, placed where each one is found in the practice recording
PARTS = {
    'practice_Grow Little Croppies': ['strawberry', 'radish', 'blueberry', 'avocado', 'lemongrass',
        'tomato', 'sunflower', 'melon', 'carrot', 'pumpkin', 'satsuma'],
    'practice_Drink Up, Lovelies': ['squash', 'muscadine', 'beet', 'collards'],
}
HEADER = ('/* Rhythm game songs, built by tools/build_songs.py from the recordings in the art\n'
          '   folder\'s rhythm/songs/, with any hand edits from the song editor (tools/song-editor.html).\n'
          '   Per song: its audio files (assets/audio/songs/<file>_flute.m4a and _backing.m4a), length\n'
          '   in seconds, tempo, pitch range, and the flute\'s notes: start and length in seconds, pitch\n'
          '   in semitones from middle C, and lane. A song made of others lists where each part starts. */\n')

def load_data():
    if not os.path.exists(SONGS_JS): return {}
    s = open(SONGS_JS, encoding='utf-8').read()
    return json.loads(s[s.index('=') + 1:].strip().rstrip(';'))

def save_data(data):
    data = dict(sorted(data.items()))
    tmp = SONGS_JS + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as o:
        o.write(HEADER)
        o.write('const SONG_DATA=' + json.dumps(data, separators=(',', ':')) + ';\n')
    os.replace(tmp, SONGS_JS)

def load_edits():
    if not os.path.exists(EDITS): return {}
    return json.load(open(EDITS, encoding='utf-8'))

def save_edits(edits):
    tmp = EDITS + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as o:
        if not edits: o.write('{}\n')
        else: o.write('{\n' + ',\n'.join('  %s: [\n%s\n  ]' % (json.dumps(k), ',\n'.join(
            '    ' + json.dumps(n, separators=(',', ':')) for n in v)) for k, v in sorted(edits.items())) + '\n}\n')
    os.replace(tmp, EDITS)

def clean_notes(notes, length):
    """checked and tidied notes: [{t, d, s, l}] in time order, inside the song. A hold can
    also say where its slide goes: e, the lane it ends in (without it, the next note's
    lane), and b, bends along the way: [[seconds after it starts, lane], ...]"""
    out = []
    for n in notes:
        t, d, s, l = float(n['t']), float(n['d']), int(n['s']), int(n['l'])
        if not (0 <= t < length) or not (0.03 <= d <= 30) or not (0 <= l <= 3) or not (-24 <= s <= 48):
            raise ValueError('a note is out of range: %r' % (n,))
        d = round(min(d, length - t), 3)
        o = {'t': round(t, 3), 'd': d, 's': s, 'l': l}
        if n.get('e') is not None:
            e = int(n['e'])
            if not 0 <= e <= 3: raise ValueError('a slide ends outside the lanes: %r' % (n,))
            o['e'] = e
        bends = sorted([round(float(a), 3), int(b)] for a, b in (n.get('b') or []))
        if any(not (0 < a < d) or not (0 <= b <= 3) for a, b in bends):
            raise ValueError('a bend is outside its note: %r' % (n,))
        if bends: o['b'] = bends
        out.append(o)
    out.sort(key=lambda n: n['t'])
    return out

def set_notes(data, name, notes):
    """give a song these notes, and remake any song made of it"""
    S = data[name]; S['n'] = notes
    if notes:
        S['lo'] = min(n['s'] for n in notes); S['hi'] = max(n['s'] for n in notes)
    recompose(data)

def recompose(data):
    """a song made of others: their notes, placed where each part starts"""
    for whole, parts in PARTS.items():
        W = data.get(whole)
        if not W or 'parts' not in W: continue
        notes = []
        for part, at in W['parts']:
            if part not in data: continue
            placed = [dict(n, t=round(n['t'] + at, 3)) for n in data[part]['n']]
            # a part's last note plays as it does in its own song: left to itself a hold
            # would slide to the next note's lane, which here is the next part's first note
            if placed: placed[-1].setdefault('e', placed[-1]['l'])
            notes += placed
        W['n'] = notes
        if notes: W['lo'] = min(n['s'] for n in notes); W['hi'] = max(n['s'] for n in notes)
        for part, _ in W['parts']:        # a part keeps its whole song's beat
            if part in data: data[part]['bpm'] = W['bpm']
