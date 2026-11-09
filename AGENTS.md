# Working in os-lab

[`lat.md/lat.md`](lat.md/lat.md) is the entry point to the project's main architecture and behavior documentation. Read the relevant nodes in [`lat.md/`](lat.md/) before changing a lab, the dashboard, installers, or shared tooling, and update them when behavior changes.

For dashboard work, follow [`docs/UX_READINESS.md`](docs/UX_READINESS.md) and [`lat.md/ux-readiness.md`](lat.md/ux-readiness.md). Keep actions tied to live readiness and available capabilities, label configured endpoints clearly, show operation errors, and verify both the local app and public Pages routes.

Run the relevant checks for the area changed. Dashboard changes use `npm run check`, `npm run test:i18n`, `npm run build`, and `npm run test:e2e` from `dashboard/`; run `lat check` after editing the knowledge graph. See [`lat.md/tooling.md`](lat.md/tooling.md) for broader repository checks.
