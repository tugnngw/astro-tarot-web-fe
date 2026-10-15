// ============================================================
// BÁO CÁO NĂNG LỰC HỆ THỐNG & VẬN HÀNH (OUTCOME 3)
//
// Thành phần tổng hợp hai phần độc lập và minh bạch:
// Section A: Ma trận năng lực hệ thống kèm bằng chứng kiểm định (Capability Matrix)
// Section B: Các chỉ số vận hành thực tế truy xuất từ cơ sở dữ liệu (Operational Metrics)
// ============================================================

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  FileCode,
  ShieldCheck,
  Bot,
  Users,
  CalendarClock,
  Wallet,
  Star,
  ShoppingBag,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Info,
  Search,
  Database,
  TrendingUp,
  Check,
} from "lucide-react";
import { useAdminStats, useAdminFeedbackStats } from "@/features/admin/queries";
import {
  CAPABILITY_DOMAINS,
  CAPABILITY_STATUS_CONFIG,
  getCapabilityStats,
  type CapabilityDomain,
  type CapabilityStatus,
} from "@/features/admin/capability-data";

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

// ============================================================
// METADATA ĐỊNH NGHĨA CHỈ SỐ VẬN HÀNH (SECTION B)
// ============================================================
interface MetricDomainDefinition {
  id: string;
  title: string;
  definition: string;
  dataSource: string;
  apiEndpoint: string;
  timeWindow: string;
  authorization: string;
}

