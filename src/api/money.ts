// ============================================================
// TIỀN — thanh toán, ký quỹ, rút tiền, báo cáo vi phạm
// Khớp với BE: /api/v1/bookings/{id}/payment, /me/escrow, /me/payouts,
//              /admin/payments, /admin/payouts, /reports, /admin/reports
// ============================================================

import { apiFetch } from "./client";

// ---------- Thanh toán ----------

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface PaymentInstruction {
  transactionId: string;
  bookingId: string;
  amount: number;
  /** Khách gõ đúng chuỗi này vào nội dung chuyển khoản. */
  referenceCode: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  transferContent: string;
  status: TransactionStatus;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string | null;
  payerName: string;
  payerEmail: string | null;
  readerName: string | null;
  amount: number;
  paymentMethod: string | null;
  referenceCode: string | null;
  status: TransactionStatus;
  bookingStartTime: string | null;
  createdAt: string;
}

export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  PENDING: "Chờ đối soát",
  SUCCESS: "Đã nhận tiền",
  FAILED: "Không đối soát được",
  CANCELLED: "Đã huỷ / hoàn",
};

export function createPaymentIntent(bookingId: string) {
  return apiFetch<PaymentInstruction>(`/api/v1/bookings/${bookingId}/payment`, {
    method: "POST",
  });
}

export function getPayments(query: { status?: string; page?: number; size?: number } = {}) {
  return apiFetch<Paged<PaymentTransaction>>(`/api/v1/admin/payments${qs(query)}`);
}

export function confirmPayment(id: string) {
  return apiFetch<PaymentTransaction>(`/api/v1/admin/payments/${id}/confirm`, { method: "PATCH" });
}

export function rejectPayment(id: string, reason?: string) {
  return apiFetch<PaymentTransaction>(`/api/v1/admin/payments/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason: reason ?? null }),
  });
}

// ---------- Ký quỹ và rút tiền ----------

export type PayoutStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export interface EscrowSummary {
  /** Đã nhả, rút được ngay. */
  balance: number;
  /** Khách đã trả nhưng buổi xem chưa xong. Thấy được, chưa rút được. */
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  minimumPayout: number;
}

export interface Payout {
  id: string;
  readerName: string;
  readerEmail: string | null;
  amount: number;
  bankName: string | null;
  /** Chỉ bốn số cuối — màn quản trị hay mở trên máy dùng chung. */
  bankAccountMasked: string | null;
  accountHolder: string | null;
  status: PayoutStatus;
  rejectReason: string | null;
  requestedAt: string | null;
  processedAt: string | null;
}

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt, chờ chuyển",
  REJECTED: "Bị từ chối",
  PAID: "Đã chuyển tiền",
};

export function getMyEscrow() {
  return apiFetch<EscrowSummary>("/api/v1/me/escrow");
}

export function createPayout(payload: {
  amount: number;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
}) {
  return apiFetch<Payout>("/api/v1/me/payouts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyPayouts(page = 0, size = 20) {
  return apiFetch<Paged<Payout>>(`/api/v1/me/payouts?page=${page}&size=${size}`);
}

export function getPayouts(query: { status?: string; page?: number; size?: number } = {}) {
  return apiFetch<Paged<Payout>>(`/api/v1/admin/payouts${qs(query)}`);
}

export function approvePayout(id: string) {
  return apiFetch<Payout>(`/api/v1/admin/payouts/${id}/approve`, { method: "PATCH" });
}

export function rejectPayout(id: string, reason?: string) {
  return apiFetch<Payout>(`/api/v1/admin/payouts/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason: reason ?? null }),
  });
}

export function markPayoutPaid(id: string) {
  return apiFetch<Payout>(`/api/v1/admin/payouts/${id}/paid`, { method: "PATCH" });
}

// ---------- Báo cáo vi phạm ----------

export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "REJECTED";

export interface Report {
  id: string;
  /** Chỉ người xử lý thấy. Không bao giờ hiện cho người bị báo cáo. */
  reporterName: string;
  reportedUserId: string;
  reportedName: string;
  reportedRole: string;
  bookingId: string | null;
  reportType: string;
  description: string | null;
  status: ReportStatus;
  handledByName: string | null;
  handledAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
}

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: "Chờ xử lý",
  REVIEWED: "Đang xem xét",
  RESOLVED: "Đã xử lý",
  REJECTED: "Không vi phạm",
};

/** Loại vi phạm khách chọn được. Giữ ngắn — danh sách dài thì không ai đọc hết. */
export const REPORT_TYPES: Array<{ value: string; label: string }> = [
  { value: "NO_SHOW", label: "Không có mặt đúng giờ hẹn" },
  { value: "RUDE", label: "Thái độ không đúng mực" },
  { value: "MISLEADING", label: "Nội dung sai lệch, gây hoang mang" },
  { value: "SCAM", label: "Đòi tiền ngoài hệ thống" },
  { value: "OTHER", label: "Lý do khác" },
];

export function createReport(payload: {
  reportedUserId: string;
  reportType: string;
  description?: string;
  bookingId?: string;
}) {
  return apiFetch<Report>("/api/v1/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getReports(query: { status?: string; page?: number; size?: number } = {}) {
  return apiFetch<Paged<Report>>(`/api/v1/admin/reports${qs(query)}`);
}

export function handleReport(id: string, status: ReportStatus, resolutionNote?: string) {
  return apiFetch<Report>(`/api/v1/admin/reports/${id}/handle`, {
    method: "PATCH",
    body: JSON.stringify({ status, resolutionNote: resolutionNote ?? null }),
  });
}

// ---------- Dùng chung ----------

export interface Paged<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  first: boolean;
  last: boolean;
}

function qs(query: { status?: string; page?: number; size?: number }) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.size !== undefined) params.set("size", String(query.size));
  const s = params.toString();
  return s ? `?${s}` : "";
}
