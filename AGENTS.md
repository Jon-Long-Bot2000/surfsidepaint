<!-- surfside-proposal-workflow:start -->
## Surfside proposal requests

When the user asks to create a proposal for an address, use the approved Surfside
proposal workflow. Read `_proposal-workflow/WORKFLOW.md` and `INTAKE.md`. This
applies in new chats without needing the old Poli conversation.

The user's saved workflow starts from current `origin/main`, creates a distinct
`codex/proposal-<slug>` branch and `_proposal-projects/<slug>` local source folder,
asks only for missing details, generates a PDF and static webpage, and provides
desktop and mobile preview URLs. Obtain approval for the concrete final proposal
before publishing that project to its own URL. Keep branches unless asked to
retire them. Never include unrelated local changes, especially `homes/index.html`.

Every project retains its own `_template/` snapshot. Use that snapshot for
revisions. Do not reuse a different customer's details, prices, terms or images.
Photo uploads and Cloudflare R2 are disabled. Publish only generated static files.

If `_proposal-workflow` is absent after switching to a branch based on main,
restore the toolkit from the personal Surfside Proposal Workflow template at
`~/.codex/skills/artifact-template-surfside-proposal-workflow/assets/source/_proposal-workflow`
using its `install.py --repo REPO --restore-missing` command. Do not replace
existing toolkit files without checking their version. The personal template is
the durable backup while this workflow branch awaits incorporation into main.
<!-- surfside-proposal-workflow:end -->
