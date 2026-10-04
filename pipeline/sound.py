"""
ALPHA opening film — sound design + mix, fully synthesized and cue-locked to the
voice-over alignment (content/vo-timing.json). Output: assets/film/mix.wav (48 kHz stereo).

Layers: cinematic pad (Dm9 · Bbmaj7 · Gm9 · Asus), sub pulse, soft drums that build,
whooshes on every portal / transition, impacts on hero words, a scan bed during the
inspection, a vacuum before the hero line and a final hit on the ALPHA reveal.
The music is side-chained to the voice so the Arabic VO always leads.
"""
import json, re
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
vo_t = json.load(open('content/vo-timing.json', encoding='utf8'))
HOLD = 3.6
DUR = round((vo_t['duration'] + HOLD) * 60) / 60
N = int(DUR * SR)
rng = np.random.default_rng(11)

DIAC = re.compile('[ً-ْٰـ.,،…]')
def norm(s): return DIAC.sub('', s).lower()
def at(text, nth=1, after=0.0):
    hits = [w for w in vo_t['words'] if w['start'] >= after and norm(w['text']) == norm(text)]
    return hits[nth - 1]['start']

# ── cue sheet (same word anchors as the picture) ─────────────────────────────
T = dict(
    china=at('الصين'), but=at('لكن'), supplier=at('المورد'), right=at('الصحيح'),
    portal1=at('من', 1, 5.5), gz=at('قوانزو'), work=at('نعمل'), market=at('السوق'),
    search=at('نبحث'), verify=at('الموردين'), compare=at('والمصانع'), select=at('المناسبة'),
    cmp=at('نقارن'), neg=at('ونتفاوض'), price=at('الأسعار'), spec=at('والمواصفات'), need=at('بما'), merge=at('احتياجك') + 0.05,
    follow=at('نتابع'), sample=at('العينة'), prod=at('الإنتاج'), insp=at('فحص'), preship=at('قبل'), ensure=at('للتأكد'), match=at('مطابقتها'),
    whether=at('سواء'), products=at('منتجات'), equip=at('معدات'), mach=at('مكائن'), lines=at('خطوط'), help=at('نحن'), steps=at('بخطوات'), studied=at('ومدروسة'),
    then=at('ثم'), ship=at('الشحن', 1, 35), port=at('ميناء'),
    dont=at('لا', 1, 38), sup=at('مورد', 1, 39), own=at('امتلك'), partner=at('شريكا'), name=vo_t['marks']['brand'], tag=at('شريكك'),
)
VACUUM = (38.31, T['own'])          # music drops out before the hero line
END_VO = vo_t['duration']

def t2i(t): return int(max(0, min(N, round(t * SR))))
def lp(x, f, order=2): return sosfilt(butter(order, f / (SR / 2), 'low', output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f / (SR / 2), 'high', output='sos'), x)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos'), x)
def env_adsr(n, a, r, curve=2.0):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na) ** curve
    if nr: e[-nr:] *= np.linspace(1, 0, nr) ** curve
    return e
def place(buf, sig, t, gain=1.0):
    i = t2i(t)
    j = min(N, i + sig.shape[0])
    if j > i: buf[i:j] += sig[: j - i] * gain
def stereo(m, width=0.0, seed=0):
    if width <= 0: return np.stack([m, m], 1)
    d = int(SR * 0.011 * width)
    r = np.concatenate([np.zeros(d), m[:-d]]) if d else m
    return np.stack([m, r], 1)
def midi(n): return 440.0 * 2 ** ((n - 69) / 12)

# ── reverb IR ────────────────────────────────────────────────────────────────
def ir(sec=2.6, seed=0):
    n = int(sec * SR)
    r = np.random.default_rng(seed).standard_normal(n) * np.exp(-np.linspace(0, 7.5, n))
    return lp(r, 7000) / np.sqrt(np.sum(r ** 2))
IR_L, IR_R = ir(2.8, 1), ir(2.8, 2)
def verb(st, wet=0.35):
    l = fftconvolve(st[:, 0], IR_L)[: st.shape[0]]
    r = fftconvolve(st[:, 1], IR_R)[: st.shape[0]]
    return st * (1 - wet) + np.stack([l, r], 1) * wet * 2.2

# ── music: pad ───────────────────────────────────────────────────────────────
tt = np.arange(N) / SR
CHORDS = [[50, 57, 60, 64, 65], [46, 53, 57, 62, 65], [43, 50, 53, 58, 62], [45, 52, 55, 57, 64]]  # Dm9, Bbmaj7, Gm9, Asus
BAR = 60 / 92 * 4  # 92 BPM
def saw(f, n, ph=0):
    x = (np.arange(n) / SR * f + ph) % 1.0
    return 2 * x - 1
