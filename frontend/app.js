/**
 * LaTeX Editor - Main Application
 * A sophisticated LaTeX editor with live PDF preview
 */

// ============================================
// CONFIGURATION & STATE
// ============================================

// Debug mode - set to true to enable verbose logging
const DEBUG_MODE = false;

// ============================================
// CONFIGURATION & STATE
// ============================================

// LaTeX math commands to preserve during HTML conversion
const LATEX_MATH_COMMANDS = [
  // Greek letters
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta',
  'theta', 'vartheta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi',
  'varpi', 'rho', 'varrho', 'sigma', 'varsigma', 'tau', 'upsilon', 'phi',
  'varphi', 'chi', 'psi', 'omega',
  'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon',
  'Phi', 'Psi', 'Omega',
  // Operators
  'int', 'sum', 'prod', 'coprod', 'bigcup', 'bigcap', 'bigoplus', 'bigotimes',
  'oint', 'iint', 'iiint',
  // Functions
  'sqrt', 'frac', 'dfrac', 'tfrac', 'binom',
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'sinh', 'cosh', 'tanh', 'coth',
  'arcsin', 'arccos', 'arctan',
  'log', 'ln', 'lg', 'exp',
  'lim', 'limsup', 'liminf', 'sup', 'inf', 'max', 'min',
  'det', 'dim', 'ker', 'deg', 'gcd', 'hom',
  // Symbols
  'infty', 'partial', 'nabla', 'pm', 'mp', 'times', 'div', 'cdot',
  'ast', 'star', 'circ', 'bullet', 'cap', 'cup', 'vee', 'wedge',
  'oplus', 'ominus', 'otimes', 'oslash', 'odot',
  'leq', 'geq', 'neq', 'equiv', 'sim', 'simeq', 'approx', 'cong',
  'propto', 'subset', 'supset', 'subseteq', 'supseteq', 'in', 'notin',
  'forall', 'exists', 'nexists', 'emptyset',
  'to', 'rightarrow', 'leftarrow', 'leftrightarrow', 'Rightarrow', 'Leftarrow',
  'Leftrightarrow', 'mapsto',
  // Accents and modifiers
  'hat', 'bar', 'tilde', 'vec', 'dot', 'ddot', 'overline', 'underline',
  'overbrace', 'underbrace',
  // Spacing
  'quad', 'qquad',
  // Text in math mode
  'text', 'mathrm', 'mathbf', 'mathit', 'mathsf', 'mathtt', 'mathcal',
  'mathbb', 'mathfrak',
  // Delimiters
  'left', 'right', 'big', 'Big', 'bigg', 'Bigg'
];

const DEFAULT_TEMPLATE = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{graphicx}

\\title{LaTeX Document}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}

Welcome to LaTeX Editor! This is a professional document editing environment with live PDF preview.

\\subsection{Features}

\\begin{itemize}
    \\item Real-time PDF compilation
    \\item Syntax highlighting
    \\item Resizable split-pane interface
    \\item Download as PDF or .tex
    \\item Client-side processing
\\end{itemize}

\\subsection{Mathematics}

LaTeX excels at typesetting mathematical formulas. Here's an example:

\\begin{equation}
    E = mc^2
\\end{equation}

\\begin{equation}
    \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
\\end{equation}

\\section{Getting Started}

Edit this document to see live changes in the preview panel. Press \\textbf{Ctrl+Enter} to compile, or use the compile button.

\\subsection{Code Examples}

You can include code snippets:

\\begin{verbatim}
function hello() {
    console.log("Hello, World!");
}
\\end{verbatim}

\\section{Conclusion}

Start creating beautiful documents with LaTeX!

