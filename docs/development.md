# Development and release checks

This release targets 0.2.1-alpha. `release/published-release.v1.json` records
the documentation installation target independently from the development
candidate admission. Its tag is immutable after publication.

## Before integration

Start from an explicitly verified public commit. A private default branch can
lag behind a release; its name alone is not evidence of the current baseline.
Keep changes on a separate development branch and inspect the complete diff.
Private research and operational notes must remain outside the public candidate.

Run `npm test`, `npm run docs:check`, the website's `reference:build`, and
`npm run alpha:audit`. Regenerate the clean export manifest after adding files.
After product changes, build a new candidate SDK set, verify its admission and
install it into a clean temporary SDK root. Never rebuild published archives in
place. Local archive verification does not establish native device behavior.

## Developer contracts

Web and bundle builds stage compilation, assets and post-processing before
replacing successful output. A failed replacement restores the previous output;
if restoration fails, the diagnostic identifies the retained backup. Concurrent
builds to the same path are rejected. After a killed process, inspect the named
lock and backup before removing a stale lock. Directory replacement is not a
guarantee of uninterrupted serving or power-loss durability.

UI constructors accept `UI.Input`. Known primitive field types and the required
identifier are checked by Luau. Component-specific fields, enums, numeric bounds,
motion and child structure still receive runtime validation. Explicit `any`
bypasses static checking. The generated starter test exercises its application
render and counter action; application authors should extend it for their logic.

Build the website before `npm --prefix website run serve`. The server serves
`website/luastra-site`, including the generated HTML content-security policy.
Check documentation navigation, titles and Orbit content in the browser.

## Publication boundary

Before publication, review the exact candidate SHA, required CI, source/export
audit, installation evidence and relevant browser/native checks. Integrate the
audited public diff, verify public main, create immutable versioned artifacts,
and verify deployment against that commit. A private commit or local build does
not publish the website. Update the documentation release target during release finalization and deploy
that site only after the corresponding release is published. Sponsors configuration remains a separate change
and requires a publicly reachable approved Sponsors profile before activation.
