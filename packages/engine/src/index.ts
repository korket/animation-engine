import type { SmokeScene } from '@animation-engine/scene-schema';

export type SmokeFrame = Readonly<{
  width: number;
  height: number;
  background: 'background';
  circle: Readonly<{
    cx: number;
    cy: number;
    radius: number;
    fill: 'accent';
    opacity: number;
  }>;
}>;

/** Evaluate a validated smoke scene at an integer frame, without mutable state. */
export function evaluateSmokeScene(
  scene: SmokeScene,
  frame: number,
): SmokeFrame {
  if (
    !Number.isInteger(frame) ||
    frame < 0 ||
    frame >= scene.durationInFrames
  ) {
    throw new Error(
      `frame: expected an integer in [0, ${scene.durationInFrames})`,
    );
  }
  const { startFrame, endFrame } = scene.fade;
  const opacity =
    frame <= startFrame
      ? 0
      : frame >= endFrame
        ? 1
        : (frame - startFrame) / (endFrame - startFrame);
  return {
    width: scene.width,
    height: scene.height,
    background: scene.background,
    circle: {
      cx: scene.width / 2,
      cy: scene.height / 2,
      radius: scene.shape.radius,
      fill: scene.shape.fill,
      opacity,
    },
  };
}
