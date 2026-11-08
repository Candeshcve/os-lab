# Code signing policy

os-lab desktop releases are built from this public repository. Windows installer signing through
SignPath Foundation is planned; **the current Windows installers are unsigned**. Check the
Authenticode signature of a downloaded installer before relying on a claim that it is signed.

Free code signing provided by [SignPath.io](https://signpath.io), certificate by
[SignPath Foundation](https://signpath.org), if the project is accepted and a release is approved.

## Roles and approval

- **Committers and reviewers:** [repository maintainers](https://github.com/keyvanarasteh/os-lab/graphs/contributors). Changes from other contributors are reviewed by a maintainer before merge.
- **Signing approvers:** [the repository owner](https://github.com/keyvanarasteh), who reviews each release signing request in SignPath. A successful build alone does not approve signing.

The [Windows release workflow](.github/workflows/release-win.yml) builds installers on a GitHub-hosted
runner, submits the uploaded GitHub Actions artifact to SignPath, verifies Authenticode on the returned
files, and computes checksums from those signed bytes. It only publishes automatically after SignPath
credentials are configured and the signing request is approved. Pull request builds remain unsigned.

The [Privacy Notice](docs/legal/PRIVACY.md) describes local data and network connections. The
[install and uninstall guide](app/INSTALL.md) describes how to remove each desktop package.

SignPath Foundation's [terms](https://signpath.org/terms.html) apply to any future signed release.
Acceptance is SignPath Foundation's decision; this policy is not a claim of approval.
