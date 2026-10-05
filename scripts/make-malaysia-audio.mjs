// Synthesises the Malaysia reel's music bed and SFX (no samples, no licences needed).
// Output: assets/malaysia/audio/{music,whoosh,whoosh-soft,tick,shimmer,pop}.wav
//   node scripts/make-malaysia-audio.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/malaysia/audio');
fs.mkdirSync(dir, {recursive: true});
const SR = 44100;
const TAU = Math.PI * 2;

// ── utils ───────────────────────────────────────────────────────────────
let seed = 12345;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 4294967296) * 2 - 1;
};
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const writeWav = (name, L, R = L) => {
  const n = L.length;
  let peak = 1e-9;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0.98 ? 0.98 / peak : 1;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32000), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32000), 46 + i * 4);
  }
  fs.writeFileSync(path.join(dir, name), buf);
  console.log('wrote', name, (n / SR).toFixed(2) + 's', 'peak', peak.toFixed(2));
};

/** Freeverb-style stereo reverb (8 combs + 4 allpasses per side). */
const reverb = (inL, inR, {room = 0.84, damp = 0.35, wet = 0.3} = {}) => {
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const apT = [556, 441, 341, 225];
  const side = (input, spread) => {
    const out = new Float32Array(input.length);
    const combs = combT.map((t) => ({b: new Float32Array(t + spread), i: 0, s: 0}));
    const aps = apT.map((t) => ({b: new Float32Array(t + spread), i: 0}));
    for (let n = 0; n < input.length; n++) {
      const x = input[n] * 0.015;
      let y = 0;
      for (const c of combs) {
        const o = c.b[c.i];
        c.s = o * (1 - damp) + c.s * damp;
        c.b[c.i] = x + c.s * room;
        c.i = (c.i + 1) % c.b.length;
        y += o;
      }
      for (const a of aps) {
        const o = a.b[a.i];
        a.b[a.i] = y + o * 0.5;
        a.i = (a.i + 1) % a.b.length;
        y = o - y;
      }
      out[n] = y;
    }
    return out;
  };
  const rl = side(inL, 0), rr = side(inR, 23);
  const L = new Float32Array(inL.length), R = new Float32Array(inL.length);
  for (let i = 0; i < inL.length; i++) {
    L[i] = inL[i] * (1 - wet * 0.5) + rl[i] * wet * 3;
    R[i] = inR[i] * (1 - wet * 0.5) + rr[i] * wet * 3;
  }
  return [L, R];
};

/** One-pole low-pass / high-pass helpers (in place). */
const lowpass = (x, fc) => {
  const a = 1 - Math.exp((-TAU * fc) / SR);
  let s = 0;
  for (let i = 0; i < x.length; i++) x[i] = s += a * (x[i] - s);
  return x;
};
const highpass = (x, fc) => {
  const a = 1 - Math.exp((-TAU * fc) / SR);
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    s += a * (x[i] - s);
    x[i] = x[i] - s;
  }
  return x;
};

// ── music ───────────────────────────────────────────────────────────────
const DUR = 18;
const N = DUR * SR;
const dryL = new Float32Array(N), dryR = new Float32Array(N); // goes to reverb
const drL = new Float32Array(N), drR = new Float32Array(N); // drums, mostly dry
const add = (bufL, bufR, i, v, pan = 0) => {
  if (i < 0 || i >= N) return;
  bufL[i] += v * Math.cos((pan + 1) * Math.PI / 4);
  bufR[i] += v * Math.sin((pan + 1) * Math.PI / 4);
};

// chords (MIDI) — warm D major colours; one chord per 2 s
const CH = {
  Dmaj9: [50, 57, 61, 64, 66],
  Bm11: [47, 54, 57, 62, 64],
  Gmaj9: [43, 50, 54, 57, 62],
  A6sus: [45, 52, 57, 59, 62],
  DF: [42, 50, 57, 61, 64],
};
const prog = [
  [0, 'Dmaj9'], [2, 'Bm11'], [4, 'Gmaj9'], [6, 'A6sus'], [8, 'DF'], [10, 'Bm11'], [12, 'Gmaj9'], [14.55, 'A6sus'], [16.5, 'Dmaj9'],
];
const chordAt = (t) => {
  let c = prog[0][1];
  for (const [s, n] of prog) if (t >= s) c = n;
  return CH[c];
};

