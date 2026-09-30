import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { subscriptionApi } from "@/api/subscription";

export const subscriptionQueryKeys = {
  all: ["subscriptions"] as const,
  userPurchases: (userId: string) => [...subscriptionQueryKeys.all, "purchases", userId] as const,
};

interface UserPurchasesListProps {
  userId?: string;
  showExpired?: boolean;
  maxItems?: number;
  className?: string;
}

export function UserPurchasesList({
  userId,
  showExpired = false,
  maxItems,
  className = "",
}: UserPurchasesListProps) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data: purchases, isLoading, isError, error } = useQuery({
    queryKey: subscriptionQueryKeys.userPurchases(targetUserId || ""),
    queryFn: () => targetUserId ? subscriptionApi.getUserActivePurchases(targetUserId) : Promise.resolve([]),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <h3 className="text-base font-medium mb-3">Gói dịch vụ của bạn</h3>
        <div className="animate-pulse space-y-2">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <p className="text-sm">Không tải được danh sách gói</p>
        <p className="text-xs text-gray-400 mt-1">{(error as any)?.message || ""}</p>
      </div>
    );
  }

  const displayPurchases = purchases?.filter(p => p.status === 'ACTIVE') || [];

  if (displayPurchases.length === 0) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <h3 className="text-base font-medium mb-2">Chưa có gói AI</h3>
        <p className="text-sm text-gray-500">Bạn đang dùng gói FREE mặc định (3 lượt AI/ngày)</p>
      </div>
    );
  }

  const getRemainingDays = (endAt: string) => {
    const end = new Date(endAt).getTime();
    const now = new Date().getTime();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const sorted = [...displayPurchases]
    .sort((a, b) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime())
    .slice(0, maxItems);

  return (
    <div className={`p-4 rounded-lg bg-white border border-gray-200 shadow-sm ${className}`}>
      <h3 className="text-base font-medium mb-3">Gói dịch vụ hoạt động</h3>

      <div className="space-y-2">
        {sorted.map(purchase => (
          <div key={purchase.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex-1 mr-3">
              <h4 className="text-sm font-medium text-gray-900">
                {purchase.planNameSnapshot}
              </h4>

              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">
                  {purchase.dailyQuotaSnapshot} lượt/ngày
                </span>
                <span className="text-xs text-gray-400">
                  {getRemainingDays(purchase.endAt)} ngày còn lại
                </span>
              </div>

              {new Date(purchase.endAt).getTime() <= new Date().getTime() && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                  Hết hạn
                </span>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Hoạt động
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tổng hợp quota */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Tổng quota:</span>
          <span className="font-medium">
            {purchases?.length
              ? Math.max(...purchases.map(p => p.dailyQuotaSnapshot))
              : 3} lượt AI/ngày
          </span>
        </div>
      </div>
    </div>
  );
}