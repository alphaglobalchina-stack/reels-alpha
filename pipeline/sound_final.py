"""
FINAL sound design — cue sheet mirrors reels/src/final/plan.ts (exported to content/plan-final.json).

0–3 s: silent cinematic cold open (no narration): darkness rumble, card field ticks, the gold
line's zing, reject swooshes, a held silence, the mechanical RIGHT MATCH lock (sub impact),
the card → container-door morph (servo), CLACK CLACK of the locking bars, door release, and a
fly-through whoosh into Guangzhou as the voice begins.
3 s → end: the voice-over at natural speed (master timeline, untouched), a 120 BPM pulse with
sections, and transitions / impacts on every picture beat. Music + FX side-chained to the voice.

Usage: python3 pipeline/sound_final.py   → assets/film/mix_final.wav
"""
import json
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
P = json.load(open('content/plan-final.json', encoding='utf8'))
END = P['DURATION']
N = int(round(END * SR))
OFF = P['OFFSET']
rng = np.random.default_rng(31)
COLD, V, A, M, CITY, EXT, NET, NEG = P['COLD'], P['V'], P['A'], P['M'], P['CITY'], P['EXT'], P['NET'], P['NEG']
PROD, INSP, GAL, SHIP, HERO, LOGO = P['PROD'], P['INSP'], P['GAL'], P['SHIP'], P['HERO'], P['LOGO']
SNAP, NODE_IN, BRAND = P['SNAP'], P['NODE_IN'], P['BRAND']

def t2i(t): return int(max(0, min(N, round(t * SR))))
def lp(x, f, o=2): return sosfilt(butter(o, f / (SR / 2), 'low', output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f / (SR / 2), 'high', output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a / (SR / 2), b / (SR / 2)], 'band', output='sos'), x)
def st(m, width=0.0):
    d = int(SR * 0.012 * width)
    r = np.concatenate([np.zeros(d), m[:-d]]) if d else m
    return np.stack([m, r], 1)
def pan(m, p0, p1):
    """constant-power pan sweeping from p0 to p1 (-1 left … 1 right)"""
    p = np.linspace(p0, p1, len(m))
    a = (p + 1) * np.pi / 4
    return np.stack([m * np.cos(a), m * np.sin(a)], 1) * 1.41
def ir(sec, seed):
    n = int(sec * SR)
    r = np.random.default_rng(seed).standard_normal(n) * np.exp(-np.linspace(0, 7, n))
    return lp(r, 6500) / np.sqrt(np.sum(r ** 2))
IRL, IRR = ir(2.6, 1), ir(2.6, 2)
def verb(s, wet=0.3):
    l = fftconvolve(s[:, 0], IRL)[: len(s)]
    r = fftconvolve(s[:, 1], IRR)[: len(s)]
    return s * (1 - wet) + np.stack([l, r], 1) * wet * 2.2
def svf(x, fc, q=0.9):
    f = 2 * np.sin(np.pi * np.clip(fc, 20, SR / 6) / SR)
    low = band = 0.0
    out = np.empty_like(x)
    for k in range(len(x)):
        hi = x[k] - low - q * band
        band += f[k] * hi
        low += f[k] * band
        out[k] = band
    return out

# ── instruments ────────────────────────────────────────────────────────────────
def impact(size=1.0, seed=0, sub=True):
    n = int(2.8 * SR); x = np.arange(n) / SR
    f = 34 + 85 * np.exp(-x * 11)
    boom = np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 2.2)) * 0.9
    body = lp(np.random.default_rng(seed).standard_normal(n), 900) * np.exp(-x * 9) * 0.6
    crack = hp(np.random.default_rng(seed + 1).standard_normal(n), 2800) * np.exp(-x * 34) * 0.35
    s = st((boom * (1 if sub else 0.4) + body + crack) * size, 0.5)
    return verb(s, 0.32)
def subdrop(dur=0.9):
    n = int(dur * SR); x = np.arange(n) / SR
    f = 62 * np.exp(-x * 1.1) + 24
    return st(np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-x * 2.6) * 0.8)
def braam(dur=1.8, root=38):
    n = int(dur * SR); x = np.arange(n) / SR
    s = np.zeros(n)
    for k, semi in enumerate([0, 12, 19, 24]):
        fr = 440 * 2 ** ((root + semi - 69) / 12)
        for det in (-0.4, 0.4):
            ph = (x * fr * (1 + det / 100)) % 1
            s += (2 * ph - 1) * (0.5 if k == 0 else 0.25)
    cut = 300 + 2600 * np.exp(-x * 2.4) * np.minimum(1, x * 12)
    out = svf(s, cut, 0.5) * 0.25
    out = np.tanh(out * 1.6) * np.exp(-x * 1.1) * np.minimum(1, x * 30)
    return verb(st(out, 0.8), 0.35)
