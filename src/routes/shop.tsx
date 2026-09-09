import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useId, useMemo, useState } from "react";
import { Search, PackageX, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { formatVND } from "@/lib/mock-data";
import { ProductArtwork } from "@/components/ProductArtwork";
import { IllustrativeNote } from "@/components/IllustrativeNote";
import {
  AffiliateDisclosure,
  BuyOnPlatformButton,
} from "@/features/shop/components/BuyOnPlatformButton";
import { useCategories, useProducts } from "@/features/shop/queries";
import type { Product } from "@/api/shop";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — ASTROTAROT" },
      {
        name: "description",
        content:
          "Bộ bài Tarot, Lenormand, Oracle, đá phong thuỷ và phụ kiện trải bài.",
      },
    ],
  }),
  component: ShopPage,
});

const PAGE_SIZE = 12;

function ShopPage() {
  const searchId = useId();
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);

  // Gõ tới đâu tìm tới đó, nhưng chờ 350ms để không bắn request mỗi phím.
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  // Đổi bộ lọc thì quay về trang đầu, nếu không sẽ rơi vào trang trống.
  useEffect(() => {
    setPage(0);
  }, [category, debouncedKeyword]);

  const categoriesQuery = useCategories();
  const productsQuery = useProducts({
    category: category || undefined,
    keyword: debouncedKeyword || undefined,
    page,
    size: PAGE_SIZE,
  });

  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data?.content ?? [];
  const totalPages = productsQuery.data?.totalPages ?? 0;
  const totalElements = productsQuery.data?.totalElements ?? 0;

  // placeholderData giữ lại trang cũ khi đang tải trang mới; làm mờ nhẹ để
  // người dùng thấy có thứ đang được cập nhật mà danh sách không nháy.
  const isRefreshing = productsQuery.isPlaceholderData;

  return (
    <div className="relative min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl sm:text-4xl">
          Vật phẩm <span className="text-gradient-gold">Tarot</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Bộ bài, đá khoáng và phụ kiện trải bài — tuyển chọn cho cả người mới
          lẫn Reader chuyên nghiệp. Bấm mua sẽ mở sản phẩm trên sàn.
        </p>
        <AffiliateDisclosure className="mt-3 max-w-2xl" />

        {/* Bộ lọc */}
        <div className="mt-6">
          <label htmlFor={searchId} className="sr-only">
            Tìm sản phẩm
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id={searchId}
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm bộ bài, đá, phụ kiện..."
              className="w-full rounded-full border border-gold/30 bg-input/70 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40"
            />
          </div>
        </div>

        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label="Lọc theo danh mục"
        >
          <CategoryChip
            label="Tất cả"
            active={category === ""}
            onClick={() => setCategory("")}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name}
              active={category === c.slug}
              onClick={() => setCategory(c.slug)}
            />
          ))}
        </div>

        {/* Vùng kết quả: báo cho screen reader biết danh sách vừa đổi. */}
        <div aria-live="polite" aria-busy={productsQuery.isFetching}>
          {productsQuery.isSuccess && (
            <p className="mt-4 text-xs text-muted-foreground">
              {totalElements} sản phẩm
            </p>
          )}

          {productsQuery.isError ? (
            <ErrorState onRetry={() => void productsQuery.refetch()} />
          ) : productsQuery.isPending ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="glass h-72 animate-pulse rounded-2xl"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              keyword={debouncedKeyword}
              onReset={() => {
                setKeyword("");
                setCategory("");
              }}
            />
          ) : (
            <div
              className={`mt-6 grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
                isRefreshing ? "opacity-60" : "opacity-100"
              }`}
            >
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-3"
            aria-label="Phân trang"
          >
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-full border border-gold/40 px-4 py-2 text-sm text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>
            <span className="text-sm text-muted-foreground">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-gold/40 px-4 py-2 text-sm text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-xs transition focus-visible:ring-2 focus-visible:ring-gold/40 ${
        active
          ? "border-gold bg-gold/20 text-gold"
          : "border-mystic/50 bg-mystic/10 text-foreground/80 hover:border-gold/60"
      }`}
    >
      {label}
    </button>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-destructive/70" />
      <h2 className="mt-4 font-display text-xl">Không tải được sản phẩm</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Có thể do mất kết nối tới máy chủ. Thử lại giúp mình nhé.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-full border border-gold/50 px-5 py-2 text-sm text-gold transition hover:bg-gold/10"
      >
        Thử lại
      </button>
    </div>
  );
}

function EmptyState({
  keyword,
  onReset,
}: {
  keyword: string;
  onReset: () => void;
}) {
  return (
    <div className="glass mt-6 flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <PackageX className="h-10 w-10 text-gold/60" />
      <h2 className="mt-4 font-display text-xl">Không tìm thấy sản phẩm nào</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {keyword
          ? `Không có kết quả cho "${keyword}". Thử từ khoá khác hoặc bỏ bộ lọc.`
          : "Danh mục này hiện chưa có sản phẩm nào."}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-full border border-gold/50 px-5 py-2 text-sm text-gold transition hover:bg-gold/10"
      >
        Xoá bộ lọc
      </button>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const discount = useMemo(() => {
    if (!product.compareAtPrice || product.compareAtPrice <= product.price) {
      return null;
    }
    return Math.round(
      ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
    );
  }, [product.compareAtPrice, product.price]);

  // Không còn nhãn "Hết hàng": tồn kho là việc của người bán trên sàn, mình
  // không biết và không nên đoán. Đoán sai theo hướng "còn hàng" thì khách bấm
  // sang mới biết hết; đoán sai theo hướng "hết hàng" thì mất một đơn.

  // Hiệu ứng nhấc thẻ nằm ở utility .card-hover (CSS), không dùng whileHover
  // của framer nữa — hai bên cùng ghi transform thì đá nhau.
  return (
    <article className="card-hover group glass flex flex-col overflow-hidden rounded-2xl">
      {/* Ảnh chỉ để trang trí: tên sản phẩm ngay bên dưới đã là link rồi,
          nên link ảnh bị ẩn khỏi screen reader. Nhãn "ảnh minh hoạ" vì thế
          phải nằm NGOÀI link, không thì trình đọc màn hình bỏ qua nó. */}
      <div className="relative">
        <Link
          to="/shop/$slug"
          params={{ slug: product.slug }}
          tabIndex={-1}
          aria-hidden="true"
          className="block aspect-[4/3] overflow-hidden bg-mystic/10"
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <ProductArtwork
              slug={product.slug}
              categorySlug={product.categorySlug}
              className="h-full w-full transition-transform duration-500 group-hover:scale-105"
            />
          )}
          {discount !== null && (
            <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
              -{discount}%
            </span>
          )}
        </Link>
        {product.imageIsIllustrative && product.imageUrl && (
          <IllustrativeNote />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {product.categoryName && (
          <span className="text-[11px] uppercase tracking-[0.2em] text-gold/70">
            {product.categoryName}
          </span>
        )}
        <h2 className="mt-1 font-display text-lg leading-snug">
          <Link
            to="/shop/$slug"
            params={{ slug: product.slug }}
            className="text-foreground transition hover:text-gold"
          >
            {product.name}
          </Link>
        </h2>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-xl text-gold">
            {formatVND(product.price)}
          </span>
          {discount !== null && product.compareAtPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatVND(product.compareAtPrice)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          <BuyOnPlatformButton product={product} />
        </div>
      </div>
    </article>
  );
}
