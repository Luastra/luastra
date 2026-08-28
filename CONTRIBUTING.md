# Contributing to Luastra

Thank you for helping improve Luastra. The project is in public source alpha;
APIs and workflows may still change when evidence reveals a better general
contract.

By participating, you agree to follow the
[`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## Before opening a change

- Search existing issues and pull requests.
- Use an issue or discussion before implementing a large feature or a change to
  public APIs, file formats, security boundaries, licenses, generated-output
  rights, or supported platforms.
- Keep the platform general-purpose. Reference applications prove capabilities;
  they do not define a domain-specific core API.
- Never commit credentials, signing material, provisioning profiles, private
  user data, local environment files, or generated user-home paths.
- Keep generated artifacts reproducible and include provenance for new
  dependencies or assets.

## Development setup

The source tree requires Node.js 24 or newer and exposes its platform
validation commands from the repository root:

```sh
npm ci
npm test
npm run docs:check
npm run alpha:audit
```

The public tree deliberately excludes internal research phase names, planning
paths, and owner-only evidence. Do not copy private checkout paths into issues,
examples, or public guides.

Some host, browser, native, provider, and packaging suites require additional
documented tools. Run only the checks appropriate to your change, but never
claim a host result that was not executed on that host.

## Pull requests

1. Create a focused branch and keep unrelated changes out of the commit.
2. Add tests for observable behavior and negative controls for validation or
   security boundaries.
3. Update public documentation and compatibility notes when behavior changes.
4. Complete the pull-request template with exact commands and evidence.
5. Resolve review conversations without rewriting evidence.

Passing automation is necessary but does not guarantee acceptance. Maintainers
may request a smaller patch, design changes, tests, documentation, licensing
evidence, or host-specific proof.

## Developer Certificate of Origin

Every commit must certify the Developer Certificate of Origin 1.1 in
[`DCO.txt`](./DCO.txt). Sign commits with:

```sh
git commit -s
```

The resulting commit message must contain:

```text
Signed-off-by: Your Name <your-email@example.com>
```

Sign-off is a certification, not a copyright assignment. Contributions are
submitted under the license applicable to the contributed files unless they
are conspicuously marked otherwise before acceptance. Luastra does not require
a Contributor License Agreement at this stage.
