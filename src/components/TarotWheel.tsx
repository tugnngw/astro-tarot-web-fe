import { useState } from "react";

/**
 * Vòng 22 lá Ẩn Chính xoay chậm — nền trang trí cho hero.
 *
 * Ảnh là bộ Rider-Waite-Smith 1909, đã hết hạn bản quyền (public domain),
 * tải từ Wikimedia Commons về public/tarot/ ở bản 220px cho nhẹ. Trước đây
 * chỗ này chỉ vẽ lưng bài với một biểu tượng, nhìn không ra bài Tarot.
 *
 * Rê chuột vào một lá thì cả vòng dừng lại và lá đó sáng lên — để người dùng
 * kịp nhìn lá mình đang quan tâm thay vì phải đuổi theo vòng xoay.
 */

/** Thứ tự đúng của 22 lá Ẩn Chính, khớp tên file trong public/tarot. */
const CARDS = [
  { file: "00-fool", name: "The Fool" },
  { file: "01-magician", name: "The Magician" },
  { file: "02-high-priestess", name: "The High Priestess" },
  { file: "03-empress", name: "The Empress" },
  { file: "04-emperor", name: "The Emperor" },
  { file: "05-hierophant", name: "The Hierophant" },
  { file: "06-lovers", name: "The Lovers" },
  { file: "07-chariot", name: "The Chariot" },
  { file: "08-strength", name: "Strength" },
  { file: "09-hermit", name: "The Hermit" },
  { file: "10-wheel-of-fortune", name: "Wheel of Fortune" },
  { file: "11-justice", name: "Justice" },
  { file: "12-hanged-man", name: "The Hanged Man" },
  { file: "13-death", name: "Death" },
  { file: "14-temperance", name: "Temperance" },
  { file: "15-devil", name: "The Devil" },
  { file: "16-tower", name: "The Tower" },
  { file: "17-star", name: "The Star" },
  { file: "18-moon", name: "The Moon" },
  { file: "19-sun", name: "The Sun" },
  { file: "20-judgement", name: "Judgement" },
  { file: "21-world", name: "The World" },
];

export function TarotWheel({ className = "" }: { className?: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const paused = hovered !== null;

  return (
    // pointer-events-none ở gốc để vòng bài không nuốt cú bấm vào nút CTA ở
    // giữa hero; chỉ riêng từng lá được bật lại pointer-events.
    <div
      className={`pointer-events-none relative aspect-square ${className}`}
      aria-hidden="true"
    >
      <div
        className="animate-zodiac-slow absolute inset-0"
        style={{ animationPlayState: paused ? "paused" : "running" }}
      >
        {CARDS.map((card, i) => {
          const angle = (i * 360) / CARDS.length;
          const isHovered = hovered === i;
          return (
            // Mỗi lá nằm trong một lớp phủ kín vòng rồi xoay cả lớp quanh tâm.
            // Không dùng translateY(%) trên chính lá bài: phần trăm trong
            // transform tính theo kích thước CHÍNH nó, không phải bán kính
            // vòng, nên cả cỗ bài sẽ dồn vào giữa.
            <div
              key={card.file}
              className="absolute inset-0"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <div className="absolute left-1/2 top-0 -translate-x-1/2">
                <img
                  src={`/tarot/${card.file}.jpg`}
                  alt=""
                  decoding="async"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                  className="pointer-events-auto rounded-[5px] border border-gold/40 transition-[transform,opacity,box-shadow,border-color] duration-300"
                  style={{
                    // Chu vi vành khoảng 2400px với 22 lá -> mỗi lá được ~109px.
                    // Để lá rộng tới 104px thì chúng chạm nhau thành một bức
                    // tường kín, chữ tiêu đề ở giữa không đọc nổi. Giữ quanh
                    // 70px để còn khoảng thở giữa các lá.
                    width: "clamp(36px, 5vw, 72px)",
                    opacity: isHovered ? 1 : paused ? 0.3 : 0.55,
                    transform: isHovered ? "scale(1.28)" : "scale(1)",
                    boxShadow: isHovered
                      ? "0 0 26px -4px rgba(226,183,92,0.75)"
                      : "0 2px 10px -6px rgba(0,0,0,0.9)",
                    borderColor: isHovered
                      ? "rgba(226,183,92,0.95)"
                      : "rgba(226,183,92,0.35)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hai vòng tròn mảnh giữ nhịp cho vành bài. */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        fill="none"
        stroke="rgba(226,183,92,0.14)"
        strokeWidth="0.2"
      >
        <circle cx="50" cy="50" r="28" />
        <circle cx="50" cy="50" r="43" />
      </svg>
    </div>
  );
}
