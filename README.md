# Animation engine

Local-first, deterministic SVG animation rendered through Remotion.
Milestone 5 adds memory states, thought/context bubbles, labels, and animated bar
charts with annotations and moving anchors. Earlier render fixtures remain regression
checks; the dashboard remains a bootstrap page. Artwork remains a review candidate.

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
pnpm render:scene tests/fixtures/cognitive-v1.json out/cognitive
pnpm test:cognitive
pnpm render:scene tests/fixtures/characters-v1.json out/characters
pnpm test:characters
pnpm render:scene tests/fixtures/motion-v1.json out/motion
pnpm test:motion
pnpm render:scene tests/fixtures/assets-v1.json out/assets
pnpm test:assets
pnpm render:scene tests/fixtures/scene-v1.json
pnpm test:scene
pnpm render:smoke
pnpm test:render
```

Remotion Studio provides `Cognitive`, `Characters`, `Motion`, `Assets`, `Scene`, and `Smoke` previews.
Cognitive checks write the synthetic-data proof, changed-data and reduced-motion
variants, and repeat-render evidence to `out/cognitive/`.
Character checks write the acting proof, pose grid, reduced-motion variant, and
repeat-render evidence to `out/characters/`.
Motion and asset checks write `out/motion/` and `out/assets/`; core and smoke
checks write `out/scene/` and `out/smoke/`.
Initial rendering downloads a managed browser and
requires internet access; the scene itself uses no network media.

## Documentation

- [Product specification](docs/ENGINEERING_HANDOFF.md)
- [Architecture and milestone boundary](docs/ARCHITECTURE.md)
- [Setup, commands, and troubleshooting](docs/DEVELOPMENT.md)
- [Tests and rendering verification](docs/TESTING.md)
- [Versioned scene and smoke input contracts](docs/SCENE_SCHEMA.md)
- [Style guide status](docs/STYLE_GUIDE.md)
- [Layout, animation, and camera contracts](docs/ANIMATION.md)
- [Characters, expressions, and attachments](docs/CHARACTERS.md)
- [Cognitive visuals, charts, and text](docs/COGNITIVE_CHARTS.md)
- [Asset system](docs/ASSET_SYSTEM.md)
- [Test reel](docs/TEST_REEL.md)
- [Non-goals](docs/NON_GOALS.md)
- [Commit conventions](docs/COMMITS.md)
