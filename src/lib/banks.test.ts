import { describe, expect, it } from "vitest";
import { DANH_SACH_NGAN_HANG, timNganHang } from "./banks";

/**
 * Tra ngân hàng theo mã BIN.
 *
 * Mã BIN là thứ đi vào chuỗi VietQR mà người duyệt lệnh rút quét để chuyển
 * tiền. Sai một mã ở đây là tiền tới nhầm ngân hàng — hoặc mã QR không quét
 * được, và người duyệt phải gõ tay số tài khoản từ màn hình.
 *
 * Nên bộ kiểm này chốt hai thứ: tra được đúng, và **danh sách không có mã
 * trùng**. Mã trùng thì `find` trả về cái đầu tiên, và ngân hàng thứ hai biến
 * mất khỏi ô chọn mà không ai để ý.
 */
describe("timNganHang", () => {
  it("tra được ngân hàng theo mã BIN", () => {
    const vcb = timNganHang("970436");
    expect(vcb?.ten).toBe("Vietcombank");
  });

  it("mã không có thật thì trả undefined, không trả ngân hàng bừa", () => {
    // Trả về phần tử đầu danh sách khi không khớp là cách chắc chắn nhất để
    // chuyển tiền nhầm chỗ.
    expect(timNganHang("000000")).toBeUndefined();
  });

  it("mã rỗng, null hay undefined đều trả undefined", () => {
    expect(timNganHang(null)).toBeUndefined();
    expect(timNganHang(undefined)).toBeUndefined();
    expect(timNganHang("")).toBeUndefined();
  });

  it("KHÔNG có mã BIN nào bị trùng trong danh sách", () => {
    const bin = DANH_SACH_NGAN_HANG.map((n) => n.bin);
    const trung = bin.filter((b, i) => bin.indexOf(b) !== i);

    // Mã trùng thì find trả về cái đầu tiên, và ngân hàng thứ hai biến mất khỏi
    // ô chọn mà không ai để ý — cho tới khi một Reader không tìm thấy ngân hàng
    // của mình.
    expect(trung).toEqual([]);
  });

  it("mọi ngân hàng đều có đủ mã, tên ngắn và tên đầy đủ", () => {
    for (const n of DANH_SACH_NGAN_HANG) {
      expect(n.bin, `thiếu bin: ${n.ten}`).toMatch(/^\d{6}$/);
      expect(n.ten, `thiếu tên ngắn cho bin ${n.bin}`).toBeTruthy();
      expect(n.tenDayDu, `thiếu tên đầy đủ cho ${n.ten}`).toBeTruthy();
    }
  });

  it("danh sách không rỗng", () => {
    // Một ô chọn ngân hàng trống là Reader không tạo được lệnh rút nào.
    expect(DANH_SACH_NGAN_HANG.length).toBeGreaterThan(10);
  });
});
