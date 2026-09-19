/** Seconds must lie on the frame grid. Tolerance only absorbs floating-point noise. */
export function timeToFrames(
  seconds: number,
  fps: number,
  path = 'time',
): number {
  if (!Number.isSafeInteger(fps) || fps <= 0) {
    throw new Error('fps: expected a positive safe integer');
  }
  const frames = seconds * fps;
  const rounded = Math.round(frames);
  if (
    !Number.isFinite(seconds) ||
    seconds < 0 ||
    !Number.isSafeInteger(rounded)
  ) {
    throw new Error(
      `${path}: expected nonnegative seconds within the safe frame range`,
    );
  }
  if (Math.abs(frames - rounded) > 1e-7) {
    throw new Error(`${path}: must align to a whole frame at ${fps} fps`);
  }
  return rounded;
}
