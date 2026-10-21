# Configuration and data

[Documentation](README.md) | [Installation](installation.md)

## Compose settings

Copy [`.env.example`](../.env.example) to `.env` at the repository root.
After changing values, run `docker compose up -d` to recreate affected services.
These settings are wired through the supplied [Compose file](../docker-compose.yml):

| Variable | Default | Meaning |
|----------|---------|---------|
| `LATEX_EDITOR_PORT` | `80` | Published frontend port; use `127.0.0.1:8080` for local-only access |
| `LATEX_EDITOR_DATA` | `${HOME}/.latex-editor/data` | Host directory bind-mounted to backend `/data` |
| `COMPILE_TIMEOUT_SECONDS` | `60` | Wall-clock seconds allowed per compile |
| `MAX_REQUEST_BYTES` | `36700160` (35 MiB) | Maximum API request body, including JSON/Base64 overhead |
| `MAX_COMPILE_BYTES` | `26214400` (25 MiB) | Combined decoded source/asset bytes per compile |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | Empty | Optional environment-provided Fernet key |
| `GITHUB_TOKEN_KEY_PATH` | Empty | Generated-key path inside the backend; defaults beside the database |

`.env` provides values for Compose interpolation. It does **not** automatically expose
every variable to the container. The frontend has no `VITE_*` configuration or build step;
it calls the same-origin `/api/v1` path.

nginx independently limits request bodies to `35m`. Raising `MAX_REQUEST_BYTES` requires
updating `client_max_body_size` in [nginx.conf](../frontend/nginx.conf) and rebuilding the
frontend. Base64 increases binary size, so a project below the decoded compile limit may
still exceed the request limit.

The backend's Gunicorn timeout is 90 seconds; nginx API proxy read/send timeouts are 95
seconds. Larger compile timeouts need compatible settings in the
[backend Dockerfile](../backend/Dockerfile) and nginx configuration.

## Additional backend settings

These are read by [app.py](../backend/app.py), but are not forwarded from `.env` by the
supplied Compose file unless stated. Add them explicitly to the backend environment in
a local Compose override, or set them when running the backend directly.

| Variable | Default | Meaning |
|----------|---------|---------|
| `MAX_PROJECTS` | `50` | Number of saved projects |
| `MAX_COMPILE_FILES` | `1000` | Files accepted in a compile request |
| `MAX_COMPILED_PDF_BYTES` | `52428800` (50 MiB) | Maximum generated PDF size |
| `COMPILE_MEMORY_BYTES` | `1610612736` (1.5 GiB) | Address-space limit when `prlimit` is available |
| `MAX_DOCUMENTS` | `100` | Number of legacy in-memory documents |
| `MAX_DOC_CONTENT_LENGTH` | `1048576` | Legacy document content length in characters |
| `CORS_ORIGINS` | `http://localhost,http://localhost:80` | Comma-separated allowed origins |
| `DB_PATH` | `/data/projects.db` in Compose | SQLite path; Compose explicitly sets this |
| `PORT` | `5000` | Direct `python app.py` listener; Compose sets 5000 |
| `DEBUG` | `false` | Direct Flask debug mode; Compose explicitly disables it |

Use positive integers for limits and preserve the trusted-user deployment boundary.
`PORT` does not override Gunicorn's command-line bind setting.
For example, an optional `docker-compose.override.yml` could forward a different project cap:

```yaml
services:
  backend:
    environment:
      MAX_PROJECTS: "100"
```

Compose loads that override alongside `docker-compose.yml`. Do not commit local secrets.
Review `docker compose config` locally, but do not share its full output if it includes keys.

Outside Compose, set an absolute `DB_PATH` before importing the backend. Without it, the
backend first uses `/data/projects.db` if `/data` exists; otherwise it currently uses a
legacy `seclaw/seclaw.db` path under macOS Application Support, Windows `APPDATA`, or Linux
`XDG_CONFIG_HOME` (default `~/.config`). Do not rely on these legacy defaults for tests.

## Limits

Other current caps are implementation constants, not `.env` options: project names are
at most 128 characters, document titles 256 characters, and GitHub imports 500 files / 7 MiB
of decoded content. There is no paid quota system, but these limits remain enforced.

Rate limits use the client IP and process-local memory:

| Route group | Limit per minute |
|-------------|------------------|
| Compilation, PAT operations, and project writes | 30 |
| Project reads and legacy document collection | 60 |
| GitHub proxy | 120 |
| Routes without an explicit override | 200 |

Counters reset with the process; multiple workers would not share them.
The supplied Gunicorn setup uses one worker and four threads.
The API's `/api/v1/settings` endpoint exposes selected limits; see [API reference](api.md).

Compiles disable shell escape, project `latexmk` rc files, and unrestricted TeX file access.
Time limits always apply; Linux resource limits depend on `prlimit`.
These are restrictions, not a claim of strong isolation for hostile multi-tenant workloads.
Authentication, per-user access, and a compiler job queue are not implemented.

## Storage

Projects, files, engine choices, and GitHub source links are stored in SQLite.
Binary project files use Base64 in the database. The default host file is
`~/.latex-editor/data/projects.db`; `/data/projects.db` is its container-side path.
The sidebar shows the backend path and database size.

The legacy `/api/v1/documents` API is different: it stores documents in process memory
and loses them on restart. Browser preferences/recovery data are not the authoritative
store for named projects.

Changing `LATEX_EDITOR_DATA` selects another directory; it does not copy or migrate data.
Stop the stack, back up the existing directory, copy the database and required key to the
new location, update `.env`, then restart and verify the project list.
The backend entrypoint adjusts ownership of the mounted directory for its `appuser`.
Use a dedicated directory, not a shared system folder.

## GitHub credential encryption

The instance-wide PAT is encrypted with Fernet before storage and is not returned by the
API. Repository links are separate per-project data.
With no `GITHUB_TOKEN_ENCRYPTION_KEY`, the app creates a `0600` key file alongside the
database, normally `/data/projects.github-token.key`.
A full data-directory backup then contains both ciphertext and its decryption key.

For separate key custody, generate a key after building the backend:

```bash
docker compose run --rm --no-deps backend python -c \
  "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Save the output as `GITHUB_TOKEN_ENCRYPTION_KEY` in private `.env` configuration before
saving a PAT. Do not paste the generated value into an issue, log, or commit.
Retain the key separately from database backups. Changing/losing it requires reconnecting
the PAT; it does not re-encrypt the old credential automatically.

`GITHUB_TOKEN_KEY_PATH` names an in-container path, not a host path. If customized, make
it writable and persistent; paths outside `/data` need their own mount.
See the [security policy](../SECURITY.md) for the reporting and key-storage guidance.

## Backups

For a filesystem copy, stop the stack before backing up its dedicated data directory,
or use SQLite-aware backup tooling. SQLite uses WAL mode, so copying only an active
`projects.db` without its journal state is not a reliable live backup.
Also retain the encryption key in the appropriate separate location.

Restore only while the stack is stopped. Preserve the previous copy, restore the intended
data/key, then check health, project contents, compilation, and GitHub connection status.
Exporting a project ZIP provides a portable file copy but not the instance's settings,
GitHub credential, or every project's metadata.

`docker compose down --remove-orphans` leaves the host data intact. Removing or changing
that directory is a deliberate data operation, not part of ordinary uninstall or repair.
