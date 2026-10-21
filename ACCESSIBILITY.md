# Accessibility

LaTeX Editor aims for **WCAG 2.2 Level AA** in its web interface and documentation.
This is a contribution target, not a compliance certification or a claim that a full
accessibility audit has been completed.

## Contribution practices

Use semantic elements, useful accessible names, visible focus, and logical keyboard
navigation. Provide screen-reader feedback for meaningful status/errors, and do not rely
only on color. Check contrast, zoom/reflow, reduced-motion preferences, touch target sizes,
and alternatives to pointer-only interactions. Images need alt text; demonstrations need
text equivalents and captions/transcripts where appropriate.

Follow [the detailed verification guide](docs/accessibility-testing.md) for keyboard,
screen-reader, visual, motion, and touch checks. Existing Node/backend tests do not
exercise these journeys, and no automated accessibility suite is configured.

## Current limitations

- The source editor handles Tab as indentation, without a documented keyboard-only escape
  path. Complete keyboard navigation must not be assumed.
- File activation and some menus have keyboard handlers, but file context menus and full
  tree/dialog focus behavior still need dedicated accessibility verification.
- PDF preview pages are canvases with page labels, not a selectable text/accessibility layer.
  Accessible source/export workflows also depend on the authored LaTeX document.
- Comprehensive contrast, zoom/reflow, reduced-motion, and assistive-technology coverage
  has not been established.

These source-level observations are not a substitute for testing with assistive technology.
Do not treat existing labels or skip navigation as evidence the whole app is accessible.

## Report a barrier

Use the existing [bug-report channel](https://github.com/mbianchidev/latex-editor/issues/new/choose)
and describe the task, steps, expected/actual behavior, browser/OS, input method, and
assistive technology if applicable. Synthetic examples are enough; do not include personal
documents or credentials. Follow [SECURITY.md](SECURITY.md) for vulnerabilities instead.