\\end{document}
`;

const state = {
  editor: null,
  currentLatex: '',
  pdfData: null,
  zoom: 1.0,
  isCompiling: false,
  compileGeneration: 0,
  engine: null,
  lastCompileTime: 0,
  // Multi-file project support
  projectFiles: {},
  currentFile: null,
  mainFile: null,
  projectMode: false,
  // Backend project tracking
  currentProjectId: null,
  currentProjectName: null,
  // GitHub
  githubToken: null,
  githubRepo: null,
};

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
  editor: document.getElementById('editor'),
  previewContent: document.getElementById('previewContent'),
  previewContainer: document.getElementById('previewContainer'),
  compileBtn: document.getElementById('compileBtn'),
  newDocBtn: document.getElementById('newDoc'),
  downloadPdfBtn: document.getElementById('downloadPdf'),
  downloadTexBtn: document.getElementById('downloadTex'),
  zipFileInput: document.getElementById('zipFileInput'),
  downloadZipBtn: document.getElementById('downloadZip'),
  zoomInBtn: document.getElementById('zoomIn'),
  zoomOutBtn: document.getElementById('zoomOut'),
  zoomLevel: document.getElementById('zoomLevel'),
  statusText: document.getElementById('statusText'),
  lineCol: document.getElementById('lineCol'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingText: document.getElementById('loadingText'),
  errorToast: document.getElementById('errorToast'),
  successToast: document.getElementById('successToast'),
  errorMessage: document.getElementById('errorMessage'),
  successMessage: document.getElementById('successMessage'),
  closeError: document.getElementById('closeError'),
  closeSuccess: document.getElementById('closeSuccess'),
  divider: document.getElementById('divider'),
  editorPanel: document.getElementById('editorPanel'),
  previewPanel: document.getElementById('previewPanel'),
  fileTree: document.getElementById('fileTree'),
  fileTreeContent: document.getElementById('fileTreeContent'),
  toggleFileTreeBtn: document.getElementById('toggleFileTree'),
  closeFileTreeBtn: document.getElementById('closeFileTree'),
  cleanProjectBtn: document.getElementById('cleanProjectBtn'),
  currentFileName: document.getElementById('currentFileName'),
  newFileBtn: document.getElementById('newFileBtn'),
  newFolderBtn: document.getElementById('newFolderBtn'),
  // Projects drawer
  projectsBtn: document.getElementById('projectsBtn'),
  projectsDrawer: document.getElementById('projectsDrawer'),
  drawerOverlay: document.getElementById('drawerOverlay'),
  closeDrawer: document.getElementById('closeDrawer'),
  projectsList: document.getElementById('projectsList'),
  drawerGithubBtn: document.getElementById('drawerGithubBtn'),
  drawerNewProjectBtn: document.getElementById('drawerNewProjectBtn'),
  // New project modal
  newProjectModalOverlay: document.getElementById('newProjectModalOverlay'),
  closeNewProjectModal: document.getElementById('closeNewProjectModal'),
  newProjectName: document.getElementById('newProjectName'),
  newProjectBlankBtn: document.getElementById('newProjectBlankBtn'),
  newProjectMultiBtn: document.getElementById('newProjectMultiBtn'),
  newProjectZipBtn: document.getElementById('newProjectZipBtn'),
  // GitHub modal
  githubModalOverlay: document.getElementById('githubModalOverlay'),
  closeGithubModal: document.getElementById('closeGithubModal'),
  githubToken: document.getElementById('githubToken'),
  githubRepo: document.getElementById('githubRepo'),
  githubRepoGroup: document.getElementById('githubRepoGroup'),
  githubStatus: document.getElementById('githubStatus'),
  githubSave: document.getElementById('githubSave'),
  githubDisconnect: document.getElementById('githubDisconnect'),
  githubPush: document.getElementById('githubPush'),
  githubPull: document.getElementById('githubPull'),
};

// ============================================
// INITIALIZATION
// ============================================

async function init() {
  showStatus('Initializing...', 'info');
  
  // Migrate: clear ALL oversized localStorage data (now using SQLite backend)
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('latexEditor_')) {
        const val = localStorage.getItem(key);
        if (val && val.length > 50000) {
          localStorage.removeItem(key);
          console.info(`Cleared oversized localStorage key: ${key} (${val.length} chars)`);
        }
      }
    }
  } catch (e) { /* ignore */ }
  
  initializeEditor();
  
  state.currentLatex = DEFAULT_TEMPLATE;
  elements.editor.value = DEFAULT_TEMPLATE;
  
  initializeEventListeners();
  initializeResizer();
  initAutocomplete();
  
  // Try to restore last session — localStorage first, then backend
  let restored = false;
  try {
    restored = loadFromLocalStorage();
  } catch (e) { /* ignore */ }

  if (!restored) {
    restored = await loadLastProjectFromBackend();
  }
  
  showStatus('Compiling...', 'info');
  compile(true);
}

// ============================================
// EDITOR INITIALIZATION
// ============================================

function initializeEditor() {
  // Listen for editor changes
  elements.editor.addEventListener('input', handleEditorChange);
  
  // Listen for cursor position changes
  elements.editor.addEventListener('keyup', updateCursorPosition);
  elements.editor.addEventListener('click', updateCursorPosition);
  
  // Handle tabs in textarea
  elements.editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      e.target.value = value.substring(0, start) + '  ' + value.substring(end);
      e.target.selectionStart = e.target.selectionEnd = start + 2;
    }
    
    // Compile on Ctrl+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      compile();
    }
  });
}

// ============================================
// LATEX AUTOCOMPLETE
// ============================================

const AUTOCOMPLETE_COMMANDS = [
  { cmd: 'begin', hint: '{environment}' },
  { cmd: 'end', hint: '{environment}' },
  { cmd: 'section', hint: '{title}' },
  { cmd: 'subsection', hint: '{title}' },
  { cmd: 'subsubsection', hint: '{title}' },
  { cmd: 'paragraph', hint: '{title}' },
  { cmd: 'textbf', hint: '{bold text}' },
  { cmd: 'textit', hint: '{italic text}' },
  { cmd: 'texttt', hint: '{monospace}' },
  { cmd: 'textsc', hint: '{small caps}' },
  { cmd: 'emph', hint: '{emphasis}' },
  { cmd: 'underline', hint: '{text}' },
  { cmd: 'href', hint: '{url}{text}' },
  { cmd: 'url', hint: '{url}' },
  { cmd: 'includegraphics', hint: '[opts]{file}' },
  { cmd: 'input', hint: '{file}' },
  { cmd: 'include', hint: '{file}' },
  { cmd: 'usepackage', hint: '{package}' },
  { cmd: 'documentclass', hint: '{class}' },
  { cmd: 'title', hint: '{text}' },
  { cmd: 'author', hint: '{name}' },
  { cmd: 'date', hint: '{date}' },
  { cmd: 'maketitle', hint: '' },
  { cmd: 'tableofcontents', hint: '' },
  { cmd: 'newcommand', hint: '{\\cmd}[n]{def}' },
  { cmd: 'renewcommand', hint: '{\\cmd}{def}' },
  { cmd: 'newpage', hint: '' },
  { cmd: 'clearpage', hint: '' },
  { cmd: 'pagebreak', hint: '' },
  { cmd: 'noindent', hint: '' },
  { cmd: 'centering', hint: '' },
  { cmd: 'vspace', hint: '{length}' },
  { cmd: 'hspace', hint: '{length}' },
  { cmd: 'label', hint: '{key}' },
  { cmd: 'ref', hint: '{key}' },
  { cmd: 'cite', hint: '{key}' },
  { cmd: 'footnote', hint: '{text}' },
  { cmd: 'caption', hint: '{text}' },
  { cmd: 'item', hint: '' },
  { cmd: 'frac', hint: '{num}{den}' },
  { cmd: 'sqrt', hint: '{expr}' },
  { cmd: 'sum', hint: '' },
  { cmd: 'int', hint: '' },
  { cmd: 'infty', hint: '' },
  { cmd: 'alpha', hint: '' },
  { cmd: 'beta', hint: '' },
  { cmd: 'gamma', hint: '' },
  { cmd: 'delta', hint: '' },
  { cmd: 'lambda', hint: '' },
  { cmd: 'pi', hint: '' },
  { cmd: 'sigma', hint: '' },
  { cmd: 'theta', hint: '' },
  { cmd: 'omega', hint: '' },
  { cmd: 'color', hint: '{color}' },
  { cmd: 'textcolor', hint: '{color}{text}' },
  { cmd: 'definecolor', hint: '{name}{model}{def}' },
  { cmd: 'geometry', hint: '{options}' },
  { cmd: 'hrule', hint: '' },
  { cmd: 'hline', hint: '' },
  { cmd: 'cvsection', hint: '{title}' },
  { cmd: 'cventry', hint: '{org}{role}{loc}{dates}{body}' },
  { cmd: 'cvskill', hint: '{category}{skills}' },
  { cmd: 'cvparagraph', hint: '' },
  { cmd: 'makecvheader', hint: '' },
  { cmd: 'name', hint: '{first}{last}' },
  { cmd: 'position', hint: '{title}' },
  { cmd: 'email', hint: '{address}' },
  { cmd: 'github', hint: '{username}' },
  { cmd: 'linkedin', hint: '{username}' },
  { cmd: 'textbar', hint: '' },
  { cmd: 'textperiodcentered', hint: '' },
  { cmd: 'texteuro', hint: '' },
  { cmd: 'LaTeX', hint: '' },
  { cmd: 'today', hint: '' },
];

const autocompleteState = {
  visible: false,
  items: [],
  selectedIndex: 0,
  prefix: '',
  startPos: 0,
};

function initAutocomplete() {
  const dropdown = document.getElementById('autocompleteDropdown');
  if (!dropdown) return;

  elements.editor.addEventListener('input', handleAutocompleteInput);
  elements.editor.addEventListener('keydown', handleAutocompleteKeydown);
  elements.editor.addEventListener('blur', () => setTimeout(hideAutocomplete, 150));
  elements.editor.addEventListener('click', hideAutocomplete);
}

function handleAutocompleteInput() {
  const textarea = elements.editor;
  const pos = textarea.selectionStart;
  const text = textarea.value.substring(0, pos);

  // Find \command prefix at cursor
  const match = text.match(/\\([a-zA-Z]*)$/);
  if (!match || match[0].length < 2) {
    hideAutocomplete();
    return;
  }

  const prefix = match[1].toLowerCase();
  const startPos = pos - match[1].length;
  const filtered = AUTOCOMPLETE_COMMANDS.filter(c =>
    c.cmd.toLowerCase().startsWith(prefix)
  ).slice(0, 10);

  if (filtered.length === 0) {
    hideAutocomplete();
    return;
  }

  autocompleteState.items = filtered;
  autocompleteState.prefix = match[1];
  autocompleteState.startPos = startPos;
  autocompleteState.selectedIndex = 0;
  autocompleteState.visible = true;

  renderAutocomplete();
  positionAutocomplete();
}

function handleAutocompleteKeydown(e) {
  if (!autocompleteState.visible) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    autocompleteState.selectedIndex = Math.min(
      autocompleteState.selectedIndex + 1,
      autocompleteState.items.length - 1
    );
    renderAutocomplete();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    autocompleteState.selectedIndex = Math.max(autocompleteState.selectedIndex - 1, 0);
    renderAutocomplete();
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    if (autocompleteState.items.length > 0) {
      e.preventDefault();
      applyAutocomplete(autocompleteState.items[autocompleteState.selectedIndex]);
    }
  } else if (e.key === 'Escape') {
    hideAutocomplete();
  }
}

function applyAutocomplete(item) {
  const textarea = elements.editor;
  const before = textarea.value.substring(0, autocompleteState.startPos);
  const after = textarea.value.substring(textarea.selectionStart);

  let insertion = item.cmd;
  let cursorOffset = insertion.length;

  // Add braces for commands that take arguments
  if (item.hint.startsWith('{')) {
    insertion += '{}';
    cursorOffset = insertion.length - 1;
  }

  textarea.value = before + insertion + after;
  textarea.selectionStart = textarea.selectionEnd = autocompleteState.startPos + cursorOffset;

  state.currentLatex = textarea.value;
  hideAutocomplete();
  textarea.focus();
}

function renderAutocomplete() {
  const dropdown = document.getElementById('autocompleteDropdown');
  if (!dropdown) return;

  dropdown.innerHTML = autocompleteState.items.map((item, i) => {
    const sel = i === autocompleteState.selectedIndex ? ' selected' : '';
    return `<div class="autocomplete-item${sel}" data-index="${i}">
      <span class="ac-cmd">\\${escapeHtml(item.cmd)}</span>
      ${item.hint ? `<span class="ac-hint">${escapeHtml(item.hint)}</span>` : ''}
    </div>`;
  }).join('');

  dropdown.classList.add('visible');

  dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const idx = parseInt(el.dataset.index);
      applyAutocomplete(autocompleteState.items[idx]);
    });
  });

  // Scroll selected into view
  const selected = dropdown.querySelector('.selected');
  if (selected) selected.scrollIntoView({ block: 'nearest' });
}

function positionAutocomplete() {
  const dropdown = document.getElementById('autocompleteDropdown');
  const textarea = elements.editor;
  if (!dropdown || !textarea) return;

  // Approximate cursor position using a mirror div
  const text = textarea.value.substring(0, textarea.selectionStart);
  const lines = text.split('\n');
  const lineNum = lines.length;
  const colNum = lines[lines.length - 1].length;

  const style = window.getComputedStyle(textarea);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4;
  const charWidth = parseFloat(style.fontSize) * 0.6;

  const top = lineNum * lineHeight - textarea.scrollTop + 4;
  const left = colNum * charWidth + parseFloat(style.paddingLeft || 0);

  dropdown.style.top = Math.min(top, textarea.offsetHeight - 210) + 'px';
  dropdown.style.left = Math.min(left, textarea.offsetWidth - 220) + 'px';
}

function hideAutocomplete() {
  autocompleteState.visible = false;
  const dropdown = document.getElementById('autocompleteDropdown');
  if (dropdown) dropdown.classList.remove('visible');
}

// ============================================
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
  // Compile button
  elements.compileBtn.addEventListener('click', compile);
  
  // New project button (replaces old dropdown)
  if (elements.newDocBtn) {
    elements.newDocBtn.addEventListener('click', openNewProjectModal);
  }

  // New project modal
  if (elements.closeNewProjectModal) {
    elements.closeNewProjectModal.addEventListener('click', closeNewProjectModal);
  }
  if (elements.newProjectModalOverlay) {
    elements.newProjectModalOverlay.addEventListener('click', (e) => {
      if (e.target === elements.newProjectModalOverlay) closeNewProjectModal();
    });
  }
  if (elements.newProjectBlankBtn) {
    elements.newProjectBlankBtn.addEventListener('click', () => handleNewProjectCreate('blank'));
  }
  if (elements.newProjectMultiBtn) {
    elements.newProjectMultiBtn.addEventListener('click', () => handleNewProjectCreate('multifile'));
  }
  if (elements.newProjectZipBtn) {
    elements.newProjectZipBtn.addEventListener('click', () => handleNewProjectCreate('zip'));
  }

  // New project from sidebar
  if (elements.drawerNewProjectBtn) {
    elements.drawerNewProjectBtn.addEventListener('click', () => {
      closeProjectsDrawer();
      openNewProjectModal();
    });
  }
  
  // ZIP upload (hidden input, triggered by modal)
  elements.zipFileInput.addEventListener('change', handleZipUpload);
  
  // Download buttons
  elements.downloadPdfBtn.addEventListener('click', downloadPDF);
  elements.downloadTexBtn.addEventListener('click', downloadTeX);
  elements.downloadZipBtn.addEventListener('click', downloadProjectZip);
  
  // Zoom controls
  elements.zoomInBtn.addEventListener('click', () => setZoom(state.zoom + 0.1));
  elements.zoomOutBtn.addEventListener('click', () => setZoom(state.zoom - 0.1));
  
  // File tree controls
  elements.toggleFileTreeBtn.addEventListener('click', toggleFileTree);
  elements.closeFileTreeBtn.addEventListener('click', () => toggleFileTree(false));
  elements.cleanProjectBtn.addEventListener('click', cleanCurrentProject);
  
  // New file/folder buttons in file tree header
  if (elements.newFileBtn) {
    elements.newFileBtn.addEventListener('click', () => {
      // If not in project mode, create a new project first
      if (!state.projectMode) {
        if (confirm('Create a new project to add files? Unsaved changes to the current document will be lost.')) {
          newProject();
        }
        return;
      }
      addNewFile('');
    });
  }
  if (elements.newFolderBtn) {
    elements.newFolderBtn.addEventListener('click', () => {
      // If not in project mode, create a new project first
      if (!state.projectMode) {
        if (confirm('Create a new project to add folders? Unsaved changes to the current document will be lost.')) {
          newProject();
        }
        return;
      }
      addNewFolder('');
    });
  }
  
  // Toast close buttons
  elements.closeError.addEventListener('click', () => hideToast('error'));
  elements.closeSuccess.addEventListener('click', () => hideToast('success'));
  
  // Projects drawer
  if (elements.projectsBtn) {
    elements.projectsBtn.addEventListener('click', openProjectsDrawer);
  }
  if (elements.closeDrawer) {
    elements.closeDrawer.addEventListener('click', closeProjectsDrawer);
  }
  if (elements.drawerOverlay) {
    elements.drawerOverlay.addEventListener('click', closeProjectsDrawer);
  }

  // GitHub modal
  if (elements.drawerGithubBtn) {
    elements.drawerGithubBtn.addEventListener('click', openGithubModal);
  }
  if (elements.closeGithubModal) {
    elements.closeGithubModal.addEventListener('click', closeGithubModal);
  }
  if (elements.githubModalOverlay) {
    elements.githubModalOverlay.addEventListener('click', (e) => {
      if (e.target === elements.githubModalOverlay) closeGithubModal();
    });
  }
  if (elements.githubSave) {
    elements.githubSave.addEventListener('click', connectGithub);
  }
  if (elements.githubDisconnect) {
    elements.githubDisconnect.addEventListener('click', disconnectGithub);
  }
  if (elements.githubPush) {
    elements.githubPush.addEventListener('click', pushToGithub);
  }
  if (elements.githubPull) {
    elements.githubPull.addEventListener('click', pullFromGithub);
  }

  // Save to localStorage on unload
  window.addEventListener('beforeunload', saveToLocalStorage);
}

// ============================================
// EDITOR HANDLERS
// ============================================

function handleEditorChange(e) {
  state.currentLatex = e.target.value;
  
  // Update project file if in project mode
  if (state.projectMode && state.currentFile) {
    state.projectFiles[state.currentFile] = state.currentLatex;
  }
  
  saveToLocalStorage();
  scheduleBackendSave();
}

function updateCursorPosition() {
  const textarea = elements.editor;
  const text = textarea.value.substring(0, textarea.selectionStart);
  const lines = text.split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  
  elements.lineCol.textContent = `Line ${line}, Col ${col}`;
}

// ============================================
// LATEX COMPILATION
// ============================================

async function compile(isInitial = false) {
  if (state.isCompiling) {
    showStatus('Compilation in progress...', 'info');
    return;
  }
  
  state.isCompiling = true;
  state.compileGeneration++;
  const generation = state.compileGeneration;

  // Delayed loading indicator — only show if compile takes >300ms
  const loadingTimer = setTimeout(() => {
    if (state.isCompiling) {
      showLoading('Compiling LaTeX...');
    }
  }, 300);

  showStatus('Compiling...', 'info');
  
  const startTime = Date.now();
  
  try {
    // Save current file content if in project mode
    if (state.projectMode && state.currentFile) {
      state.projectFiles[state.currentFile] = state.currentLatex;
    }
    
    // Get the LaTeX content to compile
    let latexContent = state.currentLatex;
    
    // If in project mode, resolve includes from main file
    if (state.projectMode && state.mainFile) {
      latexContent = state.projectFiles[state.mainFile];
      latexContent = resolveIncludes(latexContent, state.mainFile);
    }
    
    // Validate LaTeX syntax before compilation
    const validationErrors = validateLatexSyntax(latexContent);
    if (validationErrors.length > 0) {
      clearTimeout(loadingTimer);
      hideLoading();
      state.isCompiling = false;
      const errorMsg = validationErrors.map(e => `Line ${e.line}: ${e.message}`).join('\n');
      showErrorToast(validationErrors[0].message + (validationErrors.length > 1 ? ` (+${validationErrors.length - 1} more)` : ''));
      showStatus(`${validationErrors.length} error(s) found`, 'error');
      console.error('LaTeX validation errors:\n' + errorMsg);
      clearPreview(validationErrors);
      return;
    }

    // Use a simple LaTeX to HTML converter for demo purposes
    // In production, you would use SwiftLaTeX or similar
    const htmlContent = await compileLatexToBlob(latexContent);

    // Stale check — a newer compile was triggered while we were working
    if (generation !== state.compileGeneration) return;
    
    state.pdfData = htmlContent;
    state.lastCompileTime = Date.now() - startTime;
    state.lastHtmlContent = htmlContent;
    
    renderPDF(htmlContent, generation);
    
    showStatus(`Compiled successfully (${state.lastCompileTime}ms)`, 'success');
    showSuccessToast(`Document compiled in ${state.lastCompileTime}ms`);
    
  } catch (error) {
    console.error('Compilation error:', error);
    showStatus('Compilation failed', 'error');
    showErrorToast(error.message || 'Failed to compile LaTeX document');
    clearPreview([{ line: '?', message: error.message || 'Compilation failed' }]);
  } finally {
    clearTimeout(loadingTimer);
    state.isCompiling = false;
    hideLoading();
  }
}

/**
 * Compile LaTeX to an HTML string for preview.
 */
async function compileLatexToBlob(latex) {
  try {
    return convertLatexToHTML(latex);
  } catch (error) {
    throw new Error('Failed to compile LaTeX: ' + error.message);
  }
}

/**
 * Extract a balanced brace group from str starting at startPos.
 * Returns { value, end } where value is the content inside {} and end is the
 * position right after the closing brace, or null if not found.
 */
function extractBraceGroup(str, startPos) {
  let pos = str.indexOf('{', startPos);
  if (pos === -1) return null;
  let depth = 0;
  const start = pos + 1;
  for (let i = pos; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) return { value: str.substring(start, i), end: i + 1 };
    }
  }
  return null;
}

/**
 * Validate LaTeX syntax and return errors.
 * Detects common mistakes like missing backslashes before commands.
 */
function validateLatexSyntax(latex) {
  const errors = [];
  const lines = latex.split('\n');

  // Known LaTeX commands that require a leading backslash
  const knownCommands = [
    'documentclass', 'usepackage', 'begin', 'end', 'title', 'author', 'date',
    'maketitle', 'section', 'subsection', 'subsubsection', 'textbf', 'textit',
    'texttt', 'emph', 'href', 'includegraphics', 'input', 'include',
    'newcommand', 'renewcommand', 'newenvironment',
    'name', 'position', 'email', 'github', 'linkedin', 'medium', 'bluesky',
    'cvsection', 'cventry', 'cvskill', 'cvparagraph',
    'makecvheader', 'makecvfooter', 'fontdir', 'colorlet', 'setbool',
    'geometry', 'linespread', 'definecolor', 'color',
    'item', 'label', 'ref', 'cite', 'bibliography', 'bibliographystyle',
    'footnote', 'caption', 'centering', 'noindent',
    'vspace', 'hspace', 'newpage', 'clearpage', 'pagebreak',
  ];

  const commandPattern = new RegExp(
    '(?:^|[^a-zA-Z\\\\])(' + knownCommands.join('|') + ')\\s*[{\\[]',
    'gm'
  );

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comment lines
    if (/^\s*%/.test(line)) continue;

    // Strip inline comments for analysis
    const activeLine = line.replace(/([^\\])%.*$/, '$1');

    // Check for known commands without leading backslash
    let match;
    commandPattern.lastIndex = 0;
    while ((match = commandPattern.exec(activeLine)) !== null) {
      const cmd = match[1];
      const pos = match.index + match[0].indexOf(cmd);

      // Check if preceded by a backslash
      if (pos > 0 && activeLine[pos - 1] === '\\') continue;

      errors.push({
        line: lineNum,
        column: pos + 1,
        command: cmd,
        message: `Missing backslash: "${cmd}{" should be "\\${cmd}{" (line ${lineNum})`,
        suggestion: `\\${cmd}`,
      });
    }

    // Check for unmatched \begin without corresponding \end (basic check)
    const begins = (activeLine.match(/\\begin\{([^}]+)\}/g) || []);
    for (const b of begins) {
      const envName = b.match(/\\begin\{([^}]+)\}/)[1];
      // Only flag if the entire document doesn't have a matching \end
      const endPattern = new RegExp(`\\\\end\\{${envName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`);
      if (!endPattern.test(latex)) {
        errors.push({
          line: lineNum,
          column: activeLine.indexOf(b) + 1,
          command: 'begin',
          message: `Unmatched \\begin{${envName}} — missing \\end{${envName}} (line ${lineNum})`,
          suggestion: `\\end{${envName}}`,
        });
      }
    }
  }

  // Comprehensive set of recognized LaTeX commands (preamble, formatting, structure, CV-class)
  const allRecognizedCommands = new Set([
    ...knownCommands,
    ...LATEX_MATH_COMMANDS,
    // Preamble-only commands
    'documentclass', 'usepackage', 'newcommand', 'renewcommand', 'newenvironment',
    'fontdir', 'colorlet', 'setbool', 'geometry', 'linespread', 'definecolor',
    'RequirePackage', 'ProvidesClass', 'LoadClass', 'DeclareOption', 'ProcessOptions',
    'pagestyle', 'thispagestyle', 'setlength', 'setcounter', 'addtocounter',
    // Formatting & structure
    'textbf', 'textit', 'texttt', 'textsc', 'textsf', 'textrm', 'textsl',
    'emph', 'underline', 'uppercase', 'lowercase', 'MakeUppercase', 'MakeLowercase',
    'tiny', 'scriptsize', 'footnotesize', 'small', 'normalsize',
    'large', 'Large', 'LARGE', 'huge', 'Huge',
    'color', 'textcolor', 'colorbox', 'fcolorbox',
    // References & citations
    'label', 'ref', 'pageref', 'cite', 'nocite', 'bibliography', 'bibliographystyle',
    'footnote', 'footnotemark', 'footnotetext',
    // Floats & figures
    'caption', 'includegraphics', 'centering', 'raggedleft', 'raggedright',
    // Structure
    'chapter', 'paragraph', 'subparagraph', 'part',
    'section', 'subsection', 'subsubsection',
    // Spacing & layout
    'vspace', 'hspace', 'vfill', 'hfill', 'newpage', 'clearpage', 'pagebreak',
    'noindent', 'indent', 'par', 'linebreak', 'newline',
    'smallskip', 'medskip', 'bigskip',
    // Boxes
    'mbox', 'makebox', 'fbox', 'framebox', 'parbox', 'minipage', 'raisebox',
    // Text symbols
    'textbar', 'textperiodcentered', 'texteuro', 'textendash', 'textemdash',
    'textasciitilde', 'textbackslash', 'ldots', 'dots',
    // Misc standard
    'LaTeX', 'TeX', 'today', 'thanks', 'rule', 'phantom', 'hphantom', 'vphantom',
    'multicolumn', 'cline', 'hline', 'toprule', 'midrule', 'bottomrule',
    'hrule', 'providecommand',
    'usepackage', 'RequirePackage', 'newenvironment',
    'labelitemi', 'labelitemii', 'labelitemiii', 'parskip',
    'extracolsep', 'fill', 'linewidth',
    // CV-class
    'name', 'position', 'email', 'github', 'linkedin', 'medium', 'bluesky',
    'cvsection', 'cventry', 'cvskill', 'cvparagraph', 'cvhonor',
    'makecvheader', 'makecvfooter',
    // Links & misc
    'href', 'url', 'input', 'include', 'item',
    'maketitle', 'tableofcontents', 'listoffigures', 'listoftables',
    'appendix', 'frontmatter', 'mainmatter', 'backmatter',
    'enskip', 'cdotp', 'thepage',
  ]);

  // Parse user-defined commands and environments from the preamble
  const preamble = latex.match(/^([\s\S]*?)\\begin\{document\}/);
  if (preamble) {
    const newcmdPattern = /\\(?:newcommand|renewcommand|providecommand)\s*\{?\\([a-zA-Z]+)\}?/g;
    let ncMatch;
    while ((ncMatch = newcmdPattern.exec(preamble[1])) !== null) {
      allRecognizedCommands.add(ncMatch[1]);
    }
    // Also recognize custom environments used via \begin{name}
    const newenvPattern = /\\newenvironment\{([a-zA-Z]+)\}/g;
    let neMatch;
    while ((neMatch = newenvPattern.exec(preamble[1])) !== null) {
      allRecognizedCommands.add(neMatch[1]);
    }
  }

  // Detect unknown \command patterns in the document body
  const docBodyMatch = latex.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  const bodyContent = docBodyMatch ? docBodyMatch[1] : latex;
  const bodyStartLine = docBodyMatch
    ? latex.substring(0, latex.indexOf('\\begin{document}')).split('\n').length
    : 1;

  {
    const bodyLines = bodyContent.split('\n');
    const unknownCmdPattern = /\\([a-zA-Z]+)/g;

    for (let i = 0; i < bodyLines.length; i++) {
      const bLine = bodyLines[i];
      if (/^\s*%/.test(bLine)) continue;
      const activeBLine = bLine.replace(/([^\\])%.*$/, '$1');
      let ucMatch;
      unknownCmdPattern.lastIndex = 0;
      while ((ucMatch = unknownCmdPattern.exec(activeBLine)) !== null) {
        const cmd = ucMatch[1];
        if (cmd === 'begin' || cmd === 'end') continue;
        if (!allRecognizedCommands.has(cmd)) {
          errors.push({
            line: bodyStartLine + i,
            column: ucMatch.index + 1,
            command: cmd,
            message: `Command "\\${cmd}" is not supported (line ${bodyStartLine + i})`,
            suggestion: '',
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Parse \newcommand / \newenvironment definitions from the preamble
 * and expand them in the document body.
 */
function expandUserMacros(preamble, body) {
  // Parse \newcommand{\name}[numArgs]{definition}
  const macroRegex = /\\(?:newcommand|renewcommand)\s*\{?\\([a-zA-Z]+)\}?\s*(?:\[(\d+)\])?\s*/g;
  const macros = [];
  let mMatch;

  while ((mMatch = macroRegex.exec(preamble)) !== null) {
    const name = mMatch[1];
    const numArgs = parseInt(mMatch[2] || '0', 10);
    const defGroup = extractBraceGroup(preamble, mMatch.index + mMatch[0].length);
    if (!defGroup) continue;
    macros.push({ name, numArgs, definition: defGroup.value });
  }

  // Expand macros in the body (up to 3 passes for nested macros)
  let result = body;
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (const macro of macros) {
      const pattern = new RegExp('\\\\' + macro.name + '(?![a-zA-Z])', 'g');
      let match;
      while ((match = pattern.exec(result)) !== null) {
        const start = match.index;
        let pos = start + match[0].length;
        // Skip whitespace
        while (pos < result.length && /\s/.test(result[pos])) pos++;

        // Extract arguments
        const args = [];
        for (let i = 0; i < macro.numArgs; i++) {
          const group = extractBraceGroup(result, pos);
          if (!group) break;
          args.push(group.value);
          pos = group.end;
          while (pos < result.length && /\s/.test(result[pos])) pos++;
        }

        // Substitute #1, #2, etc. in the definition
        let expanded = macro.definition;
        for (let i = 0; i < args.length; i++) {
          expanded = expanded.replace(new RegExp('#' + (i + 1), 'g'), args[i]);
        }

        result = result.substring(0, start) + expanded + result.substring(pos);
        pattern.lastIndex = start + expanded.length;
        changed = true;
      }
    }
    if (!changed) break;
  }

  return result;
}

/**
 * Convert LaTeX to HTML.
 * Handles standard article commands plus CV-class commands
 * (\cvsection, \cventry, \cvskill, \cvparagraph, etc.)
 */
function convertLatexToHTML(latex) {
  // 1. Strip LaTeX comments (% to end-of-line) but preserve escaped \%
  latex = latex.replace(/^%.*$/gm, '');
  latex = latex.replace(/([^\\])%.*$/gm, '$1');

  // 2. Extract metadata from preamble (before \begin{document})
  // Use pattern that handles one level of nested braces: (?:[^{}]|\{[^}]*\})*
  const NB = '(?:[^{}]|\\{[^}]*\\})*'; // nested-brace-safe capture pattern
  const titleMatch = latex.match(new RegExp(`\\\\title\\{(${NB})\\}`));
  const authorMatch = latex.match(new RegExp(`\\\\author\\{(${NB})\\}`));
  const dateMatch = latex.match(new RegExp(`\\\\date\\{(${NB})\\}`));

  // CV-class personal info (handles \color{x} inside arguments)
  const nameMatch = latex.match(new RegExp(`\\\\name\\{(${NB})\\}\\{(${NB})\\}`));
  const positionMatch = latex.match(new RegExp(`\\\\position\\{(${NB})\\}`));
  const emailMatch = latex.match(/\\email\{([^}]*)\}/);
  const githubMatch = latex.match(/\\github\{([^}]*)\}/);
  const linkedinMatch = latex.match(/\\linkedin\{([^}]*)\}/);
  const mediumMatch = latex.match(/\\medium\{([^}]*)\}/);

  let title = '';
  let subtitle = '';
  let contactLine = '';

  if (nameMatch) {
    const cleanFirst = nameMatch[1].replace(/\\color\{[^}]*\}/g, '').trim();
    const cleanLast = nameMatch[2].replace(/\\color\{[^}]*\}/g, '').trim();
    // Preserve color for first name — render as teal span
    title = `<span class="name-first">${escapeHtml(cleanFirst)}</span> ${escapeHtml(cleanLast)}`;
    if (positionMatch) {
      let pos = positionMatch[1];
      pos = pos
        .replace(/\{\\enskip\\cdotp\\enskip\}/g, ' · ')
        .replace(/\\enskip\\cdotp\\enskip/g, ' · ')
        .replace(/\\enskip/g, ' ')
        .replace(/\\cdotp/g, '·')
        .replace(/\\color\{[^}]*\}/g, '')
        .replace(/\{([^{}]*)\}/g, '$1');
      subtitle = escapeHtml(pos.trim());
    }
    // Build contact links with inline SVG icons
    const contactParts = [];
    if (emailMatch) {
      const e = escapeHtml(emailMatch[1]);
      contactParts.push(`<a href="mailto:${e}" class="contact-link"><svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>${e}</a>`);
    }
    if (githubMatch) {
      const g = escapeHtml(githubMatch[1]);
      contactParts.push(`<a href="https://github.com/${g}" target="_blank" rel="noopener" class="contact-link"><svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>${g}</a>`);
    }
    if (linkedinMatch) {
      const l = escapeHtml(linkedinMatch[1]);
      contactParts.push(`<a href="https://linkedin.com/in/${l}" target="_blank" rel="noopener" class="contact-link"><svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>${l}</a>`);
    }
    if (mediumMatch) {
      const m = escapeHtml(mediumMatch[1]);
      contactParts.push(`<a href="https://medium.com/@${m}" target="_blank" rel="noopener" class="contact-link"><svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>@${m}</a>`);
    }
    if (contactParts.length) contactLine = contactParts.join('<span class="contact-sep">|</span>');
  } else {
    title = titleMatch ? escapeHtml(titleMatch[1]) : '';
    subtitle = authorMatch ? escapeHtml(authorMatch[1]) : '';
    contactLine = dateMatch
      ? escapeHtml(dateMatch[1].replace('\\today', new Date().toLocaleDateString()))
      : '';
  }

  // 3. Extract document body
  const docMatch = latex.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  let content = docMatch ? docMatch[1] : latex;

  // 3.5. Expand user-defined macros from preamble
  const preamble = latex.match(/^([\s\S]*?)\\begin\{document\}/);
  if (preamble) {
    content = expandUserMacros(preamble[1], content);
  }

  // 4. Strip commands that produce no visible output
  content = content
    .replace(/\\makecvheader\b/g, '')
    .replace(/\\makecvfooter[\s\S]*?\{\\thepage\}/g, '')
    .replace(/\\makecvfooter\b/g, '')
    .replace(/\\maketitle/g, '')
    .replace(/\\vfill/g, '')
    .replace(/\\newpage/g, '<div class="page-break-marker"></div>')
    .replace(/\\clearpage/g, '<div class="page-break-marker"></div>')
    .replace(/\\pagebreak/g, '<div class="page-break-marker"></div>')
    .replace(/\\noindent/g, '')
    .replace(/\\centering/g, '')
    .replace(/\\fontdir(\[[^\]]*\])?\{[^}]*\}/g, '')
    .replace(/\\colorlet\{[^}]*\}\{[^}]*\}/g, '')
    .replace(/\\setbool\{[^}]*\}\{[^}]*\}/g, '')
    .replace(/\\linespread\{[^}]*\}/g, '')
    .replace(/\\geometry\{[^}]*\}/g, '')
    .replace(/\\thepage/g, '')
    // Strip \renewcommand / \setlength / \setcounter / \pagestyle / \parskip assignments
    .replace(/\\renewcommand[^{]*\{[^}]*\}\{[^}]*\}/g, '')
    .replace(/\\renewcommand\\[a-zA-Z]+\{[^}]*\}/g, '')
    .replace(/\\setlength\{[^}]*\}\{[^}]*\}/g, '')
    .replace(/\\setcounter\{[^}]*\}\{[^}]*\}/g, '')
    .replace(/\\pagestyle\{[^}]*\}/g, '')
    .replace(/\\setlength\{\\[a-zA-Z]+\}\{[^}]*\}/g, '')
    .replace(/\\parskip\s*=\s*[^\n]*/g, '')
    .replace(/\\labelitemi/g, '')
    .replace(/\\labelitemii/g, '');

  // 4.5. Process LaTeX escape sequences EARLY (before escapeHtml in parseCvEntries)
  content = content.replace(/\\&/g, '&');
  content = content.replace(/\\%/g, '%');
  content = content.replace(/\\#/g, '#');
  content = content.replace(/\\\$/g, '$');
  content = content.replace(/\\_/g, '_');
  content = content.replace(/\\~/g, '~');

  // 4.6. Text symbol commands → unicode characters
  content = content
    .replace(/\\textbar\s*(\{\})?/g, '|')
    .replace(/\\textperiodcentered\s*(\{\})?/g, '·')
    .replace(/\\texteuro\s*(\{\})?/g, '€')
    .replace(/\\textendash\s*(\{\})?/g, '–')
    .replace(/\\textemdash\s*(\{\})?/g, '—')
    .replace(/\\textasciitilde\s*(\{\})?/g, '~')
    .replace(/\\textbackslash\s*(\{\})?/g, '\\')
    .replace(/\\LaTeX\b/g, 'LaTeX')
    .replace(/\\TeX\b/g, 'TeX')
    .replace(/\\ldots/g, '…')
    .replace(/\\dots/g, '…');

  // 4.7. \vspace / \hspace → small spacing (not stripped entirely)
  content = content.replace(/\\vspace\*?\{([^}]*)\}/g, (_, val) => {
    const neg = val.trim().startsWith('-');
    if (neg) return '';
    return '<div style="height: 0.5em;"></div>';
  });
  content = content.replace(/\\hspace\*?\{[^}]*\}/g, '&nbsp;');

  // 4.8. \hrule → horizontal rule
  content = content.replace(/\\hrule/g, '<hr style="border: none; border-top: 1px solid #2A2724; margin: 0.3em 0;">');

  // 4.9. \\ (line break) → <br> — but not inside environments that handle it
  // Process \\ at end-of-line or followed by whitespace/[ — but be careful not to break tabular
  content = content.replace(/\\\\\s*(?:\[([^\]]*)\])?\s*(?=\n|$)/gm, '<br>');

  // 4.10. \begin{center}...\end{center}
  content = content.replace(/\\begin\{center\}/g, '<div style="text-align: center;">');
  content = content.replace(/\\end\{center\}/g, '</div>');

  // 4.11. \begin{tabular*}{...}{...} ... \end{tabular*} → flex row
  // Uses balanced brace parsing to handle nested braces in column specs
  content = parseTabularEnvs(content);

  // 4.12. \begin{list}...\end{list}, \begin{indentsection}...\end{indentsection}
  content = content.replace(/\\begin\{list\}(?:\{[^}]*\})*(?:\{[\s\S]*?\})?/g, '<div style="padding-left: 1em;">');
  content = content.replace(/\\end\{list\}/g, '</div>');
  content = content.replace(/\\begin\{indentsection\}\{[^}]*\}/g, '<div style="padding-left: 1em;">');
  content = content.replace(/\\end\{indentsection\}/g, '</div>');

  // 4.13. Font size commands wrapping text
  content = content.replace(/\{\\LARGE\s+([^}]*)\}/g, '<span style="font-size: 17pt;">$1</span>');
  content = content.replace(/\{\\Large\s+([^}]*)\}/g, '<span style="font-size: 14pt;">$1</span>');
  content = content.replace(/\{\\large\s+([^}]*)\}/g, '<span style="font-size: 12pt;">$1</span>');
  content = content.replace(/\{\\small\s+([^}]*)\}/g, '<span style="font-size: 9pt;">$1</span>');
  // Also when used as \\LARGE inside headings
  content = content.replace(/\\LARGE\s+/g, '');
  content = content.replace(/\\Large\s+/g, '');
  content = content.replace(/\\large\s+/g, '');
  content = content.replace(/\\small\s+/g, '');

  // 4.14. \item[] → item without marker
  content = content.replace(/\\item\[\]/g, '<li style="list-style: none; margin-left: -1.5em;">');

  // 4.15. Section headings (process BEFORE font-size stripping so \Large inside args works)
  content = content
    .replace(/\\section\*?\{([^}]*)\}/g, (_, s) => `<h2>${s.replace(/\\Large\s*/g, '').replace(/\\LARGE\s*/g, '').replace(/\\large\s*/g, '')}</h2>`)
    .replace(/\\subsection\*?\{([^}]*)\}/g, (_, s) => `<h3>${s.replace(/\\Large\s*/g, '').replace(/\\LARGE\s*/g, '').replace(/\\large\s*/g, '')}</h3>`)
    .replace(/\\subsubsection\*?\{([^}]*)\}/g, (_, s) => `<h4>${s.replace(/\\Large\s*/g, '').replace(/\\LARGE\s*/g, '').replace(/\\large\s*/g, '')}</h4>`)
    .replace(/\\paragraph\*?\{([^}]*)\}/g, (_, s) => `<h5>${s}</h5>`);

  // 5. Handle \href{url}{text} → link
  content = content.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, (_, url, text) => {
    const safeUrl = escapeHtml(url);
    const cleanText = text.replace(/\\color\{[^}]*\}/g, '');
    return `<a href="${safeUrl}" target="_blank" rel="noopener">${escapeHtml(cleanText)}</a>`;
  });

  // 6. Handle includegraphics
  content = content.replace(/\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g, (match, filename) => {
    const safeFilename = escapeHtml(filename);
    if (state.projectMode && state.projectFiles) {
      const extensions = ['', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf'];
      for (const ext of extensions) {
        const imgPath = filename + ext;
        const imgData = state.projectFiles[imgPath];
        if (isBinaryContent(imgData)) {
          const actualExt = imgPath.split('.').pop().toLowerCase();
          const mimeTypes = { 'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'gif': 'image/gif', 'svg': 'image/svg+xml' };
          const mimeType = mimeTypes[actualExt] || 'application/octet-stream';
          return `<img src="data:${escapeHtml(mimeType)};base64,${imgData.content}" alt="${safeFilename}" style="max-width: 100%; height: auto;">`;
        }
      }
    }
    return `<div style="padding: 1em; background: #f0f0f0; border: 1px dashed #ccc; text-align: center; color: #666;">[Image: ${safeFilename}]</div>`;
  });

  // 7. CV-class section heading — title-case with extending line
  content = content.replace(/\\cvsection\{([^}]*)\}/g, (_, s) => {
    const clean = s.replace(/\\color\{[^}]*\}/g, '').trim();
    // Title-case: capitalize first letter of each word
    const titleCase = clean.replace(/\b\w/g, c => c.toUpperCase());
    return `<h2 class="cv-section">${escapeHtml(titleCase)}</h2>`;
  });

  // 8. Parse \cventry with 5 balanced-brace arguments
  content = parseCvEntries(content);

  // 9. Parse \cvskill with balanced-brace arguments
  content = parseCvSkills(content);

  // 10. CV environments → simple containers
  content = content
    .replace(/\\begin\{cventries\}/g, '<div class="cv-entries">')
    .replace(/\\end\{cventries\}/g, '</div>')
    .replace(/\\begin\{cvskills\}/g, '<div class="cv-skills">')
    .replace(/\\end\{cvskills\}/g, '</div>')
    .replace(/\\begin\{cvparagraph\}/g, '<div class="cv-paragraph">')
    .replace(/\\end\{cvparagraph\}/g, '</div>')
    .replace(/\\begin\{cvitems\}/g, '<ul class="cv-items">')
    .replace(/\\end\{cvitems\}/g, '</ul>');

  // 11. Standard LaTeX conversions (sections already handled in 4.15)
  content = content
    .replace(/\\textbf\{([^}]*)\}/g, (_, s) => `<strong>${s}</strong>`)
    .replace(/\\textit\{([^}]*)\}/g, (_, s) => `<em>${s}</em>`)
    .replace(/\\texttt\{([^}]*)\}/g, (_, s) => `<code>${s}</code>`)
    .replace(/\\textsc\{([^}]*)\}/g, (_, s) => `<span style="font-variant: small-caps;">${s}</span>`)
    .replace(/\\emph\{([^}]*)\}/g, (_, s) => `<em>${s}</em>`)
    .replace(/\\underline\{([^}]*)\}/g, (_, s) => `<u>${s}</u>`)
    // itemize* (compact, from mdwlist) and itemize with options
    .replace(/\\begin\{itemize\*\}/g, '<ul class="compact-list">')
    .replace(/\\end\{itemize\*\}/g, '</ul>')
    .replace(/\\begin\{itemize\}(?:\[[^\]]*\])?/g, '<ul>')
    .replace(/\\end\{itemize\}/g, '</ul>')
    .replace(/\\begin\{enumerate\}(?:\[[^\]]*\])?/g, '<ol>')
    .replace(/\\end\{enumerate\}/g, '</ol>')
    .replace(/\\item\s*/g, '<li>')
    .replace(/\\begin\{equation\}/g, '\\[')
    .replace(/\\end\{equation\}/g, '\\]')
    .replace(/\\begin\{align\*?\}/g, '\\[\\begin{aligned}')
    .replace(/\\end\{align\*?\}/g, '\\end{aligned}\\]')
    .replace(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g, (_, s) => `<pre>${escapeHtml(s)}</pre>`);

  // 12. Strip \color{...} commands (keep surrounding text)
  content = content.replace(/\\color\{[^}]*\}/g, '');

  // 13. Clean up remaining unknown commands (preserve math-related ones)
  content = content.replace(/\\([a-zA-Z]+)(\{([^}]*)\})?/g, (match, cmd, full, arg) => {
    if (LATEX_MATH_COMMANDS.includes(cmd)) return match;
    return arg || '';
  });

  // 14. Remove stray bare braces (LaTeX grouping braces that aren't part of HTML tags)
  // Only strip { } that aren't inside HTML tags
  content = content.replace(/\{([^{}]*)\}/g, '$1');

  // 15. Clean up remaining escaped percent (any that survived)
  content = content.replace(/\\%/g, '%');

  // 16. Collapse excessive whitespace — remove runs of <br> tags with only whitespace
  content = content.replace(/(?:<br\s*\/?\s*>[\t ]*\n?){3,}/gi, '<br>');
  content = content.replace(/\n\n+/g, '<br>');
  // Strip <br> immediately after block elements (sections, divs, headings)
  content = content.replace(/(<\/(?:h[1-6]|div|ul|ol|li|p)>)(?:[\t ]*\n?<br[\t ]*\/?>[\t ]*\n?)+/gi, '$1');
  content = content.replace(/(<(?:h[1-6]|div)[^>]*>)(?:[\t ]*\n?<br[\t ]*\/?>[\t ]*\n?)+/gi, '$1');
  // Strip <br> immediately before block elements
  content = content.replace(/(?:<br[\t ]*\/?>[\t ]*\n?)+[\t ]*(<(?:h[1-6]|div|ul|ol)[^>]*>)/gi, '$1');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Source+Serif+4:wght@300;400;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body {
          font-family: 'Source Serif 4', Georgia, serif;
          font-size: 10pt;
          line-height: 1.45;
          color: #2A2724;
          background: #e8e4de;
          margin: 0;
          padding: 20px 0;
        }

        .page {
          width: 8.5in;
          min-height: 11in;
          margin: 0 auto 24px auto;
          padding: 0.4in 0.5in;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
        }

        .page-number {
          position: absolute;
          bottom: 0.3in;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 8pt;
          color: #888;
          font-family: 'Source Serif 4', Georgia, serif;
        }

        @media print {
          body { background: white; padding: 0; margin: 0; }
          .page {
            box-shadow: none;
            margin: 0;
            page-break-after: always;
            min-height: auto;
          }
          .page:last-child { page-break-after: avoid; }
          .page-number { display: none; }
        }

        h1, h2, h3, h4 {
          font-family: 'Merriweather', Georgia, serif;
          font-weight: 700;
          margin-top: 0.6em;
          margin-bottom: 0.15em;
          line-height: 1.2;
        }

        h1 { font-size: 22pt; text-align: center; margin-top: 0.2em; margin-bottom: 0.05em; }
        h2 { font-size: 14pt; border-bottom: 1px solid #D4CEC0; padding-bottom: 0.1em; }
        h3 { font-size: 12pt; }
        h4 { font-size: 10pt; }

        .name-first { color: #4A6E6B; }

        .author, .date {
          text-align: center;
          font-size: 9pt;
          margin-bottom: 0.1em;
          color: #3A3632;
          line-height: 1.3;
        }
        .author {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-variant: small-caps;
        }

        .contact-link {
          color: #4A6E6B;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.2em;
        }
        .contact-link:hover { text-decoration: underline; }
        .contact-icon {
          width: 0.85em;
          height: 0.85em;
          flex-shrink: 0;
          vertical-align: middle;
        }
        .contact-sep {
          margin: 0 0.4em;
          color: #A39D8F;
        }

        ul, ol { margin: 0.2em 0; padding-left: 1.5em; }
        li { margin: 0.1em 0; font-size: 9.5pt; }

        .equation { text-align: center; margin: 1.5em 0; padding: 1em; overflow-x: auto; }

        pre {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 10pt;
          background: #F5F2EB;
          padding: 1em;
          border-radius: 4px;
          overflow-x: auto;
          line-height: 1.5;
        }

        code {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 10pt;
          background: #F5F2EB;
          padding: 0.125em 0.375em;
          border-radius: 2px;
        }

        strong { font-weight: 600; }
        em { font-style: italic; }
        a { color: #4A6E6B; text-decoration: none; }
        a:hover { text-decoration: underline; }

        mjx-container { margin: 1em 0; }

        /* CV-specific styles */
        .cv-section {
          display: flex;
          align-items: center;
          gap: 0.4em;
          font-size: 14pt;
          font-weight: 700;
          color: #4A6E6B;
          border-bottom: none;
          padding-bottom: 0;
          margin-top: 0.6em;
          margin-bottom: 0.1em;
          text-transform: none;
          letter-spacing: 0;
        }
        .cv-section::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #B0ACA4;
        }
        .cv-entry { margin-bottom: 0.5em; break-inside: avoid; }
        .cv-entry-header, .cv-entry-subheader {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          flex-wrap: nowrap;
          gap: 0.5em;
        }
        .cv-entry-left { flex: 1; min-width: 0; }
        .cv-entry-right { flex-shrink: 0; text-align: right; font-size: 9pt; color: #555; white-space: nowrap; }
        .cv-entry-role { font-weight: 700; font-size: 10pt; }
        .cv-entry-role-link { color: #4A6E6B; font-weight: 700; font-size: 10pt; }
        .cv-entry-org { font-size: 9.5pt; color: #3A3632; }
        .cv-entry-body { margin-top: 0.05em; font-size: 9.5pt; }
        .cv-entry-body ul { margin: 0.05em 0; }
        .cv-entry-body li { margin: 0.02em 0; }

        .cv-skills { margin-bottom: 0.2em; }
        .cv-skill {
          display: flex;
          align-items: baseline;
          gap: 0.6em;
          margin: 0.15em 0;
          font-size: 9.5pt;
          line-height: 1.4;
        }
        .cv-skill-label {
          font-weight: 700;
          white-space: nowrap;
          text-align: right;
          min-width: 5em;
          flex-shrink: 0;
          color: #2A2724;
        }
        .cv-skill-value { flex: 1; }

        .cv-paragraph { margin: 0.2em 0; font-size: 9.5pt; line-height: 1.4; }
        .cv-items { margin: 0.05em 0; padding-left: 1.5em; }
        .cv-items li { margin: 0.02em 0; font-size: 9.5pt; }

        br + br { display: none; }
        .page-break-marker { display: none; }
        .compact-list { margin: 0; padding-left: 1.5em; }
        .compact-list li { margin: 0; padding: 0; line-height: 1.3; }
        hr { break-inside: avoid; }
        h2, h3, h4, h5 { break-after: avoid; }
      </style>

      <script>
        MathJax = {
          tex: {
            inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
            displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
            processEscapes: true,
            processEnvironments: true
          },
          options: {
            skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
          }
        };
      </script>
      <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    </head>
    <body>
      <div class="page" id="page-1">
        ${title ? `<h1>${title}</h1>` : ''}
        ${subtitle ? `<div class="author">${subtitle}</div>` : ''}
        ${contactLine ? `<div class="date">${contactLine}</div>` : ''}
        ${content}
      </div>

      <script>
      document.addEventListener('DOMContentLoaded', () => {
        requestAnimationFrame(() => { setTimeout(paginate, 500); });
      });

      function wrapTextNodes(parent) {
        const nodes = Array.from(parent.childNodes);
        let buffer = [];
        const groups = [];
        for (const node of nodes) {
          const isBlock = node.nodeType === 1 &&
            window.getComputedStyle(node).display !== 'inline';
          if (isBlock) {
            if (buffer.length) { groups.push(buffer); buffer = []; }
            groups.push([node]);
          } else if (node.nodeType === 3 && !node.textContent.trim()) {
            // skip whitespace-only text
          } else {
            buffer.push(node);
          }
        }
        if (buffer.length) groups.push(buffer);

        while (parent.firstChild) parent.removeChild(parent.firstChild);
        for (const group of groups) {
          if (group.length === 1 && group[0].nodeType === 1 &&
              window.getComputedStyle(group[0]).display !== 'inline') {
            parent.appendChild(group[0]);
          } else {
            const w = document.createElement('div');
            group.forEach(n => w.appendChild(n));
            parent.appendChild(w);
          }
        }
      }

      function paginate() {
        const PAGE_HEIGHT = 11 * 96;
        const PADDING_V  = 0.4 * 96;
        const FOOTER_H   = 0.35 * 96;
        const USABLE     = PAGE_HEIGHT - 2 * PADDING_V - FOOTER_H;

        const firstPage = document.getElementById('page-1');
        if (!firstPage) return;

        wrapTextNodes(firstPage);

        const children = Array.from(firstPage.children);
        const pages = [firstPage];
        children.forEach(c => firstPage.removeChild(c));

        let currentPage = firstPage;
        let currentHeight = 0;

        function newPage() {
          const page = document.createElement('div');
          page.className = 'page';
          document.body.appendChild(page);
          pages.push(page);
          currentHeight = 0;
          return page;
        }

        for (const child of children) {
          if (child.classList && child.classList.contains('page-break-marker')) {
            currentPage = newPage();
            continue;
          }

          currentPage.appendChild(child);
          const childHeight = child.getBoundingClientRect().height;

          if (currentHeight + childHeight > USABLE && currentHeight > 0) {
            currentPage.removeChild(child);
            currentPage = newPage();
            currentPage.appendChild(child);
            currentHeight = child.getBoundingClientRect().height;
          } else {
            currentHeight += childHeight;
          }
        }

        const total = pages.length;
        pages.forEach((page, i) => {
          page.id = 'page-' + (i + 1);
          const num = document.createElement('div');
          num.className = 'page-number';
          num.textContent = (i + 1) + ' / ' + total;
          page.appendChild(num);
        });

        if (window.parent !== window) {
          window.parent.postMessage({ type: 'latex-page-count', count: total }, '*');
        }
      }
      </script>
    </body>
    </html>
  `;
}

/**
 * Process inline LaTeX commands in CV field text to produce clean HTML.
 * Strips formatting commands like \textbf, \textit while preserving their content,
 * removes remaining \command{arg} → arg, and cleans stray braces.
 */
function processCvFieldText(text) {
  if (!text) return '';
  let t = text;
  // Strip \color{...} using balanced brace extraction
  t = processBalancedCmd(t, 'color', () => '');
  // \textbf{...} → <strong>...</strong>
  t = processBalancedCmd(t, 'textbf', inner => `<strong>${processCvFieldText(inner)}</strong>`);
  // \textit{...} / \emph{...} → <em>...</em>
  t = processBalancedCmd(t, 'textit', inner => `<em>${processCvFieldText(inner)}</em>`);
  t = processBalancedCmd(t, 'emph', inner => `<em>${processCvFieldText(inner)}</em>`);
  // \texttt{...} → <code>...</code>
  t = processBalancedCmd(t, 'texttt', inner => `<code>${processCvFieldText(inner)}</code>`);
  // \href{url}{text}
  t = t.replace(/\\href/g, (_, offset) => {
    const urlGroup = extractBraceGroup(t, offset + 5);
    if (!urlGroup) return _;
    const textGroup = extractBraceGroup(t, urlGroup.end);
    if (!textGroup) return _;
    return ''; // handled below
  });
  // Manual \href handling with balanced braces
  let hrefIdx;
  while ((hrefIdx = t.indexOf('\\href')) !== -1) {
    const urlGroup = extractBraceGroup(t, hrefIdx + 5);
    if (!urlGroup) break;
    const textGroup = extractBraceGroup(t, urlGroup.end);
    if (!textGroup) break;
    const url = escapeHtml(urlGroup.value);
    const linkText = processCvFieldText(textGroup.value);
    t = t.substring(0, hrefIdx) + `<a href="${url}" target="_blank" rel="noopener">${linkText}</a>` + t.substring(textGroup.end);
  }
  // Strip any remaining \command{arg} → arg (using balanced braces)
  const cmdRe = /\\([a-zA-Z]+)/g;
  let cmdMatch;
  while ((cmdMatch = cmdRe.exec(t)) !== null) {
    if (LATEX_MATH_COMMANDS.includes(cmdMatch[1])) continue;
    const braceGroup = extractBraceGroup(t, cmdMatch.index + cmdMatch[0].length);
    if (braceGroup) {
      t = t.substring(0, cmdMatch.index) + braceGroup.value + t.substring(braceGroup.end);
      cmdRe.lastIndex = cmdMatch.index;
    } else {
      t = t.substring(0, cmdMatch.index) + t.substring(cmdMatch.index + cmdMatch[0].length);
      cmdRe.lastIndex = cmdMatch.index;
    }
  }
  // Remove stray braces
  t = t.replace(/\{([^{}]*)\}/g, '$1');
  return t.trim();
}

/**
 * Process a specific \command{...} using balanced brace extraction.
 * Calls replacer(innerContent) for each match.
 */
function processBalancedCmd(str, cmdName, replacer) {
  const pattern = new RegExp('\\\\' + cmdName + '(?![a-zA-Z])');
  let match;
  while ((match = str.match(pattern)) !== null) {
    const cmdStart = match.index;
    const group = extractBraceGroup(str, cmdStart + match[0].length);
    if (!group) break;
    const replacement = replacer(group.value);
    str = str.substring(0, cmdStart) + replacement + str.substring(group.end);
  }
  return str;
}

/**
 * Parse \begin{tabular*} and \begin{tabular} environments using balanced
 * brace extraction so nested braces in column specs are handled correctly.
 */
function parseTabularEnvs(content) {
  const regex = /\\begin\{tabular\*?\}/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const startPos = match.index;
    let pos = match.index + match[0].length;

    // Skip all brace-group arguments (width spec, column spec, etc.)
    while (pos < content.length) {
      const ws = content.substring(pos).match(/^\s*/);
      if (ws) pos += ws[0].length;
      if (content[pos] === '{') {
        const group = extractBraceGroup(content, pos);
        if (!group) break;
        pos = group.end;
      } else {
        break;
      }
    }

    // Find matching \end{tabular*} or \end{tabular}
    const endPattern = /\\end\{tabular\*?\}/g;
    endPattern.lastIndex = pos;
    const endMatch = endPattern.exec(content);
    if (!endMatch) continue;

    const body = content.substring(pos, endMatch.index);
    const endPos = endMatch.index + endMatch[0].length;

    // Convert tabular body: split on & for columns, \\ for rows
    const rows = body.split(/\\\\/).filter(r => r.trim());
    const html = rows.map(row => {
      const cols = row.split('&').map(c => c.trim());
      if (cols.length >= 2) {
        return `<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 0.5em;"><div>${cols[0]}</div><div style="text-align: right; flex-shrink: 0;">${cols[1]}</div></div>`;
      }
      return `<div>${cols[0] || ''}</div>`;
    }).join('');

    content = content.substring(0, startPos) + html + content.substring(endPos);
    regex.lastIndex = startPos + html.length;
  }

  return content;
}

