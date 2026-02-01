# LaTeX Editor Examples

This document provides example LaTeX code that you can use to test and learn with the LaTeX Editor.

## Basic Document

```latex
\documentclass{article}
\usepackage[utf8]{inputenc}

\title{My First LaTeX Document}
\author{Your Name}
\date{\today}

\begin{document}

\maketitle

\section{Introduction}

This is a simple LaTeX document to get you started.

\end{document}
```

## Text Formatting

```latex
\documentclass{article}
\begin{document}

\section{Text Formatting Examples}

\textbf{Bold text} and \textit{italic text} and \texttt{monospace text}.

\emph{Emphasized text} is typically italic.

You can also combine: \textbf{\textit{bold and italic}}.

\end{document}
```

## Lists

```latex
\documentclass{article}
\begin{document}

\section{List Examples}

\subsection{Unordered List}

\begin{itemize}
    \item First item
    \item Second item
    \item Third item
        \begin{itemize}
            \item Nested item
            \item Another nested item
        \end{itemize}
\end{itemize}

\subsection{Ordered List}

\begin{enumerate}
    \item First step
    \item Second step
    \item Third step
\end{enumerate}

\end{document}
```

## Mathematical Equations

```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Mathematics}

\subsection{Inline Math}

The Pythagorean theorem is $a^2 + b^2 = c^2$.

The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$.

\subsection{Display Math}

\begin{equation}
    E = mc^2
\end{equation}

\begin{equation}
    \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
\end{equation}

\begin{align}
    x + y &= 5 \\
    x - y &= 1
\end{align}

\end{document}
```

## Greek Letters and Symbols

```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Greek Letters}

Lowercase: $\alpha, \beta, \gamma, \delta, \epsilon, \theta, \lambda, \mu, \pi, \sigma, \omega$

Uppercase: $\Gamma, \Delta, \Theta, \Lambda, \Pi, \Sigma, \Omega$

\section{Common Symbols}

Infinity: $\infty$

Plus-minus: $\pm$

Times: $\times$

Division: $\div$

Partial derivative: $\partial$

Nabla: $\nabla$

\section{Set Operations}

Intersection: $\cap$

Union: $\cup$

Subset: $\subset$

Superset: $\supset$

Element of: $\in$

Not element of: $\notin$

Empty set: $\emptyset$

\end{document}
```

## Advanced Math

```latex
\documentclass{article}
\usepackage{amsmath}
\usepackage{amssymb}

\begin{document}

\section{Calculus}

\subsection{Derivatives}

\begin{equation}
    \frac{d}{dx}(x^n) = nx^{n-1}
\end{equation}

\subsection{Integrals}

\begin{equation}
    \int x^n dx = \frac{x^{n+1}}{n+1} + C
\end{equation}

\subsection{Limits}

\begin{equation}
    \lim_{x \to 0} \frac{\sin x}{x} = 1
\end{equation}

\section{Linear Algebra}

Matrix:
\begin{equation}
    A = \begin{pmatrix}
        a_{11} & a_{12} \\
        a_{21} & a_{22}
    \end{pmatrix}
\end{equation}

\section{Summation and Products}

\begin{equation}
    \sum_{i=1}^{n} i = \frac{n(n+1)}{2}
\end{equation}

\begin{equation}
    \prod_{i=1}^{n} i = n!
\end{equation}

\end{document}
```

## Fractions and Roots

```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Fractions}

Simple fraction: $\frac{1}{2}$

Complex fraction: $\frac{x^2 + 2x + 1}{x - 1}$

Nested fraction: $\frac{1}{1 + \frac{1}{x}}$

\section{Roots}

Square root: $\sqrt{x}$

Nth root: $\sqrt[n]{x}$

Complex root: $\sqrt{x^2 + y^2}$

\end{document}
```

## Code Blocks

```latex
\documentclass{article}

\begin{document}

\section{Including Code}

Inline code: \texttt{console.log("Hello")}

\subsection{Code Block}

\begin{verbatim}
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

console.log(factorial(5)); // 120
\end{verbatim}

\end{document}
```

## Sections and Structure

```latex
\documentclass{article}

\begin{document}

\section{Main Section}

This is the main section content.

\subsection{Subsection}

This is a subsection.

\subsubsection{Subsubsection}

This is a subsubsection.

\section{Another Main Section}

More content here.

\subsection{Another Subsection}

\paragraph{Paragraph heading} This is paragraph text.

\end{document}
```

## Complete Academic Paper Example