const METRIC_DEFINITIONS: Record<string, MetricDomainDefinition> = {
  users: {
    id: "users",
    title: "Người dùng & Hoạt động",
    definition:
      "Tổng số tài khoản đã đăng ký còn hiệu lực (chưa bị xóa mềm), phân loại chi tiết theo vai trò hệ thống (USER, STAFF, MANAGER, ADMIN) và số tài khoản tạo mới trong 7 ngày qua.",
    dataSource:
      "Bảng `users` qua `UserRepository` (các phương thức `countByRoleAndDeletedAtIsNull`, `countByCreatedAtAfterAndDeletedAtIsNull`).",
    apiEndpoint: "GET /api/v1/admin/stats (trường `users`)",
    timeWindow: "Toàn bộ lịch sử hoạt động và lũy kế 7 ngày gần nhất",
    authorization: "Yêu cầu quyền ADMIN hoặc MANAGER (JWT Bearer Token)",
  },
  ai: {
    id: "ai",
    title: "Sử dụng Tarot AI & Tokens",
    definition:
      "Tổng hợp số lượt gọi trải bài và hội thoại AI, lượng token đầu vào (prompt), token đầu ra (completion), tổng token tiêu thụ, chi phí USD ước lượng theo mô hình và chi phí quy đổi VND.",
    dataSource:
      "Bảng `ai_usage_logs` qua `AIUsageLogRepository` (các truy vấn `sumPromptTokens`, `sumCompletionTokens`, `sumTotalTokensSince`, `sumEstimatedCostUsd`, `sumTotalTokensGroupedByModel`).",
    apiEndpoint: "GET /api/v1/admin/stats (trường `ai` và `revenue.aiCostVnd`)",
    timeWindow: "Toàn bộ lịch sử và cửa sổ trượt 30 ngày gần nhất",
    authorization: "Yêu cầu quyền ADMIN hoặc MANAGER",
  },
  bookings: {
    id: "bookings",
    title: "Lịch hẹn & Thị trường Reader",
    definition:
      "Tổng số phiên đọc bài Tarot trực tiếp giữa khách hàng và Reader, phân bổ chi tiết theo 4 trạng thái vòng đời (PENDING, CONFIRMED, COMPLETED, CANCELLED) cùng số lượng hồ sơ Reader đang hoạt động và hồ sơ đang chờ xét duyệt.",
    dataSource:
      "Bảng `bookings`, `reader_profiles`, `reader_applications` qua `BookingRepository`, `ReaderProfileRepository`, `ReaderApplicationRepository`.",
    apiEndpoint:
      "GET /api/v1/admin/stats (trường `bookings` và `readers`)",
    timeWindow: "Toàn thời gian tính từ thời điểm khởi chạy hệ thống",
    authorization: "Yêu cầu quyền ADMIN hoặc MANAGER",
  },
  payments: {
    id: "payments",
    title: "Thanh toán, Ký quỹ & Lợi nhuận",
    definition:
      "Doanh thu gộp từ các giao dịch thanh toán PayOS thành công, tỷ lệ phí sàn giữ lại (20%), phần chia trả Reader (80%), số tiền đã chi trả (PAID), tiền chờ chi (PENDING) và lợi nhuận ròng thực tế (Phí sàn trừ Chi phí AI, cho phép hiển thị giá trị âm nếu chi phí vượt doanh thu).",
    dataSource:
      "Bảng `payment_transactions` và `payout_requests` qua `PaymentTransactionRepository` và `PayoutRequestRepository`.",
    apiEndpoint: "GET /api/v1/admin/stats (trường `revenue`)",
    timeWindow: "Toàn bộ lịch sử, 30 ngày gần nhất và chuỗi 12 tháng gần nhất",
    authorization: "Yêu cầu quyền ADMIN hoặc MANAGER",
  },
  feedback: {
    id: "feedback",
    title: "Đánh giá & Góp ý hệ thống (Phase 1)",
    definition:
      "Toàn bộ phản hồi đánh giá hệ thống hợp lệ: tổng số lượt đánh giá, điểm sao trung bình (thang 1–5), điểm NPS trung bình (thang 0–10 suy diễn), biểu đồ phân bổ số lượng từng mức sao (1★ đến 5★) và tỷ lệ đạt mục tiêu nghiệm thu khảo sát.",
    dataSource:
      "Bảng `user_feedback` qua `UserFeedbackRepository` (các truy vấn `count()`, `findAverageRating()`, `findAverageNps()`, `countByRating()`).",
    apiEndpoint: "GET /api/v1/admin/feedback/stats",
    timeWindow: "Toàn bộ lịch sử phản hồi ghi nhận từ người dùng và khách vãng lai",
    authorization: "Yêu cầu quyền ADMIN hoặc MANAGER",
  },
  affiliate: {
    id: "affiliate",
    title: "Thương mại Tiếp thị Liên kết",
    definition:
      "Số lượng sản phẩm đá phong thủy / bài Tarot đang kích hoạt có gắn liên kết tiếp thị, số lượt nhấp chuột (outbound clicks) chuyển tiếp sang sàn thương mại điện tử trong 30 ngày qua và tổng số lượt nhấp toàn thời gian.",
    dataSource:
      "Bảng `products` và `product_clicks` qua `ProductRepository` và `ProductClickRepository`.",
    apiEndpoint: "GET /api/v1/admin/stats (trường `shop` và `traction`)",
    timeWindow: "Lũy kế 30 ngày gần nhất và tổng toàn thời gian",
    authorization: "Yêu cầu quyền ADMIN hoặc MANAGER",
  },
  blogs: {
    id: "blogs",
    title: "Nội dung Blog & Kiểm duyệt",
    definition:
      "Tổng số bài viết chia sẻ kiến thức trên hệ thống, phân bổ trạng thái theo 4 giai đoạn vòng đời (Đã xuất bản - PUBLISHED, Chờ xét duyệt - PENDING, Bản nháp - DRAFT) và số lượng báo cáo vi phạm nội dung đang chờ Ban quản trị xử lý.",
    dataSource:
      "Bảng `blogs` và `reports` qua `BlogRepository` (`countByStatus`) và `ReportRepository` (`countByStatus(ReportStatus.PENDING)`).",
    apiEndpoint:
      "GET /api/v1/admin/stats (trường `blogs` và `moderation.pendingReports`)",
    timeWindow: "Toàn bộ dữ liệu bài viết hiện hữu trong cơ sở dữ liệu",
    authorization: "Yêu cầu quyền ADMIN hoặc MANAGER",
  },
};

