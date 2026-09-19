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

As architecture is established, document only durable decisions that future maintainers need to understand.

Keep the following invariants visible:

- AI plans; deterministic code renders.
- Scene semantics sit above Remotion.
- Semantic data is preferred over arbitrary pixel-level decisions.
- Reproducibility is a first-class requirement.
- Controlled escape hatches are allowed for genuinely unique scenes.
- Reusable engine features should be justified by repeated needs.

Do not turn this file into a duplicate of `ENGINEERING_HANDOFF.md`.
