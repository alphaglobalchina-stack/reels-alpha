// Synthesises the 30 s soundtrack for Reel3 into assets/audio/reel3-score.wav (44.1 kHz stereo).
// Music + sound design are generated together on one 120 BPM grid; every whoosh, click and hit
// is placed on a camera move or reveal in reels/src/reels/Reel3.tsx (camera keys mirrored below).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'content/reel3.json'), 'utf8'));
const SR = 44100, DUR = cfg.duration, N = Math.round(SR * DUR), BEAT = 60 / cfg.bpm;
const S = cfg.shots, HIT = cfg.logoHit, FIN = cfg.finalHit, CRANE = cfg.contactCrane;
const TAU = Math.PI * 2;

// ── buses ─────────────────────────────────────────────────────────────────────
const mk = () => [new Float32Array(N), new Float32Array(N)];
const sfx = mk(), mus = mk(), drm = mk(), rev = mk();
let seed = 987654321;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const r01 = () => (rnd() + 1) / 2;

/** Zavalishin TPT state-variable filter: stable up to Nyquist. */
const svf = () => {
  let ic1 = 0, ic2 = 0;
  return (x, fc, q = 0.707) => {
    const g = Math.tan((Math.PI * Math.min(fc, SR * 0.45)) / SR), k = 1 / q;
    const a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2;
    const v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
    return {lp: v2, bp: v1, hp: x - k * v1 - v2};
  };
};
const panLR = (p) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];

/** Render a mono or stereo voice. gen(t, i) returns a number or [l, r]. pan may be a function of u (0..1). */
const put = (bus, t0, dur, gen, {gain = 1, pan = 0, send = 0} = {}) => {
  const n = Math.floor(dur * SR), s0 = Math.floor(t0 * SR);
  for (let i = 0; i < n; i++) {
    const k = s0 + i;
    if (k < 0 || k >= N) continue;
    const v = gen(i / SR, i);
    let l, r;
    if (Array.isArray(v)) { l = v[0] * gain; r = v[1] * gain; }
    else {
      const [a, b] = panLR(typeof pan === 'function' ? pan(i / n) : pan);
      l = v * gain * a; r = v * gain * b;
    }
    bus[0][k] += l; bus[1][k] += r;
    if (send) { rev[0][k] += l * send; rev[1][k] += r * send; }
  }
};

// ── drums ─────────────────────────────────────────────────────────────────────
const kickTimes = [];
const kick = (t0, g = 1) => {
  kickTimes.push(t0);
  let ph = 0; const f = svf();
  put(drm, t0, 0.6, (t) => {
    const fr = 44 + 140 * Math.exp(-t * 38) + 30 * Math.exp(-t * 9);
    ph += (TAU * fr) / SR;
    const body = Math.sin(ph) * Math.exp(-t * 6.5) * Math.min(1, t * 2000);
    const click = f(rnd(), 3500, 0.8).bp * Math.exp(-t * 600) * 0.9;
    return Math.tanh((body * 1.25 + click) * 1.4) * 0.85;
  }, {gain: g});
};
const snare = (t0, g = 1) => {
  const f = svf(), f2 = svf(); let ph = 0;
  put(drm, t0, 0.45, (t) => {
    ph += (TAU * (210 - 40 * Math.min(1, t * 20))) / SR;
    const tone = Math.sin(ph) * Math.exp(-t * 28) * 0.55;
    const flam = [0, 0.009, 0.019].reduce((s, o) => s + (t >= o ? Math.exp(-(t - o) * 110) : 0), 0) * 0.35;
    const noise = f(rnd(), 1900, 0.7).bp * (Math.exp(-t * 17) + flam) * 1.6;
    const air = f2(rnd(), 7000, 0.7).hp * Math.exp(-t * 30) * 0.4;
    return tone + noise + air;
  }, {gain: 0.55 * g, pan: 0.04, send: 0.22});
};
const metal = [2, 3, 4.16, 5.43, 6.79, 8.21].map((r) => r * 300);
const hat = (t0, open = false, g = 1, pan = 0.25) => {
  const f = svf(); const ph = metal.map(() => r01());
  put(drm, t0, open ? 0.32 : 0.07, (t) => {
    let m = 0; for (let j = 0; j < metal.length; j++) m += ((((ph[j] + metal[j] * t) % 1) + 1) % 1 < 0.5 ? 1 : -1);
    const x = m * 0.12 + rnd() * 0.6;
    return f(x, 8500, 0.7).hp * Math.exp(-t * (open ? 13 : 75));
  }, {gain: 0.3 * g, pan, send: open ? 0.15 : 0.04});
};

