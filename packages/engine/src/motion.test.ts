import { describe, expect, it } from 'vitest';
import { layoutNames, parseScene } from '@animation-engine/scene-schema';
import { compileScene, evaluateScene } from './scene.ts';
import { transformPoint } from './choreography.ts';

const dot = {
  id: 'dot',
  type: 'circle',
  radius: 20,
  fill: '#F0A040',
  position: 'center',
  start: 0,
  duration: 3,
};
const base = {
  schemaVersion: 1,
  id: 'motion-test',
  purpose: 'Motion regression',
  emotion: 'neutral',
  importance: 'low',
  width: 640,
  height: 360,
  fps: 30,
  duration: 3,
  background: '#102030',
  nodes: [dot],
};
const clip = (effect: unknown, target = 'dot', start = 0, duration = 1) => ({
  target,
  start,
  duration,
  easing: 'linear',
  effect,
});
function center(
  scene: ReturnType<typeof compileScene>,
  frame: number,
  id = 'dot',
) {
  const element = evaluateScene(scene, frame).elements.find(
    (element) => element.id === id,
  );
  if (element?.type !== 'circle') throw new Error('expected circle');
  return element.presentation
    ? transformPoint(element.presentation.matrix, {
        x: element.cx,
        y: element.cy,
      })
    : { x: element.cx, y: element.cy };
}

describe('named and semantic layout', () => {
  const expectedSlots = [
    'character',
    'character',
    'character',
    'left',
    'left',
    'diagram',
    'object',
    'chart',
    'environment',
  ];
  it.each(layoutNames)('resolves layout %s', (layout) => {
    const index = layoutNames.indexOf(layout);
    const scene = compileScene({
      ...base,
      layout,
      nodes: [{ ...dot, position: { slot: expectedSlots[index] } }],
    });
    const expectedX = [320, 192, 448, 160, 640 / 6, 320, 320, 320, 320][index];
    expect(center(scene, 0).x).toBeCloseTo(expectedX!, 10);
    expect(center(scene, 0).y).toBe(180);
  });
  it('resolves forward sibling references without changing paint order', () => {
    const scene = compileScene({
      ...base,
      nodes: [
        {
          ...dot,
          id: 'right',
          position: { relativeTo: 'left', placement: 'right-of', gap: 10 },
        },
        { ...dot, id: 'left', position: 'left-center' },
      ],
    });
    expect(center(scene, 0, 'right')).toEqual({ x: 210, y: 180 });
    expect(scene.elements.map((e) => e.id)).toEqual(['right', 'left']);
  });
  it('applies slots within parent bounds and preserves raw coordinates', () => {
    const scene = compileScene({
      ...base,
      nodes: [
        {
          id: 'group',
          type: 'group',
          position: { x: 200, y: 100 },
          width: 200,
          height: 100,
          layout: 'two-column',
          start: 0,
          duration: 3,
          children: [{ ...dot, position: { slot: 'right' } }],
        },
      ],
    });
    expect(center(scene, 0)).toEqual({ x: 250, y: 100 });
  });
  it.each(
    [
      [
        {
          ...dot,
          position: { relativeTo: 'missing', placement: 'left-of', gap: 5 },
        },
      ],
      [{ ...dot, position: { relativeTo: 'dot', placement: 'below', gap: 5 } }],
      [
        {
          ...dot,
          id: 'a',
          position: { relativeTo: 'b', placement: 'below', gap: 5 },
        },
        {
          ...dot,
          id: 'b',
          position: { relativeTo: 'a', placement: 'below', gap: 5 },
        },
      ],
      [{ ...dot, position: { slot: 'missing' } }],
    ].map((nodes) => ({ nodes })),
  )('rejects invalid layout graph %#', ({ nodes }) =>
    expect(() => compileScene({ ...base, nodes })).toThrow(/position /),
  );
});

