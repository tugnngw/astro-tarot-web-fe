/**
 * Bảng màu cho biểu đồ — một nơi duy nhất.
 *
 * ## Vì sao không để trong CSS như các token khác
 *
 * Recharts nhận màu dưới dạng CHUỖI truyền vào prop (`fill`, `stroke`), không
 * đọc được biến CSS. Lấy biến bằng `getComputedStyle` thì hỏng ở lượt dựng
 * trên máy chủ — trang này có SSR, lúc ấy chưa có `document` nào cả.
 *
 * Nên bảng màu biểu đồ buộc phải sống trong TypeScript. Đổi lại nó vẫn là
 * MỘT nguồn: mọi biểu đồ lấy từ đây, không ai viết mã màu tại chỗ nữa.
 *
 * ## Vì sao cần gom
 *
 * Trước tệp này, mã màu nằm rải trong từng biểu đồ, và hai trang quản trị
 * dùng hai sắc tím khác nhau cho cùng một việc — `#a78bfa` ở Tổng quan,
 * `#c084fc` ở Lưu lượng. Không ai chỉ ra được chỗ sai, nhưng đặt hai ảnh
 * chụp cạnh nhau là thấy ngay chúng không thuộc cùng một sản phẩm.
 *
 * Sắc vàng, lục, hổ phách, hồng, tím ở đây bám theo đúng các token
 * `--gold`, `--success`, `--warning`, `--destructive`, `--mystic` trong
 * `styles.css`.
 */

/** Màu cơ bản, gọi theo tên sắc. */
export const MAU = {
  vang: "#d4a84b",
  lam: "#38bdf8",
  luc: "#34d399",
  tim: "#a78bfa",
  hoPhach: "#fbbf24",
  hong: "#fb7185",
  xam: "#8b8b8b",
} as const;

/**
 * Thứ tự dùng khi một biểu đồ cần nhiều màu mà không có ý nghĩa riêng cho
 * từng phần — ví dụ biểu đồ tròn theo danh mục.
 *
 * Vàng đứng đầu vì đó là màu nhấn của cả sản phẩm; phần lớn nhất của biểu đồ
 * nên mang màu ấy.
 */
export const DAY_MAU = [
  MAU.vang,
  MAU.lam,
  MAU.luc,
  MAU.tim,
  MAU.hoPhach,
  MAU.hong,
] as const;

/**
 * Vai trò tài khoản.
 *
 * Vàng cho Quản trị viên là có chủ đích: màu nhấn mạnh nhất dành cho vai trò
 * có quyền lớn nhất, nên nhìn biểu đồ là thấy ngay nhóm ấy.
 */
export const MAU_VAI_TRO = {
  USER: MAU.lam,
  STAFF: MAU.luc,
  MANAGER: MAU.tim,
  ADMIN: MAU.vang,
} as const;

/**
 * Trạng thái lịch hẹn.
 *
 * Theo đúng quy ước màu trạng thái của cả sản phẩm: hổ phách là đang chờ,
 * lục là xong xuôi, hồng là hỏng. Checklist nhất quán gọi đây là "status
 * colours reserved for status" — nên đừng mượn mấy màu này để trang trí.
 */
export const MAU_TRANG_THAI_BOOKING = {
  PENDING: MAU.hoPhach,
  CONFIRMED: MAU.lam,
  COMPLETED: MAU.luc,
  CANCELLED: MAU.hong,
} as const;

/**
 * Dòng tiền.
 *
 * Tiền vào lam, phần nền tảng giữ lại vàng, chi phí hồng. Hồng ở đây cùng
 * nghĩa với "hỏng" ở trên — tiền đi ra khỏi túi.
 */
export const MAU_TIEN = {
  doanhThu: MAU.lam,
  phiNenTang: MAU.vang,
  chiPhi: MAU.hong,
} as const;
