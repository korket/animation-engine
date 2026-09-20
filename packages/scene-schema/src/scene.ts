import { fail, number, object, text } from './validation.ts';
import { timeToFrames } from './timing.ts';
import { parseLayout, parsePosition } from './layout.ts';
import type { Position, Layout } from './layout.ts';
import { parseAnimations, parseCamera } from './choreography.ts';
import type { AnimationClip, CameraClip } from './choreography.ts';
import { parseCharacter, parseAttachment } from './character.ts';
import type { CharacterDefinition, Attachment } from './character.ts';
import { parseVisual, visualFields } from './visuals.ts';
import type { VisualDefinition } from './visuals.ts';
export type { Position } from './layout.ts';

/** Literal colors for basic SVG geometry; semantic asset styling arrives separately. */
export type Color = `#${string}`;
export type Paint = Color | `role:${string}`;
export type ThemeReference = Readonly<{ id: string; version: string }>;

type NodeBase = Readonly<{
  attachment?: Attachment;
  id: string;
  position: Position;
  start: number;
  duration: number;
}>;

export type SceneNode = NodeBase &
  (
    | (VisualDefinition & Readonly<{ width: number; height: number }>)
    | (CharacterDefinition &
        Readonly<{ type: 'character'; width: number; height: number }>)
    | Readonly<{
        type: 'group';
        width: number;
        height: number;
        children: readonly SceneNode[];
        layout?: Layout;
      }>
    | Readonly<{ type: 'circle'; radius: number; fill: Paint }>
    | Readonly<{ type: 'rect'; width: number; height: number; fill: Paint }>
    | Readonly<{
        type: 'asset';
        width: number;
        height: number;
        assetId: string;
        assetVersion: string;
      }>
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
  background: Paint;
  theme?: ThemeReference;
  nodes: readonly SceneNode[];
  layout?: Layout;
  animations?: readonly AnimationClip[];
  camera?: readonly CameraClip[];
  motionMode?: 'full' | 'reduced';
}>;

function color(input: unknown, path: string, themed: boolean): Paint {
  if (typeof input === 'string' && /^role:[a-z][a-z0-9_-]*$/.test(input)) {
    if (!themed) fail(path, 'semantic colors require an explicit theme');
    return input as Paint;
  }
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
    'theme',
    'layout',
    'animations',
    'camera',
    'motionMode',
  ]);
  if (scene.schemaVersion !== 1)
    fail('scene.schemaVersion', 'only version 1 is supported');
  const fps = number(scene.fps, 'scene.fps', true, 1);
  const duration = positive(scene.duration, 'scene.duration');
  const totalFrames = timeToFrames(duration, fps, 'scene.duration');
  if (totalFrames === 0)
    fail('scene.duration', 'must contain at least one frame');
  const ids = new Set<string>();
  let theme: ThemeReference | undefined;
  if (scene.theme !== undefined) {
    const value = object(scene.theme, 'scene.theme', ['id', 'version']);
    theme = {
      id: text(value.id, 'scene.theme.id'),
      version: text(value.version, 'scene.theme.version'),
    };
    if (!/^[1-9]\d*$/.test(theme.version))
      fail('scene.theme.version', 'expected explicit positive version string');
  }

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
        'assetId',
        'assetVersion',
        'layout',
        'attachment',
        'characterId',
        'characterVersion',
        'pose',
        'expression',
        'walkStepDuration',
        'actions',
        ...visualFields,
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
      const common = [
        'id',
        'type',
        'position',
        'start',
        'duration',
        'attachment',
      ];
      const base = {
        id,
        start,
        duration,
        position: parsePosition(node.position, `${p}.position`),
        ...(node.attachment !== undefined
          ? { attachment: parseAttachment(node.attachment, `${p}.attachment`) }
          : {}),
      };
      switch (node.type) {
        case 'memoryOrb':
        case 'thoughtBubble':
        case 'contextBubble':
        case 'barChart':
        case 'label':
          if (!theme) fail(p, 'visual components require an explicit theme');
          return {
            ...base,
            width: positive(node.width, `${p}.width`),
            height: positive(node.height, `${p}.height`),
            ...parseVisual(node, p, fps, length, common),
          };
        case 'character':
          object(node, p, [
            ...common,
            'width',
            'height',
            'characterId',
            'characterVersion',
            'pose',
            'expression',
            'walkStepDuration',
            'actions',
          ]);
          if (!theme) fail(p, 'character nodes require an explicit theme');
          return {
            ...base,
            type: 'character',
            width: positive(node.width, `${p}.width`),
            height: positive(node.height, `${p}.height`),
            ...parseCharacter(node, p, fps, length),
          };
        case 'circle':
          object(node, p, [...common, 'radius', 'fill']);
          return {
            ...base,
            type: 'circle',
            radius: positive(node.radius, `${p}.radius`),
            fill: color(node.fill, `${p}.fill`, !!theme),
          };
        case 'rect':
          object(node, p, [...common, 'width', 'height', 'fill']);
          return {
            ...base,
            type: 'rect',
            width: positive(node.width, `${p}.width`),
            height: positive(node.height, `${p}.height`),
            fill: color(node.fill, `${p}.fill`, !!theme),
          };
        case 'group':
          object(node, p, [...common, 'width', 'height', 'children', 'layout']);
          return {
            ...base,
            type: 'group',
            width: positive(node.width, `${p}.width`),
            height: positive(node.height, `${p}.height`),
            children: nodes(node.children, `${p}.children`, length),
            ...(node.layout !== undefined
              ? { layout: parseLayout(node.layout, `${p}.layout`) }
              : {}),
          };
        case 'asset': {
          object(node, p, [
            ...common,
            'width',
            'height',
            'assetId',
            'assetVersion',
          ]);
          if (!theme) fail(p, 'asset nodes require an explicit theme');
          const assetVersion = text(node.assetVersion, `${p}.assetVersion`);
          if (!/^[1-9]\d*$/.test(assetVersion))
            fail(
              `${p}.assetVersion`,
              'expected explicit positive version string',
            );
          return {
            ...base,
            type: 'asset',
            width: positive(node.width, `${p}.width`),
            height: positive(node.height, `${p}.height`),
            assetId: text(node.assetId, `${p}.assetId`),
            assetVersion,
          };
        }
        default:
          return fail(
            `${p}.type`,
            'expected group, circle, rect, asset, character, memoryOrb, thoughtBubble, contextBubble, label, or barChart',
          );
      }
    });
  }

  const importance = scene.importance;
  if (
    scene.motionMode !== undefined &&
    scene.motionMode !== 'full' &&
    scene.motionMode !== 'reduced'
  )
    fail('scene.motionMode', 'expected full or reduced');
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
    background: color(scene.background, 'scene.background', !!theme),
    ...(theme ? { theme } : {}),
    nodes: nodes(scene.nodes, 'scene.nodes', totalFrames),
    ...(scene.layout !== undefined
      ? { layout: parseLayout(scene.layout, 'scene.layout') }
      : {}),
    ...(scene.animations !== undefined
      ? { animations: parseAnimations(scene.animations, fps, totalFrames) }
      : {}),
    ...(scene.camera !== undefined
      ? { camera: parseCamera(scene.camera, fps, totalFrames) }
      : {}),
    ...(scene.motionMode !== undefined ? { motionMode: scene.motionMode } : {}),
  };
}
