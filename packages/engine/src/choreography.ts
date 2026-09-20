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
import type { Attachment } from '@animation-engine/scene-schema';
import {
  evaluateCharacter,
  characterAnchorNames,
} from '@animation-engine/characters';
import type { CharacterState } from '@animation-engine/characters';
import { visualAnchor } from './visuals.ts';
import type { VisualRuntime } from './visuals.ts';

export type Matrix = readonly [number, number, number, number, number, number];
const identity: Matrix = [1, 0, 0, 1, 0, 0];
export type NodeFrame = Readonly<{
  attachment?: Attachment;
  character?: CharacterState;
  visual?: VisualRuntime;
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
  const checked = new Set<string>(),
    visiting = new Set<string>();
  function check(node: NodeFrame) {
    if (checked.has(node.id)) return;
    if (visiting.has(node.id))
      throw new Error(`attachment ${node.id}: cyclic relationship`);
    visiting.add(node.id);
    if (node.attachment) {
      const target = byId.get(node.attachment.target);
      if (!target || target.parentId !== node.parentId)
        throw new Error(
          `attachment ${node.id}: target must be an existing sibling`,
        );
      const names: readonly string[] = [
        'center',
        'top',
        'bottom',
        'left',
        'right',
        ...(target.character ? characterAnchorNames : []),
        ...(target.visual?.definition.type === 'barChart'
          ? target.visual.definition.bars.map((b) => `bar.${b.id}`)
          : []),
      ];
      if (!names.includes(node.attachment.anchor))
        throw new Error(
          `attachment ${node.id}: unknown anchor ${node.attachment.anchor}`,
        );
      if (
        node.startFrame < target.startFrame ||
        node.endFrame > target.endFrame
      )
        throw new Error(
          `attachment ${node.id}: interval must fit target visibility`,
        );
      check(target);
    }
    visiting.delete(node.id);
    checked.add(node.id);
  }
  nodes.forEach(check);
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
      let parent = node.parentId
        ? state(node.parentId)
        : { matrix: identity, opacity: 1 };
      let placement: Matrix = identity;
      if (node.attachment) {
        const target = nodes.get(node.attachment.target)!;
        parent = state(target.id);
        const anchor = resolveAnchor(
          target,
          node.attachment.anchor,
          at,
          choreography.reduced,
        );
        placement = [
          1,
          0,
          0,
          1,
          anchor.x + node.attachment.offset.x - node.cx,
          anchor.y + node.attachment.offset.y - node.cy,
        ];
      }
      const matrix = multiply(parent.matrix, multiply(placement, local));
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

/** Character drawing and anchor use the same aspect-preserving viewport mapping. */
export function resolveAnchor(
  node: NodeFrame,
  name: string,
  frame: number,
  reduced: boolean,
): Point {
  if (node.visual?.definition.type === 'barChart' && name.startsWith('bar.')) {
    const anchor = visualAnchor(
      node.visual,
      node.width,
      node.height,
      name,
      Math.max(0, frame - node.startFrame),
      reduced,
    );
    return {
      x: node.cx - node.width / 2 + anchor.x,
      y: node.cy - node.height / 2 + anchor.y,
    };
  }
  if (
    node.character &&
    (characterAnchorNames as readonly string[]).includes(name)
  ) {
    const sampled = evaluateCharacter(
      node.character,
      Math.max(0, frame - node.startFrame),
      reduced,
    );
    const anchor =
      sampled.anchors[name as (typeof characterAnchorNames)[number]];
    const scale = Math.min(node.width / 100, node.height / 200);
    return {
      x: node.cx + (anchor.x - 50) * scale,
      y: node.cy + (anchor.y - 100) * scale,
    };
  }
  return {
    x:
      node.cx +
      (name === 'left'
        ? -node.width / 2
        : name === 'right'
          ? node.width / 2
          : 0),
    y:
      node.cy +
      (name === 'top'
        ? -node.height / 2
        : name === 'bottom'
          ? node.height / 2
          : 0),
  };
}
