import { useCallback, useEffect, useState } from "react";
import { usageApi } from "@/services/api";
import type { UsageRecord, UsageSummary } from "@/types";

export function useUsage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [history, setHistory] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, h] = await Promise.all([
        usageApi.summary(),
        usageApi.history({ limit: 100 }),
      ]);
      setSummary(s);
      setHistory(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load usage data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, history, loading, error, refresh };
}
