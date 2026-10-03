// Synthesises the full 20 s soundtrack for Reel2 (music + sound design) into assets/audio/reel2-score.wav.
// Everything is timed to 120 BPM (beat = 0.5 s) so each hit lands on a cut in reels/src/reels/Reel2.tsx.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'content/reel2.json'), 'utf8'));
const SR = 44100, DUR = cfg.duration, N = SR * DUR, BEAT = 60 / cfg.bpm;
const S = cfg.scenes;

const L = new Float32Array(N), R = new Float32Array(N);       // dry bus
const revL = new Float32Array(N), revR = new Float32Array(N); // reverb send
const musL = new Float32Array(N), musR = new Float32Array(N); // ducked bus (pads/bass/arp)

let seed = 12345;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const TAU = Math.PI * 2;
const idx = (t) => Math.floor(t * SR);

// state-variable filter step (Chamberlin). f = 2 sin(pi fc / SR), d = 1 / Q
const svf = () => { let lo = 0, bd = 0; return (x, fc, d = 1) => { const f = 2 * Math.sin(Math.PI * Math.min(fc, 7000) / SR); lo += f * bd; const hi = x - lo - d * bd; bd += f * hi; return {lo, bd, hi}; }; };

/** write mono generator output into the stereo buses */
const put = (t0, dur, gen, {pan = 0, gain = 1, send = 0, bus = 'dry'} = {}) => {
  const a = Math.cos(((pan + 1) * Math.PI) / 4), b = Math.sin(((pan + 1) * Math.PI) / 4);
  const n = Math.floor(dur * SR), s0 = idx(t0);
  for (let i = 0; i < n; i++) {
    const k = s0 + i; if (k < 0 || k >= N) continue;
    const v = gen(i / SR, i) * gain;
    if (bus === 'mus') { musL[k] += v * a; musR[k] += v * b; } else { L[k] += v * a; R[k] += v * b; }
    if (send) { revL[k] += v * a * send; revR[k] += v * b * send; }
  }
};

const kickTimes = [];
const kick = (t0, g = 1) => {
  kickTimes.push(t0);
  let ph = 0;
  put(t0, 0.5, (t) => {
    const f = 42 + 120 * Math.exp(-t * 32); ph += (TAU * f) / SR;
    return (Math.sin(ph) * Math.exp(-t * 7.5) * Math.min(1, t * 1500) + rnd() * Math.exp(-t * 400) * 0.35) * 0.95;
  }, {gain: g});
};
const clap = (t0, g = 1) => { const f = svf(); put(t0, 0.35, (t) => {
  const bursts = [0, 0.011, 0.023].reduce((s, o) => s + (t >= o ? Math.exp(-(t - o) * 90) : 0), 0);
  const e = bursts * 0.5 + Math.exp(-t * 16) * 0.55 * (t > 0.03 ? 1 : 0);
  return f(rnd(), 1700 + 400 * Math.sin(t * 40), 0.9).bd * e * 2.2;
}, {gain: 0.5 * g, pan: 0.05, send: 0.35}); };
const hat = (t0, open = false, g = 1, pan = 0.3) => { let p1 = 0, p2 = 0; put(t0, open ? 0.3 : 0.07, (t) => {
  const x = rnd(); const h = x - p1 + (p1 - p2) * 0.5; p2 = p1; p1 = x; return h * Math.exp(-t * (open ? 14 : 70)) * 0.55;
}, {gain: 0.32 * g, pan, send: open ? 0.25 : 0.08}); };
const whoosh = (t0, dur, {up = true, g = 1, panFrom = -0.8, panTo = 0.8} = {}) => {
  const f = svf(); let ph = 0;
  const n = Math.floor(dur * SR), s0 = idx(t0);
  for (let i = 0; i < n; i++) {
    const k = s0 + i; if (k < 0 || k >= N) continue;
    const u = i / n, c = up ? u : 1 - u;
    const env = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 1.5);
    const fc = 350 * Math.pow(16, c);
    const v = f(rnd(), fc, 0.55).bd * env * 1.6 * g;
    const pan = panFrom + (panTo - panFrom) * u, a = Math.cos(((pan + 1) * Math.PI) / 4), b = Math.sin(((pan + 1) * Math.PI) / 4);
    L[k] += v * a * 0.5; R[k] += v * b * 0.5; revL[k] += v * a * 0.25; revR[k] += v * b * 0.25;
    ph += 0;
  }
};
const riser = (t0, t1, g = 1) => {
  const dur = t1 - t0, f = svf(); let ph = 0;
  put(t0, dur, (t) => {
    const u = t / dur, fc = 250 * Math.pow(26, u);
    ph += (TAU * (180 * Math.pow(9, u))) / SR;
    return (f(rnd(), fc, 0.5).bd * 1.4 + Math.sin(ph) * 0.12 * u) * Math.pow(u, 2.2);
  }, {gain: 0.55 * g, send: 0.3});
};
const revCymbal = (t0, t1, g = 1) => { const dur = t1 - t0; let p1 = 0; put(t0, dur, (t) => {
  const u = t / dur, x = rnd(), h = x - p1; p1 = x; return h * Math.pow(u, 3) * 0.7; }, {gain: 0.55 * g, send: 0.4}); };
