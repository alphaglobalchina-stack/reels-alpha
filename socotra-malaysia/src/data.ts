/**
 * Single source of truth for the Malaysia reel:
 * every text, timing, camera point, thread point, image name and colour lives here.
 * This file must stay import-free (scripts/export-cues.mjs loads it straight from Node).
 *
 * Units: world pixels (the world is one tall 1080 x 10900 canvas) and frames (30 fps).
 */

// ───────────────────────────── video ─────────────────────────────
export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  frames: 540, // exactly 18 s
  testFrames: 180, // first 6 s (title + ticket) test export
};

// ───────────────────────────── colours ─────────────────────────────
export const COLORS = {
  pearl: '#F7F6F3', // page background
  pearlDeep: '#EFEDE8',
  white: '#FFFFFF',
  warmGrey: '#ECEAE6',
  champagne: '#E8D9B5', // glow around the thread / icons
  champagneLight: '#F4EBD5',
  champagneDeep: '#CDB27B', // thread core, fine gold lines
  gold: '#B8975A', // darkest gold, used sparingly for hairlines
  ink: '#1C1C1E', // text + the price disc only
  inkSoft: '#6B6B70', // secondary text
  shadow: 'rgba(28,28,30,0.10)',
};

// ───────────────────────────── fonts ─────────────────────────────
// 'Messiri' is registered for Arabic code points only, so any digit / Latin character
// inside an Arabic string falls through to Sora automatically (e.g. "فنادق 4 نجوم").
export const FONTS = {
  arabic: "'Messiri', 'Sora', sans-serif",
  latin: "'Sora', sans-serif",
};

// ───────────────────────────── copy (verbatim) ─────────────────────────────
export const TEXT = {
  companyAr: 'سقطرى للسياحة والسفر', // ى (alef maqsura) — never "سقطري"
  companyEn: 'Socotra Travel & Tours',
  title: 'ماليزيا',
  duration: {days: 7, daysWord: 'أيام', nights: 6, nightsWord: 'ليال'}, // 7 أيام | 6 ليال
  tripType: 'برنامج خاص لشخصين',
  cities: ['كوالالمبور', 'لنكاوي', 'سيلانجور'],
  features: [
    'فنادق 4 نجوم',
    'إفطار يومي',
    'طيران داخلي',
    'سيارة وسائق خاص',
    'استقبال VIP',
    'شريحة اتصال وإنترنت',
    'جولات سياحية',
  ],
  price: {value: 5950, display: '5,950', currency: 'ريال سعودي'},
  cta: 'احجز الآن',
  contacts: [
    {kind: 'whatsapp', label: 'واتساب', value: '+60126003060'},
    {kind: 'web', label: '', value: 'www.socotrago.com'},
    {kind: 'email', label: '', value: 'info@socotrago.com'},
    {kind: 'instagram', label: 'إنستغرام', value: 'socotravelgo'},
  ],
} as const;

// ───────────────────────────── images ─────────────────────────────
// Prepared by scripts/prep_images.py from assets-src/ (see README for the audit).
export const IMAGES = {
  towers: {file: 'img/towers-cutout.png', w: 342, h: 854},
  logo: {file: 'img/logo-emblem.png', w: 279, h: 335},
  grain: 'img/grain.png',
  // all three are 1122 x 1402 (4:5) and are shown whole inside a 4:5 window
  cities: [
    {file: 'img/city-kuala-lumpur.jpg', w: 1122, h: 1402, source: 'petronas-kl.webp'},
    {file: 'img/city-langkawi.jpg', w: 1122, h: 1402, source: 'langkawi-skybridge.webp'},
    {file: 'img/city-selangor.jpg', w: 1122, h: 1402, source: 'putra-mosque.webp'},
  ],
};

export const AUDIO = {
  soundtrack: 'audio/soundtrack.wav', // music + SFX mix written by scripts/make_audio.py
  userMusic: 'music.mp3', // if this exists in assets/ it replaces the generated music
};

// ───────────────────────────── timeline (frames) ─────────────────────────────
// Section windows from the brief. Camera arrive/leave per stop are in CAMERA.stops.
export const SECTIONS = {
  title: [0, 90],
  ticket: [90, 165],
  stamps: [165, 255],
  features: [255, 405],
  price: [405, 480],
  booking: [480, 540],
};

