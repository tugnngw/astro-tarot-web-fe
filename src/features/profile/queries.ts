// ============================================================
// PROFILE — React Query hooks
// Cùng cách làm với features/shop/queries.ts: khoá cache gom một chỗ, mutation
// ghi thẳng kết quả vào cache thay vì fetch lại.
// ============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as profileApi from "@/api/profile";
import type { Profile } from "@/api/profile";

export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
};

export function useProfile(enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: profileApi.getProfile,
    enabled,
  });
}

/**
 * Mọi thao tác sửa hồ sơ đều trả về hồ sơ đầy đủ sau khi cập nhật, nên ghi
 * thẳng vào cache — đỡ một vòng request và giao diện không nháy.
 */
function useProfileMutation<TArgs>(fn: (args: TArgs) => Promise<Profile>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.me(), profile),
  });
}

export function useUpdateProfile() {
  return useProfileMutation(profileApi.updateProfile);
}

export function useUploadAvatar() {
  return useProfileMutation(profileApi.uploadAvatar);
}

export function useRemoveAvatar() {
  return useProfileMutation(() => profileApi.removeAvatar());
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => profileApi.changePassword(currentPassword, newPassword),
  });
}
