# Source Lab

Source Lab provides local source/package analysis through a namespaced Python engine and [[labctl]]. It needs no VM, KVM, Docker or Node for static detection. Dashboard integration remains in [[source-lab/TODO.md]].

## Detection

[[source-lab/engine/source_lab/cli/run_detection.py#main]] selects browser-extension, Windows, macOS, Android or iOS analysis and writes V2 findings/coverage, an H1-H5 scorecard, JSON, SARIF, Markdown and STIX reports.

[[source-lab/engine/source_lab/analyzers]] contains the source and binary parsers and rule families. Findings distinguish capabilities and static leads from runtime observations. [[source-lab/engine/source_lab/paths.py#Paths]] configures resource and private-state roots without absolute developer paths.

## Contracts

[[source-lab/engine/source_lab/contracts.py#schema_document]] exports JSON Schema from the Python models and engine envelopes. [[source-lab/engine/source_lab/contracts.py#typescript]] generates [[dashboard/src/lib/source-contracts.ts]].

[[source-lab/engine/source_lab/contracts.py#validate]] checks the emitted schema vocabulary, including versions, evidence states, coverage and finite confidence. `labctl source contracts` exports JSON or TypeScript and can validate a local artifact. [[source-lab/contracts/schema.json]] is the committed schema snapshot.

## Runtime evidence

[[source-lab/engine/source_lab/evidence/session.py]] signs and verifies session bundles. [[source-lab/engine/source_lab/collectors]] provides the browser canary and four platform telemetry importer libraries.

[[source-lab/engine/source_lab/cli/run_detection.py#_verified_events]] excludes synthetic sessions and target/platform mismatches from correlation. Missing keys or failed integrity leave the static findings and an explicit coverage limitation. Live canary collection requires operator-installed Playwright and Chromium; setup does not install them.

## Pipeline

[[source-lab/engine/source_lab/pipeline]] contains the crawler, extension merger and CSV joiner. [[source-lab/run.py#main]] supplies storage defaults for the crawler and merger; the CSV CLI writes joined catalogs into mutable storage.

Crawling and source acquisition can contact GitHub only when the operator invokes them. Targets and catalogs are operator-supplied; no upstream archive or dataset is bundled. Merge output is for authorized testing in disposable lab browser profiles.

## Structural maps

[[source-lab/engine/source_lab/sourcemap]] maps source trees through a read-only disk/archive VFS and exports JSON, Markdown and DOT. [[source-lab/engine/source_lab/sourcemap/__main__.py#main]] supports generate and query commands.

Adapters cover Python, JS/TS, PHP, Rust, Swift, Objective-C, Kotlin, Java and markup. Optional grammars fall back to scanners; binary-only applicability and parser limitations stay explicit. A structural map is navigation data, not evidence of behavior.

## Launcher and state

[[source-lab/run.py#main]] exposes status, doctor, setup, detect, map, crawl, merge and merge-csvs. [[source-lab/run.py#status]] probes readiness without writing state. Explicit setup creates private directories without downloads.

`SOURCE_LAB_STORAGE` defaults to `source-lab/storage`; `SOURCE_LAB_RESOURCES` defaults to its `resources` child. Resource directories are not created automatically. Detection defaults to separate per-target folders; CLI output overrides remain explicit. `.env` examples are not evaluated as shell code.

## Publication boundary

[[source-lab/IMPORT_POLICY.md]] records the owner's authorization and exclusions. [[source-lab/PROVENANCE.json]] maps reviewed first-party imports to their source and current hashes; [[source-lab/UPSTREAM-MANIFEST.csv]] retains the historical extraction metadata.

No third-party archives, datasets or binaries are imported. Skills, database
integration and OpenAPI are outside the requested migration scope; artifact
readers and engine contracts remain file-backed. The Python package is `source_lab`, so its modules do not shadow the existing Android engine. No source UI, server route or remote deployment is activated by this foundation.

## Regression tests

[[source-tests]] preserves the engine's bound test specifications, including generated binary fixtures and launcher/evidence regressions. Run `python3 -m pytest -q` in [[source-lab/engine]].

The repository test runner executes this suite in a separate Python process from Android tests. Static analysis remains usable without optional browser, grammar or VM dependencies.
