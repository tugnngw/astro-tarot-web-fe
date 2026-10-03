import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { subscriptionApi } from "@/api/subscription";
import { Zap, Clock, ShieldCheck, Sparkles } from "lucide-react";

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
    queryFn: () => (user ? subscriptionApi.getUserActivePurchases(user.id) : Promise.resolve([])),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={`glass rounded-2xl border-gold/15 p-5 animate-pulse ${className}`}>
        <div className="h-4 bg-white/10 rounded w-32" />
        <div className="h-3 bg-white/5 rounded w-48 mt-2" />
      </div>
    );
  }

  // Total quota from all active packages (max() logic, fallback to 3)
  const getTotalDailyQuota = () => {
    if (!userPurchases?.length) {
      return 3;
    }
    return Math.max(...userPurchases.map((p) => p.dailyQuotaSnapshot));
  };

  const totalQuota = getTotalDailyQuota();
  const usedCount = usageData?.[0]?.countUsed || 0;
  const remaining = Math.max(0, totalQuota - usedCount);
  const percentage = Math.min(100, (usedCount / totalQuota) * 100);

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs backdrop-blur-sm ${className}`}
        title={`Đã dùng ${usedCount}/${totalQuota} lượt hỏi AI hôm nay`}
      >
        <Zap className="h-3.5 w-3.5 text-gold animate-pulse" />
        <span className="font-medium text-foreground">
          AI: <strong className="text-gold">{remaining}</strong>/{totalQuota} lượt
        </span>
      </div>
    );
  }

  return (
    <div className={`glass rounded-2xl border border-gold/20 p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              Hạn mức AI hôm nay
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Làm mới lúc 00:00 (Asia/Ho_Chi_Minh) hàng ngày
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-display text-lg font-bold">
            <span className="text-gold">{remaining}</span>
            <span className="text-muted-foreground text-xs font-normal"> / {totalQuota} lượt còn lại</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            Đã sử dụng {usedCount} lượt
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percentage >= 90
              ? "bg-gradient-to-r from-red-500 to-amber-500"
              : percentage >= 60
                ? "bg-gradient-to-r from-amber-400 to-gold"
                : "bg-gradient-to-r from-emerald-400 to-gold"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Đã dùng {percentage.toFixed(0)}%</span>
        {remaining === 0 ? (
          <span className="font-medium text-red-400">
            Hết lượt hôm nay — nâng cấp gói để tiếp tục
          </span>
        ) : remaining <= 2 ? (
          <span className="font-medium text-amber-300">
            Sắp hết hạn mức ({remaining} lượt cuối)
          </span>
        ) : (
          <span className="text-emerald-400 font-medium">
            Sẵn sàng trải bài ({remaining} lượt)
          </span>
        )}
      </div>

      {/* Active packages list */}
      {userPurchases && userPurchases.length > 0 ? (
        <div className="mt-4 border-t border-gold/15 pt-3">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Gói dịch vụ đang kích hoạt
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {userPurchases.map((purchase) => {
              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (new Date(purchase.endAt).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
              );
              return (
                <div
                  key={purchase.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs"
                >
                  <Sparkles className="h-3 w-3 text-gold" />
                  <span className="font-medium text-gold">
                    {purchase.planNameSnapshot}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ({purchase.dailyQuotaSnapshot} lượt/ngày • còn {daysLeft} ngày)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground border-t border-white/5 pt-2.5">
          <ShieldCheck className="h-3.5 w-3.5 text-gold/80" />
          <span>Bạn đang dùng gói FREE mặc định (3 lượt/ngày).</span>
        </div>
      )}
    </div>
  );
}
