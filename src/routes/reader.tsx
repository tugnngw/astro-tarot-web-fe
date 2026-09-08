// Reader Workspace — chỉ role READER mới được vào (bảo vệ qua <RoleGuard />).
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Calendar,
  Wallet,
  Plus,
  Trash2,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth-context";
import { useSlots, useBookings } from "@/lib/use-booking-store";
import {
  addSlot,
  removeSlot,
  updateBookingStatus,
  isSlotBooked,
} from "@/lib/booking-store";

export const Route = createFileRoute("/reader")({
  head: () => ({ meta: [{ title: "Reader Workspace — ASTROTAROT" }] }),
  component: () => (
    <RoleGuard allow={["reader"]}>
      <ReaderPage />
    </RoleGuard>
  ),
});

// Map reader account email to a reader profile id (mock mapping)
function readerIdFor(_email: string): string {
  return "r1";
}

function ReaderPage() {
  // RoleGuard đã bảo đảm role === "reader", user chắc chắn tồn tại ở đây.
  const { user } = useAuth();
  const readerId = readerIdFor(user!.email); // map account → reader_profiles.id
  const slots = useSlots(readerId); // lịch trống do reader tự thêm
  const bookings = useBookings().filter((b) => b.readerId === readerId);
  const [date, setDate] = useState(""); // input ngày khi thêm slot mới
  const [time, setTime] = useState(""); // input giờ khi thêm slot mới

  // Tổng tiền theo trạng thái thanh toán (đã thu / đang escrow)
  const paid = bookings
    .filter((b) => b.status === "paid")
    .reduce((s, b) => s + b.amount, 0);
  const pending = bookings
    .filter((b) => b.status === "pending")
    .reduce((s, b) => s + b.amount, 0);

  // Lưới 7 ngày hiển thị calendar tuần này
  const week = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, []);

  const add = () => {
    if (!date || !time) return toast.error("Chọn ngày và giờ");
    addSlot({ readerId, date, time });
    setDate("");
    setTime("");
    toast.success("Đã thêm lịch trống ✦");
  };

  return (
    <div className="relative min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-gradient-gold">
              Reader Workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              Xin chào {user!.name} — quản lý lịch và đơn hàng.
            </p>
          </div>
          <Link
            to="/readers/$id"
            params={{ id: readerId }}
            className="rounded-full border border-gold/40 px-3 py-1.5 text-xs text-gold hover:bg-gold/10"
          >
            Xem hồ sơ công khai
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card
            icon={Wallet}
            label="Doanh thu đã thanh toán"
            value={`${paid.toLocaleString("vi-VN")} ₫`}
            cta="Rút thu nhập"
            onCta={() => toast.success("Yêu cầu rút tiền đã gửi")}
          />
          <Card
            icon={Clock}
            label="Đang Escrow / chờ"
            value={`${pending.toLocaleString("vi-VN")} ₫`}
            hint="Giải ngân sau khi user xác nhận"
          />
          <Card
            icon={Star}
            label="Đánh giá"
            value="4.9 / 5"
            hint={`${bookings.length} booking · ${bookings.filter((b) => b.status === "done").length} hoàn tất`}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="glass rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl text-gold-soft">
                <Calendar className="h-5 w-5" /> Lịch tuần này
              </h2>
              <span className="text-xs text-muted-foreground">
                {slots.length} slot ·{" "}
                {bookings.filter((b) => b.status !== "cancelled").length} đã
                book
              </span>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-gold/20 bg-background/30 p-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-lg border border-gold/30 bg-input/60 px-3 py-2 text-sm outline-none focus:border-gold"
              />
              <button
                onClick={add}
                className="inline-flex items-center justify-center gap-1 rounded-full bg-gold px-4 py-2 text-sm font-medium text-primary-foreground glow-gold"
              >
                <Plus className="h-4 w-4" /> Thêm slot
              </button>
            </div>

            {/* Week calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {week.map((d) => {
                const day = new Date(d);
                const daySlots = slots
                  .filter((s) => s.date === d)
                  .sort((a, b) => a.time.localeCompare(b.time));
                return (
                  <div
                    key={d}
                    className="rounded-lg border border-border/40 bg-card/30 p-2"
                  >
                    <div className="mb-2 text-center">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {
                          ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][
                            day.getDay()
                          ]
                        }
                      </div>
                      <div className="font-display text-sm text-gold">
                        {day.getDate()}/{day.getMonth() + 1}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {daySlots.length === 0 && (
                        <div className="text-center text-[10px] text-muted-foreground">
                          —
                        </div>
                      )}
                      {daySlots.map((s) => {
                        const b = isSlotBooked(s.id);
                        return (
                          <div
                            key={s.id}
                            className={`group flex items-center justify-between rounded px-1.5 py-1 text-[11px] ${b ? "bg-emerald-500/15 text-emerald-300" : "bg-gold/10 text-gold"}`}
                          >
                            <span>{s.time}</span>
                            {!b && (
                              <button
                                onClick={() => removeSlot(s.id)}
                                className="opacity-0 transition group-hover:opacity-100"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Booking list */}
            <div className="mt-6">
              <h3 className="mb-2 font-display text-base text-gold-soft">
                Đơn của bạn
              </h3>
              <div className="space-y-2">
                {bookings.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Chưa có booking nào.
                  </p>
                )}
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-card/40 px-4 py-3 text-sm"
                  >
                    <div>
                      <div className="font-medium">{b.userName}</div>
                      <div className="text-xs text-muted-foreground">
                        Slot {b.slotId.slice(-5)} ·{" "}
                        {b.amount.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                    <div className="flex gap-1">
                      {b.status === "paid" && (
                        <button
                          onClick={() => updateBookingStatus(b.id, "done")}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Hoàn tất
                        </button>
                      )}
                      {b.status !== "cancelled" && b.status !== "done" && (
                        <button
                          onClick={() => updateBookingStatus(b.id, "cancelled")}
                          className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-3 w-3" /> Huỷ
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="flex items-center gap-2 font-display text-lg text-gold-soft">
                <TrendingUp className="h-4 w-4" /> Thu nhập 7 ngày
              </h3>
              <div className="mt-3 flex h-32 items-end gap-1">
                {[40, 60, 35, 80, 55, 70, 95].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-gold/30 to-gold"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
                <span>CN</span>
              </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <h3 className="font-display text-lg text-gold-soft">
                Mẹo nâng hạng
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li>✦ Trả lời tin nhắn trong 15 phút.</li>
                <li>✦ Cập nhật ảnh đại diện rõ nét.</li>
                <li>✦ Mở ít nhất 5 slot/tuần.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  cta,
  onCta,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  cta?: string;
  onCta?: () => void;
  hint?: string;
}) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4 text-gold" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl text-gradient-gold">
        {value}
      </div>
      {cta && (
        <button
          onClick={onCta}
          className="mt-3 w-full rounded-full bg-gold py-2 text-sm font-medium text-primary-foreground glow-gold"
        >
          {cta}
        </button>
      )}
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-300",
    paid: "bg-sky-500/15 text-sky-300",
    done: "bg-emerald-500/15 text-emerald-300",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${map[status]}`}
    >
      {status}
    </span>
  );
}