// ── tonal ─────────────────────────────────────────────────────────────────────
const bass = (t0, dur, fq, g = 1) => {
  const f = svf(); let ph = 0;
  put(mus, t0, dur, (t) => {
    ph += (TAU * fq) / SR;
    const saw = (ph / TAU) % 1 * 2 - 1;
    const env = Math.min(1, t * 300) * Math.exp(-t * 2.6) * Math.min(1, (dur - t) * 60);
    return Math.tanh((Math.sin(ph) * 0.9 + f(saw, 180 + 900 * Math.exp(-t * 11), 1.1).lp * 0.8) * 1.6) * env;
  }, {gain: 0.5 * g, send: 0.03});
};
const pad = (t0, dur, freqs, g = 1, bright = 1) => freqs.forEach((fq, j) => {
  [-9, -3, 4, 10].forEach((cents, k) => {
    const f = svf(); let ph = r01() * TAU; const r = Math.pow(2, cents / 1200);
    put(mus, t0, dur, (t) => {
      ph += (TAU * fq * r) / SR;
      const saw = (ph / TAU) % 1 * 2 - 1;
      const env = Math.min(1, t / 0.8) * Math.min(1, (dur - t) / 0.8);
      return f(saw, (420 + 1100 * Math.min(1, t / dur)) * bright, 0.8).lp * env;
    }, {gain: 0.03 * g, pan: (u) => Math.sin(u * 3 + j + k) * 0.6, send: 0.4});
  });
});
const bell = (t0, f0, g = 1, pan = 0, decay = 1) => {
  const parts = [[1, 1, 2.6], [2.0, 0.45, 3.5], [2.76, 0.35, 4.4], [5.4, 0.16, 7], [8.93, 0.07, 9]];
  put(sfx, t0, 3.2 * decay, (t) => parts.reduce((s, [r, a, d]) => s + Math.sin(TAU * f0 * r * t) * a * Math.exp((-t * d) / decay), 0) * Math.min(1, t * 900),
    {gain: 0.13 * g, pan, send: 0.55});
};
const pluck = (t0, fq, g = 1, pan = 0) => {
  const f = svf();
  put(mus, t0, 0.5, (t) => {
    const x = Math.sin(TAU * fq * t) + 0.5 * Math.sin(TAU * fq * 2.001 * t) * Math.exp(-t * 18) + 0.3 * (((fq * t) % 1) * 2 - 1);
    return f(x, 900 + 4200 * Math.exp(-t * 14), 0.9).lp * Math.exp(-t * 9) * Math.min(1, t * 1200);
  }, {gain: 0.22 * g, pan, send: 0.35});
};

// ── sound design ─────────────────────────────────────────────────────────────
/** Air whoosh: two noise bands sweeping up then down, a sub "body", Doppler-ish pan travel. */
const whoosh = (t0, dur, {g = 1, panFrom = -0.7, panTo = 0.7, lo = 300, hi = 5200, peak = 0.55, body = 0.35} = {}) => {
  const f1 = svf(), f2 = svf(); let ph = 0;
  put(sfx, t0, dur, (t) => {
    const u = t / dur;
    const env = u < peak ? Math.pow(u / peak, 2.2) : Math.pow(1 - (u - peak) / (1 - peak), 1.6);
    const sweep = u < peak ? u / peak : 1 - (u - peak) / (1 - peak) * 0.6;
    const fc = lo * Math.pow(hi / lo, sweep);
    const n = rnd();
    const a = f1(n, fc, 1.4).bp * 1.6 + f2(n, fc * 2.4, 0.9).hp * 0.35;
    ph += (TAU * (70 + 50 * sweep)) / SR;
    return (a + Math.sin(ph) * body * Math.pow(env, 1.5)) * env;
  }, {gain: 0.55 * g, pan: (u) => panFrom + (panTo - panFrom) * u, send: 0.3});
};
/** Short fast pass-by for objects flying past the camera. */
const passby = (t0, side = 1, g = 1) => whoosh(t0 - 0.16, 0.34, {g: 0.7 * g, panFrom: side * 0.2, panTo: side * 0.95, lo: 600, hi: 7000, peak: 0.45, body: 0.15});

