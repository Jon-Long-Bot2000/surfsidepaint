# Current release: static gallery only

Photo uploads and all shared-gallery API requests are disabled for the initial
production release at the user's request. No Worker or R2 bucket is deployed.
The existing Before photos are served by GitHub Pages; After shows its placeholder.
Backend files below are retained for future work. A billing alert is not an
automatic usage cutoff. Do not enable the backend until cost controls are tested.

# Shared gallery upload service

The GitHub Pages frontend uses this Cloudflare Worker and an R2 bucket for shared
photo uploads. No sign-in is required, per the user's instruction. The service
provides GET/POST `/api/gallery` and GET `/api/gallery/photos/<id>.jpg`. There is
no public delete or overwrite endpoint. Each upload receives an independent UUID.

The browser resizes photos to at most 1800 pixels and creates 640-pixel thumbnails
before upload. The Worker accepts JPEG images only, validates dimensions, limits
requests to 8 MB, and restricts browser origins to the configured project hosts.
R2 stores both images and their stage/dimension metadata. Lists are paginated.

## Local preview

Run the bundled Python interpreter with `tools/preview_server.py --port 4173` from
the project working folder. It serves the page and shared upload API on the same
port. Uploaded files persist under `.gallery-data/`, which is excluded from Git
and the deployment bundle. Both localhost and LAN clients see the same records.
The page refreshes shared photos every 15 seconds while visible.
In the tracked deployment folder, the same server is `backend/preview_server.py`.

Run the service tests with `node --test backend/worker.test.mjs`. Local browser QA
also covered both native file pickers, image conversion, stage separation, new
photos in the lightbox, invalid-file recovery, and persistence from a separate
LAN-origin browser session. Temporary upload test records were moved out of the
shared gallery after verification.

## Publishing after approval

1. Select the intended Cloudflare account and enable R2 if needed. This step and
   any billing/account activation require the user's approval; none was performed.
2. Create the `surfsidepaint-1693-poli-photos` bucket and deploy the Worker using
   `wrangler deploy --config backend/wrangler.jsonc`.
3. Set `gallery-config.json`'s `apiBase` to the returned Worker URL followed by
   `/api/gallery`. The local value `/api/gallery` is for the preview server.
4. Validate a real upload from the production origin, then publish the approved
   `1693-Poli` branch changes to `main` through the existing GitHub Pages workflow.

The production frontend must not be released with the local API URL: GitHub Pages
cannot handle the POST requests. No Worker, R2 bucket, or production change has
been deployed as part of local development.