/**
 * Parse \cventry commands with 5 balanced-brace arguments.
 * Handles nested braces in the 5th argument (which contains \begin{cvitems}...).
 */
function parseCvEntries(content) {
  const regex = /\\cventry\s*/g;
  let match;
  const replacements = [];

  while ((match = regex.exec(content)) !== null) {
    const startPos = match.index;
    let pos = match.index + match[0].length;

    const args = [];
    for (let i = 0; i < 5; i++) {
      const group = extractBraceGroup(content, pos);
      if (!group) break;
      args.push(group.value);
      pos = group.end;
      // skip whitespace between arguments
      while (pos < content.length && /\s/.test(content[pos])) pos++;
    }

    if (args.length >= 2) {
      const org = args[0] || '';
      const role = args[1] || '';
      const location = args[2] || '';
      const dates = args[3] || '';
      const body = args[4] || '';

      // Process \href inside org/role, then clean remaining LaTeX commands
      const processedOrg = org.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, (_, u, t) =>
        `<a href="${escapeHtml(u)}" target="_blank" rel="noopener">${processCvFieldText(t)}</a>`
      );
      const orgHtml = processedOrg.includes('<a ') ? processedOrg : processCvFieldText(org);

      const processedRole = role.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, (_, u, t) =>
        `<a href="${escapeHtml(u)}" target="_blank" rel="noopener" class="cv-entry-role-link">${processCvFieldText(t)}</a>`
      );
      const roleHtml = processedRole.includes('<a ') ? processedRole : processCvFieldText(role);

      const html = `<div class="cv-entry">
        <div class="cv-entry-header">
          <div class="cv-entry-left"><span class="cv-entry-role">${roleHtml}</span></div>
          ${location.trim() ? `<div class="cv-entry-right"><em>${processCvFieldText(location)}</em></div>` : ''}
        </div>
        ${org.trim() || dates.trim() ? `<div class="cv-entry-subheader">
          <div class="cv-entry-left"><span class="cv-entry-org">${orgHtml}</span></div>
          ${dates.trim() ? `<div class="cv-entry-right"><em>${processCvFieldText(dates)}</em></div>` : ''}
        </div>` : ''}
        <div class="cv-entry-body">${body}</div>
      </div>`;
      replacements.push({ start: startPos, end: pos, html });
    }
  }

  // Apply in reverse to preserve positions
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    content = content.substring(0, r.start) + r.html + content.substring(r.end);
  }

  return content;
}

