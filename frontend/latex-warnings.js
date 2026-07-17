(function attachLatexWarnings(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.LatexWarnings = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const MAX_WARNINGS = 100;
  const ALIGNMENT_ENVIRONMENTS = new Set([
    'tabular',
    'tabular*',
    'array',
    'align',
    'align*',
    'alignat',
    'alignat*',
    'aligned',
    'alignedat',
    'eqnarray',
    'eqnarray*',
    'cases',
    'matrix',
    'pmatrix',
    'bmatrix',
    'Bmatrix',
    'vmatrix',
    'Vmatrix',
    'smallmatrix',
    'split',
  ]);
  const OPAQUE_ARGUMENT_COMMANDS = ['url', 'path', 'nolinkurl'];

  function isEscaped(text, index) {
    let slashCount = 0;
    for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor--) {
      slashCount++;
    }
    return slashCount % 2 === 1;
  }

  function skipVerb(text, start) {
    const match = text.slice(start).match(/^\\verb\*?/);
    if (!match) return null;
    const delimiterIndex = start + match[0].length;
    const delimiter = text[delimiterIndex];
    if (!delimiter || /[A-Za-z\s]/.test(delimiter)) return null;
    const end = text.indexOf(delimiter, delimiterIndex + 1);
    return end === -1 ? text.length : end + 1;
  }

  function findCommentIndex(text) {
    for (let index = 0; index < text.length; index++) {
      if (text[index] === '\\') {
        const verbEnd = skipVerb(text, index);
        if (verbEnd !== null) {
          index = verbEnd - 1;
          continue;
        }
      }
      if (text[index] === '%' && !isEscaped(text, index)) {
        return index;
      }
    }
    return -1;
  }

  function readEnvironmentCommand(text, start) {
    const match = text.slice(start).match(/^\\(begin|end)\{([^{}]+)\}/);
    if (!match) return null;
    return {
      action: match[1],
      name: match[2],
      end: start + match[0].length,
    };
  }

  function findBalancedGroupEnd(text, openIndex) {
    let depth = 0;
    for (let index = openIndex; index < text.length; index++) {
      if (isEscaped(text, index)) continue;
      if (text[index] === '{') depth++;
      if (text[index] === '}') {
        depth--;
        if (depth === 0) return index + 1;
      }
    }
    return null;
  }

  function skipOpaqueArgument(text, start) {
    for (const command of OPAQUE_ARGUMENT_COMMANDS) {
      const prefix = `\\${command}`;
      if (!text.startsWith(prefix, start)) continue;
      const openIndex = text.indexOf('{', start + prefix.length);
      if (openIndex === -1) return null;
      return findBalancedGroupEnd(text, openIndex);
    }

    if (text.startsWith('\\href', start)) {
      const openIndex = text.indexOf('{', start + '\\href'.length);
      if (openIndex === -1) return null;
      return findBalancedGroupEnd(text, openIndex);
    }
    return null;
  }

  function popEnvironment(stack, name) {
    for (let index = stack.length - 1; index >= 0; index--) {
      if (stack[index] === name) {
        stack.splice(index, 1);
        return;
      }
    }
  }

  function maskVerbatimBlocks(text) {
    let masked = text;
    let searchFrom = 0;

    while (searchFrom < masked.length) {
      const match = masked.slice(searchFrom).match(
        /\\begin\{(verbatim\*?|lstlisting|minted)\}/
      );
      if (!match) return { text: masked, openEnvironment: null };

      const beginIndex = searchFrom + match.index;
      if (findCommentIndex(masked.slice(0, beginIndex)) !== -1) {
        return { text: masked, openEnvironment: null };
      }

      const beginEnd = beginIndex + match[0].length;
      const endToken = `\\end{${match[1]}}`;
      const endIndex = masked.indexOf(endToken, beginEnd);
      if (endIndex === -1) {
        return {
          text: masked.slice(0, beginIndex),
          openEnvironment: match[1],
        };
      }

      const blockEnd = endIndex + endToken.length;
      masked = (
        masked.slice(0, beginIndex)
        + ' '.repeat(blockEnd - beginIndex)
        + masked.slice(blockEnd)
      );
      searchFrom = blockEnd;
    }

    return { text: masked, openEnvironment: null };
  }

  function findLatexWarnings(source) {
    if (typeof source !== 'string' || source.length === 0) return [];

    const warnings = [];
    const braceStack = [];
    const environmentStack = [];
    const lines = source.split('\n');
    let verbatimEnvironment = null;

    const addWarning = warning => {
      if (warnings.length < MAX_WARNINGS) {
        warnings.push(warning);
      }
    };

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      let line = lines[lineIndex];
      const lineNumber = lineIndex + 1;

      if (verbatimEnvironment) {
        const endToken = `\\end{${verbatimEnvironment}}`;
        const endIndex = line.indexOf(endToken);
        if (endIndex === -1) continue;
        const contentStart = endIndex + endToken.length;
        line = ' '.repeat(contentStart) + line.slice(contentStart);
        verbatimEnvironment = null;
      }

      const verbatimResult = maskVerbatimBlocks(line);
      line = verbatimResult.text;
      verbatimEnvironment = verbatimResult.openEnvironment;
      const commentIndex = findCommentIndex(line);
      const activeLine = commentIndex === -1
        ? line
        : line.slice(0, commentIndex);

      const previousCommentCharacter = commentIndex === -1
        ? ''
        : (line.slice(0, commentIndex).match(/(\S)\s*$/)?.[1] || '');
      if (
        commentIndex > 0
        && /[0-9]/.test(previousCommentCharacter)
      ) {
        addWarning({
          line: lineNumber,
          column: commentIndex + 1,
          code: 'unescaped-percent',
          message: 'Unescaped % after a number starts a comment. Use \\% for a literal percent.',
        });
      }

      for (let index = 0; index < activeLine.length; index++) {
        const char = activeLine[index];
        if (char === '\\') {
          const verbEnd = skipVerb(activeLine, index);
          if (verbEnd !== null) {
            index = verbEnd - 1;
            continue;
          }

          const environment = readEnvironmentCommand(activeLine, index);
          if (environment) {
            if (environment.action === 'begin') {
              environmentStack.push(environment.name);
            } else {
              popEnvironment(environmentStack, environment.name);
            }
            index = environment.end - 1;
            continue;
          }

          const opaqueEnd = skipOpaqueArgument(activeLine, index);
          if (opaqueEnd !== null) {
            index = opaqueEnd - 1;
            continue;
          }

          index++;
          continue;
        }

        if (char === '{' && !isEscaped(activeLine, index)) {
          braceStack.push({ line: lineNumber, column: index + 1 });
          continue;
        }

        if (char === '}' && !isEscaped(activeLine, index)) {
          if (braceStack.length > 0) {
            braceStack.pop();
          } else {
            addWarning({
              line: lineNumber,
              column: index + 1,
              code: 'unmatched-closing-brace',
              message: 'Closing } has no matching opening {.',
            });
          }
          continue;
        }

        if (char === '&' && !isEscaped(activeLine, index)) {
          const insideAlignment = environmentStack.some(
            environment => ALIGNMENT_ENVIRONMENTS.has(environment)
          );
          if (!insideAlignment) {
            addWarning({
              line: lineNumber,
              column: index + 1,
              code: 'unescaped-ampersand',
              message: 'Unescaped & is reserved for alignment. Use \\& for a literal ampersand.',
            });
          }
        }
      }
    }

    for (const opening of braceStack) {
      addWarning({
        ...opening,
        code: 'unmatched-opening-brace',
        message: 'Opening { has no matching closing }. Check this construct.',
      });
    }

    return warnings.sort((left, right) => (
      left.line - right.line || left.column - right.column
    ));
  }

  return { findLatexWarnings };
}));
