// ============================================================
// ADMIN API — quản lý tài khoản và duyệt hồ sơ Reader
// Khớp với BE: /api/v1/admin/**
//
// Cả MANAGER lẫn ADMIN đều gọi những endpoint này; BE tự giới hạn phạm vi của
// MANAGER (chỉ được đụng USER và STAFF) và trả về cờ `editable` cho từng hàng.
// ============================================================

import { apiFetch } from "./client";
import type { AccountRole } from "@/lib/roles";

const BASE = "/api/v1/admin";

export type AccountStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "BANNED";

export interface ManagedUser {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  avatar: string | null;
  role: AccountRole;
  status: AccountStatus;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  /**
   * Người đang đăng nhập có được sửa hàng này không — BE tính, giao diện không
   * đoán lại. Đoán lại là sớm muộn cũng lệch với luật thật ở BE.
   */
  editable: boolean;
}

export interface ManagedUserPage {
  content: ManagedUser[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface UserQuery {
  role?: string;
  status?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  PENDING: "Chờ xác minh",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngưng hoạt động",
  BANNED: "Đã khoá",
};

export function getUsers(query: UserQuery = {}) {
  const params = new URLSearchParams();
  if (query.role) params.set("role", query.role);
  if (query.status) params.set("status", query.status);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.size !== undefined) params.set("size", String(query.size));

  const qs = params.toString();
  return apiFetch<ManagedUserPage>(`${BASE}/users${qs ? `?${qs}` : ""}`);
}

export function updateUserRole(userId: string, role: AccountRole) {
  return apiFetch<ManagedUser>(`${BASE}/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function updateUserStatus(userId: string, status: AccountStatus) {
  return apiFetch<ManagedUser>(`${BASE}/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ---------- Hồ sơ xin làm Reader ----------

/**
 * BE trả về List<Map<String,Object>> nên hình dạng không được ràng buộc kiểu ở
 * đó. Khai báo lỏng ở đây và luôn có đường lùi khi thiếu trường, thay vì tin
 * chắc vào một cấu trúc mà BE không cam kết.
 */
export interface ReaderApplication {
  id?: string;
  applicationId?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  bio?: string;
  experience?: number;
  specialties?: string[];
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export function getReaderApplications() {
  return apiFetch<ReaderApplication[]>(`${BASE}/readers/applications`);
}

export function reviewReaderApplication(
  applicationId: string,
  action: "APPROVED" | "REJECTED",
  rejectionReason?: string,
) {
  return apiFetch<void>(`${BASE}/readers/${applicationId}/review`, {
    method: "PATCH",
    body: JSON.stringify({ action, rejectionReason: rejectionReason ?? null }),
  });
}

// ---------- Chi tiết và thao tác trên một tài khoản ----------

export interface ManagedUserDetail extends Omit<
  ManagedUser,
  "role" | "status"
> {
  role: AccountRole;
  status: AccountStatus;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  bio: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  authProvider: string | null;
  /** Quyền suy ra từ vai trò — để người sắp đổi vai trò thấy mình đang trao gì. */
  permissions: string[];
  activeSessions: number;
  orderCount: number;
  totalSpent: number;
  hasReaderProfile: boolean;
  hasPendingReaderApplication: boolean;
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  role: AccountRole;
  phone?: string;
  temporaryPassword?: string;
  /** true = đăng nhập được ngay; false = phải bấm link trong mail xác minh. */
  markEmailVerified?: boolean;
}

export interface UpdateUserInfoPayload {
  fullName?: string;
  phone?: string;
  city?: string;
  address?: string;
}

export function getUserDetail(userId: string) {
  return apiFetch<ManagedUserDetail>(`${BASE}/users/${userId}`);
}

export function createUser(payload: CreateUserPayload) {
  return apiFetch<ManagedUser>(`${BASE}/users`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUserInfo(userId: string, payload: UpdateUserInfoPayload) {
  return apiFetch<ManagedUser>(`${BASE}/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateRoleBulk(userIds: string[], role: AccountRole) {
  return apiFetch<ManagedUser[]>(`${BASE}/users/role`, {
    method: "PATCH",
    body: JSON.stringify({ userIds, role }),
  });
}

export function revokeUserSessions(userId: string) {
  return apiFetch<void>(`${BASE}/users/${userId}/sessions/revoke`, {
    method: "POST",
  });
}

export function sendPasswordReset(userId: string) {
  return apiFetch<void>(`${BASE}/users/${userId}/password-reset`, {
    method: "POST",
  });
}

export function resendVerification(userId: string) {
  return apiFetch<void>(`${BASE}/users/${userId}/resend-verification`, {
    method: "POST",
  });
}

export function deleteUser(userId: string) {
  return apiFetch<void>(`${BASE}/users/${userId}`, { method: "DELETE" });
}

// ---------- Nhật ký hệ thống ----------

export interface ActivityLog {
  id: string;
  actorId: string | null;
  actorName: string;
  actorRole: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  /** JSON thô mô tả thay đổi. Null khi hành động không có gì để so sánh. */
  changes: string | null;
  createdAt: string;
}

export interface ActivityLogPage {
  content: ActivityLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  first: boolean;
  last: boolean;
}

/** Nhãn tiếng Việt cho từng hành động, khớp với AdminActions bên BE. */
export const ACTION_LABEL: Record<string, string> = {
  USER_CREATE: "Tạo tài khoản",
  USER_UPDATE: "Sửa thông tin",
  USER_ROLE_CHANGE: "Đổi vai trò",
  USER_STATUS_CHANGE: "Đổi trạng thái",
  USER_DELETE: "Xoá tài khoản",
  USER_SESSIONS_REVOKE: "Buộc đăng xuất",
  USER_PASSWORD_RESET_SENT: "Gửi link đặt lại mật khẩu",
  USER_VERIFICATION_RESENT: "Gửi lại mail xác minh",
  PAYMENT_CONFIRM: "Xác nhận thanh toán",
  PAYMENT_REJECT: "Từ chối thanh toán",
  PAYOUT_APPROVE: "Duyệt lệnh rút",
  PAYOUT_REJECT: "Từ chối lệnh rút",
  PAYOUT_PAID: "Đánh dấu đã chi",
  REPORT_HANDLE: "Xử lý báo cáo",
  PRODUCT_CREATE: "Thêm sản phẩm",
  PRODUCT_UPDATE: "Sửa sản phẩm",
  PRODUCT_SET_ACTIVE: "Bật/tắt sản phẩm",
};

export function getActivityLogs(
  query: { action?: string; page?: number; size?: number } = {},
) {
  const params = new URLSearchParams();
  if (query.action) params.set("action", query.action);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.size !== undefined) params.set("size", String(query.size));
  const qs = params.toString();
  return apiFetch<ActivityLogPage>(
    `${BASE}/activity-logs${qs ? `?${qs}` : ""}`,
  );
}

// ============================================================
// Thống kê tổng quan — GET /api/v1/admin/stats
// Khớp AdminStatsResponse ở BE. Toàn số đếm, không có dữ liệu cá nhân.
// ============================================================

export interface AdminStats {
  users: {
    total: number;
    byRole: Record<AccountRole, number>;
    newLast7Days: number;
  };
  readers: {
    pendingApplications: number;
    activeProfiles: number;
  };
  bookings: {
    total: number;
    byStatus: Record<string, number>;
  };
  moderation: {
    pendingReports: number;
  };
  shop: {
    activeProducts: number;
    clicksLast30Days: number;
    clicksTotal: number;
  };
  /** Token tiêu thụ của Tarot AI (ai_usage_logs). Có thể thiếu nếu BE cũ. */
  ai?: {
    totalCalls: number;
    callsLast30Days: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    tokensLast30Days: number;
    estimatedCostUsd: number;
    tokensByModel: Record<string, number>;
  };
  /**
   * Tiền vào, tiền ra và phần còn lại của nền tảng. Optional vì BE cũ chưa trả.
   *
   * Lưu ý `netProfit` KHÔNG phải doanh thu gộp: phần lớn tiền khách trả là của
   * Reader, nền tảng chỉ giữ `platformFeePercent`%, rồi trừ tiếp chi phí AI.
   */
  revenue?: {
    grossRevenue: number;
    grossRevenueLast30Days: number;
    platformFeePercent: number;
    platformFee: number;
    readerShare: number;
    paidOut: number;
    pendingPayout: number;
    aiCostVnd: number;
    netProfit: number;
    successfulPayments: number;
    pendingPayments: number;
    revenueByMonth: Record<string, number>;
  };
}

export function getAdminStats() {
  return apiFetch<AdminStats>(`${BASE}/stats`);
}
