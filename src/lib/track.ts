import { trackMarketingEvent } from "@/api/marketing";
import { readStoredUtm } from "@/lib/utm";

/**
 * Ghi một CTA lên BE — đây là nguồn số liệu CAP/OC2, đọc lại qua
 * {@link getMarketingSummary}.
 *
 * <p>Trước đây hàm này ghi song song lên Vercel Analytics nữa. Đã bỏ: dự án
 * chưa bật Web Analytics trên Vercel nên script đo lường trả 404 ở MỌI lần tải
 * trang — số sự kiện tới được Vercel bằng 0, đổi lại là một dòng lỗi đỏ trong
 * bảng điều khiển và một script bên thứ ba tải vô ích. Bật nó lên thì cũng chỉ
 * là chép lại thứ BE đã lưu.
 *
 * <p>Lỗi mạng không làm hỏng UX — fire-and-forget.
 */
export function trackCta(
  eventName: string,
  extra?: Record<string, string | number | boolean | null | undefined>,
) {
  const utm = readStoredUtm();
  void trackMarketingEvent({
    eventName,
    path: typeof window !== "undefined" ? window.location.pathname : null,
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    metadata: extra ? JSON.stringify(extra) : null,
  }).catch(() => {
    /* ignore */
  });
}
