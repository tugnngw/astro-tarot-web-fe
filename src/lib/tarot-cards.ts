// ============================================================
// 22 lá Ẩn Chính (Major Arcana) — dữ liệu để rút bài ngay trên trang chủ.
//
// Ảnh nằm ở public/tarot/, cùng bộ Rider-Waite-Smith 1909 mà vòng bài ở hero
// đang dùng, nên không phát sinh thêm tài nguyên nào.
//
// Nghĩa ở đây là bản rút gọn, chỉ đủ cho một lá gợi mở trong ngày. Trải bài
// đầy đủ có bối cảnh và AI diễn giải nằm ở trang /tarot.
// ============================================================

export interface TarotCard {
  /** Trùng tên file trong public/tarot/ */
  file: string;
  name: string;
  nameVi: string;
  /** Ba từ khoá cô đọng, dùng làm chip dưới tên lá. */
  keywords: string[];
  /** Một câu gợi mở, viết ở ngôi thứ hai cho gần gũi. */
  meaning: string;
}

export const MAJOR_ARCANA: TarotCard[] = [
  {
    file: "00-fool",
    name: "The Fool",
    nameVi: "Gã Khờ",
    keywords: ["Khởi đầu", "Tự do", "Liều lĩnh"],
    meaning:
      "Một chương mới đang mở ra và bạn chưa cần biết hết đường đi. Bước thứ nhất quan trọng hơn bản đồ hoàn hảo.",
  },
  {
    file: "01-magician",
    name: "The Magician",
    nameVi: "Nhà Ảo Thuật",
    keywords: ["Năng lực", "Ý chí", "Sáng tạo"],
    meaning:
      "Mọi thứ bạn cần đã nằm trong tay rồi. Việc còn lại là dám dùng nó thay vì chờ thêm một điều kiện nữa.",
  },
  {
    file: "02-high-priestess",
    name: "The High Priestess",
    nameVi: "Nữ Tư Tế",
    keywords: ["Trực giác", "Tĩnh lặng", "Bí ẩn"],
    meaning:
      "Câu trả lời không nằm ở việc hỏi thêm ai. Hãy im lặng đủ lâu để nghe thấy điều bạn vốn đã biết.",
  },
  {
    file: "03-empress",
    name: "The Empress",
    nameVi: "Nữ Hoàng",
    keywords: ["Nuôi dưỡng", "Sung túc", "Dịu dàng"],
    meaning:
      "Thời điểm để chăm sóc thứ mình đã gieo, cả một dự án lẫn chính bản thân. Điều tốt đẹp cần thời gian chín.",
  },
  {
    file: "04-emperor",
    name: "The Emperor",
    nameVi: "Hoàng Đế",
    keywords: ["Kỷ luật", "Cấu trúc", "Bảo vệ"],
    meaning:
      "Bạn đang cần ranh giới rõ hơn là thêm cảm hứng. Dựng khung trước, tự do sẽ tới sau.",
  },
  {
    file: "05-hierophant",
    name: "The Hierophant",
    nameVi: "Giáo Hoàng",
    keywords: ["Truyền thống", "Học hỏi", "Cố vấn"],
    meaning:
      "Có người đã đi qua con đường này rồi. Hỏi một lời khuyên đúng chỗ sẽ tiết kiệm cho bạn nhiều tháng.",
  },
  {
    file: "06-lovers",
    name: "The Lovers",
    nameVi: "Tình Nhân",
    keywords: ["Lựa chọn", "Kết nối", "Giá trị"],
    meaning:
      "Một quyết định đang chờ, và nó không chỉ là chọn cái nào — mà là chọn con người nào bạn muốn trở thành.",
  },
  {
    file: "07-chariot",
    name: "The Chariot",
    nameVi: "Cỗ Xe",
    keywords: ["Quyết tâm", "Tiến tới", "Kiểm soát"],
    meaning:
      "Hai lực đang kéo bạn về hai phía. Nắm cương cả hai, đừng bỏ bên nào, rồi nhắm thẳng một hướng.",
  },
  {
    file: "08-strength",
    name: "Strength",
    nameVi: "Sức Mạnh",
    keywords: ["Kiên nhẫn", "Ôn hoà", "Can đảm"],
    meaning:
      "Sức mạnh thật nằm ở chỗ dịu dàng với thứ đang làm bạn sợ, chứ không phải ở chỗ áp đảo nó.",
  },
  {
    file: "09-hermit",
    name: "The Hermit",
    nameVi: "Ẩn Sĩ",
    keywords: ["Nội tâm", "Tách biệt", "Soi sáng"],
    meaning:
      "Rút lui một chút không phải là bỏ cuộc. Bạn cần khoảng trống để thấy rõ mình đang đi đâu.",
  },
  {
    file: "10-wheel-of-fortune",
    name: "Wheel of Fortune",
    nameVi: "Bánh Xe Vận Mệnh",
    keywords: ["Chuyển biến", "Chu kỳ", "Thời cơ"],
    meaning:
      "Guồng quay vừa đổi chiều. Thứ tưởng đã đóng lại có thể mở ra theo cách bạn không tính trước.",
  },
  {
    file: "11-justice",
    name: "Justice",
    nameVi: "Công Lý",
    keywords: ["Cân bằng", "Sự thật", "Trách nhiệm"],
    meaning:
      "Mọi lựa chọn đều có cái giá của nó. Nhìn thẳng vào phần mình đã góp vào tình huống này.",
  },
  {
    file: "12-hanged-man",
    name: "The Hanged Man",
    nameVi: "Người Treo Ngược",
    keywords: ["Buông bỏ", "Đổi góc nhìn", "Chờ đợi"],
    meaning:
      "Càng cố thì càng kẹt. Thử lật ngược vấn đề, hoặc đơn giản là để nó yên thêm một thời gian.",
  },
  {
    file: "13-death",
    name: "Death",
    nameVi: "Cái Chết",
    keywords: ["Kết thúc", "Lột xác", "Tái sinh"],
    meaning:
      "Không phải điềm xấu. Có một thứ đã hết vai trò trong đời bạn, và giữ nó lại mới là điều đáng lo.",
  },
  {
    file: "14-temperance",
    name: "Temperance",
    nameVi: "Tiết Độ",
    keywords: ["Điều hoà", "Kiên trì", "Trung dung"],
    meaning:
      "Pha đúng liều lượng quan trọng hơn làm thật nhiều. Chậm và đều sẽ đưa bạn tới xa hơn.",
  },
  {
    file: "15-devil",
    name: "The Devil",
    nameVi: "Ác Quỷ",
    keywords: ["Ràng buộc", "Cám dỗ", "Thói quen"],
    meaning:
      "Sợi xích lỏng hơn bạn tưởng. Gọi tên đúng thứ đang giữ chân mình là đã đi được nửa đường.",
  },
  {
    file: "16-tower",
    name: "The Tower",
    nameVi: "Toà Tháp",
    keywords: ["Đổ vỡ", "Bừng tỉnh", "Giải phóng"],
    meaning:
      "Một điều đang sụp, và nó sụp vì móng vốn đã yếu. Dọn dẹp xong, chỗ đó sẽ xây được thứ vững hơn.",
  },
  {
    file: "17-star",
    name: "The Star",
    nameVi: "Ngôi Sao",
    keywords: ["Hy vọng", "Chữa lành", "Thanh thản"],
    meaning:
      "Sau một quãng mệt, bầu trời đang quang trở lại. Cho phép mình tin lần nữa, nhẹ nhàng thôi.",
  },
  {
    file: "18-moon",
    name: "The Moon",
    nameVi: "Mặt Trăng",
    keywords: ["Mơ hồ", "Lo âu", "Tiềm thức"],
    meaning:
      "Chưa nhìn rõ thì đừng vội kết luận. Phần lớn nỗi sợ lúc này đến từ tưởng tượng chứ không từ sự thật.",
  },
  {
    file: "19-sun",
    name: "The Sun",
    nameVi: "Mặt Trời",
    keywords: ["Niềm vui", "Thành công", "Rõ ràng"],
    meaning:
      "Mọi thứ sáng rõ và bạn xứng đáng tận hưởng. Đừng vội tìm xem có gì sai — đôi khi tốt là tốt thật.",
  },
  {
    file: "20-judgement",
    name: "Judgement",
    nameVi: "Phán Xét",
    keywords: ["Thức tỉnh", "Tổng kết", "Gọi mời"],
    meaning:
      "Một lời gọi từ bên trong đang vang lên. Nhìn lại chặng đã qua rồi quyết định điều thật sự quan trọng.",
  },
  {
    file: "21-world",
    name: "The World",
    nameVi: "Thế Giới",
    keywords: ["Hoàn tất", "Trọn vẹn", "Chương mới"],
    meaning:
      "Một vòng đã khép trọn vẹn. Ăn mừng trước đã, rồi hãy nghĩ tới điều tiếp theo.",
  },
];

/**
 * Lá bài của ngày hôm nay.
 *
 * Chọn theo NGÀY chứ không ngẫu nhiên mỗi lần render: cùng một ngày thì server
 * và client cho ra cùng một lá nên không gây hydration mismatch, và người dùng
 * quay lại trong ngày vẫn thấy đúng lá của mình — đó mới là "lá bài hôm nay".
 */
export function getDailyCard(date = new Date()): TarotCard {
  const key =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return MAJOR_ARCANA[key % MAJOR_ARCANA.length];
}
