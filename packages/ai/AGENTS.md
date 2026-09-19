# AI Integration Instructions

These instructions apply to work under `packages/ai/`.

- AI produces structured intent; deterministic code owns rendering semantics.
- Keep provider-specific behavior behind abstractions.
- Do not couple core engine behavior to one model or vendor.
- Use bounded retries. Never create unbounded agent repair loops.
- Prefer schema-constrained structured outputs for machine-consumed data.
- Persist approved generations and metadata required for reproducibility.
- Do not persist every trivial discarded generation indefinitely.
- Route simple tasks to cheaper models when architecture permits it; reserve stronger models for high-leverage reasoning.
- Cache exact or safely reusable successful requests where appropriate.
- AI failures must degrade visibly and predictably through the defined fallback hierarchy.
