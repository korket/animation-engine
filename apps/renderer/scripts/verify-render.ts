import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ALL_FORMATS, BufferSource, Input } from 'mediabunny';
import { PNG } from 'pngjs';
import { parseSmokeScene } from '@animation-engine/scene-schema';
import { bundleSmoke } from './bundle.ts';
import { loadSmokeScene } from './load-scene.ts';
import { fixturePath, outputDirectory } from './paths.ts';
import { renderSmoke } from './render.ts';

// Explicit reference colors: do not import the implementation palette here.
const background = [16, 32, 48];
const accent = [240, 160, 64];
const midpoint = [128, 96, 56];

function pixel(image: PNG, x: number, y: number, expected: number[]) {
  const offset = (image.width * y + x) * 4;
  for (const [channel, value] of expected.entries()) {
    const actual = image.data[offset + channel];
    assert.ok(
      actual !== undefined && Math.abs(actual - value) <= 2,
      `pixel (${x},${y}) channel ${channel}: expected ${value}, received ${actual}`,
    );
  }
  assert.equal(image.data[offset + 3], 255, 'frame must be opaque');
}

async function checkFrame(
  directory: string,
  frame: number,
  width: number,
  height: number,
  radius: number,
  centerColor: number[],
) {
  const image = PNG.sync.read(
    await readFile(resolve(directory, `frame-${frame}.png`)),
  );
  assert.equal(image.width, width);
  assert.equal(image.height, height);
  const cx = width / 2;
  const cy = height / 2;
  pixel(image, 0, 0, background);
  pixel(image, width - 1, height - 1, background);
  pixel(image, cx, cy, centerColor);
  for (const [dx, dy] of [
    [radius - 3, 0],
    [-radius + 3, 0],
    [0, radius - 3],
    [0, -radius + 3],
  ] as const) {
    pixel(image, cx + dx, cy + dy, centerColor);
  }
  for (const [dx, dy] of [
    [radius + 3, 0],
    [-radius - 3, 0],
    [0, radius + 3],
    [0, -radius - 3],
    [radius - 3, radius - 3],
  ] as const) {
    pixel(image, cx + dx, cy + dy, background);
  }
}

async function checkVideo(path: string, width: number, height: number) {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BufferSource(await readFile(path)),
  });
  try {
    const track = await input.getPrimaryVideoTrack();
    assert.ok(track, 'MP4 must contain a video track');
    assert.equal(await track.getCodec(), 'avc');
    assert.equal(await track.getDisplayWidth(), width);
    assert.equal(await track.getDisplayHeight(), height);
    const duration = await input.computeDuration();
    assert.ok(
      Math.abs(duration - 2) < 0.001,
      `expected two seconds, received ${duration}`,
    );
    const rate = await track.computeFrameRateMetrics();
    assert.ok(
      Math.abs(rate.bestGuessFrameRate - 30) < 0.001,
      'expected 30 fps',
    );
    const stats = await track.computePacketStats();
    assert.equal(stats.packetCount, 60, 'expected 60 video packets');
    return {
      width,
      height,
      duration,
      fps: rate.bestGuessFrameRate,
      frames: stats.packetCount,
    };
  } finally {
    input.dispose();
  }
}

const scene = await loadSmokeScene(fixturePath);
const bundle = await bundleSmoke();
const original = await renderSmoke(scene, outputDirectory, bundle);
for (const [frame, color] of [
  [0, background],
  [15, midpoint],
  [30, accent],
  [59, accent],
] as const) {
  await checkFrame(outputDirectory, frame, 640, 360, 60, color);
}
const metadata = await checkVideo(original.videoPath, 640, 360);

// A second input changes geometry and timing through the same real render path.
const variant = parseSmokeScene({
  ...scene,
  id: 'bootstrap-variant',
  width: 800,
  height: 400,
  shape: { ...scene.shape, radius: 25 },
  fade: { startFrame: 10, endFrame: 50 },
});
const variantDirectory = resolve(outputDirectory, 'variant with spaces');
const changed = await renderSmoke(variant, variantDirectory, bundle);
await checkFrame(variantDirectory, 0, 800, 400, 25, background);
await checkFrame(variantDirectory, 30, 800, 400, 25, midpoint);
await checkFrame(variantDirectory, 50, 800, 400, 25, accent);
await checkFrame(variantDirectory, 59, 800, 400, 25, accent);
await checkVideo(changed.videoPath, 800, 400);
await writeFile(
  resolve(outputDirectory, 'verification.json'),
  JSON.stringify(
    {
      status: 'passed',
      fixture: metadata,
      variant: 'passed',
      referenceFrames: original.frames,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Render verification passed: reference frames, MP4 metadata, and changed JSON.',
);
