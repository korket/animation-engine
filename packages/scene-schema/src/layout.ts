import { fail, object, number, text } from './validation.ts';
export const layoutNames = [
  'center-character',
  'character-left-object-right',
  'character-right-object-left',
  'two-column',
  'three-item-row',
  'diagram-center',
  'full-screen-object',
  'chart-focus',
  'environment-wide',
] as const;
export type Layout = (typeof layoutNames)[number];
export type Position =
  | 'center'
  | 'left-center'
  | 'right-center'
  | 'top-center'
  | 'bottom-center'
  | Readonly<{ x: number; y: number }>
  | Readonly<{ slot: string }>
  | Readonly<{
      relativeTo: string;
      placement: 'left-of' | 'right-of' | 'above' | 'below';
      gap: number;
    }>;
export function parseLayout(input: unknown, path: string): Layout {
  if (!layoutNames.includes(input as Layout))
    return fail(path, 'unsupported named layout');
  return input as Layout;
}
export function parsePosition(input: unknown, path: string): Position {
  if (
    input === 'center' ||
    input === 'left-center' ||
    input === 'right-center' ||
    input === 'top-center' ||
    input === 'bottom-center'
  )
    return input;
  const value = object(input, path, [
    'x',
    'y',
    'slot',
    'relativeTo',
    'placement',
    'gap',
  ]);
  if ('slot' in value) {
    object(value, path, ['slot']);
    return { slot: text(value.slot, `${path}.slot`) };
  }
  if ('relativeTo' in value) {
    object(value, path, ['relativeTo', 'placement', 'gap']);
    const placement = value.placement;
    if (
      placement !== 'left-of' &&
      placement !== 'right-of' &&
      placement !== 'above' &&
      placement !== 'below'
    )
      return fail(`${path}.placement`, 'unsupported relative placement');
    return {
      relativeTo: text(value.relativeTo, `${path}.relativeTo`),
      placement,
      gap: number(value.gap, `${path}.gap`, false, 0),
    };
  }
  object(value, path, ['x', 'y']);
  return {
    x: number(value.x, `${path}.x`, false, -Number.MAX_VALUE),
    y: number(value.y, `${path}.y`, false, -Number.MAX_VALUE),
  };
}