/**
 * Parse \cvskill commands with 2 balanced-brace arguments.
 */
function parseCvSkills(content) {
  const regex = /\\cvskill\s*/g;
  let match;
  const replacements = [];

  while ((match = regex.exec(content)) !== null) {
    const startPos = match.index;
    let pos = match.index + match[0].length;

    const args = [];
    for (let i = 0; i < 2; i++) {
      const group = extractBraceGroup(content, pos);
      if (!group) break;
      args.push(group.value);
      pos = group.end;
      while (pos < content.length && /\s/.test(content[pos])) pos++;
    }

    if (args.length >= 2) {
      const cat = processCvFieldText(args[0]);
      const skills = processCvFieldText(args[1]);
      const html = `<div class="cv-skill"><span class="cv-skill-label">${cat}</span><span class="cv-skill-value">${skills}</span></div>`;
      replacements.push({ start: startPos, end: pos, html });
    }
  }

  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    content = content.substring(0, r.start) + r.html + content.substring(r.end);
  }

  return content;
}

// ============================================
// PDF RENDERING
// ============================================

/**
 * Clear the preview panel and show compilation errors.
 */
function clearPreview(errors) {
  state.pdfData = null;
  state.lastHtmlContent = null;

  while (elements.previewContent.firstChild) {
    elements.previewContent.removeChild(elements.previewContent.firstChild);
  }

  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'padding: 2em; font-family: "JetBrains Mono", monospace; font-size: 10pt; color: #c0392b; background: #fdf2f2; border: 1px solid #e6b0aa; border-radius: 4px; margin: 1em;';
  const heading = document.createElement('h3');
  heading.style.cssText = 'margin: 0 0 0.8em 0; color: #922b21; font-size: 12pt;';
  heading.textContent = `Compilation failed — ${errors.length} error(s)`;
  errorDiv.appendChild(heading);

  const list = document.createElement('ul');
  list.style.cssText = 'margin: 0; padding-left: 1.5em; list-style: none;';
  for (const err of errors) {
    const li = document.createElement('li');
    li.style.cssText = 'margin: 0.3em 0; line-height: 1.4;';
    li.textContent = `Line ${err.line}: ${err.message}`;
    list.appendChild(li);
  }
  errorDiv.appendChild(list);
  elements.previewContent.appendChild(errorDiv);
}

