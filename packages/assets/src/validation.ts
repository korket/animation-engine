export function fail(path: string, reason: string): never {
  throw new Error(`${path}: ${reason}`);
}
export function object(
  input: unknown,
  path: string,
  keys: readonly string[],
): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return fail(path, 'expected object');
  for (const key of Object.keys(input))
    if (!keys.includes(key)) fail(`${path}.${key}`, 'unsupported field');
  return input as Record<string, unknown>;
}
export function text(input: unknown, path: string): string {
  if (typeof input !== 'string' || !input.trim())
    return fail(path, 'expected nonempty string');
  return input;
}
export function positive(input: unknown, path: string): number {
  if (typeof input !== 'number' || !Number.isFinite(input) || input <= 0)
    return fail(path, 'expected positive finite number');
  return input;
}
export function list(input: unknown, path: string): unknown[] {
  if (!Array.isArray(input)) return fail(path, 'expected array');
  return input;
}
export function version(input: unknown, path: string): string {
  const result = text(input, path);
  if (!/^[1-9]\d*$/.test(result))
    fail(path, 'expected explicit positive version string');
  return result;
}
export function identifier(input: unknown, path: string): string {
  const result = text(input, path);
  if (!/^[a-z][a-z0-9_-]*$/.test(result))
    fail(path, 'expected semantic lowercase ID');
  return result;
}
