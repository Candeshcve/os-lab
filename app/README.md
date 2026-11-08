# os-lab app (Tauri v2)

The os-lab dashboard in a native window, for macOS, Windows and Linux. Ported from
[qLar's Tauri app](https://github.com/keyvanarasteh/qLar) (`agents-apps/qLar`): the same
single-instance, store, dialog and opener plugins, without its agent-host code.

## How it works

1. A local launcher page (`ui/`, plain HTML/JS) calls the `console_start` command.
2. The shell finds an os-lab root (see below), finds Python 3.9+, starts
   `android-lab/lab/web_ui.py` on a free `127.0.0.1` port and waits for `/healthz`.
3. The window navigates to that URL. The page is the normal dashboard, served by the normal
   console, so every page and lab action (preview → token → run) behaves as in `./labctl ui`.

Nothing in the app runs lab commands. The dashboard page gets **no Tauri IPC**
(`capabilities/launcher.json` names the launcher window only). Links that leave the console open in
the system browser. The console runs under a small supervisor and exits with the app, even if the
app is killed; quitting stops its process group, jobs included.

### Which os-lab files run

In order: `OSLAB_ROOT` → a checkout chosen with **Use my os-lab checkout…** (remembered) → the
repository containing `app/` in a debug build → the **bundled runtime**, copied into the app data
folder on first launch and after an update. A sync never overwrites or removes `.env`,
`config.env`, `storage/`, `artifacts/` and the other state names listed in `runtime.rs`; only the
dashboard build is replaced wholesale.

Use **File → Files folder…** to choose an empty folder for the app's writable files on macOS,
Windows or Linux. The app copies its current data there before saving the choice. The bundled
runtime (`os-lab/`), managed Python, downloaded installers, content updates and console logs then
use that folder. Keep it available when launching the app; selecting another empty folder copies
the current files again. The setting itself remains in Tauri's default app settings location so
the app can find the chosen folder on the next launch. `OSLAB_ROOT` and `OSLAB_CONTENT_DIR`, when
set, still override the runtime checkout and content location respectively.

## Develop and build

Needs Node 22+, Rust 1.85+ and Python 3.9+.

```bash
cd app
npm ci
npm run stage     # bundle tracked lab files + a fresh dashboard build (src-tauri/resources/os-lab)
npm run dev       # debug app; runs against this checkout, no staging needed
npm run build     # release bundle: .app/.dmg, NSIS/MSI, deb/AppImage (per host OS)
npm run test:stage
(cd src-tauri && cargo test)
```

`npm run stage` bundles **git-tracked** files from `labctl`, the console, all five lab folders,
`docs/legal`, and a fresh dashboard build. It excludes credentials and guest data, so an
untracked `.env` or VM disk cannot ship. Staging fails if a required lab entry point is missing.
`--no-build` stages the committed `dashboard/dist`.

The installer contains the lab scripts and Compose definitions, not the host tools or guest
payloads they operate. The console needs Python 3.9+ (the Debian package declares this
dependency, and the app can get a managed copy on other hosts). Container labs need a working
Docker or Podman engine with Compose and pull their images
separately; VM labs also need the host virtualization support and guest media their Doctor page
reports. Native iOS simulation needs full Xcode, an iOS Simulator runtime and an available device;
Appium and XCUITest are needed for automation. The app can run from its
bundled copy without a Git checkout, and the dashboard shows each lab's setup requirements.

If no suitable Python is installed, the launcher offers **Get Python**. Release builds include a
SHA-256-verified uv helper for each supported architecture; it downloads CPython 3.12 into the
app's data folder on request, without changing the system Python or `PATH`. The release scripts
stage this helper before building. An existing Python 3.9+ installation still works without a
download.

If Docker or Podman is installed but stopped, the launcher can start an existing Colima, Podman
machine, Docker Desktop, or Linux service when the user presses **Start installed engine**. It
checks the engine and Compose again before continuing. An unavailable external volume, missing
Compose plugin, or host authorization can still require user action. On macOS and Windows, the
launcher also offers **Get Docker Desktop** when no working engine is available; Docker Desktop
is optional. The download action fetches Docker Desktop 4.98.0 for the host architecture, verifies the SHA-256
published in Docker's release notes, and opens the installer. The user completes Docker's
interactive installation and licensing, enables host virtualization if needed, then retries.
**Continue to dashboard** remains available for labs that do not need containers. On Linux, the
dashboard's existing lab setup actions install Docker Engine and the lab scripts pull their
container images when started. VM guest media is fetched by the relevant lab workflow or supplied
by the operator; it is never redistributed by the app.

## Release (macOS DMG, notarized)

`app/scripts/release-mac.sh` builds a universal DMG, signs it (Developer ID), notarizes the app and the DMG, staples, verifies with `codesign`/`spctl`/`stapler`, and with `--publish` uploads it to the GitHub release `app-v<version>` with a SHA-256 file. Without `--publish` it uploads nothing; `--no-notarize` signs only. Credentials come from the environment, the git-ignored `secrets/` folder or the login keychain, never from the repo (`secrets/README.md`); the script refuses to run if a key or secrets file is tracked.
The Python helpers must be signed before Tauri bundles them, so this release path needs the Developer ID identity available in the keychain.

## Release (Windows installers, Debian package)

Run these on the machine that matches the platform; all three publish into the same GitHub release
`app-v<version>` (whichever runs first creates it), each asset with a `.sha256` file.

- `app\scripts\release-win.ps1 [-Publish] [-NoSign]` (PowerShell on Windows) builds the NSIS setup `.exe` and the WiX `.msi`
  as `os-lab_<v>_windows_x64-setup.exe` / `.msi`. Authenticode signing is optional: it is used when a certificate
  thumbprint or `.pfx` is configured (`secrets/README.md`), otherwise the installers are unsigned and SmartScreen warns.
  `-Publish` uses `gh`, or the credential git already stores for pushes.
- `app/scripts/release-deb.sh [--publish] [--install-deps]` (Debian/Ubuntu) builds `os-lab_<v>_linux_<arch>.deb`, checks that
  it depends on `python3`, bundles the runtime and contains no secret-looking file. Nothing to sign.

Signed Windows installers (free, through SignPath Foundation and GitHub Actions) are described in [SIGNING.md](SIGNING.md).

Like the macOS script, both refuse to run if anything under `secrets/` (except its README) or a key file is tracked.

## Content updates

Firewall Lab companies, guides, legal documents and (optionally) the Frida hooks update without a new app
release, from a signed pack on the `content-latest` GitHub release. The dashboard checks the signed
manifest when **This computer** opens if the last check is stale; it downloads the content pack only on request,
verifies the signature and every file, and keeps it in the app's data folder (`content/`), never over the bundled
copy. See `lat.md/content.md`; publish with `scripts/publish-content.sh --publish`.

## Not done yet

- No auto-update (needs a signing key).
- The 0.2.2 macOS DMG was signed, notarized and published. The 0.2.2 Windows and Debian installers were also published; installing and launching those builds is still untested.
- Only built and run on macOS (aarch64); the Windows and Linux paths (`py -3`, `taskkill`, the
  supervisor's `ctypes` parent check) compile-time-gated but untested.
- Phones are out of scope: labs need a desktop host.
- If a release build fails with `can't find crate for ..._macros`, run the same
  `cargo build --release --features tauri/custom-protocol` once, then `npm run build` again;
  it was flaky here on macOS 27 and not caused by the profile.
