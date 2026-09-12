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
  Sparkles,
  Bot,
  Wallet,
  TrendingUp,
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

function usd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
}

function vnd(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Rút gọn số tiền trên trục Y: 1.2tr, 800k… */
function vndTruc(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/**
 * Chữ số trắng giữa lát bánh — bỏ qua lát quá nhỏ để khỏi chồng chữ.
 * Dùng chung mọi Pie trong file này.
 */
function pieWhiteLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  value?: number;
  percent?: number;
  format?: (n: number) => string;
}) {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    value = 0,
    percent = 0,
    format = nf,
  } = props;
  if (value <= 0 || percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        fontSize: 12,
        fontWeight: 600,
        paintOrder: "stroke",
        stroke: "rgba(0,0,0,0.45)",
        strokeWidth: 3,
      }}
    >
      {format(value)}
    </text>
  );
}

/** BE cũ chưa có khối `revenue` thì coi như 0 — tránh vỡ trang khi lệch phiên bản. */
function revenueStats(s: AdminStats): NonNullable<AdminStats["revenue"]> {
  return (
    s.revenue ?? {
      grossRevenue: 0,
      grossRevenueLast30Days: 0,
      platformFeePercent: 15,
      platformFee: 0,
      readerShare: 0,
      paidOut: 0,
      pendingPayout: 0,
      aiCostVnd: 0,
      netProfit: 0,
      successfulPayments: 0,
      pendingPayments: 0,
      revenueByMonth: {},
    }
  );
}

/** BE cũ chưa có khối `ai` thì coi như 0 — tránh vỡ trang khi lệch phiên bản. */
function aiStats(s: AdminStats): NonNullable<AdminStats["ai"]> {
  return (
    s.ai ?? {
      totalCalls: 0,
      callsLast30Days: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      tokensLast30Days: 0,
      estimatedCostUsd: 0,
      tokensByModel: {},
    }
  );
}