/** Cinematic hit: sub boom, chest thump, transient crack, inharmonic ring, all into the hall. */
const impact = (t0, g = 1, {sub = 1, ring = 1} = {}) => {
  let ph = 0; const f = svf(), f2 = svf();
  put(sfx, t0, 3.0, (t) => {
    ph += (TAU * (30 + 58 * Math.exp(-t * 4))) / SR;
    const boom = Math.sin(ph) * Math.exp(-t * 1.6) * sub * 1.1;
    const thump = f(rnd(), 160, 0.8).lp * Math.exp(-t * 9) * 2.4;
    const crack = f2(rnd(), 2600, 0.8).bp * Math.exp(-t * 70) * 1.4;
    const rg = (Math.sin(TAU * 311 * t) * 0.5 + Math.sin(TAU * 487 * t) * 0.35 + Math.sin(TAU * 733 * t) * 0.25) * Math.exp(-t * 2.4) * 0.22 * ring;
    return Math.tanh((boom + thump + crack + rg) * 1.2) * Math.min(1, t * 3000);
  }, {gain: 0.75 * g, send: 0.5});
};
/** Sub drop: a falling sine that lands a portal. */
const subDrop = (t0, g = 1) => { let ph = 0; put(sfx, t0, 1.2, (t) => { ph += (TAU * (85 * Math.exp(-t * 1.9) + 28)) / SR; return Math.sin(ph) * Math.exp(-t * 2.2) * Math.min(1, t * 400); }, {gain: 0.55 * g}); };
/** Riser: rising filtered noise + Shepard-style tones + accelerating tremolo. */
const riser = (t0, t1, g = 1) => {
  const dur = t1 - t0, f = svf(); const ph = [0, 0, 0];
  put(sfx, t0, dur, (t) => {
    const u = t / dur;
    const n = f(rnd(), 300 * Math.pow(30, u), 0.9).bp * 1.3;
    let tone = 0;
    for (let j = 0; j < 3; j++) {
      const oct = (u + j / 3) % 1;
      const fr = 110 * Math.pow(2, oct * 3);
      ph[j] += (TAU * fr) / SR;
      tone += Math.sin(ph[j]) * Math.sin(Math.PI * oct) * 0.18;
    }
    const trem = 0.75 + 0.25 * Math.sin(TAU * (2 + 14 * u * u) * t);
    return (n + tone) * Math.pow(u, 2.4) * trem;
  }, {gain: 0.5 * g, pan: (u) => Math.sin(u * 9) * 0.3, send: 0.35});
};
const swell = (t0, t1, g = 1) => { const dur = t1 - t0, f = svf(); put(sfx, t0, dur, (t) => f(rnd(), 9000, 0.7).hp * Math.pow(t / dur, 3.2), {gain: 0.6 * g, send: 0.45}); };
/** UI click: tiny bright transient with a pitched body. */
const click = (t0, g = 1, pan = 0, pitch = 1) => {
  const f = svf();
  put(sfx, t0, 0.07, (t) => (f(rnd(), 4200 * pitch, 1.2).bp * Math.exp(-t * 900) * 1.4 + Math.sin(TAU * 2300 * pitch * t) * Math.exp(-t * 160) * 0.45), {gain: 0.32 * g, pan, send: 0.12});
};
/** Soft "pop" for elements that land: rounded sine blip that bends up. */
const pop = (t0, f0 = 420, g = 1, pan = 0) => {
  let ph = 0;
  put(sfx, t0, 0.18, (t) => { ph += (TAU * f0 * (1 + 1.4 * (1 - Math.exp(-t * 40)))) / SR; return Math.sin(ph) * Math.exp(-t * 22) * Math.min(1, t * 600); }, {gain: 0.42 * g, pan, send: 0.22});
};
/** Card landing: low woody thud + paper tick. */
const land = (t0, g = 1, pan = 0) => {
  const f = svf(); let ph = 0;
  put(sfx, t0, 0.3, (t) => { ph += (TAU * (150 * Math.exp(-t * 18) + 80)) / SR; return Math.sin(ph) * Math.exp(-t * 20) * 0.9 + f(rnd(), 1400, 0.9).bp * Math.exp(-t * 80) * 0.6; }, {gain: 0.45 * g, pan, send: 0.18});
};
/** Granular sparkle: many tiny high grains, density following `dens(u)`. */
const sparkle = (t0, dur, dens, g = 1) => {
  const n = Math.floor(dur * 90);
  for (let i = 0; i < n; i++) {
    const u = i / n;
    if (r01() > dens(u)) continue;
    const t = t0 + u * dur + r01() * 0.01;
    const fr = [1760, 2093, 2349, 2637, 3136, 3520, 4186][Math.floor(r01() * 7)] * (r01() < 0.2 ? 2 : 1);
    const len = 0.05 + r01() * 0.18;
    put(sfx, t, len, (tt) => Math.sin(TAU * fr * tt) * Math.exp(-tt * (18 + r01())) * Math.min(1, tt * 2000), {gain: 0.05 * g * (0.4 + r01() * 0.6), pan: rnd() * 0.9, send: 0.6});
  }
};

