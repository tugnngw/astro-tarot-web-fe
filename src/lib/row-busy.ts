// Khoá đúng MỘT dòng đang chờ kết quả, thay vì khoá cả bảng.
//
// Mọi màn danh sách ở đây đều dùng chung một mutation của React Query cho tất
// cả các dòng, rồi viết `disabled={mutation.isPending}` trên từng nút. Cờ
// `isPending` là của cái mutation ấy, không phải của dòng nào — nên bấm "Duyệt"
// ở hồ sơ thứ nhất là nút "Duyệt" của cả chín hồ sơ còn lại cùng xám đi.
//
// Nhìn thì tưởng trang bị treo. Tệ hơn: nó sai về nghĩa. Duyệt hồ sơ A không
// liên quan gì tới hồ sơ B, và chặn người dùng thao tác trên B là bịa ra một
// ràng buộc không hề tồn tại.
//
// Hook này giữ mã của dòng đang chạy, để `disabled` hỏi đúng câu hỏi:
// "CÓ PHẢI DÒNG NÀY không?", chứ không phải "có dòng nào đang chạy không?".
import { useState } from "react";

export function useRowBusy() {
  const [dangChay, setDangChay] = useState<string | null>(null);

  /**
   * Chạy một thao tác và ghim mã dòng trong lúc chờ.
   *
   * <p>`finally` là bắt buộc chứ không phải cho gọn: thao tác hỏng mà không gỡ
   * mã ra thì dòng đó khoá vĩnh viễn, và người dùng không có cách nào mở lại
   * ngoài tải lại trang.
   */
  async function chay<T>(
    id: string,
    fn: () => Promise<T>,
  ): Promise<T | undefined> {
    setDangChay(id);
    try {
      return await fn();
    } finally {
      setDangChay(null);
    }
  }

  return {
    /** Mã dòng đang chờ kết quả, hoặc null. */
    dangChay,
    /** Dòng này có đang chờ không — dùng thẳng cho `disabled`. */
    ban: (id: string) => dangChay === id,
    chay,
  };
}
