<!-- surfside-proposal-workflow:start -->
## Surfside proposal requests

For "Create a proposal for [address]", read `_proposal-workflow/WORKFLOW.md` and
`INTAKE.md`. The approved local version is 2.0.0: four-step visual editor and
interactive proposal site, with primary hero photos/thumbnails and NO Photo Gallery.

Before creating any new project folder, files or branch, show the address,
`_proposal-projects/<street-slug>/`, `codex/proposal-<street-slug>` and eventual
`https://www.surfsidepaint.com/<street-slug>/` URL; obtain explicit creation approval.
Then branch from current origin/main, preserving unrelated edits, and create a
blank project with its own `_template/` snapshot. Start the matching snapshot's
`proposal.py editor PROJECT --port AVAILABLE_PORT` for intake and live preview.
Use each existing project's own snapshot for revisions; do not migrate old jobs.

The editor and website lookup are local-only. Uploaded hero photos and contractor
logos are local editor inputs; visitor uploads, Cloudflare R2 and gallery features
are disabled. Only generated static proposal bundles may be published after
separate approval of the concrete final result. Keep branches unless asked to
retire them. Never include unrelated changes, especially `homes/index.html`.

The user authorized releasing the v2 toolkit to the existing repository. Preserve
subsequent local changes and this guidance across branch switches. The personal skill's retained backup
also contains v2.0.0. If the toolkit is missing, restore it using the personal
backup's assets/source/_proposal-workflow/install.py --repo REPO --restore-missing.
Review versions and preserve modifications before replacing any toolkit.
Do not run tests, checks or builds during design iteration unless authorized.
New customer proposals still require explicit creation and publication approval.
<!-- surfside-proposal-workflow:end -->
