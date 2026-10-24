import { so } from "@/lib/tien";
import { describe, expect, it } from "vitest";
import {
  FEEDBACK_PAGE_SIZE,
  formatDate,
  SOURCE_COLORS,
  SOURCE_VI,
} from "../feedback-utils";

describe("AdminFeedbackManager helpers", () => {
  it("kích thước trang cố định 10 dòng/trang", () => {
    expect(FEEDBACK_PAGE_SIZE).toBe(10);
  });

  it("ánh xạ nguồn góp ý sang tiếng Việt chuẩn xác", () => {
    expect(SOURCE_VI["TAROT_AI"]).toBe("Trải bài AI");
    expect(SOURCE_VI["BOOKING"]).toBe("Đặt lịch Reader");
    expect(SOURCE_VI["GENERAL"]).toBe("Góp ý chung");
    expect(SOURCE_VI["LANDING"]).toBe("Trang chủ");
  });

  it("mỗi nguồn có lớp màu phân biệt riêng", () => {
    expect(SOURCE_COLORS["TAROT_AI"]).toContain("purple");
    expect(SOURCE_COLORS["BOOKING"]).toContain("blue");
    expect(SOURCE_COLORS["GENERAL"]).toContain("gold");
    expect(SOURCE_COLORS["LANDING"]).toContain("emerald");
  });

  it("định dạng số theo chuẩn vi-VN", () => {
    expect(so(0)).toBe("0");
    expect(so(1500)).toBe("1.500");
    expect(so(1000000)).toBe("1.000.000");
  });

  it("định dạng ngày tháng hợp lệ hoặc trả chuỗi gốc nếu lỗi", () => {
    const formatted = formatDate("2026-10-14T10:30:00Z");
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe("string");

    // Chuỗi lỗi thì không nổ
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});
