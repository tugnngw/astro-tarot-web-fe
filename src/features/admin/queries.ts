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
 * Sau khi đổi vai trò hoặc trạng thái thì invalidate cả nhánh users chứ không
 * ghi đè một hàng: cờ `editable` của những hàng KHÁC cũng có thể đổi theo (hạ
 * một quản lý xuống nhân viên là hàng đó bỗng nằm trong tầm với của quản lý
 * khác), mà chỉ BE mới tính đúng được điều đó.
 */
function useUserMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.usersAll() });
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
