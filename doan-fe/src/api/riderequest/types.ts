export type RideRequestStatus = string;

export type RideRequestDTO = {
    ride_request_id: number;
    passenger_id: number;
    pick_up: string;
    drop_off: string;
    time: string;
    passengers: number;
    status?: RideRequestStatus;
};

export type CreateRideRequestBody = {
    passenger_id: number;
    pick_up: string;
    drop_off: string;
    time: string;
    passengers: number;
};

export type CancelRideRequestBody = {
    ride_request_id: number;
};

export type RideRequestCreateResponse = {
    success: boolean;
    data: RideRequestDTO;
};

export type RideRequestDetailResponse = {
    success: boolean;
    data: RideRequestDTO;
};

export type RideRequestsByPassengerResponse = {
    success: boolean;
    total?: number;
    data: RideRequestDTO[];
};

export type RideRequestCancelResponse = {
    success: boolean;
    data?: RideRequestDTO; // nếu BE trả về request sau khi cancel
    message?: string;
};

export type SimpleResponse = { success: boolean; mess?: string };
