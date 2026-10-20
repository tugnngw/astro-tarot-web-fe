import { describe, expect, it } from "vitest";
import { coDuLaSo } from "./la-so";

describe("lá số là tuỳ chọn, không phải cổng", () => {
  it("để trống ngày sinh thì KHÔNG dựng lá số — và đó không phải lỗi", () => {
    // Đây là cả điểm của thay đổi: trước kia ô trống chặn người dùng ở lại
    // màn nhập thông tin, không nhắn được câu nào cho AI.
    expect(coDuLaSo("")).toBe(false);
    expect(coDuLaSo(null)).toBe(false);
    expect(coDuLaSo(undefined)).toBe(false);
  });

  it("gõ dở dang cũng chỉ là chưa đủ, không dựng lá số", () => {
    // `convertToISODate` trả chuỗi không đúng dạng khi mới gõ được một nửa.
    expect(coDuLaSo("2000-10")).toBe(false);
    expect(coDuLaSo("4-10-2000")).toBe(false);
    expect(coDuLaSo("20001004")).toBe(false);
  });

  it("đúng dạng YYYY-MM-DD thì mới gọi API lưu lá số", () => {
    expect(coDuLaSo("2000-10-04")).toBe(true);
    expect(coDuLaSo("1975-01-31")).toBe(true);
  });

  it("không nhận chuỗi có phần dư — dạng phải khớp trọn vẹn", () => {
    // Ràng buộc khớp trọn chuỗi: dính thêm giờ vào là máy chủ từ chối cả
    // request, mà lỗi ấy lại hiện ra giữa lúc người dùng chỉ muốn chat.
    expect(coDuLaSo("2000-10-04T00:00:00")).toBe(false);
    expect(coDuLaSo(" 2000-10-04")).toBe(false);
  });
});
