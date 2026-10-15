import { useState } from "react";
import {
  Users,
  UserPlus,
  Activity,
  Eye,
  Clock,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Layers,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGA4Report } from "@/features/admin/queries";

type DateRangeOption = "7d" | "14d" | "30d" | "90d";

const DATE_RANGE_MAP: Record<DateRangeOption, { start: string; end: string; label: string }> = {
  "7d": { start: "7daysAgo", end: "today", label: "7 ngày qua" },
  "14d": { start: "14daysAgo", end: "today", label: "14 ngày qua" },
  "30d": { start: "30daysAgo", end: "today", label: "30 ngày qua" },
  "90d": { start: "90daysAgo", end: "today", label: "90 ngày qua" },
};

export function nf(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "0";
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds) || seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}p ${s < 10 ? "0" : ""}${s}s`;
}

export function formatPercent(rate: number | null | undefined): string {
  if (rate == null || isNaN(rate)) return "0.0%";
  // GA4 API có thể trả về 0.354 (tỷ lệ 0-1) hoặc 35.4 (%) tuỳ dimension
  const val = rate <= 1 ? rate * 100 : rate;
  return `${val.toFixed(1)}%`;
}

export function AdminAnalyticsDashboard() {
  const [range, setRange] = useState<DateRangeOption>("30d");
  const { start, end, label } = DATE_RANGE_MAP[range];

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGA4Report(start, end);

  const isConfigured = report?.configured ?? false;
  const overview = report?.overview;
  const timeSeries = report?.timeSeries || [];
  const trafficSources = report?.trafficSources || [];

  const totalTrafficSessions = trafficSources.reduce((acc, curr) => acc + curr.sessions, 0);

  return (
    <div className="space-y-6">
      {/* Header điều hướng & chọn khoảng ngày */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl text-foreground">Lưu lượng & Google Analytics 4</h2>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                <Radio className="h-3 w-3 animate-pulse" /> Đã kết nối API
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                <AlertTriangle className="h-3 w-3" /> Chưa cấu hình Key
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Property ID: <code className="text-gold/90">{report?.propertyId || "559041870"}</code> • Measurement ID:{" "}
            <code className="text-gold/90">G-6B0LQ5Q9D8</code> • Khoảng thời gian:{" "}
            <span className="text-foreground font-medium">{label}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút lọc ngày */}
          <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
            {(Object.keys(DATE_RANGE_MAP) as DateRangeOption[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  range === key
                    ? "bg-gold text-black shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {DATE_RANGE_MAP[key].label}
              </button>
            ))}
          </div>

          {/* Nút tải lại */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-white/10 disabled:opacity-50"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Cảnh báo chưa cấu hình service account */}
      {!isConfigured && !isLoading && (
        <section className="glass rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold text-amber-300">
                Chưa kích hoạt Google Analytics 4 Reporting API trên máy chủ
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Hệ thống backend đã sẵn sàng tích hợp với thư viện Google Analytics Data API. Để xem số liệu trực tiếp trong trang quản trị:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-xs text-muted-foreground">
                <li>
                  Tạo Service Account trên Google Cloud Project <code className="text-foreground">astra-tarot-analytics</code> và gán quyền <strong>Viewer</strong> trong GA4 Property <code className="text-foreground">559041870</code>.
                </li>
                <li>
                  Trên máy dev local: lưu tệp JSON bên ngoài repository và đặt biến môi trường: <code className="text-gold">GA4_CREDENTIALS_PATH=đường_dẫn_tệp.json</code>.
                </li>
                <li>
                  Trên môi trường Render/Docker: đặt biến môi trường chuỗi JSON thô: <code className="text-gold">GA4_CREDENTIALS_JSON=&#123;...&#125;</code>.
                </li>
              </ol>
              <div className="pt-2">
                <a
                  href="https://analytics.google.com/analytics/web/#/p559041870/reports/reportinghub"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline"
                >
                  Mở báo cáo trực tiếp tại Google Analytics Console
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Lỗi truy vấn API */}
      {isError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          {(error as Error)?.message || "Không thể tải dữ liệu báo cáo GA4 từ máy chủ."}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          title="Người dùng hoạt động"
          value={nf(overview?.activeUsers)}
          icon={Users}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
          hint="Active Users"
        />
        <KpiCard
          title="Người dùng mới"
          value={nf(overview?.newUsers)}
          icon={UserPlus}
          color="text-sky-400"
          bgColor="bg-sky-500/10"
          hint="New Users"
        />
        <KpiCard
          title="Phiên truy cập"
          value={nf(overview?.sessions)}
          icon={Activity}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
          hint="Sessions"
        />
        <KpiCard
          title="Lượt xem trang"
          value={nf(overview?.screenPageViews)}
          icon={Eye}
          color="text-gold"
          bgColor="bg-gold/10"
          hint="Page Views"
        />
        <KpiCard
          title="Thời lượng TB / phiên"
          value={formatDuration(overview?.averageSessionDuration)}
          icon={Clock}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
          hint="Avg Duration"
        />
        <KpiCard
          title="Tỷ lệ thoát"
          value={formatPercent(overview?.bounceRate)}
          icon={TrendingDown}
          color="text-rose-400"
          bgColor="bg-rose-500/10"
          hint="Bounce Rate"
        />
      </div>

      {/* Biểu đồ xu hướng theo ngày */}
      <section className="glass rounded-2xl p-5 border border-white/10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg text-foreground">Xu hướng lưu lượng theo ngày</h3>
            <p className="text-xs text-muted-foreground">
              So sánh lượng người dùng hoạt động, số phiên và lượt xem trang theo dòng thời gian.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Phiên
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
              Người dùng
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Lượt xem
            </span>
          </div>
        </div>

        {timeSeries.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  stroke="#888888"
                  fontSize={11}
                  tickFormatter={(val) => (val.length >= 5 ? val.slice(5) : val)}
                />
                <YAxis tickLine={false} stroke="#888888" fontSize={11} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label: xLabel }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border border-white/10 bg-background/95 p-2.5 shadow-xl backdrop-blur-sm text-xs">
                          <p className="font-medium text-foreground mb-1.5">{xLabel}</p>
                          {payload.map((item) => (
                            <div key={item.name} className="flex items-center justify-between gap-4 py-0.5">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                {item.name === "sessions"
                                  ? "Phiên"
                                  : item.name === "activeUsers"
                                  ? "Người dùng"
                                  : "Lượt xem trang"}:
                              </span>
                              <span className="font-semibold text-foreground">{nf(item.value as number)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  name="sessions"
                  stroke="#34d399"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSessions)"
                />
                <Area
                  type="monotone"
                  dataKey="activeUsers"
                  name="activeUsers"
                  stroke="#c084fc"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-muted-foreground">
            {isLoading ? "Đang truy vấn dữ liệu từ GA4..." : "Chưa có dữ liệu chuỗi thời gian trong khoảng ngày này."}
          </div>
        )}
      </section>

      {/* Bảng phân bổ nguồn lưu lượng truy cập */}
      <section className="glass rounded-2xl p-5 border border-white/10">
        <div className="mb-4">
          <h3 className="font-display text-lg text-foreground">Nguồn & Phương thức truy cập (Traffic Sources)</h3>
          <p className="text-xs text-muted-foreground">
            Top kênh đưa khách hàng và người dùng đến nền tảng Astra Tarot.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="pb-2.5 font-medium">Nguồn / Kênh (Source / Medium)</th>
                <th className="pb-2.5 text-right font-medium">Phiên</th>
                <th className="pb-2.5 text-right font-medium">Người dùng hoạt động</th>
                <th className="pb-2.5 text-right font-medium">Tỷ lệ đóng góp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {trafficSources.length > 0 ? (
                trafficSources.map((item, idx) => {
                  const sharePercent =
                    totalTrafficSessions > 0
                      ? Math.round((item.sessions / totalTrafficSessions) * 100)
                      : 0;

                  return (
                    <tr key={`${item.source}-${item.medium}-${idx}`} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.source || "(direct)"}</span>
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {item.medium || "(none)"}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-medium text-foreground">{nf(item.sessions)}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{nf(item.activeUsers)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold text-gold">{sharePercent}%</span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full bg-gold rounded-full" style={{ width: `${sharePercent}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    {isLoading ? "Đang tải dữ liệu nguồn truy cập..." : "Không có dữ liệu nguồn truy cập."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Thông tin tích hợp & Tiêu chuẩn bảo vệ dữ liệu */}
      <section className="glass rounded-2xl p-5 border border-white/10">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-muted-foreground">
            <h4 className="font-medium text-foreground">Bảo vệ quyền riêng tư & Tuân thủ kỹ thuật</h4>
            <p>
              Hệ thống theo dõi SPA đã kích hoạt cơ chế <strong>khử khuẩn đường dẫn URL</strong>: tự động gỡ bỏ các tham số nhạy cảm (mã token xác thực, mật khẩu, email người dùng, câu hỏi trải bài AI, nội dung tin nhắn tư vấn) trước khi truyền phát sự kiện về Google Analytics 4.
            </p>
            <p>
              Khóa API Service Account được bảo vệ nghiêm ngặt ở tầng backend máy chủ, không bao giờ được gửi về trình duyệt hay commit vào mã nguồn.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  hint,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  hint: string;
}) {
  return (
    <div className="glass rounded-xl p-3.5 border border-white/10 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground line-clamp-1">{title}</span>
        <div className={`rounded-lg p-1.5 ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <div className="mt-2">
        <div className="font-display text-xl text-foreground font-semibold">{value}</div>
        <div className="text-[10px] text-muted-foreground/80">{hint}</div>
      </div>
    </div>
  );
}
