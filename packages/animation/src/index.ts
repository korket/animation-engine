export { ease, easingNames } from './easing.ts';
export type { Easing } from './easing.ts';
export type Point = Readonly<{ x: number; y: number }>;
export type Effect =
  | Readonly<{ type: 'fadeIn' | 'fadeOut' }>
  | Readonly<{ type: 'slideIn' | 'slideOut'; offset: Point }>
  | Readonly<{ type: 'scaleIn'; from: number }>
  | Readonly<{ type: 'pop'; amount: number }>
  | Readonly<{ type: 'bounce'; distance: number }>
  | Readonly<{ type: 'rotate'; from: number; to: number }>
  | Readonly<{ type: 'shake'; distance: number; cycles: number }>
  | Readonly<{ type: 'wiggle'; angle: number; cycles: number }>
  | Readonly<{ type: 'pulse'; amount: number; cycles: number }>
  | Readonly<{ type: 'followPath'; points: readonly Point[] }>
  | Readonly<{
      type: 'highlight';
      color: `#${string}` | `role:${string}`;
      width: number;
    }>;
export type CameraEffect =
  | Readonly<{ type: 'cameraPan'; from: Point; to: Point; zoom: number }>
  | Readonly<{
      type: 'cameraPush';
      center: Point;
      fromZoom: number;
      toZoom: number;
    }>
  | Readonly<{
      type: 'cameraFollow';
      target: string;
      from: Point;
      offset: Point;
      zoom: number;
    }>;
export type MotionSample = Readonly<{
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  highlight: number;
}>;

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}
function obj(
  input: unknown,
  path: string,
  keys: readonly string[],
): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return fail(path, 'expected object');
  for (const key of Object.keys(input))
    if (!keys.includes(key)) fail(`${path}.${key}`, 'unsupported field');
  return input as Record<string, unknown>;
}
function n(
  input: unknown,
  path: string,
  min = -Number.MAX_VALUE,
  max = Number.MAX_VALUE,
): number {
  if (
    typeof input !== 'number' ||
    !Number.isFinite(input) ||
    input < min ||
    input > max
  )
    return fail(path, `expected finite number in [${min}, ${max}]`);
  return input;
}
function point(input: unknown, path: string): Point {
  const p = obj(input, path, ['x', 'y']);
  return { x: n(p.x, `${path}.x`), y: n(p.y, `${path}.y`) };
}
function cycles(input: unknown, path: string): number {
  const value = n(input, path, 1);
  if (!Number.isSafeInteger(value)) fail(path, 'expected integer cycles');
  return value;
}

