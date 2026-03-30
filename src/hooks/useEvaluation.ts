import { useCallback, useEffect, useState } from "react";
import { evalApi } from "@/services/api";

type EvalData = Awaited<ReturnType<typeof evalApi.latest>>;

export function useEvalReport() {
  const [data, setData] = useState<EvalData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    evalApi
      .latest()
      .then(setData)
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading, isError };
}

export function useRunEvaluation() {
  const [isPending, setIsPending] = useState(false);
  const [data, setData] = useState<EvalData | undefined>(undefined);

  const mutate = useCallback(
    async (params: { top_k?: number; llm_provider?: string }) => {
      setIsPending(true);
      try {
        const result = await evalApi.run(params.top_k, params.llm_provider);
        setData(result);
        return result;
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { mutate, isPending, data };
}
