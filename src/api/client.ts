// ============================================================
// API CLIENT — fetch wrapper dùng chung cho toàn bộ FE
// - Thêm Authorization header tự động.
// - Tự refresh access token khi gặp 401 (đúng flow user_sessions).
// - Nếu VITE_API_BASE_URL rỗng → ném MockUnavailableError để
//   các module gọi (auth.ts, bookings.ts, ...) fallback dùng mock.
// ============================================================

import type { ApiEnvelope } from "./types";

import { VITE_API_BASE_URL } from "../lib/base-url.ts";
/** URL gốc backend */
export const API_BASE = (VITE_API_BASE_URL ?? "").replace(/\/$/, "");
console.log("API_BASE =", API_BASE);
/** Tiện ích: BE đã được cấu hình hay chưa */
export const isLiveBackend = () => API_BASE.length > 0;

const ACCESS_KEY = "astrotarot_access_token";
const REFRESH_KEY = "astrotarot_refresh_token";

// ---------- Token helpers (lưu localStorage, không nhạy cảm với SSR) ----------
export const tokenStore = {
  getAccess: () => (typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY)),
  getRefresh: () => (typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY)),
  set: (access: string, refresh: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

/** Lỗi báo cho caller biết nên fallback sang mock store */
export class MockUnavailableError extends Error {
  constructor() { super("VITE_API_BASE_URL is not configured"); }
}

/** Lỗi API có cấu trúc */
export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ---------- refresh-token guard: tránh gọi /refresh song song ----------
let refreshing: Promise<string | null> | null = null;
async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  refreshing = fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  })
    .then(async (r) => {
      if (!r.ok) return null;
      const env = (await r.json()) as ApiEnvelope<{ access_token: string; refresh_token: string }>;
      if (!env.data) return null;
      tokenStore.set(env.data.access_token, env.data.refresh_token);
      return env.data.access_token;
    })
    .catch(() => null)
    .finally(() => { refreshing = null; });
  return refreshing;
}

/** Hàm fetch chính. Auto retry 1 lần nếu refresh thành công. */
export async function apiFetch<T>(
    path: string,
    init: RequestInit = {},
    { auth = true, retry = true }: { auth?: boolean; retry?: boolean } = {},
): Promise<T> {
  if (!isLiveBackend()) throw new MockUnavailableError();

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (auth) {
    const t = tokenStore.getAccess();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  // Refresh & retry on 401
  if (res.status === 401 && auth && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return apiFetch<T>(path, init, { auth, retry: false });
    tokenStore.clear();
  }

  const envelope = (await res.json().catch(() => ({
    data: null,
    error: { code: "PARSE", message: "Invalid JSON" }
  }))) as ApiEnvelope<T>;

  // BE trả về error trong object
  if (!res.ok || envelope.error) {
    throw new ApiError(
        res.status,
        envelope.error?.code ?? "UNKNOWN",
        envelope.error?.message ?? envelope.message ?? res.statusText
    );
  }

  return envelope.data as T;
}
