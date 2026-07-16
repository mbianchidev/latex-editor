const assert = require('node:assert/strict');
const { findLatexWarnings } = require('./latex-warnings');

function codes(source) {
  return findLatexWarnings(source).map(warning => warning.code);
}

assert.deepEqual(codes('Discount: 100% today'), ['unescaped-percent']);
assert.deepEqual(codes('Discount: 100 % today'), ['unescaped-percent']);
assert.deepEqual(codes('Discount: 100\\% today'), []);
assert.deepEqual(codes('Text % ordinary comment'), []);
assert.deepEqual(codes('% 100% inside a full-line comment'), []);

assert.deepEqual(codes('Research & Development'), ['unescaped-ampersand']);
assert.deepEqual(codes('Research \\& Development'), []);
assert.deepEqual(codes('\\begin{tabular}{ll}A & B\\\\\\end{tabular}'), []);
assert.deepEqual(codes('\\begin{cases}x & x > 0\\end{cases}'), []);
assert.deepEqual(codes('\\url{https://example.com/?a=1&b=2}'), []);

assert.deepEqual(codes('\\newcommand{\\example}[1]{Value: #1}'), []);
assert.deepEqual(codes('\\verb|100% & { literal|'), []);
assert.deepEqual(codes('\\begin{verbatim}\n100% & { literal\n\\end{verbatim}'), []);
assert.deepEqual(
  codes(
    '\\begin{verbatim}100% & { literal\\end{verbatim}\n'
    + 'After: 100%\nAfter: &\norphan}'
  ),
  ['unescaped-percent', 'unescaped-ampersand', 'unmatched-closing-brace']
);
assert.deepEqual(
  codes('\\begin{lstlisting}100% & { literal\\end{lstlisting}\nAfter: 100%'),
  ['unescaped-percent']
);

assert.deepEqual(codes('\\textbf{closed}'), []);
assert.deepEqual(codes('\\textbf{open'), ['unmatched-opening-brace']);
assert.deepEqual(codes('orphan}'), ['unmatched-closing-brace']);
assert.deepEqual(codes('Text % { ignored after comment'), []);

console.log('LaTeX warning parser tests passed');
