# Cleanup Lab status

Maintainer ledger for the CLN roadmap. The task text is
[`../dashboard/src/views/cleanup-lab-tasks.tsx`](../dashboard/src/views/cleanup-lab-tasks.tsx),
the contract is [`README.md`](README.md), the evidence is [`VERIFY.md`](VERIFY.md).
One row per task; the row is updated in the next task's PR (or in a final docs PR
when the last task lands).

## Work split (decided 2026-11-13)

This Run owns the **engine layer**: `cleanup-lab/` (engine, catalog, PARITY,
VERIFY, this file), `console/cleanup_api.py`, `labctl`, the tests and `lat.md/`.
It does **not** write anything under `dashboard/` — not `api.ts`, not pages or
views, not the seven locale catalogs, not the rebuilt `dist`.

The **dashboard layer** is handed to Claude Code. Each task below carries a
"Dashboard handoff" section with the endpoint contract, the UI states and every
user-visible English string; that section is also in the PR body.

Why: the workspace write guard in this build rejects any file whose *existing*
content matches its credential-assignment heuristic (`assertWriteCarriesNoCredential`
runs on the whole content, with no path allowlist and `materializeArtifacts`
defaulting to true). `dashboard/src/lib/api.ts` contains TypeScript annotations
named `token` and every locale catalog contains UI copy mentioning passwords, so
those eight files cannot be written here. Nothing was worked around: the attempts,
the finding and the decision are in the session log.

## Ledger

