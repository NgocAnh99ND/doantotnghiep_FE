import { getJson, postJson, putJson } from "@/libs/http";
import type {
  ListResponse,
  MessageResponse,
  MatchTripItem,
  MatchTripStatus,
  DriverPendingRequestItem,
  DriverAcceptedMatchItem,
  CreateMatchTripResponse,
} from "./typeds";


type BaseResponse = { success: boolean; message?: string; mess?: string; error?: string };

const ENDPOINT = {
  create: "/api/match-trip/create",
  updateStatus: "/api/match-trip/update-status",
  finish: "/api/match-trip/finish",

  // DRIVER
  acceptedByDriver: "/api/driver/matches",              // ✅ theo BE
  finishedByDriver: "/api/match-trip/driver/finished", // ✅ theo BE
  pendingRequestsByDriver: "/api/driver/requests",
};

export function ensureOk<T extends BaseResponse>(res: T): asserts res is T & { success: true } {
  if (!res.success) throw new Error(res.message ?? res.mess ?? res.error ?? "Thao tác thất bại");
}

export function ensureListOk<T>(
  res: ListResponse<T>
): asserts res is { success: true; total: number; data: T[] } {
  if (!res.success) throw new Error(res.message ?? (res as any).mess ?? (res as any).error ?? "Thao tác thất bại");
}

// ✅ NEW: ensure create ok + có match_id
function ensureCreateOk(
  res: CreateMatchTripResponse
): asserts res is { success: true; data: { match_id: number }; message?: string } {
  if (!res.success) throw new Error((res as any).message ?? (res as any).mess ?? (res as any).error ?? "Thao tác thất bại");
  if (!res.data || typeof res.data.match_id !== "number") throw new Error("Response thiếu match_id");
}

export const matchTripApi = {
  // ====== Existing (giữ lại cho passenger / route) ======
  async fetchByPassenger(passenger_id: number): Promise<MatchTripItem[]> {
    const res = await getJson<ListResponse<MatchTripItem>>(
      `/api/passenger/matches?passenger_id=${encodeURIComponent(String(passenger_id))}`
    );
    ensureListOk(res);
    return res.data;
  },

  async fetchByRoute(route_id: number): Promise<MatchTripItem[]> {
    const res = await getJson<ListResponse<MatchTripItem>>(
      `/api/route/matches?route_id=${encodeURIComponent(String(route_id))}`
    );
    ensureListOk(res);
    return res.data;
  },

  // ✅ đổi: trả về match_id để DriverRequestsPage dùng updateStatus(match_id)
  async create(body: { route_id: number; ride_request_id: number }): Promise<{ match_id: number }> {
    const res = await postJson<CreateMatchTripResponse>("/api/match-trip/create", body);
    ensureCreateOk(res);
    return { match_id: res.data.match_id };
  },

  async updateStatus(body: { match_id: number; match_trip_status: MatchTripStatus }): Promise<void> {
    const res = await putJson<MessageResponse>("/api/match-trip/update-status", body);
    ensureOk(res);
  },

  // ====== NEW: Driver APIs ======
  async fetchPendingByDriver(driver_id: number): Promise<DriverPendingRequestItem[]> {
    const res = await getJson<ListResponse<DriverPendingRequestItem>>(
      `/api/driver/requests?driver_id=${encodeURIComponent(String(driver_id))}`
    );
    ensureListOk(res);
    return res.data;
  },

  async fetchAcceptedByDriver(driver_id: number): Promise<DriverAcceptedMatchItem[]> {
    const res = await getJson<ListResponse<DriverAcceptedMatchItem>>(
      `/api/driver/matches?driver_id=${encodeURIComponent(String(driver_id))}`
    );
    ensureListOk(res);
    return res.data;
  },

  async finishMatch(match_id: number): Promise<void> {
    const res = await putJson<MessageResponse>("/api/match-trip/finish", { match_id });
    ensureOk(res);
  },

  //  async fetchAcceptedMatchesByDriver(driver_id: number) {
  //   const url = `${ENDPOINT.acceptedByDriver}?driver_id=${encodeURIComponent(String(driver_id))}`;
  //   return getJson<any>(url);
  // },

  // async fetchFinishedMatchesByDriver(driver_id: number) {
  //   const url = `${ENDPOINT.finishedByDriver}?driver_id=${encodeURIComponent(String(driver_id))}`;
  //   return getJson<any>(url);
  // },

    async fetchFinishedByDriver(driver_id: number): Promise<DriverAcceptedMatchItem[]> {
    // cấu trúc JSON y hệt accepted (route + ride_request), nên reuse type
    const res = await getJson<ListResponse<DriverAcceptedMatchItem>>(
      `${ENDPOINT.finishedByDriver}?driver_id=${encodeURIComponent(String(driver_id))}`
    );
    ensureListOk(res);
    return res.data;
  }
};
