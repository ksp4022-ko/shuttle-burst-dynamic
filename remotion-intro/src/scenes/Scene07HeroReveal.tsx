import React from 'react';
import type {V8IntroProps} from '../config/schema';
import type {SceneTiming} from '../config/timing';
import {SceneCanvas} from './SceneCanvas';

export const Scene07_HeroReveal: React.FC<{frame: number; width: number; height: number; preset: V8IntroProps; timing: SceneTiming}> = (props) => <SceneCanvas {...props} scene="Scene07_HeroReveal" />;
