# ENGINEERING HANDOFF

## AI-Directed 2D Explainer Animation Engine v1

### 0. Your mission

Build a local-first production engine for creating 4–6 minute animated educational YouTube videos.

The system is inspired by the production philosophy of channels such as Kok Bisa: flat 2D vector artwork, simple character animation, diagrams, charts, visual metaphors, reusable environments, moderate humor, and frequent visual changes.

Do **not** reproduce another channel's proprietary artwork, characters, branding, or exact visual identity.

The product we are building is:

> A programmable 2D animation studio that an AI planning system can direct.

AI determines what a scene should communicate and chooses from controlled visual tools. The rendering system deterministically decides how assets are drawn, positioned, animated, validated, versioned, and rendered.

This is not a text-to-video generator.

Generative AI video is explicitly out of scope for v1.

---

# 1. Product objective

The mature workflow should look like:

```text
TOPIC
  ↓
RESEARCH
  ↓
OUTLINE
  ↓
HUMAN APPROVAL
  ↓
SCRIPT
  ↓
HUMAN APPROVAL / SCRIPT LOCK
  ↓
USER SUPPLIES FINAL NARRATION AUDIO
  ↓
SCRIPT ↔ AUDIO ALIGNMENT
  ↓
NARRATIVE BEATS
  ↓
VISUAL STRATEGY
  ↓
SCENE DEFINITIONS
  ↓
ROUGH ANIMATIC
  ↓
HUMAN APPROVAL / STRUCTURE LOCK
  ↓
MISSING-ASSET QUEUE
  ↓
ASSET APPROVAL
  ↓
FINAL ANIMATION
  ↓
MUSIC + SFX
  ↓
AUTOMATED QC
  ↓
HUMAN FINAL QC
  ↓
FINAL MP4 + PUBLISHING PACKAGE
```

The engine succeeds when ordinary scenes in a future episode can be produced without editing source code.

Source-code changes should only be necessary when a genuinely new reusable capability is needed.

Long-term target after the system matures:

> Approximately 1–3 hours of human production work per 4–6 minute episode.

Do not expect the first episode to hit that target.

---

# 2. Channel specification

Audience:

Global English-speaking audience.

Video type:

Broad educational explainers covering science, everyday mysteries, economics, psychology, history, society, and related topics.

Typical duration:

4–6 minutes.

Channel personality:

* 70% curious/playful
* 25% smart/calm
* 5% weird/overthinking

Humor:

Moderate. Visual jokes plus occasional narration jokes.

Narration:

Friendly male-presenting young-adult voice.

Important:

The user will provide the **final narration audio**.

Do not build final TTS generation into the production pipeline.

The system may contain an abstract audio-provider interface for possible future use, but final narration generation is not a v1 requirement.

---

# 3. Visual direction

Use an original clean flat-vector style.

Core properties:

* flat 2D SVG artwork
* simple geometric construction
* strong silhouettes
* limited shading
* strict palette
* consistent outlines
* simple modular faces
* readable typography
* restrained camera movement
* diagrams integrated into the same visual language
* moderate on-screen text
* visual changes roughly every 4–7 seconds

Visual change does not always mean a cut.

A composition may evolve through:

* movement
* object entrances
* diagrams
* text
* camera moves
* transformations
* expressions
* object replacement

The style guide must be strict and machine-readable where practical.

---

# 4. First production episode

Working title/topic:

> Why Do We Forget Why We Walked Into a Room?

Target duration:

4–6 minutes.

Scientific direction:

Explore the doorway effect, event boundaries, and context-dependent retrieval at a highly accessible level.

Important research rule:

Do not assume in advance that doorway effects are strong, universal, or conclusively established.

Research must determine what the evidence actually supports.

The script must explicitly avoid the false simplification:

> Walking through a door makes your brain delete the memory.

If evidence is mixed or conditional, represent that honestly.

---

# 5. First episode story requirements

The opening should use relatable comedy.

Example conceptual setup:

A human character gets up to retrieve something, walks into another room, stops, and completely forgets why they are there.

A recurring mascot may appear afterward as a guide.

Mascot usage should remain sparse.

Episode environments:

```text
living room
hallway
kitchen
abstract mental space
```

The episode should contain:

* ordinary character acting
* doorway interaction
* simple walking
* memory visualization
* a research/data chart if justified by evidence
* diagrams
* moderate text
* at least one visual joke
* one main custom hero sequence
* a practical ending
* a broader conceptual ending

Ending concept:

Give a useful suggestion such as mentally reconstructing/revisiting the previous context, then end with the broader concept that memory retrieval depends strongly on context and active mental state rather than behaving like a simple filing cabinet.

---

# 6. Recurring cognitive visual language

