import { useMemo } from "react";

/**
 * Artwork sinh sẵn cho sản phẩm chưa có ảnh chụp.
 *
 * Vì sao vẽ SVG tại chỗ thay vì dùng ảnh ngoài: shop mới dựng nên chưa có
 * ảnh thật, mà hotlink ảnh stock thì phụ thuộc mạng, dễ chết link và vướng
 * bản quyền. SVG sinh theo slug thì luôn hiển thị được, nhẹ, sắc nét ở mọi
 * độ phân giải, và giữ đúng tông vàng - tím của app.
 *
 * Khi có ảnh thật, chỉ cần điền products.image_url ở BE là component này tự
 * nhường chỗ (xem chỗ gọi).
 */

type Motif = "tarot" | "lenormand" | "oracle" | "stone" | "accessory";

/** Suy ra motif từ slug danh mục; mặc định về tarot. */
function motifOf(categorySlug: string | null | undefined): Motif {
  switch (categorySlug) {
    case "bai-lenormand":
      return "lenormand";
    case "bai-oracle":
      return "oracle";
    case "da-khoang":
      return "stone";
    case "phu-kien":
      return "accessory";
    default:
      return "tarot";
  }
}

/** Hash chuỗi ổn định -> dùng làm seed, để mỗi sản phẩm một sắc thái riêng. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
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

export function ProductArtwork({
  slug,
  categorySlug,
  className,
}: {
  slug: string;
  categorySlug?: string | null;
  className?: string;
}) {
  const motif = motifOf(categorySlug);

  const { stars, hueShift, uid, tilt, scale, orbit } = useMemo(() => {
    const seed = hash(slug);
    const rand = mulberry32(seed);
    return {
      // Vài ngôi sao rải rác, cố định theo slug nên không nhấp nháy khi
      // re-render và không lệch giữa SSR với client.
      stars: Array.from({ length: 14 }, () => ({
        x: rand() * 200,
        y: rand() * 150,
        r: rand() * 1.1 + 0.3,
        o: rand() * 0.5 + 0.25,
      })),
      // Xoay tông tím, nghiêng và phóng to nhẹ, cộng thêm số chấm trên vòng
      // quanh hoạ tiết — để hai sản phẩm cùng danh mục đứng cạnh nhau vẫn
      // phân biệt được bằng mắt chứ không trông như nhân bản.
      hueShift: Math.round((seed % 46) - 23),
      tilt: ((seed >> 3) % 17) - 8,
      scale: 0.88 + ((seed >> 7) % 25) / 100,
      orbit: 5 + ((seed >> 11) % 4),
      // id duy nhất cho gradient, tránh đụng khi nhiều SVG cùng trang.
      uid: `pa${seed.toString(36)}`,
    };
  }, [slug]);

  return (
    <svg
      viewBox="0 0 200 150"
      role="img"
      aria-label="Hình minh hoạ sản phẩm"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop
            offset="0%"
            stopColor={`hsl(${268 + hueShift} 45% 18%)`}
          />
          <stop
            offset="55%"
            stopColor={`hsl(${280 + hueShift} 50% 12%)`}
          />
          <stop
            offset="100%"
            stopColor={`hsl(${292 + hueShift} 40% 9%)`}
          />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="rgba(226,183,92,0.30)" />
          <stop offset="100%" stopColor="rgba(226,183,92,0)" />
        </radialGradient>
      </defs>

      <rect width="200" height="150" fill={`url(#${uid}-bg)`} />
      <rect width="200" height="150" fill={`url(#${uid}-glow)`} />

      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#e2b75c"
          opacity={s.o}
        />
      ))}

      {/* Khung viền kiểu lưng bài */}
      <rect
        x="10"
        y="8"
        width="180"
        height="134"
        rx="7"
        fill="none"
        stroke="rgba(226,183,92,0.45)"
        strokeWidth="0.9"
      />
      <rect
        x="14.5"
        y="12.5"
        width="171"
        height="125"
        rx="5"
        fill="none"
        stroke="rgba(226,183,92,0.20)"
        strokeWidth="0.6"
      />

      <g
        transform={`translate(100 75) rotate(${tilt}) scale(${scale})`}
        fill="none"
        stroke="#e2b75c"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Vòng chấm quanh hoạ tiết, số chấm đổi theo sản phẩm. */}
        {Array.from({ length: orbit }, (_, i) => {
          const a = (i * 2 * Math.PI) / orbit - Math.PI / 2;
          return (
            <circle
              key={i}
              cx={Math.cos(a) * 52}
              cy={Math.sin(a) * 52}
              r="1.5"
              fill="#e2b75c"
              stroke="none"
              opacity="0.55"
            />
          );
        })}
        <Motif kind={motif} />
      </g>
    </svg>
  );
}