pad = np.zeros((N, 2))
bar_n = int(BAR * SR * 2)  # chord every 2 bars
for c in range(int(np.ceil(N / bar_n)) + 1):
    i0 = c * bar_n - int(0.4 * SR)
    seg = bar_n + int(1.6 * SR)
    notes = CHORDS[c % 4]
    s = np.zeros((seg, 2))
    for k, n in enumerate(notes):
        f = midi(n + 12 if k > 2 else n)
        for side, det in ((0, -0.08), (1, 0.08)):
            s[:, side] += saw(f * (1 + det / 100 * 12), seg, ph=rng.random()) * 0.11
    s[:, 0] = lp(s[:, 0], 1500); s[:, 1] = lp(s[:, 1], 1500)
    s *= env_adsr(seg, 0.9, 1.4, 1.5)[:, None]
    a = max(0, i0); b = min(N, i0 + seg)
    if b > a: pad[a:b] += s[a - i0: b - i0]
pad = verb(pad, 0.45)

# ── music: sub pulse (eighths) + drums ───────────────────────────────────────
beat = 60 / 92
bass = np.zeros(N); kick = np.zeros(N); hat = np.zeros(N); clap = np.zeros(N)
def kick_snd():
    n = int(0.42 * SR); x = np.arange(n) / SR
    f = 46 + 90 * np.exp(-x * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 7.5) * 0.9
def hat_snd():
    n = int(0.06 * SR)
    return hp(rng.standard_normal(n), 7000) * np.exp(-np.linspace(0, 9, n)) * 0.18
def clap_snd():
    n = int(0.25 * SR)
    x = bp(rng.standard_normal(n), 900, 3500) * np.exp(-np.linspace(0, 11, n))
    return x * 0.35
K, Hh, Cl = kick_snd(), hat_snd(), clap_snd()
b = 0
while b * beat < DUR:
    t0 = b * beat
    bar = b // 4
    chord = CHORDS[(bar // 2) % 4]
    in_vac = VACUUM[0] - 0.05 <= t0 < VACUUM[1]
    if not in_vac and t0 > T['portal1'] - 0.2 and t0 < END_VO + 1.5:
        for e in (0, 0.5):
            n = int(beat * 0.45 * SR)
            x = np.arange(n) / SR
            f = midi(chord[0] - 12)
            note = (np.sin(2 * np.pi * f * x) + 0.25 * np.sin(4 * np.pi * f * x)) * np.exp(-x * 5) * 0.32
            place(bass, note, t0 + e * beat)
    if not in_vac and T['portal1'] - 0.2 < t0 < END_VO + 0.5 and (b % 2 == 0 or t0 > T['follow']):
        place(kick, K, t0, 0.75 if t0 < T['search'] else 1.0)
    if not in_vac and T['search'] < t0 < END_VO:
        for e in (0.5,) if t0 < T['follow'] else (0.25, 0.5, 0.75):
            place(hat, Hh, t0 + e * beat, 0.8 + 0.2 * rng.random())
    if not in_vac and T['follow'] < t0 < VACUUM[0] and b % 4 in (1, 3):
        place(clap, Cl, t0)
    b += 1
drums = stereo(lp(kick, 4000) + hat + clap, 0.6)
drums = verb(drums, 0.12)
music = pad * 0.85 + stereo(lp(bass, 600)) * 0.9 + drums * 0.75

# arrangement: intro lighter, vacuum, re-open on "partner", tail fade
g = np.ones(N)
def seg_gain(a, b_, v0, v1):
    i, j = t2i(a), t2i(b_)
    g[i:j] = np.linspace(v0, v1, j - i)
seg_gain(0, T['portal1'], 0.55, 0.8)
i, j = t2i(VACUUM[0] - 0.12), t2i(VACUUM[1] + 0.49)
g[i:j] = 0.05
seg_gain(VACUUM[0] - 0.35, VACUUM[0] - 0.12, 1.0, 0.05)
seg_gain(T['partner'] - 0.02, T['partner'] + 0.3, 0.05, 1.05)
seg_gain(DUR - 2.4, DUR, 1.0, 0.0)
music *= g[:, None]

# ── sound effects ────────────────────────────────────────────────────────────
fx = np.zeros((N, 2))
def svf_band(x, fc):
    """Chamberlin state-variable band-pass with a per-sample cutoff (no block seams)."""
    f = 2 * np.sin(np.pi * np.clip(fc, 20, SR / 6) / SR)
    q = 0.9
    low = band = 0.0
    out = np.empty_like(x)
    for k in range(len(x)):
        high = x[k] - low - q * band
        band += f[k] * high
        low += f[k] * band
        out[k] = band
    return out
def whoosh(dur=0.9, lo=300, hi=4500, peak=0.65, seed=0):
    n = int(dur * SR)
    u = np.arange(n) / n
    r = np.random.default_rng(seed).standard_normal(n)
    fc = np.where(u < peak, lo + (hi - lo) * np.sin(np.pi / 2 * u / peak), hi - (hi - lo) * (u - peak) / (1 - peak))
    e = np.where(u < peak, np.sin(np.pi / 2 * u / peak) ** 2, np.clip(np.cos((u - peak) / (1 - peak) * np.pi / 2), 0, 1) ** 1.5)
    return stereo(svf_band(r, fc) * e * 0.5, 0.8)
def impact(size=1.0, seed=0):
    n = int(2.5 * SR); x = np.arange(n) / SR
    f = 38 + 70 * np.exp(-x * 12)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 2.6) * 0.9
    crack = hp(np.random.default_rng(seed).standard_normal(n), 2500) * np.exp(-x * 30) * 0.25
    s = stereo((boom + crack) * size, 0.5)
    return verb(s, 0.35)
def riser(dur=1.4, seed=0):
    n = int(dur * SR); u = np.arange(n) / n
    r = np.random.default_rng(seed).standard_normal(n)
    out = svf_band(r, 400 + 6000 * u ** 2) * 0.5
    tone = np.sin(2 * np.pi * np.cumsum(220 + 660 * u ** 2) / SR) * 0.12
    return stereo((out * 0.6 + tone) * u ** 2.2, 0.7)
def blip(f=1800, dur=0.09, gain=0.25):
    n = int(dur * SR); x = np.arange(n) / SR
    return stereo(np.sin(2 * np.pi * f * x) * np.exp(-x * 45) * gain, 0.3)
def shimmer(dur=2.2):
    n = int(dur * SR); x = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * x + k) * np.exp(-x * (1.2 + k * 0.4)) for k, f in enumerate([1760, 2217, 2637, 3520]))
    return verb(stereo(s * 0.05 * np.minimum(1, x * 30), 0.9), 0.5)
