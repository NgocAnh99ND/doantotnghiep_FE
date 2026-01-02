import { getJson, postJson, putJson } from "@/libs/http";
import type { ListResponse, MatchTripItem, MessageResponse, MatchTripStatus } from "./typeds";

type BaseResponse = { success: boolean; message?: string; mess?: string; error?: string };

export function ensureOk<T extends BaseResponse>(
    res: T
): asserts res is T & { success: true } {
    if (!res.success) {
        throw new Error(res.message ?? res.mess ?? res.error ?? "Thao tác thất bại");
    }
}

export function ensureListOk<T>(
    res: ListResponse<T>
): asserts res is { success: true; total: number; data: T[] } {
    if (!res.success) {
        throw new Error(res.message ?? "Thao tác thất bại");
    }
}


export const matchTripApi = {
    async fetchByPassenger(passenger_id: number): Promise<MatchTripItem[]> {
        const res = await getJson<ListResponse<MatchTripItem>>(
            `/api/passenger/matches?passenger_id=${passenger_id}`
        );
        ensureListOk(res);
        return res.data; // không cần ?? []
    },

    async fetchByRoute(route_id: number): Promise<MatchTripItem[]> {
        const res = await getJson<ListResponse<MatchTripItem>>(
            `/api/route/matches?route_id=${route_id}`
        );
        ensureListOk(res);
        return res.data;
    },

    async create(body: { route_id: number; ride_request_id: number }): Promise<void> {
        const res = await postJson<MessageResponse>("/api/match-trip/create", body);
        ensureOk(res);
    },

    async updateStatus(body: { match_id: number; match_trip_status: MatchTripStatus }): Promise<void> {
        const res = await putJson<MessageResponse>("/api/match-trip/update-status", body);
        ensureOk(res);
    },
};

