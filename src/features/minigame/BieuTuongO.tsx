import type { KyTuO } from "./giao-hoi";

/**
 * Sáu biểu tượng của bàn Giao Hội.
 *
 * ## Vì sao mỗi loại một HÌNH riêng, không chỉ một màu riêng
 *
 * Khoảng một trong mười hai người nam không phân biệt được đỏ với lục. Một
 * bàn xếp-ba chỉ phân loại bằng màu thì với họ là một bàn toàn ô giống nhau —
 * không phải khó chơi, mà là không chơi được.
 *
 * Nên hình là tín hiệu chính và màu là tín hiệu phụ: nhìn nhanh cả bàn thì
 * thấy màu, nhìn một ô thì đọc hình. Bốn hoa của bộ ẩn phụ Tarot cộng Sao và
 * Trăng vừa đủ sáu hình khác nhau rõ rệt, mà vẫn đúng chủ đề.
 */

/** Lớp màu của từng loại, lấy từ token --o-* trong styles.css. */
const MAU: Record<KyTuO, string> = {
  "1": "text-o-gay",
  "2": "text-o-coc",
  "3": "text-o-guom",
  "4": "text-o-tien",
  "5": "text-o-sao",
  "6": "text-o-trang",
};

/**
 * Hình của từng loại.
 *
 * Gậy, Cốc, Gươm vẽ bằng nét; Tiền, Sao, Trăng tô đặc. Trộn hai cách là cố
 * ý — nét và khối là một tín hiệu nữa để tách chúng ra, ngoài hình và màu.
 */
function Hinh({ loai }: { loai: KyTuO }) {
  switch (loai) {
    case "1": // Gậy — cành gậy chéo, hai nhánh con
      return (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M7.5 21 L16.5 3.5" />
          <path d="M12.6 11.4 L8.2 9.2" />
          <path d="M14.4 7.6 L18.6 6.4" />
        </g>
      );
    case "2": // Cốc — lòng cốc, chân, đế
      return (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4.5 H18 L16.4 10.6 A4.6 4.6 0 0 1 7.6 10.6 Z" />
          <path d="M12 15.2 V18.6" />
          <path d="M8.4 19.5 H15.6" />
        </g>
      );
    case "3": // Gươm — lưỡi, chắn, cán, đuôi
      return (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2.5 L13.8 6 V13.6 H10.2 V6 Z" />
          <path d="M7.4 14.2 H16.6" />
          <path d="M12 16 V19.4" />
          <path d="M9.6 20.6 H14.4" />
        </g>
      );
    case "4": // Tiền — đồng tiền viền tròn, ngôi sao năm cánh bên trong
      return (
        <g fill="none" stroke="currentColor" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8.6" strokeWidth="2" />
          <path
            d="M12 7 L14.94 16.05 L7.24 10.45 L16.76 10.45 L9.06 16.05 Z"
            strokeWidth="1.5"
          />
        </g>
      );
    case "5": // Sao — năm cánh, tô đặc
      return (
        <path
          fill="currentColor"
          d="M12 2.5 L14.6 9.4 L22 9.9 L16.3 14.5 L18.2 21.5 L12 17.6 L5.8 21.5 L7.7 14.5 L2 9.9 L9.4 9.4 Z"
        />
      );
    case "6": // Trăng — lưỡi liềm, tô đặc
      return (
        <path
          fill="currentColor"
          d="M20 14.6 A8.6 8.6 0 0 1 9.4 4 A8.6 8.6 0 1 0 20 14.6 Z"
        />
      );
  }
}

export function BieuTuongO({
  loai,
  className,
}: {
  loai: KyTuO;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${MAU[loai]} ${className ?? ""}`}
    >
      <Hinh loai={loai} />
    </svg>
  );
}
