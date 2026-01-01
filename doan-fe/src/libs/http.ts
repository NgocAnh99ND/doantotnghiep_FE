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
    return text; // nếu BE trả plain text
  }
}

async function requestJson<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
  const url = resolveUrl(path);

  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await parseBodySafe(res);

  if (!res.ok) {
    // BE của bạn đang trả { success, mess } nên ưu tiên mess nếu có
    const msg =
      (data && typeof data === "object" && (data.mess || data.message)) ? String((data as any).mess ?? (data as any).message)
        : (data && typeof data === "object" && (data.error || data.err)) ? String((data as any).error ?? (data as any).err)
          : `HTTP ${res.status}`;
    throw new HttpError(msg, res.status, data);
  }

  return data as T;
}

export const getJson = <T>(path: string) => requestJson<T>("GET", path);
export const postJson = <T>(path: string, body: unknown) => requestJson<T>("POST", path, body);
export const putJson = <T>(path: string, body: unknown) => requestJson<T>("PUT", path, body);
