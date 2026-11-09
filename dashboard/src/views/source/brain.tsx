import { useMemo, useState } from "react";
import { Empty, Section, Skeleton, Status } from "../../components/ui";
import { useSource } from "./client";
import { normalizeGraph, type BrainManifest } from "./brain-model";
import { useBrainProvider } from "./brain-data";
export function SourceBrain() {
  const manifest = useSource<{ data: { manifest: BrainManifest } }>("brain");
  const [tab, setTab] = useState("");
  const tabs = manifest.data?.data?.manifest.tabs ?? [];
  const active = tabs.find(t => t.id === tab) ?? tabs[0];
  const raw = useBrainProvider(active?.file);
  const parsed = useMemo(() => { try { return { graph: raw.data ? normalizeGraph(raw.data) : undefined }; } catch (error) { return { error: String(error) }; } }, [raw.data]);
  return <Section title="Brain" description="Operator-provided graph snapshots stay local. No live application provider is configured automatically.">
    {manifest.loading && <Skeleton />}{manifest.error && <Status value={{ ok: false, text: manifest.error }} />}
    <div className="flex flex-wrap gap-2">{tabs.map(t => <button key={t.id} className="iux-btn" aria-pressed={active?.id === t.id} data-no-translate onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
    {raw.loading && <Skeleton />}{raw.error && <Status value={{ ok: false, text: raw.error }} />}{parsed.error && <Status value={{ ok: false, text: parsed.error }} />}
    {parsed.graph ? <p data-no-translate>{parsed.graph.nodes.length} nodes · {parsed.graph.edges.length} edges</p> : !manifest.loading && <Empty>No graph provider is available.</Empty>}
  </Section>;
}
