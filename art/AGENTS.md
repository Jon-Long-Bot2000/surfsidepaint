# Art and kinetic sculpture instructions

These instructions apply to `art/` and its descendants, together with the repository's root `AGENTS.md`.

## Read before sculpture work

1. Read `art/README.md` for the file structure and preview workflow.
2. Read `art/docs/atlas.md` for the shared language and reference conventions.
3. Read `art/sculptures/<design-slug>/README.md` for the selected sculpture's atlas, confirmed mechanism, accepted behavior, and unresolved questions.

Shared vocabulary belongs in `art/docs/atlas.md`. Each sculpture has one canonical design record beside its source. Keep design-specific mechanisms out of the shared definitions. Update a record when the owner confirms a material decision; distinguish confirmed physical behavior, desired behavior, illustrative assumptions, and unimplemented mechanisms.

## Implementation

- Keep sculpture work in this website repository. Do not use or modify SSHS.
- Use one stable lowercase, hyphenated folder per design under `art/sculptures/`.
- Give each study its own page and independently mounted canvas. `/art/` can feature a study using the same modules.
- `model.js` owns adjustable geometry; `motion.js` owns poses and stage timing; `render.js` owns drawing; `index.js` mounts the design using `art/shared/player.js`.
- Scope controls and queries to each player root. Give labels and descriptions unique IDs per page/instance. A second canvas must not operate the first canvas's controls or clock.
- Preserve accepted appearance and motion during organization/refactoring. Do not replace prescribed animation with a physics simulation without establishing the inputs and intended change.
- Preserve atlas IDs. IDs are scoped to a design; use the design slug when referencing multiple designs. Blade and lever tip are features of one slat, not independent rigid bodies.
- Keep the static HTML/CSS and native JavaScript module approach. No new framework or dependencies are needed for this structure.

## References and checks

- Put publishable assets in the selected design's `assets/` folder when needed.
- Original references and temporary exports belong in ignored `.local/art/<design-slug>/references/` and `renders/`. Do not put unpublished/private references in tracked page assets or documentation.
- Serve the repository root. Use the existing suitable preview server or an unused port; preserve other servers.
- Run the root project's required checks plus the Art tests. Inspect the gallery and study page, mobile/desktop layout, stage controls, keyboard timeline, reduced motion, module paths, and navigation.
- Use a `codex/` branch. Publishing requires release authorization for the current change; earlier releases do not authorize later changes.
