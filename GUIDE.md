# LaTeX Editor - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Basic Usage](#basic-usage)
4. [Advanced Features](#advanced-features)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Tips & Tricks](#tips--tricks)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### Opening the Editor

1. Open `index.html` in any modern web browser
2. Or serve it with a local server:
   ```bash
   python3 -m http.server 8080
   ```
3. Navigate to `http://localhost:8080`

### First Steps

1. The editor loads with a sample document
2. Make changes in the left editor panel
3. The preview updates automatically after 1 second
4. Or press `Ctrl+Enter` to compile immediately

## Interface Overview

### Header Bar
- **Logo**: LaTeX Editor branding
- **New Button**: Create a new document
- **.tex Button**: Download LaTeX source code
- **PDF Button**: Download as PDF

### Editor Panel (Left)
- **Panel Title**: "LaTeX Source"
- **Compile Button**: Manual compilation trigger
- **Editor**: Syntax-highlighted LaTeX editing area
- **Status Bar**: Shows compilation status and cursor position

### Preview Panel (Right)
- **Panel Title**: "Preview"
- **Zoom Controls**: Zoom in/out (50% - 200%)
- **Preview Area**: Live PDF preview
- **Zoom Level**: Current zoom percentage

### Resizable Divider
- Drag the divider between panels to adjust sizes
- Double-click to reset to 50/50 split

## Basic Usage

### Creating Documents

#### Basic Document Structure

```latex
\documentclass{article}
\usepackage[utf8]{inputenc}

\title{My Document}
\author{Your Name}
\date{\today}

\begin{document}

\maketitle

\section{Introduction}

Your content here.

\end{document}
```

#### Text Formatting

```latex
% Bold text
\textbf{This is bold}

% Italic text
\textit{This is italic}

% Emphasized text
\emph{This is emphasized}

% Monospace/Code
\texttt{monospace text}
```

#### Lists

```latex
% Unordered list
\begin{itemize}
    \item First item
    \item Second item
    \item Third item
\end{itemize}

% Ordered list
\begin{enumerate}
    \item First item
    \item Second item
    \item Third item
\end{enumerate}
```

### Mathematical Equations

#### Inline Math

```latex
The equation $E = mc^2$ is famous.
```

#### Display Math

```latex
\begin{equation}
    \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
\end{equation}
```

#### Multiple Equations

```latex
\begin{align}
    x + y &= 5 \\
    x - y &= 1
\end{align}
```

### Sections and Structure

```latex
\section{Main Section}
Content of main section.

\subsection{Subsection}
Content of subsection.

\subsubsection{Subsubsection}
Content of subsubsection.
```

### Code Blocks

```latex
\begin{verbatim}
function hello() {
    console.log("Hello, World!");
}
\end{verbatim}
```

## Advanced Features

### Auto-Save

- Your work is automatically saved to browser's local storage
- Persists across browser sessions
- Restores on next visit

### Auto-Compile

- Compiles automatically 1 second after you stop typing
- No need to manually trigger compilation
- Press `Ctrl+Enter` for immediate compilation

### Zoom Controls

- Click **+** to zoom in
- Click **-** to zoom out
- Zoom range: 50% to 200%
- Zoom level persists across sessions

### Download Options

#### Download PDF
1. Click the **PDF** button in the header
2. Or use the browser's print function
3. PDF is generated from the current preview

#### Download .tex
1. Click the **.tex** button in the header
2. Saves the current LaTeX source code
3. File is named `document.tex` by default

### New Document

1. Click the **New** button
2. Confirms if you have unsaved changes
3. Loads the default template
4. Clears preview area

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` (or `Cmd+Enter` on Mac) | Compile document |
| `Tab` | Insert 2 spaces (in editor) |

## Tips & Tricks

### 1. Fast Compilation

- Use `Ctrl+Enter` for instant compilation
- Wait for auto-compile if you're still typing

### 2. Adjust Panel Sizes

- Drag the divider to your preferred layout
- More space for editor when writing
- More space for preview when reviewing

### 3. Zoom for Detail

- Zoom in to check fine details
- Zoom out to see the full page layout

### 4. Save Your Work

- Download .tex files regularly
- Browser storage may be cleared
- Keep backups of important documents

### 5. Mathematical Formulas

The editor supports standard LaTeX math:

```latex
% Greek letters
\alpha, \beta, \gamma, \delta

% Operators
\sum, \prod, \int, \sqrt, \frac

% Symbols
\infty, \partial, \nabla

% Functions
\sin, \cos, \tan, \log, \exp
```

### 6. Document Classes

Try different document classes:

```latex
\documentclass{article}    % Standard article
\documentclass{report}     % Longer reports
\documentclass{book}       % Books with chapters
\documentclass{letter}     % Letters
\documentclass{beamer}     % Presentations
```

### 7. Common Packages

Useful packages to include:

```latex
\usepackage{amsmath}       % Advanced math
\usepackage{amssymb}       % Math symbols
\usepackage{graphicx}      % Images
\usepackage{hyperref}      % Hyperlinks
\usepackage{geometry}      % Page layout
\usepackage{listings}      % Code listings
\usepackage{xcolor}        % Colors
```

## Troubleshooting

### Preview Not Updating

**Problem**: Changes don't appear in preview

**Solutions**:
- Wait 1 second for auto-compile
- Press `Ctrl+Enter` to compile manually
- Check for LaTeX syntax errors
- Look at status bar for error messages

### Compilation Errors

**Problem**: Document won't compile

**Solutions**:
1. Check for missing `\end{...}` commands
2. Verify all braces `{}` are balanced
3. Ensure required packages are included
4. Look for typos in command names
5. Check the error message in the status bar

### PDF Download Not Working

**Problem**: Can't download PDF

**Solutions**:
- Make sure document is compiled first
- Try using browser's print function instead
- Check browser's download settings
- Allow pop-ups if blocked

### Lost Work

**Problem**: Work disappeared after closing browser

**Solutions**:
- Work should auto-restore from local storage
- Check if browser cleared storage
- Use "Download .tex" regularly to backup
- Consider bookmarking the page

### Math Not Rendering

**Problem**: Mathematical equations show as plain text

**Solutions**:
- Check internet connection (MathJax needs to load)
- Verify equation syntax is correct
- Use `\[...\]` for display math
- Use `$...$` for inline math
- Refresh the page if MathJax didn't load

### Slow Performance

**Problem**: Editor is slow or laggy

**Solutions**:
- Large documents may take longer to compile
- Try splitting into smaller sections
- Clear browser cache
- Close other browser tabs
- Restart browser

### Browser Compatibility

**Problem**: Features not working in browser

**Solutions**:
- Use latest version of Chrome, Firefox, or Edge
- Safari should work but may have limitations
- Mobile browsers have limited functionality
- Some features require JavaScript enabled

## LaTeX Resources

### Learning LaTeX

- [Overleaf Documentation](https://www.overleaf.com/learn)
- [LaTeX Wikibook](https://en.wikibooks.org/wiki/LaTeX)
- [TeX Stack Exchange](https://tex.stackexchange.com/)

### Symbol References

- [Detexify](http://detexify.kirelabs.org/classify.html) - Draw symbols to find LaTeX commands
- [Comprehensive LaTeX Symbol List](http://tug.ctan.org/info/symbols/comprehensive/symbols-a4.pdf)

### Templates

- Scientific papers
- Academic essays
- Business letters
- Resumes/CVs
- Presentations
- Books and theses

## Support

For issues, questions, or suggestions:

1. Check this guide first
2. Review the main README.md
3. Open an issue on GitHub
4. Check existing issues for solutions

---

**Happy LaTeXing!** 📝
