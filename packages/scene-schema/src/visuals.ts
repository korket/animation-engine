import { easingNames } from '@animation-engine/animation';
import type { Easing } from '@animation-engine/animation';
import { fail, object, number, text } from './validation.ts';
import { timeToFrames } from './timing.ts';

export const memoryStates = [
  'active',
  'weak',
  'fading',
  'hidden',
  'retrieved',
] as const;
export type MemoryState = (typeof memoryStates)[number];
export type LabelRole = 'outline' | 'primary' | 'secondary' | 'accent';
export type VisualDefinition =
  | Readonly<{
      type: 'memoryOrb';
      content: string;
      fontSize: number;
      state: MemoryState;
      fadeDuration: number;
      stateChanges: readonly { at: number; state: MemoryState }[];
    }>
  | Readonly<{
      type: 'thoughtBubble' | 'contextBubble';
      text: string;
      fontSize: number;
    }>
  | Readonly<{
      type: 'label';
      text: string;
      fontSize: number;
      align: 'left' | 'center' | 'right';
      colorRole: LabelRole;
    }>
  | Readonly<{
      type: 'barChart';
      title: string;
      unit: string;
      yMax: number;
      decimals: number;
      bars: readonly {
        id: string;
        label: string;
        value: number;
        highlight: boolean;
      }[];
      annotations: readonly { barId: string; text: string }[];
      dataSource: Readonly<{
        kind: 'synthetic' | 'research';
        citation: string;
      }>;
      reveal: Readonly<{ start: number; duration: number; easing: Easing }>;
    }>;
