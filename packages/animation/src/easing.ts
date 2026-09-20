export const easingNames = [
  'soft',
  'snappy',
  'bounce',
  'linear',
  'dramatic',
] as const;
export type Easing = (typeof easingNames)[number];

function bezier(
  x: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const at = (t: number, a: number, b: number) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3;
  let low = 0,
    high = 1;
  // Fixed iteration count makes inversion independent of playback history.
  for (let i = 0; i < 48; i++) {
    const t = (low + high) / 2;
    if (at(t, x1, x2) < x) low = t;
    else high = t;
  }
  return at((low + high) / 2, y1, y2);
}

/** Input is normalized progress, not elapsed time. Invalid progress is an error. */
export function ease(name: Easing, p: number): number {
  if (!easingNames.includes(name)) throw new Error(`Unknown easing: ${name}`);
  if (!Number.isFinite(p) || p < 0 || p > 1)
    throw new Error('Easing progress must be in [0, 1]');
  if (p === 0 || p === 1) return p;
  switch (name) {
    case 'linear':
      return p;
    case 'soft':
      return bezier(p, 0.32, 0.72, 0, 1);
    case 'snappy':
      return bezier(p, 0.23, 1, 0.32, 1);
    case 'dramatic':
      return bezier(p, 0.77, 0, 0.175, 1);
    // Robert Penner/easings.net easeOutBounce, bounded to [0,1].
    case 'bounce': {
      const n = 7.5625,
        d = 2.75;
      if (p < 1 / d) return n * p * p;
      if (p < 2 / d) return n * (p - 1.5 / d) ** 2 + 0.75;
      if (p < 2.5 / d) return n * (p - 2.25 / d) ** 2 + 0.9375;
      return n * (p - 2.625 / d) ** 2 + 0.984375;
    }
  }
}
