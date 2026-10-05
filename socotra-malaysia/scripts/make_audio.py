#!/usr/bin/env python3
"""Soundtrack for the Malaysia reel (Socotra Travel & Tours): music + tonal SFX in one 18 s mix.

Run:  node scripts/export-cues.mjs && python3 scripts/make_audio.py && python3 scripts/audio_qa.py
Out:  public/audio/soundtrack.wav  (48 kHz, stereo, float32, exactly frames/fps seconds)

Every sound here is built from SINE WAVES only: notes (additive piano, pluck, bells, pad, bass) and
short tonal percussive hits (kick, clap, hat, tom, knock). There is NO noise generator anywhere in the
signal path: no whoosh / swoosh / riser / sweep / air / filtered noise. The only random numbers are
tiny timing, phase and velocity humanisation (HUMAN below), never audio. The reverb is a deterministic
feedback-delay network (FDN) whose impulse response is convolved with the instrument sends.

Music (generated unless one of cues.music.userMusic exists), 108 BPM, A minor -> C major:
  beats  0-6   piano + shimmering bells + soft pad, no drums
  beat   6     (frame 98, ticket) kick + clap enter, plucky 8th bass, tonal off-beat hats, 8th arpeggio
  beats 16-24  features: arpeggio in 16ths + octave arpeggio + pluck counter-line, 16th hats, 4-on-the-floor
  beats 24-27  price tension: Dm9 -> G13sus, short tonal tom fill
  beat  27     (frame 448, price lands) CLIMAX: wide Cmaj9 on every layer + kick
  beats 27-30  settles: kicks on 27/28/29 getting softer, arpeggio back to 8ths, plagal Fmaj9/C
  beat  30     (frame 498) calm Cmaj9, drums stop; rings out and fades over the last second
  Progression: Am9 | Fmaj9 | Cadd9 | G6/9/B | Am9 | Fmaj9#11 | Dm9 G13sus | Cmaj9 ... Fmaj9/C | Cmaj9

SFX bus (tonal, ~9 dB under the music by integrated loudness): pitched chime per tick, tuned stamp
knock per pop, ease-out note run per counter, glass bell stack when the price lands.

Mix: kick-keyed sidechain on pad / reverb / sustained layers (-3.5 dB, 150 ms release) and bass,
16-line FDN reverb (RT60 ~3.0 s at 500 Hz-1 kHz) on instruments only (not on kick / clap / hat / tom / bass, nor
on the SFX stamp knocks: SFX send = chimes, rise bells, glass stack), 30 Hz high-pass,
gentle 11 kHz low-pass, look-ahead true-peak limiter (4x oversampled detector), loudness normalised to
cues.targetLufs, 15 ms fade-in, last-second fade-out.
"""
from __future__ import annotations

import json
import os
import subprocess

import numpy as np
import pyloudnorm as pyln
from scipy.io import wavfile
from scipy.linalg import hadamard
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, fftconvolve, lfilter, resample_poly, sosfilt

# ════════════════════════════════════ timeline (all from cues.json) ════════════════════════════════════
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CUES = json.load(open(os.path.join(HERE, 'cues.json')))
FPS = CUES['fps']
DUR = CUES['frames'] / FPS  # 18.0 s
SR = 48000
N = int(round(DUR * SR))  # exact output length
L = N + 2 * SR  # working length: room for ringing tails, trimmed at the end
MUS = CUES['music']
BPM = MUS['bpm']
BEAT = 60.0 / BPM
OFFSET = MUS['offsetFrames'] / FPS
B_DRUMS, B_BUILD, B_PRICE = MUS['drumsInBeat'], MUS['buildBeat'], MUS['priceBeat']
B_CLIMAX, B_FINAL = MUS['climaxBeat'], MUS['finalBeat']
TARGET_LUFS = CUES['targetLufs']
SFX_BELOW_DB = CUES.get('sfxBelowMusicDb', 9)
TP_CEILING_DB = -1.5  # requirement is <= -1.0 dBTP; 0.5 dB margin for the AAC encode in the final MP4
FADE_IN = 0.015
FADE_OUT_FROM = DUR - 1.0

# Humanisation ONLY (tiny timing / phase / velocity offsets) - never used to make audio.
HUMAN = np.random.default_rng(108)


def bt(beat: float) -> float:
    """Beat -> seconds on the reel's grid: t = (beat * fps*60/bpm + offsetFrames) / fps."""
    return beat * BEAT + OFFSET


def f2beat(frame: float) -> float:
    return (frame / FPS - OFFSET) / BEAT


# ════════════════════════════════════ pitch helpers ════════════════════════════════════
_PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def m(name: str) -> int:
    """'A3' -> 57, 'F#4' -> 66, 'Bb2' -> 46."""
    pc, rest = _PC[name[0]], name[1:]
    while rest and rest[0] in '#b':
        pc += 1 if rest[0] == '#' else -1
        rest = rest[1:]
    return pc + 12 * (int(rest) + 1)


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def tvec(n: int) -> np.ndarray:
    return np.arange(n) / SR


def ramp_in(t: np.ndarray, a: float) -> np.ndarray:
    """Raised-cosine attack of length a seconds (soft, no click)."""
    return np.where(t < a, 0.5 - 0.5 * np.cos(np.pi * np.clip(t / a, 0, 1)), 1.0)


def release_after(t: np.ndarray, at: float, tau: float) -> np.ndarray:
    return np.where(t > at, np.exp(-(t - at) / tau), 1.0)


def jitter(sd_ms: float) -> float:
    return float(HUMAN.normal(0, sd_ms / 1000.0))


# ════════════════════════════════════ filters / buses ════════════════════════════════════
def _sos(kind, f, order):
    return butter(order, f, kind, fs=SR, output='sos')


def hp(x, f, order=2):
    return sosfilt(_sos('high', f, order), x, axis=0)


def lp(x, f, order=2):
    return sosfilt(_sos('low', f, order), x, axis=0)


class Bus:
    """Stereo accumulation buffer. add() places a mono (equal-power pan) or stereo signal at t seconds."""

    def __init__(self, name: str):
        self.name = name
        self.x = np.zeros((L, 2))

    def add(self, sig: np.ndarray, t: float, pan: float = 0.0, gain: float = 1.0):
        i0 = int(round(max(t, 0.0) * SR))  # beat 0 sits 2 frames before t=0: start it at 0
        if i0 >= L:
            return
        sig = sig[: L - i0]
        n = len(sig)
        if sig.ndim == 1:
            th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
            self.x[i0 : i0 + n, 0] += sig * (np.cos(th) * gain)
            self.x[i0 : i0 + n, 1] += sig * (np.sin(th) * gain)
        else:
            self.x[i0 : i0 + n, 0] += sig[:, 0] * gain * min(1.0, 1.0 - pan)
            self.x[i0 : i0 + n, 1] += sig[:, 1] * gain * min(1.0, 1.0 + pan)


