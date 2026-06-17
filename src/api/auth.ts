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

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const data = await apiFetch<AuthResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  }, { auth: false });

  tokenStore.set(data.accessToken, data.refreshToken);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const data = await apiFetch<AuthResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: payload.full_name,  // BE dùng fullName trong RegisterRequest
      username: payload.username,
      password: payload.password,
    }),
  }, { auth: false });

  tokenStore.set(data.accessToken, data.refreshToken);
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = tokenStore.getRefresh();
  try {
    if (refreshToken) {
      await apiFetch<void>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }, { auth: false });
    }
  } catch {
    // ignore
  } finally {
    tokenStore.clear();
  }
}