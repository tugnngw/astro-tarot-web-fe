// src/api/auth.ts
import { apiFetch, tokenStore } from "./client";
import type { AuthResult } from "./types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

/** Đăng ký KHÔNG trả token — tài khoản phải xác minh email mới đăng nhập được. */
export interface RegisterResult {
  email: string;
  verificationEmailSent: boolean;
}

// Định dạng BE trả về khi đăng nhập thành công
interface AuthResponseRaw {
  userId: string;
  username: string;
  email: string | null;
  fullName: string;
  role: "USER" | "STAFF" | "MANAGER" | "ADMIN";
  /** BE cũ chưa có trường này, nên để optional và có đường lùi ở auth-context. */
  permissions?: string[];
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function toAuthResult(data: AuthResponseRaw): AuthResult {
  return {
    user: {
      id: data.userId,
      username: data.username,
      email: data.email,
      full_name: data.fullName,
      role: data.role,
      phone: null,
      avatar: null,
      status: "ACTIVE",
      // Đăng nhập được nghĩa là đã xác minh — BE chặn tài khoản chưa xác minh.
      email_verified: true,
      last_login_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
    permissions: data.permissions ?? [],
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  };
}

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const data = await apiFetch<AuthResponseRaw>(
    "/auth/login",
    { method: "POST", body: JSON.stringify(payload) },
    { auth: false },
  );
  const result = toAuthResult(data);
  tokenStore.set(data.accessToken, data.refreshToken);
  return result;
}

export async function register(
  payload: RegisterPayload,
): Promise<RegisterResult> {
  return apiFetch<RegisterResult>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        fullName: payload.full_name,
      }),
    },
    { auth: false },
  );
}

/** Xác minh email bằng token trong link. Gọi khi người dùng mở /verify-email. */
export async function verifyEmail(token: string): Promise<{ email: string }> {
  return apiFetch<{ email: string }>(
    "/auth/verify-email",
    { method: "POST", body: JSON.stringify({ token }) },
    { auth: false },
  );
}

export async function resendVerification(email: string): Promise<void> {
  await apiFetch<void>(
    "/auth/resend-verification",
    { method: "POST", body: JSON.stringify({ email }) },
    { auth: false },
  );
}

export async function forgotPassword(email: string): Promise<void> {
  await apiFetch<void>(
    "/auth/forgot-password",
    { method: "POST", body: JSON.stringify({ email }) },
    { auth: false },
  );
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  await apiFetch<void>(
    "/auth/reset-password",
    { method: "POST", body: JSON.stringify({ token, newPassword }) },
    { auth: false },
  );
}

export async function logout(): Promise<void> {
  const refreshToken = tokenStore.getRefresh();
  try {
    if (refreshToken) {
      await apiFetch<void>(
        "/auth/logout",
        { method: "POST", body: JSON.stringify({ refreshToken }) },
        { auth: false },
      );
    }
  } catch {
    // Đăng xuất phía server hỏng cũng không được chặn người dùng thoát;
    // token phía client vẫn bị xoá ở finally.
  } finally {
    tokenStore.clear();
  }
}
