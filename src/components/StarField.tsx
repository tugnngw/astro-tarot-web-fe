import { useMemo } from "react";

/**
 * PRNG tất định (mulberry32).
 * Math.random() làm server và client sinh ra hai bộ toạ độ khác nhau
 * -> React báo "Hydration failed because the server rendered text
 * that didn't match the client". Seed theo index để cả hai phía
 * dựng ra cùng một bầu sao, vẫn trông ngẫu nhiên.
 */
function seededRandom(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function StarField({
  count = 60,
  seed = 1,
}: {
  count?: number;
  /** Đổi seed nếu muốn hai StarField trên cùng một trang có bố cục khác nhau. */
  seed?: number;
}) {
  const stars = useMemo(() => {
    const rand = seededRandom(seed * 9973 + count);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      size: rand() * 2 + 0.5,
      delay: rand() * 3,
    }));
  }, [count, seed]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-gold-soft animate-twinkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
