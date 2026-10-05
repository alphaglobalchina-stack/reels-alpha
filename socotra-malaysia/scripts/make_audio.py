"""Soundtrack for the Malaysia reel: generated music + soft SFX, mixed to about -16 LUFS.

No whooshes / swooshes / air effects anywhere.

Music (used only when assets/music.mp3 or public/music.mp3 does not exist):
  * A minor -> C major, 92 BPM, progression Am9 | Fmaj7 | Cadd9 | G6/B | Am9 | Fmaj9 Gsus | Cmaj9
  * warm detuned pad, soft piano (inharmonic additive partials + hammer), quiet arpeggio that
    goes from 8ths to 16ths during the feature discs, light sub
  * convolution reverb with a generated impulse, 28 Hz high-pass / 10 kHz low-pass, no clipping
  * final chord rings out and fades over the last second
SFX (about 10 dB under the music): soft tick at each stop, soft pop for each passport stamp,
delicate rising bell run with each counter, glassy shimmer when the price lands.

Run: node scripts/export-cues.mjs && python3 scripts/make_audio.py
"""
import json
import os
import subprocess

import numpy as np
import pyloudnorm as pyln
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SR = 48000
CUES = json.load(open(os.path.join(HERE, 'cues.json')))
FPS = CUES['fps']
DUR = CUES['frames'] / FPS  # 18.0 s
N = int(round(DUR * SR))
BPM = CUES['bpm']
BEAT = 60.0 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(11)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}


def nm(s):  # 'A3' -> midi
    return NOTE[s[:-1]] + 12 * (int(s[-1]) + 1)


def t_arr(n):
    return np.arange(n) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)


def place(buf, sig, start, pan=0.0, gain=1.0):
    """Add mono sig into stereo buf at time start (s), equal-power pan."""
    i0 = int(round(start * SR))
    if i0 < 0:
        sig, i0 = sig[-i0:], 0
    if i0 >= len(buf):
        return
    sig = sig[: len(buf) - i0]
    l = np.cos((pan + 1) * np.pi / 4) * gain
    r = np.sin((pan + 1) * np.pi / 4) * gain
    buf[i0 : i0 + len(sig), 0] += sig * l
    buf[i0 : i0 + len(sig), 1] += sig * r


# ─────────────────────────── harmony ───────────────────────────
# (start_beat, bass, voicing)
CHORDS = [
    (0, 'A2', ['A3', 'C4', 'E4', 'G4', 'B4']),  # Am9
    (4, 'F2', ['F3', 'A3', 'C4', 'E4', 'G4']),  # Fmaj9
    (8, 'C3', ['G3', 'C4', 'D4', 'E4', 'G4']),  # Cadd9
    (12, 'B2', ['G3', 'B3', 'D4', 'E4', 'A4']),  # G6add9/B
    (16, 'A2', ['A3', 'C4', 'E4', 'G4', 'B4']),  # Am9
    (20, 'F2', ['F3', 'A3', 'C4', 'E4', 'G4']),  # Fmaj9
    (22, 'G2', ['G3', 'C4', 'D4', 'F4', 'A4']),  # G9sus4 (lift into the price)
    (24, 'C2', ['G3', 'C4', 'E4', 'B4', 'D5']),  # Cmaj9 — final chord
]
END_BEAT = DUR / BEAT


def chord_spans():
    spans = []
    for i, (b, bass, v) in enumerate(CHORDS):
        e = CHORDS[i + 1][0] if i + 1 < len(CHORDS) else END_BEAT + 4
        spans.append((b * BEAT, e * BEAT, bass, v))
    return spans


# ─────────────────────────── instruments ───────────────────────────
def pad_note(f, dur, rel=1.2):
    n = int((dur + rel) * SR)
    t = t_arr(n)
    sig = np.zeros(n)
    for det in (-0.06, 0.0, 0.055):  # semitones (≈ ±6 cents)
        ff = f * 2 ** (det / 12)
        ph = rng.uniform(0, 2 * np.pi)
        for k in range(1, 11):
            if ff * k > 6000:
                break
            sig += np.sin(2 * np.pi * ff * k * t + ph * k) / k ** 1.7
    att = 0.9
    env = np.minimum(1, t / att) ** 1.5
    env *= np.where(t > dur, np.exp(-(t - dur) / (rel / 3.5)), 1.0)
    env *= 1 + 0.08 * np.sin(2 * np.pi * 0.21 * t)
    return sig * env / 3.0


