# Development Workflow

## Milestone 0 setup

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
```

`pnpm dev` serves the dashboard at http://127.0.0.1:5173 and fails if that port is
occupied. `pnpm dev:renderer` starts Remotion Studio for the fixture. Stop either
with Ctrl+C. The dashboard is only a bootstrap page, not a production workflow.

Commands:

| Command               | Behavior                                                    |
| --------------------- | ----------------------------------------------------------- |
| `pnpm typecheck`      | Strict checks for workspace source, scripts, and tests      |
| `pnpm lint`           | TypeScript/React rules and core dependency boundaries       |
| `pnpm format:check`   | Read-only formatting check                                  |
| `pnpm format`         | Explicit formatting changes to maintained bootstrap files   |
| `pnpm test`           | Parser, runtime, and file-loader unit tests                 |
| `pnpm build`          | Build dashboard and Remotion bundle                         |
| `pnpm verify`         | Formatting, lint, typecheck, unit tests, and builds         |
| `pnpm test:dashboard` | Start, request, compile, and close a local dashboard server |
| `pnpm render:smoke`   | Render fixture MP4 and selected PNG frames                  |
| `pnpm test:render`    | Render and validate the original and changed scene inputs   |

An alternative JSON file may be supplied as
`pnpm render:smoke "tests/fixtures/my scene.json"`. Relative input paths are
resolved from the repository root; artifacts always go to `out/smoke/` and are
overwritten on rerun. Output from a failed run must not be treated as verified.
Only a successful `test:render` run produces current verification evidence.

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
There are no Git hooks or automatic commits.

## Purpose

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
