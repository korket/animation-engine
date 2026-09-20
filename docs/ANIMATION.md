# Layout and animation contracts

Milestone 3 is explanatory video motion. It uses deterministic frame evaluation,
not CSS clocks, requestAnimationFrame, physical simulation, or browser preferences.
Animations use transform and opacity; `scaleIn` starts at an explicit 0.90–0.97
scale with an opacity entrance. A reduced-motion scene setting keeps fades and
suppresses spatial/camera effects so the chosen export remains reproducible.

`packages/animation` owns pure normalized-progress samples and named easing.
Progress must be in [0,1]. `frameProgress` alone explicitly holds endpoints outside
a valid integer frame interval. `staggerFrames` expands an ordered target list to
explicit start/duration pairs; it never introduces timers.

| Easing   | Fixed definition                 |
| -------- | -------------------------------- |
| linear   | Identity                         |
| soft     | Cubic Bézier (0.32, 0.72, 0, 1)  |
| snappy   | Cubic Bézier (0.23, 1, 0.32, 1)  |
| dramatic | Cubic Bézier (0.77, 0, 0.175, 1) |
| bounce   | Penner easeOutBounce             |

The Bézier choices follow the animate skill's established curve tokens; the
bounce family follows [easings.net](https://easings.net/#easeOutBounce). Curve
inversion uses a fixed iteration count. Arbitrary user-defined curves are rejected.

Implemented object effects: fadeIn, fadeOut, slideIn, slideOut, scaleIn, pop,
bounce, rotate, shake, wiggle, pulse, followPath, and highlight. Slide/path values
are offsets from base placement; path traversal uses polyline arc length. Bounce
is one vertical hop. Shake/wiggle decay to rest; pulse/highlight return to baseline.
The three camera effects are cameraPan, cameraPush (also pull-out), and cameraFollow.
Every primitive, including stagger, has focused automated tests.

The handoff's approximately twenty-primitive target is before full production.
`countUp`, `drawPath`, and `expressionSwap` are not implemented without their
text/path/character capabilities. No character, chart, or arbitrary SVG-path
system is introduced during this milestone.

## Scene timing and composition

All effect parameters are explicit; unsupported fields fail validation. Points
are `{x,y}` pixel offsets (world centers for camera effects), and angles are degrees.

| Effect             | Required parameters beyond `type`                          |
| ------------------ | ---------------------------------------------------------- |
| fadeIn / fadeOut   | None                                                       |
| slideIn / slideOut | `offset` point                                             |
| scaleIn            | `from` in [0.90, 0.97]                                     |
| pop                | `amount` in [0, 0.3]                                       |
| bounce             | Nonnegative `distance`                                     |
| rotate             | Finite `from`, `to` angles                                 |
| shake              | Nonnegative `distance`, positive integer `cycles`          |
| wiggle             | Nonnegative `angle`, positive integer `cycles`             |
| pulse              | `amount` in [0, 1], positive integer `cycles`              |
| followPath         | `points`: at least two points, distinct consecutive points |
| highlight          | `color`: hex or theme role, positive `width`               |
| cameraPan          | `from`, `to` points, positive `zoom`                       |
| cameraPush         | `center` point, positive `fromZoom`, `toZoom`              |
| cameraFollow       | `target` ID, `from`, `offset` points, positive `zoom`      |

An animation clip has `target` (one ID) or `targets` (an ordered nonempty list),
`start`, `duration`, `easing`, and an `effect` object. Multiple targets additionally
require `stagger` in seconds. All times align to the scene frame grid. Unlike a
node's parent-relative visibility interval, clip times are relative to scene zero.
Each expanded clip must fit inside its target's resolved visibility interval.

```json
{
  "targets": ["phone", "book"],
  "stagger": 0.1,
  "start": 0,
  "duration": 0.5,
  "easing": "soft",
  "effect": { "type": "slideIn", "offset": { "x": 0, "y": 24 } }
}
```

Every clip holds its progress-0 value before its start and its progress-1 value
after its end. This makes entrances hidden/displaced before they begin, and exits
remain exited. Sequential fadeIn/fadeOut clips compose by multiplying opacity.
Translations and rotations add; scales and opacity multiply in authored order.
Authors must account for held values when composing more than one path/rotation.
No implicit restoration, interruption state, or tween inference is performed.

Transforms act around the node's base center: scale, then rotation in degrees,
then translation. Parent group matrices multiply child matrices; parent opacity
multiplies child opacity. Relative layout references describe base geometry, not
dynamic attachment. These are explicit contracts needed for Milestone 3; anchors
and character attachment remain separate work. Highlight outlines are leaf-only,
use explicit width/color, and follow the target's transform/opacity.

`camera` clips use the same start/duration/easing structure with camera effects.
They must be ordered, non-overlapping, and contained in the scene. With no active
or preceding camera clip, the camera is identity. Between/after clips it holds the
last endpoint. Pan interpolates explicit world centers at a fixed zoom. Push
interpolates positive zoom at a fixed world center; decreasing zoom is pull-out.
Follow interpolates from an explicit center toward the target's evaluated world
center plus offset, at the current frame. After its end it holds the endpoint
target position. Follow targets must exist and remain visible during the clip.
Camera transforms affect artwork, not the background canvas.

`motionMode: "reduced"` suppresses translation, rotation, scale, and camera motion.
Opacity entrances/exits and highlight remain. The default is `full`, preserving
earlier scenes. The OS preference never silently changes rendered output.

## Named layout slots

Layouts position centers inside the scene or group bounds and never resize nodes.
Use `position: {"slot": "name"}` with the nearest containing layout. Fractions
below are measured from that container's top-left; all listed slots have y=0.5.

| Layout                      | Slots and x fractions              |
| --------------------------- | ---------------------------------- |
| center-character            | character: 0.5                     |
| character-left-object-right | character: 0.3, object: 0.7        |
| character-right-object-left | character: 0.7, object: 0.3        |
| two-column                  | left: 0.25, right: 0.75            |
| three-item-row              | left: 1/6, center: 0.5, right: 5/6 |
| diagram-center              | diagram: 0.5                       |
| full-screen-object          | object: 0.5                        |
| chart-focus                 | chart: 0.5                         |
| environment-wide            | environment: 0.5                   |

These names provide placement roles, not character/chart/environment renderers.
`center`, `left-center`, `right-center`, `top-center`, and `bottom-center` work
without a named layout; side centers use quarter/three-quarter positions.
Explicit `{x,y}` positions remain available, including off-canvas coordinates.

`{relativeTo, placement, gap}` places a node left-of/right-of/above/below a sibling,
with edge-to-edge gap in pixels and the other axis centered. Forward references
are supported without changing paint order. Missing targets, non-sibling targets,
unknown slots, and reference cycles fail before rendering. Relative positions
do not follow animated targets; use a group for shared motion.

## Verification

`pnpm test:motion` renders the motion proof, a grid exercising every object
primitive and stagger, and an explicit reduced-motion variant. It checks reference
pixels for intermediate transforms, opacity, group pivots, and camera endpoints,
then verifies actual H.264 metadata. Artifacts are under `out/motion/`.
Unit tests additionally cover frame timing, arbitrary seek order, invalid graphs,
camera follow of a moving target, easing bounds, and visibility containment.
