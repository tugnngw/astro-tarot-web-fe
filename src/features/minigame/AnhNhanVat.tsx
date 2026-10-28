import type { MaNhanVat } from "@/api/game";

/**
 * Huy hiệu của ba người đồng hành.
 *
 * ## Vì sao là SVG vẽ tay chứ không phải ảnh
 *
 * Ba tấm ảnh bitmap thì phải có người vẽ, phải có chỗ chứa, phải có bản
 * @2x cho màn hình nét, và phải tải về trước khi màn chọn nhân vật hiện ra —
 * trên 3G thì người chơi nhìn ba ô xám vài giây. Huy hiệu vẽ bằng SVG đi
 * thẳng trong mã nguồn: không có lượt tải nào, nét ở mọi cỡ, và đổi màu theo
 * token của sản phẩm.
 *
 * Nếu sau này nhóm có hoạ sĩ vẽ chân dung thật thì chỗ thay chỉ là tệp này —
 * phần còn lại của màn chọn không biết bên trong nó là gì.
 *
 * ## Vì sao màu lấy qua var(--...) chứ không viết thẳng
 *
 * Bộ canh design system chặn mọi màu số viết tay. Dùng biến thì huy hiệu đi
 * theo bảng màu chung, và sửa sắc tím của sản phẩm là huy hiệu Luna đổi theo
 * mà không ai phải nhớ tới nó.
 */

type Nen = { sang: string; dam: string; net: string };

/** Mỗi người một bộ màu, lấy từ token đã có — không sinh thêm màu mới. */
const NEN: Record<MaNhanVat, Nen> = {
  LUNA: {
    sang: "var(--o-trang)",
    dam: "var(--mystic)",
    net: "var(--o-trang)",
  },
  SOL: { sang: "var(--o-sao)", dam: "var(--o-gay)", net: "var(--o-sao)" },
  ASTRA: { sang: "var(--gold-soft)", dam: "var(--mystic)", net: "var(--gold)" },
};

function Luna({ m }: { m: Nen }) {
  return (
    <g>
      <circle cx="32" cy="32" r="21" fill={m.sang} fillOpacity="0.16" />
      {/* Lưỡi liềm: một đĩa tròn bị một đĩa nữa khoét đi. */}
      <path
        d="M41.5 17 A17 17 0 1 0 41.5 47 A13.5 13.5 0 1 1 41.5 17 Z"
        fill={m.net}
      />
      <circle cx="26" cy="27" r="2.6" fill={m.dam} fillOpacity="0.45" />
      <circle cx="23.5" cy="36" r="1.8" fill={m.dam} fillOpacity="0.4" />
      <circle cx="29" cy="40" r="1.2" fill={m.dam} fillOpacity="0.35" />
      {/* Ba ngôi sao nhỏ ở phía khuyết của trăng. */}
      <path
        d="M45 22 L46 25 L49 26 L46 27 L45 30 L44 27 L41 26 L44 25 Z"
        fill={m.sang}
        fillOpacity="0.9"
      />
      <path
        d="M48 36 L48.7 38 L50.7 38.7 L48.7 39.4 L48 41.4 L47.3 39.4 L45.3 38.7 L47.3 38 Z"
        fill={m.sang}
        fillOpacity="0.65"
      />
    </g>
  );
}

function Sol({ m }: { m: Nen }) {
  // Tám tia: bốn tia thẳng ở trục chính, bốn tia ngắn hơn ở đường chéo.
  const tia = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <g>
      <circle cx="32" cy="32" r="21" fill={m.sang} fillOpacity="0.16" />
      {tia.map((goc) => (
        <rect
          key={goc}
          x="30.6"
          y={goc % 90 === 0 ? 4.5 : 7.5}
          width="2.8"
          height={goc % 90 === 0 ? 9 : 6}
          rx="1.4"
          fill={m.net}
          fillOpacity={goc % 90 === 0 ? 1 : 0.7}
          transform={`rotate(${goc} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="13.5" fill={m.net} />
      <circle
        cx="32"
        cy="32"
        r="13.5"
        fill="none"
        stroke={m.dam}
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      {/* Vệt sáng lệch lên trái, cho đĩa mặt trời ra khối chứ không phẳng. */}
      <circle cx="27" cy="27" r="4.4" fill={m.sang} fillOpacity="0.5" />
    </g>
  );
}

function Astra({ m }: { m: Nen }) {
  return (
    <g>
      <circle cx="32" cy="32" r="21" fill={m.sang} fillOpacity="0.14" />
      {/* Quỹ đạo nghiêng, vẽ trước để ngôi sao nằm đè lên. */}
      <ellipse
        cx="32"
        cy="32"
        rx="22"
        ry="9"
        fill="none"
        stroke={m.dam}
        strokeOpacity="0.75"
        strokeWidth="2"
        transform="rotate(-28 32 32)"
      />
      {/* Sao tám cánh: hai hình thoi chồng nhau lệch 45°. */}
      <path
        d="M32 6 L37 27 L58 32 L37 37 L32 58 L27 37 L6 32 L27 27 Z"
        fill={m.net}
      />
      <path
        d="M32 14 L35 29 L50 32 L35 35 L32 50 L29 35 L14 32 L29 29 Z"
        fill={m.sang}
        fillOpacity="0.55"
        transform="rotate(45 32 32)"
      />
      <circle cx="32" cy="32" r="4" fill={m.sang} />
    </g>
  );
}

export function AnhNhanVat({
  ma,
  className,
}: {
  ma: MaNhanVat;
  className?: string;
}) {
  const m = NEN[ma] ?? NEN.ASTRA;
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      {ma === "LUNA" && <Luna m={m} />}
      {ma === "SOL" && <Sol m={m} />}
      {ma === "ASTRA" && <Astra m={m} />}
    </svg>
  );
}
