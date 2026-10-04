import React from 'react';
import {SCENES, SCENE_STRIDE} from '../config';
import {FactLayout} from '../components/FactLayout';
import {SceneShell} from '../components/SceneShell';
import {SpeedBar, SpeedStreaks} from '../components/SpeedLines';

const scene = SCENES[2];
const BASE = 12; // بعد انتهاء الـ Wipe

export const Scene3: React.FC = () => (
  <SceneShell image={scene.image} fallback={scene.fallback} startFrame={2 * SCENE_STRIDE} flashAt={BASE} panDirection={1}>
    <SpeedStreaks />
    <FactLayout scene={scene} base={BASE} extra={<SpeedBar startFrame={BASE + 8 + scene.title.split(/\s+/).length * 3} />} />
  </SceneShell>
);
