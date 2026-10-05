/**
 * Malaysia reel — the single source of truth.
 * Every text, number, image name, card position and timing lives here.
 * Texts are copied verbatim from the brief: do not edit them.
 */

export const FPS = 30;
export const DURATION_S = 18;
export const DURATION = FPS * DURATION_S; // 540 frames exactly
export const W = 1080;
export const H = 1920;
export const s = (sec: number) => Math.round(sec * FPS);

/** Instagram UI bands: no important text in the top 250px / bottom 350px of the frame. */
export const SAFE = {top: 250, bottom: 350};
/** Screen point the camera aims at (centre of the safe area). */
export const FOCUS = {x: W / 2, y: (SAFE.top + (H - SAFE.bottom)) / 2};

// ───────────────────────────── texts (verbatim) ─────────────────────────────
export const TEXT = {
  companyAr: 'سقطري للسياحة والسفر',
  companyEn: 'Socotra Travel & Tours',
  title: 'ماليزيا',
  days: {n: 7, word: 'أيام'},
  nights: {n: 6, word: 'ليال'},
  type: 'برنامج خاص لشخصين',
  cities: ['كوالالمبور', 'لنكاوي', 'سيلانجور'] as const,
  features: [
    'فنادق 4 نجوم',
    'إفطار يومي',
    'طيران داخلي',
    'سيارة وسائق خاص',
    'استقبال VIP',
    'شريحة اتصال وإنترنت',
    'جولات سياحية',
  ] as const,
  price: {value: 5950, display: '5,950', currency: 'ريال سعودي'},
  cta: 'احجز الآن',
  contact: {
    whatsappLabel: 'واتساب',
    whatsapp: '+60126003060',
    web: 'www.socotrago.com',
    email: 'info@socotrago.com',
    instagramLabel: 'إنستغرام',
    instagram: 'socotravelgo',
  },
} as const;

// ───────────────────────────── images (assets/malaysia) ─────────────────────
export const IMG = {
  /** Petronas Twin Towers at night (source 4.webp) — title card + Kuala Lumpur card */
  kl: 'malaysia/kl-petronas-night.jpg',
  /** Towers cut out of the same photo (same pixel grid, top 620 rows) — floats over the title card */
  towers: 'malaysia/kl-towers-cutout.png',
  /** Langkawi Sky Bridge at sunset (source 2.webp) */
  langkawi: 'malaysia/langkawi-skybridge.jpg',
  /** Genting Highlands Awana Skyway cable car (source 3.webp) — Pahang/Selangor border, used for Selangor */
  selangor: 'malaysia/genting-cablecar.jpg',
  /** Socotra logo with the black keyed out (source 1.jpg) */
  logo: 'malaysia/socotra-logo.png',
  /** Logo mark only (tree + plane ring) */
  mark: 'malaysia/socotra-mark.png',
} as const;
/** Natural pixel size of the photos (all three are 1122×1402). */
export const PHOTO_SIZE = {w: 1122, h: 1402};
export const TOWERS_ROWS = 620;

export const AUDIO = {
  music: 'malaysia/audio/music.wav',
  whoosh: 'malaysia/audio/whoosh.wav',
  whooshSoft: 'malaysia/audio/whoosh-soft.wav',
  tick: 'malaysia/audio/tick.wav',
  shimmer: 'malaysia/audio/shimmer.wav',
  pop: 'malaysia/audio/pop.wav',
};

// ───────────────────────────── palette ──────────────────────────────────────
export const C = {
  pearl: '#F7F6F3',
  white: '#FFFFFF',
  card: '#FDFCFA',
  cardAlt: '#F2F1EE',
  warm: '#ECEAE6',
  champagne: '#E8D9B5',
  champagneDeep: '#C9AE78', // shading only (gives the champagne icons volume)
  ink: '#1C1C1E',
  grey: '#6B6B70',
  hair: 'rgba(28,28,30,0.06)',
};

