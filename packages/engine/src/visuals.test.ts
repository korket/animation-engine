import { beforeAll, describe, it, expect } from 'vitest';
import { loadAssetLibrary } from '@animation-engine/assets/node';
import type { AssetLibrary } from '@animation-engine/assets';
import type { VisualDefinition } from '@animation-engine/scene-schema';
import { parseScene } from '@animation-engine/scene-schema';
import fixture from '../../../tests/fixtures/cognitive-v1.json' with { type: 'json' };
import { compileScene, evaluateScene } from './scene.ts';
import { textLines, chartGeometry, memoryAt } from './visuals.ts';
import { transformPoint } from './choreography.ts';

let library: AssetLibrary;
beforeAll(async () => {
  library = await loadAssetLibrary();
});
const chart = fixture.nodes.find((n) => n.type === 'barChart')!;
const memory = fixture.nodes.find((n) => n.type === 'memoryOrb')!;
const only = (node: unknown) => ({ ...fixture, nodes: [node], animations: [] });
const shapes = (
  scene: ReturnType<typeof compileScene>,
  frame: number,
  id: string,
) => {
  const e = evaluateScene(scene, frame).elements.find((e) => e.id === id);
  if (e?.type !== 'asset') throw new Error('Expected vector output');
  return e.shapes;
};
describe('cognitive components', () => {
  it('preserves content through every memory state and holds fading endpoints', () => {
    const scene = compileScene(fixture, library);
    const opacity = (f: number) => shapes(scene, f, 'memory')[2]?.opacity;
    [0, 15, 30, 45, 60, 75, 90, 119].forEach((frame, i) =>
      expect(opacity(frame)).toBeCloseTo(
        [1, 0.3, 0.3, 0.225, 0.15, 0, 1, 1][i]!,
        12,
      ),
    );
    expect(
      shapes(scene, 75, 'memory')
        .filter((s) => s.type === 'text')
        .map((s) => s.text),
    ).toEqual(['PHONE']);
    expect(shapes(scene, 90, 'memory')[2]).toMatchObject({ fill: '#B8CFB0' });
  });
  it('fading starts from full opacity when it is the initial state', () => {
    const def = {
      type: 'memoryOrb',
      content: 'X',
      fontSize: 12,
      state: 'fading',
      fadeDuration: 1,
      stateChanges: [],
    } as const;
    expect(memoryAt(def, 0, 30).opacity).toBe(1);
    expect(memoryAt(def, 30, 30).opacity).toBe(0.15);
  });
  it('never reveals hidden content when fading is requested repeatedly', () => {
    const def = {
      type: 'memoryOrb',
      content: 'X',
      fontSize: 12,
      state: 'hidden',
      fadeDuration: 1,
      stateChanges: [
        { at: 1, state: 'fading' },
        { at: 2, state: 'fading' },
      ],
    } as const;
    for (const frame of [0, 30, 45, 60, 75, 90])
      expect(memoryAt(def, frame, 30).opacity).toBe(0);
  });
  it('renders thought tails, distinct context enclosure, and wrapped labels', () => {
    const scene = compileScene(fixture, library);
    expect(
      shapes(scene, 0, 'thought').filter((s) => s.type === 'circle'),
    ).toHaveLength(2);
    expect(
      shapes(scene, 0, 'context').filter((s) => s.type === 'rect'),
    ).toHaveLength(2);
    expect(textLines('one two three', 60, 80, 16)).toEqual([
      'one',
      'two',
      'three',
    ]);
  });
  it('rejects unrenderable text rather than truncating or substituting', () => {
    expect(() => textLines('unbreakable', 20, 40, 16)).toThrow('does not fit');
    expect(() => textLines('one two three', 60, 24, 16)).toThrow('overflows');
    expect(() =>
      compileScene(
        only({
          ...memory,
          attachment: undefined,
          content: 'THIS_WORD_IS_TOO_LONG',
        }),
        library,
      ),
    ).toThrow('does not fit');
    expect(() =>
      parseScene(only({ ...memory, content: 'こんにちは' })),
    ).toThrow('ASCII');
  });
  it('supports every alignment without changing text content', () => {
    for (const align of ['left', 'center', 'right']) {
      const scene = compileScene(
        only({
          id: 'label',
          type: 'label',
          position: 'center',
          width: 200,
          height: 40,
          start: 0,
          duration: 4,
          text: 'Test',
          fontSize: 16,
          colorRole: 'outline',
          align,
        }),
        library,
      );
      expect(shapes(scene, 0, 'label')[0]).toMatchObject({
        text: 'Test',
        textAnchor:
          align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle',
      });
    }
  });
  it.each([
    { state: 'destroyed' },
    { fadeDuration: 0 },
    { fadeDuration: 0.05 },
    { stateChanges: [{ at: 0, state: 'weak' }] },
    { stateChanges: [{ at: 4, state: 'weak' }] },
    {
      stateChanges: [
        { at: 1, state: 'fading' },
        { at: 1.5, state: 'hidden' },
      ],
    },
    { stateChanges: [{ at: 3.5, state: 'fading' }] },
  ])('rejects invalid memory state/timing %#', (change) =>
    expect(() => parseScene(only({ ...memory, ...change }))).toThrow(),
  );
});
describe('bar charts and data integrity', () => {
  it('uses an explicit zero baseline and exact final heights with count-up values', () => {
    const def = parseScene(only(chart)).nodes[0] as Extract<
      VisualDefinition,
      { type: 'barChart' }
    >;
    const start = chartGeometry(def, 480, 400, 15, 30, false),
      mid = chartGeometry(def, 480, 400, 30, 30, false),
      end = chartGeometry(def, 480, 400, 45, 30, false);
    expect(start.bars.map((b) => b.height)).toEqual([0, 0, 0]);
    expect(mid.bars.map((b) => b.value)).toEqual([6, 12, 9]);
    expect(end.bars.map((b) => b.height)).toEqual([78.4, 156.8, 117.6]);
    expect(chartGeometry(def, 480, 400, 0, 30, true)).toEqual({ ...end, p: 1 });
    const scene = compileScene(fixture, library);
    expect(
      shapes(scene, 45, 'chart')
        .filter((s) => s.type === 'text')
        .map((s) => s.text),
    ).toContain('SYNTHETIC TEST DATA: fixture values');
    expect(
      shapes(scene, 45, 'chart')
        .filter((s) => s.type === 'rect')
        .map((s) => s.fill),
    ).toEqual(['#326B87', '#E5A83B', '#326B87']);
  });
  it('attaches a marker to the evaluated bar top under chart motion', () => {
    const scene = compileScene(
      {
        ...fixture,
        animations: [
          {
            target: 'chart',
            start: 0,
            duration: 1,
            easing: 'linear',
            effect: { type: 'slideOut', offset: { x: 10, y: 0 } },
          },
        ],
      },
      library,
    );
    const at = (f: number) => {
      const e = evaluateScene(scene, f).elements.find(
        (e) => e.id === 'bar-marker',
      );
      if (e?.type !== 'circle' || !e.presentation)
        throw new Error('Missing marker');
      return transformPoint(e.presentation.matrix, { x: e.cx, y: e.cy });
    };
    expect(at(0)).toEqual({ x: 718, y: 356 });
    expect(at(45).x).toBeCloseTo(728, 10);
    expect(at(45).y).toBeCloseTo(199.2, 10);
  });
  it('accepts real-data provenance without asserting it is scientifically verified', () => {
    const scene = compileScene(
      only({
        ...chart,
        dataSource: { kind: 'research', citation: 'User-provided source' },
      }),
      library,
    );
    expect(
      shapes(scene, 0, 'chart').some(
        (s) => s.type === 'text' && s.text === 'Source: User-provided source',
      ),
    ).toBe(true);
  });
  it('supports zeros and decimal precision', () => {
    const node = {
      ...chart,
      decimals: 1,
      yMax: 3,
      bars: [
        { id: 'a', label: 'Zero', value: 0, highlight: false },
        { id: 'b', label: 'Value', value: 2.5, highlight: true },
      ],
    };
    const scene = compileScene(only(node), library);
    expect(
      shapes(scene, 45, 'chart').filter((s) => s.type === 'rect'),
    ).toHaveLength(1);
    expect(
      shapes(scene, 45, 'chart')
        .filter((s) => s.type === 'text')
        .map((s) => s.text),
    ).toContain('2.5');
  });
  it.each([
    { yMax: 0 },
    {
      yMax: 1e-10,
      bars: [{ id: 'a', label: 'A', value: 0, highlight: false }],
      annotations: [],
    },
    {
      bars: [{ id: 'a', label: 'A', value: 1e-10, highlight: false }],
      annotations: [],
    },
    { yMax: NaN },
    { yMax: 10 },
    { decimals: 3 },
    { bars: [] },
    { bars: [{ id: 'a', label: 'A', value: -1, highlight: false }] },
    { bars: [{ id: 'a', label: 'A', value: 1.1, highlight: false }] },
    {
      bars: [
        { id: 'a', label: 'A', value: 1, highlight: false },
        { id: 'a', label: 'B', value: 2, highlight: false },
      ],
    },
    { annotations: [{ barId: 'missing', text: 'Oops' }] },
    { dataSource: { kind: 'research', citation: '' } },
    { dataSource: { kind: 'invented', citation: 'x' } },
    { reveal: { start: 3, duration: 2, easing: 'linear' } },
    { reveal: { start: 0, duration: 0.05, easing: 'linear' } },
    { reveal: { start: 0, duration: 1, easing: 'custom' } },
  ])('rejects invalid chart data %#', (change) =>
    expect(() => parseScene(only({ ...chart, ...change }))).toThrow(),
  );
  it('rejects missing bar anchors', () =>
    expect(() =>
      compileScene(
        {
          ...fixture,
          nodes: fixture.nodes.map((n) =>
            n.id === 'bar-marker'
              ? {
                  ...n,
                  attachment: {
                    target: 'chart',
                    anchor: 'bar.missing',
                    offset: { x: 0, y: 0 },
                  },
                }
              : n,
          ),
        },
        library,
      ),
    ).toThrow('unknown anchor'));
  it('remains deterministic across seek order, changed data, and reduced motion', () => {
    const input = structuredClone(fixture),
      scene = compileScene(input, library),
      before = structuredClone(scene),
      expected = evaluateScene(scene, 30);
    evaluateScene(scene, 119);
    evaluateScene(scene, 0);
    expect(evaluateScene(scene, 30)).toEqual(expected);
    expect(scene).toEqual(before);
    expect(input).toEqual(fixture);
    const reduced = compileScene(
      { ...fixture, motionMode: 'reduced' },
      library,
    );
    expect(shapes(reduced, 0, 'chart')).toEqual(shapes(scene, 45, 'chart'));
    const changed = compileScene(
      only({
        ...chart,
        bars: chart.bars!.map((b) => ({ ...b, value: b.value / 2 })),
      }),
      library,
    );
    expect(shapes(changed, 45, 'chart')).not.toEqual(
      shapes(scene, 45, 'chart'),
    );
  });
});
