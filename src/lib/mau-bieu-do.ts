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

/**
 * Màu của KHUNG biểu đồ — trục, lưới, con trỏ, viền lát. Không phải màu dữ
 * liệu, nên tách khỏi {@link MAU}.
 *
 * ## Vì sao phải gom
 *
 * Tab Tổng quan kẻ lưới bằng vàng mờ 45%, tab Lưu lượng kẻ bằng trắng 6%.
 * Cùng một đường kẻ, cùng một trang quản trị, hai màu khác nhau — và sáu chỗ
 * trong Tổng quan lặp lại nguyên chuỗi `oklch(...)` ấy bằng tay.
 *
 * ## Vì sao vàng chứ không xám
 *
 * `ChartContainer` có sẵn CSS làm mờ stroke mặc định (#ccc). Để stroke mặc
 * định thì selector ấy khớp và đường kẻ nhạt tới mức mất hẳn trên nền tối.
 * Đặt vàng tường minh thì selector không khớp nữa — đường kẻ hiện đúng.
 */
export const KHUNG = {
  /** Chữ trên trục X/Y — sáng hơn `--muted-foreground` để đọc được trên nền tối. */
  chuTruc: "oklch(0.78 0.02 85)",
  /** Lưới ngang. Đủ rõ để mắt bám theo, chưa đủ đậm để tranh nét với dữ liệu. */
  luoi: "oklch(0.78 0.08 85 / 0.45)",
  /** Đường trục — mờ hơn lưới một bậc. */
  duongTruc: "oklch(0.78 0.08 85 / 0.35)",
  /** Vệt sáng theo con trỏ khi rê chuột lên cột. */
  conTro: "oklch(0.75 0.12 85 / 0.12)",
  /** Viền giữa các lát bánh — màu nền, để lát tách nhau mà không thêm nét mới. */
  vienLat: "oklch(0.16 0.02 280)",
  /**
   * Mực của nhãn nằm ĐÈ lên lát biểu đồ.
   *
   * Trắng thuần, cố tình không lấy theo token nền: nhãn này phải đọc được
   * trên mọi lát bất kể lát ấy màu gì, nên vai trò của nó là "mực tương
   * phản" chứ không phải một sắc trong bảng màu.
   */
  mucTrenLat: "#ffffff",
} as const;
