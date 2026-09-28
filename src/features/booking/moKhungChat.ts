/**
 * Mở khung trao đổi nổi từ một nút nằm chỗ khác (nút trên thẻ lịch hẹn).
 *
 * Khung nằm ở gốc ứng dụng, ngoài trang lịch. Không truyền hàm xuống qua
 * từng tầng: nút chỉ cần gọi, khung đang gắn thì tự mở đúng buổi.
 */
type Mo = (bookingId: string) => void;

let mo: Mo | null = null;

export function dangKyMoChat(fn: Mo) {
  mo = fn;
  return () => {
    if (mo === fn) mo = null;
  };
}

export function moKhungChat(bookingId: string) {
  mo?.(bookingId);
}
