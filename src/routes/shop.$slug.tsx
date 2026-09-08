import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { formatVND } from "@/lib/mock-data";
import { ProductArtwork } from "@/components/ProductArtwork";
import { useProduct } from "@/features/shop/queries";

export const Route = createFileRoute("/shop/$slug")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();
  const { add, busy } = useCart();

  const { data: product, isPending, isError } = useProduct(slug);
  const [quantity, setQuantity] = useState(1);

  // Đổi sản phẩm thì số lượng phải về 1, nếu không nó giữ lại giá trị của
  // sản phẩm trước và có thể vượt tồn kho của sản phẩm mới.
  useEffect(() => {
    setQuantity(1);
  }, [slug]);

  const discount =
    product?.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100,
        )
      : null;

  const soldOut = (product?.stock ?? 0) <= 0;

  async function handleAdd(goToCart: boolean) {
    if (!product) return;
    if (!user) {
      openAuth("login");
      return;
    }
    try {
      await add(product.id, quantity);
      if (goToCart) {
        navigate({ to: "/cart" });
      } else {
        toast.success(`Đã thêm ${quantity} × "${product.name}" vào giỏ`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thêm được vào giỏ");
    }
  }

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

              <p className="mt-2 text-xs text-muted-foreground">
                {soldOut ? (
                  <span className="text-destructive">Tạm hết hàng</span>
                ) : (
                  `Còn ${product.stock} sản phẩm`
                )}
              </p>

              {product.description && (
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              )}

              {!soldOut && (
                <div className="mt-6 flex items-center gap-3">
                  <span id="qty-label" className="text-sm text-muted-foreground">
                    Số lượng
                  </span>
                  <div
                    className="flex items-center rounded-full border border-gold/40"
                    role="group"
                    aria-labelledby="qty-label"
                  >
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Giảm số lượng"
                      className="grid h-9 w-9 place-items-center rounded-full text-gold transition hover:bg-gold/10 disabled:opacity-30"
                    >
                      <Minus aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <output
                      aria-live="polite"
                      className="w-10 text-center text-sm"
                    >
                      {quantity}
                    </output>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock, q + 1))
                      }
                      disabled={quantity >= product.stock}
                      aria-label="Tăng số lượng"
                      className="grid h-9 w-9 place-items-center rounded-full text-gold transition hover:bg-gold/10 disabled:opacity-30"
                    >
                      <Plus aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleAdd(false)}
                  disabled={soldOut || busy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gold/50 py-3 text-sm font-medium text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                  Thêm vào giỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleAdd(true)}
                  disabled={soldOut || busy}
                  className="flex-1 rounded-full bg-gold py-3 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                >
                  Mua ngay ✦
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
