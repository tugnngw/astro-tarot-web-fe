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
  /** Tin ghim lên đầu; không bị xoá hàng loạt. */
  pinned: boolean;
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

export function setPinned(id: string, pinned: boolean) {
  return apiFetch<void>(`${BASE}/${id}/pin`, {
    method: "PATCH",
    body: JSON.stringify({ pinned }),
  });
}

/**
 * Xoá hẳn các thông báo ĐÃ ĐỌC (trừ tin đã ghim).
 */
export function deleteReadNotifications() {
  return apiFetch<{ deleted: number }>(`${BASE}/read`, { method: "DELETE" });
}

/** Xoá theo id đã chọn. Tin ghim bị bỏ qua phía server. */
export function deleteNotifications(ids: string[]) {
  return apiFetch<{ deleted: number }>(BASE, {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
}

export function markAllRead() {
  return apiFetch<{ updated: number }>(`${BASE}/read-all`, { method: "PATCH" });
}

/** Đích của một thông báo: đường dẫn, kèm tham số tìm kiếm nếu cần mở đúng tab. */
export interface NotificationTarget {
  to: string;
  search?: Record<string, string>;
}

/** Danh sách lịch hẹn phía Reader nằm trong Bàn làm việc, không phải /bookings. */
const PHIA_READER: NotificationTarget = {
  to: "/staff",
  search: { tab: "bookings" },
};
const PHIA_KHACH: NotificationTarget = { to: "/bookings" };

/**
 * Phía mà thông báo nói tới, do BE ghi vào metadata (`NotificationTypes.SIDE`).
 *
 * Trả null với tin cũ tạo ra trước khi BE ghi khoá này, và với metadata hỏng —
 * một chuỗi JSON không đọc được không được phép làm hỏng cả hộp thông báo.
 */
function phiaCua(metadata: string | null): "reader" | "customer" | null {
  if (!metadata) return null;
  try {
    const side = (JSON.parse(metadata) as { side?: unknown }).side;
    return side === "reader" || side === "customer" ? side : null;
  } catch {
    return null;
  }
}

/**
 * Nơi cần đưa người dùng tới khi họ bấm vào một thông báo.
 *
 * Trả null khi không có đích rõ ràng — bấm vào chỉ đánh dấu đã đọc, tốt hơn là
 * đẩy họ tới một trang chẳng liên quan.
 *
 * Một buổi xem có hai người và HAI danh sách khác nhau: "Lịch hẹn của tôi"
 * (/bookings) của khách, và tab Lịch hẹn trong Bàn làm việc (/staff) của
 * Reader. Loại thông báo KHÔNG đủ để chọn giữa hai cái đó — BOOKING_CANCELLED
 * và PAYMENT_CONFIRMED đều gửi được cho cả hai bên tuỳ tình huống — nên phía
 * lấy từ metadata do người gửi ghi, chứ không suy lại ở đây.
 *
 * Trước khi có khoá ấy, mọi BOOKING_* đều đổ về /bookings. Reader nhận "Có
 * lịch hẹn mới" — loại thông báo CHỈ Reader mới nhận được — rồi bấm vào và bị
 * đưa sang danh sách phía khách, nơi trống rỗng một cách hoàn toàn đúng đắn vì
 * chính họ không đặt gì cả. Kết luận tự nhiên của người dùng là lịch hẹn không
 * tới nơi.
 */
export function notificationLink(n: Notification): NotificationTarget | null {
  if (!n.type) return null;

  const phia = phiaCua(n.metadata);
  if (phia === "reader") return PHIA_READER;
  if (phia === "customer") return PHIA_KHACH;

  // Tin CŨ, chưa có khoá "side". Suy theo loại, và chấp nhận đoán sai ở hai
  // loại đi được cả hai chiều — chỗ nào chắc chắn thì vẫn phải đi đúng.
  if (n.type === "BOOKING_CREATED" || n.type === "REVIEW_RECEIVED") {
    return PHIA_READER;
  }
  if (n.type.startsWith("BOOKING_")) return PHIA_KHACH;
  if (n.type.startsWith("READER_APPLICATION_")) return { to: "/profile" };
  if (n.type === "SUPPORT_REPLY") return { to: "/support" };
  if (n.type === "SUPPORT_MESSAGE") {
    return { to: "/staff", search: { tab: "support" } };
  }
  // Lệnh rút tiền chỉ Reader mới có, và nó nằm ở tab Thu nhập — /bookings
  // không liên quan gì tới tiền của Reader.
  if (n.type.startsWith("PAYOUT_")) {
    return { to: "/staff", search: { tab: "earnings" } };
  }
  if (n.type.startsWith("PAYMENT_")) return PHIA_KHACH;
  return null;
}
