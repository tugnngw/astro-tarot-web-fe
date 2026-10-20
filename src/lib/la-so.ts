/**
 * Lá số là TUỲ CHỌN của phiên chat Tarot AI, không phải điều kiện để vào.
 *
 * Máy chủ nói rõ điều đó: `AstrologyContextServiceImpl` trả `Optional.empty()`
 * khi người dùng chưa có lá số, và tài liệu ngay trên hàm ấy ghi "reading
 * continues without context". App Flutter chưa bao giờ hỏi ngày sinh trước khi
 * cho chat, và chat trong app vẫn chạy bình thường — cổng ngày sinh chỉ tồn
 * tại ở giao diện web.
 */

/** Dạng ngày máy chủ nhận: `YYYY-MM-DD`. */
const DANG_ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Có đủ dữ liệu để dựng lá số cho phiên này hay không.
 *
 * `convertToISODate` trả chuỗi RỖNG khi ô ngày sinh để trống, và trả chuỗi
 * không đúng dạng khi người dùng gõ dở ("4-10"). Cả hai trường hợp đều trả
 * `false` ở đây, và `false` nghĩa là "bỏ qua bước lưu lá số" chứ không phải
 * "chặn người dùng lại".
 */
export function coDuLaSo(ngaySinhISO: string | null | undefined): boolean {
  if (!ngaySinhISO) return false;
  return DANG_ISO.test(ngaySinhISO);
}
