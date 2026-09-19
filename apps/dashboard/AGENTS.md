# Dashboard Instructions

These instructions apply to work under `apps/dashboard/`.

- Keep production workflow state explicit and inspectable.
- Do not hide validation, render, or QC failures behind optimistic UI states.
- Prefer task-focused production interfaces over general-purpose editor features.
- Do not build an Illustrator or nonlinear video editor.
- Scene editing should operate through structured parameters, scene JSON, and targeted patching.
- Preserve links between user-visible state and underlying scene/version identifiers.
- UI changes that alter production behavior require corresponding tests where practical.
- Avoid duplicating engine semantics inside dashboard components.
