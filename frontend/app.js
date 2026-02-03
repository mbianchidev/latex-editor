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
  newDropdown: document.getElementById('newDropdown'),
  newDropdownMenu: document.getElementById('newDropdownMenu'),
  newDocItem: document.getElementById('newDocItem'),
  newProjectItem: document.getElementById('newProjectItem'),
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
  cleanProjectBtn: document.getElementById('cleanProjectBtn'),
  currentFileName: document.getElementById('currentFileName'),
  newFileBtn: document.getElementById('newFileBtn'),
  newFolderBtn: document.getElementById('newFolderBtn')
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
  
  showStatus('Compiling...', 'info');
  
  // Compile on first load
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
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
  // Compile button
  elements.compileBtn.addEventListener('click', compile);
  
  // New document/project dropdown
  if (elements.newDocBtn && elements.newDropdown) {
    elements.newDocBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.newDropdown.classList.toggle('open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (elements.newDropdown && !elements.newDropdown.contains(e.target)) {
        elements.newDropdown.classList.remove('open');
      }
    });
    
    // New document item
    if (elements.newDocItem) {
      elements.newDocItem.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.newDropdown.classList.remove('open');
        newDocument();
      });
    }
    
    // New project item
    if (elements.newProjectItem) {
      elements.newProjectItem.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.newDropdown.classList.remove('open');
        newProject();
      });
    }
  }
  
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
  elements.cleanProjectBtn.addEventListener('click', cleanCurrentProject);
  
  // New file/folder buttons in file tree header
  if (elements.newFileBtn) {
    elements.newFileBtn.addEventListener('click', () => {
      // If not in project mode, create a new project first
      if (!state.projectMode) {
        if (confirm('Create a new project to add files? This will replace the current document.')) {
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
        if (confirm('Create a new project to add folders? This will replace the current document.')) {
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
  
  // Handle includegraphics - convert to embedded images with base64 data
  content = content.replace(/\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g, (match, filename) => {
    // Try to find the image in project files
    if (state.projectMode && state.projectFiles) {
      // Try exact path first, then with common extensions
      const extensions = ['', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf'];
      for (const ext of extensions) {
        const imgPath = filename + ext;
        const imgData = state.projectFiles[imgPath];
        if (imgData && typeof imgData === 'object' && imgData.isBinary) {
          // Determine mime type
          const actualExt = imgPath.split('.').pop().toLowerCase();
          const mimeTypes = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml'
          };
          const mimeType = mimeTypes[actualExt] || 'application/octet-stream';
          return `<img src="data:${mimeType};base64,${imgData.content}" alt="${filename}" style="max-width: 100%; height: auto;">`;
        }
      }
    }
    // Return placeholder if image not found
    return `<div style="padding: 1em; background: #f0f0f0; border: 1px dashed #ccc; text-align: center; color: #666;">[Image: ${filename}]</div>`;
  });
  
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
  // Revoke previous blob URL to prevent memory leaks
  const existingIframe = elements.previewContent.querySelector('iframe');
  if (existingIframe && existingIframe.dataset.blobUrl) {
    URL.revokeObjectURL(existingIframe.dataset.blobUrl);
  }
  
  // Convert blob to URL
  const url = URL.createObjectURL(blob);
  
  // Reuse existing iframe if available (only reload src, don't recreate)
  if (existingIframe) {
    existingIframe.dataset.blobUrl = url;
    existingIframe.src = url;
  } else {
    // Create an iframe to display the HTML
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.minHeight = '11in';
    iframe.style.border = 'none';
    iframe.style.background = 'white';
    iframe.style.boxShadow = '0 20px 25px rgba(42, 39, 36, 0.1), 0 10px 10px rgba(42, 39, 36, 0.04)';
    iframe.style.borderRadius = '2px';
    iframe.dataset.blobUrl = url;
    iframe.src = url;
    
    elements.previewContent.innerHTML = '';
    elements.previewContent.appendChild(iframe);
  }
  
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
  
  // Reset project state
  state.projectMode = false;
  state.projectFiles = {};
  state.currentFile = null;
  state.mainFile = null;
  
  state.currentLatex = DEFAULT_TEMPLATE;
  elements.editor.value = DEFAULT_TEMPLATE;
  elements.editor.readOnly = false;
  elements.currentFileName.textContent = 'LaTeX Source';
  
  // Hide file tree and download ZIP button
  elements.fileTree.classList.remove('visible');
  elements.toggleFileTreeBtn.style.display = 'none';
  elements.downloadZipBtn.style.display = 'none';
  
  // Clear project from localStorage
  try {
    localStorage.removeItem('latexEditor_project');
    localStorage.removeItem('latexEditor_projectMode');
  } catch (error) {
    console.error('Failed to clear project from localStorage:', error);
  }
  
  saveToLocalStorage();
  
  // Compile the new document
  compile(true);
}

/**
 * Create a new multi-file project from scratch
 */
function newProject() {
  const projectName = prompt('Enter project name:', 'my-project');
  if (!projectName) return;
  
  if (state.projectMode && Object.keys(state.projectFiles).length > 0 &&
      !confirm('Create new project? Current project will be lost.')) {
    return;
  }
  
  // Create basic project structure
  const mainContent = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{graphicx}

\\title{${projectName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}}
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

  // Initialize project files
  state.projectFiles = {
    'main.tex': mainContent,
    'sections/introduction.tex': introContent
  };
  
  state.mainFile = 'main.tex';
  state.currentFile = 'main.tex';
  state.projectMode = true;
  state.currentLatex = mainContent;
  
  // Update UI
  elements.editor.value = mainContent;
  elements.editor.readOnly = false;
  elements.currentFileName.textContent = 'main.tex';
  
  // Build and show file tree
  buildFileTree(state.projectFiles);
  elements.fileTree.classList.add('visible');
  elements.toggleFileTreeBtn.style.display = 'inline-block';
  elements.downloadZipBtn.style.display = 'inline-block';
  
  // Save project to localStorage
  saveProjectToLocalStorage();
  
  showSuccessToast(`Created project: ${projectName}`);
  
  // Compile the new project
  compile(true);
}

// ============================================
// LOCAL STORAGE
// ============================================

/**
 * Compress string using LZW algorithm (simple implementation)
 */
function compressString(str) {
  if (!str) return '';
  
  try {
    // Use base64 encoding with a simple compression approach
    // For larger projects, we could use a more sophisticated algorithm
    return btoa(encodeURIComponent(str));
  } catch (error) {
    console.error('Compression failed:', error);
    return str;
  }
}

/**
 * Decompress string
 */
function decompressString(str) {
  if (!str) return '';
  
  try {
    return decodeURIComponent(atob(str));
  } catch (error) {
    console.error('Decompression failed:', error);
    return str;
  }
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
 * Save project to localStorage with compression
 */
function saveProjectToLocalStorage() {
  if (!state.projectMode) return;
  
  try {
    // Save current file content first
    if (state.currentFile && state.projectFiles[state.currentFile] !== undefined) {
      const currentContent = state.projectFiles[state.currentFile];
      // Only update if it's a text file (not binary)
      if (!(currentContent && typeof currentContent === 'object' && currentContent.isBinary)) {
        state.projectFiles[state.currentFile] = state.currentLatex;
      }
    }
    
    const projectData = {
      files: state.projectFiles,
      mainFile: state.mainFile,
      currentFile: state.currentFile,
      savedAt: new Date().toISOString()
    };
    
    // Compress and save
    const compressed = compressString(JSON.stringify(projectData));
    localStorage.setItem('latexEditor_project', compressed);
    localStorage.setItem('latexEditor_projectMode', 'true');
    
    console.log('Project saved to localStorage');
  } catch (error) {
    console.error('Failed to save project to localStorage:', error);
    // If storage quota exceeded, show a warning
    if (error.name === 'QuotaExceededError') {
      showErrorToast('Storage quota exceeded. Consider downloading your project as ZIP.');
    }
  }
}

/**
 * Load from localStorage
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
      if (success) return;
    }
    
    // Fall back to simple document
    const savedContent = localStorage.getItem('latexEditor_content');
    if (savedContent && savedContent !== DEFAULT_TEMPLATE) {
      state.currentLatex = savedContent;
      elements.editor.value = savedContent;
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
}

/**
 * Load project from localStorage
 */
function loadProjectFromLocalStorage() {
  try {
    const compressed = localStorage.getItem('latexEditor_project');
    if (!compressed) return false;
    
    const projectDataStr = decompressString(compressed);
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
    if (fileContent && typeof fileContent === 'object' && fileContent.isBinary) {
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
    
    console.log('Project loaded from localStorage');
    showSuccessToast('Project restored from last session');
    
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
    console.log('[FILTER] Blocked __MACOSX path:', filePath);
    return true;
  }
  
  // Split into path segments
  const segments = normalizedPath.split('/').filter(s => s.length > 0);
  
  for (const segment of segments) {
    // Check for known junk patterns (case-insensitive)
    const lowerSegment = segment.toLowerCase();
    for (const pattern of MACOS_JUNK_PATTERNS) {
      if (lowerSegment === pattern.toLowerCase()) {
        console.log('[FILTER] Blocked junk pattern:', filePath, '(matched:', pattern, ')');
        return true;
      }
    }
    
    // Check for resource forks (files starting with ._)
    if (segment.startsWith('._')) {
      console.log('[FILTER] Blocked resource fork:', filePath);
      return true;
    }
    
    // Check for hidden files (except allowed ones)
    if (segment.startsWith('.') && segment !== '.gitignore' && segment !== '.github') {
      console.log('[FILTER] Blocked hidden file:', filePath);
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
      console.log('[CLEAN] Removing junk file:', path);
      removedCount++;
      continue;
    }
    cleanedFiles[path] = content;
  }
  
  if (removedCount > 0) {
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
  if (!file) return;
  
  if (!file.name.endsWith('.zip')) {
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
    
    console.log('[ZIP] Starting extraction...');
    console.log('[ZIP] Total entries in ZIP:', Object.keys(zip.files).length);
    
    // Extract all files
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      // Skip directories
      if (zipEntry.dir) {
        console.log('[ZIP] Skipping directory entry:', path);
        continue;
      }
      
      // Filter out macOS junk files BEFORE loading content
      if (isMacOSJunk(path)) {
        skippedCount++;
        continue;
      }
      
      // Determine if file is binary based on extension
      const isBinary = BINARY_EXTENSIONS.test(path);
      
      if (isBinary) {
        // Read binary files as base64 to preserve their content
        const base64Content = await zipEntry.async('base64');
        rawFiles[path] = { isBinary: true, content: base64Content };
      } else {
        // Read text files as string
        const content = await zipEntry.async('string');
        rawFiles[path] = content;
      }
      
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
    
    console.log('[ZIP] Raw files extracted:', Object.keys(rawFiles).length);
    console.log('[ZIP] Skipped during extraction:', skippedCount);
    
    // Double-clean the files to ensure no junk slipped through
    const files = cleanProjectFiles(rawFiles);
    const extraCleaned = Object.keys(rawFiles).length - Object.keys(files).length;
    if (extraCleaned > 0) {
      console.log('[ZIP] Extra files cleaned:', extraCleaned);
      skippedCount += extraCleaned;
    }
    
    console.log('[ZIP] Final clean files:', Object.keys(files).length);
    console.log('[ZIP] File list:', Object.keys(files));
    
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
    
    if (skippedCount > 0) {
      console.log(`Filtered out ${skippedCount} macOS metadata files`);
    }
    
    // Auto-save project to localStorage after loading
    saveProjectToLocalStorage();
    
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
  const isBinary = fileContent && typeof fileContent === 'object' && fileContent.isBinary;
  
  // Save current file content (only for text files)
  if (state.currentFile && state.projectFiles[state.currentFile] !== undefined) {
    const currentContent = state.projectFiles[state.currentFile];
    if (!(currentContent && typeof currentContent === 'object' && currentContent.isBinary)) {
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
      if (content && typeof content === 'object' && content.isBinary) {
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
      // File not found - leave a comment placeholder
      console.warn(`Include file not found: ${filename}, tried paths:`, pathsToTry);
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
  
  const newPath = parentPath ? `${parentPath}/${filename}` : filename;
  
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
  
  // Add a placeholder .gitkeep file to create the folder structure
  const placeholderPath = parentPath ? `${parentPath}/${foldername}/.gitkeep` : `${foldername}/.gitkeep`;
  
  if (state.projectFiles[placeholderPath]) {
    showErrorToast('Folder already exists');
    return;
  }
  
  state.projectFiles[placeholderPath] = '';
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
  
  showSuccessToast(`Created folder ${foldername}`);
}

/**
 * Rename a file
 */
function renameFile(oldPath) {
  const oldName = oldPath.split('/').pop();
  const newName = prompt('Enter new file name:', oldName);
  if (!newName || newName === oldName) return;
  
  const pathParts = oldPath.split('/');
  pathParts[pathParts.length - 1] = newName;
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
    elements.currentFileName.textContent = newName;
  }
  
  // Update main file reference if needed
  if (state.mainFile === oldPath) {
    state.mainFile = newPath;
  }
  
  // Rebuild file tree
  buildFileTree(state.projectFiles);
  
  // Auto-save project
  saveProjectToLocalStorage();
  
  showSuccessToast(`Renamed to ${newName}`);
}

/**
 * Rename a folder (moves all files within)
 */
function renameFolder(oldPath) {
  const oldName = oldPath.split('/').pop();
  const newName = prompt('Enter new folder name:', oldName);
  if (!newName || newName === oldName) return;
  
  const pathParts = oldPath.split('/');
  pathParts[pathParts.length - 1] = newName;
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
  
  showSuccessToast(`Renamed folder to ${newName}`);
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
// START APPLICATION
// ============================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
