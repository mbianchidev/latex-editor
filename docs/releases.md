# Source releases and local build checks

[Documentation](README.md) | [Development](development.md)

## Current delivery model

The existing GitHub releases provide source archives; they do not attach desktop
installers. The repository builds its nginx and backend images locally with Compose.
There is no registry-publishing or desktop-packaging workflow in this checkout, and these
docs do not assume a prebuilt image, a signing service, or a notarized application.

Use [installation](installation.md) to build/run the source.
`API_VERSION` in `backend/app.py` describes the API and is separate from Git release tags.
The project's MIT license is in [LICENSE](../LICENSE); dependency/asset licenses still apply.

## Validate a source revision

Work from the intended clean revision and review its changes before building.
Keep `.env`, database files, encryption keys, compiler output, and personal documents out
of the release contents. Use disposable project data and a loopback-only port.

From the repository root:

```bash
git status --short
git diff --check
docker compose config --quiet
node frontend/test-warnings.js
docker compose build --no-cache
docker compose run --rm --no-deps -e DB_PATH=/tmp/latex-editor-release-tests.db backend \
  pytest --cov=. --cov-report=term-missing -v
docker compose up -d
docker compose ps
```

Both built images must exist and both services must start. Open the configured frontend,
compile a synthetic document with the documented working engines, download the PDF and ZIP,
and verify a saved project can be reopened. The stock CI also performs a real compile.
Follow [configuration](configuration.md#backups) when testing an upgrade from an older database.
Inspect failures instead of claiming success based only on an image tag.

Run `docker compose down --remove-orphans` after local checks; keep or deliberately remove
only the disposable data you created. No command above creates a Git tag, GitHub release,
or registry push.

## Publication is separate

Only a maintainer-approved release operation should choose a version/tag and publish it.
Describe tested changes and known limitations in release notes; do not claim signed
artifacts or platform coverage that was not produced and checked.

If distributed container images or desktop packages are introduced later, add an actual
local build/verification entrypoint under `scripts/` that reuses that release workflow,
validates its outputs, and keeps publication opt-in. A no-op release script or an invented
registry URL would not provide a working distribution.
