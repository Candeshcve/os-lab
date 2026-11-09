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
and resource/output separation. SRC-003 remains open for session/UI
migration fixtures, and SRC-012 is completed in the subsequent contracts milestone.
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

## Generated contracts milestone

The next slice completes SRC-012: exported V2 evidence/V1 structural-map schemas,
engine-vocabulary validation and generated frontend types. All 141 engine tests
pass, including actual report/map compatibility, invalid versions/states,
non-finite/out-of-range confidence and regeneration freshness. Dashboard type and
translation checks pass; the generated file is unused by current runtime pages,
so it does not change the built assets. `lat check`, provenance/exclusion checks
and staged whitespace checks pass. The existing Android suite and browser
checks were unchanged since the preceding validated milestones.

This slice is original standard-library code and generated contracts, reviewed
against the same contribution/security/legal rules. It adds no dependency,
network activity, archive, dataset, binary or private fixture.

## Scope reduction

The owner removed Skills/agent catalogs, database integration (including the
repository manager and sync/taxonomy/notes), and OpenAPI/API-reference integration.
SRC-050/051/052/053/060/061 are retired as exclusions, not marked implemented.
Their dependencies are removed from active tasks. Five app pages and 13 source
API routes (19 methods) remain migration targets; the full source census stays
in the inventory with explicit dispositions. Engine schemas/generated types and
file-backed analysis browsing remain required. No runtime implementation was
removed, because these integrations had not been added.

This update changes planning documents only. Validation covers Markdown links,
task/dependency references, scope counts, `lat check`, provenance/exclusion checks
and whitespace. Previous runtime test results above are historical; they are not
reported as rerun for this scope-only update.

## Reusable workspace fixtures

SRC-003 is complete: the owned browser fixture now generates detection reports,
a crawler bundle, structural map, planned/built MV3 merge, a signed synthetic
session, UI response data and output SHA-256 manifest in a fresh temporary root.
No third-party data is acquired, no generated binaries/archives are committed,
and the ephemeral session key is supplied explicitly rather than stored. Existing
workspace files are preserved by refusing an existing destination. Validation:
143 engine tests, graph, import/exclusion and whitespace checks pass.

## Read-only evidence endpoints

SRC-026 is complete: the existing localhost console serves evidence summaries,
detail, bounded session timelines and the five planned report download formats.
The reader is standard-library code and never imports or starts the engine.
Session integrity is explicitly not verified by this display endpoint; the
reader does not expose keys or session seals. CLI-only STIX remains unchanged.

This also completes the evidence GET subset of SRC-021 and the read-only path,
size, Host and response-header subset of SRC-023; those broader tasks remain
open for the remaining routes/mutations. The tests cover generated workspace
responses, five-format downloads, foreign Host headers, traversal/duplicate/
unknown parameters, excluded endpoints, symlinks, named pipes, malformed data,
unsupported versions, per-file/aggregate byte budgets and event/directory caps.

Publication review: no new dependencies, outbound requests, hosted listeners,
third-party data, binaries or credentials are added. Existing privacy/terms
already describe these local reports and the localhost console. No dashboard
source or legal-page content changes, so dashboard rebuild/browser checks are
not required for this backend patch.

Final backend patch results on Linux: `scripts/run-tests.sh --no-venv` passes
with Android 112 passed/2 skipped, Source Lab 143 passed, sample-analysis smoke,
shell syntax and graph checks. Dashboard checking is skipped by that runner
because dependencies are absent in this worktree; no dashboard files changed.
The eight focused artifact API tests, import/exclusion check, staged secret scan
and whitespace checks pass. Windows fallback host coverage remains part of the
platform/distribution tasks rather than a claim of this Linux test run.

## Console readiness (SRC-020)

Native Python readiness, optional tools and unavailable interpreter coverage were
added to the console suite. Source Lab has a readiness route in every locale and
a capability entry; static detection does not depend on Docker, KVM or WSL.

Validation: console/web tests 46 passed, 1 skipped; dashboard type and i18n checks
passed; local build 345 pages; browser suite 17 passed.

