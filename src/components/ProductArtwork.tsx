import {
  CelestialArtwork,
  type CelestialMotif,
} from "@/components/CelestialArtwork";

/**
 * Artwork cho sản phẩm chưa có ảnh chụp.
 *
 * Chỉ là lớp ánh xạ từ danh mục sang hoạ tiết; phần vẽ nằm ở CelestialArtwork
 * để blog dùng chung cùng ngôn ngữ hình ảnh.
 *
 * Khi có ảnh thật, chỉ cần điền products.image_url ở BE là component này tự
 * nhường chỗ (xem chỗ gọi).
 */
function motifOf(categorySlug: string | null | undefined): CelestialMotif {
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

export function ProductArtwork({
  slug,
  categorySlug,
  className,
}: {
  slug: string;
  categorySlug?: string | null;
  className?: string;
}) {
  return (
    <CelestialArtwork
      seed={slug}
      motif={motifOf(categorySlug)}
      className={className}
    />
  );
}
