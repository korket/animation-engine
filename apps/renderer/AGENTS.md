# Renderer Instructions

These instructions apply to work under `apps/renderer/`.

- Rendering must be deterministic for identical approved inputs and pinned dependencies.
- Remotion is the composition/render layer, not the owner of business logic.
- Do not silently substitute missing or invalid final-production content.
- Draft renders may use explicit, visible fallbacks where the specification permits them.
- Final renders must fail when known critical blockers remain.
- Changes affecting rendered output require an appropriate render fixture or visual regression check when available.
- Keep renderer interfaces narrow and driven by engine-defined semantics.
