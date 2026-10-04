// يولّد: public/sfx/whoosh.wav + public/music.mp3 (موسيقى placeholder هادئة).
// استبدل music.mp3 بموسيقاك متى شئت.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public');
fs.mkdirSync(path.join(root, 'sfx'), {recursive: true});
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

// whoosh: ضجيج مفلتَر يتحرك تردده صعودًا ثم هبوطًا
{
  const n = Math.floor(SR * 0.6);
  const out = new Float32Array(n);
  let lp = 0, bp = 0, seed = 7;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    seed = (seed * 16807) % 2147483647;
    const noise = (seed / 2147483647) * 2 - 1;
    const f = 0.02 + 0.22 * Math.sin(Math.PI * Math.pow(t, 0.8));
    lp += f * (noise - lp);
    bp += f * (lp - bp);
    out[i] = (lp - bp) * 9 * Math.pow(Math.sin(Math.PI * t), 1.6);
  }
  fs.writeFileSync(path.join(root, 'sfx/whoosh.wav'), wav(out));
}

// موسيقى placeholder: 30 ثانية بنغمة خماسية (Pentatonic) هادئة + باص ونبض خفيف
{
  const dur = 30, n = SR * dur;
  const out = new Float32Array(n);
  const penta = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33]; // D major pentatonic
  const bass = [73.42, 73.42, 98.0, 110.0]; // D2 D2 G2 A2
  const bpm = 100, beat = 60 / bpm;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const bar = Math.floor(t / (beat * 4));
    const b = bass[bar % bass.length];
    let s = 0.22 * Math.sin(2 * Math.PI * b * t) * (0.7 + 0.3 * Math.sin(2 * Math.PI * t / (beat * 4)));
    // أرپيجيو: نغمة كل نصف نبضة
    const step = Math.floor(t / (beat / 2));
    const local = t - step * (beat / 2);
    const note = penta[(step * 3 + bar) % penta.length];
    const env = Math.exp(-local * 5);
    s += 0.16 * env * (Math.sin(2 * Math.PI * note * t) + 0.3 * Math.sin(4 * Math.PI * note * t));
    // نبض خفيف
    const bl = t % beat;
    s += 0.18 * Math.exp(-bl * 18) * Math.sin(2 * Math.PI * (55 + 80 * Math.exp(-bl * 30)) * bl);
    out[i] = s * 0.8;
  }
  const tmp = path.join(root, '_music.wav');
  fs.writeFileSync(tmp, wav(out));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-codec:a', 'libmp3lame', '-b:a', '192k', path.join(root, 'music.mp3')]);
  fs.unlinkSync(tmp);
}
console.log('done');
