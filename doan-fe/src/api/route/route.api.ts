import { getJson, postJson, putJson } from "@/libs/http";
import type { ChangeRouteStatusBody, CreateRouteBody, RouteDTO, UpdateRouteBody } from "./types";

// Endpoint thật đúng BE :contentReference[oaicite:9]{index=9} :contentReference[oaicite:10]{index=10}
const ENDPOINT = {
    all: "/api/routes", // GET
    detail: "/api/route/detail", // GET ?route_id=
    create: "/api/route/create", // POST
    update: "/api/route/update", // PUT
    changeStatus: "/api/route/change-status", // PUT
};

export const routeApi = {
    // GET /api/routes :contentReference[oaicite:11]{index=11}
    async fetchAll(): Promise<RouteDTO[]> {
        const res = await getJson<unknown>(ENDPOINT.all);
        return (res as RouteDTO[]) ?? [];
    },

    // GET /api/route/detail?route_id=123 :contentReference[oaicite:12]{index=12}
    async fetchDetail(route_id: number): Promise<RouteDTO> {
        const url = `${ENDPOINT.detail}?route_id=${encodeURIComponent(String(route_id))}`;
        const res = await getJson<unknown>(url);
        return res as RouteDTO;
    },

    // POST /api/route/create body: driver_id,start_location,end_location,time,seats,price :contentReference[oaicite:13]{index=13}
    async create(body: CreateRouteBody): Promise<unknown> {
        return await postJson<unknown>(ENDPOINT.create, body);
    },

    // PUT /api/route/update body: route_id,... :contentReference[oaicite:14]{index=14}
    async update(body: UpdateRouteBody): Promise<unknown> {
        return await putJson<unknown>(ENDPOINT.update, body);
    },

    // PUT /api/route/change-status body: route_id,route_status :contentReference[oaicite:15]{index=15}
    async changeStatus(body: ChangeRouteStatusBody): Promise<unknown> {
        return await putJson<unknown>(ENDPOINT.changeStatus, body);
    },
};
