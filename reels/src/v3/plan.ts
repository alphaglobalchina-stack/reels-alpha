/**
 * V3 preview timeline — one camera journey. Every beat is a spoken-word anchor from the
 * V2 voice edit (content/vo-timing-v2.json). Rhythm: FAST → controlled SLOW → short
 * ANTICIPATION hold (0.1–0.3 s) → IMPACT → FAST.
 */
import {at, PREVIEW_END} from '../v2/t2';

export const V = {
  china: at('الصين'),
  opp: at('بالفرص'),
  but: at('لكن'),
  reach: at('الوصول'),
  sup: at('المورد'),
  right: at('الصحيح'),
  is: at('هو'),
  only: at('فقط'),
  from: at('من', 1, 4.3),
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
export const END = PREVIEW_END;

// ── shot windows / beats (global seconds) ──────────────────────────────────────
export const A = {
  holdA: [V.but - 0.18, V.but] as const, // anticipation before flying through الصين
  waves: [V.reach + 0.2, V.sup - 0.08, V.sup + 0.16] as const, // node filtering
  vac: [V.right - 0.2, V.right] as const, // vacuum before the lock
  holdB: [V.is, V.is + 0.22] as const, // pull-back before the dive
  dive: [V.is + 0.22, V.from - 0.1] as const,
};
export const NODE_IN = A.dive[1]; // node = Guangzhou pin from here on
export const M = {
  start: NODE_IN - 0.04,
  orbitEnd: V.heart - 0.18,
  hold: [V.heart - 0.18, V.heart] as const,
  dive: [V.heart, V.work - 0.3] as const,
};
export const CITY = {start: M.dive[1] - 0.22, pass: [V.work - 0.05, V.work + 0.32] as const};
export const EXT = {start: CITY.pass[0] + 0.05, slow: V.work + 0.55, hold: [V.self - 0.14, V.self] as const, push: [V.self, V.self + 0.34] as const};
export const HALL = {start: EXT.push[0] + 0.14, hold: [V.search - 0.08, V.search + 0.04] as const};
export const NET = {
  burst: V.search + 0.04, // the hall breaks into supplier cards
  search: V.sups - 0.02,
  verify: (V.sups + V.fact) / 2,
  compare: V.fact - 0.02,
  hold: [V.fit - 0.18, V.fit - 0.02] as const,
  select: V.fit - 0.02,
  through: [V.fit + 0.24, END] as const,
};