| ID | Status | PR | Merge commit | Deliverables not done | Deviations | Student reservations / PRs |
|---|---|---|---|---|---|---|
| CLN-01 | merged | [#134](https://github.com/keyvanarasteh/os-lab/pull/134) | d04941f6 | `/cleanup/` page, sidebar entry, seven locale catalogs, dashboard screenshots — handed over below | dashboard layer deferred | none |
| CLN-02 | in progress (this PR) | — | — | — | — | none |
| CLN-03 | pending | — | — | — | — | none |
| CLN-04 | pending | — | — | — | — | none |
| CLN-05 | pending | — | — | — | — | none |
| CLN-06 | pending | — | — | — | — | none |
| CLN-07 | pending | — | — | — | — | none |
| CLN-08 | pending | — | — | — | — | none |
| CLN-09 | pending | — | — | — | — | none |
| CLN-10 | pending | — | — | — | — | none |
| CLN-11 | pending | — | — | — | — | none |
| CLN-12 | in progress (this PR) | — | — | — | — | none |
| CLN-13 | pending | — | — | — | — | none |
| CLN-14 | pending | — | — | — | — | none |
| CLN-15 | pending | — | — | — | — | none |
| CLN-16 | pending | — | — | dashboard page is the whole task | console side only | none |
| CLN-17 | pending | — | — | — | — | none |
| CLN-18 | pending | — | — | — | — | none |
| CLN-19 | pending | — | — | — | — | none |
| CLN-20 | pending | — | — | — | — | none |
| CLN-21 | pending | — | — | — | — | none |
| CLN-22 | in review | this PR | — | — | done ahead of order by Claude Code at the maintainer's request; engine and dashboard untouched | none |
| CLN-23 | pending | — | — | Disk Explorer page | console side only | none |
| CLN-24 | pending | — | — | — | — | none |
| CLN-25 | pending | — | — | — | — | none |
| CLN-26 | pending | — | — | — | — | none |
| CLN-27 | pending | — | — | — | — | none |
| CLN-28 | pending | — | — | `/cleanup/` volumes card | console side only | none |
| CLN-29 | pending | — | — | — | — | none |

No CLN task has a student reservation or open student PR: `grep -rl CLN-
reservations/` matches only `README.md` and `_schema.json`, and no open PR title or
branch names a CLN id.

## Dashboard handoff — CLN-12

### Console endpoint

None. The guard is engine-internal: CLN-13's plan and CLN-15's run will return a
`reason` and `reasonCode` per item from `safety.check_target()`.

### What the page shows per item

`Ok` items carry the resolved path. A refused item must show its translated code and
keep the entry visible — never silently drop it. Codes:

| Code | Meaning | English fallback |
|---|---|---|
| `empty` | empty path in a request | A filesystem path cannot be empty. |
| `nul` | NUL byte in a path | A filesystem path cannot contain NUL bytes. |
| `relative` | not absolute and not `~/…` | Filesystem paths must be absolute: `<path>` |
| `protected` | `/`, the home folder or a drive root | Refusing to operate on protected root `<path>`. |
| `system-root` | `/System`, `/usr`, `C:\Windows` … | Refusing to operate on system directory `<path>`. |
| `missing` | vanished since the scan | Path no longer exists. |
| `no-path` | entry has no path for this OS | This entry has no path for this system. |
| `outside-root` | symlink resolved outside the entry's root | Path resolves outside its catalog root (symlink escape). |
| `foreign-owner` | owned by another account | Owned by another user account; a privileged plan is required. |
| `app-running` | an owning app is running | The owning application is running: `<apps>`. |

Also refused, for CLN-23 and CLN-27: `missing` / `not-a-folder` / `unreadable` when
choosing a scan folder, `outside-roots` for a target outside every allowed root,
`same-path` / `nested` / `destination-outside` for a copy.

### Suggested UI strings

`Skipped` · `Could not be cleaned` · `Some items were skipped` — the reasons themselves
come from the payload. A privileged entry shows `Needs administrator rights` and stays
unselected.

## Dashboard handoff — CLN-02

### Console endpoint (already live)

`GET /api/cleanup/catalog` → `200 application/json`

```json
{
  "platform": "macos",
  "entries": [
    {
      "id": "system.user-caches",
      "name": "User caches",
      "family": "system",
      "category": "system",
      "risk": "low",
      "hint": "Application caches for the current user. They speed up loading.",
      "impact": "Apps rebuild these; the first launch after cleaning is slower.",
      "defaultSelected": true,
      "needsPrivilege": false,
      "owningProcesses": [],
      "detector": "paths",
      "note": "",
      "paths": [
        { "template": "~/Library/Caches", "path": "/Users/Q/Library/Caches", "reason": "" }
      ]
    }
  ]
}
```

`risk` is `low` / `medium` / `high` / `credentials` / `privacy`; the last three are
never pre-selected. `paths[].path` is `null` when the template could not be resolved
(e.g. an unset `XDG_CACHE_HOME`), and `paths[].reason` then says why. Errors: `400`
unexpected or duplicate query parameters, `404` unknown path, `500` malformed catalog
(the message names the file). No POST, no jobs.

### UI

CLN-02 adds no page. When a later page lists detectors (CLN-16), it reads this
endpoint; a path with `path: null` must show its `reason`, not be hidden. Suggested
strings, if such a list is built: `Detector catalog` · `No detector catalog` ·
`Could not resolve this path`. Everything else comes from `name`, `hint`, `impact`
and `risk` in the payload.

## Dashboard handoff — CLN-01

### Console endpoint (already live)

`GET /api/cleanup/status` → `200 application/json`

```json
{
  "engine": { "name": "cleanup-lab", "version": "0.1.0", "python": "3.15.0", "mode": "stdlib" },
  "state": "ready",
  "platform": { "id": "macos", "label": "macOS", "supported": true },
  "home": "/Users/Q",
  "stateDir": "/Users/Q/Library/Application Support/os-lab/cleanup",
  "requirements": [
    { "id": "platform", "label": "Supported operating system", "found": true, "required": true, "hint": "Cleanup Lab runs on macOS, Linux and Windows.", "detail": "macOS" },
    { "id": "python", "label": "Python 3.11 or newer", "found": true, "required": true, "hint": "labctl cleanup prefers the checkout's .venv; install Python 3.11 or newer.", "detail": "3.15.0" },
    { "id": "home", "label": "Home folder readable", "found": true, "required": true, "hint": "The scan targets live under this folder; make it readable by your user.", "detail": "/Users/Q" },
    { "id": "trash", "label": "Trash available", "found": true, "required": true, "hint": "Cleaning moves items to the Trash; a platform without one cannot clean.", "detail": "/Users/Q/.Trash" },
    { "id": "state", "label": "Private state folder writable", "found": true, "required": true, "hint": "The audit history and the learned profile live here. Set OSLAB_CLEANUP_STATE to a writable folder.", "detail": "/Users/Q/Library/Application Support/os-lab/cleanup" }
  ],
  "capabilities": [
    { "id": "detectors", "label": "Detector catalog", "found": false, "detail": "No detector catalog yet" },
    { "id": "native-scan", "label": "Native scan backend", "found": false, "detail": "Reference crate present; not wired into the app yet" },
    { "id": "containers", "label": "Container engine", "found": false, "detail": "No docker or podman on PATH" },
    { "id": "package-managers", "label": "Package managers", "found": true, "detail": "pip3 at /usr/bin/pip3" },
    { "id": "simulators", "label": "Simulator tools", "found": true, "detail": "xcrun at /usr/bin/xcrun" }
  ],
  "reasons": [],
  "checkedAt": 1794530446.947456
}
```

`state` is `ready` / `needs-setup` / `unavailable`. `reasons` lists the `hint` of
every required requirement that failed. Errors: `404` unknown `/api/cleanup/...`
path, `400` unexpected or duplicate query parameters, `501` when
`console/cleanup_api.py` or `cleanup-lab/engine` is missing. No POST, no jobs, no
progress or cancel in this task.

### UI states

| State | What the page shows |
|---|---|
| loading | skeleton rows, headline "Checking this computer…" |
| ready | success badge, "Ready on this computer", every requirement row ticked |
| needs-setup | warning badge, "Needs setup on this computer", the failed row's `hint` under it, plus the `reasons` list |
| unavailable | neutral badge, "Not available on this computer", unsupported-platform sentence |
| request failed | empty state with "No answer from the cleanup engine. Start os-lab from a terminal, then press Re-check." |
| public Pages | no polling: "The Cleanup Lab runs in the local app." |

Actions: exactly one, Re-check (re-fetch). No scan/clean button until CLN-03/13.

### Files to add (dashboard layer)

* `dashboard/src/pages/cleanup/index.astro` — `<Base title="Cleanup Lab" …>` +
  `<CleanupPage client:only="react" />`.
* `dashboard/src/views/cleanup/cleanup-page.tsx` — `AppShell activeId="cleanup"`,
  `TopBar`, `PageHead`, two `Section`s (Readiness, Capabilities), a collapsed
  "Technical details" block with engine version, Python, home and state paths.
* `dashboard/src/lib/api.ts` — `CleanupRequirement`, `CleanupCapability`,
  `CleanupStatus` types and `cleanupStatus: () => call<CleanupStatus>("/api/cleanup/status")`.
* `dashboard/src/shell/app-shell.tsx` — `sectionHref("cleanup")` → `/cleanup/`,
  a "Cleanup Lab" item in the **OS Lab** group (local mode only), Spotlight meta.
* `dashboard/src/pages/[locale]/[...rest].astro` — add `cleanup` to `routes` and
  render the page for `rest === "cleanup"`, otherwise language switching 404s.

### Visible strings (English; these are the i18n keys)

`Cleanup Lab` · `Find reclaimable disk space, inspect every item, and clean only what you confirm.` ·
`Checking this computer…` · `Ready on this computer` · `Needs setup on this computer` ·
`Not available on this computer` · `Every required check answered. Nothing has been scanned or removed.` ·
`The engine is installed but a required check below did not answer.` ·
`This operating system is not supported by the Cleanup Lab engine.` · `Asking the local cleanup engine…` ·
`Re-check` · `Readiness` · `Checks the local engine answers before it scans anything. Nothing on this page changes your system.` ·
`Capabilities` · `Optional tools and detectors this build can use. A missing one never blocks a scan.` ·
`Technical details` · `Engine version` · `Python` · `Home folder` · `Private state` ·
`No answer from the cleanup engine. Start os-lab from a terminal, then press Re-check.` ·
`This build reports readiness only. Scanning, planning and cleaning arrive in later tasks.` ·
`The Cleanup Lab runs in the local app.` ·
`The public site describes the lab. Scanning and cleaning need the engine on your own computer.`

Dynamic strings from the API (`label`, `detail`, `hint`, `reasons`) are English
server-side, like every other lab label; they are not translated client-side.

## Session log

**2026-11-13 — CLN-01.** Read `AGENTS.md`, `CONTRIBUTING.md` §2b,
`docs/UX_READINESS.md`, `lat.md/`, `cleanup-lab/README.md`,
`cleanup-lab/reference/README.md` and the task file. No CLN reservations or open
CLN PRs. Built the `cleanup_lab` package (readiness, paths, CLI), the console
endpoint, the `labctl cleanup` dispatch, the unit suite, `lat.md/cleanup-lab.md`,
the README status/CLI section and the engine stage in `scripts/run-tests.sh`.

Write guard: `dashboard/src/lib/api.ts` and all seven
`dashboard/src/i18n/generated/*.json` were refused (`token`, then `password`
hits) because the guard scans the whole file content and this build exposes no
path allowlist. The maintainer asked for an 8-path allowlist; it did not take
effect in the Run, and the cause was reported. Decision on 2026-11-13: split the
work by layer (engine here, dashboard in a later pass), never work around the
guard, record any further refusal here. A draft `dashboard/src/views/cleanup/`
page written before that decision was removed again; `git status` shows no change
under `dashboard/`.

Baseline: `./scripts/run-tests.sh` reports 8 passed, 1 failed, 1 skipped. The
failure is the android suite, already failing on a clean `master` worktree on this
arm64 Mac (5 failed + 10 errors there, 4 failed + 10 errors on this branch, same
ids, no new failure); `cargo` is not on `PATH`, so the qrust-scan stage is skipped
and this PR changes no Rust.

**2026-11-13 — CLN-01 review round.** Sourcery opened 12 threads; the branch merge
is blocked until they are resolved (`required_conversation_resolution`). Fixed 11:
Python 3.11 is now accepted (a three-element `(3, 11, 0)` compared against
`(3, 11)` was false, so the probe compares the first two components); Trash
readiness checks the target (existing folder writable, otherwise its nearest
existing ancestor, Recycle Bin on Windows); the state folder must be writable
**and** not group/other accessible (`is_private_dir`); relative `XDG_*` values are
ignored instead of resolving against the working directory; `nearest_existing` uses
`lstat`, so a dangling symlink or a permission-blocked component is reported
instead of climbing past it; absolute-path checks use the target platform's path
module; CLI output escapes control characters; `doctor` prints every hint and no
longer claims the engine can scan; README and the knowledge graph say the
`/cleanup/` page is not built yet; the doctor test asserts the hint text. One thread
was declined: absolute home and state paths in the status response — the console
binds `127.0.0.1` only, rejects a foreign Host header, and any local process can
read the home path without it, while the page needs the paths to be useful. Replied
to and resolved every thread.

**2026-11-13 — CLN-02.** Catalog format, loader, seeds and parity. Added
`cleanup-lab/catalog/schema.json` (draft 2020-12), `catalog/system.json` with three
seed entries (user caches, user logs, Trash), `cleanup_lab/catalog.py` (validation,
per-OS template expansion, unresolved paths reported with a reason, pre-selected
risk refused), `cleanup-lab/PARITY.md` mapping every Qleaner detector id read from
`detectors.rs`, `catalog/README.md`, `labctl cleanup catalog` and
`GET /api/cleanup/catalog`. No CLN reservation or open CLN PR existed for this task.

**2026-11-13 — CLN-12.** Safety guard. Added `cleanup_lab/safety.py`: the reference
path policy (canonical/resolved paths, protected and system roots, component
containment, `validate_scan_root`, `validate_target`, `validate_copy`) plus ownership
and a process-table lock matched on whole names from each entry's `owningProcesses`.
`check_target()` returns a verdict with a stable code and an English reason;
`assert_safe_target()` raises both. 22 new tests (69 total), including a check that no
shipped catalog entry points at a protected root. The old `contains("..")` and
`contains("system")` checks are gone; `a..b` is a valid path and `~/.cache/systemd`
is not blocked by a substring.
