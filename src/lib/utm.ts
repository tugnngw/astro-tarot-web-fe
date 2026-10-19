const UTM_KEY = "astrotarot_utm";

export interface UtmParams {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

/** Đọc UTM từ URL lần đầu vào site, giữ trong localStorage cho đăng ký/feedback. */
export function captureUtmFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  if (!source && !medium && !campaign) return;
  const utm: UtmParams = {
    utmSource: source,
    utmMedium: medium,
    utmCampaign: campaign,
  };
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
