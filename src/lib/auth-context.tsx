// src/lib/auth-context.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import * as authApi from "@/api/auth";
import type { User } from "@/api/types";

export type Role = "guest" | "user" | "reader" | "admin";

const toUiRole = (r: User["role"]): Role =>
    r === "ADMIN" ? "admin" : r === "READER" ? "reader" : "user";

export interface AuthUser {
  id: string;
  name: string;
  full_name: string;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: Role;
  joinedAt: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;  // Chỉ nhận username
  register: (data: { username: string; full_name: string; password: string }) => Promise<void>;  // Thêm username
  logout: () => void;
  updateProfile: (patch: Partial<Omit<AuthUser, "id" | "role" | "joinedAt">>) => void;
  requestAuth: (cb: () => void) => void;
  authPrompt: { open: false } | { open: true; mode: "login" | "register" | "forgot" | "reader" };
  openAuth: (mode: "login" | "register" | "forgot" | "reader") => void;
  closeAuth: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const USER_KEY = "astrotarot_user_v2";

function toAuthUser(u: User): AuthUser {
  return {
    id: u.id,
    name: u.full_name,
    full_name: u.full_name,
    username: u.username,
    email: u.email ?? undefined,
    phone: u.phone ?? undefined,
    avatar: u.avatar ?? undefined,
    role: toUiRole(u.role),
    joinedAt: u.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authPrompt, setAuthPrompt] = useState<AuthCtx["authPrompt"]>({ open: false });
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  };

  const login: AuthCtx["login"] = async (username, password) => {
    const res = await authApi.login({ username, password });
    persist(toAuthUser(res.user));
    navigate({ to: "/" });
    if (pendingAction) {
      const a = pendingAction;
      setPendingAction(null);
      setTimeout(a, 100);
    }
  };

  const register: AuthCtx["register"] = async (data) => {
    const res = await authApi.register({
      full_name: data.full_name,
      username: data.username,
      password: data.password,
    });
    persist(toAuthUser(res.user));
    navigate({ to: "/" });
  };

  const logout = () => {
    void authApi.logout();
    persist(null);
  };

  const updateProfile = (patch: Partial<Omit<AuthUser, "id" | "role" | "joinedAt">>) => {
    if (user) {
      persist({ ...user, ...patch });
    }
  };

  const requestAuth = (cb: () => void) => {
    if (user) cb();
    else {
      setPendingAction(() => cb);
      setAuthPrompt({ open: true, mode: "login" });
    }
  };

  return (
      <Ctx.Provider
          value={{
            user,
            login,
            register,
            logout,
            updateProfile,
            requestAuth,
            authPrompt,
            openAuth: (mode) => setAuthPrompt({ open: true, mode }),
            closeAuth: () => setAuthPrompt({ open: false }),
          }}
      >
        {children}
      </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}