# Cognitive visuals and charts

Milestone 5 adds structured memoryOrb, thoughtBubble, contextBubble, label, and
barChart nodes. Each uses the existing position, size, visibility, attachment,
theme, and scene-animation contracts. The engine owns geometry and timing;
Remotion receives resolved SVG shapes and text. No research or psychology model
is inferred from visual state.

MemoryOrb stores content even when hidden. States are active, weak, fading, hidden,
and retrieved. Active/retrieved are fully visible; weak uses 0.3 opacity; hidden
uses zero. Fading linearly approaches at most 0.15 opacity over fadeDuration,
retaining a visual trace without increasing opacity or revealing hidden content.
An initially fading memory starts at full opacity. State changes use
node-local seconds and hold until replaced. Changes cannot interrupt a fading
interval. Reduced motion keeps these opacity changes. Concentric translucent
circles suggest glow without blur filters or network assets.

Thought bubbles use a rounded enclosure and dot tail. Context bubbles use a
distinct double enclosure. Both contain authored text, not generated explanations.
Labels and bubbles wrap text deterministically within declared bounds. Overflow
and unsupported glyphs fail rather than clip, shrink, or silently substitute.

## Bar charts

Bars have stable IDs, labels, nonnegative finite values, and explicit highlighting.
The y-axis always begins at zero; yMax is positive and no value may exceed it.
The reveal interval uses node-local seconds and a named easing. Reduced motion
shows final bars immediately. Values count up with bar growth and settle on their
authored values; the chart is an animated reveal, not a time series.

Annotations target bar IDs and occupy an explicit band above the plot. A source
caption is mandatory. Synthetic fixtures display SYNTHETIC TEST DATA; research
charts require an authored citation. This records provenance, not evidence review.
No episode data is invented. The provided fixture is a software test only.

An attachment may target `bar.<id>` on a chart; this anchor follows the animated
top center of that bar. Existing parent transforms apply exactly once. This makes
icons and labels interact with bars without independent coordinates or renderer
business logic.

## Text reproducibility

Labels use locally bundled Roboto Mono regular from pinned Fontsource 5.3.0. The
renderer waits for the font and fails on loading errors. Text currently supports
printable ASCII, adequate for the supplied English/Indonesian labels; unsupported
characters fail early. Monospaced advances are fixed to 0.6 × font size in SVG.
No system-font fallback, rich text, arbitrary font selection, or automatic fitting
is introduced. Wider language support requires a deliberate font/glyph contract.

The font is Roboto Mono by Google, distributed under OFL-1.1 by
[Fontsource](https://fontsource.org/fonts/roboto-mono). The installed package includes
its license; only the Latin regular WOFF2 enters the browser bundle. Resource
manifests record its package, exact version, filename, family, and license. The
loader uses Remotion's render gate and browser FontFace API; it makes no CDN request.

## Structured input limits

See [the executable fixture](../tests/fixtures/cognitive-v1.json). Every component
requires explicit width/height and a scene theme. Memory bounds must be at least
80x80; bubbles at least 100x60; charts at least 320x280. These minimums do not
guarantee arbitrary text fits: compilation also validates actual wrapped content.
Text fields contain 1-240 printable ASCII characters. Labels, bubbles, and memory
content require a fontSize between 12 and 48. Labels also require align and colorRole.
Memory stateChanges are ordered node-local frame-grid times after zero; fadeDuration
is positive and each fading interval must fit visibility without interruption.

Charts require title, unit, yMax, decimals, bars, annotations, dataSource, and
reveal. There are 1-6 uniquely identified bars and at most one annotation per bar.
Values are nonnegative, yMax is positive and at most 1e9, and authored values must
fit the declared 0-2 decimal precision. Negative values, logarithmic axes, stacked
series, rich labels, and implicit data fetching are outside this contract.

`pnpm test:cognitive` checks the four-second fixture and actual changed-data,
reduced-motion, and repeated exports. Outputs live in `out/cognitive/`.

These are additive scene-v1 fields. Earlier fixtures retain their exact meanings.
The primitive geometry and typography remain review candidates, not channel branding.
