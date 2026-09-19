import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const repositoryRoot = fileURLToPath(
  new URL('../../../', import.meta.url),
);
export const rendererRoot = resolve(repositoryRoot, 'apps/renderer');
export const fixturePath = resolve(repositoryRoot, 'tests/fixtures/smoke.json');
export const outputDirectory = resolve(repositoryRoot, 'out/smoke');
