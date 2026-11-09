# Source Lab validation and review

This file records review evidence for the public migration PR. It distinguishes
implemented behavior from the remaining task queue.

## Planning commit

Commit `7c6b81a` adds original planning documents only. It includes no copied
engine/UI code, third-party archives, datasets, binaries, credentials or reports.
The source inventory was checked against seven pages and 29 API routes exposing
41 HTTP methods; local Markdown links, task references and `lat check` passed.

## Engine foundation

The first implementation slice imports the owner's authorized first-party
engine and synthetic source fixtures, with namespaced imports and full relocation
hashes. Original source data, deployment settings and third-party material are
excluded. The input snapshot remains the revision pinned in PROVENANCE.json;
its page and API census is unchanged.

Review covers `CONTRIBUTING.md`, `SECURITY.md`, acceptable use, terms, privacy
and third-party notices. The import policy records the owner's explicit public
Apache-2.0 publication authorization. No credentials or personal data are present
in new fixtures; binary parser samples are generated in temporary directories.
The legal pages describe local storage and user-triggered network workflows.
No console listener, request protection or public live action has been added.

Implemented acceptance checks cover SRC-001/002/010/011/013/014/015: retained
engine tests plus portable launcher, independent target outputs, five-platform
reports, namespace isolation, synthetic evidence rejection, standalone PE input
and resource/output separation. SRC-003 remains open for repository/session/UI
migration fixtures, and SRC-012 remains open for exported schemas/frontend types.
CLI pipeline modules are retained, but their console/UI workflows remain open.

Validation commands and final results are recorded in the PR after the complete
check run. Source historical test counts are not used as fresh verification.

The engine foundation validation completed on 2026-11-09:

- `scripts/run-tests.sh --no-venv`: 7 stages passed, no failures; Android 104
  passed/2 skipped and Source Lab 133 passed; sample smoke, shell syntax,
  graph, dashboard types and committed-build freshness passed.
- Dashboard `npm run check`, `npm run test:i18n` (1933 keys across seven locales),
  `npm run build` (337 pages), and `npm run test:e2e` (15 passed) completed.
- Fresh-checkout checks initially needed Astro's generated types; the repository
  runner now runs `astro sync` before typechecking. The first browser attempt
  needed the matching Chromium test runtime, installed in the local cache only.
- Local fixture crawler, map generation and merge-plan smoke checks passed.
- `python3 source-lab/scripts/check-import.py` verified 108 provenance hashes
  and no tracked excluded assets. The staged credential scanner found no
  credential signatures (synthetic test/example paths are skipped by that tool
  and were reviewed separately). `git diff --cached --check` passes.
- The separate Pages build and browser smoke rendered all 12 English/Turkish
  legal routes without hydration errors, but found that Markdown cross-links
  escaped the Pages base. That check was initially recorded as passing before
  its final result returned. The following navigation fix adds regression
  coverage and reruns this check before publication.

Console endpoints and Source Lab UI pages are not implemented by this milestone;
their tasks remain open. No claim of full migration parity is made.

## Legal navigation follow-up

The follow-up fixes Markdown cross-links and legal navigation to preserve locale
and Pages base paths. It changes navigation only; the legal terms are unchanged.
Regression tests cover English/Turkish document links and following a terms link.
The initial Turkish assertion used an English label that the UI translates; the
assertion now uses the active-link semantics while still checking its exact URL.

Follow-up results: dashboard check, translation check and local build pass; all
17 browser tests pass. The separate Pages build passes. Browser smoke verifies
12 English/Turkish local/Pages legal routes, both language-switch directions,
following the terms link, correct Pages prefixes and no hydration errors.
