import { useMemo } from "react";

/**
 * Vòng lá bài Tarot xoay chậm — nền trang trí cho hero.
 *
 * Thay cho ảnh bánh xe hoàng đạo trước đây. Ảnh đó là PNG có nền xanh đen
 * nên trên nền đen nó lộ nguyên khung chữ nhật, phải chắp vá bằng mask; vẽ
 * bằng DOM thì nền trong suốt thật, đổi màu theo tông được, và co giãn nét
 * căng ở mọi độ phân giải.
 *
 * Mỗi lá dựng đứng theo phương bán kính: xoay quanh tâm rồi đẩy ra ngoài,
 * nên cả vòng trông như một cỗ bài đang xoè.
 */

const CARD_COUNT = 22; // 22 lá Ẩn Chính của một bộ Tarot

/** PRNG tất định — không dùng Math.random() vì sẽ lệch giữa SSR và client. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function TarotWheel({ className = "" }: { className?: string }) {
  const cards = useMemo(() => {
    const rand = mulberry32(20260908);
    return Array.from({ length: CARD_COUNT }, (_, i) => ({
      angle: (i * 360) / CARD_COUNT,
      // Lệch nhẹ độ mờ và hoạ tiết để vòng bài không trông như in hàng loạt.
      opacity: 0.3 + rand() * 0.45,
      motif: Math.floor(rand() * 3),
      wobble: rand() * 3 - 1.5,
    }));
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative aspect-square ${className}`}
    >
      <div className="animate-zodiac-slow absolute inset-0">
        {cards.map((c, i) => (
          // Mỗi lá nằm trong một lớp phủ kín vòng rồi xoay cả lớp quanh tâm.
          // Không dùng translateY(%) trên chính lá bài: phần trăm của
          // transform tính theo kích thước CHÍNH nó, không phải bán kính
          // vòng, nên cả cỗ bài sẽ dồn hết vào giữa.
          <div
            key={i}
            className="absolute inset-0"
            style={{ transform: `rotate(${c.angle + c.wobble}deg)` }}
          >
            <div className="absolute left-1/2 top-0 -translate-x-1/2">
              <CardBack motif={c.motif} opacity={c.opacity} />
            </div>
          </div>
        ))}
      </div>

      {/* Hai vòng tròn mảnh giữ nhịp cho vành bài. */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        fill="none"
        stroke="rgba(226,183,92,0.16)"
        strokeWidth="0.2"
      >
        <circle cx="50" cy="50" r="30" />
        <circle cx="50" cy="50" r="46" />
      </svg>
    </div>
  );
}

/** Lưng một lá bài: khung bo góc, viền vàng, một hoạ tiết nhỏ ở giữa. */
function CardBack({ motif, opacity }: { motif: number; opacity: number }) {
  return (
    <svg
      viewBox="0 0 44 68"
      className="h-[9vmin] max-h-24 w-auto"
      style={{ opacity }}
    >
      <rect
        x="1.2"
        y="1.2"
        width="41.6"
        height="65.6"
        rx="4"
        fill="rgba(10,8,20,0.85)"
        stroke="rgba(226,183,92,0.75)"
        strokeWidth="1"
      />
      <rect
        x="4.5"
        y="4.5"
        width="35"
        height="59"
        rx="2.6"
        fill="none"
        stroke="rgba(226,183,92,0.35)"
        strokeWidth="0.6"
      />
      <g
        transform="translate(22 34)"
        fill="none"
        stroke="rgba(226,183,92,0.9)"
        strokeWidth="1"
        strokeLinecap="round"
      >
        {motif === 0 && (
          <>
            <circle r="7" />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4;
              return (
                <line
                  key={i}
                  x1={Math.cos(a) * 10}
                  y1={Math.sin(a) * 10}
                  x2={Math.cos(a) * 13.5}
                  y2={Math.sin(a) * 13.5}
                />
              );
            })}
          </>
        )}
        {motif === 1 && (
          <>
            <path d="M5 -11 A12 12 0 1 0 5 11 A9 12 0 1 1 5 -11 Z" />
            <circle cx="10" cy="-8" r="1.3" fill="rgba(226,183,92,0.9)" stroke="none" />
          </>
        )}
        {motif === 2 && (
          <path
            d="M0 -13 L3.4 -3.4 L13 0 L3.4 3.4 L0 13 L-3.4 3.4 L-13 0 L-3.4 -3.4 Z"
            fill="rgba(226,183,92,0.5)"
            stroke="rgba(226,183,92,0.9)"
          />
        )}
      </g>
    </svg>
  );
}
