import { beforeEach, describe, expect, it, vi } from "vitest";
import { maKhach } from "./ma-khach";

/**
 * Mã khách ẩn danh.
 *
 * Kiểu hỏng mà những bài kiểm này canh: mã đổi mỗi lần tải trang. Lúc ấy mọi
 * hành động của một người bị cắt thành từng mảnh rời, và màn "hành trình từng
 * khách" hiện ra hàng chục khách mỗi người đúng một bước — trông như web có
 * rất nhiều người vào mà chẳng ai làm gì.
 */
describe("mã khách", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("giữ nguyên qua nhiều lần gọi", () => {
    const lan1 = maKhach();
    expect(lan1).not.toBe("");
    expect(maKhach()).toBe(lan1);
    expect(maKhach()).toBe(lan1);
  });

  it("cất vào localStorage để sống qua lần tải trang sau", () => {
    const ma = maKhach();
    expect(localStorage.getItem("astrotarot_ma_khach")).toBe(ma);
  });

  it("hai trình duyệt khác nhau ra hai mã khác nhau", () => {
    const a = maKhach();
    localStorage.clear();
    expect(maKhach()).not.toBe(a);
  });

  it("localStorage hỏng thì trả chuỗi rỗng, KHÔNG ném", () => {
    // Cửa sổ ẩn danh, trình duyệt chặn site data, bộ nhớ đầy — đều ném.
    // Theo dõi là việc phụ; ném ở đây là làm hỏng đúng thao tác người dùng
    // vừa làm. Máy chủ nhận rỗng thì ghi NULL và chỉ mất hành trình của
    // riêng khách ấy.
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bị chặn");
    });

    expect(() => maKhach()).not.toThrow();
    expect(maKhach()).toBe("");
  });

  it("không ném khi không ghi được, dù đọc được", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("đầy bộ nhớ");
    });

    expect(() => maKhach()).not.toThrow();
  });

  it("vẫn sinh được mã khi thiếu crypto.randomUUID", () => {
    // randomUUID chỉ có trong ngữ cảnh an toàn (https hoặc localhost). Gọi
    // thẳng mà không kiểm thì trang chạy qua http trần ném TypeError ngay
    // lần tải đầu — mà chỗ ném lại nằm trong đường đi của MỌI sự kiện.
    vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => {
      throw new TypeError("không có trong ngữ cảnh này");
    });
    localStorage.clear();

    // Ngay cả khi randomUUID ném, hàm phải nuốt và trả rỗng chứ không vỡ.
    expect(() => maKhach()).not.toThrow();
  });
});
