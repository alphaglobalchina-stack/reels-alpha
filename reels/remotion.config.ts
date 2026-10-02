import {Config} from '@remotion/cli/config';
import fs from 'node:fs';

// Fonts, logo, music and SFX live in ../assets (one folder for everything you swap).
Config.setPublicDir('../assets');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setOverwriteOutput(true);

// Use a locally installed Chromium when Remotion cannot download its own.
for (const p of [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
]) {
  if (p && fs.existsSync(p)) {
    Config.setBrowserExecutable(p);
    break;
  }
}
