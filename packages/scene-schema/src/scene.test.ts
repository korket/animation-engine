import { describe, expect, it } from 'vitest';
import fixture from '../../../tests/fixtures/scene-v1.json';
import smoke from '../../../tests/fixtures/smoke.json';
import { parseScene, parseSmokeScene, timeToFrames } from './index';

const circle = {
  id: 'dot',
  type: 'circle',
  position: 'center',
  start: 0,
  duration: 1,
  radius: 20,
  fill: '#abcdef',
};
const group = {
  id: 'group',
  type: 'group',
  position: 'center',
  start: 0,
  duration: 1,
  width: 200,
  height: 100,
  children: [circle],
};

describe('version 1 scene contract', () => {
  it('parses nested geometry without sharing mutable input objects', () => {
    const result = parseScene(fixture);
    expect(result).toEqual(fixture);
    expect(result.nodes).not.toBe(fixture.nodes);
    expect(result.nodes[0]).not.toBe(fixture.nodes[0]);
  });

  it('keeps smoke parsing as a separate supported contract', () => {
    expect(parseSmokeScene(smoke)).toEqual(smoke);
    expect(() => parseScene(smoke)).toThrow('unsupported field');
    expect(() => parseSmokeScene(fixture)).toThrow('unsupported field');
  });

  it.each([
    ['schemaVersion', 2],
    ['id', ''],
    ['purpose', ' '],
    ['emotion', 1],
    ['importance', 'critical'],
    ['width', 0],
    ['height', 1.5],
    ['fps', 0],
    ['fps', 29.97],
    ['duration', 0],
    ['duration', 0.05],
    ['duration', 1e-12],
    ['duration', Infinity],
    ['background', 'url(remote.svg)'],
    ['nodes', null],
    ['animations', {}],
  ])('rejects invalid scene.%s', (key, value) => {
    expect(() => parseScene({ ...fixture, [key]: value })).toThrow(
      `scene.${key}`,
    );
  });

  it.each([
    ['type', 'image'],
    ['position', 'left-of'],
    ['radius', 0],
    ['radius', NaN],
    ['fill', '#fff'],
    ['fill', 'red'],
    ['start', -1],
    ['start', 0.05],
    ['duration', 0],
    ['duration', 4],
    ['children', []],
  ])('rejects invalid nodes[0].%s', (key, value) => {
    expect(() =>
      parseScene({ ...fixture, nodes: [{ ...circle, [key]: value }] }),
    ).toThrow(`scene.nodes[0].${key}`);
  });

  it('rejects duplicate IDs across sibling and nested nodes', () => {
    expect(() => parseScene({ ...fixture, nodes: [circle, group] })).toThrow(
      'duplicate node ID "dot"',
    );
    expect(() =>
      parseScene({ ...fixture, nodes: [{ ...group, id: 'dot' }] }),
    ).toThrow('duplicate node ID "dot"');
  });

  it('requires child timing to fit its parent rather than just the scene', () => {
    expect(() =>
      parseScene({
        ...fixture,
        nodes: [{ ...group, children: [{ ...circle, start: 0.5 }] }],
      }),
    ).toThrow('scene.nodes[0].children[0].duration');
  });

  it('accepts a child ending exactly at the parent endpoint', () => {
    const input = {
      ...fixture,
      nodes: [
        {
          ...group,
          start: 1.5,
          children: [{ ...circle, start: 0.5, duration: 0.5 }],
        },
      ],
    };
    expect(parseScene(input)).toEqual(input);
  });

  it('rejects unsupported geometry fields and non-finite coordinates', () => {
    expect(() =>
      parseScene({ ...fixture, nodes: [{ ...group, fill: '#ffffff' }] }),
    ).toThrow('scene.nodes[0].fill');
    expect(() =>
      parseScene({
        ...fixture,
        nodes: [{ ...circle, position: { x: Infinity, y: 0 } }],
      }),
    ).toThrow('scene.nodes[0].position.x');
    expect(() =>
      parseScene({ ...fixture, nodes: [{ ...group, children: null }] }),
    ).toThrow('scene.nodes[0].children');
  });

  it('supports explicit off-canvas positions and odd SVG dimensions', () => {
    const input = {
      ...fixture,
      width: 641,
      nodes: [{ ...circle, position: { x: -20, y: 300 } }],
    };
    expect(parseScene(input)).toEqual(input);
  });

  it('allows an intentional background-only scene', () => {
    expect(parseScene({ ...fixture, nodes: [] }).nodes).toEqual([]);
  });
});

describe('seconds to integer frames', () => {
  it.each([
    [0, 0],
    [0.1, 3],
    [0.1 + 0.2, 9],
    [5.4, 162],
    [1 / 30, 1],
  ])('converts %s seconds to %s frames', (seconds, frames) => {
    expect(timeToFrames(seconds, 30)).toBe(frames);
  });
  it.each([-1, NaN, Infinity, Number.MAX_VALUE, 0.05])(
    'rejects invalid time %s',
    (value) => {
      expect(() => timeToFrames(value, 30)).toThrow('time:');
    },
  );
  it.each([0, -1, 29.97, NaN])('rejects invalid fps %s', (fps) => {
    expect(() => timeToFrames(1, fps)).toThrow('fps:');
  });
});