Build the following reusable components for v1.

## MemoryOrb

An abstract glowing orb representing information currently active in memory.

It may briefly reveal the actual remembered object/concept inside it.

States:

```text
active
weak
fading
hidden
retrieved
```

Example API:

```tsx
<MemoryOrb
  content="glass-of-water"
  state="active"
/>
```

## ThoughtBubble

Reusable thought visualization.

## ContextBubble

Represents the current contextual/event state around a character.

Do not build a giant psychology visualization library before episode 1.

Only generalize components required at least twice.

---

# 7. Hero sequence

The primary custom sequence is called:

## Memory Rooms

Concept:

The protagonist carries an active MemoryOrb through Room A.

As the protagonist crosses a doorway, the real environment transitions into an abstract representation of an event boundary.

The previous context recedes.

A new contextual environment forms.

The orb becomes visually less accessible rather than being destroyed.

This sequence should communicate:

> A context/event transition can make previously active information harder to retrieve.

It must not communicate:

> Doors erase memories.

Use the controlled custom-scene API first.

Only use bespoke React/Remotion code if the controlled API genuinely cannot express the sequence.

---

# 8. Technical architecture

Primary environments:

Windows and Linux.

The application is local-first.

Design cloud-render portability into the architecture, but do not implement cloud rendering in v1.

Main components:

```text
LOCAL WEB DASHBOARD
        │
        ▼
PRODUCTION ORCHESTRATOR
        │
   ┌────┴─────┐
   ▼          ▼
SQLite     Filesystem
   │          │
   └────┬─────┘
        ▼
CUSTOM SVG / SCENE ENGINE
        │
        ▼
REMOTION COMPOSITION
        │
        ▼
FINAL VIDEO
```

Use current stable Remotion APIs and pin dependency versions in the lockfile. Remotion is specifically designed for React-based programmatic video, parameterization, previews, and automated rendering, making it appropriate for the final composition/render layer.

Remotion should not contain all business logic.

Our animation/scene engine should sit above it.

---

# 9. Suggested repository architecture

Use TypeScript.

Prefer a monorepo.

Suggested structure:

```text
studio/
│
├── apps/
│   ├── dashboard/
│   └── renderer/
│
├── packages/
│   ├── engine/
│   ├── scene-schema/
│   ├── animation/
│   ├── characters/
│   ├── assets/
│   ├── layouts/
│   ├── camera/
│   ├── charts/
│   ├── cognitive/
│   ├── ai/
│   ├── research/
│   ├── validation/
│   ├── qc/
│   ├── database/
│   └── shared/
│
├── assets/
│   ├── common/
│   └── styles/
│
├── episodes/
│
├── tests/
│
└── docs/
```

A local browser dashboard is preferred over Electron/Tauri for v1.

Do not build a general-purpose video editor.

---

# 10. Data/storage architecture

Use:

```text
Filesystem + SQLite
```

Filesystem stores:

* SVG
* JSON
* Markdown
* audio
* screenshots
* video
* captions
* thumbnails
* source documents where appropriate

SQLite stores:

* relationships
* searchable metadata
* workflow state
* approvals
* versions
* render status
* AI generations
* asset usage
* QC issues
* cost tracking

Suggested tables:

```text
episodes
episode_versions
scenes
scene_versions
assets
asset_versions
asset_usage
approvals
sources
ai_generations
render_jobs
qc_issues
costs
topic_bank
```

Do not put large media binaries into SQLite.

---

# 11. Episode directory format

Example:

```text
episodes/
└── 001-doorway-memory/
    ├── brief/
    │   └── topic.json
    │
    ├── research/
    │   ├── dossier.md
    │   └── sources.json
    │
    ├── outline/
    │   └── outline-v1.json
    │
    ├── script/
    │   ├── script-v1.md
    │   └── approved.md
    │
    ├── audio/
    │   ├── narration.wav
    │   └── alignment.json
    │
    ├── planning/
    │   ├── narrative-beats.json
    │   └── visual-strategy.json
    │
    ├── scenes/
    │   ├── 001.json
    │   ├── 002.json
    │   └── ...
    │
    ├── assets/
    ├── animatic/
    ├── renders/
    ├── qc/
    ├── publishing/
    └── metadata.json
```

Episodes must remain reproducible.

---

# 12. Versioning

Use both:

```text
Git
+
human-readable production versions
```

Examples:

```text
script-v2
animatic-v3
final-v1
style-v1
```

Asset strategy:

Minor corrections may update an asset in place if backward compatibility is safe.

Substantial visual/style changes create a new asset version.

Episodes should explicitly record:

```text
engine version
style version
asset versions
scene versions
script version
audio checksum
render settings
approved AI outputs
```

Goal:

A future command conceptually equivalent to:

```bash
render episode-001 --version final-v1
```

should reproduce essentially the same episode.

---

# 13. Asset registry

Assets must not be addressed only by filenames.

Every reusable asset should have semantic metadata.

Example:

```json
{
  "id": "prop_phone_001",
  "category": "prop",
  "description": "Flat vector smartphone viewed from front",
  "tags": [
    "phone",
    "technology",
    "handheld"
  ],
  "styleVersion": "1",
  "currentVersion": "2"
}
```

The AI planner must be able to semantically search the asset registry.

Track which episodes/scenes use each asset.

---

# 14. Visual style system

Before serious animation work, create:

```text
docs/STYLE_GUIDE.md
```

Also create machine-readable theme/config data.

Define:

* semantic color roles
* palette
* outline widths
* corner radii
* character proportions
* head proportions
* eye system
* mouth system
* arrow system
* bubble system
* chart appearance
* typography hierarchy
* shadow rules
* safe areas
* spacing scale

Prefer:

```json
"color": "accent"
```

over:

```json
"color": "#F5A623"
```

Style compliance should be partially machine-validatable.

---

# 15. Asset-generation strategy

Core reusable assets:

Manually designed or carefully reviewed SVG components.

Episode-specific simple props:

Generate from structured geometric descriptions when practical.

Example:

```json
{
  "object": "drinking-glass",
  "geometry": [
    "rounded-trapezoid"
  ],
  "fillRole": "secondary",
  "outline": true
}
```

The engine should convert this to styled SVG.

AI-generated images may occasionally be used as visual references for complex one-off assets or compositions.

Do not make raster AI imagery a routine final visual layer.

No AI video generation in v1.

---

# 16. Character system

Build one main protagonist and generic secondary-human support.

Protagonist body pose library:

```text
standing
walking
sitting
thinking
pointing
holding-phone
opening-door
reaching
confused-body
carrying-object
```

Approximately 8–10 body poses are enough initially.

Face must be modular.

Separate:

```text
eyes
brows
mouth
```

Support expressions including:

```text
neutral
happy
confused
surprised
frustrated
thinking
worried
focused
```

Walking:

Use a simple four-frame walk cycle.

Do not build a sophisticated bone/IK animation rig in v1.

---

# 17. Mascot

Create one original abstract mascot.

It should not be human.

It may appear:

* in opening/transition moments
* during myth corrections
* for jokes
* for occasional explanatory interjections

It conceptually shares the narrator's voice.

Do not implement lip sync.

Use gestures, poses, expression-like states, and timing instead.

---

# 18. Parent/anchor system

This is a required engine feature.

Objects must support relationships such as:

```text
phone → protagonist.rightHand
hand → door.handle
memoryOrb → protagonist.contextAnchor
label → chart.bar.2
arrow → targetObject
```

Attachment should survive parent movement.

Do not fake all relationships using independent absolute coordinates.

---

# 19. Animation primitives

Implement approximately twenty deterministic animation primitives before full episode production.

Minimum expected set:

```text
fadeIn
fadeOut
slideIn
slideOut
scaleIn
pop
bounce
rotate
shake
wiggle
pulse
followPath
drawPath
countUp
highlight
stagger
expressionSwap
cameraPan
cameraPush
cameraFollow
```

Every primitive must have automated tests.

AI must not invent arbitrary easing functions.

Expose named easing styles:

```text
soft
snappy
bounce
linear
dramatic
```

Internally map them to tested easing curves.

---

# 20. Layout system

Prefer named layouts rather than arbitrary coordinates.

Initial layout set:

```text
center-character
character-left-object-right
character-right-object-left
two-column
three-item-row
diagram-center
full-screen-object
chart-focus
environment-wide
```

Support semantic positioning:

```json
{
  "relativeTo": "door",
  "placement": "left-of"
}
```

Also support raw coordinates as an escape hatch.

AI should prefer semantic positioning.

---

# 21. Scene schema

Every scene gets an individual JSON file.

Scene authoring level:

Medium-level.

AI controls meaningful creative decisions without micromanaging every pixel.

Example:

```json
{
  "id": "024",
  "purpose": "Show the protagonist forgetting after entering the kitchen",
  "emotion": "mild confusion",
  "importance": "medium",

  "duration": 5.4,

  "template": "character-environment",
  "layout": "environment-wide",
  "environment": "kitchen",

  "actors": [
    {
      "id": "protagonist",
      "position": "left-center",
      "expression": "confused"
    }
  ],

  "animations": [
    {
      "target": "protagonist",
      "action": "slideIn",
      "start": 0,
      "duration": 0.8,
      "easing": "soft"
    }
  ],

  "camera": [
    {
      "action": "push",
      "target": "protagonist",
      "start": 2.2,
      "duration": 1.5
    }
  ]
}
```