def mix_mono(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Sum two mono signals of different lengths."""
    out = np.zeros(max(len(a), len(b)))
    out[: len(a)] += a
    out[: len(b)] += b
    return out


# ════════════════════════════════════ instruments (all sine-based) ════════════════════════════════════
def piano(f: float, vel: float, hold: float) -> np.ndarray:
    """Additive piano. Stiff-string inharmonic partials f_k = k f sqrt(1 + B k^2), strike-position comb,
    velocity-dependent brightness, per-partial two-stage decay (prompt sound + aftersound), three slightly
    detuned unison strings for the low partials (slow beating = warmth). The hammer is a short LOW SINE
    thump - no noise. hold = seconds until the damper falls."""
    length = hold + 0.7
    n = int(length * SR)
    t = tvec(n)
    B = float(np.clip(2.2e-4 * (f / 261.6) ** 1.1, 4e-5, 2.5e-3))
    tau_main = float(np.clip(3.4 * (261.6 / f) ** 0.6, 0.5, 7.0))
    slope = 1.9 - 1.0 * vel  # harder strike -> brighter spectrum
    strings = [(-0.75, 0.34), (0.0, 0.33), (0.85, 0.33)] if f > 100 else [(-0.4, 0.5), (0.45, 0.5)]
    out = np.zeros(n)
    for k in range(1, 29):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 9000:
            break
        a = (abs(np.sin(np.pi * k * 0.118)) ** 0.7 + 0.02) / k ** slope
        tau = tau_main / (1 + 0.32 * (k - 1) + (fk / 3200) ** 2)
        nk = min(n, int(7 * tau * SR) + 1)
        tk = t[:nk]
        env = 0.6 * np.exp(-tk / (tau * 0.22)) + 0.4 * np.exp(-tk / tau)
        ph_k = HUMAN.uniform(0, 2 * np.pi)  # spread partial phases: same timbre, lower crest factor
        for cents, w in (strings if k <= 6 else [(0.0, 1.0)]):
            ph = ph_k + HUMAN.uniform(-0.25, 0.25)
            out[:nk] += (a * w) * env * np.sin(2 * np.pi * fk * 2 ** (cents / 1200) * tk + ph)
    nt = int(0.09 * SR)
    ft = min(max(f * 0.5, 70.0), 140.0)
    out[:nt] += 0.16 * vel * np.sin(2 * np.pi * ft * t[:nt]) * np.exp(-t[:nt] / 0.013)
    out *= ramp_in(t, 0.0025) * release_after(t, hold, 0.11)
    return out * vel


BELL_KINDS = {
    # (ratio, amplitude, decay multiplier) - inharmonic partials of a struck bar / glass
    'chime': [(1.0, 1.0, 1.0), (2.0, 0.20, 0.45), (2.756, 0.10, 0.28), (5.404, 0.045, 0.12)],
    'glass': [(1.0, 1.0, 1.0), (2.32, 0.42, 0.55), (4.25, 0.20, 0.30), (6.63, 0.09, 0.16)],
    # nearly harmonic (celesta-like) for fast lines, so 16th notes do not smear inharmonic partials
    'celesta': [(1.0, 1.0, 1.0), (2.0, 0.22, 0.45), (3.0, 0.06, 0.25), (4.02, 0.025, 0.12)],
}


def bell(f: float, vel: float = 0.6, decay: float = 1.6, kind: str = 'chime', shimmer: float = 1.7) -> np.ndarray:
    """Shimmering bell: inharmonic sine partials, each a slightly detuned PAIR so it beats gently."""
    length = min(5.5, decay * 6.5)
    n = int(length * SR)
    t = tvec(n)
    out = np.zeros(n)
    for ratio, amp, dmul in BELL_KINDS[kind]:
        fp = f * ratio
        if fp > 11500:
            continue
        tau = decay * dmul
        nk = min(n, int(7 * tau * SR) + 1)
        tk = t[:nk]
        ph = HUMAN.uniform(0, 2 * np.pi)
        pair = np.sin(2 * np.pi * fp * tk + ph) + 0.55 * np.sin(2 * np.pi * (fp + shimmer * ratio ** 0.5) * tk + ph + 1.1)
        out[:nk] += amp * np.exp(-tk / tau) * pair / 1.55
    return out * ramp_in(t, 0.002) * vel


def pluck(f: float, vel: float = 0.7, decay: float = 0.45, bright: float = 0.5, pick: float = 0.19) -> np.ndarray:
    """Plucked string WITHOUT noise excitation: harmonic sines with a pick-position comb and per-partial
    decay (higher partials die faster), plus a 6-cent pitch settle for a natural 'twang'."""
    n = int(min(3.0, decay * 6) * SR)
    t = tvec(n)
    phase = 2 * np.pi * f * np.cumsum(1 + 0.0035 * np.exp(-t / 0.03)) / SR
    out = np.zeros(n)
    for k in range(1, 17):
        if f * k > 9000:
            break
        a = (abs(np.sin(np.pi * k * pick)) ** 0.8 + 0.08) / k ** (1.55 - 0.7 * bright) * vel ** (0.35 * (k - 1))
        tau = decay / (1 + (k - 1) * (0.85 - 0.45 * bright))
        nk = min(n, int(7 * tau * SR) + 1)
        out[:nk] += a * np.exp(-t[:nk] / tau) * np.sin(k * phase[:nk] + (HUMAN.uniform(0, 2 * np.pi) if k > 1 else 0.0))
    return out * ramp_in(t, 0.0012) * vel


def pad_chord(notes: list[int], dur: float, attack: float = 0.8, release: float = 1.0, bright: float = 1.0) -> np.ndarray:
    """Warm tonal pad: per note four detuned additive 'voices' (+-4 / +-11 cents) spread across the
    stereo field, soft harmonic roll-off, slow vibrato drift. Returns stereo."""
    n = int((dur + release) * SR)
    t = tvec(n)
    out = np.zeros((n, 2))
    voices = [(-0.11, -0.85), (-0.04, -0.3), (0.04, 0.3), (0.11, 0.85)]
    for j, mi in enumerate(notes):
        f = hz(mi)
        for v, (semi, pan) in enumerate(voices):
            fv = f * 2 ** (semi / 12)
            rate = 0.17 + 0.045 * v + 0.013 * j
            beta = fv * 0.0012 / rate  # ~2 cents drift as phase modulation
            ph = 2 * np.pi * fv * t + beta * np.sin(2 * np.pi * rate * t + j) + HUMAN.uniform(0, 2 * np.pi)
            sig = np.zeros(n)
            for k in range(1, 13):
                if fv * k > 4200:
                    break
                sig += np.sin(k * ph) * (1 / k ** 1.7) * np.exp(-fv * k / (2600 * bright))
            th = (pan + 1) * np.pi / 4
            out[:, 0] += sig * np.cos(th)
            out[:, 1] += sig * np.sin(th)
    env = ramp_in(t, attack) * np.where(t > dur, 0.5 + 0.5 * np.cos(np.pi * np.clip((t - dur) / release, 0, 1)), 1.0)
    env *= 1 + 0.05 * np.sin(2 * np.pi * 0.23 * t)  # gentle breathing
    return out * env[:, None] / (len(notes) * 4)


def bass_pluck(f: float, vel: float, length: float) -> np.ndarray:
    """Plucky bass: sine fundamental with a tiny pitch settle, 2nd-4th harmonics that decay fast (the
    'pluck'), soft tanh warmth, 3 ms attack, 40 ms release."""
    n = int((length + 0.06) * SR)
    t = tvec(n)
    phase = 2 * np.pi * f * np.cumsum(1 + 0.02 * np.exp(-t / 0.012)) / SR
    s = np.sin(phase) * np.exp(-t / 0.5)
    s += 0.45 * np.sin(2 * phase) * np.exp(-t / 0.09)
    s += 0.22 * np.sin(3 * phase) * np.exp(-t / 0.05)
    s += 0.10 * np.sin(4 * phase) * np.exp(-t / 0.035)
    s = np.tanh(1.3 * s) / np.tanh(1.3)
    gate = np.where(t > length, 0.5 + 0.5 * np.cos(np.pi * np.clip((t - length) / 0.04, 0, 1)), 1.0)
    return s * ramp_in(t, 0.003) * gate * vel


def sub_note(f: float, vel: float, length: float, release: float = 0.5) -> np.ndarray:
    """Held sine bass (climax / ending)."""
    n = int((length + release) * SR)
    t = tvec(n)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.4)
    env = ramp_in(t, 0.006) * np.exp(-t / 3.0) * release_after(t, length, release / 3)
    return s * env * vel


def kick(vel: float = 1.0) -> np.ndarray:
    """Sine kick: pitch drop 164 -> 44 Hz, 2.5 ms raised-cosine attack (no broadband click), soft tanh."""
    n = int(0.5 * SR)
    t = tvec(n)
    f = 44 + 120 * np.exp(-t / 0.028)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    s = np.tanh(1.6 * s) / np.tanh(1.6)
    return s * ramp_in(t, 0.0025) * vel


CLAP_FREQS = [1043, 1187, 1361, 1527, 1709, 1913, 2131, 2389, 2671, 2953, 3307, 3719, 4241, 4877]
CLAP_PHASE = np.random.default_rng(7).uniform(0, 2 * np.pi, len(CLAP_FREQS))  # fixed phases (not audio)


def clap(vel: float = 0.8) -> np.ndarray:
    """Tonal clap: a cluster of inharmonic SINES (1-5 kHz) under a 3-tap clap envelope + short tail."""
    n = int(0.3 * SR)
    t = tvec(n)
    env = np.zeros(n)
    for t0, g, tau in [(0.0, 0.75, 0.0045), (0.009, 0.62, 0.0045), (0.019, 0.55, 0.0045), (0.027, 1.0, 0.05)]:
        dt = t - t0
        env += g * np.where(dt >= 0, ramp_in(np.maximum(dt, 0), 0.0007) * np.exp(-np.maximum(dt, 0) / tau), 0)
    tone = np.zeros(n)
    for i, (fc, ph) in enumerate(zip(CLAP_FREQS, CLAP_PHASE)):
        glide = 1 - 0.015 * (1 - np.exp(-t / 0.03))  # tiny downward settle per partial
        tone += np.sin(2 * np.pi * fc * np.cumsum(glide) / SR + ph) / (1 + 0.12 * i)
    return tone * env * vel / 4.0


HAT_FREQS = [6170, 6803, 7417, 8032, 8698, 9311, 9967, 10589]
HAT_PHASE = np.random.default_rng(9).uniform(0, 2 * np.pi, len(HAT_FREQS))


def hat(vel: float = 0.6, decay: float = 0.026) -> np.ndarray:
    """Tonal closed hat: 8 inharmonic sines in 6-11 kHz, 20-35 ms decay."""
    n = int(decay * 8 * SR)
    t = tvec(n)
    s = sum(np.sin(2 * np.pi * fh * t + ph) for fh, ph in zip(HAT_FREQS, HAT_PHASE))
    return s * ramp_in(t, 0.0008) * np.exp(-t / decay) * vel / 4.0


def tom(f: float, vel: float = 0.7) -> np.ndarray:
    """Tuned tom: sine with pitch drop + the membrane's 1.59 mode."""
    n = int(0.6 * SR)
    t = tvec(n)
    ff = f * (1 + 0.35 * np.exp(-t / 0.025))
    ph = 2 * np.pi * np.cumsum(ff) / SR
    s = np.sin(ph) * np.exp(-t / 0.2) + 0.3 * np.sin(1.59 * ph) * np.exp(-t / 0.07)
    return s * ramp_in(t, 0.002) * vel


def knock(f: float, vel: float = 0.8) -> np.ndarray:
    """Woodblock / stamp knock: sine body with a fast pitch drop, a woody upper sine and a low thump."""
    n = int(0.4 * SR)
    t = tvec(n)
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.5 * np.exp(-t / 0.012))) / SR
    s = np.sin(ph) * np.exp(-t / 0.085)
    s += 0.35 * np.sin(3.17 * ph) * np.exp(-t / 0.018)
    s += 0.55 * np.sin(0.5 * ph) * np.exp(-t / 0.06)
    return s * ramp_in(t, 0.0015) * vel


