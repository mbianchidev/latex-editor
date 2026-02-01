# Contributing to latex-editor

Thank you for your interest in contributing to latex-editor! We welcome contributions from the community and are excited to have you join us in building an open source LaTeX editor.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

* Git
* Node.js (version will be specified once the project structure is finalized)
* A modern web browser for testing
* A code editor (VS Code, WebStorm, or your preference)

### Setting Up Your Development Environment

1. **Fork the repository**
   
   Click the "Fork" button at the top right of the repository page.

2. **Clone your fork**
   
   ```bash
   git clone https://github.com/YOUR_USERNAME/latex-editor.git
   cd latex-editor
   ```

3. **Add upstream remote**
   
   ```bash
   git remote add upstream https://github.com/mbianchidev/latex-editor.git
   ```

4. **Install dependencies** (once project structure is in place)
   
   ```bash
   npm install
   # or
   yarn install
   ```

5. **Create a branch for your work**
   
   ```bash
   git checkout -b feature/your-feature-name
   ```

## How to Contribute

### Types of Contributions

We welcome many types of contributions:

* 🐛 **Bug fixes**: Fix issues reported in GitHub Issues
* ✨ **New features**: Implement new functionality
* 📝 **Documentation**: Improve or add documentation
* 🎨 **UI/UX improvements**: Enhance the user interface and experience
* 🧪 **Tests**: Add or improve test coverage
* ♿ **Accessibility**: Make the editor more accessible
* 🌐 **Internationalization**: Add or improve translations
* 🔧 **Tooling**: Improve development tools and processes

### First-Time Contributors

New to open source? Look for issues labeled:

* `good first issue` - Good for newcomers
* `help wanted` - Extra attention needed
* `documentation` - Documentation improvements

## Development Workflow

### Running the Development Server

```bash
# Start the development server (command will be added when project structure is ready)
npm run dev
```

### Building the Project

```bash
# Build for production (command will be added when project structure is ready)
npm run build
```

### Running Tests

```bash
# Run all tests (command will be added when project structure is ready)
npm test

# Run tests in watch mode
npm run test:watch
```

### Linting and Formatting

```bash
# Lint your code (command will be added when project structure is ready)
npm run lint

# Format your code
npm run format
```

## Code Standards

### General Guidelines

* Write clear, readable, and maintainable code
* Follow the existing code style and patterns
* Add comments for complex logic
* Keep functions small and focused on a single responsibility
* Use meaningful variable and function names

### JavaScript/TypeScript Style

* Use ES6+ features where appropriate
* Prefer `const` over `let`, avoid `var`
* Use arrow functions for callbacks
* Use async/await for asynchronous code
* Follow ESLint configuration (will be added to the project)

### Testing

* Write tests for new features
* Ensure existing tests pass before submitting PR
* Aim for good test coverage, especially for critical paths
* Write both unit tests and integration tests where appropriate

### Accessibility

* Use semantic HTML elements
* Provide alt text for images
* Ensure keyboard navigation works
* Test with screen readers when possible
* Follow WCAG 2.1 guidelines

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation only changes
* `style`: Code style changes (formatting, missing semicolons, etc.)
* `refactor`: Code change that neither fixes a bug nor adds a feature
* `perf`: Performance improvements
* `test`: Adding or updating tests
* `chore`: Changes to build process or auxiliary tools

### Examples

```
feat(editor): add syntax highlighting for LaTeX commands

fix(preview): resolve rendering issue with mathematical equations

docs(readme): update installation instructions

test(parser): add unit tests for LaTeX parser
```

## Pull Request Process

### Before Submitting

1. ✅ Ensure your code follows the style guidelines
2. ✅ Run linting and fix any issues
3. ✅ Run all tests and ensure they pass
4. ✅ Update documentation if needed
5. ✅ Add tests for new functionality
6. ✅ Rebase on latest main branch
7. ✅ Write a clear PR description

### PR Template

When you open a PR, please include:

* **Description**: What does this PR do?
* **Motivation**: Why is this change needed?
* **Related Issues**: Link to related issues (use "Fixes #123" or "Closes #123")
* **Screenshots**: If UI changes, include before/after screenshots
* **Testing**: Describe how you tested the changes
* **Checklist**: Complete the PR checklist

### Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, a maintainer will merge your PR
4. Your contribution will be included in the next release

### After Your PR is Merged

* Delete your branch (both locally and on GitHub)
* Pull the latest changes from main
* Celebrate! 🎉 You've contributed to open source!

## Issue Guidelines

### Reporting Bugs

Use the bug report template and include:

* Clear, descriptive title
* Steps to reproduce
* Expected behavior
* Actual behavior
* Screenshots or error messages
* Environment details (OS, browser, version)

### Suggesting Features

Use the feature request template and include:

* Clear description of the feature
* Use case and motivation
* Possible implementation approach
* Alternative solutions considered

### Issue Labels

We use labels to organize issues:

* `bug` - Something isn't working
* `feature` - New feature request
* `documentation` - Documentation improvements
* `good first issue` - Good for newcomers
* `help wanted` - Extra attention needed
* `priority:high` - High priority
* `priority:low` - Low priority
* `wontfix` - This will not be worked on

## Community

### Getting Help

* Read the [SUPPORT.md](SUPPORT.md) guide
* Search existing issues and discussions
* Ask questions in GitHub Discussions (coming soon)
* Check the documentation in [AGENTS.md](AGENTS.md)

### Communication

* Be respectful and constructive
* Use clear and concise language
* Stay on topic
* Follow our Code of Conduct

### Recognition

Contributors are recognized in:

* Release notes
* GitHub contributors page
* Project documentation (if significant contributions)

## Questions?

If you have questions about contributing, feel free to:

* Open an issue with the `question` label
* Reach out to the maintainers
* Check our [SUPPORT.md](SUPPORT.md) guide

Thank you for contributing to latex-editor! 🚀
