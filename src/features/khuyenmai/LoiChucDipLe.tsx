import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { layLoiChuc, type KhuyenMai } from "@/api/khuyen-mai";
import { useAuth } from "@/lib/auth-context";
import { subscribeDestination } from "@/lib/realtime";

/**
 * Lời chúc dịp lễ, hiện đúng MỘT lần cho mỗi người.
 *
 * ## Vì sao "một lần" do máy chủ quyết, không phải localStorage
 *
 * Cách rẻ nhất là ghi một cờ vào `localStorage`. Cách ấy hỏng theo ba đường
 * mà người dùng gặp thường xuyên: đổi máy, mở cửa sổ ẩn danh, hoặc xoá dữ
 * liệu trình duyệt — lần nào cũng lại thấy lời chúc Tết. Và ngược lại, hai
 * người dùng chung một máy thì người thứ hai không bao giờ được chúc.
 *
 * Nên máy chủ giữ sổ theo `user_id`, và `POST /loi-chuc` vừa trả lời chúc
 * vừa đánh dấu đã xem trong cùng một lượt. Giao diện không phải báo lại
 * "tôi đã hiện rồi" — nó có thể bị đóng giữa chừng, và lần sau lời chúc lại
 * hiện.
 */
export function LoiChucDipLe() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dot, setDot] = useState<KhuyenMai | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setDot(null);
      return;
    }
    let conHieuLuc = true;

    layLoiChuc()
      .then((k) => {
        if (conHieuLuc && k?.loiChuc) setDot(k);
      })
      .catch(() => {
        // Không chúc được thì thôi. Đây là thứ làm vui thêm, không được
        // phép chắn đường ai vào trang.
      });

    return () => {
      conHieuLuc = false;
    };
  }, [user?.id]);

  // Quản trị vừa tạo một đợt mới thì người đang mở trang cũng nhận được
  // lời chúc, không phải đợi tải lại.
  useEffect(() => {
    if (!user?.id) return;
    return subscribeDestination("/topic/khuyen-mai", () => {
      void queryClient.invalidateQueries({ queryKey: ["khuyen-mai"] });
      layLoiChuc()
        .then((k) => {
          if (k?.loiChuc) setDot(k);
        })
        .catch(() => {});
    });
  }, [user?.id, queryClient]);

  if (!dot) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dot.ten}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => setDot(null)}
    >
      <div
        className="glass relative max-w-md rounded-2xl border border-gold/50 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setDot(null)}
          aria-label="Đóng"
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-3xl">✦</div>
        <h2 className="mt-2 font-display text-xl text-gold">{dot.ten}</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {dot.loiChuc}
        </p>

        <p className="mt-4 rounded-lg border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-gold/90">
          {dot.loaiGiam === "PHAN_TRAM"
            ? `Dịp này giảm ${dot.giaTri}% gói AI`
            : `Dịp này giảm ${new Intl.NumberFormat("vi-VN").format(dot.giaTri)} ₫ gói AI`}
          {dot.giamToiDa
            ? `, tối đa ${new Intl.NumberFormat("vi-VN").format(dot.giamToiDa)} ₫`
            : ""}
          .
        </p>

        <button
          onClick={() => setDot(null)}
          className="mt-5 w-full rounded-full bg-gold py-2.5 text-sm font-medium text-primary-foreground"
        >
          Cảm ơn
        </button>
      </div>
    </div>
  );
}
