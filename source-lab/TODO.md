# Source Lab TODO

This is the implementation queue for [PLAN.md](PLAN.md), measured against
[INVENTORY.md](INVENTORY.md). Completed engine foundation tasks are marked below. Check a task only
when its acceptance evidence is linked in the implementation PR or this ledger.
Foundation work is tracked in draft PR #103. Acceptance evidence is recorded in
[VALIDATION.md](VALIDATION.md); console and UI tasks remain open.

## Planning baseline

These completed tasks describe this planning PR only, not delivered runtime.

- [x] PLAN-01: Fetch latest os-lab master and create a standalone worktree/branch.
- [x] PLAN-02: Read os-lab architecture/contribution/readiness guidance and source rules/graph.
- [x] PLAN-03: Pin source commit and inventory all pages, HTTP methods and engine capabilities.
- [x] PLAN-04: Record phased architecture, dependencies, known gaps and validation requirements.

## Slice 0: Import decisions

Finish these before copying the affected source code or data.

- [x] SRC-001 (no dependency): Resolve source code license and archive redistribution rights; list permitted/excluded assets and dependency notices. Accept: documented origin/license evidence compatible with os-lab, with unlicensed material held out pending resolution.
- [x] SRC-002 (no dependency): Reconcile inventory with source at import time, including seven pages, docs/API, every method, shell and Brain subviews. Accept: pinned revision, upstream-to-destination parity ledger and explicit dispositions for stubs and unavailable data.
- [ ] SRC-003 (SRC-001, SRC-002): Create sanitized detection/crawler/merge/map/session/repository fixtures and provenance/relocation manifest. Accept: reproducible fixtures without proprietary media, keys or personal metadata; checksums and upstream file mapping retained.

## Slice 1: Portable engine and lab foundation

Establish a usable static analysis path independently of optional runtime tools.

- [x] SRC-010 (SRC-003): Import analyzers/binfmt/evidence/collectors/CLI/tests under `source-lab/engine/`, isolate imports from existing Android modules and retain provenance. Accept: retained suite passes in its documented environment and importing either lab cannot shadow the other.
- [x] SRC-011 (SRC-010): Configure resource/work roots and gitignored storage, fixtures, `.env.example` and portable launchers. Accept: clean checkout operates with explicit paths and no `/home/pod` dependency; generated data never pollutes code/catalog inputs.
- [x] SRC-012 (SRC-010): Export V2 evidence and structural-map schemas; add validation/generated frontend contracts and format compatibility fixtures. Accept: unsupported versions/errors are visible; no hand-maintained duplicate schema.
- [x] SRC-013 (SRC-011): Add Makefile/preflight/setup and `labctl source` dispatch, supported verbs, doctor/status and `all` handling. Accept: static runs need Python/storage only; unsupported VM verbs give a useful error and existing lab dispatch still works.
- [x] SRC-014 (SRC-010, SRC-011): Verify auto/explicit detection on browser/userscript, Windows/Electron, macOS, Android and iOS fixtures; preserve rule families/H1-H5 and all CLI reports including STIX. Accept: expected evidence/coverage artifacts for every platform, including parser failures/caps.
- [x] SRC-015 (SRC-010, SRC-011): Import sourcemap CLI/VFS/adapters/resolver/filter/rank/export functions. Accept: disk/ASAR, supported languages, generate/query, JSON/Markdown/DOT, fallback parsers and binary-only not-applicable tests pass.

## Slice 2: Console and contracts

Integrate with the existing console protections, readiness model and jobs.

