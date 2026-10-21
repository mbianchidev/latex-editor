# LaTeX Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Contributor%20Covenant-blue.svg)](CODE_OF_CONDUCT.md)

[Documentation](docs/README.md) |
[Report a bug or ask a question](https://github.com/mbianchidev/latex-editor/issues/new/choose) |
[Roadmap](docs/roadmap.md)

<img width="1000" alt="LaTeX Editor showing project files, the source editor, and a compiled PDF preview" src="https://github.com/user-attachments/assets/55dadadf-e9a0-4b4c-b3bc-6e3de048f3ea" />

Write LaTeX in your browser and preview the PDF produced by a real TeX engine.
LaTeX Editor is a free, self-hostable workspace for documents, papers, and resumes,
with projects stored on your own server rather than a subscription service.
There are no subscription-based compile quotas, but safety limits apply.

## Contents

- [Quickstart](#quickstart)
- [Why LaTeX Editor](#why-latex-editor)
- [How it works](#how-it-works)
- [Get started and configuration](#get-started-and-configuration)
- [Features](#features)
- [Documentation](#documentation)
- [AI policy](#ai-policy)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Quickstart

You need Git, a modern browser, and Docker with Compose v2 or newer and a running
Linux-container daemon. Python, Node.js, and TeX are included or unnecessary on the host.
The first build downloads a large TeX Live toolchain; internet access is required.
Commands below use a POSIX shell.

**Trusted users only:** There is no built-in login or per-user project isolation.
For a local-only installation, set `LATEX_EDITOR_PORT=127.0.0.1:8080` in `.env`.
Otherwise, the default port mapping listens on the host's network interfaces.

```bash
git clone https://github.com/mbianchidev/latex-editor.git
cd latex-editor
cp .env.example .env
# Edit .env for your port, network exposure, and data directory.
docker compose build --no-cache
docker compose up -d
docker compose ps
```

Once both services are healthy, open **http://localhost** (or
**http://localhost:8080** for the local-only setting above). A starter document compiles
to a PDF. Choose **New**, enter a unique name, and select **Blank Document** to create
a saved project. Compile with **Ctrl+Enter** or **Cmd+Enter** on macOS.

See [installation](docs/installation.md) for platform requirements, health verification,
upgrades, and shutdown; see [troubleshooting](docs/troubleshooting.md) if startup fails.

## Why LaTeX Editor

Keep project files on your server, use familiar TeX classes and fonts, and download the
same PDF bytes you preview. Multi-file ZIP imports and manual GitHub folder sync help
bring existing projects into the editor.

The tradeoff is operating the compiler and storage yourself. This is a shared trusted-user
instance, not an authenticated collaborative service. Browser libraries and fonts load
from CDNs, and compilation has [resource and compatibility limits](docs/configuration.md#limits).

## How it works

nginx serves a vanilla JavaScript frontend and proxies requests to a Python/Flask backend.
The backend stores projects in SQLite and runs `latexmk` with the selected TeX engine.
PDF.js renders the resulting PDF; JSZip handles project archives.

Read the [architecture guide](docs/architecture.md) for the data flow, repository map,
compiler restrictions, and extension points.

## Get started and configuration

Use **New** to create a blank or multi-file project, import a ZIP, or import a GitHub
folder. The [user guide](docs/usage.md) covers editing, main-file selection, downloads,
GitHub synchronization, and LaTeX examples.

Configure the host port and data location in `.env`. By default, SQLite lives at
`~/.latex-editor/data/projects.db` on the Docker host and survives container removal.
See [configuration and backups](docs/configuration.md) before changing storage, compiler
limits, or GitHub credential encryption.

## Features

- Compiler-produced PDF preview and matching PDF export, plus source and ZIP downloads.
- Per-project pdfLaTeX, XeLaTeX, and LuaLaTeX selection; XeLaTeX is the default.
  Read the [known LuaLaTeX caveat](docs/troubleshooting.md#lualatex-initialization-fails).
- Multi-file projects with classes, styles, images, and fonts.
- SQLite-backed projects, saved five seconds after editing stops.
- Command completion, optional line numbers, source warnings, and optional auto-compile.
- Manual GitHub folder import, pull, and commits to a linked branch.

Authentication, collaboration, document history, and other unimplemented ideas are
tracked separately in the [roadmap](docs/roadmap.md), not advertised as working features.

## Documentation

Start at the [documentation index](docs/README.md) for user and developer guides.
Developers can go directly to [setup and testing](docs/development.md),
the [API reference](docs/api.md), or [source-release checks](docs/releases.md).
For help and accessibility information, see [Support](SUPPORT.md) and
[Accessibility](ACCESSIBILITY.md).

## AI policy

You are responsible for everything you contribute, including AI-assisted code,
documentation, and assets. Review and test your contribution, and be able to explain
what the code does and why it is needed.

## Contributing

Bug reports, documentation, tests, and code contributions are welcome.
Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).
Coding agents must read [AGENTS.md](AGENTS.md) before editing.

## Security

Report vulnerabilities privately through the process in [SECURITY.md](SECURITY.md).
Keep the service restricted to trusted users; use authentication and HTTPS at a reverse
proxy before exposing it outside a trusted local/private environment.

## License

LaTeX Editor is licensed under the [MIT License](LICENSE).