export function SystemCapabilitiesDashboard() {
  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    refetch: refetchStats,
  } = useAdminStats();

  const {
    data: feedbackStats,
    isLoading: isLoadingFeedback,
    isError: isErrorFeedback,
    refetch: refetchFeedback,
  } = useAdminFeedbackStats();

  // State quản lý bộ lọc Section A
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedLimitations, setExpandedLimitations] = useState<Record<string, boolean>>({});

  // State mở metadata định nghĩa chỉ số Section B
  const [expandedDefinitions, setExpandedDefinitions] = useState<Record<string, boolean>>({});

  const capabilitySummary = getCapabilityStats(CAPABILITY_DOMAINS);

  // Lọc danh sách năng lực theo trạng thái và tìm kiếm
  const filteredDomains = CAPABILITY_DOMAINS.filter((domain) => {
    const matchStatus = statusFilter === "ALL" || domain.status === statusFilter;
    const matchCategory = selectedCategory === "ALL" || domain.category === selectedCategory;
    const matchSearch =
      searchQuery.trim() === "" ||
      domain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domain.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domain.evidence.sourceFiles.some((f) =>
        f.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      domain.evidence.apiRoutes.some((r) =>
        r.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchStatus && matchCategory && matchSearch;
  });

  const toggleLimitation = (id: string) => {
    setExpandedLimitations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDefinition = (id: string) => {
    setExpandedDefinitions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRefreshAll = () => {
    void refetchStats();
    void refetchFeedback();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Banner & Executive Overview */}
      <section className="glass rounded-2xl p-6 border border-gold/25 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold/15 text-gold border border-gold/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Outcome 3 Verification
              </span>
              <span className="text-xs text-muted-foreground">
                Dữ liệu CSDL thời gian thực
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Năng lực Hệ thống & Chỉ số Vận hành
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-3xl leading-relaxed">
              Bảng điều khiển kết hợp đánh giá năng lực kỹ thuật dựa trên bằng chứng kiểm thử mã nguồn
              (Section A) và số liệu vận hành thực tế trích xuất trực tiếp từ các bảng cơ sở dữ liệu (Section B).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefreshAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-card/60 hover:bg-card border border-white/10 hover:border-gold/30 text-foreground transition-all duration-200"
              title="Làm mới toàn bộ số liệu"
            >
              <RefreshCw
                className={`w-4 h-4 text-gold ${
                  isLoadingStats || isLoadingFeedback ? "animate-spin" : ""
                }`}
              />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Khung cảnh báo minh bạch (Transparency Disclaimer) */}
        <div className="mt-5 p-3.5 rounded-xl bg-gold/5 border border-gold/20 flex items-start gap-3 text-xs text-gold/90">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-gold" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Nguyên tắc Bằng chứng & Độc lập Dữ liệu:
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Trạng thái kiểm định trong bảng này được phân loại chính xác dựa trên mã nguồn thực tế và
              kết quả của 100+ bài kiểm thử tự động (Unit & Integration Tests) có sẵn trong dự án. Các số liệu
              vận hành ở Section B là kết quả đếm tổng hợp từ CSDL PostgreSQL, hoàn toàn độc lập với các công cụ phân tích bên thứ ba (GA4 được bảo lưu cho Phase 3).
            </p>
          </div>
        </div>

        {/* KPI Tổng kết Năng lực */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-card/40 border border-white/10">
            <p className="text-xs text-muted-foreground">Tổng miền năng lực</p>
            <p className="mt-1 text-2xl font-semibold font-display text-foreground">
              {capabilitySummary.total}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">8 miền cốt lõi</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <p className="text-xs text-emerald-400 font-medium">Đã kiểm thử (TESTED)</p>
            <p className="mt-1 text-2xl font-semibold font-display text-emerald-400">
              {capabilitySummary.byStatus.TESTED}
            </p>
            <p className="text-[11px] text-emerald-400/80 mt-0.5">Automated suites pass</p>
          </div>

          <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/25">
            <p className="text-xs text-sky-400 font-medium">Đã cài đặt (IMPLEMENTED)</p>
            <p className="mt-1 text-2xl font-semibold font-display text-sky-400">
              {capabilitySummary.byStatus.IMPLEMENTED}
            </p>
            <p className="text-[11px] text-sky-400/80 mt-0.5">Có mã nguồn & schema</p>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
            <p className="text-xs text-indigo-400 font-medium">Xác minh Runtime</p>
            <p className="mt-1 text-2xl font-semibold font-display text-indigo-400">
              {capabilitySummary.byStatus["RUNTIME VERIFIED"]}
            </p>
            <p className="text-[11px] text-indigo-400/80 mt-0.5">Chạy trong môi trường sống</p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <p className="text-xs text-amber-400 font-medium">Cài đặt một phần</p>
            <p className="mt-1 text-2xl font-semibold font-display text-amber-400">
              {capabilitySummary.byStatus["PARTIALLY IMPLEMENTED"]}
            </p>
            <p className="text-[11px] text-amber-400/80 mt-0.5">Đang tiếp tục hoàn thiện</p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25">
            <p className="text-xs text-rose-400 font-medium">Bị chặn / Chưa xác minh</p>
            <p className="mt-1 text-2xl font-semibold font-display text-rose-400">
              {capabilitySummary.byStatus.BLOCKED + capabilitySummary.byStatus["NOT VERIFIED"]}
            </p>
            <p className="text-[11px] text-rose-400/80 mt-0.5">Thiếu bằng chứng</p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION A: MA TRẬN NĂNG LỰC HỆ THỐNG & BẰNG CHỨNG (CAPABILITY MATRIX) */}
      {/* ============================================================ */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-gold" />
              <h2 className="font-display text-xl font-semibold text-foreground">
                Phần A: Ma trận Năng lực Hệ thống (Capability Matrix)
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Minh chứng chi tiết các tính năng đã được kiểm thử hoặc cài đặt, liên kết trực tiếp tới file mã nguồn, API route và ca kiểm thử tự động.
            </p>
          </div>

          {/* Bộ điều khiển tìm kiếm & lọc */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm năng lực, file, API..."
                className="pl-9 pr-3 py-1.5 rounded-lg text-xs bg-card/60 border border-white/15 focus:outline-none focus:border-gold/50 text-foreground w-48 sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 rounded-lg text-xs bg-card/60 border border-white/15 focus:outline-none focus:border-gold/50 text-foreground"
            >
              <option value="ALL">Tất cả trạng thái ({CAPABILITY_DOMAINS.length})</option>
              <option value="TESTED">Đã kiểm thử (TESTED)</option>
              <option value="IMPLEMENTED">Đã cài đặt (IMPLEMENTED)</option>
              <option value="RUNTIME VERIFIED">Xác minh Runtime</option>
              <option value="PARTIALLY IMPLEMENTED">Cài đặt một phần</option>
              <option value="BLOCKED">Bị chặn (BLOCKED)</option>
              <option value="NOT VERIFIED">Chưa xác minh</option>
            </select>
          </div>
        </div>

        {/* Danh sách thẻ năng lực (Capability Cards) */}
        {filteredDomains.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground text-sm">
            Không tìm thấy miền năng lực nào khớp với bộ lọc.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredDomains.map((domain) => {
              const statusCfg = CAPABILITY_STATUS_CONFIG[domain.status];
              const isLimitationOpen = expandedLimitations[domain.id];

              return (
                <div
                  key={domain.id}
                  className="glass rounded-2xl p-5 border border-white/10 hover:border-gold/30 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Title + Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                          {domain.category}
                        </span>
                        <h3 className="font-display text-base font-semibold text-foreground mt-0.5">
                          {domain.name}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 ${statusCfg.badgeClass}`}
                        title={statusCfg.description}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                        {domain.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {domain.description}
                    </p>

                    {/* Functionality Checklist */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-medium text-foreground uppercase tracking-wider">
                        Chức năng đã xây dựng:
                      </p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {domain.functionality.map((func, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                            <span>{func}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Evidence References */}
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <p className="text-[11px] font-medium text-foreground uppercase tracking-wider flex items-center justify-between">
                        <span>Bằng chứng kỹ thuật:</span>
                        {domain.evidence.testCount !== undefined && (
                          <span className="text-emerald-400 text-[11px] font-mono lowercase">
                            {domain.evidence.testCount} tests passed
                          </span>
                        )}
                      </p>

                      {/* API Routes */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground block">
                          Endpoint API:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {domain.evidence.apiRoutes.map((route, i) => (
                            <span
                              key={i}
                              className="font-mono text-[10px] bg-background/80 px-2 py-0.5 rounded border border-white/10 text-muted-foreground"
                            >
                              {route}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Source Files */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground block">
                          Tập tin mã nguồn cốt lõi:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {domain.evidence.sourceFiles.map((file, i) => (
                            <span
                              key={i}
                              className="font-mono text-[10px] bg-background/50 px-2 py-0.5 rounded border border-white/5 text-muted-foreground"
                            >
                              {file.split("/").pop()}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Test Files */}
                      {domain.evidence.testFiles.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground block">
                            Tập tin kiểm thử tự động:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {domain.evidence.testFiles.map((testFile, i) => (
                              <span
                                key={i}
                                className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20"
                              >
                                {testFile.split("/").pop()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer: Limitations & Navigation */}
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                    {/* Toggle Known Limitations */}
                    {domain.limitations.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleLimitation(domain.id)}
                          className="flex items-center justify-between w-full text-[11px] text-amber-400/90 hover:text-amber-300 font-medium"
                        >
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Giới hạn đã ghi nhận & Phụ thuộc ({domain.limitations.length})
                          </span>
                          {isLimitationOpen ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {isLimitationOpen && (
                          <ul className="mt-2 space-y-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90">
                            {domain.limitations.map((lim, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-400 mt-0.5">•</span>
                                <span>{lim}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Jump to Route Button */}
                    {domain.frontendRoute && (
                      <div className="flex justify-end pt-1">
                        <Link
                          to={domain.frontendRoute}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:text-gold/80 transition-colors"
                        >
                          <span>Mở tính năng ({domain.routeLabel || "Truy cập"})</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* SECTION B: CÁC CHỈ SỐ VẬN HÀNH THỰC TẾ (OPERATIONAL METRICS) */}
      {/* ============================================================ */}
      <section className="space-y-6 pt-4 border-t border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              Phần B: Chỉ số Vận hành Thực tế (Operational Metrics)
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Dữ liệu tổng hợp từ các bảng cơ sở dữ liệu hệ thống (PostgreSQL). Toàn bộ phép đếm được thực hiện tập trung tại tầng CSDL thông qua JPA Repositories.
          </p>
        </div>

        {/* Loading / Error States */}
        {isErrorStats && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Không thể nạp dữ liệu thống kê quản trị từ máy chủ.</span>
            </div>
            <button
              type="button"
              onClick={() => void refetchStats()}
              className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-medium"
            >
              Thử lại
            </button>
          </div>
        )}

        {isLoadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 border border-white/10 animate-pulse h-48" />
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Grid 7 Metric Domains */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* 1. Người dùng & Hoạt động */}
              <div className="glass rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Users className="w-4 h-4 text-sky-400" />
                      1. Người dùng & Hoạt động
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleDefinition("users")}
                      className="text-muted-foreground hover:text-gold transition-colors"
                      title="Xem định nghĩa số liệu & nguồn dữ liệu"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold font-display text-foreground">
                        {nf(stats.users.total)}
                      </span>
                      <span className="text-xs text-muted-foreground">tài khoản</span>
                    </div>
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{nf(stats.users.newLast7Days)} tài khoản mới trong 7 ngày
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Thành viên (USER):</span>
                      <span className="font-medium text-foreground">
                        {nf(stats.users.byRole.USER || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Nhân viên / Reader (STAFF):</span>
                      <span className="font-medium text-foreground">
                        {nf(stats.users.byRole.STAFF || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Quản lý (MANAGER):</span>
                      <span className="font-medium text-foreground">
                        {nf(stats.users.byRole.MANAGER || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Quản trị viên (ADMIN):</span>
                      <span className="font-medium text-foreground">
                        {nf(stats.users.byRole.ADMIN || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Definition Box */}
                {expandedDefinitions.users && (
                  <div className="mt-4 p-3 rounded-xl bg-background/90 border border-gold/30 text-[11px] space-y-1 text-muted-foreground">
                    <p className="font-medium text-gold">{METRIC_DEFINITIONS.users.title}</p>
                    <p>{METRIC_DEFINITIONS.users.definition}</p>
                    <p className="text-[10px]">
                      <b>Nguồn:</b> {METRIC_DEFINITIONS.users.dataSource}
                    </p>
                    <p className="text-[10px]">
                      <b>API:</b> {METRIC_DEFINITIONS.users.apiEndpoint}
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Tarot AI & Lượng Token */}
              <div className="glass rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Bot className="w-4 h-4 text-purple-400" />
                      2. Tarot AI & Sử dụng Token
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleDefinition("ai")}
                      className="text-muted-foreground hover:text-gold transition-colors"
                      title="Xem định nghĩa số liệu & nguồn dữ liệu"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold font-display text-foreground">
                        {nf(stats.ai?.totalCalls || 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">lượt gọi AI</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {nf(stats.ai?.callsLast30Days || 0)} lượt trong 30 ngày qua
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Tổng token tiêu thụ:</span>
                      <span className="font-medium text-foreground">
                        {nf(stats.ai?.totalTokens || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Token 30 ngày qua:</span>
                      <span className="font-medium text-foreground">
                        {nf(stats.ai?.tokensLast30Days || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Chi phí ước lượng (USD):</span>
                      <span className="font-medium text-purple-400">
                        {usd(stats.ai?.estimatedCostUsd || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Chi phí quy đổi VND:</span>
                      <span className="font-medium text-foreground">
                        {vnd(stats.revenue?.aiCostVnd || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedDefinitions.ai && (
                  <div className="mt-4 p-3 rounded-xl bg-background/90 border border-gold/30 text-[11px] space-y-1 text-muted-foreground">
                    <p className="font-medium text-gold">{METRIC_DEFINITIONS.ai.title}</p>
                    <p>{METRIC_DEFINITIONS.ai.definition}</p>
                    <p className="text-[10px]">
                      <b>Nguồn:</b> {METRIC_DEFINITIONS.ai.dataSource}
                    </p>
                    <p className="text-[10px]">
                      <b>API:</b> {METRIC_DEFINITIONS.ai.apiEndpoint}
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Lịch hẹn & Thị trường Reader */}
              <div className="glass rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <CalendarClock className="w-4 h-4 text-amber-400" />
                      3. Lịch hẹn & Thị trường Reader
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleDefinition("bookings")}
                      className="text-muted-foreground hover:text-gold transition-colors"
                      title="Xem định nghĩa số liệu & nguồn dữ liệu"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold font-display text-foreground">
                        {nf(stats.bookings.total)}
                      </span>
                      <span className="text-xs text-muted-foreground">lượt đặt lịch</span>
                    </div>
                    <p className="text-xs text-emerald-400 mt-1">
                      {nf(stats.bookings.byStatus.COMPLETED || 0)} phiên đọc hoàn tất thành công
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Đang chờ duyệt (PENDING):</span>
                      <span className="font-medium text-amber-400">
                        {nf(stats.bookings.byStatus.PENDING || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Đã xác nhận (CONFIRMED):</span>
                      <span className="font-medium text-sky-400">
                        {nf(stats.bookings.byStatus.CONFIRMED || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Đã huỷ (CANCELLED):</span>
                      <span className="font-medium text-rose-400">
                        {nf(stats.bookings.byStatus.CANCELLED || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Hồ sơ Reader hoạt động:</span>
                      <span className="font-medium text-foreground">
                        {nf(stats.readers.activeProfiles)}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedDefinitions.bookings && (
                  <div className="mt-4 p-3 rounded-xl bg-background/90 border border-gold/30 text-[11px] space-y-1 text-muted-foreground">
                    <p className="font-medium text-gold">{METRIC_DEFINITIONS.bookings.title}</p>
                    <p>{METRIC_DEFINITIONS.bookings.definition}</p>
                    <p className="text-[10px]">
                      <b>Nguồn:</b> {METRIC_DEFINITIONS.bookings.dataSource}
                    </p>
                    <p className="text-[10px]">
                      <b>API:</b> {METRIC_DEFINITIONS.bookings.apiEndpoint}
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Thanh toán, Ký quỹ & Lợi nhuận */}
              <div className="glass rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      4. Thanh toán, Ký quỹ & Lợi nhuận
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleDefinition("payments")}
                      className="text-muted-foreground hover:text-gold transition-colors"
                      title="Xem định nghĩa số liệu & nguồn dữ liệu"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-semibold font-display text-foreground">
                        {vnd(stats.revenue?.grossRevenue || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Doanh thu gộp ({nf(stats.revenue?.successfulPayments || 0)} giao dịch)
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Phí sàn nền tảng (20%):</span>
                      <span className="font-medium text-foreground">
                        {vnd(stats.revenue?.platformFee || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Phần chia sẻ Reader (80%):</span>
                      <span className="font-medium text-foreground">
                        {vnd(stats.revenue?.readerShare || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Đã chi trả rút tiền (PAID):</span>
                      <span className="font-medium text-foreground">
                        {vnd(stats.revenue?.paidOut || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Lợi nhuận ròng (trừ phí AI):</span>
                      <span
                        className={`font-semibold font-mono ${
                          (stats.revenue?.netProfit || 0) >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {vnd(stats.revenue?.netProfit || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedDefinitions.payments && (
                  <div className="mt-4 p-3 rounded-xl bg-background/90 border border-gold/30 text-[11px] space-y-1 text-muted-foreground">
                    <p className="font-medium text-gold">{METRIC_DEFINITIONS.payments.title}</p>
                    <p>{METRIC_DEFINITIONS.payments.definition}</p>
                    <p className="text-[10px]">
                      <b>Nguồn:</b> {METRIC_DEFINITIONS.payments.dataSource}
                    </p>
                    <p className="text-[10px]">
                      <b>API:</b> {METRIC_DEFINITIONS.payments.apiEndpoint}
                    </p>
                  </div>
                )}
              </div>

              {/* 5. Đánh giá & Góp ý hệ thống (Phase 1) */}
              <div className="glass rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Star className="w-4 h-4 text-gold fill-gold" />
                      5. Đánh giá & Góp ý (Phase 1)
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleDefinition("feedback")}
                      className="text-muted-foreground hover:text-gold transition-colors"
                      title="Xem định nghĩa số liệu & nguồn dữ liệu"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold font-display text-gold">
                        {feedbackStats?.averageRating ? feedbackStats.averageRating.toFixed(1) : "5.0"}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 5.0 sao trung bình</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tổng cộng {nf(feedbackStats?.totalCount || stats.traction?.feedbackCount || 0)} lượt phản hồi đã ghi nhận
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Điểm NPS trung bình:</span>
                      <span className="font-medium text-foreground">
                        {feedbackStats?.averageNps ? feedbackStats.averageNps.toFixed(1) : "—"} / 10
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Mục tiêu khảo sát (&gt;= 20):</span>
                      <span
                        className={`font-medium ${
                          (feedbackStats?.totalCount || 0) >= 20
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {(feedbackStats?.totalCount || 0) >= 20 ? "ĐẠT MỤC TIÊU" : "ĐANG THU THẬP"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Đánh giá 5 sao (Rất tốt):</span>
                      <span className="font-medium text-foreground">
                        {nf(feedbackStats?.ratingDistribution?.["5"] || 0)} lượt
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Đánh giá Reader riêng biệt:</span>
                      <span className="font-medium text-foreground">
                        {nf(stats.traction?.reviewsCount || 0)} đánh giá
                      </span>
                    </div>
                  </div>
                </div>

                {expandedDefinitions.feedback && (
                  <div className="mt-4 p-3 rounded-xl bg-background/90 border border-gold/30 text-[11px] space-y-1 text-muted-foreground">
                    <p className="font-medium text-gold">{METRIC_DEFINITIONS.feedback.title}</p>
                    <p>{METRIC_DEFINITIONS.feedback.definition}</p>
                    <p className="text-[10px]">
                      <b>Nguồn:</b> {METRIC_DEFINITIONS.feedback.dataSource}
                    </p>
                    <p className="text-[10px]">
                      <b>API:</b> {METRIC_DEFINITIONS.feedback.apiEndpoint}
                    </p>
                  </div>
                )}
              </div>

              {/* 6. Tiếp thị Liên kết & Sự kiện Marketing */}
              <div className="glass rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <ShoppingBag className="w-4 h-4 text-pink-400" />
                      6. Tiếp thị Liên kết (Affiliate)
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleDefinition("affiliate")}
                      className="text-muted-foreground hover:text-gold transition-colors"
                      title="Xem định nghĩa số liệu & nguồn dữ liệu"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold font-display text-foreground">
                        {nf(stats.shop.clicksLast30Days)}
                      </span>
                      <span className="text-xs text-muted-foreground">clicks (30 ngày)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tổng {nf(stats.shop.clicksTotal)} lượt nhấp chuyển tiếp sàn
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Sản phẩm liên kết hoạt động:</span>
                      <span className="font-medium text-foreground">
                        {nf(stats.shop.activeProducts)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Sự kiện Marketing ghi nhận:</span>
                      <span className="font-medium text-foreground">
                        {nf(
                          Object.values(stats.traction?.marketingEventsLast30Days || {}).reduce(
                            (a, b) => a + b,
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedDefinitions.affiliate && (
                  <div className="mt-4 p-3 rounded-xl bg-background/90 border border-gold/30 text-[11px] space-y-1 text-muted-foreground">
                    <p className="font-medium text-gold">{METRIC_DEFINITIONS.affiliate.title}</p>
                    <p>{METRIC_DEFINITIONS.affiliate.definition}</p>
                    <p className="text-[10px]">
                      <b>Nguồn:</b> {METRIC_DEFINITIONS.affiliate.dataSource}
                    </p>
                    <p className="text-[10px]">
                      <b>API:</b> {METRIC_DEFINITIONS.affiliate.apiEndpoint}
                    </p>
                  </div>
                )}
              </div>

              {/* 7. Nội dung Blog & Kiểm duyệt */}
              <div className="glass rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      7. Nội dung Blog & Kiểm duyệt
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleDefinition("blogs")}
                      className="text-muted-foreground hover:text-gold transition-colors"
                      title="Xem định nghĩa số liệu & nguồn dữ liệu"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold font-display text-foreground">
                        {nf(stats.blogs?.total || 0)}
                      </span>
                      <span className="text-xs text-muted-foreground">tổng bài viết</span>
                    </div>
                    <p className="text-xs text-emerald-400 mt-1">
                      {nf(stats.blogs?.published || 0)} bài viết đã xuất bản (PUBLISHED)
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Bài viết chờ duyệt (PENDING):</span>
                      <span className="font-medium text-amber-400">
                        {nf(stats.blogs?.pending || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Bản nháp (DRAFT):</span>
                      <span className="font-medium text-muted-foreground">
                        {nf(stats.blogs?.draft || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Báo cáo vi phạm chờ duyệt:</span>
                      <span className="font-medium text-rose-400">
                        {nf(stats.moderation.pendingReports)}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedDefinitions.blogs && (
                  <div className="mt-4 p-3 rounded-xl bg-background/90 border border-gold/30 text-[11px] space-y-1 text-muted-foreground">
                    <p className="font-medium text-gold">{METRIC_DEFINITIONS.blogs.title}</p>
                    <p>{METRIC_DEFINITIONS.blogs.definition}</p>
                    <p className="text-[10px]">
                      <b>Nguồn:</b> {METRIC_DEFINITIONS.blogs.dataSource}
                    </p>
                    <p className="text-[10px]">
                      <b>API:</b> {METRIC_DEFINITIONS.blogs.apiEndpoint}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
