# Luastra governance

Luastra is currently maintained by its founder and repository owner. The
project may introduce additional maintainers as contribution volume and areas
of ownership become clear.

## Roles

- **Users** build applications, report reproducible problems, and propose
  improvements.
- **Contributors** submit signed-off changes under the applicable repository
  license.
- **Maintainers** review changes, protect architectural and security boundaries,
  manage releases, and make final repository decisions.

The current code owner is `@viachb-projects`.

## Decision process

Small compatible changes use ordinary pull-request review. Changes to public
SDKs, project or persisted-state formats, host protocols, security boundaries,
licenses, supported platforms, or release claims require:

1. a written problem and bounded proposal;
2. alternatives and compatibility impact;
3. tests and documentation for observable behavior;
4. evidence on every host named by the claim;
5. an explicit maintainer decision recorded with the change.

Reference applications may reveal missing general capabilities, but a feature
is not added to core solely for one application's domain.

## Releases

Maintainers select an exact commit, run the release gates, review generated
artifacts and notices, and publish only the approved identity. Passing CI alone
does not authorize a release. Security-sensitive publication actions require
their separately documented approval boundary.

## Changes to governance

Governance changes use the same public pull-request process and must state why
the existing process no longer serves the project. No contributor gains
maintainer authority solely through a number of commits.