def metal(seed=0, size=1.0):
    n = int(1.6 * SR); x = np.arange(n) / SR
    parts = [(412, 3.2), (1093, 4.5), (1731, 6), (2489, 7.5), (3307, 9)]
    s = sum(np.sin(2 * np.pi * f * x + i) * np.exp(-x * d) for i, (f, d) in enumerate(parts)) * 0.12
    s += hp(np.random.default_rng(seed).standard_normal(n), 3000) * np.exp(-x * 60) * 0.3
    return verb(st(s * size, 0.6), 0.4)
def whoosh(dur=0.8, lo=200, hi=5000, peak=0.6, seed=0, p0=0.0, p1=0.0, gain=0.5):
    n = int(dur * SR); u = np.arange(n) / n
    r = np.random.default_rng(seed).standard_normal(n)
    fc = np.where(u < peak, lo + (hi - lo) * np.sin(np.pi / 2 * u / peak), hi - (hi - lo) * (u - peak) / (1 - peak))
    e = np.where(u < peak, np.sin(np.pi / 2 * u / peak) ** 2, np.clip(np.cos((u - peak) / (1 - peak) * np.pi / 2), 0, 1) ** 1.5)
    return pan(svf(r, fc) * e * gain, p0, p1)
def reverse_swell(dur=0.7, seed=0):
    n = int(dur * SR); u = np.arange(n) / n
    s = hp(np.random.default_rng(seed).standard_normal(n), 4000) * u ** 3 * 0.35
    s += bp(np.random.default_rng(seed + 5).standard_normal(n), 400, 2400) * u ** 4 * 0.25
    return st(s, 0.9)
def riser(dur=1.0, seed=0, f0=180, f1=1400):
    n = int(dur * SR); u = np.arange(n) / n
    r = np.random.default_rng(seed).standard_normal(n)
    tone = np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * u ** 2) / SR) * 0.14
    return st((svf(r, 300 + 7000 * u ** 2) * 0.45 + tone) * u ** 2.2, 0.8)
def tick(f=2600, g=0.18, dur=0.05):
    n = int(dur * SR); x = np.arange(n) / SR
    return np.sin(2 * np.pi * f * x) * np.exp(-x * 120) * g
def scanner(dur=1.0):
    n = int(dur * SR); x = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(1200 + 700 * np.sin(2 * np.pi * x * 3)) / SR) * 0.04
    s += bp(rng.standard_normal(n), 3500, 9000) * 0.03
    for k in np.arange(0, dur, 0.0625):
        i = int(k * SR); m = min(n, i + int(0.015 * SR))
        s[i:m] += np.sin(2 * np.pi * 5200 * x[: m - i]) * np.exp(-x[: m - i] * 400) * 0.08
    return st(s * np.minimum(1, np.minimum(x * 10, (dur - x) * 10)), 0.6)
def shimmer(dur=2.0, g=0.05):
    n = int(dur * SR); x = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * x + k) * np.exp(-x * (1.4 + k * 0.5)) for k, f in enumerate([1760, 2217, 2637, 3520, 4186]))
    return verb(st(s * g * np.minimum(1, x * 40), 0.9), 0.5)
def air(dur, seed=0):
    n = int(dur * SR); u = np.arange(n) / n
    s = lp(np.random.default_rng(seed).standard_normal(n), 1800) * np.sin(np.pi * u) ** 1.5 * 0.35
    return verb(st(s, 1.0), 0.3)

fx = np.zeros((N, 2))
def add(sig, t, g=1.0):
    if sig.ndim == 1: sig = st(sig)
    i = t2i(t); j = min(N, i + len(sig))
    if j > i: fx[i:j] += sig[: j - i] * g
def add_end(sig, t_end, g=1.0):
    add(sig, t_end - len(sig) / SR, g)

def lockbeep():
    n = int(0.22 * SR); x = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 1760 * x) * (x < 0.07) + np.sin(2 * np.pi * 2637 * x) * (x >= 0.09)) * np.exp(-(x % 0.09) * 30) * 0.18
    return st(s, 0.2)
