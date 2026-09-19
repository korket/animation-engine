import { describe, expect, it } from 'vitest';
import fixture from '../../../tests/fixtures/smoke.json';
import { parseSmokeScene } from './index';

describe('smoke input validation', () => {
  it('accepts the fixture and returns independent data', () => {
    const result = parseSmokeScene(fixture);
    expect(result).toEqual(fixture);
    expect(result).not.toBe(fixture);
    expect(result.shape).not.toBe(fixture.shape);
  });

  it.each([
    ['format', 'v1'],
    ['id', ' '],
    ['purpose', ''],
    ['width', 0],
    ['width', 641],
    ['height', -2],
    ['height', 361],
    ['fps', 0],
    ['fps', 1.5],
    ['durationInFrames', 0],
    ['durationInFrames', 1.5],
    ['width', Number.NaN],
    ['height', Infinity],
    ['fps', Number.MAX_SAFE_INTEGER + 1],
    ['background', 'pink'],
    ['unknown', true],
  ])('rejects invalid %s (%s)', (key, value) => {
    expect(() => parseSmokeScene({ ...fixture, [key]: value })).toThrow(
      `scene.${key}`,
    );
  });

  it.each([
    ['type', 'square'],
    ['placement', 'left'],
    ['fill', '#ff0000'],
    ['radius', 0],
    ['radius', -1],
    ['radius', 181],
    ['radius', Infinity],
    ['radius', '60'],
    ['x', 100],
  ])('rejects invalid shape.%s (%s)', (key, value) => {
    expect(() =>
      parseSmokeScene({
        ...fixture,
        shape: { ...fixture.shape, [key]: value },
      }),
    ).toThrow(`scene.shape.${key}`);
  });

  it.each([
    [-1, 30],
    [0.5, 30],
    [0, 1.5],
    [30, 30],
    [31, 30],
    [0, 60],
    [60, 61],
  ])('rejects invalid fade endpoints %s, %s', (startFrame, endFrame) => {
    expect(() =>
      parseSmokeScene({ ...fixture, fade: { startFrame, endFrame } }),
    ).toThrow('scene.fade.');
  });

  it.each([null, [], 'json', undefined])(
    'rejects non-object input %s',
    (input) => {
      expect(() => parseSmokeScene(input)).toThrow('scene: expected an object');
    },
  );

  it('rejects missing nested objects and required fields', () => {
    expect(() => parseSmokeScene({ ...fixture, shape: null })).toThrow(
      'scene.shape',
    );
    expect(() => parseSmokeScene({ ...fixture, fade: [] })).toThrow(
      'scene.fade',
    );
    expect(() => parseSmokeScene({ ...fixture, fps: undefined })).toThrow(
      'scene.fps',
    );
  });
});