export function parseEffect(input: unknown, path = 'effect'): Effect {
  const value = obj(input, path, [
    'type',
    'offset',
    'from',
    'to',
    'amount',
    'distance',
    'cycles',
    'angle',
    'points',
    'color',
    'width',
  ]);
  const keys = (...keys: string[]) => obj(value, path, ['type', ...keys]);
  switch (value.type) {
    case 'fadeIn':
    case 'fadeOut':
      keys();
      return { type: value.type };
    case 'slideIn':
    case 'slideOut':
      keys('offset');
      return {
        type: value.type,
        offset: point(value.offset, `${path}.offset`),
      };
    case 'scaleIn':
      keys('from');
      return {
        type: value.type,
        from: n(value.from, `${path}.from`, 0.9, 0.97),
      };
    case 'pop':
      keys('amount');
      return {
        type: value.type,
        amount: n(value.amount, `${path}.amount`, 0, 0.3),
      };
    case 'bounce':
      keys('distance');
      return {
        type: value.type,
        distance: n(value.distance, `${path}.distance`, 0),
      };
    case 'rotate':
      keys('from', 'to');
      return {
        type: value.type,
        from: n(value.from, `${path}.from`),
        to: n(value.to, `${path}.to`),
      };
    case 'shake':
      keys('distance', 'cycles');
      return {
        type: value.type,
        distance: n(value.distance, `${path}.distance`, 0),
        cycles: cycles(value.cycles, `${path}.cycles`),
      };
    case 'wiggle':
      keys('angle', 'cycles');
      return {
        type: value.type,
        angle: n(value.angle, `${path}.angle`, 0),
        cycles: cycles(value.cycles, `${path}.cycles`),
      };
    case 'pulse':
      keys('amount', 'cycles');
      return {
        type: value.type,
        amount: n(value.amount, `${path}.amount`, 0, 1),
        cycles: cycles(value.cycles, `${path}.cycles`),
      };
    case 'followPath': {
      keys('points');
      if (!Array.isArray(value.points) || value.points.length < 2)
        return fail(`${path}.points`, 'expected at least two points');
      const points = value.points.map((p, i) =>
        point(p, `${path}.points[${i}]`),
      );
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]!,
          b = points[i]!;
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        if (!Number.isFinite(length) || length === 0)
          fail(path, 'path segments must have positive finite length');
      }
      return { type: value.type, points };
    }
    case 'highlight': {
      keys('color', 'width');
      if (
        typeof value.color !== 'string' ||
        !/^(#[a-fA-F0-9]{6}|role:[a-z][a-z0-9_-]*)$/.test(value.color)
      )
        return fail(`${path}.color`, 'expected hex or semantic paint');
      return {
        type: value.type,
        color: value.color as `#${string}` | `role:${string}`,
        width: n(value.width, `${path}.width`, Number.MIN_VALUE),
      };
    }
    default:
      return fail(path, 'unsupported animation primitive');
  }
}

export function parseCameraEffect(
  input: unknown,
  path = 'camera',
): CameraEffect {
  const value = obj(input, path, [
    'type',
    'from',
    'to',
    'zoom',
    'center',
    'fromZoom',
    'toZoom',
    'target',
    'offset',
  ]);
  const keys = (...keys: string[]) => obj(value, path, ['type', ...keys]);
  const zoom = (input: unknown, key: string) =>
    n(input, `${path}.${key}`, Number.MIN_VALUE);
  switch (value.type) {
    case 'cameraPan':
      keys('from', 'to', 'zoom');
      return {
        type: value.type,
        from: point(value.from, `${path}.from`),
        to: point(value.to, `${path}.to`),
        zoom: zoom(value.zoom, 'zoom'),
      };
    case 'cameraPush':
      keys('center', 'fromZoom', 'toZoom');
      return {
        type: value.type,
        center: point(value.center, `${path}.center`),
        fromZoom: zoom(value.fromZoom, 'fromZoom'),
        toZoom: zoom(value.toZoom, 'toZoom'),
      };
    case 'cameraFollow':
      keys('target', 'from', 'offset', 'zoom');
      if (typeof value.target !== 'string' || !value.target.trim())
        return fail(path, 'expected target ID');
      return {
        type: value.type,
        target: value.target,
        from: point(value.from, `${path}.from`),
        offset: point(value.offset, `${path}.offset`),
        zoom: zoom(value.zoom, 'zoom'),
      };
    default:
      return fail(path, 'unsupported camera primitive');
  }
}

