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
  threadCore: '#C2A062', // thicker, warmer core so the thread reads from the first second
  threadGlow: '#EBD6A6',
  glassFill: 'rgba(255,255,255,0.42)',
  glassEdge: 'rgba(255,255,255,0.95)',
  glassTint: 'rgba(232,217,181,0.20)',
  shadowRgb: '58,48,36', // warm graphite for long soft shadows (never cold, never green)
  rayTint: '#FAE8D6', // warm shoulder of the light rays
  rayShade: '#967850', // faint warm-shadow edges that make the rays read on the light base
};

// ───────────────────────────── living background ─────────────────────────────
// Pastel mesh-gradient palettes (4 blobs each). No green anywhere: every colour is
// peach / champagne / pale sky / lavender. The palette cross-fades by frame.
export const ATMOSPHERE = {
  palettes: {
    warm: ['#F8DCCB', '#F2E2BE', '#EEDDF0', '#FBEBDD'], // title + ticket: peach, champagne, lavender blush
    sky: ['#D4E2F7', '#E3DBF5', '#F6E4D8', '#DCE6F8'], // cities + features: pale sky, lavender
    gold: ['#EFD9A6', '#F6DCC4', '#F3E6C5', '#E8DDF1'], // price: champagne gold
    finale: ['#F4E3C3', '#F8DFD0', '#E6DEF4', '#F7EEDC'], // booking: champagne + peach
  },
  // [frame, palette]
  keys: [
    [0, 'warm'],
    [150, 'warm'],
    [182, 'sky'],
    [395, 'sky'],
    [420, 'gold'],
    [470, 'gold'],
    [500, 'finale'],
  ] as [number, 'warm' | 'sky' | 'gold' | 'finale'][],
  blobOpacity: 0.55,
  rayColor: '#FFF7E6',
  rayOpacity: 0.22,
  rayShadeOpacity: 0.036,
  rayCoreOpacity: 0.024, // narrow additive core
  chromaTarget: 52, // every pastel pulled towards one common distance from pearl (even "life")
  meshChroma: {sky: 76} as Partial<Record<'warm' | 'sky' | 'gold' | 'finale', number>>, // cool pastels need a bit more
  slotOverride: {sky: {2: 1}} as Partial<Record<'warm' | 'sky' | 'gold' | 'finale', Record<number, number>>>, // no peach next to blue
  // screen position of each lens glint source at its landing frame (upper band, off the main copy)
  glintSpots: {
    31: [700, 520],
    98: [790, 430],
    175: [770, 330],
    208: [310, 330],
    240: [770, 330],
    265: [300, 410],
    327: [790, 400],
    390: [300, 590],
    448: [780, 320],
    495: [800, 330],
  } as Record<number, [number, number]>,
  // lens glint when the camera lands on a station
  glints: [31, 98, 175, 208, 240, 265, 327, 390, 448, 495],
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
  companyAr: 'سقطرى للسياحة والسفر', // ends with alef maqsura ى (U+0649), not ya ي
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
  towers: {file: 'img/towers-cutout.png', w: 342, h: 834}, // full towers down to the podium, no base fade
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
  counters: {from: 100, to: 128}, // 0 → 7 / 0 → 6 (digit switch with soft fade, never clipped)
  // everything below sits on the 108 BPM grid (beat = 16.667 frames, beat 6 = frame 98)
  stampHits: [173, 206, 239], // off-beats 10.5 / 12.5 / 14.5
  featureFocus: [265, 285, 306, 327, 348, 369, 390], // every 1.25 beats ≈ 0.69 s
  priceCount: {from: 422, to: 448}, // lands on beat 27 = musical climax
  priceShine: 448,
  coins: {from: 430, to: 480},
  ctaTrace: {from: 490, to: 512},
  // the next stamp's target (glass, dashed ring) fades in only after the camera left the previous stop
  stampTargets: {prevStops: ['ticket', 'stamp1', 'stamp2'], preLead: 30, preRamp: 12},
  planeVisible: [148, 256],
};

// ───────────────────────────── world layout (world px) ─────────────────────────────
export const WORLD = {width: 1080, height: 11100, bgParallax: 0.4, fgParallax: 1.35, parallaxRef: 5000};