/**
 * Render the compiled HTML into the preview panel.
 * Uses document.write into a fresh iframe — avoids srcdoc/blob onload loops.
 */
function renderPDF(htmlString, generation) {
  if (generation !== state.compileGeneration) return;

  while (elements.previewContent.firstChild) {
    elements.previewContent.removeChild(elements.previewContent.firstChild);
  }

  const iframe = document.createElement('iframe');
  iframe.style.width = '8.5in';
  iframe.style.border = 'none';
  iframe.style.background = 'transparent';
  iframe.style.display = 'block';
  iframe.style.margin = '0 auto';

  elements.previewContent.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(htmlString);
  doc.close();

  // Listen for page count — remove any previous listener first
  if (state._pageCountListener) {
    window.removeEventListener('message', state._pageCountListener);
  }
  state._pageCountListener = function onMsg(e) {
    if (e.data && e.data.type === 'latex-page-count' && e.source === iframe.contentWindow) {
      window.removeEventListener('message', onMsg);
      state._pageCountListener = null;
      state.pageCount = e.data.count;
    }
  };
  window.addEventListener('message', state._pageCountListener);

  // Auto-resize iframe to fit all paginated content
  const resizeIframe = () => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc && iframeDoc.body) {
        const height = iframeDoc.body.scrollHeight;
        iframe.style.height = height + 'px';
      }
    } catch (e) { /* cross-origin guard */ }
  };

  // Resize after initial render and after pagination script runs
  setTimeout(resizeIframe, 100);
  setTimeout(resizeIframe, 700);
  setTimeout(resizeIframe, 1500);

  applyZoom();
}

// ============================================
// ZOOM CONTROLS
// ============================================

function setZoom(newZoom) {
  state.zoom = Math.max(0.5, Math.min(2.0, newZoom));
  elements.zoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
  applyZoom();
}

function applyZoom() {
  const iframe = elements.previewContent.querySelector('iframe');
  if (iframe) {
    iframe.style.transform = `scale(${state.zoom})`;
    iframe.style.transformOrigin = 'top center';
    // Estimate total height and adjust margin to prevent cutoff
    const iframeHeight = parseFloat(iframe.style.height) || (11 * 96);
    iframe.style.marginBottom = `${(state.zoom - 1) * iframeHeight}px`;
  }
}

// ============================================
// DOWNLOAD FUNCTIONS
// ============================================

function downloadPDF() {
  if (!state.pdfData) {
    showErrorToast('Please compile the document first');
    return;
  }
  
  try {
    showLoading('Generating PDF...');

    // Create a temporary unsandboxed iframe for export rendering
    // (the preview iframe is sandboxed and blocks parent DOM access)
    const htmlContent = state.lastHtmlContent;
    if (!htmlContent) {
      throw new Error('No compiled content available. Please compile first.');
    }

    const exportIframe = document.createElement('iframe');
    exportIframe.style.position = 'absolute';
    exportIframe.style.width = '8.5in';
    exportIframe.style.height = '11in';
    exportIframe.style.left = '-9999px';
    document.body.appendChild(exportIframe);

    // Attach onload BEFORE writing to avoid race condition
    exportIframe.onload = () => {
      setTimeout(() => {
        try {
          const exportDoc = exportIframe.contentDocument || exportIframe.contentWindow.document;
          const exportBody = exportDoc.body;

          html2canvas(exportBody, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          }).then(canvas => {
            document.body.removeChild(exportIframe);

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }

            pdf.save('document.pdf');
            hideLoading();
            showSuccessToast('PDF downloaded successfully');
          }).catch(error => {
            document.body.removeChild(exportIframe);
            hideLoading();
            console.error('PDF generation error:', error);

            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(htmlContent);
              printWindow.document.close();
              printWindow.print();
              showSuccessToast('Print dialog opened. Save as PDF from print options.');
            } else {
              showErrorToast('Failed to generate PDF. Please allow pop-ups and try again.');
            }
          });
        } catch (error) {
          document.body.removeChild(exportIframe);
          hideLoading();
          console.error('PDF export error:', error);
          showErrorToast('Failed to export PDF: ' + error.message);
        }
      }, 500);
    };

    exportIframe.onerror = () => {
      document.body.removeChild(exportIframe);
      hideLoading();
      showErrorToast('Failed to render content for PDF export');
    };

    // Write content AFTER attaching onload/onerror handlers
    const exportDoc = exportIframe.contentDocument || exportIframe.contentWindow.document;
    exportDoc.open();
    exportDoc.write(htmlContent);
    exportDoc.close();
  } catch (error) {
    hideLoading();
    console.error('PDF download error:', error);
    showErrorToast('Failed to download PDF: ' + error.message);
  }
}

function downloadTeX() {
  try {
    const blob = new Blob([state.currentLatex], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccessToast('LaTeX source downloaded successfully');
  } catch (error) {
    showErrorToast('Failed to download .tex file: ' + error.message);
  }
}

// ============================================
// NEW PROJECT (unified — single files are also projects)
// ============================================

/**
 * Create a new blank single-file project (just main.tex)
 */
function createBlankProject(projectName) {
  if (state.projectMode && state.currentProjectId) {
    saveProjectToBackend();
  }

  const projectTitle = escapeLatex(
    projectName
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  );

  const mainContent = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{graphicx}

\\title{${projectTitle}}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}

Start writing your document here.

\\end{document}
`;

  state.projectFiles = { 'main.tex': mainContent };
  state.mainFile = 'main.tex';
  state.currentFile = 'main.tex';
  state.projectMode = true;
  state.currentLatex = mainContent;

  elements.editor.value = mainContent;
  elements.editor.readOnly = false;
  elements.currentFileName.textContent = 'main.tex';

  buildFileTree(state.projectFiles);
  elements.fileTree.classList.add('visible');
  elements.toggleFileTreeBtn.style.display = 'inline-block';
  elements.downloadZipBtn.style.display = 'inline-block';

  saveProjectToLocalStorage();
  state.currentProjectName = projectName;
  saveProjectToBackend();

  showSuccessToast(`Created project: ${projectName}`);
  compile(true);
}

/**
 * Create a new multi-file project with sections/ structure
 */
function createMultiFileProject(projectName) {
  if (state.projectMode && state.currentProjectId) {
    saveProjectToBackend();
  }

  const projectTitle = escapeLatex(
    projectName
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  );

  const mainContent = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{graphicx}

\\title{${projectTitle}}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\input{sections/introduction}

\\end{document}
`;

  const introContent = `\\section{Introduction}

This is your new LaTeX project. Edit this file or create new sections.

\\subsection{Getting Started}

\\begin{itemize}
    \\item Add more sections using \\texttt{\\\\input{sections/filename}}
    \\item Upload images to an \\texttt{images/} folder
    \\item Add custom fonts to a \\texttt{fonts/} folder
\\end{itemize}
`;

  state.projectFiles = {
    'main.tex': mainContent,
    'sections/introduction.tex': introContent,
  };

  state.mainFile = 'main.tex';
  state.currentFile = 'main.tex';
  state.projectMode = true;
  state.currentLatex = mainContent;

  elements.editor.value = mainContent;
  elements.editor.readOnly = false;
  elements.currentFileName.textContent = 'main.tex';

  buildFileTree(state.projectFiles);
  elements.fileTree.classList.add('visible');
  elements.toggleFileTreeBtn.style.display = 'inline-block';
  elements.downloadZipBtn.style.display = 'inline-block';

  saveProjectToLocalStorage();
  state.currentProjectName = projectName;
  saveProjectToBackend();

  showSuccessToast(`Created project: ${projectName}`);
  compile(true);
}

/**
 * Open the new project modal.
 * Replaces the old separate newDocument() / newProject() flows.
 */
function openNewProjectModal() {
  if (state.projectMode && Object.keys(state.projectFiles).length > 0 &&
      state.currentLatex !== DEFAULT_TEMPLATE &&
      !confirm('Create new project? You will switch away from the current project.')) {
    return;
  }
  elements.newProjectModalOverlay.style.display = 'flex';
  elements.newProjectName.value = '';
  elements.newProjectName.focus();
}

function closeNewProjectModal() {
  elements.newProjectModalOverlay.style.display = 'none';
}

function handleNewProjectCreate(type) {
  const name = elements.newProjectName.value.trim();
  if (!name) {
    showErrorToast('Please enter a project name');
    elements.newProjectName.focus();
    return;
  }

  closeNewProjectModal();
  closeProjectsDrawer();

  if (type === 'blank') {
    createBlankProject(name);
  } else if (type === 'multifile') {
    createMultiFileProject(name);
  } else if (type === 'zip') {
    // Store the name for the zip upload handler, then trigger file picker
    state._pendingProjectName = name;
    elements.zipFileInput.click();
  }
}

// Keep newDocument/newProject as aliases for backward compat (event listeners)
function newDocument() { openNewProjectModal(); }
function newProject() { openNewProjectModal(); }

// ============================================
// LOCAL STORAGE
// ============================================

/**
 * Encode string for localStorage storage (base64 + URI encoding)
 * Handles unicode characters safely for localStorage
 */
function encodeForStorage(str) {
  if (!str) return '';
  
  try {
    // Use base64 encoding with URI encoding for safe storage
    // This handles unicode characters properly
    return btoa(encodeURIComponent(str));
  } catch (error) {
    console.error('Encoding failed:', error);
    return str;
  }
}

/**
 * Decode string from localStorage storage
 */
function decodeFromStorage(str) {
  if (!str) return '';
  
  try {
    return decodeURIComponent(atob(str));
  } catch (error) {
    console.error('Decoding failed:', error);
    return str;
  }
}

/**
 * Check if content represents a binary file
 */
function isBinaryContent(content) {
  return content && typeof content === 'object' && content.isBinary;
}

/**
 * Escape LaTeX special characters in a string
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string safe for use in LaTeX
 */
function escapeLatex(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, match => '\\' + match)
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}');
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - The string to escape
 * @returns {string} - The HTML-safe string
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate and sanitize a filename or path segment.
 * Rejects path traversal, control characters, and dangerous patterns.
 * @param {string} name - The filename to validate
 * @returns {string|null} - Sanitized name, or null if invalid
 */
function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;

  // Reject path traversal and path separators; only allow a single filename
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) return null;

  // Reject control characters
  if (/[\x00-\x1f\x7f]/.test(trimmed)) return null;

  // Reject empty segments (double slashes)
  if (/\/\//.test(trimmed)) return null;

  // Reject very long names
  if (trimmed.length > 255) return null;

  return trimmed;
}

/**
 * Validate a file path from a ZIP entry or user input.
 * @param {string} path - The path to validate
 * @returns {string|null} - Normalized safe path, or null if invalid
 */
function sanitizePath(path) {
  if (!path || typeof path !== 'string') return null;

  // Normalize and trim
  let normalized = path.trim().replace(/\\/g, '/');

  // Strip leading slashes
  while (normalized.startsWith('/')) {
    normalized = normalized.substring(1);
  }

  // Reject empty
  if (!normalized) return null;

  // Check each segment
  const segments = normalized.split('/');
  for (const seg of segments) {
    if (!seg || seg === '.' || seg === '..') return null;
    if (/[\x00-\x1f\x7f]/.test(seg)) return null;
  }

  if (normalized.length > 1024) return null;

  return normalized;
}

/**
 * Save current state to localStorage
 */
