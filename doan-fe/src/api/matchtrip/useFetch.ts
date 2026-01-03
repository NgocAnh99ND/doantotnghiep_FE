import { useCallback, useEffect, useState } from "react";
import { matchTripApi } from "./matchtrip.api";
import type { DriverAcceptedMatchItem, DriverPendingRequestItem } from "./typeds";

export function useFetchPendingRequestsByDriver(driver_id?: number) {
  const [data, setData] = useState<DriverPendingRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const refetch = useCallback(async () => {
    if (!driver_id) return;
    setLoading(true);
    setError(null);
    try {
      const list = await matchTripApi.fetchPendingByDriver(driver_id);
      setData(list ?? []);
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

export function useFetchAcceptedMatchesByDriver(driver_id?: number) {
  const [data, setData] = useState<DriverAcceptedMatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const refetch = useCallback(async () => {
    if (!driver_id) return;
    setLoading(true);
    setError(null);
    try {
      const list = await matchTripApi.fetchAcceptedByDriver(driver_id);
      setData(list ?? []);
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
