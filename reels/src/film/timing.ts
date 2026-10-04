/**
 * Voice-over timing master. Every cue in the film is looked up here by spoken word —
 * the numbers come from content/vo-timing.json (CTC forced alignment of the script
 * against assets/voiceover.mp3, see pipeline/align.py; the spoken company name is
 * cut out by pipeline/edit_vo.py).
 */
import vo from '../../../content/vo-timing.json';

export const FPS = 60;
export const HOLD = 3.6; // clean CTA hold after the voice-over ends
export const DURATION = Math.round((vo.duration + HOLD) * FPS) / FPS;
export const TOTAL_FRAMES = Math.round(DURATION * FPS);

export type Word = (typeof vo.words)[number];
export type Phrase = (typeof vo.phrases)[number];

export const words: Word[] = vo.words;
export const phrases: Phrase[] = vo.phrases;

const DIAC = /[ً-ْٰـ.,،…]/g;
const norm = (s: string) => s.replace(DIAC, '').toLowerCase();

/** The nth (1-based) spoken occurrence of a word, searching from `after` seconds. */
export const word = (text: string, nth = 1, after = 0): Word => {
  const n = norm(text);
  const hits = words.filter((w) => w.start >= after && norm(w.text) === n);
  const w = hits[nth - 1];
  if (!w) throw new Error(`VO cue not found: ${text} #${nth} after ${after}`);
  return w;
};

/** Start time (seconds) of a spoken word. */
export const at = (text: string, nth = 1, after = 0) => word(text, nth, after).start;
/** End of a word = start of the next spoken word (CTC ends are early), capped. */
export const end = (text: string, nth = 1, after = 0) => {
  const w = word(text, nth, after);
  const next = words[w.i + 1];
  return next && next.phrase === w.phrase ? next.start : w.end;
};
/** Logo hit — inside the pause left where the company name was cut from the VO. */
export const BRAND: number = (vo as {marks: {brand: number}}).marks.brand;

export const phraseOf = (i: number) => phrases[i];
