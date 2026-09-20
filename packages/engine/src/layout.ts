import type { Layout, SceneNode } from '@animation-engine/scene-schema';
import type { Point } from '@animation-engine/animation';

const slots: Record<
  Layout,
  Readonly<Record<string, readonly [number, number]>>
> = {
  'center-character': { character: [0.5, 0.5] },
  'character-left-object-right': { character: [0.3, 0.5], object: [0.7, 0.5] },
  'character-right-object-left': { character: [0.7, 0.5], object: [0.3, 0.5] },
  'two-column': { left: [0.25, 0.5], right: [0.75, 0.5] },
  'three-item-row': {
    left: [1 / 6, 0.5],
    center: [0.5, 0.5],
    right: [5 / 6, 0.5],
  },
  'diagram-center': { diagram: [0.5, 0.5] },
  'full-screen-object': { object: [0.5, 0.5] },
  'chart-focus': { chart: [0.5, 0.5] },
  'environment-wide': { environment: [0.5, 0.5] },
};
export function nodeSize(node: SceneNode) {
  return node.type === 'circle'
    ? { width: node.radius * 2, height: node.radius * 2 }
    : { width: node.width, height: node.height };
}

/** References resolve among siblings, irrespective of paint order, in base layout. */
export function resolvePositions(
  nodes: readonly SceneNode[],
  width: number,
  height: number,
  layout?: Layout,
): ReadonlyMap<string, Point> {
  const byId = new Map(nodes.map((node) => [node.id, node])),
    resolved = new Map<string, Point>(),
    visiting = new Set<string>();
  function resolve(id: string): Point {
    const cached = resolved.get(id);
    if (cached) return cached;
    if (visiting.has(id))
      throw new Error(`position ${id}: cyclic relative placement`);
    const node = byId.get(id);
    if (!node)
      throw new Error(`position ${id}: relative target must be a sibling`);
    visiting.add(id);
    const position = node.position;
    let result: Point;
    if (typeof position === 'string') {
      const x =
        position === 'left-center'
          ? 0.25
          : position === 'right-center'
            ? 0.75
            : 0.5;
      const y =
        position === 'top-center'
          ? 0.25
          : position === 'bottom-center'
            ? 0.75
            : 0.5;
      result = { x: width * x, y: height * y };
    } else if ('slot' in position) {
      const slot =
        layout && Object.hasOwn(slots[layout], position.slot)
          ? slots[layout][position.slot]
          : undefined;
      if (!slot)
        throw new Error(
          `position ${id}: slot ${position.slot} is not defined by ${layout ?? 'a layout'}`,
        );
      result = { x: width * slot[0], y: height * slot[1] };
    } else if ('relativeTo' in position) {
      const other = resolve(position.relativeTo),
        target = byId.get(position.relativeTo)!;
      const a = nodeSize(node),
        b = nodeSize(target);
      const dx = (a.width + b.width) / 2 + position.gap,
        dy = (a.height + b.height) / 2 + position.gap;
      result = {
        x:
          other.x +
          (position.placement === 'left-of'
            ? -dx
            : position.placement === 'right-of'
              ? dx
              : 0),
        y:
          other.y +
          (position.placement === 'above'
            ? -dy
            : position.placement === 'below'
              ? dy
              : 0),
      };
    } else result = { x: position.x, y: position.y };
    if (!Number.isFinite(result.x) || !Number.isFinite(result.y))
      throw new Error(`position ${id}: numeric overflow`);
    visiting.delete(id);
    resolved.set(id, result);
    return result;
  }
  nodes.forEach((node) => resolve(node.id));
  return resolved;
}
