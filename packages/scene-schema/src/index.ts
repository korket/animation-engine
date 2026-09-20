/** Internal Milestone 0 fixture contract, not the production scene format. */
export type SmokeScene = Readonly<{
  format: 'smoke-v0';
  id: string;
  purpose: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  background: 'background';
  shape: Readonly<{
    type: 'circle';
    placement: 'center';
    radius: number;
    fill: 'accent';
  }>;
  fade: Readonly<{ startFrame: number; endFrame: number }>;
}>;

import { fail, literal, number, object, text } from './validation.ts';

export { parseScene } from './scene.ts';
export type {
  Scene,
  SceneNode,
  Position,
  Color,
  Paint,
  ThemeReference,
} from './scene.ts';
export { timeToFrames } from './timing.ts';
export { layoutNames } from './layout.ts';
export type { Layout } from './layout.ts';
export type { AnimationClip, CameraClip } from './choreography.ts';

export function parseSmokeScene(input: unknown): SmokeScene {
  const scene = object(input, 'scene', [
    'format',
    'id',
    'purpose',
    'width',
    'height',
    'fps',
    'durationInFrames',
    'background',
    'shape',
    'fade',
  ]);
  const shape = object(scene.shape, 'scene.shape', [
    'type',
    'placement',
    'radius',
    'fill',
  ]);
  const fade = object(scene.fade, 'scene.fade', ['startFrame', 'endFrame']);
  const width = number(scene.width, 'scene.width', true, 2);
  const height = number(scene.height, 'scene.height', true, 2);
  if (width % 2 !== 0) fail('scene.width', 'must be even for H.264/yuv420p');
  if (height % 2 !== 0) fail('scene.height', 'must be even for H.264/yuv420p');
  const durationInFrames = number(
    scene.durationInFrames,
    'scene.durationInFrames',
    true,
    1,
  );
  const radius = number(shape.radius, 'scene.shape.radius', false, 0);
  if (radius <= 0 || radius * 2 > Math.min(width, height)) {
    fail('scene.shape.radius', 'must be positive and fit within the canvas');
  }
  const startFrame = number(fade.startFrame, 'scene.fade.startFrame', true, 0);
  const endFrame = number(fade.endFrame, 'scene.fade.endFrame', true, 0);
  if (endFrame <= startFrame || endFrame >= durationInFrames) {
    fail(
      'scene.fade.endFrame',
      'must be after startFrame and before durationInFrames',
    );
  }
  return {
    format: literal(scene.format, 'smoke-v0', 'scene.format'),
    id: text(scene.id, 'scene.id'),
    purpose: text(scene.purpose, 'scene.purpose'),
    width,
    height,
    fps: number(scene.fps, 'scene.fps', true, 1),
    durationInFrames,
    background: literal(scene.background, 'background', 'scene.background'),
    shape: {
      type: literal(shape.type, 'circle', 'scene.shape.type'),
      placement: literal(shape.placement, 'center', 'scene.shape.placement'),
      radius,
      fill: literal(shape.fill, 'accent', 'scene.shape.fill'),
    },
    fade: { startFrame, endFrame },
  };
}
export type { CharacterDefinition, Attachment } from './character.ts';
