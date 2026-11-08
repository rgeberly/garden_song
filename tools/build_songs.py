"""Build the rhythm game songs from the recordings in the art folder.

For every pair  <name>_flute.wav + <name>_backing.wav  in the art folder's rhythm/songs
(WAV or FLAC):
  * converts both to M4A in assets/audio/songs/
  * reads the notes out of the flute track (when each starts, how long, what pitch)
  * writes them all to js/data/songs.js

<name> is a crop (strawberry), a battle song (sprout, lullaby, waltz, requiem,
nocturne, hymn), a field song (reprise, ward, shower) or practice_<Song Name>.
Notes placed by hand in the song editor (tools/song-editor.html, saved to
tools/song_edits.json) are used instead of reading the recording.
Run it again whenever a recording is added or replaced:
    python tools/build_songs.py                  every song
    python tools/build_songs.py strawberry ...   just these; the rest stay as they were
Needs: pip install imageio-ffmpeg librosa
"""
import os, re, sys, json, wave, glob, subprocess
import numpy as np, librosa, imageio_ffmpeg
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from songs_data import PARTS, load_data, save_data, load_edits, recompose   # songs.js, hand edits

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(os.path.dirname(ROOT), 'kaitlyns-garden-song-art', 'rhythm', 'songs')
OUT_AUDIO = os.path.join(ROOT, 'assets', 'audio', 'songs')
OUT_JS = os.path.join(ROOT, 'js', 'data', 'songs.js')
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR, HOP = 22050, 256          # analysis rate; one frame = 11.6 ms
# how the notes are read (see segment): tuned against the note counts of the crop songs
PARAMS = {
    'min_note': 0.18,    # seconds: anything shorter is a slide or scoop, folded into its note...
    'keep_min': 0.07,    # ...unless it's at least this long and really played: a steady pitch
    'steady': 0.3,       #    (wobbling less than this many semitones) played firmly
    'keep_loud': 0.5,    #    (at least this share of the loudest moment)
    'split_dip': 0.4,    # a held pitch is played again only where the volume drops below this share
}

