import type { StyledShape, Theme } from '@animation-engine/assets';
import type {
  VisualDefinition,
  MemoryState,
} from '@animation-engine/scene-schema';
import { timeToFrames } from '@animation-engine/scene-schema';
import { countUp, ease, frameProgress } from '@animation-engine/animation';

export type TextShape = Readonly<{
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: `#${string}`;
  textAnchor: 'start' | 'middle' | 'end';
  textLength: number;
  opacity?: number;
}>;
export type VectorShape = (StyledShape & { opacity?: number }) | TextShape;
export type VisualRuntime = Readonly<{
  definition: VisualDefinition;
  theme: Theme;
  fps: number;
}>;
export const fontIdentity = {
  family: 'Engine Roboto Mono',
  package: '@fontsource/roboto-mono',
  version: '5.3.0',
  file: 'roboto-mono-latin-400-normal.woff2',
  license: 'OFL-1.1',
} as const;

/** Fixed monospace advance. Fail on overflow instead of shrinking meaningful text. */
export function textLines(
  text: string,
  width: number,
  height: number,
  size: number,
): readonly string[] {
  const capacity = Math.floor(width / (size * 0.6)),
    maxLines = Math.floor(height / (size * 1.3));
  if (capacity < 1 || maxLines < 1)
    throw new Error('Text bounds are too small');
  const lines: string[] = [];
  for (const word of text.trim().split(/ +/)) {
    if (word.length > capacity)
      throw new Error(`Text word does not fit: ${word}`);
    const last = lines.at(-1);
    if (last !== undefined && last.length + 1 + word.length <= capacity)
      lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
  }
  if (lines.length > maxLines)
    throw new Error('Text overflows declared bounds');
  return lines;
}
function textBlock(
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  size: number,
  fill: `#${string}`,
  align: 'left' | 'center' | 'right' = 'center',
): TextShape[] {
  const lines = textLines(text, width, height, size),
    lineHeight = size * 1.3;
  const top = y + (height - lines.length * lineHeight) / 2;
  return lines.map((text, index) => ({
    type: 'text',
    x: align === 'left' ? x : align === 'right' ? x + width : x + width / 2,
    y: top + index * lineHeight + size,
    text,
    fontSize: size,
    fill,
    textAnchor:
      align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle',
    textLength: text.length * size * 0.6,
  }));
}

export function memoryAt(
  def: Extract<VisualDefinition, { type: 'memoryOrb' }>,
  frame: number,
  fps: number,
) {
  let state = def.state,
    start = 0,
    from = 1;
  const opacity = (state: MemoryState) =>
    state === 'hidden'
      ? 0
      : state === 'weak'
        ? 0.3
        : state === 'fading'
          ? 0.15
          : 1;
  for (const change of def.stateChanges) {
    const at = timeToFrames(change.at, fps);
    if (at > frame) break;
    from = state === 'fading' ? Math.min(from, 0.15) : opacity(state);
    state = change.state;
    start = at;
  }
  return {
    state,
    opacity:
      state === 'fading'
        ? countUp(
            from,
            Math.min(from, 0.15),
            frameProgress(frame, start, timeToFrames(def.fadeDuration, fps)),
          )
        : opacity(state),
  };
}
export function chartGeometry(
  def: Extract<VisualDefinition, { type: 'barChart' }>,
  width: number,
  height: number,
  frame: number,
  fps: number,
  reduced: boolean,
) {
  if (width < 320 || height < 280)
    throw new Error('barChart requires at least 320x280 bounds');
  const left = 56,
    right = width - 20,
    top = 104,
    bottom = height - 100,
    plotHeight = bottom - top;
  const p = reduced
    ? 1
    : ease(
        def.reveal.easing,
        frameProgress(
          frame,
          timeToFrames(def.reveal.start, fps),
          timeToFrames(def.reveal.duration, fps),
        ),
      );
  const slot = (right - left) / def.bars.length;
  return {
    left,
    right,
    top,
    bottom,
    slot,
    p,
    bars: def.bars.map((bar, i) => {
      const value = countUp(0, bar.value, p),
        height = (value / def.yMax) * plotHeight,
        cx = left + (i + 0.5) * slot;
      return {
        ...bar,
        value,
        cx,
        x: cx - slot * 0.28,
        y: bottom - height,
        width: slot * 0.56,
        height,
      };
    }),
  };
}
export function visualAnchor(
  runtime: VisualRuntime,
  width: number,
  height: number,
  name: string,
  frame: number,
  reduced: boolean,
) {
  if (runtime.definition.type !== 'barChart')
    throw new Error('Component does not define bar anchors');
  const bar = chartGeometry(
    runtime.definition,
    width,
    height,
    frame,
    runtime.fps,
    reduced,
  ).bars.find((b) => `bar.${b.id}` === name);
  if (!bar) throw new Error(`Unknown chart anchor ${name}`);
  return { x: bar.cx, y: bar.y };
}

