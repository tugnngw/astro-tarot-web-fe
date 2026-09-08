import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Package, PackageX, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { formatVND } from "@/lib/mock-data";
import { useCancelOrder, useMyOrders } from "@/features/shop/queries";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  type Order,
  type OrderStatus,
} from "@/api/shop";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [{ title: "Đơn hàng của tôi — ASTROTAROT" }],
  }),
  component: OrdersPage,
});

/** Chỉ huỷ được khi shop chưa gửi hàng — khớp luật ở OrderServiceImpl. */
const CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED"];

const STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "border-gold/50 bg-gold/10 text-gold",
  CONFIRMED: "border-mystic/60 bg-mystic/15 text-foreground",
  SHIPPING: "border-mystic/60 bg-mystic/15 text-foreground",
  COMPLETED: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  CANCELLED: "border-destructive/50 bg-destructive/10 text-destructive",
};

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

function OrdersPage() {
  const { user, openAuth } = useAuth();
  const ordersQuery = useMyOrders(Boolean(user));
  const cancelMutation = useCancelOrder();

  // Theo dõi từng đơn riêng: chỉ nút của đơn đang huỷ mới bị khoá,
  // các đơn khác vẫn bấm được.
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleCancel(order: Order) {
    setCancellingId(order.id);
    try {
      await cancelMutation.mutateAsync({
        orderId: order.id,
        reason: "Khách tự huỷ",
      });
      toast.success(`Đã huỷ đơn ${order.orderCode}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không huỷ được đơn");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="relative min-h-screen">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl sm:text-4xl">
          Đơn <span className="text-gradient-gold">hàng của tôi</span>
        </h1>

        {!user ? (
          <EmptyPanel
            icon={<Package aria-hidden="true" className="h-10 w-10 text-gold/60" />}
            title="Đăng nhập để xem đơn hàng"
          >
            <button
              type="button"
              onClick={() => openAuth("login")}
              className="mt-5 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold"
            >
              Đăng nhập
            </button>
          </EmptyPanel>
        ) : ordersQuery.isPending ? (
          <div className="mt-8 space-y-4" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="glass h-40 animate-pulse rounded-2xl"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : ordersQuery.isError ? (
          <EmptyPanel
            icon={
              <AlertCircle
                aria-hidden="true"
                className="h-10 w-10 text-destructive/70"
              />
            }
            title="Không tải được đơn hàng"
            description="Có thể do mất kết nối tới máy chủ."
          >
            <button
              type="button"
              onClick={() => void ordersQuery.refetch()}
              className="mt-5 rounded-full border border-gold/50 px-5 py-2 text-sm text-gold transition hover:bg-gold/10"
            >
              Thử lại
            </button>
          </EmptyPanel>
        ) : ordersQuery.data.length === 0 ? (
          <EmptyPanel
            icon={<PackageX aria-hidden="true" className="h-10 w-10 text-gold/60" />}
            title="Chưa có đơn hàng nào"
            description="Khi bạn đặt vật phẩm từ Shop, đơn sẽ hiện ở đây để theo dõi trạng thái."
          >
            <Link
              to="/shop"
              className="mt-5 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-primary-foreground glow-gold"
            >
              Khám phá Shop ✦
            </Link>
          </EmptyPanel>
        ) : (
          <ul className="mt-8 space-y-5">
            {ordersQuery.data.map((o) => (
              <li key={o.id}>
                <article className="glass rounded-2xl p-5">
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg text-foreground">
                        {o.orderCode}
                      </h2>
                      <time
                        dateTime={o.createdAt}
                        className="mt-0.5 block text-xs text-muted-foreground"
                      >
                        {new Date(o.createdAt).toLocaleDateString(
                          "vi-VN",
                          DATE_FORMAT,
                        )}
                      </time>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] ${STATUS_STYLE[o.status]}`}
                      >
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                      <span className="rounded-full border border-border/60 px-3 py-1 text-[11px] text-muted-foreground">
                        {PAYMENT_STATUS_LABEL[o.paymentStatus]}
                      </span>
                    </div>
                  </header>

                  <ul className="mt-4 space-y-2 border-t border-border/50 pt-4">
                    {o.items.map((it) => (
                      <li
                        key={it.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">
                          {it.productName}{" "}
                          <span className="text-foreground/60">
                            × {it.quantity}
                          </span>
                        </span>
                        <span className="shrink-0 text-foreground">
                          {formatVND(it.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <footer className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border/50 pt-4">
                    <div className="text-xs leading-relaxed text-muted-foreground">
                      <div>
                        {o.receiverName} · {o.receiverPhone}
                      </div>
                      <div className="max-w-md">{o.shippingAddress}</div>
                      {o.cancelReason && (
                        <div className="mt-1 text-destructive">
                          Lý do huỷ: {o.cancelReason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {CANCELLABLE.includes(o.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancel(o)}
                          disabled={cancellingId === o.id}
                          className="rounded-full border border-destructive/50 px-4 py-1.5 text-xs text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
                        >
                          {cancellingId === o.id ? "Đang huỷ..." : "Huỷ đơn"}
                        </button>
                      )}
                      <div className="text-right">
                        <div className="text-[11px] text-muted-foreground">
                          Tổng cộng
                        </div>
                        <div className="font-display text-xl text-gold">
                          {formatVND(o.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </footer>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function EmptyPanel({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass mt-8 flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      {icon}
      <h2 className="mt-4 font-display text-xl">{title}</h2>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
