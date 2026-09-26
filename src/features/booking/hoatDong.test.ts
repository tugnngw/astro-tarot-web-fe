import { describe, expect, it } from "vitest";
import { moTaHoatDong } from "./hoatDong";

/**
 * Câu "đang hoạt động / hoạt động bao lâu trước" trong khung trao đổi.
 *
 * <p>Mỗi nhánh ở đây là một câu người dùng đọc rồi quyết định: ngồi chờ trả
 * lời, hay đóng máy đi làm việc khác. Sai một nhánh là nói sai với họ về
 * chính quyết định đó.
 */
const BAY_GIO = Date.parse("2026-09-26T12:00:00Z");
const truoc = (giay: number) => new Date(BAY_GIO - giay * 1000).toISOString();

describe("moTaHoatDong", () => {
  it("đang online thì nói đang hoạt động, không nói mốc thời gian", () => {
    // Người online vẫn có lastSeenAt (ghi lúc họ nối vào). Hiện mốc ấy thành
    // ra "Hoạt động 2 giờ trước" cho một người đang gõ dở câu trả lời.
    expect(
      moTaHoatDong({ online: true, lastSeenAt: truoc(7200) }, BAY_GIO),
    ).toBe("Đang hoạt động");
  });

  it("dưới một phút thì nói vừa xong, không nói 0 phút", () => {
    expect(moTaHoatDong({ online: false, lastSeenAt: truoc(5) }, BAY_GIO)).toBe(
      "Vừa hoạt động",
    );
    expect(
      moTaHoatDong({ online: false, lastSeenAt: truoc(59) }, BAY_GIO),
    ).toBe("Vừa hoạt động");
  });

  it("phút, giờ, ngày — đổi đơn vị đúng mốc", () => {
    expect(
      moTaHoatDong({ online: false, lastSeenAt: truoc(60) }, BAY_GIO),
    ).toBe("Hoạt động 1 phút trước");
    expect(
      moTaHoatDong({ online: false, lastSeenAt: truoc(59 * 60) }, BAY_GIO),
    ).toBe("Hoạt động 59 phút trước");
    expect(
      moTaHoatDong({ online: false, lastSeenAt: truoc(60 * 60) }, BAY_GIO),
    ).toBe("Hoạt động 1 giờ trước");
    expect(
      moTaHoatDong({ online: false, lastSeenAt: truoc(23 * 3600) }, BAY_GIO),
    ).toBe("Hoạt động 23 giờ trước");
    expect(
      moTaHoatDong({ online: false, lastSeenAt: truoc(24 * 3600) }, BAY_GIO),
    ).toBe("Hoạt động 1 ngày trước");
  });

  it("quá một tuần thì thôi đếm ngày", () => {
    // "Hoạt động 43 ngày trước" và "hơn một tuần trước" dẫn tới cùng một
    // quyết định: đừng ngồi chờ trả lời.
    expect(
      moTaHoatDong(
        { online: false, lastSeenAt: truoc(7 * 24 * 3600) },
        BAY_GIO,
      ),
    ).toBe("Hoạt động hơn một tuần trước");
    expect(
      moTaHoatDong(
        { online: false, lastSeenAt: truoc(400 * 24 * 3600) },
        BAY_GIO,
      ),
    ).toBe("Hoạt động hơn một tuần trước");
  });

  it("mốc ở TƯƠNG LAI thì coi như vừa xong", () => {
    // Đồng hồ máy khách lệch vài giây là chuyện thường. "Hoạt động -3 phút
    // trước" thì lộ hẳn ra là phần mềm hỏng.
    expect(
      moTaHoatDong({ online: false, lastSeenAt: truoc(-300) }, BAY_GIO),
    ).toBe("Vừa hoạt động");
  });

  it("không biết gì thì trả null để giao diện BỎ HẲN dòng đó", () => {
    // Một dòng trống có nghĩa hơn một dòng ghi "Không rõ".
    expect(moTaHoatDong(null, BAY_GIO)).toBeNull();
    expect(
      moTaHoatDong({ online: false, lastSeenAt: null }, BAY_GIO),
    ).toBeNull();
    expect(
      moTaHoatDong({ online: false, lastSeenAt: "khong-phai-ngay" }, BAY_GIO),
    ).toBeNull();
  });

  it("chưa từng kết nối mà đang online thì vẫn nói đang hoạt động", () => {
    // Phiên đầu tiên: cờ online đã bật nhưng mốc có thể chưa kịp ghi.
    expect(moTaHoatDong({ online: true, lastSeenAt: null }, BAY_GIO)).toBe(
      "Đang hoạt động",
    );
  });
});
