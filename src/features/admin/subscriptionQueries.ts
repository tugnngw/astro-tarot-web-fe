import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { subscriptionApi, type SubscriptionPlan } from "@/api/subscription";

export const subscriptionAdminKeys = {
  all: ["admin", "subscriptions"] as const,
  plans: () => [...subscriptionAdminKeys.all, "plans"] as const,
};

export function useAllPlans() {
  return useQuery({
    queryKey: subscriptionAdminKeys.plans(),
    queryFn: () => subscriptionApi.getAllPlans(),
    staleTime: 30_000,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      planType: "MONTHLY" | "DAY_PASS" | "FREE";
      name: string;
      dailyQuota: number;
      price: number;
      durationDays: number;
      description?: string;
    }) => subscriptionApi.createPlan(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: subscriptionAdminKeys.all,
      });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      data,
    }: {
      planId: string;
      data: {
        dailyQuota?: number;
        price?: number;
        isActive?: boolean;
        description?: string;
      };
    }) => subscriptionApi.updatePlan(planId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: subscriptionAdminKeys.all,
      });
    },
  });
}
