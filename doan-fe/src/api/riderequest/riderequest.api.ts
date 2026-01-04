// api/riderequest/riderequest.api.ts
import { getJson, postJson, putJson } from "@/libs/http";
import type {
  CancelRideRequestBody,
  CreateRideRequestBody,
  RideRequestCancelResponse,
  RideRequestCreateResponse,
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

export const rideRequestApi = {
  // ✅ POST /api/ride-request/create => cần trả về request vừa tạo (có ride_request_id)
  async create(body: CreateRideRequestBody): Promise<RideRequestDTO> {
    const res = ensureSuccess(await postJson<RideRequestCreateResponse>(ENDPOINT.create, body));
    if (!("data" in res) || !res.data?.ride_request_id) {
      throw new Error("BE không trả data ride_request (thiếu ride_request_id)");
    }
    return res.data;
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
