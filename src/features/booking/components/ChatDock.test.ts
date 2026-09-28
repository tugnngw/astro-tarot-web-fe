import { describe, expect, it } from "vitest";
import type { Notification } from "@/api/notifications";
import { buoiKhachVuaTraTien, gopTheoNguoi, lucTuongDoi } from "./ChatDock";
import type { Booking } from "@/api/booking";

/**
 * Trả tiền xong thì khung trao đổi với Reader tự mở ra.
 *
 * Đó là lúc người ta muốn nói chuyện ngay: xác nhận lại giờ, hỏi cần chuẩn bị
 * gì, gửi trước câu hỏi muốn xem. Bắt họ tự mò vào Lịch hẹn rồi tìm đúng buổi
 * rồi bấm mở trao đổi là ba bước cho một việc họ vừa trả tiền để được làm.
 */
function tin(p: Partial<Notification>): Notification {
  return {
    id: "n1",
    title: "T",
    message: null,
    type: null,
    read: false,
    pinned: false,
    metadata: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...p,
  };
}

const meta = (o: Record<string, unknown>) => JSON.stringify(o);

describe("buoiKhachVuaTraTien", () => {
  it("khách trả tiền xong thì trả về mã buổi để mở", () => {
    expect(
      buoiKhachVuaTraTien(
        tin({
          type: "PAYMENT_CONFIRMED",
          metadata: meta({ bookingId: "b1", side: "customer" }),
        }),
      ),
    ).toBe("b1");
  });

  it("đặt cọc cũng tính — không đợi trả đủ", () => {
    // Đặt cọc 50% rồi thì còn cả quãng tới sát giờ hẹn mới trả nốt. Chính
    // quãng ấy là lúc cần hỏi Reader nhất, vì chưa gặp nên còn nhiều thứ chưa
    // rõ. Backend cũng vừa mở `chatOpen` ở mốc này.
    expect(
      buoiKhachVuaTraTien(
        tin({
          type: "PAYMENT_CONFIRMED",
          metadata: meta({ bookingId: "b-coc", side: "customer" }),
        }),
      ),
    ).toBe("b-coc");
  });

  it("KHÔNG tự mở cho phía Reader", () => {
    // Reader nhận một tin PAYMENT_CONFIRMED cho cùng buổi ấy. Bật khung chat
    // lên giữa lúc họ đang làm việc khác là chen ngang — họ đã có chấm đếm
    // tin chưa đọc rồi.
    expect(
      buoiKhachVuaTraTien(
        tin({
          type: "PAYMENT_CONFIRMED",
          metadata: meta({ bookingId: "b1", side: "reader" }),
        }),
      ),
    ).toBeNull();
  });

  it("loại thông báo khác thì không mở gì cả", () => {
    for (const t of [
      "BOOKING_CREATED",
      "BOOKING_CONFIRMED",
      "PAYMENT_REFUNDED",
      "PAYMENT_FORFEITED",
      "SUPPORT_REPLY",
    ]) {
      expect(
        buoiKhachVuaTraTien(
          tin({
            type: t,
            metadata: meta({ bookingId: "b1", side: "customer" }),
          }),
        ),
      ).toBeNull();
    }
  });

  it("thiếu phía, thiếu mã buổi, hay metadata hỏng đều không mở", () => {
    // Tin cũ tạo trước khi backend ghi khoá "side" vẫn nằm trong hộp. Đoán
    // bừa rồi bật một khung chat không ai xin là tệ hơn không làm gì.
    const chung = { type: "PAYMENT_CONFIRMED" };
    expect(buoiKhachVuaTraTien(tin(chung))).toBeNull();
    expect(
      buoiKhachVuaTraTien(
        tin({ ...chung, metadata: meta({ bookingId: "b1" }) }),
      ),
    ).toBeNull();
    expect(
      buoiKhachVuaTraTien(
        tin({ ...chung, metadata: meta({ side: "customer" }) }),
      ),
    ).toBeNull();
    expect(buoiKhachVuaTraTien(tin({ ...chung, metadata: "{" }))).toBeNull();
  });

  it("không có tin thì không nổ", () => {
    // Sự kiện realtime có thể tới mà không kèm thông báo nào.
    expect(buoiKhachVuaTraTien(null)).toBeNull();
    expect(buoiKhachVuaTraTien(tin({ type: null }))).toBeNull();
  });
});

describe("lucTuongDoi", () => {
  const bayGio = Date.parse("2026-09-26T12:00:00Z");

  it("đọc theo phút, giờ, ngày, tuần", () => {
    expect(lucTuongDoi("2026-09-26T11:59:30Z", bayGio)).toBe("Vừa xong");
    expect(lucTuongDoi("2026-09-26T11:55:00Z", bayGio)).toBe("5 phút");
    expect(lucTuongDoi("2026-09-26T10:00:00Z", bayGio)).toBe("2 giờ");
    expect(lucTuongDoi("2026-09-23T12:00:00Z", bayGio)).toBe("3 ngày");
    expect(lucTuongDoi("2026-08-29T12:00:00Z", bayGio)).toBe("4 tuần");
    expect(lucTuongDoi("2026-07-18T12:00:00Z", bayGio)).toBe("10 tuần");
  });
});

describe("gopTheoNguoi", () => {
  function buoi(id: string, reader: string, ten: string): Booking {
    return { id, readerUserId: reader, readerName: ten } as Booking;
  }

  it("hai buổi cùng một Reader thành một dòng", () => {
    const ra = gopTheoNguoi([
      { b: buoi("a", "r1", "Đạt Trần"), laKhach: true },
      { b: buoi("b", "r1", "Đạt Trần"), laKhach: true },
      { b: buoi("c", "r2", "Lan"), laKhach: true },
    ]);
    expect(ra.map((n) => n.ten)).toEqual(["Đạt Trần", "Lan"]);
    expect(ra[0].buoi.map((c) => c.b.id)).toEqual(["a", "b"]);
  });
});