export const LAYOUT = {
  // title station is laid out as one screen (1080 x 1920) whose top sits at world y = top
  // towers 350→1180 (base on a glass floor + faint reflection), clear gap, then the title ink ≈ 1275→1510
  title: {
    top: 8420,
    companyY: 300,
    companySize: 54,
    towersTop: 350,
    towersH: 830,
    titleY: 1372,
    titleSize: 260,
    floor: {dy: -3, rx: 285, ry: 29, th: 5}, // glass floor under the tower base
    reflection: {h: 64, opacity: 0.18},
    // while the camera is still zoomed out (frames 0-31) these on-screen minimums are enforced
    minCompanyPx: 53,
    minTitlePx: 242,
  },
  ticket: {x: 540, y: 7910, w: 920, h: 520, eyeletY: 7740, eyeletR: 20, ribbonY: 8236, glassDy: 14},
  stamps: [
    {x: 400, y: 7090, rot: -5},
    {x: 680, y: 6520, rot: 4},
    {x: 420, y: 5950, rot: -3},
  ],
  stampR: 380,
  stampGlass: {dy: -6, rx: 300, ry: 58, th: 9}, // plinth at each stamp's bottom edge (stamp-local)
  features: [
    {x: 350, y: 5230},
    {x: 730, y: 4830},
    {x: 350, y: 4430},
    {x: 730, y: 4030},
    {x: 350, y: 3630},
    {x: 730, y: 3230},
    {x: 350, y: 2830},
  ],
  discD: 360,
  featureGlass: {dy: 2, rx: 150, ry: 26, th: 6}, // small glass ellipse each disc hovers over
  featureLabelGap: 46,
  iconSize: 280, // icon box; the drawn object itself fills 60-70 % of the disc
  price: {x: 540, y: 2030, d: 820, orbitR: 470, glassDy: 18},
  // booking station is laid out as one screen whose top sits at world y = top
  booking: {top: -450, ctaY: 520, ctaW: 880, ctaH: 156, rowsTop: 700, rowH: 88, rowGap: 30, companyY: 1300, panel: {x: 96, w: 888, padY: 38, r: 40}},
};

// depth of field: blur below `min` px is skipped (invisible but costly), ramps back by `ramp`, capped at `max`
export const DOF = {min: 0.6, ramp: 1.2, max: 2.4};

