# Animation engine

Local-first, deterministic SVG animation rendered through Remotion.
Milestone 1 adds a versioned JSON scene tree, deterministic geometry and timing,
and local SVG-to-MP4 rendering. The Milestone 0 circle fade remains a regression
fixture; the dashboard remains a bootstrap page.

## Quick start

Install Node **24.13.0** and pnpm **11.19.0**, then run from the repository root:

```text
pnpm install --frozen-lockfile
pnpm verify
pnpm dev
```

The dashboard opens at <http://127.0.0.1:5173>. In another terminal:

```text
pnpm dev:renderer
pnpm render:scene tests/fixtures/scene-v1.json
pnpm test:scene
pnpm render:smoke
pnpm test:render
```

Remotion Studio provides `Scene` and `Smoke` composition previews. Core scene
artifacts are written under `out/scene/`; smoke artifacts under `out/smoke/`.
Initial rendering downloads a managed browser and
requires internet access; the scene itself uses no network media.

## Documentation

- [Product specification](docs/ENGINEERING_HANDOFF.md)
- [Architecture and milestone boundary](docs/ARCHITECTURE.md)
- [Setup, commands, and troubleshooting](docs/DEVELOPMENT.md)
- [Tests and rendering verification](docs/TESTING.md)
- [Versioned scene and smoke input contracts](docs/SCENE_SCHEMA.md)
- [Style guide status](docs/STYLE_GUIDE.md)
- [Asset system](docs/ASSET_SYSTEM.md)
- [Test reel](docs/TEST_REEL.md)
- [Non-goals](docs/NON_GOALS.md)
- [Commit conventions](docs/COMMITS.md)