const impact = (t0, g = 1) => {
  let ph = 0; const f = svf();
  put(t0, 2.6, (t) => {
    ph += (TAU * (26 + 50 * Math.exp(-t * 3.2))) / SR;
    const boom = Math.sin(ph) * Math.exp(-t * 1.9);
    const body = f(rnd(), 500 * Math.exp(-t * 2), 0.8).lo * Math.exp(-t * 5.5) * 0.9;
    return boom * 1.05 + body + rnd() * Math.exp(-t * 60) * 0.5;
  }, {gain: 0.8 * g, send: 0.55});
};
const bell = (t0, f0, g = 1, pan = 0) => {
  const parts = [[1, 1, 3.2], [2.76, 0.5, 4.5], [5.4, 0.22, 6.5], [8.93, 0.1, 9]];
  put(t0, 3.4, (t) => parts.reduce((s, [r, a, d]) => s + Math.sin(TAU * f0 * r * t) * a * Math.exp(-t * d), 0) * Math.min(1, t * 800),
    {gain: 0.16 * g, pan, send: 0.6});
};
const pluck = (t0, fq, g = 1, pan = 0) => { const f = svf(); put(t0, 0.4, (t) => {
  const e = Math.exp(-t * 13) * Math.min(1, t * 900);
  const x = (Math.sin(TAU * fq * t) + 0.5 * Math.sin(TAU * fq * 2 * t) * Math.exp(-t * 20) + 0.25 * ((fq * t) % 1 * 2 - 1)) * e;
  return f(x, 1500 + 3500 * Math.exp(-t * 10), 1).lo;
}, {gain: 0.32 * g, pan, send: 0.4, bus: 'mus'}); };
const pop = (t0, f0 = 480, g = 1, pan = 0) => { let ph = 0; put(t0, 0.15, (t) => {
  ph += (TAU * (f0 * (1 + 1.8 * Math.min(1, t * 22)))) / SR; return Math.sin(ph) * Math.exp(-t * 28);
}, {gain: 0.5 * g, pan, send: 0.3}); };
const tick = (t0, g = 1, pan = 0) => put(t0, 0.06, (t) => Math.sin(TAU * 3100 * t) * Math.exp(-t * 130), {gain: 0.28 * g, pan, send: 0.2});
const bass = (t0, dur, fq, g = 1) => { const f = svf(); let ph = 0; put(t0, dur, (t) => {
  ph += (TAU * fq) / SR; const saw = (ph / TAU) % 1 * 2 - 1;
  const e = Math.min(1, t * 120) * Math.exp(-t * 3.2);
  return (Math.sin(ph) * 0.9 + f(saw, 260 + 600 * Math.exp(-t * 9), 0.9).lo * 0.7) * e;
}, {gain: 0.55 * g, bus: 'mus', send: 0.05}); };
const pad = (t0, dur, freqs, g = 1) => freqs.forEach((fq, j) => {
  const f = svf();
  [-8, 0, 8].forEach((cents, k) => {
    let ph = 0; const r = Math.pow(2, cents / 1200);
    put(t0, dur, (t) => {
      ph += (TAU * fq * r) / SR; const saw = (ph / TAU) % 1 * 2 - 1;
      const env = Math.min(1, t / 0.7) * Math.min(1, (dur - t) / 0.7);
      return f(saw, 500 + 900 * Math.min(1, t / dur), 0.9).lo * env;
    }, {gain: 0.05 * g, pan: (j - 1) * 0.35 + (k - 1) * 0.15, bus: 'mus', send: 0.35});
  });
});

