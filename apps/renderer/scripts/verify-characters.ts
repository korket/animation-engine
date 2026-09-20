import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { ALL_FORMATS, BufferSource, Input } from 'mediabunny';
import { loadScene } from '@animation-engine/engine/node';
import { parseScene } from '@animation-engine/scene-schema';
import { loadAssetLibrary } from '@animation-engine/assets/node';
import { bundleRenderer } from './bundle.ts';
import { renderScene } from './render.ts';
import { repositoryRoot } from './paths.ts';

const bg = [244, 241, 232],
  shirt = [50, 107, 135],
  friendShirt = [184, 207, 176],
  white = [255, 255, 255],
  ink = [38, 52, 66];
function pixel(image: PNG, x: number, y: number, color: number[]) {
  const i = (image.width * y + x) * 4;
  color.forEach((value, c) =>
    assert.ok(
      Math.abs((image.data[i + c] ?? NaN) - value) <= 2,
      `pixel ${x},${y} channel ${c}: expected ${value}, got ${image.data[i + c]}`,
    ),
  );
  assert.equal(image.data[i + 3], 255);
}
async function frame(dir: string, f: number, width = 640, height = 360) {
  const image = PNG.sync.read(await readFile(resolve(dir, `frame-${f}.png`)));
  assert.equal(image.width, width);
  assert.equal(image.height, height);
  return image;
}
async function video(
  path: string,
  width: number,
  height: number,
  duration: number,
) {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BufferSource(await readFile(path)),
  });
  try {
    const track = await input.getPrimaryVideoTrack();
    assert.ok(track);
    assert.equal(await track.getCodec(), 'avc');
    assert.equal(await track.getDisplayWidth(), width);
    assert.equal(await track.getDisplayHeight(), height);
    assert.ok(Math.abs((await input.computeDuration()) - duration) < 0.001);
    assert.ok(
      Math.abs(
        (await track.computeFrameRateMetrics()).bestGuessFrameRate - 30,
      ) < 0.001,
    );
    assert.equal((await track.computePacketStats()).packetCount, duration * 30);
  } finally {
    input.dispose();
  }
}
const dir = resolve(repositoryRoot, 'out/characters'),
  library = await loadAssetLibrary();
const scene = await loadScene(
  resolve(repositoryRoot, 'tests/fixtures/characters-v1.json'),
);
const bundle = await bundleRenderer();
const frames = [0, 6, 12, 18, 24, 59, 60, 89, 90, 119];
const result = await renderScene(scene, dir, bundle, frames, library);
await video(result.videoPath, 640, 360, 4);
// Hand positions and travel computed from the authored proof, not engine output.
for (const [f, x, y] of [
  [0, 193, 202],
  [6, 193, 209],
  [12, 200, 202],
  [18, 217, 211],
  [24, 241, 202],
  [60, 312, 164],
  [90, 312, 164],
  [119, 312, 164],
] as const) {
  const image = await frame(dir, f);
  pixel(image, x, y, white);
  pixel(image, x + 15, y, bg);
  pixel(image, f < 60 ? 160 + f * 2 : 280, 200, shirt);
  pixel(image, 480, 200, friendShirt);
  pixel(image, 0, 0, bg);
}
pixel(await frame(dir, 89), 280, 160, white);
pixel(await frame(dir, 90), 280, 160, ink);
const resources = JSON.parse(
  await readFile(resolve(dir, 'scene-resources.json'), 'utf8'),
);
assert.deepEqual(
  resources.resources.characters.map(
    (c: { characterId: string; version: string }) => [c.characterId, c.version],
  ),
  [
    ['protagonist', '1'],
    ['secondary-human', '1'],
  ],
);
assert.equal(resources.resources.assets[0].assetId, 'prop_phone');

const poses = [
  'standing',
  'walking',
  'sitting',
  'thinking',
  'pointing',
  'holding-phone',
  'opening-door',
  'reaching',
  'confused-body',
  'carrying-object',
];
const expressions = [
  'neutral',
  'happy',
  'confused',
  'surprised',
  'frustrated',
  'thinking',
  'worried',
  'focused',
];
const grid = parseScene({
  ...scene,
  id: 'character-pose-reel',
  width: 1000,
  height: 500,
  duration: 1,
  animations: [],
  nodes: poses.map((pose, index) => ({
    id: `pose-${index}`,
    type: 'character',
    characterId: index % 2 === 0 ? 'protagonist' : 'secondary-human',
    characterVersion: '1',
    width: 100,
    height: 200,
    position: {
      x: 100 + (index % 5) * 200,
      y: 125 + Math.floor(index / 5) * 250,
    },
    start: 0,
    duration: 1,
    pose,
    expression: expressions[index % 8],
    walkStepDuration: 0.2,
    actions: [],
  })),
});
const gridDir = resolve(dir, 'pose grid with spaces');
await mkdir(gridDir, { recursive: true });
const gridPath = resolve(gridDir, 'scene.json');
await writeFile(gridPath, JSON.stringify(grid, null, 2) + '\n');
const gridResult = await renderScene(
  await loadScene(gridPath),
  gridDir,
  bundle,
  [0, 6, 12, 18, 24],
  library,
);
await video(gridResult.videoPath, 1000, 500, 1);
const gridFrame = await frame(gridDir, 0, 1000, 500);
for (let i = 0; i < 10; i++)
  pixel(
    gridFrame,
    100 + (i % 5) * 200,
    125 + Math.floor(i / 5) * 250,
    i % 2 === 0 ? shirt : friendShirt,
  );
// Four visible walking foot silhouettes, including exact held-cycle repetition.
for (const [f, x, y] of [
  [0, 266, 209],
  [6, 292, 213],
  [12, 334, 209],
  [18, 308, 213],
] as const)
  pixel(await frame(gridDir, f, 1000, 500), x, y, ink);
assert.deepEqual(
  (await frame(gridDir, 0, 1000, 500)).data,
  (await frame(gridDir, 24, 1000, 500)).data,
);

const reducedDir = resolve(dir, 'reduced');
const reducedResult = await renderScene(
  parseScene({ ...scene, motionMode: 'reduced' }),
  reducedDir,
  bundle,
  [0, 18, 60, 90],
  library,
);
await video(reducedResult.videoPath, 640, 360, 4);
for (const f of [0, 18]) pixel(await frame(reducedDir, f), 185, 210, white);
pixel(await frame(reducedDir, 60), 192, 164, white);
pixel(await frame(reducedDir, 90), 160, 160, ink);

const repeatDir = resolve(dir, 'repeat');
const repeated = await renderScene(
  scene,
  repeatDir,
  bundle,
  [0, 18, 60, 90, 119],
  library,
);
await video(repeated.videoPath, 640, 360, 4);
for (const f of [0, 18, 60, 90, 119])
  assert.deepEqual(
    (await frame(dir, f)).data,
    (await frame(repeatDir, f)).data,
    `repeat frame ${f}`,
  );
await writeFile(
  resolve(dir, 'verification.json'),
  JSON.stringify(
    {
      status: 'passed',
      frames,
      poses,
      expressions,
      attachments: 'passed',
      reducedMotion: 'passed',
      repeatFrames: [0, 18, 60, 90, 119],
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Character verification passed: poses, expressions, walking, attached phone, reduced motion, repeat frames, and MP4 metadata.',
);
