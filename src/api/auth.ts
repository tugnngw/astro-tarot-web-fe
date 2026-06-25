// src/api/auth.ts
import { apiFetch, tokenStore } from "./client";
import type { User, AuthResult } from "./types";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  username: string;
  password: string;
  email?: string;
}

// BE trả về format này
interface AuthResponseRaw {
  userId: string;
  username: string;
  email: string | null;
  fullName: string;
  role: "USER" | "READER" | "ADMIN";
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const data = await apiFetch<AuthResponseRaw>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { auth: false },
  );

  // Map từ BE response sang AuthResult
  const result: AuthResult = {
    user: {
      id: data.userId,
      username: data.username,
      email: data.email,
      full_name: data.fullName,
      role: data.role,
      phone: null,
      avatar: null,
      status: "ACTIVE",
      email_verified: false,
      last_login_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  };

  tokenStore.set(data.accessToken, data.refreshToken);
  return result;
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const data = await apiFetch<AuthResponseRaw>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        fullName: payload.full_name,
        username: payload.username,
        password: payload.password,
      }),
    },
    { auth: false },
  );

  const result: AuthResult = {
    user: {
      id: data.userId,
      username: data.username,
      email: data.email,
      full_name: data.fullName,
      role: data.role,
      phone: null,
      avatar: null,
      status: "ACTIVE",
      email_verified: false,
      last_login_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  };

  tokenStore.set(data.accessToken, data.refreshToken);
  return result;
}

export async function logout(): Promise<void> {
  const refreshToken = tokenStore.getRefresh();
  try {
    if (refreshToken) {
      await apiFetch<void>(
        "/auth/logout",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        },
        { auth: false },
      );
    }
  } catch {
    // ignore
  } finally {
    tokenStore.clear();
  }
}
