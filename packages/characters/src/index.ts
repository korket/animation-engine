import type { SvgArtwork } from '@animation-engine/assets';

export const poseNames = [
  'standing',
  'walking',
  'sitting',
  'thinking',
  'pointing',
  'holding-phone',
  'opening-door',
  'reaching',
  'confused-body',
  'carrying-object',
] as const;
export const expressionNames = [
  'neutral',
  'happy',
  'confused',
  'surprised',
  'frustrated',
  'thinking',
  'worried',
  'focused',
] as const;
export const characterIds = ['protagonist', 'secondary-human'] as const;
export const characterAnchorNames = [
  'leftHand',
  'rightHand',
  'head',
  'contextAnchor',
  'feet',
] as const;
export type Pose = (typeof poseNames)[number];
export type Expression = (typeof expressionNames)[number];
export type CharacterId = (typeof characterIds)[number];
export type Point = Readonly<{ x: number; y: number }>;
export type CharacterAction =
  | Readonly<{ type: 'pose'; atFrame: number; value: Pose }>
  | Readonly<{ type: 'expressionSwap'; atFrame: number; value: Expression }>;
export type CharacterState = Readonly<{
  characterId: CharacterId;
  characterVersion: '1';
  pose: Pose;
  expression: Expression;
  walkStepFrames: number;
  actions: readonly CharacterAction[];
}>;

export const characterProvenance = {
  version: '1',
  styleVersion: '1',
  creator: 'animation-engine project',
  source:
    'Original geometric human artwork authored for Milestone 4; no external artwork',
  status: 'review-candidate',
} as const;

type Shape = SvgArtwork['shapes'][number];
type Paint = Shape['fill'];
const outline: Paint = 'role:outline';
const line = (a: Point, b: Point): Shape => ({
  type: 'line',
  x1: a.x,
  y1: a.y,
  x2: b.x,
  y2: b.y,
  fill: 'none',
  stroke: outline,
  outline: true,
});
const circle = (
  cx: number,
  cy: number,
  radius: number,
  fill: Paint,
  bordered = false,
): Shape => ({
  type: 'circle',
  cx,
  cy,
  radius,
  fill,
  stroke: bordered ? outline : 'none',
  outline: bordered,
});
const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill: Paint,
): Shape => ({
  type: 'rect',
  x,
  y,
  width,
  height,
  fill,
  stroke: outline,
  outline: true,
  rounded: true,
});
const p = (x: number, y: number): Point => ({ x, y });

// Deliberately discrete authored silhouettes: no procedural bones or IK solver.
type Limbs = Readonly<{
  leftHand: Point;
  rightHand: Point;
  leftKnee: Point;
  rightKnee: Point;
  leftFoot: Point;
  rightFoot: Point;
}>;
const standing: Limbs = {
  leftHand: p(25, 124),
  rightHand: p(75, 124),
  leftKnee: p(41, 157),
  rightKnee: p(59, 157),
  leftFoot: p(37, 188),
  rightFoot: p(63, 188),
};
const poses: Record<Exclude<Pose, 'walking'>, Limbs> = {
  standing,
  sitting: {
    ...standing,
    leftHand: p(30, 128),
    rightHand: p(76, 126),
    leftKnee: p(22, 146),
    rightKnee: p(78, 146),
    leftFoot: p(22, 176),
    rightFoot: p(78, 176),
  },
  thinking: { ...standing, leftHand: p(40, 112), rightHand: p(66, 55) },
  pointing: { ...standing, rightHand: p(92, 78) },
  'holding-phone': { ...standing, rightHand: p(82, 78) },
  'opening-door': { ...standing, rightHand: p(92, 103) },
  reaching: { ...standing, leftHand: p(20, 64), rightHand: p(87, 48) },
  'confused-body': { ...standing, leftHand: p(9, 84), rightHand: p(91, 84) },
  'carrying-object': {
    ...standing,
    leftHand: p(31, 115),
    rightHand: p(69, 115),
  },
};
const walk: readonly Limbs[] = [
  {
    ...standing,
    leftHand: p(17, 116),
    rightHand: p(83, 116),
    leftKnee: p(27, 156),
    rightKnee: p(66, 157),
    leftFoot: p(16, 184),
    rightFoot: p(79, 188),
  },
  {
    ...standing,
    leftHand: p(29, 125),
    rightHand: p(71, 123),
    leftKnee: p(40, 157),
    rightKnee: p(66, 151),
    leftFoot: p(42, 188),
    rightFoot: p(58, 176),
  },
  {
    ...standing,
    leftHand: p(34, 116),
    rightHand: p(66, 116),
    leftKnee: p(34, 157),
    rightKnee: p(73, 156),
    leftFoot: p(21, 188),
    rightFoot: p(84, 184),
  },
  {
    ...standing,
    leftHand: p(29, 123),
    rightHand: p(71, 125),
    leftKnee: p(34, 151),
    rightKnee: p(60, 157),
    leftFoot: p(42, 176),
    rightFoot: p(58, 188),
  },
];