def reject(f=900):
    n = int(0.12 * SR); x = np.arange(n) / SR
    return st(np.sin(2 * np.pi * np.cumsum(f * np.exp(-x * 9)) / SR) * np.exp(-x * 26) * 0.16, 0.3)
def shatter(seed=0):
    out = np.zeros((int(0.8 * SR), 2))
    r = np.random.default_rng(seed)
    for k in range(30):
        tt = r.random() ** 1.6 * 0.6
        i = int(tt * SR)
        sig = pan(tick(1800 + r.random() * 4200, 0.09 + 0.06 * r.random(), 0.04), r.random() * 2 - 1, r.random() * 2 - 1)
        out[i:i + len(sig)] += sig[: len(out) - i]
    return out


def clack(seed=0, g=1.0):
    """heavy container locking bar: latch transient + low thump + short metal ring"""
    n = int(0.9 * SR); x = np.arange(n) / SR
    r = np.random.default_rng(seed)
    latch = bp(r.standard_normal(n), 900, 5200) * np.exp(-x * 90) * 0.9
    latch[int(0.018 * SR):] += bp(r.standard_normal(n - int(0.018 * SR)), 1500, 6000) * np.exp(-x[: n - int(0.018 * SR)] * 140) * 0.5
    thump = np.sin(2 * np.pi * np.cumsum(55 + 90 * np.exp(-x * 40)) / SR) * np.exp(-x * 14) * 0.9
    ring = sum(np.sin(2 * np.pi * f * x + i) * np.exp(-x * d) for i, (f, d) in enumerate([(612, 9), (1381, 12), (2240, 16)])) * 0.12
    return verb(st((latch + thump + ring) * g, 0.4), 0.28)
def servo(dur=0.32, f0=180, f1=520):
    n = int(dur * SR); u = np.arange(n) / n
    fr = f0 + (f1 - f0) * u
    ph = np.cumsum(fr) / SR
    s = (2 * (ph % 1) - 1) * 0.5 + np.sin(2 * np.pi * ph * 2) * 0.3
    s = bp(s, 300, 3000) * np.sin(np.pi * u) ** 0.7 * 0.22
    return st(s, 0.5)
def creak(dur=0.6, seed=0):
    n = int(dur * SR); u = np.arange(n) / n
    r = np.random.default_rng(seed)
    pulses = np.zeros(n)
    t0 = 0.0
    while t0 < dur:
        i = int(t0 * SR)
        if i < n: pulses[i] = 1 + r.random()
        t0 += 1 / (38 + 50 * (t0 / dur)) * (0.8 + 0.4 * r.random())
    s = fftconvolve(pulses, np.sin(2 * np.pi * 420 * np.arange(400) / SR) * np.exp(-np.arange(400) / 60))[:n]
    s = bp(s, 200, 2400) * np.sin(np.pi * u) ** 0.8 * 0.35
    return verb(st(s, 0.6), 0.35)
def hiss(dur=0.5, seed=0):
    n = int(dur * SR); u = np.arange(n) / n
    s = hp(np.random.default_rng(seed).standard_normal(n), 2500) * (1 - u) ** 2 * np.minimum(1, u * 40) * 0.3
    return st(s, 1.0)
def rumble(dur, seed=0):
    n = int(dur * SR); u = np.arange(n) / n
    s = lp(np.random.default_rng(seed).standard_normal(n), 120, 4) * 3.0
    s += np.sin(2 * np.pi * 31 * np.arange(n) / SR) * 0.25
    return st(s * np.minimum(1, u * 6) * np.minimum(1, (1 - u) * 5), 0.8)
def zing(dur=0.6):
    n = int(dur * SR); x = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(2400 + 1800 * x / dur) / SR) * np.exp(-x * 5) * 0.08
    s += np.sin(2 * np.pi * np.cumsum(3600 + 2700 * x / dur) / SR) * np.exp(-x * 7) * 0.04
    return verb(st(s * np.minimum(1, x * 200), 0.7), 0.45)
def wash(dur=1.2, seed=0):
    n = int(dur * SR); u = np.arange(n) / n
    r = np.random.default_rng(seed).standard_normal(n)
    s = svf(r, 300 + 1500 * np.sin(np.pi * u) ** 2, 1.2) * np.sin(np.pi * u) ** 1.2 * 0.5
    return verb(st(s, 1.0), 0.4)
def horn(dur=1.6):
    n = int(dur * SR); x = np.arange(n) / SR
    s = sum(np.sign(np.sin(2 * np.pi * f * x)) * g for f, g in [(65.4, 0.5), (98, 0.3), (130.8, 0.2)])
    s = lp(s, 700) * np.minimum(1, x * 6) * np.minimum(1, (dur - x) * 3) * 0.18
    return verb(st(s, 0.8), 0.5)
