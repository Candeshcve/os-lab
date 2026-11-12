/**
 * Cleanup Lab roadmap (CLN-xx). Ports Qleaner's scan detections, detection
 * signatures and clean techniques (https://github.com/keyvanarasteh/Qleaner)
 * into os-lab. Qleaner's UI styling is NOT ported: pages follow
 * docs/UX_READINESS.md and the existing dashboard shell. Qleaner has known bugs
 * that must not be copied; see cleanup-lab/README.md ("Do not port").
 */
import type { TodoTask } from "./contribute-page";

type CleanupTask = Omit<TodoTask, "category" | "categoryLabel" | "reference" | "suggestedBranch">;

const tasks: CleanupTask[] = [
  // --- Foundation ---
  {
    id: "CLN-01",
    title: "Cleanup Lab skeleton: engine, labctl, readiness and /cleanup/ page",
    priority: "High",
    effort: "Small–Medium",
    summary:
      "cleanup-lab/ engine package (Python stdlib), `labctl cleanup status|doctor`, a read-only readiness probe in the console, and a /cleanup/ page in the existing dashboard shell (sidebar entry, ready / needs-setup / unavailable states).",
    deliverables: [
      "status/doctor never write; GET /api/cleanup/status",
      "/cleanup/ page built from existing dashboard components, all seven locale catalogs",
      "lat.md/cleanup-lab.md node; `lat check` passes",
    ],
    targetPaths: ["cleanup-lab/", "console/", "labctl", "dashboard/src/pages/cleanup/", "lat.md/"],
  },
  {
    id: "CLN-02",
    title: "Detector catalog format, loader and Qleaner parity test",
    priority: "High",
    effort: "Medium",
    summary:
      "A JSON catalog (id, name, category, per-OS paths, risk, hint, impact, default-selected, owning process, needs-privilege) with schema and loader, plus a parity table that maps every Qleaner detector id to a CLN entry or a written reason why it was dropped.",
    deliverables: [
      "cleanup-lab/catalog/*.json + JSON schema; ~ and env vars expanded per OS",
      "cleanup-lab/PARITY.md: every Qleaner detector id → catalog id / dropped (why)",
      "Loader tests on a fake home tree",
    ],
    targetPaths: ["cleanup-lab/catalog/", "cleanup-lab/engine/", "cleanup-lab/PARITY.md"],
  },
  {
    id: "CLN-03",
    title: "Scan job: bounded-parallel size scan with progress and cancel",
    priority: "High",
    effort: "Medium",
    summary:
      "Run catalog scans as console background jobs with preview, progress and cancel (Qleaner start_scan / cancel_scan / get_scan_results, get_directory_size). Sizes use lstat; symlinks are never followed; unreadable paths are reported, not fatal.",
    deliverables: [
      "POST /api/cleanup/scan, GET /api/cleanup/jobs/<id>, POST …/cancel via the console job runner",
      "Tests: cancel mid-scan, symlink loop, permission-denied directory",
    ],
    targetPaths: ["cleanup-lab/engine/", "console/"],
  },
  // --- Scan detections (port every Qleaner detector family) ---
  {
    id: "CLN-04",
    title: "Detections: system caches, logs, temp, crash reports, fonts, Spotlight, Trash",
    priority: "High",
    effort: "Small–Medium",
    summary:
      "Port get_cache_locations system entries, detect_temp_data, detect_crash_reports, detect_font_caches, detect_spotlight_indexes and detect_trash_size for macOS, Linux and Windows (Qleaner is mostly macOS-only here).",
    deliverables: ["Catalog entries with correct per-OS paths", "Fixture tests per OS"],
    targetPaths: ["cleanup-lab/catalog/", "cleanup-lab/engine/"],
  },
  {
    id: "CLN-05",
    title: "Detections: browser caches and privacy data, every profile",
    priority: "High",
    effort: "Small–Medium",
    summary:
      "Port detect_browser_caches and the Chrome history/extension-telemetry entries for Chrome, Edge, Brave, Opera, Vivaldi, Firefox and Safari. Enumerate all profiles (Qleaner only reads Chrome `Default`); privacy items are never pre-selected.",
    deliverables: ["Profile enumeration per browser", "Owning-process name per entry for the CLN-12 lock check", "Tests"],
    targetPaths: ["cleanup-lab/catalog/", "cleanup-lab/engine/"],
  },
  {
    id: "CLN-06",
    title: "Detections: developer tool and package-manager caches",
    priority: "High",
    effort: "Medium",
    summary:
      "Port all detect_cli_tool_data entries and the npm/yarn/pnpm/bun/cargo/gradle/maven/pip/poetry/go/composer/deno/turbo/nx/ccache/sccache… caches with correct Linux/Windows paths (Qleaner uses macOS paths everywhere). Credential stores (gh, aws, gcloud, azure, k9s) are a separate 'credentials' risk class, never pre-selected.",
    deliverables: [
      "Tool presence check without `sh -c` (Qleaner's nvm/workon checks never match)",
      "Tests on a fake home tree",
    ],
    targetPaths: ["cleanup-lab/catalog/", "cleanup-lab/engine/"],
  },
  {
    id: "CLN-07",
    title: "Detections: deep project sweep (node_modules, Rust target), Xcode DerivedData, simulators",
    priority: "Medium",
    effort: "Small–Medium",
    summary:
      "Port find_deep_evictions and detect_xcode_simulators: user-chosen project roots, stop descending at a match, inactivity age filter, per-project size; simulators via `xcrun simctl list -j` with unavailable ones flagged.",
    deliverables: ["Roots validated by the console (no free-form commands)", "Tests on a generated tree"],
    targetPaths: ["cleanup-lab/engine/"],
  },
  {
    id: "CLN-08",
    title: "Detections: containers and VM images",
    priority: "Medium",
    effort: "Small",
    summary:
      "Port the Docker entries (build cache, dangling images/volumes, stopped containers) as typed prune actions with preview, Podman fallback, and detect_virtual_machines (VirtualBox, VMware, Parallels, UTM) as report-only by default.",
    deliverables: ["Typed actions (argv lists, never shell strings)", "Hidden when no engine is present", "Tests with a fake docker binary"],
    targetPaths: ["cleanup-lab/engine/", "console/"],
  },
  {
    id: "CLN-09",
    title: "Detection signatures: macOS app leftovers",
    priority: "High",
    effort: "Medium",
    summary:
      "Port the leftover signatures: installed bundle ids from Info.plist (plistlib, not a `defaults` process per app), then orphans in Containers, Group Containers, Preferences, Application Support, LaunchAgents, Caches and Libraries, plus hidden apps and large app data, each with a confidence score.",
    deliverables: [
      "Signature module with documented match rules (bundle id, team-id prefix, inferred app name)",
      "Fixture tests including near-miss names that must NOT match",
    ],
    targetPaths: ["cleanup-lab/engine/"],
  },
  {
    id: "CLN-10",
    title: "Detection signatures: Linux and Windows app leftovers",
    priority: "Medium",
    effort: "Medium",
    summary:
      "Qleaner's leftover scan is a no-op outside macOS. Add equivalents: ~/.config, ~/.local/share, ~/.cache matched against dpkg/rpm/flatpak/snap inventories; Windows %APPDATA%/%LOCALAPPDATA% against the uninstall registry keys (read-only).",
    deliverables: ["Same confidence model as CLN-09", "Fixture tests"],
    targetPaths: ["cleanup-lab/engine/"],
  },
  {
    id: "CLN-11",
    title: "Detections: package orphans (Homebrew leaves, global pip, gems)",
    priority: "Medium",
    effort: "Small",
    summary:
      "Port detect_homebrew_orphans, detect_pip_global_packages and detect_gem_packages as report-and-suggest: show the exact uninstall argv in the preview; nothing runs without confirmation.",
    deliverables: ["Parsers tested on captured sample output", "Typed uninstall plan"],
    targetPaths: ["cleanup-lab/engine/"],
  },
  // --- Clean techniques ---
  {
    id: "CLN-12",
    title: "Safety guard: canonical paths, allowed roots, ownership, running apps",
    priority: "High",
    effort: "Small–Medium",
    summary:
      "One `assert_safe_target()` for every destructive action. Replace Qleaner's substring checks (`contains(\"..\")`, `contains(\"system\")`) with resolved-path checks against allowed roots, symlink-escape refusal, ownership check, and a running-process lock for every browser/app the catalog names (Qleaner checks only Chrome and Firefox).",
    deliverables: ["cleanup-lab/engine/safety.py + table-driven tests", "Every refusal has a reason shown next to the item"],
    targetPaths: ["cleanup-lab/engine/"],
  },
  {
    id: "CLN-13",
    title: "Plan → confirm → clean, Trash by default, honest results",
    priority: "High",
    effort: "Medium",
    summary:
      "Port clean_items / clean_leftovers as a previewed plan the user confirms. Trash by default; if Trash fails the item fails (Qleaner silently falls back to permanent delete). Retry transient errors; count only bytes actually removed.",
    deliverables: [
      "POST /api/cleanup/plan → POST /api/cleanup/clean {planId}; plan expires if items changed",
      "Per-item result: trashed / deleted / skipped (reason) / failed (error)",
      "Tests for Trash failure, partial failure, changed-after-plan",
    ],
    targetPaths: ["cleanup-lab/engine/", "console/"],
  },
  {
    id: "CLN-14",
    title: "Secure shred technique, done honestly",
    priority: "Medium",
    effort: "Small–Medium",
    summary:
      "Port secure_shred_file (zeros / ones / random passes, random rename, unlink, recurse into nested dirs) but report every failure instead of ignoring it, and document that overwriting is not a guarantee on SSD/APFS/copy-on-write filesystems.",
    deliverables: ["Policy off / 1-pass / 3-pass in settings", "Tests on temp files", "Limits documented in the UI"],
    targetPaths: ["cleanup-lab/engine/"],
  },
  {
    id: "CLN-15",
    title: "Audit history with a real integrity signature",
    priority: "Medium",
    effort: "Small",
    summary:
      "Port the audit log (path, bytes, mode, result) to stdlib sqlite3 with an HMAC-SHA256 chain. The key is generated per install in the lab's private state (Qleaner hardcodes it in source). `labctl cleanup history --verify` detects tampering.",
    deliverables: ["History store + GET /api/cleanup/history", "Verify command + tests", "History view on /cleanup/"],
    targetPaths: ["cleanup-lab/engine/", "labctl", "dashboard/src/views/cleanup/"],
  },
  // --- Pages and remaining features ---
  {
    id: "CLN-16",
    title: "Cleanup pages: scan, results, leftovers (os-lab UX)",
    priority: "High",
    effort: "Medium",
    summary:
      "Dashboard pages for the scan job, results by category and leftovers, built from the existing dashboard components and docs/UX_READINESS.md: preview before run, disabled while a job runs, error next to the failed action, explicit loading/empty/error states. Do not copy Qleaner's styling.",
    deliverables: ["React islands using dashboard/src/lib/api.ts", "e2e test with a mocked API", "Strings in all seven locales"],
    targetPaths: ["dashboard/src/pages/cleanup/", "dashboard/src/views/cleanup/", "dashboard/src/lib/api.ts"],
  },
  {
    id: "CLN-17",
    title: "Ignore rules, enforced by the engine",
    priority: "Medium",
    effort: "Small",
    summary:
      "Paths, extensions and glob patterns that are never scanned or planned. Qleaner only has a placeholder page; here the engine enforces it and a test proves an ignored path is never planned.",
    deliverables: ["Rules store + CRUD API", "Settings section on /cleanup/", "Engine test"],
    targetPaths: ["cleanup-lab/engine/", "dashboard/src/views/cleanup/"],
  },
  {
    id: "CLN-18",
    title: "Schedules: scheduled dry-run scans",
    priority: "Medium",
    effort: "Small–Medium",
    summary:
      "Port the schedules CRUD (add / toggle / delete, cron validation). A schedule only scans and reports; cleaning always needs a confirmed plan.",
    deliverables: ["Schedule store + runner hook", "Schedules section on /cleanup/", "Tests"],
    targetPaths: ["cleanup-lab/engine/", "console/", "dashboard/src/views/cleanup/"],
  },
  {
    id: "CLN-19",
    title: "Headless CLI parity: labctl cleanup scan / plan / clean --json",
    priority: "Medium",
    effort: "Small",
    summary:
      "Port Qleaner's headless cli.rs: `labctl cleanup scan --json`, `plan`, `clean --plan <id> --yes`, with exit codes 0 clean / 1 problem / 2 usage.",
    deliverables: ["labctl subcommands", "CLI tests; README usage"],
    targetPaths: ["labctl", "cleanup-lab/"],
  },
  {
    id: "CLN-20",
    title: "Privileged targets and disk-access check",
    priority: "Medium",
    effort: "Small–Medium",
    summary:
      "Targets that need privileges (journald vacuum, apt cache, system font caches, Spotlight rebuild) through the console's pkexec/sudo plan, never a stored password; port check_system_disk_access / open_privacy_settings as a read-only macOS Full Disk Access probe with guidance.",
    deliverables: ["Typed privileged plans shown in the preview", "Readiness hides OS-specific items elsewhere", "Tests with fakes"],
    targetPaths: ["cleanup-lab/engine/", "console/"],
  },
];

export const CLEANUP_LAB_TASKS: TodoTask[] = tasks.map((t) => ({
  ...t,
  category: "os",
  categoryLabel: "Cleanup Lab",
  reference: "cleanup-lab/README.md",
  deliverables: [
    ...t.deliverables,
    "VERIFY.md entry with commands and output; phone/tablet/desktop screenshots taken by script for UI changes",
  ],
  suggestedBranch: `feat/${t.id.toLowerCase()}`,
}));