// ── mirror of the shot-4 camera (to time tile pass-bys exactly) ────────────────
const hermite = (ts, vs, t) => {
  const n = ts.length;
  const sl = (i) => i <= 0 ? (vs[1] - vs[0]) / (ts[1] - ts[0]) : i >= n - 1 ? (vs[n - 1] - vs[n - 2]) / (ts[n - 1] - ts[n - 2]) : (vs[i + 1] - vs[i - 1]) / (ts[i + 1] - ts[i - 1]);
  if (t <= ts[0]) return vs[0] + sl(0) * (t - ts[0]);
  if (t >= ts[n - 1]) return vs[n - 1] + sl(n - 1) * (t - ts[n - 1]);
  let i = 0; while (t > ts[i + 1]) i++;
  const h = ts[i + 1] - ts[i], u = (t - ts[i]) / h, m0 = sl(i) * h, m1 = sl(i + 1) * h;
  return (2 * u ** 3 - 3 * u ** 2 + 1) * vs[i] + (u ** 3 - 2 * u ** 2 + u) * m0 + (-2 * u ** 3 + 3 * u ** 2) * vs[i + 1] + (u ** 3 - u ** 2) * m1;
};
const K4 = [[0, 1500], [0.9, 420], [1.3, -250], [3.0, -4300], [3.6, -4950], [4.0, -5800], [4.5, -6750], [5.0, -8350]];
const camZ4 = (t) => hermite(K4.map((k) => k[0]), K4.map((k) => k[1]), t);
/** Global time at which the shot-4 camera passes depth z (object reaches ~350 px from the eye). */
const passT = (z) => { for (let t = 0; t < 5; t += 0.002) if (z - camZ4(t) > 1600 - 350) return S.tunnel[0] + t; return null; };

// ══════════════════════════ arrangement ══════════════════════════
const chords = {Am: [110, 130.81, 164.81, 220], F: [87.31, 130.81, 174.61, 220], C: [130.81, 164.81, 196, 261.63], G: [98, 146.83, 196, 246.94]};
const roots = {Am: 55, F: 87.31, C: 65.41, G: 98};
const prog4 = ['Am', 'F', 'C', 'G'];
const G0 = 4.0, G1 = 24.5;
const quiet = (t) => t > 14.5 && t < 16.5; // breakdown while the About section opens

