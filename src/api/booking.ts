// ============================================================
// BOOKING API — trụ cột 2: đặt lịch với Reader thật
// Khớp với BE: /api/v1/bookings, /api/v1/readers/{id}/slots
//
// Khung giờ trống và đánh giá là công khai — khách chưa đăng nhập phải xem
// được trước khi quyết định đăng ký tài khoản.
// ============================================================

import { apiFetch } from "./client";

import { PAGE_SIZE } from "@/components/Pagination";
export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type BookingPaymentStatus = "UNPAID" | "PAID" | "REFUNDED" | "FAILED";

/** Đúng ba mốc Reader khai giá. BE từ chối mọi giá trị khác. */
export const DURATIONS = [15, 30, 60] as const;
export type Duration = (typeof DURATIONS)[number];

export interface Booking {
  id: string;
  readerProfileId: string;
  /** Tài khoản của Reader. Cần để báo cáo đúng người, không phải hồ sơ. */
  readerUserId: string;
  readerName: string;
  readerAvatar: string | null;
  customerId: string;
  customerName: string;
  customerAvatar: string | null;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  cancelReason: string | null;
  /** Đã đánh giá chưa — quyết định hiện nút "Đánh giá" hay điểm đã chấm. */
  reviewed: boolean;
  /**
   * Ghi chú Reader viết sau buổi xem — cả khách lẫn Reader đều đọc được.
   * Với đề tài Tarot thì đây là sản phẩm: trước khi có nó, khách trả tiền
   * xong là buổi xem không để lại gì ngoài một dòng trạng thái.
   */
  readerNote: string | null;
  readerNoteAt: string | null;
  createdAt: string;
}

export interface BookingPage {
  content: Booking[];
  totalElements: number;
  totalPages: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface Slot {
  startTime: string;
  endTime: string;
  price: number;
}

export interface Review {
  id: string;
  bookingId: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewPage {
  content: Review[];
  totalElements: number;
  totalPages: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Chờ Reader nhận",
  CONFIRMED: "Đã nhận lịch",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã huỷ",
};

// ---------- Công khai ----------

export function getSlots(
  readerProfileId: string,
  date: string,
  duration: number,
) {
  const params = new URLSearchParams({ date, duration: String(duration) });
  return apiFetch<Slot[]>(
    `/api/v1/readers/${readerProfileId}/slots?${params}`,
    {},
    { auth: false },
  );
}

/**
 * Ngày gần nhất Reader còn khung trống. null = trong khoảng dò không còn ngày nào.
 *
 * Cần vì khung đã qua giờ bị loại: xem vào buổi tối thì hôm nay luôn trống
 * trơn, và trang mặc định chọn hôm nay nên Reader trông như không nhận khách.
 */
export function getNextAvailableDate(
  readerProfileId: string,
  duration: number,
  from?: string,
) {
  const params = new URLSearchParams({ duration: String(duration) });
  if (from) params.set("from", from);
  return apiFetch<string | null>(
    `/api/v1/readers/${readerProfileId}/slots/next-available?${params}`,
    {},
    { auth: false },
  );
}

export function getReaderReviews(
  readerProfileId: string,
  page = 0,
  size = PAGE_SIZE,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return apiFetch<ReviewPage>(
    `/api/v1/readers/${readerProfileId}/reviews?${params}`,
    {},
    { auth: false },
  );
}

// ---------- Cần đăng nhập ----------

export function createBooking(payload: {
  readerProfileId: string;
  startTime: string;
  durationMinutes: number;
}) {
  return apiFetch<Booking>("/api/v1/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyBookings(
  query: { status?: string; page?: number; size?: number } = {},
) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.size !== undefined) params.set("size", String(query.size));
  const qs = params.toString();
  return apiFetch<BookingPage>(`/api/v1/bookings/me${qs ? `?${qs}` : ""}`);
}

export function getReaderBookings(
  query: { status?: string; page?: number; size?: number } = {},
) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.size !== undefined) params.set("size", String(query.size));
  const qs = params.toString();
  return apiFetch<BookingPage>(`/api/v1/bookings/reader${qs ? `?${qs}` : ""}`);
}

export function confirmBooking(id: string) {
  return apiFetch<Booking>(`/api/v1/bookings/${id}/confirm`, {
    method: "PATCH",
  });
}

export function completeBooking(id: string) {
  return apiFetch<Booking>(`/api/v1/bookings/${id}/complete`, {
    method: "PATCH",
  });
}

/** Reader lưu ghi chú buổi xem. Chuỗi rỗng là xoá. */
export function saveReaderNote(id: string, note: string) {
  return apiFetch<Booking>(`/api/v1/bookings/${id}/note`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}

export function cancelBooking(id: string, reason?: string) {
  return apiFetch<Booking>(`/api/v1/bookings/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason: reason ?? null }),
  });
}

export function reviewBooking(id: string, rating: number, comment?: string) {
  return apiFetch<Review>(`/api/v1/bookings/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ rating, comment: comment ?? null }),
  });
}