function saveToLocalStorage() {
  try {
    localStorage.setItem('latexEditor_content', state.currentLatex);
    localStorage.setItem('latexEditor_zoom', state.zoom.toString());
    
    // If in project mode, also save the project
    if (state.projectMode) {
      saveProjectToLocalStorage();
    }
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Save project to localStorage.
 * Strips binary files if the project is too large to fit in localStorage.
 */
function saveProjectToLocalStorage() {
  if (!state.projectMode) return;
  
  try {
    // Save current file content first
    if (state.currentFile && state.projectFiles[state.currentFile] !== undefined) {
      const currentContent = state.projectFiles[state.currentFile];
      if (!isBinaryContent(currentContent)) {
        state.projectFiles[state.currentFile] = state.currentLatex;
      }
    }
    
    const projectData = {
      files: state.projectFiles,
      mainFile: state.mainFile,
      currentFile: state.currentFile
    };
    
    // Try saving the full project first
    let encoded;
    try {
      encoded = encodeForStorage(JSON.stringify(projectData));
      localStorage.setItem('latexEditor_project', encoded);
      localStorage.setItem('latexEditor_projectMode', 'true');
      return;
    } catch (e) {
      if (e.name !== 'QuotaExceededError') throw e;
    }

    // Full project too large — save text files only (skip binary/fonts/images)
    const textOnlyFiles = {};
    for (const [path, content] of Object.entries(state.projectFiles)) {
      if (!isBinaryContent(content)) {
        textOnlyFiles[path] = content;
      }
    }

    const lightData = {
      files: textOnlyFiles,
      mainFile: state.mainFile,
      currentFile: state.currentFile,
      binaryFilesStripped: true
    };

    encoded = encodeForStorage(JSON.stringify(lightData));
    localStorage.setItem('latexEditor_project', encoded);
    localStorage.setItem('latexEditor_projectMode', 'true');
    console.warn('Project saved without binary files (fonts/images) due to storage limits.');
  } catch (error) {
    console.error('Failed to save project to localStorage:', error);
    if (error.name === 'QuotaExceededError') {
      showErrorToast('Storage quota exceeded. Download your project as ZIP to keep it safe.');
    }
  }
}

/**
 * Load from localStorage. Returns true if a project was restored.
 * Simple document content is only used as a fallback — projects take priority.
 */
function loadFromLocalStorage() {
  try {
    const savedZoom = localStorage.getItem('latexEditor_zoom');
    const isProjectMode = localStorage.getItem('latexEditor_projectMode') === 'true';
    
    if (savedZoom) {
      setZoom(parseFloat(savedZoom));
    }
    
    // Try to load project first
    if (isProjectMode) {
      const success = loadProjectFromLocalStorage();
      if (success) return true;
    }

    // If there's a lastProjectId, DON'T fall back to simple content —
    // let the backend load handle it (the simple content lacks project files)
    if (localStorage.getItem('latexEditor_lastProjectId')) {
      return false;
    }
    
    // Fall back to simple document only if there's no project to restore
    const savedContent = localStorage.getItem('latexEditor_content');
    if (savedContent && savedContent !== DEFAULT_TEMPLATE) {
      state.currentLatex = savedContent;
      elements.editor.value = savedContent;
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return false;
  }
}

/**
 * Load the last opened project from the backend.
 * Tries the stored project ID first, then falls back to most recently updated.
 */
async function loadLastProjectFromBackend() {
  try {
    const lastProjectId = localStorage.getItem('latexEditor_lastProjectId');

    if (lastProjectId) {
      try {
        const res = await fetch(`${API_BASE}/projects/${lastProjectId}`);
        if (res.ok) {
          const project = await res.json();
          restoreProject(project);
          return true;
        }
      } catch (e) { /* project may have been deleted */ }
    }

    // Fall back to most recently updated project
    const listRes = await fetch(`${API_BASE}/projects`);
    if (!listRes.ok) return false;
    const data = await listRes.json();
    const projects = data.projects || [];
    if (projects.length === 0) return false;

    // Projects are sorted by updated_at desc from the API
    const latest = projects[0];
    const res = await fetch(`${API_BASE}/projects/${latest.id}`);
    if (!res.ok) return false;
    const project = await res.json();
    restoreProject(project);
    return true;
  } catch (err) {
    console.error('Failed to load project from backend:', err);
    return false;
  }
}

/**
 * Restore a project from API response data into the editor state.
 */
function restoreProject(project) {
  state.projectFiles = project.files || {};
  state.mainFile = project.main_file;
  state.currentFile = project.main_file;
  state.projectMode = true;
  state.currentProjectId = project.id;
  state.currentProjectName = project.name;

  const fileContent = state.projectFiles[state.mainFile];
  if (isBinaryContent(fileContent)) {
    state.currentLatex = `[Binary file: ${state.mainFile}]`;
    elements.editor.readOnly = true;
  } else {
    state.currentLatex = fileContent || '';
    elements.editor.readOnly = false;
  }
  elements.editor.value = state.currentLatex;
  elements.currentFileName.textContent = state.mainFile
    ? state.mainFile.split('/').pop()
    : 'LaTeX Source';

  buildFileTree(state.projectFiles);
  elements.fileTree.classList.add('visible');
  elements.toggleFileTreeBtn.style.display = 'inline-block';
  elements.downloadZipBtn.style.display = 'inline-block';

  // Save project ID for next restart
  localStorage.setItem('latexEditor_lastProjectId', project.id);

  showSuccessToast(`Restored project: ${project.name}`);
}

/**
 * Load project from localStorage
 */
function loadProjectFromLocalStorage() {
  try {
    const encoded = localStorage.getItem('latexEditor_project');
    if (!encoded) return false;
    
    const projectDataStr = decodeFromStorage(encoded);
    const projectData = JSON.parse(projectDataStr);
    
    if (!projectData.files || Object.keys(projectData.files).length === 0) {
      return false;
    }
    
    // Restore project state
    state.projectFiles = projectData.files;
    state.mainFile = projectData.mainFile;
    state.currentFile = projectData.currentFile || projectData.mainFile;
    state.projectMode = true;
    
    // Load current file content
    const fileContent = state.projectFiles[state.currentFile];
    if (isBinaryContent(fileContent)) {
      state.currentLatex = `[Binary file: ${state.currentFile}]`;
      elements.editor.readOnly = true;
    } else {
      state.currentLatex = fileContent || '';
      elements.editor.readOnly = false;
    }
    elements.editor.value = state.currentLatex;
    elements.currentFileName.textContent = state.currentFile ? state.currentFile.split('/').pop() : 'LaTeX Source';
    
    // Build and show file tree
    buildFileTree(state.projectFiles);
    elements.fileTree.classList.add('visible');
    elements.toggleFileTreeBtn.style.display = 'inline-block';
    elements.downloadZipBtn.style.display = 'inline-block';
    
    showSuccessToast(
      projectData.binaryFilesStripped
        ? 'Project restored (fonts/images excluded — re-upload ZIP for full project)'
        : 'Project restored from last session'
    );
    
    return true;
  } catch (error) {
    console.error('Failed to load project from localStorage:', error);
    return false;
  }
}

// ============================================
// RESIZABLE DIVIDER
// ============================================

function initializeResizer() {
  let isResizing = false;
  let startX = 0;
  let startWidth = 0;
  
  elements.divider.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = elements.editorPanel.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;
    const containerWidth = elements.editorPanel.parentElement.offsetWidth;
    const minWidth = 300;
    const maxWidth = containerWidth - minWidth;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      const percentage = (newWidth / containerWidth) * 100;
      elements.editorPanel.style.width = `${percentage}%`;
      elements.previewPanel.style.width = `${100 - percentage}%`;
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

// ============================================
// UI FEEDBACK
// ============================================

function showLoading(text = 'Loading...') {
  elements.loadingText.textContent = text;
  elements.loadingOverlay.classList.add('active');
}

function hideLoading() {
  elements.loadingOverlay.classList.remove('active');
}

function showStatus(text, type = 'info') {
  elements.statusText.textContent = text;
  elements.statusText.style.color = type === 'error' ? 'var(--color-error)' : 
                                   type === 'success' ? 'var(--color-success)' : 
                                   'var(--text-tertiary)';
}

function showErrorToast(message) {
  elements.errorMessage.textContent = message;
  elements.errorToast.classList.add('active');
  setTimeout(() => hideToast('error'), 5000);
}

function showSuccessToast(message) {
  elements.successMessage.textContent = message;
  elements.successToast.classList.add('active');
  setTimeout(() => hideToast('success'), 3000);
}

// ============================================
// ZIP FILE HANDLING
// ============================================

// Binary file extensions that should be stored as base64
const BINARY_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|pdf|ttf|otf|woff|woff2|eot|eps|bmp|tiff?|ico)$/i;

// Patterns for macOS/system junk files
const MACOS_JUNK_PATTERNS = [
  '__MACOSX',    // macOS zip metadata folder
  '__macosx',    // lowercase variant
  '.DS_Store',   // macOS folder metadata
  '._.DS_Store', // macOS resource fork for DS_Store
  '.Spotlight-V100',
  '.Trashes',
  '.fseventsd',
  '.TemporaryItems',
  '.AppleDouble',
  '.AppleDesktop',
  '.VolumeIcon.icns',
  'Thumbs.db',   // Windows thumbnail cache
  'desktop.ini', // Windows folder settings
  '.git',        // Git internals (we don't want these in LaTeX projects)
];

/**
 * Check if a file path is macOS/system junk that should be filtered
 * @param {string} filePath - The file path to check
 * @returns {boolean} - True if the file should be skipped
 */
function isMacOSJunk(filePath) {
  if (!filePath || typeof filePath !== 'string') return true;
  
  const normalizedPath = filePath.trim();
  if (!normalizedPath) return true;
  
  // Check the full path first (case-insensitive)
  const lowerPath = normalizedPath.toLowerCase();
  
  // Check if path contains __macosx anywhere
  if (lowerPath.includes('__macosx')) {
    if (DEBUG_MODE) console.log('[FILTER] Blocked __MACOSX path:', filePath);
    return true;
  }
  
  // Split into path segments
  const segments = normalizedPath.split('/').filter(s => s.length > 0);
  
  for (const segment of segments) {
    // Check for known junk patterns (case-insensitive)
    const lowerSegment = segment.toLowerCase();
    for (const pattern of MACOS_JUNK_PATTERNS) {
      if (lowerSegment === pattern.toLowerCase()) {
        if (DEBUG_MODE) console.log('[FILTER] Blocked junk pattern:', filePath, '(matched:', pattern, ')');
        return true;
      }
    }
    
    // Check for resource forks (files starting with ._)
    if (segment.startsWith('._')) {
      if (DEBUG_MODE) console.log('[FILTER] Blocked resource fork:', filePath);
      return true;
    }
    
    // Check for hidden files (except allowed ones)
    if (segment.startsWith('.') && segment !== '.gitignore' && segment !== '.github') {
      if (DEBUG_MODE) console.log('[FILTER] Blocked hidden file:', filePath);
      return true;
    }
  }
  
  return false;
}

// Alias for backward compatibility
const shouldSkipFile = isMacOSJunk;

/**
 * Clean project files of any macOS/system junk
 * @param {Object} files - The project files object
 * @returns {Object} - Cleaned files object with junk removed
 */
function cleanProjectFiles(files) {
  if (!files || typeof files !== 'object') return {};
  
  const cleanedFiles = {};
  let removedCount = 0;
  
  for (const [path, content] of Object.entries(files)) {
    if (isMacOSJunk(path)) {
      if (DEBUG_MODE) console.log('[CLEAN] Removing junk file:', path);
      removedCount++;
      continue;
    }
    cleanedFiles[path] = content;
  }
  
  if (removedCount > 0 && DEBUG_MODE) {
    console.log(`[CLEAN] Removed ${removedCount} junk files from project`);
  }
  
  return cleanedFiles;
}

/**
 * Clean the current project in-place and rebuild the file tree
 */
function cleanCurrentProject() {
  if (!state.projectMode || !state.projectFiles) {
    showErrorToast('No project loaded');
    return;
  }
  
  const beforeCount = Object.keys(state.projectFiles).length;
  state.projectFiles = cleanProjectFiles(state.projectFiles);
  const afterCount = Object.keys(state.projectFiles).length;
  const removedCount = beforeCount - afterCount;
  
  if (removedCount > 0) {
    // Update current file if it was deleted
    if (state.currentFile && !state.projectFiles[state.currentFile]) {
      state.currentFile = state.mainFile;
      if (state.mainFile && state.projectFiles[state.mainFile]) {
        state.currentLatex = state.projectFiles[state.mainFile];
        elements.editor.value = state.currentLatex;
        elements.currentFileName.textContent = state.mainFile.split('/').pop();
      }
    }
    
    // Update main file if it was deleted
    if (state.mainFile && !state.projectFiles[state.mainFile]) {
      const texFiles = Object.keys(state.projectFiles).filter(f => f.endsWith('.tex'));
      state.mainFile = texFiles[0] || null;
    }
    
    buildFileTree(state.projectFiles);
    showSuccessToast(`Cleaned ${removedCount} macOS/system files`);
  } else {
    showSuccessToast('Project is already clean!');
  }
}

async function handleZipUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    state._pendingProjectName = null;
    return;
  }
  
  // Save current project to backend before loading a new one
  if (state.projectMode && state.currentProjectId) {
    await saveProjectToBackend();
  }
  
  if (!file.name.endsWith('.zip')) {
    state._pendingProjectName = null;
    showErrorToast('Please upload a ZIP file');
    return;
  }
  
  try {
    showLoading('Extracting ZIP file...');
    showStatus('Loading project...', 'info');
    
    const zip = await JSZip.loadAsync(file);
    let rawFiles = {};
    let mainTexFile = null;
    let skippedCount = 0;
    
    if (DEBUG_MODE) {
      console.log('[ZIP] Starting extraction...');
      console.log('[ZIP] Total entries in ZIP:', Object.keys(zip.files).length);
    }
    
    // Extract all files
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      // Skip directories
      if (zipEntry.dir) {
        if (DEBUG_MODE) console.log('[ZIP] Skipping directory entry:', path);
        continue;
      }
      
      // Filter out macOS junk files BEFORE loading content
      if (isMacOSJunk(path)) {
        skippedCount++;
        continue;
      }

      // Validate and sanitize the file path
      const safePath = sanitizePath(path);
      if (!safePath) {
        skippedCount++;
        if (DEBUG_MODE) console.log('[ZIP] Rejected unsafe path:', path);
        continue;
      }
      
      // Determine if file is binary based on extension
      const isBinary = BINARY_EXTENSIONS.test(safePath);
      
      if (isBinary) {
        const base64Content = await zipEntry.async('base64');
        rawFiles[safePath] = { isBinary: true, content: base64Content };
      } else {
        const content = await zipEntry.async('string');
        rawFiles[safePath] = content;
      }
      
      // Try to find main .tex file
      if (safePath.endsWith('.tex')) {
        const filename = safePath.split('/').pop();
        if (!mainTexFile || 
            filename.match(/^(main|document|thesis|paper|article)\.tex$/i) ||
            safePath === filename) {
          mainTexFile = safePath;
        }
      }
    }
    
    if (DEBUG_MODE) {
      console.log('[ZIP] Raw files extracted:', Object.keys(rawFiles).length);
      console.log('[ZIP] Skipped during extraction:', skippedCount);
    }
    
    // Double-clean the files to ensure no junk slipped through
    const files = cleanProjectFiles(rawFiles);
    const extraCleaned = Object.keys(rawFiles).length - Object.keys(files).length;
    if (extraCleaned > 0) {
      if (DEBUG_MODE) console.log('[ZIP] Extra files cleaned:', extraCleaned);
      skippedCount += extraCleaned;
    }
    
    if (DEBUG_MODE) {
      console.log('[ZIP] Final clean files:', Object.keys(files).length);
      console.log('[ZIP] File list:', Object.keys(files));
    }
    
    if (Object.keys(files).length === 0) {
      showErrorToast('ZIP file is empty or contains only system files');
      return;
    }
    
    // Re-check main file after cleaning (in case it was in a junk path)
    if (!mainTexFile || !files[mainTexFile]) {
      mainTexFile = null;
      const texFiles = Object.keys(files).filter(f => f.endsWith('.tex'));
      if (texFiles.length > 0) {
        // Prioritize common main file names
        for (const tf of texFiles) {
          const fname = tf.split('/').pop().toLowerCase();
          if (['main.tex', 'document.tex', 'thesis.tex', 'paper.tex', 'article.tex'].includes(fname)) {
            mainTexFile = tf;
            break;
          }
        }
        // If no common name found, use first root-level tex file or first tex file
        if (!mainTexFile) {
          const rootTex = texFiles.find(f => !f.includes('/'));
          mainTexFile = rootTex || texFiles[0];
        }
      }
    }
    
    // If still no .tex file found, show error
    if (!mainTexFile) {
      showErrorToast('No .tex files found in ZIP');
      return;
    }
    
    // Update state
    state.projectFiles = files;
    state.mainFile = mainTexFile;
    state.currentFile = mainTexFile;
    state.projectMode = true;
    
    // Update UI
    elements.currentFileName.textContent = mainTexFile.split('/').pop();
    elements.editor.value = files[mainTexFile];
    state.currentLatex = files[mainTexFile];
    
    // Build and show file tree
    buildFileTree(files);
    elements.fileTree.classList.add('visible');
    elements.toggleFileTreeBtn.style.display = 'inline-block';
    elements.downloadZipBtn.style.display = 'inline-block';
    
    if (skippedCount > 0 && DEBUG_MODE) {
      console.log(`Filtered out ${skippedCount} macOS metadata files`);
    }
    
    // Auto-save project to localStorage after loading
    saveProjectToLocalStorage();
    
    // Use name from the new project modal if available, otherwise prompt
    const projectName = state._pendingProjectName || prompt('Enter project name:', file.name.replace(/\.zip$/i, ''));
    state._pendingProjectName = null;
    if (projectName && projectName.trim()) {
      const payload = {
        name: projectName.trim(),
        files: {},
        main_file: mainTexFile,
      };
      for (const [path, content] of Object.entries(files)) {
        if (isBinaryContent(content)) {
          payload.files[path] = { type: 'binary', content: content.content || content };
        } else {
          payload.files[path] = content;
        }
      }
      try {
        const res = await fetch(`${API_BASE}/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const project = await res.json();
          state.currentProjectId = project.id;
          state.currentProjectName = project.name;
        } else {
          const err = await res.json();
          console.warn('Project save to backend failed:', err.error);
        }
      } catch (e) {
        console.warn('Backend save failed:', e);
      }
    }
    
    showSuccessToast(`Loaded ${Object.keys(files).length} files`);
    
    // Compile the loaded project
    compile(true);
    
  } catch (error) {
    console.error('ZIP extraction error:', error);
    showErrorToast('Failed to extract ZIP file: ' + error.message);
  } finally {
    hideLoading();
    // Reset file input
    event.target.value = '';
  }
}

/**
 * Build file tree UI from project files
 */
function buildFileTree(files) {
  const tree = {};
  
  // Build tree structure
  for (const path of Object.keys(files)) {
    const parts = path.split('/');
    let current = tree;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      
      if (!current[part]) {
        current[part] = isFile ? { __file__: path } : {};
      }
      
      if (!isFile) {
        current = current[part];
      }
    }
  }
  
  // Render tree
  elements.fileTreeContent.innerHTML = '';
  renderTreeNode(tree, elements.fileTreeContent, '');
}

/**
 * Render a tree node recursively
 */
function renderTreeNode(node, container, path) {
  for (const [name, value] of Object.entries(node)) {
    const isFile = value.__file__;
    const fullPath = isFile ? value.__file__ : (path ? `${path}/${name}` : name);
    
    // Check if this is a junk file/folder that slipped through
    const isJunk = isMacOSJunk(fullPath) || isMacOSJunk(name);
    
    const item = document.createElement('div');
    item.className = 'file-tree-item' + 
                     (isFile ? '' : ' folder expanded') +
                     (isFile && name.endsWith('.tex') ? ' tex' : '') +
                     (isFile && name.match(/\.(png|jpg|jpeg|gif|svg)$/i) ? ' image' : '') +
                     (isFile && name.endsWith('.pdf') ? ' pdf' : '') +
                     (isFile && name.match(/\.(ttf|otf|woff|woff2)$/i) ? ' font' : '') +
                     (isJunk ? ' junk' : '');
    
    item.dataset.path = fullPath;
    item.dataset.isFile = isFile ? 'true' : 'false';
    item.dataset.name = name;
    item.dataset.isJunk = isJunk ? 'true' : 'false';
    
    if (isFile && fullPath === state.currentFile) {
      item.classList.add('active');
    }
    
    // Mark main file with special class
    if (isFile && fullPath === state.mainFile) {
      item.classList.add('main-file');
    }
    
    const icon = document.createElement('span');
    icon.className = 'file-tree-icon';
    item.appendChild(icon);
    
    const label = document.createElement('span');
    label.className = 'file-tree-label';
    label.textContent = name;
    item.appendChild(label);
    
    // Add action buttons container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'file-tree-actions';
    
    // Add rename button
    const renameBtn = document.createElement('button');
    renameBtn.className = 'file-action-btn rename-btn';
    renameBtn.innerHTML = '✎';
    renameBtn.title = 'Rename';
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isFile) {
        renameFile(fullPath);
      } else {
        renameFolder(fullPath);
      }
    });
    actionsContainer.appendChild(renameBtn);
    
    // Add delete button for files and folders
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'file-action-btn delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isFile) {
        deleteFile(fullPath);
      } else {
        deleteFolder(fullPath);
      }
    });
    actionsContainer.appendChild(deleteBtn);
    
    item.appendChild(actionsContainer);
    
    container.appendChild(item);
    
    if (isFile) {
      // Click handler for files
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('file-action-btn')) {
          openFile(fullPath, item);
        }
      });
      
      // Right-click context menu for file management
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showFileContextMenu(e, fullPath, name, true);
      });
    } else {
      // Folder - create children container
      const children = document.createElement('div');
      children.className = 'file-tree-children';
      container.appendChild(children);
      
      // Click handler for folders
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!e.target.classList.contains('file-action-btn')) {
          item.classList.toggle('expanded');
          item.classList.toggle('collapsed');
          children.classList.toggle('collapsed');
        }
      });
      
      // Right-click context menu for folder management
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showFileContextMenu(e, fullPath, name, false);
      });
      
      // Recursively render children
      renderTreeNode(value, children, fullPath);
    }
  }
}

/**
 * Open a file from the project
 */
function openFile(path, itemElement) {
  const fileContent = state.projectFiles[path];
  if (fileContent === undefined) return;
  
  // Check if this is a binary file
  const isBinary = isBinaryContent(fileContent);
  
  // Save current file content (only for text files)
  if (state.currentFile && state.projectFiles[state.currentFile] !== undefined) {
    const currentContent = state.projectFiles[state.currentFile];
    if (!isBinaryContent(currentContent)) {
      state.projectFiles[state.currentFile] = state.currentLatex;
    }
  }
  
  // Load new file
  state.currentFile = path;
  
  if (isBinary) {
    // Binary file - show preview message instead of content
    const ext = path.split('.').pop().toLowerCase();
    let previewMessage = `[Binary file: ${path.split('/').pop()}]\\n\\nThis file cannot be edited directly.`;
    
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
      previewMessage = `[Image file: ${path.split('/').pop()}]\\n\\nImage preview not available in editor.\\nThe file will be included in your ZIP export.`;
    } else if (ext === 'pdf') {
      previewMessage = `[PDF file: ${path.split('/').pop()}]\\n\\nPDF files cannot be edited.\\nThe file will be included in your ZIP export.`;
    } else if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
      previewMessage = `[Font file: ${path.split('/').pop()}]\\n\\nFont files cannot be edited.\\nThe file will be included in your ZIP export.`;
    }
    
    state.currentLatex = previewMessage;
    elements.editor.value = previewMessage;
    elements.editor.readOnly = true;
  } else {
    state.currentLatex = fileContent;
    elements.editor.value = fileContent;
    elements.editor.readOnly = false;
  }
  
  elements.currentFileName.textContent = path.split('/').pop();
  
  // Update file tree selection
  document.querySelectorAll('.file-tree-item').forEach(item => {
    item.classList.remove('active');
  });
  if (itemElement) {
    itemElement.classList.add('active');
  }
  
  // Never auto-compile when switching files - user must click compile button
}

/**
 * Toggle file tree visibility
 */
function toggleFileTree(show) {
  const isVisible = elements.fileTree.classList.contains('visible');
  
  if (show === false || isVisible) {
    elements.fileTree.classList.remove('visible');
    elements.toggleFileTreeBtn.title = 'Show file tree';
  } else {
    elements.fileTree.classList.add('visible');
    elements.toggleFileTreeBtn.title = 'Hide file tree';
  }
}

/**
 * Download project as ZIP
 */
async function downloadProjectZip() {
  if (!state.projectMode || Object.keys(state.projectFiles).length === 0) {
    showErrorToast('No project to download');
    return;
  }
  
  try {
    showLoading('Creating ZIP file...');
    
    // Save current file
    if (state.currentFile) {
      state.projectFiles[state.currentFile] = state.currentLatex;
    }
    
    const zip = new JSZip();
    
    // Add all files to ZIP, handling binary files properly
    for (const [path, content] of Object.entries(state.projectFiles)) {
      if (isBinaryContent(content)) {
        // Binary file stored as base64
        zip.file(path, content.content, { base64: true });
      } else {
        // Text file
        zip.file(path, content);
      }
    }
    
    // Generate ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    
    // Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'latex-project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccessToast('Project downloaded as ZIP');
    
  } catch (error) {
    console.error('ZIP creation error:', error);
    showErrorToast('Failed to create ZIP file');
  } finally {
    hideLoading();
  }
}

/**
 * Resolve file includes in LaTeX content
 */
function resolveIncludes(content, currentPath, visitedFiles = new Set()) {
  // Prevent circular dependencies
  if (visitedFiles.has(currentPath)) {
    console.warn(`Circular dependency detected: ${currentPath}`);
    return content;
  }
  
  visitedFiles.add(currentPath);

  // Strip comments before resolving — prevents resolving %\input{...}
  content = content.replace(/^%.*$/gm, '');
  content = content.replace(/([^\\])%.*$/gm, '$1');
  
  // Get directory of current file
  const dir = currentPath.split('/').slice(0, -1).join('/');
  
  // Match \input{file}, \include{file} (not includegraphics - handled in convertLatexToHTML)
  const includeRegex = /\\(input|include)(?:\[[^\]]*\])?\{([^}]+)\}/g;
  
  let resolved = content;
  const replacements = new Map();
  let match;
  
  while ((match = includeRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    let filename = match[2].trim();
    
    if (replacements.has(fullMatch)) continue;
    
    // Add .tex extension if missing
    if (!filename.endsWith('.tex')) {
      filename = filename + '.tex';
    }
    
    // Try multiple path resolutions
    let resolvedPath = null;
    const pathsToTry = [
      filename,                              // Exact path as given
      dir ? `${dir}/${filename}` : filename, // Relative to current file's directory
    ];
    
    // Also try without leading ./
    if (filename.startsWith('./')) {
      const cleanName = filename.substring(2);
      pathsToTry.push(cleanName);
      pathsToTry.push(dir ? `${dir}/${cleanName}` : cleanName);
    }
    
    for (const tryPath of pathsToTry) {
      const fileContent = state.projectFiles[tryPath];
      if (fileContent && typeof fileContent === 'string') {
        resolvedPath = tryPath;
        break;
      }
    }
    
    if (resolvedPath) {
      const fileContent = state.projectFiles[resolvedPath];
      const includedContent = resolveIncludes(fileContent, resolvedPath, new Set(visitedFiles));
      replacements.set(fullMatch, includedContent);
    } else {
      // File not found - leave a comment placeholder (only warn in project mode)
      if (state.projectMode) {
        console.warn(`Include file not found: ${filename}, tried paths:`, pathsToTry);
      }
      replacements.set(fullMatch, `% [Include not found: ${filename}]`);
    }
  }
  
  for (const [pattern, replacement] of replacements) {
    resolved = resolved.replaceAll(pattern, replacement);
  }
  
  return resolved;
}

// ============================================
// FILE MANAGEMENT
// ============================================

let activeContextMenu = null;

/**
 * Show context menu for file/folder management
 */
function showFileContextMenu(e, path, name, isFile) {
  // Remove any existing context menu
  hideContextMenu();
  
  const menu = document.createElement('div');
  menu.className = 'file-context-menu';
  menu.style.position = 'fixed';
  menu.style.left = `${e.clientX}px`;
  menu.style.top = `${e.clientY}px`;
  menu.style.zIndex = '1000';
  
  const menuItems = [];
  
  // Check if this is a junk file
  const isJunk = isMacOSJunk(path) || isMacOSJunk(name);
  
  if (isFile) {
    menuItems.push({ label: 'Rename', action: () => renameFile(path) });
    menuItems.push({ label: 'Delete', action: () => deleteFile(path), danger: true });
    if (path.endsWith('.tex') && path !== state.mainFile) {
      menuItems.push({ label: 'Set as Main', action: () => setAsMainFile(path) });
    }
  } else {
    menuItems.push({ label: 'Add File', action: () => addNewFile(path) });
    menuItems.push({ label: 'Add Folder', action: () => addNewFolder(path) });
    menuItems.push({ label: 'Rename', action: () => renameFolder(path) });
    menuItems.push({ label: 'Delete', action: () => deleteFolder(path), danger: true });
  }
  
  // Add junk-specific option
  if (isJunk) {
    menuItems.unshift({ label: '⚠️ This is a junk file', action: () => {}, disabled: true });
  }
  
  // Add clean all junk option
  menuItems.push({ label: '🧹 Clean All Junk Files', action: () => cleanCurrentProject() });
  
  // Add root-level options when right-clicking
  menuItems.unshift({ label: 'New File (root)', action: () => addNewFile('') });
  
  menuItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'context-menu-item' + 
                         (item.danger ? ' danger' : '') +
                         (item.disabled ? ' disabled' : '');
    menuItem.textContent = item.label;
    if (!item.disabled) {
      menuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        hideContextMenu();
        item.action();
      });
    }
    menu.appendChild(menuItem);
  });
  
  document.body.appendChild(menu);
  activeContextMenu = menu;
  
  // Close menu on click outside
  setTimeout(() => {
    document.addEventListener('click', hideContextMenu, { once: true });
  }, 0);
}

function hideContextMenu() {
  if (activeContextMenu) {
    activeContextMenu.remove();
    activeContextMenu = null;
  }
}

/**
 * Add a new file to the project
 */
function addNewFile(parentPath) {
  const filename = prompt('Enter new file name (e.g., chapter1.tex):');
  if (!filename) return;

  const safeName = sanitizeFilename(filename);
  if (!safeName) {
    showErrorToast('Invalid filename. Avoid special characters, ".." and leading slashes.');
    return;
  }
  
  const newPath = parentPath ? `${parentPath}/${safeName}` : safeName;
  
  if (state.projectFiles[newPath]) {
    showErrorToast('File already exists');
    return;
  }
  
  // Default content based on file type
  let content = '';
  if (filename.endsWith('.tex')) {
    content = '% ' + filename + '\n\n';
  }
  
  state.projectFiles[newPath] = content;
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Open the new file
  openFile(newPath, null);
  
  // Auto-save project
  saveProjectToLocalStorage();
  
  showSuccessToast(`Created ${filename}`);
}

/**
 * Add a new folder to the project
 */
function addNewFolder(parentPath) {
  const foldername = prompt('Enter new folder name:');
  if (!foldername) return;

  const safeName = sanitizeFilename(foldername);
  if (!safeName || safeName.includes('/')) {
    showErrorToast('Invalid folder name. Avoid special characters, ".." and slashes.');
    return;
  }
  
  const placeholderPath = parentPath ? `${parentPath}/${safeName}/.gitkeep` : `${safeName}/.gitkeep`;
  
  if (state.projectFiles[placeholderPath]) {
    showErrorToast('Folder already exists');
    return;
  }
  
  state.projectFiles[placeholderPath] = '';
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
  
  showSuccessToast(`Created folder ${safeName}`);
}

/**
 * Rename a file
 */
function renameFile(oldPath) {
  const oldName = oldPath.split('/').pop();
  const newName = prompt('Enter new file name:', oldName);
  if (!newName || newName === oldName) return;

  const safeName = sanitizeFilename(newName);
  if (!safeName || safeName.includes('/')) {
    showErrorToast('Invalid filename. Avoid special characters, ".." and slashes.');
    return;
  }
  
  const pathParts = oldPath.split('/');
  pathParts[pathParts.length - 1] = safeName;
  const newPath = pathParts.join('/');
  
  if (state.projectFiles[newPath]) {
    showErrorToast('A file with this name already exists');
    return;
  }
  
  // Move content to new path
  state.projectFiles[newPath] = state.projectFiles[oldPath];
  delete state.projectFiles[oldPath];
  
  // Update current file reference if needed
  if (state.currentFile === oldPath) {
    state.currentFile = newPath;
    elements.currentFileName.textContent = safeName;
  }
  
  // Update main file reference if needed
  if (state.mainFile === oldPath) {
    state.mainFile = newPath;
  }
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
  
  showSuccessToast(`Renamed to ${safeName}`);
}

/**
 * Rename a folder (moves all files within)
 */
function renameFolder(oldPath) {
  const oldName = oldPath.split('/').pop();
  const newName = prompt('Enter new folder name:', oldName);
  if (!newName || newName === oldName) return;

  const safeName = sanitizeFilename(newName);
  if (!safeName || safeName.includes('/')) {
    showErrorToast('Invalid folder name. Avoid special characters, ".." and slashes.');
    return;
  }
  
  const pathParts = oldPath.split('/');
  pathParts[pathParts.length - 1] = safeName;
  const newPath = pathParts.join('/');
  
  // Move all files in the folder
  const filesToMove = Object.keys(state.projectFiles).filter(p => 
    p === oldPath || p.startsWith(oldPath + '/')
  );
  
  for (const filePath of filesToMove) {
    const newFilePath = filePath.replace(oldPath, newPath);
    state.projectFiles[newFilePath] = state.projectFiles[filePath];
    delete state.projectFiles[filePath];
    
    // Update references
    if (state.currentFile === filePath) {
      state.currentFile = newFilePath;
    }
    if (state.mainFile === filePath) {
      state.mainFile = newFilePath;
    }
  }
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
  
  showSuccessToast(`Renamed folder to ${safeName}`);
}

/**
 * Delete a file
 */
function deleteFile(path) {
  const filename = path.split('/').pop();
  if (!confirm(`Delete ${filename}? This cannot be undone.`)) return;
  
  if (path === state.mainFile) {
    showErrorToast('Cannot delete the main file');
    return;
  }
  
  delete state.projectFiles[path];
  
  // If deleted file was current, switch to main file
  if (state.currentFile === path) {
    state.currentFile = state.mainFile;
    state.currentLatex = state.projectFiles[state.mainFile] || '';
    elements.editor.value = state.currentLatex;
    elements.currentFileName.textContent = state.mainFile ? state.mainFile.split('/').pop() : 'LaTeX Source';
  }
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
  
  showSuccessToast(`Deleted ${filename}`);
}

/**
 * Delete a folder and all its contents
 */
function deleteFolder(path) {
  const foldername = path.split('/').pop();
  if (!confirm(`Delete folder "${foldername}" and all its contents? This cannot be undone.`)) return;
  
  // Check if main file is in this folder
  if (state.mainFile && state.mainFile.startsWith(path + '/')) {
    showErrorToast('Cannot delete folder containing the main file');
    return;
  }
  
  // Delete all files in folder
  const filesToDelete = Object.keys(state.projectFiles).filter(p => 
    p.startsWith(path + '/')
  );
  
  for (const filePath of filesToDelete) {
    delete state.projectFiles[filePath];
    
    if (state.currentFile === filePath) {
      state.currentFile = state.mainFile;
      state.currentLatex = state.projectFiles[state.mainFile] || '';
      elements.editor.value = state.currentLatex;
      elements.currentFileName.textContent = state.mainFile ? state.mainFile.split('/').pop() : 'LaTeX Source';
    }
  }
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
  
  showSuccessToast(`Deleted folder ${foldername}`);
}

/**
 * Set a .tex file as the main file for compilation
 */
function setAsMainFile(path) {
  state.mainFile = path;
  showSuccessToast(`${path.split('/').pop()} is now the main file`);
  
  // Rebuild file tree to update visual indication
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
}

function hideToast(type) {
  if (type === 'error') {
    elements.errorToast.classList.remove('active');
  } else {
    elements.successToast.classList.remove('active');
  }
}

// ============================================
// PROJECTS DRAWER (SQLite backend)
// ============================================

const API_BASE = '/api/v1';

function openProjectsDrawer() {
  elements.projectsDrawer.classList.add('open');
  elements.drawerOverlay.classList.add('open');
  loadProjectsList();
}

function closeProjectsDrawer() {
  elements.projectsDrawer.classList.remove('open');
  elements.drawerOverlay.classList.remove('open');
}

async function loadProjectsList() {
  try {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) {
      if (res.status === 431) {
        // Browser sending too-large headers — likely stale cookies
        elements.projectsList.innerHTML = `
          <div class="drawer-empty">
            <p><strong>Browser headers too large</strong></p>
            <p class="drawer-empty-hint">Clear cookies for localhost in your browser settings, then reload the page.</p>
          </div>`;
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    renderProjectsList(data.projects || []);
  } catch (err) {
    console.error('Failed to load projects:', err);
    elements.projectsList.innerHTML = '<div class="drawer-empty"><p>Failed to load projects</p><p class="drawer-empty-hint">' + escapeHtml(err.message) + '</p></div>';
  }
}

function renderProjectsList(projects) {
  if (!projects.length) {
    elements.projectsList.innerHTML = `
      <div class="drawer-empty">
        <svg class="drawer-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p>No projects yet</p>
        <p class="drawer-empty-hint">Import a ZIP or create a new project to get started.</p>
      </div>`;
    return;
  }

  elements.projectsList.innerHTML = projects.map(p => {
    const updated = new Date(p.updated_at).toLocaleDateString();
    const isActive = state.currentProjectId === p.id;
    return `<div class="project-card${isActive ? ' active' : ''}" data-id="${escapeHtml(p.id)}">
      <div class="project-card-header">
        <span class="project-card-name">${escapeHtml(p.name)}</span>
        <div class="project-card-actions">
          <button class="icon-btn" title="Rename" data-action="rename" data-id="${escapeHtml(p.id)}">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="icon-btn" title="Delete" data-action="delete" data-id="${escapeHtml(p.id)}" data-name="${escapeHtml(p.name)}">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="project-card-meta">${p.file_count || 0} files · Updated ${updated}</div>
    </div>`;
  }).join('');

  // Attach event listeners
  elements.projectsList.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) return;
      openProject(card.dataset.id);
    });
  });
  elements.projectsList.querySelectorAll('[data-action="rename"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      renameProjectPrompt(btn.dataset.id);
    });
  });
  elements.projectsList.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteProjectFromBackend(btn.dataset.id, btn.dataset.name);
    });
  });
}

async function openProject(projectId) {
  try {
    const res = await fetch(`${API_BASE}/projects/${projectId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const project = await res.json();

    state.projectFiles = project.files || {};
    state.mainFile = project.main_file;
    state.currentFile = project.main_file;
    state.projectMode = true;
    state.currentProjectId = project.id;
    state.currentProjectName = project.name;

    // Load main file into editor
    state.currentLatex = state.projectFiles[state.mainFile] || '';
    elements.editor.value = state.currentLatex;
    elements.currentFileName.textContent = state.mainFile ? state.mainFile.split('/').pop() : 'LaTeX Source';

    // Show file tree and download zip button
    elements.fileTree.classList.add('visible');
    elements.downloadZipBtn.style.display = '';
    buildFileTree(state.projectFiles);

    closeProjectsDrawer();
    localStorage.setItem('latexEditor_lastProjectId', project.id);
    compile();
    showSuccessToast(`Opened project: ${project.name}`);
  } catch (err) {
    console.error('Failed to open project:', err);
    showErrorToast('Failed to open project');
  }
}

async function saveProjectToBackend() {
  if (!state.projectMode) return;

  // Sync current editor content
  if (state.currentFile && state.projectFiles[state.currentFile] !== undefined) {
    if (!isBinaryContent(state.projectFiles[state.currentFile])) {
      state.projectFiles[state.currentFile] = state.currentLatex;
    }
  }

  const files = {};
  for (const [path, content] of Object.entries(state.projectFiles)) {
    if (isBinaryContent(content)) {
      files[path] = { type: 'binary', content: content.content || content };
    } else {
      files[path] = content;
    }
  }

  const payload = {
    files,
    main_file: state.mainFile,
  };

  try {
    if (state.currentProjectId) {
      const res = await fetch(`${API_BASE}/projects/${state.currentProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } else {
      const name = state.currentProjectName || prompt('Enter project name:', 'my-project');
      if (!name) return;
      payload.name = name;
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const project = await res.json();
      state.currentProjectId = project.id;
      state.currentProjectName = project.name;
    }
    // Remember last project for restart recovery
    if (state.currentProjectId) {
      localStorage.setItem('latexEditor_lastProjectId', state.currentProjectId);
    }
  } catch (err) {
    console.error('Failed to save project to backend:', err);
    showErrorToast(`Save failed: ${err.message}`);
  }
}

async function renameProjectPrompt(projectId) {
  const newName = prompt('Enter new project name:');
  if (!newName || !newName.trim()) return;

  try {
    const res = await fetch(`${API_BASE}/projects/${projectId}/name`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    if (state.currentProjectId === projectId) {
      state.currentProjectName = newName.trim();
    }
    loadProjectsList();
    showSuccessToast(`Renamed to: ${newName.trim()}`);
  } catch (err) {
    showErrorToast(err.message);
  }
}

async function deleteProjectFromBackend(projectId, projectName) {
  if (!confirm(`Delete project "${projectName}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
    if (state.currentProjectId === projectId) {
      state.currentProjectId = null;
      state.currentProjectName = null;
      newDocument();
    }
    loadProjectsList();
    showSuccessToast(`Deleted project: ${projectName}`);
  } catch (err) {
    showErrorToast('Failed to delete project');
  }
}

// Auto-save project to backend periodically (debounced)
let _backendSaveTimer = null;
function scheduleBackendSave() {
  if (!state.projectMode) return;
  clearTimeout(_backendSaveTimer);
  _backendSaveTimer = setTimeout(() => saveProjectToBackend(), 5000);
}

// ============================================
// GITHUB INTEGRATION
// ============================================

function openGithubModal() {
  elements.githubModalOverlay.classList.add('open');
  // Load saved token
  const savedToken = localStorage.getItem('latexEditor_githubToken');
  const savedRepo = localStorage.getItem('latexEditor_githubRepo');
  if (savedToken) {
    elements.githubToken.value = savedToken;
    state.githubToken = savedToken;
    state.githubRepo = savedRepo;
    showGithubConnected(savedRepo);
  }
}

function closeGithubModal() {
  elements.githubModalOverlay.classList.remove('open');
}

function showGithubConnected(repo) {
  elements.githubStatus.className = 'github-status connected';
  elements.githubStatus.textContent = repo ? `Connected to ${repo}` : 'Token configured';
  elements.githubStatus.style.display = 'block';
  elements.githubSave.style.display = 'none';
  elements.githubDisconnect.style.display = '';
  elements.githubRepoGroup.style.display = '';
  if (repo) {
    elements.githubRepo.value = repo;
    elements.githubPush.style.display = '';
    elements.githubPull.style.display = '';
  }
}

function showGithubDisconnected() {
  elements.githubStatus.className = 'github-status';
  elements.githubStatus.style.display = 'none';
  elements.githubSave.style.display = '';
  elements.githubDisconnect.style.display = 'none';
  elements.githubPush.style.display = 'none';
  elements.githubPull.style.display = 'none';
  elements.githubRepoGroup.style.display = 'none';
  elements.githubToken.value = '';
  elements.githubRepo.value = '';
}

async function connectGithub() {
  const token = elements.githubToken.value.trim();
  if (!token) {
    elements.githubStatus.className = 'github-status error';
    elements.githubStatus.textContent = 'Please enter a Personal Access Token';
    elements.githubStatus.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${token}` },
    });
    if (!res.ok) throw new Error('Invalid token');
    const user = await res.json();

    state.githubToken = token;
    localStorage.setItem('latexEditor_githubToken', token);
    showGithubConnected(null);
    elements.githubStatus.textContent = `Authenticated as ${user.login}`;
    showSuccessToast(`Connected to GitHub as ${user.login}`);
  } catch (err) {
    elements.githubStatus.className = 'github-status error';
    elements.githubStatus.textContent = `Authentication failed: ${err.message}`;
    elements.githubStatus.style.display = 'block';
  }
}

function disconnectGithub() {
  state.githubToken = null;
  state.githubRepo = null;
  localStorage.removeItem('latexEditor_githubToken');
  localStorage.removeItem('latexEditor_githubRepo');
  showGithubDisconnected();
  showSuccessToast('Disconnected from GitHub');
}

async function pushToGithub() {
  const repo = elements.githubRepo.value.trim();
  if (!repo || !repo.includes('/')) {
    showErrorToast('Enter a valid repository (owner/repo)');
    return;
  }
  if (!state.githubToken) {
    showErrorToast('Connect to GitHub first');
    return;
  }
  if (!state.projectMode || Object.keys(state.projectFiles).length === 0) {
    showErrorToast('No project to push');
    return;
  }

  state.githubRepo = repo;
  localStorage.setItem('latexEditor_githubRepo', repo);

  if (state.currentFile && !isBinaryContent(state.projectFiles[state.currentFile])) {
    state.projectFiles[state.currentFile] = state.currentLatex;
  }

  const headers = {
    Authorization: `token ${state.githubToken}`,
    'Content-Type': 'application/json',
  };

  try {
    showStatus('Pushing to GitHub...', 'info');

    let repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (repoRes.status === 404) {
      const [owner, repoName] = repo.split('/');
      const userRes = await fetch('https://api.github.com/user', { headers });
      const user = await userRes.json();

      const createEndpoint = owner === user.login
        ? 'https://api.github.com/user/repos'
        : `https://api.github.com/orgs/${owner}/repos`;

      repoRes = await fetch(createEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: repoName, private: true, auto_init: true }),
      });
      if (!repoRes.ok) throw new Error('Failed to create repository');
      await new Promise(r => setTimeout(r, 2000));
    }

    // Resolve default branch name (main, master, etc.)
    const repoData = await (await fetch(`https://api.github.com/repos/${repo}`, { headers })).json();
    const defaultBranch = repoData.default_branch || 'main';

    const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${defaultBranch}`, { headers });
    if (!refRes.ok) throw new Error(`Default branch '${defaultBranch}' not found`);

    const refData = await refRes.json();
    const baseSha = refData.object.sha;
    const baseCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${baseSha}`, { headers });
    const baseCommitData = await baseCommitRes.json();
    const baseTreeSha = baseCommitData.tree.sha;

    // Create a unique branch
    const timestamp = Date.now();
    const branchName = `latex-editor/update-${timestamp}`;
    const createBranchRes = await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
    });
    if (!createBranchRes.ok) throw new Error('Failed to create branch');

    // Create blobs for each file
    const tree = [];
    for (const [path, content] of Object.entries(state.projectFiles)) {
      let blobContent, encoding;
      if (isBinaryContent(content)) {
        blobContent = content.content || content;
        encoding = 'base64';
      } else {
        blobContent = content;
        encoding = 'utf-8';
      }

      const blobRes = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: blobContent, encoding }),
      });
      if (!blobRes.ok) throw new Error(`Failed to create blob for ${path}`);
      const blob = await blobRes.json();

      tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
    }

    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tree, base_tree: baseTreeSha }),
    });
    if (!treeRes.ok) throw new Error('Failed to create tree');
    const treeData = await treeRes.json();

    const commitMessage = `Update from LaTeX Editor (${new Date().toISOString()})`;
    const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [baseSha],
      }),
    });
    if (!commitRes.ok) throw new Error('Failed to create commit');
    const newCommit = await commitRes.json();

    // Point the new branch at the commit
    const updateBranchRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branchName}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: newCommit.sha }),
    });
    if (!updateBranchRes.ok) throw new Error('Failed to update branch ref');

    // Open a pull request against the default branch
    const prRes = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: commitMessage,
        head: branchName,
        base: defaultBranch,
        body: 'Automated pull request created by [LaTeX Editor](https://github.com/mbianchidev/latex-editor).',
      }),
    });
    if (!prRes.ok) {
      const prErr = await prRes.json();
      throw new Error(prErr.message || 'Failed to create pull request');
    }
    const prData = await prRes.json();

    showGithubConnected(repo);
    showSuccessToast(`PR #${prData.number} opened on github.com/${repo}`);
    showStatus('Push complete — PR created', 'success');
  } catch (err) {
    console.error('GitHub push failed:', err);
    showErrorToast(`Push failed: ${err.message}`);
    showStatus('Push failed', 'error');
  }
}

