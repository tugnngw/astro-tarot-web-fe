import { ExternalLink } from "lucide-react";
import { PLATFORM_LABEL, trackAffiliateClick, type Product } from "@/api/shop";
import { trackCta } from "@/lib/track";

/**
 * Nút mua hàng — mở sản phẩm trên sàn liên kết.
 *
 * Shop này không bán trực tiếp: hàng nằm trên Shopee, mình giới thiệu và ăn
 * hoa hồng. Nói rõ điều đó trên nút ("Mua trên Shopee") thay vì để chữ "Mua
 * ngay" rồi bật khách sang trang lạ — bị chuyển sang một tên miền không ngờ
 * tới là cách nhanh nhất để mất niềm tin.
 *
 * ---------------------------------------------------------------------------
 * Vì sao là thẻ <a> chứ không phải window.open
 * ---------------------------------------------------------------------------
 *
 * Bản trước mở tab trống rồi điền địa chỉ sau khi hỏi xong máy chủ:
 *
 *     const tab = window.open("", "_blank", "noopener,noreferrer");
 *
 * Nhưng hễ chuỗi tuỳ chọn có `noopener` thì window.open TRẢ VỀ null — đã cắt
 * liên hệ giữa hai cửa sổ thì không còn tay cầm nào để trả. Nên `tab` luôn
 * null, nhánh dự phòng `window.location.href = url` luôn chạy, và tab hiện
 * tại rời khỏi web. Cái tab trống trình duyệt vừa mở thì nằm lại ở
 * about:blank. Người dùng thấy đúng hai thứ đó: trang trắng, và web thì mất.
 *
 * Cái sai sâu hơn là đã dựng lại bằng JavaScript một việc mà thẻ <a> làm sẵn,
 * và làm tốt hơn: không bao giờ bị chặn popup, bấm giữa hay Ctrl+bấm đều mở
 * tab mới, giữ lâu trên di động ra đúng trình đơn quen thuộc, và trang hiện
 * tại không hề bị đụng tới.
 *
 * Địa chỉ đã nằm sẵn trong `product.affiliateUrl`, không cần hỏi mới có:
 * `registerClick` ở máy chủ trả về đúng giá trị ấy, lượt gọi kia chỉ để đếm.
 * Nên cứ để trình duyệt mở link, còn việc đếm gửi đi song song và không ai
 * phải chờ nó.
 *
 * rel="sponsored": đây là liên kết có hoa hồng, và đó là giá trị các công cụ
 * tìm kiếm quy định cho đúng loại này. noopener chặn trang đích với tay ngược
 * lại `window.opener`; noreferrer giấu luôn địa chỉ trang nguồn.
 */
export function BuyOnPlatformButton({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
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

  /**
   * Đếm lượt bấm. Cố ý KHÔNG chặn việc mở link.
   *
   * Không await, và nuốt lỗi: đây là số liệu nội bộ. Máy chủ ngủ đông hay
   * mạng chập một nhịp thì người mua vẫn phải sang được Shopee — hỏng việc
   * đếm là chuyện của mình, không phải chuyện của họ.
   *
   * Không cần sendBeacon: target="_blank" nên trang này không hề bị đóng,
   * lượt fetch cứ thế chạy tiếp bình thường.
   */
  function dem() {
    trackCta("cta_shopee_click", { slug: product.slug });
    void trackAffiliateClick(product.slug).catch(() => {});
  }

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={dem}
      onAuxClick={dem}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold py-2.5 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] ${className}`}
    >
      <ExternalLink aria-hidden="true" className="h-4 w-4" />
      {`Mua trên ${platform}`}
    </a>
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
