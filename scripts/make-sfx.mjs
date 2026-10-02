// Generates tiny placeholder SFX (assets/sfx/swoosh.wav, stamp.wav). Replace with your own files any time.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/sfx');
fs.mkdirSync(dir, {recursive: true});
const SR = 44100;

const wav = (samples) => {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32000), 44 + i * 2));
  return buf;
};

// swoosh: band-passed noise whose centre frequency sweeps up then down
{
  const n = Math.floor(SR * 0.7);
  const out = new Float32Array(n);
  let lp = 0, bp = 0, seed = 1;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    seed = (seed * 16807) % 2147483647;
    const noise = (seed / 2147483647) * 2 - 1;
    const f = 0.02 + 0.22 * Math.sin(Math.PI * Math.pow(t, 0.8));
    lp += f * (noise - lp);
    bp += f * (lp - bp);
    const env = Math.pow(Math.sin(Math.PI * t), 1.6);
    out[i] = (lp - bp) * 9 * env;
  }
  fs.writeFileSync(path.join(dir, 'swoosh.wav'), wav(out));
}

// stamp: low thump + short noise click
{
  const n = Math.floor(SR * 0.45);
  const out = new Float32Array(n);
  let seed = 7;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    seed = (seed * 16807) % 2147483647;
    const noise = (seed / 2147483647) * 2 - 1;
    const thump = Math.sin(2 * Math.PI * (48 + 90 * Math.exp(-t * 28)) * t) * Math.exp(-t * 9);
    out[i] = thump * 0.9 + noise * Math.exp(-t * 90) * 0.5;
  }
  fs.writeFileSync(path.join(dir, 'stamp.wav'), wav(out));
}
console.log('SFX written to', dir);
