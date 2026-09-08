// ============================================================
// QUẢN TRỊ / QUẢN LÝ — React Query hooks
//
// Dùng chung cho cả trang /manager và /admin: hai trang khác nhau ở chỗ bày
// biện và ở phạm vi BE cho phép, chứ dữ liệu thì cùng một nguồn.
// ============================================================

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "@/api/admin";
import type { AccountStatus, UserQuery } from "@/api/admin";
import type { AccountRole } from "@/lib/roles";

export const adminKeys = {
  all: ["admin"] as const,
  users: (query: UserQuery) => [...adminKeys.all, "users", query] as const,
  usersAll: () => [...adminKeys.all, "users"] as const,
  applications: () => [...adminKeys.all, "reader-applications"] as const,
};

export function useManagedUsers(query: UserQuery, enabled = true) {
  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => adminApi.getUsers(query),
    enabled,
    // Giữ trang cũ trong lúc tải trang mới để bảng không nháy về skeleton mỗi
    // lần đổi bộ lọc.
    placeholderData: keepPreviousData,
  });
}

/**
 * Sau mọi thao tác ghi, invalidate cả nhánh admin chứ không ghi đè một hàng.
 *
 * Hai lý do: cờ `editable` của những hàng KHÁC cũng có thể đổi theo (hạ một
 * quản lý xuống nhân viên là hàng đó bỗng nằm trong tầm với của quản lý khác),
 * và thao tác nào cũng sinh một dòng nhật ký nên bảng nhật ký cũng đã cũ. Chỉ
 * BE mới tính đúng được cả hai.
 */
function useUserMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useUpdateUserRole() {
  return useUserMutation(({ userId, role }: { userId: string; role: AccountRole }) =>
    adminApi.updateUserRole(userId, role),
  );
}

export function useUpdateUserStatus() {
  return useUserMutation(
    ({ userId, status }: { userId: string; status: AccountStatus }) =>
      adminApi.updateUserStatus(userId, status),
  );
}

export function useReaderApplications(enabled = true) {
  return useQuery({
    queryKey: adminKeys.applications(),
    queryFn: adminApi.getReaderApplications,
    enabled,
  });
}

export function useReviewApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      action,
      rejectionReason,
    }: {
      applicationId: string;
      action: "APPROVED" | "REJECTED";
      rejectionReason?: string;
    }) => adminApi.reviewReaderApplication(applicationId, action, rejectionReason),
    onSuccess: () => {
      // Duyệt xong thì người đó thành STAFF, nên bảng tài khoản cũng đã cũ.
      void queryClient.invalidateQueries({ queryKey: adminKeys.applications() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.usersAll() });
    },
  });
}

// ---------- Chi tiết và thao tác trên một tài khoản ----------

export function useUserDetail(userId: string | null) {
  return useQuery({
    queryKey: [...adminKeys.all, "user", userId] as const,
    queryFn: () => adminApi.getUserDetail(userId!),
    enabled: Boolean(userId),
    retry: false,
  });
}

export function useCreateUser() {
  return useUserMutation((payload: adminApi.CreateUserPayload) => adminApi.createUser(payload));
}

export function useUpdateUserInfo() {
  return useUserMutation(
    ({ userId, payload }: { userId: string; payload: adminApi.UpdateUserInfoPayload }) =>
      adminApi.updateUserInfo(userId, payload),
  );
}

export function useUpdateRoleBulk() {
  return useUserMutation(({ userIds, role }: { userIds: string[]; role: AccountRole }) =>
    adminApi.updateRoleBulk(userIds, role),
  );
}

export function useRevokeSessions() {
  return useUserMutation((userId: string) => adminApi.revokeUserSessions(userId));
}

export function useSendPasswordReset() {
  return useUserMutation((userId: string) => adminApi.sendPasswordReset(userId));
}

export function useResendVerification() {
  return useUserMutation((userId: string) => adminApi.resendVerification(userId));
}

export function useDeleteUser() {
  return useUserMutation((userId: string) => adminApi.deleteUser(userId));
}

// ---------- Nhật ký hệ thống ----------

export function useActivityLogs(query: { action?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: [...adminKeys.all, "activity-logs", query] as const,
    queryFn: () => adminApi.getActivityLogs(query),
    placeholderData: keepPreviousData,
  });
}
