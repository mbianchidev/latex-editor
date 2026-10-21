# Agent instructions

Read this file before editing. Use [Contributing](CONTRIBUTING.md) and the
[developer guide](docs/development.md) for the complete workflow.

## Repository map

- `frontend/`: static HTML/CSS/vanilla JavaScript, a textarea editor, PDF.js, and JSZip.
- `backend/app.py`: Flask routes, SQLite projects, encrypted PAT storage, TeX compilation.
- `backend/test_app.py`: pytest API/validation tests with temporary databases and mocks.
- `frontend/latex-warnings.js`, `frontend/test-warnings.js`: warning parser and Node tests.
- `docker-compose.yml`, `.env.example`, service Dockerfiles: deployment and configuration.
- `docs/`: user/developer docs; root community files stay discoverable by GitHub.

There is no React/Vue `src/` layout, npm package manifest, frontend build pipeline,
WebSocket collaboration, or persistent compiler cache. Do not document plans as features.
See [architecture](docs/architecture.md), [API](docs/api.md), and [roadmap](docs/roadmap.md).

## Setup and checks

Use Docker/Compose with Linux containers for the complete compiler environment:

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
node frontend/test-warnings.js
node --check frontend/app.js
docker compose run --rm --no-deps -e DB_PATH=/tmp/latex-editor-tests.db backend \
  pytest --cov=. --cov-report=term-missing -v
git diff --check
```

Run only the checks relevant to your change, then broaden for cross-cutting behavior.
Do not invent npm lint/build commands: ESLint and Prettier are not configured here.
For native Python setup, [follow the developer guide](docs/development.md#backend-only-native-setup).
Set an absolute disposable `DB_PATH` before importing the backend; import initializes SQLite.
Tests must use synthetic data and mock GitHub access rather than real credentials/projects.
Aim for more than 80% coverage of critical paths.

Unit tests mock compiler execution. For compiler/deployment changes, also verify a real
PDF through nginx and inspect its response/page count. Preserve preview/export parity.
For UI changes, follow the [accessibility checks](docs/accessibility-testing.md).

## Implementation conventions

Prefer simple, focused changes and reuse existing helpers. Preserve responsiveness,
progressive disclosure, keyboard access, helpful diagnostics, and self-hosted storage.
Do not introduce a framework, dependency, or abstraction without a concrete need.

JavaScript uses two-space indentation, single quotes, semicolons, camelCase functions,
and UPPER_SNAKE_CASE constants. Keep multiline trailing commas consistent with surrounding
code and aim for a 100-character line length. Use kebab-case for new non-component files;
preserve established Python filenames/style. Use JSDoc for function/class documentation
and comments for non-obvious intent rather than obvious operations.

Validate boundary input and paths. Show meaningful errors and log diagnostic failures with
`console.error` or Flask logging. Clean up owned resources; do not silently swallow errors
or add success-shaped fallbacks. Never log or commit secrets or private project content.

Preserve shell-escape/rc-file restrictions, compiler timeout/process cleanup, request limits,
and Fernet key handling. Do not claim the current service authenticates or isolates users.
Data directories can contain the credential decryption key: do not copy them into tests.

## Documentation and delivery

Keep README concise; move detailed setup, usage, configuration, and architecture into `docs/`.
Update links when moving sections. Keep working features separate from planned work.
Respect the confirmed [MIT License](LICENSE), [security policy](SECURITY.md), and
[Code of Conduct](CODE_OF_CONDUCT.md); do not invent policies or reporting contacts.
Follow the [AI contribution policy](README.md#ai-policy).

Use Conventional Commits as described in [Contributing](CONTRIBUTING.md#commits-and-pull-requests).
Before submitting, self-review, check tests/docs/accessibility and error handling, and use
the existing PR template. Publishing, tagging, and merging require the appropriate request.
See [source-release checks](docs/releases.md); no prebuilt image or desktop release is implied.
