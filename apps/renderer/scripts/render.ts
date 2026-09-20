import { mkdir, rm, writeFile } from 'node:fs/promises';
import { loadAssetLibrary } from '@animation-engine/assets/node';
import type { AssetLibrary } from '@animation-engine/assets';
import { resolve } from 'node:path';
import type { Scene, SmokeScene } from '@animation-engine/scene-schema';
import { sceneRenderSettings } from './scene-settings.ts';
import {
  ensureBrowser,
  openBrowser,
  renderMedia,
  renderStill,
  selectComposition,
} from '@remotion/renderer';

export async function renderSmoke(
  scene: SmokeScene,
  directory: string,
  serveUrl: string,
) {
  return renderComposition(scene, directory, serveUrl, 'Smoke', 'smoke.mp4', [
    ...new Set([
      0,
      Math.floor((scene.fade.startFrame + scene.fade.endFrame) / 2),
      scene.fade.endFrame,
      scene.durationInFrames - 1,
    ]),
  ]);
}

export async function renderScene(
  scene: Scene,
  directory: string,
  serveUrl: string,
  referenceFrames?: readonly number[],
  suppliedLibrary?: AssetLibrary,
) {
  const library =
    suppliedLibrary ?? (scene.theme ? await loadAssetLibrary() : undefined);
  const { frames, scene: compiled } = sceneRenderSettings(
    scene,
    referenceFrames,
    library,
  );
  const result = await renderComposition(
    scene,
    directory,
    serveUrl,
    'Scene',
    'scene.mp4',
    frames,
    library,
  );
  await writeFile(
    resolve(directory, 'scene-resources.json'),
    JSON.stringify(
      { sceneId: scene.id, resources: compiled.resources ?? null },
      null,
      2,
    ) + '\n',
  );
  return result;
}

async function renderComposition(
  scene: Scene | SmokeScene,
  directory: string,
  serveUrl: string,
  id: string,
  filename: string,
  frames: readonly number[],
  library?: AssetLibrary,
) {
  await mkdir(directory, { recursive: true });
  // A failed or ordinary rerender must not retain a previous success report.
  await rm(resolve(directory, 'verification.json'), { force: true });
  await rm(resolve(directory, 'scene-resources.json'), { force: true });
  const installed = await ensureBrowser({ chromeMode: 'headless-shell' });
  if (
    installed.type !== 'local-puppeteer-browser' &&
    installed.type !== 'user-defined-path'
  ) {
    throw new Error(`Managed browser unavailable: ${installed.type}`);
  }
  const browser = await openBrowser('chrome', {
    browserExecutable: installed.path,
    chromeMode: 'headless-shell',
  });
  try {
    const inputProps = { scene, ...(library ? { library } : {}) };
    const composition = await selectComposition({
      serveUrl,
      id,
      inputProps,
      puppeteerInstance: browser,
    });
    const videoPath = resolve(directory, filename);
    await renderMedia({
      composition,
      serveUrl,
      inputProps,
      puppeteerInstance: browser,
      codec: 'h264',
      pixelFormat: 'yuv420p',
      crf: 18,
      x264Preset: 'medium',
      hardwareAcceleration: 'disable',
      imageFormat: 'png',
      concurrency: 2,
      outputLocation: videoPath,
    });
    for (const frame of frames) {
      await renderStill({
        composition,
        serveUrl,
        inputProps,
        puppeteerInstance: browser,
        frame,
        imageFormat: 'png',
        output: resolve(directory, `frame-${frame}.png`),
      });
    }
    return { videoPath, frames };
  } finally {
    await browser.close({ silent: true });
  }
}
