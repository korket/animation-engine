import { DOMParser } from '@xmldom/xmldom';
import type { Element, Node } from '@xmldom/xmldom';
import { fail } from './validation.ts';
import { colorRoles, resolvePaint } from './theme.ts';
import type { Theme, HexColor } from './theme.ts';

type Paint = 'none' | `role:${(typeof colorRoles)[number]}`;
type Style = { fill: Paint; stroke: Paint; outline: boolean };
export type SvgShape = Style &
  (
    | {
        type: 'rect';
        x: number;
        y: number;
        width: number;
        height: number;
        rounded: boolean;
      }
    | { type: 'circle'; cx: number; cy: number; radius: number }
    | { type: 'line'; x1: number; y1: number; x2: number; y2: number }
  );
export type SvgArtwork = {
  width: number;
  height: number;
  shapes: readonly SvgShape[];
};
export type StyledShape = Omit<Style, 'fill' | 'stroke' | 'outline'> & {
  fill: HexColor | 'none';
  stroke: HexColor | 'none';
  strokeWidth: number;
} & (
    | {
        type: 'rect';
        x: number;
        y: number;
        width: number;
        height: number;
        rx: number;
      }
    | { type: 'circle'; cx: number; cy: number; radius: number }
    | { type: 'line'; x1: number; y1: number; x2: number; y2: number }
  );

function numeric(
  value: string | null,
  field: string,
  positive = false,
): number {
  if (
    value === null ||
    !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)
  )
    fail(field, 'expected numeric SVG attribute');
  const result = Number(value);
  if (!Number.isFinite(result) || (positive && result <= 0))
    fail(field, 'invalid SVG geometry');
  return result;
}
function attributes(node: Element, allowed: string[]) {
  for (let i = 0; i < node.attributes.length; i++) {
    const name = node.attributes.item(i)?.name;
    if (!name || !allowed.includes(name))
      fail(`SVG ${node.tagName}.${name}`, 'unsupported attribute');
  }
}
function paint(node: Element, name: string): Paint {
  const value = node.getAttribute(name);
  if (value !== 'none' && !colorRoles.some((role) => value === `role:${role}`))
    fail(`SVG ${name}`, 'expected none or a supported role: color');
  return value as Paint;
}
function children(node: Node): Element[] {
  const result: Element[] = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes.item(i);
    if (!child) continue;
    if (child.nodeType === 1) result.push(child as Element);
    else if (
      child.nodeType === 8 ||
      (child.nodeType === 3 && !child.nodeValue?.trim())
    )
      continue;
    else fail('SVG', 'only elements, comments, and whitespace are supported');
  }
  return result;
}

/** Restricted, semantic SVG dialect. Unsupported content fails; no markup injection. */
export function parseSvg(source: string): SvgArtwork {
  const document = new DOMParser({
    onError: (_level, message) => {
      fail('SVG XML', message);
    },
  }).parseFromString(source, 'image/svg+xml');
  const roots = children(document);
  const root = roots[0];
  if (roots.length !== 1 || !root || root.tagName !== 'svg')
    fail('SVG', 'expected one svg root');
  attributes(root, ['xmlns', 'viewBox']);
  if (root.getAttribute('xmlns') !== 'http://www.w3.org/2000/svg')
    fail('SVG xmlns', 'expected SVG namespace');
  const viewBox = root.getAttribute('viewBox')?.trim().split(/\s+/);
  if (
    !viewBox ||
    viewBox.length !== 4 ||
    viewBox[0] !== '0' ||
    viewBox[1] !== '0'
  )
    fail('SVG viewBox', 'expected 0 0 width height');
  const width = numeric(viewBox[2] ?? null, 'SVG width', true);
  const height = numeric(viewBox[3] ?? null, 'SVG height', true);
  const shapes: SvgShape[] = [];
  function visit(node: Element) {
    if (node.tagName === 'g') {
      attributes(node, []);
      children(node).forEach(visit);
      return;
    }
    if (children(node).length) fail('SVG shape', 'shapes cannot have children');
    const common = ['fill', 'stroke', 'stroke-width'];
    const fill = paint(node, 'fill');
    const stroke = paint(node, 'stroke');
    const outline = stroke !== 'none';
    if (
      outline
        ? node.getAttribute('stroke-width') !== 'token:outline'
        : node.hasAttribute('stroke-width')
    )
      fail(
        'SVG stroke-width',
        'use token:outline exactly when stroke is present',
      );
    const style = { fill, stroke, outline };
    const n = (key: string, positive = false) =>
      numeric(node.getAttribute(key), `SVG ${node.tagName}.${key}`, positive);
    switch (node.tagName) {
      case 'rect': {
        attributes(node, [...common, 'x', 'y', 'width', 'height', 'rx']);
        if (
          node.hasAttribute('rx') &&
          node.getAttribute('rx') !== 'token:corner'
        )
          fail('SVG rx', 'expected token:corner');
        shapes.push({
          ...style,
          type: 'rect',
          x: n('x'),
          y: n('y'),
          width: n('width', true),
          height: n('height', true),
          rounded: node.hasAttribute('rx'),
        });
        break;
      }
      case 'circle':
        attributes(node, [...common, 'cx', 'cy', 'r']);
        shapes.push({
          ...style,
          type: 'circle',
          cx: n('cx'),
          cy: n('cy'),
          radius: n('r', true),
        });
        break;
      case 'line':
        attributes(node, [...common, 'x1', 'y1', 'x2', 'y2']);
        if (fill !== 'none' || !outline)
          fail('SVG line', 'requires fill none and an outline');
        shapes.push({
          ...style,
          type: 'line',
          x1: n('x1'),
          y1: n('y1'),
          x2: n('x2'),
          y2: n('y2'),
        });
        break;
      default:
        fail('SVG element', `unsupported ${node.tagName}`);
    }
  }
  children(root).forEach(visit);
  if (!shapes.length) fail('SVG', 'artwork must contain geometry');
  return { width, height, shapes };
}

export function styleArtwork(
  artwork: SvgArtwork,
  theme: Theme,
): readonly StyledShape[] {
  return artwork.shapes.map((shape) => {
    const style = {
      fill: resolvePaint(shape.fill, theme),
      stroke: resolvePaint(shape.stroke, theme),
      strokeWidth: shape.outline ? theme.outlineWidth : 0,
    };
    switch (shape.type) {
      case 'rect':
        return {
          type: shape.type,
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          rx: shape.rounded ? theme.cornerRadius : 0,
          ...style,
        };
      case 'circle':
        return {
          type: shape.type,
          cx: shape.cx,
          cy: shape.cy,
          radius: shape.radius,
          ...style,
        };
      case 'line':
        return {
          type: shape.type,
          x1: shape.x1,
          y1: shape.y1,
          x2: shape.x2,
          y2: shape.y2,
          ...style,
        };
    }
  });
}
