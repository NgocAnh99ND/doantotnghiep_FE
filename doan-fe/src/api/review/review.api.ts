import { getJson, postJson } from "@/libs/http";
import type { BaseResponse, CreateReviewPayload, ListResponse, MessageResponse, ReviewDTO } from "./types";

const ENDPOINT = {
    create: "/api/review/create",
    byDriver: "/api/review/by-driver", // ✅ BE map vào ReviewByUserHandler, query param là user_id
};

function ensureOk<T extends BaseResponse>(res: T): asserts res is T & { success: true } {
    if (!res.success) throw new Error(res.message ?? res.mess ?? res.error ?? "Thao tác thất bại");
}

export function ensureListOk<T>(
    res: ListResponse<T>
): asserts res is { success: true; total: number; data: T[] } {
    if (!res.success) throw new Error(res.message ?? (res as any).mess ?? (res as any).error ?? "Thao tác thất bại");
}

export const reviewApi = {
    // POST /api/review/create
    async create(payload: CreateReviewPayload): Promise<void> {
        const res = await postJson<MessageResponse>(ENDPOINT.create, payload);
        ensureOk(res);
    },

    // GET /api/review/by-driver?user_id=...
    async fetchByDriver(user_id: number): Promise<ReviewDTO[]> {
        const url = `${ENDPOINT.byDriver}?user_id=${encodeURIComponent(String(user_id))}`;
        const res = await getJson<ListResponse<ReviewDTO>>(url);
        ensureListOk(res);
        return res.data ?? [];
    },
};
