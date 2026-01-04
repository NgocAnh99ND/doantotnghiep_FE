// api/riderequest/types.ts
export type RideRequestStatus = string;

export type RideRequestDTO = {
    ride_request_id: number;
    passenger_id: number;
    pick_up: string;
    drop_off: string;
    time: string;
    passengers: number;
    ride_request_status?: RideRequestStatus; // ✅ theo DB
    status?: RideRequestStatus; // (giữ lại nếu BE cũ dùng "status")
};

export type CreateRideRequestBody = {
    passenger_id: number;
    pick_up: string;
    drop_off: string;
    time: string;
    passengers: number;
};

export type CancelRideRequestBody = { ride_request_id: number };

export type RideRequestCreateResponse =
    | { success: true; data: RideRequestDTO; message?: string; mess?: string }
    | { success: false; message?: string; mess?: string; error?: string };

export type RideRequestDetailResponse = { success: boolean; data: RideRequestDTO };

export type RideRequestsByPassengerResponse = {
    success: boolean;
    total?: number;
    data: RideRequestDTO[];
};

export type RideRequestCancelResponse = {
    success: boolean;
    data?: RideRequestDTO;
    message?: string;
};

export type SimpleResponse =
    | { success: true; message?: string; mess?: string }
    | { success: false; message?: string; mess?: string; error?: string };
