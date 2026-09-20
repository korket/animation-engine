# Architecture

## Milestone 0 bootstrap

Four private pnpm workspaces are active: dashboard, renderer, scene-schema, and
engine. Other package directories contain instructions only.

Dependency direction:

```text
scene-schema ← engine ← renderer
       ↑__________________|
dashboard (independent bootstrap page)
```

The schema validates a deliberately limited `smoke-v0` JSON fixture. The engine
resolves its semantic center placement and linear opacity at an integer frame.
The renderer maps those resolved values to SVG. Remotion supplies the frame and
encodes the composition; it does not define animation behavior.

The render command loads JSON from disk, validates it before bundling, passes the
same input props to composition selection and rendering, and writes local
artifacts. Browser provisioning uses Remotion's managed Chrome Headless Shell.
All render dependencies and settings are pinned or explicit. Render output is
compared visually, not by expecting identical encoded MP4 bytes across systems.

Internal packages expose TypeScript source consumed by Vite, Remotion, Vitest,
and tsx. TypeScript checks without emitting. There is no package publishing build.

The handoff §63 puts the production runtime in Milestone 1, while §66 requests an
initial scene-to-video proof. Milestone 0 implements only that proof, including
one user-requested animated shape. These smoke interfaces are justified by this
integration test and are not a production scene-format compatibility promise.
The smoke path has no scene graph, reusable animation registry, persistence, or orchestrator.

## Milestone 1 core scene runtime

`scene-schema` now also validates a versioned tree of groups, circles, and rectangles.
`engine.compileScene()` validates the input and compiles that tree into a depth-first
display list of canvas-space geometry and integer frame intervals.
`engine.evaluateScene()` selects the visible elements for an arbitrary frame without
accumulating playback state. Parent bounds translate child coordinates, and parent
start times offset child intervals. Neither operation depends on React or Remotion.

The Node-only filesystem loader is exported separately as `@animation-engine/engine/node`.
The normal engine export remains browser-safe; it never imports filesystem code.
Malformed JSON, unsupported versions, invalid timing, and numeric overflow fail
visibly before a render begins. There is no repair/fallback pipeline yet.

The contract is intentionally limited to basic geometry. Its explicit version,
parent-relative coordinates and frame-grid timing are justified by Milestone 1's
scene graph requirement; see SCENE_SCHEMA.md for compatibility and boundaries.
The existing smoke format and evaluator remain supported regression fixtures.

The renderer's `Scene` composition compiles the validated input once per prop
change, asks the engine to evaluate Remotion's current integer frame, and maps
resolved leaves directly to SVG. It owns no placement or timing semantics.
The local `render:scene` command uses the Node loader and checks H.264's even-size
constraint before bundling. Composition selection and rendering receive identical
props. The two compositions share browser provisioning and explicit software
H.264 settings, with browser cleanup in `finally`.

As architecture is established, document only durable decisions that future maintainers need to understand.

## Milestone 2 style and assets

`assets` is now a fifth active workspace. It owns versioned themes, semantic
metadata/search, strict SVG parsing, and styled artwork. `engine` depends on it
to resolve asset IDs and paint into deterministic frame data. `scene-schema`
continues to depend on neither assets nor rendering. Dependency direction is
`scene-schema + assets → engine → renderer`.

Filesystem/checksum work lives in `assets/node`. The renderer loads that library
before bundling themed scenes and passes it with the scene through metadata
selection and frame rendering. Studio's `Assets` composition bundles the same
SVG files with a shared webpack source rule. Typed SVG primitives are rendered
as React elements; arbitrary markup is never inserted.

Compiling records the exact theme and each node's asset ID, revision, and source
hash. Successful local renders write `scene-resources.json` beside the video for
scene-level usage/debugging. This is not an episode database or an approval lock.
Episode-level usage indexing remains with the later persistence milestone.

## Milestone 3 layout and motion

The sixth active workspace, `animation`, owns pure effect/camera sampling, named
easing, and stagger expansion. It depends on no other workspace. Scene-schema uses
its parameter validators; engine owns layout resolution, clip/reference validation,
group transform composition, and camera evaluation. Renderer only applies resolved
matrices/opacity and draws resolved highlight outlines.

Static compiled scenes retain their prior structure. Motion-bearing scenes retain
resolved node bounds/parent IDs and compiled frame intervals. Each frame is evaluated
from that immutable data without playback state. Group transforms use affine matrices
around base centers; relative placement is resolved before animation. This separation
keeps random-access rendering and camera-follow behavior reproducible.

## Milestone 4 characters

The seventh active workspace, `characters`, owns versioned authored geometry,
pose/expression vocabulary, modular facial layers, walk sampling, and local anchors.
It uses asset geometry types without depending on React, Remotion, or the engine.
Schema validates authored actions; engine converts node-local seconds to frames,
resolves themes and attachment graphs, and emits the existing typed SVG shapes.
The renderer needs no character-specific business logic. Resource manifests record
character identity/version/provenance alongside pinned prop assets and theme.

## Milestone 5 cognitive visuals and charts

No workspace is added. Scene-schema owns explicit cognitive/chart input contracts;
engine resolves bounded typography, memory states, chart geometry, and animated
bar anchors. Animation supplies numeric countUp. Renderer adds only SVG text and
a local font-loading render gate, keeping state and chart calculations pure.

This additive interface is justified by structured-data-driven components in M5.
Fontsource Roboto Mono is the sole new external dependency: a pinned WOFF2 and
license replace dependence on host-installed fonts. Resource manifests record it.
Charts require authored source captions; neither validation nor rendering asserts
that a research citation is true. See [COGNITIVE_CHARTS.md](COGNITIVE_CHARTS.md).

Keep the following invariants visible:

- AI plans; deterministic code renders.
- Scene semantics sit above Remotion.
- Semantic data is preferred over arbitrary pixel-level decisions.
- Reproducibility is a first-class requirement.
- Controlled escape hatches are allowed for genuinely unique scenes.
- Reusable engine features should be justified by repeated needs.

Do not turn this file into a duplicate of `ENGINEERING_HANDOFF.md`.
