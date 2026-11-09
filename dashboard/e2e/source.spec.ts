import { expect, test, type Page } from "@playwright/test";
async function sourceShell(page: Page) {
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let json: unknown = {};
    if (path === "/api/health") json = { status: "ok" };
    if (path === "/api/host") json = { host: { os: "linux", arch: "x86_64" }, labs: [{ id: "source", label: "Source Lab", state: "ready", actions: [] }] };
    if (path === "/api/jobs") json = { jobs: [] };
    if (path === "/api/logs") json = { logs: [] };
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
