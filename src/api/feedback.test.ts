import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAdminFeedbackList,
  getAdminFeedbackStats,
  getMyFeedbackStatus,
  submitFeedback,
  type AdminFeedbackPage,
  type FeedbackStats,
  type FeedbackStatus,
  type UserFeedbackResponse,
} from "./feedback";
import { tokenStore } from "./client";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ code: status, data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(...responses: Response[]) {
  const fetchMock =
    vi.fn<(...args: Parameters<typeof fetch>) => Promise<Response>>();
  responses.forEach((res) => fetchMock.mockResolvedValueOnce(res));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("feedback API client", () => {
  beforeEach(() => {
    localStorage.clear();
    tokenStore.set("test-access-token", "test-refresh-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("submitFeedback", () => {
    it("gửi phản hồi thành công kèm điểm sao bắt buộc", async () => {
      const mockResult: UserFeedbackResponse = {
        id: "fb-123",
        rating: 5,
        nps: 10,
        comment: "Rất tuyệt vời",
        source: "TAROT_AI",
        utmSource: "facebook",
        utmMedium: "cpc",
        utmCampaign: "spring",
        createdAt: "2026-10-14T10:00:00Z",
        updatedAt: null,
      };

      const fetchMock = mockFetch(jsonResponse(mockResult, 200));

      const payload = {
        source: "TAROT_AI" as const,
        rating: 5,
        comment: "Rất tuyệt vời",
        utmSource: "facebook",
        utmMedium: "cpc",
        utmCampaign: "spring",
      };

      const res = await submitFeedback(payload);

      expect(res).toEqual(mockResult);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain("/api/v1/feedback");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        source: "TAROT_AI",
        rating: 5,
        comment: "Rất tuyệt vời",
        utmSource: "facebook",
        utmMedium: "cpc",
        utmCampaign: "spring",
      });
    });

    it("cho phép gửi kèm điểm NPS tuỳ chọn", async () => {
      const mockResult: UserFeedbackResponse = {
        id: "fb-456",
        rating: 4,
        nps: 9,
        comment: null,
        source: "LANDING",
        createdAt: "2026-10-14T10:00:00Z",
      };

      const fetchMock = mockFetch(jsonResponse(mockResult, 200));

      const res = await submitFeedback({
        source: "LANDING",
        rating: 4,
        nps: 9,
      });

      expect(res.nps).toBe(9);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const init = fetchMock.mock.calls[0][1];
      expect(JSON.parse(String(init?.body))).toMatchObject({
        source: "LANDING",
        rating: 4,
        nps: 9,
      });
    });
  });

  describe("getMyFeedbackStatus", () => {
    it("lấy trạng thái phản hồi và bản ghi cá nhân myFeedback", async () => {
      const mockStatus: FeedbackStatus = {
        submitted: true,
        total: 25,
        goal: 20,
        goalMet: true,
        myFeedback: {
          id: "fb-789",
          rating: 5,
          nps: 10,
          comment: "Đã đánh giá trước đó",
          source: "BOOKING",
          createdAt: "2026-10-10T12:00:00Z",
          updatedAt: "2026-10-12T14:00:00Z",
        },
      };

      const fetchMock = mockFetch(jsonResponse(mockStatus, 200));

      const status = await getMyFeedbackStatus();

      expect(status.submitted).toBe(true);
      expect(status.total).toBe(25);
      expect(status.goalMet).toBe(true);
      expect(status.myFeedback?.id).toBe("fb-789");
      expect(status.myFeedback?.rating).toBe(5);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0][0])).toContain(
        "/api/v1/feedback/me/status",
      );
    });
  });

  describe("getAdminFeedbackStats", () => {
    it("lấy dữ liệu thống kê tổng hợp cho Quản trị viên", async () => {
      const mockStats: FeedbackStats = {
        totalCount: 30,
        averageRating: 4.8,
        ratingDistribution: { 1: 0, 2: 0, 3: 2, 4: 5, 5: 23 },
        averageNps: 9.2,
        bySource: { TAROT_AI: 20, BOOKING: 7, GENERAL: 3 },
      };

      const fetchMock = mockFetch(jsonResponse(mockStats, 200));

      const stats = await getAdminFeedbackStats();

      expect(stats.totalCount).toBe(30);
      expect(stats.averageRating).toBe(4.8);
      expect(stats.ratingDistribution[5]).toBe(23);
      expect(stats.averageNps).toBe(9.2);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0][0])).toContain(
        "/api/v1/admin/feedback/stats",
      );
    });
  });

  describe("getAdminFeedbackList", () => {
    it("gọi API danh sách mặc định không có tham số lọc", async () => {
      const mockPage: AdminFeedbackPage = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
        first: true,
        last: true,
      };

      const fetchMock = mockFetch(jsonResponse(mockPage, 200));

      const res = await getAdminFeedbackList();

      expect(res.content).toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0][0])).toContain(
        "/api/v1/admin/feedback",
      );
    });

    it("nối đúng query parameters khi lọc theo số sao, nguồn, từ khoá và phân trang", async () => {
      const mockPage: AdminFeedbackPage = {
        content: [
          {
            id: "fb-1",
            userId: "u-1",
            username: "hoang",
            userFullName: "Nguyễn Hoàng",
            userEmail: "hoang@example.com",
            rating: 5,
            nps: 10,
            comment: "Rất hay",
            source: "TAROT_AI",
            utmSource: "google",
            utmMedium: "organic",
            utmCampaign: null,
            createdAt: "2026-10-14T08:00:00Z",
            updatedAt: null,
            isAnonymous: false,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 2,
        first: false,
        last: true,
      };

      const fetchMock = mockFetch(jsonResponse(mockPage, 200));

      const res = await getAdminFeedbackList({
        rating: 5,
        source: "TAROT_AI",
        keyword: "hay",
        page: 2,
        size: 10,
      });

      expect(res.content).toHaveLength(1);
      expect(res.content[0].username).toBe("hoang");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = String(fetchMock.mock.calls[0][0]);
      expect(url).toContain("rating=5");
      expect(url).toContain("source=TAROT_AI");
      expect(url).toContain("keyword=hay");
      expect(url).toContain("page=2");
      expect(url).toContain("size=10");
    });
  });
});
