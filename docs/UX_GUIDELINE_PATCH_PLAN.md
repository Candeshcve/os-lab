# UX guideline patch plan

## Purpose and baseline

Extend [UX readiness](UX_READINESS.md) into an actionable review contract for the local console and public Pages site. Preserve working capabilities and route destinations while making state, action, evidence, accessibility, and deployment behavior verifiable. This plan records proposed work; it does not assert that a listed risk is a current bug.

The baseline is the current implementation, not an older roadmap statement. Before an implementation slice, compare [the architecture graph](../lat.md/lat.md), [dashboard behavior](../dashboard/README.md), [Source Lab inventory](../source-lab/INVENTORY.md), [Source Lab plan](../source-lab/PLAN.md), and the live route/action code. Record what is already covered and what is genuinely missing. Source Lab's TODO contains completed UI and Pages work, so do not reopen it merely because its plan introduction describes an earlier state. Keep excluded Source integrations excluded.

The readiness guide incorrectly said seven catalogs. `dashboard/src/firewall/locale.ts` currently declares eight (`en`, `tr`, `de`, `fr`, `es`, `it`, `fa`, `ar`). Use the active locale source during future changes instead of carrying a count into code or tests.

## Surfaces and contracts

| Surface | UX contract to verify or add |
| --- | --- |
| Shared shell and navigation | Every visible route has a reachable title, current-location cue, usable mobile navigation, predictable keyboard focus, and locale/base-aware links. Theme, viewport width, text zoom, and RTL direction must not hide controls or content. |
| Local host, lab, and jobs pages | Readiness and available actions come from the live host report. Required and optional dependencies stay distinct. An operation displays the exact target/options and effects before confirmation, prevents duplicate/conflicting submissions, then reports pending, running, success, failure, cancellation, and interrupted/reconnected states from the server. A stale preview must be rejected and explained beside the action. |
| Android workbench | Apply the local action and job contract to setup, device, and analysis controls. Keep endpoint addresses labeled configured until probed; expose copy/details without displaying secrets. Show why a control is unavailable and how to recover when possible. |
| Source Lab | Preserve the retained destinations, query parameters, reports/downloads, Spotlight, Brain subviews, and mobile navigation listed in its inventory. Distinguish live, imported, synthetic, partial, missing-tool, and unavailable evidence. Empty coverage must not imply a clean target. Show collection or job errors near the initiating action. |
| Firewall and other public content | Keep informational and interactive browser-only content usable under `/os-lab/` in every active locale. Public Pages must not imply a connected local engine, offer local-only operations, poll private APIs, or include private findings. Keep install next steps, feedback, legal, and security routes discoverable. |

### Cross-cutting review rules

- Review loading, empty, ready, missing-required, missing-optional, unavailable, submitting, running, success, failure, cancellation, and interrupted states where they apply. A state absent from a particular surface is marked not applicable with a reason, not simulated as a product feature.
- Check the exact action target, options, privileges, downloads, and effects in previews. A changed target or options invalidates the preview. Errors identify the failed action and provide a safe retry or manual next step.
- Keep observed status distinct from configured addresses and imported or sample data. Timestamp/provenance and partial-result caveats stay visible where users could mistake them for current live evidence.
- Verify semantic names, focus order/visibility, Escape behavior for dismissible layers, keyboard operation, touch target usability, screen reader state announcements where asynchronous state changes matter, contrast in both themes, text zoom, narrow screens, and Arabic/Persian RTL. Assess each relevant control rather than assuming a shared component covers every page.
- Preserve current capability and route parity. Do not remove a working action, analysis view, download, locale, or deep link to make an interface appear simpler. A removal needs a separately approved product decision.
- Keep secrets masked in the browser and public artifacts. Public mode must make its informational scope clear while retaining usable browser-only features.

## Delivery

Use the [checklist](UX_GUIDELINE_PATCH_TODO.md) as the work queue. Ship small, reviewable PRs by surface. First inventory current behavior and evidence; then update `UX_READINESS.md` with the accepted rules; then patch only verified gaps. Update `lat.md/` alongside shipped behavior. Rebuild committed `dashboard/dist/` when dashboard source changes. Give every PR its own before/after evidence and disclose any untested host or device path.

## Acceptance and verification

For the guideline text, confirm relative links, `git diff --check`, and `lat check` if the graph changes. For dashboard implementation, run from `dashboard/`: `npm run check`, `npm run test:i18n`, `npm run build`, and `npm run test:e2e`; add focused state tests for changed flows. Run `scripts/run-tests.sh` where an implementation touches console contracts or generated dashboard output.

For public Pages, build with `PUBLIC_SITE_MODE=pages SITE_BASE=/os-lab`, run `scripts/deploy-page.sh --dry-run`, and inspect the final filtered `dashboard/build-pages/` artifact. Run the Source and How-to-use Pages smoke scripts against that artifact when those routes are affected. Check English and a non-English deep link, a query-preserving locale switch, Arabic/Persian RTL, mobile navigation, feedback/legal links, and absence of local API calls and private outputs. A raw Astro build alone does not establish the deployed site behavior.

Automated checks support but do not replace manual review of actual host and device capabilities. Record which platform/device was exercised, and keep unverified paths explicit in the PR body. Do not mark the full patch complete while required device-specific acceptance remains unperformed.
