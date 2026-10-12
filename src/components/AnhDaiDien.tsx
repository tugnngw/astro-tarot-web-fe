import { useEffect, useState } from "react";
import { avatarUrl } from "@/api/profile";

/**
 * Ảnh đại diện, tự lùi về chữ cái đầu khi không tải được ảnh.
 *
 * ## Vì sao cần thành phần riêng
 *
 * Hai màn quản trị trước đây đều tự xử lý bằng cách sửa thẳng DOM trong
 * `onError`:
 *
 * ```tsx
 * e.currentTarget.style.display = "none";
 * e.currentTarget.nextElementSibling.style.display = "grid";
 * ```
 *
 * Cách ấy hỏng theo đúng kiểu khó lần ra. React không biết gì về hai thuộc
 * tính `style` vừa bị đặt tay, nên lần dựng lại kế tiếp — lọc danh sách, đổi
 * trang, một truy vấn trả về — nó khôi phục `display` theo JSX: ảnh hỏng hiện
 * lại, trình duyệt tải lại, lại `onError`, lại ẩn đi. Mỗi vòng là một lỗi 404
 * trong bảng điều khiển và một nhịp nhấp nháy trên màn hình.
 *
 * Ở đây trạng thái nằm trong React, nên dựng lại bao nhiêu lần cũng giữ
 * nguyên kết quả.
 *
 * ## Khi nào ảnh 404
 *
 * Cột `users.avatar` có thể còn trỏ tới một đường dẫn cũ trong khi khối byte ở
 * bảng `user_avatars` đã không còn — ví dụ tài khoản tạo từ thời ảnh lưu ra
 * tệp. Lúc đó `/api/v1/users/{id}/avatar` trả 404 dù `avatar` khác null. Đây
 * là trường hợp bình thường, không phải sự cố, nên hiện chữ cái đầu là đủ.
 */
export function AnhDaiDien({
  avatar,
  ten,
  co = 36,
  className = "",
}: {
  /** Giá trị cột `avatar`, có thể null. */
  avatar: string | null | undefined;
  /** Tên để lấy chữ cái đầu khi không có ảnh. */
  ten: string;
  /** Cạnh ô vuông, tính bằng px. */
  co?: number;
  className?: string;
}) {
  const duong = avatarUrl(avatar);
  const [hong, setHong] = useState(false);

  // Đổi người thì thử lại ảnh. Không có dòng này thì một hàng từng hỏng ảnh sẽ
  // mãi hiện chữ cái, kể cả khi React tái dùng đúng ô ấy cho người khác có ảnh
  // bình thường — danh sách có lọc và phân trang nên chuyện tái dùng xảy ra
  // suốt.
  useEffect(() => setHong(false), [duong]);

  const kichThuoc = { width: co, height: co };

  if (!duong || hong) {
    return (
      <span
        aria-hidden="true"
        style={{ ...kichThuoc, fontSize: Math.round(co * 0.36) }}
        className={`grid shrink-0 place-items-center rounded-full bg-mystic/20 text-gold ${className}`}
      >
        {ten.trim().charAt(0).toUpperCase() || "?"}
      </span>
    );
  }

  return (
    <img
      src={duong}
      alt=""
      loading="lazy"
      style={kichThuoc}
      onError={() => setHong(true)}
      className={`shrink-0 rounded-full object-cover ring-1 ring-gold/30 ${className}`}
    />
  );
}