export const EVENTS = {
  titleShine: 34,
  counters: {from: 100, to: 120}, // 0 → 7 / 0 → 6
  stampHits: [171, 203, 235], // each stamp lands as the camera arrives
  featureFocus: [268, 289, 310, 331, 352, 373, 394], // ≈ 0.7 s per feature
  priceCount: {from: 426, to: 464},
  priceShine: 464,
  coins: {from: 436, to: 500},
  ctaTrace: {from: 482, to: 506},
  planeVisible: [148, 256],
};

// ───────────────────────────── world layout (world px) ─────────────────────────────
export const WORLD = {width: 1080, height: 11100, bgParallax: 0.4, fgParallax: 1.35, parallaxRef: 5000};

export const LAYOUT = {
  // title station is laid out as one screen (1080 x 1920) whose top sits at world y = top
  title: {top: 8420, companyY: 300, towersTop: 340, towersH: 1080, titleY: 1290, titleSize: 270},
  ticket: {x: 540, y: 7910, w: 920, h: 520, eyeletY: 7740, eyeletR: 20, ribbonY: 8236},
  stamps: [
    {x: 400, y: 7090, rot: -5},
    {x: 680, y: 6520, rot: 4},
    {x: 420, y: 5950, rot: -3},
  ],
  stampR: 380,
  features: [
    {x: 320, y: 5230},
    {x: 760, y: 4900},
    {x: 320, y: 4570},
    {x: 760, y: 4240},
    {x: 320, y: 3910},
    {x: 760, y: 3580},
    {x: 320, y: 3250},
  ],
  discD: 360,
  iconSize: 216, // 60 % of the disc
  price: {x: 540, y: 2450, d: 820, orbitR: 470},
  // booking station is laid out as one screen whose top sits at world y = top
  booking: {top: 140, ctaY: 520, ctaW: 860, ctaH: 150, rowsTop: 668, rowH: 88, rowGap: 22, companyY: 1238},
};

// ───────────────────────────── camera ─────────────────────────────
// The camera centre follows a centripetal Catmull-Rom spline through these points.
// Stops carry timing; drift is the (px/frame) speed while the camera is "resting" on the stop,
// so nothing is ever completely still (except the final booking hold, drift 0).
export type CamPoint = {
  id: string;
  x: number;
  y: number;
  zoom?: number;
  arrive?: number;
  leave?: number;
  drift?: number;
};

export const CAMERA: {points: CamPoint[]; maxRoll: number; maxTilt: number; perspective: number} = {
  points: [
    {id: 'start', x: 540, y: 9760, zoom: 1.08, arrive: 0, leave: 0, drift: 16},
    {id: 'title', x: 540, y: 9380, zoom: 1.0, arrive: 32, leave: 60, drift: 0.9},
    {id: 'w1', x: 610, y: 8720},
    {id: 'ticket', x: 540, y: 8025, zoom: 1.0, arrive: 98, leave: 150, drift: 0.7},
    {id: 'stamp1', x: 456, y: 7120, zoom: 1.1, arrive: 174, leave: 186, drift: 1.4},
    {id: 'stamp2', x: 624, y: 6550, zoom: 1.1, arrive: 206, leave: 218, drift: 1.4},
    {id: 'stamp3', x: 468, y: 5980, zoom: 1.1, arrive: 238, leave: 248, drift: 1.4},
    {id: 'f1', x: 441, y: 5315, zoom: 1.12, arrive: 268, leave: 268, drift: 9},
    {id: 'f2', x: 639, y: 4985, zoom: 1.12, arrive: 289, leave: 289, drift: 9},
    {id: 'f3', x: 441, y: 4655, zoom: 1.12, arrive: 310, leave: 310, drift: 9},
    {id: 'f4', x: 639, y: 4325, zoom: 1.12, arrive: 331, leave: 331, drift: 9},
    {id: 'f5', x: 441, y: 3995, zoom: 1.12, arrive: 352, leave: 352, drift: 9},
    {id: 'f6', x: 639, y: 3665, zoom: 1.12, arrive: 373, leave: 373, drift: 9},
    {id: 'f7', x: 441, y: 3335, zoom: 1.12, arrive: 394, leave: 394, drift: 9},
    {id: 'w2', x: 500, y: 2900},
    {id: 'price', x: 540, y: 2470, zoom: 1.0, arrive: 424, leave: 462, drift: 0.6},
    {id: 'w3', x: 600, y: 1760},
    {id: 'booking', x: 540, y: 1100, zoom: 1.0, arrive: 495, leave: 540, drift: 0},
  ],
  maxRoll: 6, // degrees, from the spline heading
  maxTilt: 5, // degrees, 3D pitch/yaw from the spline velocity
  perspective: 2200,
};

