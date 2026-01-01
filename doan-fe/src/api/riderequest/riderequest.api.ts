import { getJson, postJson, putJson } from "@/libs/http";
import type { CancelRideRequestBody, CreateRideRequestBody, RideRequestCancelResponse, RideRequestCreateResponse, RideRequestDetailResponse, RideRequestDTO, RideRequestsByPassengerResponse, SimpleResponse } from "./types";

const ENDPOINT = {
    create: "/api/ride-request/create",
    detail: "/api/ride-request/detail",
    cancel: "/api/ride-request/cancel",
    byPassenger: "/api/passenger/ride-requests",
};

export const rideRequestApi = {
    // POST /api/ride-request/create
    async create(body: CreateRideRequestBody): Promise<SimpleResponse> {
        return await postJson<SimpleResponse>(ENDPOINT.create, body);
    },

    // GET /api/ride-request/detail?ride_request_id=123
    async fetchDetail(ride_request_id: number): Promise<RideRequestDTO | null> {
        const url = `${ENDPOINT.detail}?ride_request_id=${encodeURIComponent(ride_request_id)}`;
        const res = await getJson<RideRequestDetailResponse>(url);
        return res?.data ?? null;
    },

    // GET /api/passenger/ride-requests?passenger_id=1
    async fetchByPassenger(passenger_id: number): Promise<RideRequestDTO[]> {
        const url = `${ENDPOINT.byPassenger}?passenger_id=${encodeURIComponent(passenger_id)}`;
        const res = await getJson<RideRequestsByPassengerResponse>(url);
        return res?.data ?? [];
    },

    // PUT /api/ride-request/cancel
    async cancel(body: CancelRideRequestBody): Promise<RideRequestDTO | null> {
        const res = await putJson<RideRequestCancelResponse>(ENDPOINT.cancel, body);
        // nếu BE không trả data, bạn có thể đổi return res?.success ?? false
        return res?.data ?? null;
    },
};