async function pullFromGithub() {
  const repo = elements.githubRepo.value.trim();
  if (!repo || !repo.includes('/')) {
    showErrorToast('Enter a valid repository (owner/repo)');
    return;
  }
  if (!state.githubToken) {
    showErrorToast('Connect to GitHub first');
    return;
  }

  state.githubRepo = repo;
  localStorage.setItem('latexEditor_githubRepo', repo);

  const headers = { Authorization: `token ${state.githubToken}` };

  try {
    showStatus('Pulling from GitHub...', 'info');

    // Resolve default branch name
    const repoData = await (await fetch(`https://api.github.com/repos/${repo}`, { headers })).json();
    const defaultBranch = repoData.default_branch || 'main';

    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
    if (!treeRes.ok) throw new Error(`Failed to fetch tree: HTTP ${treeRes.status}`);
    const treeData = await treeRes.json();

    const files = {};
    let mainFile = null;
    const textExtensions = ['.tex', '.cls', '.sty', '.bib', '.bst', '.txt', '.md', '.cfg', '.def', '.dtx', '.ins', '.log'];

    for (const item of treeData.tree) {
      if (item.type !== 'blob') continue;
      if (item.path.startsWith('.') || item.path.includes('/.')) continue;

      const blobRes = await fetch(`https://api.github.com/repos/${repo}/git/blobs/${item.sha}`, { headers });
      if (!blobRes.ok) continue;
      const blob = await blobRes.json();

      const ext = '.' + item.path.split('.').pop().toLowerCase();
      if (textExtensions.includes(ext)) {
        files[item.path] = atob(blob.content);
      } else {
        files[item.path] = { type: 'binary', content: blob.content };
      }

      // Detect main file
      if (!mainFile && (item.path === 'main.tex' || item.path === 'resume.tex' || item.path.endsWith('.tex'))) {
        mainFile = item.path;
      }
    }

    if (Object.keys(files).length === 0) {
      showErrorToast('No files found in repository');
      return;
    }

    if (!mainFile) mainFile = Object.keys(files).find(f => f.endsWith('.tex')) || Object.keys(files)[0];

    // Prompt for project name
    const projectName = prompt('Project name:', repo.split('/').pop());
    if (!projectName) return;

    // Save to backend
    const saveRes = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: projectName, files, main_file: mainFile }),
    });

    if (!saveRes.ok) {
      const err = await saveRes.json();
      throw new Error(err.error || `HTTP ${saveRes.status}`);
    }

    const project = await saveRes.json();
    state.projectFiles = files;
    state.mainFile = mainFile;
    state.currentFile = mainFile;
    state.projectMode = true;
    state.currentProjectId = project.id;
    state.currentProjectName = project.name;

    state.currentLatex = files[mainFile] || '';
    elements.editor.value = state.currentLatex;
    elements.currentFileName.textContent = mainFile.split('/').pop();
    elements.fileTree.classList.add('visible');
    elements.downloadZipBtn.style.display = '';
    buildFileTree(files);

    closeGithubModal();
    closeProjectsDrawer();
    compile();
    showSuccessToast(`Pulled project from ${repo}`);
    showStatus('Pull complete', 'success');
  } catch (err) {
    console.error('GitHub pull failed:', err);
    showErrorToast(`Pull failed: ${err.message}`);
    showStatus('Pull failed', 'error');
  }
}

// ============================================
// START APPLICATION
// ============================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
