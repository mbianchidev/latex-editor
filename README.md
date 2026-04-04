# LaTeX Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Contributor%20Covenant-blue.svg)](CODE_OF_CONDUCT.md)

A free, open source LaTeX editor with real-time preview capabilities. Think Overleaf, but without compilation limits, completely free, and self-hostable.

## ✨ Features

- **Real-time Preview**: See your LaTeX document rendered as you type (optional auto-compile)
- **No Compilation Limits**: Compile as many documents as you want, whenever you want
- **Multi-file Projects**: Upload ZIP files with multiple .tex files, images, and fonts
- **Syntax Highlighting**: Full LaTeX syntax highlighting for easier editing
- **File Management**: Add, rename, and delete files directly in the browser
- **Free & Open Source**: No paywalls, no subscriptions, no restrictions
- **Self-Hostable**: Run it locally with Docker or deploy to your own server
- **Client-side Processing**: All processing happens in your browser

## 🚀 Quick Start

### One-liner (Docker)

```bash
docker compose up --build -d && echo "Open http://localhost"
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
| **Header Bar** | New document, upload ZIP, download .tex/.zip/PDF buttons |
| **File Tree** (left) | Shown when a ZIP project is loaded - manage files here |
| **Editor** (center-left) | Write your LaTeX code with syntax highlighting |
| **Preview** (right) | Live rendered preview of your document |
| **Status Bar** | Compilation status and cursor position |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Compile document |
| `Tab` | Insert 2 spaces |

### Working with Projects

1. **Upload a ZIP file** containing your LaTeX project
2. Files starting with `._` or in `__MACOSX` folders are automatically filtered
3. Use the file tree to navigate between files
4. Right-click files for rename/delete options
5. The main .tex file is auto-detected (or set manually)

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
- **Backend**: Python/Flask with rate limiting (flask-limiter)
- **Container**: Docker with nginx (reverse proxy + CSP headers)

## 📁 Project Structure

```
latex-editor/
├── frontend/           # Main application
│   ├── index.html      # HTML structure
│   ├── styles.css      # Design system
│   ├── app.js          # Application logic
│   └── nginx.conf      # Web server config
├── backend/            # Health check API
├── docker-compose.yml  # Container orchestration
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
