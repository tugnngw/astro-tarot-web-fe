// ============================================================
// AUTH endpoints — khớp bảng users + user_sessions
// Nếu BE chưa cấu hình → fallback mock (để dev UI vẫn chạy).
// ============================================================
import { apiFetch, MockUnavailableError, tokenStore } from "./client";
import type { User } from "./types";

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload {
  full_name: string;          // khớp cột users.full_name
  email: string;
  phone: string;
  password: string;
}
export interface AuthResult {
  user: User;
  access_token: string;
  refresh_token: string;
}

// ----- Mock helpers (chỉ dùng khi VITE_API_BASE_URL rỗng) -----
const MOCK_KEY = "astrotarot_mock_user";
function detectRole(email: string): User["role"] {
  const e = email.toLowerCase();
  if (e.startsWith("admin")) return "ADMIN";
  if (e.startsWith("reader") || e.startsWith("expert")) return "READER";
  return "USER";
}
function mockUser(email: string, full_name = email.split("@")[0], phone?: string): User {
  return {
    id: "u_" + email.replace(/[^a-z0-9]/gi, "_"),
    email,
    full_name,
    role: detectRole(email),
    phone: phone ?? null,
    avatar: null,
    status: "ACTIVE",
    email_verified: false,
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
function mockToken(prefix: string) { return `${prefix}_${Date.now().toString(36)}`; }

// ----- Public API -----
export async function login(payload: LoginPayload): Promise<AuthResult> {
  try {
    const data = await apiFetch<AuthResult>("/auth/login", { method: "POST", body: JSON.stringify(payload) }, { auth: false });
    tokenStore.set(data.access_token, data.refresh_token);
    return data;
  } catch (e) {
    if (!(e instanceof MockUnavailableError)) throw e;
    // MOCK fallback
    await new Promise((r) => setTimeout(r, 400));
    const user = mockUser(payload.email);
    localStorage.setItem(MOCK_KEY, JSON.stringify(user));
    const access = mockToken("acc"), refresh = mockToken("ref");
    tokenStore.set(access, refresh);
    return { user, access_token: access, refresh_token: refresh };
  }
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  try {
    const data = await apiFetch<AuthResult>("/auth/register", { method: "POST", body: JSON.stringify(payload) }, { auth: false });
    tokenStore.set(data.access_token, data.refresh_token);
    return data;
  } catch (e) {
    if (!(e instanceof MockUnavailableError)) throw e;
    await new Promise((r) => setTimeout(r, 500));
    const user = mockUser(payload.email, payload.full_name, payload.phone);
    localStorage.setItem(MOCK_KEY, JSON.stringify(user));
    const access = mockToken("acc"), refresh = mockToken("ref");
    tokenStore.set(access, refresh);
    return { user, access_token: access, refresh_token: refresh };
  }
}

export async function me(): Promise<User | null> {
  try {
    return await apiFetch<User>("/users/me", { method: "GET" });
  } catch (e) {
    if (!(e instanceof MockUnavailableError)) return null;
    const raw = typeof window !== "undefined" ? localStorage.getItem(MOCK_KEY) : null;
    return raw ? (JSON.parse(raw) as User) : null;
  }
}

export async function logout(): Promise<void> {
  try { await apiFetch<void>("/auth/logout", { method: "POST" }); }
  catch { /* ignore (cả mock lẫn lỗi mạng) */ }
  tokenStore.clear();
  if (typeof window !== "undefined") localStorage.removeItem(MOCK_KEY);
}

export async function forgotPassword(email: string): Promise<void> {
  try { await apiFetch<void>("/auth/forgot", { method: "POST", body: JSON.stringify({ email }) }, { auth: false }); }
  catch (e) { if (!(e instanceof MockUnavailableError)) throw e; }
}
export async function resetPassword(email: string, otp: string, new_password: string): Promise<void> {
  try { await apiFetch<void>("/auth/reset", { method: "POST", body: JSON.stringify({ email, otp, new_password }) }, { auth: false }); }
  catch (e) { if (!(e instanceof MockUnavailableError)) throw e; }
}
