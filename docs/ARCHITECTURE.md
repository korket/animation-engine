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
No scene graph, reusable animation registry, persistence, or orchestrator exists.

As architecture is established, document only durable decisions that future maintainers need to understand.

Keep the following invariants visible:

- AI plans; deterministic code renders.
- Scene semantics sit above Remotion.
- Semantic data is preferred over arbitrary pixel-level decisions.
- Reproducibility is a first-class requirement.
- Controlled escape hatches are allowed for genuinely unique scenes.
- Reusable engine features should be justified by repeated needs.

Do not turn this file into a duplicate of `ENGINEERING_HANDOFF.md`.