```latex
\documentclass{article}
\usepackage[utf8]{inputenc}
\usepackage{amsmath}
\usepackage{amssymb}

\title{An Introduction to Quantum Computing}
\author{Jane Doe \\ Department of Computer Science \\ Example University}
\date{\today}

\begin{document}

\maketitle

\begin{abstract}
This paper provides an introduction to the fundamental concepts of quantum computing, 
including quantum bits, superposition, entanglement, and quantum gates. We explore 
the mathematical foundations and discuss potential applications.
\end{abstract}

\section{Introduction}

Quantum computing represents a revolutionary approach to computation that leverages 
quantum mechanical phenomena to process information in fundamentally new ways.

Unlike classical bits that exist in states 0 or 1, quantum bits (qubits) can exist 
in superposition states represented as:

\begin{equation}
    |\psi\rangle = \alpha|0\rangle + \beta|1\rangle
\end{equation}

where $\alpha$ and $\beta$ are complex amplitudes satisfying $|\alpha|^2 + |\beta|^2 = 1$.

\section{Mathematical Foundations}

\subsection{State Vectors}

The state of a qubit is represented by a vector in a two-dimensional complex Hilbert space:

\begin{equation}
    |\psi\rangle = \begin{pmatrix} \alpha \\ \beta \end{pmatrix}
\end{equation}

\subsection{Quantum Gates}

Common quantum gates include:

\begin{itemize}
    \item \textbf{Hadamard Gate}: Creates superposition
    \item \textbf{Pauli Gates}: $X$, $Y$, $Z$ operations
    \item \textbf{CNOT Gate}: Controlled-NOT for entanglement
\end{itemize}

The Hadamard gate is represented by:

\begin{equation}
    H = \frac{1}{\sqrt{2}} \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}
\end{equation}

\section{Quantum Algorithms}

\subsection{Deutsch-Jozsa Algorithm}

The Deutsch-Jozsa algorithm determines whether a function is constant or balanced 
with a single query, providing exponential speedup over classical algorithms.

\subsection{Grover's Algorithm}

Grover's algorithm provides quadratic speedup for unstructured search problems, 
reducing search time from $O(N)$ to $O(\sqrt{N})$.

\section{Applications}

Quantum computing has potential applications in:

\begin{enumerate}
    \item Cryptography and security
    \item Drug discovery and molecular simulation
    \item Optimization problems
    \item Machine learning
    \item Financial modeling
\end{enumerate}

\section{Challenges}

Current challenges in quantum computing include:

\begin{itemize}
    \item Decoherence and error rates
    \item Scalability of quantum systems
    \item Error correction requirements
    \item Temperature and isolation needs
\end{itemize}

\section{Conclusion}

Quantum computing represents a paradigm shift in computational capabilities. 
While significant challenges remain, ongoing research continues to advance 
both the theoretical foundations and practical implementations.

\end{document}
```

## Tips for Using These Examples

1. **Copy and paste** any example into the editor
2. **Press Ctrl+Enter** to compile and see the result
3. **Modify** the examples to learn how LaTeX works
4. **Combine** examples to create your own documents
5. **Download** your work as .tex or PDF

## Multi-File Project Example

For complex documents, you can organize your LaTeX code into multiple files. Create a ZIP file with this structure:

### Main File (main.tex)
```latex
\documentclass{article}
\usepackage[utf8]{inputenc}
\usepackage{amsmath}

\title{My Resume}
\author{Jane Doe}
\date{\today}

\begin{document}

\maketitle

\input{sections/summary.tex}

\input{sections/experience.tex}

\input{sections/education.tex}

\section{Conclusion}
Thank you for considering my application!

\end{document}
```

### Summary File (sections/summary.tex)
```latex
\section{Professional Summary}

Experienced software engineer with 5+ years in full-stack development.

\textbf{Core Competencies:}
\begin{itemize}
    \item JavaScript/TypeScript, React, Node.js
    \item Python, Django, Flask
    \item AWS, Docker, Kubernetes
    \item Agile/Scrum methodologies
\end{itemize}
```

### Experience File (sections/experience.tex)
```latex
\section{Work Experience}

\subsection{Senior Software Engineer}
\textbf{Tech Company Inc.} \hfill \textit{2020 - Present}

\begin{itemize}
    \item Led development of microservices architecture
    \item Improved system performance by 40\%
    \item Mentored team of 5 junior developers
\end{itemize}

\subsection{Software Engineer}
\textbf{Startup XYZ} \hfill \textit{2018 - 2020}

\begin{itemize}
    \item Built RESTful APIs with Django
    \item Implemented CI/CD pipelines
    \item Collaborated with cross-functional teams
\end{itemize}
```

### Education File (sections/education.tex)
```latex
\section{Education}

\subsection{Bachelor of Science in Computer Science}
\textbf{University of Technology} \hfill \textit{2014 - 2018}

\begin{itemize}
    \item GPA: 3.8/4.0
    \item Dean's List: 6 semesters
    \item Relevant coursework: Algorithms, Database Systems, Web Development
\end{itemize}
```

### How to Use This Example

1. Create the folder structure:
   ```
   my-resume/
   ├── main.tex
   └── sections/
       ├── summary.tex
       ├── experience.tex
       └── education.tex
   ```

2. Create a ZIP file with all files and folders
3. Click the **ZIP** button in the editor toolbar
4. Select your ZIP file
5. The editor will:
   - Show a file tree on the left
   - Open main.tex automatically
   - Compile the entire project
   - Resolve all \input{} commands
6. Click files in the tree to edit them
7. Download as ZIP to export your changes

## Common LaTeX Resources

- Greek letters: `\alpha`, `\beta`, `\gamma`, `\delta`, etc.
- Math operators: `\sum`, `\prod`, `\int`, `\sqrt`, `\frac`
- Text formatting: `\textbf{}`, `\textit{}`, `\texttt{}`
- Structure: `\section{}`, `\subsection{}`, `\subsubsection{}`

## Need More Help?

Check out:
- `GUIDE.md` for detailed documentation
- `README.md` for feature overview
- Online LaTeX documentation and tutorials

Happy LaTeXing! 📝✨