// ── arrangement ────────────────────────────────────────────────────────────────
const b = (n) => n * BEAT; // beats → seconds
const chords = {Am: [110, 130.81, 164.81, 220], F: [87.31, 130.81, 174.61, 220], C: [130.81, 164.81, 196, 261.63], G: [98, 146.83, 196, 246.94]};
const roots = {Am: 55, F: 43.65 * 2, C: 65.41 * 2, G: 49 * 2};
const prog4 = ['Am', 'F', 'C', 'G'];

// intro (0–2): riser, sparkle build, logo lock chime, impact + first kick on the 2.0 s cut
riser(0, S.type[0], 1);
revCymbal(0.9, S.type[0], 0.9);
[0.15, 0.55, 0.85, 1.15].forEach((t, i) => tick(t, 0.7, i % 2 ? 0.5 : -0.5));
whoosh(0.2, 0.9, {up: true, g: 0.9});
[880, 1318.5, 1760].forEach((f, i) => bell(1.15 + i * 0.07, f, 0.9, (i - 1) * 0.5));
pad(0, 2, chords.Am, 0.8);
impact(S.type[0], 1);

// 2.0–17.0 groove
for (let t = S.type[0]; t < 16.5; t += BEAT) kick(t, 1);
for (let t = S.type[0] + BEAT; t < 16.5; t += BEAT * 2) clap(t, 1);
for (let t = S.type[0] + BEAT / 2; t < 16.5; t += BEAT) hat(t, t % 1 > 0.4, 1);
for (let t = S.info[0]; t < 16.5; t += BEAT / 2) hat(t + BEAT / 4, false, 0.55, -0.3);
for (let t = S.burst[0]; t < 16.5; t += BEAT / 2) hat(t + BEAT / 4, false, 0.6, 0.4);

// chords + bass (bars of 2 s from 2.0)
for (let bar = 0, t = S.type[0]; t < 17; bar++, t += 4 * BEAT) {
  const c = prog4[bar % 4], len = Math.min(4 * BEAT, 17 - t);
  pad(t, len + 0.1, chords[c], 1);
  if (t >= S.type[0]) for (let k = 0; k < 8; k++) {
    const tt = t + k * (BEAT / 2);
    if (tt >= 16.5) break;
    const on = [0, 2, 3, 4, 6, 7].includes(k) || t >= S.info[0];
    if (on && (t >= S.info[0] || k % 2 === 0)) bass(tt + BEAT / 4 * 0, BEAT / 2, roots[c] * (k === 3 || k === 7 ? 2 : 1), t >= S.info[0] ? 1 : 0.8);
  }
}

// scene-1 tick pattern for info nodes (ui pops on each node)
[6.17, 7.17, 8.17, 9.17].forEach((t, i) => { pop(t, 420 + i * 70, 1, i % 2 ? 0.45 : -0.45); tick(t + 0.18, 0.7); });

// route scene: arpeggio + plane/ship passes
const arp = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63];
for (let t = S.route[0], k = 0; t < S.burst[0]; t += BEAT / 2, k++) pluck(t, arp[k % arp.length] * (k % 16 > 7 ? 2 : 1), 0.9, Math.sin(k) * 0.5);
whoosh(11.33, 1.7, {up: true, g: 1, panFrom: 0.8, panTo: -0.8});
whoosh(12.6, 1.4, {up: false, g: 0.8, panFrom: -0.6, panTo: 0.6});
[12.0, 12.5].forEach((t, i) => impact(t, 0.35 + i * 0.1));

