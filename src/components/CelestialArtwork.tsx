import { useMemo } from "react";

/**
 * Artwork thiên văn sinh sẵn, dùng chung cho sản phẩm và bài viết.
 *
 * Vì sao vẽ SVG tại chỗ thay vì dùng ảnh: dự án chưa có ảnh thật, mà hotlink
 * ảnh stock thì phụ thuộc mạng, dễ chết link và vướng bản quyền; còn để emoji
 * phóng to (cách cũ của blog) thì mỗi hệ điều hành render một kiểu và không
 * ăn nhập với tông vàng - tím của app. SVG sinh theo seed thì luôn hiển thị,
 * nhẹ, sắc nét ở mọi độ phân giải và giữ đúng bảng màu.
 *
 * Mọi giá trị đều suy ra từ seed nên server và client dựng ra y hệt nhau,
 * không gây hydration mismatch.
 */

export type CelestialMotif =
  | "tarot"
  | "lenormand"
  | "oracle"
  | "stone"
  | "accessory"
  | "moon"
  | "cards"
  | "lotus"
  | "numerology";

const GOLD = "#e2b75c";

/** Hash chuỗi ổn định -> seed. */
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

export function CelestialArtwork({
  seed,
  motif,
  frame = true,
  className,
}: {
  /** Chuỗi bất kỳ (slug) — cùng chuỗi luôn cho ra cùng hình. */
  seed: string;
  motif: CelestialMotif;
  /** Khung viền kiểu lưng bài. Tắt cho ảnh bìa lớn để đỡ rối. */
  frame?: boolean;
  className?: string;
}) {
  const { stars, hueShift, uid, tilt, scale, orbit } = useMemo(() => {
    const n = hash(seed);
    const rand = mulberry32(n);
    return {
      stars: Array.from({ length: 16 }, () => ({
        x: rand() * 200,
        y: rand() * 150,
        r: rand() * 1.1 + 0.3,
        o: rand() * 0.5 + 0.25,
      })),
      // Xoay tông tím, nghiêng, phóng và đổi số chấm quanh hoạ tiết để hai
      // mục cùng loại đứng cạnh nhau vẫn phân biệt được bằng mắt.
      hueShift: Math.round((n % 46) - 23),
      tilt: ((n >> 3) % 17) - 8,
      scale: 0.88 + ((n >> 7) % 25) / 100,
      orbit: 5 + ((n >> 11) % 4),
      uid: `ca${n.toString(36)}`,
    };
  }, [seed]);

  return (
    <svg
      viewBox="0 0 200 150"
      role="img"
      aria-label="Hình minh hoạ"
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        {/* Nền artwork phải bám theo nền trang. Bộ màu cũ (L 18/12/9%) hợp
            với nền tím đậm; từ khi trang chuyển sang đen (L khoảng 3.5%) thì
            chúng nổi lên thành những mảng tím sáng giữa lưới sản phẩm. Hạ
            xuống sát đen, để khung vàng và hoạ tiết làm phần nhận diện. */}
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${268 + hueShift} 40% 9%)`} />
          <stop offset="55%" stopColor={`hsl(${280 + hueShift} 45% 6%)`} />
          <stop offset="100%" stopColor={`hsl(${292 + hueShift} 38% 4%)`} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="rgba(226,183,92,0.22)" />
          <stop offset="100%" stopColor="rgba(226,183,92,0)" />
        </radialGradient>
      </defs>

      <rect width="200" height="150" fill={`url(#${uid}-bg)`} />
      <rect width="200" height="150" fill={`url(#${uid}-glow)`} />

      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={GOLD} opacity={s.o} />
      ))}

      {frame && (
        <>
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
        </>
      )}

      <g
        transform={`translate(100 75) rotate(${tilt}) scale(${scale})`}
        fill="none"
        stroke={GOLD}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {Array.from({ length: orbit }, (_, i) => {
          const a = (i * 2 * Math.PI) / orbit - Math.PI / 2;
          return (
            <circle
              key={i}
              cx={Math.cos(a) * 52}
              cy={Math.sin(a) * 52}
              r="1.5"
              fill={GOLD}
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

function Motif({ kind }: { kind: CelestialMotif }) {
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
          <path
            d="M0 -8 L2.4 -2.4 L8 0 L2.4 2.4 L0 8 L-2.4 2.4 L-8 0 L-2.4 -2.4 Z"
            fill={GOLD}
            stroke="none"
          />
        </>
      );

    // Chìa khoá — lá Key, đặc trưng của Lenormand.
    case "lenormand":
      return (
        <>
          <circle cy="-20" r="11" opacity="0.9" />
          <circle cy="-20" r="4.5" opacity="0.5" />
          <line x1="0" y1="-9" x2="0" y2="30" opacity="0.9" />
          <line x1="0" y1="20" x2="11" y2="20" opacity="0.9" />
          <line x1="0" y1="28" x2="8" y2="28" opacity="0.9" />
        </>
      );

    // Các pha trăng — Oracle gắn với chu kỳ mặt trăng.
    case "oracle":
      return (
        <>
          <circle cx="-34" cy="0" r="7" opacity="0.55" />
          <path
            d="M-12 -13 A13 13 0 1 0 -12 13 A9 13 0 1 1 -12 -13 Z"
            opacity="0.85"
          />
          <circle cx="18" cy="0" r="15" opacity="0.95" />
          <circle
            cx="18"
            cy="0"
            r="15"
            fill="rgba(226,183,92,0.14)"
            stroke="none"
          />
          <circle cx="45" cy="0" r="7" opacity="0.55" />
        </>
      );

    // Trụ tinh thể — nhóm đá và khoáng.
    case "stone":
      return (
        <>
          <path d="M0 -34 L17 -8 L11 30 L-11 30 L-17 -8 Z" opacity="0.95" />
          <path d="M0 -34 L0 30" opacity="0.45" />
          <path d="M-17 -8 L0 -2 L17 -8" opacity="0.45" />
          <path d="M-30 20 L-22 4 L-16 20 Z" opacity="0.5" />
          <path d="M30 20 L22 4 L16 20 Z" opacity="0.5" />
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
          <path d="M-30 -18 C-26 -24 -32 -28 -28 -34" opacity="0.35" />
          <path d="M28 -18 C32 -24 26 -28 30 -34" opacity="0.35" />
        </>
      );

    // Trăng khuyết ôm sao — bài viết chiêm tinh.
    case "moon":
      return (
        <>
          <path
            d="M14 -30 A30 30 0 1 0 14 30 A24 30 0 1 1 14 -30 Z"
            opacity="0.95"
          />
          <path
            d="M14 -30 A30 30 0 1 0 14 30 A24 30 0 1 1 14 -30 Z"
            fill="rgba(226,183,92,0.12)"
            stroke="none"
          />
          <path
            d="M30 -14 L32.4 -8.4 L38 -6 L32.4 -3.6 L30 2 L27.6 -3.6 L22 -6 L27.6 -8.4 Z"
            fill={GOLD}
            stroke="none"
            opacity="0.9"
          />
          <circle
            cx="40"
            cy="16"
            r="1.8"
            fill={GOLD}
            stroke="none"
            opacity="0.7"
          />
        </>
      );

    // Ba lá bài xoè — bài viết về trải bài Tarot.
    case "cards":
      return (
        <>
          <g transform="rotate(-16)">
            <rect x="-38" y="-26" width="30" height="46" rx="3" opacity="0.6" />
          </g>
          <g transform="rotate(16)">
            <rect x="8" y="-26" width="30" height="46" rx="3" opacity="0.6" />
          </g>
          <rect
            x="-16"
            y="-30"
            width="32"
            height="52"
            rx="3.5"
            opacity="0.95"
          />
          <path
            d="M0 -14 L2.6 -5.6 L11 -3 L2.6 -0.4 L0 8 L-2.6 -0.4 L-11 -3 L-2.6 -5.6 Z"
            fill={GOLD}
            stroke="none"
            opacity="0.85"
          />
        </>
      );

    // Hoa sen — bài viết chữa lành, thiền.
    case "lotus":
      return (
        <>
          <path d="M0 22 C-8 4 -8 -12 0 -26 C8 -12 8 4 0 22 Z" opacity="0.95" />
          <path
            d="M0 22 C-18 10 -26 -2 -28 -14 C-14 -10 -4 2 0 22 Z"
            opacity="0.7"
          />
          <path
            d="M0 22 C18 10 26 -2 28 -14 C14 -10 4 2 0 22 Z"
            opacity="0.7"
          />
          <path
            d="M0 22 C-28 16 -40 8 -44 0 C-28 -2 -10 8 0 22 Z"
            opacity="0.45"
          />
          <path d="M0 22 C28 16 40 8 44 0 C28 -2 10 8 0 22 Z" opacity="0.45" />
        </>
      );

    // Vòng số — bài viết thần số học.
    case "numerology":
      return (
        <>
          <circle r="30" opacity="0.35" />
          <circle r="22" opacity="0.8" />
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i * 2 * Math.PI) / 9 - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={Math.cos(a) * 30}
                cy={Math.sin(a) * 30}
                r="2.4"
                fill={GOLD}
                stroke="none"
                opacity="0.75"
              />
            );
          })}
          <path d="M-7 -8 L0 -12 L0 12" opacity="0.95" />
          <line x1="-6" y1="12" x2="7" y2="12" opacity="0.95" />
        </>
      );
  }
}
