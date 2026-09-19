import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadSmokeScene } from '../apps/renderer/scripts/load-scene.ts';
import { fixturePath } from '../apps/renderer/scripts/paths.ts';

let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'scene smoke test '));
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

it('loads the checked-in JSON through the real file boundary', async () => {
  expect((await loadSmokeScene(fixturePath)).id).toBe('bootstrap-circle');
});

it('reports malformed JSON with the filename', async () => {
  const path = join(directory, 'invalid scene.json');
  await writeFile(path, '{ invalid');
  await expect(loadSmokeScene(path)).rejects.toThrow(
    `${path}: malformed scene JSON`,
  );
});

it('reports missing files and invalid scene content without fallbacks', async () => {
  await expect(loadSmokeScene(join(directory, 'missing.json'))).rejects.toThrow(
    'ENOENT',
  );
  const path = join(directory, 'invalid shape.json');
  await writeFile(path, '{"shape":null}');
  await expect(loadSmokeScene(path)).rejects.toThrow('scene.shape');
});
