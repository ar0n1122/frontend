import { useCallback, useEffect, useState } from "react";
import { usageApi } from "@/services/api";
import type { UserLimits } from "@/types";

export function useLimits() {
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usageApi.limits();
      setLimits(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load limits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { limits, loading, error, refresh };
}
