import { apiFetch } from "./client";

export interface UserFeedbackResponse {
  id: string;
  rating: number;
  nps: number;
  comment: string | null;
  source: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface FeedbackStatus {
  submitted: boolean;
  total: number;
  goal: number;
  goalMet: boolean;
  myFeedback?: UserFeedbackResponse | null;
}

export interface SubmitFeedbackPayload {
  source: "TAROT_AI" | "BOOKING" | "GENERAL" | "LANDING" | string;
  /** Điểm đánh giá trải nghiệm từ 1 đến 5 sao (bắt buộc) */
  rating: number;
  /** Điểm NPS từ 0 đến 10 (tuỳ chọn — BE tự tính rating * 2 nếu bỏ qua) */
  nps?: number | null;
  comment?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export function submitFeedback(payload: SubmitFeedbackPayload) {
  return apiFetch<UserFeedbackResponse>("/api/v1/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyFeedbackStatus() {
  return apiFetch<FeedbackStatus>("/api/v1/feedback/me/status");
}

// ============================================================
// API Quản trị phản hồi & Đánh giá hệ thống — GET /api/v1/admin/feedback/*
// ============================================================

export interface FeedbackStats {
  totalCount: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  averageNps: number | null;
  bySource: Record<string, number>;
}

export interface AdminFeedbackItem {
  id: string;
  userId: string | null;
  username: string | null;
  userFullName: string | null;
  userEmail: string | null;
  rating: number;
  nps: number;
  comment: string | null;
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
  updatedAt: string | null;
  isAnonymous: boolean;
}

export interface AdminFeedbackPage {
  content: AdminFeedbackItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface AdminFeedbackQuery {
  rating?: number;
  source?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export function getAdminFeedbackStats() {
  return apiFetch<FeedbackStats>("/api/v1/admin/feedback/stats");
}

export function getAdminFeedbackList(query: AdminFeedbackQuery = {}) {
  const params = new URLSearchParams();
  if (query.rating !== undefined && query.rating !== null) {
    params.set("rating", String(query.rating));
  }
  if (query.source) {
    params.set("source", query.source);
  }
  if (query.keyword && query.keyword.trim()) {
    params.set("keyword", query.keyword.trim());
  }
  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }
  if (query.size !== undefined) {
    params.set("size", String(query.size));
  }
  const qs = params.toString();
  return apiFetch<AdminFeedbackPage>(
    `/api/v1/admin/feedback${qs ? `?${qs}` : ""}`,
  );
}

/** Form Google dự phòng khi BE chưa sẵn / muốn thu thêm ngoài app. */
export const EXTERNAL_FEEDBACK_FORM_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta.env.VITE_FEEDBACK_FORM_URL as string | undefined)) ||
  "https://forms.gle/";
