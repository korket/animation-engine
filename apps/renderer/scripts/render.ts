import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { SmokeScene } from '@animation-engine/scene-schema';
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
  await mkdir(directory, { recursive: true });
  // A failed or ordinary rerender must not retain a previous success report.
  await rm(resolve(directory, 'verification.json'), { force: true });
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
    const inputProps = { scene };
    const composition = await selectComposition({
      serveUrl,
      id: 'Smoke',
      inputProps,
      puppeteerInstance: browser,
    });
    const videoPath = resolve(directory, 'smoke.mp4');
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
    const frames = [
      ...new Set([
        0,
        Math.floor((scene.fade.startFrame + scene.fade.endFrame) / 2),
        scene.fade.endFrame,
        scene.durationInFrames - 1,
      ]),
    ];
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
