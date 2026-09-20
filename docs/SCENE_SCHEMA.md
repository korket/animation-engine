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

## Version 1: basic scene tree

`parseScene(unknown)` validates the `schemaVersion: 1` contract. Every scene has
`id`, `purpose`, `emotion`, `importance` (`low`, `medium`, or `high`), `width`,
`height`, `fps`, `duration`, `background`, and `nodes`. These fields are required.
Dimensions and fps are positive safe integers. Duration is positive seconds.
Colors were initially six-digit hex literals; the Milestone 2 extension below adds
semantic asset/style lookup. This low-level geometry path does not yet implement
the templates, actors, layouts, or animations shown in the handoff's full example.

Nodes form an ordered tree and have globally unique, nonempty IDs. Every node
requires `type`, `position`, `start`, and `duration` in addition to `id`:

- `circle`: positive `radius`, plus `fill`.
- `rect`: positive `width` and `height`, plus `fill`.
- `group`: positive `width` and `height`, plus a `children` array.

Position is either `center` or `{ "x": number, "y": number }`, measured from the
parent's top-left. A node's position locates its center. A group's size defines
the coordinate bounds for its children; it translates them without scaling or
clipping. Circles use center coordinates; rectangle/group top-left coordinates
are their center minus half their size. Root positions use the canvas bounds.
Off-canvas coordinates are allowed as the explicit escape hatch; the final SVG
viewport clips at the canvas edge. Only translation is supported in this milestone.

The tree paints depth first in JSON order, with later leaves covering earlier
ones. There are no cross-node references, so JSON cannot encode cycles or missing
parents. Unknown fields, unsupported node kinds, and duplicate IDs fail visibly.
An empty node array intentionally renders the background only.

### Timing

Node start times are relative to the parent's start; child intervals must fit
entirely inside their parent's duration. All times are seconds on the fps grid.
`timeToFrames(seconds, fps)` rejects subframe times instead of silently rounding
them; a tolerance of `1e-7` frames absorbs floating-point representation noise
(for example `0.1 + 0.2`). Each scene/node duration must span at least one frame.
Visibility is start-inclusive, end-exclusive. There are no hidden duration defaults.

At 30 fps, a node starting at 0.5 seconds for one second is visible at frames
15–44 and absent at 45. A child starting one second inside a group that starts
at one second appears at scene frame 60. The checked-in `scene-v1.json` demonstrates
these boundaries. Non-grid timings, such as 0.05 seconds at 30 fps, are invalid.

### Compatibility and justification

The new version marker separates this extensible core from the preserved
`smoke-v0` integration fixture; existing smoke data and commands keep their behavior.
Changes to version 1's field meanings require a new schema version and a migration
decision. No migration is needed for the additive introduction of version 1.
Group bounds, center positioning, ordered painting, and frame-grid timing are
the minimum explicit contracts needed to verify a reusable scene graph. Anchors,
rotations/scales, layout templates, and easing are deferred. Asset identity is
added by the Milestone 2 extension below.

SVG accepts odd canvas dimensions. The local H.264/yuv420p export additionally
requires even width and height and rejects incompatible settings before rendering.

## Milestone 2: themed asset references

Version 1 gains additive fields; all previous literal-color scenes remain valid
and render identically. An optional `theme: { "id": "studio-proof", "version": "1" }`
pins a visual theme. With a theme, background and primitive fills may use
`role:<name>` in addition to their existing hex literals. Role lookup fails if
the selected theme does not define that role. No implicit theme is selected.

The new `asset` node requires the existing ID, position, start, and duration,
plus `assetId`, explicit `assetVersion`, `width`, and `height`. It requires a scene
theme. It cannot specify a file path, latest-version alias, literal fill override,
or arbitrary SVG markup. Engine compilation resolves the semantic asset/version
and checks its style-contract compatibility with the exact theme.

Asset width/height define a viewport centered at its resolved position. Intrinsic
SVG aspect ratio is preserved, centered with letterboxing when necessary; artwork
is clipped to that viewport. Outlines and corners scale uniformly with artwork.
Parent groups still translate only, and timing/paint order are unchanged.

This extension is justified by Milestone 2's semantic-asset acceptance criterion.
It does not alter version 1 field meanings or require migration. Older engines
correctly reject the new fields/node kind. Existing smoke data stays independent.
`tests/fixtures/assets-v1.json` demonstrates two pinned phone revisions and a book.

## Milestone 3: layout and motion

Version 1 adds optional `layout`, `animations`, `camera`, and `motionMode` fields.
Groups may also specify their own `layout`. Position accepts named center regions,
layout slots, and sibling-relative placement alongside the original center/raw
coordinates. The full contracts, slot table, effect parameters, composition order,
camera endpoint behavior, and reduced-motion policy are in [ANIMATION.md](ANIMATION.md).

The original static scenes and all earlier fixture outputs retain their meanings.
Animation data is validated before rendering and references resolve against node
IDs. Unknown effects/curves/targets, cycles, subframe timing, overlapping camera
clips, and clips outside target visibility fail. An empty animation/camera array
means no authored clips. Older engines reject these new fields rather than silently
ignoring motion. No automatic migration or default animation is introduced.

## Milestone 4: characters and attachments

The additive `character` node requires an exact character ID/version, viewport
width/height, pose, expression, walkStepDuration, and an actions array. A theme is
required. Common node fields remain unchanged. Every node can optionally specify
an attachment to a sibling's named anchor. Compiler validation rejects missing
targets/anchors, cycles, or visibility mismatches before any render starts.
Full field and evaluation semantics are in [CHARACTERS.md](CHARACTERS.md).
Earlier version-1 scenes require no migration and retain identical outputs.

## Milestone 5: cognitive components, charts, and labels

Additive `memoryOrb`, `thoughtBubble`, `contextBubble`, `label`, and `barChart`
nodes require a theme and explicit bounds. Each retains common timing, positioning,
transforms, and attachment fields. `bar.<id>` anchors follow chart reveal geometry.
The exact fields, validation limits, text rules, and memory states are defined in
[COGNITIVE_CHARTS.md](COGNITIVE_CHARTS.md). Earlier scenes need no migration.

## Future schema documentation

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
