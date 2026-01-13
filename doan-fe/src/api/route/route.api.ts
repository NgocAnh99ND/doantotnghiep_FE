// api/route/route.api.ts
import { getJson, postJson, putJson } from "@/libs/http";
import type {
  ChangeRouteStatusBody,
  ChangeRouteStatusResponse,
  CreateRouteBody,
  CreateRouteResponse,
  FindByABParams,
  RouteDetailResponse,
  RouteDTO,
  RoutesResponse,
  UpdateRouteBody,
  UpdateRouteResponse,
} from "./types";

const ENDPOINT = {
  all: "/api/routes",
  detail: "/api/route/detail",
  create: "/api/route/create",
  update: "/api/route/update",
  changeStatus: "/api/route/change-status",

  // ✅ BE có endpoint này (ApiServer)
  findByAB: "/api/routes/find-by-ab",
};

function ensureSuccess(res: any) {
  if (res?.success === false) {
    throw new Error(res?.message ?? res?.mess ?? res?.error ?? "Thao tác thất bại");
  }
  return res;
}

export const routeApi = {
  async fetchAll(): Promise<RouteDTO[]> {
    const res = await getJson<RoutesResponse>(ENDPOINT.all);
    return res?.data ?? [];
  },

  // GET /api/route/detail?route_id=123
  async fetchDetail(route_id: number): Promise<RouteDTO | null> {
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
    const res = await putJson<ChangeRouteStatusResponse>(ENDPOINT.changeStatus, body);
    return res?.data ?? null;
  },

  /**
   * ✅ FLOW CHÍNH (Passenger search):
   * FE gửi điểm đi/đến + lat/lng -> BE chạy thuật toán chọn tuyến phù hợp -> trả list routes
   *
   * BE endpoint: GET /api/routes/find-by-ab
   * BE của bạn đang báo thiếu: a_lat,a_lng,b_lat,b_lng  => bắt buộc 4 field này
   *
   * Để tránh lệch tên param text (start/end vs pick_up/drop_off),
   * FE gửi luôn cả 2 cặp.
   */
  async findByAB(params: FindByABParams): Promise<RouteDTO[]> {
    const q = new URLSearchParams();

    // ✅ text: gửi cả 2 kiểu để khỏi lệch BE handler
    const startText = (params.start ?? "").trim();
    const endText = (params.end ?? "").trim();
    q.set("start", startText);
    q.set("end", endText);
    q.set("pick_up", startText);
    q.set("drop_off", endText);

    // ✅ BE bắt buộc: a_lat,a_lng,b_lat,b_lng
    if (!Number.isFinite(params.a_lat) || !Number.isFinite(params.a_lng) || !Number.isFinite(params.b_lat) || !Number.isFinite(params.b_lng)) {
      throw new Error("Thiếu tọa độ: a_lat,a_lng,b_lat,b_lng (bạn cần chọn/ghim điểm trên bản đồ để có lat/lng)");
    }
    q.set("a_lat", String(params.a_lat));
    q.set("a_lng", String(params.a_lng));
    q.set("b_lat", String(params.b_lat));
    q.set("b_lng", String(params.b_lng));

    const url = `${ENDPOINT.findByAB}?${q.toString()}`;
    const res = ensureSuccess(await getJson<any>(url));
    return res?.data ?? [];
  },

  /**
   * ❌ giữ lại để khỏi lỗi chỗ nào đó đang import, nhưng stop dùng.
   * Map qua findByAB:
   * - Không có lat/lng thì BE sẽ báo thiếu => ném lỗi rõ ràng.
   */
  async searchSuggested(params: { start: string; end: string }): Promise<RouteDTO[]> {
    return this.findByAB({
      start: params.start,
      end: params.end,
      // ép phải có lat/lng ở nơi gọi; ở đây để NaN để báo lỗi rõ ràng
      a_lat: Number.NaN,
      a_lng: Number.NaN,
      b_lat: Number.NaN,
      b_lng: Number.NaN,
    } as any);
  },
};
