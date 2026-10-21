# Accessibility checks

[Documentation](README.md) | [Accessibility policy](../ACCESSIBILITY.md)

WCAG 2.2 AA is the contribution target, not a certification of this application.
These are verification procedures, not a record of a completed audit.
Use synthetic documents and credentials, and record browser, OS, input method, zoom,
assistive technology, affected workflow, and observed behavior.

## Existing automation

`node frontend/test-warnings.js` checks warning detection, not accessible UI behavior.
Backend tests, image healthchecks, and CodeQL do not establish WCAG compliance.
There is no configured axe/Lighthouse accessibility suite or browser end-to-end harness.
When using an available browser audit tool, record its version and findings, and still
perform the manual journeys below. Do not add a new toolchain just to claim readiness.

## Keyboard journeys

Start at the page top without a pointer. Follow the skip link and test:

1. Navigate project controls, create a synthetic project, open files, and collapse/reopen
   the sidebar. Check visible focus and logical order.
2. Enter and leave the source editor. `Tab` inserts spaces, so explicitly check that a user
   can escape editing without a pointer. Record a blocker rather than assuming Tab navigation.
3. Operate command completion, engine selection, Auto, Lines, compile, warnings, and downloads.
   Confirm Escape closes dismissible overlays and focus returns to a useful control.
4. Exercise rename/delete dialogs and file actions. Check that pointer-only context-menu
   actions have usable keyboard alternatives.
5. Move through dialogs in both directions. Check focus containment while open and that
   background controls cannot be activated accidentally.

The file tree supports focus and Enter/Space activation, but a complete tree keyboard
pattern and context-menu access must not be inferred from ARIA roles alone.

## Screen-reader journeys

With a real screen reader, check page landmarks, editor labels, project/file names,
button names, expanded states, dialog titles, save/compile errors, and status announcements.
Changing state must be understandable without color or visual placement.

The preview currently draws labeled canvases without a text/accessibility layer.
Do not interpret a page-number label as readable document content. Check source access
and exported PDFs separately; PDF accessibility also depends on the authored TeX document.

## Visual, motion, and touch checks

Check normal/large text contrast, UI control contrast, focus visibility, and non-color error
indicators in each affected state. Use 200% browser zoom and a narrow viewport to identify
clipped controls, obstructed focus, and loss of surrounding UI; inspect reflow up to 400%
where applicable. Source code and page previews can need two-dimensional scrolling, but
that is not an excuse for inaccessible toolbar or dialog controls.

Test reduced-motion preferences, high-contrast/forced-color modes, and readable text in
light/dark viewing environments. Check at least 24 by 24 CSS-pixel pointer targets or the
applicable WCAG exception, and provide alternatives for any drag-only resize interaction.

Images need meaningful alt text; demonstrations need a text walkthrough and captions or
transcripts as appropriate. Report barriers through the existing
[bug-report route](https://github.com/mbianchidev/latex-editor/issues/new/choose),
without personal documents, private repository names, or tokens.