// pad: band-limited saws, 2 detuned voices per note, slow swell, per-chord crossfade
for (let k = 0; k < prog.length; k++) {
  const [start, name] = prog[k];
  const end = k + 1 < prog.length ? prog[k + 1][0] : DUR;
  const notes = CH[name];
  const s0 = Math.floor(Math.max(0, start - 0.15) * SR), s1 = Math.min(N, Math.floor((end + 0.6) * SR));
  notes.forEach((m, ni) => {
    for (const det of [-0.07, 0.07]) {
      const f0 = mtof(m + 12) * Math.pow(2, det / 12);
      const pan = (ni / (notes.length - 1) - 0.5) * 0.8 * Math.sign(det);
      for (let i = s0; i < s1; i++) {
        const t = i / SR;
        const local = t - start;
        const att = Math.min(1, Math.max(0, (local + 0.15) / 0.7));
        const rel = t > end ? Math.max(0, 1 - (t - end) / 0.6) : 1;
        let v = 0;
        for (let h = 1; h <= 6; h++) v += Math.sin(TAU * f0 * h * t + h) / (h * h * 0.8 + 0.2);
        const swell = 0.75 + 0.25 * Math.sin(TAU * 0.2 * t + ni);
        add(dryL, dryR, i, v * 0.012 * att * rel * swell, pan);
      }
    }
  });
}

// sub bass following the chord roots (from 3 s)
for (let i = Math.floor(3 * SR); i < N; i++) {
  const t = i / SR;
  const root = chordAt(t)[0] - 12;
  const beatPos = (t * 2) % 1; // 8th pulse at 120 bpm
  const env = t < 8.5 ? 0.6 : 0.6 + 0.4 * Math.exp(-beatPos * 6);
  const fade = Math.min(1, (t - 3) / 1.5);
  const v = Math.sin(TAU * mtof(root) * t) * 0.09 * env * fade;
  add(drL, drR, i, v, 0);
}

// pluck arpeggio (8ths from 0.5 s), rising register and velocity
const pluck = (t0, m, vel, pan) => {
  const f0 = mtof(m);
  const len = Math.floor(1.4 * SR);
  const s0 = Math.floor(t0 * SR);
  for (let j = 0; j < len; j++) {
    const t = j / SR;
    const env = Math.exp(-t * 5.5) * Math.min(1, t / 0.004);
    const v = (Math.sin(TAU * f0 * t) + 0.35 * Math.sin(TAU * 2 * f0 * t) * Math.exp(-t * 8) + 0.12 * Math.sin(TAU * 3.01 * f0 * t) * Math.exp(-t * 12)) * env;
    add(dryL, dryR, s0 + j, v * vel, pan);
  }
};
const arpOrder = [0, 2, 3, 4, 3, 2, 1, 3];
for (let step = 0; step * 0.25 < 17; step++) {
  const t = 0.5 + step * 0.25;
  if (t > 16.4 && t < 16.5) continue;
  const ch = chordAt(t);
  const m = ch[arpOrder[step % 8]] + 24 + (t > 8.5 ? 12 * (step % 16 === 15 ? 1 : 0) : 0);
  const vel = (0.05 + 0.05 * Math.min(1, t / 12)) * (step % 2 === 0 ? 1 : 0.75) * (t > 16.5 ? 0.7 : 1);
  pluck(t, m, vel, Math.sin(step * 1.3) * 0.45);
}

