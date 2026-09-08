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
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ReaderUnavailableDate {
  id: string;
  date: string;
  reason: string | null;
}

export interface ReaderProfile {
  id: string;
  username: string;
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

export function getVerifiedReaders() {
  return apiFetch<ReaderProfile[]>("/api/v1/readers", {}, { auth: false });
}
