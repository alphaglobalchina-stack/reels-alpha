import {Config} from '@remotion/cli/config';
import fs from 'node:fs';

Config.setEntryPoint('./src/index.ts');
Config.setPublicDir('./public');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(96);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer('angle');

// Use the pre-installed headless shell when Remotion cannot download its own.
for (const p of [process.env.REMOTION_BROWSER_EXECUTABLE, '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell']) {
  if (p && fs.existsSync(p)) {
    Config.setBrowserExecutable(p);
    break;
  }
}
