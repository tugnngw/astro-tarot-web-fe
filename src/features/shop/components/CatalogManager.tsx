import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  MousePointerClick,
  PackagePlus,
  Pencil,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createProduct,
  getAdminProducts,
  getAffiliateStats,
  PLATFORMS,
  setProductActive,
  updateProduct,
  type Platform,
  type SaveProductPayload,
} from "@/api/catalog";
import { PLATFORM_LABEL, type Product } from "@/api/shop";
import { useCategories } from "@/features/shop/queries";
import { formatVND } from "@/lib/mock-data";

const catalogKeys = {
  all: ["catalog-admin"] as const,
  products: (q: object) => [...catalogKeys.all, "products", q] as const,
  stats: (days: number) => [...catalogKeys.all, "stats", days] as const,
};

/**
 * Quản lý sản phẩm liên kết.
 *
 * Shop không bán trực tiếp nữa nên màn này không có tồn kho: việc của nó là
 * gắn đúng link sang sàn và xem sản phẩm nào được bấm nhiều.
 */
export function CatalogManager() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  const query = useQuery({
    queryKey: catalogKeys.products({ keyword: debounced }),
    queryFn: () => getAdminProducts({ keyword: debounced || undefined, page: 0, size: 100 }),
    placeholderData: keepPreviousData,
  });

  const stats = useQuery({
    queryKey: catalogKeys.stats(30),
    queryFn: () => getAffiliateStats(30),
  });

  const toggle = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => setProductActive(id, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
  });

  const products = query.data?.content ?? [];

  return (
    <div className="space-y-4">
      {/* Số liệu liên kết */}
      <section className="glass rounded-2xl p-5">
        <h2 className="flex items-center gap-2 font-display text-xl">
          <MousePointerClick aria-hidden="true" className="h-5 w-5 text-gold" />
          Lượt bấm sang sàn
        </h2>
        {stats.isPending ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-4" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-mystic/10" />
            ))}
          </div>
        ) : stats.isError ? (
          <p className="mt-3 text-sm text-muted-foreground">Không tải được số liệu.</p>
        ) : (
          <>
            <dl className="mt-4 grid gap-3 sm:grid-cols-4">
              <Stat label={`${stats.data!.periodDays} ngày qua`} value={String(stats.data!.clicksInPeriod)} />
              <Stat label="Tổng lượt bấm" value={String(stats.data!.totalClicks)} />
              <Stat label="Đã gắn link" value={String(stats.data!.productsWithLink)} />
              <Stat
                label="Chưa gắn link"
                value={String(stats.data!.productsWithoutLink)}
                warn={stats.data!.productsWithoutLink > 0}
              />
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Hoa hồng ước lượng:{" "}
              <span className="text-gold">{formatVND(stats.data!.estimatedCommission)}</span> — tính
              theo giá × tỉ lệ × lượt bấm. Đây <strong className="text-foreground">không phải</strong>{" "}
              doanh thu: mình chỉ đếm được người bấm sang, không biết ai mua. Số thật nằm ở báo cáo
              đối tác của sàn.
            </p>
          </>
        )}
      </section>

      {/* Danh sách sản phẩm */}
      <section className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Sản phẩm</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Gắn link tiếp thị của sàn vào từng sản phẩm. Sản phẩm chưa có link vẫn hiện
              nhưng không có nút mua.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-1.5 text-sm text-gold transition hover:bg-gold/10"
          >
            <PackagePlus aria-hidden="true" className="h-4 w-4" />
            Thêm sản phẩm
          </button>
        </div>

        <div className="relative mt-4 max-w-md">
          <label htmlFor="catalog-search" className="sr-only">
            Tìm sản phẩm
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="catalog-search"
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tên sản phẩm..."
            className="w-full rounded-full border border-gold/30 bg-input/70 py-2 pl-10 pr-4 text-sm text-foreground outline-none focus:border-gold"
          />
        </div>

        <div className="mt-5" aria-live="polite" aria-busy={query.isFetching}>
          {query.isError ? (
            <div className="flex flex-col items-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive/70" />
              <p className="mt-3 text-sm text-muted-foreground">
                {query.error instanceof Error ? query.error.message : "Không tải được sản phẩm"}
              </p>
            </div>
          ) : query.isPending ? (
            <div className="space-y-2" aria-busy="true">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-mystic/10" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gold/15 text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-normal">Sản phẩm</th>
                    <th scope="col" className="py-2 pr-3 font-normal">Giá</th>
                    <th scope="col" className="py-2 pr-3 font-normal">Liên kết</th>
                    <th scope="col" className="py-2 pr-3 font-normal">Hoa hồng</th>
                    <th scope="col" className="py-2 pr-3 font-normal">Lượt bấm</th>
                    <th scope="col" className="py-2 font-normal">
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 align-middle last:border-0">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="grid h-10 w-10 place-items-center rounded bg-mystic/20 text-xs text-gold"
                            >
                              ✦
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.categoryName ?? "Chưa phân loại"}
                              {p.featured && <span className="ml-2 text-gold">nổi bật</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 tabular-nums">{formatVND(p.price)}</td>
                      <td className="py-3 pr-3">
                        {p.affiliateUrl ? (
                          <a
                            href={p.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
                          >
                            <ExternalLink aria-hidden="true" className="h-3 w-3" />
                            {PLATFORM_LABEL[p.affiliatePlatform ?? "OTHER"] ?? "Liên kết"}
                          </a>
                        ) : (
                          <span className="text-xs text-amber-300">chưa gắn</span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-xs tabular-nums">
                        {p.commissionPercent != null ? `${Number(p.commissionPercent)}%` : "—"}
                      </td>
                      <td className="py-3 pr-3 tabular-nums">{p.clickCount ?? 0}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(p)}
                            aria-label={`Sửa ${p.name}`}
                            className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1 text-xs text-gold transition hover:bg-gold/10"
                          >
                            <Pencil aria-hidden="true" className="h-3 w-3" /> Sửa
                          </button>
                          <button
                            type="button"
                            disabled={toggle.isPending}
                            onClick={async () => {
                              try {
                                await toggle.mutateAsync({ id: p.id, value: false });
                                toast.success(`Đã ẩn "${p.name}"`);
                              } catch (e) {
                                toast.error(e instanceof Error ? e.message : "Không đổi được");
                              }
                            }}
                            aria-label={`Ẩn ${p.name}`}
                            className="inline-flex items-center gap-1 rounded-full border border-mystic/50 px-3 py-1 text-xs text-muted-foreground transition hover:border-gold/50 disabled:opacity-40"
                          >
                            <EyeOff aria-hidden="true" className="h-3 w-3" /> Ẩn
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <Eye aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/70" />
          Chỉ có ẩn, không có xoá. Sản phẩm đã có lượt bấm là số liệu — và những lượt bấm đó
          vẫn có thể đang sinh hoa hồng ở sàn.
        </p>
      </section>

      {(creating || editing) && (
        <ProductDialog
          product={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => queryClient.invalidateQueries({ queryKey: catalogKeys.all })}
        />
      )}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${warn ? "border-amber-400/40" : "border-gold/20"}`}>
      <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-display text-xl ${warn ? "text-amber-300" : "text-gold"}`}>{value}</dd>
    </div>
  );
}

function ProductDialog({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const categories = useCategories();
  const [form, setForm] = useState<SaveProductPayload>({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    compareAtPrice: product?.compareAtPrice ?? null,
    imageUrl: product?.imageUrl ?? "",
    imageIsIllustrative: product?.imageIsIllustrative ?? false,
    affiliateUrl: product?.affiliateUrl ?? "",
    affiliatePlatform: (product?.affiliatePlatform as Platform) ?? "SHOPEE",
    commissionPercent: product?.commissionPercent ?? 0,
    featured: product?.featured ?? false,
    active: true,
    categoryId: null,
  });

  const save = useMutation({
    mutationFn: (payload: SaveProductPayload) =>
      product ? updateProduct(product.id, payload) : createProduct(payload),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({
        ...form,
        compareAtPrice: form.compareAtPrice || null,
        imageUrl: form.imageUrl || null,
        affiliateUrl: form.affiliateUrl || null,
      });
      toast.success(product ? "Đã cập nhật sản phẩm" : "Đã tạo sản phẩm");
      onSaved();
      onClose();
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "Không lưu được");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-dialog-title"
        className="panel-black relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/25 p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-gold/30 text-gold transition hover:bg-gold/10"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>

        <h2 id="product-dialog-title" className="font-display text-xl">
          {product ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        </h2>
        {product && (
          <p className="mt-1 text-xs text-muted-foreground">
            Đường dẫn <code>{product.slug}</code> giữ nguyên kể cả khi đổi tên — đổi slug là
            làm hỏng mọi link đã chia sẻ.
          </p>
        )}

        <form onSubmit={submit} className="mt-5 space-y-3">
          <Field label="Tên sản phẩm" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
          <label className="block">
            <span className="text-xs text-muted-foreground">Mô tả</span>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Giá tham khảo (₫)"
              value={String(form.price)}
              onChange={(v) => setForm((f) => ({ ...f, price: Number(v.replace(/[^0-9]/g, "")) || 0 }))}
              inputMode="numeric"
              required
            />
            <Field
              label="Giá gạch ngang (₫)"
              value={form.compareAtPrice ? String(form.compareAtPrice) : ""}
              onChange={(v) =>
                setForm((f) => ({ ...f, compareAtPrice: v ? Number(v.replace(/[^0-9]/g, "")) : null }))
              }
              inputMode="numeric"
            />
          </div>

          <Field
            label="Ảnh (đường dẫn)"
            value={form.imageUrl ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
          />

          <Field
            label="Liên kết tiếp thị"
            value={form.affiliateUrl ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, affiliateUrl: v }))}
            placeholder="https://shopee.vn/..."
          />
          <p className="text-[11px] text-muted-foreground">
            Dán link tiếp thị lấy từ chương trình đối tác của sàn, không phải link sản phẩm
            thường — link thường thì không ghi công hoa hồng cho mình.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-muted-foreground">Sàn</span>
              <select
                value={form.affiliatePlatform}
                onChange={(e) => setForm((f) => ({ ...f, affiliatePlatform: e.target.value as Platform }))}
                className="mt-1 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABEL[p]}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Hoa hồng (%)"
              value={String(form.commissionPercent ?? 0)}
              onChange={(v) => setForm((f) => ({ ...f, commissionPercent: Number(v.replace(/[^0-9.]/g, "")) || 0 }))}
              inputMode="numeric"
            />
          </div>

          <label className="block">
            <span className="text-xs text-muted-foreground">Danh mục</span>
            <select
              value={form.categoryId ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value || null }))}
              className="mt-1 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
            >
              <option value="">Chưa phân loại</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2 pt-1">
            <Checkbox
              checked={Boolean(form.imageIsIllustrative)}
              onChange={(v) => setForm((f) => ({ ...f, imageIsIllustrative: v }))}
              label="Ảnh minh hoạ (không phải ảnh chụp đúng món)"
            />
            <Checkbox
              checked={Boolean(form.featured)}
              onChange={(v) => setForm((f) => ({ ...f, featured: v }))}
              label="Hiện ở mục nổi bật trên trang chủ"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-mystic/50 px-4 py-2 text-sm text-foreground/80 transition hover:border-gold/50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-primary-foreground glow-gold disabled:opacity-40"
            >
              {save.isPending ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  inputMode,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputMode?: "numeric";
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        required={required}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gold/25 bg-input/70 px-3 py-2 text-sm outline-none focus:border-gold"
      />
    </label>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--gold)]"
      />
      {label}
    </label>
  );
}
