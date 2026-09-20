import { delayRender, continueRender, cancelRender } from 'remotion';
import fontUrl from '@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff2';

export const fontFamily = 'Engine Roboto Mono';
const handle = delayRender('Load pinned local Roboto Mono');
const font = new FontFace(fontFamily, `url("${fontUrl}") format("woff2")`, {
  weight: '400',
  style: 'normal',
});
font
  .load()
  .then(() => {
    document.fonts.add(font);
    continueRender(handle);
  })
  .catch((error: unknown) =>
    cancelRender(error instanceof Error ? error : new Error(String(error))),
  );