Include semantic metadata such as:

```text
purpose
emotion
importance
```

This metadata can later help regeneration and QC.

---

# 22. Scene editing

Small requested changes should produce patches.

Example user request:

> Make the confused reaction happen half a second earlier.

Do not regenerate the entire scene.

Major redesign requests may regenerate a scene definition.

The system should therefore support:

```text
patch
regenerate
```

as separate operations.

---

# 23. Custom-scene API

Most scenes must use templates.

Unusual scenes can use a controlled scene API such as:

```ts
scene.add()
scene.attach()
scene.move()
scene.rotate()
scene.scale()
scene.followPath()
scene.draw()
scene.mask()
scene.camera()
scene.text()
```

Try this controlled API before generating custom React.

Custom React/Remotion is the final escape hatch.

Decision rule:

```text
one-time special need → custom scene
likely reusable need → engine capability
unnecessary complexity → simplify the scene
```

---

# 24. Camera system

Support controlled camera choreography.

Required capabilities:

```text
pan
push-in
pull-out
follow-target
simple framing changes
```

AI may specify camera timing through the scene schema.

Do not implement arbitrary cinematic 3D cameras.

This remains a 2D explainer engine.

---

# 25. Chart system

Implement at least one reusable bar-chart component.

Required:

* animated bars
* labels
* values
* axis
* annotations
* highlighting
* optional icon/character interaction

Episode 1 intends to compare experimental conditions if appropriate data exists.

Do not invent chart values.

If research does not provide suitable quantitative evidence, change the visual rather than fabricating a chart.

---

# 26. Topic system

The dashboard should eventually maintain a topic bank.

Views:

```text
sortable table
Kanban
```

Possible scores:

```text
curiosity
visual potential
evergreen potential
research difficulty
production difficulty
```

However, the actual production pipeline must support starting from only:

```text
Why do we forget why we walked into a room?
```

The user should not need to fill a giant production form.

---

# 27. AI architecture

Use hosted AI APIs.

Do not architect v1 around local AI models.

Build a provider abstraction.

Conceptually:

```ts
llm.generate()
llm.structured()
embedding.search()
image.generate()
```

Do not couple core engine code to one AI vendor.

Use tiered models:

Cheaper/faster models for:

* extraction
* metadata
* classification
* routine formatting
* simple validation

Stronger models for:

* research synthesis
* outline
* script
* fact-check reasoning
* visual strategy
* difficult scene planning

Cache reusable responses aggressively.

---

# 28. Research pipeline

Topic input creates a research dossier.

Required dossier sections:

```text
QUESTION

MAIN EXPLANATIONS

SUPPORTED CLAIMS

UNCERTAIN OR DISPUTED CLAIMS

IMPORTANT EXPERIMENTS

USEFUL NUMBERS

COMMON MYTHS

VISUAL OPPORTUNITIES

DO NOT CLAIM

SOURCES
```

Research quality matters more than speed.

No fake papers, fake statistics, or unsourced scientific claims.

---

# 29. Approval gate 1: outline

The first mandatory human approval occurs after the outline.

Dashboard should present each section with:

```text
narrative purpose
claims
sources
uncertainties
preliminary visual opportunities
```

Production must not advance automatically beyond this point without approval.

---

# 30. Script pipeline

Use separate logical passes:

```text
research synthesis
        ↓
outline writer
        ↓
scriptwriter
        ↓
fact checker
        ↓
comedy pass
        ↓
clarity pass
```

These roles may use the same underlying provider/model.

Script style:

* highly accessible
* conversational
* curious
* lightly humorous
* scientifically careful
* easy to visualize

Once approved:

## SCRIPT LOCK

Scene planning should not casually rewrite approved narration.

---

# 31. Audio ingestion

The user supplies the final narration file.

Expected:

```text
audio/narration.wav
```

Store approved audio permanently.

Record:

```text
checksum
duration
sample rate
version
date
```

The engine should align the approved script against this audio.

Produce:

```text
alignment.json
```

The alignment should contain word or phrase timing.

Also detect meaningful differences between approved script and supplied audio.

Flag mismatches.

---

# 32. Three-stage scene planner

Never jump directly from script to full scene JSON.

Use:

## Stage 1: Narrative beats

Example:

```text
00:14–00:20

Character walks into kitchen.
Stops.
Realizes they forgot the purpose.
```

## Stage 2: Visual strategy

Decide:

```text
visual method
tone
literal vs conceptual
character vs diagram vs chart
transition type
possible visual joke
required assets
```

Visual interpretation may be literal or conceptual.

Micro-gags may be suggested by AI, but require approval during animatic review.

