# AGENTS.md

## Role

Maintain this codebase as production infrastructure.

Optimize for correctness, simplicity, reproducibility, and maintainability rather than amount of code produced.

`docs/ENGINEERING_HANDOFF.md` is the product specification.

## Maintainer Rules

- Correctness before cleverness.
- Do not knowingly introduce regressions.
- Make one logical change at a time.
- Keep changes reviewable and bisectable.
- Do not mix unrelated refactors with behavioral changes.
- Do not silently broaden the active task or milestone.
- Prefer the smallest solution that correctly solves the demonstrated problem.
- Do not build abstractions for hypothetical future requirements.
- Existing tests represent supported behavior unless proven incorrect.
- Never weaken tests merely to make a change pass.
- Report failures honestly. Never hide or swallow meaningful failures.
- Inspect existing code before introducing a new mechanism.
- Add dependencies only when their value justifies their maintenance cost.

## Project Invariants

- AI plans; deterministic code renders.
- Semantic data is preferred over unexplained raw coordinates.
- Remotion is the rendering layer, not the business-logic layer.
- Approved episode output must remain reproducible.
- Development failures should be visible.
- Final renders must not contain known broken fallbacks.
- One-time needs should not automatically become reusable engine features.

## Working Procedure

For non-trivial changes:

1. Understand the existing implementation and tests.
2. Identify the concrete problem.
3. Implement the smallest coherent solution.
4. Add or update appropriate tests.
5. Run relevant verification.
6. Inspect the resulting diff.
7. Report what changed, what was verified, and what remains.

Rendered behavior must be verified with an appropriate render or visual fixture when the change affects visual output.

## Commit Policy

Create a Git commit automatically after completing each coherent change without waiting for user approval. Keep commits logical, reviewable, and consistent with `docs/COMMITS.md`. Do not push commits or create tags unless the user explicitly requests it.

## Scope

Follow the active task and milestone.

If unrelated work is discovered, record it as follow-up work instead of silently implementing it.

Foundational interface changes require explicit justification.

This includes scene semantics, timing, transforms, anchors, animation contracts, asset identity/versioning, persistence, and renderer boundaries.

## Documentation Map

Consult the relevant document when working in that area.

- Product specification: `docs/ENGINEERING_HANDOFF.md`
- Architecture: `docs/ARCHITECTURE.md`
- Development workflow: `docs/DEVELOPMENT.md`
- Testing and regression policy: `docs/TESTING.md`
- Scene semantics: `docs/SCENE_SCHEMA.md`
- Asset system: `docs/ASSET_SYSTEM.md`
- Git and commit conventions: `docs/COMMITS.md`

More-specific `AGENTS.md` files may exist inside individual packages and applications. Follow those instructions for work within their scope.
