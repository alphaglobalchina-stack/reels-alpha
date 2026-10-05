// QA: samples the camera every frame and reports speed / acceleration / roll / zoom ranges and
// the largest frame-to-frame changes (a jump in speed would show up here).
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '.camera.bundle.mjs');
await build({entryPoints: [path.join(here, '../src/lib/camera.ts')], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error'});
const cam = await import(out + '?' + Date.now());
const {VIDEO} = await import(path.join(here, '../src/data.ts'));
const rows = [];
for (let f = 0; f < VIDEO.frames; f++) {
  const c = cam.cameraAt(f);
  const h = cam.threadHead(f);
  rows.push({f, x: c.x, y: c.y, zoom: c.zoom, roll: c.roll, tiltX: c.tiltX, tiltY: c.tiltY, speed: c.speed, head: h});
}
fs.unlinkSync(out);
const scr = rows.map((r, i) => {
  if (i === 0) return 0;
  const p = rows[i - 1];
  return Math.hypot(r.x - p.x, r.y - p.y) * r.zoom; // screen px per frame
});
const acc = scr.map((v, i) => (i < 2 ? 0 : v - scr[i - 1]));
const jerk = acc.map((a, i) => (i < 3 ? 0 : a - acc[i - 1]));
const top = (arr, n = 5) => arr.map((v, i) => [i, v]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, n).map(([i, v]) => `f${i}:${v.toFixed(2)}`);
const rng = (k) => [Math.min(...rows.map((r) => r[k])).toFixed(2), Math.max(...rows.map((r) => r[k])).toFixed(2)];
console.log('screen speed px/f  max', Math.max(...scr).toFixed(1), ' top', top(scr).join(' '));
console.log('accel px/f²       top', top(acc).join(' '));
console.log('jerk               top', top(jerk).join(' '));
console.log('roll deg', rng('roll'), ' tiltX', rng('tiltX'), ' tiltY', rng('tiltY'), ' zoom', rng('zoom'));
const still = [];
let run = 0;
for (let i = 1; i < rows.length; i++) {
  run = scr[i] < 0.05 && Math.abs(rows[i].roll - rows[i - 1].roll) < 0.001 ? run + 1 : 0;
  if (run === 16) still.push(i - 15);
}
console.log('camera fully still for >0.5 s starting at frames:', still.join(', ') || 'none');
const holds = [32, 45, 60, 98, 120, 150, 174, 180, 206, 238, 268, 289, 310, 331, 352, 373, 394, 422, 440, 460, 495, 539];
console.log('frame: cam(x,y) zoom roll speed');
for (const f of holds) {
  const r = rows[f];
  console.log(`  f${f}: (${r.x.toFixed(0)}, ${r.y.toFixed(0)}) z=${r.zoom.toFixed(3)} roll=${r.roll.toFixed(2)} v=${scr[f].toFixed(1)}`);
}
fs.writeFileSync(path.join(here, '..', 'out', 'qa', 'camera.json'), JSON.stringify(rows));
