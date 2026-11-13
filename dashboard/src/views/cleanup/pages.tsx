import { useEffect, useState } from "react";
import { BroomIcon } from "@phosphor-icons/react";
import { AppShell } from "../../shell/app-shell";
import { TopBar } from "../../shell/top-bar";
import { Empty, PageHead, Section, Status } from "../../components/ui";
import { api, type CleanupEntry, type CleanupHistory, type CleanupJob, type CleanupPlan, type CleanupResult, type CleanupScan, type CleanupStatus } from "../../lib/api";
import { localeFromPath, localePath } from "../../i18n/paths";

export type CleanupPageId = "" | "results" | "leftovers" | "history";
export const CLEANUP_PAGES: CleanupPageId[] = ["", "results", "leftovers", "history"];
const PUBLIC = import.meta.env.PUBLIC_SITE_MODE === "pages";
const bytes = (value: number) => value < 1024 ? `${value} B` : `${(value / 1024 ** (value < 1024 ** 2 ? 1 : value < 1024 ** 3 ? 2 : 3)).toFixed(1)} ${value < 1024 ** 2 ? "KiB" : value < 1024 ** 3 ? "MiB" : "GiB"}`;
const errorText = (error: unknown) => error instanceof Error ? error.message : String(error);
const isScan = (job: CleanupJob): job is CleanupJob & { result: CleanupScan } => job.kind === "scan" && !!job.result;
const isPlan = (job: CleanupJob): job is CleanupJob & { result: CleanupPlan } => job.kind === "plan" && !!job.result;
const isClean = (job: CleanupJob): job is CleanupJob & { result: CleanupResult } => job.kind === "clean" && !!job.result;

