# LaTeX Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Contributor%20Covenant-blue.svg)](CODE_OF_CONDUCT.md)

A free, self-hostable LaTeX editor with compiler-accurate PDF preview. Write documents in
your browser, compile them with a real TeX engine, and keep projects on your own server.
There are no subscription-based compile quotas, but request, project, and compilation
safety limits apply.

<img width="1710" height="950" alt="LaTeX Editor with project files, source editor, and compiled PDF preview" src="https://github.com/user-attachments/assets/55dadadf-e9a0-4b4c-b3bc-6e3de048f3ea" />

## Features

- **Real PDF preview and export**: PDF.js displays the compiler output, and PDF downloads
  use the same compiled bytes. Export the current `.tex` file or the complete project ZIP too.
- **TeX engine selection**: Choose pdfLaTeX, XeLaTeX, or the LuaLaTeX option per project
  (see [current limitations](#limits-and-current-scope)). TeX Live and `latexmk` handle
  includes, bibliography tools, document classes, images, and fonts.
- **Multi-file workflows**: Start a blank or multi-file project, import a ZIP, and manage
  files and folders in the sidebar. Custom classes such as `russell.cls` can be included.
- **Persistent projects**: Save, open, rename, and delete projects backed by SQLite.
  Named projects auto-save five seconds after editing stops.
- **Editing assistance**: LaTeX command completion, optional line numbers, clickable
  source warnings, and optional compilation one second after editing stops.
- **Manual GitHub folder sync**: Import a repository folder, pull its latest files, and
  commit local edits to the linked branch.

## Quick start

### Prerequisites

- Git and a modern web browser.
- Docker Engine with Docker Compose v2 or newer (`docker compose`) and a running
  Linux-container daemon. On macOS or Windows, use a runtime that provides Linux containers.
- Internet access for image/package downloads and browser-loaded libraries and fonts.
- Time and disk space for the large TeX Live toolchain installed by the first build.

You do not need Python, Node.js, or TeX installed on the host to run the Docker stack.
The shell examples below use a POSIX shell, such as Bash, Zsh, or a WSL shell on Windows.

**Deployment warning:** There is no built-in login or per-user project isolation.
The supplied Compose configuration publishes the frontend on the host's network interfaces.
Keep access restricted to trusted users; add authentication and HTTPS at a reverse proxy
before exposing the editor beyond a trusted local/private environment.

### Install and run

```bash
git clone https://github.com/mbianchidev/latex-editor.git
cd latex-editor
cp .env.example .env

# Edit .env first if port 80 is occupied or you want another data directory.
docker compose build --no-cache
docker compose up -d
docker compose ps
```

Once both services report healthy, open **http://localhost**. The editor loads a starter
document and compiles its PDF. Click **New**, enter a unique project name, and choose
**Blank Document**, **Multi-file Project**, **Import ZIP**, or **Import GitHub Folder**
to create a persistent project.

If another service uses port 80, set `LATEX_EDITOR_PORT=8080` in `.env` before running
`docker compose up -d`, then open **http://localhost:8080**.

To check the API through nginx, use curl (if installed):

```bash
curl --fail http://localhost/health
# Expect JSON containing "status": "healthy".
```

Use the configured port in that URL if you changed it. If startup fails, inspect
`docker compose ps` and `docker compose logs --tail=100`.

Stop and remove the containers, including obsolete Compose services, with:

```bash
docker compose down --remove-orphans
```

Project data remains in the host data directory. The stable container names
`latex-editor-frontend` and `latex-editor-backend` mean two unmodified copies of this stack
cannot run on the same Docker daemon at once.

## User guide

### Interface Overview

| Panel | Description |
|-------|-------------|
| **Header Bar** | New project, compact GitHub pull/commit shortcuts, and one download menu |
| **Workspace Sidebar** (left) | Switch projects and browse the active project's files; collapse it to an icon rail |
| **Editor** (center-left) | Write LaTeX and select the project compiler |
| **Preview** (right) | The actual compiled PDF, rendered page by page |
| **Status Bar** | Compilation status and cursor position |

In the dark workspace rail, the folder icon opens the project switcher and the document icon
opens the active project's files. Hover or focus any rail icon to see its label.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` or `Cmd+Enter` | Compile document |
| `Tab` | Insert 2 spaces |

### Working with Projects

1. Choose **New**, enter a project name, and select **Import ZIP** to upload a LaTeX project
2. Files starting with `._` or in `__MACOSX` folders are automatically filtered
3. Use the file tree to navigate between files
4. Right-click files for rename/delete options
5. The main `.tex` file is auto-detected; right-click another `.tex` file and choose
   **Set as Main** if needed
6. Named projects are auto-saved to the SQLite backend five seconds after the latest edit

### Project Management

- Projects stay available in the left sidebar for quick switching
- Click the sidebar chevron to collapse the panel to a thin icon rail without hiding navigation
- The active project's files appear below the project list
- Named projects are persisted on the Docker host at `~/.latex-editor/data/` by default
  (see [Data and configuration](#data-and-configuration))
- Project names must be unique; duplicates are rejected
- Open, rename, or delete projects directly from the sidebar
- The storage path and database size are shown at the bottom of the sidebar

### GitHub Integration

1. Open the GitHub icon in the workspace rail and enter a fine-grained Personal Access Token
   with repository `Contents`
   read and write access. The backend validates it, encrypts it, and stores only ciphertext
   in SQLite. This credential is shared, but repository links are stored separately per project.
2. To create a new linked project, click **New** → **Import GitHub Folder**.
3. To link an existing local project, select its GitHub button, enter the repository
   (`owner/repo`), folder (`resume`), and optional branch, then choose **Link & pull**.
   This replaces that project's local files with the selected GitHub folder.
   Leaving the branch blank uses the repository default branch; leaving the folder blank
   selects the repository root.
4. Use the compact **Pull** button in the header, or **Pull latest** in project GitHub settings, to
   replace the local project with the current linked folder.
5. Use **Commit** in the header or **Commit changes** in project GitHub settings
   to create a commit directly on the linked branch. If the
   branch changed since the last import or pull, the editor stops and asks you to pull
   first instead of overwriting remote work.
6. **Unlink project** removes only the selected project's source link. **Forget PAT** removes
   the shared credential without changing any project links.

Only files inside the linked folder are managed. Files elsewhere in the repository
remain unchanged. Commits go directly to the linked branch, not through a pull request.
Use a writable branch and export a ZIP before linking or pulling if you need to preserve
local-only edits.

Pulling is manual. Browser auto-save writes to local SQLite and does not automatically fetch
or push GitHub changes.

### Compilation and PDF Export

1. Select the same engine you use for standalone builds.
2. Click ▶ or press `Ctrl+Enter` (`Cmd+Enter` on macOS).
3. The complete project is compiled with `latexmk`; includes, classes, images, and fonts are
   resolved by TeX rather than approximated as HTML.
4. The status bar reports the exact page count.
5. Use **Download** to choose the compiled PDF, current `.tex` file, or full project ZIP.
   PDF export recompiles first when the source changed after the last compile.

XeLaTeX is the default. Projects that use `fontspec`, such as `russell.cls` CVs, need
XeLaTeX or LuaLaTeX rather than pdfLaTeX. The selected engine is stored per project.

Enable **Auto** beside the engine selector to compile one second after the latest edit. The
preference is stored in the browser and remains off by default.

The status bar also shows non-blocking warnings for likely literal percent signs such as `100%`,
ampersands outside alignment environments, and unmatched `{` or `}`. Escape literal special
characters as `\%` and `\&`. Click a warning to select and highlight its source line. Use the
**Lines** toggle in the editor toolbar to show or hide line numbers; the preference persists in
the browser.

## LaTeX examples

### Basic Document

```latex
\documentclass{article}
\usepackage[utf8]{inputenc}
\usepackage{amsmath}

\title{My Document}
\author{Your Name}
\date{\today}

\begin{document}
\maketitle

\section{Introduction}
Your content here.

\end{document}
```

### Mathematical Equations

```latex
\begin{equation}
    E = mc^2
\end{equation}

\begin{equation}
    \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
\end{equation}
```

### Lists

```latex
\begin{itemize}
    \item First item
    \item Second item
    \begin{itemize}
        \item Nested item
    \end{itemize}
\end{itemize}
```

## Technology stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **PDFs and archives**: PDF.js and JSZip, loaded from CDNs
- **Backend**: Python/Flask, pypdf, cryptography, SQLite, and rate limiting (flask-limiter)
- **Compiler**: TeX Live with latexmk, pdfLaTeX, XeLaTeX, and LuaLaTeX
- **Database**: SQLite (bind-mounted to host filesystem)
- **Container**: Docker with nginx (reverse proxy + CSP headers)

## Data and configuration

With Docker Compose, projects are stored in a SQLite database on the **Docker host**.
The default directory is `~/.latex-editor/data/`, mounted at `/data` inside the backend,
with the database at `/data/projects.db`. Data survives `docker compose down`, image
rebuilds, and container restarts. The sidebar footer displays the backend's storage path
and database size.

Copy [`.env.example`](.env.example) to `.env` in the repository root and adjust the values
before starting the services. Re-run `docker compose up -d` after changing configuration.

| Variable | Default | Purpose |
|----------|---------|---------|
| `LATEX_EDITOR_PORT` | `80` | Frontend host port |
| `LATEX_EDITOR_DATA` | `${HOME}/.latex-editor/data` | Host directory for the database and generated key |
| `COMPILE_TIMEOUT_SECONDS` | `60` | Wall-clock timeout for each compile |
| `MAX_REQUEST_BYTES` | `36700160` (35 MiB) | Maximum API request body, including Base64/JSON overhead |
| `MAX_COMPILE_BYTES` | `26214400` (25 MiB) | Maximum combined decoded source and asset size per compile |
| `GITHUB_TOKEN_ENCRYPTION_KEY` | Empty | Optional Fernet key, kept separate from database backups |
| `GITHUB_TOKEN_KEY_PATH` | Empty | Generated-key path inside the backend; defaults beside the database |

nginx also caps request bodies at 35 MiB. Raising `MAX_REQUEST_BYTES` requires updating
`client_max_body_size` in [`frontend/nginx.conf`](frontend/nginx.conf) and rebuilding the
frontend image. Longer compilation timeouts also need compatible Gunicorn and nginx
timeouts in the [backend Dockerfile](backend/Dockerfile) and nginx configuration.

The GitHub PAT is encrypted before it is stored in SQLite, and GitHub API calls are proxied by
the backend so the saved PAT is never returned to the browser. For stronger separation from
database backups, set `GITHUB_TOKEN_ENCRYPTION_KEY` in `.env`. Without it, the app generates a
`0600` key file beside the database; copying the whole data directory copies both the encrypted
PAT and its key.

To generate an environment-provided key after building the backend image:

```bash
docker compose run --rm --no-deps backend python -c \
  "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Set the result as `GITHUB_TOKEN_ENCRYPTION_KEY` in `.env` before saving a PAT, keep it
private, and retain it separately from database backups. Changing or losing the key requires
reconnecting the PAT. A custom `GITHUB_TOKEN_KEY_PATH` must be writable and persisted if it
is outside `/data`.

For a consistent filesystem backup, stop the stack before copying the data directory, or
use SQLite-aware backup tooling. Changing `LATEX_EDITOR_DATA` selects a different directory;
it does not migrate existing projects automatically.

## Limits and current scope

- **Shared instance, not a multi-user service**: All users who can reach the app share
  projects and the stored GitHub credential. Account authentication, per-user access controls,
  real-time collaborative editing, and document version history are not implemented.
- **Safety limits, not unlimited compilation**: Backend defaults allow 50 projects,
  1,000 files per compile, a 50 MiB compiled PDF, and 30 compile requests per minute per client
  IP, in addition to the size and timeout settings above. Other backend environment settings
  are defined in [`backend/app.py`](backend/app.py); those not forwarded by
  [`docker-compose.yml`](docker-compose.yml) need to be added to its backend environment.
  Adding them only to `.env` does not pass them into the container.
- **GitHub import limits**: A selected folder can contain at most 500 files and 7 MiB of
  decoded content. Pulling replaces local files, and GitHub synchronization is manual.
- **TeX compatibility**: The Docker image includes many packages and fonts, not every
  possible dependency. Include custom classes, styles, and fonts in your project, and use
  XeLaTeX or LuaLaTeX for `fontspec`. Shell escape and project `latexmk` rc files are disabled,
  so projects requiring external commands or custom build recipes may need adaptation.
- **LuaLaTeX caveat**: LuaLaTeX can fail under the current compiler restrictions with a
  `luaotfload-multiscript.lua` initialization error. Use the default XeLaTeX or pdfLaTeX
  if you encounter this error.
- **Not fully offline by default**: Compilation runs on your server, but the browser loads
  libraries and fonts from external CDNs. A static-file-only deployment cannot compile PDFs
  or provide SQLite project persistence.

## Development

The frontend is static HTML/CSS/JavaScript: there is no `package.json`, npm install step,
or npm build command. Docker builds install the backend requirements and copy the frontend
assets. For the current checks, run from the repository root:

```bash
# Requires Node.js LTS; no npm packages needed.
node frontend/test-warnings.js

# Requires the backend image built in Quick start; uses a disposable test database.
docker compose run --rm --no-deps -e DB_PATH=/tmp/latex-editor-tests.db backend \
  pytest --cov=. --cov-report=term-missing -v
```

The backend image uses Python 3.11 and dependencies from
[`backend/requirements.txt`](backend/requirements.txt).
The [CI workflow](.github/workflows/ci.yml) runs backend tests, frontend checks, uncached
image builds, and a Compose integration check that compiles a real PDF.
For API discovery, visit `/api/v1/status`; `/api/v1/settings` reports configured server limits.

## Project structure

```text
latex-editor/
├── frontend/           # Main application
│   ├── index.html      # HTML structure + project drawer + GitHub modal
│   ├── styles.css      # Design system + drawer/modal styles
│   ├── latex-warnings.js # Lightweight non-blocking source diagnostics
│   ├── test-warnings.js  # Node tests for source diagnostics
│   ├── app.js          # Application logic + project management + GitHub folder sync
│   └── nginx.conf      # Web server config + CSP headers
├── backend/            # Flask API + SQLite project storage
│   ├── app.py          # API endpoints, project storage, and isolated TeX compilation
│   ├── test_app.py     # Backend API and compiler validation tests
│   ├── Dockerfile      # Backend container with TeX Live and /data volume
│   └── requirements.txt
├── docker-compose.yml  # nginx + backend services and host data bind mount
├── .env.example        # Supported Compose configuration
├── CONTRIBUTING.md     # Contribution guidelines
└── README.md           # This file
```

## Documentation and contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution
process and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community expectations. Use the
[development commands above](#development) for this implementation.

**Quick start for contributors:**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Need help? See [SUPPORT.md](SUPPORT.md). For security reporting and PAT-storage guidance,
read [SECURITY.md](SECURITY.md). Deployment settings are documented in
[`.env.example`](.env.example) and [`docker-compose.yml`](docker-compose.yml).

## License

MIT License. See [LICENSE](LICENSE) for details.