def piano_note(f, vel=0.6, length=4.0):
    n = int(length * SR)
    t = t_arr(n)
    B = 0.00035
    sig = np.zeros(n)
    tau0 = 2.8 * (220 / f) ** 0.35
    for k in range(1, 16):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 9000:
            break
        amp = (1 / k ** 1.25) * (0.55 + 0.45 * vel) ** (k * 0.35)
        tau = tau0 / (1 + 0.45 * (k - 1))
        sig += amp * np.sin(2 * np.pi * fk * t + rng.uniform(0, 0.3)) * np.exp(-t / tau)
    # two-stage decay (prompt + aftersound) and a soft hammer
    sig *= 0.75 * np.exp(-t / (tau0 * 0.5)) + 0.25
    att = np.minimum(1, t / 0.004)
    hammer = bp(rng.normal(0, 1, n), 800, 3500) * np.exp(-t / 0.006) * 0.05
    out = (sig * att + hammer) * vel
    out *= np.minimum(1, (length - t) / 0.3)  # no hard cut
    return out


def bell(f, tau=0.45, bright=0.25):
    n = int(min(3.0, tau * 7) * SR)
    t = t_arr(n)
    s = np.sin(2 * np.pi * f * t) + bright * np.sin(2 * np.pi * 2.0 * f * t) * np.exp(-t / (tau * 0.5)) + 0.07 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / (tau * 0.3))
    env = np.minimum(1, t / 0.003) * np.exp(-t / tau)
    return s * env


def sub_note(f, dur):
    n = int((dur + 0.6) * SR)
    t = t_arr(n)
    s = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * 2 * f * t)
    env = np.minimum(1, t / 0.12) * np.where(t > dur, np.exp(-(t - dur) / 0.18), 1.0)
    return s * env


def reverb_ir(seconds=3.2, rt60=2.5):
    n = int(seconds * SR)
    t = t_arr(n)
    decay = np.exp(-6.91 * t / rt60)
    ir = np.zeros((n, 2))
    for ch in range(2):
        noise = rng.normal(0, 1, n)
        bright = lp(noise, 7000)
        dark = lp(noise, 1800)
        mixw = np.clip(t / 1.2, 0, 1)
        ir[:, ch] = (bright * (1 - mixw) + dark * mixw) * decay
    pre = int(0.025 * SR)
    ir = np.vstack([np.zeros((pre, 2)), ir])
    # sparse early reflections
    for d, g in [(0.011, 0.5), (0.019, 0.35), (0.031, 0.28), (0.043, 0.2)]:
        ir[int(d * SR), 0] += g
        ir[int((d + 0.004) * SR), 1] += g
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def convolve(x, ir):
    return np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)


