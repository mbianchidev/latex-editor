/**
 * LaTeX Editor - Main Application
 * A sophisticated LaTeX editor with live PDF preview
 */

// ============================================
// CONFIGURATION & STATE
// ============================================

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
  engine: null,
  lastCompileTime: 0,
  compileTimeout: null,
  // Multi-file project support
  projectFiles: {},  // { 'path/to/file.tex': 'content' }
  currentFile: null, // Currently open file path
  mainFile: null,    // Main .tex file for compilation
  projectMode: false // Whether we're in multi-file project mode
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
  uploadZipBtn: document.getElementById('uploadZip'),
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
  currentFileName: document.getElementById('currentFileName')
};

// ============================================
// INITIALIZATION
// ============================================

async function init() {
  showStatus('Initializing...', 'info');
  
  // Initialize editor
  initializeEditor();
  
  // Set default template
  state.currentLatex = DEFAULT_TEMPLATE;
  elements.editor.value = DEFAULT_TEMPLATE;
  
  // Initialize event listeners
  initializeEventListeners();
  
  // Initialize resizable divider
  initializeResizer();
  
  // Load from localStorage if available
  loadFromLocalStorage();
  
  showStatus('Ready', 'success');
  
  // Initial compile after a short delay
  setTimeout(() => compile(), 500);
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
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
  // Compile button
  elements.compileBtn.addEventListener('click', compile);
  
  // New document
  elements.newDocBtn.addEventListener('click', newDocument);
  
  // ZIP upload
  elements.uploadZipBtn.addEventListener('click', () => elements.zipFileInput.click());
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
  
  // Toast close buttons
  elements.closeError.addEventListener('click', () => hideToast('error'));
  elements.closeSuccess.addEventListener('click', () => hideToast('success'));
  
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
  
  // Auto-compile after 1 second of inactivity
  clearTimeout(state.compileTimeout);
  state.compileTimeout = setTimeout(() => {
    compile();
  }, 1000);
  
  saveToLocalStorage();
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

async function compile() {
  if (state.isCompiling) {
    showStatus('Compilation in progress...', 'info');
    return;
  }
  
  state.isCompiling = true;
  showLoading('Compiling LaTeX...');
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
    
    // Use a simple LaTeX to HTML converter for demo purposes
    // In production, you would use SwiftLaTeX or similar
    const pdfBlob = await compileLatexToBlob(latexContent);
    
    state.pdfData = pdfBlob;
    state.lastCompileTime = Date.now() - startTime;
    
    await renderPDF(pdfBlob);
    
    showStatus(`Compiled successfully (${state.lastCompileTime}ms)`, 'success');
    showSuccessToast(`Document compiled in ${state.lastCompileTime}ms`);
    
  } catch (error) {
    console.error('Compilation error:', error);
    showStatus('Compilation failed', 'error');
    showErrorToast(error.message || 'Failed to compile LaTeX document');
  } finally {
    state.isCompiling = false;
    hideLoading();
  }
}

/**
 * Compile LaTeX to PDF blob
 * This is a simplified version - in production, use SwiftLaTeX or similar
 */
async function compileLatexToBlob(latex) {
  // For this demo, we'll create a simple PDF using a library
  // In production, you would use SwiftLaTeX WebAssembly engine
  
  try {
    // Create a simple HTML representation
    const htmlContent = convertLatexToHTML(latex);
    
    // Create PDF using browser's print functionality
    const blob = await createPDFFromHTML(htmlContent);
    
    return blob;
  } catch (error) {
    throw new Error('Failed to compile LaTeX: ' + error.message);
  }
}

/**
 * Simple LaTeX to HTML converter (simplified)
 * In production, use a proper LaTeX parser
 */
