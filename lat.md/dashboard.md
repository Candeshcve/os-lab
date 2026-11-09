# Dashboard

The browser console: the host overview, every lab, and the Android Lab
workbench, built from the qLar app shell (qLar PR #174).

## Architecture

A static Astro app in [[dashboard]] served by the Python console; there is no
Node server at runtime.

[[dashboard/src/shell/app-shell.tsx]] carries the sidebar (labs with their
availability pills), Spotlight and theme ported from qLar. Pages are React
islands: [[dashboard/src/views/host-page.tsx]],
[[dashboard/src/views/lab-page.tsx]], [[dashboard/src/views/jobs-page.tsx]],
[[dashboard/src/views/contribute-page.tsx]] and
the Android workbench in [[dashboard/src/views/android/pages.tsx]].
[[dashboard/src/lib/api.ts]] is the typed client; it mirrors qLar's
`shared/os-lab.ts` contract.

## UX readiness

[[ux-readiness]] records the dashboard's action, endpoint, and navigation
rules. The detailed implementation checklist is [[docs/UX_READINESS.md]].
The feedback route is in [[dashboard/src/views/feedback-page.tsx]].

## Host engine

[[console/oslab.py]] ports the qLar desktop OS Lab runtime to the Python
standard library.

It detects the host (OS, arch, CPU, memory, disk, KVM, WSL distributions and
tools), decides each lab's state and provider (linux-containers, wsl2,
native-macos or macos-containers), builds typed, validated plans for lab
actions, runs them as background jobs with secret redaction, timeouts and
cancellation, and reports container state. Privileged setup runs through
pkexec when a graphical agent exists; otherwise the plan returns a `sudo`
command to run in a terminal.

The Source Lab evidence/report readers in
[[console/source_artifacts.py]] reuse the console's localhost Host guard without
starting analyses or changing state. Additional [[console/source_api.py]] handlers
use the shared preview and jobs service for explicit actions. Source readiness
runs natively through Python, and public Source routes show information without
polling a local engine. See [[source-lab#Console operations]].

## Serving and builds

[[android-lab/lab/web_ui.py]] serves the newest of `dashboard/build` (local)
and `dashboard/dist` (committed), else the classic console.

The installers build `dashboard/build` when Node.js 22+ is present, so hosts
without Node use the committed `dashboard/dist`. Every POST must carry
`X-OSLab: 1` and every request a localhost `Host`, so other sites cannot drive
the lab. Lab starts require the token returned by the plan preview. See
[[tooling#Local test runner]] for the build freshness check.

## Source navigation

[[dashboard/src/views/source/pages.tsx]] provides localized Source Lab routes and
uses the existing shell for mobile navigation and themes. The sidebar and
Spotlight include Source destinations; record search reads private file-backed
results only while the local palette is open.

Public Source pages are informational, make no engine requests, and preserve
locale/base/query links. Unimplemented analysis views say so explicitly.

[[dashboard/src/views/source/overview.tsx]] renders file-backed Overview matrices,
inspector notes, filters, CSV/JSON links and operator source catalogs.
[[console/source_overview.py]] adapts raw and flattened crawler manifests and
per-package dependency sections without importing private datasets.

[[dashboard/src/views/source/crawler.tsx]] validates selected source lists or
repository slugs, workers/depth and crawler options. Live Source readiness and
Git gate actions; previews invalidate on edits. Runs use the existing jobs API
for output, cancellation and conflicts. No progress percentage is invented.