/** Hoạ tiết trung tâm theo từng dòng sản phẩm. */
function Motif({ kind }: { kind: Motif }) {
  switch (kind) {
    // Mặt trời toả tia — biểu tượng quen thuộc của bộ bài Tarot.
    case "tarot":
      return (
        <>
          <circle r="17" opacity="0.9" />
          <circle r="24" opacity="0.28" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return (
              <line
                key={i}
                x1={Math.cos(a) * 29}
                y1={Math.sin(a) * 29}
                x2={Math.cos(a) * 38}
                y2={Math.sin(a) * 38}
                opacity="0.65"
              />
            );
          })}
          <path d="M0 -8 L2.4 -2.4 L8 0 L2.4 2.4 L0 8 L-2.4 2.4 L-8 0 L-2.4 -2.4 Z" fill="#e2b75c" stroke="none" />
        </>
      );

    // Chìa khoá — lá Key, một trong những lá đặc trưng của Lenormand.
    case "lenormand":
      return (
        <>
          <circle cy="-20" r="11" opacity="0.9" />
          <circle cy="-20" r="4.5" opacity="0.5" />
          <line x1="0" y1="-9" x2="0" y2="30" opacity="0.9" />
          <line x1="0" y1="20" x2="11" y2="20" opacity="0.9" />
          <line x1="0" y1="28" x2="8" y2="28" opacity="0.9" />
          <circle cx="-26" cy="6" r="1.6" fill="#e2b75c" stroke="none" opacity="0.7" />
          <circle cx="26" cy="6" r="1.6" fill="#e2b75c" stroke="none" opacity="0.7" />
        </>
      );

    // Các pha trăng — Oracle thường gắn với chu kỳ mặt trăng.
    case "oracle":
      return (
        <>
          <circle cx="-34" cy="0" r="7" opacity="0.55" />
          <path d="M-12 -13 A13 13 0 1 0 -12 13 A9 13 0 1 1 -12 -13 Z" opacity="0.85" />
          <circle cx="18" cy="0" r="15" opacity="0.95" />
          <circle cx="18" cy="0" r="15" fill="rgba(226,183,92,0.14)" stroke="none" />
          <circle cx="45" cy="0" r="7" opacity="0.55" />
          <line x1="-52" y1="26" x2="52" y2="26" opacity="0.3" />
        </>
      );

    // Trụ tinh thể — cho nhóm đá và khoáng.
    case "stone":
      return (
        <>
          <path d="M0 -34 L17 -8 L11 30 L-11 30 L-17 -8 Z" opacity="0.95" />
          <path d="M0 -34 L0 30" opacity="0.45" />
          <path d="M-17 -8 L0 -2 L17 -8" opacity="0.45" />
          <path d="M-30 20 L-22 4 L-16 20 Z" opacity="0.5" />
          <path d="M30 20 L22 4 L16 20 Z" opacity="0.5" />
          <line x1="-40" y1="30" x2="40" y2="30" opacity="0.35" />
        </>
      );

    // Nến và khói — nhóm phụ kiện nghi thức.
    case "accessory":
      return (
        <>
          <path d="M-13 -4 L13 -4 L13 30 L-13 30 Z" opacity="0.9" />
          <line x1="-13" y1="4" x2="13" y2="4" opacity="0.4" />
          <line x1="0" y1="-4" x2="0" y2="-11" opacity="0.8" />
          <path
            d="M0 -34 C7 -27 7 -20 0 -13 C-7 -20 -7 -27 0 -34 Z"
            fill="rgba(226,183,92,0.35)"
          />
          <path d="M-24 30 L24 30" opacity="0.35" />
          <path d="M-30 -18 C-26 -24 -32 -28 -28 -34" opacity="0.35" />
          <path d="M28 -18 C32 -24 26 -28 30 -34" opacity="0.35" />
        </>
      );
  }
}