# ════════════════════════════════════ reverb: deterministic FDN ════════════════════════════════════
def _next_prime(x: int) -> int:
    def is_p(k):
        return k > 1 and all(k % d for d in range(2, int(k ** 0.5) + 1))

    while not is_p(x):
        x += 1
    return x


def fdn_ir(rt60: float = 3.0, seconds: float = 4.8, hf_ratio: float = 0.55, predelay: float = 0.018) -> np.ndarray:
    """Stereo impulse response of a 16-line feedback delay network (Hadamard feedback matrix, per-line
    one-pole absorption giving RT60 = rt60 at DC and rt60*hf_ratio at 5 kHz, four input allpass
    diffusers, a few early reflections). Fully deterministic - no noise is used."""
    n = int(seconds * SR)
    delays = np.array([_next_prime(int(ms * SR / 1000)) for ms in
                       [29.7, 33.1, 37.9, 41.3, 44.9, 48.7, 53.3, 57.1, 61.9, 66.7, 71.3, 76.1, 80.9, 86.3, 91.1, 97.7]])
    nl = len(delays)
    A = hadamard(nl) / np.sqrt(nl)
    # per-line absorption filter H(z) = g (1-b) / (1 - b z^-1)
    g = 10 ** (-3 * delays / (rt60 * SR))
    w = 2 * np.pi * 5000 / SR
    filt = []
    for gi, d in zip(g, delays):
        r = (10 ** (-3 * d / (rt60 * hf_ratio * SR))) / gi
        q = 2 - 2 * r * r * np.cos(w)
        b = (q - np.sqrt(q * q - 4 * (1 - r * r) ** 2)) / (2 * (1 - r * r))
        filt.append(([gi * (1 - b)], [1.0, -b]))
    # input: impulse through 4 Schroeder allpass diffusers
    x = np.zeros(n)
    x[0] = 1.0
    for ms, ga in [(4.7, 0.72), (3.6, 0.7), (12.7, 0.62), (9.3, 0.6)]:
        M = int(ms * SR / 1000)
        bcoef = np.zeros(M + 1)
        acoef = np.zeros(M + 1)
        bcoef[0], bcoef[M], acoef[0], acoef[M] = -ga, 1.0, 1.0, -ga
        x = lfilter(bcoef, acoef, x)
    bin_ = np.where(np.arange(nl) % 2 == 0, 1.0, -1.0) / np.sqrt(nl)
    maxd = int(delays.max())
    buf = np.zeros((nl, n + maxd))
    y_out = np.zeros((nl, n))
    zi = [np.zeros(1) for _ in range(nl)]
    blk = int(delays.min())
    for n0 in range(0, n, blk):
        n1 = min(n, n0 + blk)
        y = np.empty((nl, n1 - n0))
        for i in range(nl):
            raw = buf[i, n0 - delays[i] + maxd : n1 - delays[i] + maxd]
            y[i], zi[i] = lfilter(filt[i][0], filt[i][1], raw, zi=zi[i])
        y_out[:, n0:n1] = y
        buf[:, n0 + maxd : n1 + maxd] = A @ y + np.outer(bin_, x[n0:n1])
    H = hadamard(nl)
    ir = np.stack([H[1] @ y_out, H[2] @ y_out], axis=1) / nl
    # early reflections (alternating sides) + pre-delay
    for k, (ms, gain) in enumerate([(7.1, 0.5), (11.3, 0.42), (14.9, 0.38), (19.7, 0.3), (23.3, 0.27), (29.9, 0.22), (37.1, 0.17)]):
        ir[int(ms * SR / 1000), k % 2] += gain * np.sqrt(np.sum(ir ** 2) / n) * 60
    ir = np.vstack([np.zeros((int(predelay * SR), 2)), ir])
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def rt60_of(ir: np.ndarray, band: tuple[float, float] | None = None) -> float:
    """RT60 from the Schroeder energy-decay curve (T30: -5 -> -35 dB, x2), optionally in a band."""
    y = ir[:, 0]
    if band:
        y = sosfilt(butter(2, band, 'band', fs=SR, output='sos'), y)
    e = y ** 2
    edc = 10 * np.log10(np.cumsum(e[::-1])[::-1] / e.sum() + 1e-30)
    t = np.arange(len(e)) / SR
    return float(2 * (t[np.argmax(edc < -35)] - t[np.argmax(edc < -5)]))


