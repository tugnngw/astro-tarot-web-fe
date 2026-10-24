import { Facebook } from "lucide-react";

/**
 * Hai kênh mạng xã hội chính thức của AstroTarot.
 *
 * Đặt địa chỉ ở một chỗ duy nhất: khi đổi tên trang hay dọn lại liên kết thì
 * chỉ phải sửa ở đây, không phải đi tìm từng chỗ đã dán.
 */
export const KENH_CONG_DONG = [
  {
    ten: "Facebook",
    moTa: "Cộng đồng AstroTarot",
    href: "https://www.facebook.com/profile.php?id=61590368167608",
    Icon: Facebook,
  },
  {
    ten: "TikTok",
    moTa: "@astrotarot_22",
    // Lucide đã bỏ các biểu tượng thương hiệu ngoài vài cái cũ, nên TikTok vẽ
    // tay bên dưới thay vì kéo thêm một thư viện icon thứ hai về chỉ vì một
    // hình.
    href: "https://www.tiktok.com/@astrotarot_22",
    Icon: TikTokIcon,
  },
] as const;

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.84-2.48V9.78a5.69 5.69 0 1 0 4.93 5.63V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

/**
 * Hàng liên kết tới các kênh của AstroTarot.
 *
 * Mở ở tab mới: đây là đường dẫn ra khỏi sản phẩm, và người đang xem dở một
 * trải bài mà bị cuốn sang Facebook thì mất cả mạch lẫn nội dung đang dở.
 * `rel="noreferrer"` đi kèm `target="_blank"` để trang đích không với được
 * `window.opener`.
 */
export function KenhCongDong({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">
        Theo dõi AstroTarot để nhận bài mới và lịch mở của Reader
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        {KENH_CONG_DONG.map(({ ten, moTa, href, Icon }) => (
          <a
            key={ten}
            href={href}
            target="_blank"
            rel="noreferrer"
            // Nhãn đọc được: trình đọc màn hình đọc "Facebook" trống không thì
            // không biết là trang nào của ai.
            aria-label={`${ten} — ${moTa}`}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-xs text-foreground/80 transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{ten}</span>
            <span className="text-muted-foreground">{moTa}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
