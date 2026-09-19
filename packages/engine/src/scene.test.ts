import { describe, expect, it } from 'vitest';
import fixture from '../../../tests/fixtures/scene-v1.json';
import { compileScene, evaluateScene } from './scene.ts';

const scene = compileScene(fixture);
describe('scene graph compilation and evaluation', () => {
  it('resolves nested group bounds into ordered canvas geometry', () => {
    expect(scene.durationInFrames).toBe(90);
    expect(scene.elements).toEqual([
      {
        id: 'panel-background',
        type: 'rect',
        x: 120,
        y: 80,
        width: 400,
        height: 200,
        fill: '#E8EDF2',
        startFrame: 0,
        endFrame: 90,
      },
      {
        id: 'left-dot',
        type: 'circle',
        cx: 220,
        cy: 180,
        radius: 40,
        fill: '#287CC0',
        startFrame: 15,
        endFrame: 45,
      },
      {
        id: 'right-dot',
        type: 'circle',
        cx: 420,
        cy: 180,
        radius: 40,
        fill: '#F0A040',
        startFrame: 30,
        endFrame: 90,
      },
      {
        id: 'overlay',
        type: 'rect',
        x: 405,
        y: 165,
        width: 30,
        height: 30,
        fill: '#102030',
        startFrame: 60,
        endFrame: 90,
      },
    ]);
  });

  it.each([
    [0, ['panel-background']],
    [14, ['panel-background']],
    [15, ['panel-background', 'left-dot']],
    [29, ['panel-background', 'left-dot']],
    [30, ['panel-background', 'left-dot', 'right-dot']],
    [44, ['panel-background', 'left-dot', 'right-dot']],
    [45, ['panel-background', 'right-dot']],
    [59, ['panel-background', 'right-dot']],
    [60, ['panel-background', 'right-dot', 'overlay']],
    [89, ['panel-background', 'right-dot', 'overlay']],
  ])('applies inclusive start and exclusive end at frame %s', (frame, ids) => {
    expect(evaluateScene(scene, frame).elements.map((node) => node.id)).toEqual(
      ids,
    );
  });

  it('moves descendants with the parent without scaling their geometry', () => {
    const changed = structuredClone(fixture);
    const panel = changed.nodes[0]!;
    const moved = compileScene({
      ...changed,
      nodes: [{ ...panel, position: { x: 400, y: 200 } }],
    });
    expect(moved.elements[0]).toMatchObject({
      x: 200,
      y: 100,
      width: 400,
      height: 200,
    });
    expect(moved.elements[1]).toMatchObject({ cx: 300, cy: 200, radius: 40 });
    expect(moved.elements[2]).toMatchObject({ cx: 500, cy: 200, radius: 40 });
  });

  it('adds parent-relative times after converting each to integer frames', () => {
    const compiled = compileScene({
      ...fixture,
      nodes: [
        {
          id: 'parent',
          type: 'group',
          position: 'center',
          width: 100,
          height: 100,
          start: 0.1,
          duration: 0.1 + 0.2,
          children: [
            {
              id: 'child',
              type: 'circle',
              position: 'center',
              radius: 20,
              fill: '#FFFFFF',
              start: 0.2,
              duration: 0.1,
            },
          ],
        },
      ],
    });
    expect(compiled.elements[0]).toMatchObject({ startFrame: 9, endFrame: 12 });
    expect(evaluateScene(compiled, 8).elements).toHaveLength(0);
    expect(evaluateScene(compiled, 9).elements).toHaveLength(1);
    expect(evaluateScene(compiled, 12).elements).toHaveLength(0);
  });

  it('is independent of input mutation and frame evaluation order', () => {
    const input = structuredClone(fixture);
    const compiled = compileScene(input);
    const snapshot = JSON.stringify(compiled);
    input.width = 100;
    input.nodes.splice(0);
    const first = evaluateScene(compiled, 30);
    evaluateScene(compiled, 89);
    evaluateScene(compiled, 0);
    expect(evaluateScene(compiled, 30)).toEqual(first);
    expect(JSON.stringify(compiled)).toBe(snapshot);
    expect(compiled.width).toBe(640);
  });

  it.each([-1, 90, 1.5, NaN, Infinity])('rejects invalid frame %s', (frame) => {
    expect(() => evaluateScene(scene, frame)).toThrow('frame:');
  });

  it('rejects invalid input at compilation and resolved numeric overflow', () => {
    expect(() => compileScene({ ...fixture, schemaVersion: 2 })).toThrow(
      'schemaVersion',
    );
    expect(() =>
      compileScene({
        ...fixture,
        nodes: [
          {
            id: 'huge',
            type: 'circle',
            position: 'center',
            start: 0,
            duration: 1,
            radius: Number.MAX_VALUE,
            fill: '#FFFFFF',
          },
        ],
      }),
    ).toThrow('node "huge": resolved geometry');
  });

  it('supports an empty scene and unscaled off-canvas geometry', () => {
    expect(
      evaluateScene(compileScene({ ...fixture, nodes: [] }), 0).elements,
    ).toEqual([]);
    const compiled = compileScene({
      ...fixture,
      nodes: [
        {
          id: 'outside',
          type: 'rect',
          position: { x: -10, y: 20 },
          start: 0,
          duration: 1,
          width: 20,
          height: 10,
          fill: '#FFFFFF',
        },
      ],
    });
    expect(compiled.elements[0]).toMatchObject({
      x: -20,
      y: 15,
      width: 20,
      height: 10,
    });
  });
});
