import { readFile } from 'node:fs/promises';
import { parseScene } from '@animation-engine/scene-schema';

/** Node-only filesystem adapter. Import from engine/node, never the browser entry. */
export async function loadScene(path: string) {
  const source = await readFile(path, 'utf8');
  let input: unknown;
  try {
    input = JSON.parse(source);
  } catch (cause) {
    throw new Error(`${path}: malformed scene JSON`, { cause });
  }
  try {
    return parseScene(input);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`${path}: ${message}`, { cause });
  }
}
