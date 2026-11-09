# Repository tooling

Cross-cutting process, tests and conventions for the monorepo: CI, the android
test suite, contribution flow and the project's security/licensing stance.

## Local test runner

GitHub Actions is disabled for this repo; tests run locally via one script.

[[scripts/run-tests.sh]] is the CI replacement. It prepares a Python
environment (a `.venv-test` unless `--no-venv`), runs the pytest suite in
[[android-lab/lab/tests]], runs a sample-analysis smoke test, checks every
shell script with `bash -n`, runs `lat check` when `lat` is installed, and,
when `dashboard/node_modules` exists, typechecks the [[dashboard]] and fails if
the committed `dashboard/dist` differs from a fresh build.
`--quick` runs only the unit tests. The dormant workflow file
[[.github/workflows/mobile-sec-scan.yml]] is kept for reference but is disabled.

## Tests

The android lab carries the only automated test suite today.

It lives in [[android-lab/lab/tests]] (analyzer, reporter, MobSF client, secret
scanner, patcher, flow parser, agentic engine, web UI, and the host engine in
[[console/oslab.py]]). Shell scripts across the
VM labs are kept `bash -n` clean and use `set -euo pipefail`.

## Community and contribution

Contribution flow, coding conventions and the authorization stance.

They are in [[CONTRIBUTING.md]], step by step from setup to pull request, and
the [[dashboard]] renders the same file at `/contribute/`. Contributions must not
add vendor binaries or proprietary media (see [[legal#Google platform-tools]]).
The proposed Source Lab migration is tracked in [[source-lab/README.md]],
with its plan, task queue and pinned source inventory. These are planning
documents; Source Lab has no implemented runtime yet.

Issue and PR templates are in
[[.github/ISSUE_TEMPLATE]] and [[.github/PULL_REQUEST_TEMPLATE.md]]; behavior
expectations in [[CODE_OF_CONDUCT.md]].

## Security and licensing

Private vulnerability reporting and the authorization-only scope.

These are defined in [[SECURITY.md]]; the project is Apache-2.0 ([[LICENSE]]).
The VM base images (`dockur/windows`, `qemux/qemu`, `dockurr/macos`) are MIT and
do not distribute OS media; users are responsible for valid licences.
