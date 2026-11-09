# Source Lab migration inventory

This is the parity baseline for the proposed Source Lab. Paths in this document
refer to the source repository unless explicitly described as os-lab destinations.
No entry here claims the migration is implemented.

## Snapshot and evidence

The inventory was inspected on 2026-11-09 from `/home/pod/iQ-SourceContol` at
commit `51ce20b6210ab5a98a2dd2653b230bdf2282f93c` ([source repository](https://github.com/keyvanarasteh/iQ-SourceContol)).
The local checkout has an unrelated `.gitignore` modification; it is excluded.
The os-lab base is fetched `origin/master` at
`9b971c44596a4636dfe5230daab1abeb9568c04d`.

Read source `AGENTS.md`, `engine/AGENTS.md`, `lat.md/lat.md`, `architecture.md`,
`status.md`, `ui.md`, `repos.md`, `analyzers.md`, `repo-map.md`, `pipeline.md`,
`evidence-model.md`, `runtime-sessions.md`, `correlation.md`, `reports.md`,
`cli.md`, `deployment.md`, `archive.md`, and `TODO.md` alongside the route handlers.
Source `lat check` passes. Historical test counts in source status are claims
from its October snapshot, not tests rerun for this planning PR.

## App pages

All seven `page.tsx` routes have a proposed destination in the existing dashboard.
The route names below are logical paths; locale and Pages base prefixes must be
applied through os-lab's path helpers.

| Source route | Proposed os-lab route | Source file |
|---|---|---|
| `/brain` | `/source/brain/` | `ui/src/app/brain/page.tsx` |
| `/deep-analysis` | `/source/deep-analysis/` | `ui/src/app/deep-analysis/page.tsx` |
| `/evidence` | `/source/evidence/` | `ui/src/app/evidence/page.tsx` |
| `/` | `/source/` | `ui/src/app/page.tsx` |
| `/pipeline` | `/source/pipeline/` | `ui/src/app/pipeline/page.tsx` |
| `/repos` | `/source/repos/` | `ui/src/app/repos/page.tsx` |
| `/skills` | `/source/skills/` | `ui/src/app/skills/page.tsx` |

Additional surfaces: `/docs/[[...path]]` maps to `/source/docs/` and nested
document routes; `/api-docs` maps to `/source/api-docs/`. Preserve docs navigation,
API-reference rendering and spec downloads. `/labs/source/` is the new os-lab
readiness/lifecycle page, beyond the seven source pages.

| Page or shared surface | Required parity |
|---|---|
| Overview | Merged manifest property matrix and CSV export, MV2/MV3 migration annotations, background/service-worker matrix and filters, dependencies, permissions, extension inspector; curated/monitored source catalogs and downloads; source-list crawler runner, workers/options, progress/logs; H1-H5 signature reference. |
| Evidence | Target/platform selection, run/poll/cancel, state/severity filters, confidence, source/binary spans, hypothesis, alternatives, remediation, coverage and limitations; H1-H5 scorecard and decisive tests; runtime key status/generate/two-step rotate, canary URL/default/toggle, Playwright readiness, prior-session selection and event timeline; existing report downloads. |
| Deep analysis | Repository selection/search, bundle status, manifest/threat/dependency/file/metadata views, AST and source browsing with `?repo=` and `&file=` links; repo-map stats, roles, targets, coverage, symbols/imports and entrypoints; selected-target crawler options/logs/cancel; merge preview, exclusions, flagged override, run/cancel and folder/ZIP/report results. |
| Pipeline | Stage flowchart, inputs/outputs, network calls, GitHub requests, signatures, risk rules, manifest candidates and flow steps; explicit bundled-data fallback. |
| Repositories | Text/category/all-selected-tag filters and counts, sorting/pagination, `?repo=owner/name` selection, metadata/overview/analysis/dependencies/file-tree/evidence tabs; notes and manual tag/category edits; taxonomy CRUD and protected system entries; sync status and counts. |
| Brain | Tabs, graph/filter/legend/sidebar, usages, source, file history, side-by-side diff, flowchart and sequence views, AI-rules dialog, complexity/riskiest-files/stress panels, export, theme and virtual graph. Distinguish available snapshot data from controls whose data/provider is absent. |
| Skills | Shipped skill browse/search/copy/download; live skill generation for data, implementations and repos; implementation catalog search and API links. |
| Shell | Source Lab navigation inside the existing os-lab sidebar, grouped analysis links, mobile behavior, keyboard Spotlight with section/record search, light/dark theme, docs/API links, accessible focus and loading/empty/error states. |

## HTTP route census

This table is generated from all source `api/**/route.ts` exported HTTP handlers.
It is an implementation checklist, not a promise of binary-compatible URLs:
internal clients and skills move together to the namespaced API. Preserve query,
body, status, file download and cancellation semantics or document an intentional
change and add a contract test.

| Source route | Methods | Proposed destination |
|---|---|---|
| `/api/analyzer/merged` | GET | `/api/source/analyzer/merged` |
| `/api/analyzer` | GET, POST | `/api/source/analyzer` |
| `/api/brain/files/[...path]` | GET | `/api/source/brain/files/[...path]` |
| `/api/brain` | GET | `/api/source/brain` |
| `/api/deep-analysis/merge` | GET, POST | `/api/source/deep-analysis/merge` |
| `/api/deep-analysis` | GET, POST | `/api/source/deep-analysis` |
| `/api/detection` | GET, POST, DELETE | `/api/source/detection` |
| `/api/evidence/report` | GET | `/api/source/evidence/report` |
| `/api/evidence` | GET | `/api/source/evidence` |
| `/api/implementations` | GET | `/api/source/implementations` |
| `/api/openapi` | GET | `/api/source/openapi` |
| `/api/pipeline` | GET | `/api/source/pipeline` |
| `/api/repo-categories/[key]` | PATCH, DELETE | `/api/source/repo-categories/[key]` |
| `/api/repo-categories` | GET, POST | `/api/source/repo-categories` |
| `/api/repo-tags/[key]` | PATCH, DELETE | `/api/source/repo-tags/[key]` |
| `/api/repo-tags` | GET, POST | `/api/source/repo-tags` |
| `/api/repos/[owner]/[name]/analysis` | GET | `/api/source/repos/[owner]/[name]/analysis` |
| `/api/repos/[owner]/[name]/dependencies` | GET | `/api/source/repos/[owner]/[name]/dependencies` |
| `/api/repos/[owner]/[name]/evidence` | GET | `/api/source/repos/[owner]/[name]/evidence` |
| `/api/repos/[owner]/[name]/files` | GET | `/api/source/repos/[owner]/[name]/files` |
| `/api/repos/[owner]/[name]` | GET, PATCH | `/api/source/repos/[owner]/[name]` |
| `/api/repos` | GET | `/api/source/repos` |
| `/api/repos/sync` | GET, POST | `/api/source/repos/sync` |
| `/api` | GET | Retire hello-world stub; use os-lab health |
| `/api/settings/runtime` | GET, POST | `/api/source/settings/runtime` |
| `/api/skills/generate` | GET | `/api/source/skills/generate` |
| `/api/skills` | GET | `/api/source/skills` |
| `/api/sources` | GET | `/api/source/sources` |
| `/api/spotlight` | GET | `/api/source/spotlight` |

## Engine and data capabilities

The core detection path uses Python 3.11+ standard library modules; optional
collectors and parsers have separate requirements.

| Area | Baseline to preserve | Source anchors |
|---|---|---|
| Detection | Auto/explicit browser-extension, windows-app, macos-app, android-app, ios-app; browser/userscript rules, PE imports/exports/DLL proxy/CLR and Electron/WebView2/ASAR/fuses, Mach-O signatures/entitlements/dyld/ObjC, Android XML/DEX/ELF/APK signing, iOS IPA/provisioning/frameworks/WKWebView. | `engine/analyzers/`, `cli/run_detection.py`, `lat.md/analyzers.md` |
| Evidence | V2 findings/coverage, five states, six severities, target identity, H1-H5 scoring, verification tests, correlation and confidence, replay-script library helper. | `engine/evidence/`, `lat.md/evidence-model.md`, `correlation.md` |
| Runtime | Signed session metadata/events/artifacts/manifests; HMAC resolution/verification; browser canary; Windows/macOS/Android/iOS telemetry importer libraries. | `engine/collectors/`, `evidence/session.py` |
| Reports | `analysis-v2.json`, `findings.json`, `coverage.json`, `report.sarif`, `summary.md`, `report.stix.json`; all CLI output-format options. | `engine/evidence/report.py`, `lat.md/reports.md` |
| Crawler | Single/list/CSV/XLSX/scan-dir inputs, acquisition/resume/retries/rate limits/workers/depth/caps, manifest score and priority, threat/dependency/tree/metadata/AST/map stages, partial failures and interruption artifacts. | `engine/pipeline/ext_repo_analyzer.py` |
| Merger and datasets | MV2/MV3 eligibility, flagged override, service-worker checks, shims/namespacing/manifest folding, Node syntax check when available, overwrite marker guard, ZIP/report/hub output; source CSV joining/enrichment. | `engine/pipeline/ext_merger.py`, `merge_csvs.py` |
| Structural maps | Disk/ASAR/overlay read-only VFS; Python/JS/TS/PHP/Rust/Swift/ObjC/Kotlin/Java/markup/XML/plist adapters; symbols/types/import resolution/roles/rank/cycles/targets/filters; JSON/Markdown/DOT generate/query CLI. | `engine/sourcemap/`, `lat.md/repo-map.md` |
| Repository index | SQLite Repo/Tag/Category/joins/analysis/dependency/file/evidence tables; idempotent union sync, retained vanished repos, replaced automatic taxonomy, preserved manual edits/notes. | `ui/prisma/schema.prisma`, `ui/src/lib/repo-*.ts` |
| Archive and provenance | Explicit resource roots for catalogs, bundles, clones, upload targets, merged outputs, research and own-repository index; original extraction manifests, hashes and attributions; portable ops/docs/skills concepts. | `doc/resources/`, `engine/MANIFEST.csv`, `ui/MANIFEST.csv`, `ops/`, `agent-skills/` |

## Limits and follow-ups

Preserve accurate labels for these limits; do not silently turn them into claims
of implemented live capability.

- Upstream `lat.md/ui.md` says six pages but the actual tree has seven, including
  Skills. The sidebar also includes Repositories. This inventory follows code.
- The source deployment relies on external iBone/core-api gates and absolute-path
  environment settings. It has no in-app authentication and stores run state in
  process memory. Those remote hosts, service names and gates are not portable.
- Without Playwright/extension input, the browser runner can emit synthetic events.
  The migration must label or exclude synthetic evidence from live confirmations.
- Native importers accept already-parsed telemetry through library entry points;
  the source CLI does not launch native collectors. Research-only memory checks
  remain future work.
- Brain and Pipeline use hand-maintained snapshots; no regeneration pipeline exists.
  Optional tree-sitter applies to TS/JS, PHP and Rust; newer language adapters use
  fallback scanners. Binary-only structural maps may be `not_applicable`.
- The engine exports STIX but the existing report HTTP allowlist has five files
  and excludes STIX. Preserve CLI STIX; exposing it in UI is an explicit addition.
- Source `TODO.md` proposes platform-specific navigation/crawlers, MCP targets and
  broader datasets. Preserve that backlog separately from shipped parity; do not
  mark unchecked upstream aspirations as migrated features.
- No top-level source license file was found in the inspected non-archive file
  inventory. Resolve code and dataset redistribution rights and dependency notices
  before importing. The local archive includes personal/repository metadata and
  third-party material; audit and use opt-in resource acquisition where needed.
