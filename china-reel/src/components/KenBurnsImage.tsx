import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Img, continueRender, delayRender, interpolate, useCurrentFrame} from 'remotion';

type Props = {
  src: string;
  /** تدرج بديل إن فشل تحميل الصورة */
  fallback: [string, string, string];
  durationInFrames: number;
  /** اتجاه الـ pan: 1 يمين، -1 يسار */
  panDirection?: 1 | -1;
};

/** يحمّل الصورة مسبقًا؛ عند الفشل أو انتهاء المهلة يرجع إلى 'fail' بدل أن ينكسر الريندر. */
const useImageState = (src: string) => {
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>(src ? 'loading' : 'fail');
  useEffect(() => {
    if (!src) return;
    const handle = delayRender(`image ${src}`, {timeoutInMilliseconds: 30000});
    let finished = false;
    const done = (s: 'ok' | 'fail') => {
      if (finished) return;
      finished = true;
      setState(s);
      continueRender(handle);
    };
    const img = new window.Image();
    img.onload = () => done('ok');
    img.onerror = () => done('fail');
    img.src = src;
    const timer = setTimeout(() => done('fail'), 15000);
    return () => {
      clearTimeout(timer);
      done('fail');
    };
  }, [src]);
  return state;
};

export const KenBurnsImage: React.FC<Props> = ({src, fallback, durationInFrames, panDirection = 1}) => {
  const frame = useCurrentFrame();
  const state = useImageState(src);
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {extrapolateRight: 'clamp'});
  const scale = 1 + 0.15 * t;
  const tx = panDirection * interpolate(t, [0, 1], [-18, 18]);
  const ty = interpolate(t, [0, 1], [10, -10]);
  const transform = `translate(${tx}px, ${ty}px) scale(${scale})`;

  return (
    <AbsoluteFill style={{overflow: 'hidden', background: fallback[2]}}>
      {state === 'ok' ? (
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover', transform}} />
      ) : (
        <AbsoluteFill
          style={{
            transform,
            background: `radial-gradient(ellipse 80% 45% at 70% 28%, ${fallback[1]}cc 0%, transparent 70%),
                         radial-gradient(ellipse 70% 40% at 20% 75%, ${fallback[1]}88 0%, transparent 70%),
                         linear-gradient(180deg, ${fallback[0]} 0%, ${fallback[1]} 55%, ${fallback[2]} 100%)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
