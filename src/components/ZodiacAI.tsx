import { useId, useState } from "react";
import { Link } from "@tanstack/react-router";

/**
 * Bảng màu theo 4 nguyên tố của chiêm tinh (Lửa, Đất, Khí, Nước) thay vì mỗi
 * cung một màu tự do.
 *
 * Bảng cũ dùng đỏ #ff5e62, xanh lá #7bd389, cyan #67e8f9... — bão hoà và trải
 * khắp vòng màu, đặt trên nền tím đậm thì chói và phá tông vàng - tím của cả
 * trang. Bốn tông dưới đây đều hạ độ bão hoà và nằm trong họ vàng - hổ phách -
 * xanh mực - tím, nên vẫn phân biệt được cung mà không đánh nhau với giao diện.
 * Gom theo nguyên tố cũng đúng với cách chiêm tinh vẫn phân nhóm.
 */
const ELEMENTS = {
  fire: { label: "Lửa", color: "#e0a154" },
  earth: { label: "Đất", color: "#b0a475" },
  air: { label: "Khí", color: "#9fb0dd" },
  water: { label: "Nước", color: "#a68fd4" },
} as const;

type ElementKey = keyof typeof ELEMENTS;

const ZODIACS: {
  name: string;
  symbol: string;
  element: ElementKey;
}[] = [
  { name: "Bạch Dương", symbol: "♈", element: "fire" },
  { name: "Kim Ngưu", symbol: "♉", element: "earth" },
  { name: "Song Tử", symbol: "♊", element: "air" },
  { name: "Cự Giải", symbol: "♋", element: "water" },
  { name: "Sư Tử", symbol: "♌", element: "fire" },
  { name: "Xử Nữ", symbol: "♍", element: "earth" },
  { name: "Thiên Bình", symbol: "♎", element: "air" },
  { name: "Bọ Cạp", symbol: "♏", element: "water" },
  { name: "Nhân Mã", symbol: "♐", element: "fire" },
  { name: "Ma Kết", symbol: "♑", element: "earth" },
  { name: "Bảo Bình", symbol: "♒", element: "air" },
  { name: "Song Ngư", symbol: "♓", element: "water" },
];

export function ZodiacAI() {
  const [z, setZ] = useState(ZODIACS[0]);
  const element = ELEMENTS[z.element];
  const accent = element.color;
  const selectId = useId();
  return (
    <div
      className="glass relative overflow-hidden rounded-3xl p-8 transition-all duration-500"
      style={{
        boxShadow: `0 0 80px -20px ${accent}80`,
        borderColor: `${accent}55`,
      }}
    >
      <div
        className="absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-30 transition-all duration-700"
        style={{ background: accent }}
      />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
        <div
          className="grid h-32 w-32 shrink-0 place-items-center rounded-3xl text-6xl transition-all duration-500"
          style={{
            background: `linear-gradient(135deg, ${accent}33, transparent)`,
            border: `1px solid ${accent}`,
            color: accent,
            boxShadow: `0 0 40px ${accent}55`,
          }}
        >
          {z.symbol}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: accent }}
            >
              AI Zodiac Oracle
            </span>
            <span
              className="rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em]"
              style={{ borderColor: `${accent}66`, color: accent }}
            >
              Nguyên tố {element.label}
            </span>
          </div>
          <h3 className="mt-2 font-display text-3xl text-gradient-gold">
            Xin chào {z.name} — Năng lượng kết nối
          </h3>
          <p className="mt-2 text-muted-foreground">
            AI Zodiac Oracle phân tích cung hoàng đạo của bạn và đưa ra gợi ý cá
            nhân hoá về tình duyên, sự nghiệp và năng lượng nội tâm.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label htmlFor={selectId} className="sr-only">
              Chọn cung hoàng đạo
            </label>
            <select
              id={selectId}
              value={z.name}
              onChange={(e) =>
                setZ(
                  ZODIACS.find((x) => x.name === e.target.value) || ZODIACS[0],
                )
              }
              className="rounded-full border border-gold/40 bg-input/70 px-4 py-2 text-sm text-foreground outline-none transition focus:border-gold"
            >
              {ZODIACS.map((x) => (
                <option key={x.name} value={x.name}>
                  {x.symbol} {x.name}
                </option>
              ))}
            </select>
            {/* Trước đây đây là <button> không có onClick — một CTA nổi bật
                mà bấm vào không xảy ra gì. Cho nó dẫn thẳng sang trang Tarot AI. */}
            <Link
              to="/tarot"
              className="rounded-full bg-gold px-6 py-2 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-105"
            >
              Dùng AI ngay ✦
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
