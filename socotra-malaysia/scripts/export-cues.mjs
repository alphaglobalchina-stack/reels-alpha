// Writes scripts/cues.json from src/data.ts so the audio script uses the exact same timeline.
// Node ≥ 22.18 strips the TypeScript types natively.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const data = await import(path.join(here, '../src/data.ts'));

const out = {
  fps: data.VIDEO.fps,
  frames: data.VIDEO.frames,
  sections: data.SECTIONS,
  events: data.EVENTS,
  ...data.AUDIO_CUES,
  music: data.MUSIC,
};
fs.writeFileSync(path.join(here, 'cues.json'), JSON.stringify(out, null, 2));
console.log('cues.json written:', Object.keys(out).join(', '));
