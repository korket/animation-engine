import { describe, expect, it, afterEach } from 'vitest';
import { readFile, writeFile, mkdtemp, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import catalog from '../catalog.json' with { type: 'json' };
import {
  findAsset,
  findTheme,
  parseCatalog,
  parseSvg,
  parseTheme,
  searchAssets,
  styleArtwork,
  createAssetLibrary,
} from './index.ts';
import { builtinCatalogPath, loadAssetLibrary } from './node.ts';

const directories: string[] = [];
afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="token:corner" fill="role:primary" stroke="role:outline" stroke-width="token:outline"/></svg>';

describe('semantic artwork', () => {
  it('resolves palette, outlines, and corners from pinned themes without mutation', () => {
    const artwork = parseSvg(svg);
    const before = structuredClone(artwork);
    const theme = parseTheme(catalog.themes[0]);
    expect(styleArtwork(artwork, theme)).toEqual([
      {
        type: 'rect',
        x: 10,
        y: 10,
        width: 80,
        height: 80,
        rx: 8,
        fill: '#326B87',
        stroke: '#263442',
        strokeWidth: 4,
      },
    ]);
    expect(
      styleArtwork(artwork, parseTheme(catalog.themes[1]))[0],
    ).toMatchObject({ fill: '#74B8CA', strokeWidth: 6, rx: 12 });
    expect(artwork).toEqual(before);
  });
  it.each([
    svg.replace('</svg>', ''),
    svg.replace('</svg>', '</svg\njunk>'),
    svg.replace('width="80"', 'width="80" width="20"'),
    svg.replace('fill="role:primary"', 'fill="#ff0000"'),
    svg.replace('role:primary', 'role:missing'),
    svg.replace('token:outline', '4'),
    svg.replace('token:corner', '8'),
    svg.replace('width="80"', 'width="-1"'),
    svg.replace('width="80"', 'width="1e999"'),
    svg.replace('x="10"', 'x="10" onclick="alert(1)"'),
    svg.replace('<rect ', '<rect style="fill:red" '),
    svg.replace('<rect ', '<rect transform="rotate(30)" '),
    svg.replace('</svg>', '<script>alert(1)</script></svg>'),
    svg.replace(
      '</svg>',
      '<image href="https://example.com/image.png"/></svg>',
    ),
    svg.replace('</svg>', '<foreignObject/></svg>'),
    svg.replace('</svg>', '<text>hello</text></svg>'),
    '<!DOCTYPE svg>' + svg,
    svg.replace('0 0 100 100', '10 10 100 100'),
    svg.replace('</svg>', '<![CDATA[abc]]></svg>'),
  ])('rejects unsupported or malformed SVG %#', (input) =>
    expect(() => parseSvg(input)).toThrow(),
  );
  it('supports comment/whitespace and untransformed groups', () => {
    expect(
      parseSvg(
        svg
          .replace('<rect', '<!-- artwork --><g><rect')
          .replace('/></svg>', '/></g></svg>'),
      ),
    ).toEqual(parseSvg(svg));
  });
  it.each([
    { outlineWidth: 0 },
    { cornerRadius: -1 },
    { colors: { accent: 'red' } },
    { version: 'latest' },
    { status: 'approved' },
  ])('rejects invalid theme %j', (change) =>
    expect(() => parseTheme({ ...catalog.themes[0], ...change })).toThrow(),
  );
});

describe('asset registry', () => {
  it('loads real checksummed SVGs and resolves exact versions', async () => {
    const library = await loadAssetLibrary();
    expect(findAsset(library, 'prop_phone', '1').artwork.shapes).toHaveLength(
      3,
    );
    expect(findAsset(library, 'prop_phone', '2').artwork.shapes).toHaveLength(
      4,
    );
    expect(() => findAsset(library, 'prop_phone', 'latest')).toThrow(
      'unknown version',
    );
    expect(() => findTheme(library, 'studio-proof', '99')).toThrow(
      'unknown version',
    );
  });
  it('searches semantic metadata deterministically with filters', async () => {
    const library = await loadAssetLibrary();
    expect(
      searchAssets(library, 'TECHNOLOGY handheld').map(
        (a) => `${a.id}@${a.version}`,
      ),
    ).toEqual(['prop_phone@1', 'prop_phone@2']);
    expect(
      searchAssets(library, 'memory', {
        category: 'prop',
        styleVersion: '1',
      }).map((a) => a.id),
    ).toEqual(['prop_book']);
    expect(searchAssets(library, 'phone', { category: 'character' })).toEqual(
      [],
    );
    expect(searchAssets(library, 'phone', { styleVersion: '2' })).toEqual([]);
    expect(searchAssets(library, 'notification').map((a) => a.version)).toEqual(
      ['2'],
    );
  });
  it.each([
    { file: '../outside.svg' },
    { file: 'C:\\outside.svg' },
    { file: 'https://example.com/a.svg' },
    { sha256: 'abc' },
    { version: 'latest' },
    { provenance: {} },
  ])('rejects invalid registry %j', (change) => {
    expect(() =>
      parseCatalog({
        ...catalog,
        assets: [{ ...catalog.assets[0], ...change }],
      }),
    ).toThrow();
  });
  it('rejects duplicate immutable versions', () => {
    expect(() =>
      parseCatalog({
        ...catalog,
        assets: [catalog.assets[0], catalog.assets[0]],
      }),
    ).toThrow('duplicate asset version');
    expect(() =>
      parseCatalog({
        ...catalog,
        themes: [catalog.themes[0], catalog.themes[0]],
      }),
    ).toThrow('duplicate theme version');
  });
  it('rejects missing SVG sources', () =>
    expect(() => createAssetLibrary(catalog, {})).toThrow('missing SVG'));
  it('fails on modified source bytes rather than accepting silent asset mutation', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'asset source '));
    directories.push(directory);
    await cp(
      join(dirname(builtinCatalogPath), 'artwork'),
      join(directory, 'artwork'),
      { recursive: true },
    );
    await writeFile(
      join(directory, 'catalog.json'),
      await readFile(builtinCatalogPath),
    );
    const path = join(directory, 'artwork/phone-v1.svg');
    await writeFile(
      path,
      (await readFile(path, 'utf8')).replace('r="5"', 'r="6"'),
    );
    await expect(
      loadAssetLibrary(join(directory, 'catalog.json')),
    ).rejects.toThrow('SHA-256 mismatch');
  });
});
