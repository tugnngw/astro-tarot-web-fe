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
 *
 * ## Vì sao chỉ dùng currentColor và độ mờ, không dùng gradient
 *
 * Mỗi loại lấy màu từ một lớp `text-o-*`, nên thân hình vẽ bằng
 * `currentColor` là tự khớp. Phần khối sáng và nét chìm làm bằng cùng màu ấy
 * ở độ mờ khác, nên chúng cũng tự khớp theo.
 *
 * Cách còn lại là mỗi loại một gradient riêng trong `<defs>`. Khi ấy màu bị
 * viết hai lần — một ở token, một trong gradient — và muốn chỉnh sắc Cốc cho
 * dễ đọc hơn thì phải nhớ sửa cả hai chỗ. Đó đúng là kiểu lệch mà bộ canh
 * design system sinh ra để chặn.
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
 * Mỗi hình dựng ba lớp: một khối nền mờ cho ra cảm giác dày, thân hình vẽ đặc
 * hoặc bằng nét, rồi một vệt sáng rất mờ ở mép trên trái. Ba lớp ấy là thứ
 * tách chúng khỏi mấy hình que phẳng — ở cỡ ô 58px thì một nét đơn trông như
 * biểu tượng tạm, còn có khối và có sáng thì nó ra một vật.
 */
function Hinh({ loai }: { loai: KyTuO }) {
  switch (loai) {
    case "1": // Gậy — cành gậy chéo, chồi non và mắt gỗ
      return (
        <g>
          <path
            d="M7.6 21.4 L16.8 3.2"
            stroke="currentColor"
            strokeOpacity="0.28"
            strokeWidth="5.4"
            strokeLinecap="round"
          />
          <path
            d="M7.6 21.4 L16.8 3.2"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M12.4 11.9 C10.6 11.2 9.2 10.1 8.2 8.6 C10 8.5 11.4 9.1 12.4 10.3 Z"
            fill="currentColor"
          />
          <path
            d="M14.6 7.6 C16.1 6.6 17.6 6.2 19.2 6.4 C18.3 7.8 17 8.6 15.3 8.9 Z"
            fill="currentColor"
            fillOpacity="0.8"
          />
          <circle
            cx="13.9"
            cy="8.6"
            r="0.9"
            fill="currentColor"
            fillOpacity="0.45"
          />
        </g>
      );
    case "2": // Cốc — lòng cốc có nước, chân có nấc, đế loe
      return (
        <g>
          <path
            d="M5.6 4.2 H18.4 L16.8 10.9 A5 5 0 0 1 7.2 10.9 Z"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <path
            d="M5.6 4.2 H18.4 L16.8 10.9 A5 5 0 0 1 7.2 10.9 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M7.1 6.3 H16.9"
            stroke="currentColor"
            strokeOpacity="0.55"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M12 15 V18.3"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <ellipse cx="12" cy="14.6" rx="1.7" ry="1" fill="currentColor" />
          <path
            d="M8.2 19.8 H15.8"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </g>
      );
    case "3": // Gươm — lưỡi có sống, chắn cong, cán quấn, chuôi tròn
      return (
        <g>
          <path
            d="M12 2.2 L14 6 V13.4 H10 V6 Z"
            fill="currentColor"
            fillOpacity="0.35"
          />
          <path
            d="M12 2.2 L14 6 V13.4 H10 V6 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path
            d="M12 4.6 V12.6"
            stroke="currentColor"
            strokeOpacity="0.6"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M7 14.6 C9 13.4 15 13.4 17 14.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M12 15.6 V18.6"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <circle cx="12" cy="20.4" r="1.6" fill="currentColor" />
        </g>
      );
    case "4": // Tiền — đồng tiền hai vành, ngôi sao năm cánh chìm bên trong
      return (
        <g>
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="currentColor"
            fillOpacity="0.22"
          />
          <circle
            cx="12"
            cy="12"
            r="8.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="12"
            r="6.6"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.5"
            strokeWidth="0.9"
          />
          <path
            d="M12 7 L14.94 16.05 L7.24 10.45 L16.76 10.45 L9.06 16.05 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      );
    case "5": // Sao — năm cánh, lõi sáng hơn
      return (
        <g>
          <path
            d="M12 1.6 L14.8 9.2 L22.6 9.7 L16.5 14.6 L18.5 22.2 L12 17.9 L5.5 22.2 L7.5 14.6 L1.4 9.7 L9.2 9.2 Z"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <path
            d="M12 2.8 L14.5 9.6 L21.5 10.1 L16 14.4 L17.8 21.2 L12 17.4 L6.2 21.2 L8 14.4 L2.5 10.1 L9.5 9.6 Z"
            fill="currentColor"
          />
          <path
            d="M12 7.2 L13.3 10.8 L17 11 L14.1 13.3 L15 16.9 L12 14.9 L9 16.9 L9.9 13.3 L7 11 L10.7 10.8 Z"
            fill="currentColor"
            fillOpacity="0.45"
          />
        </g>
      );
    case "6": // Trăng — lưỡi liềm có vết lõm, kèm một ngôi sao nhỏ
      return (
        <g>
          <path
            d="M20.4 14.9 A9 9 0 0 1 9.1 3.6 A9 9 0 1 0 20.4 14.9 Z"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <path
            d="M19.6 14.4 A8.2 8.2 0 0 1 9.6 4.4 A8.2 8.2 0 1 0 19.6 14.4 Z"
            fill="currentColor"
          />
          <circle
            cx="9.4"
            cy="13.4"
            r="1.5"
            fill="currentColor"
            fillOpacity="0.35"
          />
          <circle
            cx="12.6"
            cy="17.4"
            r="1"
            fill="currentColor"
            fillOpacity="0.35"
          />
          <path
            d="M18.6 3.6 L19.4 5.4 L21.2 6.2 L19.4 7 L18.6 8.8 L17.8 7 L16 6.2 L17.8 5.4 Z"
            fill="currentColor"
            fillOpacity="0.75"
          />
        </g>
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