def convolve_send(send: np.ndarray, ir: np.ndarray) -> np.ndarray:
    """Mono-in / stereo-out convolution: the decorrelated L/R IR makes the tail wide."""
    mono = 0.5 * (send[:, 0] + send[:, 1])
    mono = lp(hp(mono, 180), 7500)
    return np.stack([fftconvolve(mono, ir[:, c])[: len(mono)] for c in range(2)], axis=1)


# ════════════════════════════════════ harmony & arrangement data ════════════════════════════════════
# Chord chart. bass: plucky-bass root; lh/rh: piano voicing; pad: pad voicing; cell: 4-note arpeggio cell
# (root-5-9-3 style, the open 'add9' colour); tones: pitch classes allowed for SFX / runs.
CHART = [
    dict(b=0.0, name='Am9', bass='A1', lh=['A2', 'E3'], rh=['B3', 'C4', 'G4'], pad=['A3', 'C4', 'E4', 'G4', 'B4'], cell=['A3', 'E4', 'B4', 'C5'], tones='A C E G B'),
    dict(b=4.0, name='Fmaj9', bass='F1', lh=['F2', 'C3'], rh=['A3', 'E4', 'G4'], pad=['F3', 'A3', 'C4', 'E4', 'G4'], cell=['F3', 'C4', 'G4', 'A4'], tones='F A C E G'),
    dict(b=8.0, name='Cadd9', bass='C2', lh=['C2', 'G2'], rh=['E3', 'D4', 'G4'], pad=['E3', 'G3', 'C4', 'D4', 'G4'], cell=['C4', 'G4', 'D5', 'E5'], tones='C D E G'),
    dict(b=12.0, name='G6/9/B', bass='B1', lh=['B1', 'G2'], rh=['D3', 'E4', 'A4'], pad=['D3', 'G3', 'B3', 'E4', 'A4'], cell=['B3', 'G4', 'D5', 'E5'], tones='G B D E A'),
    dict(b=16.0, name='Am9', bass='A1', lh=['A2', 'E3'], rh=['C4', 'G4', 'B4'], pad=['E3', 'A3', 'C4', 'G4', 'B4'], cell=['A3', 'E4', 'B4', 'C5'], tones='A C E G B'),
    dict(b=20.0, name='Fmaj9#11', bass='F1', lh=['F2', 'C3'], rh=['A3', 'E4', 'G4', 'B4'], pad=['E3', 'A3', 'C4', 'G4', 'B4'], cell=['F3', 'C4', 'G4', 'A4'], tones='F A C E G'),
    dict(b=24.0, name='Dm9', bass='D2', lh=['D2', 'A2'], rh=['F3', 'C4', 'E4'], pad=['F3', 'A3', 'C4', 'E4', 'A4'], cell=['D4', 'A4', 'E5', 'F5'], tones='D F A C E'),
    dict(b=25.5, name='G13sus', bass='G1', lh=['G2', 'F3'], rh=['C4', 'E4', 'A4'], pad=['F3', 'C4', 'E4', 'A4', 'D5'], cell=['G3', 'D4', 'A4', 'C5'], tones='G C D A'),
    dict(b=27.0, name='Cmaj9', bass='C2', lh=['G2', 'E3'], rh=['B3', 'D4', 'G4'], pad=['C3', 'G3', 'E4', 'B4', 'D5'], cell=['C4', 'G4', 'D5', 'E5'], tones='C E G B D'),
    dict(b=29.0, name='Fmaj9/C', bass='C2', lh=['C3'], rh=['A3', 'E4', 'G4'], pad=['F3', 'A3', 'C4', 'E4', 'G4'], cell=['F3', 'C4', 'G4', 'A4'], tones='F A C E G'),
    dict(b=30.0, name='Cmaj9', bass='C2', lh=['C2', 'G2'], rh=['B3', 'D4', 'E4', 'G4'], pad=['G3', 'C4', 'E4', 'B4', 'D5'], cell=['C4', 'G4', 'D5', 'E5'], tones='C E G B D'),
]
END_BEAT = f2beat(CUES['frames']) + 2


def chord_index(beat: float) -> int:
    idx = 0
    for i, c in enumerate(CHART):
        if c['b'] <= beat + 1e-6:
            idx = i
    return idx


def chord_end(i: int) -> float:
    return CHART[i + 1]['b'] if i + 1 < len(CHART) else END_BEAT


def tone_pcs(chord: dict) -> set[int]:
    return {_PC[s[0]] + (1 if '#' in s else 0) for s in chord['tones'].split()}


