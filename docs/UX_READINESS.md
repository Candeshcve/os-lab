# UX readiness guidelines

These guidelines apply to the local dashboard's host and lab pages, the Android workbench, and the public Pages site. The architecture map is in [`lat.md/lat.md`](../lat.md/lat.md); the dashboard-specific graph node is [`lat.md/ux-readiness.md`](../lat.md/ux-readiness.md).

The proposed extension and its tracked acceptance work are in the [UX guideline patch plan](UX_GUIDELINE_PATCH_PLAN.md) and [checklist](UX_GUIDELINE_PATCH_TODO.md).

## Show actions only when they make sense

- Derive setup actions from the current host report. Show **Install dependencies** only when a required prerequisite is missing and the lab exposes a `setup` action. The backend decides the `ready`, `needs-setup`, and `unavailable` states; do not infer readiness from the mere presence of an action.
- Keep optional tooling separate. For example, a missing Appium installation can offer **Install Appium** without making an otherwise ready simulator appear blocked.
- Preview lab actions before running them. A preview must state the command, effects, privileges, and downloads; execution starts only after confirmation.
- Disable an action while its request is being submitted or a conflicting job is running. Put a failed request's error next to the action that failed.
- If no setup action exists, direct users to the relevant manual requirement or platform guidance instead of promising an unavailable install flow.

## Keep the default view compact and honest

- Put configuration files, profiles, and endpoint addresses in a collapsed **Advanced settings** area on lab runtime pages. Keep required dependency status and primary actions visible.
- Describe an address as *configured* until the service is running. A known URL is not proof that it responds. Keep secondary Android endpoint lists collapsed and explain when they are usable.
- Preserve a way to inspect details and copy addresses. Mask secrets before they reach the UI.
- Use explicit loading, empty, success, and error states. Avoid cards that imply an operation succeeded before the API confirms it.

## Match the environment

- The local app can show engine connection and job status. Public Pages has no local engine, so it must not display a perpetual connection indicator or local-only actions as if they work there.
- Build internal links with the locale and the Pages base path. Test language switching both from English and from a non-English route under `/os-lab/`.
- Keep feedback reachable from local and public navigation. Bug and feature links use repository issue templates; discussions handle general feedback; vulnerability reports go to a private security channel.
- Add visible UI copy to every active locale catalog (currently eight, as defined by `FIREWALL_LOCALES` in `dashboard/src/firewall/locale.ts`) and run the translation check.

## Review and verification

Check ready, missing-required, missing-optional, unavailable, loading, and failed-request states on each relevant page. Smoke-test every page type for hydration errors. For dashboard changes, run `npm run check`, `npm run test:i18n`, `npm run build`, and `npm run test:e2e` in `dashboard/`. When Pages routing changes, build with `PUBLIC_SITE_MODE=pages` and `SITE_BASE=/os-lab`, then test links and locale switching in a browser. Run `lat check` after changing `lat.md/`.