export function evaluateVisual(
  runtime: VisualRuntime,
  width: number,
  height: number,
  frame: number,
  reduced: boolean,
): readonly VectorShape[] {
  const { definition: def, theme, fps } = runtime,
    c = theme.colors,
    strokeWidth = theme.outlineWidth;
  const rect = (
    x: number,
    y: number,
    width: number,
    height: number,
    fill: `#${string}` | 'none',
    stroke: `#${string}` | 'none' = c.outline,
    rx = 0,
  ): VectorShape => ({
    type: 'rect',
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    rx,
  });
  const circle = (
    cx: number,
    cy: number,
    radius: number,
    fill: `#${string}` | 'none',
    stroke: `#${string}` | 'none' = c.outline,
    opacity = 1,
  ): VectorShape => ({
    type: 'circle',
    cx,
    cy,
    radius,
    fill,
    stroke,
    strokeWidth,
    opacity,
  });
  const line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color = c.outline,
  ): VectorShape => ({
    type: 'line',
    x1,
    y1,
    x2,
    y2,
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
  });
  const label = (
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size = 14,
  ) => textBlock(text, x, y, w, h, size, c.outline);
  if (def.type === 'label')
    return textBlock(
      def.text,
      0,
      0,
      width,
      height,
      def.fontSize,
      c[def.colorRole],
      def.align,
    );
  if (def.type === 'memoryOrb') {
    if (width < 80 || height < 80)
      throw new Error('memoryOrb requires at least 80x80 bounds');
    const r = Math.min(width, height) * 0.35,
      cx = width / 2,
      cy = height / 2,
      sample = memoryAt(def, frame, fps);
    const color = sample.state === 'retrieved' ? c.secondary : c.accent;
    return [
      circle(cx, cy, r * 1.3, color, 'none', 0.12),
      circle(cx, cy, r * 1.12, color, 'none', 0.2),
      circle(cx, cy, r, color),
      ...label(
        def.content,
        cx - r * 0.8,
        cy - r * 0.6,
        r * 1.6,
        r * 1.2,
        def.fontSize,
      ),
    ].map((s) => ({ ...s, opacity: (s.opacity ?? 1) * sample.opacity }));
  }
  if (def.type === 'thoughtBubble' || def.type === 'contextBubble') {
    if (width < 100 || height < 60)
      throw new Error('bubble requires at least 100x60 bounds');
    const thought = def.type === 'thoughtBubble',
      bodyHeight = height - (thought ? 20 : 0);
    const shapes: VectorShape[] = [
      rect(
        3,
        3,
        width - 6,
        bodyHeight - 6,
        c.surface,
        thought ? c.outline : c.secondary,
        18,
      ),
    ];
    if (thought)
      shapes.push(
        circle(width * 0.3, bodyHeight + 3, 6, c.surface),
        circle(width * 0.22, height - 5, 2, c.surface),
      );
    else
      shapes.push(
        rect(10, 10, width - 20, height - 20, 'none', c.secondary, 12),
      );
    return [
      ...shapes,
      ...label(def.text, 18, 14, width - 36, bodyHeight - 28, def.fontSize),
    ];
  }
  if (def.type !== 'barChart') throw new Error('Unsupported visual component');
  const g = chartGeometry(def, width, height, frame, fps, reduced),
    shapes: VectorShape[] = [];
  shapes.push(...label(def.title, 8, 0, width - 16, 30, 18));
  shapes.push(...label(def.unit, 0, 32, 52, 40, 12));
  shapes.push(
    line(g.left, g.top, g.left, g.bottom),
    line(g.left, g.bottom, g.right, g.bottom),
  );
  shapes.push(
    ...textBlock(
      def.yMax.toFixed(def.decimals),
      0,
      g.top - 10,
      48,
      20,
      12,
      c.outline,
      'right',
    ),
    ...textBlock(
      (0).toFixed(def.decimals),
      0,
      g.bottom - 10,
      48,
      20,
      12,
      c.outline,
      'right',
    ),
  );
  for (const bar of g.bars) {
    if (bar.height > 0)
      shapes.push(
        rect(
          bar.x,
          bar.y,
          bar.width,
          bar.height,
          bar.highlight ? c.accent : c.primary,
          'none',
        ),
      );
    shapes.push(
      ...label(
        bar.value.toFixed(def.decimals),
        bar.cx - g.slot / 2 + 4,
        bar.y - 24,
        g.slot - 8,
        22,
      ),
    );
    shapes.push(
      ...label(
        bar.label,
        bar.cx - g.slot / 2 + 4,
        g.bottom + 8,
        g.slot - 8,
        40,
      ),
    );
    const annotation = def.annotations.find((a) => a.barId === bar.id);
    if (annotation) {
      shapes.push(
        ...label(
          annotation.text,
          bar.cx - g.slot / 2 + 4,
          38,
          g.slot - 8,
          42,
          12,
        ),
      );
      shapes.push(line(bar.cx, 82, bar.cx, bar.y - 26, c.secondary));
    }
  }
  const source =
    def.dataSource.kind === 'synthetic'
      ? `SYNTHETIC TEST DATA: ${def.dataSource.citation}`
      : `Source: ${def.dataSource.citation}`;
  shapes.push(...label(source, 8, height - 44, width - 16, 40, 12));
  return shapes;
}
