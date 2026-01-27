import { useCallback, useEffect, useState } from "react";
import { reviewApi } from "./review.api";
import type { ReviewDTO } from "./types";

export function useFetchReviewsByDriver(user_id?: number) {
    const [data, setData] = useState<ReviewDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const refetch = useCallback(async () => {
        if (!user_id) return;

        setLoading(true);
        setError(null);
        try {
            const list = await reviewApi.fetchByDriver(user_id);
            setData(list ?? []);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [user_id]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, loading, error, refetch };
}
