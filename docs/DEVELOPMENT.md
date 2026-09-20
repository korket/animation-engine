# Development Workflow

## Local setup

Use Node 24.13.0 and pnpm 11.19.0. Install Node using your normal platform
installer/version manager; `npm install --global pnpm@11.19.0` installs the pinned
package manager if it is missing. Node's version is also recorded in `.node-version`.

From the repository root on Windows PowerShell or Linux:

```text
pnpm install --frozen-lockfile
pnpm verify
pnpm test:dashboard
pnpm render:smoke
pnpm test:render
pnpm render:scene tests/fixtures/scene-v1.json
pnpm test:scene
```

`pnpm dev` serves the dashboard at http://127.0.0.1:5173 and fails if that port is
occupied. `pnpm dev:renderer` starts Remotion Studio with `Scene` and `Smoke`
compositions. Stop either
with Ctrl+C. The dashboard is only a bootstrap page, not a production workflow.

Commands:

| Command                                       | Behavior                                                           |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm typecheck`                              | Strict checks for workspace source, scripts, and tests             |
| `pnpm lint`                                   | TypeScript/React rules and core dependency boundaries              |
| `pnpm format:check`                           | Read-only formatting check                                         |
| `pnpm format`                                 | Explicit formatting changes to maintained bootstrap files          |
| `pnpm test`                                   | Parser, runtime, and file-loader unit tests                        |
| `pnpm build`                                  | Build dashboard and Remotion bundle                                |
| `pnpm verify`                                 | Formatting, lint, typecheck, unit tests, and builds                |
| `pnpm test:dashboard`                         | Start, request, compile, and close a local dashboard server        |
| `pnpm render:smoke`                           | Render fixture MP4 and selected PNG frames                         |
| `pnpm test:render`                            | Render and validate the original and changed scene inputs          |
| `pnpm render:scene <json> [output-directory]` | Render a version 1 scene and selected PNG frames                   |
| `pnpm test:scene`                             | Verify scene-tree timing, geometry, changed JSON, and MP4 metadata |

An alternative JSON file may be supplied as
`pnpm render:smoke "tests/fixtures/my scene.json"`. Relative input paths are
resolved from the repository root; artifacts always go to `out/smoke/` and are
overwritten on rerun. Output from a failed run must not be treated as verified.
Only a successful `test:render` run produces current verification evidence.

### Core scene rendering

Use `pnpm render:scene "tests/fixtures/scene-v1.json" "out/my scene"` for version 1
scenes. Input and output paths resolve from the repository root, including when
pnpm runs the command inside the renderer workspace. The default output directory
is `out/scene/`. The command writes `scene.mp4` and PNGs at the first, midpoint,
and final frames. Those named files are overwritten on rerun; use a dedicated
output directory. Additional old frames may remain and are not proof of success.

The JSON file is loaded and validated before bundling or downloading a browser.
See [the scene contract](SCENE_SCHEMA.md#version-1-basic-scene-tree) for supported
nodes and timing. H.264/yuv420p export additionally requires even width and height;
odd dimensions are valid scene data but fail at the exporter boundary. Malformed
JSON, invalid scene fields, unsupported timing, encoding, and browser failures
produce a nonzero exit code. There is no fallback content.

`pnpm test:scene` writes `out/scene/verification.json` only after both real render
variants pass. Ordinary rendering removes a previous report when it starts;
always check the current command's exit status. The verifier's changed input and
its artifacts are under `out/scene/variant with spaces/`.

The two fixed smoke colors are not an approved style guide. Inputs are test
fixtures, not episode definitions or approved final-production content.

### Dependencies and browser prerequisites

The lockfile and exact direct pins are intentional. All Remotion packages use
the same version. TypeScript 5.9.3 is selected to remain within typescript-eslint's
declared support range. The renderer pins Zod 4.5.4 for Studio compatibility;
without that explicit dependency, Studio can resolve the lint tooling's newer
transitive Zod. The renderer build runs `remotion versions` to catch this class
of mismatch. This does not introduce Zod into the smoke schema.
Strict peer checks remain enabled. `esbuild` is the only
dependency allowed to run a build script; it verifies/installs its native binary.
Exact release-age exceptions record the selected versions pnpm identified as
recent releases during bootstrap; they are not wildcard exemptions.

`tsx` executes Node scripts; PNGJS checks reference pixels; Mediabunny checks
actual MP4 metadata using the library recommended by Remotion instead of its
deprecated metadata API. These are development/verification dependencies.

The first render downloads Remotion's managed Chrome Headless Shell. Internet
access is needed for installation/browser provisioning, not scene assets. Remotion
supplies its encoding binaries; a global FFmpeg installation is not required.

Linux needs Chrome shared libraries. The Ubuntu 24.04 CI job installs the list
from [Remotion's Linux prerequisites](https://www.remotion.dev/docs/miscellaneous/linux-dependencies).
For other distributions, follow that documentation. Download or browser-launch
failures are errors, not reasons to skip rendering checks.

### Portability

Node scripts resolve filesystem paths with URL/path APIs and close browser/server
resources in `finally` blocks. Package commands use workspace-local executables.
No Unix filesystem utilities or shell-specific environment assignment is needed.
CI checks out into a path with spaces on both target platforms.

If Windows PowerShell blocks a package-manager `.ps1` shim, use `pnpm.cmd` for the
same commands. Do not disable system protections to run the project.

Generated `out/`, `.cache/`, and app `dist/` directories are ignored. Handwritten
AGENTS files and the original specification are excluded from automatic formatting.
There are no Git hooks. Agent commits follow the automatic commit policy in
the root `AGENTS.md`.

## Themed assets

```text
pnpm render:scene tests/fixtures/assets-v1.json out/assets
pnpm test:assets
```

`pnpm dev:renderer` includes an `Assets` preview using the same checked-in SVGs.
`test:assets` verifies both theme versions, pinned phone revisions, book styling,
aspect ratio, source usage records, and real MP4 metadata. Output goes to
`out/assets/`, with the second theme in `theme variant with spaces/`.

The registry and theme definitions are in `packages/assets/catalog.json`.
Use the `@animation-engine/assets` API's `searchAssets(library, query, filters)`
for deterministic metadata search and `assets/node`'s `loadAssetLibrary()` for
local loading. Asset versions and themes are selected explicitly in scene JSON.
Do not edit the SVG or checksum of an existing version to change its visuals.
Add a new version and reference it deliberately. See [the asset contract](ASSET_SYSTEM.md).

The SVG loader uses pinned `@xmldom/xmldom` 0.9.12; all parser diagnostics and
unsupported SVG features fail. It adds no network media or system dependencies.
The existing smoke and core scene commands remain supported regression checks.

## Layout and animation

```text
pnpm render:scene tests/fixtures/motion-v1.json out/motion
pnpm test:motion
```

Studio includes a `Motion` composition. The render verifier also writes a primitive
grid and a reduced-motion variant under `out/motion/`; both are real MP4 renders.
Use scene `motionMode: "reduced"` for the gentler version. Rendering never consults
the host OS motion preference. See [ANIMATION.md](ANIMATION.md) for contracts,
named layout slots, effects, timing, and camera behavior. No new external motion
library is needed.

## Characters

```text
pnpm render:scene tests/fixtures/characters-v1.json out/characters
pnpm test:characters
```

Studio includes `Characters`. The four-second proof walks with a phone attached
to a moving hand, stops in holding-phone pose, and changes expressions beside a
secondary human. The verifier also renders all poses/expressions, reduced motion,
and a repeated copy. [CHARACTERS.md](CHARACTERS.md) defines authored actions and
attachment semantics. No browser timers, external artwork, or new external
dependencies are required.

## Cognitive visuals and charts

```text
pnpm render:scene tests/fixtures/cognitive-v1.json out/cognitive
pnpm test:cognitive
```

Studio includes `Cognitive`. The four-second proof combines all five memory states,
thought/context bubbles, a labeled synthetic chart, an annotation, and a marker
attached to an animated bar. The verifier also exports changed-data, reduced-motion,
and repeated copies. See [COGNITIVE_CHARTS.md](COGNITIVE_CHARTS.md).

The renderer now bundles pinned Fontsource Roboto Mono 5.3.0, waits for the local
font before capturing frames, and fails on loading errors. No system font or CDN
is required. Unsupported glyphs and text overflow fail early; enlarge the declared
bounds or shorten the authored label instead of relying on clipping.

Run render suites and builds sequentially: they share `.cache/remotion`.

## Engineering procedure

This document defines how engineering changes should be approached across the repository.

## Start From the Problem

Before writing code:

1. Inspect the relevant implementation.
2. Search for existing helpers, interfaces, tests, and conventions.
3. State the concrete problem in behavioral terms.
4. Identify the smallest change that solves it.
5. Identify what evidence will prove the change works.

Do not begin by designing a framework.

## Patch Discipline

A change should solve one coherent problem.

Do not combine:

- bug fixes with unrelated refactors;
- formatting with behavioral changes;
- dependency upgrades with unrelated features;
- architecture cleanup with cosmetic edits.

If a task naturally contains multiple independent changes, split them.

Every meaningful intermediate state should remain buildable and testable when practical.

## Scope Control

Classify adjacent discoveries as:

- required for the current task;
- blocking bug;
- useful follow-up;
- unrelated.

Only required work and blocking bugs belong in the active change.

Do not implement future milestones early merely because the code is nearby.

## Simplicity

Prefer:

- explicit data flow;
- focused functions;
- narrow interfaces;
- strong types;
- predictable behavior.

Avoid:

- speculative abstractions;
- giant manager objects;
- unnecessary dependency injection;
- generic frameworks built for one caller;
- hidden global mutable state;
- duplicated sources of truth.

A repeated pattern can justify an abstraction. A hypothetical future need does not.

## Refactoring

Refactor when there is evidence that the current structure obstructs work, such as:

- repeated bugs;
- repeated implementation patterns;
- unclear ownership;
- hard-to-test behavior;
- interfaces repeatedly fighting real requirements.

Whenever practical, separate behavior-preserving refactors from behavior changes.

Prefer a small correction over rewriting a working subsystem.

Delete dead abstractions instead of maintaining them indefinitely.

## Dependencies

Before adding a dependency, determine:

- the concrete problem it solves;
- whether the capability already exists in the repository;
- whether a small local implementation would be clearer;
- maintenance cost;
- Windows/Linux implications;
- reproducibility implications.

Do not upgrade unrelated dependencies as part of another change.

## Completion

Before reporting completion:

1. Inspect the diff.
2. Remove unrelated edits.
3. Run relevant verification.
4. Confirm no known failure is being hidden.
5. Report changed behavior, verification performed, and remaining limitations.
