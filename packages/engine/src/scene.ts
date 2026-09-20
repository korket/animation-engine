import { parseScene, timeToFrames } from '@animation-engine/scene-schema';
import type { Color, SceneNode, Paint } from '@animation-engine/scene-schema';
import {
  findAsset,
  findTheme,
  resolvePaint,
  styleArtwork,
} from '@animation-engine/assets';
import type { AssetLibrary, StyledShape } from '@animation-engine/assets';
import { resolvePositions, nodeSize } from './layout.ts';
import { compileChoreography, evaluateChoreography } from './choreography.ts';
import type {
  Choreography,
  NodeFrame,
  Matrix,
  Presentation,
} from './choreography.ts';
import type { Layout } from '@animation-engine/scene-schema';

type ElementBase = Readonly<{
  id: string;
  startFrame: number;
  endFrame: number;
  presentation?: Presentation;
}>;
export type SceneElement = ElementBase &
  (
    | Readonly<{
        type: 'circle';
        cx: number;
        cy: number;
        radius: number;
        fill: Color;
      }>
    | Readonly<{
        type: 'rect';
        x: number;
        y: number;
        width: number;
        height: number;
        fill: Color;
      }>
    | Readonly<{
        type: 'asset';
        x: number;
        y: number;
        width: number;
        height: number;
        viewBoxWidth: number;
        viewBoxHeight: number;
        shapes: readonly StyledShape[];
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
  choreography?: Choreography;
  resources?: Readonly<{
    theme: { id: string; version: string; styleVersion: string };
    assets: readonly {
      nodeId: string;
      assetId: string;
      version: string;
      sha256: string;
    }[];
  }>;
}>;

export type SceneFrame = Readonly<{
  width: number;
  height: number;
  background: Color;
  elements: readonly SceneElement[];
  camera?: Matrix;
}>;

/** Validate and compile a tree into an ordered display list in canvas coordinates. */
export function compileScene(
  input: unknown,
  library?: AssetLibrary,
): CompiledScene {
  const scene = parseScene(input);
  const elements: SceneElement[] = [];
  const nodeFrames: NodeFrame[] = [];
  if (scene.theme && !library)
    throw new Error('scene.theme: asset library is required');
  const theme =
    scene.theme && library
      ? findTheme(library, scene.theme.id, scene.theme.version)
      : undefined;
  const usage: {
    nodeId: string;
    assetId: string;
    version: string;
    sha256: string;
  }[] = [];
  const paint = (value: Paint): Color => {
    if (value.startsWith('#')) return value as Color;
    if (!theme) throw new Error('semantic paint requires a theme');
    const resolved = resolvePaint(value, theme);
    if (resolved === 'none') throw new Error('scene paint cannot be none');
    return resolved;
  };

  function visit(
    nodes: readonly SceneNode[],
    parent: {
      x: number;
      y: number;
      width: number;
      height: number;
      startFrame: number;
      id?: string;
      layout?: Layout;
    },
  ) {
    const positions = resolvePositions(
      nodes,
      parent.width,
      parent.height,
      parent.layout,
    );
    for (const node of nodes) {
      const position = positions.get(node.id)!;
      const cx = parent.x + position.x,
        cy = parent.y + position.y;
      const startFrame =
        parent.startFrame + timeToFrames(node.start, scene.fps);
      const endFrame = startFrame + timeToFrames(node.duration, scene.fps);
      const { width, height } = nodeSize(node);
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
      nodeFrames.push({
        id: node.id,
        ...(parent.id ? { parentId: parent.id } : {}),
        group: node.type === 'group',
        cx,
        cy,
        width,
        height,
        startFrame,
        endFrame,
      });
      if (node.type === 'group') {
        visit(node.children, {
          x,
          y,
          width,
          height,
          startFrame,
          id: node.id,
          ...(node.layout ? { layout: node.layout } : {}),
        });
      } else if (node.type === 'asset') {
        if (!library || !theme)
          throw new Error(`asset ${node.id}: theme and library are required`);
        const asset = findAsset(library, node.assetId, node.assetVersion);
        if (asset.styleVersion !== theme.styleVersion)
          throw new Error(
            `asset ${node.id}: style version ${asset.styleVersion} is incompatible with theme style ${theme.styleVersion}`,
          );
        elements.push({
          id: node.id,
          type: 'asset',
          x,
          y,
          width,
          height,
          startFrame,
          endFrame,
          viewBoxWidth: asset.artwork.width,
          viewBoxHeight: asset.artwork.height,
          shapes: styleArtwork(asset.artwork, theme),
        });
        usage.push({
          nodeId: node.id,
          assetId: asset.id,
          version: asset.version,
          sha256: asset.sha256,
        });
      } else if (node.type === 'circle') {
        elements.push({
          id: node.id,
          type: 'circle',
          cx,
          cy,
          radius: node.radius,
          fill: paint(node.fill),
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
          fill: paint(node.fill),
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
    ...(scene.layout ? { layout: scene.layout } : {}),
  });
  return {
    id: scene.id,
    width: scene.width,
    height: scene.height,
    fps: scene.fps,
    durationInFrames: timeToFrames(scene.duration, scene.fps),
    background: paint(scene.background),
    elements,
    ...(scene.animations || scene.camera || scene.motionMode
      ? { choreography: compileChoreography(scene, nodeFrames, paint) }
      : {}),
    ...(theme
      ? {
          resources: {
            theme: {
              id: theme.id,
              version: theme.version,
              styleVersion: theme.styleVersion,
            },
            assets: usage,
          },
        }
      : {}),
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
  const motion = scene.choreography
    ? evaluateChoreography(scene.choreography, frame, scene.width, scene.height)
    : undefined;
  const elements = scene.elements.filter(
    (element) => frame >= element.startFrame && frame < element.endFrame,
  );
  return {
    width: scene.width,
    height: scene.height,
    background: scene.background,
    elements: motion
      ? elements.map((element) => ({
          ...element,
          presentation: motion.state(element.id),
        }))
      : elements,
    ...(motion ? { camera: motion.camera } : {}),
  };
}
