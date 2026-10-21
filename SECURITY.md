# Security Policy

## Supported Versions

The current security-update support policy is:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of latex-editor seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Use the repository's enabled
[GitHub private vulnerability reporting](https://github.com/mbianchidev/latex-editor/security/advisories/new).
You can also navigate to **Security**, select **Report a vulnerability**, and fill out
the private report. Do not open a public issue to request a private discussion.

### What to Include in Your Report

To help us better understand the nature and scope of the issue, please include as much of the following information as possible:

* Type of issue (e.g., XSS, CSRF, arbitrary code execution, data exposure)
* Full paths of source file(s) related to the manifestation of the issue
* The location of the affected source code (tag/branch/commit or direct URL)
* Any special configuration required to reproduce the issue
* Step-by-step instructions to reproduce the issue
* Proof-of-concept or exploit code (if possible)
* Impact of the issue, including how an attacker might exploit it

Use synthetic examples and redact tokens, encryption keys, private documents, and other
sensitive data. Do not attach a real project database or data-directory backup.

### Response Timeline

* **Initial Response**: We aim to acknowledge receipt of your vulnerability report within 48 hours
* **Status Updates**: We will send you regular updates about our progress, at least every 7 days
* **Resolution**: We aim to resolve critical vulnerabilities within 30 days of initial report

### What to Expect

After you submit a report:

1. We will confirm receipt of your vulnerability report
2. We will investigate and validate the vulnerability
3. We will work on a fix and coordinate disclosure timing with you
4. We will publicly acknowledge your responsible disclosure (unless you prefer to remain anonymous)

## Security Best Practices for Contributors

When contributing to this project, please:

* Never commit credentials, API keys, or sensitive data
* Follow secure coding practices for web applications
* Sanitize and validate all user inputs
* Use parameterized queries to prevent SQL injection
* Implement proper authentication and authorization checks
* Keep dependencies up to date
* Run security linters and scanners before submitting PRs

## Deployment and GitHub PAT Storage

This is a shared trusted-user service, not an authenticated multi-user application.
Restrict network access and provide authentication/HTTPS at an external proxy before
exposing it beyond a trusted private environment.

GitHub PATs are encrypted in SQLite. Without an environment-provided encryption key, a
complete data-directory backup contains both the ciphertext and generated key.
See [configuration and key custody](docs/configuration.md#github-credential-encryption)
for the complete setup, backup, and restore guidance.

## Disclosure Policy

* We follow a coordinated disclosure model
* We will work with you to understand and resolve the issue
* We request that you do not publicly disclose the vulnerability until we have had a chance to address it
* Once a fix is available, we will publish a security advisory

## Comments on This Policy

If you have suggestions on how this process could be improved, please submit a pull request or open an issue.
