import { bundle } from '@remotion/bundler';
import { resolve } from 'node:path';
import { rendererRoot, repositoryRoot } from './paths.ts';

export async function bundleSmoke() {
  return bundle({
    entryPoint: resolve(rendererRoot, 'src/index.tsx'),
    rootDir: rendererRoot,
    outDir: resolve(repositoryRoot, '.cache/remotion'),
  });
}
