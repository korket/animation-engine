# Non-goals

Milestone 0 delivers tooling, a dashboard startup page, and one animated render
fixture. It does not deliver a production scene graph, anchors, reusable animation
library, asset system, SQLite, AI integration, workflow approvals, dashboard
editing, render queue, cloud rendering, or the 45-second test reel.

Milestone 1 adds a basic versioned scene tree, file loader, frame-grid timing,
SVG groups/circles/rectangles, and local video export. It does not add the later
style/asset system, named layouts, anchors, scale/rotation transforms, reusable
animation primitives, text, charts, cameras, persistence, AI, or dashboard editing.
Groups currently translate child coordinates only. The original smoke fade remains
separate from the version 1 contract.

Milestone 2 adds a local theme/asset catalog, SVG loading, exact version lookup,
semantic metadata search, scene references, and render usage records. It does not
add asset generation, remote catalogs, episode indexing, layout templates,
character systems, animation primitives, or dashboard asset management. Supported
SVG is deliberately restricted; the palette and prop rules remain review candidates.

The wider v1 exclusions remain authoritative in
[the handoff](ENGINEERING_HANDOFF.md#62-explicit-v1-non-goals). In particular, do
not add a general video editor, generative video, final TTS, or cloud render farm.