// bells at section changes
const bell = (t0, m, vel) => {
  const f0 = mtof(m);
  const s0 = Math.floor(t0 * SR);
  const partials = [[1, 1, 1.2], [2.76, 0.4, 2.2], [5.4, 0.2, 3.5], [8.93, 0.08, 5]];
  for (let j = 0; j < 3 * SR; j++) {
    const t = j / SR;
    let v = 0;
    for (const [r, a, d] of partials) v += Math.sin(TAU * f0 * r * t) * a * Math.exp(-t * d);
    add(dryL, dryR, s0 + j, v * vel * Math.min(1, t / 0.002), 0.2);
  }
};
[[0.05, 81], [0.3, 78], [3.0, 81], [6.0, 83], [9.0, 85], [14.6, 86], [15.78, 90], [16.5, 86], [16.75, 90], [17.0, 93]].forEach(([t, m], i) => bell(t, m, 0.05 + (i > 5 ? 0.02 : 0)));

// drums
const kick = (t0, vel) => {
  const s0 = Math.floor(t0 * SR);
  let ph = 0;
  for (let j = 0; j < 0.45 * SR; j++) {
    const t = j / SR;
    const f = 45 + 95 * Math.exp(-t * 30);
    ph += (TAU * f) / SR;
    add(drL, drR, s0 + j, Math.sin(ph) * Math.exp(-t * 7) * vel, 0);
  }
};
const hat = (t0, vel, pan) => {
  const s0 = Math.floor(t0 * SR);
  let prev = 0;
  for (let j = 0; j < 0.08 * SR; j++) {
    const t = j / SR;
    const nz = noise();
    const hp = nz - prev; prev = nz;
    add(drL, drR, s0 + j, hp * Math.exp(-t * 60) * vel, pan);
  }
};
const clap = (t0, vel) => {
  const s0 = Math.floor(t0 * SR);
  let lp = 0;
  for (let j = 0; j < 0.3 * SR; j++) {
    const t = j / SR;
    const nz = noise();
    lp += 0.35 * (nz - lp);
    const env = (Math.exp(-t * 18) + 0.6 * Math.exp(-Math.abs(t - 0.012) * 300) + 0.5 * Math.exp(-Math.abs(t - 0.024) * 300));
    const v = (nz - lp) * env * vel;
    add(drL, drR, s0 + j, v, 0.1);
    add(dryL, dryR, s0 + j, v * 0.4, 0.1);
  }
};
for (let b = 0; b * 0.5 < 18; b++) {
  const t = b * 0.5;
  const beat = b % 4;
  if (t >= 3 && t < 8.5 && (beat === 0 || beat === 2)) kick(t, 0.5);
  if (t >= 8.5 && t < 14.4) kick(t, 0.55);
  if (t >= 14.55 && t < 16.4 && beat % 2 === 0) kick(t + 0.05, 0.38);
  if (t >= 9 && t < 14.4 && (beat === 1 || beat === 3)) clap(t, 0.22);
}
for (let k = 0; k * 0.125 < 18; k++) {
  const t = k * 0.125;
  if (t >= 6 && t < 14.4) hat(t, (k % 2 ? 0.05 : 0.09) * Math.min(1, (t - 6) / 4), k % 2 ? 0.3 : -0.3);
  if (t >= 14.6 && t < 16.4 && k % 2 === 0) hat(t, 0.045, 0.3);
}
// snare roll riser 13.0 → 14.45
for (let t = 13.0; t < 14.45;) {
  const p = (t - 13.0) / 1.45;
  clap(t, 0.06 + 0.16 * p);
  t += 0.25 - 0.19 * p;
}
// noise riser + impact at the price
{
  const s0 = Math.floor(12.4 * SR), s1 = Math.floor(14.5 * SR);
  let lp = 0;
  for (let i = s0; i < s1; i++) {
    const p = (i - s0) / (s1 - s0);
    lp += (0.02 + 0.3 * p * p) * (noise() - lp);
    add(dryL, dryR, i, lp * 0.22 * p * p, Math.sin(p * 12) * 0.5);
  }
  const imp = Math.floor(14.55 * SR);
  let ph = 0;
  for (let j = 0; j < 1.6 * SR; j++) {
    const t = j / SR;
    ph += (TAU * (38 + 60 * Math.exp(-t * 14))) / SR;
    add(drL, drR, imp + j, Math.sin(ph) * Math.exp(-t * 2.6) * 0.75, 0);
    add(dryL, dryR, imp + j, noise() * Math.exp(-t * 9) * 0.08, 0);
  }
}

