import { ImageOff } from "lucide-react";

/**
 * Nhãn "Ảnh minh hoạ" cho sản phẩm chưa có ảnh chụp thật
 * (`product.imageIsIllustrative === true`).
 *
 * Bắt buộc phải hiện ở mọi chỗ có ảnh sản phẩm: gắn ảnh không đúng món mà im
 * lặng là mô tả sai hàng, khách nhận hàng thấy khác ảnh sẽ có quyền khiếu nại.
 *
 * - `variant="badge"`: chip nổi trên ảnh, dùng trong danh sách / thẻ sản phẩm.
 *   Thẻ ảnh cha phải có `relative`.
 * - `variant="inline"`: một dòng giải thích, dùng ở trang chi tiết nơi còn chỗ.
 */
export function IllustrativeNote({
  variant = "badge",
}: {
  variant?: "badge" | "inline";
}) {
  if (variant === "inline") {
    return (
      <p className="mt-3 flex items-start gap-2 rounded-lg border border-gold/25 bg-mystic/10 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        <ImageOff
          aria-hidden="true"
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/70"
        />
        <span>
          <strong className="font-medium text-foreground/90">
            Ảnh minh hoạ.
          </strong>{" "}
          Đây chưa phải ảnh chụp sản phẩm thật — hình dáng, màu sắc và chi tiết
          của món bạn nhận có thể khác. Mô tả bên dưới mới là thông tin chính
          xác.
        </span>
      </p>
    );
  }

  return (
    <span
      className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur-sm"
      title="Chưa phải ảnh chụp sản phẩm thật"
    >
      <ImageOff aria-hidden="true" className="h-3 w-3" />
      Ảnh minh hoạ
    </span>
  );
}
