import React from 'react';
import type {V8IntroProps} from '../config/schema';
import type {SceneTiming} from '../config/timing';
import {SceneCanvas} from './SceneCanvas';

export const Scene01_Standoff: React.FC<{frame: number; width: number; height: number; preset: V8IntroProps; timing: SceneTiming}> = (props) => <SceneCanvas {...props} scene="Scene01_Standoff" />;
