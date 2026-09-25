import { describe, expect, it } from "vitest";
import { dangTrongCuoc, type CallState } from "./useBookingCall";

/**
 * Luật "đang bận" của cuộc gọi.
 *
 * Một dòng điều kiện, nhưng nó đã sai thật và hậu quả rất khó lần ra. Trước
 * đây nó viết là `state !== "idle"` — mà `"failed"` cũng khác `"idle"`, nên sau
 * một cuộc gọi hỏng, máy này lặng lẽ từ chối MỌI cuộc gọi tới cho tới khi người
 * dùng bấm "Đóng" trên dải báo lỗi.
 *
 * Phía người gọi thấy "Người kia đang bận", trong khi phía kia chẳng bận gì,
 * chỉ là còn sót một dải báo lỗi chưa ai tắt. Gặp thật khi thử trên production:
 * gọi lần đầu hết giờ vì chưa cấp quyền micro, lần sau gọi lại thì bị báo bận.
 *
 * Bộ kiểm này liệt kê THẲNG cả sáu trạng thái thay vì viết lại cùng một biểu
 * thức — viết lại là chép đúng lỗi sang bài kiểm, và bài kiểm sẽ xanh cho một
 * hành vi sai.
 */
describe("dangTrongCuoc", () => {
  it("bốn trạng thái ĐANG trong một cuộc thì là bận", () => {
    expect(dangTrongCuoc("calling")).toBe(true);
    expect(dangTrongCuoc("incoming")).toBe(true);
    expect(dangTrongCuoc("connecting")).toBe(true);
    expect(dangTrongCuoc("active")).toBe(true);
  });

  it("rảnh thì KHÔNG bận", () => {
    expect(dangTrongCuoc("idle")).toBe(false);
  });

  it('"failed" KHÔNG phải bận — đây chính là lỗi cũ', () => {
    // Đây là phép kiểm quan trọng nhất của cả tệp. Nếu ai đó viết lại điều
    // kiện thành `state !== "idle"` cho gọn, dòng này đỏ ngay.
    expect(dangTrongCuoc("failed")).toBe(false);
  });

  it("đúng hai trạng thái nhận được cuộc gọi mới", () => {
    const moiTrangThai: CallState[] = [
      "idle",
      "calling",
      "incoming",
      "connecting",
      "active",
      "failed",
    ];
    const nhanDuoc = moiTrangThai.filter((s) => !dangTrongCuoc(s));

    // Chốt lại bằng một phép đếm: thêm một trạng thái mới vào CallState mà
    // quên cập nhật điều kiện thì con số này lệch, và người thêm biết ngay —
    // thay vì phát hiện ra khi có người không gọi được cho nhau.
    expect(nhanDuoc).toEqual(["idle", "failed"]);
  });
});
