// api/driver/useFetch.ts
import { useCallback, useEffect, useState } from "react";
import { driverApi } from "./driver.api";
import type { DriverDTO } from "./types";

export function useFetchDriverDetail(driver_id?: number) {
  const [data, setData] = useState<DriverDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const refetch = useCallback(async () => {
    if (!driver_id) return;

    setLoading(true);
    setError(null);
    try {
      const d = await driverApi.fetchDetail(driver_id);
      setData(d);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [driver_id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
