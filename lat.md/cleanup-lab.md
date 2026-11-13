# Cleanup Lab

A disk-cleanup lab: measure reclaimable space, show every item with its size and
risk, and clean only through a confirmed plan. The behaviour is ported from
Qleaner; its code, styling and known bugs are not.

## Layers

The engine is a standard-library Python package; the console and `labctl` are thin
typed layers over it.

The package lives in [[cleanup-lab/engine/cleanup_lab]]. `readiness` and `paths`
exist now; the catalog loader (CLN-02), the scan job (CLN-03), the safety guard
(CLN-12) and the plan → clean executor (CLN-13) join them. One module, `safety.py`,
guards every destructive call, so no other module may delete, move or shred.

Target paths are data, never code: every platform path, risk class, owning process
and privilege flag belongs in `cleanup-lab/catalog/*.json` (CLN-02). Per-OS
resolution comes from [[cleanup-lab/engine/cleanup_lab/paths.py]].

[[console/cleanup_api.py]] answers `/api/cleanup/...` with typed, validated calls
and never accepts a command string or a free-form path list from the page.
[[android-lab/lab/web_ui.py]] routes the namespace before the static dashboard
fallthrough. Long work becomes a console job with preview, progress and cancel.

`labctl cleanup status|doctor [--json]` runs the same engine through
`cleanup_lab.cli`: exit `0` when ready, `1` when a required check fails, `2` for a
usage error, matching [[lat.md/labctl.md]].

## Catalog

Target paths are data. One JSON file per family under `cleanup-lab/catalog`, validated
against `schema.json`.

[[cleanup-lab/engine/cleanup_lab/catalog.py]] loads it: unique ids, a family prefix,
the known risk classes, and `defaultSelected` refused for `high`, `credentials` and
`privacy`. Templates (`~`, `{cache}`, `${VAR}`, `${VAR:-fallback}`, `%VAR%`) expand per
operating system; an unset variable yields `path: null` plus a reason instead of a
guess. [[cleanup-lab/PARITY.md]] maps every Qleaner detector id to a catalog id or to
why it was dropped, and [[cleanup-lab/catalog/README.md]] documents the format.

## Readiness

`readiness.py` reports what the engine can do on this host without writing anything.

[[cleanup-lab/engine/cleanup_lab/readiness.py]] checks the operating system, the
interpreter, the home folder, the Trash target and the private state folder; those
decide `ready`, `needs-setup` or `unavailable`. The detector catalog, the native
scan backend and the tools on `PATH` are optional capabilities, so a missing one
never blocks a scan.

`/cleanup/` will render that probe in the dashboard shell, offering only Re-check and
saying in words that scanning and cleaning are not wired yet; until that page lands,
`labctl cleanup status` and `GET /api/cleanup/status` are how to read it. Public Pages
has no engine, so the page will explain that instead of polling, per
[[lat.md/ux-readiness.md]].

## Console API

`console/cleanup_api.py` answers `/api/cleanup/...`; the web console routes that prefix
before the static dashboard fallthrough.

`GET /api/cleanup/status` returns the readiness probe. A request carries no command
string and no free-form path list: an unknown path is `404`, unexpected or duplicate
query parameters are `400`, and a missing engine is `501`. Later tasks add the scan
job (CLN-03), plan → clean (CLN-13), history (CLN-15), ignore rules (CLN-17),
volumes (CLN-28) and runtimes (CLN-29) here, each typed and validated again by the
engine.

## Safety

The eight rules in the README are the acceptance criteria for every task.

Scans are read-only (`lstat`, symlinks never followed). Cleaning is
plan → confirm → run with Trash by default, and a failed Trash never becomes a
silent permanent delete. Every target is resolved inside an allowed root and is
skipped when its owning app runs. Credentials and privacy data are never
pre-selected. Bytes are counted only when removed, every skip and failure carries a
reason, and every run is written to the audit history. Tests use generated temp
trees and fake binaries, never real user files.

## Tests

The engine tests run under `unittest` from the engine folder.

`cd cleanup-lab/engine && python3 -m unittest discover -s tests -p 'test_*.py'`
covers the probe, the path rules and the CLI exit codes. Tests live in
[[cleanup-lab/engine/tests]]. [[scripts/run-tests.sh]] runs the same suite next to
the reference code tests, the Android suite, `bash -n`, `lat check` and the
dashboard build check.