// 0–3 s · particles gather into the emblem
pad(0, 3.3, [55, 82.41, 110, 164.81], 1.3, 0.6);
sparkle(0.05, 2.9, (u) => 0.12 + 0.85 * u * u, 1.2);
riser(0.4, HIT, 0.95);
swell(2.0, HIT, 0.9);
impact(HIT, 1.25); kick(HIT, 0.8); subDrop(HIT, 0.8);
[880, 1318.5, 1760, 2637].forEach((f, i) => bell(HIT + 0.03 + i * 0.07, f, 0.9, (i - 1.5) * 0.4));
sparkle(HIT, 1.2, (u) => 0.6 * (1 - u), 0.9);

// 3–4.5 s · pull-back reveals the hero
whoosh(HIT + 0.05, 1.3, {g: 1.1, panFrom: 0.3, panTo: -0.3, lo: 220, hi: 2600, peak: 0.35, body: 0.5});
[3.45, 3.6, 3.725, 3.85, 3.95, 4.075, 4.2].forEach((t, i) => click(t, 0.9, i % 2 ? 0.3 : -0.3, 0.9 + i * 0.04));
[4.3, 4.45].forEach((t, i) => pop(t, 520 + i * 110, 1, i ? 0.25 : -0.25));

// 4–24.5 s · groove
for (let t = G0; t < G1 - 0.01; t += BEAT) kick(t, t < 5 ? 0.7 : quiet(t) ? 0.55 : 1);
for (let t = 5.0 + BEAT; t < G1 - 0.01; t += BEAT * 2) if (!quiet(t)) snare(t, 1);
for (let t = G0 + BEAT / 2; t < G1 - 0.01; t += BEAT) hat(t, Math.round(t * 2) % 4 === 3, 0.9);
for (let t = 9.5; t < G1 - 0.01; t += BEAT / 2) if (!quiet(t)) hat(t + BEAT / 4, false, 0.45, -0.35);
for (let t = 19.5; t < G1 - 0.01; t += BEAT / 4) hat(t, false, 0.25 + 0.2 * ((t * 8) % 2), 0.4);
for (let bar = 0, t = G0; t < G1 - 0.01; bar++, t += 4 * BEAT) {
  const c = prog4[bar % 4], len = Math.min(4 * BEAT, G1 - t);
  pad(t, len + 0.15, chords[c], 1, quiet(t + 0.5) ? 0.6 : 1);
  for (let k = 0; k < 8; k++) {
    const tt = t + k * BEAT / 2;
    if (tt >= G1 - 0.01 || quiet(tt)) continue;
    if (k % 2 === 0 || t >= 9.5) bass(tt, BEAT / 2 - 0.02, roots[c] * (k === 3 || k === 7 ? 2 : 1), t >= 9.5 ? 1 : 0.8);
  }
}
// tunnel arpeggio (A minor pentatonic) on 16ths
const arp = [440, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 523.25];
for (let t = 19.5, k = 0; t < 24.4; t += BEAT / 4, k++) pluck(t, arp[k % 8] * (k % 32 > 15 ? 1.5 : 1), 0.8, Math.sin(k * 0.9) * 0.6);

// hero chips assemble, then rush past the camera
[4.9, 5.45, 6.0, 6.55].forEach((t, i) => { pop(t, 440 + i * 70, 0.9, i % 2 ? 0.45 : -0.45); passby(t + 0.7, i % 2 ? 1 : -1, 0.9); });

// portals: riser, rush through, land on a sub drop + hit
[S.services[0], S.about[0], S.tunnel[0]].forEach((t0) => {
  riser(t0 - 0.9, t0 + 1.0, 0.8);
  whoosh(t0 + 0.05, 1.0, {g: 1.25, panFrom: -0.2, panTo: 0.2, lo: 250, hi: 6500, peak: 0.8, body: 0.6});
  impact(t0 + 1.0, 0.8, {ring: 0.6}); subDrop(t0 + 1.0, 0.8);
});

