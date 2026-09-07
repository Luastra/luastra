# Luastra roadmap

This roadmap communicates direction, not dates or contractual commitments.
Work enters a release only after its implementation, evidence, documentation,
licensing, and security boundaries pass the applicable gate.

## `0.1.0-alpha` — public source foundation

- Publish one audited clean Git history and exact source candidate.
- Publish the English `luastra.dev` site, SDK reference, Luau onboarding, and
  beginner/advanced learning paths.
- Publish deterministic SDK archives, checksums, manifests, SBOMs, and notices.
- Repeat owner dogfood against the exact documented candidate.
- Enable public security reporting and protected repository workflows.

## `0.2.0-alpha` — Constellation Orbit vertical slice

- Admit the experimental Constellation Orbit semantic UI family through the
  public Luau SDK without application-owned coordinates or renderer escape
  hatches.
- Prove equivalent spatial and complete-list presentation, nested navigation,
  Focus Surfaces, search, semantic relationships and zoom, themes, motion
  preferences, keyboard access, direct links, and focus restoration.
- Establish browser, DOM, layout, memory, and visual-effect performance budgets
  before treating the reference experience as release-ready.
- Harden the same semantic application separately on supported browser,
  Capacitor, and Tauri hosts; evidence from one host does not admit another.
- Dogfood the release by migrating `luastra.dev` in private first. Use Orbit for
  the landing experience, product map, and examples while retaining conventional
  searchable documentation and API-reference pages, stable deep links, indexed
  content, reduced-motion behavior, and a complete list fallback.
- Publish the migrated site only from an audited public candidate after its
  accessibility, responsive, performance, SEO, URL-compatibility, and content-
  parity gates pass. The current public site remains the rollback baseline.

## Following alpha iterations

- Expand semantic UI, layout, form, navigation, and asset primitives from real
  application findings.
- Stabilize project manifests, public SDK types, diagnostics, migrations, and
  compatibility reporting.
- Broaden browser, desktop, mobile, accessibility, IME, performance, and media
  validation without weakening evidence labels.
- Improve trusted installation and upgrade workflows; evaluate signing,
  notarization, installers, stores, and update channels as separate releases.
- Add deployable backend-operation guidance while preserving provider-neutral
  application APIs.

## Deliberately later

Location, Notifications, Payments, a visual builder, AI application generation,
a public marketplace, and production multi-tenant hosted services are outside
the first source alpha. Each requires a separate product, permission, security,
privacy, compliance, and cross-host admission decision.

## How roadmap decisions are made

Maintainers prioritize correctness, portability, accessibility, deterministic
distribution, and friction discovered by applications built through the public
SDK. Reference applications prove general contracts; they do not define
special-purpose core APIs. See [`GOVERNANCE.md`](./GOVERNANCE.md) for the
decision process.
