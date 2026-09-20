# Character contract

Milestone 4 adds original geometric human artwork, authored poses, modular faces,
and deterministic attachments. The art is a review candidate, not approved channel
branding. No external artwork, bones, inverse kinematics, lip sync, or mascot is used.

Characters pin `characterId` (`protagonist` or `secondary-human`) and
`characterVersion: "1"`. Substantial visual changes require a new version; preserve
version 1 geometry. Source-controlled geometry and provenance live in `characters`.
Both identities use the same 100×200 viewBox, ten body poses, and eight expressions.
Themes supply surface, shirt, and outline roles; no skin palette is inferred.

Poses: standing, walking, sitting, thinking, pointing, holding-phone, opening-door,
reaching, confused-body, carrying-object. Expressions: neutral, happy, confused,
surprised, frustrated, thinking, worried, focused. Hand names denote the drawing's
left and right sides. Poses depict gestures; opening-door does not animate a door.

Character nodes require width/height, pose, expression, walkStepDuration (seconds),
and actions. Artwork fits the viewport uniformly, including letterboxing. A walking
pose uses four held drawings, each lasting walkStepDuration. A pose action resets
the cycle. Walking in place does not imply travel; use the existing followPath clip.
Reduced motion displays standing limbs while retaining expressions and pose changes.

Actions are `{type: "pose" | "expressionSwap", at: seconds, value: name}`. Times
are relative to node start, frame-aligned, ordered, and inside node visibility.
Different action kinds can share a time; duplicate kinds at a time fail. A change
holds until replaced. Expression changes swap eyes, brows, and mouth discretely;
they do not interpolate facial geometry or alter the body.

## Attachment semantics

A node may specify `attachment: {target, anchor, offset: {x,y}}` in addition to its
base position. Its center is placed at the target anchor plus offset, measured in
scene units before target motion. Base position remains its own animation pivot;
the attachment supplies the translation from that pivot. Target transforms and
opacity are inherited, then the attached node's own motion is composed locally.
Offsets rotate/scale with the target. Shared ancestor motion is applied exactly once.

Targets must be siblings and visible for the entire attached node interval. Forward
references work without changing paint order. Missing anchors, cycles, and invalid
visibility fail at compilation. Character anchors are leftHand, rightHand, head,
contextAnchor, and feet; every node also offers center/top/bottom/left/right bounds.
Hand anchors follow authored poses and walk drawings before scene transforms.
Attachments are positional, without limb rotation or IK. This is sufficient for
held props; making a hand solve toward an arbitrary door handle remains unsupported.

This additive scene-v1 contract is justified by moving-prop acceptance. Earlier
scenes keep their behavior. Engine owns relationships and evaluated geometry;
Remotion only renders the resolved shapes and affine matrices.
