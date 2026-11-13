# Cleanup Lab verification record

One section per task: the commands that were run, their real output, and anything
that was not run and why. The checks in
[`README.md`](README.md#definition-of-a-good-pr) and [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
apply; this file is the evidence, not a second contract.

## CLN-01 — skeleton: engine, labctl, readiness endpoint

Branch `feat/cln-01-cleanup-skeleton`. Scope of this PR: engine, console API,
`labctl`, tests, knowledge graph. The dashboard page lives in the handoff section
of `STATUS.md` (this environment cannot write under `dashboard/`; see the session
log there).

### Engine unit tests

```console
$ cd cleanup-lab/engine && ../../.venv-test/bin/python -m unittest discover -s tests -p 'test_*.py'
Ran 29 tests in 0.048s
OK
```

Covers: platform mapping, per-OS state and Trash paths, the `OSLAB_CLEANUP_STATE`
override, relative XDG values being ignored, dangling-symlink and non-directory
components, the "never writes the state folder" rule, Python 3.11 exactly (the
`(3, 11, 0) >= (3, 11)` boundary), an unusable Trash, a group-readable state
folder, old-Python and unsupported-OS states, missing home folder, detector
counting, fake `PATH` lookups, the Windows Recycle Bin entry, control-character
escaping in CLI output, and the CLI exit codes (`0` ready / `1` problem / `2` usage).

### CLI

```console
$ ./labctl cleanup status
Cleanup Lab 0.1.0 · macOS · ready
  [ok] Supported operating system       macOS
  [ok] Python 3.11 or newer             3.15.0
  [ok] Home folder readable             /Users/Q
  [ok] Trash available                  /Users/Q/.Trash
  [ok] Private state folder writable    /Users/Q/Library/Application Support/os-lab/cleanup

Capabilities:
  [--] Detector catalog                 No detector catalog yet
  [--] Native scan backend              Reference crate present; not wired into the app yet
  [--] Container engine                 No docker or podman on PATH
  [ok] Package managers                 pip3 at /usr/bin/pip3
  [ok] Simulator tools                  xcrun at /usr/bin/xcrun
$ echo $?
0
```

`./labctl cleanup doctor` adds `Paths:` and a `Hints:` block with every
requirement's hint (failed ones marked `(needs attention)`); `--json` prints the same
payload as the HTTP endpoint. `bash -n labctl` parses.

### Console endpoint

```console
$ .venv/bin/python android-lab/lab/web_ui.py 5099 &
$ curl -sS -i http://127.0.0.1:5099/api/cleanup/status | head -5
HTTP/1.0 200 OK
Server: BaseHTTP Python/3.15.0
Date: Fri, 13 Nov 2026 00:40:46 GMT
Content-Type: application/json

$ curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5099/api/cleanup/nope
404
$ curl -sS -o /dev/null -w '%{http_code}\n' 'http://127.0.0.1:5099/api/cleanup/status?x=1'
400
$ curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5099/health/
200
```

Payload: `engine`, `state` (`ready` / `needs-setup` / `unavailable`), `platform`,
`home`, `stateDir`, `requirements[]`, `capabilities[]`, `reasons[]`, `checkedAt`.
On this Mac: `state: ready`, five requirements found, detector catalog absent
(CLN-02 has not landed), no reasons.

### Repository checks

```console
$ ./scripts/run-tests.sh
...
8 passed, 1 failed, 1 skipped
```

* `[ok] cleanup-lab/engine` — the new stage.
* `[ok] cleanup-lab/reference/python`, `[ok] source-lab/engine test suite`.
* `[ok]` bash -n (499 scripts), `lat check`, dashboard typecheck and
  `dashboard/dist matches the sources`.
* `[fail] android-lab/lab test suite` — **pre-existing on this arm64 Mac**, proved
  by running the same suite on a clean `master` worktree:

  ```console
  # branch feat/cln-01-cleanup-skeleton
  4 failed, 139 passed, 2 skipped, 10 errors in 12.42s
  # master (git worktree add .worktrees/cln01-baseline master)
  5 failed, 138 passed, 2 skipped, 10 errors in 17.47s
  ```

  The failing ids are the same set (three `test_app_update` download cases, one
  `test_web_ui` plan-token case, ten `test_content` OpenSSL signing cases); the
  branch has one fewer because `test_source_console` needs the primary checkout.
  No new failure.
* `[skip] cargo not installed` — `cargo` is only at `~/.cargo/bin`, which is not on
  `PATH` for this shell. This PR changes no Rust code; CLN-21/22 must run it.

```console
$ lat check
All checks passed in 222ms
$ git diff --check
$ echo $?
0
```

### Not run

* `npm run test:e2e` — this PR changes nothing under `dashboard/`, and Playwright
  browsers are not installed on this machine (no `~/Library/Caches/ms-playwright`).
* Dashboard screenshots — same reason, and the page is the handoff, not this PR.

## CLN-02 — detector catalog format, loader and Qleaner parity

Branch `feat/cln-02-catalog`. Scope: catalog data + schema, loader, parity table,
CLI and console endpoint. No dashboard file is touched.

### Engine unit tests

```console
$ cd cleanup-lab/engine && ../../.venv-test/bin/python -m unittest discover -s tests -p 'test_*.py'
Ran 47 tests in 0.023s
OK
```

18 new cases: template expansion (`~`, `{home}`, `{cache}`, `${VAR}`,
`${VAR:-fallback}`, `%VAR%`, unavailable context, relative path), per-platform
filtering, duplicate ids across files, a pre-selected `high`/`credentials`/`privacy`
entry refused, nine malformed-entry cases, bad file version, and `path: null` with a
reason instead of a guess. `SchemaTest` asserts the loader's required keys equal
`schema.json`'s and that every catalog file uses only declared fields.

### CLI

```console
$ ./labctl cleanup catalog
Cleanup Lab catalog · macos · 3 entries
  system.user-caches     User caches                low         pre-selected
      /Users/Q/Library/Caches
  system.user-logs       User logs                  low         pre-selected
      /Users/Q/Library/Logs
  system.trash           Trash                      medium      not pre-selected
      /Users/Q/.Trash
$ echo $?
0
```

`--json` prints the same payload as the endpoint.

### Console endpoint

```console
$ python3 -c '…CleanupAPI(".").get("/api/cleanup/catalog", {})…'
entries: 3 platform: macos
query -> 400 Unexpected query parameters
broken -> 500 The detector catalog is invalid: system.json: entry nope is missing name, category, risk,
```

The broken-catalog case uses a generated temp catalog, not the repository one.

### Repository checks

```console
$ ./scripts/run-tests.sh
8 passed, 1 failed, 1 skipped
```

The failure is still the android suite, pre-existing on this arm64 Mac (a clean
`master` worktree: 5 failed + 10 errors; this branch: 5 failed + 10 errors, same ids).
`cargo` is not on `PATH`, so qrust-scan is skipped; this PR changes no Rust.

```console
$ lat check
All checks passed in 538ms
$ git diff --check
(clean)
```

### Not run

`npm run check|test:i18n|build|test:e2e` — no file under `dashboard/` changed, and
Playwright browsers are not installed here.

## CLN-12 — one safety guard for every destructive call

Branch `feat/cln-12-safety-guard`. Scope: `cleanup_lab/safety.py` and its tests; the
modules that will call it are CLN-13 (plan) and CLN-15 (run).

### Engine unit tests

```console
$ cd cleanup-lab/engine && ../../.venv-test/bin/python -m unittest discover -s tests -p 'test_*.py'
Ran 69 tests in 0.144s
OK
```

22 new cases: path inside / equal to / outside its catalog root, a sibling with the
same prefix (`caches-old` vs `caches`), the valid name `a..b` that Qleaner's
`contains("..")` rejected, a symlink resolving outside the root, protected roots (`/`
and home), a missing path, a foreign owner (injected `lstat`), a running owning app,
whole-name vs basename process matching, the Windows `tasklist` CSV parser, a failing
process listing, scan-folder validation, copy pairs, the refusal codes, and a check
that every shipped catalog entry resolves to a non-protected path.

### Repository checks

```console
$ ./scripts/run-tests.sh
8 passed, 1 failed, 1 skipped
```

The failure is the android suite, pre-existing on this arm64 Mac (same ids on a clean
`master` worktree); `cargo` is not installed, so qrust-scan is skipped and no Rust
changed.

```console
$ lat check
All checks passed in 318ms
$ git diff --check
(clean)
```

### Not run

`npm` checks — no `dashboard/` file changed. Process matching was exercised with
injected tables on this macOS host; no Windows or Linux host ran the `tasklist` path.

## CLN-03 … CLN-29

Each task appends its own section when it lands.
