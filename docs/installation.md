# Installation

[Documentation](README.md) | [User guide](usage.md)

## Platforms and prerequisites

The supplied deployment builds two Linux containers: nginx and the Flask/TeX backend.
Use Docker Engine with Compose v2 or newer, or a host runtime providing those interfaces.
On macOS and Windows, this requires a Linux VM/container backend; the examples use a POSIX
shell, such as Bash, Zsh, or WSL.

CI exercises the stack on Ubuntu. Local checks have also built and run Linux/ARM64
containers from macOS. Native Windows backend execution and every host/runtime combination
are not covered by these checks.

Install Git and use a modern browser. Host Python, Node.js, and TeX are not required for
the container deployment. Allow substantial disk space and download time for TeX Live.
Image builds need package-repository access; the browser also loads CDN libraries and
Google Fonts. This is not a fully offline installation.

There are no attached desktop installers or prebuilt-image installation instructions in
the current releases. The supported path here builds the supplied source.

## First run

```bash
git clone https://github.com/mbianchidev/latex-editor.git
cd latex-editor
cp .env.example .env
```

Edit `.env` before starting. For a local-only instance on port 8080, set:

```dotenv
LATEX_EDITOR_PORT=127.0.0.1:8080
```

The default `80` publishes on the host's network interfaces. There is no application login,
project ownership boundary, or separate GitHub credential per user. Only trusted users
should reach the service. For access beyond a trusted private environment, provide
authentication and HTTPS at an external reverse proxy. Do not publish backend port 5000.

Build and start:

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
```

Both services should become healthy. Open `http://localhost:8080` for the setting above,
or `http://localhost` with the default port. The starter document should produce a PDF.
Choose **New**, enter a unique project name, and select **Blank Document** to save a project.
Press **Ctrl+Enter** or **Cmd+Enter** to compile.

If curl is installed, check the backend through nginx:

```bash
curl --fail http://localhost:8080/health
```

Expect JSON with `"status": "healthy"`. Use your configured port. A healthy API does not
alone verify TeX: compile the starter document as the end-to-end check.
See [troubleshooting](troubleshooting.md) if the services or preview fail.

## Stop and remove containers

From this checkout:

```bash
docker compose down --remove-orphans
```

This removes the stack's containers/network, not its host bind-mounted project data.
The default database remains at `~/.latex-editor/data/projects.db`.
Do not delete that directory as a troubleshooting step.

The fixed container names `latex-editor-frontend` and `latex-editor-backend` prevent two
unmodified copies from running on one daemon, even with different Compose project names.
Use a deliberately separate configuration if you need a second instance.

## Upgrade or change configuration

Back up the database and encryption key using the [backup procedure](configuration.md#backups).
Keep local source/configuration changes safe before updating the checkout to the intended
branch or release. After updating source:

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
```

The backend applies its existing additive SQLite column migrations at startup. There is
no general downgrade migration command; retain a backup when changing versions.
Re-run the health and document-compilation checks after an upgrade.

Changing `.env` values alone does not require rebuilding images; recreate affected services
with `docker compose up -d`. Changes to the Dockerfiles or nginx configuration do require
rebuilding. See [configuration](configuration.md) for storage migration and timeout details.
