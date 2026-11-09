import { expect, test, type Page } from "@playwright/test";
import type { LabStatus } from "../src/lib/api";

const labs: LabStatus[] = [
  { id: "source", label: "Source Lab", summary: "Local source analysis", state: "ready", provider: "native-python", reasons: [],
    requirements: [{ id: "python", label: "Python 3.11+", found: true, required: true, hint: "" },
                   { id: "playwright", label: "Playwright", found: false, required: false, hint: "Optional browser collector" }],
    notes: [], actions: [{ id: "doctor", label: "Doctor", description: "Check tools", privileged: false },
                         { id: "setup", label: "Setup", description: "Create storage", privileged: false }], installed: true },
  { id: "macos", label: "macOS Lab", summary: "Native Xcode Simulator", state: "ready", provider: "native-macos", reasons: [], requirements: [], notes: [], actions: [], installed: true },
  { id: "ios", label: "iOS Lab", summary: "iOS Simulator", state: "ready", provider: "native-macos", reasons: [], requirements: [], notes: [], actions: [], installed: true },
  { id: "android", label: "Android Lab", summary: "Android analysis", state: "needs-setup", provider: "macos-containers", reasons: ["Missing container engine"], requirements: [], notes: [], actions: [], installed: true },
  { id: "windows", label: "Windows Lab", summary: "Windows VM", state: "unavailable", provider: null, reasons: ["Needs Linux/KVM"], requirements: [], notes: [], actions: [], installed: true },
  { id: "linux", label: "Linux Lab", summary: "Linux VM", state: "unavailable", provider: null, reasons: ["Needs Linux/KVM"], requirements: [], notes: [], actions: [], installed: true }
];
const content = {
  installed: false, version: "0.2.5", sequence: 1, hooks: false, updatedAt: null, fileCount: 0,
  latest: { version: "content-149", sequence: 149, files: { data: 10, hooks: 0 } },
  checkedAt: Date.now() / 1000, offline: false, source: "bundled", updateAvailable: true
};

async function mockApi(page: Page, os: "macos" | "windows" | "linux" = "macos", labPatch: Record<string, Partial<LabStatus>> = {}) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = {};
    if (path === "/api/host") body = {
      host: {
        os, osPretty: os === "macos" ? "macOS" : os === "windows" ? "Windows" : "Linux", arch: "x86_64",
        hostname: "test-host", cpus: 8, memory: 16 * 1024 ** 3, disk: { free: 100 * 1024 ** 3, total: 500 * 1024 ** 3 },
        kvm: { present: os === "linux", usable: os === "linux" }, wsl: { guest: false, distributions: os === "windows" ? ["Ubuntu"] : [] },
        runtime: null, xcode: os === "macos" ? { installed: true, iosRuntime: true, iosDevice: true } : null,
        python: "3.12", root: "/tmp/os-lab", tools: [], providers: []
      },
      labs: (os === "macos" ? labs : labs.map((lab) => lab.id === "source" ? lab : ({ ...lab,
        state: (lab.id === os ? "ready" : lab.id === "macos" ? "unavailable" : "needs-setup") as LabStatus["state"],
        provider: lab.id === "macos" ? null : os === "windows" ? "wsl2" : "linux-containers"
      }))).map((lab) => ({ ...lab, ...labPatch[lab.id] }))
    };
    else if (path === "/api/health") body = { status: "ok", version: "0.2.5", console: true };
    else if (path === "/api/capabilities") body = {
      platforms: ["macos", "windows", "linux"].map((id) => ({ id, label: id, installer: "test installer", engine: "test engine" })),
      groups: [{ id: "labs", title: "Labs", description: "Platform support", items: [{
        id: "lab-ios", lab: "ios", title: "iOS Lab", summary: "iOS tooling",
        support: { macos: { level: "full", note: "Native Xcode" }, windows: { level: "partial", note: "WSL2" }, linux: { level: "partial", note: "KVM" } }
      }] }]
    };
    else if (/^\/api\/labs\/[a-z]+\/config$/.test(path)) body = { lab: path.split("/")[3], path: "config.env", exists: true, fields: [], profiles: [], backups: [], endpoints: [{ label: "Appium", address: "http://127.0.0.1:4723/" }] };
    else if (/^\/api\/labs\/[a-z]+\/monitor$/.test(path)) body = { lab: path.split("/")[3], state: "stopped", containers: [] };
    else if (path === "/api/content/status" || path === "/api/content/check") body = content;
    else if (path === "/api/content/update") body = { ...content, installed: true, version: "content-149", sequence: 149, updateAvailable: false };
    else if (path === "/api/reports") body = { reports: [] };
    else if (path === "/api/apks") body = { apks: [] };
    else if (path === "/api/hooks") body = { hooks: [] };
    else if (path === "/api/devices") body = { devices: "List of devices attached\n" };
    else if (path === "/api/jobs") body = { jobs: [] };
    else if (path === "/api/logs") body = { logs: [] };
    await route.fulfill({ json: body });
  });
}