# Piano melody (beat, note, length in beats, velocity). A minor -> C major; one 2-bar motif, varied.
MELODY = [
    (0.0, 'E5', 1.5, 0.55), (1.5, 'D5', 0.5, 0.42), (2.0, 'E5', 1.0, 0.50), (3.0, 'G5', 1.0, 0.52),
    (4.0, 'A5', 1.5, 0.58), (5.5, 'G5', 0.5, 0.45), (6.0, 'E5', 1.0, 0.56), (7.0, 'C5', 1.0, 0.48),
    (8.0, 'E5', 1.5, 0.52), (9.5, 'D5', 0.5, 0.42), (10.0, 'C5', 1.0, 0.46), (11.0, 'G4', 1.0, 0.44),
    (12.0, 'D5', 1.5, 0.50), (13.5, 'E5', 0.5, 0.44), (14.0, 'G5', 1.0, 0.50), (15.0, 'A5', 1.0, 0.53),
    (16.0, 'B5', 1.0, 0.57), (17.0, 'A5', 0.5, 0.47), (17.5, 'G5', 0.5, 0.46), (18.0, 'E5', 1.0, 0.50), (19.0, 'G5', 1.0, 0.51),
    (20.0, 'A5', 1.5, 0.57), (21.5, 'G5', 0.5, 0.46), (22.0, 'C6', 1.0, 0.57), (23.0, 'B5', 0.5, 0.50), (23.5, 'A5', 0.5, 0.48),
    (24.0, 'A5', 1.0, 0.56), (25.0, 'E5', 0.5, 0.48), (25.5, 'G5', 0.5, 0.52), (26.0, 'A5', 0.5, 0.56), (26.5, 'D6', 0.5, 0.60),
    (27.0, 'E6', 1.5, 0.62), (28.5, 'D6', 0.5, 0.50), (29.0, 'C6', 0.5, 0.47), (29.5, 'A5', 0.5, 0.44), (30.0, 'G5', 2.5, 0.42),
]
# Piano chord strikes (beat, chart index, velocity, which hands)
COMP = [
    (0.0, 0, 0.46, 'both'), (4.0, 1, 0.44, 'both'), (6.0, 1, 0.36, 'rh'),
    (8.0, 2, 0.40, 'both'), (10.5, 2, 0.30, 'rh'), (12.0, 3, 0.40, 'both'), (14.5, 3, 0.30, 'rh'),
    (16.0, 4, 0.43, 'both'), (18.5, 4, 0.32, 'rh'), (20.0, 5, 0.43, 'both'), (22.5, 5, 0.32, 'rh'),
    (24.0, 6, 0.40, 'both'), (25.5, 7, 0.43, 'both'), (26.5, 7, 0.34, 'rh'),
    (27.0, 8, 0.56, 'both'), (29.0, 9, 0.34, 'both'), (30.0, 10, 0.34, 'both'),
]
# Bells: sparse shimmering notes (beat, note, velocity, decay s)
BELLS = [
    (0.0, 'E6', 0.40, 1.8), (1.0, 'B5', 0.28, 1.6), (2.5, 'G6', 0.30, 1.6), (3.5, 'E6', 0.26, 1.6),
    (4.0, 'A6', 0.32, 1.8), (4.5, 'E6', 0.24, 1.5), (5.0, 'C6', 0.24, 1.5), (5.5, 'G6', 0.28, 1.6),
    (8.0, 'G6', 0.26, 1.8), (10.0, 'E6', 0.22, 1.6), (12.0, 'D6', 0.24, 1.8), (14.0, 'A6', 0.24, 1.6),
]
CLIMAX_BELLS = ['G5', 'D6', 'E6', 'B6']
FINAL_BELLS = ['E6', 'G6', 'D7']
COUNTER = {'Am9': ['C4', 'G3', 'E4'], 'Fmaj9#11': ['A3', 'E4', 'C4'], 'Dm9': ['F3', 'C4', 'A3'], 'G13sus': ['F3', 'C4', 'D4']}


