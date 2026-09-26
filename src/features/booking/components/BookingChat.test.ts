import { describe, expect, it } from "vitest";
import { dangOGanDay } from "./BookingChat";

/**
 * Khi nào một tin mới được phép kéo người dùng xuống đáy.
 *
 * Đây là nửa còn lại của việc sửa lỗi "gửi tin xong màn hình tự cuộn". Nửa
 * đầu là cuộn KHUNG TIN thay vì cả trang. Nửa này là: cuộn lúc nào.
 *
 * Ai đó cuộn lên đọc lại tin cũ mà bị kéo về đáy thì họ mất chỗ đang đọc và
 * không hiểu vì sao — thứ lỗi người dùng hiếm khi báo, vì nó trông như tay
 * mình trượt.
 */
function khung(scrollHeight: number, scrollTop: number, clientHeight: number) {
  return { scrollHeight, scrollTop, clientHeight };
}

describe("dangOGanDay", () => {
  it("cuộn hết xuống dưới cùng thì tính là ở đáy", () => {
    // 1000 nội dung, khung cao 400, đã cuộn 600 → chạm đáy đúng bằng 0.
    expect(dangOGanDay(khung(1000, 600, 400))).toBe(true);
  });

  it("còn lệch dưới 80px vẫn tính là ở đáy", () => {
    // Một dòng tin lẻ hoặc một cú cuộn hụt không được coi là "đã đi chỗ
    // khác" — nếu không thì tin tiếp theo đứng im ngoài tầm nhìn.
    expect(dangOGanDay(khung(1000, 540, 400))).toBe(true);
    expect(dangOGanDay(khung(1000, 521, 400))).toBe(true);
  });

  it("lệch đúng 80px trở lên thì KHÔNG còn là ở đáy", () => {
    // Ngưỡng là `< 80`, không phải `<= 80`. Chốt lại để ai đó đổi con số này
    // phải đọc dòng giải thích ở hàm trước khi đổi.
    expect(dangOGanDay(khung(1000, 520, 400))).toBe(false);
  });

  it("cuộn lên giữa danh sách thì không kéo về đáy nữa", () => {
    expect(dangOGanDay(khung(1000, 200, 400))).toBe(false);
    expect(dangOGanDay(khung(1000, 0, 400))).toBe(false);
  });

  it("nội dung chưa đủ dài để cuộn thì luôn là ở đáy", () => {
    // Khung vừa dựng, hoặc cuộc mới chỉ có hai câu. Trả false ở đây là tin
    // đầu tiên của cuộc trò chuyện không bao giờ tự hiện ra.
    expect(dangOGanDay(khung(300, 0, 400))).toBe(true);
    expect(dangOGanDay(khung(0, 0, 0))).toBe(true);
  });
});
