---
name: artifact-template-surfside-proposal-workflow
description: "Create Surfside work proposals from an address, photos, and intake answers using the approved 1693-Poli PDF and webpage design. Use when the user asks to create a proposal for a project address, names Surfside Proposal Workflow, selects this template, or invokes $artifact-template-surfside-proposal-workflow. Generate separate local projects, PDFs and static pages in the existing surfsidepaint GitHub repository, with review before publication."
---

# Surfside Proposal Workflow

Use the approved Surfside PDF and webpage design retained in this template.
The user explicitly selected the existing surfsidepaint GitHub Pages repository
for this workflow. Do not register a new hosted Site, change hosting providers,
provision R2, enable photo uploads, or deploy merely because this skill is invoked.

## Workflow

1. Read `artifact-template.json`. The retained source is `assets/source` relative
   to this skill. Its `_proposal-workflow` folder contains the complete generator and
   approved parameterized templates under `template/site` and `template/pdf`.
2. Locate the existing local surfsidepaint repository. Use the installed toolkit
   when present. If absent after a branch switch, restore missing files using
   `assets/source/_proposal-workflow/install.py --repo REPO --restore-missing`
   with the bundled Python interpreter. Never overwrite a different toolkit
   version without reviewing the difference.
3. Read the toolkit's `WORKFLOW.md` and `INTAKE.md` and follow them. Create a
   separate project branch from current origin/main, separate local project
   inputs and a per-project template snapshot. Ask only for missing facts.
4. Build a draft PDF and webpage. Render and inspect every PDF page, verify the
   browser interactions, and provide desktop and actual LAN preview URLs.
5. After content, terms and pricing are confirmed, build and review the final
   output. Publish to its own surfsidepaint.com URL only after user approval.
   Preserve other routes, unrelated local edits and all branches unless the user
   explicitly requests retirement. Verify the exact Pages deployment commit.

## Fidelity and source boundaries

Retain the approved logo, colors, contact cards, section headings, pricing rows,
PDF viewer, tap-to-open preview, download CTA and Before/After gallery layout.
New proposals begin with blank customer fields and prices. Never copy the Poli
contractor, customer photos, address, price, substrate exclusion or delivery fee.
Saved company contact information is the reusable default. Confirm project terms.
Private drafts and source photos remain local. Only approved PDFs, optimized
photos and the generated static webpage are published. Use the retained parameterized templates for new project content.
User instructions control content and requested changes.
