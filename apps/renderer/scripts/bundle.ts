import { bundle } from '@remotion/bundler';
import { resolve } from 'node:path';
import { rendererRoot, repositoryRoot } from './paths.ts';

export async function bundleRenderer() {
  return bundle({
    entryPoint: resolve(rendererRoot, 'src/index.tsx'),
    rootDir: rendererRoot,
    outDir: resolve(repositoryRoot, '.cache/remotion'),
  });
}
