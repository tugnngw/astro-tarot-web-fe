import type { NguoiThuHai } from "@/api/tarot";
import { convertToISODate, convertToISOTime } from "@/lib/utils";

/**
 * Đủ phần của một người để dựng được người thứ hai. Khai hẹp lại thế này để
 * hàm dưới không phụ thuộc vào `Person` của màn Tarot — nhờ đó test được mà
 * không phải kéo cả route vào.
 */
export interface NguoiTrongForm {
  name: string;
  dob: string;
  birthTime: string;
  birthPlace: string;
  timezone: string;
}

/**
 * Rút người thứ hai ra khỏi danh sách người của phiên, ở dạng máy chủ nhận.
 *
 * Vì sao phải có hàm riêng: form đã hỏi đủ dữ liệu của hai người từ lâu, mà
 * phần gửi đi thì chỉ lấy `people[0]`. Người thứ hai được gõ vào rồi dừng lại
 * ở trạng thái của trình duyệt — lời giải trả về là chân dung của riêng người
 * thứ nhất, nhưng vẫn trôi chảy nên không ai nhận ra là thiếu.
 *
 * Trả null khi phiên chỉ có một người, HOẶC khi ô của người thứ hai còn trống
 * trơn. Người dùng bấm "2 người (đôi)" rồi đổi ý mà không bấm lại thì mảng
 * vẫn dài 2 — gửi một người rỗng đi là lời nhắc có thêm một nhân vật không
 * tồn tại, và mô hình sẽ hỏi ngược lại về họ.
 */
export function nguoiThuHaiCuaPhien(
  people: readonly NguoiTrongForm[],
): NguoiThuHai | null {
  const p = people[1];
  if (!p) return null;

  const name = p.name.trim();
  const birthDate = convertToISODate(p.dob);
  const birthPlace = p.birthPlace.trim();

  // Không tên, không ngày sinh, không nơi sinh thì không có gì để nói về họ.
  if (!name && !birthDate && !birthPlace) return null;

  return {
    name: name || undefined,
    birthDate: birthDate || undefined,
    birthTime: convertToISOTime(p.birthTime) || undefined,
    birthPlace: birthPlace || undefined,
    timezone: p.timezone || undefined,
  };
}
