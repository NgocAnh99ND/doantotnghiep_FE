import { useCallback, useEffect, useState } from "react";
import { matchTripApi } from "./matchtrip.api";
import type { MatchTripItem } from "./typeds";

export function useFetchMatchesByPassenger(passenger_id?: number) {
    const [data, setData] = useState<MatchTripItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const refetch = useCallback(async () => {
        if (!passenger_id) return;
        setLoading(true);
        setError(null);
        try {
            const list = await matchTripApi.fetchByPassenger(passenger_id);
            setData(list ?? []);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [passenger_id]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, loading, error, refetch };
}

export function useFetchMatchesByRoute(route_id?: number) {
    const [data, setData] = useState<MatchTripItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const refetch = useCallback(async () => {
        if (!route_id) return;
        setLoading(true);
        setError(null);
        try {
            const list = await matchTripApi.fetchByRoute(route_id);
            setData(list ?? []);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [route_id]);

    // useEffect(() => {
    //     refetch();
    // }, [refetch]);

    return { data, loading, error, refetch };
}