export const visualFields = [
  'content',
  'fontSize',
  'state',
  'fadeDuration',
  'stateChanges',
  'text',
  'align',
  'colorRole',
  'title',
  'unit',
  'yMax',
  'decimals',
  'bars',
  'annotations',
  'dataSource',
  'reveal',
];
export function labelText(input: unknown, path: string): string {
  const value = text(input, path);
  if (!/^[\x20-\x7e]+$/.test(value) || value.length > 240)
    fail(path, 'expected 1-240 printable ASCII characters');
  return value;
}
export function parseVisual(
  input: Record<string, unknown>,
  path: string,
  fps: number,
  length: number,
  common: string[],
): VisualDefinition {
  const keys = (fields: string[]) =>
    object(input, path, [...common, 'width', 'height', ...fields]);
  const font = () => {
    const n = number(input.fontSize, `${path}.fontSize`, false, 12);
    if (n > 48) fail(`${path}.fontSize`, 'maximum 48');
    return n;
  };
  if (input.type === 'memoryOrb') {
    keys(['content', 'fontSize', 'state', 'fadeDuration', 'stateChanges']);
    const state = (s: unknown, p: string): MemoryState => {
      if (!memoryStates.includes(s as MemoryState))
        return fail(p, 'unsupported memory state');
      return s as MemoryState;
    };
    const initial = state(input.state, `${path}.state`);
    const fadeDuration = number(
      input.fadeDuration,
      `${path}.fadeDuration`,
      false,
      0,
    );
    const fade = timeToFrames(fadeDuration, fps, `${path}.fadeDuration`);
    if (fade < 1) fail(path, 'fadeDuration must contain a frame');
    if (!Array.isArray(input.stateChanges))
      return fail(`${path}.stateChanges`, 'expected array');
    let previous = 0,
      previousState = initial;
    const stateChanges = input.stateChanges.map((v, i) => {
      const p = `${path}.stateChanges[${i}]`,
        c = object(v, p, ['at', 'state']);
      const at = number(c.at, `${p}.at`, false, 0),
        frame = timeToFrames(at, fps, `${p}.at`);
      if (frame <= previous || frame >= length)
        fail(
          p,
          'state changes must be strictly ordered after frame zero and inside visibility',
        );
      if (previousState === 'fading' && frame < previous + fade)
        fail(p, 'cannot interrupt fading interval');
      previous = frame;
      previousState = state(c.state, `${p}.state`);
      return { at, state: previousState };
    });
    if (previousState === 'fading' && previous + fade > length)
      fail(path, 'fading interval exceeds visibility');
    return {
      type: 'memoryOrb',
      content: labelText(input.content, `${path}.content`),
      fontSize: font(),
      state: initial,
      fadeDuration,
      stateChanges,
    };
  }
  if (input.type === 'thoughtBubble' || input.type === 'contextBubble') {
    keys(['text', 'fontSize']);
    return {
      type: input.type,
      text: labelText(input.text, `${path}.text`),
      fontSize: font(),
    };
  }
  if (input.type === 'label') {
    keys(['text', 'fontSize', 'align', 'colorRole']);
    if (
      input.align !== 'left' &&
      input.align !== 'center' &&
      input.align !== 'right'
    )
      fail(path, 'unsupported text alignment');
    if (
      !['outline', 'primary', 'secondary', 'accent'].includes(
        input.colorRole as string,
      )
    )
      fail(path, 'unsupported label color role');
    return {
      type: 'label',
      text: labelText(input.text, `${path}.text`),
      fontSize: font(),
      align: input.align as 'left' | 'center' | 'right',
      colorRole: input.colorRole as LabelRole,
    };
  }
  keys([
    'title',
    'unit',
    'yMax',
    'decimals',
    'bars',
    'annotations',
    'dataSource',
    'reveal',
  ]);
  const yMax = number(input.yMax, `${path}.yMax`, false, Number.MIN_VALUE);
  const decimals = number(input.decimals, `${path}.decimals`, true, 0);
  if (decimals > 2 || yMax > 1e9)
    fail(path, 'charts support 0-2 decimals and yMax at most 1e9');
  const precision = (v: number, p: string) => {
    if (
      (v > 0 && v < 10 ** -decimals) ||
      Math.abs(v * 10 ** decimals - Math.round(v * 10 ** decimals)) > 1e-7
    )
      fail(p, 'value exceeds declared decimal precision');
  };
  precision(yMax, `${path}.yMax`);
  if (
    !Array.isArray(input.bars) ||
    input.bars.length < 1 ||
    input.bars.length > 6
  )
    return fail(`${path}.bars`, 'expected 1-6 bars');
  const ids = new Set<string>();
  const bars = input.bars.map((v, i) => {
    const p = `${path}.bars[${i}]`,
      b = object(v, p, ['id', 'label', 'value', 'highlight']);
    const id = text(b.id, `${p}.id`);
    if (!/^[a-z][a-z0-9_-]*$/.test(id) || ids.has(id))
      fail(p, 'expected a unique lowercase bar ID');
    ids.add(id);
    const value = number(b.value, `${p}.value`, false, 0);
    if (value > yMax) fail(p, 'bar value exceeds yMax');
    precision(value, `${p}.value`);
    if (typeof b.highlight !== 'boolean') fail(p, 'highlight must be boolean');
    return {
      id,
      label: labelText(b.label, `${p}.label`),
      value,
      highlight: b.highlight as boolean,
    };
  });
  if (!Array.isArray(input.annotations))
    return fail(`${path}.annotations`, 'expected array');
  const annotated = new Set<string>();
  const annotations = input.annotations.map((v, i) => {
    const p = `${path}.annotations[${i}]`,
      a = object(v, p, ['barId', 'text']);
    const barId = text(a.barId, `${p}.barId`);
    if (!ids.has(barId) || annotated.has(barId))
      fail(p, 'expected one annotation per existing bar');
    annotated.add(barId);
    return { barId, text: labelText(a.text, `${p}.text`) };
  });
  const source = object(input.dataSource, `${path}.dataSource`, [
    'kind',
    'citation',
  ]);
  if (source.kind !== 'synthetic' && source.kind !== 'research')
    fail(path, 'dataSource must identify synthetic or research data');
  const dataSource = {
    kind: source.kind as 'synthetic' | 'research',
    citation: labelText(source.citation, `${path}.dataSource.citation`),
  };
  const r = object(input.reveal, `${path}.reveal`, [
    'start',
    'duration',
    'easing',
  ]);
  const start = number(r.start, `${path}.reveal.start`, false, 0),
    duration = number(r.duration, `${path}.reveal.duration`, false, 0);
  const s = timeToFrames(start, fps),
    d = timeToFrames(duration, fps);
  if (d < 1 || s + d > length)
    fail(path, 'bar reveal must contain frames and fit visibility');
  if (!easingNames.includes(r.easing as Easing))
    fail(path, 'expected approved reveal easing');
  return {
    type: 'barChart',
    title: labelText(input.title, `${path}.title`),
    unit: labelText(input.unit, `${path}.unit`),
    yMax,
    decimals,
    bars,
    annotations,
    dataSource,
    reveal: { start, duration, easing: r.easing as Easing },
  };
}
