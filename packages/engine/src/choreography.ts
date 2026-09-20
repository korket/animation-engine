import {
  ease,
  frameProgress,
  sampleEffect,
  sampleCamera,
  staggerFrames,
} from '@animation-engine/animation';
import type {
  Effect,
  CameraEffect,
  Easing,
  Point,
} from '@animation-engine/animation';
import { timeToFrames } from '@animation-engine/scene-schema';
import type { Scene, Color, Paint } from '@animation-engine/scene-schema';

export type Matrix = readonly [number, number, number, number, number, number];
const identity: Matrix = [1, 0, 0, 1, 0, 0];
export type NodeFrame = Readonly<{
  id: string;
  parentId?: string;
  group: boolean;
  cx: number;
  cy: number;
  width: number;
  height: number;
  startFrame: number;
  endFrame: number;
}>;
type Clip = Readonly<{
  target: string;
  start: number;
  duration: number;
  easing: Easing;
  effect: Effect;
}>;
type Camera = Readonly<{
  start: number;
  duration: number;
  easing: Easing;
  effect: CameraEffect;
}>;
export type Choreography = Readonly<{
  nodes: readonly NodeFrame[];
  clips: readonly Clip[];
  camera: readonly Camera[];
  reduced: boolean;
}>;
export type Presentation = Readonly<{
  matrix: Matrix;
  opacity: number;
  highlights: readonly { color: Color; width: number; opacity: number }[];
}>;

export function compileChoreography(
  scene: Scene,
  nodes: readonly NodeFrame[],
  paint: (paint: Paint) => Color,
): Choreography {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const clips: Clip[] = [];
  for (const animation of scene.animations ?? []) {
    const intervals = staggerFrames(
      timeToFrames(animation.start, scene.fps),
      timeToFrames(animation.duration, scene.fps),
      timeToFrames(animation.stagger, scene.fps),
      animation.targets.length,
    );
    animation.targets.forEach((target, index) => {
      const node = byId.get(target);
      if (!node) throw new Error(`animation: unknown target ${target}`);
      const interval = intervals[index]!;
      if (
        interval.start < node.startFrame ||
        interval.start + interval.duration > node.endFrame
      )
        throw new Error(
          `animation ${target}: interval must fit target visibility`,
        );
      if (animation.effect.type === 'highlight' && node.group)
        throw new Error(
          `animation ${target}: highlight requires a leaf target`,
        );
      const effect =
        animation.effect.type === 'highlight'
          ? { ...animation.effect, color: paint(animation.effect.color) }
          : animation.effect;
      clips.push({ target, ...interval, easing: animation.easing, effect });
    });
  }
  const camera = (scene.camera ?? []).map((clip) => {
    const start = timeToFrames(clip.start, scene.fps),
      duration = timeToFrames(clip.duration, scene.fps);
    if (clip.effect.type === 'cameraFollow') {
      const target = byId.get(clip.effect.target);
      if (!target)
        throw new Error(`camera: unknown target ${clip.effect.target}`);
      if (start < target.startFrame || start + duration > target.endFrame)
        throw new Error('cameraFollow interval must fit target visibility');
    }
    return { start, duration, easing: clip.easing, effect: clip.effect };
  });
  return { nodes, clips, camera, reduced: scene.motionMode === 'reduced' };
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}
export function transformPoint(matrix: Matrix, point: Point): Point {
  return {
    x: matrix[0] * point.x + matrix[2] * point.y + matrix[4],
    y: matrix[1] * point.x + matrix[3] * point.y + matrix[5],
  };
}

export function evaluateChoreography(
  choreography: Choreography,
  frame: number,
  width: number,
  height: number,
) {
  const nodes = new Map(choreography.nodes.map((node) => [node.id, node]));
  function statesAt(at: number) {
    const cache = new Map<string, Presentation>();
    function state(id: string): Presentation {
      const existing = cache.get(id);
      if (existing) return existing;
      const node = nodes.get(id);
      if (!node) throw new Error(`motion: missing node ${id}`);
      let x = 0,
        y = 0,
        scale = 1,
        rotation = 0,
        opacity = 1;
      const highlights: { color: Color; width: number; opacity: number }[] = [];
      for (const clip of choreography.clips.filter(
        (clip) => clip.target === id,
      )) {
        const p = ease(
          clip.easing,
          frameProgress(at, clip.start, clip.duration),
        );
        const sample = sampleEffect(clip.effect, p);
        opacity *= sample.opacity;
        if (!choreography.reduced) {
          x += sample.x;
          y += sample.y;
          scale *= sample.scale;
          rotation += sample.rotation;
        }
        if (clip.effect.type === 'highlight')
          highlights.push({
            color: clip.effect.color as Color,
            width: clip.effect.width,
            opacity: sample.highlight,
          });
      }
      const angle = (rotation * Math.PI) / 180,
        c = Math.cos(angle) * scale,
        s = Math.sin(angle) * scale;
      const local: Matrix = [
        c,
        s,
        -s,
        c,
        node.cx + x - c * node.cx + s * node.cy,
        node.cy + y - s * node.cx - c * node.cy,
      ];
      const parent = node.parentId
        ? state(node.parentId)
        : { matrix: identity, opacity: 1 };
      const matrix = multiply(parent.matrix, local);
      opacity *= parent.opacity;
      if (![...matrix, opacity].every(Number.isFinite))
        throw new Error(`motion ${id}: numeric overflow`);
      const result = { matrix, opacity, highlights };
      cache.set(id, result);
      return result;
    }
    return state;
  }
  const state = statesAt(frame);
  let camera: Matrix = identity;
  if (!choreography.reduced) {
    const clip = choreography.camera
      .filter((clip) => clip.start <= frame)
      .at(-1);
    if (clip) {
      const at = Math.min(frame, clip.start + clip.duration);
      let target: Point | undefined;
      if (clip.effect.type === 'cameraFollow') {
        const node = nodes.get(clip.effect.target)!;
        target = transformPoint(statesAt(at)(node.id).matrix, {
          x: node.cx,
          y: node.cy,
        });
      }
      const sampled = sampleCamera(
        clip.effect,
        ease(clip.easing, frameProgress(at, clip.start, clip.duration)),
        target,
      );
      camera = [
        sampled.zoom,
        0,
        0,
        sampled.zoom,
        width / 2 - sampled.zoom * sampled.x,
        height / 2 - sampled.zoom * sampled.y,
      ];
      if (!camera.every(Number.isFinite))
        throw new Error('camera: numeric overflow');
    }
  }
  return { state, camera };
}
