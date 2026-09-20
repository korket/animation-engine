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
  primary = [50, 107, 135],
  accent = [229, 168, 59],
  secondary = [184, 207, 176],
  ink = [38, 52, 66];
function pixel(image: PNG, x: number, y: number, color: number[]) {
  const i = (image.width * y + x) * 4;
  color.forEach((value, c) =>
    assert.ok(
      Math.abs((image.data[i + c] ?? NaN) - value) <= 3,
      `pixel ${x},${y} channel ${c}: expected ${value}, got ${image.data[i + c]}`,
    ),
  );
  assert.equal(image.data[i + 3], 255);
}
async function frame(dir: string, f: number) {
  const image = PNG.sync.read(await readFile(resolve(dir, `frame-${f}.png`)));
  assert.equal(image.width, 960);
  assert.equal(image.height, 540);
  return image;
}
function textInk(
  image: PNG,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  let pixels = 0;
  for (let yy = y; yy < y + height; yy++)
    for (let xx = x; xx < x + width; xx++) {
      const i = (yy * image.width + xx) * 4;
      if (ink.every((v, c) => Math.abs((image.data[i + c] ?? NaN) - v) < 30))
        pixels++;
    }
  assert.ok(
    pixels > 30,
    `Expected readable text ink in ${x},${y},${width},${height}`,
  );
}
async function video(path: string) {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BufferSource(await readFile(path)),
  });
  try {
    const track = await input.getPrimaryVideoTrack();
    assert.ok(track);
    assert.equal(await track.getCodec(), 'avc');
    assert.equal(await track.getDisplayWidth(), 960);
    assert.equal(await track.getDisplayHeight(), 540);
    assert.ok(Math.abs((await input.computeDuration()) - 4) < 0.001);
    assert.ok(
      Math.abs(
        (await track.computeFrameRateMetrics()).bestGuessFrameRate - 30,
      ) < 0.001,
    );
    assert.equal((await track.computePacketStats()).packetCount, 120);
  } finally {
    input.dispose();
  }
}
const dir = resolve(repositoryRoot, 'out/cognitive'),
  library = await loadAssetLibrary();
const scene = await loadScene(
  resolve(repositoryRoot, 'tests/fixtures/cognitive-v1.json'),
);
const bundle = await bundleRenderer(),
  frames = [0, 15, 30, 45, 60, 75, 90, 119];
const result = await renderScene(scene, dir, bundle, frames, library);
await video(result.videoPath);
// Independent expectations: plot baseline 390, height 196, maximum 30.
for (const f of frames) {
  const image = await frame(dir, f),
    progress = Math.min(1, Math.max(0, (f - 15) / 30));
  pixel(image, 0, 0, bg);
  pixel(image, 516, 290, ink);
  for (const [x, value, color] of [
    [583, 12, primary],
    [718, 24, accent],
    [853, 18, primary],
  ] as const) {
    const top = 390 - (value / 30) * 196 * progress;
    if (progress > 0) pixel(image, x + 10, Math.ceil(top + 5), [...color]);
    pixel(image, x + 20, Math.floor(top - 5), bg);
  }
  pixel(image, 718, Math.round(356 - (24 / 30) * 196 * progress), primary);
  const alpha = [1, 0.3, 0.3, 0.225, 0.15, 0, 1, 1][frames.indexOf(f)]!;
  // Three overlapping discs: halos at .12 and .2, then the core.
  const composed = 1 - (1 - alpha * 0.12) * (1 - alpha * 0.2) * (1 - alpha);
  const color = f >= 90 ? secondary : accent;
  const blend = bg.map((v, i) => v * (1 - composed) + color[i]! * composed);
  pixel(image, f === 0 ? 200 : f === 15 ? 210 : 220, 280, blend);
  textInk(image, 100, 20, 760, 30); // heading
  textInk(image, 600, 90, 250, 30); // chart title
  textInk(image, 560, 445, 360, 40); // mandatory source caption
  textInk(image, 80, 105, 155, 50); // thought text
}
const resources = JSON.parse(
  await readFile(resolve(dir, 'scene-resources.json'), 'utf8'),
);
assert.equal(resources.resources.fonts[0].package, '@fontsource/roboto-mono');
assert.equal(resources.resources.fonts[0].version, '5.3.0');

// Authored JSON changes must drive both geometry and visible output, including paths with spaces.
const changedDir = resolve(dir, 'changed data with spaces');
await mkdir(changedDir, { recursive: true });
const changedPath = resolve(changedDir, 'scene.json');
const changed = parseScene({
  ...scene,
  nodes: scene.nodes.map((n) =>
    n.type === 'barChart'
      ? {
          ...n,
          bars: n.bars.map((b) => ({
            ...b,
            value: b.id === 'b' ? 6 : b.value,
          })),
          dataSource: { kind: 'synthetic', citation: 'changed fixture values' },
        }
      : n,
  ),
});
await writeFile(changedPath, JSON.stringify(changed, null, 2) + '\n');
await video(
  (
    await renderScene(
      await loadScene(changedPath),
      changedDir,
      bundle,
      [45],
      library,
    )
  ).videoPath,
);
const changedFrame = await frame(changedDir, 45);
pixel(changedFrame, 730, 300, bg);
pixel(changedFrame, 730, 370, accent);
pixel(changedFrame, 718, 317, primary);
assert.notDeepEqual(changedFrame.data, (await frame(dir, 45)).data);

const reducedDir = resolve(dir, 'reduced');
await video(
  (
    await renderScene(
      parseScene({ ...scene, motionMode: 'reduced' }),
      reducedDir,
      bundle,
      [0, 75],
      library,
    )
  ).videoPath,
);
pixel(await frame(reducedDir, 0), 730, 250, accent);
pixel(await frame(reducedDir, 0), 718, 199, primary);
pixel(await frame(reducedDir, 75), 200, 280, bg);

const repeatDir = resolve(dir, 'repeat');
await video(
  (await renderScene(scene, repeatDir, bundle, [0, 45, 119], library))
    .videoPath,
);
for (const f of [0, 45, 119])
  assert.deepEqual(
    (await frame(dir, f)).data,
    (await frame(repeatDir, f)).data,
    `Repeat frame ${f}`,
  );
await writeFile(
  resolve(dir, 'verification.json'),
  JSON.stringify(
    {
      status: 'passed',
      frames,
      memoryStates: 'passed',
      chartGeometry: 'passed',
      textInk: 'passed',
      changedData: 'passed',
      reducedMotion: 'passed',
      repeatFrames: [0, 45, 119],
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Cognitive verification passed: memory states, bubbles, text, chart geometry, anchors, changed data, reduced motion, repeat frames, and MP4 metadata.',
);
