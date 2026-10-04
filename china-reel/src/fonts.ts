import {continueRender, delayRender, staticFile} from 'remotion';

const faces: {family: string; file: string; weight: string; range?: string}[] = [
  {family: 'Cairo', file: 'fonts/cairo-arabic-700-normal.woff2', weight: '700', range: 'U+0600-06FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE80-FEFC'},
  {family: 'Cairo', file: 'fonts/cairo-arabic-900-normal.woff2', weight: '900', range: 'U+0600-06FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE80-FEFC'},
  {family: 'Cairo', file: 'fonts/cairo-latin-700-normal.woff2', weight: '700', range: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'},
  {family: 'Cairo', file: 'fonts/cairo-latin-900-normal.woff2', weight: '900', range: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'},
  {family: 'Bebas Neue', file: 'fonts/bebas-neue-latin-400-normal.woff2', weight: '400'},
];

/** الخطوط محلية داخل public/fonts (منسوخة من Google Fonts عبر @fontsource) فلا يعتمد الريندر على الشبكة. */
export const loadFonts = () => {
  const handle = delayRender('fonts');
  Promise.all(
    faces.map(async (f) => {
      const face = new FontFace(f.family, `url(${staticFile(f.file)}) format("woff2")`, {
        weight: f.weight,
        ...(f.range ? {unicodeRange: f.range} : {}),
      });
      await face.load();
      document.fonts.add(face);
    }),
  )
    .catch((e) => console.error('font load failed', e))
    .finally(() => continueRender(handle));
};
