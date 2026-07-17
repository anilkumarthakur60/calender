# Security Policy

## Supported versions

Only the latest released version receives security fixes.

| Version | Supported |
| ------- | --------- |
| Latest  | ✅        |
| Older   | ❌        |

## Reporting a vulnerability

Please **do not** open a public issue. Instead, use GitHub's private
vulnerability reporting: [Report a vulnerability](https://github.com/anilkumarthakur60/calender/security/advisories/new).

Include:

- A description of the vulnerability.
- Steps to reproduce.
- The affected package + version.
- Any suggested fix.

We aim to:

- Acknowledge within **3 business days**.
- Provide a fix or mitigation within **30 days** for confirmed issues.

You'll be credited in the release notes unless you ask otherwise.

## Scope

The library runs in the browser and does no I/O of its own. Issues we care
about most:

- XSS via user-controlled formatter input.
- Prototype pollution in option parsing.
- DoS via malformed date input.

The headless engine has zero runtime dependencies, which keeps the supply-
chain surface minimal.