// counters (ticket 0→7 / 0→6, price 0,000→5,950): whole glyphs only, never clipped
export const COUNTERS = {
  fadeFrames: 2, // soft switch length when a digit changes slowly
  fastRate: 0.5, // digit/frame above which digits switch hard, one whole glyph per frame
  driftEm: 0.12,
  // ticket ease(u) = a·u + b·(1-(1-u)^2) — keeps every step ≥ 2 frames
  ticketEase: {a: 0.3, b: 0.7},
  // price ease(u) = a·u + b·(1-(1-u)^3) — small residual end speed so 5,950 lands crisp on the beat
  priceEase: {a: 0.04, b: 0.96},
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
    // starts 90 px low and zoomed out so the whole title screen (incl. the company line) is inside the safe zone on frame 0
    {id: 'start', x: 540, y: 9470, zoom: 0.86, arrive: 0, leave: 0, drift: 3},
    {id: 'title', x: 540, y: 9380, zoom: 1.0, arrive: 32, leave: 60, drift: 0.9},
    {id: 'w1', x: 610, y: 8720},
    {id: 'ticket', x: 540, y: 8025, zoom: 1.0, arrive: 98, leave: 150, drift: 0.7},
    {id: 'stamp1', x: 456, y: 7120, zoom: 1.1, arrive: 175, leave: 187, drift: 1.4},
    {id: 'stamp2', x: 624, y: 6550, zoom: 1.1, arrive: 208, leave: 220, drift: 1.4},
    {id: 'stamp3', x: 468, y: 5980, zoom: 1.1, arrive: 240, leave: 248, drift: 1.4},
    {id: 'f1', x: 436, y: 5325, zoom: 1.0, arrive: 265, leave: 265, drift: 9},
    {id: 'f2', x: 644, y: 4925, zoom: 1.0, arrive: 285, leave: 285, drift: 9},
    {id: 'f3', x: 436, y: 4525, zoom: 1.0, arrive: 306, leave: 306, drift: 9},
    {id: 'f4', x: 644, y: 4125, zoom: 1.0, arrive: 327, leave: 327, drift: 9},
    {id: 'f5', x: 436, y: 3725, zoom: 1.0, arrive: 348, leave: 348, drift: 9},
    {id: 'f6', x: 644, y: 3325, zoom: 1.0, arrive: 369, leave: 369, drift: 9},
    {id: 'f7', x: 436, y: 2925, zoom: 1.0, arrive: 390, leave: 390, drift: 9},
    {id: 'w2', x: 500, y: 2480},
    {id: 'price', x: 540, y: 2050, zoom: 1.0, arrive: 422, leave: 460, drift: 0.6},
    {id: 'w3', x: 600, y: 1240},
    {id: 'booking', x: 540, y: 510, zoom: 1.0, arrive: 495, leave: 540, drift: 0},
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
    {x: 350, y: 5230, id: 'f1'}, // discs are beads on the thread
    {x: 730, y: 4830, id: 'f2'},
    {x: 350, y: 4430, id: 'f3'},
    {x: 730, y: 4030, id: 'f4'},
    {x: 350, y: 3630, id: 'f5'},
    {x: 730, y: 3230, id: 'f6'},
    {x: 350, y: 2830, id: 'f7'},
    {x: 205, y: 2370},
    {x: 70, y: 2030, id: 'orbitL'}, // half orbit around the price disc
    {x: 208, y: 1698},
    {x: 540, y: 1560, id: 'orbitTop'},
    {x: 872, y: 1698, id: 'orbitR'},
    {x: 1002, y: 1400},
    {x: 1018, y: 900},
    {x: 1014, y: 330},
    {x: 984, y: 70, id: 'end'}, // ends at the right cap of the "احجز الآن" bar
  ],
  // where the glowing head of the thread is: [frame, anchor id, offset px along the thread]
  head: [
    [0, 'titleIn', 0], // head already above the bottom Reels UI band on frame 0
    [30, 'titleOut', 0],
    [60, 'titleOut', 170],
    [95, 'eyelet', 0],
    [148, 'eyelet', 80],
    [173, 's1', 0],
    [206, 's2', 0],
    [239, 's3', 0],
    [263, 'f1', 230],
    [283, 'f2', 230],
    [304, 'f3', 230],
    [325, 'f4', 230],
    [346, 'f5', 230],
    [367, 'f6', 230],
    [388, 'f7', 230],
    [422, 'orbitL', 0],
    [460, 'orbitR', 0],
    [490, 'end', 0],
  ],
};

// ───────────────────────────── audio cues (frames) ─────────────────────────────
// Read by scripts/export-cues.mjs → scripts/cues.json → scripts/make_audio.py
export const AUDIO_CUES = {
  ticks: [31, 98, ...EVENTS.featureFocus, 423, 490], // short tonal pluck / chime per station
  pops: EVENTS.stampHits, // tonal stamp knock (no noise)
  rises: [
    {from: EVENTS.counters.from, to: EVENTS.counters.to, steps: 7},
    {from: EVENTS.priceCount.from, to: EVENTS.priceCount.to, steps: 12},
  ],
  glass: [EVENTS.priceShine],
  bpm: 108,
  sfxBelowMusicDb: 9,
  targetLufs: -14,
};

// Music structure on the beat grid. frame(beat) = beat * 30 * 60 / bpm + offsetFrames
export const MUSIC = {
  bpm: 108,
  offsetFrames: -2, // beat 6 lands exactly on frame 98 (camera reaches the ticket)
  drumsInBeat: 6, // kick + clap enter at the ticket
  buildBeat: 16, // arpeggio to 16ths, layers double across the features
  priceBeat: 24, // tension (Dm9 → G13sus)
  climaxBeat: 27, // full strong chord + kick when 5,950 lands (frame 448)
  finalBeat: 30, // calm final chord (frame 498), fades over the last second
  userMusic: ['public/music.mp3', 'assets/music.mp3', '../assets/music.mp3'],
};
