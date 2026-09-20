# Testing and Regression Policy

## Milestone 0 verification

`pnpm verify` runs read-only formatting/lint/type checks, Vitest, and both builds.
It does not require downloading a browser. `pnpm test:dashboard` verifies local
HTTP startup and Vite module compilation, then closes the server even on failure.
It is not a browser interaction test.

`pnpm test:render` runs the actual JSON loader, engine, SVG composition, and
Remotion encoder. It checks four PNG frames against explicit reference colors
and geometry with a two-channel-value tolerance, excluding antialiased edges.
It checks the actual MP4's video codec, dimensions, duration, rate, and packet count.
A second real render changes dimensions, circle radius, and fade timing and writes
to a path with spaces, protecting against hardcoded fixture-specific rendering.

Artifacts appear in `out/smoke/`: `smoke.mp4`, `frame-0.png`, `frame-15.png`,
`frame-30.png`, `frame-59.png`, and a verification report. The variant has its own
subdirectory. Failures produce nonzero exit codes and retain available artifacts
for diagnosis; never infer success from file existence alone.

Before accepting a visual change, inspect the PNGs and play the actual MP4 at
normal speed. The circle should fade from invisible to opaque during the first
second, then remain still through the second. Colors are background `#102030`
and circle `#f0a040`. No text, audio, or network assets should appear.

These checks do not establish production scene compatibility, the test reel,
or cross-platform byte-identical H.264 output. GitHub Actions runs the same checks
and real renders on Windows and Ubuntu, with artifacts retained for seven days.
Do not claim Linux verification before that job (or an equivalent Linux run) passes.

### Bootstrap verification record — 2026-09-19

Windows: frozen-lockfile installation in a clean source copy, formatting, lint,
typechecking, 52 unit tests, both builds, dashboard startup, Remotion Studio,
reference PNGs, changed-input rendering, MP4 metadata, and browser playback were
verified locally. The workspace and variant output paths contain spaces.

Linux: the CI job is configured but has not run. An attempted Ubuntu WSL run was
blocked by the host's unavailable virtualization service/required Windows feature
(`HCS_E_SERVICE_NOT_AVAILABLE`). Full two-platform milestone acceptance remains
pending Linux verification; no Windows features were changed to work around it.

## Milestone 1 verification

`pnpm test` also covers strict versioned schema validation, frame-grid conversion,
parent interval containment, unique IDs, nested geometry, stable paint order,
deterministic evaluation, file-loader failures, and exporter preflight checks.

`pnpm test:scene` renders `tests/fixtures/scene-v1.json` through the Node loader,
engine, SVG, and Remotion. The three-second fixture contains a centered panel:
the blue circle appears at 0.5 seconds and disappears at 1.5 seconds; the orange
circle appears at 1 second; a dark rectangle covers its center at 2 seconds.
Nested groups establish placement and offset child timing.

Reference frames 0, 14, 15, 29, 30, 44, 45, 59, 60, and 89 check both sides of
timing boundaries, panel bounds, circle geometry, and overlap order. Pixel checks
use explicit expected colors with tolerance 2, away from antialiased edges.
The MP4 must contain H.264 video at 640×360, 30 fps, 3 seconds, and 90 packets.

A second JSON file changes the viewport to 800×400, rate to 24 fps, duration to
4 seconds, and parent start to 0.5 seconds. It is reloaded from a path containing
spaces and actually rendered. Fourteen reference frames check the shifted timing,
center placement, and empty first/final frames. Video metadata must follow the
changed input (96 packets). Output is under `out/scene/` with a success report
written only after every assertion passes. Inspect the PNGs and play `scene.mp4`
at normal speed before accepting changes to this path.

CI runs both the original smoke regression and core scene render checks on
Windows and Ubuntu and uploads both artifact directories. Linux results remain
pending until that job or an equivalent Linux run passes.

### Core runtime verification record — 2026-09-20

Windows: frozen-lockfile installation, `pnpm verify` (136 tests and both builds),
the original smoke render regression, and both core scene renders passed locally.
Core scene PNGs were visually inspected and the MP4 played in the browser.
The public CLI also rendered with spaces in both input and output paths, and
rejected missing arguments and a smoke-format input with nonzero exit codes.
No dependencies were added. Linux execution remains pending for the host reason
recorded above; the extended CI jobs have not been run remotely.

## Milestone 2 verification

`pnpm test` covers exact asset/theme lookup, deterministic semantic metadata
search, malformed/unsupported SVG, semantic paint/token rules, source checksums,
style compatibility, usage records, versioned scene references, and preservation
of earlier scene behavior. The asset loader tests read the real checked-in SVGs.

`pnpm test:assets` renders a phone and book from semantic IDs. At frame 30 the
phone switches from its pinned version 1 to version 2. PNGs at 0, 29, 30, and 59
check revision selection, palette roles, outlines, geometry, and scene background.
A second real render pins theme version 2 and widens the asset viewports; checks
confirm the new palette/outline width while preserving the artwork's aspect ratio.
Both MP4s must be 640×360, H.264, 30 fps, 2 seconds, and 60 video packets.

`out/assets/` contains the video, reference frames, node/asset usage manifest,
and a verification report written after all checks pass. The alternate theme
has a subdirectory with spaces. Inspect reference images, play the actual video,
and inspect the `Assets` composition in Studio. CI runs this in addition to both
earlier render suites on Windows and Ubuntu and retains artifacts for seven days.
Theme design remains a review candidate; technical verification is not channel
style approval. Linux execution remains pending until the CI job or equivalent
Linux verification passes.

