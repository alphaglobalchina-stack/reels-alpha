import React from 'react';
import {SCENES, SCENE_STRIDE} from '../config';
import {FactLayout} from '../components/FactLayout';
import {SceneShell} from '../components/SceneShell';

const scene = SCENES[0];
const BASE = 0; // المشهد الأول بلا Wipe

export const Scene1: React.FC = () => (
  <SceneShell image={scene.image} fallback={scene.fallback} startFrame={0 * SCENE_STRIDE} flashAt={BASE} panDirection={1}>
    <FactLayout scene={scene} base={BASE} titleSize={128} numberSize={340} />
  </SceneShell>
);
