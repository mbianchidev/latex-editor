# API reference

[Documentation](README.md) | [Architecture](architecture.md)

The browser uses same-origin `/api/v1` routes through nginx; health is `/health`.
Use the configured frontend URL, not an exposed backend port.
Requests use JSON unless noted. Errors generally contain an `error` string.
There is no application authentication: restrict access to trusted clients.

## Discovery

| Method and path | Result |
|-----------------|--------|
| `GET /health` | Service, API version, and health status; does not run a TeX compile |
| `GET /api/v1/status` | API version and endpoint list |
| `GET /api/v1/settings` | Storage path/size, selected limits, engines, and PAT status; no plaintext PAT |

`API_VERSION` in `backend/app.py` is API metadata, not a promise that it matches a release tag.

## Compilation

`POST /api/v1/compile` accepts a file map:

```json
{
  "files": {
    "main.tex": "\\documentclass{article}\\begin{document}Example\\end{document}",
    "example.bin": {
      "isBinary": true,
      "content": "ZXhhbXBsZQ=="
    }
  },
  "main_file": "main.tex",
  "engine": "xelatex"
}
```

Text files are strings; binary files use Base64 and `isBinary: true` (the compatibility
shape `type: "binary"` is also accepted). Paths must be safe relative paths.
The main file must exist, be text, and have a `.tex` extension.
The file-map default main filename is `main.tex`; the default engine is `xelatex`.

For a single document, use `latex` instead of `files`:

```json
{
  "latex": "\\documentclass{article}\\begin{document}Example\\end{document}",
  "engine": "xelatex"
}
```

This form defaults to `document.tex`. Engines are `pdflatex`, `xelatex`, or `lualatex`;
see the [LuaLaTeX limitation](troubleshooting.md#lualatex-initialization-fails).
Compilation does not create a saved project.

Success returns HTTP 200 with raw `application/pdf` bytes, not JSON:

- `X-Page-Count`: generated PDF page count.
- `X-Compile-Time-Ms`: compile duration.
- `X-LaTeX-Engine`: selected engine.
- `Content-Disposition`: inline PDF filename.
- `Cache-Control: no-store`.

| Status | Meaning |
|--------|---------|
| `400` | Invalid source, path, main file, binary data, or engine; includes `details` |
| `413` | Request or decoded project exceeds a limit |
| `422` | TeX failed; includes `errors` and bounded `log` |
| `429` | Rate limit |
| `503` | Compiler unavailable |
| `504` | Compile timeout |

An error entry has `file`, `line`, and `message`; a line can be `"?"` when unknown.
See [configuration](configuration.md) for all size/time/rate defaults.

## Persistent projects

| Method and path | Result |
|-----------------|--------|
| `GET /api/v1/projects` | `{"projects": [...]}` metadata list without file contents |
| `POST /api/v1/projects` | Create a project; HTTP 201 with metadata and files |
| `GET /api/v1/projects/{id}` | Metadata and complete file map |
| `PUT /api/v1/projects/{id}` | Update supplied fields; returns metadata and files |
| `PUT /api/v1/projects/{id}/name` | Rename with `{"name": "Example"}` |
| `DELETE /api/v1/projects/{id}` | Delete project/files; HTTP 204 |

Creation accepts `name`, `files`, `main_file`, `engine`, and optional `github` metadata.
Use unique nonempty names. File values have the same text/Base64 shapes described above.
The browser normally supplies a complete map and engine.
Metadata includes the project ID, name, main file, engine, timestamps, file count,
and optional GitHub source link.

Updates can change `name`, `main_file`, `engine`, `files`, and `github`.
**Supplying `files` replaces the entire map**, not just the named entries.
Omitting `github` preserves the source link; setting it to `null` removes the link.
Link metadata contains `repo`, `path`, `branch`, `sha`, and a file `manifest`;
the browser manages these together during GitHub synchronization.

Missing projects return 404. Duplicate names or project-count limits return 409.
Use [the browser workflow](usage.md#github-folder-sync) rather than inventing a manifest
if you only need normal repository linking.

## GitHub credential and proxy

| Method and path | Result |
|-----------------|--------|
| `GET /api/v1/github-token` | `configured`, `needs_reconnect`, and `key_source` |
| `PUT /api/v1/github-token` | Validate/store `{"token": "..."}`; returns status and GitHub login |
| `DELETE /api/v1/github-token` | Forget the shared PAT; HTTP 204 |
| `POST /api/v1/github` | Allowlisted GitHub request using the stored PAT |

The proxy body has `path`, optional `method` (default `GET`), and optional JSON `body`.
Paths are relative GitHub API paths, not arbitrary URLs. The allowlist covers user/repository
metadata and Git refs, commits, trees, and blobs needed for folder synchronization.
GET requests cannot have a body; writes are limited to allowed POST/PATCH operations.
The proxy is not a general outbound HTTP proxy.

Disallowed requests return 400, missing credentials 401, unavailable GitHub 502, and
credential-store failures 500. Allowed upstream responses retain GitHub's status/body and
selected rate-limit headers. PAT plaintext is never returned by credential status endpoints.

## Legacy documents

`GET`/`POST /api/v1/documents` list/create documents.
`GET`/`PUT`/`DELETE /api/v1/documents/{id}` read/update/delete one.
Creation takes required string `content` and optional `title` (default `Untitled`).
Updates supply at least one of those fields.
Creation returns 201, deletion 204, missing IDs 404, and the document cap 409.

These documents are **in process memory**, unlike projects. They disappear on backend
restart and are not shared between separate worker processes.
Do not use this API as persistent project storage.
