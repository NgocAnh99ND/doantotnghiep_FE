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

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg = (data && typeof data === "object" && data.error) ? String(data.error) : `HTTP ${res.status}`;
    throw new HttpError(msg, res.status, data);
  }
  return data as T;
}

// src/libs/http.ts
const BASE_URL = "http://localhost:8080"; // hoặc lấy từ env/config của bạn

async function requestJson<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export const getJson = <T>(path: string) => requestJson<T>("GET", path);
export const putJson = <T>(path: string, body: unknown) => requestJson<T>("PUT", path, body);

