// Types khớp field BE đang đọc/ghi: route_id, route_status, start_location... :contentReference[oaicite:5]{index=5}

export type RouteStatus = string; // nếu BE có enum thì bạn có thể thay bằng union

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

// body cho POST /api/route/create :contentReference[oaicite:6]{index=6}
export type CreateRouteBody = {
    driver_id: number;
    start_location: string;
    end_location: string;
    time: string;
    seats: number;
    price: number;
};

// body cho PUT /api/route/update :contentReference[oaicite:7]{index=7}
export type UpdateRouteBody = {
    route_id: number;
    start_location: string;
    end_location: string;
    time: string;
    seats: number;
    price: number;
};

// body cho PUT /api/route/change-status :contentReference[oaicite:8]{index=8}
export type ChangeRouteStatusBody = {
    route_id: number;
    route_status: RouteStatus;
};

export type RoutesResponse = {
  success: boolean;
  total: number;
  data: RouteDTO[];
};
