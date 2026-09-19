import { readFile, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createAssetLibrary, parseCatalog } from './index.ts';

export const builtinCatalogPath = fileURLToPath(
  new URL('../catalog.json', import.meta.url),
);

/** Verify source bytes before passing any artwork into a render. */
export async function loadAssetLibrary(catalogPath = builtinCatalogPath) {
  const catalog = parseCatalog(
    JSON.parse(await readFile(catalogPath, 'utf8')) as unknown,
  );
  const root = await realpath(dirname(catalogPath));
  const sources: Record<string, string> = {};
  for (const asset of catalog.assets) {
    const path = await realpath(resolve(root, asset.file));
    const rel = relative(root, path);
    if (
      isAbsolute(rel) ||
      rel === '..' ||
      rel.startsWith('../') ||
      rel.startsWith('..\\')
    )
      throw new Error(`asset ${asset.id}: file escapes catalog directory`);
    const bytes = await readFile(path);
    if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256)
      throw new Error(
        `asset ${asset.id}@${asset.version}: SHA-256 mismatch for ${asset.file}`,
      );
    sources[asset.file] = new TextDecoder('utf-8', { fatal: true }).decode(
      bytes,
    );
  }
  return createAssetLibrary(catalog, sources);
}
