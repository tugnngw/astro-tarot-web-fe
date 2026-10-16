/**
 * Tiện ích theo dõi lưu lượng Google Analytics 4 (GA4) cho SPA.
 * Bảo đảm an toàn thông tin: khử bỏ tham số nhạy cảm (token, email, mã bảo mật, trải bài, tin nhắn).
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID: string =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_GA_MEASUREMENT_ID) ||
  "G-6B0LQ5Q9D8";

/**
 * Danh sách tên tham số URL nhạy cảm cần loại bỏ trước khi gửi lên GA4.
 */
const SENSITIVE_QUERY_PARAMS = new Set([
  "token",
  "secret",
  "password",
  "code",
  "email",
  "key",
  "session",
  "prompt",
  "reading",
  "cards",
  "phone",
  "signature",
  "access_token",
  "refresh_token",
  "reset_token",
  "otp",
]);

/**
 * Khử khuẩn đường dẫn URL: giữ lại các tham số điều hướng hợp lệ (ví dụ ?tab=...),
 * loại bỏ toàn bộ dữ liệu người dùng, email, mã xác thực và nội dung trải bài.
 */
export function sanitizePath(rawUrlOrPath: string): string {
  if (!rawUrlOrPath) return "/";

  try {
    // Nếu là đường dẫn tương đối, thêm fake origin để dùng URL API
    const isAbsolute =
      rawUrlOrPath.startsWith("http://") || rawUrlOrPath.startsWith("https://");
    const parsed = isAbsolute
      ? new URL(rawUrlOrPath)
      : new URL(rawUrlOrPath, "https://astratarot.local");

    const sanitizedParams = new URLSearchParams();
    parsed.searchParams.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (!SENSITIVE_QUERY_PARAMS.has(lowerKey)) {
        sanitizedParams.append(key, val);
      }
    });

    const queryString = sanitizedParams.toString();
    return parsed.pathname + (queryString ? `?${queryString}` : "");
  } catch {
    // Dự phòng cắt query nếu URL không hợp lệ
    return rawUrlOrPath.split("?")[0] || "/";
  }
}

/**
 * Khởi tạo Google Analytics 4 script tag nếu chưa có trong DOM.
 * Chỉ chạy ở môi trường client (trình duyệt).
 */
export function initGA(measurementId: string = GA_MEASUREMENT_ID): void {
  if (typeof window === "undefined" || !measurementId) return;

  // Tránh nạp lại nhiều lần
  if (document.getElementById("ga4-script")) return;

  window.dataLayer = window.dataLayer || [];
  // Đẩy ĐÚNG đối tượng `arguments`, KHÔNG phải mảng.
  //
  // gtag.js duyệt dataLayer và chỉ coi những mục là `[object Arguments]` mới
  // là lệnh của gtag; mục nào là mảng thường thì nó bỏ qua lặng lẽ. Viết
  // `(...args) => push(args)` cho gọn là đẩy một MẢNG, nên `js`, `config` và
  // mọi `event` đều rơi vào hư không: script vẫn tải, `window.gtag` vẫn có,
  // dataLayer vẫn đầy lên — mà GA4 không nhận được một lượt nào.
  //
  // Đó đúng là cảnh đã xảy ra trên bản chạy thật: trang tải gtag.js xong,
  // không có cookie `_ga` nào được tạo và không có lượt gửi nào đi.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false, // Quản lý page_view thủ công cho SPA
  });

  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

/**
 * Lấy đường dẫn để ghi nhận, từ một `location` của TanStack Router.
 *
 * KHÔNG ghép `pathname + search`. `search` của TanStack là object tạo bằng
 * `Object.create(null)` — không có prototype, nên không có `toString`, và
 * ghép chuỗi với nó ném thẳng `TypeError: Cannot convert object to primitive
 * value`. Lỗi ấy ném ra bên trong listener của router, không hiện ở đâu cả,
 * và hậu quả là MỌI lần đổi trang trong app đều không ghi nhận được gì.
 *
 * `href` đã là pathname kèm query dạng chuỗi, đúng thứ cần.
 */
export function duongDanTuRouter(loc: {
  href?: string;
  pathname?: string;
}): string {
  return loc.href || loc.pathname || "/";
}

/**
 * Ghi nhận sự kiện chuyển trang trong SPA lên GA4 sau khi đã khử khuẩn đường dẫn.
 */
export function trackPageView(
  rawPath: string,
  title?: string,
  measurementId: string = GA_MEASUREMENT_ID,
): void {
  if (typeof window === "undefined" || !window.gtag) return;

  const cleanPath = sanitizePath(rawPath);
  window.gtag("event", "page_view", {
    page_path: cleanPath,
    page_title:
      title || (typeof document !== "undefined" ? document.title : ""),
    send_to: measurementId,
  });
}
