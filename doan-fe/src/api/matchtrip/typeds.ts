export type MatchTripStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "FINISHED"
  | "CANCELLED"
  | string;

/**
 * BE trả 2 kiểu item cũ:
 * - byRoute: match_id, ride_request_id, match_trip_status
 * - byPassenger: match_id, route_id, match_trip_status
 */
export type MatchTripItem = {
  match_id: number;
  match_trip_status: MatchTripStatus;
  ride_request_id?: number;
  route_id?: number;
};

// Shared responses
export type ListResponse<T> =
  | { success: true; total: number; data: T[] }
  | { success: false; message?: string; mess?: string; error?: string };

export type MessageResponse =
  | { success: true; message?: string; mess?: string }
  | { success: false; message?: string; mess?: string; error?: string };

// ✅ NEW: create match trip trả match_id (hướng A)
export type CreateMatchTripResponse =
  | { success: true; message?: string; data: { match_id: number } }
  | { success: false; message?: string; mess?: string; error?: string };

// ===== Driver DTOs (API mới trả kèm route + ride_request) =====
export type DriverRouteInfo = {
  route_id: number;
  driver_id: number;
  start_location: string;
  end_location: string;
  time: string;
  seats: number;
  price: number;
  route_status: string;
};

export type DriverRideRequestInfo = {
  ride_request_id: number;
  // ⚠️ BE của bạn hiện query getPendingByDriver/getAcceptedByDriver KHÔNG select passenger_id
  // Nếu BE chưa trả passenger_id thì để optional để khỏi crash FE.
  passenger_id?: number;

  pick_up: string;
  drop_off: string;
  time: string;
  passengers: number;
  ride_request_status: string;
};

export type DriverPendingRequestItem = {
  match_id: number;
  match_trip_status: MatchTripStatus; // PENDING
  route: DriverRouteInfo;
  ride_request: DriverRideRequestInfo;
};

export type DriverAcceptedMatchItem = {
  match_id: number;
  match_trip_status: MatchTripStatus; // ACCEPTED / FINISHED...
  route: DriverRouteInfo;
  ride_request: DriverRideRequestInfo;
};
