import { describe, expect, it } from 'vitest';
import fixture from './fixtures/scene-v1.json' with { type: 'json' };
import { sceneRenderSettings } from '../apps/renderer/scripts/scene-settings.ts';

describe('scene export preflight', () => {
  it('derives frame selection from the supplied composition', () => {
    expect(
      sceneRenderSettings({ ...fixture, fps: 24, duration: 4 }).frames,
    ).toEqual([0, 48, 95]);
  });
  it.each([{ width: 641 }, { height: 361 }])(
    'rejects unsupported H.264 dimensions: %j',
    (change) => {
      expect(() => sceneRenderSettings({ ...fixture, ...change })).toThrow(
        'requires even',
      );
    },
  );
  it.each([-1, 90, 0.5, NaN, Infinity])(
    'rejects invalid reference frame %s',
    (frame) => {
      expect(() => sceneRenderSettings(fixture, [frame])).toThrow(
        'Reference frame',
      );
    },
  );
  it('deduplicates valid reference frames', () => {
    expect(sceneRenderSettings(fixture, [89, 0, 89]).frames).toEqual([89, 0]);
  });
  it('validates the scene before rendering', () => {
    expect(() => sceneRenderSettings({ ...fixture, schemaVersion: 9 })).toThrow(
      'schemaVersion',
    );
  });
});
