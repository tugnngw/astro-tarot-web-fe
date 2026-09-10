// ============================================================
// READER API — hồ sơ Reader của chính mình
// Khớp với BE: /api/v1/readers/**
//
// Chỉ tài khoản có quyền READER_MANAGE_PROFILE (STAFF, ADMIN) gọi được
// /readers/profile/me. Danh sách Reader công khai thì khách cũng xem được.
// ============================================================

import { apiFetch } from "./client";

export interface ReaderAvailability {
  id: string;
  /** 1 = Thứ Hai … 7 = Chủ Nhật. Quy ước này khớp BookingService khi sinh slot. */
  dayOfWeek: number;
  /** "HH:mm:ss" — LocalTime của BE. */
  startTime: string;
  endTime: string;
  isActive?: boolean | null;
}

export interface ReaderUnavailableDate {
  id: string;
  /** "YYYY-MM-DD". Trước đây khai là `date` — sai tên, BE trả `unavailableDate`. */
  unavailableDate: string;
  reason: string | null;
}

/** Trạng thái đơn xin làm Reader của chính mình. */
export interface ReaderApplication {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  bio: string | null;
  experience: number | null;
  specialties: string[] | null;
  createdAt: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
}

export interface ReaderProfile {
  id: string;
  username: string;
  /** Tài khoản đứng sau hồ sơ — dùng để nhận ra "Reader này là chính tôi". */
  userId: string | null;
  /** Tên hiển thị. Trang công khai gọi Reader bằng tên, không phải username. */
  fullName: string | null;
  avatar: string | null;
  bio: string | null;
  specialties: string[] | null;
  yearsExperience: number | null;
  pricePer15m: number | null;
  pricePer30m: number | null;
  pricePer60m: number | null;
  rating: number | null;
  totalReviews: number | null;
  isAvailable: boolean | null;
  weeklyAvailability: ReaderAvailability[] | null;
  unavailableDates: ReaderUnavailableDate[] | null;
}

export function getMyReaderProfile() {
  return apiFetch<ReaderProfile>("/api/v1/readers/profile/me");
}

export function getReader(readerProfileId: string) {
  return apiFetch<ReaderProfile>(
    `/api/v1/readers/${readerProfileId}`,
    {},
    { auth: false },
  );
}

export function getVerifiedReaders() {
  return apiFetch<ReaderProfile[]>("/api/v1/readers", {}, { auth: false });
}

// ------------------------------------------------------------
// Đơn xin làm Reader
// ------------------------------------------------------------

export function applyReader(payload: {
  bio: string;
  experience?: number;
  specialties?: string[];
}) {
  return apiFetch<string>("/api/v1/readers/apply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Đơn gần nhất của mình. Trả null khi chưa từng nộp — không phải lỗi. */
export function getMyApplication() {
  return apiFetch<ReaderApplication | null>("/api/v1/readers/applications/me");
}

// ------------------------------------------------------------
// Hồ sơ Reader — tự sửa giới thiệu, kinh nghiệm và bảng giá
// ------------------------------------------------------------

export interface UpdateReaderProfilePayload {
  bio?: string;
  specialties?: string[];
  yearsExperience?: number;
  pricePer15m?: number | null;
  pricePer30m?: number | null;
  pricePer60m?: number | null;
}

export function updateReaderProfile(payload: UpdateReaderProfilePayload) {
  return apiFetch<void>("/api/v1/readers/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ------------------------------------------------------------
// Khung giờ rảnh hàng tuần
// ------------------------------------------------------------

export function getAvailability() {
  return apiFetch<ReaderAvailability[]>("/api/v1/availability");
}

export function createAvailability(payload: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}) {
  return apiFetch<void>("/api/v1/availability", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteAvailability(id: string) {
  return apiFetch<void>(`/api/v1/availability/${id}`, { method: "DELETE" });
}

// ------------------------------------------------------------
// Ngày nghỉ
// ------------------------------------------------------------

export function getUnavailableDates() {
  return apiFetch<ReaderUnavailableDate[]>("/api/v1/unavailable-dates");
}

export function addUnavailableDate(payload: {
  unavailableDate: string;
  reason?: string;
}) {
  return apiFetch<void>("/api/v1/unavailable-dates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteUnavailableDate(id: string) {
  return apiFetch<void>(`/api/v1/unavailable-dates/${id}`, { method: "DELETE" });
}
