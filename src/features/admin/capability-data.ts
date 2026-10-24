// ============================================================
// DỮ LIỆU NĂNG LỰC HỆ THỐNG VÀ BẰNG CHỨNG KIỂM ĐỊNH (OUTCOME 3)
//
// Phục vụ màn hình Báo cáo Năng lực & Vận hành (Task B).
// Trạng thái kiểm định phản ánh trung thực bằng chứng mã nguồn và
// kết quả kiểm thử thực tế, không bịa đặt số liệu runtime.
// ============================================================

export type CapabilityStatus =
  | "IMPLEMENTED"
  | "TESTED"
  | "RUNTIME VERIFIED"
  | "PARTIALLY IMPLEMENTED"
  | "BLOCKED"
  | "NOT VERIFIED";

export interface CapabilityEvidence {
  sourceFiles: string[];
  apiRoutes: string[];
  testFiles: string[];
  testCount?: number;
}

export interface CapabilityDomain {
  id: string;
  name: string;
  category: "CORE" | "COMMERCE" | "CONTENT" | "OPERATIONS";
  status: CapabilityStatus;
  description: string;
  functionality: string[];
  evidence: CapabilityEvidence;
  frontendRoute?: string;
  routeLabel?: string;
  limitations: string[];
}

export const CAPABILITY_STATUS_CONFIG: Record<
  CapabilityStatus,
  {
    label: string;
    description: string;
    badgeClass: string;
    dotColor: string;
  }
> = {
  TESTED: {
    label: "ĐÃ KIỂM THỬ (TESTED)",
    description: "Có mã nguồn và bộ kiểm thử tự động tương ứng đã vượt qua.",
    badgeClass: "bg-success/10 text-success border-success/30",
    dotColor: "bg-success",
  },
  "RUNTIME VERIFIED": {
    label: "XÁC MINH RUNTIME",
    description: "Hành vi đã được kích hoạt và kiểm chứng trong môi trường chạy thật.",
    badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    dotColor: "bg-indigo-400",
  },
  IMPLEMENTED: {
    label: "ĐÃ CÀI ĐẶT (IMPLEMENTED)",
    description: "Chức năng hoàn chỉnh trong mã nguồn và schema, chưa có suite unit test riêng.",
    badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    dotColor: "bg-sky-400",
  },
  "PARTIALLY IMPLEMENTED": {
    label: "CÀI ĐẶT MỘT PHẦN",
    description: "Mới hoàn thành một phần yêu cầu hoặc đang trong quá trình phát triển.",
    badgeClass: "bg-warning/10 text-warning border-warning/30",
    dotColor: "bg-warning",
  },
  BLOCKED: {
    label: "BỊ CHẶN (BLOCKED)",
    description: "Kiểm định hoặc vận hành bị chặn bởi phụ thuộc ngoại vi có tài liệu.",
    badgeClass: "bg-destructive-soft/10 text-destructive-soft border-destructive-soft/30",
    dotColor: "bg-destructive",
  },
  "NOT VERIFIED": {
    label: "CHƯA XÁC MINH",
    description: "Chưa đủ bằng chứng để xác minh tính năng.",
    badgeClass: "bg-muted/40 text-muted-foreground border-white/10",
    dotColor: "bg-muted-foreground",
  },
};

