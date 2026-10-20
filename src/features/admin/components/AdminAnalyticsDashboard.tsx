import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHanhTrinhTheoNguon } from "@/api/marketing";
import { DangOnlineNgayBayGio } from "./DangOnlineNgayBayGio";
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
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

type DateRangeOption = "7d" | "14d" | "30d" | "90d";

/**
 * Khoảng ngày gửi lên GA4, kết thúc ở HÔM QUA chứ không phải hôm nay.
 *
 * Hai lý do, cùng một gốc:
 *
 * 1. **Khớp với Google.** GA4 hiểu "7 ngày qua" là 7 ngày trọn vẹn tính đến
 *    hết hôm qua. Trước đây chỗ này hỏi `7daysAgo..today`, tức có thêm ngày
 *    hôm nay, nên bảng ở đây và bảng của Google luôn lệch nhau và không ai
 *    hiểu bên nào sai. Đo thật ngày 19/10: `7daysAgo..today` ra 6 người /
 *    26 lượt xem, còn `7daysAgo..yesterday` ra 4 / 24 — đúng bằng con số
 *    Google hiện.
 *
 * 2. **Hôm nay là ngày dở dang.** GA4 còn đang xử lý, số nhảy liên tục trong
 *    ngày rồi mới chốt. Gộp nó vào "7 ngày qua" là trộn một ngày chưa chốt
 *    với sáu ngày đã chốt.
 *
 * Mất gì không: không. Hoạt động của hôm nay đã có dải "Đang truy cập (30
 * phút qua)" ở đầu tab, lấy từ báo cáo thời gian thực nên còn nhanh hơn.
 *
 * Lưu ý về cách GA4 đếm: `NdaysAgo` là hôm nay trừ N ngày, và hai đầu đều
 * TÍNH VÀO. Nên `7daysAgo..yesterday` đúng 7 ngày, còn `7daysAgo..today`
 * là 8 ngày — nhãn ghi 7 mà hỏi 8.
 */
const DATE_RANGE_MAP: Record<DateRangeOption, { start: string; end: string; label: string }> = {
  "7d": { start: "7daysAgo", end: "yesterday", label: "7 ngày qua" },
  "14d": { start: "14daysAgo", end: "yesterday", label: "14 ngày qua" },
  "30d": { start: "30daysAgo", end: "yesterday", label: "30 ngày qua" },
  "90d": { start: "90daysAgo", end: "yesterday", label: "90 ngày qua" },
};

export { DATE_RANGE_MAP };

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

/**
 * Trạng thái thật của tích hợp GA4, suy từ `status` của máy chủ.
 *
 * KHÔNG dùng cờ `configured` làm căn cứ: `GA4ReportResponse.error()` bên máy
 * chủ cũng đặt `configured = true`, nên lấy cờ ấy thì khi Google trả
 * PERMISSION_DENIED trang vẫn khoe "Đã kết nối API" — đúng lúc cần biết hỏng
 * thì nó báo đang ổn, còn câu lỗi thật nằm trong `message` thì không ai thấy.
 */
export type TrangThaiGa4 = "ok" | "loi" | "chua-cau-hinh" | "chua-biet";

