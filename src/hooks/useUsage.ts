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
      // Fetch summary and history independently so a history failure
      // does not block the summary/limits from rendering.
      const [summaryResult, historyResult] = await Promise.allSettled([
        usageApi.summary(),
        usageApi.history({ limit: 100 }),
      ]);

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
      } else {
        throw summaryResult.reason;
      }

      if (historyResult.status === "fulfilled") {
        setHistory(historyResult.value);
      } else {
        // History failing is non-fatal — keep existing history, log quietly
        console.warn("Usage history fetch failed:", historyResult.reason);
      }
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
