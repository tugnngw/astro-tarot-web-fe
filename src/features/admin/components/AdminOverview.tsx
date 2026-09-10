// Bảng tổng quan cho trang Quản trị — KPI + biểu đồ tương tác.
//
// Đứng đầu vì đây là câu hỏi đầu tiên của người quản trị mỗi lần mở trang:
// hệ thống đang có bao nhiêu người, bao nhiêu việc đang chờ tay mình. Mọi con
// số đọc từ một lần gọi /api/v1/admin/stats — toàn phép đếm ở tầng CSDL, không
// kéo bản ghi về đếm trong trình duyệt.
//
// Biểu đồ dùng Recharts: rê chuột vào cột / phần bánh để xem số liệu chi tiết.
import {
  Users,
  UserCheck,
  CalendarClock,
  Flag,
  MousePointerClick,
  Package,
  AlertCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminStats } from "@/features/admin/queries";
import type { AdminStats } from "@/api/admin";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

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

const ROLE_COLORS: Record<string, string> = {
  USER: "#38bdf8",
  STAFF: "#34d399",
  MANAGER: "#a78bfa",
  ADMIN: "#d4a84b",
};

const BOOKING_COLORS: Record<string, string> = {
  PENDING: "#fbbf24",
  CONFIRMED: "#38bdf8",
  COMPLETED: "#34d399",
  CANCELLED: "#fb7185",
};

function nf(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function AdminOverview() {
  const query = useAdminStats();

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass h-28 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass h-72 animate-pulse rounded-2xl" />
          <div className="glass h-72 animate-pulse rounded-2xl" />
        </div>
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
        <RoleChart users={s.users} />
        <BookingChart bookings={s.bookings} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReaderChart readers={s.readers} />
        <ShopChart shop={s.shop} />
      </div>
    </div>
  );
}

function RoleChart({ users }: { users: AdminStats["users"] }) {
  const order = ["USER", "STAFF", "MANAGER", "ADMIN"] as const;
  const data = order.map((role) => ({
    key: role,
    name: ROLE_VI[role],
    value: Number(users.byRole[role] ?? 0),
    fill: ROLE_COLORS[role],
  }));
  const total = users.total;

  const config = {
    value: { label: "Số tài khoản" },
    ...Object.fromEntries(
      data.map((d) => [d.key, { label: d.name, color: d.fill }]),
    ),
  } satisfies ChartConfig;

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg">Tài khoản theo vai trò</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Rê chuột vào từng phần để xem số lượng và tỉ lệ.
      </p>

      {total === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Chưa có tài khoản nào.
        </p>
      ) : (
        <ChartContainer config={config} className="mx-auto mt-2 aspect-square max-h-[280px] w-full">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => {
                    const n = Number(value) || 0;
                    const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                    const label =
                      (item?.payload as { name?: string } | undefined)?.name ??
                      String(_name);
                    return (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {nf(n)} · {pct}%
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={96}
              strokeWidth={2}
              stroke="oklch(0.16 0.02 280)"
            >
              {data.map((d) => (
                <Cell
                  key={d.key}
                  fill={d.fill}
                  className="outline-none transition-opacity hover:opacity-90"
                />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="key" />}
              className="-translate-y-1 flex-wrap gap-2"
            />
          </PieChart>
        </ChartContainer>
      )}
    </section>
  );
}

function BookingChart({ bookings }: { bookings: AdminStats["bookings"] }) {
  const order = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
  const data = order.map((st) => ({
    key: st,
    label: BOOKING_VI[st],
    count: Number(bookings.byStatus[st] ?? 0),
    fill: BOOKING_COLORS[st],
  }));
  const total = bookings.total;

  const config = {
    count: { label: "Lượt đặt", color: "#d4a84b" },
  } satisfies ChartConfig;

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg">Đặt lịch theo trạng thái</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Rê chuột vào cột để xem số lượt và tỉ lệ trên tổng {nf(total)}.
      </p>

      {total === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Chưa có lượt đặt lịch nào.
        </p>
      ) : (
        <ChartContainer config={config} className="mt-4 aspect-auto h-[260px] w-full">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={36}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fill: "oklch(0.75 0.12 85 / 0.12)" }}
              content={
                <ChartTooltipContent
                  labelKey="label"
                  formatter={(value, _name, item) => {
                    const n = Number(value) || 0;
                    const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                    const label =
                      (item?.payload as { label?: string } | undefined)?.label ??
                      "Lượt";
                    return (
                      <div className="flex w-full flex-col gap-0.5">
                        <span className="font-medium text-foreground">{label}</span>
                        <span className="font-mono tabular-nums text-muted-foreground">
                          {nf(n)} lượt · {pct}% tổng
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((d) => (
                <Cell key={d.key} fill={d.fill} className="outline-none" />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </section>
  );
}

function ReaderChart({ readers }: { readers: AdminStats["readers"] }) {
  const data = [
    {
      key: "pending",
      label: "Chờ duyệt",
      count: Number(readers.pendingApplications),
      fill: "#fbbf24",
    },
    {
      key: "active",
      label: "Hồ sơ đang có",
      count: Number(readers.activeProfiles),
      fill: "#d4a84b",
    },
  ];

  const config = {
    count: { label: "Số hồ sơ", color: "#d4a84b" },
  } satisfies ChartConfig;

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg">Hồ sơ Reader</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Rê chuột vào cột để xem chi tiết từng nhóm.
      </p>

      <ChartContainer config={config} className="mt-4 aspect-auto h-[240px] w-full">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={36}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip
            cursor={{ fill: "oklch(0.75 0.12 85 / 0.12)" }}
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => {
                  const n = Number(value) || 0;
                  const label =
                    (item?.payload as { label?: string } | undefined)?.label ??
                    "Hồ sơ";
                  return (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-medium tabular-nums">
                        {nf(n)}
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
            {data.map((d) => (
              <Cell key={d.key} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </section>
  );
}

function ShopChart({ shop }: { shop: AdminStats["shop"] }) {
  const data = [
    {
      key: "products",
      label: "Sản phẩm đang bán",
      count: Number(shop.activeProducts),
      fill: "#a78bfa",
    },
    {
      key: "clicks30",
      label: "Bấm 30 ngày",
      count: Number(shop.clicksLast30Days),
      fill: "#38bdf8",
    },
    {
      key: "clicksTotal",
      label: "Bấm tổng cộng",
      count: Number(shop.clicksTotal),
      fill: "#d4a84b",
    },
  ];

  const config = {
    count: { label: "Số lượng", color: "#d4a84b" },
  } satisfies ChartConfig;

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg">Cửa hàng liên kết</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Rê chuột vào cột để xem số liệu từng chỉ số.
      </p>

      <ChartContainer config={config} className="mt-4 aspect-auto h-[240px] w-full">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip
            cursor={{ fill: "oklch(0.75 0.12 85 / 0.12)" }}
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => {
                  const n = Number(value) || 0;
                  const label =
                    (item?.payload as { label?: string } | undefined)?.label ??
                    "Chỉ số";
                  return (
                    <div className="flex w-full flex-col gap-0.5">
                      <span className="font-medium text-foreground">{label}</span>
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {nf(n)}
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((d) => (
              <Cell key={d.key} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </section>
  );
}
