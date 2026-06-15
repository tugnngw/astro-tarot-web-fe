// ============================================================
// AuthContext — quản lý phiên đăng nhập + role.
// - Gọi src/api/auth.ts (auto MOCK nếu chưa cấu hình VITE_API_BASE_URL).
// - Lưu user vào localStorage để giữ phiên khi reload.
// - Role chuẩn hoá về chữ thường để code UI cũ vẫn chạy
//   ("user" | "reader" | "admin").
// ============================================================
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "@/api/auth";
import type { User } from "@/api/types";

/** Role chữ thường, dùng thống nhất trong UI */
export type Role = "guest" | "user" | "reader" | "admin" | "expert";

/** Map role từ DB (UPPERCASE) → UI (lowercase) */
const toUiRole = (r: User["role"]): Role =>
  r === "ADMIN" ? "admin" : r === "READER" ? "reader" : "user";

/** Mô hình user dùng trong UI (giữ tương thích cũ + thêm full_name) */
export interface AuthUser {
  id: string;
  name: string;          // alias của full_name (giữ tương thích UI cũ)
  full_name: string;     // tên thật theo schema
  email: string;
  phone?: string;
  avatar?: string;
  role: Role;
  joinedAt: string;
}

interface AuthCtx {
  user: AuthUser | null;
  /** Đăng nhập bằng email + password (backend hoặc mock) */
  login: (email: string, password: string) => Promise<void>;
  /** Đăng ký — dùng đúng tên `full_name` theo schema */
  register: (data: { full_name: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (patch: Partial<AuthUser>) => void;
  /** Mở modal login nếu chưa đăng nhập, ngược lại chạy callback ngay */
  requestAuth: (cb: () => void) => void;
  authPrompt: { open: false } | { open: true; mode: "login" | "register" | "forgot" | "reader" };
  openAuth: (mode: "login" | "register" | "forgot" | "reader") => void;
  closeAuth: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const USER_KEY = "astrotarot_user_v2";

/** Chuẩn hoá user từ API → UI shape */
function toAuthUser(u: User): AuthUser {
  return {
    id: u.id,
    name: u.full_name,           // alias cũ
    full_name: u.full_name,
    email: u.email,
    phone: u.phone ?? undefined,
    avatar: u.avatar ?? undefined,
    role: toUiRole(u.role),
    joinedAt: u.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authPrompt, setAuthPrompt] = useState<AuthCtx["authPrompt"]>({ open: false });
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Khôi phục phiên từ localStorage khi mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore JSON lỗi */ }
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  };

  const login: AuthCtx["login"] = async (email, password) => {
    const res = await authApi.login({ email, password });
    persist(toAuthUser(res.user));
    // Thực hiện action người dùng định làm trước khi bị chặn auth
    if (pendingAction) {
      const a = pendingAction; setPendingAction(null);
      setTimeout(a, 100);
    }
  };

  const register: AuthCtx["register"] = async (data) => {
    const res = await authApi.register(data);
    persist(toAuthUser(res.user));
  };

  const logout = () => { void authApi.logout(); persist(null); };

  const updateProfile = (patch: Partial<AuthUser>) =>
    persist(user ? { ...user, ...patch } : null);

  /** Nếu user đã login → chạy ngay. Ngược lại mở modal và nhớ lại action. */
  const requestAuth = (cb: () => void) => {
    if (user) cb();
    else { setPendingAction(() => cb); setAuthPrompt({ open: true, mode: "login" }); }
  };

  return (
    <Ctx.Provider value={{
      user, login, register, logout, updateProfile, requestAuth,
      authPrompt,
      openAuth: (mode) => setAuthPrompt({ open: true, mode }),
      closeAuth: () => setAuthPrompt({ open: false }),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
