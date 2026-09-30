import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { subscriptionApi } from "@/api/subscription";

export const subscriptionQueryKeys = {
  all: ["subscription"] as const,
  activePlans: () => [...subscriptionQueryKeys.all, "activePlans"] as const,
  quota: (userId: string) => [...subscriptionQueryKeys.all, "quota", userId] as const,
  userPurchases: (userId: string) => [...subscriptionQueryKeys.all, "purchases", userId] as const,
  aiUsage: (userId: string, date?: string) => [...subscriptionQueryKeys.all, "usage", userId, date] as const,
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

export function useAIQuota(userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data: usageData, ...rest } = useQuery({
    queryKey: subscriptionQueryKeys.aiUsage(userId, today),
    queryFn: () => userId ? subscriptionApi.getAIUsage(userId, today) : Promise.resolve([]),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
  });

  const { data: userPurchases } = useQuery({
    queryKey: subscriptionQueryKeys.userPurchases(userId),
    queryFn: () => subscriptionApi.getUserActivePurchases(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const totalQuota = userPurchases?.length
    ? Math.max(...userPurchases.map(p => p.dailyQuotaSnapshot))
    : 3;

  const usedCount = usageData?.[0]?.countUsed || 0;

  return {
    totalQuota,
    usedCount,
    remainingCount: Math.max(0, totalQuota - usedCount),
    canUseAI: usedCount < totalQuota,
    refetchUsage: rest.refetch,
    ...rest,
  };
}

export function useSubscription() {
  const { user } = useAuth();
  return useAIQuota(user?.id || "");
}