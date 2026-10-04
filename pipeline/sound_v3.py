"""
V3 sound design — cue sheet follows the one-camera-journey plan (reels/src/v3/plan.ts).

Driving 120 BPM pulse (16th-note bass ostinato + low toms), deep impacts with sub drops,
braams, reverse swells into hits, metallic transitions, pass-bys panned across the stereo
field, a scanner, UI ticks on the node births and beats. Contrast: the music ducks out
just before the biggest hits. Every cue is a spoken-word anchor from content/vo-timing-v2.json
(same anchors the picture uses). Music + FX are side-chained to the voice.

Usage: python3 pipeline/sound_v2.py [end_seconds]   → assets/film/mix_v3.wav
"""
import json, re, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
vo = json.load(open('content/vo-timing-v2.json', encoding='utf8'))
END = float(sys.argv[1]) if len(sys.argv) > 1 else vo['duration'] + 1.95
N = int(END * SR)
rng = np.random.default_rng(23)
DIAC = re.compile('[ً-ْٰـ.,،…]')
norm = lambda s: DIAC.sub('', s).lower()
def at(text, nth=1, after=0.0):
    return [w for w in vo['words'] if w['start'] >= after and norm(w['text']) == norm(text)][nth - 1]['start']

# ── cue sheet (mirrors reels/src/v3/plan.ts) ──────────────────────────────────
T = dict(china=at('الصين'), opp=at('بالفرص'), but=at('لكن'), reach=at('الوصول'), sup=at('المورد'), right=at('الصحيح'),
         is_=at('هو'), frm=at('من', 1, 4.3), gz=at('قوانزو'), heart=at('قلب'), work=at('نعمل'), inside=at('داخل'), souq=at('السوق'),
         self_=at('نفسه'), search=at('نبحث'), sups=at('الموردين'), fact=at('والمصانع'), fit=at('المناسبة'))
WAVES = [T['reach'] + 0.2, T['sup'] - 0.08, T['sup'] + 0.16]
DIVE_A = (T['is_'] + 0.22, T['frm'] - 0.1)
NODE_IN = DIVE_A[1]
M_START = NODE_IN - 0.04
M_HOLD = (T['heart'] - 0.18, T['heart'])
M_DIVE = (T['heart'], T['work'] - 0.3)
CITY_START = M_DIVE[1] - 0.22
PASS = (T['work'] - 0.05, T['work'] + 0.32)
EXT_START = PASS[0] + 0.05
EXT_HOLD = (T['self_'] - 0.14, T['self_'])
PUSH = (T['self_'], T['self_'] + 0.34)
HALL_START = PUSH[0] + 0.14
BURST = T['search'] + 0.04
NET = [T['sups'] - 0.02, (T['sups'] + T['fact']) / 2, T['fact'] - 0.02]
SELECT = T['fit'] - 0.02
THROUGH = (T['fit'] + 0.24, END)

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

# opening — begins instantly, low and wide
add(impact(1.0, 1), 0.0, 0.85); add(subdrop(1.0), 0.0, 0.65); add(braam(2.0, 38), 0.02, 0.5); add(air(1.6, 2), 0.0, 0.6)
for k in range(40):
    add(st(tick(2600 + rng.random() * 2600, 0.05 + 0.05 * rng.random()), 0.3), T['opp'] - 0.08 + (rng.random() ** 1.3) * 0.8)
add(whoosh(0.62, 300, 7000, 0.55, 3, -0.8, 0.8, 0.65), T['but'] - 0.12)          # through الصين
add(impact(0.35, 4, sub=False), T['but'] + 0.25, 0.5)
add(scanner(T['right'] - T['reach'] - 0.15), T['reach'])
for k, w in enumerate(WAVES):
    add(reject(1100 - 200 * k), w, 1.0)
add(impact(0.4, 5, sub=False), T['sup'], 0.55)
add_end(reverse_swell(0.5, 6), T['right'], 0.85)
add(lockbeep(), T['right'] - 0.01, 1.0)
add(impact(1.15, 7), T['right'], 1.0); add(subdrop(1.0), T['right'], 0.85); add(metal(8, 0.8), T['right'], 0.5)
add(riser(DIVE_A[1] - DIVE_A[0] + 0.1, 9, 150, 1900), DIVE_A[0] - 0.05, 0.95)
add(whoosh(0.85, 200, 7500, 0.72, 10, 0, 0, 0.75), NODE_IN - 0.62)
add(impact(0.95, 11), NODE_IN, 0.9); add(shimmer(1.6, 0.05), NODE_IN + 0.02)
add(whoosh(0.9, 250, 5000, 0.4, 12, -1, 1, 0.5), M_START + 0.05)                 # orbit
add(st(tick(1900, 0.16)), T['gz']); add(st(tick(2850, 0.12)), T['gz'] + 0.1)
add(air(M_DIVE[1] - M_DIVE[0] + 0.5, 13), M_DIVE[0], 0.95)
add(riser(M_DIVE[1] - M_DIVE[0], 14, 120, 1000), M_DIVE[0], 0.5)
add(whoosh(1.0, 120, 3000, 0.55, 15, 0.4, -0.4, 0.55), CITY_START - 0.15)          # haze
add(whoosh(0.6, 70, 1600, 0.5, 16, 1, -1, 1.0), PASS[0])                            # the tower passes the lens
add(impact(0.4, 17), PASS[0] + 0.18, 0.55)
add(whoosh(0.5, 400, 6000, 0.5, 18, 0.7, -0.6, 0.35), EXT_START + 0.4)
add(impact(0.6, 19), T['souq'], 0.75); add(metal(20, 0.6), T['souq'] + 0.02, 0.45)
add_end(reverse_swell(0.4, 21), PUSH[0] + 0.3, 0.75)
add(whoosh(0.45, 200, 8000, 0.75, 22, 0, 0, 0.75), PUSH[0])
add(impact(0.45, 23, sub=False), HALL_START + 0.12, 0.6)
add(shatter(24), BURST, 1.0); add(whoosh(0.6, 500, 7000, 0.4, 25, -0.5, 0.5, 0.45), BURST)
for k, b in enumerate(NET):
    add(impact(0.32, 30 + k, sub=False), b, 0.5); add(st(tick(2300 + 350 * k, 0.22)), b)