def chime(freqs, g=0.06, dur=1.6):
    n = int(dur * SR); x = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * x) * np.exp(-x * (2.2 + k)) for k, f in enumerate(freqs)) * g
    return verb(st(s * np.minimum(1, x * 300), 0.6), 0.45)

# ═══ COLD OPEN (0–3 s, no narration) ═══════════════════════════════════════════
add(rumble(1.55, 1), 0.0, 0.9)
add(air(1.5, 2), 0.0, 0.5)
add(impact(0.35, 3, sub=False), COLD['reveal'], 0.5); add(shimmer(1.0, 0.03), COLD['reveal'])
for k in range(34):                                                   # cards / data blink on at many depths
    tt = COLD['reveal'] + (rng.random() ** 1.2) * 0.62
    add(pan(tick(2200 + rng.random() * 3200, 0.04 + 0.05 * rng.random(), 0.04), rng.random() * 2 - 1, rng.random() * 2 - 1), tt)
add(zing(0.6), COLD['line'], 1.0)                                     # the ALPHA gold line enters
add(whoosh(0.62, 400, 7000, 0.5, 4, -0.7, 0.7, 0.55), COLD['line'] - 0.05)
for k, tt in enumerate([0.95, 1.1, 1.25]):                            # VERIFY / COMPARE / CHECK
    add(st(tick(2400 + 300 * k, 0.14)), tt); add(reject(1000 - 150 * k), tt + 0.06, 0.9)
    add(whoosh(0.3, 300, 3000, 0.3, 5 + k, (-1) ** k * 0.6, (-1) ** k * 0.9, 0.25), tt + 0.04)
# 1.42 → 1.58: near silence (music + fx bed held out), then the lock
add(lockbeep(), COLD['lock'] - 0.01, 0.9)
add(impact(1.0, 8), COLD['lock'], 1.0); add(subdrop(0.9), COLD['lock'], 0.85); add(clack(9, 0.7), COLD['lock'], 0.8)
add(shimmer(1.0, 0.05), COLD['lock'] + 0.02)
add(servo(COLD['clack1'] - COLD['morph'], 160, 620), COLD['morph'], 0.9)   # card morphs into container doors
add(metal(10, 0.45), COLD['morph'] + 0.05, 0.6)
add(clack(11, 1.0), COLD['clack1'], 1.0)                              # CLACK
add(clack(12, 1.1), COLD['clack2'], 1.0)                              # CLACK
add(creak(0.55, 13), COLD['open'], 0.9); add(hiss(0.5, 14), COLD['open'], 0.8)
add(air(0.8, 15), COLD['open'], 0.7)
add(riser(COLD['end'] - COLD['open'], 16, 160, 1700), COLD['open'], 0.7)
add(whoosh(0.75, 150, 8000, 0.62, 17, 0, 0, 0.85), COLD['end'] - 0.47)  # fly through the doors
add(impact(0.75, 18), COLD['end'], 0.75); add(braam(2.0, 38), COLD['end'], 0.42); add(air(1.6, 19), COLD['end'], 0.55)

# ═══ VO: China → Guangzhou → Canton Fair → sourcing (v3 journey, original speed) ══════════
for k in range(34):
    add(st(tick(2600 + rng.random() * 2600, 0.05 + 0.05 * rng.random()), 0.3), V['opp'] - 0.08 + (rng.random() ** 1.3) * 0.8)
add(whoosh(0.62, 300, 7000, 0.55, 20, -0.8, 0.8, 0.6), V['but'] - 0.12)
add(impact(0.35, 21, sub=False), V['but'] + 0.25, 0.5)
add(scanner(V['right'] - V['reach'] - 0.15), V['reach'])
for k, w in enumerate(A['waves']):
    add(reject(1100 - 200 * k), w, 1.0)