// services (shot-2 local 0 = 8.5)
const s2 = S.services[0];
[0.15, 0.27, 0.4, 0.52, 0.65].forEach((t, i) => click(s2 + t, 0.8, i % 2 ? 0.3 : -0.3, 1 + i * 0.05));
[0, 1, 2, 3].forEach((i) => land(s2 + 2.15 + i * 0.12 + 0.25, 0.9, (i - 1.5) * 0.4));
whoosh(s2 + 1.6, 1.1, {g: 0.9, panFrom: 0, panTo: 0, lo: 180, hi: 3000, peak: 0.6, body: 0.5}); // fly through the header into the box
[3.25, 4.15, 5.05].forEach((t, i) => whoosh(s2 + t - 0.4, 0.85, {g: 0.85, panFrom: 0.85, panTo: -0.85, lo: 400, hi: 3800, peak: 0.5}));
[3.7, 4.6, 5.5].forEach((t, i) => click(s2 + t, 0.6, 0, 0.8 + i * 0.1));

// about (shot-3 local 0 = 14.5)
const s3 = S.about[0];
pop(s3 + 0.95, 620, 0.9, 0.4);
[1.0, 1.15, 1.27, 1.4, 1.52, 1.6, 1.72].forEach((t, i) => click(s3 + t, 0.75, i % 2 ? 0.25 : -0.25, 0.95 + i * 0.03));
[0, 1, 2, 3].forEach((i) => land(s3 + 2.1 + i * 0.35 + 0.3, 1, i % 2 ? -0.4 : 0.4));
[16.85, 17.07].forEach((t) => click(t, 0.9, 0.4, 1.2));
[17.83, 17.88, 17.94, 18.01, 18.1, 18.26].forEach((t, i) => click(t, 0.9, -0.4, 1 + i * 0.08));
pop(18.28, 700, 0.8, -0.3);

// tunnel (shot-4 local 0 = 19.5)
const s4 = S.tunnel[0];
[0.35, 0.47, 0.6, 0.72].forEach((t, i) => click(s4 + t, 0.8, 0, 1 + i * 0.05));
for (let i = 0; i < 8; i++) { const t = passT(-1000 - i * 570); if (t) passby(t, i % 2 === 0 ? 1 : -1, 1); }
impact(s4 + 3.05, 0.55, {sub: 0.6, ring: 0.4});            // "بحراً وجواً" lands
{ const t = passT(-5250 - 250); if (t) { passby(t, -1, 0.8); passby(t + 0.02, 1, 0.8); } }
{ const t = passT(-5900); if (t) whoosh(t - 0.35, 0.7, {g: 1, panFrom: -0.8, panTo: 0.8, lo: 500, hi: 6000, peak: 0.5}); }
for (let i = 0; i < 6; i++) { const t = passT(-6250 - i * 120); if (t) { click(t, 0.8, Math.cos(i * 1.05 + 0.6) * 0.8, 1 + i * 0.06); } }
riser(23.4, 24.5, 1.0);
whoosh(23.55, 0.95, {g: 1.3, panFrom: -0.2, panTo: 0.2, lo: 250, hi: 7000, peak: 0.85, body: 0.7});

// finale: half-second vacuum, then the logo hit
swell(24.45, FIN, 1.1);
sparkle(23.65, FIN - 23.65, (u) => 0.15 + 0.8 * u * u, 1.1);
impact(FIN, 1.45); kick(FIN, 1.0); subDrop(FIN, 1.0);
[880, 1318.5, 1760, 2093, 2637].forEach((f, i) => bell(FIN + 0.05 + i * 0.12, f, 1.0, (i % 2 ? 1 : -1) * 0.45, 1.2));
pad(FIN, DUR - FIN, [55, 110, 130.81, 164.81, 220], 1.25, 0.8);
for (let t = FIN + 2 * BEAT, k = 0; t < CRANE; t += BEAT / 2, k++) pluck(t, [440, 523.25, 659.25, 523.25][k % 4], 0.45, k % 2 ? 0.4 : -0.4);
[0.05, 0.17, 0.3, 0.4, 0.52].forEach((t, i) => click(FIN + t, 0.7, i % 2 ? 0.25 : -0.25, 0.95 + i * 0.04));
click(FIN + 0.8, 0.6); pop(FIN + 1.05, 560, 0.7);

