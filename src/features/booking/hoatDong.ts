import type { Presence } from "@/api/booking-chat";

/**
 * Câu mô tả trạng thái hoạt động của người bên kia.
 *
 * <p>Tách khỏi thành phần giao diện vì nó là hàm thuần trên hai giá trị, và
 * vì mọi nhánh của nó đều là một câu người dùng đọc — sai một nhánh là nói
 * sai với họ về việc có nên chờ trả lời hay không.
 *
 * <p>Trả null khi không biết gì. Giao diện phải bỏ hẳn dòng ấy đi chứ đừng
 * hiện "Không rõ": một dòng trống có nghĩa hơn một dòng nói rằng nó không
 * biết.
 */
export function moTaHoatDong(
  p: Presence | null,
  bayGio = Date.now(),
): string | null {
  if (!p) return null;
  if (p.online) return "Đang hoạt động";
  if (!p.lastSeenAt) return null;

  const luc = new Date(p.lastSeenAt).getTime();
  if (Number.isNaN(luc)) return null;

  const giay = Math.floor((bayGio - luc) / 1000);

  // Mốc trong tương lai: đồng hồ máy khách lệch, hoặc múi giờ đọc sai. Nói
  // "Hoạt động -3 phút trước" thì lộ hẳn là phần mềm hỏng; coi như vừa xong
  // thì vừa đúng hơn vừa đỡ khó hiểu.
  if (giay < 60) return "Vừa hoạt động";

  const phut = Math.floor(giay / 60);
  if (phut < 60) return `Hoạt động ${phut} phút trước`;

  const gio = Math.floor(phut / 60);
  if (gio < 24) return `Hoạt động ${gio} giờ trước`;

  const ngay = Math.floor(gio / 24);
  if (ngay < 7) return `Hoạt động ${ngay} ngày trước`;

  // Quá một tuần thì con số thôi có ích: "Hoạt động 43 ngày trước" và "hơn
  // một tuần trước" dẫn tới cùng một quyết định — đừng ngồi chờ trả lời.
  return "Hoạt động hơn một tuần trước";
}
