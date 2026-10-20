import { apiFetch } from "./client";

export interface GA4Overview {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  screenPageViews: number;
  bounceRate: number;
  averageSessionDuration: number;
}

export interface GA4TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  activeUsers: number;
}

export interface GA4TimeSeries {
  date: string;
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
}

export interface GA4ReportResponse {
  configured: boolean;
  propertyId: string;
  startDate: string;
  endDate: string;
  overview: GA4Overview;
  trafficSources: GA4TrafficSource[];
  timeSeries: GA4TimeSeries[];
  /**
   * Số người đang ở trên web trong 30 phút qua.
   *
   * Lấy từ lượt gọi thời gian thực, khác `overview.activeUsers` vốn lấy từ
   * báo cáo thường — mà báo cáo thường trễ 24–48 giờ với tài sản mới.
   * -1 nghĩa là không hỏi được.
   */
  realtimeActiveUsers: number;
  status: "SUCCESS" | "NOT_CONFIGURED" | "ERROR";
  message: string;
}

/**
 * Gọi backend lấy dữ liệu báo cáo Google Analytics 4 (yêu cầu quyền Admin).
 */
export function getGA4Report(startDate = "30daysAgo", endDate = "today") {
  const params = new URLSearchParams({ startDate, endDate });
  return apiFetch<GA4ReportResponse>(
    `/api/v1/admin/analytics/report?${params.toString()}`
  );
}

/** Một hàng "tên → số" của bảng đang-online. */
export interface DongSo {
  ten: string;
  so: number;
}

/**
 * Ai đang ở trên web NGAY BÂY GIỜ.
 *
 * Cột "đến từ đâu" KHÔNG có ở đây, và đó không phải thiếu sót: Realtime API
 * của GA4 chỉ nhận một tập chiều rất hẹp và không có `sessionSource`. Google
 * biết đang có 3 người ở TP.HCM xem trang Tarot, nhưng không nói được họ đến
 * từ Facebook hay tự gõ địa chỉ. Phần nguồn lấy từ bảng của mình.
 */
export interface DangOnline {
  /** -1 = không hỏi được; 0 = hỏi được và đúng là không có ai. */
  soNguoiDangOnline: number;
  theoNoi: DongSo[];
  theoTrang: DongSo[];
  theoHanhDong: DongSo[];
  theoThietBi: DongSo[];
  thongDiep: string | null;
}

export function getDangOnline() {
  return apiFetch<DangOnline>("/api/v1/admin/analytics/dang-online");
}
