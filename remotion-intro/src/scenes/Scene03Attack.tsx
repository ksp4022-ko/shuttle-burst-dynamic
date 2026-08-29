import React from 'react';
import type {V8IntroProps} from '../config/schema';
import {SceneCanvas} from './SceneCanvas';

export const Scene03_Attack: React.FC<{frame: number; width: number; height: number; preset: V8IntroProps}> = (props) => <SceneCanvas {...props} scene="Scene03_Attack" />;
