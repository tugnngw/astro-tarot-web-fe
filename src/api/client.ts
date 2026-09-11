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
  getAccess: () =>
    typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY),
  getRefresh: () =>
    typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY),
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
  constructor() {
    super("VITE_API_BASE_URL is not configured");
  }
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
      const env = (await r.json()) as ApiEnvelope<{
        access_token: string;
        refresh_token: string;
      }>;
      if (!env.data) return null;
      tokenStore.set(env.data.access_token, env.data.refresh_token);
      return env.data.access_token;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// ---------- Chịu đựng lúc máy chủ chập chờn ----------
//
// Backend chạy trên gói free của Render: không ai gọi trong 15 phút thì máy bị
// tắt, và lần gọi kế tiếp phải chờ nó khởi động lại — thường 50 giây trở lên.
// Trong khoảng đó cổng vào Render hoặc giữ kết nối chờ, hoặc trả thẳng 502/503
// kèm một trang HTML. Danh sách nào gặp đúng nhịp đó là hỏng, và trước đây
// người dùng chỉ nhận được ba chữ "Invalid JSON".
//
// Chặn trên của một lần gọi. Đặt rộng vì chờ máy chủ dậy là chuyện bình thường
// ở đây, không phải sự cố; mốc này chỉ để một kết nối chết hẳn không treo mãi.
const HAN_GIO_MS = 45_000;

/** Các mã cho biết "thử lại lát nữa có thể được", khác hẳn 4xx. */
function laLoiTamThoi(status: number) {
  return status === 0 || status === 408 || status === 429 || status >= 502;
}

const nghi = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Khoảng nghỉ giữa các lần thử, tính bằng mili giây.
 *
 * Giãn dần tới ~19 giây tổng cộng — đủ để đi hết một lần khởi động lại của
 * Render mà không nện liên tiếp vào máy chủ đang bận khởi động.
 */
const NHIP_THU_LAI = [2_000, 5_000, 12_000];

/** Gộp hạn giờ với signal của caller (nếu có). */
function hanGio(
  signal: AbortSignal | null | undefined,
): AbortSignal | undefined {
  if (typeof AbortSignal === "undefined" || !AbortSignal.timeout)
    return signal ?? undefined;
  const het = AbortSignal.timeout(HAN_GIO_MS);
  if (!signal) return het;
  return AbortSignal.any ? AbortSignal.any([signal, het]) : signal;
}

/** Hàm fetch chính. Auto retry 1 lần nếu refresh thành công. */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  { auth = true, retry = true }: { auth?: boolean; retry?: boolean } = {},
): Promise<T> {
  if (!isLiveBackend()) throw new MockUnavailableError();

  const headers = new Headers(init.headers);
  // Với FormData phải để trình duyệt tự đặt Content-Type: nó cần kèm chuỗi
  // boundary do chính nó sinh ra. Tự gán "multipart/form-data" (hay tệ hơn là
  // application/json như nhánh dưới) sẽ làm server không tách được các phần.
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (auth) {
    const t = tokenStore.getAccess();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }

  // Chỉ thử lại phương thức an toàn. Gọi lại một POST có thể đặt hai lịch hẹn
  // hoặc trừ tiền hai lần — hỏng theo cách tệ hơn nhiều so với một thông báo lỗi.
  const method = (init.method ?? "GET").toUpperCase();
  const thuLaiDuoc = method === "GET" || method === "HEAD";
  const soLanThu = thuLaiDuoc ? NHIP_THU_LAI.length + 1 : 1;

  let res: Response | null = null;
  let loiCuoi: ApiError | null = null;

  for (let lan = 0; lan < soLanThu; lan++) {
    if (lan > 0) await nghi(NHIP_THU_LAI[lan - 1]);

    try {
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
        signal: hanGio(init.signal),
      });
      loiCuoi = null;
    } catch (e) {
      // Mất mạng, DNS hỏng, quá hạn giờ, hoặc máy chủ chưa nhận kết nối.
      // Status 0 để tầng trên phân biệt "chưa tới được server" với "server
      // trả lỗi" — hai chuyện cần xử lý khác nhau.
      res = null;
      const quaHan = e instanceof DOMException && e.name === "TimeoutError";
      loiCuoi = new ApiError(
        0,
        quaHan ? "TIMEOUT" : "NETWORK",
        quaHan
          ? "Máy chủ phản hồi quá chậm. Thử lại giúp tôi nhé."
          : "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
      );
      // Caller chủ động huỷ thì tôn trọng, đừng thử lại.
      if (init.signal?.aborted) throw loiCuoi;
      continue;
    }

    if (thuLaiDuoc && laLoiTamThoi(res.status) && lan < soLanThu - 1) continue;
    break;
  }

  if (!res)
    throw loiCuoi ?? new ApiError(0, "NETWORK", "Không gọi được máy chủ.");

  // Refresh & retry on 401
  if (res.status === 401 && auth && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return apiFetch<T>(path, init, { auth, retry: false });
    tokenStore.clear();
  }

  // Thân phản hồi không phải JSON — gần như luôn là trang lỗi HTML của cổng
  // vào Render khi backend đang khởi động lại (gói free tắt máy sau 15 phút
  // không ai dùng). Thông báo cũ ghi trần trụi "Invalid JSON", một câu không
  // nói gì với người dùng và cũng chẳng gợi ý là chờ một lát sẽ được.
  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    const dangKhoiDong = res.status === 0 || res.status >= 502;
    throw new ApiError(
      res.status,
      dangKhoiDong ? "SERVER_WAKING" : "PARSE",
      dangKhoiDong
        ? "Máy chủ vừa khởi động lại và chưa sẵn sàng. Chờ khoảng một phút rồi thử lại."
        : `Máy chủ trả về dữ liệu không đọc được (HTTP ${res.status}).`,
    );
  }

  // BE trả về error trong object
  if (!res.ok || envelope.error) {
    throw new ApiError(
      res.status,
      envelope.error?.code ?? "UNKNOWN",
      envelope.error?.message ?? envelope.message ?? res.statusText,
    );
  }

  return envelope.data as T;
}
