# Contributing to LaTeX Editor

Thank you for your interest in contributing to LaTeX Editor! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Areas for Contribution](#areas-for-contribution)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background or identity.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy toward others

### Unacceptable Behavior

- Harassment, trolling, or discriminatory comments
- Personal or political attacks
- Publishing others' private information
- Other conduct inappropriate in a professional setting

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Text editor or IDE
- Basic knowledge of HTML, CSS, and JavaScript
- Familiarity with LaTeX (for content-related contributions)
- Git for version control

### First Contribution

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/latex-editor.git
   cd latex-editor
   ```
3. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes**
5. **Test thoroughly**
6. **Commit and push**:
   ```bash
   git add .
   git commit -m "Add: your feature description"
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**

## Development Setup

### Local Development

1. **Start a local server**:
   ```bash
   # Python
   python3 -m http.server 8080
   
   # Node.js
   npx serve
   
   # PHP
   php -S localhost:8080
   ```

2. **Open in browser**:
   Navigate to `http://localhost:8080`

3. **Make changes**:
   - Edit `index.html`, `styles.css`, or `app.js`
   - Refresh browser to see changes
   - Use browser DevTools for debugging

### Testing

Before submitting a PR, test your changes:

1. **Browser Testing**:
   - Chrome/Edge
   - Firefox
   - Safari
   - Mobile browsers (responsive mode)

2. **Feature Testing**:
   - Create new documents
   - Compile various LaTeX examples
   - Download PDF and .tex files
   - Test zoom controls
   - Verify resizable panels work
   - Check auto-save functionality

3. **Error Testing**:
   - Test with invalid LaTeX
   - Test with very large documents
   - Test with empty document
   - Verify error messages appear correctly

## Project Structure

```
latex-editor/
├── index.html          # Main HTML structure
│   ├── Header (logo, buttons)
│   ├── Main content (editor + preview)
│   ├── Loading overlay
│   └── Toast notifications
│
├── styles.css          # Complete design system
│   ├── CSS Custom Properties
│   ├── Reset & Base Styles
│   ├── Component Styles
│   ├── Layout
│   └── Responsive Design
│
├── app.js              # Application logic
│   ├── State Management
│   ├── Editor Initialization
│   ├── LaTeX Compilation
│   ├── PDF Generation
│   ├── UI Interactions
│   └── Local Storage
│
├── README.md           # Project overview
├── GUIDE.md            # User guide
├── CONTRIBUTING.md     # This file
└── LICENSE             # MIT License
```

## Design System

### Color Palette

```css
/* Primary Colors */
--color-cream: #FAF8F3;      /* Background */
--color-accent: #6B9B97;     /* Primary actions */
--color-ink: #2A2724;        /* Text */

/* Semantic Colors */
--color-success: #6B9B7A;
--color-warning: #C89968;
--color-error: #B56C6C;
--color-info: #6B7F9B;
```

### Typography

```css
--font-serif: 'Merriweather', Georgia, serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
--font-sans: 'Source Sans 3', -apple-system, sans-serif;
```

### Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
```

### Design Principles

1. **Refined Editorial**: Inspired by academic journals
2. **Professional**: Clean and uncluttered
3. **Accessible**: High contrast, readable fonts
4. **Consistent**: Use design system variables
5. **Subtle**: Elegant animations, not flashy

## Coding Standards

### HTML

```html
<!-- Use semantic HTML -->
<header class="header">
  <nav class="navigation">
    <!-- Navigation items -->
  </nav>
</header>

<!-- Meaningful class names -->
<button class="btn btn-primary">
  <svg class="icon">...</svg>
  Button Text
</button>

<!-- Accessibility attributes -->
<button aria-label="Close dialog" title="Close">
  ×
</button>
```

### CSS

```css
/* Use CSS custom properties */
.button {
  background: var(--color-accent);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
}

/* BEM-like naming for complex components */
.toast {
  /* Base styles */
}

.toast--error {
  /* Modifier styles */
}

.toast__icon {
  /* Element styles */
}

/* Mobile-first responsive design */
.component {
  /* Mobile styles */
}

@media (min-width: 768px) {
  .component {
    /* Tablet and desktop styles */
  }
}
```

### JavaScript

```javascript
// Use descriptive variable names
const editorContent = document.getElementById('editor');

// Use async/await for promises
async function compileLatex() {
  try {
    const result = await compile();
    return result;
  } catch (error) {
    handleError(error);
  }
}

// Add comments for complex logic
/**
 * Converts LaTeX to HTML
 * @param {string} latex - The LaTeX source code
 * @returns {string} HTML representation
 */
function convertLatexToHTML(latex) {
  // Implementation
}

// Use const/let, not var
const config = { /* ... */ };
let currentState = null;
```

### Code Style

- **Indentation**: 2 spaces (no tabs)
- **Line length**: Max 100 characters
- **Quotes**: Single quotes for strings
- **Semicolons**: Use them
- **Comments**: Explain "why", not "what"
- **Naming**: camelCase for variables, PascalCase for classes

## Pull Request Process

### Before Submitting

1. **Test thoroughly** in multiple browsers
2. **Check for console errors**
3. **Verify no breaking changes**
4. **Update documentation** if needed
5. **Follow code style** guidelines
6. **Keep commits atomic** and well-described

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Enhancement
- [ ] Documentation
- [ ] Refactoring

## Testing
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Tested on mobile
- [ ] No console errors
- [ ] All features work correctly

## Screenshots
(if applicable)

## Related Issues
Closes #123
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, PR will be merged
4. Your contribution will be credited

## Areas for Contribution

### High Priority

- [ ] Full SwiftLaTeX integration for true LaTeX compilation
- [ ] Better error handling and user feedback
- [ ] Support for custom LaTeX packages
- [ ] Improved PDF generation
- [ ] Multi-file project support

### Medium Priority

- [ ] Template library
- [ ] Syntax highlighting improvements
- [ ] Keyboard shortcuts expansion
- [ ] Settings panel
- [ ] Theme customization

### Low Priority / Nice to Have

- [ ] Cloud storage integration
- [ ] Collaborative editing
- [ ] Export to other formats
- [ ] Spell checking
- [ ] Diff/version comparison

### Documentation

- [ ] Video tutorials
- [ ] More LaTeX examples
- [ ] API documentation
- [ ] Architecture documentation

### Design

- [ ] Additional themes
- [ ] Icon improvements
- [ ] Animation enhancements
- [ ] Accessibility improvements

## Bug Reports

### Before Reporting

1. Check existing issues
2. Try latest version
3. Test in different browsers
4. Gather debug information

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

## Feature Requests

We welcome feature requests! Please:

1. Check if already requested
2. Describe the use case
3. Explain expected behavior
4. Consider if it fits project scope

## Questions?

- **GitHub Issues**: For bug reports and features
- **GitHub Discussions**: For questions and ideas
- **Documentation**: Check README.md and GUIDE.md first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to LaTeX Editor!** 🎉
