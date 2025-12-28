import * as React from "react";

export function useAsyncAction<TArgs extends any[], TResult>(fn: (...args: TArgs) => Promise<TResult>) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(async (...args: TArgs) => {
    setLoading(true);
    setError(null);
    try {
      return await fn(...args);
    } catch (e: any) {
      const msg = e?.message ?? "Có lỗi xảy ra";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fn]);

  return { run, loading, error, setError };
}
