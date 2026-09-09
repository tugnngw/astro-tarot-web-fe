// Bảng tổng quan cho trang Quản trị.
//
// Đứng đầu vì đây là câu hỏi đầu tiên của người quản trị mỗi lần mở trang:
// hệ thống đang có bao nhiêu người, bao nhiêu việc đang chờ tay mình. Mọi con
// số đọc từ một lần gọi /api/v1/admin/stats — toàn phép đếm ở tầng CSDL, không
// kéo bản ghi về đếm trong trình duyệt.
import {
  Users,
  UserCheck,
  CalendarClock,
  Flag,
  MousePointerClick,
  Package,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useAdminStats } from "@/features/admin/queries";
import type { AdminStats } from "@/api/admin";

const ROLE_VI: Record<string, string> = {
  USER: "Thành viên",
  STAFF: "Nhân viên",
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
};

const BOOKING_VI: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
};

// Màu thanh trạng thái đặt lịch — cùng hệ với phần còn lại của trang, đủ khác
// nhau để phân biệt mà không lòe loẹt.
const BOOKING_BAR: Record<string, string> = {
  PENDING: "bg-amber-400/70",
  CONFIRMED: "bg-sky-400/70",
  COMPLETED: "bg-emerald-400/70",
  CANCELLED: "bg-rose-400/60",
};

function nf(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function AdminOverview() {
  const query = useAdminStats();

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass h-28 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <section className="glass flex items-center gap-3 rounded-2xl border border-rose-400/30 p-5">
        <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
        <div>
          <p className="text-sm">Không tải được số liệu tổng quan.</p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-1 text-sm text-gold underline-offset-4 hover:underline"
          >
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  const s = query.data;

  const kpis = [
    {
      icon: Users,
      label: "Tài khoản",
      value: s.users.total,
      hint: `+${nf(s.users.newLast7Days)} trong 7 ngày`,
    },
    {
      icon: UserCheck,
      label: "Hồ sơ Reader chờ duyệt",
      value: s.readers.pendingApplications,
      hint: `${nf(s.readers.activeProfiles)} hồ sơ đang có`,
      alert: s.readers.pendingApplications > 0,
    },
    {
      icon: CalendarClock,
      label: "Lượt đặt lịch",
      value: s.bookings.total,
      hint: `${nf(s.bookings.byStatus.PENDING ?? 0)} đang chờ xác nhận`,
    },
    {
      icon: Flag,
      label: "Báo cáo chờ xử lý",
      value: s.moderation.pendingReports,
      hint: s.moderation.pendingReports > 0 ? "Cần xem" : "Không tồn đọng",
      alert: s.moderation.pendingReports > 0,
    },
    {
      icon: MousePointerClick,
      label: "Lượt sang sàn (30 ngày)",
      value: s.shop.clicksLast30Days,
      hint: `${nf(s.shop.clicksTotal)} tổng cộng`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hàng chỉ số chính */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-lg p-2 ${
                    k.alert ? "bg-amber-400/15 text-amber-300" : "bg-gold/10 text-gold"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 font-display text-3xl leading-none">
                {nf(k.value)}
              </div>
              <div className="mt-1.5 text-sm text-foreground/80">{k.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{k.hint}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RoleBreakdown users={s.users} />
        <BookingBreakdown bookings={s.bookings} />
      </div>

      <ShopSummary shop={s.shop} />
    </div>
  );
}

function Bar({ value, total, className }: { value: number; total: number; className: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-mystic/20">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RoleBreakdown({ users }: { users: AdminStats["users"] }) {
  // Thứ tự quyền tăng dần để bảng luôn đọc từ ít quyền tới nhiều quyền.
  const order = ["USER", "STAFF", "MANAGER", "ADMIN"];
  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg">Tài khoản theo vai trò</h2>
      </div>
      <dl className="mt-4 space-y-3">
        {order.map((role) => {
          const count = users.byRole[role as keyof typeof users.byRole] ?? 0;
          return (
            <div key={role} className="flex items-center gap-3">
              <dt className="w-28 shrink-0 text-sm text-foreground/80">
                {ROLE_VI[role] ?? role}
              </dt>
              <Bar value={count} total={users.total} className="bg-gold/60" />
              <dd className="w-10 shrink-0 text-right text-sm tabular-nums">
                {nf(count)}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function BookingBreakdown({ bookings }: { bookings: AdminStats["bookings"] }) {
  const order = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg">Đặt lịch theo trạng thái</h2>
      </div>
      {bookings.total === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Chưa có lượt đặt lịch nào.</p>
      ) : (
        <dl className="mt-4 space-y-3">
          {order.map((st) => {
            const count = bookings.byStatus[st] ?? 0;
            return (
              <div key={st} className="flex items-center gap-3">
                <dt className="w-28 shrink-0 text-sm text-foreground/80">
                  {BOOKING_VI[st] ?? st}
                </dt>
                <Bar value={count} total={bookings.total} className={BOOKING_BAR[st] ?? "bg-gold/60"} />
                <dd className="w-10 shrink-0 text-right text-sm tabular-nums">
                  {nf(count)}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}

function ShopSummary({ shop }: { shop: AdminStats["shop"] }) {
  const items = [
    { icon: Package, label: "Sản phẩm đang bán", value: shop.activeProducts },
    { icon: MousePointerClick, label: "Lượt sang sàn (30 ngày)", value: shop.clicksLast30Days },
    { icon: TrendingUp, label: "Tổng lượt sang sàn", value: shop.clicksTotal },
  ];
  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg">Cửa hàng liên kết</h2>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="flex items-center gap-3">
              <span className="rounded-lg bg-gold/10 p-2 text-gold">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <div className="font-display text-2xl leading-none">{nf(it.value)}</div>
                <div className="mt-1 text-xs text-muted-foreground">{it.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
