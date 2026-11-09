# Source Lab

Source Lab brings iQ-SourceContol into os-lab. The local Python engine and CLI
are implemented; dashboard and console integration remain in the task queue.
Only first-party source code and synthetic fixtures are included. Third-party
archives, datasets and binaries are excluded. Skills, database-backed repository
management, and OpenAPI integration are also outside the requested scope.
Analysis and browsing remain file-backed; engine schemas and generated types stay.

- [Plan](PLAN.md): integration design, sequence, migration and release criteria.
- [TODO](TODO.md): ordered tasks, dependencies and completion evidence.
- [Inventory](INVENTORY.md): pinned source snapshot, every page/API route and
  engine/data capabilities, with known gaps separated from shipped features.

Start with os-lab's [architecture graph](../lat.md/lat.md),
[contribution guide](../CONTRIBUTING.md) and
[UX readiness rules](../docs/UX_READINESS.md). The design keeps the existing
static dashboard and local Python console as the user-facing runtime.

## Run locally

Use Python 3.11+; no Node, Docker or KVM is needed for static analysis.

```bash
./labctl source doctor
./labctl source setup
./labctl source detect /path/to/authorized/target
./labctl source detect /path/to/authorized/target --platform android-app --format sarif
./labctl source map --root /path/to/authorized/source --out /path/to/private/repo-map.json
./labctl source crawl --help
./labctl source merge --help
```

Status/doctor are read-only. Setup creates private, gitignored storage and does
not install packages or download resources. Export `SOURCE_LAB_STORAGE` or
`SOURCE_LAB_RESOURCES` to use other locations; `.env` is never evaluated by the
launcher. On Windows, invoke `python source-lab/run.py` directly.

Detection writes reports into separate per-target folders under storage unless
`--output` is supplied. Static runs make no network requests. Explicit crawling,
merge acquisition and live browser canary tests may contact the operator's
chosen repositories or targets. Use merged extensions only in disposable lab
profiles on authorized targets. Synthetic canary fallback is labeled and excluded
from runtime correlation. Native importers remain library entry points.

Read [import/publication policy](IMPORT_POLICY.md) for authorization, exclusions
and the checks required before each public commit. Retained tests run with
`make -C source-lab test` in a Python environment containing pytest.

## Engine contracts

`./labctl source contracts` prints the engine JSON Schema; `--format typescript`
prints frontend types generated from the same models. Regenerate committed files:

```bash
./labctl source contracts --out source-lab/contracts/schema.json
./labctl source contracts --format typescript --out dashboard/src/lib/source-contracts.ts
./labctl source contracts --check /path/to/analysis-v2.json --kind AnalysisV2
./labctl source contracts --check /path/to/repo-map.json --kind RepoMapV1
```

The validator supports the schema vocabulary emitted by this engine, including
unsupported-version rejection; it is not a general-purpose JSON Schema library.