def scan_bed(dur):
    n = int(dur * SR); x = np.arange(n) / SR
    sweep = np.sin(2 * np.pi * np.cumsum(900 + 500 * np.sin(2 * np.pi * x * 0.9)) / SR) * 0.035
    ticks = np.zeros(n)
    for k in np.arange(0, dur, 0.125):
        place_i = int(k * SR); m = min(n, place_i + int(0.02 * SR))
        ticks[place_i:m] += np.sin(2 * np.pi * 4200 * x[: m - place_i]) * np.exp(-x[: m - place_i] * 300) * 0.1
    noise = bp(rng.standard_normal(n), 3000, 9000) * 0.02
    e = env_adsr(n, 0.15, 0.3, 1)
    return stereo((sweep + ticks + noise) * e, 0.5)
def stamp():
    n = int(0.6 * SR); x = np.arange(n) / SR
    thud = np.sin(2 * np.pi * (70 + 120 * np.exp(-x * 40)) * x) * np.exp(-x * 14) * 0.8
    click = hp(rng.standard_normal(n), 1800) * np.exp(-x * 80) * 0.4
    return verb(stereo(thud + click, 0.3), 0.2)
def low_drone(dur):
    n = int(dur * SR); x = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 36.7 * x) + 0.4 * np.sin(2 * np.pi * 73.4 * x + 0.3)) * 0.18
    return stereo(s * env_adsr(n, 0.3, 0.4, 1), 0.2)
def sea(dur):
    n = int(dur * SR)
    s = lp(rng.standard_normal(n), 700) * 0.25 * env_adsr(n, 0.25, 0.3, 1)
    return verb(stereo(s, 1.0), 0.3)

def add(sig, t, gain=1.0):
    i = t2i(t); j = min(N, i + sig.shape[0])
    if j > i: fx[i:j] += sig[: j - i] * gain

# opening: low swell already under frame 0
add(impact(0.55, 1), 0.0, 0.6)
add(shimmer(2.6), 0.15, 0.7)
add(blip(1400, 0.12, 0.12), T['but'])
add(whoosh(0.8, 500, 6000, 0.6, 2), T['supplier'] - 0.1, 0.25)          # search sweep
add(blip(2400, 0.08, 0.2), T['right']); add(blip(3200, 0.08, 0.18), T['right'] + 0.09)  # lock-on
add(riser(1.3, 3), T['portal1'] - 1.3, 0.55)                             # dolly into the node
add(whoosh(1.0, 200, 5000, 0.45, 4), T['portal1'] - 0.55, 0.75)          # portal
add(impact(0.35, 5), T['gz'], 0.55)
add(whoosh(1.1, 150, 4000, 0.6, 6), T['market'] - 0.7, 0.7)              # map dive
add(whoosh(0.7, 300, 5500, 0.5, 7), T['market'] + 0.25, 0.45)            # through the doors
for k, key in enumerate(('search', 'verify', 'compare', 'select')):
    add(blip(1500 + k * 300, 0.1, 0.16), T[key])
