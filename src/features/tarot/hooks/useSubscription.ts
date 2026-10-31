import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { subscriptionApi } from "@/api/subscription";

export const subscriptionQueryKeys = {
  all: ["subscription"] as const,
  activePlans: () => [...subscriptionQueryKeys.all, "activePlans"] as const,
  quota: (userId: string) =>
    [...subscriptionQueryKeys.all, "quota", userId] as const,
  userPurchases: (userId: string) =>
    [...subscriptionQueryKeys.all, "purchases", userId] as const,
  aiUsage: (userId: string, date?: string) =>
    [...subscriptionQueryKeys.all, "usage", userId, date] as const,
};

export function useActivePlans() {
  return useQuery({
    queryKey: subscriptionQueryKeys.activePlans(),
    queryFn: () => subscriptionApi.getActivePlans(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserPurchases(userId: string) {
  return useQuery({
    queryKey: subscriptionQueryKeys.userPurchases(userId),
    queryFn: () => subscriptionApi.getUserActivePurchases(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hạn mức AI hôm nay. Hỏi máy chủ, KHÔNG tự tính.
 *
 * ## Vì sao không tính ở đây nữa
 *
 * Bản trước dựng lại con số: lấy danh sách gói rồi `max(dailyQuotaSnapshot)`,
 * không có gói thì mặc định 3. Đó là bản sao của luật nằm trong
 * `getQuotaForToday` bên backend, và hai bản lệch nhau ngay khi mini game bắt
 * đầu thưởng lượt — máy chủ CỘNG phần thưởng vào, chỗ này không biết gì về
 * nó.
 *
 * Người dùng báo ngày 31/10/2026: chơi game được thưởng 3 lượt, huy hiệu vẫn
 * ghi "AI: 3/3 lượt". Lượt thưởng vẫn DÙNG được — chỉ là không chỗ nào nói
 * cho họ biết là họ có.
 *
 * Con số 3 kia còn là nguồn sự thật thứ hai cho gói miễn phí: đổi
 * `FREE_DAILY_QUOTA` ở backend thì chỗ này nói dối mà không ai biết.
 */
export function useAIQuota(userId: string) {
  const { data, ...rest } = useQuery({
    queryKey: subscriptionQueryKeys.quota(userId),
    queryFn: () => subscriptionApi.getQuota(userId),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  return {
    totalQuota: data?.tongHanMuc ?? 0,
    usedCount: data?.daDung ?? 0,
    remainingCount: data?.conLai ?? 0,
    tuGoi: data?.tuGoi ?? 0,
    tuGame: data?.tuGame ?? 0,
    // Chưa tải xong thì KHÔNG cho bấm. Đoán `true` ở đây là người dùng bấm
    // trải bài rồi nhận lỗi từ máy chủ, còn đoán theo con số rỗng thì ra
    // "0/0 lượt" nhấp nháy một cái trước khi số thật về.
    canUseAI: data ? data.conLai > 0 : false,
    dangTai: rest.isLoading,
    refetchUsage: rest.refetch,
    ...rest,
  };
}

export function useSubscription() {
  const { user } = useAuth();
  return useAIQuota(user?.id || "");
}