## Stage 3: Scene definitions

Generate individual scene JSON files.

This architecture is mandatory because it makes planning debuggable.

---

# 33. Animatic

The first full episode render should intentionally use rough assets/placeholders where needed.

It must use:

```text
the real final narration audio
```

Purpose:

Evaluate storytelling rather than polish.

The animatic should reveal:

* pacing
* scene rhythm
* explanation clarity
* humor timing
* mascot usage
* chart placement
* hero sequence
* transitions

---

# 34. Approval gate 2: animatic

The dashboard should combine:

```text
video player
timeline
scene cards
scene inspector
timestamped comments
```

User actions for a selected scene:

```text
approve
regenerate composition
change asset
change animation
change visual concept
edit parameters
edit JSON
natural-language edit
```

Natural-language example:

> Keep the kitchen, move the protagonist closer to the fridge, remove the banana gag, and make the memory orb fade more slowly.

The AI should generate a targeted patch.

Once animatic is approved:

## STRUCTURE LOCK

---

# 35. Asset production queue

After structure lock, scan all scenes.

Determine:

```text
existing assets
missing assets
asset versions
```

Missing assets should enter an approval grid.

Asset review UI:

```text
thumbnail/preview
name
type
metadata
style compliance
approve
reject
regenerate
inspect
```

Clicking an asset should expose limited editing:

* palette role
* stroke
* scale
* simple geometry parameters

Do not build an Illustrator clone.

---

# 36. AI scene repair

Invalid AI-generated scene data must not immediately require a human.

Required repair flow:

```text
GENERATED SCENE
      ↓
VALIDATION FAIL
      ↓
AUTO REPAIR #1
      ↓
FAIL
      ↓
AUTO REPAIR #2
      ↓
FAIL
      ↓
TEMPLATE FALLBACK
      ↓
FLAG FOR REVIEW
```

No unbounded agent retry loops.

---

# 37. Scene fallback hierarchy

Draft rendering should continue even when a scene fails.

Fallback chain:

```text
custom scene
    ↓
template equivalent
    ↓
static composition
    ↓
visible placeholder/error card
```

Final production renders have zero tolerance for known broken scenes.

Placeholders are for development and animatics only.

---

# 38. Validation

Build validation early.

Validate at least:

* schema correctness
* supported assets
* supported animation primitives
* animation timing
* scene duration
* attachment targets
* layout references
* text safe area
* missing media
* camera target validity

Validation should produce human-readable error messages suitable for feeding back into automatic repair.

---

# 39. Automated QC

Implement three QC classes.

## Technical

Examples:

```text
render failure
missing asset
invalid animation
timing overflow
unsupported action
```

## Visual

Examples:

```text
text clipping
text too small
asset outside frame
bad overlaps
unsafe margins
camera jump
```

## Editorial

Examples:

```text
long static section
repeated composition
visual unrelated to narration
excessive asset repetition
poor pacing
scene lacking meaningful visual change
```

Editorial QC may initially be heuristic/AI-assisted rather than perfect.

Present issues by severity:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Every issue should link to the corresponding scene/timestamp.

---

# 40. Dashboard

Home screen should prioritize episode pipeline state.

Example:

```text
Episode 001    Animatic Review
Episode 002    Research
Episode 003    Outline Approval
```

Primary navigation:

```text
Episodes
Topics
Assets
Renders
QC
Costs
Settings
```

---

# 41. Script editor

Build a scene-aware/narrative-beat-aware script editor rather than a plain textarea.

Eventually a narration block should connect to:

```text
research claims
source references
audio timing
narrative beats
scene IDs
```

Show:

```text
word count
estimated duration
actual supplied narration duration
target duration
```

---

# 42. Scene inspector

Required UI:

```text
scene preview
timeline position
scene JSON
assets
layout
actors
expressions
animations
camera
validation results
QC results
comments
```

This should be the main production interface.

---

# 43. Render behavior

Use Remotion for final composition/rendering.

Rendering initially happens locally.

Architecture should allow future render workers without changing scene semantics.

Draft render:

May contain fallback placeholders.

Final render:

Must require explicit human approval.

No final export while CRITICAL or unresolved HIGH blockers remain.

---

# 44. Sound

Narration is supplied externally.

The system should support:

```text
music tracks
sound effects
basic gain levels
timed sound cues
```

Typical episode:

2–3 music tracks.

Moderate SFX.

Examples:

```text
door
click
pop
whoosh
footstep
small impact
notification
transition
```

Do not add sounds to every movement.

Maintain a tagged local music/SFX library.

Allow external sourcing when local assets are insufficient.

Track license/source metadata where relevant.

---

# 45. Captions

Use both:

```text
approved script
+
audio alignment
```

