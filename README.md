# LaTeX Editor

A professional, open-source LaTeX editor with live PDF preview - like Overleaf, but with no compilation limits and completely client-side processing.

![LaTeX Editor](https://img.shields.io/badge/LaTeX-Editor-6B9B97?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![No Compilation Limits](https://img.shields.io/badge/Compilation-Unlimited-success?style=for-the-badge)

## ✨ Features

### 🚀 Core Functionality
- **Live PDF Preview**: Real-time rendering as you type
- **Split-Pane Interface**: Editor on left, preview on right
- **No Compilation Limits**: Unlimited, client-side LaTeX compilation
- **Multi-File Projects**: Upload ZIP files with complex folder structures
- **File Tree Navigation**: Browse and edit multiple files in your project
- **Automatic \input Resolution**: Seamlessly handles \input and \include commands
- **Syntax Highlighting**: Professional code editor with LaTeX syntax support
- **Auto-Save**: Automatic saving to local storage
- **Auto-Compile**: Compiles automatically after 1 second of inactivity

### 📥 Export Options
- **Download PDF**: Save your document as PDF
- **Download .tex**: Export LaTeX source code
- **Download ZIP**: Export entire multi-file project as ZIP
- **Print to PDF**: Use browser's print functionality for perfect PDFs

### 📦 Multi-File Project Support
- **ZIP Upload**: Upload complex LaTeX projects with subfolders
- **Folder Structure**: Supports nested directories (e.g., cv/experience.tex, images/logo.png)
- **Main File Detection**: Automatically identifies the main .tex file
- **File Switching**: Navigate between files using the interactive file tree
- **Dependency Resolution**: Automatically resolves \input{} and \include{} commands
- **Project Export**: Download your entire project as a ZIP file

### 🎨 User Experience
- **Resizable Panels**: Drag the divider to adjust editor/preview sizes
- **Zoom Controls**: Zoom in/out on the preview (50% - 200%)
- **Keyboard Shortcuts**: `Ctrl+Enter` to compile instantly
- **Status Indicators**: Real-time feedback on compilation status
- **Error Handling**: Clear error messages and compilation feedback
- **Responsive Design**: Works on desktop and mobile devices

### 🎯 Professional Design
- Refined editorial aesthetic inspired by academic journals
- Clean, paper-like interface with subtle textures
- Sophisticated typography with Merriweather and JetBrains Mono
- Warm color palette with muted teal accents
- Smooth animations and transitions
- Accessible and intuitive controls

## 🚀 Getting Started

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/latex-editor.git
   cd latex-editor
   ```

2. **Open in browser**:
   Simply open `index.html` in your web browser, or use a local server:
   ```bash
   # Using Python
   python3 -m http.server 8080
   
   # Using Node.js
   npx serve
   
   # Using PHP
   php -S localhost:8080
   ```

3. **Start editing**:
   - The editor loads with a sample template
   - Edit the LaTeX code in the left panel
   - See live preview in the right panel
   - Press `Ctrl+Enter` to compile manually
   - Use the download buttons to export your work

### No Installation Required

This is a completely client-side application - no server or backend needed! All LaTeX compilation happens in your browser.

## 📖 Usage

### Basic Workflow

1. **Edit**: Type or paste LaTeX code in the editor
2. **Compile**: Wait for auto-compile, or press `Ctrl+Enter`
3. **Preview**: See your document rendered in real-time
4. **Download**: Save as PDF or .tex file

### Working with Multi-File Projects

#### Uploading a ZIP Project

1. **Prepare your ZIP file** with your LaTeX project structure:
   ```
   my-project.zip
   ├── main.tex
   ├── cv/
   │   ├── summary.tex
   │   ├── experience.tex
   │   └── education.tex
   ├── images/
   │   └── logo.png
   └── bibliography.bib
   ```

2. **Click the ZIP button** in the toolbar
3. **Select your ZIP file** - the editor will:
   - Extract all files and folders
   - Automatically detect the main .tex file
   - Build an interactive file tree
   - Compile the complete project

4. **Navigate files** using the file tree sidebar
5. **Edit any file** by clicking on it in the tree
6. **Preview updates** as you edit any file
7. **Download** your modified project as a ZIP

#### Main File Detection

The editor automatically identifies your main .tex file by looking for:
- Files named `main.tex`, `document.tex`, `thesis.tex`, `paper.tex`, or `article.tex`
- Root-level .tex files (if no common names found)
- The first .tex file encountered (as fallback)

#### File Dependencies

The editor automatically resolves:
- `\input{filename}` - includes content from other .tex files
- `\include{filename}` - includes content with page breaks
- Relative paths like `cv/summary.tex` or `../shared/header.tex`

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Compile document |
| `Tab` | Insert 2 spaces (in editor) |

### Editor Features

- **Syntax Highlighting**: LaTeX commands, environments, and comments are color-coded
- **Line Numbers**: Track your position in the document
- **Tab Support**: Proper indentation with Tab key
- **Cursor Position**: See current line and column in status bar

### Sample Template

The editor includes a comprehensive starter template with:
- Document structure (title, author, date)
- Sections and subsections
- Itemized and enumerated lists
- Mathematical equations
- Code blocks (verbatim)
- Common LaTeX packages

## 🎨 Design Philosophy

This editor embodies a **refined editorial aesthetic** inspired by academic journals and professional publishing:

### Typography
- **Headings**: Merriweather (refined serif)
- **Code**: JetBrains Mono (distinctive monospace)
- **UI Text**: Source Sans 3 (clean sans-serif)

### Color Palette
- **Warm Neutrals**: Cream, paper, and parchment backgrounds
- **Accent**: Muted teal (#6B9B97) for controls and highlights
- **Text**: Deep charcoal and ink for excellent readability

### Visual Details
- Subtle paper texture overlay
- Elegant shadows and spacing
- Smooth, purposeful animations
- Professional button styles
- Clean, uncluttered interface

## 🛠️ Technical Stack

### Core Technologies
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with custom properties
- **Vanilla JavaScript**: No framework dependencies

### External Libraries
- **CodeMirror**: Code editor with syntax highlighting (optional)
- **Google Fonts**: Merriweather, JetBrains Mono, Source Sans 3
- **PDF.js**: PDF rendering (Mozilla)
- **SwiftLaTeX**: WebAssembly-based LaTeX compiler (referenced)

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## 📂 Project Structure

```
latex-editor/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling and design system
├── app.js              # Application logic and LaTeX compilation
└── README.md           # This file
```

## 🔧 Customization

### Changing Colors

Edit the CSS custom properties in `styles.css`:

```css
:root {
  --color-accent: #6B9B97;        /* Change accent color */
  --bg-primary: #FAF8F3;          /* Change background */
  --text-primary: #2A2724;        /* Change text color */
}
```

### Modifying the Template

Edit the `DEFAULT_TEMPLATE` constant in `app.js`:

```javascript
const DEFAULT_TEMPLATE = `
\\documentclass{article}
% Your custom template here
\\begin{document}
% Content
\\end{document}
`;
```

### Adding LaTeX Packages

The current implementation uses a simplified LaTeX-to-HTML converter. For full LaTeX support with custom packages, integrate SwiftLaTeX or similar:

```javascript
// Example: Load SwiftLaTeX engine
import { SwiftLatex } from 'swiftlatex';
const engine = new SwiftLatex();
await engine.loadEngine();
```

## 🚧 Limitations & Future Enhancements

### Current Limitations
- Simplified LaTeX-to-HTML conversion (not full LaTeX support yet)
- Some advanced LaTeX features may not render perfectly
- PDF export uses browser print (not true LaTeX PDF generation)

### Planned Enhancements
- [ ] Full SwiftLaTeX integration for complete LaTeX support
- [ ] Support for custom LaTeX packages
- [ ] Bibliography and citation management
- [ ] Multi-file project support
- [ ] Collaborative editing
- [ ] Template library
- [ ] Export to other formats (Word, Markdown, etc.)
- [ ] Cloud storage integration
- [ ] Spell checking and grammar
- [ ] Diff view for comparing versions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly in multiple browsers
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- Use 2 spaces for indentation
- Follow existing code structure
- Comment complex logic
- Maintain the design system consistency

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by [Overleaf](https://www.overleaf.com/)
- Built with love for the LaTeX community
- Design inspired by classic academic journals
- Fonts from Google Fonts
- Icons from Feather Icons style

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/latex-editor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/latex-editor/discussions)

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Made with ❤️ for the LaTeX community**
