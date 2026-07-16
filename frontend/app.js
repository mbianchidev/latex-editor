/**
 * LaTeX Editor - Main Application
 * A sophisticated LaTeX editor with live PDF preview
 */

// ============================================
// CONFIGURATION & STATE
// ============================================

// Debug mode - set to true to enable verbose logging
const DEBUG_MODE = false;

const DEFAULT_LATEX_ENGINE = 'xelatex';
const PDFJS_WORKER_URL = (
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
);

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
}

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
  pdfDocument: null,
  pdfRenderGeneration: 0,
  pageCount: 0,
  sourceRevision: 0,
  compiledRevision: -1,
  zoom: 1.0,
  isCompiling: false,
  compileGeneration: 0,
  engine: DEFAULT_LATEX_ENGINE,
  lastCompileTime: 0,
  // Multi-file project support
  projectFiles: {},
  currentFile: null,
  mainFile: null,
  projectMode: false,
  // Backend project tracking
  currentProjectId: null,
  currentProjectName: null,
  projectFilesIncomplete: false,
  projectSwitchInProgress: false,
  // GitHub
  githubToken: null,
  githubLogin: null,
  githubRepo: null,
  githubPath: '',
  githubBranch: null,
  githubSha: null,
  githubManifest: {},
  githubSyncInProgress: false,
};

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
  editor: document.getElementById('editor'),
  previewContent: document.getElementById('previewContent'),
  previewContainer: document.getElementById('previewContainer'),
  compileBtn: document.getElementById('compileBtn'),
  engineSelect: document.getElementById('engineSelect'),
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
  drawerStorageInfo: document.getElementById('drawerStorageInfo'),
  // New project modal
  newProjectModalOverlay: document.getElementById('newProjectModalOverlay'),
  closeNewProjectModal: document.getElementById('closeNewProjectModal'),
  newProjectName: document.getElementById('newProjectName'),
  newProjectBlankBtn: document.getElementById('newProjectBlankBtn'),
  newProjectMultiBtn: document.getElementById('newProjectMultiBtn'),
  newProjectZipBtn: document.getElementById('newProjectZipBtn'),
  newProjectGithubBtn: document.getElementById('newProjectGithubBtn'),
  // GitHub modal
  githubModalOverlay: document.getElementById('githubModalOverlay'),
  closeGithubModal: document.getElementById('closeGithubModal'),
  githubToken: document.getElementById('githubToken'),
  githubRepo: document.getElementById('githubRepo'),
  githubPath: document.getElementById('githubPath'),
  githubBranch: document.getElementById('githubBranch'),
  githubRepoGroup: document.getElementById('githubRepoGroup'),
  githubStatus: document.getElementById('githubStatus'),
  githubLinkedSource: document.getElementById('githubLinkedSource'),
  githubLinkedSourcePath: document.getElementById('githubLinkedSourcePath'),
  githubLinkedSourceSha: document.getElementById('githubLinkedSourceSha'),
  githubSave: document.getElementById('githubSave'),
  githubDisconnect: document.getElementById('githubDisconnect'),
  githubImport: document.getElementById('githubImport'),
  githubPull: document.getElementById('githubPull'),
  githubCommit: document.getElementById('githubCommit'),
  // Generic prompt/confirm modal
  genericModalOverlay: document.getElementById('genericModalOverlay'),
  genericModalTitle: document.getElementById('genericModalTitle'),
  genericModalMessage: document.getElementById('genericModalMessage'),
  genericModalInputGroup: document.getElementById('genericModalInputGroup'),
  genericModalLabel: document.getElementById('genericModalLabel'),
  genericModalInput: document.getElementById('genericModalInput'),
  genericModalCancel: document.getElementById('genericModalCancel'),
  genericModalOk: document.getElementById('genericModalOk'),
  genericModalClose: document.getElementById('genericModalClose'),
};

// ============================================
// GENERIC MODAL HELPERS (prompt / confirm)
// ============================================

let _genericModalResolve = null;
let _genericModalMode = null; // 'prompt' | 'confirm'

function _openGenericModal() {
  elements.genericModalOverlay.style.display = 'flex';
}

function _closeGenericModal(value) {
  elements.genericModalOverlay.style.display = 'none';
  if (_genericModalResolve) {
    const resolve = _genericModalResolve;
    _genericModalResolve = null;
    _genericModalMode = null;
    resolve(value);
  }
}

/**
 * Show a styled prompt modal. Returns a Promise that resolves to
 * the entered string, or null if the user cancelled.
 */
function showPromptModal(title, label, defaultValue = '', placeholder = '') {
  if (_genericModalResolve) {
    // Cancel any pending modal before opening a new one so the old Promise resolves cleanly.
    _closeGenericModal(null);
  }
  return new Promise((resolve) => {
    _genericModalResolve = resolve;
    _genericModalMode = 'prompt';
    elements.genericModalTitle.textContent = title;
    elements.genericModalMessage.style.display = 'none';
    elements.genericModalInputGroup.style.display = '';
    elements.genericModalLabel.textContent = label;
    elements.genericModalInput.value = defaultValue;
    elements.genericModalInput.placeholder = placeholder;
    elements.genericModalOk.textContent = 'OK';
    elements.genericModalOk.className = 'btn btn-primary';
    _openGenericModal();
    elements.genericModalInput.focus();
    elements.genericModalInput.select();
  });
}

/**
 * Show a styled confirm modal. Returns a Promise that resolves to
 * true (confirmed) or false (cancelled).
 * @param {Object} [opts] - Options: okLabel, danger (uses red button)
 */
function showConfirmModal(title, message, opts = {}) {
  if (_genericModalResolve) {
    // Cancel any pending modal before opening a new one so the old Promise resolves cleanly.
    _closeGenericModal(false);
  }
  return new Promise((resolve) => {
    _genericModalResolve = resolve;
    _genericModalMode = 'confirm';
    elements.genericModalTitle.textContent = title;
    elements.genericModalMessage.textContent = message;
    elements.genericModalMessage.style.display = '';
    elements.genericModalInputGroup.style.display = 'none';
    elements.genericModalOk.textContent = opts.okLabel || 'Confirm';
    elements.genericModalOk.className = opts.danger
      ? 'btn btn-danger'
      : 'btn btn-primary';
    _openGenericModal();
    elements.genericModalOk.focus();
  });
}

// Wire up generic modal buttons & dismiss paths
elements.genericModalOk.addEventListener('click', () => {
  if (_genericModalMode === 'prompt') {
    _closeGenericModal(elements.genericModalInput.value);
  } else {
    _closeGenericModal(true);
  }
});
elements.genericModalCancel.addEventListener('click', () => {
  _closeGenericModal(_genericModalMode === 'prompt' ? null : false);
});
elements.genericModalClose.addEventListener('click', () => {
  _closeGenericModal(_genericModalMode === 'prompt' ? null : false);
});
elements.genericModalOverlay.addEventListener('click', (e) => {
  if (e.target === elements.genericModalOverlay) {
    _closeGenericModal(_genericModalMode === 'prompt' ? null : false);
  }
});
document.addEventListener('keydown', (e) => {
  if (elements.genericModalOverlay.style.display !== 'flex') return;
  if (e.key === 'Escape') {
    e.stopPropagation();
    _closeGenericModal(_genericModalMode === 'prompt' ? null : false);
  }
  if (e.key === 'Enter' && _genericModalMode === 'prompt') {
    e.preventDefault();
    _closeGenericModal(elements.genericModalInput.value);
  }
});

function setLatexEngine(engine) {
  const supportedEngines = ['pdflatex', 'xelatex', 'lualatex'];
  state.engine = supportedEngines.includes(engine) ? engine : DEFAULT_LATEX_ENGINE;
  if (elements.engineSelect) {
    elements.engineSelect.value = state.engine;
  }
}