Script is the textual source of truth.

Audio alignment supplies timing and detects deviations.

Generate at least:

```text
SRT
```

---

# 46. Publishing module

The first episode is not complete when `final.mp4` exists.

Produce a publish-ready package containing:

```text
final.mp4
captions.srt
thumbnail
title
description
source list
QC report
cost report
episode metadata
```

Create a basic title/thumbnail ideation and approval module inside the dashboard.

Keep thumbnail generation logically separate from the animation engine.

---

# 47. Cost tracking

Track every AI API call.

Record:

```text
provider
model
task
tokens/units
cost
episode
pipeline stage
cache status
```

Dashboard should eventually show cost by episode and production stage.

Use budget warnings.

Do not enforce hard budget cutoffs in v1.

Cache exact/reusable successful requests aggressively where appropriate.

---

# 48. Logging AI generations

Do not store every trivial discarded generation forever.

Persist:

* approved generations
* important rejected attempts
* generation metadata needed for reproducibility/debugging

---

# 49. Testing requirements

Every animation primitive must have automated tests.

Also implement visual regression testing.

Use both:

```text
reference-frame screenshots
short rendered video fixtures
```

Examples of things regression tests should catch:

* character unexpectedly shifts position
* stroke style changes
* text alignment breaks
* camera behavior changes
* attachment breaks
* chart rendering changes
* MemoryOrb changes unexpectedly

---

# 50. Engine test reel

Before building the complete first episode, produce approximately a **45-second internal test reel**.

Use mostly assets/scenes that can later become part of episode 1.

Suggested reel:

### 0–7 sec

Living room.

Protagonist remembers needing water.

MemoryOrb appears.

Tests:

```text
character
environment
orb
thought visualization
text
```

### 7–14 sec

Character gets up and walks toward door.

Tests:

```text
walk cycle
anchors
camera pan
object relationships
```

### 14–20 sec

Door interaction.

Tests:

```text
pose swap
hand/door relationship
camera follow
```

### 20–28 sec

Memory Rooms transition.

Tests:

```text
custom scene API
masking
context change
MemoryOrb state transition
camera choreography
```

### 28–34 sec

Kitchen confusion.

Tests:

```text
expression system
comedic pause
environment reuse
```

### 34–40 sec

Mascot myth correction.

Tests:

```text
mascot
typography
transition
```

### 40–45 sec

Mini chart.

Tests:

```text
chart
labels
numbers
animation
```

---

# 51. Architecture freeze criteria

Do not begin full episode production until the test reel satisfies all of the following:

```text
renders correctly
animation tests pass
screenshot regression tests pass
video regression tests pass
dashboard edits scenes successfully
natural-language scene patching works
asset validation works
scene repair works
fallback rendering works
QC runs successfully
final local rendering works
Windows/Linux assumptions are clean
```

Then declare:

# ARCHITECTURE FREEZE v1

After this point:

Fix bugs.

Do not casually redesign architecture during episode 1.

---

# 52. Blocker definition after freeze

Something qualifies as an architecture blocker only if it involves:

```text
required concept cannot be rendered
serious visual/render bug
invalid timing behavior
missing essential asset behavior
dashboard cannot repair/regenerate required scene
render/QC pipeline failure
```

Aesthetic nice-to-haves are not blockers.

---

# 53. Scope-control rule

Any new idea discovered during production must be classified.

Use:

```text
ONE-TIME NEED
→ custom scene

LIKELY REUSABLE
→ engine feature

UNNECESSARY COMPLEXITY
→ simplify

NICE TO HAVE
→ backlog
```

Do not build attractive engineering toys merely because they are possible.

The video is the customer of the engine.

---

# 54. First-episode scene targets

Do not force a fixed number of scenes.

Use approximately:

```text
4–7 seconds per meaningful visual beat
```

A 4–6 minute episode will likely produce roughly 50–70 visual scenes/beats.

Target:

```text
60–70% reusable templates
```

Allow:

```text
2–3 genuinely custom sequences maximum
```

If roughly half of the episode requires custom React code, treat that as evidence that the template/API design has failed.

---

# 55. Manual editing rule

Once actual episode production begins:

Normal scene fixes must happen through:

```text
dashboard
scene parameters
scene JSON
natural-language patching
```

Direct source-code modifications are allowed only for genuinely new engine capabilities or defects.

---

# 56. Final quality standard

Known broken scenes are not allowed in the final export.

However, do not pursue invisible frame-level perfection indefinitely.

Judge acceptable visual imperfections at normal playback speed.

Fix:

```text
all CRITICAL issues
all meaningful HIGH issues
```

Review MEDIUM issues contextually.

LOW issues may remain when they do not materially affect normal viewing.

---

# 57. Human QC procedure

