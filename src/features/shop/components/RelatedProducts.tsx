import { Link } from "@tanstack/react-router";
import { useProducts } from "@/features/shop/queries";
import { BuyOnPlatformButton } from "@/features/shop/components/BuyOnPlatformButton";
import { formatVND } from "@/lib/mock-data";
import { ProductArtwork } from "@/components/ProductArtwork";

/**
 * Gợi ý vật phẩm ngay tại chỗ người dùng đang quan tâm tới chủ đề.
 *
 * Shop là trụ cột thứ ba nhưng lâu nay đứng tách hẳn: ai không tự bấm vào tab
 * Shop thì không bao giờ thấy. Người vừa rút một lá bài đang ở đúng lúc quan
 * tâm nhất — đó là chỗ đáng đặt gợi ý, không phải một banner ở chân trang.
 *
 * Cố ý KHÔNG bịa liên hệ giữa lá bài và món hàng ("lá The Moon hợp với đá mặt
 * trăng"). Kiểu ghép đó nghe hay nhưng là bịa, và người dùng nhận ra ngay khi
 * rút lá khác mà vẫn thấy đúng món cũ. Chỉ nêu những liên hệ có thật: ảnh lá
 * bài trên trang này lấy từ chính bộ Rider-Waite đang bán.
 */
export function RelatedProducts({
  categorySlug,
  title,
  hint,
  limit = 3,
}: {
  categorySlug?: string;
  title: string;
  hint?: string;
  limit?: number;
}) {
  const query = useProducts({ category: categorySlug, page: 0, size: limit });
  const products = query.data?.content ?? [];

  // Chưa tải xong hoặc không có gì thì ẩn hẳn, không chừa khoảng trống. Một ô
  // rỗng giữa trang trông như lỗi tải.
  if (query.isPending || products.length === 0) return null;

  return (
    <section
      aria-labelledby="related-products"
      className="mt-6 border-t border-gold/15 pt-5"
    >
      <h4 id="related-products" className="font-display text-base">
        {title}
      </h4>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}

      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {products.map((p) => (
          <li
            key={p.id}
            className="flex flex-col rounded-xl border border-gold/15 p-3"
          >
            <Link
              to="/shop/$slug"
              params={{ slug: p.slug }}
              className="block aspect-[4/3] overflow-hidden rounded-lg bg-mystic/10"
              tabIndex={-1}
              aria-hidden="true"
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <ProductArtwork
                  slug={p.slug}
                  categorySlug={p.categorySlug}
                  className="h-full w-full"
                />
              )}
            </Link>

            <h5 className="mt-2 line-clamp-2 text-xs leading-snug">
              <Link
                to="/shop/$slug"
                params={{ slug: p.slug }}
                className="text-foreground transition hover:text-gold"
              >
                {p.name}
              </Link>
            </h5>
            <p className="mt-1 font-display text-sm text-gold">
              {formatVND(p.price)}
            </p>

            <div className="mt-auto pt-2">
              <BuyOnPlatformButton product={p} className="py-1.5 text-xs" />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Liên kết tiếp thị — bạn mua trên sàn với giá không đổi, ASTROTAROT nhận
        hoa hồng.
      </p>
    </section>
  );
}
