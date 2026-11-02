# Art workspace

The Art website, shared sculpture language, and individual design records live together under `art/`. Use one chat per sculpture within the existing Surfsidepaint project. Use the saved design record to carry accepted decisions between chats.

## Sources and documentation

```text
art/
  AGENTS.md                         Sculpture engineering instructions
  README.md                         This workspace guide
  docs/
    atlas.md                        Shared language and atlas conventions
  index.html                        Art hub and Current development canvas
  styles.css                        Gallery and study styles
  shared/
    player.js                       Independent playback and canvas lifecycle
  sculptures/
    austin-rain-prototype/
      README.md                     Design record including Atlas v2
      index.html                    Standalone study page
      index.js                      Design mounting entry point
      model.js                      Adjustable geometry and illustration values
      motion.js                     Poses, stages, and cycle timing
      render.js                     Drawing and fixed camera
      assets/                       Create when publishable assets are needed
```

The [shared atlas](docs/atlas.md) defines terms used across designs. The [Austin Rain Prototype record](sculptures/austin-rain-prototype/README.md) contains its specific parts, forces, conditions, and open questions. Future sculptures use the shared language and create their own record; they do not inherit Austin's water mechanism or part assignments.

## Local iteration

From `/Users/jcountryman/Projects/surfsidepaint`, install with `npm ci` when needed. Reuse an existing preview server rooted here, or run `npm run preview` on its configured port when available. A static server needs no Art build: save and refresh to see changes. `npm run build` regenerates Home Services only.

- Art hub: `/art/`
- Austin Rain Prototype: `/art/sculptures/austin-rain-prototype/`
- Original references: `.local/art/austin-rain-prototype/references/`
- Temporary exports: `.local/art/austin-rain-prototype/renders/`

The `.local/` folders are ignored by the repository's local `.gitignore`. Publishable assets belong under the sculpture's own `assets/` directory. Tracked documentation and assets are public when this repository is published.

Change `model.js` for dimensions and part geometry, `motion.js` for movement, and `render.js` for appearance. The current study uses illustration units and prescribed animation, not calculated physical forces. Common playback controls live in `shared/player.js`.

Run `npm run typecheck`, `npm run check:syntax`, `npm run build`, and `npm test`. Art regression tests cover the loop, the coupling of blade and bowl movement, independent players, lifecycle cleanup, and page/module references. Check both pages in the browser before release.

## New sculpture and chat handoff

1. Choose a stable design slug and create `art/sculptures/<slug>/` on a `codex/` feature branch.
2. Create its `README.md` with the vision, part atlas, movements and outcomes, confirmed mechanism, assumptions, unresolved questions, and current accepted implementation.
3. Reuse the shared player and page styles. Use the existing study as a working example, replacing its geometry, motion, and record with the new design's own information.
4. Give each player unique canvas/description/timeline IDs; scope control queries to its root. Add the new module entry to its page. Add a gallery link when ready.
5. Preview locally, inspect the change, and record accepted decisions. Use Git commits for recoverable versions; retain a stable design directory.

A new chat can start with:

> Read the repository instructions, `art/AGENTS.md`, `art/docs/atlas.md`, and `art/sculptures/<slug>/README.md`. Continue from the saved accepted behavior. Here is the outcome or movement I want to change: …

At handoff, keep the design record current with material accepted decisions, remaining questions, and the distinction between the physical mechanism and what the animation actually implements. Publish only when the owner requests a release of that work.
