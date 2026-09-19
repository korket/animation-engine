import { resolve } from 'node:path';
import { bundleRenderer } from './bundle.ts';
import { loadSmokeScene } from './load-scene.ts';
import { fixturePath, outputDirectory, repositoryRoot } from './paths.ts';
import { renderSmoke } from './render.ts';

if (process.argv.length > 3)
  throw new Error('Usage: render:smoke [scene-json-path]');
const scenePath = process.argv[2]
  ? resolve(repositoryRoot, process.argv[2])
  : fixturePath;
const scene = await loadSmokeScene(scenePath);
const bundle = await bundleRenderer();
const result = await renderSmoke(scene, outputDirectory, bundle);
console.log(`Rendered ${scene.id}: ${result.videoPath}`);
