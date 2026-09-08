import { tokenStore } from "./token-store";
import { VITE_API_BASE_URL } from "../base-url";

export const API_BASE = (VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Options = {
  method?: string;
  body?: unknown;
  formData?: FormData;
  headers?: Record<string, string>;
};

export async function api<T = unknown>(
  path: string,
  opts: Options = {},
): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body,
  });

  const ct = res.headers.get("content-type") ?? "";
  const data = ct.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text();

  if (!res.ok) {
    const message =
      (data &&
        typeof data === "object" &&
        "message" in data &&
        String((data as { message: unknown }).message)) ||
      `Request failed (${res.status})`;
    if (res.status === 401) {
      tokenStore.clear();
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/auth")
      ) {
        window.location.href = "/auth/login";
      }
    }
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}
export type ApiEnvelope<T> = {
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
};
