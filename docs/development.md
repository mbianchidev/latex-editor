# Development and testing

[Documentation](README.md) | [Contributing](../CONTRIBUTING.md) | [Agent instructions](../AGENTS.md)

## Toolchain and setup

Use Git, Docker/Compose with Linux containers, a browser, and Node.js 26.12.1 for the small
frontend test. CI selects that Node.js version explicitly; it is not a production runtime.
The backend image and CI use Python 3.15.1; native Python development should use that
version with a virtual environment. The frontend is static HTML/CSS/JavaScript.
There is no `package.json`, npm install/build command, Vite setup, or frontend bundler.

Fork the repository, clone your fork, and create a focused branch based on `main`.
Follow [installation](installation.md) to copy `.env.example` and build the images.
Use a dedicated development data directory and a loopback port, not a real user's database
or a public interface. Changing the port does not change the fixed container names.

For a full UI/API/compiler environment:

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
```

Open the configured frontend URL. The images copy source during build rather than
mounting it for live reload. Rebuild the affected image after source changes, then run
`docker compose up -d` to recreate that service.
Stop only your own development stack with `docker compose down --remove-orphans`.

## Backend-only native setup

This is useful for Flask API tests without repeatedly building TeX Live:

```bash
python3.15 -m venv .venv
. .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

From the repository root, create disposable storage and run a loopback-only API:

```bash
dev_data=$(mktemp -d)
DB_PATH="$dev_data/projects.db" python -m gunicorn --chdir backend \
  --bind 127.0.0.1:5000 --workers 1 --threads 4 --timeout 90 app:app
```

The API is then at `http://127.0.0.1:5000`; stop it with Ctrl+C. This does not serve the
frontend or provide nginx's routing/security headers. Do not replace the full-stack
setup with `file://` or a static server and expect relative `/api/v1` calls to work.

Real compilation additionally needs the TeX engines, `latexmk`, fonts, and packages listed
in the [backend Dockerfile](../backend/Dockerfile). Use the Linux container for parity.
Native Windows execution is not a supported substitute for the Unix process-management
code; use Linux containers or WSL. `prlimit`-based resource caps are unavailable on some
native hosts.

The backend creates its database on import. Always set an absolute disposable `DB_PATH`
before tests or experiments instead of using its fallback user-data location.

## Checks

Run the frontend parser tests from the repository root:

```bash
node frontend/test-warnings.js
node --check frontend/app.js
node --check frontend/latex-warnings.js
```

No npm dependencies are needed. For backend tests using the built image:

```bash
docker compose run --rm --no-deps -e DB_PATH=/tmp/latex-editor-tests.db backend \
  pytest --cov=. --cov-report=term-missing -v
```

With the native virtual environment active, the equivalent is:

```bash
test_data=$(mktemp -d)
cd backend
DB_PATH="$test_data/projects.db" pytest --cov=. --cov-report=term-missing -v
cd ..
```

Use only synthetic documents, repository names, and credentials in tests.
`backend/test_app.py` uses temporary databases and mocked GitHub/compiler responses;
passing it does not prove the real TeX toolchain works. Keep unit tests independent of
network access. Aim for more than 80% coverage of critical paths; do not inflate coverage
by counting tests as application code.

For integration changes, build without cache and verify the frontend, `/health`, project
create/save/reopen, and a real compile/export. The [CI workflow](../.github/workflows/ci.yml)
contains the existing HTTP smoke check, including a real XeLaTeX compile.
It also runs backend tests, the frontend warning test, and both image builds.
The [CodeQL workflow](../.github/workflows/codeql.yml) analyzes Actions, JavaScript, and Python.

The Docker build and Compose integration jobs run in parallel after the unit checks pass.
Both still build without cache; integration waits up to 120 seconds for the existing
container health checks instead of sleeping for a fixed delay. New pushes to the same PR
cancel superseded CI and CodeQL runs. Push runs on the default branch and scheduled
CodeQL scans remain independent. Draft PRs still run all checks and language analyses.

The repository does not currently configure ESLint, Prettier, or a Markdown linter.
Do not invent npm lint/format commands. Check whitespace with `git diff --check`, verify
relative documentation links and heading anchors, and match the surrounding formatting.
For UI changes, also follow [accessibility checks](accessibility-testing.md).

## Style and implementation conventions

Keep changes focused and reuse existing helpers. Prefer simple, maintainable functions.
JavaScript uses two-space indentation, single quotes, semicolons, camelCase utilities,
and UPPER_SNAKE_CASE constants. Use trailing commas in multiline collections where
consistent with the surrounding code; aim for a 100-character line length.
New non-component files use kebab-case; preserve established Python filenames and style.
Use JSDoc for function/class documentation and explain non-obvious intent rather than
commenting obvious operations.

Validate paths and request shapes at the boundary. Surface useful errors to the user,
log diagnostic context with `console.error` or Flask logging, and clean up owned resources.
Do not log tokens, keys, private document content, or large binary payloads.
Preserve compiler file restrictions, timeout handling, preview/export parity, and the
distinction between shared instance state and browser preferences.

## Debugging and extension points

Use `docker compose logs --tail=100 backend frontend`, browser network requests, and the
preview's **Compiler output** details. Confirm the selected engine/main file and whether
an error came from nginx, Flask validation, TeX, or PDF.js before changing code.
See [troubleshooting](troubleshooting.md).

Command suggestions live in `AUTOCOMPLETE_COMMANDS` in `frontend/app.js`.
Source diagnostics live in `frontend/latex-warnings.js`, with cases in
`frontend/test-warnings.js`. Backend routes, validation, migrations, and compiler invocation
are in `backend/app.py`, with behavior tests in `backend/test_app.py`.
Read [architecture](architecture.md) before adding cross-cutting behavior.

Retain meaningful tests and documentation when fixing feedback.
Use [source-release checks](releases.md) for delivery-related changes; do not tag, publish,
or push an image merely to test documentation.
