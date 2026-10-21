# Roadmap

[Documentation](README.md) | [Implemented features](../README.md#features)

This separates the working baseline from ideas carried forward from the earlier project
guide. It is not a delivery schedule or a promise that every idea will be implemented.
Discuss proposals using the existing
[feature-request template](../.github/ISSUE_TEMPLATE/feature_request.md).

## Implemented baseline

Browser source editing with command suggestions and warnings, multi-file projects,
compiler-produced PDF preview/export, project ZIP import/export, SQLite persistence,
optional auto-compile, engine selection, and manual GitHub folder synchronization.
See [usage](usage.md) and [known limitations](troubleshooting.md) for the actual behavior.

## Not implemented

- User accounts, authentication, and per-user project/credential isolation.
- Real-time collaborative editing and document version history.
- Full source syntax highlighting, code folding, and source-to-PDF synchronized navigation.
- Configurable themes/keybindings, a plugin API, and a template library.
- General cloud-storage integration beyond the existing manual GitHub folder workflow.
- A persistent incremental compilation cache, a compile queue, and large-document
  virtualization.

Accessibility improvements are tracked against the
[contribution target and known limitations](../ACCESSIBILITY.md), not treated as complete
because a few controls have labels. Priorities depend on maintainer review and concrete
use cases; current safety limits and the shared-instance model remain in effect.