Perform three reviews.

## Audio-only

Does the story make sense without visuals?

## Visual-only

Does the animation broadly communicate the narrative?

## Normal playback

Does the finished experience work?

Review the automated QC report alongside the normal playback pass.

---

# 58. First-video Definition of Done

Episode 001 is complete only when all of these exist:

```text
approved research dossier
approved outline
approved locked script
supplied final narration
verified audio alignment
approved animatic
approved final asset set
final animation
music/SFX mix
automated QC report
human QC approval
final MP4
captions
thumbnail
title
description
source list
production cost report
reproducibility metadata
```

---

# 59. First-video success metrics

After publishing, evaluate both the content and the production engine.

Audience metrics:

```text
CTR
audience retention
retention dips
retention spikes
comments
subscriber conversion
```

Production metrics:

```text
human hours
AI API cost
render time
scene regeneration count
manual scene fixes
custom-scene count
template percentage
missing-asset count
QC findings
source-code changes required
```

Do not judge the channel from a single video's audience metrics alone.

---

# 60. Postmortem

Every manual intervention should be assigned a category.

Suggested categories:

```text
missing asset
missing pose
bad layout
bad visual strategy
bad timing
missing animation primitive
character limitation
chart limitation
AI planning error
QC false positive
QC false negative
dashboard limitation
research problem
script problem
engine bug
```

Count these.

Use the data to determine what to improve.

Example:

If 17 scenes required manual framing changes:

Improve the layout system.

If walking looked slightly imperfect but caused no production delay:

Do not spend a week rebuilding walking.

If the same custom transition was needed six times:

Promote it to a reusable primitive.

---

# 61. Engine v1.1 rule

After episode 1:

```text
POSTMORTEM
    ↓
IDENTIFY TOP 3 BOTTLENECKS
    ↓
ONE FOCUSED IMPROVEMENT CYCLE
    ↓
ENGINE v1.1
    ↓
START EPISODE 2
```

Do not rewrite the entire engine after episode 1.

---

# 62. Explicit v1 non-goals

Do not build these before episode 1:

```text
full nonlinear video editor
Illustrator replacement
advanced skeletal animation
inverse kinematics system
generative video
local LLM infrastructure
cloud render farm
team collaboration
automatic YouTube uploading
multi-language dubbing
automatic music composition
dozens of chart systems
complex lip sync
fully procedural human generator
mobile application
```

If one becomes genuinely necessary, raise it explicitly rather than quietly expanding scope.

---

# 63. Implementation order

Follow this order unless a technical dependency proves it impossible.

## Milestone 0: Repository

Deliver:

```text
monorepo
TypeScript configuration
linting
formatting
tests
CI/basic verification
Windows/Linux-safe scripts
docs skeleton
```

Acceptance:

Fresh checkout installs and all checks pass.

---

## Milestone 1: Core scene runtime

Deliver:

```text
scene schema
scene loader
basic scene graph
timing model
Remotion composition
local renderer
basic SVG element rendering
```

Acceptance:

A JSON-defined scene renders to MP4.

---

## Milestone 2: Style + asset system

Deliver:

```text
theme
style rules
asset registry
semantic metadata
SVG loader
asset versioning
basic asset search
```

Acceptance:

Scene references assets by semantic asset ID and renders them with theme styling.

---

## Milestone 3: Layout + animation

Deliver:

```text
named layouts
semantic positioning
raw coordinate escape hatch
animation primitives
approved easing library
camera primitives
```

Acceptance:

Automated tests exist for every primitive.

Reference-frame tests pass.

---

## Milestone 4: Character system

Deliver:

```text
protagonist
pose library
modular face
expressions
four-frame walk
anchor points
basic secondary human support
```

Acceptance:

Character can walk, change expressions, interact with anchored props, and render repeatably.

---

## Milestone 5: Cognitive + chart systems

Deliver:

```text
MemoryOrb
ThoughtBubble
ContextBubble
bar chart
labels
annotations
```

Acceptance:

All components can be driven from structured scene data.

---

## Milestone 6: Controlled custom-scene API

Deliver:

```text
add
attach
move
rotate
scale
followPath
draw
mask
camera
text
```

Acceptance:

Memory Rooms prototype can be expressed without unrestricted React.

---

## Milestone 7: Database + dashboard foundation

Deliver:

```text
SQLite schema
episode pipeline
asset library
episode view
scene inspector
preview
JSON editing
parameter editing
render controls
```

Acceptance:

An episode can be created, scenes inspected, edited, and rendered without manually navigating filesystem internals.

---

## Milestone 8: Validation + repair + fallback

Deliver:

```text
schema validation
semantic validation
repair pipeline
fallback hierarchy
visible development placeholders
```