### Asset verification record — 2026-09-20

Windows: frozen-lockfile installation, `pnpm verify` (183 tests and both builds),
all three render verification suites, Studio's `Assets` preview, reference PNGs
for both themes, and actual MP4 playback passed locally. The public render command
also succeeded with a spaced output path. No dependency versions were upgraded;
the XML parser is the sole new external dependency. Linux CI has been extended
but has not been run remotely. The palette remains a review candidate.

## Milestone 3 verification

`pnpm test:motion` renders the four-second motion fixture, a generated primitive
grid, and a reduced-motion variant. Explicit reference pixels cover entrances,
exits, intermediate transforms, highlight, group pivots/opacity, stagger, camera
pan/push/follow endpoints, and endpoint holds. Samples avoid antialiased edges.
The grid's final hold starts at frame 75, when its last staggered entrance ends.
All three actual MP4s are checked for H.264, dimensions, duration, frame rate,
and video packet count. Generated JSON is reloaded through the production loader.

Artifacts and the success-only report live in `out/motion/`, including output
paths with spaces. Unit tests cover every implemented primitive and named layout,
validation, visibility containment, reference cycles, group composition, reduced
motion, moving camera targets, and deterministic arbitrary frame evaluation.
CI runs all four render suites on Windows and Ubuntu and retains their artifacts.
Inspect reference PNGs and play the motion video before accepting visual changes.
The deferred text/path/expression primitives are listed in `ANIMATION.md`.

### Layout and motion verification record — 2026-09-20

Windows: frozen-lockfile installation, `pnpm verify` (260 tests and both builds),
all four render suites, reference PNG inspection, and normal-speed four-second
MP4 playback passed locally. The first in-app player crashed during interaction;
a fresh player completed playback at rate 1 without a media error. Motion,
primitive-grid, and reduced-motion renders passed their pixel/metadata checks.
No external dependencies were added or upgraded. Linux CI includes the new suite
but remains unverified for the host limitation recorded above.

## Milestone 4 verification

`pnpm test:characters` renders the four-second acting proof, a one-second pose grid,
a reduced-motion variant, and a repeat of the acting proof. Reference pixels check
the attached phone at moving hand positions, shirts for both identities, the exact
expression-swap boundary, and all four walk drawings. Repeated renders must produce
identical selected PNG pixels; H.264 bytes are not compared. Every MP4 is checked for
codec, dimensions, duration, frame rate, and packet count. The pose-grid JSON is
written/reloaded through the normal loader using a path with spaces.

Unit tests cover all ten poses and eight expressions, modular face/body separation,
walk boundaries, pose-cycle reset, deterministic seeks, target rotation/scale and
ancestor transforms, attached groups/chains, visibility, cycles, missing anchors,
and invalid timing/identity/theme data. CI runs this suite alongside earlier renders
on Windows and Ubuntu. Inspect the acting proof and pose grid before visual acceptance.
The grid is row-major in the pose order listed in `CHARACTERS.md`; expressions cycle
through that document's expression order. Visual verification does not approve branding.

### Character verification record — 2026-09-20

Windows: frozen-lockfile installation, 320 unit tests, formatting/lint/type checks,
both builds, and all five render suites passed locally. The character suite checked
four actual MP4s and identical reference pixels across repeated acting renders.
The pose grid and acting PNGs were visually inspected. Browser playback completed
the acting MP4 at rate 1 without a media error; screenshot capture in the browser
timed out, so visual inspection used the rendered PNGs. Studio mounted Characters
and sought to frames 18 and 90 with no error overlay. No external dependencies were
added or upgraded. Windows/Ubuntu CI includes the character suite; Linux execution
remains pending for the host limitation recorded above.

## Regression principle

Tests document supported behavior and protect the codebase from regressions.

Do not weaken, skip, or delete a valid test merely to make a change pass.

If a test is wrong, explain why before changing it.

## Regression Handling

When an existing supported behavior breaks:

1. Reproduce the failure.
2. Identify the responsible change when practical.
3. Fix or revert the regression.
4. Add a regression test when practical.

Do not normalize broken behavior by changing expectations to match the bug.

## Required Verification

Run the smallest relevant verification set for the affected code.

Possible checks include:

```text
typecheck
lint
unit tests
integration tests
scene validation
reference-frame tests
rendered-video fixtures
local render
```

Do not claim a check passed unless it was actually run.

## Visual Changes

This project produces visual output. Compilation and unit tests are not sufficient evidence for visual behavior.

Changes affecting any of the following should use an appropriate render or visual fixture when available:

- layout;
- animation;
- camera;
- transforms;
- anchors;
- characters;
- charts;
- SVG rendering;
- scene timing.

Inspect produced artifacts or regression output when the tooling permits it.

## Animation Primitives

Every animation primitive must have automated tests.

Tests should cover, where relevant:

- timing;
- boundary conditions;
- easing selection;
- deterministic output;
- invalid input handling;
- interaction with scene duration.

## Failure Integrity

Never make verification green by:

- hardcoding fixture-specific output;
- weakening assertions without justification;
- suppressing meaningful exceptions;
- bypassing production code with mocks;
- disabling checks without cause.

A visible failure is preferable to false confidence.
