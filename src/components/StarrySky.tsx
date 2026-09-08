import { useMemo } from "react";

/**
 * Bầu trời sao toàn cục — lớp nền của cả app.
 *
 * Thay cho cách cũ: mỗi trang tự đặt một <StarField> nằm `absolute inset-0`
 * bên trong khung của trang đó, nên sao chỉ phủ phần thân trang, dừng lại khi
 * cuộn, và mỗi trang một mật độ khác nhau. Lớp này `fixed` nên phủ trọn khung
 * nhìn, luôn ở đó, và chỉ dựng một lần ở root.
 *
 * Chia ba tầng độ sâu để bầu trời có chiều: tầng xa nhiều sao nhỏ mờ nhấp
 * nháy chậm, tầng giữa vừa, tầng gần ít sao to có quầng sáng và nháy nhanh
 * hơn. Mắt đọc ra chiều sâu từ chênh lệch đó.
 *
 * Mọi vị trí đều sinh từ seed cố định nên server và client dựng ra y hệt —
 * dùng Math.random() ở đây sẽ gây hydration mismatch (đã dính lỗi này trước).
 */

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeLayer(
  seed: number,
  count: number,
  sizeRange: [number, number],
  opacityRange: [number, number],
  durationRange: [number, number],
): Star[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: sizeRange[0] + rand() * (sizeRange[1] - sizeRange[0]),
    opacity: opacityRange[0] + rand() * (opacityRange[1] - opacityRange[0]),
    duration: durationRange[0] + rand() * (durationRange[1] - durationRange[0]),
    // Lệch pha để cả bầu trời không nháy đồng loạt.
    delay: rand() * 8,
  }));
}

export function StarrySky() {
  const { far, mid, near } = useMemo(
    () => ({
      far: makeLayer(1337, 110, [0.8, 1.4], [0.18, 0.45], [5, 9]),
      mid: makeLayer(7331, 55, [1.3, 2], [0.35, 0.7], [3.5, 6]),
      near: makeLayer(9137, 16, [2.2, 3.2], [0.7, 1], [2.5, 4.5]),
    }),
    [],
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
    >
      {/* Vài vệt sáng rất mờ cho bầu trời khỏi chết cứng. Để độ mờ thật thấp
          vì nền phải giữ được cảm giác đen. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 35% at 18% 22%, oklch(0.35 0.13 300 / 0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 82% 72%, oklch(0.32 0.11 265 / 0.09) 0%, transparent 70%)",
        }}
      />

      {[far, mid, near].map((layer, li) => (
        <div key={li} className="absolute inset-0">
          {layer.map((s, i) => (
            <span
              key={i}
              className="star absolute rounded-full bg-white"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                // Chỉ tầng gần mới có quầng — rải quầng khắp nơi thì bầu trời
                // bị đục, mất cảm giác đen sâu.
                boxShadow:
                  li === 2
                    ? `0 0 ${s.size * 3}px ${s.size * 0.8}px rgba(255,255,255,0.35)`
                    : undefined,
                // Biến CSS để keyframes biết đỉnh sáng của từng ngôi sao.
                ["--star-opacity" as string]: s.opacity,
                animationDuration: `${s.duration}s`,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
