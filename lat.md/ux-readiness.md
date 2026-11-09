# UX readiness

The interface should show a next step that the current host can actually take. The detailed checklist is [[docs/UX_READINESS.md]].

## Lab state and actions

[[console/oslab.py]] produces each lab's requirements, state, provider, and available actions. [[dashboard/src/views/host-page.tsx]] and [[dashboard/src/views/lab-page.tsx]] offer setup only when a required prerequisite is missing.

Optional Appium tooling has its own action. Lab actions go through a preview and then a background job.

## Detail and endpoint status

[[dashboard/src/views/lab-page.tsx]] keeps dependencies and actions visible while endpoints and configuration live in a collapsed Advanced settings panel. [[dashboard/src/views/android/pages.tsx]] keeps its secondary emulator endpoint list compact.

An address from configuration describes where a service would answer; it does not establish that the service is running.

## Public and local navigation

[[dashboard/src/shell/top-bar.tsx]] shows engine status only in the local app. [[dashboard/src/i18n/paths.ts]] handles locale and Pages base paths. [[dashboard/src/views/feedback-page.tsx]] provides issue, feature, discussion, and private security routes from both navigation modes.

Legal Markdown cross-links in [[dashboard/src/lib/legal.ts#rewriteLinks]] and
legal tabs/cards in [[dashboard/src/views/legal-page.tsx]] preserve the current
locale and Pages base path. Article links are localized at build time because
legal prose is excluded from client translation.

## Verification

[[dashboard/e2e/health-and-content.spec.ts]] covers dependency actions, advanced details, run failures, and hydration across page types. Dashboard type, translation, and static build checks complement browser tests. Public Pages links and locale switching are checked under `/os-lab/`.

[[dashboard/scripts/source-pages-smoke.mjs]] checks every Source route and guide
across all eight locales below `/os-lab/`, including query-preserving language
switches. Public pages must issue no engine calls or operation controls.

[[scripts/deploy-page.sh]] must retain public Source guides and community/legal
links in every locale while filtering console-only routes. Test its final
post-processed artifact, not only the raw Astro Pages output.

[[dashboard/scripts/how-to-use-pages-smoke.mjs]] checks the Workspace task
prompt builder across all eight public locales, including clipboard output,
language switching, mobile layout and absence of engine calls. Run both public
smoke scripts after applying the deployment filters.
