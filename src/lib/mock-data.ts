export interface Reader {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviews: number;
  pricePer15m: number;
  specialties: string[];
  bio: string;
  avatar: string;
  availability: string[];
}

export const READERS: Reader[] = [
  {
    id: "r1",
    name: "Mystic Selene",
    title: "Chuyên gia Tarot",
    rating: 4.9,
    reviews: 168,
    pricePer15m: 150000,
    specialties: ["Tình duyên", "Sự nghiệp", "Tâm linh"],
    bio: "Dẫn lối bằng trực giác và ánh sáng vũ trụ. Hơn 10 năm kinh nghiệm.",
    avatar: "🌙",
    availability: ["10:00", "10:30", "11:00", "14:00", "15:30", "20:00"],
  },
  {
    id: "r2",
    name: "Astra Vega",
    title: "Chuyên gia Chiêm tinh",
    rating: 4.8,
    reviews: 124,
    pricePer15m: 200000,
    specialties: ["Bản đồ sao", "Vận hạn", "Tương hợp"],
    bio: "Đọc vị các vì sao - nơi định mệnh được khắc ghi từ khoảnh khắc bạn sinh ra.",
    avatar: "✨",
    availability: ["09:00", "11:30", "13:00", "16:00", "19:00", "21:00"],
  },
];

export const TAROT_DECK = [
  "The Fool", "The Magician", "The High Priestess", "The Empress",
  "The Emperor", "The Hierophant", "The Lovers", "The Chariot",
  "Strength", "The Hermit", "Wheel of Fortune", "Justice",
  "The Hanged Man", "Death", "Temperance", "The Devil",
  "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World",
];

export const TAROT_MEANINGS: Record<string, string> = {
  "The Moon": "Trực giác mạnh mẽ, ẩn số chờ được khám phá. Hãy lắng nghe tiếng nói nội tâm.",
  "The Sun": "Niềm vui rạng rỡ, thành công đang đến gần. Năng lượng tích cực bao quanh bạn.",
  "The Star": "Hy vọng và sự chữa lành. Một giai đoạn mới đầy cảm hứng đang mở ra.",
  "The Lovers": "Sự lựa chọn quan trọng về tình cảm hoặc giá trị bản thân.",
  "The Tower": "Biến động lớn nhưng cần thiết - dọn đường cho điều tốt đẹp hơn.",
  "Strength": "Sức mạnh nội tâm và lòng can đảm sẽ giúp bạn vượt qua thử thách.",
  "The Empress": "Sự nuôi dưỡng, sáng tạo và phong phú đang nở rộ trong cuộc sống.",
  "The Magician": "Bạn có đủ công cụ để biến ý định thành hiện thực. Hãy hành động.",
};

export function getCardMeaning(card: string): string {
  return TAROT_MEANINGS[card] || "Lá bài mang thông điệp riêng dành cho bạn ở thời điểm này. Hãy thiền định để đón nhận.";
}

export function pickThreeCards(): string[] {
  const shuffled = [...TAROT_DECK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}
