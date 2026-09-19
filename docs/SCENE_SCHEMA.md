# Scene Schema

## Bootstrap smoke format

`smoke-v0` is an internal integration fixture, not the production scene schema.
The production schema will be designed in its milestone; no migration from this
test-only format is promised. Breaking smoke changes must update its fixture,
tests, and documentation together.

`parseSmokeScene(unknown)` validates an already decoded JSON value and returns a
fresh typed object. Unknown fields and unsupported values fail with field paths.
The renderer's file loader separately reports malformed JSON and filesystem errors.

Every field is required:

- `format`: `smoke-v0`; `id` and `purpose`: nonempty strings.
- `width`, `height`: positive even integers (the proof uses H.264/yuv420p).
- `fps`: positive integer; `durationInFrames`: positive integer.
- `background`: `background` color role.
- `shape`: `type: circle`, `placement: center`, positive finite `radius`, and
  `fill: accent`. The diameter must fit within both dimensions.
- `fade`: integer `startFrame` and `endFrame` with
  `0 <= startFrame < endFrame < durationInFrames`.

`evaluateSmokeScene(scene, frame)` accepts a validated scene and an integer frame
in `[0, durationInFrames)`. Invalid evaluation frames throw. It resolves center
coordinates from dimensions and opacity from the fade endpoints: zero through
the start, linear interpolation between endpoints, and one at/after the end.
There is no implicit timing conversion, random state, or wall-clock dependence.

The checked-in fixture is 640 × 360 at 30 fps for 60 frames. Its radius is 60;
opacity is 0 at frame 0, 0.5 at frame 15, and 1 at frames 30 and 59.
No raw positioning escape hatch is implemented for this semantic-only fixture.

## Future production schema

When populated, document:

- schema invariants;
- stable field meanings;
- timing semantics;
- coordinate and semantic-positioning rules;
- attachment and anchor semantics;
- compatibility expectations;
- versioning rules;
- examples of valid and invalid scene definitions.

Do not document implementation details that are not part of the scene contract.
