import { useCallback, useEffect, useState } from "react";
export const PUBLIC_SOURCE = import.meta.env.PUBLIC_SITE_MODE === "pages";
export async function sourceRequest<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/source/${path}`, {
    signal, cache: "no-store", ...(body === undefined ? {} : {
      method: "POST", headers: { "Content-Type": "application/json", "X-OSLab": "1" }, body: JSON.stringify(body)
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
  return data as T;
}
export function useSource<T>(path: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(n => n + 1), []);
  useEffect(() => {
    if (PUBLIC_SOURCE || !path) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setError(undefined); setData(undefined);
    void sourceRequest<T>(path, undefined, controller.signal).then(setData).catch(e => {
      if (!controller.signal.aborted) setError(String(e.message));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, revision]);
  return { data, error, loading, refresh };
}