export default function CleanupPage({ page = "" }: { page?: CleanupPageId }) {
  const [status, setStatus] = useState<CleanupStatus | null>(null);
  const [entries, setEntries] = useState<CleanupEntry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [jobs, setJobs] = useState<CleanupJob[]>([]);
  const [active, setActive] = useState<CleanupJob | null>(null);
  const [history, setHistory] = useState<CleanupHistory | null>(null);
  const [loading, setLoading] = useState(!PUBLIC);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"trash" | "delete">("trash");
  const [confirm, setConfirm] = useState(false);
  const [now, setNow] = useState(Date.now() / 1000);
  const locale = typeof window === "undefined" ? "en" : localeFromPath(window.location.pathname);
  const link = (suffix: string) => localePath(`/cleanup/${suffix}`, locale);

  useEffect(() => {
    if (PUBLIC) return;
    let alive = true;
    Promise.all([api.cleanupStatus(), api.cleanupCatalog(), api.cleanupJobs()])
      .then(([ready, catalog, recent]) => {
        if (!alive) return;
        setStatus(ready);
        setEntries(catalog.entries);
        setSelected(catalog.entries.filter((item) => item.defaultSelected && item.risk !== "credentials" && item.risk !== "privacy").map((item) => item.id));
        setJobs(recent.jobs);
      })
      .catch((error) => { if (alive) setLoadError(errorText(error)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [page]);

  useEffect(() => {
    if (PUBLIC || page !== "history") return;
    let alive = true;
    void api.cleanupHistory().then((value) => { if (alive) setHistory(value); })
      .catch((error) => { if (alive) setLoadError(errorText(error)); });
    return () => { alive = false; };
  }, [page]);

  useEffect(() => {
    if (!active || active.state !== "running") return;
    let alive = true;
    const timer = window.setInterval(() => {
      void api.cleanupJob(active.id).then((job) => {
        if (!alive) return;
        setActive(job);
        if (job.state !== "running") setJobs((old) => [job, ...old.filter((row) => row.id !== job.id)]);
      }).catch((error) => { if (alive) { setActionError(errorText(error)); setActive(null); } });
    }, 650);
    return () => { alive = false; window.clearInterval(timer); };
  }, [active?.id, active?.state]);

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now() / 1000), 1000); return () => window.clearInterval(timer); }, []);
  const latestScan = (active && isScan(active) ? active : jobs.find(isScan))?.result as CleanupScan | undefined;
  const planJob = active && isPlan(active) ? active : jobs.find(isPlan);
  const latestPlan = planJob?.result as CleanupPlan | undefined;
  const latestClean = (active && isClean(active) ? active : jobs.find(isClean))?.result as CleanupResult | undefined;
  const planUsed = !!latestPlan && jobs.some((job) => isClean(job) && job.request.planId === latestPlan.planId);
  const busy = submitting || active?.state === "running";
  const canWork = status?.state === "ready" && !busy;

  async function start(action: () => Promise<CleanupJob>) {
    setActionError(""); setSubmitting(true); setConfirm(false);
    try { const job = await action(); setActive(job); setJobs((old) => [job, ...old]); }
    catch (error) { setActionError(errorText(error)); }
    finally { setSubmitting(false); }
  }
  async function cancel() {
    if (!active) return;
    setActionError("");
    try { await api.cleanupCancel(active.id); }
    catch (error) { setActionError(errorText(error)); }
  }
  const tabs: { id: CleanupPageId; label: string; path: string }[] = [
    { id: "", label: "Scan & clean", path: "" }, { id: "results", label: "Results", path: "results/" },
    { id: "leftovers", label: "Leftovers", path: "leftovers/" }, { id: "history", label: "History", path: "history/" }
  ];
  return <AppShell activeId={`cleanup-${page || "scan"}`}>
    <TopBar title="Cleanup Lab" icon={<BroomIcon size={20} />} />
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 sm:p-6">
      <PageHead icon={<BroomIcon size={22} />} title="Cleanup Lab" description="Measure reclaimable space, review a plan, then confirm each clean." />
      <nav aria-label="Cleanup pages" className="flex flex-wrap gap-2">{tabs.map((tab) =>
        <a key={tab.id} href={link(tab.path)} aria-current={page === tab.id ? "page" : undefined} className="iux-btn" data-variant={page === tab.id ? "primary" : "outline"}>{tab.label}</a>)}</nav>
      {PUBLIC ? <Section title="Local app required"><p>The Cleanup Lab runs in the local app. Install and open os-lab on your computer to scan and clean.</p></Section> :
        loading ? <p role="status">Loading cleanup readiness…</p> : loadError ? <Status value={{ ok: false, text: loadError }} /> : <>
          <Section title="Readiness" description={status?.state === "ready" ? "Ready to scan" : status?.state === "needs-setup" ? "Setup needed before scanning" : "Unavailable on this system"}>
            {status?.reasons.map((reason) => <p key={reason}>{reason}</p>)}
            {status?.requirements.filter((item) => !item.found).map((item) => <p key={item.id}>{item.label}: {item.hint}</p>)}
            <button type="button" className="iux-btn mt-3" onClick={() => { setLoading(true); void api.cleanupStatus().then(setStatus).catch((error) => setLoadError(errorText(error))).finally(() => setLoading(false)); }}>Re-check</button>
          </Section>
          {page === "" && <>
            <Section title="Scan" description="Choose catalog entries. Scanning only measures files; it does not remove them.">
              {!entries.length ? <Empty>No cleanup entries are available on this system.</Empty> :
                <div className="grid gap-2 sm:grid-cols-2">{entries.map((item) => <label key={item.id} className="rounded-md border border-(--iux-border) p-3 text-sm">
                  <input type="checkbox" checked={selected.includes(item.id)} disabled={busy} onChange={(event) => { setSelected((old) => event.target.checked ? [...old, item.id] : old.filter((id) => id !== item.id)); setConfirm(false); }} /> <strong>{item.name}</strong> · {item.risk}
                  <p className="text-(--iux-muted-foreground)">{item.hint}</p>
                </label>)}</div>}
              <div className="mt-3 flex flex-wrap gap-2"><button type="button" className="iux-btn" data-variant="primary" disabled={!canWork || !selected.length} onClick={() => void start(() => api.cleanupScan(selected))}>Scan selected</button>
                {active?.state === "running" && <button type="button" className="iux-btn" onClick={() => void cancel()}>Cancel</button>}</div>
              {active?.state === "running" && <p role="status">{active.kind} in progress · {String(active.progress?.pathsDone ?? active.progress?.itemsDone ?? 0)} / {String(active.progress?.pathsTotal ?? active.progress?.itemsTotal ?? 0)}<span translate="no" className="block break-all">{active.progress?.currentPath}</span></p>}
              {active?.state === "failed" && <Status value={{ ok: false, text: active.error || "The cleanup job failed." }} />}
              {actionError && <Status value={{ ok: false, text: actionError }} />}
            </Section>
            {latestScan && <Section title="Scan results" description={`${bytes(latestScan.totals.sizeBytes)} measured across ${latestScan.entries.length} entries`}>
              {latestScan.cancelled && <p>Scan cancelled. Results are partial.</p>}
              {latestScan.entries.length ? latestScan.entries.map((item) => <div key={item.id} className="border-b border-(--iux-border) py-2 text-sm"><strong>{item.name}</strong> · {bytes(item.sizeBytes)} · {item.files} files</div>) : <Empty>No measured results yet.</Empty>}
              <a className="iux-btn mt-3" href={link("results/")}>View results</a>
            </Section>}
            <Section title="Plan & confirm" description="A plan checks every path again. Trash is the default; permanent deletion requires an explicit choice.">
              <label className="text-sm">Mode <select value={mode} disabled={busy} onChange={(event) => { setMode(event.target.value as "trash" | "delete"); setConfirm(false); }} className="ml-2 rounded-md border border-(--iux-border) bg-(--iux-background) p-2"><option value="trash">Trash (default)</option><option value="delete">Delete permanently</option></select></label>
              {mode === "delete" && <p className="mt-2 text-sm">Deleting permanently cannot be undone.</p>}
              <div className="mt-3"><button type="button" className="iux-btn" disabled={!canWork || !selected.length} onClick={() => void start(() => api.cleanupPlan(selected, mode))}>Build plan</button></div>
              {latestPlan && <div className="mt-4"><p>{latestPlan.totals.ready} items ready · {bytes(latestPlan.totals.bytes)} · expires in {Math.max(0, Math.ceil(latestPlan.expiresAt - now))} seconds</p>
                {latestPlan.items.map((item, index) => <div key={`${item.entryId}-${index}`} className="border-b border-(--iux-border) py-2 text-sm"><strong>{item.entryName}</strong> · {item.status} · {bytes(item.sizeBytes)}<p translate="no" className="break-all">{item.path}</p>{item.reason && <p>{item.reason}</p>}</div>)}
                {latestPlan.expiresAt <= now && <p>This plan expired. Build a new plan.</p>}
                {planUsed && <p>This plan was already run. Build a new plan.</p>}
                <button type="button" className="iux-btn mt-3" data-variant="primary" disabled={!canWork || !latestPlan.totals.ready || latestPlan.expiresAt <= now || planUsed || latestPlan.mode !== mode || JSON.stringify([...(planJob?.request.entryIds ?? [])].sort()) !== JSON.stringify([...selected].sort())} onClick={() => setConfirm(true)}>Confirm clean</button>
              </div>}
              {confirm && latestPlan && <div role="dialog" aria-modal="true" aria-label="Confirm cleanup" className="mt-4 rounded-md border border-(--iux-border) p-4"><p>Clean {latestPlan.totals.ready} items · {bytes(latestPlan.totals.bytes)} · {latestPlan.mode === "trash" ? "Move to Trash" : "Delete permanently"}?</p><div className="mt-3 flex gap-2"><button type="button" className="iux-btn" data-variant="primary" onClick={() => void start(() => api.cleanupClean(latestPlan.planId))}>Run clean</button><button type="button" className="iux-btn" onClick={() => setConfirm(false)}>Back</button></div></div>}
            </Section>
            {latestClean && <Section title="Clean result" description={`${bytes(latestClean.totals.bytes)} ${latestClean.mode === "trash" ? "moved to Trash, not freed" : "deleted permanently"}`}><a className="iux-btn" href={link("leftovers/")}>View leftovers</a></Section>}
          </>}
          {page === "results" && <>
            <Section title="Results by category" description="Measurements from the latest scan in this console session.">
              {!latestScan ? <Empty>No scan results yet. Run a scan first.</Empty> : latestScan.entries.map((item) => <div key={item.id} className="border-b border-(--iux-border) py-3"><strong>{item.category} · {item.name}</strong><p>{bytes(item.sizeBytes)} · {item.files} files · {item.folders} folders</p>{item.paths.map((path, index) => <p key={index} className="break-all text-sm" translate="no">{path.path || path.reason} · {bytes(path.sizeBytes)}</p>)}</div>)}
            </Section>
            <Section title="Clean result" description={latestClean ? `${bytes(latestClean.totals.bytes)} ${latestClean.mode === "trash" ? "moved to Trash, not freed" : "deleted permanently"}` : undefined}>
              {!latestClean ? <Empty>No clean results yet.</Empty> : latestClean.results.map((item, index) => <div key={index} className="border-b border-(--iux-border) py-3"><strong>{item.entryName} · {item.status}</strong><p translate="no" className="break-all">{item.path}</p><p>{item.reason || item.error}</p>{item.trashPath && <p translate="no" className="break-all">{item.trashPath}</p>}</div>)}
            </Section>
          </>}
          {page === "leftovers" && <Section title="Leftovers" description="Items that were skipped, failed, or could not be read.">
            {!latestClean && !latestScan ? <Empty>No results yet. Run a scan first.</Empty> : <>
              {latestClean?.results.filter((item) => item.status === "skipped" || item.status === "failed").map((item, index) => <div key={index} className="border-b border-(--iux-border) py-3"><strong>{item.entryName} · {item.status}</strong><p translate="no" className="break-all">{item.path}</p><p>{item.reason || item.error}</p></div>)}
              {latestScan?.entries.filter((item) => item.unreadable.length).map((item) => <div key={item.id} className="py-2"><strong>{item.name}</strong><p>{item.unreadable.length} unreadable paths</p></div>)}
              {!latestClean?.results.some((item) => item.status === "skipped" || item.status === "failed") && !latestScan?.entries.some((item) => item.unreadable.length) && <Empty>No leftovers were reported.</Empty>}
            </>}
          </Section>}
          {page === "history" && <Section title="Audit history" description="Verified cleanup runs stored on this computer.">
            {!history?.entries.length ? <Empty>No cleanup runs recorded yet.</Empty> : history.entries.map((entry) => <div key={entry.id} className="border-b border-(--iux-border) py-3"><strong>Run #{entry.id} · {entry.result.mode}</strong><p>{bytes(entry.result.totals.bytes)} · {entry.result.totals.items} items · {entry.result.cancelled ? "cancelled" : "finished"}</p>{entry.result.results.map((item, index) => <p key={index} className="break-all text-sm"><span translate="no">{item.path}</span> · {item.status} · {bytes(item.bytes)}</p>)}</div>)}
          </Section>}
        </>}
    </main>
  </AppShell>;
}