/** Separate facial layers can be inspected and tested without changing the body. */
export function face(expression: Expression): Readonly<{
  eyes: readonly Shape[];
  brows: readonly Shape[];
  mouth: readonly Shape[];
}> {
  if (!expressionNames.includes(expression))
    throw new Error('Unknown expression');
  const open = expression === 'surprised';
  const eyes =
    expression === 'happy'
      ? [line(p(39, 43), p(44, 41)), line(p(56, 41), p(61, 43))]
      : [
          circle(42, 44, open ? 3.5 : 2.2, outline),
          circle(58, 44, open ? 3.5 : 2.2, outline),
        ];
  const browY: Record<Expression, readonly [number, number, number, number]> = {
    neutral: [36, 36, 36, 36],
    happy: [34, 33, 33, 34],
    confused: [32, 37, 34, 31],
    surprised: [30, 29, 29, 30],
    frustrated: [33, 38, 38, 33],
    thinking: [35, 35, 31, 34],
    worried: [37, 32, 32, 37],
    focused: [35, 37, 37, 35],
  };
  const b = browY[expression];
  const brows = [
    line(p(37, b[0]), p(46, b[1])),
    line(p(54, b[2]), p(63, b[3])),
  ];
  let mouth: Shape[];
  if (open) mouth = [circle(50, 57, 5, outline)];
  else if (expression === 'happy')
    mouth = [line(p(42, 54), p(50, 59)), line(p(50, 59), p(58, 54))];
  else if (expression === 'worried' || expression === 'frustrated')
    mouth = [line(p(43, 59), p(50, 55)), line(p(50, 55), p(57, 59))];
  else if (expression === 'confused') mouth = [line(p(44, 57), p(54, 54))];
  else if (expression === 'thinking') mouth = [line(p(50, 56), p(58, 56))];
  else mouth = [line(p(44, 56), p(56, 56))];
  return { eyes, brows, mouth };
}

export function validateCharacter(state: CharacterState): void {
  if (
    !characterIds.includes(state.characterId) ||
    state.characterVersion !== '1'
  )
    throw new Error('Unknown character ID/version');
  if (
    !poseNames.includes(state.pose) ||
    !expressionNames.includes(state.expression)
  )
    throw new Error('Unsupported character pose/expression');
  if (!Number.isSafeInteger(state.walkStepFrames) || state.walkStepFrames < 1)
    throw new Error('walkStepFrames must be a positive integer');
  let previous = -1;
  const keys = new Set<string>();
  for (const action of state.actions) {
    if (
      !Number.isSafeInteger(action.atFrame) ||
      action.atFrame < previous ||
      action.atFrame < 0
    )
      throw new Error('Character actions must be ordered nonnegative frames');
    previous = action.atFrame;
    const key = `${action.atFrame}:${action.type}`;
    if (keys.has(key)) throw new Error('Duplicate character action at frame');
    keys.add(key);
    if (
      action.type === 'pose'
        ? !poseNames.includes(action.value)
        : action.type !== 'expressionSwap' ||
          !expressionNames.includes(action.value)
    )
      throw new Error('Unsupported character action');
  }
}

/** Local frame is relative to node visibility start. Changes hold until replaced. */
export function evaluateCharacter(
  state: CharacterState,
  localFrame: number,
  reduced = false,
) {
  validateCharacter(state);
  if (!Number.isSafeInteger(localFrame) || localFrame < 0)
    throw new Error('Invalid character frame');
  let pose = state.pose,
    expression = state.expression,
    poseStart = 0;
  for (const action of state.actions) {
    if (action.atFrame > localFrame) break;
    if (action.type === 'pose') {
      pose = action.value;
      poseStart = action.atFrame;
    } else expression = action.value;
  }
  const walkFrame =
    pose === 'walking' && !reduced
      ? Math.floor((localFrame - poseStart) / state.walkStepFrames) % 4
      : 0;
  const limbs =
    pose === 'walking' ? (reduced ? standing : walk[walkFrame]!) : poses[pose];
  const shirt: Paint =
    state.characterId === 'protagonist' ? 'role:primary' : 'role:secondary';
  const body: Shape[] = [
    line(p(42, 128), limbs.leftKnee),
    line(limbs.leftKnee, limbs.leftFoot),
    line(p(58, 128), limbs.rightKnee),
    line(limbs.rightKnee, limbs.rightFoot),
    line(
      p(limbs.leftFoot.x - 5, limbs.leftFoot.y),
      p(limbs.leftFoot.x + 5, limbs.leftFoot.y),
    ),
    line(
      p(limbs.rightFoot.x - 5, limbs.rightFoot.y),
      p(limbs.rightFoot.x + 5, limbs.rightFoot.y),
    ),
    line(p(33, 84), limbs.leftHand),
    line(p(67, 84), limbs.rightHand),
    rect(33, 72, 34, 59, shirt),
    rect(44, 62, 12, 12, 'role:surface'),
    circle(50, 42, 25, 'role:surface', true),
    // Hair cap differs by identity while preserving shared face/anchor coordinates.
    rect(
      state.characterId === 'protagonist' ? 28 : 31,
      15,
      state.characterId === 'protagonist' ? 44 : 38,
      13,
      'role:outline',
    ),
    circle(limbs.leftHand.x, limbs.leftHand.y, 4, 'role:surface', true),
    circle(limbs.rightHand.x, limbs.rightHand.y, 4, 'role:surface', true),
  ];
  const facial = face(expression);
  const artwork: SvgArtwork = {
    width: 100,
    height: 200,
    shapes: [...body, ...facial.eyes, ...facial.brows, ...facial.mouth],
  };
  return {
    pose,
    expression,
    walkFrame,
    body,
    face: facial,
    artwork,
    anchors: {
      leftHand: limbs.leftHand,
      rightHand: limbs.rightHand,
      head: p(50, 42),
      contextAnchor: p(80, 20),
      feet: p(
        (limbs.leftFoot.x + limbs.rightFoot.x) / 2,
        Math.max(limbs.leftFoot.y, limbs.rightFoot.y),
      ),
    },
  };
}
