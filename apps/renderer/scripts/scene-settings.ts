import { compileScene } from '@animation-engine/engine';
import type { AssetLibrary } from '@animation-engine/assets';

// Codec constraints belong at the export boundary, not in scene semantics.
export function sceneRenderSettings(
  input: unknown,
  referenceFrames?: readonly number[],
  library?: AssetLibrary,
) {
  const scene = compileScene(input, library);
  if (scene.width % 2 !== 0 || scene.height % 2 !== 0) {
    throw new Error(
      'H.264 yuv420p export requires even scene.width and scene.height',
    );
  }
  const frames = [
    ...new Set(
      referenceFrames ?? [
        0,
        Math.floor(scene.durationInFrames / 2),
        scene.durationInFrames - 1,
      ],
    ),
  ];
  for (const frame of frames) {
    if (
      !Number.isInteger(frame) ||
      frame < 0 ||
      frame >= scene.durationInFrames
    ) {
      throw new Error(
        `Reference frame ${frame} must be an integer from 0 to ${scene.durationInFrames - 1}`,
      );
    }
  }
  return { scene, frames };
}
