import { describe, it, expect, beforeAll } from 'vitest';
import { loadAssetLibrary } from '@animation-engine/assets/node';
import type { AssetLibrary } from '@animation-engine/assets';
import { parseScene } from '@animation-engine/scene-schema';
import { compileScene, evaluateScene } from './scene.ts';
import { transformPoint } from './choreography.ts';

const hero = {
  id: 'hero',
  type: 'character',
  characterId: 'protagonist',
  characterVersion: '1',
  pose: 'walking',
  expression: 'neutral',
  walkStepDuration: 0.2,
  actions: [],
  width: 100,
  height: 200,
  position: { x: 200, y: 180 },
  start: 0,
  duration: 3,
};
const prop = {
  id: 'prop',
  type: 'circle',
  radius: 5,
  fill: '#E5A83B',
  position: 'center',
  start: 0,
  duration: 3,
  attachment: { target: 'hero', anchor: 'rightHand', offset: { x: 0, y: 0 } },
};
const base = {
  schemaVersion: 1,
  id: 'character-test',
  purpose: 'Character and attachment regression',
  emotion: 'neutral',
  importance: 'low',
  width: 640,
  height: 360,
  fps: 30,
  duration: 3,
  background: 'role:background',
  theme: { id: 'studio-proof', version: '1' },
  nodes: [hero, prop],
};
let library: AssetLibrary;
beforeAll(async () => {
  library = await loadAssetLibrary();
});
function propCenter(
  scene: ReturnType<typeof compileScene>,
  frame: number,
  id = 'prop',
) {
  const e = evaluateScene(scene, frame).elements.find((e) => e.id === id);
  if (e?.type !== 'circle' || !e.presentation)
    throw new Error('Missing prop presentation');
  return transformPoint(e.presentation.matrix, { x: e.cx, y: e.cy });
}
describe('characters and attachments', () => {
  it('follows four authored hand positions instead of independent coordinates', () => {
    const scene = compileScene(base, library);
    expect([0, 6, 12, 18, 24].map((f) => propCenter(scene, f))).toEqual([
      { x: 233, y: 196 },
      { x: 221, y: 203 },
      { x: 216, y: 196 },
      { x: 221, y: 205 },
      { x: 233, y: 196 },
    ]);
    expect(scene.resources?.characters).toMatchObject([
      {
        nodeId: 'hero',
        characterId: 'protagonist',
        version: '1',
        provenance: { status: 'review-candidate' },
      },
    ]);
  });
  it('matches drawing letterboxing and changes anchor on exact pose frame', () => {
    const scene = compileScene(
      {
        ...base,
        nodes: [
          {
            ...hero,
            width: 200,
            pose: 'standing',
            actions: [{ type: 'pose', at: 1, value: 'holding-phone' }],
          },
          prop,
        ],
      },
      library,
    );
    expect(propCenter(scene, 29)).toEqual({ x: 225, y: 204 });
    expect(propCenter(scene, 30)).toEqual({ x: 232, y: 158 });
  });
  it('inherits target rotation, offset, opacity, and ancestor motion exactly once', () => {
    const scene = compileScene(
      {
        ...base,
        nodes: [
          {
            id: 'group',
            type: 'group',
            position: 'center',
            width: 640,
            height: 360,
            start: 0,
            duration: 3,
            children: [
              { ...hero, pose: 'standing' },
              {
                ...prop,
                attachment: { ...prop.attachment, offset: { x: 5, y: 0 } },
              },
            ],
          },
        ],
        animations: [
          {
            target: 'hero',
            start: 0,
            duration: 1,
            easing: 'linear',
            effect: { type: 'rotate', from: 0, to: 90 },
          },
          {
            target: 'group',
            start: 0,
            duration: 1,
            easing: 'linear',
            effect: { type: 'slideOut', offset: { x: 40, y: 0 } },
          },
          {
            target: 'hero',
            start: 0,
            duration: 1,
            easing: 'linear',
            effect: { type: 'fadeIn' },
          },
        ],
      },
      library,
    );
    const center = propCenter(scene, 30);
    expect(center.x).toBeCloseTo(216, 10);
    expect(center.y).toBeCloseTo(210, 10);
    expect(
      evaluateScene(scene, 15).elements.find((e) => e.id === 'prop')
        ?.presentation?.opacity,
    ).toBe(0.5);
  });
  it('scales attachment offsets and attached group children with their target', () => {
    const scene = compileScene(
      {
        ...base,
        nodes: [
          { ...hero, pose: 'standing' },
          {
            id: 'held-group',
            type: 'group',
            width: 20,
            height: 20,
            position: 'center',
            start: 0,
            duration: 3,
            attachment: {
              target: 'hero',
              anchor: 'rightHand',
              offset: { x: 5, y: 0 },
            },
            children: [
              {
                id: 'prop',
                type: 'circle',
                radius: 3,
                fill: '#E5A83B',
                position: { x: 15, y: 10 },
                start: 0,
                duration: 3,
              },
            ],
          },
        ],
        animations: [
          {
            target: 'hero',
            start: 0,
            duration: 1,
            easing: 'linear',
            effect: { type: 'pulse', amount: 1, cycles: 1 },
          },
        ],
      },
      library,
    );
    // Anchor offset (25+5) and child offset 5 double around the hero center.
    expect(propCenter(scene, 15)).toEqual({ x: 270, y: 228 });
  });
  it('supports forward attachment chains without changing paint order', () => {
    const scene = compileScene(
      {
        ...base,
        nodes: [
          {
            ...prop,
            id: 'child',
            attachment: {
              target: 'prop',
              anchor: 'right',
              offset: { x: 2, y: 0 },
            },
          },
          prop,
          hero,
        ],
      },
      library,
    );
    expect(scene.elements.map((e) => e.id)).toEqual(['child', 'prop', 'hero']);
    expect(propCenter(scene, 0, 'child')).toEqual({ x: 240, y: 196 });
  });
  it('uses node-local action timing and keeps reduced anchors synchronized', () => {
    const scene = compileScene(
      {
        ...base,
        motionMode: 'reduced',
        nodes: [
          {
            ...hero,
            start: 1,
            duration: 2,
            actions: [{ type: 'expressionSwap', at: 0.2, value: 'surprised' }],
          },
          { ...prop, start: 1, duration: 2 },
        ],
      },
      library,
    );
    expect(evaluateScene(scene, 29).elements).toHaveLength(0);
    expect(propCenter(scene, 36)).toEqual({ x: 225, y: 204 });
    const a = evaluateScene(scene, 35).elements[0],
      b = evaluateScene(scene, 36).elements[0];
    if (a?.type !== 'asset' || b?.type !== 'asset')
      throw new Error('Expected character');
    expect(a.shapes).not.toEqual(b.shapes);
  });
  it('is repeatable without mutating scene data', () => {
    const input = structuredClone(base),
      scene = compileScene(input, library),
      before = structuredClone(scene);
    const expected = evaluateScene(scene, 18);
    evaluateScene(scene, 89);
    evaluateScene(scene, 0);
    expect(evaluateScene(scene, 18)).toEqual(expected);
    expect(scene).toEqual(before);
    expect(input).toEqual(base);
  });
  it.each([
    { attachment: { ...prop.attachment, target: 'missing' } },
    { attachment: { ...prop.attachment, anchor: 'made-up' } },
    { attachment: { ...prop.attachment, target: 'prop' } },
  ])('rejects broken attachment %#', (change) =>
    expect(() =>
      compileScene({ ...base, nodes: [hero, { ...prop, ...change }] }, library),
    ).toThrow(/attachment/),
  );
  it('rejects cycles, non-siblings, and props outliving their target', () => {
    expect(() =>
      compileScene(
        {
          ...base,
          nodes: [
            {
              ...hero,
              attachment: {
                target: 'prop',
                anchor: 'center',
                offset: { x: 0, y: 0 },
              },
            },
            prop,
          ],
        },
        library,
      ),
    ).toThrow('cyclic');
    expect(() =>
      compileScene(
        { ...base, nodes: [{ ...hero, duration: 2 }, prop] },
        library,
      ),
    ).toThrow('visibility');
    expect(() =>
      compileScene(
        {
          ...base,
          nodes: [
            hero,
            {
              id: 'g',
              type: 'group',
              width: 100,
              height: 200,
              position: 'center',
              start: 0,
              duration: 3,
              children: [prop],
            },
          ],
        },
        library,
      ),
    ).toThrow('sibling');
  });
  it.each([
    { characterId: 'missing' },
    { characterVersion: '2' },
    { pose: 'flying' },
    { expression: 'invented' },
    { walkStepDuration: 0 },
    { walkStepDuration: 0.05 },
    { actions: [{ type: 'pose', at: 3, value: 'standing' }] },
    { actions: [{ type: 'expressionSwap', at: 0.05, value: 'happy' }] },
    {
      actions: [
        { type: 'expressionSwap', at: 1, value: 'happy' },
        { type: 'expressionSwap', at: 1, value: 'neutral' },
      ],
    },
    {
      actions: [
        { type: 'pose', at: 2, value: 'standing' },
        { type: 'pose', at: 1, value: 'walking' },
      ],
    },
    { actions: [{ type: 'unknown', at: 0, value: 'happy' }] },
  ])('rejects malformed character input %#', (change) =>
    expect(() =>
      parseScene({ ...base, nodes: [{ ...hero, ...change }] }),
    ).toThrow(),
  );
  it('requires a compatible explicit theme', () => {
    expect(() => parseScene({ ...base, theme: undefined })).toThrow(
      'explicit theme',
    );
    expect(() =>
      compileScene(base, {
        ...library,
        themes: library.themes.map((t) => ({ ...t, styleVersion: '2' })),
      }),
    ).toThrow('incompatible');
  });
});