function markCompileDirty() {
  state.sourceRevision++;
}

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
  elements.engineSelect.value = state.engine;
  
  initializeEventListeners();
  initializeResizer();
  initAutocomplete();
  
  // Restore zoom from localStorage
  const savedZoom = localStorage.getItem('latexEditor_zoom');
  if (savedZoom) setZoom(parseFloat(savedZoom));
  const savedEngine = localStorage.getItem('latexEditor_engine');
  if (savedEngine) setLatexEngine(savedEngine);

  // Always load projects from the backend (authoritative source)
  let restored = false;
  const lastProjectId = localStorage.getItem('latexEditor_lastProjectId');
  if (lastProjectId) {
    restored = await loadLastProjectFromBackend();
  }

  // Recover local project state when no backend project was restored.
  if (!restored) {
    restored = loadProjectFromLocalStorage();
  }

  if (!restored) {
    // Fall back to simple localStorage content (non-project documents)
    try {
      const savedContent = localStorage.getItem('latexEditor_content');
      if (savedContent && savedContent !== DEFAULT_TEMPLATE) {
        state.currentLatex = savedContent;
        elements.editor.value = savedContent;
        restored = true;
      }
    } catch (e) { /* ignore */ }
  }
  
  showStatus('Compiling...', 'info');
  await compile(true);
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
  elements.compileBtn.addEventListener('click', () => compile());
  elements.engineSelect.addEventListener('change', () => {
    setLatexEngine(elements.engineSelect.value);
    markCompileDirty();
    saveToLocalStorage();
    scheduleBackendSave();
    showStatus('Changes not compiled', 'info');
  });
  
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
  if (elements.newProjectGithubBtn) {
    elements.newProjectGithubBtn.addEventListener('click', () => {
      closeNewProjectModal();
      openGithubModal();
    });
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
    elements.newFileBtn.addEventListener('click', async () => {
      if (!state.projectMode) {
        if (await showConfirmModal('New Project', 'Create a new project to add files? Unsaved changes to the current document will be lost.')) {
          newProject();
        }
        return;
      }
      await addNewFile('');
    });
  }
  if (elements.newFolderBtn) {
    elements.newFolderBtn.addEventListener('click', async () => {
      if (!state.projectMode) {
        if (await showConfirmModal('New Project', 'Create a new project to add folders? Unsaved changes to the current document will be lost.')) {
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
    elements.drawerGithubBtn.addEventListener('click', () => {
      closeProjectsDrawer();
      openGithubModal();
    });
  }
  if (elements.closeGithubModal) {
    elements.closeGithubModal.addEventListener('click', () => closeGithubModal());
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
  if (elements.githubImport) {
    elements.githubImport.addEventListener('click', importFromGithub);
  }
  if (elements.githubPull) {
    elements.githubPull.addEventListener('click', pullFromGithub);
  }
  if (elements.githubCommit) {
    elements.githubCommit.addEventListener('click', commitToGithub);
  }

  // Save to localStorage on unload
  window.addEventListener('beforeunload', saveToLocalStorage);
}

// ============================================
// EDITOR HANDLERS
// ============================================

function handleEditorChange(e) {
  if (state.githubSyncInProgress || state.projectSwitchInProgress) {
    e.target.value = state.currentLatex;
    showErrorToast('Wait for the current project operation to finish');
    return;
  }
  state.currentLatex = e.target.value;
  markCompileDirty();
  
  // Update project file if in project mode
  if (state.projectMode && state.currentFile) {
    state.projectFiles[state.currentFile] = state.currentLatex;
  }
  
  saveToLocalStorage();
  scheduleBackendSave();
  scheduleDirtyStatus();
}

let _dirtyStatusTimer = null;

function scheduleDirtyStatus() {
  if (_dirtyStatusTimer) clearTimeout(_dirtyStatusTimer);
  _dirtyStatusTimer = setTimeout(() => {
    if (!state.isCompiling) {
      showStatus('Changes not compiled', 'info');
    }
  }, 400);
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
    return false;
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
    const request = createCompileRequest();
    const sourceRevision = state.sourceRevision;
    const result = await compileLatexProject(request);

    // Stale check — a newer compile was triggered while we were working
    if (generation !== state.compileGeneration) return false;
    if (sourceRevision !== state.sourceRevision) {
      showStatus('Changes not compiled', 'info');
      return false;
    }

    state.pdfData = result.pdf;
    state.compiledRevision = sourceRevision;
    state.lastCompileTime = result.compileTime || (Date.now() - startTime);
    state.pageCount = result.pageCount;

    await renderPDF(result.pdf, generation);
    if (sourceRevision !== state.sourceRevision) {
      showStatus('Changes not compiled', 'info');
      return false;
    }

    const pageLabel = `${state.pageCount} page${state.pageCount === 1 ? '' : 's'}`;
    showStatus(
      `Compiled ${pageLabel} with ${state.engine} (${state.lastCompileTime}ms)`,
      'success'
    );
    if (!isInitial) {
      showSuccessToast(`Compiled ${pageLabel}`);
    }
    return true;
  } catch (error) {
    console.error('Compilation error:', error);
    showStatus('Compilation failed', 'error');
    showErrorToast(error.message || 'Failed to compile LaTeX document');
    clearPreview(
      error.compileErrors?.length
        ? error.compileErrors
        : [{ line: '?', message: error.message || 'Compilation failed' }],
      error.compileLog
    );
    return false;
  } finally {
    clearTimeout(loadingTimer);
    state.isCompiling = false;
    hideLoading();
  }
}

function createCompileRequest() {
  if (state.projectMode) {
    if (state.projectFilesIncomplete) {
      throw new Error(
        'This recovery copy is missing binary files. Reopen or pull the complete project.'
      );
    }
    if (!state.mainFile) {
      throw new Error('Select a main .tex file before compiling');
    }
    if (state.currentFile && !isBinaryContent(state.projectFiles[state.currentFile])) {
      state.projectFiles[state.currentFile] = state.currentLatex;
    }
    return {
      files: serializeProjectFiles(),
      main_file: state.mainFile,
      engine: state.engine,
    };
  }

  return {
    latex: state.currentLatex,
    main_file: 'document.tex',
    engine: state.engine,
  };
}

async function compileLatexProject(requestPayload) {
  const response = await fetch(`${API_BASE}/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const error = new Error(details.error || `Compilation failed with HTTP ${response.status}`);
    error.compileErrors = details.errors || [];
    error.compileLog = details.log || details.details || '';
    throw error;
  }

  const pdf = await response.blob();
  if (pdf.type !== 'application/pdf') {
    throw new Error('Compiler returned an invalid PDF response');
  }
  return {
    pdf,
    pageCount: Number.parseInt(response.headers.get('X-Page-Count'), 10) || 0,
    compileTime: Number.parseInt(response.headers.get('X-Compile-Time-Ms'), 10) || 0,
  };
}

// ============================================
// PDF RENDERING
// ============================================

function clearPreview(errors, compileLog = '') {
  state.pdfData = null;
  state.compiledRevision = -1;
  state.pageCount = 0;
  state.pdfRenderGeneration++;
  if (state.pdfDocument) {
    state.pdfDocument.destroy().catch(() => {});
    state.pdfDocument = null;
  }

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
    const location = err.file
      ? `${err.file}${err.line !== '?' ? `:${err.line}` : ''}`
      : `Line ${err.line}`;
    li.textContent = `${location}: ${err.message}`;
    list.appendChild(li);
  }
  errorDiv.appendChild(list);

  if (compileLog) {
    const details = document.createElement('details');
    details.className = 'compile-log';
    const summary = document.createElement('summary');
    summary.textContent = 'Compiler output';
    const pre = document.createElement('pre');
    pre.textContent = compileLog;
    details.append(summary, pre);
    errorDiv.appendChild(details);
  }
  elements.previewContent.appendChild(errorDiv);
}

async function renderPDF(pdfBlob, generation) {
  if (!window.pdfjsLib) {
    throw new Error('PDF preview renderer failed to load');
  }

  const data = new Uint8Array(await pdfBlob.arrayBuffer());
  const loadingTask = window.pdfjsLib.getDocument({
    data,
    isEvalSupported: false,
  });
  const pdfDocument = await loadingTask.promise;
  if (generation !== state.compileGeneration) {
    await pdfDocument.destroy();
    return;
  }

  if (state.pdfDocument) {
    await state.pdfDocument.destroy();
  }
  state.pdfDocument = pdfDocument;
  state.pageCount = pdfDocument.numPages;
  await renderPDFPages(generation);
}

async function renderPDFPages(generation = state.compileGeneration) {
  if (!state.pdfDocument) return;

  const renderGeneration = ++state.pdfRenderGeneration;
  elements.previewContent.replaceChildren();
  const outputScale = Math.min(window.devicePixelRatio || 1, 1.5);
  const previewScale = (96 / 72) * state.zoom;

  for (let pageNumber = 1; pageNumber <= state.pdfDocument.numPages; pageNumber++) {
    if (
      generation !== state.compileGeneration
      || renderGeneration !== state.pdfRenderGeneration
    ) {
      return;
    }

    const page = await state.pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: previewScale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('The browser could not allocate a PDF rendering canvas');
    }
    canvas.className = 'pdf-page';
    canvas.setAttribute('aria-label', `PDF page ${pageNumber}`);
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    elements.previewContent.appendChild(canvas);

    await page.render({
      canvasContext: context,
      viewport,
      transform: outputScale === 1
        ? null
        : [outputScale, 0, 0, outputScale, 0, 0],
    }).promise;
  }
}

// ============================================
// ZOOM CONTROLS
// ============================================

function setZoom(newZoom) {
  state.zoom = Math.max(0.5, Math.min(2.0, newZoom));
  elements.zoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
  localStorage.setItem('latexEditor_zoom', state.zoom.toString());
  if (state.pdfDocument) {
    renderPDFPages().catch((error) => {
      console.error('PDF zoom render failed:', error);
      showErrorToast('Failed to update PDF zoom');
    });
  }
}

// ============================================
// DOWNLOAD FUNCTIONS
// ============================================

async function downloadPDF() {
  try {
    if (!state.pdfData || state.compiledRevision !== state.sourceRevision) {
      const compiled = await compile();
      if (!compiled) return;
    }

    const sourceName = state.projectMode && state.mainFile
      ? state.mainFile.split('/').pop()
      : 'document.tex';
    const pdfName = `${sourceName.replace(/\.tex$/i, '') || 'document'}.pdf`;
    const url = URL.createObjectURL(state.pdfData);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = pdfName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    showSuccessToast('Downloaded the compiled PDF');
  } catch (error) {
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

function setProjectSwitchInProgress(inProgress) {
  state.projectSwitchInProgress = inProgress;
  elements.fileTree.style.pointerEvents = inProgress ? 'none' : '';
  if (elements.newDocBtn) {
    elements.newDocBtn.disabled = inProgress;
  }

  if (inProgress) {
    elements.editor.readOnly = true;
    return;
  }

  const currentContent = state.currentFile
    ? state.projectFiles[state.currentFile]
    : null;
  elements.editor.readOnly = isBinaryContent(currentContent);
}

/**
 * Create a new blank single-file project (just main.tex)
 */
async function createBlankProject(projectName) {
  clearTimeout(_backendSaveTimer);
  if (state.projectFilesIncomplete) {
    throw new Error(
      'Export or reopen the incomplete recovery copy before creating another project.'
    );
  }
  if (state.projectMode) {
    await saveProjectToBackend({ throwOnError: true });
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

  state.currentProjectId = null;
  state.currentProjectName = projectName;
  state.projectFilesIncomplete = false;
  setLatexEngine(DEFAULT_LATEX_ENGINE);
  localStorage.removeItem('latexEditor_lastProjectId');
  clearProjectGithubLink();
  state.projectFiles = { 'main.tex': mainContent };
  state.mainFile = 'main.tex';
  state.currentFile = 'main.tex';
  state.projectMode = true;
  state.currentLatex = mainContent;
  markCompileDirty();

  elements.editor.value = mainContent;
  elements.editor.readOnly = false;
  elements.currentFileName.textContent = 'main.tex';

  buildFileTree(state.projectFiles);
  elements.fileTree.classList.add('visible');
  elements.toggleFileTreeBtn.style.display = 'inline-block';
  elements.downloadZipBtn.style.display = 'inline-block';

  saveProjectToLocalStorage();
  await saveProjectToBackend({ throwOnError: true });

  showSuccessToast(`Created project: ${projectName}`);
  compile(true);
}

/**
 * Create a new multi-file project with sections/ structure
 */
async function createMultiFileProject(projectName) {
  clearTimeout(_backendSaveTimer);
  if (state.projectFilesIncomplete) {
    throw new Error(
      'Export or reopen the incomplete recovery copy before creating another project.'
    );
  }
  if (state.projectMode) {
    await saveProjectToBackend({ throwOnError: true });
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

  state.currentProjectId = null;
  state.currentProjectName = projectName;
  state.projectFilesIncomplete = false;
  setLatexEngine(DEFAULT_LATEX_ENGINE);
  localStorage.removeItem('latexEditor_lastProjectId');
  clearProjectGithubLink();
  state.projectFiles = {
    'main.tex': mainContent,
    'sections/introduction.tex': introContent,
  };

  state.mainFile = 'main.tex';
  state.currentFile = 'main.tex';
  state.projectMode = true;
  state.currentLatex = mainContent;
  markCompileDirty();

  elements.editor.value = mainContent;
  elements.editor.readOnly = false;
  elements.currentFileName.textContent = 'main.tex';

  buildFileTree(state.projectFiles);
  elements.fileTree.classList.add('visible');
  elements.toggleFileTreeBtn.style.display = 'inline-block';
  elements.downloadZipBtn.style.display = 'inline-block';

  saveProjectToLocalStorage();
  await saveProjectToBackend({ throwOnError: true });

  showSuccessToast(`Created project: ${projectName}`);
  compile(true);
}

/**
 * Open the new project modal.
 * Replaces the old separate newDocument() / newProject() flows.
 */
async function openNewProjectModal() {
  if (state.githubSyncInProgress) {
    showErrorToast('Wait for the GitHub sync operation to finish');
    return;
  }
  if (state.projectFilesIncomplete) {
    showErrorToast(
      'Export or reopen the incomplete recovery copy before creating another project.'
    );
    return;
  }
  if (state.projectMode && Object.keys(state.projectFiles).length > 0 &&
      state.currentLatex !== DEFAULT_TEMPLATE &&
      !(await showConfirmModal('New Project', 'Create new project? You will switch away from the current project.'))) {
    return;
  }
  elements.newProjectModalOverlay.style.display = 'flex';
  elements.newProjectName.value = '';
  elements.newProjectName.focus();
}

function closeNewProjectModal() {
  elements.newProjectModalOverlay.style.display = 'none';
}

async function handleNewProjectCreate(type) {
  const name = elements.newProjectName.value.trim();
  if (!name) {
    showErrorToast('Please enter a project name');
    elements.newProjectName.focus();
    return;
  }

  closeNewProjectModal();
  closeProjectsDrawer();

  const switchesProject = type === 'blank' || type === 'multifile';
  if (switchesProject) {
    setProjectSwitchInProgress(true);
  }

  try {
    if (type === 'blank') {
      await createBlankProject(name);
    } else if (type === 'multifile') {
      await createMultiFileProject(name);
    } else if (type === 'zip') {
      // Store the name for the zip upload handler, then trigger file picker
      state._pendingProjectName = name;
      elements.zipFileInput.click();
    }
  } catch (error) {
    console.error('Failed to create project:', error);
    showErrorToast(`Project creation failed: ${error.message}`);
  } finally {
    if (switchesProject) {
      setProjectSwitchInProgress(false);
    }
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
  return Boolean(
    content
    && typeof content === 'object'
    && (content.isBinary === true || content.type === 'binary')
  );
}

function clearProjectGithubLink() {
  state.githubRepo = null;
  state.githubPath = '';
  state.githubBranch = null;
  state.githubSha = null;
  state.githubManifest = {};
}

function setProjectGithubLink(github) {
  if (!github) {
    clearProjectGithubLink();
    return;
  }

  state.githubRepo = github.repo;
  state.githubPath = github.path || '';
  state.githubBranch = github.branch;
  state.githubSha = github.sha;
  state.githubManifest = { ...(github.manifest || {}) };
}

function getCurrentGithubLink() {
  if (!state.githubRepo || !state.githubBranch || !state.githubSha) {
    return null;
  }
  return {
    repo: state.githubRepo,
    path: state.githubPath || '',
    branch: state.githubBranch,
    sha: state.githubSha,
    manifest: { ...state.githubManifest },
  };
}

function serializeProjectFiles(files = state.projectFiles) {
  const serialized = {};
  for (const [path, content] of Object.entries(files)) {
    serialized[path] = isBinaryContent(content)
      ? { isBinary: true, content: content.content || '' }
      : content;
  }
  return serialized;
}

function cloneProjectFiles(files = state.projectFiles) {
  const cloned = {};
  for (const [path, content] of Object.entries(files)) {
    cloned[path] = isBinaryContent(content)
      ? { isBinary: true, content: content.content || '' }
      : content;
  }
  return cloned;
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
    localStorage.setItem('latexEditor_engine', state.engine);
    
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
      currentFile: state.currentFile,
      projectId: state.currentProjectId,
      projectName: state.currentProjectName,
      engine: state.engine,
      github: getCurrentGithubLink(),
      binaryFilesStripped: state.projectFilesIncomplete,
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
      projectId: state.currentProjectId,
      projectName: state.currentProjectName,
      engine: state.engine,
      github: getCurrentGithubLink(),
      binaryFilesStripped: true,
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
    const savedEngine = localStorage.getItem('latexEditor_engine');
    const isProjectMode = localStorage.getItem('latexEditor_projectMode') === 'true';
    
    if (savedZoom) {
      setZoom(parseFloat(savedZoom));
    }
    if (savedEngine) {
      setLatexEngine(savedEngine);
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
 * Retries once after a short delay if the first attempt fails (Docker startup race).
 */
async function loadLastProjectFromBackend() {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const lastProjectId = localStorage.getItem('latexEditor_lastProjectId');

      if (lastProjectId) {
        const res = await fetch(`${API_BASE}/projects/${lastProjectId}`);
        if (res.ok) {
          const project = await res.json();
          restoreProject(project);
          return true;
        }
      }

      // Fall back to most recently updated project
      const listRes = await fetch(`${API_BASE}/projects`);
      if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
      const data = await listRes.json();
      const projects = data.projects || [];
      if (projects.length === 0) return false;

      const latest = projects[0];
      const res = await fetch(`${API_BASE}/projects/${latest.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const project = await res.json();
      restoreProject(project);
      return true;
    } catch (err) {
      if (attempt === 0) {
        console.warn('Backend not ready, retrying in 1s...', err.message);
        await new Promise(r => setTimeout(r, 1000));
      } else {
        console.error('Failed to load project from backend:', err);
      }
    }
  }
  return false;
}

/**
 * Restore a project from API response data into the editor state.
 */
function restoreProject(project, options = {}) {
  state.projectFiles = project.files || {};
  state.mainFile = project.main_file;
  state.currentFile = project.main_file;
  state.projectMode = true;
  state.currentProjectId = project.id;
  state.currentProjectName = project.name;
  state.projectFilesIncomplete = false;
  setLatexEngine(project.engine);
  setProjectGithubLink(project.github);
  markCompileDirty();

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

  if (options.showToast !== false) {
    showSuccessToast(`Restored project: ${project.name}`);
  }
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
    state.currentProjectId = projectData.projectId || null;
    state.currentProjectName = projectData.projectName || null;
    state.projectFilesIncomplete = Boolean(projectData.binaryFilesStripped);
    setLatexEngine(projectData.engine);
    setProjectGithubLink(projectData.github);
    markCompileDirty();
    
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
    saveProjectToLocalStorage();
    scheduleBackendSave();
    markCompileDirty();
    showSuccessToast(`Cleaned ${removedCount} macOS/system files`);
  } else {
    showSuccessToast('Project is already clean!');
  }
}

async function handleZipUpload(event) {
  if (state.githubSyncInProgress) {
    event.target.value = '';
    showErrorToast('Wait for the GitHub sync operation to finish');
    return;
  }
  const file = event.target.files[0];
  if (!file) {
    state._pendingProjectName = null;
    return;
  }

  if (!file.name.endsWith('.zip')) {
    state._pendingProjectName = null;
    showErrorToast('Please upload a ZIP file');
    return;
  }
  if (state.projectFilesIncomplete) {
    state._pendingProjectName = null;
    event.target.value = '';
    showErrorToast(
      'Export or reopen the incomplete recovery copy before importing a ZIP.'
    );
    return;
  }
  setProjectSwitchInProgress(true);

  // Save current project to backend before loading a new one
  clearTimeout(_backendSaveTimer);
  if (state.projectMode && !state.projectFilesIncomplete) {
    try {
      await saveProjectToBackend({ throwOnError: true });
    } catch (error) {
      showErrorToast(`Could not save the current project: ${error.message}`);
      event.target.value = '';
      setProjectSwitchInProgress(false);
      return;
    }
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
    state.currentProjectId = null;
    state.currentProjectName = null;
    state.projectFilesIncomplete = false;
    setLatexEngine(DEFAULT_LATEX_ENGINE);
    localStorage.removeItem('latexEditor_lastProjectId');
    clearProjectGithubLink();
    state.projectFiles = files;
    state.mainFile = mainTexFile;
    state.currentFile = mainTexFile;
    state.projectMode = true;
    markCompileDirty();
    
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
    const projectName = state._pendingProjectName || (await showPromptModal('Project Name', 'Enter project name:', file.name.replace(/\.zip$/i, '')));
    state._pendingProjectName = null;
    if (projectName && projectName.trim()) {
      state.currentProjectName = projectName.trim();
      saveProjectToLocalStorage();
      const payload = {
        name: state.currentProjectName,
        files: serializeProjectFiles(files),
        main_file: mainTexFile,
        engine: state.engine,
      };
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
          state.projectFilesIncomplete = false;
          setLatexEngine(project.engine);
          setProjectGithubLink(project.github);
          localStorage.setItem('latexEditor_lastProjectId', project.id);
          saveProjectToLocalStorage();
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
    setProjectSwitchInProgress(false);
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
    if (
      state.currentFile
      && !isBinaryContent(state.projectFiles[state.currentFile])
    ) {
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

function hasProjectFile(path) {
  return Object.prototype.hasOwnProperty.call(state.projectFiles, path);
}

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
async function addNewFile(parentPath) {
  const filename = await showPromptModal('New File', 'File name:', '', 'chapter1.tex');
  if (!filename) return;

  const safeName = sanitizeFilename(filename);
  if (!safeName) {
    showErrorToast('Invalid filename. Avoid special characters, ".." and leading slashes.');
    return;
  }
  
  const newPath = parentPath ? `${parentPath}/${safeName}` : safeName;
  
  if (hasProjectFile(newPath)) {
    showErrorToast('File already exists');
    return;
  }
  
  // Default content based on file type
  let content = '';
  if (filename.endsWith('.tex')) {
    content = '% ' + filename + '\n\n';
  }
  
  state.projectFiles[newPath] = content;
  markCompileDirty();
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Open the new file
  openFile(newPath, null);
  
  // Auto-save project
  saveProjectToLocalStorage();
  scheduleBackendSave();
  
  showSuccessToast(`Created ${filename}`);
}

/**
 * Add a new folder to the project
 */
async function addNewFolder(parentPath) {
  const foldername = await showPromptModal('New Folder', 'Folder name:', '', 'sections');
  if (!foldername) return;

  const safeName = sanitizeFilename(foldername);
  if (!safeName || safeName.includes('/')) {
    showErrorToast('Invalid folder name. Avoid special characters, ".." and slashes.');
    return;
  }
  
  const placeholderPath = parentPath ? `${parentPath}/${safeName}/.gitkeep` : `${safeName}/.gitkeep`;
  
  if (hasProjectFile(placeholderPath)) {
    showErrorToast('Folder already exists');
    return;
  }
  
  state.projectFiles[placeholderPath] = '';
  markCompileDirty();
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
  scheduleBackendSave();
  
  showSuccessToast(`Created folder ${safeName}`);
}

/**
 * Rename a file
 */
async function renameFile(oldPath) {
  const oldName = oldPath.split('/').pop();
  const newName = await showPromptModal('Rename File', 'New file name:', oldName);
  if (!newName) return;

  const safeName = sanitizeFilename(newName);
  if (!safeName || safeName.includes('/')) {
    showErrorToast('Invalid filename. Avoid special characters, ".." and slashes.');
    return;
  }
  if (safeName === oldName) return;
  
  const pathParts = oldPath.split('/');
  pathParts[pathParts.length - 1] = safeName;
  const newPath = pathParts.join('/');
  
  if (hasProjectFile(newPath)) {
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
  markCompileDirty();
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
  scheduleBackendSave();
  
  showSuccessToast(`Renamed to ${safeName}`);
}

/**
 * Rename a folder (moves all files within)
 */
async function renameFolder(oldPath) {
  const oldName = oldPath.split('/').pop();
  const newName = await showPromptModal('Rename Folder', 'New folder name:', oldName);
  if (!newName) return;

  const safeName = sanitizeFilename(newName);
  if (!safeName || safeName.includes('/')) {
    showErrorToast('Invalid folder name. Avoid special characters, ".." and slashes.');
    return;
  }
  if (safeName === oldName) return;
  
  const pathParts = oldPath.split('/');
  pathParts[pathParts.length - 1] = safeName;
  const newPath = pathParts.join('/');
  
  // Move all files in the folder
  const filesToMove = Object.keys(state.projectFiles).filter(p => 
    p === oldPath || p.startsWith(oldPath + '/')
  );

  const sourcePaths = new Set(filesToMove);
  const moves = filesToMove.map(filePath => ({
    oldPath: filePath,
    newPath: newPath + filePath.slice(oldPath.length),
  }));
  const collision = moves.find(
    move => hasProjectFile(move.newPath) && !sourcePaths.has(move.newPath)
  );
  if (collision) {
    showErrorToast(`Cannot rename folder: ${collision.newPath} already exists`);
    return;
  }

  const movedFiles = {};
  for (const move of moves) {
    movedFiles[move.newPath] = state.projectFiles[move.oldPath];
  }
  for (const move of moves) {
    delete state.projectFiles[move.oldPath];
  }
  Object.assign(state.projectFiles, movedFiles);

  for (const move of moves) {
    const { oldPath: filePath, newPath: newFilePath } = move;
    
    // Update references
    if (state.currentFile === filePath) {
      state.currentFile = newFilePath;
    }
    if (state.mainFile === filePath) {
      state.mainFile = newFilePath;
    }
  }
  markCompileDirty();
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
  scheduleBackendSave();
  
  showSuccessToast(`Renamed folder to ${safeName}`);
}

/**
 * Delete a file
 */
async function deleteFile(path) {
  const filename = path.split('/').pop();
  if (!(await showConfirmModal('Delete File', `Delete ${filename}? This cannot be undone.`, { okLabel: 'Delete', danger: true }))) return;
  
  if (path === state.mainFile) {
    showErrorToast('Cannot delete the main file');
    return;
  }
  
  delete state.projectFiles[path];
  markCompileDirty();
  
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
  scheduleBackendSave();
  
  showSuccessToast(`Deleted ${filename}`);
}

/**
 * Delete a folder and all its contents
 */
async function deleteFolder(path) {
  const foldername = path.split('/').pop();
  if (!(await showConfirmModal('Delete Folder', `Delete folder "${foldername}" and all its contents? This cannot be undone.`, { okLabel: 'Delete', danger: true }))) return;
  
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
  markCompileDirty();
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
  scheduleBackendSave();
  
  showSuccessToast(`Deleted folder ${foldername}`);
}

/**
 * Set a .tex file as the main file for compilation
 */
function setAsMainFile(path) {
  state.mainFile = path;
  markCompileDirty();
  showSuccessToast(`${path.split('/').pop()} is now the main file`);
  
  // Rebuild file tree to update visual indication
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
  scheduleBackendSave();
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
  loadStorageInfo();
}

function closeProjectsDrawer() {
  elements.projectsDrawer.classList.remove('open');
  elements.drawerOverlay.classList.remove('open');
}

async function loadStorageInfo() {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) return;
    const data = await res.json();
    const sizeKB = (data.db_size_bytes / 1024).toFixed(1);
    elements.drawerStorageInfo.innerHTML =
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>` +
      ` Storage: <strong>${data.storage_path}</strong> (${sizeKB} KB)`;
  } catch {
    elements.drawerStorageInfo.textContent = '';
  }
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
        <p class="drawer-empty-hint">Import a GitHub folder, upload a ZIP, or create a project.</p>
      </div>`;
    return;
  }

  elements.projectsList.innerHTML = projects.map(p => {
    const updated = new Date(p.updated_at).toLocaleDateString();
    const isActive = state.currentProjectId === p.id;
    const githubSource = p.github
      ? `<div class="project-card-source">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="6" cy="5" r="2"/><circle cx="18" cy="6" r="2"/>
            <circle cx="6" cy="19" r="2"/><path d="M6 7v10"/>
            <path d="M8 7.5c4.5 0 3.5 5 8 5"/>
          </svg>
          <span>${escapeHtml(p.github.repo)}${p.github.path ? `/${escapeHtml(p.github.path)}` : ''} · ${escapeHtml(p.github.branch)}</span>
        </div>`
      : '';
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
      ${githubSource}
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

let _openProjectRequestId = 0;

async function openProject(projectId) {
  if (state.githubSyncInProgress) {
    showErrorToast('Wait for the GitHub sync operation to finish');
    return;
  }
  if (
    state.projectFilesIncomplete
    && projectId !== state.currentProjectId
  ) {
    showErrorToast(
      'Reopen the current project or export its incomplete recovery copy before switching.'
    );
    return;
  }

  const requestId = ++_openProjectRequestId;
  clearTimeout(_backendSaveTimer);
  setProjectSwitchInProgress(true);

  try {
    if (!state.projectFilesIncomplete) {
      await saveProjectToBackend({ throwOnError: true });
    }
    if (requestId !== _openProjectRequestId) return;

    const res = await fetch(`${API_BASE}/projects/${projectId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const project = await res.json();
    if (requestId !== _openProjectRequestId) return;

    restoreProject(project, { showToast: false });
    closeProjectsDrawer();
    compile();
    showSuccessToast(`Opened project: ${project.name}`);
  } catch (err) {
    if (requestId !== _openProjectRequestId) return;
    console.error('Failed to open project:', err);
    showErrorToast(`Failed to open project: ${err.message}`);
  } finally {
    if (requestId === _openProjectRequestId) {
      setProjectSwitchInProgress(false);
    }
  }
}

let _backendSaveInFlight = null;

async function saveProjectToBackend(options = {}) {
  if (state.githubSyncInProgress && !options.allowDuringGithubSync) {
    return true;
  }
  if (state.projectFilesIncomplete) {
    const error = new Error(
      'This recovery copy is missing binary files. Reopen or pull the complete project before saving.'
    );
    if (options.throwOnError) throw error;
    return false;
  }

  const snapshot = captureProjectSave();
  if (!snapshot) return true;

  const previousSave = _backendSaveInFlight;
  const savePromise = (async () => {
    if (previousSave) {
      await previousSave.catch(() => {});
    }
    return performProjectSave(snapshot, options);
  })();
  _backendSaveInFlight = savePromise;
  try {
    return await savePromise;
  } finally {
    if (_backendSaveInFlight === savePromise) {
      _backendSaveInFlight = null;
    }
  }
}

function captureProjectSave() {
  if (!state.projectMode) return null;

  if (state.currentFile && state.projectFiles[state.currentFile] !== undefined) {
    if (!isBinaryContent(state.projectFiles[state.currentFile])) {
      state.projectFiles[state.currentFile] = state.currentLatex;
    }
  }

  return {
    projectId: state.currentProjectId,
    projectName: state.currentProjectName,
    mainFile: state.mainFile,
    engine: state.engine,
    files: serializeProjectFiles(),
    github: getCurrentGithubLink(),
  };
}

function isProjectSaveActive(snapshot) {
  if (snapshot.projectId) {
    return state.currentProjectId === snapshot.projectId;
  }
  return (
    state.currentProjectId === null
    && state.currentProjectName === snapshot.projectName
    && state.mainFile === snapshot.mainFile
    && state.engine === snapshot.engine
  );
}

async function performProjectSave(snapshot, options = {}) {
  const { throwOnError = false } = options;
  const activeProjectId = (
    !snapshot.projectId
    && state.currentProjectId
    && state.currentProjectName === snapshot.projectName
    && state.mainFile === snapshot.mainFile
    && state.engine === snapshot.engine
  )
    ? state.currentProjectId
    : snapshot.projectId;
  const payload = {
    files: snapshot.files,
    main_file: snapshot.mainFile,
    engine: snapshot.engine,
    github: snapshot.github,
  };

  try {
    let savedProjectId = activeProjectId;
    if (activeProjectId) {
      const res = await fetch(`${API_BASE}/projects/${activeProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${res.status}`);
      }
    } else {
      const name = snapshot.projectName
        || (await showPromptModal('Save Project', 'Project name:', 'my-project'));
      if (!name) return false;
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
      savedProjectId = project.id;
      if (isProjectSaveActive(snapshot)) {
        state.currentProjectId = project.id;
        state.currentProjectName = project.name;
        setProjectGithubLink(project.github);
      }
    }

    if (
      savedProjectId
      && isProjectSaveActive({ ...snapshot, projectId: savedProjectId })
    ) {
      localStorage.setItem('latexEditor_lastProjectId', savedProjectId);
    }
    return true;
  } catch (err) {
    console.error('Failed to save project to backend:', err);
    if (throwOnError) {
      throw err;
    }
    showErrorToast(`Save failed: ${err.message}`);
    return false;
  }
}

async function renameProjectPrompt(projectId) {
  const newName = await showPromptModal('Rename Project', 'New project name:');
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
  if (!(await showConfirmModal('Delete Project', `Delete project "${projectName}"? This cannot be undone.`, { okLabel: 'Delete', danger: true }))) return;

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
  if (
    !state.projectMode
    || state.projectFilesIncomplete
    || state.githubSyncInProgress
  ) return;
  clearTimeout(_backendSaveTimer);
  _backendSaveTimer = setTimeout(() => saveProjectToBackend(), 5000);
}

// ============================================
// GITHUB INTEGRATION
// ============================================

const GITHUB_API_BASE = 'https://api.github.com';
const MAX_GITHUB_IMPORT_FILES = 500;
const MAX_GITHUB_IMPORT_BYTES = 7 * 1024 * 1024;
const GITHUB_REPO_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9_.-]+$/;
const GITHUB_BRANCH_FORBIDDEN = /[\x00-\x20\x7f~^:?*\[\\]/;
const GITHUB_FILE_MODES = new Set(['100644', '100755', '120000']);

function openGithubModal() {
  elements.githubModalOverlay.classList.add('open');

  loadGithubSession();
  elements.githubToken.value = state.githubToken || '';

  const link = getCurrentGithubLink();
  elements.githubRepo.value = link?.repo
    || localStorage.getItem('latexEditor_githubRepo')
    || '';
  elements.githubPath.value = link?.path
    ?? localStorage.getItem('latexEditor_githubPath')
    ?? '';
  elements.githubBranch.value = link?.branch
    || localStorage.getItem('latexEditor_githubBranch')
    || '';

  refreshGithubModal();
  if (state.githubToken) {
    elements.githubRepo.focus();
  } else {
    elements.githubToken.focus();
  }
}

function closeGithubModal(force = false) {
  if (state.githubSyncInProgress && !force) {
    return;
  }
  elements.githubModalOverlay.classList.remove('open');
}

function loadGithubSession() {
  try {
    const legacyToken = localStorage.getItem('latexEditor_githubToken');
    const token = sessionStorage.getItem('latexEditor_githubToken') || legacyToken;
    if (token) {
      sessionStorage.setItem('latexEditor_githubToken', token);
      state.githubToken = token;
    }
    state.githubLogin = sessionStorage.getItem('latexEditor_githubLogin');
    localStorage.removeItem('latexEditor_githubToken');
  } catch (error) {
    console.error('Failed to restore GitHub session:', error);
  }
}

function refreshGithubModal() {
  const connected = Boolean(state.githubToken);
  const link = getCurrentGithubLink();

  elements.githubStatus.className = connected
    ? 'github-status connected'
    : 'github-status';
  elements.githubStatus.textContent = connected
    ? `Authenticated${state.githubLogin ? ` as ${state.githubLogin}` : ''}`
    : '';
  elements.githubStatus.style.display = connected ? 'block' : 'none';
  elements.githubSave.style.display = connected ? 'none' : '';
  elements.githubDisconnect.style.display = connected ? '' : 'none';
  elements.githubRepoGroup.style.display = connected ? '' : 'none';
  elements.githubImport.style.display = connected ? '' : 'none';
  elements.githubPull.style.display = connected && link ? '' : 'none';
  elements.githubCommit.style.display = connected && link ? '' : 'none';

  if (link) {
    const folder = link.path ? `/${link.path}` : '';
    elements.githubLinkedSourcePath.textContent =
      `${link.repo}${folder} @ ${link.branch}`;
    elements.githubLinkedSourceSha.textContent = link.sha.slice(0, 7);
    elements.githubLinkedSource.style.display = 'flex';
  } else {
    elements.githubLinkedSource.style.display = 'none';
  }

  setGithubControlsDisabled(state.githubSyncInProgress);
}

function setGithubControlsDisabled(disabled) {
  [
    elements.githubSave,
    elements.githubDisconnect,
    elements.githubImport,
    elements.githubPull,
    elements.githubCommit,
    elements.githubRepo,
    elements.githubPath,
    elements.githubBranch,
    elements.closeGithubModal,
  ].forEach(control => {
    if (control) control.disabled = disabled;
  });
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
    const user = await githubApi('/user', {}, token);

    state.githubToken = token;
    state.githubLogin = user.login;
    sessionStorage.setItem('latexEditor_githubToken', token);
    sessionStorage.setItem('latexEditor_githubLogin', user.login);
    refreshGithubModal();
    showSuccessToast(`Connected to GitHub as ${user.login}`);
  } catch (err) {
    elements.githubStatus.className = 'github-status error';
    elements.githubStatus.textContent = `Authentication failed: ${err.message}`;
    elements.githubStatus.style.display = 'block';
  }
}

function disconnectGithub() {
  state.githubToken = null;
  state.githubLogin = null;
  sessionStorage.removeItem('latexEditor_githubToken');
  sessionStorage.removeItem('latexEditor_githubLogin');
  localStorage.removeItem('latexEditor_githubToken');
  elements.githubToken.value = '';
  refreshGithubModal();
  showSuccessToast('Disconnected from GitHub');
}

function normalizeGithubFolder(rawPath) {
  if (typeof rawPath !== 'string' || rawPath.includes('\\')) {
    throw new Error('Folder must use a repository-relative path');
  }

  const folder = rawPath.trim().replace(/^\/+|\/+$/g, '');
  if (!folder) return '';

  const safePath = sanitizePath(folder);
  if (!safePath || safePath !== folder) {
    throw new Error('Folder contains an unsafe path segment');
  }
  return folder;
}

function validateGithubBranch(branch, allowEmpty = false) {
  const normalized = branch.trim();
  if (!normalized && allowEmpty) return '';
  if (
    !normalized
    || normalized.length > 255
    || normalized.startsWith('/')
    || normalized.endsWith('/')
    || normalized.endsWith('.')
    || normalized.endsWith('.lock')
    || normalized.includes('..')
    || normalized.includes('//')
    || normalized.includes('@{')
    || GITHUB_BRANCH_FORBIDDEN.test(normalized)
  ) {
    throw new Error('Enter a valid Git branch name');
  }
  return normalized;
}

function getGithubImportConfig() {
  const repo = elements.githubRepo.value.trim();
  if (!GITHUB_REPO_PATTERN.test(repo)) {
    throw new Error('Repository must use the owner/repo format');
  }

  const path = normalizeGithubFolder(elements.githubPath.value);
  const branch = validateGithubBranch(elements.githubBranch.value, true);

  localStorage.setItem('latexEditor_githubRepo', repo);
  localStorage.setItem('latexEditor_githubPath', path);
  if (branch) {
    localStorage.setItem('latexEditor_githubBranch', branch);
  } else {
    localStorage.removeItem('latexEditor_githubBranch');
  }

  return { repo, path, branch };
}

function encodeGithubRepo(repo) {
  return repo.split('/').map(encodeURIComponent).join('/');
}

function encodeGithubRef(branch) {
  return ['heads', ...branch.split('/')].map(encodeURIComponent).join('/');
}

async function githubApi(path, options = {}, token = state.githubToken) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...options,
    cache: 'no-store',
    headers,
  });
  const data = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (!response.ok) {
    let message = data?.message || `GitHub request failed (HTTP ${response.status})`;
    if (
      response.status === 403
      && response.headers.get('X-RateLimit-Remaining') === '0'
    ) {
      const reset = Number(response.headers.get('X-RateLimit-Reset')) * 1000;
      const resetText = Number.isFinite(reset)
        ? new Date(reset).toLocaleTimeString()
        : 'later';
      message = `GitHub API rate limit reached. Try again after ${resetText}.`;
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function getGithubRepoInfo(repo) {
  return githubApi(`/repos/${encodeGithubRepo(repo)}`);
}

async function getGithubBranchSnapshot(repo, branch) {
  const encodedRepo = encodeGithubRepo(repo);
  const ref = await githubApi(
    `/repos/${encodedRepo}/git/ref/${encodeGithubRef(branch)}`
  );
  const commit = await githubApi(
    `/repos/${encodedRepo}/git/commits/${encodeURIComponent(ref.object.sha)}`
  );
  return {
    sha: ref.object.sha,
    rootTreeSha: commit.tree.sha,
  };
}

async function getGithubFolderTree(repo, rootTreeSha, folder) {
  const encodedRepo = encodeGithubRepo(repo);
  let treeSha = rootTreeSha;

  if (folder) {
    for (const segment of folder.split('/')) {
      const tree = await githubApi(
        `/repos/${encodedRepo}/git/trees/${encodeURIComponent(treeSha)}`
      );
      const next = tree.tree.find(
        entry => entry.path === segment && entry.type === 'tree'
      );
      if (!next) {
        throw new Error(`Folder "${folder}" was not found on the selected branch`);
      }
      treeSha = next.sha;
    }
  }

  const tree = await githubApi(
    `/repos/${encodedRepo}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`
  );
  if (tree.truncated) {
    throw new Error('The selected folder is too large to sync safely');
  }
  return {
    sha: treeSha,
    entries: tree.tree || [],
  };
}

function base64ToBytes(base64) {
  const normalized = base64.replace(/\s/g, '');
  let binary;
  try {
    binary = atob(normalized);
  } catch {
    throw new Error('GitHub returned malformed Base64 file content');
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return { bytes, normalized };
}

function decodeGithubBlob(path, base64) {
  const { bytes, normalized } = base64ToBytes(base64);
  if (!BINARY_EXTENSIONS.test(path)) {
    try {
      return {
        content: new TextDecoder(
          'utf-8',
          { fatal: true, ignoreBOM: true }
        ).decode(bytes),
        size: bytes.length,
      };
    } catch {
      // Unknown binary extensions remain byte-identical Base64 payloads.
    }
  }
  return {
    content: { isBinary: true, content: normalized },
    size: bytes.length,
  };
}

function findGithubMainFile(files, preferred = null) {
  if (
    preferred
    && typeof files[preferred] === 'string'
    && preferred.toLowerCase().endsWith('.tex')
  ) {
    return preferred;
  }

  const texFiles = Object.keys(files).filter(
    path => path.toLowerCase().endsWith('.tex') && typeof files[path] === 'string'
  );
  const preferredNames = [
    'resume.tex',
    'main.tex',
    'cv.tex',
    'document.tex',
    'curriculum.tex',
    'curriculum-vitae.tex',
  ];

  for (const name of preferredNames) {
    const rootMatch = texFiles.find(path => path.toLowerCase() === name);
    if (rootMatch) return rootMatch;
    const nestedMatch = texFiles.find(
      path => path.split('/').pop().toLowerCase() === name
    );
    if (nestedMatch) return nestedMatch;
  }
  return texFiles.find(path => !path.includes('/')) || texFiles[0] || null;
}

function validateGithubProjectPaths(files) {
  const paths = Object.keys(files);
  if (paths.length > MAX_GITHUB_IMPORT_FILES) {
    throw new Error(`GitHub sync supports up to ${MAX_GITHUB_IMPORT_FILES} files`);
  }

  const pathSet = new Set(paths);
  for (const path of paths) {
    const safePath = sanitizePath(path);
    if (!safePath || safePath !== path) {
      throw new Error(`Project contains an unsafe path: ${path}`);
    }
    const segments = path.split('/');
    for (let index = 1; index < segments.length; index++) {
      if (pathSet.has(segments.slice(0, index).join('/'))) {
        throw new Error(`File and folder paths collide at ${path}`);
      }
    }
  }
}

async function fetchGithubFolderSnapshot(config) {
  const repoInfo = await getGithubRepoInfo(config.repo);
  const repo = repoInfo.full_name;
  const branch = validateGithubBranch(
    config.branch || repoInfo.default_branch || 'main'
  );
  const branchSnapshot = await getGithubBranchSnapshot(repo, branch);
  const folderTree = await getGithubFolderTree(
    repo,
    branchSnapshot.rootTreeSha,
    config.path
  );
  const blobEntries = folderTree.entries.filter(
    entry => entry.type === 'blob' && !isMacOSJunk(entry.path)
  );

  if (blobEntries.length === 0) {
    throw new Error('No files were found in the selected GitHub folder');
  }
  if (blobEntries.length > MAX_GITHUB_IMPORT_FILES) {
    throw new Error(`GitHub sync supports up to ${MAX_GITHUB_IMPORT_FILES} files`);
  }

  const reportedBytes = blobEntries.reduce(
    (total, entry) => total + (entry.size || 0),
    0
  );
  if (reportedBytes > MAX_GITHUB_IMPORT_BYTES) {
    throw new Error('The selected folder is too large for this editor');
  }

  const files = {};
  const manifest = {};
  let decodedBytes = 0;

  for (const entry of blobEntries) {
    const path = sanitizePath(entry.path);
    if (!path || path !== entry.path) {
      throw new Error(`GitHub returned an unsafe file path: ${entry.path}`);
    }
    if (!GITHUB_FILE_MODES.has(entry.mode)) {
      throw new Error(`Unsupported Git file mode ${entry.mode} for ${path}`);
    }

    const blob = await githubApi(
      `/repos/${encodeGithubRepo(repo)}/git/blobs/${encodeURIComponent(entry.sha)}`
    );
    if (blob.encoding !== 'base64' || typeof blob.content !== 'string') {
      throw new Error(`GitHub returned unsupported content for ${path}`);
    }

    const decoded = decodeGithubBlob(path, blob.content);
    decodedBytes += decoded.size;
    if (decodedBytes > MAX_GITHUB_IMPORT_BYTES) {
      throw new Error('The selected folder is too large for this editor');
    }

    files[path] = decoded.content;
    manifest[path] = {
      sha: entry.sha,
      mode: entry.mode,
    };
  }

  validateGithubProjectPaths(files);
  const mainFile = findGithubMainFile(files);
  if (!mainFile) {
    throw new Error('No editable .tex file was found in the selected folder');
  }

  return {
    repo,
    path: config.path,
    branch,
    sha: branchSnapshot.sha,
    manifest,
    files,
    mainFile,
    rootTreeSha: branchSnapshot.rootTreeSha,
    folderEntries: folderTree.entries,
  };
}

function githubLinkFromSnapshot(snapshot) {
  return {
    repo: snapshot.repo,
    path: snapshot.path,
    branch: snapshot.branch,
    sha: snapshot.sha,
    manifest: snapshot.manifest,
  };
}

async function backendProjectRequest(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

function assertActiveProject(projectId) {
  if (state.currentProjectId !== projectId) {
    throw new Error('The active project changed during GitHub synchronization');
  }
}

async function persistProjectGithubLink(github, projectId) {
  if (!projectId) {
    throw new Error('The current project has not been saved locally');
  }
  return backendProjectRequest(`${API_BASE}/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ github }),
  });
}

async function runGithubOperation(label, operation) {
  if (state.githubSyncInProgress) {
    showErrorToast('Another GitHub sync operation is already running');
    return;
  }

  state.githubSyncInProgress = true;
  clearTimeout(_backendSaveTimer);
  refreshGithubModal();

  try {
    if (_backendSaveInFlight) {
      await _backendSaveInFlight.catch(() => {});
    }
    await operation();
  } catch (err) {
    console.error(`${label} failed:`, err);
    showErrorToast(`${label} failed: ${err.message}`);
    showStatus(`${label} failed`, 'error');
  } finally {
    state.githubSyncInProgress = false;
    refreshGithubModal();
  }
}

async function importFromGithub() {
  if (!state.githubToken) {
    showErrorToast('Connect to GitHub first');
    return;
  }

  let config;
  try {
    config = getGithubImportConfig();
  } catch (error) {
    showErrorToast(error.message);
    return;
  }

  await runGithubOperation('Import', async () => {
    showStatus('Reading GitHub folder...', 'info');
    if (state.projectMode) {
      if (state.projectFilesIncomplete) {
        throw new Error(
          'The current recovery copy is missing binary files. Pull, reopen, or export it before importing another project.'
        );
      }
      await saveProjectToBackend({
        throwOnError: true,
        allowDuringGithubSync: true,
      });
    }

    const snapshot = await fetchGithubFolderSnapshot(config);
    const defaultName = snapshot.path
      ? snapshot.path.split('/').pop()
      : snapshot.repo.split('/').pop();
    const projectName = await showPromptModal(
      'Import GitHub Folder',
      'Local project name:',
      defaultName
    );
    if (!projectName?.trim()) {
      showStatus('Ready', 'success');
      return;
    }

    const project = await backendProjectRequest(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectName.trim(),
        files: serializeProjectFiles(snapshot.files),
        main_file: snapshot.mainFile,
        engine: DEFAULT_LATEX_ENGINE,
        github: githubLinkFromSnapshot(snapshot),
      }),
    });

    restoreProject(project, { showToast: false });
    saveProjectToLocalStorage();
    closeGithubModal(true);
    closeProjectsDrawer();
    compile();
    showSuccessToast(`Imported ${snapshot.repo}/${snapshot.path || ''}`);
    showStatus('GitHub folder imported', 'success');
  });
}

async function pullFromGithub() {
  const link = getCurrentGithubLink();
  if (!link || !state.currentProjectId) {
    showErrorToast('Open a project linked to GitHub first');
    return;
  }
  const projectId = state.currentProjectId;

  const confirmed = await showConfirmModal(
    'Pull Latest',
    'Replace this local project with the latest files from its linked GitHub folder?',
    { okLabel: 'Pull latest' }
  );
  if (!confirmed) return;

  await runGithubOperation('Pull', async () => {
    showStatus('Pulling linked GitHub folder...', 'info');
    const snapshot = await fetchGithubFolderSnapshot({
      repo: link.repo,
      path: link.path,
      branch: link.branch,
    });
    assertActiveProject(projectId);
    const mainFile = findGithubMainFile(snapshot.files, state.mainFile)
      || snapshot.mainFile;
    const project = await backendProjectRequest(
      `${API_BASE}/projects/${projectId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: serializeProjectFiles(snapshot.files),
          main_file: mainFile,
          github: githubLinkFromSnapshot(snapshot),
        }),
      }
    );

    assertActiveProject(projectId);
    restoreProject(project, { showToast: false });
    saveProjectToLocalStorage();
    closeGithubModal(true);
    compile();
    showSuccessToast(`Pulled ${snapshot.sha.slice(0, 7)} from GitHub`);
    showStatus('GitHub folder is up to date', 'success');
  });
}

function joinGithubPath(folder, path) {
  return folder ? `${folder}/${path}` : path;
}

async function commitToGithub() {
  const link = getCurrentGithubLink();
  if (!link || !state.currentProjectId) {
    showErrorToast('Open a project linked to GitHub first');
    return;
  }
  if (state.projectFilesIncomplete) {
    showErrorToast('Pull latest before committing this incomplete recovery copy');
    return;
  }
  const projectId = state.currentProjectId;

  const commitMessage = await showPromptModal(
    'Commit Changes',
    'Commit message:',
    `Update ${state.currentProjectName || 'resume'} from LaTeX Editor`
  );
  if (!commitMessage?.trim()) return;

  await runGithubOperation('Commit', async () => {
    showStatus('Preparing GitHub commit...', 'info');
    if (
      state.currentFile
      && !isBinaryContent(state.projectFiles[state.currentFile])
    ) {
      state.projectFiles[state.currentFile] = state.currentLatex;
    }
    await saveProjectToBackend({
      throwOnError: true,
      allowDuringGithubSync: true,
    });
    assertActiveProject(projectId);

    const files = cloneProjectFiles();
    validateGithubProjectPaths(files);
    const branchSnapshot = await getGithubBranchSnapshot(
      link.repo,
      link.branch
    );
    if (branchSnapshot.sha !== link.sha) {
      throw new Error(
        `The remote branch changed at ${branchSnapshot.sha.slice(0, 7)}. `
        + 'Pull latest before committing.'
      );
    }

    const folderTree = await getGithubFolderTree(
      link.repo,
      branchSnapshot.rootTreeSha,
      link.path
    );
    const remoteBlobs = new Map(
      folderTree.entries
        .filter(entry => entry.type === 'blob')
        .map(entry => [entry.path, entry])
    );

    for (const [path, entry] of Object.entries(link.manifest)) {
      const remote = remoteBlobs.get(path);
      if (
        !remote
        || remote.sha !== entry.sha
        || remote.mode !== entry.mode
      ) {
        throw new Error(
          `Remote file ${path} no longer matches the imported snapshot. Pull latest first.`
        );
      }
    }

    const treeChanges = [];
    const newManifest = {};
    const encodedRepo = encodeGithubRepo(link.repo);

    for (const [path, content] of Object.entries(files)) {
      let blobRequest;
      if (isBinaryContent(content)) {
        base64ToBytes(content.content || '');
        blobRequest = {
          content: content.content || '',
          encoding: 'base64',
        };
      } else if (typeof content === 'string') {
        blobRequest = {
          content,
          encoding: 'utf-8',
        };
      } else {
        throw new Error(`Unsupported project file content for ${path}`);
      }

      const blob = await githubApi(`/repos/${encodedRepo}/git/blobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blobRequest),
      });
      const remote = remoteBlobs.get(path);
      const mode = remote?.mode || link.manifest[path]?.mode || '100644';
      if (!GITHUB_FILE_MODES.has(mode)) {
        throw new Error(`Unsupported Git file mode ${mode} for ${path}`);
      }

      newManifest[path] = { sha: blob.sha, mode };
      if (!remote || remote.sha !== blob.sha || remote.mode !== mode) {
        treeChanges.push({
          path: joinGithubPath(link.path, path),
          mode,
          type: 'blob',
          sha: blob.sha,
        });
      }
    }

    for (const [path, entry] of Object.entries(link.manifest)) {
      if (Object.prototype.hasOwnProperty.call(files, path)) continue;
      treeChanges.push({
        path: joinGithubPath(link.path, path),
        mode: entry.mode,
        type: 'blob',
        sha: null,
      });
    }

    if (treeChanges.length === 0) {
      showSuccessToast('Project is already synced with GitHub');
      showStatus('No GitHub changes to commit', 'success');
      return;
    }

    const tree = await githubApi(`/repos/${encodedRepo}/git/trees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_tree: branchSnapshot.rootTreeSha,
        tree: treeChanges,
      }),
    });
    const commit = await githubApi(`/repos/${encodedRepo}/git/commits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMessage.trim(),
        tree: tree.sha,
        parents: [branchSnapshot.sha],
      }),
    });

    try {
      await githubApi(
        `/repos/${encodedRepo}/git/refs/${encodeGithubRef(link.branch)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sha: commit.sha, force: false }),
        }
      );
    } catch (error) {
      if (error.status === 409 || error.status === 422) {
        throw new Error(
          'The branch moved or is protected. Pull latest or choose a writable branch.'
        );
      }
      throw error;
    }

    const updatedLink = {
      ...link,
      sha: commit.sha,
      manifest: newManifest,
    };
    setProjectGithubLink(updatedLink);
    saveProjectToLocalStorage();

    try {
      await persistProjectGithubLink(updatedLink, projectId);
    } catch (error) {
      console.error('GitHub commit metadata persistence failed:', error);
      showErrorToast(
        `Commit ${commit.sha.slice(0, 7)} succeeded, but the local sync marker `
        + `could not be saved: ${error.message}`
      );
      showStatus('Committed; local sync marker not saved', 'error');
      return;
    }

    closeGithubModal(true);
    showSuccessToast(`Committed ${commit.sha.slice(0, 7)} to ${link.branch}`);
    showStatus('GitHub commit complete', 'success');
  });
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
