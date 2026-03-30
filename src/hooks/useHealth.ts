import { useCallback, useEffect, useState } from "react";
import { healthApi } from "@/services/api";
import { cachedFetch, invalidateCache } from "@/utils/fetchCache";

const HEALTH_KEY = "health";

type HealthData = Awaited<ReturnType<typeof healthApi.check>>;

export function useHealth() {
  const [data, setData] = useState<HealthData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const refetch = useCallback(async (force = false) => {
    if (force) invalidateCache(HEALTH_KEY);
    setIsFetching(true);
    setIsError(false);
    try {
      const result = await cachedFetch(HEALTH_KEY, healthApi.check);
      setData(result);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, isError, refetch, isFetching };
}
