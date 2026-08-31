# Public repository settings

These settings define the maintained public contract for the clean-history
`Luastra/luastra` repository. The complete private development history is kept
in a different repository and is never imported into this public history.

## Repository

- Default branch: `main`.
- Visibility: `public` for the source-alpha repository.
- Issues: enabled with issue forms; blank issues disabled.
- Discussions: enabled with categories for Q&A, ideas, and announcements.
- Wikis: disabled; versioned documentation lives in the repository and site.
- Projects: optional and disabled initially.
- Automatically delete head branches after merge: enabled.
- Squash merge: enabled and preferred for external pull requests.
- Merge commits: allowed for explicitly admitted integration history.
- Rebase merge: disabled initially.

## `main` ruleset

- Require a pull request before merge, with zero required approvals while there
  is only one maintainer; code-owner review becomes required after a second
  eligible maintainer is appointed.
- Require all review conversations to be resolved.
- Require the stable `public-alpha-quality` check from
  `.github/workflows/public-alpha-quality.yml`. The release-only four-host
  matrix remains an explicit release gate rather than a pull-request check.
- Require branches to be up to date before merge.
- Block force pushes and branch deletion.
- Require linear history for squash-merged external changes; retain an explicit
  owner bypass only for emergency recovery and record every use.
- Do not require signed commits in the first alpha because DCO sign-off is the
  contribution gate; reassess cryptographic commit signing separately.

The required public-alpha workflow must exist and pass on pull requests before
this ruleset is applied. Manual-only workflows must never be configured as
required checks.

## Actions

- Default workflow token permission: read repository contents only.
- Allow write permissions only in a job with an explicit documented need.
- Do not allow Actions to create or approve pull requests by default.
- Permit GitHub-authored and explicitly admitted third-party actions only.
- Pin every external action to a full commit SHA and retain the human-readable
  version in a comment.
- Require approval for workflows from first-time and untrusted fork
  contributors.
- Keep release publication in a protected environment with owner approval.
- Set finite artifact retention appropriate to evidence sensitivity and size.

## GitHub Pages and `luastra.dev`

- Use GitHub Actions as the Pages publishing source.
- Deploy a release from its exact published tag. A separately owner-reviewed
  documentation correction may be deployed manually from one exact lowercase
  40-character commit SHA through `.github/workflows/publish-luastra-dev.yml`.
  Ordinary pushes and pull requests must not publish the site.
- Use the `github-pages` environment for the production deployment.
- Set `luastra.dev` as the custom domain, require successful organization and
  DNS verification, and enforce HTTPS before announcing the site.
- Retain the operational checklist in
  [`.github/PAGES_DEPLOYMENT.md`](./PAGES_DEPLOYMENT.md).

## Security

- Dependency graph: enabled.
- Dependabot alerts and security updates: enabled.
- Secret scanning and push protection: enabled.
- Private vulnerability reporting: enabled and manually verified.
- Code scanning: enabled after the exact workflow, languages, generated-code
  exclusions, and Actions-minute budget are reviewed.
- Branch protection may not be weakened to make a failing release pass.

## Community and release

- Public profile exposes README, license, contribution guide, code of conduct,
  security policy, support policy, contact routes, privacy notice, issue forms,
  and pull-request template.
- Publish a release only after its exact candidate artifacts, checksums, SBOMs,
  notices, and release notes pass the release gates. Packages remain disabled
  until a separately documented package contract exists.
- No repository setting may imply signed installers, stores, production hosted
  services, or support guarantees absent from `COMPATIBILITY.md`.
