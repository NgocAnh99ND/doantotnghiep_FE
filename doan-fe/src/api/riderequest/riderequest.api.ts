// api/riderequest/riderequest.api.ts
import { getJson, postJson, putJson } from "@/libs/http";
import type {
  CancelRideRequestBody,
  CreateRideRequestBody,
  RideRequestCancelResponse,
  RideRequestDetailResponse,
  RideRequestDTO,
  RideRequestsByPassengerResponse,
} from "./types";

const ENDPOINT = {
  create: "/api/ride-request/create",
  detail: "/api/ride-request/detail",
  cancel: "/api/ride-request/cancel",
  byPassenger: "/api/passenger/ride-requests",
};

function ensureSuccess(res: any) {
  if (!res?.success) {
    throw new Error(res?.message ?? res?.mess ?? res?.error ?? "Thao tác thất bại");
  }
  return res;
}

/**
 * BE của bạn đang trả:
 * { success: true, message: "...", ride_request_id: 7 }
 * Một số BE khác có thể trả:
 * { success: true, data: { ride_request_id: 7, ... } }
 */
function extractRideRequestId(res: any): number | null {
  const id1 = res?.data?.ride_request_id;
  if (Number.isFinite(id1)) return Number(id1);

  const id2 = res?.ride_request_id;
  if (Number.isFinite(id2)) return Number(id2);

  const id3 = res?.data?.id;
  if (Number.isFinite(id3)) return Number(id3);

  return null;
}

export const rideRequestApi = {
  // ✅ POST /api/ride-request/create
  // Trả về tối thiểu RideRequestDTO có ride_request_id để match-trip dùng tiếp
  async create(body: CreateRideRequestBody): Promise<RideRequestDTO> {
    const res = ensureSuccess(await postJson<any>(ENDPOINT.create, body));

    const rideRequestId = extractRideRequestId(res);
    if (!rideRequestId) {
      // debug nhẹ để bạn biết BE trả gì
      throw new Error("BE không trả ride_request_id (response không đúng format)");
    }

    // Nếu BE có trả full data thì ưu tiên trả full
    if (res?.data && typeof res.data === "object") {
      return { ...res.data, ride_request_id: rideRequestId } as RideRequestDTO;
    }

    // BE chỉ trả ride_request_id -> trả DTO tối thiểu
    return { ride_request_id: rideRequestId } as RideRequestDTO;
  },

  async fetchDetail(ride_request_id: number): Promise<RideRequestDTO | null> {
    const url = `${ENDPOINT.detail}?ride_request_id=${encodeURIComponent(ride_request_id)}`;
    const res = await getJson<RideRequestDetailResponse>(url);
    return res?.data ?? null;
  },

  async fetchByPassenger(passenger_id: number): Promise<RideRequestDTO[]> {
    const url = `${ENDPOINT.byPassenger}?passenger_id=${encodeURIComponent(passenger_id)}`;
    const res = await getJson<RideRequestsByPassengerResponse>(url);
    return res?.data ?? [];
  },

  async cancel(body: CancelRideRequestBody): Promise<RideRequestDTO | null> {
    const res = ensureSuccess(await putJson<RideRequestCancelResponse>(ENDPOINT.cancel, body));
    return res?.data ?? null;
  },
};