- [ ] SRC-020 (SRC-012, SRC-013): Add `source` to console lab metadata/order, host reports, capability/action models and frontend LabId maps. Accept: required/optional readiness and unavailable hosts are correct without KVM/Docker.
- [ ] SRC-021 (SRC-020): Implement namespaced handler adapters for every inventory API method, query/body and response/error contract. Accept: method-by-method contract tests and intentional deviations documented; hello-world stub retired explicitly.
- [ ] SRC-022 (SRC-021): Integrate exact-option previews, background logs/progress, conflict handling, timeout/cancel/process-tree cleanup and interrupted-on-restart reporting. Accept: two runs cannot corrupt the same output and cancelled/interrupted jobs cannot show success.
- [ ] SRC-023 (SRC-021): Enforce localhost/mutation guards, allowlisted target/resource/session paths, symlink/traversal rejection, read caps and secret redaction. Accept: hostile-request regression tests pass and logs/responses disclose no credentials.
- [ ] SRC-024 (SRC-021, SRC-023): Port managed runtime settings/key generation/rotation/default canary URL and integrity verification. Accept: environment ownership/precedence, mode 0600, rotation warnings and tampered/missing-signature cases tested; key values never reach UI.
- [ ] SRC-025 (SRC-024): Preserve browser canary and all four native importer libraries. Accept: signed sessions can be reviewed/correlated, synthetic events are clearly marked and cannot masquerade as live proof; absent native collector workflows stay explicit.
- [ ] SRC-026 (SRC-021, SRC-023): Serve bounded findings/coverage/events and allowlisted report downloads. Accept: source five HTTP formats work, CLI STIX remains available, and adding HTTP STIX is tracked explicitly if chosen.

## Slice 3: Dashboard shell, overview and evidence

Use os-lab's static pages, existing shell and locale/base-path helpers.

- [ ] SRC-030 (SRC-020): Add `/labs/source/`, `/source/` and nested routes, sidebar/icon/availability, mobile navigation, theme and record Spotlight. Accept: all inventory destinations and query links resolve locally, with accessible keyboard/focus behavior.
- [ ] SRC-031 (SRC-021, SRC-030): Port Overview matrices (properties/backgrounds/dependencies/permissions), inspector, annotations, counts, filters, sources and CSV downloads. Accept: fixture results match the source UI and all tabs have loading/empty/error states.
- [ ] SRC-032 (SRC-022, SRC-031): Port source-list crawler runner/options/progress/logs and H1-H5 reference. Accept: configured inputs validated, preview/run/cancel workflow works and failures render beside actions.
- [ ] SRC-033 (SRC-025, SRC-026, SRC-030): Port Evidence findings/state/severity/scorecard/spans/coverage/verification, target/platform runner, polling/cancel, session list/timeline and reports. Accept: five-platform fixture journeys preserve evidence levels and explain partial coverage.
- [ ] SRC-034 (SRC-024, SRC-033): Port runtime key controls, two-step rotation, canary URL/default/toggle, Playwright warning and session selection. Accept: missing-required versus optional tooling, synthetic mode and environment-owned keys render correctly.

## Slice 4: Deep analysis, pipeline, merger and Brain

Keep structural maps distinct from evidence and expose snapshot provenance.

- [ ] SRC-040 (SRC-011, SRC-022): Import crawler/list parsing/CSV merge and route adapters, worker/depth/cap/resume/rate-limit controls. Accept: fault-isolated stages, interrupt artifacts and selected-target workspace/token guards pass tests.
- [ ] SRC-041 (SRC-015, SRC-030, SRC-040): Port Deep analysis bundle/source/AST browsing and Map dialog (stats/roles/targets/coverage/symbols/imports/entrypoints). Accept: `?repo=`/`&file=` deep links and legacy AST behavior work; missing artifacts show useful states.
- [ ] SRC-042 (SRC-040, SRC-041): Port merge planning/eligibility/exclusions/flagged override/run/cancel, ZIP/report downloads and output markers. Accept: generated benign MV3 bundle smoke, optional Node syntax gate warning and overwrite protections verified.
- [ ] SRC-043 (SRC-030, SRC-040): Port Pipeline API/flowchart/stages/network/heuristics/candidates and bundled fallback. Accept: stage details match the pinned snapshot and its date is visible; no claim of automatic regeneration.
- [ ] SRC-044 (SRC-003, SRC-030): Prototype Brain's data/provider hooks and React/Astro embedding. Accept: documented feasibility for each inventory subview, dependency licenses checked and snapshot/API roots portable.
- [ ] SRC-045 (SRC-044): Port Brain graph/tabs/filter/legend/usages/source/history/diff/flowchart/sequence/AI-rules/complexity/risk/stress/export and virtual store behavior. Accept: each usable upstream view has a fixture-backed check; absent providers show explicit unavailable states.

