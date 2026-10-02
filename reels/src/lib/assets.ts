import {staticFile} from 'remotion';
import {theme} from '../theme';

export type AssetFlags = {music: boolean; swoosh: boolean; stamp: boolean};

const exists = async (file: string) => {
  try {
    const r = await fetch(staticFile(file), {method: 'HEAD'});
    const type = r.headers.get('content-type') ?? '';
    return r.ok && !type.includes('text/html');
  } catch {
    return false;
  }
};

/** Checked at render time so a missing music/SFX file never crashes the render. */
export const detectAssets = async (): Promise<AssetFlags> => {
  const [music, swoosh, stamp] = await Promise.all([
    exists(theme.assets.music),
    exists(theme.assets.sfx.swoosh),
    exists(theme.assets.sfx.stamp),
  ]);
  return {music, swoosh, stamp};
};
