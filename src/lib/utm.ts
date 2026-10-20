const UTM_KEY = "astrotarot_utm";

/**
 * Tên miền nguồn → tên kênh ngắn gọn, cùng cách GA4 gom.
 *
 * Khớp theo HẬU TỐ tên miền, không khớp chính xác: Facebook trả người dùng
 * đến từ `m.facebook.com`, `l.facebook.com`, `lm.facebook.com`, và trình
 * duyệt trong app thì gửi `facebook.com`. Liệt kê từng cái một là sót, và
 * mỗi cái sót lại rơi vào "(không rõ nguồn)".
 */
const NGUON_THEO_TEN_MIEN: Array<[string, string]> = [
  ["facebook.com", "facebook"],
  ["fb.com", "facebook"],
  ["fb.me", "facebook"],
  ["messenger.com", "messenger"],
  ["instagram.com", "instagram"],
  ["tiktok.com", "tiktok"],
  ["zalo.me", "zalo"],
  ["chat.zalo.me", "zalo"],
  ["youtube.com", "youtube"],
  ["youtu.be", "youtube"],
  ["threads.net", "threads"],
  ["t.me", "telegram"],
  ["twitter.com", "twitter"],
  ["x.com", "twitter"],
  ["reddit.com", "reddit"],
  ["linkedin.com", "linkedin"],
  ["pinterest.com", "pinterest"],
  ["shopee.vn", "shopee"],
  ["google.com", "google"],
  ["google.com.vn", "google"],
  ["bing.com", "bing"],
  ["duckduckgo.com", "duckduckgo"],
  ["coccoc.com", "coccoc"],
];

/** Những nguồn tính là tìm kiếm — GA4 gọi kênh này là `organic`. */
const LA_TIM_KIEM = new Set(["google", "bing", "duckduckgo", "coccoc"]);

/**
 * Suy nguồn từ referrer khi link không gắn UTM.
 *
 * <p>Vì sao cần: bảng "khách đến từ đâu" từng gom gần hết lưu lượng vào
 * "(không rõ nguồn)" trong khi GA4 cùng lúc ghi rõ `facebook.com / referral`.
 * Lý do là mình chỉ đọc `utm_source`, mà `utm_source` chỉ có khi khách bấm
 * đúng một link mình đã gắn tay. Người khác chia sẻ lại bài, hay khách tự
 * bấm từ trang Facebook, thì không có tham số nào cả — nhưng trình duyệt
 * vẫn gửi referrer, và GA4 đọc đúng chỗ ấy.
 *
 * <p>Trả `null` khi referrer rỗng, hoặc khi nó chính là trang của mình (điều
 * hướng nội bộ). Gán "nguồn" cho một cú bấm từ trang này sang trang kia là
 * tự thổi phồng số liệu bằng chính khách của mình.
 */
export function nguonTuReferrer(
  referrer: string | null | undefined,
  hostHienTai?: string | null,
): { utmSource: string; utmMedium: string } | null {
  if (!referrer) return null;

  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host) return null;

  const minh = (hostHienTai ?? "").toLowerCase().replace(/^www\./, "");
  const goc = host.replace(/^www\./, "");
  if (minh && (goc === minh || goc.endsWith("." + minh))) return null;

  for (const [tenMien, nguon] of NGUON_THEO_TEN_MIEN) {
    if (goc === tenMien || goc.endsWith("." + tenMien)) {
      return {
        utmSource: nguon,
        utmMedium: LA_TIM_KIEM.has(nguon) ? "organic" : "referral",
      };
    }
  }

  // Trang lạ vẫn đáng ghi: biết "có người dẫn về từ blog nào đó" vẫn hơn
  // gộp chung vào "không rõ nguồn" với người tự gõ địa chỉ.
  return { utmSource: goc, utmMedium: "referral" };
}

export interface UtmParams {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

/**
 * Ghi nhận nguồn lần đầu vào site, giữ lại cho đăng ký / góp ý / CTA.
 *
 * Thứ tự ưu tiên: tham số `utm_*` trước, referrer sau.
 *
 * - `utm_*` là thứ mình tự gắn, nên chính xác tới từng đợt đăng — giữ nguyên
 *   khi có.
 * - Không có thì suy từ referrer. Phần lớn lưu lượng thật rơi vào nhánh này:
 *   người ta chia sẻ lại bài, hoặc bấm từ trang Facebook, chứ không bấm đúng
 *   link mình đã gắn tay.
 *
 * Hai nhánh ghi đè KHÁC nhau, và đó là chỗ dễ làm sai nhất:
 *
 * - Link có `utm_*` thì LUÔN ghi đè. Khách bấm một link chiến dịch mới là
 *   một lần chạm mới, có chủ đích, đáng ghi công cho đợt đăng ấy.
 * - Nguồn suy từ referrer thì CHỈ điền khi chưa có gì. Người đọc bài từ
 *   TikTok, rồi hôm sau tìm lại qua Google — để referrer ghi đè thì công
 *   của TikTok bị Google lấy mất, mà Google chỉ là chặng quay lại.
 */
export function captureUtmFromUrl() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");

  let utm: UtmParams;
  if (source || medium || campaign) {
    utm = { utmSource: source, utmMedium: medium, utmCampaign: campaign };
  } else {
    // Đã biết khách đến từ đâu rồi thì referrer không được phép sửa lại.
    if (readStoredUtm().utmSource) return;

    const tuRef = nguonTuReferrer(
      typeof document !== "undefined" ? document.referrer : null,
      window.location.hostname,
    );
    if (!tuRef) return;
    utm = {
      utmSource: tuRef.utmSource,
      utmMedium: tuRef.utmMedium,
      utmCampaign: null,
    };
  }
  try {
    localStorage.setItem(UTM_KEY, JSON.stringify(utm));
  } catch {
    /* ignore quota */
  }
}

export function readStoredUtm(): UtmParams {
  if (typeof window === "undefined") {
    return { utmSource: null, utmMedium: null, utmCampaign: null };
  }
  try {
    const raw = localStorage.getItem(UTM_KEY);
    if (!raw) return { utmSource: null, utmMedium: null, utmCampaign: null };
    const parsed = JSON.parse(raw) as UtmParams;
    return {
      utmSource: parsed.utmSource ?? null,
      utmMedium: parsed.utmMedium ?? null,
      utmCampaign: parsed.utmCampaign ?? null,
    };
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null };
  }
}

/** Bốn giá trị máy chủ nhận cho trường `source` của góp ý. */
export type NguonGopY = "TAROT_AI" | "BOOKING" | "GENERAL" | "LANDING";

/**
 * Suy nguồn góp ý từ trang người dùng đang đứng.
 *
 * Vì sao suy chứ không hỏi: nút Góp ý nổi ở mọi trang, và bắt người ta chọn
 * "bạn đang góp ý về phần nào" là thêm một bước cho họ bỏ dở. Trang đang mở
 * đã nói đủ rồi.
 *
 * Trước đây ô góp ý được gắn một lần ở gốc mà không truyền gì, nên MỌI góp ý
 * thật đều rơi vào `GENERAL`; cột "Nguồn" trong trang quản trị trông có bốn
 * loại chỉ vì dữ liệu mẫu được gieo đều cho đẹp.
 */
export function nguonGopY(pathname: string): NguonGopY {
  const p = (pathname || "/").toLowerCase();
  if (p === "/" || p === "/home") return "LANDING";
  if (p.startsWith("/tarot")) return "TAROT_AI";
  if (p.startsWith("/readers") || p.startsWith("/bookings")) return "BOOKING";
  return "GENERAL";
}