Acceptance:

Deliberately broken scenes do not crash a draft episode render.

---

## Milestone 9: AI orchestration

Deliver provider abstraction and pipelines for:

```text
research
outline
script roles
narrative beats
visual strategy
scene generation
scene patching
semantic asset search
```

Acceptance:

Starting from a topic, system can reach an outline approval gate.

After approved script/audio are supplied, system can produce initial scene definitions.

---

## Milestone 10: Audio alignment

Deliver:

```text
audio ingestion
checksum/versioning
script alignment
word/phrase timings
deviation detection
caption timing foundation
```

Acceptance:

Supplied audio can drive scene timing and captions.

---

## Milestone 11: QC

Deliver:

```text
technical QC
visual QC
initial editorial QC
severity system
timeline links
QC dashboard
```

Acceptance:

Known intentional defects are detected in test fixtures.

---

## Milestone 12: 45-second test reel

Build the defined test reel.

Do not add unrelated features.

Acceptance:

All architecture-freeze criteria pass.

Then freeze architecture.

---

## Milestone 13: Episode 001 production

Proceed through:

```text
research
outline approval
script
script lock
audio ingestion
alignment
beat planning
visual strategy
scene planning
animatic
animatic approval
asset finishing
final animation
sound
QC
captions
publishing package
```

---

# 64. Development behavior expected from Astra

Do not try to build the entire specification in one undifferentiated pass.

Work milestone by milestone.

For each milestone:

1. State the concrete deliverable.
2. Implement it.
3. Add tests.
4. Run the tests.
5. Run any relevant render fixture.
6. Report what passes and what remains.
7. Update documentation.
8. Do not silently broaden scope.

Prefer working software over theoretical abstractions.

Prefer deterministic behavior over AI cleverness.

Prefer a small reusable primitive over one giant “smart animation” function.

Prefer fixing the engine when a pattern repeats.

Prefer a custom scene when the need is genuinely unique.

Prefer simplifying the visual when complexity adds little explanatory value.

---

# 65. Important engineering principles

## Principle 1: AI plans, deterministic code renders

The LLM should not decide raw pixels.

It should output structured intent.

## Principle 2: Semantic data first

Prefer:

```text
character-left-of-door
```

to:

```text
x=318
```

when practical.

## Principle 3: Escape hatches remain available

Semantic systems must not prevent precise manual overrides.

## Principle 4: Reproducibility matters

Episode output should not silently change because an AI provider produced a different answer six months later.

Persist approved outputs.

## Principle 5: Fail visibly in development

A broken scene should become an obvious placeholder, not disappear silently.

## Principle 6: Final renders are strict

Development fallbacks must never leak into production.

## Principle 7: The first episode drives the engine

If functionality is not needed for the first episode or the defined test reel, question whether it belongs in v1.

---

# 66. First action

Start with Milestone 0.

Before implementing animation functionality, create:

```text
docs/ARCHITECTURE.md
docs/STYLE_GUIDE.md
docs/SCENE_SCHEMA.md
docs/ASSET_SYSTEM.md
docs/TEST_REEL.md
docs/NON_GOALS.md
```

`STYLE_GUIDE.md` may initially contain placeholders for creative decisions that require visual review.

Then scaffold the repository and prove:

```text
install
typecheck
lint
test
local dashboard start
minimal Remotion render
```

work on the target development environment.

Do not begin sophisticated character animation, AI orchestration, or dashboard polish until the basic scene-to-video path works.

The first technical proof should be:

```text
scene JSON
    ↓
scene runtime
    ↓
SVG composition
    ↓
Remotion
    ↓
MP4
```

Everything else builds on that path.

---

# 67. North-star acceptance test

At the end of v1, this workflow should be possible:

```text
User enters:
"Why do we forget why we walked into a room?"

System researches topic.

System generates sourced outline.

User approves outline.

System produces script through multi-pass pipeline.

User approves and locks script.

User supplies narration.wav.

System aligns script to narration.

System creates narrative beats.

System chooses visual strategies.

System creates scene definitions.

System finds reusable assets.

System identifies missing assets.

System creates rough full animatic.

User reviews it inside dashboard.

User edits scenes using controls or natural language.

User approves animatic.

System produces missing-asset queue.

User approves final assets.

System creates final animation.

System adds approved music/SFX configuration.

System runs automated QC.

User resolves flagged issues.

System renders final MP4.

System generates captions and publishing package.

Episode is reproducible later from stored versions.
```

If this workflow works and ordinary scenes require no source-code editing, Engine v1 has succeeded.

If the engine can produce only episode 001 because its implementation is hard-coded around that episode, Engine v1 has failed.

Build the system for reuse, but let episode 001 determine where reuse is actually valuable.
