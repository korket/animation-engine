import { parseSvg } from './svg.ts';
import type { SvgArtwork } from './svg.ts';
import { parseTheme } from './theme.ts';
import type { Theme } from './theme.ts';
import { fail, identifier, list, object, text, version } from './validation.ts';
export { parseSvg, styleArtwork } from './svg.ts';
export type { SvgArtwork, StyledShape } from './svg.ts';
export { parseTheme, colorRoles, resolvePaint } from './theme.ts';
export type { Theme, ColorRole } from './theme.ts';

export type AssetRecord = Readonly<{
  id: string;
  version: string;
  styleVersion: string;
  category: string;
  description: string;
  tags: readonly string[];
  file: string;
  sha256: string;
  provenance: Readonly<{ creator: string; source: string; license: string }>;
}>;
export type Catalog = Readonly<{
  format: 'asset-catalog-v1';
  themes: readonly Theme[];
  assets: readonly AssetRecord[];
}>;
export type AssetLibrary = Readonly<{
  themes: readonly Theme[];
  assets: readonly (AssetRecord & { artwork: SvgArtwork })[];
}>;

export function parseCatalog(input: unknown): Catalog {
  const value = object(input, 'catalog', ['format', 'themes', 'assets']);
  if (value.format !== 'asset-catalog-v1')
    fail('catalog.format', 'expected asset-catalog-v1');
  const themes = list(value.themes, 'catalog.themes').map(parseTheme);
  const themeKeys = themes.map((theme) => `${theme.id}@${theme.version}`);
  if (new Set(themeKeys).size !== themes.length)
    fail('catalog.themes', 'duplicate theme version');
  const keys = new Set<string>();
  const assets = list(value.assets, 'catalog.assets').map((input, index) => {
    const p = `catalog.assets[${index}]`;
    const asset = object(input, p, [
      'id',
      'version',
      'styleVersion',
      'category',
      'description',
      'tags',
      'file',
      'sha256',
      'provenance',
    ]);
    const id = identifier(asset.id, `${p}.id`);
    const v = version(asset.version, `${p}.version`);
    const key = `${id}@${v}`;
    if (keys.has(key)) fail(p, `duplicate asset version ${key}`);
    keys.add(key);
    const file = text(asset.file, `${p}.file`);
    if (!/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.svg$/.test(file))
      fail(`${p}.file`, 'expected relative SVG path without traversal');
    const sha256 = text(asset.sha256, `${p}.sha256`);
    if (!/^[a-f0-9]{64}$/.test(sha256))
      fail(`${p}.sha256`, 'expected lowercase SHA-256');
    const provenance = object(asset.provenance, `${p}.provenance`, [
      'creator',
      'source',
      'license',
    ]);
    return {
      id,
      version: v,
      styleVersion: version(asset.styleVersion, `${p}.styleVersion`),
      category: identifier(asset.category, `${p}.category`),
      description: text(asset.description, `${p}.description`),
      tags: list(asset.tags, `${p}.tags`).map((tag) => text(tag, `${p}.tags`)),
      file,
      sha256,
      provenance: {
        creator: text(provenance.creator, `${p}.provenance.creator`),
        source: text(provenance.source, `${p}.provenance.source`),
        license: text(provenance.license, `${p}.provenance.license`),
      },
    };
  });
  return { format: 'asset-catalog-v1', themes, assets };
}

/** Pure construction shared by checked local files and Studio's bundled sources. */
export function createAssetLibrary(
  catalogInput: unknown,
  sources: Readonly<Record<string, string>>,
): AssetLibrary {
  const catalog = parseCatalog(catalogInput);
  return {
    themes: catalog.themes,
    assets: catalog.assets.map((asset) => {
      const source = Object.hasOwn(sources, asset.file)
        ? sources[asset.file]
        : undefined;
      if (source === undefined)
        fail(`asset ${asset.id}@${asset.version}`, `missing SVG ${asset.file}`);
      try {
        return { ...asset, artwork: parseSvg(source) };
      } catch (cause) {
        throw new Error(
          `asset ${asset.id}@${asset.version}: ${cause instanceof Error ? cause.message : String(cause)}`,
          { cause },
        );
      }
    }),
  };
}
export function findAsset(library: AssetLibrary, id: string, version: string) {
  const asset = library.assets.find(
    (asset) => asset.id === id && asset.version === version,
  );
  if (!asset) return fail('asset', `unknown version ${id}@${version}`);
  return asset;
}
export function findTheme(library: AssetLibrary, id: string, version: string) {
  const theme = library.themes.find(
    (theme) => theme.id === id && theme.version === version,
  );
  if (!theme) return fail('theme', `unknown version ${id}@${version}`);
  return theme;
}

/** AND word search over semantic metadata, with optional exact category/style filters. */
export function searchAssets(
  library: AssetLibrary,
  query: string,
  filters: { category?: string; styleVersion?: string } = {},
): readonly AssetRecord[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return library.assets
    .filter((asset) => {
      const searchable =
        `${asset.id} ${asset.description} ${asset.tags.join(' ')}`.toLowerCase();
      return (
        (!filters.category || asset.category === filters.category) &&
        (!filters.styleVersion ||
          asset.styleVersion === filters.styleVersion) &&
        terms.every((term) => searchable.includes(term))
      );
    })
    .sort((a, b) =>
      a.id < b.id
        ? -1
        : a.id > b.id
          ? 1
          : a.version.length - b.version.length ||
            (a.version < b.version ? -1 : a.version > b.version ? 1 : 0),
    );
}
