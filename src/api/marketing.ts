import { apiFetch } from "./client";

export interface TrackMarketingPayload {
  eventName: string;
  path?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  metadata?: string | null;
}

export function trackMarketingEvent(payload: TrackMarketingPayload) {
  return apiFetch<void>("/api/v1/marketing/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMarketingSummary() {
  return apiFetch<Record<string, number>>("/api/v1/marketing/events/summary");
}

/**
 * Một hàng của bảng "khách đến từ đâu, rồi làm gì".
 *
 * Số liệu từ bảng `marketing_events` của chính hệ thống, không phải từ
 * Google. Hiện ngay (GA4 trễ 24–48 giờ), không bị trình chặn quảng cáo cắt,
 * và nối được với `user_id` nên đếm được NGƯỜI chứ không chỉ lượt.
 */
export interface HanhTrinhTheoNguon {
  nguon: string;
  tongLuot: number;
  /** Chỉ đếm được người đã đăng nhập — khách vãng lai không có user_id. */
  soNguoiDangNhap: number;
  theoHoatDong: Record<string, number>;
}

export function getHanhTrinhTheoNguon() {
  return apiFetch<HanhTrinhTheoNguon[]>("/api/v1/marketing/events/theo-nguon");
}
