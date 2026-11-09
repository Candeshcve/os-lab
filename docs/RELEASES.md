# App releases

Release packages use the scripts in `app/scripts/` on their matching hosts.
Linux and macOS workflows publish signed packages. Windows review builds can
run independently; publication requires SignPath configuration or explicit
unsigned-release approval. Local builds remain supported. The
`updater-manifest` workflow publishes the signed feed only when all required
platform assets are present. The release note for each version follows.

## Publish the updater feed ("latest" detection)

The desktop app and the dashboard's **App update** card read the signed feed at
`app-updates/latest.json`. It is published automatically: `.github/workflows/updater-manifest.yml`
runs every 20 minutes, on release changes, and on demand. It picks the newest non-draft
`app-v*` release whose five signed assets are all present, builds the manifest, verifies every
signature with the pinned public key, uploads `latest.json` and marks that release as GitHub
Latest. A newer release with incomplete assets is skipped, and the feed is never downgraded, so
uploading the platforms one by one is safe.

No command is needed. To run it by hand (or pin a version before the schedule catches up):

```bash
node scripts/publish-app-update.mjs --detect-latest --check   # what would be published
node scripts/publish-app-update.mjs --detect-latest --mark-latest --verify
node scripts/publish-app-update.mjs 0.2.8 --mark-latest --verify
```

The script reads assets from `app/out/<version>` when present, otherwise downloads them from the
release with `gh`, verifies every SHA-256 through `app/scripts/build-update-manifest.mjs`, and
uploads `latest.json` to the `app-updates` prerelease.

## 0.3.0

- Add Source Lab: portable five-platform static analysis, signed evidence,
  structural maps, crawler/catalog workflows and guarded background jobs.
- Add Overview, Evidence/runtime, Deep analysis, Pipeline and bounded Brain
  snapshot pages with localized navigation and informational public Pages.
- Add authorized legacy artifact import with reviewed hashes/backups/rollback;
  preserve private Source state across desktop updates.
- Include workflow guides, owned-fixture acceptance and explicit capability
  limits. Skills, databases, OpenAPI and further merger UI remain excluded.
- Native/live verification and related patches are tracked as Source Lab bonus
  contributions; native manual Source acceptance is not claimed.
- Published Linux amd64/arm64 `.deb`, `.rpm` and `.AppImage`, macOS universal
  `.dmg`/`.app.tar.gz`, and Windows x64 setup/MSI with hashes and verified updater
  signatures. macOS is Developer ID signed and notarized. Windows has no
  Authenticode signature and may show SmartScreen; publication was approved by
  the owner. The updater feed covers all five platform entries.

## 0.2.9

- Add **Don't show this warning next time** to the container-runtime launcher page. The choice is
  remembered; **File → Container setup…** reopens the page so the warning can be restored.
- Keep an explicit **Retry** checking the engine even when the warning is hidden.

## 0.2.8

- Add the **App update** card; it checks the signed feed and appears only when a newer build exists.
- Show the content card only when a newer signed pack is available.
- Publish the updater feed automatically through the `updater-manifest` workflow.

## 0.2.7

- Add DNS roadmap tasks OS-37..OS-40 to the contribute page.
- Reserve roadmap tasks through a pull request.
- Rebuilt dashboard for all locales.

Assets published on `app-v0.2.7`:

| Platform | Files |
| --- | --- |
| Linux amd64 | `.deb`, `.rpm`, `.AppImage`, each with `.sha256` and `.sig` |
| Linux arm64 | `.deb`, `.rpm`, `.AppImage`, each with `.sha256` and `.sig` |
| macOS universal | `.dmg` and `.app.tar.gz`, each with `.sha256` and `.sig` |
| Windows x64 | `-setup.exe` and `.msi`, each with `.sha256` and `.sig` |

Linux packages were built locally with `app/scripts/release-deb.sh --all-formats` on an amd64
host. Verify a download by comparing it with the adjacent `.sha256`, and verify the detached
signature with `app/scripts/verify-release-signature.py <package> --version 0.2.7`.