# ════════════════════════════════════ arrangement → stems ════════════════════════════════════
def build_music():
    st = {k: Bus(k) for k in ['piano', 'pad', 'bells', 'arp', 'bass', 'kick', 'clap', 'hat', 'tom']}
    kicks: list[tuple[float, float]] = []  # (time, velocity) - drives the sidechain

    # ── piano: chord comping (rolled) ──
    strikes = sorted(COMP)
    for j, (b, ci, vel, hands) in enumerate(strikes):
        c = CHART[ci]
        nxt = strikes[j + 1][0] if j + 1 < len(strikes) else END_BEAT
        hold = bt(nxt) - bt(b) + 0.05
        notes = (c['lh'] if hands == 'both' else []) + c['rh']
        roll = 0.035 if b >= B_FINAL else (0.012 if b == B_CLIMAX else 0.02)
        for k, nn in enumerate(notes):
            mi = m(nn)
            v = vel * (1.0 if mi < 60 else 0.85) * (1 + 0.04 * HUMAN.standard_normal())
            st['piano'].add(piano(hz(mi), v, hold), bt(b) + k * roll + jitter(2), pan=float(np.clip((mi - 62) / 45, -0.45, 0.45)), gain=0.55)

    # ── piano: melody (+ upper octave at the climax) ──
    for b, nn, lb, vel in MELODY:
        hold = lb * BEAT + 0.25
        t0 = bt(b) + (0 if b in (0.0, B_CLIMAX) else jitter(3))
        st['piano'].add(piano(hz(m(nn)), vel, hold), t0, pan=0.12, gain=0.8)
        if b == B_CLIMAX:
            st['piano'].add(piano(hz(m(nn) - 12), vel * 0.75, hold + 1.0), t0 + 0.006, pan=0.05, gain=0.7)

    # ── bells ──
    for b, nn, vel, dec in BELLS:
        st['bells'].add(bell(hz(m(nn)), vel, dec), bt(b) + jitter(2), pan=0.35 if m(nn) % 2 else -0.3, gain=0.5)
    for k, nn in enumerate(CLIMAX_BELLS):  # bell stack on the climax
        st['bells'].add(bell(hz(m(nn)), 0.3, 2.4), bt(B_CLIMAX) + 0.018 * k, pan=-0.45 + 0.3 * k, gain=0.5)
    for k, nn in enumerate(FINAL_BELLS):  # soft bells on the final chord
        st['bells'].add(bell(hz(m(nn)), 0.26, 2.6), bt(B_FINAL) + 0.06 + 0.045 * k, pan=-0.35 + 0.35 * k, gain=0.5)

    # ── pad: one detuned chord per chart span, level follows the energy curve ──
    for i, c in enumerate(CHART):
        b0, b1 = c['b'], chord_end(i)
        lvl = (0.7 if b0 < B_DRUMS else 0.75 if b0 < B_BUILD else 0.88 if b0 < B_PRICE else
               0.92 if b0 < B_CLIMAX else 0.95 if b0 < B_CLIMAX + 2 else 0.9 if b0 < B_FINAL else 0.75)
        att = 1.2 if i == 0 else (0.25 if b0 == B_CLIMAX else 0.45)
        sig = pad_chord([m(x) for x in c['pad']], bt(b1) - bt(b0) + 0.15, attack=att, release=0.9,
                        bright=1.25 if b0 == B_CLIMAX else 1.0)
        if c['name'] in ('Dm9', 'G13sus'):  # tension swell into the climax
            tt = tvec(len(sig))
            sig *= (1 + 0.25 * np.clip(tt / (bt(b1) - bt(b0)), 0, 1))[:, None]
        st['pad'].add(sig, bt(b0) - 0.08, gain=lvl)

    # ── arpeggio (pluck), octave arpeggio (celesta), counter-line (pluck) ──
    pat8 = [0, 1, 2, 3, 2, 1, 2, 3]
    pat16 = [0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1]
    b = float(B_DRUMS)
    step_i = 0
    last_ci = -1
    while b < B_FINAL - 1e-6:
        ci = chord_index(b)
        c = CHART[ci]
        if ci != last_ci:
            step_i, last_ci = 0, ci
        dense = B_BUILD <= b < B_CLIMAX
        cell = [m(x) for x in c['cell']] + [m(c['cell'][0]) + 12]
        note = cell[(pat16 if dense else pat8)[step_i % (16 if dense else 8)]]
        on_beat = abs(b - round(b)) < 1e-6
        vel = 0.62 if on_beat else (0.52 if abs(b * 2 - round(b * 2)) < 1e-6 else 0.42)
        if b >= B_CLIMAX:  # energy settles: 8ths, decrescendo
            vel *= 1.0 - 0.45 * (b - B_CLIMAX) / (B_FINAL - B_CLIMAX)
        if B_PRICE <= b < B_CLIMAX:  # tension: slight crescendo
            vel *= 1.0 + 0.1 * (b - B_PRICE) / (B_CLIMAX - B_PRICE)
        t0 = bt(b) + jitter(2.5)
        st['arp'].add(pluck(hz(note), vel, decay=0.32 if dense else 0.45, bright=0.55), t0, pan=0.33 if step_i % 2 else -0.33, gain=0.5)
        if dense:  # octave arpeggio, near-harmonic celesta timbre
            st['arp'].add(bell(hz(note + 12), vel * 0.42, 0.45, kind='celesta', shimmer=1.2), t0 + 0.004, pan=0.45, gain=0.5)
        step_i += 1
        b += 0.25 if dense else 0.5
    # counter-line: tresillo (3+3+2 sixteenths) on guide tones, features + tension
    b = float(B_BUILD)
    while b < B_CLIMAX - 1e-6:
        for k, off in enumerate([0.0, 0.75, 1.5]):
            bb = b + off
            if bb >= B_CLIMAX:
                break
            c = CHART[chord_index(bb)]
            line = COUNTER.get(c['name']) or [f'{x[:-1]}{int(x[-1]) - 1}' for x in c['cell'][1:]]  # fallback
            nn = line[k]
            st['arp'].add(pluck(hz(m(nn)), 0.55 if k == 0 else 0.45, decay=0.38, bright=0.35, pick=0.27), bt(bb) + jitter(2), pan=-0.5, gain=0.55)
        b += 2.0
    # pluck chord strum on the climax
    for k, nn in enumerate(['C4', 'E4', 'G4', 'B4', 'D5']):
        st['arp'].add(pluck(hz(m(nn)), 0.5, decay=0.9, bright=0.6), bt(B_CLIMAX) + 0.012 * k, pan=-0.4 + 0.2 * k, gain=0.5)

    # ── bass: plucky 8ths from the drum entry to the climax, then held notes ──
    oct_pat = [0, 0, 12, 0, 0, 12, 0, 12]
    vel_pat = [1.0, 0.62, 0.85, 0.6, 0.92, 0.62, 0.85, 0.66]
    b = float(B_DRUMS)
    while b < B_CLIMAX - 1e-6:
        ci = chord_index(b)
        k = int(round((b - CHART[ci]['b']) * 2))
        root = m(CHART[ci]['bass'])
        st['bass'].add(bass_pluck(hz(root + oct_pat[k % 8]), vel_pat[k % 8], BEAT * 0.5 * 0.85), bt(b), gain=0.55)
        b += 0.5
    st['bass'].add(sub_note(hz(m('C2')), 0.7, bt(B_CLIMAX + 2) - bt(B_CLIMAX)), bt(B_CLIMAX) + 0.004, gain=0.55)
    st['bass'].add(bass_pluck(hz(m('C3')), 0.55, BEAT * 0.4), bt(B_CLIMAX + 1.5), gain=0.5)
    st['bass'].add(sub_note(hz(m('C2')), 0.5, bt(END_BEAT) - bt(B_FINAL), release=0.8), bt(B_FINAL), gain=0.55)

    # ── drums ──
    kick_beats = [(6, 1.0), (8, 0.9), (10, 0.9), (12, 0.9), (14, 0.9), (15.5, 0.6)]
    kick_beats += [(bb, 0.92 if bb % 2 == 0 else 0.85) for bb in range(B_BUILD, B_PRICE)]
    kick_beats += [(24, 0.95), (25, 0.9), (25.5, 0.7), (26, 0.85), (27, 1.0), (28, 0.66), (29, 0.42)]
    for bb, v in kick_beats:
        st['kick'].add(kick(v), bt(bb), gain=0.85)
        kicks.append((bt(bb), v))
    clap_beats = [(6, 0.8)] + [(bb, 0.75) for bb in range(7, 16, 2)] + [(bb, 0.8) for bb in range(17, 24, 2)]
    clap_beats += [(25, 0.85), (27, 0.9), (29, 0.4)]
    for bb, v in clap_beats:
        st['clap'].add(clap(v), bt(bb) + 0.003, pan=0.05, gain=0.5)
    hb = float(B_DRUMS)
    while hb < B_FINAL - 1e-6:
        frac = hb - np.floor(hb)
        if B_BUILD <= hb < B_CLIMAX:  # 16ths
            v = {0.0: 0.28, 0.25: 0.4, 0.5: 0.72, 0.75: 0.4}[round(frac * 4) / 4]
            if hb >= B_PRICE:
                v *= 1 + 0.15 * (hb - B_PRICE) / (B_CLIMAX - B_PRICE)
            step = 0.25
        else:  # off-beat 8ths
            v = (0.62 if int(hb) % 2 else 0.55) if abs(frac - 0.5) < 1e-6 else 0.0
            if hb >= B_CLIMAX:
                v *= 1 - 0.5 * (hb - B_CLIMAX) / (B_FINAL - B_CLIMAX)
            step = 0.5
        if v > 0:
            st['hat'].add(hat(v, 0.03 if abs(frac - 0.5) < 1e-6 else 0.022), bt(hb) + jitter(1), pan=0.28, gain=0.5)
        hb += step
    for bb, nn, v in [(26.5, 'D3', 0.7), (26.75, 'A2', 0.78)]:  # tonal tom fill into the climax
        st['tom'].add(tom(hz(m(nn)), v), bt(bb), pan=-0.15 if nn == 'D3' else 0.15, gain=0.6)

    return {k: v.x for k, v in st.items()}, kicks


# ════════════════════════════════════ SFX bus ════════════════════════════════════
def pick_tick_pitch(t: float, prev: int | None, in_run: bool) -> int:
    c = CHART[chord_index((t - OFFSET) / BEAT)]
    pcs = tone_pcs(c)
    cands = [k for k in range(m('E5'), m('A6') + 1) if k % 12 in pcs]
    if in_run and prev is not None:
        up = [k for k in cands if k > prev]
        return up[0] if up else cands[-1]
    if in_run:
        return cands[0]
    return min(cands, key=lambda k: abs(k - m('A5')))


# Counter easing comes from data.ts (COUNTERS, exported to cues.json) so the note runs land on the
# exact frames where the on-screen digits change (Ticket.tsx / Price.tsx use the same formulas).
COUNTERS = CUES['counters']
ODOMETER_FADE_FRAMES = COUNTERS['fadeFrames']


