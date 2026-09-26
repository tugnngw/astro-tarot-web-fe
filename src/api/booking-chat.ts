// Nhắn tin và gọi trong một buổi tư vấn đã đặt.
import { apiFetch } from "./client";
import { publishRealtime } from "@/lib/realtime";

export interface BookingMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface PageOf<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

/** Máy chủ ICE cho WebRTC, lấy từ BE để đổi TURN không phải build lại FE. */
export interface IceConfig {
  iceServers: RTCIceServer[];
  /** false = chỉ có STUN; gọi sẽ hỏng với phần lớn người dùng 4G. */
  hasTurn: boolean;
}

/** Mới nhất trước — giao diện tự đảo lại khi vẽ. */
export function getMessages(bookingId: string, page = 0, size = 30) {
  return apiFetch<PageOf<BookingMessage>>(
    `/api/v1/bookings/${bookingId}/messages?page=${page}&size=${size}`,
  );
}

export function markMessagesRead(bookingId: string) {
  return apiFetch<{ marked: number }>(
    `/api/v1/bookings/${bookingId}/messages/read`,
    { method: "POST" },
  );
}

/** Trạng thái hoạt động của người BÊN KIA trong buổi này. */
export interface Presence {
  online: boolean;
  /** null khi người kia chưa từng kết nối lần nào. */
  lastSeenAt: string | null;
}

export function getPresence(bookingId: string) {
  return apiFetch<Presence>(`/api/v1/bookings/${bookingId}/presence`);
}

export function getIceConfig() {
  return apiFetch<IceConfig>("/api/v1/rtc/ice");
}

/**
 * Gửi tin: thử WebSocket trước, rớt thì rơi về REST.
 *
 * <p>Đây không phải sự cầu toàn. Backend chạy trên gói free của Render và
 * khởi động lại khá thường xuyên; mạng 4G chuyển trạm cũng làm đứt WebSocket.
 * Nếu chỉ có một đường thì mỗi lần đứt là người dùng gõ xong bấm gửi và không
 * có gì xảy ra — không báo lỗi, không gửi được, không hiểu vì sao.
 *
 * <p>REST chậm hơn một nhịp nhưng chắc chắn tới, và phía kia sẽ thấy khi họ
 * nối lại hoặc tải lại.
 */
export async function sendBookingMessage(
  bookingId: string,
  body: string,
): Promise<{ viaSocket: boolean }> {
  const sent = publishRealtime(`/app/bookings/${bookingId}/chat`, { body });
  if (sent) return { viaSocket: true };

  await apiFetch<BookingMessage>(`/api/v1/bookings/${bookingId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  return { viaSocket: false };
}
