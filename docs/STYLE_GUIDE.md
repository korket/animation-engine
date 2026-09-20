# Style Guide

Status: **review candidate**, not an approved channel identity. Milestone 2's
`studio-proof` theme demonstrates consistent flat-vector props. It does not
promote the Milestone 0 smoke colors into a production style.

Machine-readable themes are in `packages/assets/catalog.json`. Exact ID/version
references are required. Changing a palette, outline, or radius creates a new
theme version; changing the role/token contract creates a new `styleVersion`.

| Role       | Version 1 | Version 2 | Use                            |
| ---------- | --------- | --------- | ------------------------------ |
| background | `#F4F1E8` | `#192734` | Scene canvas                   |
| surface    | `#FFFFFF` | `#EDF3F5` | Screens and interior surfaces  |
| primary    | `#326B87` | `#74B8CA` | Primary prop body              |
| secondary  | `#B8CFB0` | `#D6A4A4` | Supporting prop body           |
| accent     | `#E5A83B` | `#E8BD65` | Focal marks                    |
| outline    | `#263442` | `#09131C` | Silhouettes and internal lines |

Artwork uses explicit semantic fills/strokes; literal asset colors are rejected.
Version 1 uses a 4-unit outline and 8-unit corner radius; version 2 uses 6 and 12.
Outlines have round caps/joins. Units are intrinsic SVG viewBox units and scale
uniformly with the asset. Aspect ratio is preserved and centered in the requested
viewport. Assets contain margin for strokes. No shadows, gradients, blur, or text
are supported in this milestone.

Review checklist: clear silhouettes, consistent palette, balanced outlines,
legible small props, and no cropped strokes. The fixture keeps generous margins;
it does not establish a layout engine or universal spacing rule.

Milestone 4 proposes a 100×200 human viewBox, a 50-unit head diameter, a 34-unit
torso width, and separate eyes/brows/mouth. Surface fills the head/hands; primary
and secondary distinguish shirts. Four authored walk drawings use the same face
coordinates. Stroke margins are retained inside the viewport. These proportions
and artwork remain review candidates; technical render verification does not
approve them as channel identity. See [CHARACTERS.md](CHARACTERS.md).

Handoff §14's typography, arrows, bubbles, charts, and universal spacing/safe-area
rules remain with their owning milestones and visual review.
