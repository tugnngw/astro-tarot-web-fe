import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { formatVND } from "@/lib/mock-data";
import { ProductArtwork } from "@/components/ProductArtwork";
import { IllustrativeNote } from "@/components/IllustrativeNote";
import { useProduct } from "@/features/shop/queries";
import {
  AffiliateDisclosure,
  BuyOnPlatformButton,
} from "@/features/shop/components/BuyOnPlatformButton";

export const Route = createFileRoute("/shop_/$slug")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { data: product, isPending, isError } = useProduct(slug);

  const discount =
    product?.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100,
        )
      : null;

  return (
    <div className="relative min-h-screen">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-gold"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Quay lại Shop
        </Link>

        {isPending ? (
          <div className="mt-6 grid gap-8 md:grid-cols-2" aria-busy="true">
            <div className="glass aspect-square animate-pulse rounded-2xl" />
            <div className="space-y-4">
              <div className="glass h-8 w-2/3 animate-pulse rounded" />
              <div className="glass h-6 w-1/3 animate-pulse rounded" />
              <div className="glass h-24 w-full animate-pulse rounded" />
            </div>
          </div>
        ) : isError || !product ? (
          <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-16 text-center">
            <h1 className="font-display text-2xl">Không tìm thấy sản phẩm</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sản phẩm này có thể đã ngừng bán hoặc đường dẫn không đúng.
            </p>
            <Link
              to="/shop"
              className="mt-5 rounded-full bg-gold px-5 py-2 text-sm font-medium text-primary-foreground glow-gold"
            >
              Xem sản phẩm khác
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div className="glass relative aspect-square overflow-hidden rounded-2xl bg-mystic/10">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <ProductArtwork
                  slug={product.slug}
                  categorySlug={product.categorySlug}
                  className="h-full w-full"
                />
              )}
              {discount !== null && (
                <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-primary-foreground">
                  -{discount}%
                </span>
              )}
            </div>

            <div className="flex flex-col">
              {product.categoryName && (
                <p className="text-[11px] uppercase tracking-[0.25em] text-gold/70">
                  {product.categoryName}
                </p>
              )}
              <h1 className="mt-2 font-display text-3xl leading-tight">
                {product.name}
              </h1>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-display text-3xl text-gold">
                  {formatVND(product.price)}
                </span>
                {discount !== null && product.compareAtPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    <span className="sr-only">Giá gốc </span>
                    {formatVND(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {/* Không hiện tồn kho: hàng nằm trên sàn, mình không biết còn bao
                  nhiêu. Đoán sai theo hướng "còn hàng" thì khách bấm sang mới
                  biết hết; đoán sai hướng kia thì mất một đơn. */}
              {product.clickCount != null && product.clickCount > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {product.clickCount} lượt xem trên sàn
                </p>
              )}

              {product.imageIsIllustrative && product.imageUrl && (
                <IllustrativeNote variant="inline" />
              )}

              {product.description && (
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              )}

              <div className="mt-6">
                <BuyOnPlatformButton product={product} />
              </div>

              <AffiliateDisclosure className="mt-4" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
