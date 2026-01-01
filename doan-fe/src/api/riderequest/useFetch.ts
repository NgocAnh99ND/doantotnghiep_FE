import { useEffect, useState } from "react";
import type { RideRequestDTO } from "./types";
import { rideRequestApi } from "./riderequest.api";

export const useFetchRequestsByPassenger = (passengerId?: string | number) => {
    const [data, setData] = useState<RideRequestDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    const refetch = async () => {
        if (passengerId === undefined || passengerId === null || passengerId === "") return;
console.log("log1")
        const idNum = Number(passengerId);
        if (!Number.isFinite(idNum)) {
            setError(new Error("passenger_id không hợp lệ"));
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const list = await rideRequestApi.fetchByPassenger(idNum);
            setData(list ?? []);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
    }, [passengerId]);

    return { data, loading, error, refetch };
};

export const useFetchRideRequestDetail = (requestId?: string | number) => {
    const [data, setData] = useState<RideRequestDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    const refetch = async () => {
        if (requestId === undefined || requestId === null || requestId === "") return;

        const idNum = Number(requestId);
        if (!Number.isFinite(idNum)) {
            setError(new Error("ride_request_id không hợp lệ"));
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const detail = await rideRequestApi.fetchDetail(idNum);
            setData(detail);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
    }, [requestId]);

    return { data, loading, error, refetch };
};