// ───────────────────────────── light thread ─────────────────────────────
export type ThreadPoint = {x: number; y: number; id?: string};

export const THREAD: {points: ThreadPoint[]; head: [number, string, number][]} = {
  points: [
    {x: 620, y: 10970, id: 'start'},
    {x: 770, y: 10450},
    {x: 935, y: 9970, id: 'titleIn'},
    {x: 995, y: 9450},
    {x: 968, y: 8970, id: 'titleOut'},
    {x: 860, y: 8560},
    {x: 650, y: 8270}, // dives behind the ribbon / ticket
    {x: 552, y: 8030},
    {x: 540, y: 7740, id: 'eyelet'}, // comes out through the ticket's eyelet
    {x: 548, y: 7560, id: 'ticketTop'},
    {x: 700, y: 7380},
    {x: 852, y: 7090, id: 's1'},
    {x: 560, y: 6800}, // under the stamps
    {x: 228, y: 6520, id: 's2'},
    {x: 560, y: 6240},
    {x: 872, y: 5950, id: 's3'},
    {x: 780, y: 5560},
    {x: 320, y: 5230, id: 'f1'}, // discs are beads on the thread
    {x: 760, y: 4900, id: 'f2'},
    {x: 320, y: 4570, id: 'f3'},
    {x: 760, y: 4240, id: 'f4'},
    {x: 320, y: 3910, id: 'f5'},
    {x: 760, y: 3580, id: 'f6'},
    {x: 320, y: 3250, id: 'f7'},
    {x: 205, y: 2790},
    {x: 70, y: 2450, id: 'orbitL'}, // half orbit around the price disc
    {x: 208, y: 2118},
    {x: 540, y: 1980, id: 'orbitTop'},
    {x: 872, y: 2118, id: 'orbitR'},
    {x: 1002, y: 1820},
    {x: 1016, y: 1400},
    {x: 1012, y: 900},
    {x: 972, y: 660, id: 'end'}, // ends in the right cap of the "احجز الآن" bar
  ],
  // where the glowing head of the thread is: [frame, anchor id, offset px along the thread]
  head: [
    [0, 'titleIn', -260],
    [30, 'titleOut', 0],
    [60, 'titleOut', 170],
    [95, 'eyelet', 0],
    [148, 'eyelet', 80],
    [171, 's1', 0],
    [203, 's2', 0],
    [235, 's3', 0],
    [266, 'f1', 0],
    [287, 'f2', 0],
    [308, 'f3', 0],
    [329, 'f4', 0],
    [350, 'f5', 0],
    [371, 'f6', 0],
    [392, 'f7', 0],
    [424, 'orbitL', 0],
    [462, 'orbitR', 0],
    [492, 'end', 0],
  ],
};

// ───────────────────────────── audio cues (frames) ─────────────────────────────
// Read by scripts/export-cues.mjs → scripts/cues.json → scripts/make_audio.py
export const AUDIO_CUES = {
  ticks: [32, 98, ...EVENTS.featureFocus, 424, 495],
  pops: EVENTS.stampHits,
  rises: [
    {from: EVENTS.counters.from, to: EVENTS.counters.to, steps: 7},
    {from: EVENTS.priceCount.from, to: EVENTS.priceCount.to, steps: 12},
  ],
  glass: [EVENTS.priceShine],
  bpm: 92,
  sfxBelowMusicDb: 10,
};
