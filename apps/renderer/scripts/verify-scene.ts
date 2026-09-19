import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadScene } from '@animation-engine/engine/node';
import { ALL_FORMATS, BufferSource, Input } from 'mediabunny';
import { PNG } from 'pngjs';
import { bundleRenderer } from './bundle.ts';
import { repositoryRoot } from './paths.ts';
import { renderScene } from './render.ts';

const background = [16, 32, 48];
const panel = [232, 237, 242];
const blue = [40, 124, 192];
const orange = [240, 160, 64];

function pixel(image: PNG, x: number, y: number, expected: number[]) {
  const offset = (image.width * y + x) * 4;
  for (const [channel, value] of expected.entries()) {
    const actual = image.data[offset + channel];
    assert.ok(
      actual !== undefined && Math.abs(actual - value) <= 2,
      `pixel (${x},${y}) channel ${channel}: expected ${value}, received ${actual}`,
    );
  }
  assert.equal(image.data[offset + 3], 255);
}

async function checkFrame(
  directory: string,
  frame: number,
  width: number,
  height: number,
  visible: { panel: boolean; left: boolean; right: boolean; overlay: boolean },
) {
  const image = PNG.sync.read(
    await readFile(resolve(directory, `frame-${frame}.png`)),
  );
  assert.equal(image.width, width);
  assert.equal(image.height, height);
  const cx = width / 2;
  const cy = height / 2;
  const base = visible.panel ? panel : background;
  pixel(image, 0, 0, background);
  pixel(image, width - 1, height - 1, background);
  pixel(image, cx - 201, cy, background);
  pixel(image, cx - 199, cy, base);
  pixel(image, cx, cy - 101, background);
  pixel(image, cx, cy - 99, base);
  pixel(image, cx, cy, base);
  for (const [x, shown, color] of [
    [cx - 100, visible.left, blue],
    [cx + 100, visible.right, orange],
  ] as const) {
    pixel(image, x + 30, cy, shown ? color : base);
    pixel(image, x - 30, cy, shown ? color : base);
    pixel(image, x, cy + 30, shown ? color : base);
    pixel(image, x, cy - 30, shown ? color : base);
    pixel(image, x + 43, cy, base);
    pixel(image, x + 30, cy + 30, base);
  }
  pixel(image, cx - 100, cy, visible.left ? blue : base);
  pixel(
    image,
    cx + 100,
    cy,
    visible.overlay ? background : visible.right ? orange : base,
  );
  pixel(
    image,
    cx + 114,
    cy + 14,
    visible.overlay ? background : visible.right ? orange : base,
  );
  pixel(image, cx + 116, cy, visible.right ? orange : base);
}

async function checkVideo(
  path: string,
  width: number,
  height: number,
  fps: number,
  duration: number,
) {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BufferSource(await readFile(path)),
  });
  try {
    const track = await input.getPrimaryVideoTrack();
    assert.ok(track, 'MP4 must contain video');
    assert.equal(await track.getCodec(), 'avc');
    assert.equal(await track.getDisplayWidth(), width);
    assert.equal(await track.getDisplayHeight(), height);
    const actualDuration = await input.computeDuration();
    assert.ok(
      Math.abs(actualDuration - duration) < 0.001,
      `duration: ${actualDuration}`,
    );
    const rate = await track.computeFrameRateMetrics();
    assert.ok(
      Math.abs(rate.bestGuessFrameRate - fps) < 0.001,
      `fps: ${rate.bestGuessFrameRate}`,
    );
    assert.equal(
      (await track.computePacketStats()).packetCount,
      fps * duration,
    );
    return { width, height, fps, duration, frames: fps * duration };
  } finally {
    input.dispose();
  }
}

const scene = await loadScene(
  resolve(repositoryRoot, 'tests/fixtures/scene-v1.json'),
);
const directory = resolve(repositoryRoot, 'out/scene');
const bundle = await bundleRenderer();
const frames = [0, 14, 15, 29, 30, 44, 45, 59, 60, 89];
const rendered = await renderScene(scene, directory, bundle, frames);
for (const frame of frames) {
  await checkFrame(directory, frame, 640, 360, {
    panel: true,
    left: frame >= 15 && frame < 45,
    right: frame >= 30,
    overlay: frame >= 60,
  });
}
const metadata = await checkVideo(rendered.videoPath, 640, 360, 30, 3);

// Reload changed JSON from disk: viewport, fps, duration, and parent timing must
// drive both composition selection and rendering, including an empty final frame.
const variantDirectory = resolve(directory, 'variant with spaces');
await mkdir(variantDirectory, { recursive: true });
const variantPath = resolve(variantDirectory, 'changed scene.json');
await writeFile(
  variantPath,
  JSON.stringify({
    ...scene,
    id: 'core-runtime-variant',
    width: 800,
    height: 400,
    fps: 24,
    duration: 4,
    nodes: scene.nodes.map((node) => ({ ...node, start: 0.5 })),
  }),
);
const variant = await loadScene(variantPath);
const variantFrames = [0, 11, 12, 23, 24, 35, 36, 47, 48, 59, 60, 83, 84, 95];
const changed = await renderScene(
  variant,
  variantDirectory,
  bundle,
  variantFrames,
);
for (const frame of variantFrames) {
  await checkFrame(variantDirectory, frame, 800, 400, {
    panel: frame >= 12 && frame < 84,
    left: frame >= 24 && frame < 48,
    right: frame >= 36 && frame < 84,
    overlay: frame >= 60 && frame < 84,
  });
}
const variantMetadata = await checkVideo(changed.videoPath, 800, 400, 24, 4);
await writeFile(
  resolve(directory, 'verification.json'),
  JSON.stringify(
    {
      status: 'passed',
      fixture: metadata,
      variant: variantMetadata,
      referenceFrames: frames,
      variantFrames,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Scene verification passed: nested geometry, timing boundaries, paint order, changed JSON, and MP4 metadata.',
);
