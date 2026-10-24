/**
 * Một cách duy nhất để hiện tiền.
 *
 * ## Vì sao cần
 *
 * Trước tệp này, dự án có **chín** hàm định dạng tiền rải khắp nơi — mỗi màn
 * tự viết một bản. Và chúng không cho cùng kết quả:
 *
 * - `toLocaleString("vi-VN") + " ₫"` ở ví và màn nạp tiền
 * - `Intl.NumberFormat(style:"currency")` ở trang quản trị
 * - riêng bảng giá gói trả `"Miễn phí"` khi số tiền bằng 0, nơi khác trả `"0 ₫"`
 *
 * Nên cùng một số tiền hiện khác nhau tuỳ màn, và số 0 thì khác hẳn về nghĩa.
 * Đây đúng là thứ làm giao diện trông không được chăm — không ai chỉ ra được
 * chỗ sai, nhưng cảm giác rời rạc thì thấy ngay.
 *
 * ## Vì sao không dùng `style: "currency"`
 *
 * Dạng ấy để ICU tự quyết vị trí và khoảng trắng của ký hiệu ₫, mà ICU khác
 * nhau giữa các phiên bản trình duyệt và Node. Cùng một mã nguồn có thể ra
 * `119.000 ₫` trên máy này và `119.000₫` trên máy khác — kiểu lệch chỉ lộ ra
 * khi có người chụp màn hình hai nơi rồi đặt cạnh nhau.
 *
 * Tự nối ký hiệu thì chuỗi luôn giống hệt ở mọi nơi.
 */

/**
 * Chỉ nhóm hàng nghìn; ký hiệu tự nối để không phụ thuộc ICU.
 *
 * Locale truyền tường minh, KHÔNG dùng `n.toLocaleString()` trần: Node (lúc
 * SSR) và trình duyệt có thể resolve ra locale khác nhau, cho `"18.420"` ở
 * máy chủ và `"18,420"` ở máy khách — React ném "Hydration failed because
 * the server rendered text that didn't match the client".
 */
const NHOM = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

/**
 * `119000` → `"119.000 ₫"`.
 *
 * @param mienPhiKhiBang0 đặt `true` ở chỗ số 0 nghĩa là *không mất tiền*
 *   (bảng giá gói), để nó hiện "Miễn phí". Mặc định `false`, vì ở ví và sao
 *   kê thì 0 nghĩa là *số dư bằng không* — hiện "Miễn phí" ở đó là sai nghĩa.
 */
export function tien(soTien: number, mienPhiKhiBang0 = false): string {
  if (!Number.isFinite(soTien)) return "—";
  if (soTien === 0 && mienPhiKhiBang0) return "Miễn phí";
  return `${NHOM.format(soTien)} ₫`;
}

/** Số thường, cùng cách nhóm hàng nghìn với {@link tien}. */
export function so(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return NHOM.format(n);
}

/**
 * Tiền đô, cho chi phí gọi mô hình AI.
 *
 * Nhà cung cấp tính theo USD và đơn giá nhỏ tới mức cần bốn chữ số thập phân
 * — `0.0003 $/1K token`. Làm tròn về 2 số là mọi dòng chi phí thành `0,00 $`,
 * không đọc được gì.
 *
 * Đây là chỗ duy nhất trong sản phẩm KHÔNG phải tiền Việt, nên nó ở đây cùng
 * {@link tien} thay vì nằm riêng trong màn quản trị: để sau này ai cần hiện
 * tiền thì chỉ phải tìm một tệp.
 */
export function usd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
}