## Console handlers, guards and jobs (SRC-021/022/023)

All 13 retained namespaced routes / 19 methods now have adapters. [API.md](API.md)
records the preview/job envelope, bounded option set, normalized file-backed DTOs,
absent snapshot behavior and deliberate departures from the source application's
memory-only API. Rich UI parity and deeper crawler controls remain separate tasks.

Linux validation for this milestone:

- Repository runner: all **7 stages passed**; Android/console **143 passed, 2 skipped**,
  Source engine **143 passed**, generated sample reports, 70 shell scripts, graph,
  dashboard types and committed-build freshness. Subsequent Source boundary
  checks cover the final HTTP report redaction/read-budget refinements.
- New Source console suite: **30 passed**, including real detection, both offline
  crawler POST adapters, merger planning/build/download, managed settings jobs,
  credential redaction, private ZIP refusal, typed hostile options, exact-preview
  binding, cross-console conflicts, cancellation, timeout escalation and a real
  abrupt-console-crash test proving the engine stops and its job is interrupted.
- Together with the existing artifact reader tests: **38 passed**.
- Dashboard type check and **1937 keys across seven locale catalogs** pass. Local
  build: **345 pages**; browser suite: **19 passed**, including native Source
  readiness with missing optional tooling and interrupted-job display.
- Separate Pages build under `/os-lab`: English/Turkish Source readiness pages,
  switching locale both ways, internal base paths, no API polling/run controls or
  hydration errors. Twelve local/Pages legal routes and legal locale links pass.
- `lat check`, whitespace, all **108** original import hashes/exclusion checks and
  a staged credential-signature review pass. First-party adapter code only; no
  external catalog, Brain dataset, binary, credential or generated output added.

Source job retention is documented in the privacy page. Runtime API foundations
now exist, but SRC-024/025 remain open for full integrity/settings/importer workflow
acceptance. Five analysis UI pages and native Windows/macOS host verification
remain outside this P0 milestone. Linux tests exercise portable validation and
POSIX lifecycle behavior; they do not establish native Windows host acceptance.

## Owner scope update: skip remaining merger work

SRC-042 is explicitly skipped, removed from release dependencies and listed with
owner-excluded work. Existing merger engine/API functionality is retained. The
remaining active queue has 18 tasks; this skip is not recorded as completed work.
This ledger-only change uses Markdown/graph/whitespace checks; runtime validation
above applies to the preceding implementation milestone.

## Next batch: SRC-024 runtime acceptance

Managed generation/rotation/default URL and explicit `verify-session` jobs are
implemented. Existing mode 0600, ownership and ambiguous-key checks remain. The
engine now requires signed metadata/events and refuses traversal, symlinks,
missing signatures, invalid manifests and wrong keys with bounded reads.

Validation: focused console runtime tests **5 passed**; engine session/collector
tests **20 passed**. Fixtures use temporary keys and owned generated inputs only.
No browser installation, third-party assets or credentials were published.

## Next batch: SRC-025 collector acceptance

All four native importer libraries now accept explicit synthetic labeling and
record that they do not launch native collectors. Browser collection failure
excludes partial events from correlation. Owned, generated telemetry exercises
signed review and matching-target correlation for all four platforms; synthetic
and target-mismatched events are rejected. Browser simulation stays synthetic.

Validation: session/collector suite **29 passed**. Actual native collection and
live browser tooling are not claimed; see [COLLECTORS.md](COLLECTORS.md).

## Next batch: SRC-030 navigation acceptance

Eight Source destinations plus the existing readiness route use the shared
sidebar/mobile drawer, themes and locale helpers. Local Spotlight searches
file-backed target records with debouncing, cancellation and error feedback.
Future Evidence/Deep/Pipeline/Brain/settings views are explicit placeholders.

Validation: dashboard typecheck, 1,951-key/seven-locale check, 409-page local and
Pages builds; existing/browser navigation suite 21 passed initially and the
hydration-timing correction for Spotlight passed its focused rerun. Public smoke
checks 16 EN/TR destinations, locale/query/base links and absence of engine
requests/actions. No private artifact or third-party dataset enters the build.
