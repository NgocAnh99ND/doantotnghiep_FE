// Types khớp field BE đang đọc/ghi: route_id, route_status, start_location...

export type RouteStatus = string;

export type RouteDTO = {
  route_id: number;
  driver_id: number;
  start_location: string;
  end_location: string;
  time: string;
  seats: number;
  price: number;
  route_status?: RouteStatus;
};

// ✅ params cho GET /api/routes/find-by-ab
export type FindByABParams = {
  start: string;
  end: string;
  a_lat: number;
  a_lng: number;
  b_lat: number;
  b_lng: number;
};

export type CreateRouteBody = {
  driver_id: number;
  start_location: string;
  end_location: string;
  time: string;
  seats: number;
  price: number;
};

export type UpdateRouteBody = {
  route_id: number;
  start_location: string;
  end_location: string;
  time: string;
  seats: number;
  price: number;
};

export type ChangeRouteStatusBody = {
  route_id: number;
  route_status: RouteStatus;
};

export type RoutesResponse = {
  success: boolean;
  total: number;
  data: RouteDTO[];
  message?: string; // ✅ optional cho dễ debug nếu BE trả
};

export type RouteDetailResponse = {
  success: boolean;
  data: RouteDTO;
  message?: string;
};

export type CreateRouteResponse = {
  success: boolean;
  data: RouteDTO;
  message?: string;
};

export type UpdateRouteResponse = {
  success: boolean;
  data: RouteDTO;
  message?: string;
};

export type ChangeRouteStatusResponse = {
  success: boolean;
  data: RouteDTO;
  message?: string;
};

export type MessageResponse =
  | { success: true; message?: string }
  | { success: false; message?: string };

export type RouteItem = {
  route_id: number;
  driver_id: number;
  start_location: string;
  end_location: string;
  time: string;
  seats: number;
  price: number;
  route_status: string;
};
