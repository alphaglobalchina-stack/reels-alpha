/**
 * V2 timing master — content/vo-timing-v2.json (tightened, 1.15× pitch-preserved edit of the
 * same voice-over, re-aligned on the edited audio; see pipeline/edit_vo_v2.py).
 */
import vo from '../../../content/vo-timing-v2.json';

export const FPS = 60;
export type Word = (typeof vo.words)[number];
export type Phrase = (typeof vo.phrases)[number];
export const words: Word[] = vo.words;
export const phrases: Phrase[] = vo.phrases;
export const VO_DURATION = vo.duration;
export const MARKS = vo.marks as {brand: number; vacuum: number[]};

const DIAC = /[ً-ْٰـ.,،…]/g;
const norm = (s: string) => s.replace(DIAC, '').toLowerCase();

export const word = (text: string, nth = 1, after = 0): Word => {
  const n = norm(text);
  const w = words.filter((x) => x.start >= after && norm(x.text) === n)[nth - 1];
  if (!w) throw new Error(`V2 cue not found: ${text}`);
  return w;
};
export const at = (text: string, nth = 1, after = 0) => word(text, nth, after).start;

/** Preview cut: everything before "نقارن" (Guangzhou → supplier → market → sourcing). */
export const PREVIEW_END = at('نقارن') - 0.04;
