import { describe, expect, it } from 'vitest';
import { parseSmokeScene } from '@animation-engine/scene-schema';
import fixture from '../../../tests/fixtures/smoke.json';
import { evaluateSmokeScene } from './index';

const scene = parseSmokeScene(fixture);

describe('smoke frame evaluation', () => {
  it.each([
    [0, 0],
    [15, 0.5],
    [30, 1],
    [59, 1],
  ])('evaluates frame %s to opacity %s', (frame, opacity) => {
    expect(evaluateSmokeScene(scene, frame).circle.opacity).toBe(opacity);
  });

  it.each([-1, 60, 1.5, Number.NaN, Infinity])(
    'rejects invalid frame %s',
    (frame) => {
      expect(() => evaluateSmokeScene(scene, frame)).toThrow('frame:');
    },
  );

  it('resolves geometry from JSON rather than fixture-specific coordinates', () => {
    const changed = parseSmokeScene({
      ...fixture,
      width: 800,
      height: 400,
      shape: { ...fixture.shape, radius: 25 },
      fade: { startFrame: 10, endFrame: 50 },
    });
    expect(evaluateSmokeScene(changed, 30).circle).toEqual({
      cx: 400,
      cy: 200,
      radius: 25,
      fill: 'accent',
      opacity: 0.5,
    });
    expect(evaluateSmokeScene(changed, 5).circle.opacity).toBe(0);
    expect(evaluateSmokeScene(changed, 50).circle.opacity).toBe(1);
  });

  it('is repeatable out of order and does not mutate inputs', () => {
    const frozen = Object.freeze({
      ...scene,
      shape: Object.freeze({ ...scene.shape }),
      fade: Object.freeze({ ...scene.fade }),
    });
    const before = JSON.stringify(frozen);
    const first = evaluateSmokeScene(frozen, 15);
    evaluateSmokeScene(frozen, 59);
    evaluateSmokeScene(frozen, 0);
    expect(evaluateSmokeScene(frozen, 15)).toEqual(first);
    expect(JSON.stringify(frozen)).toBe(before);
  });
});