add_end(reverse_swell(0.32, 40), SELECT, 0.75)
add(impact(1.15, 41), SELECT, 1.0); add(subdrop(0.9), SELECT, 0.85); add(metal(42, 0.85), SELECT, 0.55); add(shimmer(1.4, 0.06), SELECT + 0.03)
add(whoosh(0.4, 200, 9000, 0.85, 43, 0, 0, 0.7), THROUGH[0])
add(air(THROUGH[1] - THROUGH[0] + 0.2, 44), THROUGH[0], 0.6)

# ── music: 120 BPM pulse ────────────────────────────────────────────────────────
beat = 0.5
music = np.zeros((N, 2))
bass = np.zeros(N); drums = np.zeros(N)
def tom(f0=90, g=0.6):
    n = int(0.5 * SR); x = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.6 * np.exp(-x * 30))) / SR) * np.exp(-x * 9) * g
notes = [38, 38, 41, 38, 36, 38, 43, 41]  # D minor ostinato (MIDI)
k16 = 0
while k16 * beat / 4 < END:
    t0 = k16 * beat / 4
    n_ = notes[(k16 // 4) % len(notes)]
    fr = 440 * 2 ** ((n_ - 12 - 69) / 12)
    m = int(beat / 4 * 0.9 * SR); x = np.arange(m) / SR
    acc = 1.0 if k16 % 4 == 0 else 0.6
    note = (np.sign(np.sin(2 * np.pi * fr * x)) * 0.3 + np.sin(2 * np.pi * fr * x)) * np.exp(-x * 14) * 0.22 * acc
    i = t2i(t0); j = min(N, i + m)
    bass[i:j] += note[: j - i]
    if k16 % 8 == 0:
        i2 = t2i(t0); d = tom(70, 0.7); j2 = min(N, i2 + len(d)); drums[i2:j2] += d[: j2 - i2]
    if k16 % 8 == 6 and t0 > T['work']:
        i2 = t2i(t0); d = tom(110, 0.35); j2 = min(N, i2 + len(d)); drums[i2:j2] += d[: j2 - i2]
    k16 += 1
music = st(lp(bass, 900), 0.2) + verb(st(lp(drums, 2500), 0.4), 0.2)
# low drone bed
x = np.arange(N) / SR
drone = (np.sin(2 * np.pi * 36.7 * x) + 0.5 * np.sin(2 * np.pi * 55 * x + 1)) * 0.06
music += st(drone, 0.3)
g = np.ones(N)
def seg(a, b, v0, v1):
    i, j = t2i(a), t2i(b)
    if j > i: g[i:j] = np.linspace(v0, v1, j - i)
seg(0, T['but'], 0.6, 0.85)
seg(T['but'] - 0.2, T['but'] - 0.02, 0.85, 0.3); seg(T['but'] - 0.02, T['but'] + 0.1, 0.3, 1.0)
seg(T['right'] - 0.22, T['right'] - 0.02, 1.0, 0.06); seg(T['right'] - 0.02, T['right'] + 0.25, 0.06, 1.0)
seg(T['is_'], DIVE_A[0], 1.0, 0.45); seg(DIVE_A[0], NODE_IN, 0.45, 1.0)
seg(M_HOLD[0], M_HOLD[1], 1.0, 0.35); seg(M_HOLD[1], M_HOLD[1] + 0.15, 0.35, 1.0)
seg(EXT_HOLD[0], EXT_HOLD[1], 1.0, 0.25); seg(EXT_HOLD[1], EXT_HOLD[1] + 0.12, 0.25, 1.0)
seg(SELECT - 0.2, SELECT - 0.02, 1.0, 0.06); seg(SELECT - 0.02, SELECT + 0.1, 0.06, 1.1)
seg(END - 0.3, END, 1.0, 0.0)
music *= g[:, None]

# ── voice + side-chain + master ─────────────────────────────────────────────────
v, sr = sf.read('pipeline/work/vo48k_v2.wav', dtype='float64')
voice = np.zeros(N); voice[: min(N, len(v))] = v[:N]
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
music = rms_norm(music, -21.0) * (1 - 0.6 * duck)[:, None]
fx = rms_norm(fx, -23.0) * (1 - 0.3 * duck)[:, None]
mix = st(voice) + music + fx
fade = np.ones(N); fl = int(0.25 * SR); fade[-fl:] = np.linspace(1, 0, fl)
mix *= fade[:, None]
pk = np.max(np.abs(mix))
mix = np.tanh(mix / pk * 1.4) / np.tanh(1.4) * 10 ** (-1 / 20)
sf.write('assets/film/mix_v3.wav', mix.astype(np.float32), SR, subtype='PCM_24')
print(f'mix_v3.wav {END:.2f}s', {k: round(v, 2) for k, v in T.items()})
