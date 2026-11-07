"""Build the rhythm game songs from the recordings in the art folder.

For every pair  <name>_flute.wav + <name>_backing.wav  in the art folder's rhythm/songs
(WAV or FLAC):
  * converts both to M4A in assets/audio/songs/
  * reads the notes out of the flute track (when each starts, how long, what pitch)
  * writes them all to js/data/songs.js

<name> is a crop (strawberry), a battle song (sprout, lullaby, waltz, requiem,
nocturne, hymn), a field song (reprise, ward, shower) or practice_<Song Name>.
Run it again whenever a recording is added or replaced:
    python tools/build_songs.py                  every song
    python tools/build_songs.py strawberry ...   just these; the rest stay as they were
Needs: pip install imageio-ffmpeg librosa
"""
import os, re, sys, json, wave, glob, subprocess
import numpy as np, librosa, imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(os.path.dirname(ROOT), 'kaitlyns-garden-song-art', 'rhythm', 'songs')
OUT_AUDIO = os.path.join(ROOT, 'assets', 'audio', 'songs')
OUT_JS = os.path.join(ROOT, 'js', 'data', 'songs.js')
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR, HOP = 22050, 256          # analysis rate; one frame = 11.6 ms
MIN_NOTE = 0.15               # seconds: anything shorter is a slide or scoop, folded into its note
SPLIT_DIP = 0.5               # a held pitch is played again only where the volume drops below this share

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

def transcribe(y):
    """the flute's notes: [{t, d, s}] with t/d in seconds, s in semitones from middle C"""
    f0, voiced, _ = librosa.pyin(y, fmin=240, fmax=2400, sr=SR, hop_length=HOP, frame_length=2048)
    rms = librosa.feature.rms(y=y, hop_length=HOP, frame_length=2048)[0]
    n = min(len(f0), len(rms)); f0, voiced, rms = f0[:n], voiced[:n], rms[:n]
    loud = rms > 0.12 * rms.max()
    midi = np.where(voiced & loud, librosa.hz_to_midi(np.nan_to_num(f0, nan=1.0)), np.nan)
    ft = lambda i: i * HOP / SR

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
    onsets = librosa.onset.onset_detect(y=y, sr=SR, hop_length=HOP, backtrack=True)
    segs = []
    for a, b, s in notes:
        cuts = [a]
        for o in onsets:
            if a + 8 < o < b - 8:
                dip = rms[max(a, o - 4):o + 1].min()
                around = max(rms[max(a, o - 12):o].max(initial=0), rms[o:o + 8].max(initial=0))
                if dip < SPLIT_DIP * around: cuts.append(o)
        cuts.append(b)
        for i in range(len(cuts) - 1): segs.append([cuts[i], cuts[i + 1], s, i > 0])

    # 3. breaths and murmurs are too quiet to be notes
    peak = rms.max()
    segs = [g for g in segs if rms[g[0]:g[1]].mean() >= 0.2 * peak]

    # 4. slides, scoops and slurred grace notes: anything shorter than MIN_NOTE joins the
    #    note it runs into (the one before it, or else the one after); shortest first
    touch = lambda x, y: y[0] - x[1] <= 3
    min_f = MIN_NOTE * SR / HOP
    kept = set()                      # lone short (staccato) notes, which stay
    while True:
        short = [i for i, g in enumerate(segs) if g[1] - g[0] < min_f and id(g) not in kept]
        if not short: break
        i = min(short, key=lambda i: segs[i][1] - segs[i][0]); g = segs[i]
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

def convert(src, dst):
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
    data = {}
    if only and os.path.exists(OUT_JS):             # keep every other song as it was
        s = open(OUT_JS, encoding='utf-8').read()
        data = json.loads(s[s.index('=') + 1:].strip().rstrip(';'))
    for name in sorted(only or found):
        fl, bk = found[name]; sl = slug(name)
        print(name)
        convert(fl, os.path.join(OUT_AUDIO, sl + '_flute.m4a'))
        convert(bk, os.path.join(OUT_AUDIO, sl + '_backing.m4a'))
        y = load(fl)
        notes = transcribe(y)
        if not notes: print('  no notes found!'); continue
        lanes(notes)
        ss = [n['s'] for n in notes]
        tempo = float(np.atleast_1d(librosa.beat.beat_track(y=load(bk), sr=SR, hop_length=HOP)[0])[0])
        data[name] = {'file': sl, 'len': round(len(y) / SR, 3), 'bpm': round(tempo, 1), 'lo': min(ss), 'hi': max(ss), 'n': notes}
        print('  %d notes, %.1f s, %.0f bpm, pitch %d..%d' % (len(notes), len(y) / SR, tempo, min(ss), max(ss)))
    if not data: sys.exit('no songs found in ' + ART)
    data = dict(sorted(data.items()))
    with open(OUT_JS, 'w', encoding='utf-8') as o:
        o.write('/* Rhythm game songs, built by tools/build_songs.py from the recordings in the art\n'
                '   folder\'s rhythm/songs/ (do not edit by hand). Per song: its audio files (assets/audio/songs/\n'
                '   <file>_flute.m4a and _backing.m4a), length in seconds, tempo, pitch range, and the flute\'s\n'
                '   notes: start and length in seconds, pitch in semitones from middle C, and lane. */\n')
        o.write('const SONG_DATA=' + json.dumps(data, separators=(',', ':')) + ';\n')
    print('wrote', OUT_JS)

if __name__ == '__main__':
    main()
