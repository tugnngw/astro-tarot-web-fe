import { beforeEach, describe, expect, it } from "vitest";
import {
  duongDanTuRouter,
  GA_MEASUREMENT_ID,
  initGA,
  sanitizePath,
  trackPageView,
} from "./analytics";

/**
 * Gửi dữ liệu lên GA4.
 *
 * Chỗ chết người ở đây không phải logic mà là KIỂU của mục đẩy vào dataLayer.
 * gtag.js duyệt dataLayer và chỉ xử lý những mục là `[object Arguments]`; mục
 * nào là mảng thường nó bỏ qua, không báo lỗi, không cảnh báo. Viết
 * `(...args) => dataLayer.push(args)` cho gọn là hỏng theo đúng kiểu không ai
 * nhìn thấy: script vẫn tải, `window.gtag` vẫn gọi được, dataLayer vẫn dài
 * thêm — mà GA4 nhận 0 lượt, bảng thống kê trống trơn.
 *
 * Bản chạy thật đã hỏng đúng như vậy, và chỉ lộ ra khi mở trang thật lên xem
 * có cookie `_ga` nào được tạo không. Nên bài test này soi thẳng vào kiểu.
 */
describe("GA4", () => {
  beforeEach(() => {
    window.dataLayer = [];
    delete window.gtag;
    document.getElementById("ga4-script")?.remove();
  });

  function kieuCuaMuc(i: number) {
    return Object.prototype.toString.call(window.dataLayer?.[i]);
  }

  it("đẩy đối tượng arguments, không đẩy mảng", () => {
    initGA();

    // `js` và `config`.
    expect(window.dataLayer).toHaveLength(2);
    expect(kieuCuaMuc(0)).toBe("[object Arguments]");
    expect(kieuCuaMuc(1)).toBe("[object Arguments]");
    expect(Array.isArray(window.dataLayer?.[0])).toBe(false);
  });

  it("lệnh giữ nguyên thứ tự tham số gtag cần", () => {
    initGA();

    const js = window.dataLayer?.[0] as unknown as IArguments;
    expect(js[0]).toBe("js");
    expect(js[1]).toBeInstanceOf(Date);

    const config = window.dataLayer?.[1] as unknown as IArguments;
    expect(config[0]).toBe("config");
    expect(config[1]).toBe(GA_MEASUREMENT_ID);
    // SPA tự gửi page_view ở mỗi lần đổi route, nên tắt lượt tự động để
    // không đếm đúp lần tải đầu.
    expect(config[2]).toMatchObject({ send_page_view: false });
  });

  it("nạp đúng một thẻ script dù gọi nhiều lần", () => {
    initGA();
    initGA();

    const script = document.querySelectorAll("script#ga4-script");
    expect(script).toHaveLength(1);
    expect(script[0].getAttribute("src")).toContain(
      `gtag/js?id=${GA_MEASUREMENT_ID}`,
    );
  });

  it("page_view cũng là arguments, kèm đường dẫn đã khử tham số nhạy cảm", () => {
    initGA();
    trackPageView("/verify-email?token=bimat&tab=lich", "Xác minh");

    const su = window.dataLayer?.[2] as unknown as IArguments;
    expect(Object.prototype.toString.call(su)).toBe("[object Arguments]");
    expect(su[0]).toBe("event");
    expect(su[1]).toBe("page_view");
    expect(su[2]).toMatchObject({
      page_path: "/verify-email?tab=lich",
      page_title: "Xác minh",
    });
  });

  it("không có gtag thì trackPageView im lặng, không ném lỗi", () => {
    // Màn chạy trước khi initGA kịp chạy — không được làm sập trang.
    expect(() => trackPageView("/")).not.toThrow();
    expect(window.dataLayer).toHaveLength(0);
  });

  describe("đường dẫn lấy từ router", () => {
    /** Giống hệt `location` thật của TanStack: `search` không có prototype. */
    function locationTanStack(href: string, pathname: string) {
      const search = Object.create(null) as Record<string, string>;
      search.tab = "lich";
      return { href, pathname, search };
    }

    it("ghép pathname với search là ném lỗi — cái bẫy có thật", () => {
      const loc = locationTanStack("/admin?tab=lich", "/admin");
      expect(() => `${loc.pathname}${loc.search}`).toThrow(TypeError);
    });

    it("dùng href nên không ném, và giữ nguyên query", () => {
      const loc = locationTanStack("/admin?tab=lich", "/admin");
      expect(() => duongDanTuRouter(loc)).not.toThrow();
      expect(duongDanTuRouter(loc)).toBe("/admin?tab=lich");
    });

    it("thiếu href thì rơi về pathname, thiếu cả hai thì về gốc", () => {
      expect(duongDanTuRouter({ pathname: "/shop" })).toBe("/shop");
      expect(duongDanTuRouter({})).toBe("/");
    });
  });

  describe("khử tham số nhạy cảm", () => {
    it("giữ UTM vì đó là thứ để biết khách đến từ TikTok hay Facebook", () => {
      expect(sanitizePath("/?utm_source=tiktok&utm_medium=social")).toBe(
        "/?utm_source=tiktok&utm_medium=social",
      );
    });

    it("bỏ token, email, mã đặt lại mật khẩu", () => {
      expect(
        sanitizePath("/reset-password?reset_token=abc&email=a@b.c&tab=x"),
      ).toBe("/reset-password?tab=x");
    });

    it("đường dẫn hỏng thì cắt query chứ không ném lỗi", () => {
      expect(sanitizePath("")).toBe("/");
    });
  });
});
