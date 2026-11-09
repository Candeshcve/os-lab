# Signing the Windows installers

Unsigned installers make Windows SmartScreen warn on first run ("Windows protected your PC"). Two ways
to ship the Windows app, both free:

| | Local `release-win.ps1` | GitHub Actions `release-win` |
|---|---|---|
| Where it builds | your Windows machine | a GitHub-hosted runner (free for public repositories) |
| Signed | no, unless you own a certificate | yes, through SignPath Foundation |
| SmartScreen | Warns for an unsigned file | Reputation may still need to build after signing |

## Option 1: unsigned, local

```powershell
app\scripts\release-win.ps1 -Publish
```

Publishes `os-lab_<v>_windows_x64-setup.exe` and `.msi` with `.sha256` files to the release `app-v<v>`.
Users click **More info → Run anyway**. Verify a download with the `.sha256` file.

## Option 2: signed, GitHub Actions + SignPath Foundation

[SignPath Foundation](https://signpath.org/) gives open-source projects a publicly trusted
code-signing certificate for free. os-lab qualifies: the repository is public and Apache-2.0
licensed. The private key stays in SignPath's hardware module, so signing only works from a
pipeline SignPath can trace to this repository. That is why this runs in GitHub Actions and
cannot be done from a laptop.

The workflow [`.github/workflows/release-win.yml`](../.github/workflows/release-win.yml) runs on a
pushed `app-v*` tag, or manually (**Actions → release-win → Run workflow**, tick *publish*). It
builds the installers, submits them to SignPath, checks that each signature is `Valid`, writes the
`.sha256` files and uploads everything to the release.

### One-time setup

1. Apply at <https://signpath.org/foundation> (needs a public repo with an OSI license, active
   releases, no proprietary parts). Approval takes a few days.
2. In SignPath, create the project `os-lab` with a signing policy `release-signing`, and connect it
   to this GitHub repository as a trusted build system.
3. Add an **artifact configuration** that signs the two installers inside the uploaded zip, for
   example:

   ```xml
   <artifact-configuration xmlns="http://signpath.io/artifact-configuration/v1">
     <zip-file>
       <pe-file path="*-setup.exe"><authenticode-sign/></pe-file>
       <msi-file path="*.msi"><authenticode-sign/></msi-file>
     </zip-file>
   </artifact-configuration>
   ```

4. In the GitHub repository settings add:
   - secret `SIGNPATH_API_TOKEN` (a SignPath API token for a CI user)
   - variable `SIGNPATH_ORGANIZATION_ID`
   - optional variables `SIGNPATH_PROJECT_SLUG` (default `os-lab`) and `SIGNPATH_POLICY_SLUG`
     (default `release-signing`)
5. Credit SignPath on the release page or README, as the Foundation requires: *Free code signing
   provided by [SignPath.io](https://signpath.io), certificate by
   [SignPath Foundation](https://signpath.org).*

Until `SIGNPATH_ORGANIZATION_ID` is set the workflow builds **unsigned artifacts for review** but
does not publish them from a tag. A manual workflow run can publish unsigned installers only when
both *publish* and *allow_unsigned* are selected. No certificate or key is ever stored in the
repository.

### Re-signing an existing release

Run the workflow manually with *publish* ticked. Uploads use `--clobber`, so the signed files
replace the unsigned ones in `app-v<v>`.
