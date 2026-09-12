import type { ReactNode } from "react";

/**
 * Khung viền hoa văn kiểu lưng bài tarot: hai đường viền lồng nhau, bốn góc
 * có hoạ tiết cuộn, bốn cạnh có một ngôi sao bốn cánh ở chính giữa.
 *
 * Vẽ bằng SVG phủ lên thay vì dùng border + ::before/::after của CSS: hoạ
 * tiết góc là đường cong, CSS thuần không dựng được, mà cắt ảnh PNG thì
 * không co giãn theo kích thước thẻ và không đổi màu theo tông được.
 *
 * SVG dùng preserveAspectRatio="none" cho hai đường viền co giãn theo thẻ,
 * còn hoạ tiết góc và sao cạnh vẽ ở toạ độ cố định để không bị méo.
 */
export function OrnateFrame({
  children,
  className = "",
  /** Độ đậm của viền, 0-1. Giảm xuống cho những thẻ cần nhẹ nhàng hơn. */
  intensity = 1,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  return (
    <div className={`panel-black relative ${className}`}>
      <FrameDecor intensity={intensity} />
      <div className="relative">{children}</div>
    </div>
  );
}

function FrameDecor({ intensity }: { intensity: number }) {
  const stroke = `rgba(226,183,92,${0.55 * intensity})`;
  const strokeSoft = `rgba(226,183,92,${0.28 * intensity})`;

  return (
    <>
      {/* Hai đường viền lồng nhau — co giãn theo thẻ. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <rect
          x="1.2"
          y="1.2"
          width="97.6"
          height="97.6"
          fill="none"
          stroke={stroke}
          strokeWidth="0.35"
          vectorEffect="non-scaling-stroke"
        />
        <rect
          x="3.4"
          y="3.4"
          width="93.2"
          height="93.2"
          fill="none"
          stroke={strokeSoft}
          strokeWidth="0.25"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Hoạ tiết bốn góc — toạ độ cố định nên không méo khi thẻ đổi tỉ lệ. */}
      {(
        [
          ["top-0 left-0", ""],
          ["top-0 right-0", "scale-x-[-1]"],
          ["bottom-0 left-0", "scale-y-[-1]"],
          ["bottom-0 right-0", "scale-x-[-1] scale-y-[-1]"],
        ] as const
      ).map(([pos, flip]) => (
        <svg
          key={pos}
          aria-hidden="true"
          viewBox="0 0 40 40"
          className={`pointer-events-none absolute ${pos} ${flip} h-10 w-10`}
        >
          <g
            fill="none"
            stroke={stroke}
            strokeWidth="1.1"
            strokeLinecap="round"
          >
            {/* Cuộn tròn ở góc */}
            <path d="M7 20 C7 12 12 7 20 7" />
            <path d="M11 20 C11 14 14 11 20 11" opacity="0.6" />
            <circle cx="13.5" cy="13.5" r="2.4" />
          </g>
        </svg>
      ))}

      {/* Sao bốn cánh ở giữa mỗi cạnh. */}
      {(
        [
          "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
          "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2",
          "top-1/2 left-0 -translate-y-1/2 -translate-x-1/2",
          "top-1/2 right-0 -translate-y-1/2 translate-x-1/2",
        ] as const
      ).map((pos) => (
        <svg
          key={pos}
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={`pointer-events-none absolute ${pos} h-3.5 w-3.5`}
        >
          <path
            d="M8 0.5 L9.6 6.4 L15.5 8 L9.6 9.6 L8 15.5 L6.4 9.6 L0.5 8 L6.4 6.4 Z"
            fill={stroke}
          />
        </svg>
      ))}
    </>
  );
}