## Slice 5: Repository manager

Prove storage compatibility before switching repository consumers.

- [ ] SRC-050 (SRC-003, SRC-011): Spike Python SQLite against disposable legacy DB and source schema/query behavior. Accept: all tables/joins/counts/sorts/filters/pagination match and the framework-port decision is recorded.
- [ ] SRC-051 (SRC-050): Implement versioned transactional migrations/backup, idempotent source sync and automatic classification. Accept: repeated sync retains vanished repos, manual tags/categories/notes and evidence identities; rollback restores prior DB.
- [ ] SRC-052 (SRC-021, SRC-051): Port repositories/details/analysis/dependencies/files/evidence/sync APIs and taxonomy CRUD. Accept: contract tests cover system taxonomy protection, note edits, counts and safe path handling.
- [ ] SRC-053 (SRC-030, SRC-052): Port repository table/filter/tag/category counts/sorting/pagination, query selection, five detail tabs and taxonomy manager. Accept: edit-sync-refresh preserves user data and Spotlight finds repositories.

## Slice 6: Skills, implementation search and references

Keep human and agent consumers aligned with the migrated API.

- [ ] SRC-060 (SRC-021, SRC-030, SRC-052): Port shipped skill catalog and data/implementations/repos generators, implementation search and Skills UI. Accept: browse/copy/download/generate/search return accurate current data and every example uses namespaced routes.
- [ ] SRC-061 (SRC-021): Generate OpenAPI from the implemented API contract and render `/source/api-docs/`. Accept: every inventoried retained method is present; statuses, downloads and runtime limitations are documented.
- [ ] SRC-062 (SRC-014, SRC-015, SRC-045, SRC-053, SRC-060): Publish portable Source Lab docs and graph links, update README/setup/labctl/dashboard/tooling graph nodes as features ship. Accept: docs distinguish shipped features from upstream backlog, links resolve and `lat check` passes.

## Slice 7: Distribution, import and release

Release only after both installed-console and public-site behavior is verified.

- [ ] SRC-070 (SRC-013, SRC-024): Integrate Linux/macOS/Windows install/update/minimal paths and optional parser/browser tools; adapt useful service/docs/skill operations. Accept: fresh install/update without source checkout; Python core works without Bun/Next/Node/KVM and optional tools have honest remediation.
- [ ] SRC-071 (SRC-001, SRC-011, SRC-024, SRC-051): Implement opt-in legacy dry-run/copy/import for resources/artifacts/maps/AST/sessions/DB/settings with path mapping and backups. Accept: counts/hashes/signatures/manual edits verified, originals unchanged and rollback documented/tested.
- [ ] SRC-072 (SRC-030 through SRC-062): Complete all active locale catalogs and Pages equivalents. Accept: `/os-lab/` links, English/non-English switching, docs/samples/deep routes work; local-only actions/engine polling/private outputs are absent from public build.
- [ ] SRC-073 (SRC-070, SRC-071, SRC-072): Run engine/console regression tests and relevant repository checks, shell syntax and installer parse checks; dashboard check/i18n/build/e2e and browser local/Pages smoke. Accept: commands/results recorded, committed `dashboard/dist` current and existing labs pass.
- [ ] SRC-074 (SRC-002, SRC-062, SRC-073): Audit every inventory row/subfeature and API method, finalize attribution/legal notices and release/runbook/rollback docs. Accept: no silent omissions, all exceptions reviewed and each claimed capability has validation evidence.

## Follow-up backlog carried from upstream

These items are not already shipped features and must not be confused with parity.

- [ ] NEXT-01: Decide platform-specific overview/targets/evidence navigation and new datasets/crawlers for userscripts, desktop/mobile applications, MCP servers and own repositories.
- [ ] NEXT-02: Add real native collection workflows and the research-only Windows memory/IAT/EAT, Apple IMP/prologue and Android process/ART checks with authorized targets and provenance.
- [ ] NEXT-03: Regenerate Brain/Pipeline data reproducibly or replace snapshots with generated maps.
- [ ] NEXT-04: If remote deployment is requested later, design authenticated access; external upstream gates do not transfer automatically.