# ─────────────────────────── music ───────────────────────────
def build_music():
    L = N + SR  # a little headroom for tails, trimmed later
    pad = np.zeros((L, 2))
    piano = np.zeros((L, 2))
    arp = np.zeros((L, 2))
    sub = np.zeros((L, 2))
    spans = chord_spans()

    for (t0, t1, bass, voicing) in spans:
        dur = min(t1, DUR) - t0
        for j, note in enumerate(voicing):
            place(pad, pad_note(midi(nm(note)), dur + 0.25), t0 - 0.1, pan=-0.5 + j / (len(voicing) - 1), gain=0.11)
        place(sub, sub_note(midi(nm(bass)) / 2 if nm(bass) > 40 else midi(nm(bass)), dur), t0, gain=0.15)
        # piano: soft rolled block chord on the downbeat (bass + upper voicing)
        place(piano, piano_note(midi(nm(bass)), 0.45, 4.5), t0, pan=-0.15, gain=0.5)
        for j, note in enumerate(voicing[1:]):
            place(piano, piano_note(midi(nm(note)), 0.32, 3.5), t0 + 0.018 * (j + 1), pan=-0.3 + 0.15 * j, gain=0.38)

    # sparse melody (beat, note, velocity)
    melody = [
        (1.0, 'C5', 0.42), (2.0, 'E5', 0.45), (2.5, 'B4', 0.38),
        (5.0, 'A4', 0.4), (6.0, 'C5', 0.42), (7.0, 'E5', 0.46),
        (9.0, 'E5', 0.44), (10.0, 'D5', 0.4), (10.5, 'C5', 0.38),
        (13.0, 'B4', 0.4), (14.0, 'D5', 0.42), (15.0, 'G5', 0.46),
        (16.5, 'E5', 0.44), (17.5, 'C5', 0.4), (18.5, 'B4', 0.38), (19.5, 'C5', 0.4),
        (20.0, 'A5', 0.48), (21.0, 'G5', 0.44), (22.0, 'F5', 0.42), (23.0, 'D5', 0.44),
        (24.0, 'E5', 0.5), (24.5, 'G5', 0.44), (25.0, 'B5', 0.46),
    ]
    for b, note, v in melody:
        place(piano, piano_note(midi(nm(note)), v, 3.2), b * BEAT, pan=0.2, gain=0.62)

    # arpeggio: 8ths from bar 2, 16ths across the feature discs (8.5 s … 13.5 s), stops on the final chord
    feat_from = CUES['sections']['features'][0] / FPS
    feat_to = CUES['sections']['features'][1] / FPS
    step = BEAT / 2
    t = BAR  # starts on bar 2
    k = 0
    final_t = 24 * BEAT
    while t < final_t - 0.01:
        span = next(s for s in spans if s[0] <= t + 1e-6 < s[1])
        tones = [nm(n) for n in span[3]]
        pool = sorted(set(tones + [x + 12 for x in tones[1:4]]))
        pattern = [0, 2, 4, 3, 5, 3, 4, 2]
        note = pool[pattern[k % len(pattern)] % len(pool)] + 12
        dense = feat_from - 0.02 <= t < feat_to
        vel = 0.17 if not dense else 0.14
        place(arp, bell(midi(note), tau=0.32 if dense else 0.42), t, pan=0.35 if k % 2 else -0.35, gain=vel)
        k += 1
        t += step / 2 if dense else step
    # a gentle upward roll into the last chord
    for j, note in enumerate(['C5', 'E5', 'G5', 'B5', 'D6']):
        place(arp, bell(midi(nm(note)), tau=0.9), final_t + 0.07 * j, pan=-0.4 + 0.2 * j, gain=0.16)

    pad = hp(lp(pad, 1900), 110)
    arp = lp(arp, 7000)
    dry = pad + piano + arp + sub
    ir = reverb_ir()
    wet = convolve(pad * 0.35 + piano * 0.42 + arp * 0.6, ir)
    music = dry + 0.33 * wet
    return music[:N]


def load_user_music():
    for p in [os.path.join(ROOT, 'public', 'music.mp3'), os.path.join(ROOT, 'assets', 'music.mp3'), os.path.join(ROOT, '..', 'assets', 'music.mp3')]:
        if os.path.exists(p):
            raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
            x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
            if len(x) < N:
                x = np.vstack([x, np.zeros((N - len(x), 2))])
            print('using user music:', p)
            return x[:N]
    return None


# ─────────────────────────── SFX ───────────────────────────
def sfx_tick():
    n = int(0.18 * SR)
    t = t_arr(n)
    s = 0.8 * np.sin(2 * np.pi * 1760 * t) * np.exp(-t / 0.016) + 0.45 * np.sin(2 * np.pi * 880 * t) * np.exp(-t / 0.03) + 0.15 * np.sin(2 * np.pi * 2637 * t) * np.exp(-t / 0.01)
    return lp(s * np.minimum(1, t / 0.0015), 6000)


def sfx_pop():
    n = int(0.3 * SR)
    t = t_arr(n)
    f = 120 + 110 * np.exp(-t / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.075)
    paper = bp(rng.normal(0, 1, n), 1200, 3200) * np.exp(-t / 0.007) * 0.18
    return (body + paper) * np.minimum(1, t / 0.002)


def ease_out_cubic(x):
    return 1 - (1 - x) ** 3


