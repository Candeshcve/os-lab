# Plan: os-lab UX guideline patch

## Working rules and owner request

The owner's request: "i mean best ux guideline patch for os-lab repo not qlar" and "regarding my prompts i asked in plan of qlar ux guidelinepatchs consider im asking same style prompts best fffor os-lab and regarding that analyze and create todo for its ux parts detailed which and agent can patch by reading plan and todo with smallest code read." This draft PR is the plan/todo home. It does not authorize claims that untested host or device behavior works.

- Ship each stable code item below in its own non-draft PR against fresh `master` when sound. Keep this draft PR as the tracking home; link and mark split PRs in the [todo](UX_GUIDELINE_PATCH_TODO.md). A coherent pair of tiny items may share a PR only when they touch the same surface and verification.
- Before a slice, read its **First read** paths and the matching test, then inspect only direct callers/types needed for the change. Read [AGENTS.md](../AGENTS.md), [UX readiness](UX_READINESS.md), and [the UX graph node](../lat.md/ux-readiness.md) for shared rules. The broad inventory is a reconciliation task, not a reason to read the whole repository before each fix.
- Preserve working actions, Source Lab destinations, downloads, locale routes, and local/public separation. The [Source inventory](../source-lab/INVENTORY.md) records retained and excluded features; the [Source TODO](../source-lab/TODO.md) has completed UI work. Do not revive excluded integrations or treat an older sentence in the Source plan as current implementation status.
- The guideline update is **standard plus enforcement**: write measurable rules into `UX_READINESS.md`, then patch verified violations. Do not style-churn a working page merely to satisfy an abstract rule. Record a reproduction or code-level failure before changing behavior.
- Update the relevant `lat.md/` node when behavior changes. Rebuild committed `dashboard/dist/` for dashboard source changes. PR bodies report checks run, concrete before/after evidence, and untested host/device paths.

## Grounded baseline

`docs/UX_READINESS.md` already covers host-derived readiness, required versus optional setup, exact action previews, configured endpoints, secrets, public Pages separation, feedback, and core checks. This PR corrects one concrete drift: it said seven locale catalogs, while `dashboard/src/firewall/locale.ts` declares eight (`en`, `tr`, `de`, `fr`, `es`, `it`, `fa`, `ar`). Derive coverage from the active catalog list.

Current code also exposes these focused candidates:

| ID | Evidence in `master` | Required outcome |
| --- | --- | --- |
| A | `dashboard/src/views/jobs-page.tsx`, `JobLog` cancel handler awaits `api.cancel()` with no catch or visible error; a failed request leaves the user with no adjacent explanation. | Show submit/cancel progress, failure beside Cancel, and a safe retry; keep server state authoritative. |
| B | `dashboard/src/views/public-home.tsx` silently swallows latest-release fetch errors and `Copy` calls `navigator.clipboard.writeText()` without a result state. | Make lookup failure and clipboard success/failure understandable, with a working manual next step. Do not claim a specific installer asset exists when lookup failed. |
| C | `dashboard/src/styles/iux.css` sets `.iux-btn` and icon buttons to 32 px; shared shell buttons use it in `dashboard/src/shell/app-shell.tsx`. `dashboard/src/views/firewall-page.tsx` has a small text-only alternatives toggle. | On coarse pointers, give interactive controls a usable target (44×44 CSS px where feasible), without inflating desktop layout; verify dense cases and adjacent-target separation. |
| D | `dashboard/src/views/source/brain.tsx` implements keyboard-selectable SVG nodes and URL state, while Source routes are defined in `dashboard/src/views/source/pages.tsx`. This is existing functionality, not a defect claim. | Audit focus, readable graph alternative, query/deep-link preservation, and no clipping; patch only reproduced failures. |
| E | `dashboard/src/views/lab-page.tsx` already previews actions and reports poll/cancel failures; `dashboard/src/views/source/action.tsx` has an exact-preview workflow. | Reconcile the same failure/recovery contract across host, lab, Source, and Android without duplicating good behavior. |
| F | `dashboard/src/shell/app-shell.tsx` uses native dialogs for the mobile drawer; `dashboard/src/shell/spotlight.tsx` has search semantics. | Check the complete keyboard/focus/return path, sticky bar, mobile width, theme, and RTL on representative routes; patch reproduced gaps. |
| G | `dashboard/README.md` says public deployment filters Astro output into `dashboard/build-pages/`; `lat.md/ux-readiness.md` requires Source and How-to-use smoke on that final artifact. | Acceptance must inspect the filtered artifact, not just the raw Pages build. |

These are code observations. A, B, and C support immediate scoped implementation. D–G require a short evidence pass before code changes. Keep verified pass results in the todo, rather than opening redundant PRs.

## UX contract to add to the guideline

