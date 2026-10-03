import React from 'react';
import {SCENES, SCENE_STRIDE} from '../config';
import {FactLayout} from '../components/FactLayout';
import {SceneShell} from '../components/SceneShell';

const scene = SCENES[4];
const BASE = 12; // بعد انتهاء الـ Wipe

export const Scene5: React.FC = () => (
  <SceneShell image={scene.image} fallback={scene.fallback} startFrame={4 * SCENE_STRIDE} flashAt={BASE} panDirection={1}>
    <FactLayout scene={scene} base={BASE}  />
  </SceneShell>
);
