"""
Voice-over edit: remove the spoken company name ("GUANGZHOU ALPHA GLOBAL TRADING CO., LTD")
and leave a short musical pause for the logo reveal instead.

Both cut points sit inside measured silences of the original take (42.20–42.49 s and
45.09–45.39 s), so the edit is inaudible. The name stays on screen; it just isn't spoken.

In : assets/voiceover.mp3, content/vo-timing.raw.json (output of align.py)
Out: assets/film/voiceover_edit.wav, content/vo-timing.json (shifted, phrase removed,
     plus marks.brand = the logo hit inside the new pause)
"""
import json
import subprocess
import numpy as np
import soundfile as sf

CUT_A, CUT_B = 42.33, 45.24   # removed span (inside silences)
PAUSE = 1.45                  # silence inserted instead → ~1.8 s between the hero line and the tagline
FADE = 0.012
SR = 48000

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'assets/voiceover.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.float32).astype(np.float64)
a, b, nf = int(CUT_A * SR), int(CUT_B * SR), int(FADE * SR)
head, tail = x[:a].copy(), x[b:].copy()
head[-nf:] *= np.linspace(1, 0, nf)
tail[:nf] *= np.linspace(0, 1, nf)
y = np.concatenate([head, np.zeros(int(PAUSE * SR)), tail])
sf.write('assets/film/voiceover_edit.wav', y.astype(np.float32), SR, subtype='PCM_24')
sf.write('pipeline/work/vo48k.wav', y.astype(np.float32), SR, subtype='PCM_24')

shift = PAUSE - (CUT_B - CUT_A)
vo = json.load(open('content/vo-timing.raw.json', encoding='utf8'))
drop = {p['i'] for p in vo['phrases'] if CUT_A <= p['start'] and p['end'] <= CUT_B}
keep_w = [w for w in vo['words'] if w['phrase'] not in drop]
remap_p = {}
phrases = []
for p in vo['phrases']:
    if p['i'] in drop:
        continue
    remap_p[p['i']] = len(phrases)
    phrases.append(p)
remap_w = {w['i']: k for k, w in enumerate(keep_w)}
mv = lambda t: round(t + shift, 3) if t >= CUT_B else t
words = [dict(w, i=remap_w[w['i']], phrase=remap_p[w['phrase']], start=mv(w['start']), end=mv(w['end'])) for w in keep_w]
phrases = [dict(p, i=remap_p[p['i']], start=mv(p['start']), end=mv(p['end']), words=[remap_w[i] for i in p['words']]) for p in phrases]
out = dict(vo, source='assets/film/voiceover_edit.wav', duration=round(len(y) / SR, 3), words=words, phrases=phrases,
           edit=dict(cut=[CUT_A, CUT_B], pause=PAUSE, shift=round(shift, 3), removed='company name (on screen only)'),
           marks=dict(brand=round(CUT_A + 0.14, 3)))
json.dump(out, open('content/vo-timing.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('duration', out['duration'], 'shift', shift, 'brand', out['marks']['brand'])
for p in phrases[-3:]:
    print(p['start'], p['end'], p['text'])