const mix = (a: number, b: number, p: number) => a * (1 - p) + b * p;
export function sampleEffect(effect: Effect, p: number): MotionSample {
  n(p, 'progress', 0, 1);
  const result = {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    highlight: 0,
  };
  const hump = p === 0 || p === 1 ? 0 : Math.sin(Math.PI * p);
  switch (effect.type) {
    case 'fadeIn':
      result.opacity = p;
      break;
    case 'fadeOut':
      result.opacity = 1 - p;
      break;
    case 'slideIn':
      result.x = effect.offset.x * (1 - p);
      result.y = effect.offset.y * (1 - p);
      break;
    case 'slideOut':
      result.x = effect.offset.x * p;
      result.y = effect.offset.y * p;
      break;
    case 'scaleIn':
      result.scale = mix(effect.from, 1, p);
      result.opacity = p;
      break;
    case 'pop':
      result.scale = 0.95 + 0.05 * p + effect.amount * hump;
      result.opacity = p;
      break;
    case 'bounce':
      result.y = hump === 0 ? 0 : -effect.distance * hump;
      break;
    case 'rotate':
      result.rotation = mix(effect.from, effect.to, p);
      break;
    case 'shake':
      result.x =
        hump === 0
          ? 0
          : effect.distance * Math.sin(2 * Math.PI * effect.cycles * p) * hump;
      break;
    case 'wiggle':
      result.rotation =
        hump === 0
          ? 0
          : effect.angle * Math.sin(2 * Math.PI * effect.cycles * p) * hump;
      break;
    case 'pulse':
      result.scale =
        1 +
        effect.amount *
          (p === 0 || p === 1 ? 0 : Math.sin(Math.PI * effect.cycles * p) ** 2);
      break;
    case 'highlight':
      result.highlight = hump * hump;
      break;
    case 'followPath': {
      const lengths = effect.points.slice(1).map((b, i) => {
        const a = effect.points[i]!;
        return Math.hypot(b.x - a.x, b.y - a.y);
      });
      let distance = lengths.reduce((a, b) => a + b, 0) * p;
      for (let i = 0; i < lengths.length; i++) {
        const length = lengths[i]!;
        if (distance <= length || i === lengths.length - 1) {
          const a = effect.points[i]!,
            b = effect.points[i + 1]!;
          result.x = mix(a.x, b.x, distance / length);
          result.y = mix(a.y, b.y, distance / length);
          break;
        }
        distance -= length;
      }
      break;
    }
  }
  if (!Object.values(result).every(Number.isFinite))
    throw new Error('Animation exceeded finite numeric range');
  return result;
}

export function sampleCamera(
  effect: CameraEffect,
  p: number,
  target?: Point,
): Readonly<Point & { zoom: number }> {
  n(p, 'progress', 0, 1);
  switch (effect.type) {
    case 'cameraPan':
      return {
        x: mix(effect.from.x, effect.to.x, p),
        y: mix(effect.from.y, effect.to.y, p),
        zoom: effect.zoom,
      };
    case 'cameraPush':
      return { ...effect.center, zoom: mix(effect.fromZoom, effect.toZoom, p) };
    case 'cameraFollow':
      if (!target) throw new Error('cameraFollow requires a resolved target');
      return {
        x: mix(effect.from.x, target.x + effect.offset.x, p),
        y: mix(effect.from.y, target.y + effect.offset.y, p),
        zoom: effect.zoom,
      };
  }
}

/** Explicitly hold start/end values outside a valid finite frame interval. */
export function frameProgress(
  frame: number,
  start: number,
  duration: number,
): number {
  if (
    !Number.isSafeInteger(frame) ||
    frame < 0 ||
    !Number.isSafeInteger(start) ||
    start < 0 ||
    !Number.isSafeInteger(duration) ||
    duration < 1 ||
    !Number.isSafeInteger(start + duration)
  )
    throw new Error('Invalid frame timing');
  return Math.max(0, Math.min(1, (frame - start) / duration));
}

export function staggerFrames(
  start: number,
  duration: number,
  step: number,
  count: number,
): readonly { start: number; duration: number }[] {
  frameProgress(0, start, duration);
  if (
    !Number.isSafeInteger(step) ||
    step < 0 ||
    !Number.isSafeInteger(count) ||
    count < 1
  )
    throw new Error('Invalid stagger timing/count');
  if (!Number.isSafeInteger(start + (count - 1) * step + duration))
    throw new Error('Stagger exceeds safe frame range');
  return Array.from({ length: count }, (_, index) => ({
    start: start + index * step,
    duration,
  }));
}
