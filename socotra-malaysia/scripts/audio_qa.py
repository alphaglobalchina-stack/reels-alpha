#!/usr/bin/env python3
"""Audio QA for the Malaysia reel soundtrack (or any file with an audio track, e.g. the final MP4).

Usage:  python3 scripts/audio_qa.py [path]        (default: public/audio/soundtrack.wav)

Decodes through ffmpeg (48 kHz stereo float), then measures:
  * integrated loudness (BS.1770 via pyloudnorm), true peak (4x oversampled), sample peak, clipped samples
  * loudness per section (0-3, 3-5.5, 5.5-8.5, 8.5-13.5, 13.5-16, 16-17, 17-18 s)
  * STFT (Hann 2048, hop 512): spectral flatness of power in 300 Hz-12 kHz for every frame above -60 dBFS
    (white noise ~0.56; requirement max < 0.3 => no broadband-noise moment), share of frames > 0.25,
    max fraction of energy above 10 kHz per frame
  * dropouts: silence below -55 dBFS for more than 80 ms before 17 s
  * stereo correlation, tail level, duration / format
Saves out/qa/spectrogram.png (log-frequency, section + beat markers, momentary loudness and flatness strips)
and writes scripts/audio_report.json. Exit code 1 if any requirement fails.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

import numpy as np
import pyloudnorm as pyln
from PIL import Image, ImageDraw, ImageFont
from scipy.signal import lfilter, resample_poly

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SR = 48000
DEFAULT = os.path.join(ROOT, 'public', 'audio', 'soundtrack.wav')
REPORT = os.path.join(HERE, 'audio_report.json')
SPEC_PNG = os.path.join(ROOT, 'out', 'qa', 'spectrogram.png')

CUES = json.load(open(os.path.join(HERE, 'cues.json')))
FPS = CUES['fps']
EXPECTED_DUR = CUES['frames'] / FPS
TARGET_LUFS = CUES.get('targetLufs', -14.0)
MUSIC = CUES['music']

SECTIONS = [(0, 3), (3, 5.5), (5.5, 8.5), (8.5, 13.5), (13.5, 16), (16, 17), (17, 18)]
REQ = {
    'lufs_tolerance': 0.3,
    'true_peak_max_dbtp': -1.0,
    'clipped_max': 0,
    'flatness_max': 0.3,
    'flatness_frame_threshold': 0.25,
    'frame_gate_dbfs': -60.0,
    'dropout_db': -55.0,
    'dropout_min_ms': 80.0,
    'dropout_before_s': 17.0,
}


def beat_time(b: float) -> float:
    return (b * FPS * 60 / MUSIC['bpm'] + MUSIC['offsetFrames']) / FPS


def probe(path: str) -> dict:
    try:
        out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries',
                              'stream=sample_rate,channels,codec_name,duration', '-of', 'json', path],
                             capture_output=True, check=True, text=True).stdout
        s = json.loads(out)['streams'][0]
        return {'codec': s.get('codec_name'), 'sample_rate': int(s.get('sample_rate', 0)),
                'channels': int(s.get('channels', 0)), 'stream_duration': float(s.get('duration', 'nan'))}
    except Exception as e:  # noqa: BLE001
        return {'error': str(e)}


def decode(path: str) -> np.ndarray:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vn', '-f', 'f32le', '-acodec', 'pcm_f32le',
                          '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def db(x: float) -> float:
    return float(20 * np.log10(max(x, 1e-12)))


def k_weight(x: np.ndarray) -> np.ndarray:
    """BS.1770 K-weighting (48 kHz coefficients): shelf + RLB high-pass."""
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)


def momentary(x: np.ndarray, hop: float = 0.05) -> tuple[np.ndarray, np.ndarray]:
    z = k_weight(x)
    p = np.sum(z ** 2, axis=1)
    cs = np.concatenate([[0], np.cumsum(p)])
    w = int(0.4 * SR)
    h = int(hop * SR)
    idx = np.arange(0, len(x) - w + 1, h)
    ms = (cs[idx + w] - cs[idx]) / w
    return (idx + w) / SR, -0.691 + 10 * np.log10(np.maximum(ms, 1e-12))


def stft_mag(mono: np.ndarray, nfft: int = 2048, hop: int = 512):
    win = np.hanning(nfft)
    pad = np.concatenate([np.zeros(nfft // 2), mono, np.zeros(nfft)])
    nfr = 1 + (len(mono)) // hop
    idx = np.arange(nfft)[None, :] + hop * np.arange(nfr)[:, None]
    frames = pad[idx]
    spec = np.fft.rfft(frames * win, axis=1)
    times = np.arange(nfr) * hop / SR  # frame centre
    freqs = np.fft.rfftfreq(nfft, 1 / SR)
    lvl = 10 * np.log10(np.mean(frames ** 2, axis=1) + 1e-20)  # frame level, dBFS (unwindowed RMS)
    return times, freqs, np.abs(spec) ** 2, lvl


def analyse(x: np.ndarray) -> dict:
    meter = pyln.Meter(SR)
    n = len(x)
    dur = n / SR
    res: dict = {'duration_s': round(dur, 4), 'samples': n}
    res['integrated_lufs'] = round(float(meter.integrated_loudness(x)), 2)
    up = resample_poly(x, 4, 1, axis=0)
    res['true_peak_dbtp'] = round(db(np.max(np.abs(up))), 2)
    res['sample_peak_dbfs'] = round(db(np.max(np.abs(x))), 2)
    res['clipped_samples'] = int(np.sum(np.abs(x) >= 0.99999))
    sec = {}
    for a, b in SECTIONS:
        seg = x[int(a * SR) : int(min(b, dur) * SR)]
        key = f'{a:g}-{b:g}s'
        if len(seg) < int(0.4 * SR):
            sec[key] = None
            continue
        try:
            li = float(meter.integrated_loudness(seg))
        except Exception:  # noqa: BLE001
            li = float('-inf')
        sec[key] = {'lufs': round(li, 2) if np.isfinite(li) else None,
                    'rms_dbfs': round(10 * np.log10(np.mean(seg ** 2) + 1e-20), 2),
                    'peak_dbfs': round(db(np.max(np.abs(seg))), 2)}
    res['sections'] = sec
    mt, ml = momentary(x)
    res['max_momentary_lufs'] = round(float(ml.max()), 2)

    # spectral flatness / HF share
    mono = 0.5 * (x[:, 0] + x[:, 1])
    times, freqs, P, lvl = stft_mag(mono)
    band = (freqs >= 300) & (freqs <= 12000)
    Pb = P[:, band]
    eps = 1e-12 * (Pb.max(axis=1, keepdims=True) + 1e-30)
    gm = np.exp(np.mean(np.log(Pb + eps), axis=1))
    am = np.mean(Pb + eps, axis=1)
    flat = gm / am
    hf = P[:, freqs > 10000].sum(axis=1) / (P[:, freqs > 20].sum(axis=1) + 1e-30)
    act = lvl > REQ['frame_gate_dbfs']
    fa = np.where(act, flat, 0.0)
    ha = np.where(act, hf, 0.0)
    i_f, i_h = int(np.argmax(fa)), int(np.argmax(ha))
    res['flatness'] = {
        'frames_analysed': int(act.sum()),
        'max': round(float(fa[i_f]), 4), 'max_at_s': round(float(times[i_f]), 3),
        'median': float(f'{np.median(flat[act]):.3g}') if act.any() else None,
        'pct_frames_above_0_25': round(100.0 * float(np.mean(flat[act] > REQ['flatness_frame_threshold'])), 3) if act.any() else 0.0,
    }
    res['hf_above_10k'] = {'max_fraction': round(float(ha[i_h]), 4), 'max_at_s': round(float(times[i_h]), 3),
                           'mean_fraction': round(float(np.mean(hf[act])), 5) if act.any() else None}

    # dropouts: 20 ms RMS windows, 10 ms hop
    w, h = int(0.02 * SR), int(0.01 * SR)
    p = np.mean(x ** 2, axis=1)
    cs = np.concatenate([[0], np.cumsum(p)])
    starts = np.arange(0, n - w + 1, h)
    rms_db = 10 * np.log10((cs[starts + w] - cs[starts]) / w + 1e-20)
    quiet = rms_db < REQ['dropout_db']
    drops = []
    i = 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j + 1 < len(quiet) and quiet[j + 1]:
                j += 1
            t0, t1 = starts[i] / SR, (starts[j] + w) / SR
            if t0 < REQ['dropout_before_s'] and (min(t1, REQ['dropout_before_s']) - t0) * 1000 > REQ['dropout_min_ms']:
                drops.append([round(t0, 3), round(t1, 3)])
            i = j + 1
        else:
            i += 1
    res['dropouts'] = drops
    res['min_rms_before_17s_dbfs'] = round(float(rms_db[starts / SR < REQ['dropout_before_s'] - 0.02].min()), 2)
    res['first_100ms_peak_dbfs'] = round(db(np.max(np.abs(x[: int(0.1 * SR)]))), 2)
    res['last_50ms_peak_dbfs'] = round(db(np.max(np.abs(x[-int(0.05 * SR):]))), 2)
    l, r = x[:, 0], x[:, 1]
    res['stereo_correlation'] = round(float(np.sum(l * r) / np.sqrt(np.sum(l * l) * np.sum(r * r) + 1e-30)), 3)
    res['mono_vs_stereo_lufs_db'] = round(float(meter.integrated_loudness(np.stack([mono, mono], 1))) - res['integrated_lufs'], 2)
    return res, (times, freqs, P, flat, act, mt, ml)


# ───────────────────────────── spectrogram image (PIL) ─────────────────────────────
CMAP = [(0.0, (12, 11, 16)), (0.25, (52, 28, 78)), (0.5, (150, 52, 92)), (0.72, (226, 120, 72)), (0.9, (246, 206, 120)), (1.0, (252, 248, 222))]


def colorize(v: np.ndarray) -> np.ndarray:
    v = np.clip(v, 0, 1)
    out = np.zeros(v.shape + (3,))
    for (p0, c0), (p1, c1) in zip(CMAP[:-1], CMAP[1:]):
        msk = (v >= p0) & (v <= p1)
        u = ((v - p0) / (p1 - p0))[msk][:, None]
        out[msk] = np.array(c0) * (1 - u) + np.array(c1) * u
    return out.astype(np.uint8)


def save_spectrogram(path: str, data, dur: float, title: str):
    times, freqs, P, flat, act, mt, ml = data
    W, H = 1800, 620
    LM, TM, RM = 70, 34, 20
    strip1, strip2 = 130, 90
    img = Image.new('RGB', (LM + W + RM, TM + H + 18 + strip1 + 14 + strip2 + 30), (250, 249, 246))
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    except Exception:  # noqa: BLE001
        font = ImageFont.load_default()
    fmin, fmax = 30.0, 16000.0
    rows = np.exp(np.linspace(np.log(fmax), np.log(fmin), H))
    # display only: +3 dB/octave tilt around 1 kHz (pink-weighted view, so the lows do not swamp the image)
    Sdb = 10 * np.log10(P + 1e-20) + 10 * np.log10(np.maximum(freqs, 20.0) / 1000.0)[None, :]
    Sdb -= np.percentile(Sdb, 99.95)
    cols = np.interp(np.linspace(0, dur, W), times, np.arange(len(times)))
    ci = np.clip(np.round(cols).astype(int), 0, len(times) - 1)
    S = Sdb[ci]  # (W, F)
    grid = np.empty((H, W))
    for j in range(W):
        grid[:, j] = np.interp(rows, freqs, S[j])
    rgb = colorize((grid + 75) / 75)
    img.paste(Image.fromarray(rgb), (LM, TM))

    def xt(t):
        return LM + t / dur * W

    def yf(f):
        return TM + (np.log(fmax) - np.log(f)) / (np.log(fmax) - np.log(fmin)) * H

    for f in [50, 100, 200, 500, 1000, 2000, 5000, 10000]:
        y = yf(f)
        d.line([(LM - 5, y), (LM, y)], fill=(60, 60, 60))
        d.text((6, y - 7), f'{f // 1000}k' if f >= 1000 else str(f), fill=(60, 60, 60), font=font)
    sec_edges = sorted({a for a, _ in SECTIONS} | {b for _, b in SECTIONS})
    for s in sec_edges:
        x = xt(s)
        for y in range(TM, TM + H + 18 + strip1 + 14 + strip2, 6):
            d.line([(x, y), (x, y + 3)], fill=(235, 235, 235) if y < TM + H else (170, 170, 170))
        d.text((x + 3, TM + H + 3), f'{s:g}s', fill=(60, 60, 60), font=font)
    for b, lab in [(MUSIC['drumsInBeat'], 'drums'), (MUSIC['buildBeat'], 'build'), (MUSIC['priceBeat'], 'price'),
                   (MUSIC['climaxBeat'], 'CLIMAX'), (MUSIC['finalBeat'], 'final')]:
        x = xt(beat_time(b))
        d.line([(x, TM), (x, TM + H)], fill=(232, 217, 181), width=2)
        d.text((x + 4, TM + 4), f'b{b} {lab}', fill=(255, 245, 220), font=font)
    d.text((LM, 8), title, fill=(28, 28, 30), font=font)

    # momentary loudness strip
    y0 = TM + H + 18
    d.rectangle([LM, y0, LM + W, y0 + strip1], outline=(200, 200, 200), fill=(255, 255, 255))
    lo, hi = -40.0, -5.0
    for v in (-30, -20, -14, -10):
        y = y0 + (hi - v) / (hi - lo) * strip1
        d.line([(LM, y), (LM + W, y)], fill=(236, 230, 214) if v != -14 else (214, 190, 140))
        d.text((8, y - 7), f'{v} LU', fill=(90, 90, 90), font=font)
    pts = [(xt(t), y0 + (hi - np.clip(v, lo, hi)) / (hi - lo) * strip1) for t, v in zip(mt, ml)]
    d.line(pts, fill=(28, 28, 30), width=2)
    d.text((LM + 6, y0 + 4), 'momentary loudness (400 ms, LUFS)', fill=(90, 90, 90), font=font)

    # flatness strip
    y1 = y0 + strip1 + 14
    d.rectangle([LM, y1, LM + W, y1 + strip2], outline=(200, 200, 200), fill=(255, 255, 255))
    for v in (0.1, 0.25, 0.3):
        y = y1 + (0.4 - v) / 0.4 * strip2
        d.line([(LM, y), (LM + W, y)], fill=(236, 230, 214) if v < 0.25 else (210, 150, 140))
        d.text((8, y - 7), f'{v:.2f}', fill=(90, 90, 90), font=font)
    fpts = [(xt(t), y1 + (0.4 - min(0.4, f if a else 0.0)) / 0.4 * strip2) for t, f, a in zip(times, flat, act)]
    d.line(fpts, fill=(110, 90, 160), width=1)
    d.text((LM + 6, y1 + 4), 'spectral flatness 300 Hz-12 kHz (white noise ~0.56, limit 0.30)', fill=(90, 90, 90), font=font)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)


def main():
    path = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT
    is_default = os.path.abspath(path) == os.path.abspath(DEFAULT)
    info = probe(path)
    x = decode(path)
    res, data = analyse(x)
    res['file'] = os.path.relpath(path, ROOT)
    res['format'] = info

    fails = []
    if abs(res['integrated_lufs'] - TARGET_LUFS) > REQ['lufs_tolerance']:
        fails.append(f"integrated loudness {res['integrated_lufs']} LUFS not within {TARGET_LUFS}±{REQ['lufs_tolerance']}")
    if res['true_peak_dbtp'] > REQ['true_peak_max_dbtp']:
        fails.append(f"true peak {res['true_peak_dbtp']} dBTP > {REQ['true_peak_max_dbtp']}")
    if res['clipped_samples'] > REQ['clipped_max']:
        fails.append(f"{res['clipped_samples']} clipped samples")
    if res['flatness']['max'] >= REQ['flatness_max']:
        fails.append(f"max spectral flatness {res['flatness']['max']} at {res['flatness']['max_at_s']} s >= {REQ['flatness_max']}")
    if res['dropouts']:
        fails.append(f"dropouts: {res['dropouts']}")
    wav_like = path.lower().endswith('.wav')
    tol = 2.0 / SR if wav_like else 0.1
    if abs(res['duration_s'] - EXPECTED_DUR) > tol:
        fails.append(f"duration {res['duration_s']} s != {EXPECTED_DUR} s (tol {tol:.4f})")
    if wav_like and (info.get('sample_rate') != SR or info.get('channels') != 2):
        fails.append(f"format {info} is not 48 kHz stereo")
    res['requirements'] = REQ | {'target_lufs': TARGET_LUFS, 'expected_duration_s': EXPECTED_DUR}
    res['pass'] = not fails
    res['failures'] = fails

    title = f"{res['file']}  |  {res['integrated_lufs']} LUFS  |  TP {res['true_peak_dbtp']} dBTP  |  max flatness {res['flatness']['max']}"
    if is_default:
        save_spectrogram(SPEC_PNG, data, res['duration_s'], title)
        res['spectrogram'] = os.path.relpath(SPEC_PNG, ROOT)

    rep = {}
    if os.path.exists(REPORT):
        try:
            rep = json.load(open(REPORT))
        except Exception:  # noqa: BLE001
            rep = {}
    if is_default:
        keep = {k: rep[k] for k in ('mix', 'external') if k in rep}
        rep = res | keep
    else:
        rep.setdefault('external', {})[res['file']] = res
    json.dump(rep, open(REPORT, 'w'), indent=2)

    print(f"file               {res['file']}  ({info.get('codec')}, {info.get('sample_rate')} Hz, {info.get('channels')} ch, {res['duration_s']} s)")
    print(f"integrated         {res['integrated_lufs']} LUFS   (target {TARGET_LUFS} ±{REQ['lufs_tolerance']})")
    print(f"true peak (4x)     {res['true_peak_dbtp']} dBTP  (<= {REQ['true_peak_max_dbtp']})")
    print(f"sample peak        {res['sample_peak_dbfs']} dBFS, clipped samples {res['clipped_samples']}")
    print('sections           ' + '  '.join(f"{k}: {v['lufs'] if v else None}" for k, v in res['sections'].items()))
    fl = res['flatness']
    print(f"flatness           max {fl['max']} @ {fl['max_at_s']} s, median {fl['median']}, >0.25: {fl['pct_frames_above_0_25']} % ({fl['frames_analysed']} frames)")
    print(f"energy >10 kHz     max {res['hf_above_10k']['max_fraction']} @ {res['hf_above_10k']['max_at_s']} s")
    print(f"dropouts           {res['dropouts'] or 'none'} (min 20 ms RMS before 17 s: {res['min_rms_before_17s_dbfs']} dBFS)")
    print(f"edges              first 100 ms peak {res['first_100ms_peak_dbfs']} dBFS, last 50 ms peak {res['last_50ms_peak_dbfs']} dBFS")
    print(f"stereo             correlation {res['stereo_correlation']}, mono fold-down {res['mono_vs_stereo_lufs_db']} dB")
    print('RESULT             ' + ('PASS' if not fails else 'FAIL: ' + '; '.join(fails)))
    sys.exit(0 if not fails else 1)


if __name__ == '__main__':
    main()