1. **Action truth.** A visible action is backed by a current capability and host report. Required and optional prerequisites are separate. The preview identifies target/options, command/effects, privileges, and downloads; changed options invalidate confirmation. An unavailable control gives a reason and a manual or retry path where one exists.
2. **Job recovery.** Submission, polling, cancellation, and refresh failures appear beside the initiating control or job. Pending/running/succeeded/failed/cancelled/interrupted states come from the backend. A lost connection or cancelled request never becomes a false success. Duplicate or conflicting submission is prevented while still allowing safe retry after failure.
3. **Evidence truth.** Configured addresses are not observed services. Imported/synthetic/partial Source results are labeled with provenance and time where relevant; missing optional tooling and empty coverage do not imply a clean live target. Private artifacts and secrets stay out of public Pages.
4. **Native-feeling web UX.** Navigation and overlays have clear focus order and return focus, keyboard/Escape behavior, visible focus, and usable coarse-pointer targets. Shared controls work at narrow width, text zoom, light/dark themes, and Arabic/Persian RTL. A dense data table may scroll inside its own region; the whole page should not pan sideways because of one child.
5. **Public truth.** Pages under `/os-lab/` offer information and browser-only features without local engine polling or inert local controls. Locale/base links, deep-link queries, feedback/legal/security routes, release lookup, and copy actions have understandable success/failure states. Visible copy is complete in every active catalog.
6. **Concise copy.** Show dynamic warnings and consequences where they matter. Avoid repeating a standing “ready” statement or a paragraph that duplicates the control itself. Keep setup, security, and irreversible-action warnings intact; move secondary detail into a discoverable location.

## Stable points and acceptance

| Point | Smallest scope and first read | Acceptance evidence |
| --- | --- | --- |
| 0. Guideline text | `docs/UX_READINESS.md`, `lat.md/ux-readiness.md` | Add the six contracts above as reviewable rules; keep current working rules; `lat check` after graph edits. |
| A. Jobs cancel feedback | `dashboard/src/views/jobs-page.tsx` (`JobLog`), `dashboard/src/views/lab-page.tsx` (`JobCard` as reference), `dashboard/e2e/health-and-content.spec.ts` | Rejected cancel request is visible at the job, button does not double-submit, retry remains possible, success refreshes server state. |
| B. Public home async feedback | `dashboard/src/views/public-home.tsx`, `dashboard/e2e/health-and-content.spec.ts` | Release lookup failure shows an honest fallback; copy success and clipboard rejection have accessible status and manual-copy route; no permanent “checking” label. |
| C. Coarse-pointer controls | `dashboard/src/styles/iux.css`, `dashboard/src/shell/app-shell.tsx`, `dashboard/src/views/firewall-page.tsx` | Representative shell, action, dialog, and Firewall controls have usable hit areas on coarse pointer; desktop density, focus ring, and narrow/RTL layout remain sound. |
| D. Local action parity | `dashboard/src/views/host-page.tsx`, `lab-page.tsx`, `source/action.tsx`, `android/common.tsx`, `jobs-page.tsx` | Matrix records exact-preview, required/optional, busy/conflict, cancel/poll error, retry and manual guidance for each; patch only failed cells. |
| E. Shell and Source navigation | `dashboard/src/shell/{app-shell,sidebar,spotlight,top-bar}.tsx`, `dashboard/src/views/source/{pages,brain}.tsx`, `dashboard/e2e/source.spec.ts` | Mobile drawer/Spotlight focus and Escape, deep-link queries, graph selection, sticky header, zoom/narrow/RTL pass or have focused fixes. |
| F. Source evidence | `dashboard/src/views/source/{evidence,pipeline,brain,overview}.tsx`, `source-lab/INVENTORY.md`, `dashboard/e2e/source.spec.ts` | Live/synthetic/imported/partial/unavailable and empty-coverage wording remain truthful; retained reports/downloads/routes still work. |
| G. Public Pages and locale | `dashboard/src/views/{public-home,how-to-use-page,firewall-page,feedback-page,legal-page}.tsx`, `dashboard/src/i18n/paths.ts`, `dashboard/src/firewall/locale.ts` | Final filtered artifact has all active locale routes, browser-only features, base-aware links, non-English query-preserving switch, RTL/mobile, and no private/local operations. |
| H. Copy sweep | `dashboard/src/views/{host-page,lab-page,jobs-page}.tsx`, `dashboard/src/views/source/*.tsx` | List exact repetitive/ambiguous copy with replacement/removal proposal; patch selected candidates in small surface PRs while retaining safety and operational guidance. |

Points D–H are review gates. If a point passes, close it with test or manual evidence and no code PR. Do not infer missing features from this table.

## Verification and completion

For each dashboard code PR, run in `dashboard/`: `npm run check`, `npm run test:i18n`, `npm run build`, and scoped `npm run test:e2e -- <spec>`; use the full E2E suite when shared shell or public routing changes. Run relevant console tests and `scripts/run-tests.sh` when contracts or committed distribution output change. `git diff --check` is required. Run `lat check` after graph changes. Record pre-existing failures separately from introduced failures.

For public Pages, build with `PUBLIC_SITE_MODE=pages SITE_BASE=/os-lab`, run `scripts/deploy-page.sh --dry-run`, and smoke the **filtered** `dashboard/build-pages/` artifact with `node dashboard/scripts/source-pages-smoke.mjs dashboard/build-pages` and `node dashboard/scripts/how-to-use-pages-smoke.mjs dashboard/build-pages` when their routes are involved. Check English and non-English deep links, Arabic/Persian RTL, mobile drawer, feedback/legal links, and absence of local API calls/private outputs. Do not call a raw Astro build the deployed artifact.

Automated tests do not prove native host and physical-device behavior. Record platform, device, viewport, actual route/state exercised, and remaining limits. Keep this tracker draft until required manual acceptance is recorded or the owner explicitly accepts the limits.