// ───────────────────────────── board layout (board px) ──────────────────────
// Main column x∈[0,1000]. RTL: the first card of a row sits on the right.
export const GAP = 32;
export const RADIUS = 56;
export type Rect = {x: number; y: number; w: number; h: number};

export const TITLE = {
  card: {x: 0, y: 0, w: 1000, h: 1150} as Rect,
  inset: 26,
  photoH: 760,
  /** photo mapping: source px → board px, and which source row sits at the window's top edge */
  photoScale: 1.32,
  srcTop: 292,
  srcCenterX: 584,
  fontSize: 250,
};

const r2 = TITLE.card.y + TITLE.card.h + GAP; // 1182
export const ROW2 = {
  duration: {x: 460, y: r2, w: 540, h: 540} as Rect,
  type: {x: 0, y: r2, w: 428, h: 540} as Rect,
};

const r3 = r2 + 540 + GAP; // 1754
export const CITIES: {name: string; img: string; rect: Rect; focus: [number, number]}[] = [
  {name: TEXT.cities[0], img: IMG.kl, rect: {x: 0, y: r3, w: 1000, h: 560}, focus: [0.52, 0.62]},
  {name: TEXT.cities[1], img: IMG.langkawi, rect: {x: 516, y: r3 + 560 + GAP, w: 484, h: 680}, focus: [0.3, 0.55]},
  {name: TEXT.cities[2], img: IMG.selangor, rect: {x: 0, y: r3 + 560 + GAP, w: 484, h: 680}, focus: [0.45, 0.3]},
];

const r4 = r3 + 560 + GAP + 680 + GAP; // 3058
const fH = 440;
export type FeatureIcon = 'hotel' | 'breakfast' | 'flight' | 'car' | 'vip' | 'sim' | 'tours';
export const FEATURES: {text: string; icon: FeatureIcon; rect: Rect; dark?: boolean}[] = [
  {text: TEXT.features[0], icon: 'hotel', rect: {x: 440, y: r4, w: 560, h: fH}},
  {text: TEXT.features[1], icon: 'breakfast', rect: {x: 0, y: r4, w: 408, h: fH}},
  {text: TEXT.features[2], icon: 'flight', rect: {x: 592, y: r4 + fH + GAP, w: 408, h: fH}},
  {text: TEXT.features[3], icon: 'car', rect: {x: 0, y: r4 + fH + GAP, w: 560, h: fH}},
  {text: TEXT.features[4], icon: 'vip', rect: {x: 0, y: r4 + 2 * (fH + GAP), w: 1000, h: 380}, dark: true},
  {text: TEXT.features[5], icon: 'sim', rect: {x: 440, y: r4 + 2 * (fH + GAP) + 380 + GAP, w: 560, h: fH}},
  {text: TEXT.features[6], icon: 'tours', rect: {x: 0, y: r4 + 2 * (fH + GAP) + 380 + GAP, w: 408, h: fH}},
];

const r5 = r4 + 3 * (fH + GAP) + 380 + GAP; // 4846
export const PRICE: Rect = {x: 0, y: r5, w: 1000, h: 740};
const r6 = r5 + 740 + GAP;
export const CTA: Rect = {x: 0, y: r6, w: 1000, h: 380};
export const CONTACT: Rect = {x: 0, y: r6 + 380 + GAP, w: 1000, h: 560};
export const BRAND: Rect = {x: 0, y: CONTACT.y + CONTACT.h + GAP, w: 1000, h: 420};
export const BOARD_BOTTOM = BRAND.y + BRAND.h;
/** Whole board incl. the decorative side columns (for the final zoom-out). */
export const BOARD = {x: -820, y: -420, w: 2640, h: BOARD_BOTTOM + 420 + 420};

