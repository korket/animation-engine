# Layout and animation contracts

Milestone 3 is explanatory video motion. It uses deterministic frame evaluation,
not CSS clocks, requestAnimationFrame, physical simulation, or browser preferences.
Animations use transform and opacity; `scaleIn` starts at an explicit 0.90–0.97
scale with an opacity entrance. A reduced-motion scene setting keeps fades and
suppresses spatial/camera effects so the chosen export remains reproducible.

`packages/animation` owns pure normalized-progress samples and named easing.
Progress must be in [0,1]. `frameProgress` alone explicitly holds endpoints outside
a valid integer frame interval. `staggerFrames` expands an ordered target list to
explicit start/duration pairs; it never introduces timers.

| Easing   | Fixed definition                 |
| -------- | -------------------------------- |
| linear   | Identity                         |
| soft     | Cubic Bézier (0.32, 0.72, 0, 1)  |
| snappy   | Cubic Bézier (0.23, 1, 0.32, 1)  |
| dramatic | Cubic Bézier (0.77, 0, 0.175, 1) |
| bounce   | Penner easeOutBounce             |

The Bézier choices follow the animate skill's established curve tokens; the
bounce family follows [easings.net](https://easings.net/#easeOutBounce). Curve
inversion uses a fixed iteration count. Arbitrary user-defined curves are rejected.

Implemented object effects: fadeIn, fadeOut, slideIn, slideOut, scaleIn, pop,
bounce, rotate, shake, wiggle, pulse, followPath, and highlight. Slide/path values
are offsets from base placement; path traversal uses polyline arc length. Bounce
is one vertical hop. Shake/wiggle decay to rest; pulse/highlight return to baseline.
The three camera effects are cameraPan, cameraPush (also pull-out), and cameraFollow.
Every primitive, including stagger, has focused automated tests.

The handoff's approximately twenty-primitive target is before full production.
`countUp`, `drawPath`, and `expressionSwap` are not implemented without their
text/path/character capabilities. No character, chart, or arbitrary SVG-path
system is introduced during this milestone.