const [wL, wR] = reverb(dryL, dryR, {room: 0.86, damp: 0.3, wet: 0.32});
highpass(drL, 25); highpass(drR, 25);
const mL = new Float32Array(N), mR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fadeIn = Math.min(1, t / 0.25);
  const fadeOut = t > 17 ? Math.max(0, 1 - (t - 17)) : 1;
  const g = fadeIn * fadeOut * fadeOut;
  // gentle tanh glue
  mL[i] = Math.tanh((wL[i] + drL[i]) * 1.6) * g * 0.8;
  mR[i] = Math.tanh((wR[i] + drR[i]) * 1.6) * g * 0.8;
}
writeWav('music.wav', mL, mR);

// ── SFX ─────────────────────────────────────────────────────────────────
const whoosh = (name, dur, f1, f2, gain) => {
  const n = Math.floor(dur * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  let lp1 = 0, lp2 = 0, bp = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    const fc = f1 + (f2 - f1) * Math.sin(Math.PI * Math.pow(p, 0.8));
    const a = 1 - Math.exp((-TAU * fc) / SR);
    const nz = noise();
    lp1 += a * (nz - lp1);
    lp2 += a * 0.5 * (nz - lp2);
    bp = lp1 - lp2;
    const env = Math.pow(Math.sin(Math.PI * Math.pow(p, 0.7)), 2);
    const v = bp * env * gain;
    const pan = -0.7 + 1.4 * p;
    L[i] = v * Math.cos((pan + 1) * Math.PI / 4);
    R[i] = v * Math.sin((pan + 1) * Math.PI / 4);
  }
  const [rl, rr] = reverb(L, R, {room: 0.7, damp: 0.5, wet: 0.2});
  writeWav(name, rl, rr);
};
whoosh('whoosh.wav', 0.85, 250, 3200, 6);
whoosh('whoosh-soft.wav', 0.5, 400, 2200, 3.5);

{
  const n = Math.floor(0.06 * SR);
  const L = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    L[i] = (Math.sin(TAU * 2600 * t) * 0.6 + Math.sin(TAU * 4100 * t) * 0.3) * Math.exp(-t * 140) + noise() * Math.exp(-t * 400) * 0.25;
  }
  writeWav('tick.wav', L);
}
{
  const n = Math.floor(2.2 * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  [86, 90, 93, 98, 102].forEach((m, k) => {
    const f0 = mtof(m);
    const s0 = Math.floor(k * 0.055 * SR);
    for (let j = 0; s0 + j < n; j++) {
      const t = j / SR;
      const v = (Math.sin(TAU * f0 * t) + 0.3 * Math.sin(TAU * f0 * 2.76 * t) * Math.exp(-t * 4)) * Math.exp(-t * 2.4) * Math.min(1, t / 0.002) * 0.22;
      const pan = (k / 4 - 0.5) * 1.2;
      L[s0 + j] += v * Math.cos((pan + 1) * Math.PI / 4);
      R[s0 + j] += v * Math.sin((pan + 1) * Math.PI / 4);
    }
  });
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const sp = noise() * (noise() > 0.97 ? 1 : 0.05) * Math.exp(-t * 3) * 0.25;
    L[i] += sp; R[i] += sp * 0.8;
  }
  highpass(L, 600); highpass(R, 600);
  const [rl, rr] = reverb(L, R, {room: 0.85, damp: 0.25, wet: 0.35});
  writeWav('shimmer.wav', rl, rr);
}
{
  const n = Math.floor(0.28 * SR);
  const L = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (TAU * (380 + 600 * Math.exp(-t * 35))) / SR;
    L[i] = Math.sin(ph) * Math.exp(-t * 16) * 0.7;
  }
  lowpass(L, 5000);
  writeWav('pop.wav', L);
}
