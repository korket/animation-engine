import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { ALL_FORMATS, BufferSource, Input } from 'mediabunny';
import { loadScene } from '@animation-engine/engine/node';
import { loadAssetLibrary } from '@animation-engine/assets/node';
import { parseScene } from '@animation-engine/scene-schema';
import { bundleRenderer } from './bundle.ts';
import { renderScene } from './render.ts';
import { repositoryRoot } from './paths.ts';

const dark = [16, 32, 48],
  accent = [240, 160, 64],
  half = [128, 96, 56],
  quarter = [72, 64, 52];
function pixel(image: PNG, x: number, y: number, color: number[]) {
  const offset = (image.width * Math.round(y) + Math.round(x)) * 4;
  for (const [channel, value] of color.entries())
    assert.ok(
      Math.abs((image.data[offset + channel] ?? NaN) - value) <= 2,
      `pixel ${x},${y} channel ${channel}: expected ${value}, got ${image.data[offset + channel]}`,
    );
  assert.equal(image.data[offset + 3], 255);
}
async function frame(
  directory: string,
  index: number,
  width: number,
  height: number,
) {
  const image = PNG.sync.read(
    await readFile(resolve(directory, `frame-${index}.png`)),
  );
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

const effects = [
  { type: 'fadeIn' },
  { type: 'fadeOut' },
  { type: 'slideIn', offset: { x: -30, y: 0 } },
  { type: 'slideOut', offset: { x: 30, y: 0 } },
  { type: 'scaleIn', from: 0.9 },
  { type: 'pop', amount: 0.2 },
  { type: 'bounce', distance: 20 },
  { type: 'rotate', from: 0, to: 90 },
  { type: 'shake', distance: 10, cycles: 1 },
  { type: 'wiggle', angle: 30, cycles: 1 },
  { type: 'pulse', amount: 0.2, cycles: 1 },
  {
    type: 'followPath',
    points: [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 20 },
    ],
  },
  { type: 'highlight', color: '#FFFFFF', width: 4 },
];
const nodes: unknown[] = effects.map((_effect, index) => ({
  id: `cell-${index}`,
  type: 'group',
  position: {
    x: ((index % 4) + 0.5) * 160,
    y: (Math.floor(index / 4) + 0.5) * 120,
  },
  width: 160,
  height: 120,
  start: 0,
  duration: 3,
  children: [
    {
      id: `item-${index}`,
      type: 'rect',
      position: 'center',
      width: 40,
      height: 20,
      fill: '#F0A040',
      start: 0,
      duration: 3,
    },
  ],
}));
const animations: unknown[] = effects.map((effect, index) => ({
  target: `item-${index}`,
  start: 0,
  duration: 2,
  easing: 'linear',
  effect,
}));
nodes.push({
  id: 'stagger-cell',
  type: 'group',
  position: { x: 240, y: 420 },
  width: 160,
  height: 120,
  start: 0,
  duration: 3,
  children: [55, 105].map((x, i) => ({
    id: `stagger-${i}`,
    type: 'circle',
    radius: 10,
    position: { x, y: 60 },
    fill: '#F0A040',
    start: 0,
    duration: 3,
  })),
});
animations.push({
  targets: ['stagger-0', 'stagger-1'],
  stagger: 0.5,
  start: 0,
  duration: 2,
  easing: 'linear',
  effect: { type: 'fadeIn' },
});
nodes.push({
  id: 'rotating-group',
  type: 'group',
  position: { x: 400, y: 420 },
  width: 160,
  height: 120,
  start: 0,
  duration: 3,
  children: [
    {
      id: 'orbiting-dot',
      type: 'circle',
      radius: 8,
      position: { x: 100, y: 60 },
      fill: '#F0A040',
      start: 0,
      duration: 3,
    },
  ],
});
animations.push(
  {
    target: 'rotating-group',
    start: 0,
    duration: 2,
    easing: 'linear',
    effect: { type: 'rotate', from: 0, to: 90 },
  },
  {
    target: 'rotating-group',
    start: 0,
    duration: 2,
    easing: 'linear',
    effect: { type: 'fadeIn' },
  },
);
const grid = parseScene({
  schemaVersion: 1,
  id: 'primitive-reference-grid',
  purpose:
    'Reference pixels for every implemented object primitive and stagger',
  emotion: 'neutral',
  importance: 'low',
  width: 640,
  height: 480,
  fps: 30,
  duration: 3,
  background: '#102030',
  nodes,
  animations,
});

const directory = resolve(repositoryRoot, 'out/motion'),
  gridDirectory = resolve(directory, 'primitive grid');
const scene = await loadScene(
  resolve(repositoryRoot, 'tests/fixtures/motion-v1.json'),
);
const library = await loadAssetLibrary();
const bundle = await bundleRenderer();
const demoFrames = [0, 15, 45, 60, 75, 90, 105, 119];
const demo = await renderScene(scene, directory, bundle, demoFrames, library);
await video(demo.videoPath, 640, 360, 4);
const bg = [244, 241, 232],
  orb = [229, 168, 59];