export const CAPABILITY_DOMAINS: CapabilityDomain[] = [
  {
    id: "auth-rbac",
    name: "Xác thực & Phân quyền (Authentication & RBAC)",
    category: "CORE",
    status: "TESTED",
    description:
      "Hệ thống xác thực JWT không trạng thái, phân quyền dựa trên vai trò (USER, READER/STAFF, MANAGER, ADMIN), thu hồi phiên và đặt lại mật khẩu.",
    functionality: [
      "Đăng ký, đăng nhập và phát hành JWT Access/Refresh Token",
      "Phân quyền dựa trên vai trò (Role-Based Access Control)",
      "Quản lý vòng đời tài khoản (khóa, mở khóa, đổi vai trò)",
      "Thu hồi phiên đăng nhập từ xa và quy trình gửi mail xác minh/đặt lại mật khẩu",
    ],
    evidence: {
      sourceFiles: [
        "src/main/java/com/exe/astratarot/config/SecurityConfig.java",
        "src/main/java/com/exe/astratarot/security/CustomUserDetails.java",
        "src/main/java/com/exe/astratarot/controller/AuthController.java",
        "src/main/java/com/exe/astratarot/service/impl/UserAdminServiceImpl.java",
        "src/lib/auth-context.tsx",
      ],
      apiRoutes: [
        "POST /api/v1/auth/login",
        "POST /api/v1/auth/register",
        "GET /api/v1/admin/users",
        "PATCH /api/v1/admin/users/{id}/role",
        "POST /api/v1/admin/users/{id}/sessions/revoke",
      ],
      testFiles: [
        "src/test/java/com/exe/astratarot/controller/AuthControllerTest.java",
        "src/test/java/com/exe/astratarot/controller/SubscriptionControllerSecurityTest.java",
      ],
      testCount: 15,
    },
    frontendRoute: "/admin?tab=users",
    routeLabel: "Quản lý Tài khoản",
    limitations: [
      "Gửi email xác thực tài khoản và đặt lại mật khẩu cần cấu hình SMTP Server bên ngoài",
      "Phiên làm việc trên thiết bị cũ phụ thuộc thời gian hết hạn của JWT",
    ],
  },
  {
    id: "ai-tarot",
    name: "Trải bài Tarot AI & Hội thoại (AI Tarot Reading & Conversation)",
    category: "CORE",
    status: "TESTED",
    description:
      "Động cơ phân tích ý nghĩa lá bài theo ngữ cảnh câu hỏi, trả lời trực tiếp qua luồng dữ liệu (SSE Stream) và kiểm soát định lượng token tiêu thụ.",
    functionality: [
      "Giải nghĩa lá bài Tarot kết hợp thông tin chiêm tinh học của người hỏi",
      "Streaming câu trả lời thời gian thực qua Server-Sent Events (SSE)",
      "Ghi nhận chi tiết token đầu vào, token đầu ra và chi phí USD theo từng mô hình",
      "Quản lý lịch sử hội thoại và tái sử dụng ngữ cảnh phiên hỏi đáp",
    ],
    evidence: {
      sourceFiles: [
        "src/main/java/com/exe/astratarot/controller/AIChatController.java",
        "src/main/java/com/exe/astratarot/service/impl/OpenAiServiceImpl.java",
        "src/main/java/com/exe/astratarot/repository/AIUsageLogRepository.java",
      ],
      apiRoutes: [
        "POST /api/v1/ai/chat",
        "POST /api/v1/ai/reading",
        "GET /api/v1/ai/chat/history",
      ],
      testFiles: [
        "src/test/java/com/exe/astratarot/controller/AIChatControllerStreamTest.java",
      ],
      testCount: 3,
    },
    frontendRoute: "/tarot-ai",
    routeLabel: "Trải nghiệm Tarot AI",
    limitations: [
      "Phụ thuộc khóa API và hạn mức tốc độ (rate limit) của nhà cung cấp LLM ngoài (Gemini/OpenAI)",
      "Bộ kiểm thử bối cảnh Spring Boot gặp giới hạn cú pháp JSONB trên cơ sở dữ liệu in-memory H2",
    ],
  },
  {
    id: "astrology",
    name: "Chiêm tinh học & Bản đồ sao (Astrology & Natal Chart)",
    category: "CORE",
    status: "TESTED",
    description:
      "Tính toán vị trí các hành tinh, 12 cung hoàng đạo, các cung địa bàn (Houses) và góc hợp (Aspects) dựa trên ngày giờ và tọa độ sinh.",
    functionality: [
      "Tính toán vị trí tọa độ các hành tinh trong Hệ Mặt Trời theo thời gian thực",
      "Phân bổ bản đồ sao cá nhân theo hệ thống 12 cung địa bàn (Placidus)",
      "Xác định các góc hợp hòa hợp và thử thách (Trine, Sextile, Square, Opposition)",
      "Lưu và đồng bộ nhiều hồ sơ chiêm tinh cho một tài khoản",
    ],
    evidence: {
      sourceFiles: [
        "src/main/java/com/exe/astratarot/controller/AstrologyController.java",
        "src/main/java/com/exe/astratarot/service/impl/AstrologyServiceImpl.java",
        "src/main/java/com/exe/astratarot/domain/entity/AstrologyProfile.java",
      ],
      apiRoutes: [
        "GET /api/v1/astrology/natal-chart",
        "POST /api/v1/astrology/profiles",
        "GET /api/v1/astrology/profiles",
      ],
      testFiles: [
        "src/test/java/com/exe/astratarot/controller/AstrologyControllerTest.java",
      ],
      testCount: 8,
    },
    frontendRoute: "/astrology",
    routeLabel: "Xem Bản đồ sao",
    limitations: [
      "Độ chính xác cung mọc (Ascendant) phụ thuộc nghiêm ngặt vào độ chính xác của giờ sinh (sai số 4 phút làm lệch 1 độ)",
    ],
  },
  {
    id: "reader-marketplace",
    name: "Sàn Reader & Quy trình Đặt lịch (Reader Marketplace & Booking)",
    category: "OPERATIONS",
    status: "TESTED",
    description:
      "Hệ sinh thái kết nối Reader và khách hàng: hồ sơ năng lực, xét duyệt ứng tuyển, quản lý khung giờ rảnh và đặt lịch hẹn tự động.",
    functionality: [
      "Quy trình nộp và xét duyệt hồ sơ ứng tuyển Reader cho Ban quản trị",
      "Thiết lập khung giờ tiếp khách (availability) và ngày nghỉ đột xuất",
      "Quy trình đặt lịch hẹn với trạng thái PENDING -> CONFIRMED -> COMPLETED -> CANCELLED",
      "Tự động rà soát và hủy lịch hẹn quá hạn thanh toán qua Job Scheduler định kỳ",
    ],
    evidence: {
      sourceFiles: [
        "src/main/java/com/exe/astratarot/controller/ReaderController.java",
        "src/main/java/com/exe/astratarot/service/impl/ReaderServiceImpl.java",
        "src/main/java/com/exe/astratarot/config/BookingPaymentScheduler.java",
        "src/main/java/com/exe/astratarot/repository/BookingRepository.java",
      ],
      apiRoutes: [
        "GET /api/v1/readers",
        "POST /api/v1/bookings",
        "GET /api/v1/admin/readers/applications",
        "PATCH /api/v1/admin/readers/{id}/review",
      ],
      testFiles: [
        "src/test/java/com/exe/astratarot/controller/ReaderControllerTest.java",
        "src/test/java/com/exe/astratarot/config/BookingPaymentSchedulerTest.java",
        "src/test/java/com/exe/astratarot/domain/entity/BookingDepositFieldsTest.java",
      ],
      testCount: 15,
    },
    frontendRoute: "/admin?tab=applications",
    routeLabel: "Hồ sơ Reader",
    limitations: [
      "Ngăn chặn trùng lịch dựa trên khóa bản ghi CSDL; thông báo phiên đọc bài cần kênh thời gian thực hoặc email ổn định",
    ],
  },
  {
    id: "escrow-payments",
    name: "Tạm giữ, Thanh toán & Rút tiền (Escrow, Payments & Payouts)",
    category: "COMMERCE",
    status: "TESTED",
    description:
      "Tích hợp cổng PayOS, tài khoản tạm giữ bảo vệ hai chiều, chia sẻ doanh thu (80% Reader - 20% Phí sàn) và đối soát lệnh rút tiền.",
    functionality: [
      "Tạo liên kết thanh toán PayOS và xử lý Webhook có chữ ký xác thực HMAC",
      "Cơ chế tài khoản ký quỹ (Escrow) tạm giữ tiền khách hàng cho đến khi buổi đọc hoàn tất",
      "Khấu trừ tự động 20% phí sàn nền tảng, ghi nhận 80% số dư khả dụng cho Reader",
      "Quy trình gửi yêu cầu rút tiền (payout request), phê duyệt và ghi nhận chi trả",
    ],
    evidence: {
      sourceFiles: [
        "src/main/java/com/exe/astratarot/controller/MoneyController.java",
        "src/main/java/com/exe/astratarot/service/impl/EscrowServiceImpl.java",
        "src/main/java/com/exe/astratarot/controller/PayOsWebhookController.java",
        "src/main/java/com/exe/astratarot/config/PayOsWebhookRegistrar.java",
      ],
      apiRoutes: [
        "POST /api/v1/money/payment/create",
        "POST /api/v1/payos/webhook",
        "POST /api/v1/money/payout-requests",
        "GET /api/v1/admin/stats",
      ],
      testFiles: [
        "src/test/java/com/exe/astratarot/controller/MoneyControllerTest.java",
        "src/test/java/com/exe/astratarot/controller/PayOsWebhookControllerTest.java",
        "src/test/java/com/exe/astratarot/config/PayOsWebhookRegistrarTest.java",
      ],
      testCount: 26,
    },
    frontendRoute: "/admin?tab=payments",
    routeLabel: "Quản lý Thanh toán",
    limitations: [
      "Webhook PayOS yêu cầu domain public hoặc tunnel HTTPS trong môi trường production",
      "Lệnh chuyển tiền ra ngoài ngân hàng cho Reader hiện thực hiện qua đối soát nhân viên",
    ],
  },
  {
    id: "system-feedback",
    name: "Đánh giá & Góp ý hệ thống (System Feedback & Reviews — Phase 1)",
    category: "OPERATIONS",
    status: "TESTED",
    description:
      "Đánh giá 1–5 sao bắt buộc, ý kiến đóng góp tuỳ chọn tối đa 2.000 ký tự, NPS suy diễn tương thích ngược, idempotency cho thành viên và cho phép khách ẩn danh.",
    functionality: [
      "Bắt buộc chọn 1–5 sao, kiểm tra giới hạn bình luận 2.000 ký tự cả ở FE lẫn BE",
      "Điểm NPS tuỳ chọn (0–10) với quy tắc tương thích tự động: nps = rating * 2 khi bỏ qua",
      "Thành viên chỉnh sửa bản ghi cũ thay vì tạo trùng lặp; bảo toàn ID và updated_at",
      "Khách ẩn danh gửi phản hồi độc lập không bị gán user ID giả mạo",
      "Bảng điều khiển Quản trị viên lọc theo số sao, nguồn và tính toán phân bổ",
      "Hệ thống đánh giá Reader được giữ riêng biệt và nguyên vẹn",
    ],
    evidence: {
      sourceFiles: [
        "src/main/java/com/exe/astratarot/controller/FeedbackController.java",
        "src/main/java/com/exe/astratarot/controller/AdminFeedbackController.java",
        "src/main/java/com/exe/astratarot/service/impl/FeedbackServiceImpl.java",
        "src/main/resources/db/migration/V2_30__feedback_audit_and_indexes.sql",
        "src/components/FeedbackPrompt.tsx",
        "src/features/admin/components/AdminFeedbackManager.tsx",
      ],
      apiRoutes: [
        "POST /api/v1/feedback",
        "GET /api/v1/feedback/my-status",
        "GET /api/v1/admin/feedback",
        "GET /api/v1/admin/feedback/stats",
      ],
      testFiles: [
        "src/test/java/com/exe/astratarot/service/impl/FeedbackServiceImplTest.java",
        "src/test/java/com/exe/astratarot/controller/FeedbackControllerTest.java",
        "src/test/java/com/exe/astratarot/controller/AdminFeedbackControllerTest.java",
        "src/test/java/com/exe/astratarot/service/impl/ReviewServiceImplTest.java",
        "src/components/FeedbackPrompt.test.ts",
        "src/features/admin/components/AdminFeedbackManager.test.ts",
      ],
      testCount: 28,
    },
    frontendRoute: "/admin?tab=feedback",
    routeLabel: "Quản lý Góp ý",
    limitations: [
      "Mỗi tài khoản chỉ được lưu 1 bản ghi phản hồi (ràng buộc partial unique index CSDL)",
      "Kiểm thử tích hợp runtime cục bộ hiện bị chặn bởi Docker daemon tắt",
    ],
  },
  {
    id: "affiliate-shop",
    name: "Thương mại Tiếp thị Liên kết (Affiliate Commerce)",
    category: "COMMERCE",
    status: "IMPLEMENTED",
    description:
      "Quản lý danh mục sản phẩm đá thanh tẩy và bài Tarot, theo dõi số lượt nhấp chuột sang sàn thương mại điện tử đối tác.",
    functionality: [
      "Quản lý danh mục sản phẩm với liên kết tiếp thị (Affiliate URL)",
      "Bộ theo dõi lượt click chuyển tiếp (redirect click tracking) thời gian thực",
      "Tổng hợp số liệu sản phẩm đang hoạt động và số lượt click 30 ngày cho Quản trị viên",
    ],
    evidence: {
      sourceFiles: [
        "src/main/java/com/exe/astratarot/controller/ProductController.java",
        "src/main/java/com/exe/astratarot/repository/ProductClickRepository.java",
        "src/main/java/com/exe/astratarot/repository/ProductRepository.java",
        "src/features/shop/components/CatalogManager.tsx",
      ],
      apiRoutes: [
        "GET /api/v1/products",
        "POST /api/v1/products/{id}/click",
        "POST /api/v1/admin/products",
        "GET /api/v1/admin/stats",
      ],
      testFiles: [
        "src/test/java/com/exe/astratarot/service/impl/AdminStatsServiceImplTest.java",
      ],
      testCount: 2,
    },
    frontendRoute: "/admin?tab=commerce",
    routeLabel: "Sản phẩm Liên kết",
    limitations: [
      "Chỉ theo dõi số lượt chuyển hướng outbound click; dữ liệu mua hàng và hoa hồng phụ thuộc đối soát trên hệ thống Shopee/Lazada Affiliate",
    ],
  },
  {
    id: "blog-moderation",
    name: "Nội dung Blog & Kiểm duyệt (Blog & Content Moderation)",
    category: "CONTENT",
    status: "IMPLEMENTED",
    description:
      "Quy trình xuất bản bài viết kiến thức, phê duyệt kiểm duyệt nội dung và tiếp nhận, xử lý báo cáo vi phạm từ cộng đồng.",
    functionality: [
      "Soạn thảo và lưu trữ bài viết với các trạng thái DRAFT, PENDING, APPROVED, PUBLISHED",
      "Hàng đợi xét duyệt bài viết cho Quản trị viên và Nhân viên (Staff)",
      "Tiếp nhận và giải quyết báo cáo vi phạm nội dung (Report status: PENDING / RESOLVED)",
      "Thống kê phân bổ trạng thái bài viết theo thời gian thực",
    ],
    evidence: {
      sourceFiles: [
        "src/main/java/com/exe/astratarot/controller/BlogController.java",
        "src/main/java/com/exe/astratarot/service/impl/BlogServiceImpl.java",
        "src/main/java/com/exe/astratarot/repository/BlogRepository.java",
        "src/main/java/com/exe/astratarot/controller/ReportController.java",
        "src/features/blog/components/BlogReviewQueue.tsx",
      ],
      apiRoutes: [
        "GET /api/v1/blogs",
        "POST /api/v1/blogs",
        "PATCH /api/v1/blogs/{id}/status",
        "GET /api/v1/reports",
        "GET /api/v1/admin/stats",
      ],
      testFiles: [
        "src/test/java/com/exe/astratarot/service/impl/AdminStatsServiceImplTest.java",
      ],
      testCount: 3,
    },
    frontendRoute: "/admin?tab=blogs",
    routeLabel: "Quản lý Blog",
    limitations: [
      "Quá trình duyệt bài và xử lý vi phạm hoàn toàn dựa trên sự can thiệp thủ công của Quản trị viên",
    ],
  },
  {
    id: "ai-subscription-plans",
    name: "Gói Dịch vụ AI & Quyền lợi Hội viên (AI Subscription Plans)",
    category: "COMMERCE",
    status: "TESTED",
    description:
      "Quản lý danh sách gói quyền lợi người dùng, giới hạn số lượt hỏi bài Tarot AI và phân quyền nâng cấp tài khoản.",
    functionality: [
      "Quản lý cấu hình các gói dịch vụ AI (Free, Pro, Premium)",
      "Kiểm tra điều kiện phân quyền (RBAC) khi thao tác với danh mục gói",
      "Ghi nhận giao dịch mua gói hội viên và gia hạn thời hạn sử dụng",
    ],
    evidence: {
      sourceFiles: [
        "src/main/java/com/exe/astratarot/controller/SubscriptionController.java",
        "src/main/java/com/exe/astratarot/domain/entity/SubscriptionPlan.java",
        "src/features/admin/components/AIPlanManager.tsx",
      ],
      apiRoutes: [
        "GET /api/v1/subscriptions/plans",
        "POST /api/v1/subscriptions/purchase",
        "POST /api/v1/admin/subscriptions/plans",
      ],
      testFiles: [
        "src/test/java/com/exe/astratarot/controller/SubscriptionControllerSecurityTest.java",
      ],
      testCount: 4,
    },
    frontendRoute: "/admin?tab=ai-plans",
    routeLabel: "Gói AI",
    limitations: [
      "Người dùng cần nạp tiền vào ví hoặc hoàn tất giao dịch PayOS trước khi kích hoạt gói",
    ],
  },
];

export function getCapabilityStats(domains: CapabilityDomain[] = CAPABILITY_DOMAINS) {
  const byStatus: Record<CapabilityStatus, number> = {
    TESTED: 0,
    "RUNTIME VERIFIED": 0,
    IMPLEMENTED: 0,
    "PARTIALLY IMPLEMENTED": 0,
    BLOCKED: 0,
    "NOT VERIFIED": 0,
  };

  for (const d of domains) {
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;
  }

  const verifiedOrTested = byStatus.TESTED + byStatus["RUNTIME VERIFIED"];
  const total = domains.length;
  const verifiedRate = total > 0 ? Math.round((verifiedOrTested / total) * 100) : 0;

  return {
    total,
    byStatus,
    verifiedOrTested,
    verifiedRate,
  };
}
