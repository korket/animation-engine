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

Milestone 3 adds layout slots, sibling-relative positions, group motion, tested
object primitives, frame-based stagger, named easing, reduced motion, and 2D
camera pan/push/follow. It does not add text/counting, path drawing, expression
swaps, character anchors, 3D cameras, or a timeline editor. The broader primitive
target remains a before-production requirement, not a reason to build later
character/chart capabilities prematurely.

Milestone 4 adds two versioned human identities, ten authored poses, eight modular
expressions, a four-frame walk, expressionSwap, and moving sibling attachments.
It does not add IK/bones, lip sync, arbitrary hand-to-handle solving, a mascot,
charts, cognitive components, persistence, or dashboard editing. Artwork remains
a visual review candidate.

Milestone 5 adds cognitive states, bubbles, bounded ASCII text, and single-series
nonnegative bar charts. It does not add a psychological model, invented research,
arbitrary SVG/text, rich typography, data fetching, statistical analysis, or the
Milestone 6 custom scene API/MemoryRooms scene. Production branding remains pending.

The wider v1 exclusions remain authoritative in
[the handoff](ENGINEERING_HANDOFF.md#62-explicit-v1-non-goals). In particular, do
not add a general video editor, generative video, final TTS, or cloud render farm.
