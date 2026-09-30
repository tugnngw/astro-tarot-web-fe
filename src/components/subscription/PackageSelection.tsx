import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "@/api/subscription";
import type { SubscriptionPlan } from "@/api/subscription";

export const subscriptionQueryKeys = {
  all: ["subscriptions"] as const,
  activePlans: () => [...subscriptionQueryKeys.all, "activePlans"] as const,
};

export function useActivePlans() {
  return useQuery({
    queryKey: subscriptionQueryKeys.activePlans(),
    queryFn: () => subscriptionApi.getActivePlans(),
    staleTime: 5 * 60 * 1000,
  });
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  onSelect: (plan: SubscriptionPlan) => void;
}

export function PlanCard({ plan, onSelect }: PlanCardProps) {
  const isFree = plan.planType === "FREE";

  return (
    <div
      className="group border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onSelect(plan)}
    >
      <h3 className="text-lg font-medium mb-2">{plan.name}</h3>

      <p className="text-sm text-gray-600 mb-3">
        {plan.description || ""}
      </p>

      <div className="grid gap-2">
        <div className="flex items-center text-sm text-gray-500">
          <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
          {plan.dailyQuota} lượt AI/ngày
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
          {plan.durationDays} ngày
        </div>

        {isFree && (
          <div className="flex items-center text-sm text-green-600">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
            Miễn phí (không hết hạn)
          </div>
        )}

        {!isFree && plan.price > 0 && (
          <div className="flex items-center text-sm text-gray-700">
            <span className="w-3 h-3 bg-orange-500 rounded-full mr-1"></span>
            {plan.price} ₫
          </div>
        )}
      </div>
    </div>
  );
}