# User guide

[Documentation](README.md) | [Configuration](configuration.md)

## Workspace and projects

| Area | Purpose |
|------|---------|
| Header | New project, linked GitHub pull/commit shortcuts, and downloads |
| Left sidebar | Switch projects and browse the active project's files |
| Source editor | Edit text, select the compiler, and toggle Auto or Lines |
| Preview | View compiler-produced PDF pages and change zoom |
| Status bar | Compilation state, warnings, and cursor position |

The folder icon opens the project switcher; the document icon opens the active project's
files. Collapse the sidebar to an icon rail without hiding navigation.
Hover or focus a rail icon to read its label.

Choose **New**, supply a unique name, then choose:

- **Blank Document** for `main.tex`.
- **Multi-file Project** for `main.tex` and a starter section.
- **Import ZIP** for an existing project with source, classes, images, and fonts.
- **Import GitHub Folder** to create a project linked to a repository folder.

ZIP imports filter macOS metadata such as `._` files and `__MACOSX` directories.
Use the file tree to open files; its toolbar and file actions add, rename, or delete files
and folders. Right-click a different `.tex` file and choose **Set as Main** if automatic
main-file detection selected the wrong document.

Named projects are saved to the backend five seconds after editing stops, not on a fixed
five-second interval. New-project creation and project switches also perform saves.
The unnamed starter/recovery state uses browser storage; create a named project for
server-backed persistence. Browser recovery is not a backup of large binary assets.

Open, rename, or delete saved projects from the sidebar. Deletion is permanent.
Export a project ZIP first when you need a copy outside the database.
Storage paths and backup behavior are explained in [configuration](configuration.md#storage).

## Editing and compilation

| Control | Behavior |
|---------|----------|
| Compile button, `Ctrl+Enter`, or `Cmd+Enter` | Compile the selected main file |
| `Tab` in the editor | Insert two spaces rather than move focus |
| Command completion | Suggest common commands after a backslash; use arrows and Enter/Tab |
| **Auto** | Compile one second after editing stops; off by default |
| **Lines** | Show or hide source line numbers |
| Preview zoom buttons | Change displayed page size |

Auto, line-number, zoom, and sidebar preferences are saved in this browser.
The editor currently uses a textarea; full syntax highlighting is not implemented.
See [accessibility limitations](../ACCESSIBILITY.md#current-limitations) before relying on
complete keyboard or screen-reader access.

XeLaTeX is the default. Select the engine your project expects; `fontspec` needs XeLaTeX
or LuaLaTeX rather than pdfLaTeX. The engine is saved per project.
LuaLaTeX has a [known initialization limitation](troubleshooting.md#lualatex-initialization-fails).

The full project is sent to `latexmk`; TeX resolves includes, classes, packages, images,
and fonts. For a nested main file, compilation runs from that file's directory, so relative
paths must make sense there. Each request uses a fresh temporary build directory.
There is no persistent incremental compiler cache between requests.

The status bar shows page count and compile time. Errors and expandable compiler output
appear in the preview. Non-blocking warnings flag likely literal `%` or `&` mistakes and
unmatched braces; they are heuristics, not a full LaTeX validator.
Use `\%` and `\&` for literal characters. Select a warning to jump to its source line.

## Downloads

Use **Download** for the compiled PDF, current `.tex` file, or full project ZIP.
PDF export uses the same compiled bytes shown in preview; it recompiles if the source
changed since the last successful compile. It is not an HTML approximation or browser print.
A failed compile needs to be resolved before a current PDF can be exported.

## GitHub folder sync

1. Open the GitHub rail icon and save a fine-grained personal access token with repository
   **Contents: read and write** permission for the repositories you want to manage.
   The backend validates and encrypts it. The credential is shared across this instance,
   while repository links belong to individual projects.
2. Use **New** then **Import GitHub Folder** for a new linked project. To link an existing
   project, open its GitHub settings, supply `owner/repo`, folder, and optional branch, then
   select **Link & pull**. A blank folder selects the repository root; a blank branch uses
   the repository default.
3. **Pull** or **Pull latest** replaces local files with the linked folder. Export a ZIP
   first to preserve local-only edits; this is not a merge.
4. **Commit** or **Commit changes** creates a commit directly on the linked branch, not a
   pull request. If the branch changed since the last import/pull, the editor stops and
   requires a pull instead of overwriting remote work. Use a branch you can write.
5. **Unlink project** removes that project's source link only. **Forget PAT** removes the
   shared credential without removing project links.

Only files within the selected folder are managed; files elsewhere in the repository
remain unchanged. A selected folder is limited to 500 files and 7 MiB of decoded content.
Browser autosave does not fetch or push GitHub changes. Credential backup/key guidance is
in [configuration](configuration.md#github-credential-encryption).

## LaTeX examples

### Basic document

Paste this into a blank document and compile with the default engine:

```latex
\documentclass{article}
\usepackage[utf8]{inputenc}
\usepackage{amsmath}

\title{Example Document}
\author{Example Author}
\date{\today}

\begin{document}
\maketitle

\section{Introduction}
Your content here.

\end{document}
```

### Equations

Insert inside the document body; `amsmath` is included above:

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

For package documentation, use [CTAN](https://www.ctan.org/) or the
[LaTeX Project documentation](https://www.latex-project.org/help/documentation/).
Use [Support](../SUPPORT.md) for editor-specific questions.
