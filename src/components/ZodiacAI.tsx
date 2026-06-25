import { useState } from "react";

const ZODIACS = [
  { name: "Bạch Dương", symbol: "♈", color: "#ff5e62", hue: 10 },
  { name: "Kim Ngưu", symbol: "♉", color: "#7bd389", hue: 130 },
  { name: "Song Tử", symbol: "♊", color: "#f7d154", hue: 50 },
  { name: "Cự Giải", symbol: "♋", color: "#9ad3ff", hue: 210 },
  { name: "Sư Tử", symbol: "♌", color: "#ffb347", hue: 30 },
  { name: "Xử Nữ", symbol: "♍", color: "#b0e57c", hue: 90 },
  { name: "Thiên Bình", symbol: "♎", color: "#f6a6c2", hue: 330 },
  { name: "Bọ Cạp", symbol: "♏", color: "#c084fc", hue: 280 },
  { name: "Nhân Mã", symbol: "♐", color: "#fb923c", hue: 25 },
  { name: "Ma Kết", symbol: "♑", color: "#94a3b8", hue: 220 },
  { name: "Bảo Bình", symbol: "♒", color: "#67e8f9", hue: 190 },
  { name: "Song Ngư", symbol: "♓", color: "#a78bfa", hue: 270 },
];

export function ZodiacAI() {
  const [z, setZ] = useState(ZODIACS[0]);
  return (
    <div
      className="glass relative overflow-hidden rounded-3xl p-8 transition-all duration-500"
      style={{
        boxShadow: `0 0 80px -20px ${z.color}80`,
        borderColor: `${z.color}55`,
      }}
    >
      <div
        className="absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-30 transition-all duration-700"
        style={{ background: z.color }}
      />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
        <div
          className="grid h-32 w-32 shrink-0 place-items-center rounded-3xl text-6xl transition-all duration-500"
          style={{
            background: `linear-gradient(135deg, ${z.color}33, transparent)`,
            border: `1px solid ${z.color}`,
            color: z.color,
            boxShadow: `0 0 40px ${z.color}55`,
          }}
        >
          {z.symbol}
        </div>
        <div className="flex-1">
          <div
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: z.color }}
          >
            AI Zodiac Oracle
          </div>
          <h3 className="mt-2 font-display text-3xl text-gradient-gold">
            Xin chào {z.name} — Năng lượng kết nối
          </h3>
          <p className="mt-2 text-muted-foreground">
            AI Zodiac Oracle phân tích cung hoàng đạo của bạn và đưa ra gợi ý cá
            nhân hoá về tình duyên, sự nghiệp và năng lượng nội tâm.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <select
              value={z.name}
              onChange={(e) =>
                setZ(
                  ZODIACS.find((x) => x.name === e.target.value) || ZODIACS[0],
                )
              }
              className="rounded-full border border-gold/40 bg-input/70 px-4 py-2 text-sm text-foreground outline-none"
            >
              {ZODIACS.map((x) => (
                <option key={x.name} value={x.name}>
                  {x.symbol} {x.name}
                </option>
              ))}
            </select>
            <button
              className="rounded-full px-6 py-2 text-sm font-medium text-primary-foreground transition hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${z.color}, var(--gold))`,
                boxShadow: `0 0 25px ${z.color}80`,
              }}
            >
              Dùng AI ngay ✦
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
