// ============================================================
// PROFILE API — hồ sơ của người đang đăng nhập
// Khớp với BE: /api/v1/me
//
// userId lấy từ token ở phía BE, không truyền qua đường dẫn, nên không có
// cách nào gọi nhầm sang hồ sơ người khác.
// ============================================================

import { apiFetch, API_BASE } from "./client";

const BASE = "/api/v1/me";

export type Gender = "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED";

export interface Profile {
  id: string;
  /** Sinh tự động từ email lúc đăng ký — chỉ đọc. */
  username: string;
  /** Đổi qua luồng xác minh email riêng — chỉ đọc ở đây. */
  email: string | null;
  emailVerified: boolean;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  gender: Gender;
  dateOfBirth: string | null;
  bio: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  role: "USER" | "STAFF" | "MANAGER" | "ADMIN";
  /** Quyền của vai trò, do BE cấp. Chỉ dùng để hiện/ẩn giao diện. */
  permissions?: string[];
  status: string;
  authProvider: string;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Mọi trường tuỳ chọn — chỉ trường nào gửi lên mới bị ghi đè ở BE. */
export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string | null;
  bio?: string;
  address?: string;
  city?: string;
  country?: string;
}

export const GENDER_LABEL: Record<Gender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
  UNDISCLOSED: "Không tiết lộ",
};

export function getProfile() {
  return apiFetch<Profile>(BASE);
}

export function updateProfile(payload: UpdateProfilePayload) {
  return apiFetch<Profile>(BASE, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("file", file);
  // Không đặt Content-Type — apiFetch nhận ra FormData và để trình duyệt tự
  // gắn kèm boundary.
  return apiFetch<Profile>(`${BASE}/avatar`, { method: "POST", body: form });
}

export function removeAvatar() {
  return apiFetch<Profile>(`${BASE}/avatar`, { method: "DELETE" });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<void>(`${BASE}/change-password`, {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/**
 * Avatar do BE trả về là đường dẫn tương đối (/uploads/avatars/...), phải ghép
 * với gốc API mới ra URL tải được — FE và BE chạy ở hai cổng khác nhau.
 * Avatar từ Google là URL tuyệt đối nên giữ nguyên.
 */
export function avatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `${API_BASE}${avatar}`;
}
