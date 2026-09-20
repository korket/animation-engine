import { describe, expect, it } from 'vitest';
import fixture from '../../../tests/fixtures/assets-v1.json' with { type: 'json' };
import coreFixture from '../../../tests/fixtures/scene-v1.json' with { type: 'json' };
import { loadAssetLibrary } from '@animation-engine/assets/node';
import { compileScene, evaluateScene } from './scene.ts';
import { parseScene } from '@animation-engine/scene-schema';

describe('scene assets and themes', () => {
  it('pins versions and records scene/node usage with source checksums', async () => {
    const library = await loadAssetLibrary();
    const compiled = compileScene(fixture, library);
    expect(compiled.background).toBe('#F4F1E8');
    expect(compiled.resources?.theme).toEqual({
      id: 'studio-proof',
      version: '1',
      styleVersion: '1',
    });
    expect(
      compiled.resources?.assets.map((a) => [a.nodeId, a.assetId, a.version]),
    ).toEqual([
      ['phone-before', 'prop_phone', '1'],
      ['phone-after', 'prop_phone', '2'],
      ['book', 'prop_book', '1'],
    ]);
    expect(
      compiled.resources?.assets.every((a) => /^[a-f0-9]{64}$/.test(a.sha256)),
    ).toBe(true);
    expect(compiled.elements[0]).toMatchObject({
      type: 'asset',
      x: 150,
      y: 100,
      width: 100,
      height: 160,
      viewBoxWidth: 100,
      viewBoxHeight: 160,
      startFrame: 0,
      endFrame: 30,
    });
    expect(evaluateScene(compiled, 29).elements.map((e) => e.id)).toEqual([
      'phone-before',
      'book',
    ]);
    expect(evaluateScene(compiled, 30).elements.map((e) => e.id)).toEqual([
      'phone-after',
      'book',
    ]);
  });
  it('changing theme updates paint and rules without changing geometry or input', async () => {
    const library = await loadAssetLibrary();
    const before = structuredClone(library);
    const sceneBefore = structuredClone(fixture);
    const original = compileScene(fixture, library);
    const changed = compileScene(
      { ...fixture, theme: { id: 'studio-proof', version: '2' } },
      library,
    );
    expect(changed.background).toBe('#192734');
    const a = original.elements[0],
      b = changed.elements[0];
    if (a?.type !== 'asset' || b?.type !== 'asset')
      throw new Error('expected asset geometry');
    expect(b.shapes[0]).toMatchObject({
      fill: '#74B8CA',
      strokeWidth: 6,
      rx: 12,
    });
    expect(a.shapes[0]).toMatchObject({
      fill: '#326B87',
      strokeWidth: 4,
      rx: 8,
    });
    expect([b.x, b.y, b.width, b.height]).toEqual([
      a.x,
      a.y,
      a.width,
      a.height,
    ]);
    expect(library).toEqual(before);
    expect(fixture).toEqual(sceneBefore);
    expect(compileScene(fixture, library)).toEqual(original);
  });
  it('preserves the literal-color scene contract', async () => {
    expect(compileScene(coreFixture, await loadAssetLibrary())).toEqual(
      compileScene(coreFixture),
    );
  });
  it('resolves semantic fills on primitive nodes', async () => {
    const compiled = compileScene(
      {
        ...fixture,
        nodes: [
          {
            id: 'dot',
            type: 'circle',
            radius: 10,
            position: 'center',
            fill: 'role:accent',
            start: 0,
            duration: 2,
          },
        ],
      },
      await loadAssetLibrary(),
    );
    expect(compiled.elements[0]).toMatchObject({
      fill: '#E5A83B',
      cx: 320,
      cy: 180,
    });
  });
  it('fails visibly for missing library/theme/asset and incompatible styles', async () => {
    const library = await loadAssetLibrary();
    expect(() => compileScene(fixture)).toThrow('library is required');
    expect(() =>
      compileScene(
        { ...fixture, theme: { id: 'studio-proof', version: '99' } },
        library,
      ),
    ).toThrow('unknown version');
    expect(() => compileScene(fixture, { ...library, assets: [] })).toThrow(
      'unknown version',
    );
    expect(() =>
      compileScene(fixture, {
        ...library,
        assets: library.assets.map((a) => ({ ...a, styleVersion: '2' })),
      }),
    ).toThrow('incompatible');
    expect(() =>
      compileScene({ ...fixture, background: 'role:missing' }, library),
    ).toThrow('unsupported semantic role');
  });
  it.each([
    { ...fixture, theme: undefined },
    { ...fixture, theme: { id: 'studio-proof', version: 'latest' } },
    {
      ...fixture,
      nodes: [{ ...fixture.nodes[0]?.children[0], assetVersion: 'latest' }],
    },
    {
      ...fixture,
      nodes: [{ ...fixture.nodes[0]?.children[0], fill: 'role:accent' }],
    },
    { ...fixture, nodes: [{ ...fixture.nodes[0]?.children[0], width: 0 }] },
  ])('rejects invalid asset contracts %#', (input) =>
    expect(() => parseScene(input)).toThrow(),
  );
});