describe('scene choreography', () => {
  it('accepts empty animation and camera lists as explicit no-motion scenes', () => {
    expect(
      parseScene({ ...base, animations: [], camera: [] }).animations,
    ).toEqual([]);
    expect(
      center(compileScene({ ...base, animations: [], camera: [] }), 0),
    ).toEqual({ x: 320, y: 180 });
  });
  it('composes parent rotation and child translation around the correct pivots', () => {
    const scene = compileScene({
      ...base,
      nodes: [
        {
          id: 'group',
          type: 'group',
          position: 'center',
          width: 200,
          height: 200,
          start: 0,
          duration: 3,
          children: [{ ...dot, position: { x: 150, y: 100 } }],
        },
      ],
      animations: [
        clip({ type: 'rotate', from: 0, to: 90 }, 'group'),
        clip({ type: 'slideOut', offset: { x: 20, y: 0 } }),
      ],
    });
    expect(center(scene, 0)).toEqual({ x: 370, y: 180 });
    expect(center(scene, 30).x).toBeCloseTo(320, 10);
    expect(center(scene, 30).y).toBeCloseTo(250, 10);
  });
  it('multiplies opacity through groups and composes fade endpoints', () => {
    const scene = compileScene({
      ...base,
      nodes: [
        {
          id: 'group',
          type: 'group',
          position: 'center',
          width: 200,
          height: 200,
          start: 0,
          duration: 3,
          children: [dot],
        },
      ],
      animations: [
        clip({ type: 'fadeIn' }, 'group'),
        clip({ type: 'fadeOut' }),
      ],
    });
    expect(evaluateScene(scene, 15).elements[0]?.presentation?.opacity).toBe(
      0.25,
    );
    expect(evaluateScene(scene, 30).elements[0]?.presentation?.opacity).toBe(0);
  });
  it('expands stagger in target order and validates each target interval', () => {
    const scene = compileScene({
      ...base,
      nodes: [
        { ...dot, id: 'a' },
        { ...dot, id: 'b' },
      ],
      animations: [
        {
          targets: ['b', 'a'],
          stagger: 0.5,
          start: 0,
          duration: 1,
          easing: 'linear',
          effect: { type: 'fadeIn' },
        },
      ],
    });
    const elements = evaluateScene(scene, 15).elements;
    expect(elements.map((e) => [e.id, e.presentation?.opacity])).toEqual([
      ['a', 0],
      ['b', 0.5],
    ]);
  });
  it('keeps fades while suppressing spatial motion and camera in reduced mode', () => {
    const scene = compileScene({
      ...base,
      motionMode: 'reduced',
      animations: [
        clip({ type: 'slideIn', offset: { x: 80, y: 0 } }),
        clip({ type: 'fadeIn' }),
      ],
      camera: [
        {
          start: 0,
          duration: 1,
          easing: 'linear',
          effect: {
            type: 'cameraPush',
            center: { x: 320, y: 180 },
            fromZoom: 1,
            toZoom: 2,
          },
        },
      ],
    });
    expect(center(scene, 15)).toEqual({ x: 320, y: 180 });
    expect(evaluateScene(scene, 15).elements[0]?.presentation?.opacity).toBe(
      0.5,
    );
    expect(evaluateScene(scene, 15).camera).toEqual([1, 0, 0, 1, 0, 0]);
  });
  it('is independent of evaluation order and does not mutate compiled input', () => {
    const scene = compileScene({
      ...base,
      animations: [clip({ type: 'pulse', amount: 0.2, cycles: 2 })],
    });
    const before = structuredClone(scene),
      expected = evaluateScene(scene, 15);
    evaluateScene(scene, 70);
    evaluateScene(scene, 0);
    expect(evaluateScene(scene, 15)).toEqual(expected);
    expect(scene).toEqual(before);
  });
  it('rejects missing targets and animations outside visibility', () => {
    expect(() =>
      compileScene({
        ...base,
        animations: [clip({ type: 'fadeIn' }, 'missing')],
      }),
    ).toThrow('unknown target');
    expect(() =>
      compileScene({
        ...base,
        nodes: [{ ...dot, start: 1, duration: 2 }],
        animations: [clip({ type: 'fadeIn' })],
      }),
    ).toThrow('target visibility');
  });
  it.each([
    { animations: [clip({ type: 'fadeIn' }, 'dot', 0, 0.05)] },
    { animations: [{ ...clip({ type: 'fadeIn' }), easing: 'custom' }] },
    {
      animations: [
        { ...clip({ type: 'fadeIn' }), targets: ['dot'], stagger: 0 },
      ],
    },
    {
      animations: [
        {
          targets: ['dot', 'dot'],
          stagger: 0,
          start: 0,
          duration: 1,
          easing: 'linear',
          effect: { type: 'fadeIn' },
        },
      ],
    },
    { motionMode: 'os-preference' },
    { layout: 'invented' },
  ])('rejects malformed scene choreography %#', (change) =>
    expect(() => parseScene({ ...base, ...change })).toThrow(),
  );
});

describe('camera evaluation', () => {
  it('holds camera state between ordered pan and push clips', () => {
    const scene = compileScene({
      ...base,
      camera: [
        {
          start: 0,
          duration: 1,
          easing: 'linear',
          effect: {
            type: 'cameraPan',
            from: { x: 320, y: 180 },
            to: { x: 360, y: 180 },
            zoom: 1,
          },
        },
        {
          start: 1,
          duration: 1,
          easing: 'linear',
          effect: {
            type: 'cameraPush',
            center: { x: 360, y: 180 },
            fromZoom: 1,
            toZoom: 2,
          },
        },
      ],
    });
    expect(evaluateScene(scene, 15).camera).toEqual([1, 0, 0, 1, -20, 0]);
    expect(evaluateScene(scene, 45).camera).toEqual([
      1.5, 0, 0, 1.5, -220, -90,
    ]);
    expect(evaluateScene(scene, 89).camera).toEqual([2, 0, 0, 2, -400, -180]);
  });
  it('follows evaluated target motion and holds its end-frame position', () => {
    const scene = compileScene({
      ...base,
      nodes: [{ ...dot, position: 'left-center' }],
      animations: [
        clip(
          {
            type: 'followPath',
            points: [
              { x: 0, y: 0 },
              { x: 120, y: 0 },
            ],
          },
          'dot',
          0,
          3,
        ),
      ],
      camera: [
        {
          start: 1,
          duration: 1,
          easing: 'linear',
          effect: {
            type: 'cameraFollow',
            target: 'dot',
            from: { x: 320, y: 180 },
            offset: { x: 0, y: 0 },
            zoom: 1,
          },
        },
      ],
    });
    expect(evaluateScene(scene, 45).camera).toEqual([1, 0, 0, 1, 50, 0]);
    expect(evaluateScene(scene, 89).camera).toEqual([1, 0, 0, 1, 80, 0]);
  });
  it('rejects overlapping cameras and missing follow targets', () => {
    const camera = {
      start: 0,
      duration: 1,
      easing: 'linear',
      effect: {
        type: 'cameraFollow',
        target: 'missing',
        from: { x: 320, y: 180 },
        offset: { x: 0, y: 0 },
        zoom: 1,
      },
    };
    expect(() => compileScene({ ...base, camera: [camera] })).toThrow(
      'unknown target',
    );
    expect(() => parseScene({ ...base, camera: [camera, camera] })).toThrow(
      'cannot overlap',
    );
  });
});
