# Animation Instructions

These instructions apply to work under `packages/animation/`.

- Animation primitives must be deterministic.
- Every primitive requires automated tests.
- Use named easing styles rather than AI-supplied arbitrary easing functions.
- Keep timing semantics explicit.
- Reject or clearly report invalid timing instead of silently clamping unless the contract explicitly specifies clamping.
- Prefer composable primitives over large special-purpose animation functions.
- Add new primitives only for demonstrated reusable behavior.
- Changes affecting visual output should include or update a render/visual fixture when practical.