def sfx_rise(dur, steps):
    """Delicate rising bell run, note times follow the ease-out of the on-screen counter."""
    scale = ['E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7', 'E7', 'G7']
    out = np.zeros(int((dur + 1.5) * SR))
    for i in range(steps):
        p = (i + 1) / steps
        # invert the ease-out: time at which the counter reaches p
        u = 1 - (1 - p) ** (1 / 3)
        b = bell(midi(nm(scale[min(i, len(scale) - 1)])) , tau=0.22, bright=0.15) * (0.55 + 0.45 * p)
        i0 = int(u * dur * SR)
        out[i0 : i0 + len(b)] += b[: len(out) - i0]
    return lp(out, 8000)


def sfx_glass():
    n = int(2.2 * SR)
    t = t_arr(n)
    f0 = midi(nm('E6'))
    s = np.zeros(n)
    for ratio, amp, tau in [(1, 1.0, 1.4), (2.32, 0.5, 0.9), (4.25, 0.28, 0.6), (6.63, 0.16, 0.4)]:
        s += amp * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t / tau)
    for _ in range(14):  # tiny sparkle grains
        st = rng.uniform(0.02, 0.7)
        f = rng.uniform(3500, 6500)
        g = np.sin(2 * np.pi * f * t) * np.exp(-np.clip(t - st, 0, None) / 0.05) * (t >= st) * 0.08
        s += g
    return lp(s * np.minimum(1, t / 0.004), 9000)


def build_sfx():
    fx = np.zeros((N + SR, 2))
    for f in CUES['ticks']:
        place(fx, sfx_tick(), f / FPS, pan=0.0, gain=0.55)
    for f in CUES['pops']:
        place(fx, sfx_pop(), f / FPS, pan=0.0, gain=0.8)
    for r in CUES['rises']:
        dur = (r['to'] - r['from']) / FPS
        place(fx, sfx_rise(dur, r['steps']), r['from'] / FPS, pan=0.1, gain=0.42)
    for f in CUES['glass']:
        place(fx, sfx_glass(), f / FPS, pan=0.0, gain=0.5)
    ir = reverb_ir(2.0, 1.4)
    fx = fx + 0.22 * convolve(fx, ir)
    return fx[:N]


# ─────────────────────────── mix / master ───────────────────────────
def true_peak_db(x):
    up = resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def main():
    meter = pyln.Meter(SR)
    music = load_user_music()
    generated = music is None
    if generated:
        music = build_music()
    music = hp(music, 28)
    music = lp(music, 10000)
    sfx = build_sfx()

    lm = meter.integrated_loudness(music)
    ls = meter.integrated_loudness(sfx)
    target_sfx = lm - CUES['sfxBelowMusicDb']
    sfx *= 10 ** ((target_sfx - ls) / 20)
    mix = music + sfx

    # fades: 15 ms in, last second out (the final chord dissolves)
    t = t_arr(N)
    fade_in = np.clip(t / 0.015, 0, 1)
    fade_out = np.where(t > DUR - 1.0, 0.5 + 0.5 * np.cos(np.pi * np.clip((t - (DUR - 1.0)) / 1.0, 0, 1)), 1.0)
    mix *= (fade_in * fade_out)[:, None]

    lmix = meter.integrated_loudness(mix)
    mix *= 10 ** ((-16.0 - lmix) / 20)
    tp = true_peak_db(mix)
    if tp > -1.0:  # soft limit only if ever needed
        g = 10 ** ((-1.0 - tp) / 20)
        mix *= g
    out = os.path.join(ROOT, 'public', 'audio', 'soundtrack.wav')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    wavfile.write(out, SR, mix.astype(np.float32))

    # stems for inspection
    report = {
        'music_source': 'generated (numpy/scipy)' if generated else 'assets/music.mp3',
        'integrated_lufs': round(meter.integrated_loudness(mix), 2),
        'true_peak_dbtp': round(true_peak_db(mix), 2),
        'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
        'clipped_samples': int(np.sum(np.abs(mix) >= 1.0)),
        'music_lufs_pre': round(lm, 2),
        'sfx_vs_music_db': round(target_sfx - lm, 2),
        'last_100ms_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix[-int(0.1 * SR):])) + 1e-12), 1),
    }
    json.dump(report, open(os.path.join(HERE, 'audio_report.json'), 'w'), indent=2)
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
