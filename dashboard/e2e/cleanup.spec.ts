import { expect, test } from "@playwright/test";

test("scan, confirm, clean, leftovers and history use typed cleanup jobs", async ({ page }) => {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  const scan = { cancelled: false, entries: [{ id: "system.caches", name: "Caches", category: "system", risk: "low", sizeBytes: 42, files: 1, folders: 1, unreadable: [], paths: [{ path: "/tmp/caches", reason: "", source: "env:XDG_CACHE_HOME", sizeBytes: 42, error: null }] }], totals: { sizeBytes: 42, files: 1, folders: 1, unreadable: 0 } };
  const plan = { planId: "plan-1", mode: "trash", expiresAt: Date.now() / 1000 + 600, items: [{ entryId: "system.caches", entryName: "Caches", path: "/tmp/caches", status: "ready", code: "", reason: "", source: "env:XDG_CACHE_HOME", sizeBytes: 42, files: 1, folders: 1 }], totals: { ready: 1, skipped: 0, bytes: 42 } };
  const result = { planId: "plan-1", mode: "trash", cancelled: false, results: [{ entryId: "system.caches", entryName: "Caches", path: "/tmp/caches", status: "trashed", code: "", reason: "", source: "env:XDG_CACHE_HOME", error: null, bytes: 42, trashPath: "/tmp/Trash/caches" }], totals: { items: 1, trashed: 1, deleted: 0, skipped: 0, failed: 0, bytes: 42 } };
  const jobs: Record<string, unknown>[] = [];
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().postDataJSON?.() ?? {};
    if (route.request().method() === "POST") calls.push({ path, body });
    let data: unknown = {};
    if (path === "/api/cleanup/status") data = { state: "ready", reasons: [], requirements: [], capabilities: [] };
    else if (path === "/api/cleanup/catalog") data = { platform: "macos", entries: [{ id: "system.caches", name: "Caches", category: "system", risk: "low", hint: "Safe cache", impact: "", defaultSelected: true, needsPrivilege: false, paths: [{ template: "~/Caches", path: "/tmp/caches", reason: "" }] }] };
    else if (path === "/api/cleanup/jobs") data = { jobs };
    else if (path === "/api/cleanup/history") data = { entries: [{ id: 1, result, hmac: "abc" }], total: 1, verified: true };
    else if (path === "/api/cleanup/scan" || path === "/api/cleanup/plan" || path === "/api/cleanup/clean") {
      const kind = path.split("/").at(-1);
      const job = { id: `job-${kind}`, kind, state: "running", request: body, progress: {}, result: null, error: null };
      jobs.unshift(job); data = job;
    } else if (path.startsWith("/api/cleanup/jobs/")) {
      const kind = path.split("/")[4].replace("job-", "");
      data = { id: `job-${kind}`, kind, state: "done", request: calls.find((call) => call.path === `/api/cleanup/${kind}`)?.body ?? {}, progress: {}, result: kind === "scan" ? scan : kind === "plan" ? plan : result, error: null };
      const index = jobs.findIndex((job) => job.id === `job-${kind}`);
      if (index >= 0) jobs[index] = data as Record<string, unknown>;
    } else if (path === "/api/host") data = { host: { os: "macos", osPretty: "macOS", arch: "arm64", hostname: "test", cpus: 8, memory: 0, disk: null, kvm: { present: false, usable: false }, wsl: { guest: false, distributions: [] }, runtime: null, xcode: null, python: "3.12", root: "/tmp", tools: [], providers: [] }, labs: [] };
    else if (path === "/api/health") data = { status: "ok", version: "test", console: true };
    else if (path === "/api/jobs") data = { jobs: [] };
    else if (path === "/api/logs") data = { logs: [] };
    await route.fulfill({ json: data });
  });
  await page.goto("/cleanup/");
  await expect(page.getByRole("heading", { name: "Scan" })).toBeVisible();
  await page.getByRole("button", { name: "Scan selected" }).click();
  await expect(page.getByText("42 B measured")).toBeVisible();
  await page.getByRole("button", { name: "Build plan" }).click();
  await expect(page.getByText("1 items ready")).toBeVisible();
  await page.getByRole("button", { name: "Confirm clean" }).click();
  await expect(page.getByRole("dialog")).toContainText("Move to Trash");
  await page.getByRole("button", { name: "Run clean" }).click();
  await expect(page.getByText("moved to Trash, not freed")).toBeVisible();
  expect(calls.filter((call) => call.path === "/api/cleanup/clean")[0].body).toEqual({ planId: "plan-1" });
  await page.goto("/cleanup/results/");
  await expect(page.getByText("system · Caches")).toBeVisible();
  await expect(page.getByText("env:XDG_CACHE_HOME").first()).toBeVisible();
  await page.goto("/cleanup/leftovers/");
  await expect(page.getByText("No leftovers were reported.")).toBeVisible();
  await page.goto("/cleanup/history/");
  await expect(page.getByText("Run #1 · trash")).toBeVisible();
});

test("public cleanup route has no engine controls", async ({ page }) => {
  test.skip(!process.env.OSLAB_PAGES_TEST, "run against a Pages build");
  let apiCalls = 0;
  await page.route("**/api/**", async (route) => { apiCalls++; await route.abort(); });
  await page.goto("/os-lab/tr/cleanup/");
  await expect(page.getByText("Temizleme Laboratuvarı yerel uygulamada çalışır.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Scan selected" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sonuçlar" })).toHaveAttribute("href", "/os-lab/tr/cleanup/results/");
  expect(apiCalls).toBe(0);
});
