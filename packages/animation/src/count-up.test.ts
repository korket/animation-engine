import { it, expect } from 'vitest';
import { countUp } from './index.ts';
it('counts from exact start through midpoint to exact endpoint', () => {
  expect([0, 0.5, 1].map((p) => countUp(10, 30, p))).toEqual([10, 20, 30]);
  expect(countUp(30, 10, 0.5)).toBe(20);
  expect(countUp(0, 2.5, 0.4)).toBe(1);
  expect(countUp(10, 30, 0.5)).toBe(countUp(10, 30, 0.5));
});
it.each([
  [-1, 2, -0.1],
  [0, 2, 1.1],
  [NaN, 2, 0],
  [0, Infinity, 0.5],
])('rejects invalid numeric reveal %#', (from, to, p) =>
  expect(() => countUp(from, to, p)).toThrow(),
);
