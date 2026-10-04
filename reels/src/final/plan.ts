/**
 * FINAL film timeline. The original Arabic voice-over (natural speed, every sentence; only
 * the spoken company name removed as requested earlier — content/vo-timing.json) starts
 * after a silent 3-second cold open. Every beat below is a spoken-word anchor + OFFSET.
 *
 * Rhythm everywhere: MOVE → BREATHE → ANTICIPATION (0.1–0.3 s) → IMPACT → MOVE.
 */
import vo from '../../../content/vo-timing.json';

export const FPS = 60;
export const OFFSET = 3.0; // silent cold open before the narration
export const HOLD = 3.6; // clean end-card hold after the narration
export const DURATION = Math.round((OFFSET + vo.duration + HOLD) * FPS) / FPS;
export const TOTAL_FRAMES = Math.round(DURATION * FPS);
export const VO_START = OFFSET;

const DIAC = /[ً-ْٰـ.,،…]/g;
const norm = (s: string) => s.replace(DIAC, '').toLowerCase();
export const at = (text: string, nth = 1, after = 0) => {
  const w = vo.words.filter((x) => x.start + OFFSET >= after && norm(x.text) === norm(text))[nth - 1];
  if (!w) throw new Error(`final cue not found: ${text}`);
  return w.start + OFFSET;
};
export const BRAND = (vo as {marks: {brand: number}}).marks.brand + OFFSET;

// ── cold open (silent) ─────────────────────────────────────────────────────────
export const COLD = {
  reveal: 0.12, // darkness → card field
  line: 0.8, // the gold line enters
  silence: 1.42, // almost complete silence
  lock: 1.58, // RIGHT MATCH lock
  morph: 1.7, // card → container doors
  clack1: 2.02,
  clack2: 2.2,
  open: 2.36, // doors swing toward the camera
  through: 2.62, // camera accelerates through
  end: 3.0, // Guangzhou fills the screen, narration starts
};

// ── Guangzhou → map → market → sourcing (V3 journey, original-speed anchors) ───
export const V = {
  china: at('الصين'),
  opp: at('بالفرص'),
  but: at('لكن'),
  reach: at('الوصول'),
  sup: at('المورد'),
  right: at('الصحيح'),
  is: at('هو'),
  only: at('فقط'),
  from: at('من', 1, 8.5),
  gz: at('قوانزو'),
  heart: at('قلب'),
  work: at('نعمل'),
  inside: at('داخل'),
  souq: at('السوق'),
  self: at('نفسه'),
  search: at('نبحث'),
  sups: at('الموردين'),
  fact: at('والمصانع'),
  fit: at('المناسبة'),
};
export const CITY_T0 = 2.3; // the Guangzhou aerial starts behind the container doors
export const CITY_RATE = 0.9; // gentle stretch so the clip covers the whole city shot
export const A = {
  holdA: [V.but - 0.2, V.but] as const,
  waves: [V.reach + 0.2, V.sup - 0.1, V.sup + 0.2] as const,
  vac: [V.right - 0.2, V.right] as const,
  holdB: [V.is, V.is + 0.24] as const,
  dive: [V.is + 0.24, V.from - 0.1] as const,
};
export const NODE_IN = A.dive[1];
export const M = {
  start: NODE_IN - 0.04,
  orbitEnd: V.heart - 0.2,
  hold: [V.heart - 0.2, V.heart] as const,
  dive: [V.heart, V.work - 0.3] as const,
};
export const CITY = {start: M.dive[1] - 0.22, pass: [V.work - 0.05, V.work + 0.36] as const};
export const EXT = {start: CITY.pass[0] + 0.05, slow: V.work + 0.6, hold: [V.self - 0.16, V.self] as const, push: [V.self, V.self + 0.36] as const};
export const HALL = {start: EXT.push[0] + 0.15, hold: [V.search - 0.1, V.search + 0.04] as const};

// ── negotiation ────────────────────────────────────────────────────────────────
export const NEG = {
  cmp: at('نقارن'),
  neg: at('ونتفاوض'),
  price: at('الأسعار'),
  spec: at('والمواصفات'),
  terms: at('بما'),
  need: at('احتياجك'),
};
export const SNAP = NEG.need + 0.12;

export const NET = {
  burst: V.search + 0.04,
  search: V.sups - 0.02,
  verify: (V.sups + V.fact) / 2,
  compare: V.fact - 0.02,
  hold: [V.fit - 0.2, V.fit - 0.02] as const,
  select: V.fit - 0.02,
  through: [V.fit + 0.32, NEG.cmp - 0.02] as const,
};
export const NEG_START = NET.through[1] - 0.22;
export const NEG_THROUGH = [SNAP + 0.42, at('نتابع') - 0.04] as const;

// ── sample → production ────────────────────────────────────────────────────────
export const PROD = {
  start: NEG_THROUGH[1] - 0.25,
  follow: at('نتابع'),
  sample: at('العينة'),
  prod: at('الإنتاج'),
  coord: at('وننسق'),
  end: at('فحص') - 0.12,
};
// ── inspection ─────────────────────────────────────────────────────────────────
export const INSP = {
  start: PROD.end - 0.3,
  insp: at('فحص'),
  preship: at('قبل'),
  ensure: at('للتأكد'),
  match: at('مطابقتها'),
  push: [at('للمواصفات') + 0.62, at('سواء') - 0.02] as const,
};
// ── products / machinery gallery + clear steps ─────────────────────────────────
export const GAL = {
  start: INSP.push[1] - 0.3,
  whether: at('سواء'),
  products: at('منتجات'),
  equip: at('معدات'),
  mach: at('مكائن'),
  lines: at('خطوط'),
  full: at('كاملة'),
  help: at('نحن'),
  sourcing: at('التوريد'),
  steps: at('بخطوات'),
  clear: at('واضحة'),
  studied: at('ومدروسة'),
  end: at('ثم') - 0.05,
};
// ── shipping ───────────────────────────────────────────────────────────────────
export const SHIP = {
  start: GAL.end - 0.35,
  then: at('ثم'),
  ship: at('الشحن', 1, 38),
  port: at('ميناء'),
  dest: at('وجهتك'),
  portIn: at('إلى', 1, 39.8) - 0.2, // route → crane cable
  wake: at('وجهتك') + 0.05, // cable → ship wake
  end: at('لا', 1, 41) - 0.38,
};
// ── hero line ──────────────────────────────────────────────────────────────────
export const HERO = {
  vacuum: [SHIP.end, at('لا', 1, 41)] as const,
  dont: at('لا', 1, 41),
  sup: at('مورد', 1, 42),
  only: at('فقط', 1, 42),
  own: at('امتلك'),
  partner: at('شريكا'),
  inside: at('داخل', 1, 44),
  china: at('الصين', 1, 44.5),
  converge: [BRAND - 0.36, BRAND] as const,
};
// ── end card ───────────────────────────────────────────────────────────────────
export const LOGO = {start: BRAND - 0.2, hit: BRAND, tag: at('شريكك')};
export const END = DURATION;

/** words with global (cold-open-shifted) times */
export const wordsF = vo.words.map((w) => ({...w, start: w.start + OFFSET, end: w.end + OFFSET}));
export const wordF = (text: string, after = 0) => {
  const w = wordsF.find((x) => x.start >= after && norm(x.text) === norm(text));
  if (!w) throw new Error(`final word not found: ${text}`);
  return w;
};
