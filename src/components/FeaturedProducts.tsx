import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { formatVND } from "@/lib/mock-data";
import { useFeaturedProducts } from "@/features/shop/queries";

/**
 * Section giới thiệu vật phẩm trên trang chủ — cửa vào phần 3 của sản phẩm.
 * Chỉ hiển thị, không có nút thêm giỏ: mục đích là kéo người dùng sang /shop.
 * Nếu API lỗi hoặc chưa có hàng nổi bật thì section tự ẩn, thay vì để một
 * khối trống giữa landing page.
 */
export function FeaturedProducts() {
  const { data, isPending, isError } = useFeaturedProducts();
  const products = data?.slice(0, 4) ?? [];

  if (isError || (!isPending && products.length === 0)) return null;

  return (
    <section aria-labelledby="featured-heading" className="mx-auto w-full max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold/70">
            ✦ Vật phẩm
          </p>
          <h2 id="featured-heading" className="mt-2 font-display text-3xl sm:text-4xl">
            Bài, đá và <span className="text-gradient-gold">phụ kiện</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Bộ bài Tarot, Lenormand, Oracle cùng đá khoáng và phụ kiện trải bài
            — tuyển chọn cho cả người mới lẫn Reader chuyên nghiệp.
          </p>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-5 py-2 text-sm text-gold transition hover:bg-gold/10"
        >
          Xem tất cả <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="glass h-64 animate-pulse rounded-2xl"
                aria-hidden="true"
              />
            ))
          : products.map((p) => (
              <motion.article key={p.id} whileHover={{ y: -4 }}>
                <Link
                  to="/shop/$slug"
                  params={{ slug: p.slug }}
                  className="glass block overflow-hidden rounded-2xl"
                >
                  <div className="aspect-[4/3] bg-mystic/10">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="grid h-full w-full place-items-center text-5xl text-gold/25"
                      >
                        ✦
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {p.categoryName && (
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70">
                        {p.categoryName}
                      </p>
                    )}
                    <h3 className="mt-1 line-clamp-2 text-sm font-normal text-foreground">
                      {p.name}
                    </h3>
                    <p className="mt-2 font-display text-lg text-gold">
                      {formatVND(p.price)}
                    </p>
                  </div>
                </Link>
              </motion.article>
            ))}
      </div>
    </section>
  );
}
