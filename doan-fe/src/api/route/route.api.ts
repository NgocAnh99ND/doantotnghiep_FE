import { getJson, postJson, putJson } from "@/libs/http";
import type { ChangeRouteStatusBody, ChangeRouteStatusResponse, CreateRouteBody, CreateRouteResponse, RouteDetailResponse, RouteDTO, RoutesResponse, UpdateRouteBody, UpdateRouteResponse } from "./types";

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
        const res = await getJson<RoutesResponse>(ENDPOINT.all);
        return res?.data ?? [];
    },

    // GET /api/route/detail?route_id=123 :contentReference[oaicite:12]{index=12}
    async fetchDetail(route_id: number): Promise<RouteDTO> {
        const url = `${ENDPOINT.detail}?route_id=${encodeURIComponent(String(route_id))}`;
        const res = await getJson<RouteDetailResponse>(url);
        return res?.data ?? null;
    },

    // POST /api/route/create
    async create(body: CreateRouteBody): Promise<RouteDTO | null> {
        const res = await postJson<CreateRouteResponse>(ENDPOINT.create, body);
        return res?.data ?? null;
    },

    // PUT /api/route/update
    async update(body: UpdateRouteBody): Promise<RouteDTO | null> {
        const res = await putJson<UpdateRouteResponse>(ENDPOINT.update, body);
        return res?.data ?? null;
    },

    // PUT /api/route/change-status
    async changeStatus(body: ChangeRouteStatusBody): Promise<RouteDTO | null> {
        const res = await putJson<ChangeRouteStatusResponse>(
            ENDPOINT.changeStatus,
            body
        );
        return res?.data ?? null;
    },
};
