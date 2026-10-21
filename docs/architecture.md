# Architecture

[Documentation](README.md) | [Development](development.md) | [API reference](api.md)

## Request and data flow

```text
Browser: textarea editor, project/file UI, PDF.js, JSZip
    |
    | same-origin HTTP
    v
nginx: static assets, request limits, proxy headers
    |
    | /api/* and /health, internal port 5000
    v
Flask/Gunicorn: validation, rate limits, project API, GitHub proxy
    |                       |
    v                       v
SQLite at /data         temporary TeX workspace -> latexmk -> PDF
```

The [Compose file](../docker-compose.yml) publishes only nginx. Backend port 5000 is
exposed to the internal network, not mapped to a host port. The supplied runtime has
one Gunicorn worker and four threads. There are no WebSockets or collaboration server.

## Frontend

`frontend/index.html`, `styles.css`, and `app.js` implement the workspace without a
framework or bundler. The active source editor is a textarea with command completion,
line numbers, and warning navigation. Although CodeMirror assets/styles remain in the
page, the current code does not instantiate it as the editor.

PDF.js renders actual compiled PDF bytes to canvases; it does not turn LaTeX into HTML.
There is no selectable PDF text/accessibility layer in the current preview.
JSZip imports/exports project files and binary assets. Browser-loaded vendor assets and
fonts require external CDN access.

Named projects are authoritative in backend SQLite. Edits schedule a five-second debounced
save; Auto optionally schedules compilation after one second. Browser `localStorage`
retains preferences and a recovery copy, which can omit large binaries.
PDF downloads reuse the successful preview result unless edits require recompilation.

## Persistence and GitHub

SQLite stores projects, project files, source links, and encrypted instance secrets.
Binary files are represented as Base64; foreign keys cascade project-file deletion.
The schema uses WAL mode, and startup performs existing additive column migrations.
The legacy document API instead uses a locked in-memory dictionary.

GitHub sync uses an allowlisted backend proxy to `api.github.com`.
The saved PAT is encrypted with Fernet. Project links record repository, folder, branch,
the last seen commit, and a file manifest. Pull replaces local files; commit creates Git
objects and updates the linked branch only if its baseline has not changed.
This is manual folder synchronization, not a general Git client or pull-request workflow.

## Compiler boundary

Compile requests accept a full file map and a main `.tex` file or a single source string.
The backend validates and decodes files, writes a fresh temporary workspace, and invokes
`latexmk` from the main file's directory with the chosen engine.
It disables rc files and shell escape, sets restrictive TeX file-access variables, and
enforces a timeout. When available, `prlimit` constrains memory, CPU time, and open files.
Timeout handling terminates the compiler process group, and temporary files are cleaned up.

Successful responses contain raw PDF bytes plus page-count, engine, and timing headers.
Failures include bounded compiler output and extracted source diagnostics.
Each request starts a fresh workspace; persistent build caching, queueing, and concurrent
project collaboration are not implemented.

These controls do not turn the shared service into a hostile-workload sandbox.
It has no user authentication or per-user storage/credential isolation.
See [configuration](configuration.md) for actual limits and deployment precautions.

## Repository map

| Path | Responsibility |
|------|----------------|
| `frontend/app.js` | Editor/project state, persistence requests, PDF rendering, and GitHub sync |
| `frontend/latex-warnings.js` | Lightweight source-warning heuristics |
| `frontend/test-warnings.js` | Dependency-free Node warning-parser tests |
| `frontend/index.html`, `frontend/styles.css` | UI structure and styles |
| `frontend/nginx.conf`, `frontend/Dockerfile` | Static serving, proxying, and frontend image |
| `backend/app.py` | Flask routes, SQLite schema, token handling, and compilation |
| `backend/test_app.py` | API, persistence, validation, and mocked compiler/GitHub tests |
| `backend/requirements.txt`, `backend/Dockerfile` | Python dependencies and Linux TeX toolchain |
| `backend/entrypoint.sh` | Data-directory ownership and dropping to `appuser` |
| `docker-compose.yml`, `.env.example` | Service orchestration and supported interpolation settings |
| `.github/workflows/` | Tests, image/Compose verification, and CodeQL |
| `docs/` | User and developer documentation |

## Design principles and future work

Keep the interface simple, surface advanced controls only where needed, and avoid changes
that make large documents unresponsive. Preserve accurate PDF output over approximations,
keyboard/screen-reader access, useful diagnostics, self-hosted storage, and no default
analytics instrumentation. CDN requests still disclose ordinary network metadata.

Extensibility, themes, configurable keybindings, collaboration, and document history are
goals, not current architectural components. See the [roadmap](roadmap.md).
