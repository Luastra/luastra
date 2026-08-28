# Luastra security policy

## Supported versions

| Version | Security status |
|---|---|
| `0.1.0-alpha` | Pre-release; not supported for production use |
| Earlier private prototypes | Unsupported |

The alpha has no security response-time or production compatibility guarantee.
Security fixes may require upgrading to a newer source-alpha revision.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability.

Use GitHub private vulnerability reporting at:

<https://github.com/Luastra/luastra/security/advisories/new>

If that route is unexpectedly unavailable, contact the repository owner
`@viachb-projects` through GitHub without opening a public issue.

Include:

- the affected Luastra version or exact commit;
- affected hosts and configuration;
- reproduction steps and a minimal safe proof of concept;
- expected impact and any known preconditions;
- whether the issue is already public.

Do not include real credentials, personal data, production tokens, or unrelated
private source. Allow maintainers reasonable time to reproduce and coordinate a
fix before public disclosure.

## Security boundary

The alpha scope includes the compiler/runtime boundary, host capabilities,
backend/provider sessions, generated applications, asset packaging, and native
adapters. Application-authored server logic, third-party cloud services,
operating-system security, deployment configuration, and user-selected
dependencies remain separate responsibility boundaries.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) and
[`COMPATIBILITY.md`](./COMPATIBILITY.md) for the admitted design and claims.