pixel(await frame(directory, 0, 640, 360), 160, 180, bg);
for (const [f, x, r] of [
  [15, 160, 25],
  [45, 240, 25],
  [60, 240, 25],
  [75, 260, 25],
  [90, 254, 27.5],
  [105, 320, 27.5],
  [119, 320, 27.5],
] as const) {
  const image = await frame(directory, f, 640, 360);
  pixel(image, x, 180, orb);
  pixel(image, x + r + 4, 180, bg);
  pixel(image, 0, 0, bg);
}

await mkdir(gridDirectory, { recursive: true });
const gridPath = resolve(gridDirectory, 'scene.json');
await writeFile(gridPath, JSON.stringify(grid, null, 2) + '\n');
const gridFrames = [0, 15, 30, 60, 75, 89];
const result = await renderScene(
  await loadScene(gridPath),
  gridDirectory,
  bundle,
  gridFrames,
);
await video(result.videoPath, 640, 480, 3);
const start = await frame(gridDirectory, 0, 640, 480),
  mid = await frame(gridDirectory, 30, 640, 480),
  end = await frame(gridDirectory, 60, 640, 480),
  q = await frame(gridDirectory, 15, 640, 480);
const sample = (
  image: PNG,
  index: number,
  dx: number,
  dy: number,
  color: number[],
) =>
  pixel(
    image,
    ((index % 4) + 0.5) * 160 + dx,
    (Math.floor(index / 4) + 0.5) * 120 + dy,
    color,
  );
// Explicit reference positions/colors, independent of the engine/easing implementation.
sample(start, 0, 0, 0, dark);
sample(mid, 0, 0, 0, half);
sample(end, 0, 0, 0, accent);
sample(start, 1, 0, 0, accent);
sample(mid, 1, 0, 0, half);
sample(end, 1, 0, 0, dark);
sample(start, 2, -30, 0, accent);
sample(mid, 2, -15, 0, accent);
sample(mid, 2, 15, 0, dark);
sample(end, 2, 0, 0, accent);
sample(start, 3, 0, 0, accent);
sample(mid, 3, 15, 0, accent);
sample(end, 3, 30, 0, accent);
sample(end, 3, 0, 0, dark);
sample(start, 4, 0, 0, dark);
sample(mid, 4, 0, 0, half);
sample(end, 4, 0, 0, accent);
sample(start, 5, 0, 0, dark);
sample(mid, 5, 21, 0, half);
sample(end, 5, 21, 0, dark);
sample(mid, 6, 0, -20, accent);
sample(mid, 6, 0, 0, dark);
sample(end, 6, 0, 0, accent);
sample(start, 7, 16, 0, accent);
sample(mid, 7, 10, 10, accent);
sample(mid, 7, -10, 10, dark);
sample(end, 7, 16, 0, dark);
sample(end, 7, 0, 16, accent);
sample(q, 8, 24, 0, accent);
sample(start, 8, 24, 0, dark);
sample(end, 8, 24, 0, dark);
sample(q, 9, 14, 12, accent);
sample(start, 9, 14, 12, dark);
sample(end, 9, 14, 12, dark);
sample(mid, 10, 22, 0, accent);
sample(start, 10, 22, 0, dark);
sample(end, 10, 22, 0, dark);
sample(mid, 11, 20, 0, accent);
sample(end, 11, 20, 20, accent);
sample(end, 11, 0, 0, dark);
sample(mid, 12, -21, 0, [255, 255, 255]);
sample(start, 12, -21, 0, dark);
sample(end, 12, -21, 0, dark);
pixel(mid, 215, 420, half);
pixel(mid, 265, 420, quarter);
pixel(mid, 414, 434, half);
pixel(end, 400, 440, accent);
pixel(end, 420, 420, dark);
assert.deepEqual(
  (await frame(gridDirectory, 89, 640, 480)).data,
  (await frame(gridDirectory, 75, 640, 480)).data,
  'endpoint holds must remain stable',
);

const reducedDirectory = resolve(directory, 'reduced with spaces');
const reduced = parseScene({ ...scene, motionMode: 'reduced' });
const reducedResult = await renderScene(
  reduced,
  reducedDirectory,
  bundle,
  [0, 15, 90, 119],
  library,
);
await video(reducedResult.videoPath, 640, 360, 4);
pixel(await frame(reducedDirectory, 0, 640, 360), 160, 180, bg);
for (const f of [15, 90, 119]) {
  const image = await frame(reducedDirectory, f, 640, 360);
  pixel(image, 160, 180, orb);
  pixel(image, 240, 180, bg);
}
await writeFile(
  resolve(directory, 'verification.json'),
  JSON.stringify(
    {
      status: 'passed',
      demoFrames,
      gridFrames,
      primitives: [
        ...effects.map((e) => e.type),
        'stagger',
        'cameraPan',
        'cameraPush',
        'cameraFollow',
      ],
      reducedMotion: 'passed',
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Motion verification passed: all object primitives, group transforms, stagger, camera framing, reduced motion, and real MP4 metadata.',
);
