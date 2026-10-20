import { describe, expect, it } from "vitest";
import {
  MAU_DIP_LE,
  choONhapNgay,
  khoangNgayGoiY,
  type MauDipLe,
} from "./ngay-le-vn";

function mau(ten: string): MauDipLe {
  const m = MAU_DIP_LE.find((x) => x.ten.startsWith(ten));
  if (!m) throw new Error(`không có mẫu ${ten}`);
  return m;
}

describe("mẫu dịp lễ Việt Nam", () => {
  it("dịp dương lịch cho khoảng ngày đúng", () => {
    const k = khoangNgayGoiY(mau("Quốc khánh"), 2026);
    expect(k).not.toBeNull();
    expect(choONhapNgay(k!.batDau)).toBe("2026-09-02T00:00");
  });

  it("mốc kết thúc là 00:00 ngày KẾ TIẾP ngày cuối", () => {
    // Máy chủ không tính mốc kết thúc vào khoảng chạy. Đặt đúng ngày cuối
    // thì đợt tắt ngay đầu ngày ấy — sớm trọn một ngày so với ý người nhập.
    const k = khoangNgayGoiY(mau("Quốc khánh"), 2026); // 02/09, 3 ngày
    expect(choONhapNgay(k!.ketThuc)).toBe("2026-09-05T00:00");
  });

  it("dịp theo âm lịch KHÔNG đoán ngày", () => {
    // Tết Nguyên đán, Trung thu, Giỗ tổ đổi ngày mỗi năm và không suy ra
    // được từ lịch dương. Điền bừa thì đợt chạy lệch cả tuần — thà để trống
    // cho quản trị tra lịch rồi chọn.
    expect(khoangNgayGoiY(mau("Tết Nguyên đán"), 2026)).toBeNull();
    expect(khoangNgayGoiY(mau("Tết Trung thu"), 2026)).toBeNull();
    expect(khoangNgayGoiY(mau("Giỗ tổ"), 2026)).toBeNull();
  });

  it("dịp âm lịch vẫn có tên và lời chúc để điền sẵn", () => {
    // Bỏ hẳn khỏi danh sách thì mất đúng những dịp bán tốt nhất trong năm.
    const tet = mau("Tết Nguyên đán");
    expect(tet.loiChuc.length).toBeGreaterThan(10);
    expect(tet.soNgay).toBeGreaterThan(0);
  });

  it("mọi mẫu đều có lời chúc và số ngày hợp lệ", () => {
    for (const m of MAU_DIP_LE) {
      expect(m.ten.trim()).not.toBe("");
      expect(m.loiChuc.trim()).not.toBe("");
      expect(m.soNgay).toBeGreaterThan(0);
      if (!m.theoAmLich) {
        expect(m.thang).toBeGreaterThanOrEqual(1);
        expect(m.thang).toBeLessThanOrEqual(12);
      }
    }
  });

  it("đợt vắt qua cuối tháng vẫn ra ngày đúng", () => {
    // 30/04 + 3 ngày rơi sang tháng 5. Cộng ngày thẳng vào Date là cách duy
    // nhất không phải tự đếm số ngày của từng tháng.
    const k = khoangNgayGoiY(mau("Giải phóng miền Nam"), 2026);
    expect(choONhapNgay(k!.batDau)).toBe("2026-04-30T00:00");
    expect(choONhapNgay(k!.ketThuc)).toBe("2026-05-03T00:00");
  });

  it("đợt vắt qua giao thừa dương lịch vẫn ra ngày đúng", () => {
    const k = khoangNgayGoiY(mau("Giáng sinh"), 2026); // 24/12, 3 ngày
    expect(choONhapNgay(k!.ketThuc)).toBe("2026-12-27T00:00");
  });

  it("định dạng cho ô nhập luôn đủ hai chữ số", () => {
    expect(choONhapNgay(new Date(2026, 0, 5, 9, 7))).toBe("2026-01-05T09:07");
  });
});