add(impact(0.4, 22, sub=False), V['sup'], 0.5)
add_end(reverse_swell(0.5, 23), V['right'], 0.85)
add(lockbeep(), V['right'] - 0.01, 0.9)
add(impact(1.05, 24), V['right'], 0.95); add(subdrop(1.0), V['right'], 0.75); add(metal(25, 0.7), V['right'], 0.45)
add(riser(A['dive'][1] - A['dive'][0] + 0.1, 26, 150, 1900), A['dive'][0] - 0.05, 0.9)
add(whoosh(0.85, 200, 7500, 0.72, 27, 0, 0, 0.75), NODE_IN - 0.62)
add(impact(0.9, 28), NODE_IN, 0.85); add(shimmer(1.6, 0.05), NODE_IN + 0.02)
add(whoosh(0.9, 250, 5000, 0.4, 29, -1, 1, 0.5), M['start'] + 0.05)
add(st(tick(1900, 0.16)), V['gz']); add(st(tick(2850, 0.12)), V['gz'] + 0.1)
add(air(M['dive'][1] - M['dive'][0] + 0.5, 30), M['dive'][0], 0.9)
add(riser(M['dive'][1] - M['dive'][0], 31, 120, 1000), M['dive'][0], 0.5)
add(whoosh(1.0, 120, 3000, 0.55, 32, 0.4, -0.4, 0.55), CITY['start'] - 0.15)
add(whoosh(0.6, 70, 1600, 0.5, 33, 1, -1, 1.0), CITY['pass'][0])
add(impact(0.4, 34), CITY['pass'][0] + 0.18, 0.5)
add(whoosh(0.5, 400, 6000, 0.5, 35, 0.7, -0.6, 0.35), EXT['start'] + 0.4)
add(impact(0.6, 36), V['souq'], 0.7); add(metal(37, 0.6), V['souq'] + 0.02, 0.4)
add_end(reverse_swell(0.4, 38), EXT['push'][0] + 0.3, 0.75)
add(whoosh(0.45, 200, 8000, 0.75, 39, 0, 0, 0.75), EXT['push'][0])
add(impact(0.45, 40, sub=False), P['HALL']['start'] + 0.12, 0.55)
add(shatter(41), NET['burst'], 0.9); add(whoosh(0.6, 500, 7000, 0.4, 42, -0.5, 0.5, 0.45), NET['burst'])
for k, b in enumerate([NET['search'], NET['verify'], NET['compare']]):
    add(impact(0.3, 43 + k, sub=False), b, 0.45); add(st(tick(2300 + 350 * k, 0.2)), b)
add_end(reverse_swell(0.32, 46), NET['select'], 0.75)
add(impact(1.05, 47), NET['select'], 0.95); add(subdrop(0.9), NET['select'], 0.75); add(metal(48, 0.8), NET['select'], 0.5)
add(shimmer(1.4, 0.05), NET['select'] + 0.03)
add(whoosh(0.5, 200, 9000, 0.85, 49, 0, 0, 0.7), NET['through'][0])

# ═══ negotiation ═══════════════════════════════════════════════════════════════
add(impact(0.4, 50, sub=False), P['NEG_START'] + 0.3, 0.45); add(air(1.2, 51), P['NEG_START'], 0.5)
for k, key in enumerate(['price', 'spec', 'terms']):                  # PRICE / SPECIFICATIONS / TERMS cards
    add(whoosh(0.4, 400, 5000, 0.7, 52 + k, (-1) ** k * 0.8, 0, 0.4), NEG[key] - 0.3)
    add(st(tick(1760 + 440 * k, 0.16)), NEG[key]); add(chime([880 * 2 ** (k * 4 / 12)], 0.05, 0.9), NEG[key] + 0.01)
add_end(reverse_swell(0.45, 55), SNAP, 0.8)
add(clack(56, 0.8), SNAP, 0.9); add(impact(0.85, 57), SNAP, 0.85); add(lockbeep(), SNAP + 0.04, 0.8)  # snap → RIGHT MATCH
add(shimmer(1.2, 0.045), SNAP + 0.05)
add(whoosh(0.5, 200, 8500, 0.8, 58, 0, 0, 0.7), P['NEG_THROUGH'][0])

# ═══ sample → production ═══════════════════════════════════════════════════════
add(impact(0.35, 59, sub=False), PROD['follow'], 0.4)
add(st(tick(2100, 0.14)), PROD['sample']); add(chime([1318.5, 1975.5], 0.05, 1.2), PROD['sample'] + 0.02)
add(riser(PROD['prod'] - PROD['sample'] - 0.5, 60, 200, 2200), PROD['sample'] + 0.5, 0.85)
add(whoosh(0.5, 150, 8000, 0.85, 61, 0, 0, 0.8), PROD['prod'] - 0.42)
add(impact(0.9, 62), PROD['prod'], 0.85); add(metal(63, 0.9), PROD['prod'] + 0.01, 0.55)
for k in range(8):                                                    # factory machine rhythm
    add(metal(64 + k, 0.22), PROD['prod'] + 0.25 + k * 0.125, 0.35 if k % 2 else 0.5)
