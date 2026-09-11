// ============================================================
// TIỀN — React Query hooks
// ============================================================

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as moneyApi from "@/api/money";
import { notificationKeys, bookingKeys } from "@/features/booking/queries";

export const moneyKeys = {
  all: ["money"] as const,
  escrow: () => [...moneyKeys.all, "escrow"] as const,
  myPayouts: (page: number) => [...moneyKeys.all, "my-payouts", page] as const,
  payments: (query: object) => [...moneyKeys.all, "payments", query] as const,
  payouts: (query: object) => [...moneyKeys.all, "payouts", query] as const,
  reports: (query: object) => [...moneyKeys.all, "reports", query] as const,
};

/**
 * Mọi thao tác tiền đều đụng tới ít nhất hai màn hình khác: xác nhận thanh
 * toán đổi cả ký quỹ lẫn trạng thái lịch hẹn, duyệt lệnh rút đổi cả số dư.
 * Nên invalidate rộng thay vì cố đoán đúng một khoá — đoán sai thì người dùng
 * nhìn số cũ và tưởng thao tác không ăn.
 */
function useMoneyMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moneyKeys.all });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// ---------- Khách trả tiền ----------

export function useCreatePaymentIntent() {
  return useMoneyMutation(moneyApi.createPaymentIntent);
}

// ---------- Ký quỹ của Reader ----------

export function useMyEscrow(enabled = true) {
  return useQuery({
    queryKey: moneyKeys.escrow(),
    queryFn: moneyApi.getMyEscrow,
    enabled,
  });
}

export function useMyPayouts(page = 0, enabled = true) {
  return useQuery({
    queryKey: moneyKeys.myPayouts(page),
    queryFn: () => moneyApi.getMyPayouts(page),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useCreatePayout() {
  return useMoneyMutation(moneyApi.createPayout);
}

// ---------- Đối soát và duyệt chi (quản trị viên) ----------

export function usePayments(
  query: { status?: string; page?: number; size?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: moneyKeys.payments(query),
    queryFn: () => moneyApi.getPayments(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useConfirmPayment() {
  return useMoneyMutation(moneyApi.confirmPayment);
}

export function useRejectPayment() {
  return useMoneyMutation(({ id, reason }: { id: string; reason?: string }) =>
    moneyApi.rejectPayment(id, reason),
  );
}

export function usePayouts(
  query: { status?: string; page?: number; size?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: moneyKeys.payouts(query),
    queryFn: () => moneyApi.getPayouts(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useApprovePayout() {
  return useMoneyMutation(moneyApi.approvePayout);
}

export function useRejectPayout() {
  return useMoneyMutation(({ id, reason }: { id: string; reason?: string }) =>
    moneyApi.rejectPayout(id, reason),
  );
}

export function useMarkPayoutPaid() {
  return useMoneyMutation(moneyApi.markPayoutPaid);
}

// ---------- Báo cáo vi phạm ----------

export function useReports(
  query: { status?: string; page?: number; size?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: moneyKeys.reports(query),
    queryFn: () => moneyApi.getReports(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useCreateReport() {
  return useMoneyMutation(moneyApi.createReport);
}

export function useHandleReport() {
  return useMoneyMutation(
    ({
      id,
      status,
      note,
      penaltyAmount,
    }: {
      id: string;
      status: moneyApi.ReportStatus;
      note?: string;
      /** Chỉ có tác dụng khi status là RESOLVED; BE cũng chặn lần nữa. */
      penaltyAmount?: number;
    }) => moneyApi.handleReport(id, status, note, penaltyAmount),
  );
}
