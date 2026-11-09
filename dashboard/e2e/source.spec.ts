import { expect, test, type Page } from "@playwright/test";
async function sourceShell(page: Page) {
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let json: unknown = {};
    if (path === "/api/health") json = { status: "ok" };
    if (path === "/api/host") json = { host: { os: "linux", arch: "x86_64" }, labs: [{ id: "source", label: "Source Lab", state: "ready", actions: [] }] };
    if (path === "/api/jobs") json = { jobs: [] };
    if (path === "/api/logs") json = { logs: [] };
    if (path === "/api/source/analyzer/merged") json = matrixFixture;
    if (path === "/api/source/sources") json = { stats: {}, files: [], mergedExtensions: [], curated: [], monitored: [] };
    if (path === "/api/source/spotlight") json = { data: [{ title: "owned__sample", href: "/source/evidence/?slug=owned__sample" }] };
    await route.fulfill({ json });
  });
}

test("Source destinations hydrate and preserve query links", async ({ page }) => {
  await sourceShell(page);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  for (const route of ["", "analyzer", "evidence", "deep-analysis", "pipeline", "brain", "sources", "settings/runtime"]) {
    await page.goto(`/source/${route ? route + "/" : ""}?repo=owned/sample&file=main.js`);
    await expect(page.getByRole("navigation", { name: "Source Lab pages" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Source Lab pages" }).getByRole("link", { name: "Readiness & setup" })).toHaveAttribute("href", "/labs/source/");
    expect(new URL(page.url()).searchParams.get("repo")).toBe("owned/sample");
  }
  expect(errors).toEqual([]);
});

test("Source Spotlight record opens its target and Escape restores focus", async ({ page }) => {
  await sourceShell(page);
  await page.goto("/source/");
  await expect(page.getByRole("navigation", { name: "Source Lab pages" })).toBeVisible();
  await page.keyboard.press("Control+k");
  const search = page.getByRole("combobox", { name: "Spotlight search" });
  await expect(search).toBeFocused();
  await search.fill("owned");
  await page.getByRole("option", { name: /owned__sample/ }).click();
  await expect(page).toHaveURL(/source\/evidence\/\?slug=owned__sample/);
  await expect(page.getByRole("navigation", { name: "Source Lab pages" })).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(search).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(search).not.toBeVisible();
});

test("Source mobile drawer and theme work", async ({ page }) => {
  await sourceShell(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/source/deep-analysis/?repo=owned/sample&file=main.js");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Toggle theme" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
});

const matrixFixture = {
  stats: { totalAnalyzed: 1, mv2Count: 1, uniqueDepsCount: 1 }, truncated: false,
  propsMatrix: [{ name: "browser_action", count: 1, slugs: ["owned__sample"], category: "UI Surface", mv2: 1, mv3: 0, mvStatus: "MV2 Only", specNote: "Pinned fixture note", migrationNote: "Use action instead" }],
  depsMatrix: [{ name: "react", count: 1, slugs: ["owned__sample"], category: "UI / Framework", sections: ["dependencies"] }],
  permsMatrix: [{ name: "nativeMessaging", count: 1, slugs: ["owned__sample"], risk: "high" }],
  swGroups: { serviceWorker: [], persistentScript: ["owned__sample"], backgroundPage: [], none: [] },
  extensions: [{ slug: "owned__sample", repo: "owned/sample", name: "Owned fixture", manifestVersion: "2", version: "1", description: "Owned fixture only", riskLevel: "HIGH", heuristicScore: 3, backgroundType: "persistentScript", dependenciesCount: 1, permissions: ["nativeMessaging"] }]
};
test("Source Overview matrices filter, inspect notes, link targets and export", async ({ page }) => {
  await sourceShell(page);
  await page.route("**/api/source/analyzer/merged*", route => route.fulfill({ json: matrixFixture }));
  await page.goto("/source/");
  await expect(page.getByRole("tabpanel").getByText("browser_action")).toBeVisible();
  await page.getByRole("tabpanel").getByRole("button", { name: "Inspect" }).click();
  const inspector = page.getByRole("dialog", { name: "Source inspector" });
  await expect(inspector.getByText("Use action instead")).toBeVisible();
  await expect(inspector.getByRole("link", { name: "owned__sample" })).toHaveAttribute("href", "/source/deep-analysis/?repo=owned%2Fsample");
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Dependencies" }).click();
  await expect(page.getByRole("tabpanel").getByText("react")).toBeVisible();
  await page.getByRole("tab", { name: "Dependencies" }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Permissions" })).toBeFocused();
  await expect(page.getByRole("tabpanel").getByText("nativeMessaging")).toBeVisible();
  await page.getByLabel("Filter results").fill("absent");
  await expect(page.getByText("No matching results. Add authorized targets or adjust filters.")).toBeVisible();
  await expect(page).toHaveURL(/tab=perms&q=absent/);
  await expect(page.getByRole("link", { name: "Download CSV" })).toHaveAttribute("href", "/api/source/analyzer/merged?export=csv");
});
test("Source Overview and catalogs report loading, empty and failed requests", async ({ page }) => {
  await sourceShell(page);
  await page.route("**/api/source/analyzer/merged*", async route => {
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.fulfill({ status: 400, json: { error: "Invalid private artifact" } });
  });
  await page.goto("/source/");
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText("Invalid private artifact");
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await page.route("**/api/source/sources", route => route.fulfill({ json: { stats: {}, files: [], mergedExtensions: [], curated: [], monitored: [] } }));
  await page.goto("/source/sources/");
  await expect(page.getByText("No matching sources.")).toBeVisible();
});
