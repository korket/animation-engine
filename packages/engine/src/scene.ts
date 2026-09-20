import { parseScene, timeToFrames } from '@animation-engine/scene-schema';
import type { Color, SceneNode, Paint } from '@animation-engine/scene-schema';
import {
  findAsset,
  findTheme,
  resolvePaint,
  styleArtwork,
} from '@animation-engine/assets';
import type { AssetLibrary, StyledShape } from '@animation-engine/assets';

type ElementBase = Readonly<{
  id: string;
  startFrame: number;
  endFrame: number;
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
}>;

/** Validate and compile a tree into an ordered display list in canvas coordinates. */
export function compileScene(
  input: unknown,
  library?: AssetLibrary,
): CompiledScene {
  const scene = parseScene(input);
  const elements: SceneElement[] = [];
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
  });
  return {
    id: scene.id,
    width: scene.width,
    height: scene.height,
    fps: scene.fps,
    durationInFrames: timeToFrames(scene.duration, scene.fps),
    background: paint(scene.background),
    elements,
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
  return {
    width: scene.width,
    height: scene.height,
    background: scene.background,
    elements: scene.elements.filter(
      (element) => frame >= element.startFrame && frame < element.endFrame,
    ),
  };
}
