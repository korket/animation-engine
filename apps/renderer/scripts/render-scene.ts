import { resolve } from 'node:path';
import { loadScene } from '@animation-engine/engine/node';
import { loadAssetLibrary } from '@animation-engine/assets/node';
import { bundleRenderer } from './bundle.ts';
import { repositoryRoot } from './paths.ts';
import { renderScene } from './render.ts';
import { sceneRenderSettings } from './scene-settings.ts';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || process.argv.length > 4) {
  throw new Error('Usage: render:scene <scene-json-path> [output-directory]');
}
const scene = await loadScene(resolve(repositoryRoot, inputPath));
const library = scene.theme ? await loadAssetLibrary() : undefined;
sceneRenderSettings(scene, undefined, library);
const directory = resolve(repositoryRoot, outputPath ?? 'out/scene');
const bundle = await bundleRenderer();
const result = await renderScene(scene, directory, bundle, undefined, library);
console.log(`Rendered ${scene.id}: ${result.videoPath}`);
