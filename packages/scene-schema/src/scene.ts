import { fail, number, object, text } from './validation.ts';
import { timeToFrames } from './timing.ts';

/** Literal colors for basic SVG geometry; semantic asset styling arrives separately. */
export type Color = `#${string}`;
export type Position = 'center' | Readonly<{ x: number; y: number }>;

type NodeBase = Readonly<{
  id: string;
  position: Position;
  start: number;
  duration: number;
}>;

export type SceneNode = NodeBase &
  (
    | Readonly<{
        type: 'group';
        width: number;
        height: number;
        children: readonly SceneNode[];
      }>
    | Readonly<{ type: 'circle'; radius: number; fill: Color }>
    | Readonly<{ type: 'rect'; width: number; height: number; fill: Color }>
  );

export type Scene = Readonly<{
  schemaVersion: 1;
  id: string;
  purpose: string;
  emotion: string;
  importance: 'low' | 'medium' | 'high';
  width: number;
  height: number;
  fps: number;
  duration: number;
  background: Color;
  nodes: readonly SceneNode[];
}>;

function color(input: unknown, path: string): Color {
  if (typeof input !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(input)) {
    return fail(path, 'expected a six-digit hex color');
  }
  return input as Color;
}

function positive(input: unknown, path: string): number {
  const result = number(input, path, false, 0);
  if (result === 0) fail(path, 'must be positive');
  return result;
}

function position(input: unknown, path: string): Position {
  if (input === 'center') return input;
  const value = object(input, path, ['x', 'y']);
  return {
    x: number(value.x, `${path}.x`, false, -Number.MAX_VALUE),
    y: number(value.y, `${path}.y`, false, -Number.MAX_VALUE),
  };
}

export function parseScene(input: unknown): Scene {
  const scene = object(input, 'scene', [
    'schemaVersion',
    'id',
    'purpose',
    'emotion',
    'importance',
    'width',
    'height',
    'fps',
    'duration',
    'background',
    'nodes',
  ]);
  if (scene.schemaVersion !== 1)
    fail('scene.schemaVersion', 'only version 1 is supported');
  const fps = number(scene.fps, 'scene.fps', true, 1);
  const duration = positive(scene.duration, 'scene.duration');
  const totalFrames = timeToFrames(duration, fps, 'scene.duration');
  if (totalFrames === 0)
    fail('scene.duration', 'must contain at least one frame');
  const ids = new Set<string>();

  function nodes(
    input: unknown,
    path: string,
    parentFrames: number,
  ): readonly SceneNode[] {
    if (!Array.isArray(input)) return fail(path, 'expected an array');
    return input.map((value: unknown, index) => {
      const p = `${path}[${index}]`;
      const node = object(value, p, [
        'id',
        'type',
        'position',
        'start',
        'duration',
        'width',
        'height',
        'radius',
        'fill',
        'children',
      ]);
      const id = text(node.id, `${p}.id`);
      if (ids.has(id)) fail(`${p}.id`, `duplicate node ID "${id}"`);
      ids.add(id);
      const start = number(node.start, `${p}.start`, false, 0);
      const duration = positive(node.duration, `${p}.duration`);
      const startFrame = timeToFrames(start, fps, `${p}.start`);
      const length = timeToFrames(duration, fps, `${p}.duration`);
      if (length === 0)
        fail(`${p}.duration`, 'must contain at least one frame');
      if (startFrame > parentFrames || length > parentFrames - startFrame) {
        fail(
          `${p}.duration`,
          'node interval must fit within its parent interval',
        );
      }
      const common = ['id', 'type', 'position', 'start', 'duration'];
      const base = {
        id,
        start,
        duration,
        position: position(node.position, `${p}.position`),
      };
      switch (node.type) {
        case 'circle':
          object(node, p, [...common, 'radius', 'fill']);
          return {
            ...base,
            type: 'circle',
            radius: positive(node.radius, `${p}.radius`),
            fill: color(node.fill, `${p}.fill`),
          };
        case 'rect':
          object(node, p, [...common, 'width', 'height', 'fill']);
          return {
            ...base,
            type: 'rect',
            width: positive(node.width, `${p}.width`),
            height: positive(node.height, `${p}.height`),
            fill: color(node.fill, `${p}.fill`),
          };
        case 'group':
          object(node, p, [...common, 'width', 'height', 'children']);
          return {
            ...base,
            type: 'group',
            width: positive(node.width, `${p}.width`),
            height: positive(node.height, `${p}.height`),
            children: nodes(node.children, `${p}.children`, length),
          };
        default:
          return fail(`${p}.type`, 'expected group, circle, or rect');
      }
    });
  }

  const importance = scene.importance;
  if (
    importance !== 'low' &&
    importance !== 'medium' &&
    importance !== 'high'
  ) {
    fail('scene.importance', 'expected low, medium, or high');
  }
  return {
    schemaVersion: 1,
    id: text(scene.id, 'scene.id'),
    purpose: text(scene.purpose, 'scene.purpose'),
    emotion: text(scene.emotion, 'scene.emotion'),
    importance,
    width: number(scene.width, 'scene.width', true, 1),
    height: number(scene.height, 'scene.height', true, 1),
    fps,
    duration,
    background: color(scene.background, 'scene.background'),
    nodes: nodes(scene.nodes, 'scene.nodes', totalFrames),
  };
}
