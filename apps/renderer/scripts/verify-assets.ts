import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ALL_FORMATS, BufferSource, Input } from 'mediabunny';
import { PNG } from 'pngjs';
import { loadScene } from '@animation-engine/engine/node';
import { parseScene } from '@animation-engine/scene-schema';
import { loadAssetLibrary } from '@animation-engine/assets/node';
import { compileScene } from '@animation-engine/engine';
import { bundleRenderer } from './bundle.ts';
import { renderScene } from './render.ts';
import { repositoryRoot } from './paths.ts';

function pixel(image: PNG, x: number, y: number, expected: number[]) {
  const offset = (image.width * y + x) * 4;
  for (const [channel, value] of expected.entries()) {
    const actual = image.data[offset + channel];
    assert.ok(
      actual !== undefined && Math.abs(actual - value) <= 2,
      `pixel ${x},${y} channel ${channel}: ${actual} != ${value}`,
    );
  }
  assert.equal(image.data[offset + 3], 255);
}
async function checkFrame(directory: string, frame: number, dark: boolean) {
  const image = PNG.sync.read(
    await readFile(resolve(directory, `frame-${frame}.png`)),
  );
  assert.equal(image.width, 640);
  assert.equal(image.height, 360);
  const bg = dark ? [25, 39, 52] : [244, 241, 232];
  const surface = dark ? [237, 243, 245] : [255, 255, 255];
  const primary = dark ? [116, 184, 202] : [50, 107, 135];
  const secondary = dark ? [214, 164, 164] : [184, 207, 176];
  const accent = dark ? [232, 189, 101] : [229, 168, 59];
  const outline = dark ? [9, 19, 28] : [38, 52, 66];
  pixel(image, 0, 0, bg);
  pixel(image, 150, 180, bg); // asset viewport margin / preserved aspect ratio
  pixel(image, 200, 115, primary);
  pixel(image, 200, 140, surface);
  pixel(image, 200, 175, frame < 30 ? surface : accent); // pinned phone revision switch
  pixel(image, 200, 235, frame < 30 ? accent : outline);
  pixel(image, 160, 180, outline);
  pixel(image, 157, 180, dark ? outline : bg); // theme outline width: 6 vs 4
  pixel(image, 440, 200, secondary);
  pixel(image, 440, 148, surface);
  pixel(image, 418, 180, outline);
}
async function checkVideo(path: string) {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BufferSource(await readFile(path)),
  });
  try {
    const track = await input.getPrimaryVideoTrack();
    assert.ok(track);
    assert.equal(await track.getCodec(), 'avc');
    assert.equal(await track.getDisplayWidth(), 640);
    assert.equal(await track.getDisplayHeight(), 360);
    assert.ok(Math.abs((await input.computeDuration()) - 2) < 0.001);
    assert.ok(
      Math.abs(
        (await track.computeFrameRateMetrics()).bestGuessFrameRate - 30,
      ) < 0.001,
    );
    assert.equal((await track.computePacketStats()).packetCount, 60);
  } finally {
    input.dispose();
  }
}

const scene = await loadScene(
  resolve(repositoryRoot, 'tests/fixtures/assets-v1.json'),
);
const library = await loadAssetLibrary();
const directory = resolve(repositoryRoot, 'out/assets');
const bundle = await bundleRenderer();
const frames = [0, 29, 30, 59];
const original = await renderScene(scene, directory, bundle, frames, library);
for (const frame of frames) await checkFrame(directory, frame, false);
await checkVideo(original.videoPath);
const resources = JSON.parse(
  await readFile(resolve(directory, 'scene-resources.json'), 'utf8'),
) as unknown;
assert.deepEqual(resources, {
  sceneId: scene.id,
  resources: compileScene(scene, library).resources,
});

// A changed theme and wider asset viewport prove explicit theme selection and
// aspect-ratio preservation. Load the modified input from a path with spaces.
const variantDirectory = resolve(directory, 'theme variant with spaces');
await mkdir(variantDirectory, { recursive: true });
const variantPath = resolve(variantDirectory, 'scene.json');
const variant = parseScene({
  ...scene,
  theme: { id: 'studio-proof', version: '2' },
  nodes: scene.nodes.map((node) =>
    node.type === 'group'
      ? {
          ...node,
          children: node.children.map((child) => ({ ...child, width: 200 })),
        }
      : node,
  ),
});
await writeFile(variantPath, JSON.stringify(variant, null, 2) + '\n');
const changed = await renderScene(
  await loadScene(variantPath),
  variantDirectory,
  bundle,
  frames,
  library,
);
for (const frame of frames) await checkFrame(variantDirectory, frame, true);
await checkVideo(changed.videoPath);
await writeFile(
  resolve(directory, 'verification.json'),
  JSON.stringify(
    {
      status: 'passed',
      referenceFrames: frames,
      themes: ['studio-proof@1', 'studio-proof@2'],
      assetVersions: ['prop_phone@1', 'prop_phone@2', 'prop_book@1'],
      width: 640,
      height: 360,
      fps: 30,
      duration: 2,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Asset render verification passed: semantic IDs, pinned revisions, theme colors/outlines, aspect ratio, usage manifest, and MP4 metadata.',
);