def counter_curve(fr: dict):
    """(easing, end frame) of the on-screen counter that a cues.rises window belongs to."""
    ev = CUES['events']
    if fr['from'] == ev['counters']['from'] and fr['to'] == ev['counters']['to']:
        return (lambda u: COUNTERS['ticketEase']['a'] * u + COUNTERS['ticketEase']['b'] * (1 - (1 - u) ** 2)), fr['to'] - (ODOMETER_FADE_FRAMES - 1)
    if fr['from'] == ev['priceCount']['from'] and fr['to'] == ev['priceCount']['to']:
        return (lambda u: COUNTERS['priceEase']['a'] * u + COUNTERS['priceEase']['b'] * (1 - (1 - u) ** 3)), fr['to']
    return (lambda u: 1 - (1 - u) ** 3), fr['to']  # generic ease-out-cubic


def counter_run(fr: dict) -> list[tuple[float, int]]:
    """Note i of `steps` sounds when the on-screen counter's eased value reaches i/steps (the last one on
    the landing frame). Pitches: C-major pentatonic, rising, ending on a chord tone of the chord that
    sounds when the counter stops."""
    ease, end_frame = counter_curve(fr)
    t0, t1, steps = fr['from'] / FPS, end_frame / FPS, fr['steps']
    penta = {0, 2, 4, 7, 9}
    end_pcs = tone_pcs(CHART[chord_index(f2beat(end_frame))]) & penta
    cap = m('E6') if steps <= 8 else m('G6')
    top = max(k for k in range(m('C5'), cap + 1) if k % 12 in end_pcs)
    scale = [k for k in range(m('C3'), top + 1) if k % 12 in penta][-steps:]
    out = []
    for i in range(1, steps + 1):
        lo, hi = 0.0, 1.0  # invert the (monotonic) easing by bisection
        for _ in range(40):
            mid = 0.5 * (lo + hi)
            lo, hi = (mid, hi) if ease(mid) < i / steps else (lo, mid)
        out.append((t0 + hi * (t1 - t0), scale[i - 1]))
    return out


def build_sfx(ir: np.ndarray) -> np.ndarray:
    """Tonal SFX (chimes, rise bells, glass stack) get the reverb send; the percussive stamp knocks are
    summed on a separate bus AFTER the send, so they stay completely dry (reverb on instruments only)."""
    fx = Bus('sfx')  # tonal: reverb send
    knocks = Bus('knock')  # percussive: dry, never reaches convolve_send
    ticks = [f / FPS for f in CUES['ticks']]
    prev = None
    for i, t in enumerate(ticks):
        in_run = (i > 0 and t - ticks[i - 1] < 1.0) or (i + 1 < len(ticks) and ticks[i + 1] - t < 1.0)
        first = in_run and not (i > 0 and t - ticks[i - 1] < 1.0)
        p = pick_tick_pitch(t, None if first else prev, in_run)
        prev = p
        sig = mix_mono(0.75 * bell(hz(p), 0.8, 0.38), 0.5 * pluck(hz(p), 0.7, decay=0.14, bright=0.8))
        fx.add(sig, t, pan=0.0, gain=0.6)
    for f in CUES['pops']:  # stamp knocks, tuned to the chord root
        root = min((k for k in range(m('G2'), m('F#3') + 1) if k % 12 == m(CHART[chord_index(f2beat(f))]['bass']) % 12))
        knocks.add(knock(hz(root), 0.9), f / FPS, pan=0.0, gain=0.9)
    for r in CUES['rises']:
        for k, (t, p) in enumerate(counter_run(r)):
            v = 0.45 + 0.4 * (k + 1) / r['steps']
            fx.add(bell(hz(p), v, 0.32), t, pan=-0.25 + 0.5 * (k + 1) / r['steps'], gain=0.5)
    for f in CUES['glass']:  # glass bell stack on the chord sounding at that frame
        c = CHART[chord_index(f2beat(f))]
        pcs = tone_pcs(c)
        stack = []
        for k in range(m('E6'), m('E7') + 1):  # chord tones, at least a minor third apart (no 2nds)
            if k % 12 in pcs and (not stack or k - stack[-1] >= 3) and len(stack) < 4:
                stack.append(k)
        for k, p in enumerate(stack):
            fx.add(bell(hz(p), 0.6 - 0.08 * k, 1.7, kind='glass', shimmer=3.1), f / FPS + 0.014 * k * (k + 1) / 2, pan=-0.3 + 0.2 * k, gain=0.5)
    dry = fx.x
    wet = convolve_send(dry, ir)
    return dry + 0.28 * wet + knocks.x


# ════════════════════════════════════ mix helpers ════════════════════════════════════
def duck_curve(kicks, depth_db: float, attack: float = 0.006, release: float = 0.15) -> np.ndarray:
    """Sidechain gain from kick times: raised-cosine dip of depth_db*vel, back to unity after `release`."""
    g_db = np.zeros(L)
    na, nr = int(attack * SR), int(release * SR)
    shape = np.concatenate([0.5 - 0.5 * np.cos(np.pi * np.arange(na) / na), 0.5 + 0.5 * np.cos(np.pi * np.arange(nr) / nr)])
    for t, v in kicks:
        i0 = int((t - attack) * SR)
        seg = -depth_db * v * shape
        i1 = min(L, i0 + len(seg))
        g_db[i0:i1] = np.minimum(g_db[i0:i1], seg[: i1 - i0])
    return 10 ** (g_db / 20)


def true_peak_db(x: np.ndarray) -> float:
    up = resample_poly(x, 4, 1, axis=0)
    return float(20 * np.log10(np.max(np.abs(up)) + 1e-12))


def lookahead_limiter(x: np.ndarray, ceiling_db: float, lookahead: float = 0.005, release: float = 0.12):
    """Smooth look-ahead peak limiter driven by a 4x-oversampled (true-peak) detector.
    Gain = sliding-minimum of the required gain over +-lookahead, slow exponential recovery, then two
    cascaded moving averages (total half-width = lookahead) so the gain glides down BEFORE each peak.
    The averaging window never exceeds the min-filter window, so the gain is always <= the requirement."""
    c = 10 ** (ceiling_db / 20)
    up = resample_poly(x, 4, 1, axis=0)
    peak = np.abs(up[: 4 * len(x)]).reshape(len(x), 4, 2).max(axis=(1, 2))
    peak = np.maximum(peak, np.abs(x).max(axis=1))
    need = np.minimum(1.0, c / np.maximum(peak, 1e-9))
    W = int(lookahead * SR)
    h = minimum_filter1d(need, size=2 * W + 1, mode='nearest')
    a = float(np.exp(-1.0 / (release * SR)))
    g = h.tolist()
    r = 0.0
    for i in range(len(g)):  # reduction may jump up (already looked ahead), recovers slowly
        r = max(1.0 - g[i], r * a)
        g[i] = 1.0 - r
    g = np.asarray(g)
    half = W // 2
    g = uniform_filter1d(g, size=2 * half + 1, mode='nearest')
    g = uniform_filter1d(g, size=2 * half + 1, mode='nearest')
    return x * g[:, None], g


