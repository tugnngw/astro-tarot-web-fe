import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { StarField } from "@/components/StarField";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { formatVND } from "@/lib/mock-data";
import { ProductArtwork } from "@/components/ProductArtwork";
import { useCheckout } from "@/features/shop/queries";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "Giỏ hàng — ASTROTAROT" }],
  }),
  component: CartPage,
});

/** Khớp với FLAT_SHIPPING_FEE ở OrderServiceImpl của BE. */
const SHIPPING_FEE = 30_000;

/** Cùng luật với @Pattern trên CheckoutRequest của BE. */
const PHONE_PATTERN = /^0[0-9]{9}$/;

interface FormErrors {
  receiverName?: string;
  receiverPhone?: string;
  shippingAddress?: string;
}

function CartPage() {
  const { user, openAuth } = useAuth();
  const { cart, busy, loading } = useCart();
  const checkoutMutation = useCheckout();
  const navigate = useNavigate();

  const nameId = useId();
  const phoneId = useId();
  const addressId = useId();
  const noteId = useId();

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // AuthProvider đọc localStorage trong useEffect nên `user` còn null ở lần
  // render đầu. Điền sẵn khi user xuất hiện, nhưng chỉ khi ô đang trống để
  // không ghi đè thứ người dùng vừa gõ.
  useEffect(() => {
    if (!user) return;
    setReceiverName((v) => v || user.name || "");
    setReceiverPhone((v) => v || user.phone || "");
  }, [user]);

  if (!user) {
    return (
      <Shell>
        <Panel title="Đăng nhập để xem giỏ hàng" description="Giỏ hàng được lưu theo tài khoản nên bạn xem lại được ở bất kỳ thiết bị nào.">
          <button
            type="button"
            onClick={() => openAuth("login")}
            className="mt-5 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold"
          >
            Đăng nhập
          </button>
        </Panel>
      </Shell>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const total = items.length > 0 ? subtotal + SHIPPING_FEE : 0;

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!receiverName.trim()) next.receiverName = "Vui lòng nhập tên người nhận";
    if (!PHONE_PATTERN.test(receiverPhone.trim())) {
      next.receiverPhone = "Số điện thoại gồm 10 chữ số và bắt đầu bằng 0";
    }
    if (!shippingAddress.trim()) {
      next.shippingAddress = "Vui lòng nhập địa chỉ giao hàng";
    }
    return next;
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();

    // Validate ngay trên client để báo lỗi ngay dưới từng ô, thay vì bắt
    // người dùng chờ một vòng request rồi mới thấy toast chung chung.
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      const order = await checkoutMutation.mutateAsync({
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        note: note.trim() || undefined,
      });
      toast.success(`Đặt hàng thành công — mã đơn ${order.orderCode}`);
      navigate({ to: "/orders" });
    } catch (err) {
      // BE vẫn là nơi quyết định cuối (hết hàng, sản phẩm ngừng bán...),
      // hiện nguyên văn thông điệp của nó.
      toast.error(err instanceof Error ? err.message : "Đặt hàng thất bại");
    }
  }

  if (loading) {
    return (
      <Shell>
        <h1 className="font-display text-3xl sm:text-4xl">
          Giỏ <span className="text-gradient-gold">hàng</span>
        </h1>
        <div className="mt-8 space-y-4" aria-busy="true">
          {Array.from({ length: 2 }, (_, i) => (
            <div
              key={i}
              className="glass h-28 animate-pulse rounded-2xl"
              aria-hidden="true"
            />
          ))}
        </div>
      </Shell>
    );
  }

  if (items.length === 0) {
    return (
      <Shell>
        <Panel
          title="Giỏ hàng đang trống"
          description="Chưa có vật phẩm nào trong giỏ. Ghé Shop xem bộ bài và đá khoáng nhé."
        >
          <Link
            to="/shop"
            className="mt-5 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold"
          >
            Khám phá Shop ✦
          </Link>
        </Panel>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-3xl sm:text-4xl">
        Giỏ <span className="text-gradient-gold">hàng</span>
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section aria-label="Sản phẩm trong giỏ" className="space-y-4">
          <ul className="space-y-4">
            {items.map((it) => (
              <li
                key={it.id}
                className="glass flex gap-4 rounded-2xl p-4 sm:items-center"
              >
                <Link
                  to="/shop/$slug"
                  params={{ slug: it.productSlug }}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-mystic/10"
                >
                  {it.imageUrl ? (
                    <img
                      src={it.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ProductArtwork
                      slug={it.productSlug}
                      className="h-full w-full"
                    />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/shop/$slug"
                      params={{ slug: it.productSlug }}
                      className="line-clamp-2 text-sm text-foreground transition hover:text-gold"
                    >
                      {it.productName}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatVND(it.unitPrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <QuantityStepper item={it} disabled={busy} />

                    <div className="w-28 text-right font-display text-lg text-gold">
                      {formatVND(it.lineTotal)}
                    </div>

                    <RemoveButton item={it} disabled={busy} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-gold"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Tiếp tục mua
            sắm
          </Link>
        </section>

        <form
          onSubmit={handleCheckout}
          noValidate
          className="glass h-fit rounded-2xl p-6"
        >
          <h2 className="font-display text-xl">Thông tin giao hàng</h2>

          <div className="mt-4 space-y-3">
            <Field
              id={nameId}
              label="Người nhận"
              value={receiverName}
              onChange={setReceiverName}
              placeholder="Nguyễn Văn A"
              maxLength={150}
              autoComplete="name"
              error={errors.receiverName}
            />
            <Field
              id={phoneId}
              label="Số điện thoại"
              value={receiverPhone}
              onChange={setReceiverPhone}
              placeholder="0912345678"
              inputMode="tel"
              autoComplete="tel"
              error={errors.receiverPhone}
            />
            <Field
              id={addressId}
              label="Địa chỉ giao hàng"
              value={shippingAddress}
              onChange={setShippingAddress}
              placeholder="Số nhà, đường, phường, quận, tỉnh/thành"
              autoComplete="street-address"
              multiline
              error={errors.shippingAddress}
            />
            <Field
              id={noteId}
              label="Ghi chú (không bắt buộc)"
              value={note}
              onChange={setNote}
              placeholder="Ví dụ: giao giờ hành chính"
              maxLength={500}
              multiline
            />
          </div>

          <div className="mt-6 space-y-2 border-t border-border/50 pt-4 text-sm">
            <Row label="Tạm tính" value={formatVND(subtotal)} />
            <Row label="Phí giao hàng" value={formatVND(SHIPPING_FEE)} />
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <span className="text-foreground">Tổng cộng</span>
              <span className="font-display text-2xl text-gold">
                {formatVND(total)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={checkoutMutation.isPending || busy}
            className="mt-5 w-full rounded-full bg-gold py-3 text-sm font-medium text-primary-foreground glow-gold transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {checkoutMutation.isPending ? "Đang đặt hàng..." : "Đặt hàng ✦"}
          </button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            Đơn sẽ ở trạng thái chờ xác nhận. Thanh toán trực tuyến chưa mở, shop
            sẽ liên hệ để xác nhận đơn.
          </p>
        </form>
      </div>
    </Shell>
  );
}

function QuantityStepper({
  item,
  disabled,
}: {
  item: { id: string; quantity: number; stock: number; productName: string };
  disabled: boolean;
}) {
  const { update } = useCart();

  async function change(next: number) {
    if (next < 1 || next > item.stock) return;
    try {
      await update(item.id, next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không cập nhật được giỏ");
    }
  }

  return (
    <div
      className="flex items-center rounded-full border border-gold/40"
      role="group"
      aria-label={`Số lượng ${item.productName}`}
    >
      <button
        type="button"
        onClick={() => change(item.quantity - 1)}
        disabled={disabled || item.quantity <= 1}
        aria-label="Giảm số lượng"
        className="grid h-8 w-8 place-items-center rounded-full text-gold transition hover:bg-gold/10 disabled:opacity-30"
      >
        <Minus aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
      <output aria-live="polite" className="w-8 text-center text-sm">
        {item.quantity}
      </output>
      <button
        type="button"
        onClick={() => change(item.quantity + 1)}
        disabled={disabled || item.quantity >= item.stock}
        aria-label="Tăng số lượng"
        className="grid h-8 w-8 place-items-center rounded-full text-gold transition hover:bg-gold/10 disabled:opacity-30"
      >
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function RemoveButton({
  item,
  disabled,
}: {
  item: { id: string; productName: string };
  disabled: boolean;
}) {
  const { remove } = useCart();

  async function handleRemove() {
    try {
      await remove(item.id);
      toast.success(`Đã xoá "${item.productName}" khỏi giỏ`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không xoá được sản phẩm");
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={disabled}
      aria-label={`Xoá ${item.productName} khỏi giỏ`}
      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
    >
      <Trash2 aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Header />
      <StarField count={40} seed={6} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <ShoppingBag aria-hidden="true" className="h-10 w-10 text-gold/60" />
      <h1 className="mt-4 font-display text-2xl">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  multiline,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "tel" | "numeric" | "text";
  autoComplete?: string;
}) {
  const errorId = `${id}-error`;
  const className = `mt-1 w-full rounded-xl border bg-input/70 px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold ${
    error ? "border-destructive" : "border-gold/30"
  }`;

  return (
    <div>
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>
      {multiline ? (
        <textarea
          {...rest}
          id={id}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`${className} resize-none`}
        />
      ) : (
        <input
          {...rest}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={className}
        />
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
