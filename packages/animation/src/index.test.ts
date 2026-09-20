import { describe, expect, it } from 'vitest';
import {
  ease,
  easingNames,
  frameProgress,
  parseEffect,
  parseCameraEffect,
  sampleEffect,
  sampleCamera,
  staggerFrames,
} from './index.ts';

describe('approved easing', () => {
  it.each(easingNames)('%s has exact endpoints and stays bounded', (name) => {
    expect(ease(name, 0)).toBe(0);
    expect(ease(name, 1)).toBe(1);
    for (let i = 0; i <= 100; i++) {
      const p = ease(name, i / 100);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
  it('uses the approved curve families', () => {
    expect(ease('linear', 0.25)).toBe(0.25);
    expect(ease('bounce', 0.5)).toBeCloseTo(0.765625, 10);
    expect(ease('soft', 0.5)).toBeGreaterThan(0.8);
    expect(ease('snappy', 0.5)).toBeGreaterThan(0.9);
    expect(ease('dramatic', 0.25)).toBeLessThan(0.1);
  });
  it.each([-1, 1.01, NaN, Infinity])('rejects invalid progress %s', (p) =>
    expect(() => ease('linear', p)).toThrow(),
  );
});

describe('object primitives', () => {
  const cases = [
    [{ type: 'fadeIn' }, { opacity: 0.5 }],
    [{ type: 'fadeOut' }, { opacity: 0.5 }],
    [
      { type: 'slideIn', offset: { x: -60, y: 20 } },
      { x: -30, y: 10 },
    ],
    [
      { type: 'slideOut', offset: { x: 60, y: -20 } },
      { x: 30, y: -10 },
    ],
    [
      { type: 'scaleIn', from: 0.9 },
      { scale: 0.95, opacity: 0.5 },
    ],
    [
      { type: 'pop', amount: 0.2 },
      { scale: 1.175, opacity: 0.5 },
    ],
    [{ type: 'bounce', distance: 20 }, { y: -20 }],
    [{ type: 'rotate', from: 0, to: 90 }, { rotation: 45 }],
    [{ type: 'shake', distance: 20, cycles: 1 }, { x: 0 }],
    [{ type: 'wiggle', angle: 20, cycles: 1 }, { rotation: 0 }],
    [{ type: 'pulse', amount: 0.2, cycles: 1 }, { scale: 1.2 }],
    [
      {
        type: 'followPath',
        points: [
          { x: 0, y: 0 },
          { x: 30, y: 0 },
          { x: 30, y: 40 },
        ],
      },
      { x: 30, y: 5 },
    ],
    [{ type: 'highlight', color: '#F0A040', width: 4 }, { highlight: 1 }],
  ] as const;
  it.each(cases)('samples %j deterministically', (input, expected) => {
    const effect = parseEffect(input),
      before = structuredClone(effect);
    const result = sampleEffect(effect, 0.5);
    for (const [key, value] of Object.entries(expected))
      expect(result[key as keyof typeof result]).toBeCloseTo(value, 10);
    sampleEffect(effect, 0.9);
    sampleEffect(effect, 0.1);
    expect(sampleEffect(effect, 0.5)).toEqual(result);
    expect(effect).toEqual(before);
    expect(Object.values(sampleEffect(effect, 0)).every(Number.isFinite)).toBe(
      true,
    );
    expect(Object.values(sampleEffect(effect, 1)).every(Number.isFinite)).toBe(
      true,
    );
  });
  it('has meaningful shake and wiggle excursions and exact rest endpoints', () => {
    for (const type of ['shake', 'wiggle'] as const) {
      const effect = parseEffect(
        type === 'shake'
          ? { type, distance: 20, cycles: 1 }
          : { type, angle: 20, cycles: 1 },
      );
      const key = type === 'shake' ? 'x' : 'rotation';
      expect(sampleEffect(effect, 0.25)[key]).toBeCloseTo(
        10 * Math.sqrt(2),
        10,
      );
      expect(sampleEffect(effect, 0)[key]).toBe(0);
      expect(sampleEffect(effect, 1)[key]).toBe(0);
    }
  });
  it.each([
    { type: 'scaleIn', from: 0 },
    { type: 'pop', amount: 1 },
    { type: 'wiggle', angle: 2, cycles: 0.5 },
    {
      type: 'followPath',
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
    },
    { type: 'slideIn', offset: { x: Infinity, y: 0 } },
    { type: 'fadeIn', extra: true },
    { type: 'expressionSwap' },
    { type: 'highlight', color: 'red', width: 2 },
  ])('rejects invalid parameters %j', (input) =>
    expect(() => parseEffect(input)).toThrow(),
  );
});

describe('camera primitives', () => {
  it('pans between explicit centers', () =>
    expect(
      sampleCamera(
        parseCameraEffect({
          type: 'cameraPan',
          from: { x: 0, y: 0 },
          to: { x: 100, y: 40 },
          zoom: 2,
        }),
        0.5,
      ),
    ).toEqual({ x: 50, y: 20, zoom: 2 }));
  it('pushes in and pulls out at a fixed center', () => {
    for (const [fromZoom, toZoom] of [
      [1, 2],
      [2, 1],
    ])
      expect(
        sampleCamera(
          parseCameraEffect({
            type: 'cameraPush',
            center: { x: 100, y: 50 },
            fromZoom,
            toZoom,
          }),
          0.5,
        ),
      ).toEqual({ x: 100, y: 50, zoom: 1.5 });
  });
  it('follows the evaluated target with an explicit offset', () => {
    const camera = parseCameraEffect({
      type: 'cameraFollow',
      target: 'dot',
      from: { x: 0, y: 0 },
      offset: { x: 10, y: -10 },
      zoom: 1,
    });
    expect(sampleCamera(camera, 0.5, { x: 100, y: 50 })).toEqual({
      x: 55,
      y: 20,
      zoom: 1,
    });
    expect(() => sampleCamera(camera, 0.5)).toThrow('resolved target');
  });
  it.each([
    { type: 'cameraPush', center: { x: 0, y: 0 }, fromZoom: 0, toZoom: 2 },
    { type: '3dOrbit' },
  ])('rejects invalid camera %j', (input) =>
    expect(() => parseCameraEffect(input)).toThrow(),
  );
});

describe('frame timing and stagger', () => {
  it('holds endpoints only outside an explicitly valid interval', () => {
    expect(
      [0, 10, 15, 20, 30].map((frame) => frameProgress(frame, 10, 10)),
    ).toEqual([0, 0, 0.5, 1, 1]);
  });
  it('stagger expands to explicit frame intervals', () =>
    expect(staggerFrames(10, 20, 3, 3)).toEqual([
      { start: 10, duration: 20 },
      { start: 13, duration: 20 },
      { start: 16, duration: 20 },
    ]));
  it.each([
    [0, -1, 2],
    [0, 0, 0],
    [0, 0, 0.5],
    [NaN, 0, 10],
  ])('rejects invalid frame timing %j', (f, s, d) =>
    expect(() => frameProgress(f, s, d)).toThrow(),
  );
  it.each([
    [-1, 2],
    [1, 0],
    [0.5, 3],
  ])('rejects invalid stagger %j', (step, count) =>
    expect(() => staggerFrames(0, 10, step, count)).toThrow(),
  );
});
