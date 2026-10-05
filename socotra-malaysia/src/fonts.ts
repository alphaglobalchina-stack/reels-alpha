import {continueRender, delayRender, staticFile} from 'remotion';

// El Messiri is registered for Arabic code points only → digits & Latin always fall back to Sora.
const ARABIC =
  'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

type Face = {family: string; weight: number; file: string; range: string};

const faces: Face[] = [
  ...[500, 600, 700].map((w) => ({family: 'Messiri', weight: w, file: `fonts/el-messiri-arabic-${w}-normal.woff2`, range: ARABIC})),
  ...[400, 500, 600, 700, 800].map((w) => ({family: 'Sora', weight: w, file: `fonts/sora-latin-${w}-normal.woff2`, range: LATIN})),
];

let started = false;

export const loadFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('fonts');
  Promise.all(
    faces.map(async (f) => {
      const face = new FontFace(f.family, `url(${staticFile(f.file)}) format('woff2')`, {
        weight: String(f.weight),
        unicodeRange: f.range,
        display: 'block',
      });
      await face.load();
      document.fonts.add(face);
    }),
  )
    .then(() => document.fonts.ready)
    .catch((e) => console.error('font load failed', e))
    .finally(() => continueRender(handle));
};
