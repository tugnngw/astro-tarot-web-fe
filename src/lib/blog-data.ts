export interface BlogPost {
  slug: string;
  title: string;
  category: "Tarot" | "Astrology" | "Spiritual" | "Healing";
  date: string;
  author: string;
  color: string;
  emoji: string;
  excerpt: string;
  content: string;
  featured?: boolean;
}

export const POSTS: BlogPost[] = [
  {
    slug: "trang-tron-thang-6",
    title: "Trăng Tròn Tháng 6: Cánh Cửa Năng Lượng Mở Ra",
    category: "Astrology",
    date: "01/06/2026",
    author: "Ngọc Anh",
    color: "#a78bfa",
    emoji: "🌕",
    featured: true,
    excerpt: "Trăng tròn tháng 6 mang đến luồng năng lượng chuyển hoá mạnh mẽ — thời điểm vàng để buông bỏ và đón nhận.",
    content:
      "Trăng tròn tháng 6 năm 2026 rơi vào cung Nhân Mã, mang đến một làn sóng năng lượng mạnh mẽ thúc đẩy chúng ta vượt qua những giới hạn cũ.\n\nĐây là thời điểm hoàn hảo để nhìn lại nửa đầu năm: điều gì cần được buông bỏ, điều gì xứng đáng được giữ lại. Năng lượng Nhân Mã khích lệ bạn mở rộng tầm nhìn, đặt ra những mục tiêu táo bạo hơn.\n\nNghi thức gợi ý:\n• Thắp một ngọn nến trắng dưới ánh trăng.\n• Viết 3 điều bạn biết ơn, 3 điều bạn sẵn sàng buông.\n• Thiền 10 phút, hình dung ánh trăng tẩy rửa năng lượng cũ.\n\nHãy nhớ: mỗi kỳ trăng tròn là một cánh cửa. Bạn chỉ cần đủ can đảm để bước qua.",
  },
  {
    slug: "tarot-3-la-tuan-moi",
    title: "Tarot 3 lá: Đọc vị tuần mới của bạn",
    category: "Tarot",
    date: "01/06/2026",
    author: "Quang Duy",
    color: "#facc15",
    emoji: "🃏",
    excerpt: "Một trải bài 3 lá đơn giản giúp bạn nhìn rõ quá khứ - hiện tại - tương lai của tuần này.",
    content:
      "Trải bài 3 lá là phương pháp Tarot kinh điển — đơn giản nhưng sâu sắc.\n\nLá 1 (Quá khứ): Những gì đã định hình tuần trước của bạn.\nLá 2 (Hiện tại): Năng lượng và thách thức ngay lúc này.\nLá 3 (Tương lai): Hướng đi tiềm năng nếu bạn duy trì quỹ đạo hiện tại.\n\nMẹo: trước khi rút bài, hít sâu 3 lần, đặt câu hỏi rõ ràng. Đừng hỏi câu Yes/No — hãy hỏi 'Tôi cần biết gì về…'.\n\nTarot không tiên đoán định mệnh. Nó là tấm gương phản chiếu trực giác bạn đã có sẵn.",
  },
  {
    slug: "thien-chakra-co-ban",
    title: "Thiền Chakra cho người mới bắt đầu",
    category: "Healing",
    date: "31/05/2026",
    author: "Bảo Trân",
    color: "#34d399",
    emoji: "🧘",
    excerpt: "7 luân xa — 7 cánh cửa năng lượng. Hướng dẫn thiền 15 phút giúp cân bằng cơ thể vi tế.",
    content:
      "Hệ thống 7 luân xa (Chakra) chạy dọc cột sống, từ gốc đến đỉnh đầu, mỗi luân xa tương ứng một khía cạnh của đời sống.\n\n1. Muladhara (đỏ) — gốc, sự an toàn.\n2. Svadhisthana (cam) — xương chậu, cảm xúc.\n3. Manipura (vàng) — đám rối, ý chí.\n4. Anahata (xanh lá) — tim, tình yêu.\n5. Vishuddha (xanh lam) — cổ họng, biểu đạt.\n6. Ajna (chàm) — trán, trực giác.\n7. Sahasrara (tím) — đỉnh đầu, kết nối vũ trụ.\n\nThiền 2 phút mỗi luân xa, hình dung màu sắc xoay tròn rực rỡ. Kết thúc bằng việc đặt tay lên tim, cảm ơn cơ thể.",
  },
  {
    slug: "than-so-hoc-duong-doi",
    title: "Thần số học: Ý nghĩa con số đường đời",
    category: "Spiritual",
    date: "31/05/2026",
    author: "Ngọc Anh",
    color: "#67e8f9",
    emoji: "✨",
    excerpt: "Con số đường đời tiết lộ bài học và sứ mệnh bạn mang theo trong kiếp này.",
    content:
      "Số đường đời = tổng các chữ số ngày tháng năm sinh, rút gọn về 1 chữ số (trừ 11, 22, 33 là Master Numbers).\n\nVí dụ: 15/07/1995 = 1+5+0+7+1+9+9+5 = 37 = 3+7 = 10 = 1.\n\nÝ nghĩa rút gọn:\n• Số 1: Người tiên phong, độc lập.\n• Số 2: Người kết nối, ngoại giao.\n• Số 3: Người sáng tạo, biểu đạt.\n• Số 4: Người xây dựng, kỷ luật.\n• Số 5: Người tự do, phiêu lưu.\n• Số 6: Người chăm sóc, hài hoà.\n• Số 7: Người tìm kiếm, trí tuệ.\n• Số 8: Người quyền lực, tài chính.\n• Số 9: Người nhân đạo, hoàn tất.\n\nĐường đời không giới hạn bạn — nó chỉ gợi mở dòng chảy tự nhiên nhất của bạn.",
  },
  {
    slug: "sao-thuy-nghich-hanh",
    title: "Sao Thủy nghịch hành — Cẩm nang sinh tồn",
    category: "Astrology",
    date: "30/05/2026",
    author: "Quang Duy",
    color: "#fb923c",
    emoji: "☿",
    excerpt: "Mỗi năm 3-4 lần, Sao Thủy nghịch hành khiến giao tiếp - công nghệ - di chuyển trục trặc. Đây là cách vượt qua.",
    content:
      "Sao Thủy cai quản giao tiếp, hợp đồng, công nghệ và di chuyển. Khi nó 'nghịch hành' (retrograde), những lĩnh vực này dễ rối loạn.\n\nNên làm:\n• Re-: Review, Reflect, Revise, Reconnect.\n• Backup dữ liệu, kiểm tra email kỹ trước khi gửi.\n• Hoà giải mâu thuẫn cũ — người xưa có xu hướng quay lại.\n\nNên tránh:\n• Ký hợp đồng quan trọng (nếu phải ký, đọc cực kỹ).\n• Mua thiết bị điện tử lớn.\n• Khởi động dự án mới.\n\nĐừng sợ hãi — đây là 3 tuần để chậm lại, không phải 3 tuần để dừng sống.",
  },
];

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);