def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def load(path):
    """mono float samples at SR from a WAV (16/24/32-bit) or anything ffmpeg reads"""
    if path.lower().endswith('.wav'):
        w = wave.open(path); n = w.getnframes(); ch = w.getnchannels(); sw = w.getsampwidth(); r = w.getframerate()
        raw = w.readframes(n)
        if sw == 3:
            a = np.frombuffer(raw, np.uint8).reshape(-1, 3).astype(np.int32)
            x = a[:, 0] | (a[:, 1] << 8) | (a[:, 2] << 16)
            x = np.where(x >= 1 << 23, x - (1 << 24), x) / float(1 << 23)
        elif sw == 2: x = np.frombuffer(raw, np.int16) / 32768.0
        else: x = np.frombuffer(raw, np.int32) / 2147483648.0
        x = x.reshape(-1, ch).mean(1).astype(np.float32)
        return librosa.resample(x, orig_sr=r, target_sr=SR)
    pcm = subprocess.run([FFMPEG, '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.float32)

def analyze(y):
    """what the notes are read from: pitch, loudness and attack strength, frame by frame"""
    f0, voiced, _ = librosa.pyin(y, fmin=240, fmax=2400, sr=SR, hop_length=HOP, frame_length=2048)
    rms = librosa.feature.rms(y=y, hop_length=HOP, frame_length=2048)[0]
    env = librosa.onset.onset_strength(y=y, sr=SR, hop_length=HOP)
    n = min(len(f0), len(rms), len(env)); f0, voiced, rms, env = f0[:n], voiced[:n], rms[:n], env[:n]
    loud = rms > 0.12 * rms.max()
    midi = np.where(voiced & loud, librosa.hz_to_midi(np.nan_to_num(f0, nan=1.0)), np.nan)
    onsets = librosa.onset.onset_detect(onset_envelope=env, sr=SR, hop_length=HOP, backtrack=True)
    return {'n': n, 'rms': rms, 'env': env, 'midi': midi, 'onsets': onsets}

def transcribe(y, P=None):
    return segment(analyze(y), P)

def segment(A, P=None):
    """the flute's notes: [{t, d, s}] with t/d in seconds, s in semitones from middle C"""
    P = dict(PARAMS, **(P or {}))
    n, rms, env, midi, onsets = A['n'], A['rms'], A['env'], A['midi'], A['onsets']
    ft = lambda i: i * HOP / SR
    peak = rms.max()

    # 1. runs of frames on one semitone; a new note needs 3 frames (35 ms) on another pitch
    notes, cur, start, pend, pstart = [], None, 0, None, 0
    def close(end):
        if cur is not None: notes.append([start, end, cur])
    for i in range(n):
        m = midi[i]
        if np.isnan(m):
            close(i); cur = None; pend = None; continue
        r = int(round(m))
        if cur is None: cur, start, pend = r, i, None; continue
        if abs(m - cur) < 0.6: pend = None; continue
        if pend != r: pend, pstart = r, i
        elif i - pstart >= 2:
            close(pstart); cur, start, pend = r, pstart, None
    close(n)

    # 2. split a long note only where the flute clearly tongues the same pitch again
    #    (a real dip in loudness, not just a swell); those are marked as tongued
    segs = []
    for a, b, s in notes:
        cuts = [a]
        for o in onsets:
            if a + 8 < o < b - 8 and o - cuts[-1] > 8:
                # the trough can sit just after the attack's marked start, so look both sides
                dip = rms[max(a, o - 4):o + 6].min()
                around = max(rms[max(a, o - 12):o].max(initial=0), rms[o:o + 12].max(initial=0))
                if dip < P['split_dip'] * around: cuts.append(o + int(np.argmin(rms[o:o + 6])))
        cuts.append(b)
        for i in range(len(cuts) - 1): segs.append([cuts[i], cuts[i + 1], s, i > 0])

    # 3. breaths and murmurs are too quiet to be notes
    segs = [g for g in segs if rms[g[0]:g[1]].mean() >= 0.2 * peak]

    # 4. slides, scoops and slurred grace notes: anything shorter than min_note joins the
    #    note it runs into (the one before it, or else the one after); shortest first.
    #    A short note stays if it's really played: a steady pitch, played firmly.
    touch = lambda x, y: y[0] - x[1] <= 3
    min_f = P['min_note'] * SR / HOP
    def real(g):
        a, b = g[0], g[1]
        core = midi[a:b]; core = core[~np.isnan(core)]
        if not len(core): return False
        # held long enough on one pitch, not counting the slides into and out of it
        held = np.sum(np.abs(core - np.median(core)) <= P['steady'])
        steady = held >= P['keep_min'] * SR / HOP
        firm = rms[a:b].mean() >= P['keep_loud'] * peak
        return steady and firm
    kept = set()                      # short notes that are really played stay
    while True:
        short = [i for i, g in enumerate(segs) if g[1] - g[0] < min_f and id(g) not in kept]
        if not short: break
        i = min(short, key=lambda i: segs[i][1] - segs[i][0]); g = segs[i]
        if real(g): kept.add(id(g)); continue
        if i > 0 and touch(segs[i - 1], g): segs[i - 1][1] = g[1]; del segs[i]
        elif i + 1 < len(segs) and touch(g, segs[i + 1]):
            segs[i + 1][0] = g[0]; segs[i + 1][3] = g[3]; del segs[i]
        elif g[1] - g[0] >= 0.07 * SR / HOP: kept.add(id(g))
        else: del segs[i]
    # the same pitch either side of a slide that was folded away is still one note
    out = []
    for g in segs:
        if out and out[-1][2] == g[2] and touch(out[-1], g) and not g[3]: out[-1][1] = g[1]
        else: out.append(list(g))
    # each note's pitch: the middle of what was played (a scoop at the start doesn't count)
    pitch = lambda a, b: int(round(np.nanmedian(midi[a:b]))) if np.any(~np.isnan(midi[a:b])) else None
    res = []
    for a, b, s, _ in out:
        m = pitch(a, b)
        res.append({'t': round(ft(a), 3), 'd': round(ft(b - a), 3), 's': (m if m is not None else s) - 60})
    return res

def lanes(notes, k=4):
    """a lane for each note: higher pitches further right, each lane getting about its
    share of the notes, so one very high or low note doesn't squash the rest together"""
    from collections import Counter
    c = Counter(n['s'] for n in notes); tot = len(notes); below = 0; lane = {}
    for s in sorted(c):
        lane[s] = min(k - 1, int((below + c[s] / 2) / tot * k)); below += c[s]
    for n in notes: n['l'] = lane[n['s']]

# how many notes each song has, as counted by ear: the reader adjusts its settings as
# little as it can until it agrees (a song not listed here just uses PARAMS)
NOTE_COUNTS = {
    'strawberry': 10, 'radish': 13, 'blueberry': 12, 'avocado': 8, 'lemongrass': 14, 'tomato': 11,
    'sunflower': 11, 'melon': 9, 'carrot': 11, 'pumpkin': 10, 'satsuma': 12,
}
TRY = {   # the settings the reader may try, nearest the usual ones first
    'min_note': [0.15, 0.18, 0.2, 0.22], 'keep_min': [0.06, 0.07, 0.08, 0.1], 'steady': [0.25, 0.3, 0.35],
    'keep_loud': [0.4, 0.5, 0.6], 'split_dip': [0.3, 0.4, 0.5, 0.6],
}

def fit(A, want):
    """the notes, with the settings nearest PARAMS that find `want` of them (and what changed)"""
    import itertools
    notes = segment(A)
    if want is None or len(notes) == want: return notes, {}
    keys = list(TRY); options = []
    for vals in itertools.product(*(TRY[k] for k in keys)):
        P = dict(zip(keys, vals))
        dist = sum(abs(TRY[k].index(P[k]) - TRY[k].index(PARAMS[k])) for k in keys)
        options.append((dist, P))
    options.sort(key=lambda o: o[0])
    for dist, P in options:
        got = segment(A, P)
        if len(got) == want: return got, {k: v for k, v in P.items() if v != PARAMS[k]}
    print('  !! could not find %d notes; using the usual %d' % (want, len(notes)))
    return notes, {}

def locate(part, whole, near):
    """where (seconds) the recording `part` starts inside `whole`, searching around `near`"""
    a = max(0, int((near - 1.5) * SR)); b = min(len(whole), int((near + 1.5) * SR) + len(part))
    w = whole[a:b]; n = 1 << int(np.ceil(np.log2(len(w) + len(part))))
    c = np.fft.irfft(np.fft.rfft(w, n) * np.conj(np.fft.rfft(part, n)), n)[:len(w) - len(part) + 1]
    i = int(np.argmax(c))
    match = c[i] / (np.sqrt(np.sum(part ** 2) * np.sum(w[i:i + len(part)] ** 2)) + 1e-9)
    return (a + i) / SR, match

def convert(src, dst):
    if os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(src): return   # already done
    subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', src, '-ac', '2', '-ar', '44100',
                    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', dst], check=True)

def main():
    os.makedirs(OUT_AUDIO, exist_ok=True)
    found = {}
    for f in glob.glob(os.path.join(ART, '*_flute.*')):
        name = os.path.basename(f).rsplit('_flute.', 1)[0]
        back = [p for p in glob.glob(os.path.join(ART, glob.escape(name) + '_backing.*'))]
        if not back: print('  no backing track for', name, '- skipped'); continue
        found[name] = (f, back[0])
    only = sys.argv[1:]
    for n in only:
        if n not in found: sys.exit('no recordings for "%s" in %s' % (n, ART))
    data = load_data() if only else {}               # with names given, every other song stays as it was
    edits = load_edits()                              # notes placed by hand in the song editor
    todo = set(only or found)
    todo |= {p for p, parts in PARTS.items() if p in found and todo & set(parts)}   # a changed part remakes its whole
    for name in sorted(todo, key=lambda n: (n in PARTS, n)):    # parts first
        fl, bk = found[name]; sl = slug(name)
        print(name)
        convert(fl, os.path.join(OUT_AUDIO, sl + '_flute.m4a'))
        convert(bk, os.path.join(OUT_AUDIO, sl + '_backing.m4a'))
        y = load(fl)
        where = None
        if name in PARTS:
            notes, at, where = [], 0.0, []
            for part in PARTS[name]:
                if part not in data: sys.exit('  %s needs %s built first' % (name, part))
                py = load(found[part][0]); at, match = locate(py, y, at)
                print('  %-11s at %6.2f s  (match %.2f)%s' % (part, at, match, '' if match > 0.9 else '  !! weak match'))
                notes += [dict(n, t=round(n['t'] + at, 3)) for n in data[part]['n']]
                where.append([part, round(at, 3)]); at += len(py) / SR
        elif name in edits:
            notes = [dict(n) for n in edits[name]]
            print('  using the notes placed by hand in the song editor')
        else:
            notes, changed = fit(analyze(y), NOTE_COUNTS.get(name))
            if changed: print('  settings adjusted to agree with the count:', changed)
            if notes: lanes(notes)
        if not notes: print('  no notes found!'); continue
        ss = [n['s'] for n in notes]
        tempo = float(np.atleast_1d(librosa.beat.beat_track(y=load(bk), sr=SR, hop_length=HOP)[0])[0])
        data[name] = {'file': sl, 'len': round(len(y) / SR, 3), 'bpm': round(tempo, 1), 'lo': min(ss), 'hi': max(ss), 'n': notes}
        if where: data[name]['parts'] = where
        print('  %d notes, %.1f s, %.0f bpm, pitch %d..%d' % (len(notes), len(y) / SR, tempo, min(ss), max(ss)))
    # a song made of others follows their notes (and a short clip keeps its whole song's beat)
    recompose(data)
    if not data: sys.exit('no songs found in ' + ART)
    save_data(data)
    print('wrote', OUT_JS)

if __name__ == '__main__':
    main()
