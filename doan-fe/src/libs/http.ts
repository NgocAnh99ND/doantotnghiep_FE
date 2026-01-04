import { API_BASE_URL } from "./env";

export class HttpError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

function resolveUrl(path: string) {
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

async function parseBodySafe(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function requestJson<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const url = resolveUrl(path);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  // ✅ chỉ set Content-Type khi có body (POST/PUT/PATCH)
  const hasJsonBody = body !== undefined && method !== "GET" && method !== "DELETE";
  if (hasJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    // ✅ GET/DELETE không nên gửi body
    body: hasJsonBody ? JSON.stringify(body) : undefined,
    // nếu bạn dùng cookie session thì mở credentials:
    // credentials: "include",
  });

  const data = await parseBodySafe(res);

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && ((data as any).mess || (data as any).message)
        ? String((data as any).mess ?? (data as any).message)
        : data && typeof data === "object" && ((data as any).error || (data as any).err)
          ? String((data as any).error ?? (data as any).err)
          : `HTTP ${res.status}`;
    throw new HttpError(msg, res.status, data);
  }

  return data as T;
}

export const getJson = <T>(path: string) => requestJson<T>("GET", path);
export const postJson = <T>(path: string, body: unknown) => requestJson<T>("POST", path, body);
export const putJson = <T>(path: string, body: unknown) => requestJson<T>("PUT", path, body);
