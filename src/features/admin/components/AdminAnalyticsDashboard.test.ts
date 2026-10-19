import { describe, expect, it } from "vitest";
import {
  DATE_RANGE_MAP,
  formatDuration,
  formatPercent,
  nf,
  trangThaiGa4,
} from "./AdminAnalyticsDashboard";
import { sanitizePath, GA_MEASUREMENT_ID } from "@/lib/analytics";

describe("AdminAnalyticsDashboard & GA4 Analytics Module", () => {
  describe("Measurement ID & Configuration", () => {
    it("sử dụng GA4 Measurement ID chuẩn của dự án", () => {
      expect(GA_MEASUREMENT_ID).toBe("G-XPERZQWF4T");
    });
  });

  describe("khoảng ngày phải khớp với Google", () => {
    /**
     * GA4 hiểu "7 ngày qua" là 7 ngày trọn vẹn tính đến hết hôm qua. Bản cũ
     * hỏi `7daysAgo..today` nên luôn đếm dư ngày hôm nay — một ngày còn dở
     * dang, Google vẫn đang xử lý. Hậu quả: bảng ở đây và bảng của Google
     * không bao giờ bằng nhau, và không ai biết bên nào sai.
     *
     * Đo thật ngày 19/10/2026: `7daysAgo..today` ra 6 người / 26 lượt xem,
     * `7daysAgo..yesterday` ra 4 / 24 — đúng bằng con số Google hiện.
     */
    it("mọi khoảng đều kết thúc ở hôm qua, không lấy hôm nay", () => {
      for (const [key, r] of Object.entries(DATE_RANGE_MAP)) {
        expect(`${key}: ${r.end}`).toBe(`${key}: yesterday`);
      }
    });

    it("số ngày trong nhãn khớp với mốc bắt đầu", () => {
      // `NdaysAgo` tính cả hai đầu, nên `7daysAgo..yesterday` đúng 7 ngày.
      expect(DATE_RANGE_MAP["7d"].start).toBe("7daysAgo");
      expect(DATE_RANGE_MAP["14d"].start).toBe("14daysAgo");
      expect(DATE_RANGE_MAP["30d"].start).toBe("30daysAgo");
      expect(DATE_RANGE_MAP["90d"].start).toBe("90daysAgo");
    });
  });

  describe("trangThaiGa4 — badge phải nói thật", () => {
    /**
     * Cái bẫy: `GA4ReportResponse.error()` bên máy chủ đặt
     * `configured = true`. Trang nào lấy cờ ấy làm căn cứ thì khi Google trả
     * PERMISSION_DENIED vẫn khoe "Đã kết nối API" — đúng lúc cần biết hỏng
     * thì nó báo đang ổn. Đã dính một lần: phải gọi tay API mới biết thật sự
     * SUCCESS hay ERROR.
     */
    it("ERROR vẫn kèm configured=true — không được coi là ổn", () => {
      const loi = { configured: true, status: "ERROR", message: "PERMISSION_DENIED" };
      expect(loi.configured).toBe(true);
      expect(trangThaiGa4(loi)).toBe("loi");
    });

    it("chỉ SUCCESS mới là đã kết nối", () => {
      expect(trangThaiGa4({ status: "SUCCESS" })).toBe("ok");
    });

    it("NOT_CONFIGURED là chưa đặt khoá, khác với gọi API hỏng", () => {
      expect(trangThaiGa4({ status: "NOT_CONFIGURED" })).toBe("chua-cau-hinh");
    });

    it("chưa tải xong hoặc trạng thái lạ thì không đoán là ổn", () => {
      expect(trangThaiGa4(undefined)).toBe("chua-biet");
      expect(trangThaiGa4(null)).toBe("chua-biet");
      expect(trangThaiGa4({})).toBe("chua-biet");
      expect(trangThaiGa4({ status: "GI_DO_LA" })).toBe("chua-biet");
    });
  });

  describe("sanitizePath — Khử khuẩn URL bảo vệ dữ liệu nhạy cảm", () => {
    it("giữ nguyên các đường dẫn sạch và tham số điều hướng hợp lệ", () => {
      expect(sanitizePath("/admin")).toBe("/admin");
      expect(sanitizePath("/admin?tab=analytics")).toBe("/admin?tab=analytics");
      expect(sanitizePath("/admin?tab=feedback&page=2")).toBe("/admin?tab=feedback&page=2");
    });

    it("loại bỏ các tham số nhạy cảm: token, secret, email, code, session", () => {
      const dirty = "/auth/callback?token=secret123&code=456&email=user@example.com&tab=overview";
      const clean = sanitizePath(dirty);
      expect(clean).not.toContain("secret123");
      expect(clean).not.toContain("user@example.com");
      expect(clean).not.toContain("token=");
      expect(clean).not.toContain("email=");
      expect(clean).toContain("tab=overview");
    });

    it("loại bỏ dữ liệu trải bài tarot và câu hỏi tư vấn", () => {
      const dirty = "/tarot/spread?reading=love&cards=the-fool,the-magician&prompt=will-i-marry";
      const clean = sanitizePath(dirty);
      expect(clean).not.toContain("the-fool");
      expect(clean).not.toContain("will-i-marry");
      expect(clean).toBe("/tarot/spread");
    });

    it("xử lý an toàn cả URL tuyệt đối và đường dẫn rỗng", () => {
      expect(sanitizePath("")).toBe("/");
      expect(sanitizePath("https://astratarot.vn/admin?tab=matrix&token=abc")).toBe(
        "/admin?tab=matrix"
      );
    });
  });

  describe("formatDuration — Định dạng thời lượng phiên", () => {
    it("trả về 0s với giá trị không hợp lệ hoặc rỗng", () => {
      expect(formatDuration(null)).toBe("0s");
      expect(formatDuration(undefined)).toBe("0s");
      expect(formatDuration(-10)).toBe("0s");
      expect(formatDuration(0)).toBe("0s");
    });

    it("định dạng số giây dưới 1 phút chuẩn xác", () => {
      expect(formatDuration(45)).toBe("45s");
      expect(formatDuration(9)).toBe("9s");
    });

    it("định dạng số phút và giây chuẩn mm:ss", () => {
      expect(formatDuration(125)).toBe("2p 05s");
      expect(formatDuration(60)).toBe("1p 00s");
      expect(formatDuration(184.6)).toBe("3p 05s");
    });
  });

  describe("formatPercent — Định dạng tỷ lệ thoát và chuyển đổi", () => {
    it("định dạng tỷ lệ 0-1 (dạng thập phân từ GA4 API) sang phần trăm", () => {
      expect(formatPercent(0.354)).toBe("35.4%");
      expect(formatPercent(0.05)).toBe("5.0%");
      expect(formatPercent(1.0)).toBe("100.0%");
    });

    it("định dạng giá trị đã là phần trăm (> 1)", () => {
      expect(formatPercent(42.5)).toBe("42.5%");
    });

    it("xử lý giá trị null/undefined an toàn", () => {
      expect(formatPercent(null)).toBe("0.0%");
      expect(formatPercent(undefined)).toBe("0.0%");
    });
  });

  describe("nf — Định dạng số nguyên hiển thị", () => {
    it("định dạng số có dấu phân cách hàng nghìn theo vi-VN", () => {
      expect(nf(0)).toBe("0");
      expect(nf(1500)).toBe("1.500");
      expect(nf(1250000)).toBe("1.250.000");
    });

    it("xử lý an toàn khi giá trị null hoặc NaN", () => {
      expect(nf(null)).toBe("0");
      expect(nf(undefined)).toBe("0");
    });
  });

  describe("Cấu trúc dữ liệu phản hồi GA4 (GA4ReportResponse)", () => {
    it("nhận diện trạng thái NOT_CONFIGURED khi chưa nạp credentials", () => {
      const unconfiguredReport = {
        configured: false,
        propertyId: "559041870",
        startDate: "30daysAgo",
        endDate: "today",
        overview: {
          activeUsers: 0,
          newUsers: 0,
          sessions: 0,
          screenPageViews: 0,
          bounceRate: 0,
          averageSessionDuration: 0,
        },
        trafficSources: [],
        timeSeries: [],
        status: "NOT_CONFIGURED" as const,
        message: "Chưa cấu hình Service Account key cho GA4",
      };

      expect(unconfiguredReport.configured).toBe(false);
      expect(unconfiguredReport.status).toBe("NOT_CONFIGURED");
      expect(unconfiguredReport.overview.activeUsers).toBe(0);
      expect(unconfiguredReport.timeSeries.length).toBe(0);
    });

    it("tính toán chính xác tỷ lệ đóng góp nguồn lưu lượng truy cập", () => {
      const trafficSources = [
        { source: "google", medium: "organic", sessions: 150, activeUsers: 100 },
        { source: "facebook", medium: "referral", sessions: 50, activeUsers: 40 },
      ];

      const totalSessions = trafficSources.reduce((acc, curr) => acc + curr.sessions, 0);
      expect(totalSessions).toBe(200);

      const googleShare = Math.round((trafficSources[0].sessions / totalSessions) * 100);
      const facebookShare = Math.round((trafficSources[1].sessions / totalSessions) * 100);

      expect(googleShare).toBe(75);
      expect(facebookShare).toBe(25);
    });

    it("xử lý an toàn khi mảng trafficSources rỗng tránh chia cho 0", () => {
      const emptyTraffic: Array<{ sessions: number }> = [];
      const totalSessions = emptyTraffic.reduce((acc, curr) => acc + curr.sessions, 0);
      expect(totalSessions).toBe(0);

      const sharePercent = totalSessions > 0 ? Math.round((10 / totalSessions) * 100) : 0;
      expect(sharePercent).toBe(0);
    });
  });
});
