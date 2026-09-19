import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadScene } from './node.ts';

let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'core scene '));
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe('Node scene loader', () => {
  it('loads and validates a scene from disk', async () => {
    const path = fileURLToPath(
      new URL('../../../tests/fixtures/scene-v1.json', import.meta.url),
    );
    expect((await loadScene(path)).id).toBe('core-runtime-proof');
  });
  it('includes the filename when JSON is malformed', async () => {
    const path = join(directory, 'bad syntax.json');
    await writeFile(path, '{ nope');
    await expect(loadScene(path)).rejects.toThrow(
      `${path}: malformed scene JSON`,
    );
  });
  it('includes the filename and field for invalid scene data', async () => {
    const path = join(directory, 'wrong version.json');
    await writeFile(path, '{"schemaVersion":99}');
    await expect(loadScene(path)).rejects.toThrow(
      `${path}: scene.schemaVersion`,
    );
  });
  it('propagates missing file errors', async () => {
    await expect(loadScene(join(directory, 'missing.json'))).rejects.toThrow(
      'ENOENT',
    );
  });
});