add(servo(0.5, 220, 700), PROD['coord'] - 0.1, 0.6)
add(whoosh(0.6, 200, 6000, 0.55, 72, 0.6, -0.6, 0.55), PROD['end'] - 0.3)

# ═══ inspection ════════════════════════════════════════════════════════════════
add(impact(0.65, 73), INSP['insp'], 0.7)
add(scanner(INSP['ensure'] + 0.5 - INSP['insp'] - 0.1), INSP['insp'] + 0.1, 1.0)   # gold scanning beam
for k, tt in enumerate([INSP['preship'], INSP['preship'] + 0.4, INSP['ensure']]):  # DIMENSIONS / MATERIAL / PACKING
    add(st(tick(2600 + 260 * k, 0.15)), tt)
add_end(reverse_swell(0.4, 74), INSP['match'], 0.7)
add(impact(0.75, 75), INSP['match'], 0.8); add(chime([1046.5, 1568, 2093], 0.06, 2.0), INSP['match'] + 0.02)  # VERIFIED
add(whoosh(0.55, 150, 8500, 0.8, 76, 0, 0, 0.75), INSP['push'][0])

# ═══ machinery gallery ═════════════════════════════════════════════════════════
add(air(GAL['full'] - GAL['start'], 77), GAL['start'], 0.55)
for k in range(12):                                                    # planes passing the lens
    tt = GAL['whether'] + 0.25 + k * (GAL['full'] - GAL['whether']) / 12
    add(whoosh(0.42, 120, 3500, 0.5, 78 + k, (-1) ** k * 0.2, (-1) ** k * 1.0, 0.32), tt)
for k, key in enumerate(['products', 'equip', 'mach']):
    add(impact(0.5, 90 + k, sub=False), GAL[key], 0.55); add(metal(93 + k, 0.4), GAL[key] + 0.01, 0.3)
add_end(reverse_swell(0.4, 96), GAL['lines'], 0.7)
add(impact(0.85, 97), GAL['lines'], 0.8); add(subdrop(0.8), GAL['lines'], 0.55)
add(whoosh(0.7, 100, 7000, 0.65, 98, 0, 0, 0.8), GAL['full'] - 0.45)   # through "خطوط إنتاج"
add(shimmer(1.4, 0.04), GAL['help'])
add(impact(0.5, 99, sub=False), GAL['sourcing'], 0.5)
steps = [GAL['steps'] + (GAL['studied'] + 0.15 - GAL['steps']) * k / 4 for k in range(5)]
for k, tt in enumerate(steps):                                        # five step nodes
    add(st(tick(1568 * 2 ** ([0, 2, 4, 7, 9][k] / 12), 0.18, 0.08)), tt)
    add(chime([784 * 2 ** ([0, 2, 4, 7, 9][k] / 12)], 0.05, 0.9), tt + 0.01)
add(riser(GAL['end'] + 0.1 - steps[4], 100, 200, 2000), steps[4], 0.7)
add(whoosh(0.6, 150, 8000, 0.75, 101, 0, 0, 0.8), GAL['end'] - 0.35)

# ═══ shipping ══════════════════════════════════════════════════════════════════
add(impact(0.6, 102), SHIP['then'], 0.6); add(air(2.5, 103), SHIP['start'], 0.6)
add(impact(0.9, 104), SHIP['ship'], 0.8); add(braam(1.6, 36), SHIP['ship'], 0.35)
add(whoosh(0.55, 200, 6000, 0.55, 105, -0.3, 0.3, 0.6), SHIP['portIn'] - 0.3)
add(metal(106, 0.7), SHIP['portIn'] + 0.15, 0.5); add(horn(1.5), SHIP['portIn'] + 0.05, 0.9)
add(servo(0.6, 120, 300), SHIP['port'] - 0.1, 0.7)                    # crane cable lifting the container
add(clack(107, 0.6), SHIP['port'] + 0.45, 0.55)
add(wash(1.2, 108), SHIP['wake'] - 0.15, 1.0)                         # ship wake
add(whoosh(0.5, 100, 2500, 0.5, 109, 0, 0, 0.5), SHIP['wake'] - 0.1)

