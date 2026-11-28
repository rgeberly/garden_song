"""Builds the game's sound effects from the art folder's sfx/ recordings.

    python tools/build_sfx.py

Each sfx/<name>.wav becomes assets/audio/sfx/<key>.m4a, and js/data/sounds.js lists
them (SOUNDS: key -> {files, dur}). The key is the file name in lower case with spaces
and dashes as underscores ("cant do that" -> cant_do_that). A name ending in a number
("close door 2") is another take of the same sound, and the game picks one at random.

Along the way each recording is cleaned up, without touching the original:
  - any DC offset is taken out (a slow drift that can click),
  - left and right out of phase: only the louder side is kept,
  - silence before the sound starts is cut (so it plays the moment it's called for),
    and quiet room noise after it ends,
  - it fades in over a few milliseconds and out at the end (no clicks; a longer fade
    when the recording stops while still sounding),
  - its loudness is evened out with the others (SFX_RMS), never past SFX_PEAK.
A sound in LOOPS (like fishing reeling) keeps its end and has it crossfaded into its start
instead, so the game can repeat it without a seam.
How loud each one plays in the game is then set by SOUND_VOL in js/03-audio.js.
Needs: pip install imageio-ffmpeg librosa soundfile scipy
"""
import os, re, glob, json, subprocess, tempfile
import numpy as np, librosa, soundfile as sf, imageio_ffmpeg
from scipy.signal import butter, sosfiltfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(os.path.dirname(ROOT), 'kaitlyns-garden-song-art', 'sfx')
OUT_AUDIO = os.path.join(ROOT, 'assets', 'audio', 'sfx')
OUT_JS = os.path.join(ROOT, 'js', 'data', 'sounds.js')
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48000
SFX_RMS = -20.0      # dBFS: the loudness of the sounding part, before SOUND_VOL
SFX_PEAK = -1.0      # dBFS: no peak goes past this
START_DB = -30       # the sound starts where it first gets this loud (dB below its peak)
END_DB = -50         # and ends after it last is
# sounds that loop while something goes on (the game repeats them seamlessly): no fades,
# their end crossfaded into their start over LOOP_XFADE seconds, and their exact length kept
LOOPS = {'fishing_reeling', 'rain'}
LOOP_XFADE = 0.2


def key_of(name):
    """a recording's sound key: its name in lower case with spaces and dashes as underscores,
    without take numbers, whether 'bite 2', 'bite (1)' or 'bite 1 (1)' (copies saved twice)"""
    k = name.strip().lower()
    while True:
        k2 = re.sub(r'\s*\(\d+\)$', '', re.sub(r'[\s_\-]+\d+$', '', k)).strip()
        if k2 == k: break
        k = k2
    return re.sub(r'[\s\-]+', '_', k)


def clean(y, loop=False):
    """y: (channels, samples) float. Returns the cleaned, levelled copy."""
    # DC: a gentle 20 Hz high-pass, both ways so nothing shifts in time
    # left and right out of phase (they'd cancel on a phone's single speaker): the louder one alone
    if y.shape[0] == 2 and np.corrcoef(y[0], y[1])[0, 1] < 0:
        y = np.repeat(y[[np.argmax(np.abs(y).max(axis=1))]], 2, axis=0)
    sos = butter(2, 20, 'highpass', fs=SR, output='sos')
    out = sosfiltfilt(sos, y - y.mean(axis=1, keepdims=True), axis=1)
    mono = np.abs(out).max(axis=0)
    pk = mono.max()
    if pk <= 0:
        return out
    loud = np.where(mono > pk * 10 ** (START_DB / 20))[0]
    tail = np.where(mono > pk * 10 ** (END_DB / 20))[0]
    s = max(0, loud[0] - int(0.004 * SR))
    e = min(out.shape[1], max(tail[-1], loud[-1]) + int(0.03 * SR))
    if loop:
        out = out[:, s:].copy(); n = out.shape[1]; x = int(LOOP_XFADE * SR)
        k = np.linspace(0, np.pi / 2, x)
        out[:, :x] = out[:, :x] * np.sin(k) + out[:, n - x:] * np.cos(k)     # equal-power crossfade
        out = out[:, :n - x]
        return level(out)
    out = out[:, s:e].copy()
    n = out.shape[1]
    # fades: 4 ms in; out over 30 ms, or 250 ms if it was still sounding at the end
    fi = min(n, int(0.004 * SR)); out[:, :fi] *= np.linspace(0, 1, fi)
    end_lvl = np.abs(out[:, -int(0.05 * SR):]).max() / (np.abs(out).max() or 1)
    fo = min(n // 3, int((0.25 if end_lvl > 0.05 else 0.03) * SR))
    out[:, n - fo:] *= np.linspace(1, 0, fo) ** 2
    return level(out)


def level(out):
    """evened out with the others: the sounding part at SFX_RMS, no peak past SFX_PEAK"""
    # loudness of the sounding part (above -40 dB of its peak, 20 ms windows)
    m = out.mean(axis=0); w = int(0.02 * SR)
    wins = np.array([np.sqrt(np.mean(m[i:i + w] ** 2)) for i in range(0, max(1, len(m) - w), w)])
    act = wins[wins > wins.max() * 0.01]
    rms = np.sqrt(np.mean(act ** 2)) if len(act) else wins.max()
    gain = 10 ** (SFX_RMS / 20) / max(rms, 1e-9)
    gain = min(gain, 10 ** (SFX_PEAK / 20) / np.abs(out).max())
    return out * gain


def encode(y, dst):
    with tempfile.TemporaryDirectory() as td:
        tmp = os.path.join(td, 'x.wav')
        sf.write(tmp, y.T, SR, subtype='PCM_24')
        subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', tmp,
                        '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', dst], check=True)


def main():
    os.makedirs(OUT_AUDIO, exist_ok=True)
    sounds = {}
    # each sound's takes, numbered 1, 2, 3... in name order (a sound with one take keeps its key)
    takes = {}
    for path in sorted(glob.glob(os.path.join(ART, '*.wav')), key=lambda p: os.path.basename(p).lower()):
        takes.setdefault(key_of(os.path.splitext(os.path.basename(path))[0]), []).append(path)
    for old in glob.glob(os.path.join(OUT_AUDIO, '*.m4a')): os.remove(old)       # (no stale takes left behind)
    for key, paths in sorted(takes.items()):
      for i, path in enumerate(paths):
        file = key if len(paths) == 1 else '%s_%d' % (key, i + 1)
        y, _ = librosa.load(path, sr=SR, mono=False)
        if y.ndim == 1:
            y = y[None, :]
        y = clean(y, key in LOOPS)
        encode(y, os.path.join(OUT_AUDIO, file + '.m4a'))
        S = sounds.setdefault(key, {'files': [], 'dur': 0})
        if key in LOOPS: S['loop'] = round(y.shape[1] / SR, 4)      # the exact length to repeat
        S['files'].append(file)
        S['dur'] = round(max(S['dur'], y.shape[1] / SR), 2)
        print(f'{file:28s} {y.shape[1] / SR:5.2f} s')
    with open(OUT_JS, 'w', encoding='utf-8') as f:
        f.write('/* made by tools/build_sfx.py from the art folder\'s sfx/ recordings:\n'
                '   key -> its files in assets/audio/sfx/ (takes of one sound) and the longest one\'s length in seconds */\n')
        f.write('const SOUNDS=' + json.dumps(sounds, separators=(',', ':')) + ';\n')
    print(len(sounds), 'sounds ->', os.path.relpath(OUT_JS, ROOT))


if __name__ == '__main__':
    main()
