import { trackMarketingEvent } from "@/api/marketing";
import { maKhach } from "@/lib/ma-khach";
import { trackEvent } from "@/lib/analytics";
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
 * <p>Đồng thời bắn lên GA4. Một lần gọi, hai nơi nhận, vì hai nơi trả lời hai
 * câu hỏi khác nhau và đều cần:
 *
 * <ul>
 *   <li>bảng của mình — hiện ngay, nối được với `user_id` nên đếm được NGƯỜI,
 *       và không bị trình chặn quảng cáo cắt;</li>
 *   <li>GA4 — có sẵn phễu, so sánh kênh, giữ lịch sử dài; đổi lại báo cáo
 *       thường trễ 24–48 giờ.</li>
 * </ul>
 *
 * <p>Giữ đúng MỘT chỗ gọi là để hai bên không lệch nhau. Bắn tay ở từng nơi
 * thì sớm muộn cũng có nút chỉ ghi vào một bên, và lúc hai bảng ra số khác
 * nhau thì không ai biết bên nào đúng.
 *
 * <p>Lỗi mạng không làm hỏng UX — fire-and-forget.
 */
export function trackCta(
  eventName: string,
  extra?: Record<string, string | number | boolean | null | undefined>,
) {
  const utm = readStoredUtm();

  // GA4 tự gắn sự kiện vào nguồn của phiên, nên không gửi kèm utm_* ở đây.
  trackEvent(eventName, extra as Record<string, string | number | boolean>);

  void trackMarketingEvent({
    eventName,
    path: typeof window !== "undefined" ? window.location.pathname : null,
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    visitorId: maKhach(),
    metadata: extra ? JSON.stringify(extra) : null,
  }).catch(() => {
    /* ignore */
  });
}

/**
 * Ghi một lượt XEM TRANG.
 *
 * <p>Vì sao cần, dù đã có `trackCta`: `trackCta` chỉ ghi khi người ta bấm một
 * nút đã gắn theo dõi. Ai vào xem vài trang rồi đi — phần lớn khách thật —
 * không để lại dòng nào, nên bảng quản trị trông như chỉ có dăm bảy lượt và
 * gần hết dồn vào "(không rõ nguồn)".
 *
 * <p>Có hàng xem trang thì mới dựng lại được hành trình: "vào từ Facebook,
 * xem trang chủ, mở Tarot, rút một quẻ, rồi đi".
 */
export function trackXemTrang(duongDan: string) {
  trackCta("xem_trang", { duong_dan: duongDan });
}
