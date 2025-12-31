import { useEffect, useState } from "react";
import type { RouteDTO } from "./types";
import { routeApi } from "./route.api";

export const useFetchRoutes = () => {
    const [data, setData] = useState<RouteDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    const refetch = async () => {
        setLoading(true);
        setError(null);
        try {
            const routes = await routeApi.fetchAll();
            setData(routes ?? []);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
    }, []);

    return { data, loading, error, refetch };
};

// routeId lấy từ /route/[id], BE yêu cầu query param route_id :contentReference[oaicite:16]{index=16}
export const useFetchRouteDetail = (routeId?: string | number) => {
    const [data, setData] = useState<RouteDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    const refetch = async () => {
        if (routeId === undefined || routeId === null || routeId === "") return;

        const idNum = Number(routeId);
        if (!Number.isFinite(idNum)) {
            setError(new Error("route_id không hợp lệ"));
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const route = await routeApi.fetchDetail(idNum);
            setData(route);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
    }, [routeId]);

    return { data, loading, error, refetch };
};
