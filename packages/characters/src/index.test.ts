import { describe, it, expect } from 'vitest';
import {
  evaluateCharacter,
  face,
  poseNames,
  expressionNames,
  validateCharacter,
} from './index.ts';
import type { CharacterState } from './index.ts';
const base: CharacterState = {
  characterId: 'protagonist',
  characterVersion: '1',
  pose: 'standing',
  expression: 'neutral',
  walkStepFrames: 6,
  actions: [],
};

describe('versioned character drawings', () => {
  it.each(poseNames)(
    'provides finite geometry and hand anchors for %s',
    (pose) => {
      const result = evaluateCharacter({ ...base, pose }, 0);
      expect(result.artwork.width).toBe(100);
      expect(result.artwork.height).toBe(200);
      for (const point of Object.values(result.anchors))
        expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
      expect(result.body).toContainEqual(
        expect.objectContaining({
          type: 'circle',
          cx: result.anchors.rightHand.x,
          cy: result.anchors.rightHand.y,
          radius: 4,
        }),
      );
      for (const shape of result.artwork.shapes)
        for (const value of Object.values(shape))
          if (typeof value === 'number')
            expect(Number.isFinite(value)).toBe(true);
    },
  );
  it('gives every authored pose a distinct silhouette', () => {
    expect(
      new Set(
        poseNames.map((pose) =>
          JSON.stringify(evaluateCharacter({ ...base, pose }, 0).body),
        ),
      ).size,
    ).toBe(10);
  });
  it.each(expressionNames)(
    'changes modular face without changing body: %s',
    (expression) => {
      const result = evaluateCharacter({ ...base, expression }, 0);
      expect(result.body).toEqual(evaluateCharacter(base, 0).body);
      expect(result.face).toEqual(face(expression));
      expect(Object.keys(result.face)).toEqual(['eyes', 'brows', 'mouth']);
      expect(result.face.eyes.length).toBeGreaterThan(0);
    },
  );
  it('makes all eight expression combinations distinct', () =>
    expect(
      new Set(expressionNames.map((e) => JSON.stringify(face(e)))).size,
    ).toBe(8));
  it('holds each of four walk drawings and repeats exactly', () => {
    const state = { ...base, pose: 'walking' as const };
    expect(
      [0, 5, 6, 11, 12, 17, 18, 23, 24].map(
        (f) => evaluateCharacter(state, f).walkFrame,
      ),
    ).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 0]);
    expect(
      new Set(
        [0, 6, 12, 18].map((f) =>
          JSON.stringify(evaluateCharacter(state, f).body),
        ),
      ).size,
    ).toBe(4);
    expect(evaluateCharacter(state, 24)).toEqual(evaluateCharacter(state, 0));
  });
  it('swaps expressions at the exact frame and resets walk on pose change', () => {
    const state: CharacterState = {
      ...base,
      actions: [
        { type: 'pose', atFrame: 10, value: 'walking' },
        { type: 'expressionSwap', atFrame: 10, value: 'confused' },
        { type: 'expressionSwap', atFrame: 30, value: 'happy' },
      ],
    };
    expect(evaluateCharacter(state, 9)).toMatchObject({
      pose: 'standing',
      expression: 'neutral',
    });
    expect(evaluateCharacter(state, 10)).toMatchObject({
      pose: 'walking',
      expression: 'confused',
      walkFrame: 0,
    });
    expect(evaluateCharacter(state, 16).walkFrame).toBe(1);
    expect(evaluateCharacter(state, 100).expression).toBe('happy');
    const before = structuredClone(state);
    const expected = evaluateCharacter(state, 19);
    evaluateCharacter(state, 100);
    expect(evaluateCharacter(state, 19)).toEqual(expected);
    expect(state).toEqual(before);
  });
  it('freezes walking in reduced motion but preserves expression changes', () => {
    const state: CharacterState = {
      ...base,
      pose: 'walking',
      actions: [{ type: 'expressionSwap', atFrame: 6, value: 'happy' }],
    };
    expect(evaluateCharacter(state, 18, true).body).toEqual(
      evaluateCharacter(base, 0).body,
    );
    expect(evaluateCharacter(state, 18, true).expression).toBe('happy');
  });
  it('supports a visually distinct secondary human with identical anchor semantics', () => {
    const a = evaluateCharacter(base, 0),
      b = evaluateCharacter({ ...base, characterId: 'secondary-human' }, 0);
    expect(a.body).not.toEqual(b.body);
    expect(a.anchors).toEqual(b.anchors);
  });
  it.each([-1, 0.5, NaN, Infinity])('rejects invalid frame %s', (frame) =>
    expect(() => evaluateCharacter(base, frame)).toThrow('frame'),
  );
  it.each([
    { walkStepFrames: 0 },
    { walkStepFrames: 1.5 },
    { characterVersion: 'latest' },
    { characterId: 'missing' },
    { pose: 'fly' },
    { expression: 'invented' },
    { actions: [{ type: 'expressionSwap', atFrame: 0, value: 'nope' }] },
    {
      actions: [
        { type: 'pose', atFrame: 2, value: 'standing' },
        { type: 'pose', atFrame: 1, value: 'walking' },
      ],
    },
    {
      actions: [
        { type: 'pose', atFrame: 1, value: 'standing' },
        { type: 'pose', atFrame: 1, value: 'walking' },
      ],
    },
  ])('rejects unsupported character configuration %#', (change) =>
    expect(() =>
      validateCharacter({ ...base, ...change } as CharacterState),
    ).toThrow(),
  );
});