export function AdminOverview() {
  const query = useAdminStats();

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
  const ai = aiStats(s);

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
    {
      icon: Sparkles,
      label: "Token Tarot AI",
      value: ai.totalTokens,
      hint: `${nf(ai.tokensLast30Days)} trong 30 ngày · ~${usd(ai.estimatedCostUsd)}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-lg p-2 ${
                    k.alert
                      ? "bg-amber-400/15 text-amber-300"
                      : "bg-gold/10 text-gold"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 font-display text-3xl leading-none">
                {nf(k.value)}
              </div>
              <div className="mt-1.5 text-sm text-foreground/80">{k.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {k.hint}
              </div>
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

      <RevenueSummary revenue={revenueStats(s)} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueMonthChart revenue={revenueStats(s)} />
        <ProfitBreakdownChart revenue={revenueStats(s)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AiTokenBreakdownChart ai={ai} />
        <AiModelChart ai={ai} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Doanh thu va loi nhuan
// ------------------------------------------------------------

/**
 * Bon con so quan trong nhat ve tien.
 *
 * Co y KHONG goi doanh thu gop la "loi nhuan": phan lon tien khach tra thuoc
 * ve Reader, nen tang chi giu lai phan phi. Ghi ro ngay duoi moi con so de
 * nguoi doc khong nham cai no sang cai kia.
 */
function RevenueSummary({
  revenue: r,
}: {
  revenue: NonNullable<AdminStats["revenue"]>;
}) {
  const cards = [
    {
      icon: Wallet,
      label: "Doanh thu gộp",
      value: vnd(r.grossRevenue),
      hint:
        nf(r.successfulPayments) +
        " giao dịch · " +
        vnd(r.grossRevenueLast30Days) +
        " trong 30 ngày",
      negative: false,
    },
    {
      icon: TrendingUp,
      label: "Phí nền tảng (" + r.platformFeePercent + "%)",
      value: vnd(r.platformFee),
      hint: vnd(r.readerShare) + " còn lại là của Reader",
      negative: false,
    },
    {
      icon: Bot,
      label: "Chi phí AI",
      value: vnd(r.aiCostVnd),
      hint: "Quy đổi từ token đã tiêu thụ",
      negative: false,
    },
    {
      icon: TrendingUp,
      label: "Lợi nhuận ròng",
      value: vnd(r.netProfit),
      hint: "Phí nền tảng trừ chi phí AI",
      negative: r.netProfit < 0,
    },
  ];

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg">Doanh thu và lợi nhuận</h2>
        <p className="text-xs text-muted-foreground">
          Đã chi trả Reader {vnd(r.paidOut)}
          {r.pendingPayout > 0 ? " · " + vnd(r.pendingPayout) + " chờ chi" : ""}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-gold/20 p-4">
              <span
                className={
                  c.negative
                    ? "inline-flex rounded-lg bg-rose-400/15 p-2 text-rose-300"
                    : "inline-flex rounded-lg bg-gold/10 p-2 text-gold"
                }
              >
                <Icon className="h-4 w-4" />
              </span>
              <div
                className={
                  c.negative
                    ? "mt-3 font-display text-2xl leading-none text-rose-300"
                    : "mt-3 font-display text-2xl leading-none"
                }
              >
                {c.value}
              </div>
              <div className="mt-1.5 text-sm text-foreground/80">{c.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {c.hint}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Doanh thu theo thang — nhin ra xu huong thay vi chi mot con so cong don. */
function RevenueMonthChart({
  revenue: r,
}: {
  revenue: NonNullable<AdminStats["revenue"]>;
}) {
  const data = Object.entries(r.revenueByMonth).map(([month, total]) => ({
    key: month,
    label: monthLabel(month),
    count: Number(total),
  }));
  const tong = data.reduce((s, d) => s + d.count, 0);

  const config = {
    count: { label: "Doanh thu", color: "#34d399" },
  } satisfies ChartConfig;

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="font-display text-lg">Doanh thu theo tháng</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        12 tháng gần nhất, tính trên giao dịch đã thu được tiền
        {tong > 0 ? (
          <>
            {" "}
            · Tổng:{" "}
            <span className="font-medium text-gold">{vnd(tong)}</span>
          </>
        ) : null}
        .
      </p>
      {data.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Chưa có giao dịch thành công nào.
        </p>
      ) : (
        <ChartContainer
          config={config}
          className="mt-4 aspect-auto h-[280px] w-full"
        >
          <BarChart
            data={data}
            margin={{ top: 12, right: 8, left: 4, bottom: 4 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tick={{ fontSize: 10, fill: "oklch(0.7 0.02 280)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={vndTruc}
              tick={{ fontSize: 10, fill: "oklch(0.7 0.02 280)" }}
            />
            <ChartTooltip
              cursor={{ fill: "oklch(0.75 0.12 85 / 0.12)" }}
              content={
                <ChartTooltipContent
                  labelKey="label"
                  formatter={(value, _name, item) => (
                    <div className="flex w-full flex-col gap-0.5">
                      <span className="text-muted-foreground">
                        {(item?.payload as { label?: string } | undefined)
                          ?.label ?? "Tháng"}
                      </span>
                      <span className="font-medium text-foreground">
                        Doanh thu: {vnd(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="count"
              name="Doanh thu"
              fill="var(--color-count)"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ChartContainer>
      )}
    </section>
  );
}

/** Tien khach tra chia ve dau: Reader, phi nen tang, chi phi AI. */
function ProfitBreakdownChart({
  revenue: r,
}: {
  revenue: NonNullable<AdminStats["revenue"]>;
}) {
  const data = [
    {
      key: "reader",
      label: "Reader nhận",
      count: r.readerShare,
      fill: "#38bdf8",
    },
    {
      key: "fee",
      label: `Phí nền tảng ${r.platformFeePercent}%`,
      count: r.platformFee,
      fill: "#d4a84b",
    },
    { key: "ai", label: "Chi phí AI", count: r.aiCostVnd, fill: "#fb7185" },
  ].filter((d) => d.count > 0);
  const tong = data.reduce((s, d) => s + d.count, 0);

  const config = {
    ...Object.fromEntries(
      data.map((d) => [d.key, { label: d.label, color: d.fill }]),
    ),
  } satisfies ChartConfig;

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="font-display text-lg">Tiền đi về đâu</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Phần lớn doanh thu là của Reader — phần nền tảng giữ lại mới là nguồn bù
        chi phí
        {tong > 0 ? (
          <>
            {" "}
            · Tổng phân bổ:{" "}
            <span className="font-medium text-gold">{vnd(tong)}</span>
          </>
        ) : null}
        .
      </p>
      {data.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Chưa có số liệu.</p>
      ) : (
        <>
          <ChartContainer
            config={config}
            className="mt-4 aspect-auto h-[260px] w-full"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="key"
                    formatter={(value, _name, item) => {
                      const n = Number(value) || 0;
                      const pct =
                        tong > 0 ? Math.round((n / tong) * 100) : 0;
                      const label =
                        (item?.payload as { label?: string } | undefined)
                          ?.label ?? "";
                      return (
                        <div className="flex w-full flex-col gap-0.5">
                          <span className="font-medium text-foreground">
                            {label}
                          </span>
                          <span className="font-mono tabular-nums text-muted-foreground">
                            {vnd(n)} · {pct}%
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="key"
                innerRadius={55}
                outerRadius={95}
                strokeWidth={2}
                stroke="oklch(0.16 0.02 280)"
                label={(props) =>
                  pieWhiteLabel({
                    ...props,
                    format: (n) => vndTruc(n),
                  })
                }
                labelLine={false}
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={d.fill} className="outline-none" />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="key" />}
                className="-translate-y-1 flex-wrap gap-2"
              />
            </PieChart>
          </ChartContainer>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            {data.map((d) => {
              const pct = tong > 0 ? Math.round((d.count / tong) * 100) : 0;
              return (
                <li
                  key={d.key}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: d.fill }}
                      aria-hidden
                    />
                    {d.label}
                  </span>
                  <span className="font-mono tabular-nums text-foreground">
                    {vnd(d.count)}
                    <span className="ml-1.5 text-muted-foreground">
                      ({pct}%)
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

/** "2026-09" -> "T9/26". Truc X ngan de khong chong chu. */
function monthLabel(ym: string) {
  const parts = ym.split("-");
  return parts.length === 2
    ? "T" + Number(parts[1]) + "/" + parts[0].slice(2)
    : ym;
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
        <ChartContainer
          config={config}
          className="mx-auto mt-2 aspect-square max-h-[280px] w-full"
        >
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
              label={pieWhiteLabel}
              labelLine={false}
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
        <ChartContainer
          config={config}
          className="mt-4 aspect-auto h-[260px] w-full"
        >
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
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
                      (item?.payload as { label?: string } | undefined)
                        ?.label ?? "Lượt";
                    return (
                      <div className="flex w-full flex-col gap-0.5">
                        <span className="font-medium text-foreground">
                          {label}
                        </span>
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

      <ChartContainer
        config={config}
        className="mt-4 aspect-auto h-[240px] w-full"
      >
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

      <ChartContainer
        config={config}
        className="mt-4 aspect-auto h-[240px] w-full"
      >
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
                      <span className="font-medium text-foreground">
                        {label}
                      </span>
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

const MODEL_COLORS = [
  "#d4a84b",
  "#38bdf8",
  "#34d399",
  "#a78bfa",
  "#fb7185",
  "#fbbf24",
];

function AiTokenBreakdownChart({ ai }: { ai: NonNullable<AdminStats["ai"]> }) {
  const data = [
    {
      key: "prompt",
      label: "Prompt (vào)",
      count: Number(ai.promptTokens),
      fill: "#38bdf8",
    },
    {
      key: "completion",
      label: "Completion (ra)",
      count: Number(ai.completionTokens),
      fill: "#34d399",
    },
    {
      key: "total",
      label: "Tổng token",
      count: Number(ai.totalTokens),
      fill: "#d4a84b",
    },
    {
      key: "last30",
      label: "30 ngày gần đây",
      count: Number(ai.tokensLast30Days),
      fill: "#a78bfa",
    },
  ];

  const config = {
    count: { label: "Token", color: "#d4a84b" },
  } satisfies ChartConfig;

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg">Token Tarot AI</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Rê chuột vào cột để xem số token. Chi phí ước lượng:{" "}
        <span className="text-gold">{usd(ai.estimatedCostUsd)}</span> ·{" "}
        {nf(ai.totalCalls)} lượt gọi ({nf(ai.callsLast30Days)} trong 30 ngày).
      </p>

      {ai.totalTokens === 0 && ai.totalCalls === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Chưa ghi nhận lượt gọi Tarot AI nào.
        </p>
      ) : (
        <ChartContainer
          config={config}
          className="mt-4 aspect-auto h-[260px] w-full"
        >
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
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
              width={48}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fill: "oklch(0.75 0.12 85 / 0.12)" }}
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => {
                    const n = Number(value) || 0;
                    const row = item?.payload as
                      | { label?: string; key?: string }
                      | undefined;
                    return (
                      <div className="flex min-w-[11rem] flex-col gap-0.5">
                        <span className="font-medium text-foreground">
                          {row?.label ?? "Token"}
                        </span>
                        <span className="font-mono tabular-nums text-gold">
                          {nf(n)} token
                        </span>
                        {row?.key === "total" && (
                          <span className="text-muted-foreground">
                            Chi phí ước lượng: {usd(ai.estimatedCostUsd)}
                          </span>
                        )}
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((d) => (
                <Cell key={d.key} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </section>
  );
}

function AiModelChart({ ai }: { ai: NonNullable<AdminStats["ai"]> }) {
  const entries = Object.entries(ai.tokensByModel ?? {});
  const data = entries.map(([model, tokens], i) => ({
    key: model,
    name: model,
    value: Number(tokens) || 0,
    fill: MODEL_COLORS[i % MODEL_COLORS.length],
  }));
  const total = data.reduce((s, d) => s + d.value, 0);

  const config = {
    value: { label: "Token" },
    ...Object.fromEntries(
      data.map((d) => [d.key, { label: d.name, color: d.fill }]),
    ),
  } satisfies ChartConfig;

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg">Token theo model AI</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Rê chuột vào từng phần để xem model và số token đã tiêu thụ.
      </p>

      {data.length === 0 || total === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Chưa có phân bổ theo model.
        </p>
      ) : (
        <ChartContainer
          config={config}
          className="mx-auto mt-2 aspect-square max-h-[280px] w-full"
        >
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
                      <div className="flex w-full flex-col gap-0.5">
                        <span className="font-medium text-foreground">
                          {label}
                        </span>
                        <span className="font-mono tabular-nums text-gold">
                          {nf(n)} token · {pct}%
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
              label={pieWhiteLabel}
              labelLine={false}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.fill} className="outline-none" />
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