# ═══ hero line ═════════════════════════════════════════════════════════════════
# vacuum: SHIP.end → "لا" is near silence
add(subdrop(0.8), HERO['dont'], 0.4)
add(st(tick(1400, 0.1)), HERO['sup'])
add(whoosh(0.7, 80, 2000, 0.6, 110, 0.5, -0.5, 0.45), HERO['own'] - 0.55)   # the camera passes "مُوَرِّد"
add(impact(0.5, 111, sub=False), HERO['own'], 0.45)
add_end(reverse_swell(0.55, 112), HERO['partner'], 0.85)
add(impact(1.15, 113), HERO['partner'], 1.0); add(subdrop(1.1), HERO['partner'], 0.85)
add(braam(2.4, 38), HERO['partner'], 0.45); add(shimmer(2.0, 0.05), HERO['partner'] + 0.04)
add(impact(0.5, 114, sub=False), HERO['inside'], 0.5)
add(impact(0.6, 115), HERO['china'], 0.6); add(chime([1174.7, 1760], 0.05, 1.4), HERO['china'] + 0.02)
add(riser(HERO['converge'][1] - HERO['converge'][0] + 0.25, 116, 300, 3000), HERO['converge'][0] - 0.25, 0.9)
add_end(reverse_swell(0.6, 117), BRAND, 0.95)

# ═══ ALPHA ═════════════════════════════════════════════════════════════════════
add(impact(1.3, 118), BRAND, 1.0); add(subdrop(1.3), BRAND, 0.9); add(braam(3.2, 38), BRAND, 0.55)
add(metal(119, 0.8), BRAND, 0.45); add(shimmer(3.0, 0.06), BRAND + 0.03)
add(chime([1174.7, 1480, 1760, 2349], 0.04, 2.5), LOGO['tag'])
add(air(END - BRAND, 120), BRAND, 0.45)

# ── music: 120 BPM pulse from the first word, held out in the cold open ────────────
beat = 0.5
bass = np.zeros(N); drums = np.zeros(N); hats = np.zeros(N)
def tom(f0=90, g=0.6):
    n = int(0.5 * SR); x = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.6 * np.exp(-x * 30))) / SR) * np.exp(-x * 9) * g
def hat(g=0.05):
    n = int(0.05 * SR); x = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-x * 90) * g
def put(buf, sig, t):
    i = t2i(t); j = min(N, i + len(sig))
    if j > i: buf[i:j] += sig[: j - i]
