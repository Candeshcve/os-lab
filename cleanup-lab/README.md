# Cleanup Lab

A disk-cleanup lab for os-lab: scan a host for reclaimable space (caches, build
artifacts, app leftovers, containers, VM images) and clean it through previewed,
confirmed, audited actions.

The detections, detection signatures and clean techniques come from
[Qleaner](https://github.com/keyvanarasteh/Qleaner) (Rust + Tauri v2). **Only the
behaviour is ported, not the code or the look.** Qleaner has known bugs (below) and
its own visual style; Cleanup Lab pages use the os-lab dashboard shell and follow
[`docs/UX_READINESS.md`](../docs/UX_READINESS.md).

Status: **roadmap**. The work is split into tasks `CLN-01` … `CLN-20` on the
dashboard **Contribute → Roadmap & TODOs** tab (filter: Open Source OS, label
"Cleanup Lab"). Reserve a task before you start, as with every os-lab task
([`reservations/README.md`](../reservations/README.md)).

## Architecture contract

| Layer | Where | Rule |
|---|---|---|
| Engine | `cleanup-lab/engine/` | Python standard library first. Pure functions for detection; one module (`safety.py`) guards every destructive call. |
| Catalog | `cleanup-lab/catalog/*.json` | All target paths live here as data, per OS. No hardcoded paths in code. |
| Console API | `console/` (`/api/cleanup/...`) | Typed, validated actions. Never accept a command string or a free-form path list from the page. Long work runs as console jobs with preview, progress and cancel. |
| Dashboard | `dashboard/src/pages/cleanup/`, `dashboard/src/views/cleanup/` | Existing shell and components, typed `api.ts` client, all seven locale catalogs. |
| CLI | `labctl cleanup …` | Same engine, `--json` output, exit codes `0` clean / `1` problem / `2` usage. |
| Desktop | `app/src-tauri/` | Only when a native feature is required; no `unsafe`. |

### Safety rules (apply to every task)

1. **Scan is read-only.** Sizes use `lstat`; symlinks are never followed.
2. **Clean = plan → confirm → run.** The plan lists every item, its size, the mode
   (Trash / delete / shred) and any privilege needed. Running without a confirmed,
   unexpired plan is impossible.
3. **Trash by default.** If moving to Trash fails, the item fails. Never fall back
   to permanent deletion on your own.
4. **Resolved paths only.** Every target is resolved and must stay inside an allowed
   root; ownership is checked; items whose owning app is running are skipped with a reason.
5. **Credentials are not cache.** CLI auth stores (gh, aws, gcloud, azure, k9s…) and
   browser history are a separate risk class and are never pre-selected.
6. **Honest results.** Count only bytes actually removed; report every skipped and
   failed item with its reason; write every run to the audit history.
7. **No secrets in code.** Keys (e.g. the audit HMAC key) are generated per install
   in private state.
8. Tests never touch real user files: use generated temp trees and fake binaries.

## What to port from Qleaner

Source: `src-tauri/src/cleaner/` in Qleaner. `CLN-02` adds `PARITY.md`, mapping
every Qleaner detector id to a catalog id, or to a written reason for dropping it.

| Family | Qleaner source | Task |
|---|---|---|
| User caches, logs, temp, crash reports, font caches, Spotlight indexes, Trash size | `get_cache_locations`, `detect_temp_data`, `detect_crash_reports`, `detect_font_caches`, `detect_spotlight_indexes`, `detect_trash_size` | CLN-04 |
| Browser caches and privacy data (Chrome, Edge, Brave, Opera, Vivaldi, Firefox, Safari; Chrome history and extension telemetry) | `detect_browser_caches`, `get_cache_locations` | CLN-05 |
| ~36 developer/CLI caches (Gradle, Maven, Ivy, Coursier, Poetry, pip, Composer, Go, RubyGems, Ansible, Terraform, Pulumi, Helm, kubectl, Minikube, pyenv/nvm/rbenv, rustup, Bun, Deno, wasm-pack, sccache, ccache, Jest, ESLint, Prettier, Turbo, Nx…) plus npm/yarn/pnpm/cargo/Discord/Slack | `detect_cli_tool_data`, `get_cache_locations` | CLN-06 |
| Deep `node_modules` / Rust `target` sweep, Xcode DerivedData, iOS/watchOS simulators | `find_deep_evictions`, `detect_xcode_simulators` | CLN-07 |
| Docker build cache, dangling images/volumes, stopped containers; VirtualBox/VMware/Parallels/UTM images | `get_cache_locations` (Containers), `detect_virtual_machines` | CLN-08 |
| macOS leftover signatures: Info.plist bundle ids → orphan Containers, Group Containers, Preferences, Application Support, LaunchAgents, Caches, Libraries; hidden apps; large app data | `parse_plist_bundle_id`, `infer_app_name`, `get_installed_bundle_ids`, `detect_*_orphans`, `detect_hidden_apps`, `detect_large_app_data` | CLN-09 |
| Linux / Windows leftovers (missing in Qleaner) | — | CLN-10 |
| Homebrew leaves, global pip packages, gems | `detect_homebrew_orphans`, `detect_pip_global_packages`, `detect_gem_packages` | CLN-11 |
| Process lock, traversal and restricted-root guards, ownership check | `clean_items` guards, `is_owned_by_current_user` | CLN-12 |
| Trash / delete with retry, streaming progress | `clean_items`, `clean_leftovers`, `retry_remove` | CLN-13 |
| Secure shred (zeros / ones / random, rename, unlink) | `secure_shred_file`, `get_all_files` | CLN-14 |
| HMAC-signed audit history | `db.rs` | CLN-15 |
| Ignore rules, schedules, headless CLI, disk-access check | `rules`, `schedules` pages, `cli.rs`, `check_system_disk_access` | CLN-17 … CLN-20 |

## Do not port (known Qleaner bugs)

These were found by reading Qleaner (`src-tauri/src/cleaner/`, `commands.rs` unless noted). A PR that copies one of them is not accepted.

| Bug | Where | What Cleanup Lab does instead |
|---|---|---|
| If Trash fails, the item is **silently deleted permanently**, and bytes are counted as freed even when deletion failed | `clean_leftovers`, `clean_items` (`trash::delete(...).is_err()` → `remove_dir_all`, `let _ =`) | Rule 3 and rule 6 |
| Path traversal check is a substring test `contains("..")`. It rejects valid names like `a..b` and never resolves the path | `clean_items`, `clean_leftovers` | Rule 4 (resolved path inside an allowed root) |
| The restricted-path guard is `contains("system")`, so it blocks any path with "system" in it (e.g. `~/.cache/systemd`) yet protects nothing it does not literally name | same | Allowed-root list per OS |
| The running-app lock checks only Chrome and Firefox, by substring | same | Owning process per catalog entry, for every browser/app |
| The leftover scan returns immediately on Linux and Windows, although the TODO marks it fixed | `start_leftover_scan` (non-macOS) | CLN-10 |
| macOS paths (`Library/Caches/pip`, `…/pypoetry`, `…/helm`) used on every OS | `detectors.rs` CLI entries | Per-OS paths in the catalog |
| Tool presence via `sh -c "command -v nvm"`: shell functions (nvm, workon) are never found, so those entries never appear | `detect_cli_tool_data` | Check the directory itself; no shell |
| Only the Chrome `Default` profile is scanned | `get_cache_locations` | All profiles (CLN-05) |
| Credential stores (gh, AWS, gcloud, Azure) are listed as "cache" | `detect_cli_tool_data` | Rule 5 |
| Shredder ignores write and remove errors and still reports success | `secure_shred_file` | CLN-14 reports every failure |
| The audit-log HMAC key is hardcoded in source (`QleanerTelemetryCryptoIntegrity`), so the signature proves nothing | `clean_leftovers`, `db.rs` | Rule 7, CLN-15 |
| The Ignore Rules page is a placeholder; nothing enforces it | `src/routes/rules` | CLN-17 enforces it in the engine |

## Definition of a good PR

- One CLN task per PR, reserved first, linked in the reservation file.
- Follows the contract and safety rules above. Does not copy a listed bug.
- Tests pass; dashboard changes pass `npm run check`, `npm run test:i18n`, `npm run build`, `npm run test:e2e`.
- `VERIFY.md` entry: commands run and their output, plus phone/tablet/desktop screenshots taken by script for UI changes.
- Parity: the PR updates `PARITY.md` for the detectors it ports.
- MYO063 bonus: at most two merged CLN PRs per student; hold at most two CLN reservations at a time.
