# Scene Schema Instructions

These instructions apply to work under `packages/scene-schema/`.

- The schema is a contract, not a dumping ground for renderer internals.
- Prefer semantic fields over unexplained raw coordinates when practical.
- Keep explicit escape hatches for precise manual control.
- Validate unsupported assets, actions, timings, targets, and references early.
- Validation errors must be human-readable and suitable for automated repair workflows.
- Avoid ambiguous defaults that could change episode output silently.
- Schema changes require migration/compatibility consideration and tests.
- Do not add fields for hypothetical future features without a current use case.
