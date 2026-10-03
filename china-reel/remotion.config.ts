import {Config} from '@remotion/cli/config';
import {enableTailwind} from '@remotion/tailwind-v4';
import fs from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig(enableTailwind);

// استخدم Chromium محلي إن تعذّر على Remotion تنزيل متصفحه.
for (const p of [
  process.env.REMOTION_BROWSER_EXECUTABLE,
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
]) {
  if (p && fs.existsSync(p)) {
    Config.setBrowserExecutable(p);
    break;
  }
}
