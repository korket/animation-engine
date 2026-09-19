# Engine Instructions

These instructions apply to work under `packages/engine/`.

The engine is foundational code. Treat public semantics as expensive to change.

- Prefer deterministic, explicit behavior over convenience magic.
- Keep the engine independent of any single AI provider.
- Do not place dashboard concerns in the engine.
- Do not place arbitrary Remotion business logic in the engine API.
- Preserve stable scene semantics across render backends where practical.
- Foundational changes to timing, transforms, scene graph behavior, or execution order require explicit justification and regression coverage.
- Prefer small reusable primitives over large "smart" functions.
- Avoid generalized systems that are not required by the active milestone or demonstrated repeated need.
