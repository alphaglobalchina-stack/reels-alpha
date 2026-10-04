import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {COLORS} from './config';

const SKEW = 32; // ميلان القطر (% من العرض)
const BAND = 24; // سُمك الشريط الأحمر (% من العرض)

/** Wipe قطري أحمر: يكتسح من اليمين إلى اليسار (اتجاه القراءة العربي) مع شريط أحمر في الحافة. */
const WipeComponent: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  // حافة الاكتساح تتحرك من x=100+SKEW إلى x=-BAND
  const edge = 100 + SKEW - presentationProgress * (100 + SKEW + BAND);
  const content = `polygon(${edge}% 0%, 100% 0%, 100% 100%, ${edge - SKEW}% 100%)`;
  const band = `polygon(${edge}% 0%, ${edge + BAND}% 0%, ${edge + BAND - SKEW}% 100%, ${edge - SKEW}% 100%)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: content}}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: band,
          background: `linear-gradient(90deg, ${COLORS.red}, #ff4a2e 60%, ${COLORS.red})`,
          boxShadow: '0 0 60px rgba(222,41,16,0.9)',
        }}
      />
    </AbsoluteFill>
  );
};

export const diagonalRedWipe = (): TransitionPresentation<Record<string, never>> => ({
  component: WipeComponent,
  props: {},
});
