# UX guideline patch checklist

This checklist implements the [plan](UX_GUIDELINE_PATCH_PLAN.md). Check an item only with a linked PR or concrete review evidence; mark already-satisfied behavior with evidence instead of changing it again.

## 0. Ground the baseline

- [ ] UX-01: Inventory local and public routes, active locales, shared shell controls, existing tests, and retained Source Lab destinations against current code. Record already-covered behavior and actual gaps.
- [ ] UX-02: Capture the local readiness/action/job state matrix and public Pages capability matrix. Identify unavailable host/device paths and the evidence needed to close them.

## 1. Set the guideline contract

- [ ] UX-03: Expand `UX_READINESS.md` with the cross-cutting state, preview, job recovery, configured-versus-observed, evidence provenance, accessibility, responsive/RTL, and public-artifact rules from the plan. Acceptance: each rule has a measurable review condition and relevant source/tests are linked.
- [ ] UX-04: Reconcile `lat.md/ux-readiness.md` and related graph nodes with shipped behavior when the guideline or implementation changes their documented contract; run `lat check`.
- [x] UX-05: Correct the outdated seven-locale wording in `UX_READINESS.md`; derive future locale coverage from the active catalog list.

## 2. Verify and patch surfaces

- [ ] UX-06: Shared shell/local navigation. Verify keyboard and mobile routes, focus/overlay behavior, theme, zoom, narrow width, and RTL; patch confirmed gaps with focused browser checks.
- [ ] UX-07: Host and lab readiness/actions. Verify required versus optional setup, unavailable/manual guidance, exact-option preview, stale-preview feedback, conflict handling, and colocated errors across representative labs.
- [ ] UX-08: Jobs and recovery. Verify submitting/running/success/failure/cancel/interrupted/reconnect states, progress/log readability, safe retry, and prevention of false success.
- [ ] UX-09: Android workbench. Verify device/analysis controls, endpoint truth, secret masking, error recovery, keyboard/touch behavior, and representative host/device paths.
- [ ] UX-10: Source Lab. Verify retained routes/query links, reports/downloads, Spotlight/Brain, provenance and live/synthetic/partial/unavailable states, empty coverage wording, and action errors against the Source inventory.
- [ ] UX-11: Firewall and public content. Verify locale-specific copy, browser-only controls, install next steps, feedback/legal/security destinations, and public/local separation.

## 3. Validate the shipped result

- [ ] UX-12: Run scoped dashboard type, translation, build, and browser checks; focused console tests when contracts change; rebuild committed `dashboard/dist/` for source changes. Record commands and failures in each PR.
- [ ] UX-13: Build and filter public Pages, then smoke the final `dashboard/build-pages/` artifact across active locales, deep links, base paths, mobile/RTL, and absence of local calls/private output.
- [ ] UX-14: Record manual local host and relevant physical-device checks, including platform, result, and remaining limits. Keep the tracker open for any required unverified path.
- [ ] UX-15: Reconcile the acceptance matrix with merged PRs and evidence; close the patch only when every required criterion is satisfied or an explicit owner-approved exception is recorded.
