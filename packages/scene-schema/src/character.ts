import {
  characterIds,
  poseNames,
  expressionNames,
} from '@animation-engine/characters';
import type {
  CharacterId,
  Pose,
  Expression,
} from '@animation-engine/characters';
import { fail, object, number, text } from './validation.ts';
import { timeToFrames } from './timing.ts';

export type Attachment = Readonly<{
  target: string;
  anchor: string;
  offset: Readonly<{ x: number; y: number }>;
}>;
export function parseAttachment(input: unknown, path: string): Attachment {
  const a = object(input, path, ['target', 'anchor', 'offset']);
  const offset = object(a.offset, `${path}.offset`, ['x', 'y']);
  return {
    target: text(a.target, `${path}.target`),
    anchor: text(a.anchor, `${path}.anchor`),
    offset: {
      x: number(offset.x, `${path}.offset.x`, false, -Number.MAX_VALUE),
      y: number(offset.y, `${path}.offset.y`, false, -Number.MAX_VALUE),
    },
  };
}
export type CharacterDefinition = Readonly<{
  characterId: CharacterId;
  characterVersion: '1';
  pose: Pose;
  expression: Expression;
  walkStepDuration: number;
  actions: readonly (
    | Readonly<{ type: 'pose'; at: number; value: Pose }>
    | Readonly<{ type: 'expressionSwap'; at: number; value: Expression }>
  )[];
}>;
export function parseCharacter(
  value: Record<string, unknown>,
  path: string,
  fps: number,
  length: number,
): CharacterDefinition {
  const member = <T extends string>(
    v: unknown,
    choices: readonly T[],
    field: string,
  ): T => {
    if (!choices.includes(v as T))
      return fail(`${path}.${field}`, `expected ${choices.join(', ')}`);
    return v as T;
  };
  const characterId = member(value.characterId, characterIds, 'characterId');
  if (value.characterVersion !== '1')
    fail(`${path}.characterVersion`, 'only character version 1 is supported');
  const pose = member(value.pose, poseNames, 'pose'),
    expression = member(value.expression, expressionNames, 'expression');
  const walkStepDuration = number(
    value.walkStepDuration,
    `${path}.walkStepDuration`,
    false,
    0,
  );
  if (timeToFrames(walkStepDuration, fps, `${path}.walkStepDuration`) < 1)
    fail(path, 'walk step must contain a frame');
  if (!Array.isArray(value.actions))
    return fail(`${path}.actions`, 'expected array');
  let previous = -1;
  const seen = new Set<string>();
  const actions = value.actions.map((input, index) => {
    const p = `${path}.actions[${index}]`,
      a = object(input, p, ['type', 'at', 'value']);
    const at = number(a.at, `${p}.at`, false, 0),
      frame = timeToFrames(at, fps, `${p}.at`);
    if (frame < previous || frame >= length)
      fail(p, 'action must be ordered and inside node visibility');
    previous = frame;
    const key = `${frame}:${a.type}`;
    if (seen.has(key)) fail(p, 'duplicate action kind at frame');
    seen.add(key);
    if (a.type === 'pose')
      return {
        type: 'pose' as const,
        at,
        value: member(a.value, poseNames, `actions[${index}].value`),
      };
    if (a.type === 'expressionSwap')
      return {
        type: 'expressionSwap' as const,
        at,
        value: member(a.value, expressionNames, `actions[${index}].value`),
      };
    return fail(`${p}.type`, 'expected pose or expressionSwap');
  });
  return {
    characterId,
    characterVersion: '1',
    pose,
    expression,
    walkStepDuration,
    actions,
  };
}
