import { parseScene, timeToFrames } from '@animation-engine/scene-schema';
import type { Color, SceneNode } from '@animation-engine/scene-schema';

type ElementBase = Readonly<{
  id: string;
  fill: Color;
  startFrame: number;
  endFrame: number;
}>;
export type SceneElement = ElementBase &
  (
    | Readonly<{ type: 'circle'; cx: number; cy: number; radius: number }>
    | Readonly<{
        type: 'rect';
        x: number;
        y: number;
        width: number;
        height: number;
      }>
  );

export type CompiledScene = Readonly<{
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  background: Color;
  elements: readonly SceneElement[];
}>;

export type SceneFrame = Readonly<{
  width: number;
  height: number;
  background: Color;
  elements: readonly SceneElement[];
}>;

/** Validate and compile a tree into an ordered display list in canvas coordinates. */
export function compileScene(input: unknown): CompiledScene {
  const scene = parseScene(input);
  const elements: SceneElement[] = [];

  function visit(
    nodes: readonly SceneNode[],
    parent: {
      x: number;
      y: number;
      width: number;
      height: number;
      startFrame: number;
    },
  ) {
    for (const node of nodes) {
      const cx =
        parent.x +
        (node.position === 'center' ? parent.width / 2 : node.position.x);
      const cy =
        parent.y +
        (node.position === 'center' ? parent.height / 2 : node.position.y);
      const startFrame =
        parent.startFrame + timeToFrames(node.start, scene.fps);
      const endFrame = startFrame + timeToFrames(node.duration, scene.fps);
      const width = node.type === 'circle' ? node.radius * 2 : node.width;
      const height = node.type === 'circle' ? node.radius * 2 : node.height;
      const x = cx - width / 2;
      const y = cy - height / 2;
      if (
        ![cx, cy, width, height, x, y, x + width, y + height].every(
          Number.isFinite,
        )
      ) {
        throw new Error(
          `node "${node.id}": resolved geometry exceeds the finite coordinate range`,
        );
      }
      if (node.type === 'group') {
        visit(node.children, { x, y, width, height, startFrame });
      } else if (node.type === 'circle') {
        elements.push({
          id: node.id,
          type: 'circle',
          cx,
          cy,
          radius: node.radius,
          fill: node.fill,
          startFrame,
          endFrame,
        });
      } else {
        elements.push({
          id: node.id,
          type: 'rect',
          x,
          y,
          width,
          height,
          fill: node.fill,
          startFrame,
          endFrame,
        });
      }
    }
  }

  visit(scene.nodes, {
    x: 0,
    y: 0,
    width: scene.width,
    height: scene.height,
    startFrame: 0,
  });
  return {
    id: scene.id,
    width: scene.width,
    height: scene.height,
    fps: scene.fps,
    durationInFrames: timeToFrames(scene.duration, scene.fps),
    background: scene.background,
    elements,
  };
}

/** Evaluate by integer frame only; there is no accumulated playback state. */
export function evaluateScene(scene: CompiledScene, frame: number): SceneFrame {
  if (
    !Number.isInteger(frame) ||
    frame < 0 ||
    frame >= scene.durationInFrames
  ) {
    throw new Error(
      `frame: expected an integer in [0, ${scene.durationInFrames})`,
    );
  }
  return {
    width: scene.width,
    height: scene.height,
    background: scene.background,
    elements: scene.elements.filter(
      (element) => frame >= element.startFrame && frame < element.endFrame,
    ),
  };
}