function convertLatexToHTML(latex) {
  // Extract content between \begin{document} and \end{document}
  const docMatch = latex.match(/\\begin{document}([\s\S]*?)\\end{document}/);
  let content = docMatch ? docMatch[1] : latex;
  
  // Extract title, author, date
  const titleMatch = latex.match(/\\title{([^}]*)}/);
  const authorMatch = latex.match(/\\author{([^}]*)}/);
  const dateMatch = latex.match(/\\date{([^}]*)}/);
  
  const title = titleMatch ? titleMatch[1] : '';
  const author = authorMatch ? authorMatch[1] : '';
  const date = dateMatch ? dateMatch[1].replace('\\today', new Date().toLocaleDateString()) : '';
  
  // Basic conversions
  content = content
    // Sections
    .replace(/\\section\*?{([^}]*)}/g, '<h2>$1</h2>')
    .replace(/\\subsection\*?{([^}]*)}/g, '<h3>$1</h3>')
    .replace(/\\subsubsection\*?{([^}]*)}/g, '<h4>$1</h4>')
    // Text formatting
    .replace(/\\textbf{([^}]*)}/g, '<strong>$1</strong>')
    .replace(/\\textit{([^}]*)}/g, '<em>$1</em>')
    .replace(/\\texttt{([^}]*)}/g, '<code>$1</code>')
    .replace(/\\emph{([^}]*)}/g, '<em>$1</em>')
    // Lists
    .replace(/\\begin{itemize}/g, '<ul>')
    .replace(/\\end{itemize}/g, '</ul>')
    .replace(/\\begin{enumerate}/g, '<ol>')
    .replace(/\\end{enumerate}/g, '</ol>')
    .replace(/\\item\s+/g, '<li>')
    // Math equations - preserve for MathJax
    .replace(/\\begin{equation}/g, '\\[')
    .replace(/\\end{equation}/g, '\\]')
    .replace(/\\begin{align\*?}/g, '\\[\\begin{aligned}')
    .replace(/\\end{align\*?}/g, '\\end{aligned}\\]')
    // Verbatim
    .replace(/\\begin{verbatim}([\s\S]*?)\\end{verbatim}/g, '<pre>$1</pre>')
    // Maketitle
    .replace(/\\maketitle/, '');
  
  // Clean up remaining simple LaTeX commands (but preserve math)
  content = content.replace(/\\([a-zA-Z]+)(\{([^}]*)\})?/g, (match, cmd, full, arg) => {
    // Preserve math-related commands using the whitelist
    if (LATEX_MATH_COMMANDS.includes(cmd)) {
      return match;
    }
    return arg || '';
  });
  
  // Add line breaks
  content = content.replace(/\n\n+/g, '<br><br>');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Source+Serif+4:wght@300;400;600&display=swap');
        
        body {
          font-family: 'Source Serif 4', Georgia, serif;
          font-size: 12pt;
          line-height: 1.6;
          max-width: 8.5in;
          margin: 1in auto;
          padding: 0 0.5in;
          color: #2A2724;
          background: white;
        }
        
        h1, h2, h3, h4 {
          font-family: 'Merriweather', Georgia, serif;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          line-height: 1.3;
        }
        
        h1 { font-size: 24pt; text-align: center; margin-bottom: 0.25em; }
        h2 { font-size: 18pt; border-bottom: 1px solid #D4CEC0; padding-bottom: 0.25em; }
        h3 { font-size: 14pt; }
        h4 { font-size: 12pt; }
        
        .author, .date {
          text-align: center;
          font-size: 11pt;
          margin-bottom: 0.25em;
          color: #3A3632;
        }
        
        ul, ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        
        li {
          margin: 0.5em 0;
        }
        
        .equation {
          text-align: center;
          margin: 1.5em 0;
          padding: 1em;
          overflow-x: auto;
        }
        
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
        
        strong {
          font-weight: 600;
        }
        
        em {
          font-style: italic;
        }
        
        /* MathJax styling */
        mjx-container {
          margin: 1em 0;
        }
      </style>
      
      <!-- MathJax for math rendering -->
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
      ${title ? `<h1>${title}</h1>` : ''}
      ${author ? `<div class="author">${author}</div>` : ''}
      ${date ? `<div class="date">${date}</div>` : ''}
      ${content}
    </body>
    </html>
  `;
}

/**
 * Create PDF from HTML content
 */
async function createPDFFromHTML(htmlContent) {
  return new Promise((resolve, reject) => {
    // Create an iframe to render the HTML
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '8.5in';
    iframe.style.height = '11in';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    // Wait for content to load
    iframe.onload = () => {
      setTimeout(() => {
        try {
          // For now, we'll just display the HTML in the preview
          // In a real implementation, you'd use a library like jsPDF with html2canvas
          // or better yet, SwiftLaTeX for true LaTeX compilation
          
          // Create a blob with the HTML for preview
          const blob = new Blob([htmlContent], { type: 'text/html' });
          document.body.removeChild(iframe);
          resolve(blob);
        } catch (error) {
          document.body.removeChild(iframe);
          reject(error);
        }
      }, 500);
    };
    
    iframe.onerror = () => {
      document.body.removeChild(iframe);
      reject(new Error('Failed to render HTML'));
    };
  });
}

// ============================================
// PDF RENDERING
// ============================================

async function renderPDF(blob) {
  // Clear previous content
  elements.previewContent.innerHTML = '';
  
  // Create an iframe to display the HTML
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.minHeight = '11in';
  iframe.style.border = 'none';
  iframe.style.background = 'white';
  iframe.style.boxShadow = '0 20px 25px rgba(42, 39, 36, 0.1), 0 10px 10px rgba(42, 39, 36, 0.04)';
  iframe.style.borderRadius = '2px';
  
  // Convert blob to URL
  const url = URL.createObjectURL(blob);
  iframe.src = url;
  
  elements.previewContent.appendChild(iframe);
  
  // Apply zoom
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
    // Adjust spacing: 11 inches (A4 page height) * 96 DPI = pixels
    const pageHeightPixels = 11 * 96;
    iframe.style.marginBottom = `${(state.zoom - 1) * pageHeightPixels}px`;
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
    
    // Get the iframe content
    const iframe = elements.previewContent.querySelector('iframe');
    if (!iframe) {
      throw new Error('No preview available');
    }
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const iframeBody = iframeDoc.body;
    
    // Use html2canvas and jsPDF to generate PDF
    html2canvas(iframeBody, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Create PDF
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Download PDF
      pdf.save('document.pdf');
      
      hideLoading();
      showSuccessToast('PDF downloaded successfully');
    }).catch(error => {
      hideLoading();
      console.error('PDF generation error:', error);
      
      // Fallback to print
      iframe.contentWindow.print();
      showSuccessToast('Print dialog opened. Save as PDF from print options.');
    });
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
// NEW DOCUMENT
// ============================================

function newDocument() {
  if (state.currentLatex !== DEFAULT_TEMPLATE && 
      !confirm('Create new document? Current changes will be lost.')) {
    return;
  }
  
  state.currentLatex = DEFAULT_TEMPLATE;
  elements.editor.value = DEFAULT_TEMPLATE;
  elements.previewContent.innerHTML = `
    <div class="welcome-message">
      <svg class="welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <h3>New Document Created</h3>
      <p>Start editing or press <kbd>Ctrl+Enter</kbd> to compile.</p>
    </div>
  `;
  
  saveToLocalStorage();
  showSuccessToast('New document created');
  
  // Compile after a short delay
  setTimeout(() => compile(), 500);
}

// ============================================
// LOCAL STORAGE
// ============================================

function saveToLocalStorage() {
  try {
    localStorage.setItem('latexEditor_content', state.currentLatex);
    localStorage.setItem('latexEditor_zoom', state.zoom.toString());
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

function loadFromLocalStorage() {
  try {
    const savedContent = localStorage.getItem('latexEditor_content');
    const savedZoom = localStorage.getItem('latexEditor_zoom');
    
    if (savedContent && savedContent !== DEFAULT_TEMPLATE) {
      state.currentLatex = savedContent;
      elements.editor.value = savedContent;
    }
    
    if (savedZoom) {
      setZoom(parseFloat(savedZoom));
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
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

/**
 * Handle ZIP file upload
 */
async function handleZipUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.name.endsWith('.zip')) {
    showErrorToast('Please upload a ZIP file');
    return;
  }
  
  try {
    showLoading('Extracting ZIP file...');
    showStatus('Loading project...', 'info');
    
    const zip = await JSZip.loadAsync(file);
    const files = {};
    let mainTexFile = null;
    
    // Extract all files
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      
      // Read file content
      const content = await zipEntry.async('string');
      files[path] = content;
      
      // Try to find main .tex file
      if (path.endsWith('.tex')) {
        const filename = path.split('/').pop();
        // Prioritize files with common main document names
        if (!mainTexFile || 
            filename.match(/^(main|document|thesis|paper|article)\.tex$/i) ||
            path === filename) { // Root level .tex file
          mainTexFile = path;
        }
      }
    }
    
    if (Object.keys(files).length === 0) {
      showErrorToast('ZIP file is empty');
      return;
    }
    
    // If no .tex file found, check if there's at least one
    if (!mainTexFile) {
      const texFiles = Object.keys(files).filter(f => f.endsWith('.tex'));
      if (texFiles.length > 0) {
        mainTexFile = texFiles[0];
      } else {
        showErrorToast('No .tex files found in ZIP');
        return;
      }
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
    
    showSuccessToast(`Loaded ${Object.keys(files).length} files from project`);
    showStatus('Project loaded', 'success');
    
    // Compile the project
    setTimeout(() => compile(), 500);
    
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
    
    const item = document.createElement('div');
    item.className = 'file-tree-item' + 
                     (isFile ? '' : ' folder expanded') +
                     (isFile && name.endsWith('.tex') ? ' tex' : '') +
                     (isFile && name.match(/\.(png|jpg|jpeg|gif|svg)$/i) ? ' image' : '') +
                     (isFile && name.endsWith('.pdf') ? ' pdf' : '') +
                     (isFile && name.match(/\.(ttf|otf|woff|woff2)$/i) ? ' font' : '');
    
    if (isFile && fullPath === state.currentFile) {
      item.classList.add('active');
    }
    
    const icon = document.createElement('span');
    icon.className = 'file-tree-icon';
    item.appendChild(icon);
    
    const label = document.createElement('span');
    label.textContent = name;
    item.appendChild(label);
    
    container.appendChild(item);
    
    if (isFile) {
      // Click handler for files
      item.addEventListener('click', () => openFile(fullPath, item));
    } else {
      // Folder - create children container
      const children = document.createElement('div');
      children.className = 'file-tree-children';
      container.appendChild(children);
      
      // Click handler for folders
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        item.classList.toggle('expanded');
        item.classList.toggle('collapsed');
        children.classList.toggle('collapsed');
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
  if (!state.projectFiles[path]) return;
  
  // Save current file content
  if (state.currentFile && state.projectFiles[state.currentFile] !== undefined) {
    state.projectFiles[state.currentFile] = state.currentLatex;
  }
  
  // Load new file
  state.currentFile = path;
  state.currentLatex = state.projectFiles[path];
  elements.editor.value = state.currentLatex;
  elements.currentFileName.textContent = path.split('/').pop();
  
  // Update file tree selection
  document.querySelectorAll('.file-tree-item').forEach(item => {
    item.classList.remove('active');
  });
  if (itemElement) {
    itemElement.classList.add('active');
  }
  
  // Compile if this is the main file
  if (path === state.mainFile) {
    setTimeout(() => compile(), 500);
  }
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
    
    // Add all files to ZIP
    for (const [path, content] of Object.entries(state.projectFiles)) {
      zip.file(path, content);
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
  
  // Get directory of current file
  const dir = currentPath.split('/').slice(0, -1).join('/');
  
  // Match \input{file}, \include{file}, \includegraphics{file}
  const includeRegex = /\\(input|include|includegraphics)(?:\[[^\]]*\])?\{([^}]+)\}/g;
  
  let resolved = content;
  const replacements = new Map(); // Map from original pattern to resolved content
  let match;
  
  // Collect all unique matches and their replacements
  while ((match = includeRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const command = match[1];
    const filename = match[2];
    
    // Skip if we've already processed this exact include pattern
    if (replacements.has(fullMatch)) continue;
    
    let resolvedPath = filename;
    
    // Add .tex extension if missing for input/include
    if ((command === 'input' || command === 'include') && !filename.endsWith('.tex')) {
      resolvedPath = filename + '.tex';
    }
    
    // Resolve relative path
    if (!resolvedPath.startsWith('/')) {
      resolvedPath = dir ? `${dir}/${resolvedPath}` : resolvedPath;
    } else {
      resolvedPath = resolvedPath.substring(1); // Remove leading /
    }
    
    // If file exists in project, include its content for input/include
    if (state.projectFiles[resolvedPath]) {
      if (command === 'input' || command === 'include') {
        const includedContent = resolveIncludes(state.projectFiles[resolvedPath], resolvedPath, new Set(visitedFiles));
        replacements.set(fullMatch, includedContent);
      }
    }
  }
  
  // Apply all replacements
  for (const [pattern, replacement] of replacements) {
    resolved = resolved.replaceAll(pattern, replacement);
  }
  
  return resolved;
}

function hideToast(type) {
  if (type === 'error') {
    elements.errorToast.classList.remove('active');
  } else {
    elements.successToast.classList.remove('active');
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
