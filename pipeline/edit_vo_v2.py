"""
V2 voice-over edit — same narration, trailer pacing (35–40 s target).

1. Speech regions come from the measured silences of the original take.
2. The spoken company name is dropped (on screen only).
3. Every pause longer than 0.2 s is tightened; three pauses are designed:
   a 0.5 s vacuum before the hero line, a beat inside it, and room for the logo hit.
4. The whole edit is time-stretched by TEMPO with rubberband (pitch preserved).

Word timings are mapped through exactly the same edit, so the picture stays locked.
In : assets/voiceover.mp3, content/vo-timing.raw.json   Out: assets/film/voiceover_v2.wav,
content/vo-timing-v2.json, pipeline/work/vo48k_v2.wav
"""
import json, re, subprocess
import numpy as np
import soundfile as sf

SR = 48000
TEMPO = 1.15
TIGHT = 0.10            # target for ordinary pauses (pre-stretch seconds)
NAME = (42.33, 45.24)   # company name span to remove (inside silences)

def run(cmd, inp=None):
    return subprocess.run(cmd, input=inp, capture_output=True, check=True)

pcm = run(['ffmpeg', '-v', 'error', '-i', 'assets/voiceover.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']).stdout
x = np.frombuffer(pcm, np.float32).astype(np.float64)
dur = len(x) / SR

# measured pauses
log = run(['ffmpeg', '-i', 'assets/voiceover.mp3', '-af', 'silencedetect=n=-38dB:d=0.2', '-f', 'null', '-']).stderr.decode()
st = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', log)]
en = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', log)]
pauses = [(a, b) for a, b in zip(st, en)]
if len(st) > len(en): pauses.append((st[-1], dur))

vo = json.load(open('content/vo-timing.raw.json', encoding='utf8'))
W = vo['words']
def word_start(text, after=0):
    n = lambda s: re.sub('[ً-ْ.,،…]', '', s).lower()
    return next(w['start'] for w in W if w['start'] >= after and n(w['text']) == n(text))
T_DONT = word_start('لا', 38)
T_OWN = word_start('امتلك')
T_TAG = word_start('شريكك')

# speech intervals = complement of pauses, minus the company name
edges = [0.0]
for a, b in pauses:
    edges += [a, b]
edges.append(dur)
speech = [(edges[i], edges[i + 1]) for i in range(0, len(edges) - 1, 2) if edges[i + 1] - edges[i] > 0.02]
keep = []
for a, b in speech:
    if b <= NAME[0] or a >= NAME[1]:
        keep.append([a, b])
    else:
        if a < NAME[0]: keep.append([a, NAME[0]])
        if b > NAME[1]: keep.append([NAME[1], b])

def gap_before(a):
    """designed pause (pre-stretch seconds) before a speech region starting at a"""
    if abs(a - T_DONT) < 0.25: return 0.55 * TEMPO     # vacuum before the hero line
    if abs(a - T_OWN) < 0.25: return 0.24 * TEMPO      # beat inside the hero line
    if abs(a - T_TAG) < 0.4: return 0.95 * TEMPO       # convergence + logo hit
    return None

out, mapping, cur = [], [], 0.0
lead = 0.04
for k, (a, b) in enumerate(keep):
    if k == 0:
        a = max(0.0, a - lead)
    else:
        prev_b = keep[k - 1][1]
        orig_gap = a - prev_b
        g = gap_before(a)
        if g is None: g = min(orig_gap, TIGHT) if orig_gap > 0.2 else orig_gap
        # pad: a little of each pause edge is kept for natural attacks/decays
        pad_out, pad_in = min(0.05, g / 2), min(0.04, g / 2)
        sil = max(0.0, g - pad_out - pad_in)
        seg_tail = x[int(prev_b * SR): int((prev_b + pad_out) * SR)]
        out.append(seg_tail); cur += len(seg_tail) / SR
        out.append(np.zeros(int(sil * SR))); cur += sil
        a = a - pad_in
    seg = x[int(a * SR): int(b * SR)].copy()
    f = int(0.006 * SR)
    seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    mapping.append((a, b, cur))
    out.append(seg); cur += len(seg) / SR
out.append(x[int(keep[-1][1] * SR): int((keep[-1][1] + 0.25) * SR)])
y = np.concatenate(out)

# pitch-preserving stretch
st_pcm = run(['ffmpeg', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'rubberband=tempo={TEMPO}:transients=crisp:pitchq=quality',
              '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-'], inp=y.tobytes()).stdout
z = np.frombuffer(st_pcm, np.float32)
sf.write('assets/film/voiceover_v2.wav', z, SR, subtype='PCM_24')
sf.write('pipeline/work/vo48k_v2.wav', z, SR, subtype='PCM_24')

def mp(t):
    for a, b, n in mapping:
        if a - 0.3 <= t <= b + 0.3:
            return round((n + min(max(t, a), b) - a) / TEMPO, 3)
    return None

words, phrases = [], []
pidx = {}
for w in W:
    s = mp(w['start'])
    if s is None or NAME[0] <= w['start'] <= NAME[1]:
        continue
    if w['phrase'] not in pidx:
        pidx[w['phrase']] = len(phrases)
        phrases.append(dict(i=len(phrases), scene=next(p['scene'] for p in vo['phrases'] if p['i'] == w['phrase']), words=[]))
    nw = dict(w, i=len(words), phrase=pidx[w['phrase']], start=s, end=mp(w['end']))
    words.append(nw)
    phrases[-1]['words'].append(nw['i'])
for p in phrases:
    ws = [words[i] for i in p['words']]
    p.update(text=' '.join(w['text'] for w in ws), start=ws[0]['start'], end=ws[-1]['end'])
hero_end = next(w for w in words if w['text'].startswith('الصين') and w['start'] > mp(T_OWN))['end']
tag = next(w for w in words if w['text'] == 'شريكك')['start']
res = dict(source='assets/film/voiceover_v2.wav', duration=round(len(z) / SR, 3), aligner=vo['aligner'],
           edit=dict(tempo=TEMPO, tight=TIGHT, removed='company name (on screen only)'),
           marks=dict(brand=round(hero_end + 0.42, 3), vacuum=[round(mp(T_DONT) - 0.5, 3), mp(T_DONT)]),
           phrases=phrases, words=words)
json.dump(res, open('content/vo-timing-v2.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('v2 duration', res['duration'], 'marks', res['marks'])
for p in phrases:
    print(f"{p['start']:6.2f}-{p['end']:6.2f} {p['text']}")
# NOTE: after this script, run
#   ffmpeg -i assets/film/voiceover_v2.wav -ac 1 -ar 16000 pipeline/work/vo16k_v2.wav
#   python3 pipeline/align.py pipeline/work/vo16k_v2.wav pipeline/work/check-v2.json pipeline/work/logits_v2.npy 20
# and copy its word/phrase times into content/vo-timing-v2.json (direct alignment on the edited audio;
# it agrees with the mapped times above to ~13 ms on average).
