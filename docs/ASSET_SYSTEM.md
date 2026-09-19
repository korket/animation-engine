# Asset System

Milestone 2 uses a local, versioned catalog in `packages/assets/catalog.json`.
Each asset has a semantic ID, explicit version, style-contract version, category,
description, tags, SVG file, SHA-256, and creator/source/license provenance.
The file path is a storage location, not its identity. Lookup requires an exact
ID and version; there is no implicit latest-version fallback.

`searchAssets` performs case-insensitive AND-word matching over IDs, descriptions,
and tags, with exact category/style-version filters. Results are ordered by ID
and numeric version, independent of catalog order or locale. This is lexical
search over semantic metadata, not embeddings or an AI service.

`loadAssetLibrary` (Node-only) reads the catalog, checks paths remain inside its
directory after symlink resolution, verifies source checksums, and parses SVG.
Studio bundles those same source files. Catalog/artwork changes must pass the
Node loader tests before acceptance. Source SVG bytes use LF. Do not rewrite an
existing version's artwork to change approved output; add a new version and hash.

SVG support is deliberately restricted: one `svg` root with `viewBox="0 0 w h"`,
untransformed `g` groups, rectangles, circles, and lines. Geometric attributes
are explicit finite numbers. Fills/strokes use `role:<name>` or `none`, outlined
shapes require `stroke-width="token:outline"`, and rounded rectangles use
`rx="token:corner"`. Paint and tokens resolve through an exact theme version.
Unsupported markup, attributes, XML errors, scripts, external resources, text,
CSS, transforms, paths, gradients, and embedded raster images fail visibly.
Parsed geometry becomes typed data; the renderer never inserts arbitrary SVG markup.

The pinned `@xmldom/xmldom` dependency supplies XML parsing instead of a custom
regex parser. All parser warnings/errors are fatal, following the
[maintainer's error-handling guidance](https://github.com/xmldom/xmldom/security/advisories/GHSA-6h8r-xr42-gp59).
The project validates its narrower supported SVG dialect after XML parsing.

Theme versions pin palette, outline width, and corner radius. `styleVersion`
identifies the compatible role/token contract; it is separate from a theme's
visual version. Assets and themes must agree on that contract. The supplied
phone and book are original geometric fixtures; both themes are review candidates.
No asset generation, remote search, persistence, or episode registry is introduced.
