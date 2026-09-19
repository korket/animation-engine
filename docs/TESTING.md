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

## Principle

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
