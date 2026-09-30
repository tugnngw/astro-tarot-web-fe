import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { subscriptionApi } from "@/api/subscription";

export function useUserAIUsage(userId: string | null, date?: string) {
  return useQuery({
    queryKey: ["ai-usage", userId, date],
    queryFn: () => {
      if (!userId) return [];
      return subscriptionApi.getAIUsage(userId, date || new Date().toISOString().split("T")[0]);
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
  });
}

interface QuotaDisplayProps {
  className?: string;
  variant?: "compact" | "detailed";
}

export function QuotaDisplay({
  className = "",
  variant = "detailed",
}: QuotaDisplayProps) {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const { data: usageData, isLoading } = useUserAIUsage(user?.id ?? null, today);
  const { data: userPurchases } = useQuery({
    queryKey: ["user-purchases", user?.id],
    queryFn: () => user ? subscriptionApi.getUserActivePurchases(user.id) : Promise.resolve([]),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-2 bg-gray-200 rounded w-32 mt-1"></div>
      </div>
    );
  }

  // Total quota from all active packages (max() logic)
  const getTotalDailyQuota = () => {
    if (!userPurchases?.length) {
      return 3; // Default FREE tier quota
    }
    return Math.max(...userPurchases.map(p => p.dailyQuotaSnapshot));
  };

  const totalQuota = getTotalDailyQuota();
  const usedCount = usageData?.[0]?.countUsed || 0;
  const percentage = Math.min(100, (usedCount / totalQuota) * 100);

  if (variant === "compact") {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="relative w-12 h-12 mr-2">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" stroke="#e5e7eb" strokeWidth="2" fill="none" />
            <circle
              cx="18"
              cy="18"
              r="16"
              stroke={percentage > 80 ? "#ef4444" : percentage > 60 ? "#f59e0b" : "#10b981"}
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${percentage * 0.628} 62.8`}
              strokeLinecap="round"
              transform="rotate(-90) translate(-18)"
            />
            <text x="18" y="19" textAnchor="middle" fontSize="12" fontWeight="500" fill="#374151">
              {`${usedCount}/${totalQuota}`}
            </text>
          </svg>
        </div>
        <span className="text-sm text-gray-600">lượt AI hôm nay</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg bg-gray-50 border border-gray-200 ${className}`}>
      <h3 className="text-base font-medium mb-3">Hạn mức AI hôm nay</h3>

      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 mr-4">
          <div className="flex justify-between text-sm font-medium mb-1">
            <span>Hạn mức</span>
            <span>{totalQuota} lượt AI</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                percentage > 80
                  ? "bg-red-500"
                  : percentage > 60
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">{usedCount}</div>
          <div className="text-xs text-gray-500">đã sử dụng</div>
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{new Date().toLocaleDateString("vi-VN")}</span>
        {percentage > 80 ? (
          <span className="text-red-600 font-medium">
            Hạn mức sắp hết! ({totalQuota - usedCount} lượt còn lại)
          </span>
        ) : (
          <span className="text-green-600 font-medium">Còn {totalQuota - usedCount} lượt AI</span>
        )}
      </div>

      {/* Active packages */}
      {userPurchases && userPurchases.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Gói dịch vụ hoạt động</h4>
          <div className="flex flex-wrap gap-1.5">
            {userPurchases.map(purchase => (
              <div key={purchase.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full border border-gray-300">
                <span className="text-xs text-gray-700">{purchase.planNameSnapshot}</span>
                <span className="text-xs text-gray-400">
                  ({Math.max(0, Math.ceil((new Date(purchase.endAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} ngày)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}