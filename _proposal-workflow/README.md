# Surfside proposal workflow — version 2.0.0

The approved local editor and interactive proposal design are now the source for
new projects. Existing projects keep their own `_template` snapshot and are not
migrated or regenerated. No Photo Gallery is included; Project supports primary
hero photos and additional thumbnails.

Start a new Codex chat with **Create a proposal for [address]**. Codex reads
`WORKFLOW.md` and requests explicit approval for the address, source folder,
branch and URL before creating anything. Slugs use the street address alone.

After creation approval, from the surfsidepaint repository:

```sh
python3 _proposal-workflow/proposal.py new "123 Oak Street, Ventura, CA" --slug 123-oak-street --confirm-create
python3 _proposal-projects/123-oak-street/_template/proposal.py editor _proposal-projects/123-oak-street --port 4176
```

The editor prints its local URL and visitor preview URL. Four steps collect
Project, Prepared for, Scope & options, and Details & terms. Website lookup uses
only the local editor backend; suggestions need review before applying. Missing
results can be entered manually. Some websites block extraction or render their
information only with JavaScript. A logo can always be uploaded manually.

Drafts save into `proposal-details.json`, not shared browser storage. Images are
stored as local relative assets. Saves invalidate previous terms/pricing approval.
No endpoint creates a branch, commits, publishes, or changes the project identity.
The editor is loopback-only and is not designed as a remotely hosted admin tool.

Use the matching project snapshot for all commands:

```sh
python3 _proposal-projects/123-oak-street/_template/proposal.py intake _proposal-projects/123-oak-street
python3 _proposal-projects/123-oak-street/_template/proposal.py build _proposal-projects/123-oak-street
python3 _proposal-projects/123-oak-street/_template/proposal.py serve _proposal-projects/123-oak-street --port 4177
```

Python needs Pillow and pypdf; final PDF exports use Node.js with locally bundled
pdf-lib, and Poppler `pdftoppm` renders the review pages. No network dependency/CDN
is needed by the visitor page. Use the installed/bundled runtimes as available.
JPG, PNG and WebP are supported in the editor; convert HEIC locally first.

`build` writes `output/site/`, `output/pdf-pages/` and a fingerprinted
`output/build.json`. The default PDF and every visitor-selected PDF use the same
renderer. `serve` prints desktop and actual LAN/mobile URLs for the generated
static site. The private editor API is never shared on the LAN.

For final generation, confirm pricing/terms in the source data and explicitly
record approved omissions. `--final` refuses incomplete intake. `check` verifies
staleness/output integrity; `stage` retains the original protections against draft,
stale, modified or colliding output. Run checks only when authorized; no testing
or builds during design iteration. Publication remains a separate approval.

```sh
python3 _proposal-projects/123-oak-street/_template/proposal.py build _proposal-projects/123-oak-street --final
python3 _proposal-projects/123-oak-street/_template/proposal.py check _proposal-projects/123-oak-street
# Only after explicit publication approval:
python3 _proposal-projects/123-oak-street/_template/proposal.py stage _proposal-projects/123-oak-street --repo .
```

Only the generated static bundle can be staged at `/<slug>/`. Editor templates,
backend, intake JSON, original assets, runtime data and snapshots stay local.
Public `data.mjs` contains the confirmed display content needed for interactive
PDFs, so treat a published proposal and all available options as public. Noindex
is a search preference, not access control. Visitor uploads and R2 stay disabled.

The user authorized the v2 toolkit release to the existing repository. Preserve
any subsequent local modifications across branch switches. The personal Surfside Proposal Workflow
backup also retains v2.0.0, including editor, renderer, static assets and instructions.
If the installed toolkit is absent, restore it with the retained install.py
--repo REPO --restore-missing; review differences before replacing any version. The old v1 test fixtures have not been run
or revised for this design; final integration verification is deferred.
