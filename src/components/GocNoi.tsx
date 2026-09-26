import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Cột nút nổi ở góc dưới bên phải.
 *
 * <p>Trước đây mỗi nút tự khai `fixed bottom-… right-…` của riêng nó, và hai
 * cái rơi đúng vào nhau: nút "Góp ý" ở `bottom-6 right-4`, cục trao đổi ở
 * `bottom-5 right-5`. Chồng lên nhau thật, và cái nằm dưới thì bấm không
 * được.
 *
 * <p>Cách chữa bằng cách nhích số của một cái lên chỉ đúng khi CẢ HAI cùng
 * hiện. Mà cả hai đều ẩn/hiện theo điều kiện riêng — "Góp ý" tắt sau khi gửi
 * hoặc khi người dùng đóng nó, cục trao đổi chỉ hiện khi có cuộc nào đang mở
 * — nên nhích tay thì lúc một cái ẩn, cái còn lại treo lơ lửng trên một
 * khoảng trống vô cớ.
 *
 * <p>Xếp thành một cột thì vị trí tự suy ra từ những gì đang thật sự hiện, và
 * thêm nút thứ ba sau này cũng không phải tính lại con số nào.
 */
export function GocNoi({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {children}
    </div>
  );
}

/**
 * Đưa một lớp phủ ra khỏi cột nút.
 *
 * <p>`position: fixed` của cột tạo ra một ngữ cảnh xếp chồng, nên mọi thứ bên
 * trong nó — kể cả một hộp thoại khai `z-50` — vẫn bị kẹp dưới trần của chính
 * cột (`z-40`). Hộp thoại góp ý sẽ chui xuống dưới các lớp phủ khác của ứng
 * dụng, và đó là kiểu lỗi chỉ lộ ra khi hai thứ tình cờ mở cùng lúc.
 *
 * <p>Đẩy sang `document.body` thì lớp phủ thoát hẳn ngữ cảnh ấy và `z-index`
 * của nó có nghĩa trở lại.
 *
 * <p>Chờ gắn xong mới dựng: máy chủ không có `document`, mà trang này dựng
 * sẵn ở máy chủ (TanStack Start).
 */
export function LopPhu({ children }: { children: ReactNode }) {
  const [daGan, setDaGan] = useState(false);
  useEffect(() => setDaGan(true), []);
  if (!daGan) return null;
  return createPortal(children, document.body);
}