add(whoosh(0.8, 250, 5000, 0.55, 8), T['cmp'] - 0.5, 0.6)                # into the chosen card
for k, key in enumerate(('price', 'spec', 'need')):
    add(whoosh(0.45, 600, 7000, 0.4, 9 + k), T[key] - 0.12, 0.25)
add(shimmer(1.8), T['merge'] + 0.35, 0.8)
add(whoosh(0.9, 200, 5000, 0.55, 12), T['follow'] - 0.55, 0.65)
add(whoosh(0.7, 300, 5000, 0.5, 13), T['prod'] - 0.25, 0.35)
add(whoosh(0.7, 300, 5000, 0.5, 14), T['insp'] - 0.35, 0.35)
add(impact(0.3, 15), T['insp'], 0.5)
add(scan_bed(T['ensure'] + 0.5 - T['insp']), T['insp'] + 0.15, 1.0)
for k, d in enumerate((0.55, T['preship'] + 0.15 - T['insp'], T['ensure'] + 0.1 - T['insp'])):
    add(blip(2600, 0.07, 0.14), T['insp'] + d + 0.45)
add(stamp(), T['match'], 0.9)
add(riser(0.9, 16), T['whether'] - 0.9, 0.4)
add(whoosh(1.0, 150, 6000, 0.5, 17), T['whether'] - 0.45, 0.7)            # whip into the tunnel
for k, key in enumerate(('products', 'equip', 'mach', 'lines')):
    add(whoosh(0.6, 400, 7000, 0.45, 18 + k), T[key] - 0.2, 0.42)
    add(impact(0.18, 22 + k), T[key], 0.45)
for k in range(5):
    add(blip(1300 + k * 220, 0.1, 0.14), T['steps'] + (T['studied'] - T['steps']) * k / 4)
add(whoosh(0.9, 200, 4500, 0.55, 27), T['then'] - 0.45, 0.6)               # down into the globe
add(impact(0.4, 28), T['ship'], 0.5)
add(sea(1.2), T['port'] + 0.5, 0.8)
add(low_drone(VACUUM[1] - VACUUM[0] + 0.2), VACUUM[0], 0.8)                # vacuum
add(riser(T['partner'] - T['own'] + 0.15, 29), T['own'] - 0.15, 0.8)
add(impact(1.0, 30), T['partner'], 0.95)                                   # hero line
add(shimmer(2.0), T['partner'] + 0.05, 0.9)
add(riser(0.5, 31), T['name'] - 0.5, 0.6)                                  # convergence
add(impact(1.2, 32), T['name'], 1.0)                                       # ALPHA reveal
add(whoosh(1.2, 120, 3500, 0.15, 33), T['name'] - 0.05, 0.55)              # shockwave
add(shimmer(3.4), T['name'] + 0.05, 1.3)
add(whoosh(0.7, 2500, 9000, 0.5, 34), T['name'] + 0.68, 0.22)              # light sweep on the plaque
add(blip(1600, 0.12, 0.1), T['tag'] + 1.3)

# ── voice + side-chain + master ──────────────────────────────────────────────
vo, sr = sf.read('pipeline/work/vo48k.wav', dtype='float64')
assert sr == SR
voice = np.zeros(N); voice[: min(N, len(vo))] = vo[:N]
voice = hp(voice, 70)
rms = np.sqrt(lp(voice ** 2, 12, 1).clip(0))
env = rms / (rms.max() + 1e-9)
# attack 30 ms / release 350 ms smoothing
sm = np.zeros(N); a_c, r_c = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.35 * SR))
acc = 0.0
for k in range(0, N, 48):
    v = env[k]
    acc = a_c ** 48 * acc + (1 - a_c ** 48) * v if v > acc else r_c ** 48 * acc + (1 - r_c ** 48) * v
    sm[k:k + 48] = acc
duck = 1 - 0.62 * np.clip(sm * 2.2, 0, 1)

def norm_rms(x, target_db):
    r = np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2)) if np.any(np.abs(x) > 1e-4) else 1
    return x * (10 ** (target_db / 20) / r)

voice = norm_rms(voice, -17.0)
music = norm_rms(music, -24.0) * duck[:, None]
fx = norm_rms(fx, -27.0) * (1 - 0.35 * np.clip(sm * 2.2, 0, 1))[:, None]
mix = stereo(voice) + music + fx
# gentle bus compression + soft clip, peak at -1 dBFS
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.25) / np.tanh(1.25) * 10 ** (-1 / 20)
sf.write('assets/film/mix.wav', mix.astype(np.float32), SR, subtype='PCM_24')
print(f'mix.wav {DUR:.3f}s  peak {np.max(np.abs(mix)):.3f}')
print({k: round(v, 2) for k, v in T.items()})
