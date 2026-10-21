# Contributing to LaTeX Editor

Bug fixes, documentation, tests, usability/accessibility improvements, and feature proposals
are welcome. Small, focused contributions are useful; you do not need to start with a large
change. Follow the [Code of Conduct](CODE_OF_CONDUCT.md) in all project spaces.

## Find or discuss work

Search [existing issues](https://github.com/mbianchidev/latex-editor/issues) first.
Use the existing [issue chooser](https://github.com/mbianchidev/latex-editor/issues/new/choose)
for a bug, feature request, or usage question. Describe the use case before implementing a
large feature so maintainers can discuss scope. The [roadmap](docs/roadmap.md) distinguishes
working features from ideas, and [Support](SUPPORT.md) lists help resources.

Bug reports should include a synthetic minimal example, steps, expected/actual behavior,
OS/browser/runtime versions, and relevant redacted errors. Do not attach personal projects,
tokens, or database copies. Report suspected vulnerabilities through [SECURITY.md](SECURITY.md),
not a public issue.

## Development setup

Fork the repository, clone your fork, and create a feature branch from `main`.
The full environment uses Docker/Compose with Linux containers; Node.js LTS runs the
dependency-free frontend test. Python 3.11 is needed only for native backend development.
There is no npm installation/build step.

Follow [development and testing](docs/development.md) for exact setup, dependency installation,
local execution, tests, formatting conventions, and debugging. Use a dedicated development
database and a loopback port. Coding agents must read [AGENTS.md](AGENTS.md) before editing.

The main checks, from the repository root after building the images, are:

```bash
node frontend/test-warnings.js
docker compose run --rm --no-deps -e DB_PATH=/tmp/latex-editor-tests.db backend \
  pytest --cov=. --cov-report=term-missing -v
git diff --check
```

Run `docker compose build --no-cache` for build/deployment changes and verify a real compile;
the unit suite alone does not run the TeX toolchain.
See [source-release checks](docs/releases.md) for delivery work.

## Code, tests, and documentation

Reuse existing functions, keep changes focused, and match nearby formatting.
JavaScript uses two-space indentation, single quotes, semicolons, camelCase functions,
and UPPER_SNAKE_CASE constants. Explain non-obvious intent, handle failures visibly,
and avoid logging secrets. Detailed conventions are in [the developer guide](docs/development.md).

Add regression tests for behavior changes using synthetic input and mocked external
services. Aim for more than 80% coverage of critical paths.
Update complete guides in `docs/` when setup, usage, configuration, or architecture changes;
keep the README a short entrypoint and check moved links.

Use [ACCESSIBILITY.md](ACCESSIBILITY.md) and the
[manual verification guide](docs/accessibility-testing.md) for interface changes.
Reviewers need to know what was actually checked, what could not be checked, and any known
limitations. A passing automated check does not establish accessibility compliance.

You remain responsible for AI-assisted work, including documentation and assets.
Review, test, and be able to explain your contribution; see the [AI policy](README.md#ai-policy).

## Commits and pull requests

Use the project's existing [Conventional Commits](https://www.conventionalcommits.org/) format,
such as `docs(readme): clarify installation` or `fix(preview): report compile errors`.
Use `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, or `chore` as appropriate.

Before opening a PR, review your diff, run relevant checks, update documentation, and ensure
the branch is based on the intended `main` revision without unrelated changes.
Use the [repository PR template](.github/PULL_REQUEST_TEMPLATE.md): explain motivation,
scope, related issues, exact commands/results, and any untested platform or known failure.
UI changes need useful screenshots with synthetic data and accessibility checks.

Maintainers review and may request changes. Address feedback with focused changes, rerun
affected checks, and explain any tradeoffs. Do not assume approval or merge authority.
Review timing depends on maintainer availability; [Support](SUPPORT.md) covers help channels.
