// api/driver/driver.api.ts
import { getJson } from "@/libs/http";
import type { DriverDTO, DriverDetailResponse } from "./types";

type BaseResponse = { success: boolean; message?: string; mess?: string; error?: string };

const ENDPOINT = {
  detail: "/api/driver/detail",
};

export function ensureOk<T extends BaseResponse>(res: T): asserts res is T & { success: true } {
  if (!res.success) throw new Error(res.message ?? res.mess ?? res.error ?? "Thao tác thất bại");
}

export const driverApi = {
  async fetchDetail(driver_id: number): Promise<DriverDTO | null> {
    const url = `${ENDPOINT.detail}?driver_id=${encodeURIComponent(String(driver_id))}`;
    const res = await getJson<DriverDetailResponse>(url);

    // nếu BE có success=false thì throw
    if ((res as any)?.success === false) {
      throw new Error((res as any)?.message ?? (res as any)?.mess ?? (res as any)?.error ?? "Không lấy được thông tin tài xế");
    }

    return (res as any)?.data ?? null;
  },
};
