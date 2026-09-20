import {
  easingNames,
  parseEffect,
  parseCameraEffect,
} from '@animation-engine/animation';
import type { Effect, CameraEffect, Easing } from '@animation-engine/animation';
import { fail, object, number, text } from './validation.ts';
import { timeToFrames } from './timing.ts';
export type AnimationClip = Readonly<{
  targets: readonly string[];
  stagger: number;
  start: number;
  duration: number;
  easing: Easing;
  effect: Effect;
}>;
export type CameraClip = Readonly<{
  start: number;
  duration: number;
  easing: Easing;
  effect: CameraEffect;
}>;
function timing(
  value: Record<string, unknown>,
  path: string,
  fps: number,
  total: number,
) {
  const start = number(value.start, `${path}.start`, false, 0),
    duration = number(value.duration, `${path}.duration`, false, 0);
  const s = timeToFrames(start, fps, `${path}.start`),
    d = timeToFrames(duration, fps, `${path}.duration`);
  if (d < 1 || s > total - d)
    fail(
      path,
      'animation interval must contain frames and fit within the scene',
    );
  if (!easingNames.includes(value.easing as Easing))
    fail(`${path}.easing`, 'expected an approved named easing');
  return { start, duration, easing: value.easing as Easing };
}
export function parseAnimations(
  input: unknown,
  fps: number,
  total: number,
): readonly AnimationClip[] {
  if (!Array.isArray(input)) return fail('scene.animations', 'expected array');
  return input.map((input, index) => {
    const path = `scene.animations[${index}]`;
    const value = object(input, path, [
      'target',
      'targets',
      'stagger',
      'start',
      'duration',
      'easing',
      'effect',
    ]);
    const t = timing(value, path, fps, total);
    let targets: string[],
      stagger = 0;
    if ('targets' in value) {
      if (
        'target' in value ||
        !Array.isArray(value.targets) ||
        !value.targets.length
      )
        fail(path, 'use target or nonempty targets, not both');
      targets = value.targets.map((v) => text(v, `${path}.targets`));
      if (new Set(targets).size !== targets.length)
        fail(path, 'duplicate stagger target');
      stagger = number(value.stagger, `${path}.stagger`, false, 0);
      const step = timeToFrames(stagger, fps, `${path}.stagger`);
      if (
        timeToFrames(t.start, fps) +
          (targets.length - 1) * step +
          timeToFrames(t.duration, fps) >
        total
      )
        fail(path, 'stagger exceeds scene duration');
    } else {
      if ('stagger' in value) fail(path, 'stagger requires targets');
      targets = [text(value.target, `${path}.target`)];
    }
    return {
      ...t,
      targets,
      stagger,
      effect: parseEffect(value.effect, `${path}.effect`),
    };
  });
}
export function parseCamera(
  input: unknown,
  fps: number,
  total: number,
): readonly CameraClip[] {
  if (!Array.isArray(input)) return fail('scene.camera', 'expected array');
  const clips = input.map((input, index) => {
    const path = `scene.camera[${index}]`,
      value = object(input, path, ['start', 'duration', 'easing', 'effect']);
    return {
      ...timing(value, path, fps, total),
      effect: parseCameraEffect(value.effect, `${path}.effect`),
    };
  });
  let end = 0;
  for (const clip of clips) {
    const start = timeToFrames(clip.start, fps);
    if (start < end)
      fail('scene.camera', 'camera clips must be ordered and cannot overlap');
    end = start + timeToFrames(clip.duration, fps);
  }
  return clips;
}