// ───────────────────────────── timeline ─────────────────────────────────────
export const T = {
  // 0–3s: rise from the middle of the board to the title
  titleArrive: s(1.45),
  titleIn: s(1.0),
  // 3–6s: duration + type
  row2Arrive: s(3.75),
  countersStart: s(3.8),
  // 6–9s: cities
  citiesStart: s(6.0),
  plane: [s(6.25), s(8.9)] as [number, number],
  // 9–14s: 7 features, ~0.7s each
  featureStops: [0, 1, 2, 3, 4, 5, 6].map((i) => s(9.35) + i * 21),
  // 14–16.5s: price
  priceArrive: s(14.55),
  priceCount: [s(14.6), s(15.75)] as [number, number],
  priceShine: s(15.8),
  // 16.5–18s: zoom out + CTA / contact / brand
  zoomOut: [s(16.5), s(17.2)] as [number, number],
  lift: [s(17.0), s(17.6)] as [number, number],
  brandIn: s(17.3),
  fadeOut: s(17.0),
};

/**
 * Camera stations. (cx, cy) is the board point placed at FOCUS; z is the zoom;
 * roll is the in-plane tilt in degrees. `arc` bends the path sideways, `breathe`
 * pulls the zoom back mid-move (the camera "rises" between stations).
 */
export type Key = {f: number; cx: number; cy: number; z: number; roll: number; arc?: number; breathe?: number; ease?: 'io' | 'o' | 'soft'};

const fc = (i: number) => {
  const r = FEATURES[i].rect;
  return {cx: r.x + r.w / 2, cy: r.y + r.h / 2};
};
const fz = 1.12;

export const CAMERA: Key[] = [
  {f: 0, cx: 520, cy: 3420, z: 0.6, roll: 2.5},
  {f: T.titleArrive, cx: 500, cy: 520, z: 0.93, roll: 0, arc: -90, breathe: 0.12, ease: 'io'},
  {f: s(3.0), cx: 500, cy: 505, z: 0.955, roll: -0.6, ease: 'soft'},
  {f: T.row2Arrive, cx: 500, cy: ROW2.duration.y + 270, z: 1.0, roll: -4, arc: 60, breathe: 0.06, ease: 'io'},
  {f: s(6.0), cx: 505, cy: ROW2.duration.y + 262, z: 1.03, roll: -3.2, ease: 'soft'},
  {f: s(6.7), cx: 500, cy: CITIES[0].rect.y + 300, z: 0.95, roll: 1.2, arc: -40, ease: 'io'},
  {f: s(8.9), cx: 500, cy: CITIES[1].rect.y + 300, z: 0.95, roll: 1.8, ease: 'soft'},
  ...T.featureStops.flatMap((f, i): Key[] => {
    const c = fc(i);
    const z = i === 4 ? 1.0 : fz;
    const roll = i % 2 === 0 ? -1.2 : 1.2;
    return [
      {f, ...c, z, roll, arc: i === 0 ? 0 : 30, ease: 'io'},
      {f: f + 9, cx: c.cx + (i % 2 === 0 ? -6 : 6), cy: c.cy + 4, z: z + 0.012, roll, ease: 'soft'},
    ];
  }),
  {f: T.priceArrive, cx: 500, cy: PRICE.y + PRICE.h / 2 - 10, z: 1.0, roll: 0, breathe: 0.06, ease: 'io'},
  {f: T.zoomOut[0], cx: 500, cy: PRICE.y + PRICE.h / 2 - 10, z: 1.13, roll: 0, ease: 'soft'},
  {f: T.zoomOut[1], cx: 500, cy: BOARD.y + BOARD.h / 2 - 40, z: 0.262, roll: 0, ease: 'io'},
  {f: DURATION, cx: 500, cy: BOARD.y + BOARD.h / 2 - 40, z: 0.252, roll: 0, ease: 'soft'},
];

/** Final screen layout of the lifted end cards (screen px). */
export const END = {
  brand: {x: 90, y: 262, w: 900, h: 330},
  cta: {x: 190, y: 660, w: 700, h: 266},
  contact: {x: 90, y: 880, w: 900, h: 560},
};
