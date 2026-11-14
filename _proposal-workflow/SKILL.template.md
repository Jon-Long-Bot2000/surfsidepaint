---
name: artifact-template-surfside-proposal-workflow
description: "Create Surfside proposals using the approved v2 four-step local editor and interactive proposal design. Use for Create a proposal for [address], Surfside Proposal Workflow, or this template. Keep customer sources separate, require approval before project creation and publication, and use the existing surfsidepaint repository."
---

# Surfside Proposal Workflow

Version 2.0.0 is the approved editor/design source for new proposals. Read
`artifact-template.json`, then `assets/source/_proposal-workflow/WORKFLOW.md`,
`INTAKE.md` and `defaults.json`. Follow the retained implementation, not the old
1693-Poli gallery design. Customer projects retain their own template snapshots.

## Start and restore

Locate the existing surfsidepaint repository and use its installed toolkit when
present. If absent, restore missing v2 files using the retained
`assets/source/_proposal-workflow/install.py --repo REPO --restore-missing`.
Compare versions first; never overwrite a different toolkit or unrelated edits.
Preserve uncommitted workflow changes across Git branch switches.

For "Create a proposal for [address]", first show the address, street-derived URL
slug, `_proposal-projects/<slug>/`, `codex/proposal-<slug>` branch, and eventual
`https://www.surfsidepaint.com/<slug>/` URL. Obtain explicit creation approval
BEFORE creating any branch, project directory or files. The trigger phrase alone
is not approval. Only then fetch origin, branch from current origin/main and run
`proposal.py new ADDRESS --slug SLUG --confirm-create`. Keep existing branches.
Use the new project's `_template/` snapshot for all later commands and revisions.
Never copy another customer's information, price, photos or specific commitments.

## Approved intake and visitor design

Launch the project's snapshot `proposal.py editor PROJECT --port AVAILABLE_PORT`.
The private editor is loopback-only and saves to that project's source JSON and
assets. Its four steps are Project, Prepared for, Scope & options, Details & terms.
New customer fields and prices start blank; the date defaults to today in
America/Los_Angeles. Only the approved proposal terms are prefilled. Other details
are optional and blank sections are hidden. Confirm prices and terms before final
use; never infer commitments, fees, warranties or payment arrangements.

Project supports multiple hero photos, a selected primary and additional hero
thumbnails. Prepared for supports optional website lookup with review before
applying suggested details, manual entry, and a contractor logo in its card.
Options have alternative full prices and additive extras, each with a price type.
Visitor selections update the scope, price and downloadable PDF. Preserve the
approved compact hero, paint-house icon, near-equal columns, directional arrow,
rounded cards, and preview header with left label, centered logo and right PDF CTA.
There is NO Photo Gallery, Before/After component, gallery dialog/script, or fifth
Photos step. Visitor uploads and R2 stay disabled; editor image inputs are local.

Keep the editor, lookup backend and source JSON out of public output. Publish only
approved generated static bundles at the existing repository's project route.
The default PDF and browser-generated selected PDF share the same renderer.
The screen preview trims unused bottom space; downloads retain normal letter size.

## Review and publication boundaries

Ask only for missing facts; read the project's intake report. During design
iteration do not run tests, checks or builds unless authorized. Final verification
must also be authorized if the no-check instruction remains active. Before a
real submission, review every rendered PDF page and visitor interactions. Do not
claim verification that has not happened.

Obtain separate approval for the concrete final proposal before committing,
merging, pushing or publishing. Existing customer proposals are unchanged by a
workflow/template update. No contractor email or notification is authorized.
The v2 toolkit release to the existing repository is authorized. This does not
authorize new customer publication, hosted editors, new hosting providers, cloud
resources, recurring services, R2 or visitor uploads. Preserve unrelated
files, especially homes/index.html. Do not provision a new hosted Site merely
because this personal template is used. User instructions control requested edits.
