# LaTeX Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Contributor%20Covenant-blue.svg)](CODE_OF_CONDUCT.md)

A free, open source LaTeX editor with real-time preview capabilities. Think Overleaf, but without compilation limits, completely free, and self-hostable.

## ✨ Features

- **Real-time Preview**: See your LaTeX document rendered as you type (optional auto-compile)
- **No Compilation Limits**: Compile as many documents as you want, whenever you want
- **Multi-file Projects**: Upload ZIP files with multiple .tex files, images, and fonts
- **CV/Resume Support**: Full rendering of CV-class documents (russell.cls) with sections, entries, skills tables
- **Project Management**: Save, open, rename, and delete projects from a sidebar drawer
- **SQLite Persistence**: Projects stored in a SQLite database on the backend (survives container restarts)
- **GitHub Integration**: Push/pull projects to/from GitHub repositories with PAT authentication
- **Syntax Highlighting**: Full LaTeX syntax highlighting for easier editing
- **File Management**: Add, rename, and delete files directly in the browser
- **Free & Open Source**: No paywalls, no subscriptions, no restrictions
- **Self-Hostable**: Run it locally with Docker or deploy to your own server
- **Client-side Processing**: LaTeX-to-HTML rendering happens in your browser

## 🚀 Quick Start

### One-liner (Docker)

```bash
docker compose build --no-cache && docker compose up -d
# Open http://localhost
```

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/mbianchidev/latex-editor.git
cd latex-editor

# Start with Docker Compose
docker compose up --build -d

# Open http://localhost in your browser
```

### Manual Setup

```bash
# Serve the frontend folder with any static server
cd frontend
python3 -m http.server 8080
# Open http://localhost:8080
```

## 📖 User Guide

### Interface Overview

| Panel | Description |
|-------|-------------|
| **Header Bar** | Projects drawer, new document, upload ZIP, download .tex/.zip/PDF buttons |
| **Projects Drawer** (left slide-in) | Manage saved projects — open, rename, delete, GitHub settings |
| **File Tree** (left) | Shown when a ZIP project is loaded — manage files here |
| **Editor** (center-left) | Write your LaTeX code with syntax highlighting |
| **Preview** (right) | Live rendered preview of your document |
| **Status Bar** | Compilation status and cursor position |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Compile document |
| `Tab` | Insert 2 spaces |

### Working with Projects

1. **Upload a ZIP file** containing your LaTeX project — you'll be prompted for a project name
2. Files starting with `._` or in `__MACOSX` folders are automatically filtered
3. Use the file tree to navigate between files
4. Right-click files for rename/delete options
5. The main .tex file is auto-detected (or set manually)
6. Projects are auto-saved to the SQLite backend every 5 seconds

### Project Management

- Click **Projects** in the header to open the projects drawer
- All projects are persisted in a SQLite database (Docker volume `backend-data`)
- Project names must be unique — duplicates are rejected
- Open, rename, or delete projects from the drawer

### GitHub Integration

1. Click **Projects** → **GitHub Settings** in the drawer footer
2. Enter a GitHub Personal Access Token (PAT) with `repo` scope
3. Enter a repository name (`owner/repo`)
4. **Push**: Saves all project files as a commit to the repo (creates it if needed)
5. **Pull**: Fetches files from a GitHub repo and loads them as a new project

### Auto-Compile Toggle

The "Auto" checkbox controls automatic compilation:
- **Off (default)**: Manual compile only - click ▶ or press `Ctrl+Enter`
- **On**: Auto-compile 3 seconds after you stop typing

## 📝 LaTeX Examples

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

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Libraries**: MathJax 3, jsPDF, html2canvas, JSZip
- **Backend**: Python/Flask with SQLite, rate limiting (flask-limiter)
- **Database**: SQLite (persisted via Docker volume)
- **Container**: Docker with nginx (reverse proxy + CSP headers)

## 📁 Project Structure

```
latex-editor/
├── frontend/           # Main application
│   ├── index.html      # HTML structure + project drawer + GitHub modal
│   ├── styles.css      # Design system + drawer/modal styles
│   ├── app.js          # Application logic + project management + GitHub integration
│   └── nginx.conf      # Web server config + CSP headers
├── backend/            # Flask API + SQLite project storage
│   ├── app.py          # API endpoints (health, documents, projects)
│   ├── test_app.py     # 43 tests (health, documents, projects CRUD)
│   ├── Dockerfile      # Backend container with /data volume
│   └── requirements.txt
├── docker-compose.yml  # Container orchestration with backend-data volume
├── CONTRIBUTING.md     # Contribution guidelines
└── README.md           # This file
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick start for contributors:**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔒 Security

Found a vulnerability? See [SECURITY.md](SECURITY.md) for reporting guidelines.

### Security Features

- **XSS Prevention**: All user-controlled LaTeX content is HTML-escaped before rendering
- **Sandboxed Preview**: Preview iframe uses `sandbox="allow-scripts"` — isolated from the parent page
- **Content Security Policy**: Nginx enforces CSP headers restricting script/style sources
- **Rate Limiting**: Backend API endpoints are rate-limited via flask-limiter
- **Input Validation**: Request body size limits, document count caps, filename sanitization
- **No Direct Backend Exposure**: Backend is only accessible through the nginx reverse proxy

## 💬 Support

Need help? Check [SUPPORT.md](SUPPORT.md) for resources.
