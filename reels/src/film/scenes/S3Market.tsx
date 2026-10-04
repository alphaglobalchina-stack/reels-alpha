import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, IMG} from '../brand';
import {Cam, ease, H, lerp, mix3, ramp, V3, W} from '../lib';
import {Ar, At, La, Photo, Plane, Reveal} from '../ui';
import {at} from '../timing';
import {S2} from './S2Map';

/** Scene 3 — the Canton Fair: exterior → through the doors → hall corridor in depth. */
const T_WORK = at('نعمل');
const T_MARKET = at('السوق');
const T_SEARCH = at('نبحث');

export const S3 = {start: S2.end - 0.5, end: T_SEARCH + 0.32};

const T_DOOR = T_MARKET + 0.42; // push through the entrance

export const Scene3: React.FC<{t: number}> = ({t}) => {
  // Exterior: screen-space push + truck toward the sign / entrance
  const ext = ramp(t, S3.start, T_DOOR + 0.35, ease.soft);
  const door = ramp(t, T_DOOR - 0.2, T_DOOR + 0.42, ease.in);
  const extScale = 1.05 + 0.18 * ext + 2.6 * door * door;
  const extOp = 1 - ramp(t, T_DOOR + 0.1, T_DOOR + 0.42);

  // Hall: 3-D corridor
  const hallIn = ramp(t, T_DOOR - 0.05, T_DOOR + 0.5, ease.out);
  const travel = ramp(t, T_DOOR - 0.05, S3.end, ease.soft);
  const cam: Cam = {pos: mix3([0, 0, -900], [0, -20, 200], travel) as V3, yaw: lerp(0.06, -0.03, travel), roll: lerp(0.02, 0, travel)};

  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      {/* hall corridor */}
      {hallIn > 0 && (
        <AbsoluteFill style={{opacity: hallIn}}>
          <Plane cam={cam} p={[0, 0, 1350]} w={1400} h={2480}>
            <Photo src={IMG.fairHall} w={1400} h={2480} pos="50% 45%" grade="saturate(0.78) contrast(1.08) brightness(0.9) sepia(0.1)" />
          </Plane>
          <Plane cam={cam} p={[-760, 40, 820]} w={620} h={1100} rotY={58} focus={1300} dof={10}>
            <Photo src={IMG.fairBooth} w={620} h={1100} pos="20% 50%" radius={8} />
          </Plane>
          <Plane cam={cam} p={[760, 60, 760]} w={620} h={1100} rotY={-58} focus={1300} dof={10}>
            <Photo src={IMG.fairExt} w={620} h={1100} pos="12% 70%" radius={8} />
          </Plane>
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,8,10,0.6) 0%, rgba(7,8,10,0.05) 35%, rgba(7,8,10,0.1) 60%, rgba(7,8,10,0.75) 100%)'}} />
        </AbsoluteFill>
      )}
      {/* exterior */}
      {extOp > 0 && (
        <AbsoluteFill style={{opacity: extOp, transform: `scale(${extScale}) translateX(${-40 * ext}px)`, transformOrigin: '58% 57%', filter: door > 0.05 ? `blur(${door * 10}px)` : undefined}}>
          <Photo src={IMG.fairExt} w={W} h={H} pos="62% 50%" />
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,8,10,0.55) 0%, rgba(7,8,10,0.05) 30%, rgba(7,8,10,0.15) 62%, rgba(7,8,10,0.8) 100%)'}} />
        </AbsoluteFill>
      )}
      {/* type */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 22% at 50% 43%, rgba(7,8,10,0.55) 0%, rgba(7,8,10,0) 100%)', opacity: ramp(t, T_WORK, T_MARKET) * (1 - ramp(t, S3.end - 0.4, S3.end))}} />
      <At y={640}>
        <Reveal t={t} at={T_WORK + 0.1} dur={0.5} out={T_DOOR} outDur={0.3}>
          <La size={22} track={0.55} color={C.goldPale}>
            On the ground in Guangzhou
          </La>
        </Reveal>
      </At>
      <At y={820}>
        <Reveal t={t} at={T_MARKET - 0.04} dur={0.55} blur={18} out={S3.end - 0.32} outDur={0.3}>
          <div style={{filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.7))'}}>
            <Ar size={230} weight={800} gold shimmer={ramp(t, T_MARKET, T_MARKET + 1.2, ease.inOut)} lh={1.1}>
              السوق
            </Ar>
          </div>
          <La size={24} track={0.55} color={C.white} style={{marginTop: 8}}>
            Inside the market
          </La>
        </Reveal>
      </At>
    </AbsoluteFill>
  );
};
