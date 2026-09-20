# Animation engine

Local-first, deterministic SVG animation rendered through Remotion.
Milestone 2 adds versioned semantic SVG assets and theme styling to the JSON scene
runtime and local MP4 renderer. The earlier scene and circle-fade fixtures remain
regression checks; the dashboard remains a bootstrap page.

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
pnpm render:scene tests/fixtures/assets-v1.json out/assets
pnpm test:assets
pnpm render:scene tests/fixtures/scene-v1.json
pnpm test:scene
pnpm render:smoke
pnpm test:render
```

Remotion Studio provides `Assets`, `Scene`, and `Smoke` previews. The themed proof
above writes `out/assets/`; core and smoke checks write `out/scene/` and `out/smoke/`.
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
