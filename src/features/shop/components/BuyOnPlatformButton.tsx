import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PLATFORM_LABEL, trackAffiliateClick, type Product } from "@/api/shop";

/**
 * Nút mua hàng — mở sản phẩm trên sàn liên kết.
 *
 * Shop này không bán trực tiếp: hàng nằm trên Shopee, mình giới thiệu và ăn
 * hoa hồng. Nói rõ điều đó trên nút ("Mua trên Shopee") thay vì để chữ "Mua
 * ngay" rồi bật khách sang trang lạ — bị chuyển sang một tên miền không ngờ
 * tới là cách nhanh nhất để mất niềm tin.
 *
 * Mở cửa sổ NGAY trong cú bấm, trước khi chờ mạng: trình duyệt chỉ cho phép
 * window.open trong ngữ cảnh người dùng vừa tương tác. Chờ fetch xong mới mở
 * là bị chặn popup.
 */
export function BuyOnPlatformButton({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  if (!product.affiliateUrl) {
    return (
      <span
        className={`block rounded-full border border-mystic/40 py-2.5 text-center text-sm text-muted-foreground ${className}`}
        title="Sản phẩm này chưa có liên kết mua hàng"
      >
        Chưa có liên kết
      </span>
    );
  }

  const platform =
    PLATFORM_LABEL[product.affiliatePlatform ?? "OTHER"] ?? "sàn liên kết";

  async function open() {
    setBusy(true);
    // Mở tab trống trước, điền địa chỉ sau khi có link. Nếu đợi fetch xong mới
    // gọi window.open thì trình duyệt coi đó là popup tự phát và chặn.
    const tab = window.open("", "_blank", "noopener,noreferrer");
    try {
      const { url } = await trackAffiliateClick(product.slug);
      if (tab) {
        tab.location.href = url;
      } else {
        // Popup vẫn bị chặn (một số trình duyệt di động). Điều hướng ngay tab
        // hiện tại còn hơn để người dùng bấm mà không có gì xảy ra.
        window.location.href = url;
      }
    } catch (e) {
      tab?.close();
      toast.error(e instanceof Error ? e.message : "Không mở được liên kết");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void open()}
      disabled={busy}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:opacity-50 ${className}`}
    >
      <ExternalLink aria-hidden="true" className="h-4 w-4" />
      {busy ? "Đang mở…" : `Mua trên ${platform}`}
    </button>
  );
}

/**
 * Ghi chú minh bạch về tiếp thị liên kết.
 *
 * Có mặt vì hai lý do, và cả hai đều quan trọng hơn thẩm mỹ: người mua có
 * quyền biết mình đang bấm vào link có hoa hồng, và chính sách của các sàn
 * liên kết đều yêu cầu nói rõ điều này.
 */
export function AffiliateDisclosure({
  className = "",
}: {
  className?: string;
}) {
  return (
    <p className={`text-xs leading-relaxed text-muted-foreground ${className}`}>
      Đây là các liên kết tiếp thị. Bạn mua hàng trên sàn với giá không đổi;
      ASTROTAROT nhận một phần hoa hồng từ sàn. Giá và tình trạng còn hàng do
      người bán trên sàn quyết định, có thể khác với thông tin hiển thị ở đây.
    </p>
  );
}