export function trangThaiGa4(
  report?: { status?: string } | null,
): TrangThaiGa4 {
  switch (report?.status) {
    case "SUCCESS":
      return "ok";
    case "ERROR":
      return "loi";
    case "NOT_CONFIGURED":
      return "chua-cau-hinh";
    default:
      // Chưa tải xong, hoặc máy chủ trả một trạng thái lạ: không khẳng định
      // gì cả, đừng đoán là ổn.
      return "chua-biet";
  }
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

  const trangThai = trangThaiGa4(report);
  const isConfigured = trangThai === "ok";
  const isApiError = trangThai === "loi";
  const chuaCauHinh = trangThai === "chua-cau-hinh";
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
            {isConfigured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                <Radio className="h-3 w-3 animate-pulse" /> Đã kết nối API
              </span>
            )}
            {isApiError && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
                <AlertTriangle className="h-3 w-3" /> Gọi API lỗi
              </span>
            )}
            {chuaCauHinh && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                <AlertTriangle className="h-3 w-3" /> Chưa cấu hình Key
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Property ID: <code className="text-gold/90">{report?.propertyId || "559341552"}</code> • Measurement ID:{" "}
            <code className="text-gold/90">{GA_MEASUREMENT_ID}</code> • Khoảng thời gian:{" "}
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

      {/* Google trả lỗi: bày đúng câu máy chủ nhận được, đừng nuốt. */}
      {isApiError && !isLoading && (
        <section className="glass rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-1 text-sm">
              <h3 className="font-semibold text-red-300">
                Máy chủ gọi Google Analytics Data API không thành công
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {report?.message ||
                  "Google không trả về dữ liệu. Xem log máy chủ để biết chi tiết."}
              </p>
              <p className="text-xs text-muted-foreground">
                Hay gặp nhất: service account chưa được cấp quyền{" "}
                <strong>Người xem</strong> trên tài sản{" "}
                <code className="text-foreground">{report?.propertyId}</code>,
                hoặc Google Analytics Data API chưa bật trong project Cloud.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Cảnh báo chưa cấu hình service account */}
      {chuaCauHinh && !isLoading && (
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
                  Tạo Service Account trên Google Cloud Project <code className="text-foreground">astrotarot-play</code> và gán quyền <strong>Người xem</strong> trong GA4 Property <code className="text-foreground">559341552</code>.
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
                  href="https://analytics.google.com/analytics/web/#/p559341552/reports/reportinghub"
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

      {/* Số đang truy cập — con số DUY NHẤT nhúc nhích ngay.
          Mọi ô bên dưới lấy từ báo cáo thường, mà báo cáo thường trễ 24–48
          giờ với tài sản mới: hai ngày đầu chúng đứng im ở 0 dù web có khách,
          nhìn vào rất dễ tưởng cấu hình hỏng. */}
      {isConfigured && report && report.realtimeActiveUsers >= 0 && (
        <section className="glass flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-5 py-3">
          <Radio className="h-4 w-4 shrink-0 animate-pulse text-emerald-400" />
          <span className="text-sm text-muted-foreground">
            Đang truy cập (30 phút qua):
          </span>
          <span className="font-display text-2xl text-emerald-300">
            {nf(report.realtimeActiveUsers)}
          </span>
          <span className="text-xs text-muted-foreground">
            Số này cập nhật tức thì. Các ô bên dưới là báo cáo thường của
            Google, tính đến hết hôm qua — khớp đúng con số trong Google
            Analytics.
          </span>
        </section>
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

      <DangOnlineNgayBayGio />

      <BangNguonVaHoatDong />

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

/**
 * Khách đến từ đâu, rồi LÀM GÌ.
 *
 * Đây là chỗ trả lời câu hỏi mà bảng "Nguồn truy cập" của GA4 ở trên không
 * trả lời được. Bảng kia nói Facebook mang về bao nhiêu phiên; bảng này nói
 * những phiên ấy có trải bài, có đặt lịch, hay chỉ mở rồi đóng.
 *
 * Số liệu lấy từ bảng `marketing_events` của chính hệ thống chứ không gọi
 * sang Google, vì ba lý do: hiện ngay (báo cáo thường của GA4 trễ 24–48
 * giờ), không bị trình chặn quảng cáo cắt, và nối được với `user_id` nên
 * đếm được NGƯỜI chứ không chỉ lượt.
 *
 * Cột "người" chỉ đếm được ai đã đăng nhập. Khách xem rồi đi không có
 * `user_id`, nên con số ấy luôn nhỏ hơn số lượt — không phải lỗi.
 */
function BangNguonVaHoatDong() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["marketing", "theo-nguon"],
    queryFn: getHanhTrinhTheoNguon,
  });

  const hang = data ?? [];
  // Mỗi nguồn làm những việc khác nhau, nên cột phải lấy hợp của tất cả.
  const cotHoatDong = Array.from(
    new Set(hang.flatMap((h) => Object.keys(h.theoHoatDong))),
  );

  return (
    <section className="glass rounded-2xl border border-white/10 p-5">
      <h3 className="font-medium">Khách đến từ đâu, rồi làm gì</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        30 ngày gần nhất, lấy từ cơ sở dữ liệu của hệ thống nên hiện ngay —
        không phải đợi 24–48 giờ như báo cáo của Google ở trên. Cột{" "}
        <em>người</em> chỉ đếm tài khoản đã đăng nhập, nên luôn nhỏ hơn số
        lượt.
      </p>

      {isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">Đang tải…</p>
      )}
      {isError && (
        <p className="mt-4 text-sm text-rose-400">
          Không đọc được số liệu. Thử tải lại trang.
        </p>
      )}
      {!isLoading && !isError && hang.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Chưa có lượt nào trong 30 ngày. Bảng này chỉ có số khi khách bấm vào
          những nút đã gắn theo dõi — đăng ký, bắt đầu chat, rút bài, đặt lịch,
          gửi góp ý, sang Shopee.
        </p>
      )}

      {hang.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Nguồn</th>
                <th className="py-2 pr-4 font-medium">Lượt</th>
                <th className="py-2 pr-4 font-medium">Người</th>
                {cotHoatDong.map((c) => (
                  <th key={c} className="py-2 pr-4 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hang.map((h) => (
                <tr key={h.nguon} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-medium">{h.nguon}</td>
                  <td className="py-2 pr-4">{nf(h.tongLuot)}</td>
                  <td className="py-2 pr-4">{nf(h.soNguoiDangNhap)}</td>
                  {cotHoatDong.map((c) => (
                    <td
                      key={c}
                      className={
                        h.theoHoatDong[c]
                          ? "py-2 pr-4"
                          : "py-2 pr-4 text-muted-foreground/40"
                      }
                    >
                      {h.theoHoatDong[c] ? nf(h.theoHoatDong[c]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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
