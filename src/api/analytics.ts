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
