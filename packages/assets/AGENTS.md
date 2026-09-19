# Asset Instructions

These instructions apply to work under `packages/assets/`.

- Asset identity must not depend only on filenames.
- Track semantic metadata and version information explicitly.
- Do not silently mutate assets in ways that change previously approved episode output.
- Preserve compatibility or create a new asset version for substantial visual changes.
- Keep style roles semantic where practical, such as `accent` rather than hardcoded color values.
- Track enough provenance and usage information to support reproducibility and debugging.
- Avoid adding asset-generation complexity before the active episode or test reel requires it.
