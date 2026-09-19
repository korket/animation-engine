import { readFile } from 'node:fs/promises';
import { parseSmokeScene } from '@animation-engine/scene-schema';

export async function loadSmokeScene(path: string) {
  const text = await readFile(path, 'utf8');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause) {
    throw new Error(`${path}: malformed scene JSON`, { cause });
  }
  return parseSmokeScene(value);
}
