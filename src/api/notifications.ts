// ============================================================
// NOTIFICATION API — hộp thông báo của người đang đăng nhập
// Khớp với BE: /api/v1/me/notifications
// ============================================================

import { apiFetch } from "./client";

const BASE = "/api/v1/me/notifications";

export interface Notification {
  id: string;
  title: string;
  message: string | null;
  /** Xem NotificationTypes bên BE. Quyết định biểu tượng và đường dẫn khi bấm. */
  type: string | null;
  read: boolean;
  /** JSON thô, thường chứa bookingId để dựng link. */
  metadata: string | null;
  createdAt: string;
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  number: number;
  first: boolean;
  last: boolean;
}

export function getNotifications(page = 0, size = 20) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return apiFetch<NotificationPage>(`${BASE}?${params}`);
}

export function getUnreadCount() {
  return apiFetch<{ count: number }>(`${BASE}/unread-count`);
}

export function markRead(id: string) {
  return apiFetch<void>(`${BASE}/${id}/read`, { method: "PATCH" });
}

/**
 * Xoá hẳn các thông báo ĐÃ ĐỌC.
 *
 * Đánh dấu đã đọc chỉ tắt chấm tròn; danh sách vẫn dài ra mãi. Đây là đường
 * dọn dẹp thật. Tin chưa đọc không bị đụng tới.
 */
export function deleteReadNotifications() {
  return apiFetch<{ deleted: number }>(`${BASE}/read`, { method: "DELETE" });
}

export function markAllRead() {
  return apiFetch<{ updated: number }>(`${BASE}/read-all`, { method: "PATCH" });
}

/**
 * Nơi cần đưa người dùng tới khi họ bấm vào một thông báo.
 *
 * Trả null khi không có đích rõ ràng — bấm vào chỉ đánh dấu đã đọc, tốt hơn là
 * đẩy họ tới một trang chẳng liên quan.
 */
export function notificationLink(n: Notification): string | null {
  if (!n.type) return null;
  if (n.type.startsWith("BOOKING_") || n.type === "REVIEW_RECEIVED") {
    return n.type === "REVIEW_RECEIVED" ? "/staff" : "/bookings";
  }
  if (n.type.startsWith("READER_APPLICATION_")) return "/profile";
  return null;
}