// transitions: whoosh + riser into each cut
[S.info[0], S.route[0], S.burst[0]].forEach((t) => { whoosh(t - 0.45, 0.6, {up: true, g: 1.1}); impact(t, t === S.info[0] ? 0.55 : 0.7); });
riser(5.0, 6.0, 0.6); riser(9.0, 10.0, 0.6); riser(13.0, 14.0, 0.75);
// typography slams (one per beat, scene 2)
for (let i = 0; i < 8; i++) { const t = S.type[0] + i * BEAT; tick(t, 0.5, i % 2 ? 0.4 : -0.4); if (i < 5) whoosh(t - 0.12, 0.25, {up: i % 2 === 0, g: 0.6}); }
// burst scene: snare roll accelerates into the drop
[14, 14.5, 15, 15.5].forEach((t) => clap(t + BEAT, 0.7));
for (let t = 15.5; t < 16.5; t += 0.125) clap(t, 0.5 + (t - 15.5) * 0.9);
revCymbal(15.4, S.end[0], 1);
// quick crossfade cut-out then the drop
whoosh(16.5, 0.5, {up: false, g: 1.1});
impact(S.end[0], 1.25);
kick(S.end[0], 1.1);
[880, 1318.5, 1760, 2093].forEach((f, i) => bell(S.end[0] + 0.12 + i * 0.16, f, 1.2, (i % 2 ? 1 : -1) * 0.5));
pad(S.end[0], 3.2, chords.Am, 1.4);
bell(S.end[0] + 1.1, 1760, 0.8, 0.3); bell(S.end[0] + 1.9, 1318.5, 0.7, -0.3);
whoosh(S.end[0] + 0.3, 1.0, {up: true, g: 0.55});

// ── reverb (Schroeder: 4 combs + 2 all-pass per channel) ───────────────────────
const reverb = (inp, delays) => {
  const out = new Float32Array(N);
  delays.comb.forEach(([ms, fb]) => {
    const d = Math.floor((ms / 1000) * SR), buf = new Float32Array(d); let p = 0, lp = 0;
    for (let i = 0; i < N; i++) { const y = buf[p]; lp += 0.35 * (y - lp); buf[p] = inp[i] + lp * fb; out[i] += y * 0.25; p = (p + 1) % d; }
  });
  delays.ap.forEach((ms) => {
    const d = Math.floor((ms / 1000) * SR), buf = new Float32Array(d); let p = 0;
    for (let i = 0; i < N; i++) { const y = buf[p], x = out[i]; buf[p] = x + y * 0.5; out[i] = y - x * 0.5; p = (p + 1) % d; }
  });
  return out;
};
const wetL = reverb(revL, {comb: [[29.7, 0.82], [37.1, 0.8], [41.1, 0.79], [43.7, 0.77]].map(([m, f]) => [m * 1.8, f + 0.06]), ap: [5, 1.7]});
const wetR = reverb(revR, {comb: [[31.1, 0.82], [35.3, 0.8], [40.3, 0.79], [46.3, 0.77]].map(([m, f]) => [m * 1.8, f + 0.06]), ap: [5.3, 1.9]});

// ── mix: sidechain duck on music bus, reverb, master ───────────────────────────
const duck = new Float32Array(N).fill(1);
for (const kt of kickTimes) { const s = idx(kt); for (let i = 0; i < SR * 0.4 && s + i < N; i++) duck[s + i] = Math.min(duck[s + i], 1 - 0.7 * Math.exp(-(i / SR) / 0.11)); }
const out = [new Float32Array(N), new Float32Array(N)];
for (let i = 0; i < N; i++) {
  const t = i / SR;
  // pre-drop vacuum: dip everything except fx between 16.5 and 17.0
  const vac = t > 16.5 && t < S.end[0] ? 0.0 : 1;
  const l = (L[i] + musL[i] * duck[i] * vac + wetL[i] * 0.42);
  const r = (R[i] + musR[i] * duck[i] * vac + wetR[i] * 0.42);
  const fade = Math.min(1, t / 0.03) * Math.min(1, (DUR - t) / 0.9);
  out[0][i] = Math.tanh(l * 0.6) * fade; out[1][i] = Math.tanh(r * 0.6) * fade;
}
let peak = 0; for (const c of out) for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(c[i]));
const norm = 0.8 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(out[0][i] * norm * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(out[1][i] * norm * 32767), 46 + i * 4); }
const file = path.join(root, 'assets/audio/reel2-score.wav');
fs.writeFileSync(file, buf);
console.log('score written', file, 'peak gain', norm.toFixed(2));