test("content card checks and installs while keeping advanced options available", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  const card = page.locator("#content");
  await expect(card).toBeVisible();
  await expect(card.getByText("A newer content pack is available.").first()).toBeVisible();
  await card.getByRole("button", { name: "Install update" }).click();
  await expect(card.getByText("Content updated.")).toBeVisible();
  await card.getByText("Advanced options").click();
  await expect(card.getByText("Include Frida hooks")).toBeVisible();
});

test("Turkish page renders the content card without layout overflow", async ({ page }) => {
  await mockApi(page);
  await page.goto("/tr/");
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.locator("#content")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

for (const locale of ["ar", "fa"] as const) {
  test(`${locale} content page keeps its right-to-left layout inside the viewport`, async ({ page }) => {
    await mockApi(page);
    await page.goto(`/${locale}/`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("#content")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
}

for (const os of ["macos", "windows", "linux"] as const) {
  test(`Health shows ${os} live checks and API capability tree`, async ({ page }) => {
    await mockApi(page, os);
    await page.goto("/health/");
    await expect(page.getByRole("heading", { name: "Health check" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What os-lab supports" })).toBeVisible();
    await expect(page.getByRole("tab", { name: new RegExp(os, "i") })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("iOS tooling")).toBeVisible();
    await expect(page.getByRole("link", { name: /setup guide/i })).toBeVisible();
  });
}

for (const [os, hidden, shown] of [
  ["macos", ["windows", "linux"], ["macos", "ios", "android"]],
  ["windows", ["macos"], ["windows", "linux", "android"]],
  ["linux", ["macos"], ["linux", "windows", "android"]]
] as const) {
  test(`${os} host leaves out labs it cannot run`, async ({ page }) => {
    await mockApi(page, os);
    await page.goto("/");
    for (const id of shown) await expect(page.locator(`a[href$="/labs/${id}/"]`).first()).toBeVisible();
    for (const id of hidden) await expect(page.locator(`a[href$="/labs/${id}/"]`)).toHaveCount(0);
    await expect(page.getByText("Labs that do not run on this computer:")).toBeVisible();
    await expect(page.getByRole("link", { name: "See what each platform supports" })).toBeVisible();
  });
}

test("a lab that is missing requirements hides its runtime sections until they are met", async ({ page }) => {
  await mockApi(page);
  await page.goto("/labs/android/");
  await expect(page.getByText("Start, stop and the other actions appear once the missing dependencies are installed.")).toBeVisible();
  await expect(page.getByText("Live monitor")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Endpoints" })).toHaveCount(0);
  await page.goto("/labs/ios/");
  await expect(page.getByRole("heading", { name: "Actions" })).toBeVisible();
  await expect(page.getByText("Start, stop and the other actions appear once the missing dependencies are installed.")).toHaveCount(0);
  await expect(page.getByText("Live monitor")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Endpoints" })).not.toBeVisible();
  await page.getByText("Advanced settings").click();
  await expect(page.getByRole("heading", { name: "Endpoints" })).toBeVisible();
});

test("setup is offered only when a required dependency is missing", async ({ page }) => {
  const setup = { id: "setup", label: "Setup", description: "Install prerequisites", privileged: false };
  const found = { id: "runtime", label: "Container runtime", found: true, required: true, hint: "" };
  await mockApi(page, "macos", { ios: { actions: [setup], requirements: [found] } });
  await page.goto("/labs/ios/");
  await expect(page.getByRole("button", { name: "Install dependencies" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Dependencies" })).toBeVisible();
});

test("a missing required dependency offers setup", async ({ page }) => {
  const setup = { id: "setup", label: "Setup", description: "Install prerequisites", privileged: false };
  const missing = { id: "runtime", label: "Container runtime", found: false, required: true, hint: "Install it" };
  await mockApi(page, "macos", { ios: { state: "needs-setup", actions: [setup], requirements: [missing] } });
  await page.goto("/labs/ios/");
  await expect(page.getByRole("button", { name: "Install dependencies" })).toBeVisible();
});

test("Android run failures are shown next to the action", async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/run", (route) => route.fulfill({ status: 400, json: { error: "Target APK is missing" } }));
  await page.goto("/android/workflows/");
  await page.getByRole("button", { name: "Execute Pipeline" }).click();
  await expect(page.getByRole("alert")).toContainText("Target APK is missing");
});

test("every local page type hydrates without a browser error", async ({ page }) => {
  await mockApi(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of [
    "/", "/jobs/", "/contribute/", "/feedback/", "/content/", "/health/", "/legal/",
    "/legal/terms/", "/legal/acceptable-use/", "/legal/privacy/", "/legal/third-party/",
    "/labs/android/", "/labs/ios/", "/labs/windows/", "/labs/linux/", "/labs/macos/",
    "/android/", "/android/providers/", "/android/workflows/", "/android/console/",
    "/android/analytics/", "/android/sitemap/", "/firewall/"
  ]) {
    errors.length = 0;
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('button[aria-label="Open search"]').first(), route).toBeVisible();
    expect(errors, route).toEqual([]);
  }
});

for (const locale of ["", "/tr"]) {
  test(`legal document links preserve ${locale || "English"} routing`, async ({ page }) => {
    await mockApi(page);
    await page.goto(`${locale}/legal/privacy/`);
    const article = page.locator("article.legal-doc");
    await expect(article.getByRole("link", { name: "Third-Party Notices" })).toHaveAttribute("href", `${locale}/legal/third-party/`);
    await expect(article.getByRole("link", { name: "Terms of Use" })).toHaveAttribute("href", `${locale}/legal/terms/`);
    await expect(page.locator("main nav a[aria-current=page]")).toHaveAttribute("href", `${locale}/legal/privacy/`);
    await article.getByRole("link", { name: "Terms of Use" }).click();
    await expect(page).toHaveURL(new RegExp(`${locale}/legal/terms/$`));
  });
}


test("Source readiness keeps optional browser tooling separate from core setup", async ({ page }) => {
  await mockApi(page, "linux");
  await page.goto("/labs/source/");
  await expect(page.getByRole("main").getByRole("heading", { name: "Source Lab", exact: true })).toBeVisible();
  await expect(page.getByText("Python 3.11+", { exact: true })).toBeVisible();
  await expect(page.locator("li").filter({ hasText: "Playwright" }).getByText("optional", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Install dependencies" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Doctor", exact: true })).toBeVisible();
});

test("Source jobs show interrupted recovery without a success badge", async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/jobs", route => route.fulfill({ json: { jobs: [{
    id: "source-interrupted", label: "Source Lab · Detect", lab: "source", action: "detect", command: "owned fixture",
    state: "interrupted", startedAt: Date.now() / 1000, finishedAt: Date.now() / 1000,
    exitCode: null, error: "Console stopped before completion", truncated: false, lines: 0
  }] } }));
  await page.route("**/api/jobs/source-interrupted", route => route.fulfill({ json: { logs: [], state: "interrupted" } }));
  await page.goto("/jobs/");
  await expect(page.getByText("interrupted", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Console stopped before completion")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel", exact: true })).toHaveCount(0);
});
