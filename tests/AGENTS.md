# Test Instructions

These instructions apply to work under `tests/`.

- Tests protect behavior; they are not obstacles to implementation.
- Do not weaken a valid assertion merely to make a change pass.
- Regression tests should describe the bug they prevent.
- Keep fixtures minimal and focused on the behavior under test.
- Visual fixtures should be deterministic and easy to inspect.
- Avoid snapshots so broad that meaningful regressions become invisible in noise.
- Prefer focused reference frames and short rendered-video fixtures for rendering behavior.
- A deliberately broken fixture should fail for the reason the test claims to verify.
