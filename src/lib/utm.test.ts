import { beforeEach, describe, expect, it, vi } from "vitest";
import { captureUtmFromUrl, nguonGopY, readStoredUtm } from "./utm";

/**
 * Nhớ nguồn khách đến từ đâu.
 *
 * Tham số UTM chỉ có mặt ở lần đầu vào site; đến lúc người ta đăng ký hay gửi
 * góp ý thì URL đã đi qua năm sáu trang và sạch trơn. Nên phải giữ lại ngay từ
 * lượt đầu — quên một bước là toàn bộ số liệu tiếp thị về 0, và không ai thấy
 * gì hỏng cả, chỉ là bảng thống kê trống.
 *
 * Hai điều đáng chốt: **không ghi đè bằng rỗng** khi người ta vào lại bằng URL
 * không có UTM, và **localStorage hỏng không được làm sập trang** — chế độ ẩn
 * danh và cài đặt chặn cookie đều làm nó ném lỗi.
 */
describe("UTM", () => {
  function dat(query: string) {
    Object.defineProperty(window, "location", {
      value: new URL("https://astrotarot.date/" + query),
      writable: true,
    });
  }

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    dat("");
  });

  it("chưa vào lần nào thì mọi trường là null, không phải undefined", () => {
    // Giao diện gửi thẳng object này lên API. undefined biến mất khỏi JSON,
    // còn null thì tới nơi — và backend phân biệt "không khai" với "khai rỗng".
    expect(readStoredUtm()).toEqual({
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    });
  });

  it("giữ đủ ba tham số từ URL", () => {
    dat("?utm_source=facebook&utm_medium=cpc&utm_campaign=tet2026");

    captureUtmFromUrl();

    expect(readStoredUtm()).toEqual({
      utmSource: "facebook",
      utmMedium: "cpc",
      utmCampaign: "tet2026",
    });
  });

  it("chỉ có một tham số thì vẫn giữ, hai cái kia để null", () => {
    dat("?utm_source=zalo");

    captureUtmFromUrl();

    expect(readStoredUtm()).toEqual({
      utmSource: "zalo",
      utmMedium: null,
      utmCampaign: null,
    });
  });

  it("URL KHÔNG có UTM thì giữ nguyên giá trị cũ, không ghi đè bằng rỗng", () => {
    dat("?utm_source=facebook");
    captureUtmFromUrl();

    // Người ta vào lại bằng đường dẫn sạch, hoặc bấm một link nội bộ. Ghi đè ở
    // đây là xoá mất nguồn thật của họ ngay trước lúc họ đăng ký.
    dat("?trang=2");
    captureUtmFromUrl();

    expect(readStoredUtm().utmSource).toBe("facebook");
  });

  it("vào bằng chiến dịch MỚI thì thay nguồn cũ", () => {
    dat("?utm_source=facebook");
    captureUtmFromUrl();
    dat("?utm_source=tiktok&utm_campaign=live");
    captureUtmFromUrl();

    expect(readStoredUtm()).toEqual({
      utmSource: "tiktok",
      utmMedium: null,
      utmCampaign: "live",
    });
  });

  it("localStorage ném lỗi lúc GHI thì bỏ qua, không sập trang", () => {
    dat("?utm_source=facebook");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    // Chế độ ẩn danh và cài đặt chặn cookie đều làm setItem ném lỗi. Một con số
    // tiếp thị không đáng để đánh đổi cả trang chủ.
    expect(() => captureUtmFromUrl()).not.toThrow();
  });

  it("dữ liệu đã lưu bị hỏng thì trả về rỗng, không nổ", () => {
    localStorage.setItem("astrotarot_utm", "{đây không phải JSON");

    expect(readStoredUtm()).toEqual({
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    });
  });

  it("dữ liệu đã lưu thiếu trường thì bù null cho đủ", () => {
    localStorage.setItem(
      "astrotarot_utm",
      JSON.stringify({ utmSource: "facebook" }),
    );

    // Bản ghi từ phiên bản cũ chỉ có một trường. Trả thẳng nó lên API là gửi
    // một object thiếu khoá, và backend đọc undefined.
    expect(readStoredUtm()).toEqual({
      utmSource: "facebook",
      utmMedium: null,
      utmCampaign: null,
    });
  });
});

describe("nguồn góp ý suy từ trang", () => {
  /**
   * Nút Góp ý nổi ở mọi trang và không có ô chọn "bạn góp ý về phần nào" —
   * cố ý, vì thêm một bước là thêm một chỗ người ta bỏ dở. Trang đang mở đã
   * nói đủ.
   *
   * Trước đây ô góp ý gắn một lần ở gốc mà không truyền gì, nên MỌI góp ý
   * thật đều rơi vào GENERAL. Cột "Nguồn" trong trang quản trị trông có đủ
   * bốn loại chỉ vì dữ liệu mẫu được gieo đều cho đẹp.
   */
  it("trang chủ là LANDING", () => {
    expect(nguonGopY("/")).toBe("LANDING");
    expect(nguonGopY("/home")).toBe("LANDING");
  });

  it("các trang tarot là TAROT_AI", () => {
    expect(nguonGopY("/tarot")).toBe("TAROT_AI");
    expect(nguonGopY("/tarot-history")).toBe("TAROT_AI");
  });

  it("reader và lịch hẹn là BOOKING", () => {
    expect(nguonGopY("/readers")).toBe("BOOKING");
    expect(nguonGopY("/readers/abc-123")).toBe("BOOKING");
    expect(nguonGopY("/bookings")).toBe("BOOKING");
  });

  it("còn lại là GENERAL", () => {
    expect(nguonGopY("/shop")).toBe("GENERAL");
    expect(nguonGopY("/blogs")).toBe("GENERAL");
    expect(nguonGopY("/profile")).toBe("GENERAL");
  });

  it("không phân biệt hoa thường, thiếu đường dẫn thì về LANDING", () => {
    expect(nguonGopY("/Tarot")).toBe("TAROT_AI");
    expect(nguonGopY("")).toBe("LANDING");
  });
});
