# Troubleshooting

[Documentation](README.md) | [Support](../SUPPORT.md)

## Start with service status

From the installation checkout:

```bash
docker compose ps
docker compose logs --tail=100
```

Check `/health` at the configured frontend port. It should report `"status": "healthy"`.
Then compile a small document to verify the compiler, not just the HTTP server.
Redact tokens, document content, local paths, and repository details before sharing logs.

## Build or startup fails

The backend downloads a large TeX Live installation. Check disk space, package-repository
connectivity, and the first failing build step. Rebuild with `docker compose build --no-cache`.
Do not install a host LaTeX distribution to repair an error inside the container.

For occupied port 80, set `LATEX_EDITOR_PORT=127.0.0.1:8080` in `.env`, run
`docker compose up -d`, and use `http://localhost:8080`.
Fixed container names can also conflict with another checkout's running stack.
Do not remove containers belonging to another installation.

If `/health` works but the PDF renderer or ZIP import fails, inspect the browser console
and network panel for blocked CDN requests. The default frontend is not fully offline.

Some Docker-compatible runtimes may not implement Compose healthcheck metadata correctly.
Compare container logs and actual HTTP health with the runtime's reported state.
The supplied configuration is checked on standard Docker in CI.

## Compilation fails

Expand **Compiler output** in the preview and find the first useful TeX error.
Check the selected main `.tex` file and engine, included classes/styles/fonts, file-name
case, and relative paths. A nested main file compiles from its own directory.
Use XeLaTeX for projects using `fontspec` if LuaLaTeX hits the limitation below.

Custom `latexmk` rc files and shell escape are disabled. Projects depending on external
commands, a custom build recipe, or unavailable packages may need adaptation.
Do not enable shell escape as a generic workaround.

### LuaLaTeX initialization fails

With the current TeX file restrictions, LuaLaTeX can fail during
`luaotfload-multiscript.lua` initialization before producing a PDF. This was observed with
the supplied image and a basic article. Select the default XeLaTeX or pdfLaTeX as appropriate
for your project. The engine option's presence is not a guarantee every package works.

### Size, time, or rate errors

HTTP 413 can mean the JSON/Base64 request exceeded nginx/backend limits or the decoded
compile payload was too large. HTTP 429 means the client hit a rate limit. HTTP 504 can
mean compilation exceeded the configured wall-clock timeout.
Reduce unnecessary assets or compile less frequently before increasing limits.
See [configuration](configuration.md) for the independent request, TeX, and proxy limits.

## Projects are missing or not saving

Check that the backend is reachable and the browser is not reporting a save error.
Autosave is debounced: it runs five seconds after editing stops, not every five seconds.
The unnamed starter is not a named backend project.

Confirm `LATEX_EDITOR_DATA` still points to the intended host directory and check the
sidebar's storage path. A new empty directory creates an empty database; it does not mean
the old data was deleted. Do not clear storage or overwrite the database before backing up.
Browser recovery copies may omit large binaries; prefer the backend data or a complete ZIP.

After a backend restart, an nginx 502 can indicate stale upstream resolution on some local
container runtimes. Once the backend itself is healthy, restart only this stack's frontend:

```bash
docker compose restart frontend
```

For oversized-header errors, inspect site cookies and proxy header limits. Clearing site
data can also remove browser preferences/recovery copies, so preserve unsaved work first.

## GitHub operations fail

Check PAT expiration, selected repositories, and **Contents: read and write** permission.
Use a writable branch when protection rules prevent direct commits.
If the branch changed remotely, export local edits before pulling: pulls replace files,
not merge them. Verify the selected folder is within 500 files and 7 MiB.

If credential status requires reconnecting after a restore, confirm the Fernet key matches
the saved ciphertext, then reconnect the PAT if needed. Do not disclose keys or PATs.
The [configuration guide](configuration.md#github-credential-encryption) explains key custody.

If these steps do not resolve the problem, follow [Support](../SUPPORT.md) with a synthetic
minimal reproduction. Report vulnerabilities through [SECURITY.md](../SECURITY.md), not
a public bug report.
