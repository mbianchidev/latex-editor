# Security Policy

## Supported Versions

As this project is in early development, we currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

Once we release version 1.0, this table will be updated to reflect our long-term support policy.

## Reporting a Vulnerability

We take the security of latex-editor seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Preferred**: Use GitHub's private vulnerability reporting feature:
   - Navigate to the repository's "Security" tab
   - Click "Report a vulnerability"
   - Fill out the form with details about the vulnerability

2. **Alternative**: Open a GitHub issue with the title "SECURITY: [Brief Description]" and request private discussion

### What to Include in Your Report

To help us better understand the nature and scope of the issue, please include as much of the following information as possible:

* Type of issue (e.g., XSS, CSRF, arbitrary code execution, data exposure)
* Full paths of source file(s) related to the manifestation of the issue
* The location of the affected source code (tag/branch/commit or direct URL)
* Any special configuration required to reproduce the issue
* Step-by-step instructions to reproduce the issue
* Proof-of-concept or exploit code (if possible)
* Impact of the issue, including how an attacker might exploit it

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

## Disclosure Policy

* We follow a coordinated disclosure model
* We will work with you to understand and resolve the issue
* We request that you do not publicly disclose the vulnerability until we have had a chance to address it
* Once a fix is available, we will publish a security advisory

## Comments on This Policy

If you have suggestions on how this process could be improved, please submit a pull request or open an issue.