def section_lufs(meter, x, a, b):
    seg = x[int(a * SR) : int(b * SR)]
    try:
        return round(float(meter.integrated_loudness(seg)), 2)
    except Exception:
        return None


def load_user_music():
    for rel in MUS.get('userMusic', []):
        p = os.path.normpath(os.path.join(ROOT, rel))
        if os.path.exists(p):
            raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                                 capture_output=True, check=True).stdout
            x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
            # arrange: if shorter than the reel, loop with a 0.5 s crossfade; then trim to the working length
            while len(x) < L:
                xf = int(0.5 * SR)
                ramp = np.linspace(0, 1, xf)[:, None]
                x = np.vstack([x[:-xf], x[-xf:] * (1 - ramp) + x[:xf] * ramp, x[xf:]])
            print('using user music:', rel)
            return x[:L], rel
    return None, None


# ════════════════════════════════════ main: mix + master ════════════════════════════════════
STEM_GAIN = {'piano': 1.0, 'pad': 1.1, 'bells': 0.9, 'arp': 0.9, 'bass': 0.6, 'kick': 0.55, 'clap': 0.75, 'hat': 0.8, 'tom': 0.6}
SEND = {'piano': 0.32, 'pad': 0.4, 'bells': 0.6, 'arp': 0.38}
WET_GAIN = 0.42
DUCK_DB = 3.5  # pad / sustained layers / reverb return
BASS_DUCK_DB = 5.0


def main():
    meter = pyln.Meter(SR)
    ir = fdn_ir()
    user, user_src = load_user_music()
    kicks = []
    stem_report = {}
    if user is None:
        stems, kicks = build_music()
        duck = duck_curve(kicks, DUCK_DB)[:, None]
        duck_light = duck_curve(kicks, DUCK_DB * 0.5)[:, None]
        duck_bass = duck_curve(kicks, BASS_DUCK_DB, release=0.12)[:, None]
        stems['pad'] = lp(hp(stems['pad'], 110), 3500) * duck
        stems['bells'] = hp(stems['bells'], 250)
        stems['arp'] = hp(stems['arp'], 160) * duck_light
        stems['piano'] = hp(stems['piano'], 45)
        stems['bass'] = stems['bass'] * duck_bass
        for k in stems:
            stems[k] = stems[k] * STEM_GAIN[k]
        send = sum(stems[k] * SEND[k] for k in SEND)
        stems['reverb'] = convolve_send(send, ir) * WET_GAIN * duck
        music = sum(stems.values())
        for k, v in stems.items():
            stem_report[k] = {s: section_lufs(meter, v, a, b) for s, (a, b) in {'0-3': (0, 3), '3-8.5': (3, 8.5), '8.5-13.5': (8.5, 13.5), '13.5-16': (13.5, 16), '16-18': (16, 18)}.items()}
    else:
        music = user
    music = music[:L]
    sfx = build_sfx(ir)[:L]

    # SFX bus sits SFX_BELOW_DB under the music bus (integrated loudness of each bus)
    lm = meter.integrated_loudness(music[:N])
    ls = meter.integrated_loudness(sfx[:N])
    sfx *= 10 ** ((lm - SFX_BELOW_DB - ls) / 20)
    mix = (music + sfx)[:N]

    # master: 30 Hz high-pass (4th order), gentle 11 kHz low-pass (2nd order), fades
    mix = lp(hp(mix, 30, order=4), 11000, order=2)
    t = tvec(N)
    fade = ramp_in(t, FADE_IN)
    fo = np.clip((t - FADE_OUT_FROM) / (DUR - FADE_OUT_FROM), 0, 1)
    fade *= np.where(t > FADE_OUT_FROM, np.cos(0.5 * np.pi * fo) ** 1.6, 1.0)
    mix *= fade[:, None]

    # loudness normalisation with the true-peak limiter in the loop
    gain = 10 ** ((TARGET_LUFS - meter.integrated_loudness(mix)) / 20)
    ceiling = TP_CEILING_DB
    for _ in range(10):
        out, g = lookahead_limiter(mix * gain, ceiling)
        lo = meter.integrated_loudness(out)
        tp = true_peak_db(out)
        if tp > TP_CEILING_DB + 0.02:
            ceiling -= tp - TP_CEILING_DB + 0.02
            continue
        if abs(lo - TARGET_LUFS) < 0.03:
            break
        gain *= 10 ** ((TARGET_LUFS - lo) / 20)
    out *= fade[:, None]  # keep the fade edges exact after limiting (gain <= 1 so peaks cannot rise)
    tp = true_peak_db(out)
    if tp > TP_CEILING_DB:  # safety net, normally never reached
        out *= 10 ** ((TP_CEILING_DB - tp) / 20)
    gr_db = float(-20 * np.log10(g.min()))

    path = os.path.join(ROOT, 'public', 'audio', 'soundtrack.wav')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wavfile.write(path, SR, out.astype(np.float32))

    lm2 = meter.integrated_loudness(music[:N])
    ls2 = meter.integrated_loudness(sfx[:N])
    mixinfo = {
        'music_source': user_src or 'generated (sine-based synthesis, scripts/make_audio.py)',
        'bpm': BPM,
        'beat_times_s': {str(b): round(bt(b), 3) for b in (B_DRUMS, B_BUILD, B_PRICE, B_CLIMAX, B_FINAL)},
        'sfx_vs_music_db': round(ls2 - lm2, 2),
        'limiter_max_gain_reduction_db': round(gr_db, 2),
        'limiter_ms_above_1db_gr': round(float(np.sum(g < 10 ** (-1 / 20))) / SR * 1000, 1),
        'limiter_gr_db_per_half_second': [round(max(0.0, float(-20 * np.log10(g[i : i + SR // 2].min()))), 1) for i in range(0, N, SR // 2)],
        'sidechain_depth_db': DUCK_DB,
        'reverb': {'type': 'FDN 16 lines (deterministic IR, convolved), instruments only',
                   'music_send': sorted(SEND), 'sfx_send': ['tick chimes', 'rise bells', 'glass stack'], 'dry': ['kick', 'clap', 'hat', 'tom', 'bass', 'stamp knocks'],
                   'rt60_s_500hz': round(rt60_of(ir, (357, 700)), 2), 'rt60_s_1khz': round(rt60_of(ir, (714, 1400)), 2),
                   'rt60_s_broadband': round(rt60_of(ir), 2), 'rt60_s_5khz': round(rt60_of(ir, (3570, 7000)), 2)},
        'integrated_lufs': round(float(meter.integrated_loudness(out)), 2),
        'true_peak_dbtp': round(true_peak_db(out), 2),
        'stems_lufs_by_section': stem_report,
    }
    rep_path = os.path.join(HERE, 'audio_report.json')
    rep = {}
    if os.path.exists(rep_path):
        try:
            rep = json.load(open(rep_path))
        except Exception:
            rep = {}
    rep['mix'] = mixinfo
    json.dump(rep, open(rep_path, 'w'), indent=2)
    for k, v in mixinfo.items():
        if k != 'stems_lufs_by_section':
            print(f'{k:32s} {json.dumps(v)}')
    print('stem loudness by section (pre-master LUFS):')
    for k, v in stem_report.items():
        print(f'  {k:7s}', v)


if __name__ == '__main__':
    main()