notes = [38, 38, 41, 38, 36, 38, 43, 41]  # D minor ostinato
t_mus0 = COLD['end']
k16 = 0
while t_mus0 + k16 * beat / 4 < HERO['converge'][0]:
    t0 = t_mus0 + k16 * beat / 4
    n_ = notes[(k16 // 4) % len(notes)]
    fr = 440 * 2 ** ((n_ - 12 - 69) / 12)
    m = int(beat / 4 * 0.9 * SR); x = np.arange(m) / SR
    acc = 1.0 if k16 % 4 == 0 else 0.6
    put(bass, (np.sign(np.sin(2 * np.pi * fr * x)) * 0.3 + np.sin(2 * np.pi * fr * x)) * np.exp(-x * 14) * 0.22 * acc, t0)
    if k16 % 8 == 0: put(drums, tom(70, 0.7), t0)
    if k16 % 8 == 6 and t0 > V['work']: put(drums, tom(110, 0.35), t0)
    if t0 > NET['burst'] and k16 % 2 == 1: put(hats, hat(0.05 if k16 % 4 == 3 else 0.03), t0)
    if PROD['prod'] < t0 < GAL['full'] and k16 % 16 == 12: put(drums, tom(150, 0.3), t0)
    k16 += 1
music = st(lp(bass, 900), 0.2) + verb(st(lp(drums, 2500), 0.4), 0.2) + st(hats, 0.7)
x = np.arange(N) / SR
drone = (np.sin(2 * np.pi * 36.7 * x) + 0.5 * np.sin(2 * np.pi * 55 * x + 1)) * 0.06
pad = sum(np.sin(2 * np.pi * 440 * 2 ** ((nn - 69) / 12) * x + i) for i, nn in enumerate([50, 57, 62, 65])) * 0.018
music += st(drone, 0.3) + verb(st(pad * (x > HERO['dont']), 0.9), 0.4)
g = np.ones(N)
def seg(a, b, v0, v1):
    i, j = t2i(a), t2i(b)
    if j > i: g[i:j] = np.linspace(v0, v1, j - i)
seg(0, COLD['silence'], 0.35, 0.5); seg(COLD['silence'], COLD['lock'], 0.0, 0.0)
seg(COLD['lock'], COLD['end'], 0.4, 0.6); seg(COLD['end'], V['but'], 0.7, 0.85)
seg(V['but'] - 0.2, V['but'] - 0.02, 0.85, 0.3); seg(V['but'] - 0.02, V['but'] + 0.1, 0.3, 1.0)
seg(V['right'] - 0.22, V['right'] - 0.02, 1.0, 0.06); seg(V['right'] - 0.02, V['right'] + 0.25, 0.06, 1.0)
seg(A['dive'][0] - 0.24, A['dive'][0], 1.0, 0.45); seg(A['dive'][0], NODE_IN, 0.45, 1.0)
seg(M['hold'][0], M['hold'][1], 1.0, 0.35); seg(M['hold'][1], M['hold'][1] + 0.15, 0.35, 1.0)
seg(EXT['hold'][0], EXT['hold'][1], 1.0, 0.25); seg(EXT['hold'][1], EXT['hold'][1] + 0.12, 0.25, 1.0)
seg(NET['select'] - 0.2, NET['select'] - 0.02, 1.0, 0.06); seg(NET['select'] - 0.02, NET['select'] + 0.1, 0.06, 1.0)
seg(SNAP - 0.2, SNAP - 0.02, 1.0, 0.15); seg(SNAP - 0.02, SNAP + 0.1, 0.15, 1.0)
seg(INSP['match'] - 0.2, INSP['match'] - 0.02, 1.0, 0.2); seg(INSP['match'] - 0.02, INSP['match'] + 0.1, 0.2, 1.0)
seg(GAL['lines'] - 0.2, GAL['lines'] - 0.02, 1.0, 0.2); seg(GAL['lines'] - 0.02, GAL['lines'] + 0.1, 0.2, 1.05)
seg(SHIP['end'] - 0.2, SHIP['end'], 1.0, 0.0); seg(SHIP['end'], HERO['dont'], 0.0, 0.0)   # vacuum
seg(HERO['dont'], HERO['partner'] - 0.2, 0.25, 0.5); seg(HERO['partner'] - 0.2, HERO['partner'] - 0.02, 0.5, 0.05)
seg(HERO['partner'] - 0.02, HERO['converge'][0], 0.8, 0.8); seg(HERO['converge'][0], BRAND, 0.8, 0.1)
seg(BRAND, END - 1.2, 0.55, 0.55); seg(END - 1.2, END, 0.55, 0.0)
music *= g[:, None]
# fx are also held out in the vacuum and in the cold-open silence
fg = np.ones(N)
for a, b in [(COLD['silence'] + 0.04, COLD['lock'] - 0.03), (SHIP['end'] + 0.05, HERO['dont'] - 0.02)]:
    i, j = t2i(a), t2i(b); fg[i:j] = 0.08
fg = lp(fg, 40, 1)
fx *= fg[:, None]

# ── voice (master timeline, untouched, starts at 3.0 s) + side-chain + master ─────────
v, sr = sf.read('pipeline/work/vo48k.wav', dtype='float64')
assert sr == SR
voice = np.zeros(N); i0 = t2i(OFF); voice[i0: i0 + len(v)] = v[: N - i0]
voice = hp(voice, 70)
env = np.sqrt(np.clip(lp(voice ** 2, 10, 1), 0, None)); env /= env.max() + 1e-9
sm = np.zeros(N); acc = 0.0
ac, rc = np.exp(-48 / (0.02 * SR)), np.exp(-48 / (0.3 * SR))
for k in range(0, N, 48):
    e = env[k]
    acc = ac * acc + (1 - ac) * e if e > acc else rc * acc + (1 - rc) * e
    sm[k:k + 48] = acc
duck = np.clip(sm * 2.4, 0, 1)
def rms_norm(s, db):
    a = s[np.abs(s) > 1e-4]
    return s * (10 ** (db / 20) / np.sqrt(np.mean(a ** 2))) if len(a) else s
voice = rms_norm(voice, -16.0)
music = rms_norm(music, -21.5) * (1 - 0.6 * duck)[:, None]
fx = rms_norm(fx, -22.5) * (1 - 0.35 * duck)[:, None]
mix = st(voice) + music + fx
fade = np.ones(N); fl = int(0.6 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 1.5
mix *= fade[:, None]
pk = np.max(np.abs(mix))
mix = np.tanh(mix / pk * 1.4) / np.tanh(1.4) * 10 ** (-1 / 20)
sf.write('assets/film/mix_final.wav', mix.astype(np.float32), SR, subtype='PCM_24')
print(f'mix_final.wav {END:.3f}s  N={N}')