// contact card: crane down, card lands, one musical tick per row, final resolve
whoosh(CRANE + 0.05, 1.0, {g: 1.0, panFrom: 0, panTo: 0, lo: 1800, hi: 200, peak: 0.4, body: 0.4});
land(CRANE + 0.55, 1.1);
sparkle(CRANE + 0.5, 0.6, () => 0.5, 0.8);
const penta = [880, 987.77, 1174.66, 1318.51, 1567.98, 1760];
cfg.contacts.forEach((_, i) => { const t = CRANE + 0.6 + i * 0.13 + 0.12; click(t, 0.6, 0.2, 1); bell(t, penta[i], 0.55, (i - 2.5) * 0.15, 0.5); });
const done = CRANE + 0.6 + cfg.contacts.length * 0.13 + 0.35;
[220, 329.63, 440, 659.25, 880].forEach((f, i) => bell(done + i * 0.03, f, 0.6, (i - 2) * 0.3, 1.4));

// ══════════════════════════ mix ══════════════════════════
// FDN reverb: 4 delay lines per channel with damping and a Householder mix.
const fdn = (inp, lens) => {
  const out = new Float32Array(N), L = lens.map((ms) => Math.floor((ms / 1000) * SR));
  const bufs = L.map((n) => new Float32Array(n)), pos = L.map(() => 0), lp = L.map(() => 0);
  const fb = 0.83, damp = 0.32;
  for (let i = 0; i < N; i++) {
    const o = bufs.map((b, j) => b[pos[j]]);
    const s = (o[0] + o[1] + o[2] + o[3]) * 0.5;
    out[i] = (o[0] + o[1] + o[2] + o[3]) * 0.25;
    for (let j = 0; j < 4; j++) {
      lp[j] += damp * ((o[j] - s) - lp[j]);
      bufs[j][pos[j]] = inp[i] + lp[j] * fb;
      pos[j] = (pos[j] + 1) % L[j];
    }
  }
  return out;
};
const pre = (x, ms) => { const d = Math.floor((ms / 1000) * SR), o = new Float32Array(N); for (let i = d; i < N; i++) o[i] = x[i - d]; return o; };
const wetL = fdn(pre(rev[0], 18), [53.1, 67.3, 79.9, 97.1]);
const wetR = fdn(pre(rev[1], 23), [57.7, 71.9, 83.3, 101.3]);

// Sidechain: the music bus ducks under every kick.
const duck = new Float32Array(N).fill(1);
for (const kt of kickTimes) { const s = Math.floor(kt * SR); for (let i = 0; i < SR * 0.35 && s + i < N; i++) duck[s + i] = Math.min(duck[s + i], 1 - 0.6 * Math.exp(-(i / SR) / 0.09)); }

const mixL = new Float32Array(N), mixR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const vac = t > G1 && t < FIN ? 0.15 : 1; // vacuum before the final hit
  mixL[i] = (mus[0][i] * duck[i] * vac + drm[0][i] * 0.95 + sfx[0][i] + wetL[i] * 0.5);
  mixR[i] = (mus[1][i] * duck[i] * vac + drm[1][i] * 0.95 + sfx[1][i] + wetR[i] * 0.5);
}
// Glue compressor (RMS, 3:1 above -16 dBFS, 10 ms attack / 180 ms release), then soft limiter.
let env = 0;
const att = Math.exp(-1 / (0.01 * SR)), relc = Math.exp(-1 / (0.18 * SR)), thr = Math.pow(10, -16 / 20);
const outL = new Float32Array(N), outR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const lvl = Math.sqrt((mixL[i] ** 2 + mixR[i] ** 2) / 2);
  env = lvl > env ? att * env + (1 - att) * lvl : relc * env + (1 - relc) * lvl;
  const gr = env > thr ? Math.pow(env / thr, 1 / 3 - 1) : 1;
  const t = i / SR, fade = Math.min(1, t / 0.02) * Math.min(1, (DUR - t) / 1.4);
  outL[i] = Math.tanh(mixL[i] * gr * 1.35) * fade;
  outR[i] = Math.tanh(mixR[i] * gr * 1.35) * fade;
}
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
const norm = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(outL[i] * norm * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(outR[i] * norm * 32767), 46 + i * 4); }
const file = path.join(root, 'assets/audio/reel3-score.wav');
fs.writeFileSync(file, buf);
console.log('score written', file, 'norm', norm.toFixed(2));
