import { describe, expect, it } from "vitest";
import { notificationLink, type Notification } from "./notifications";

/**
 * Bấm vào một thông báo phải mở ĐÚNG danh sách.
 *
 * Một buổi xem có hai người và hai danh sách khác nhau: "Lịch hẹn của tôi"
 * (/bookings) của khách, và tab Lịch hẹn trong Bàn làm việc (/staff) của
 * Reader. Đưa nhầm sang cái kia không hiện ra như một lỗi — nó hiện ra như một
 * danh sách TRỐNG, và người dùng kết luận lịch hẹn không tới nơi.
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

/** Metadata thật của BE: JSON thô trong một cột chuỗi. */
function meta(o: Record<string, unknown>) {
  return JSON.stringify(o);
}

describe("notificationLink", () => {
  it("phía reader mở tab Lịch hẹn của Bàn làm việc, không phải /bookings", () => {
    // Đây chính là lỗi người dùng báo: Reader nhận "Có lịch hẹn mới", bấm vào,
    // và bị đưa sang danh sách phía khách — nơi trống rỗng một cách hoàn toàn
    // đúng đắn, vì chính họ không đặt gì cả.
    expect(
      notificationLink(
        tin({
          type: "BOOKING_CREATED",
          metadata: meta({ bookingId: "b1", side: "reader" }),
        }),
      ),
    ).toEqual({ to: "/staff", search: { tab: "bookings" } });
  });

  it("phía khách mở /bookings", () => {
    expect(
      notificationLink(
        tin({
          type: "BOOKING_CONFIRMED",
          metadata: meta({ bookingId: "b1", side: "customer" }),
        }),
      ),
    ).toEqual({ to: "/bookings" });
  });

  it("CÙNG một loại đi hai nơi khác nhau tuỳ phía", () => {
    // BOOKING_CANCELLED gửi cho BÊN KIA: khách huỷ thì Reader nhận, Reader huỷ
    // thì khách nhận. Suy từ loại là không thể — nên phía phải do người gửi
    // ghi ra, và phép kiểm này chốt rằng nó thật sự được đọc.
    const chung = { type: "BOOKING_CANCELLED" };
    expect(
      notificationLink(tin({ ...chung, metadata: meta({ side: "reader" }) })),
    ).toEqual({ to: "/staff", search: { tab: "bookings" } });
    expect(
      notificationLink(tin({ ...chung, metadata: meta({ side: "customer" }) })),
    ).toEqual({ to: "/bookings" });
  });

  it("thanh toán báo cho CẢ HAI bên, mỗi bên về danh sách của mình", () => {
    expect(
      notificationLink(
        tin({ type: "PAYMENT_CONFIRMED", metadata: meta({ side: "reader" }) }),
      ),
    ).toEqual({ to: "/staff", search: { tab: "bookings" } });
    expect(
      notificationLink(
        tin({
          type: "PAYMENT_CONFIRMED",
          metadata: meta({ side: "customer" }),
        }),
      ),
    ).toEqual({ to: "/bookings" });
  });

  describe("tin cũ, chưa có khoá side", () => {
    it("BOOKING_CREATED vẫn về phía Reader vì CHỈ Reader nhận loại này", () => {
      // Những thông báo đã nằm sẵn trong hộp của người dùng trước khi BE ghi
      // "side" không tự sửa được. Chỗ nào suy chắc chắn thì vẫn phải đi đúng.
      expect(notificationLink(tin({ type: "BOOKING_CREATED" }))).toEqual({
        to: "/staff",
        search: { tab: "bookings" },
      });
    });

    it("REVIEW_RECEIVED cũng vậy — khách không tự đánh giá mình", () => {
      expect(notificationLink(tin({ type: "REVIEW_RECEIVED" }))).toEqual({
        to: "/staff",
        search: { tab: "bookings" },
      });
    });

    it("lệnh rút tiền về tab Thu nhập, không phải /bookings", () => {
      // Trước đây mọi PAYOUT_* đổ về /bookings. Lệnh rút là tiền của Reader,
      // nó không có mặt ở trang lịch hẹn phía khách dưới bất kỳ hình thức nào.
      for (const t of ["PAYOUT_APPROVED", "PAYOUT_REJECTED", "PAYOUT_PAID"]) {
        expect(notificationLink(tin({ type: t }))).toEqual({
          to: "/staff",
          search: { tab: "earnings" },
        });
      }
    });

    it("tin nhắn hỗ trợ mở đúng tab Hỗ trợ khách", () => {
      expect(notificationLink(tin({ type: "SUPPORT_MESSAGE" }))).toEqual({
        to: "/staff",
        search: { tab: "support" },
      });
    });
  });

  describe("metadata không dùng được", () => {
    it("JSON hỏng thì rơi về suy theo loại, không ném lỗi", () => {
      // Một chuỗi hỏng trong một dòng không được phép làm sập cả hộp thông báo.
      expect(
        notificationLink(tin({ type: "BOOKING_CREATED", metadata: "{" })),
      ).toEqual({ to: "/staff", search: { tab: "bookings" } });
    });

    it("side lạ thì bỏ qua, không dựng đường dẫn từ nó", () => {
      expect(
        notificationLink(
          tin({ type: "BOOKING_CONFIRMED", metadata: meta({ side: "admin" }) }),
        ),
      ).toEqual({ to: "/bookings" });
    });

    it("metadata là JSON hợp lệ nhưng không phải object", () => {
      expect(
        notificationLink(tin({ type: "BOOKING_CONFIRMED", metadata: '"x"' })),
      ).toEqual({ to: "/bookings" });
    });
  });

  it("không có loại thì không đi đâu cả", () => {
    // Thà chỉ đánh dấu đã đọc còn hơn đẩy người dùng tới một trang chẳng liên
    // quan rồi để họ tự tìm đường về.
    expect(notificationLink(tin({ type: null }))).toBeNull();
    expect(notificationLink(tin({ type: "REPORT_RESOLVED" }))).toBeNull();
  });
});
