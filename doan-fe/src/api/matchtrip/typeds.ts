export type MatchTripStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "FINISHED" | "CANCELLED" |string;

// BE trả 2 kiểu item:
// - byRoute: match_id, ride_request_id, match_trip_status
// - byPassenger: match_id, route_id, match_trip_status
export type MatchTripItem = {
    match_id: number;
    match_trip_status: MatchTripStatus;
    ride_request_id?: number;
    route_id?: number;
};

export type ListResponse<T> =
    | { success: true; total: number; data: T[] }
    | { success: false; message?: string };

export type MessageResponse =
    | { success: true; message?: string }
    | { success: false; message?: string };
