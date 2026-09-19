export function fail(path: string, reason: string): never {
  throw new Error(`${path}: ${reason}`);
}

export function object(
  value: unknown,
  path: string,
  keys: string[],
): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fail(path, 'expected an object');
  }
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) fail(`${path}.${key}`, 'unsupported field');
  }
  return value as Record<string, unknown>;
}

export function literal<T extends string>(
  value: unknown,
  expected: T,
  path: string,
): T {
  if (value !== expected) fail(path, `expected "${expected}"`);
  return expected;
}

export function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fail(path, 'expected a nonempty string');
  }
  return value;
}

export function number(
  value: unknown,
  path: string,
  integer: boolean,
  minimum: number,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < minimum ||
    (integer && !Number.isSafeInteger(value))
  ) {
    return fail(
      path,
      `expected a finite ${integer ? 'safe integer' : 'number'} >= ${minimum}`,
    );
  }
  return value;
}
