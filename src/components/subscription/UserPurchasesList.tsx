import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { subscriptionApi } from "@/api/subscription";
import { Clock, Zap, CheckCircle2, History, AlertCircle } from "lucide-react";

export const subscriptionQueryKeys = {
  all: ["subscriptions"] as const,
  userPurchases: (userId: string) => [...subscriptionQueryKeys.all, "purchases", userId] as const,
};

interface UserPurchasesListProps {
  userId?: string;
  showExpired?: boolean;
  maxItems?: number;
  className?: string;
  onExplorePlans?: () => void;
}

export function UserPurchasesList({
  userId,
  showExpired = false,
  maxItems,
  className = "",
  onExplorePlans,
}: UserPurchasesListProps) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data: purchases, isLoading, isError, error } = useQuery({
    queryKey: subscriptionQueryKeys.userPurchases(targetUserId || ""),
    queryFn: () => (targetUserId ? subscriptionApi.getUserActivePurchases(targetUserId) : Promise.resolve([])),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className={`glass rounded-2xl border-gold/15 p-5 animate-pulse ${className}`}>
        <div className="h-4 bg-white/10 rounded w-36 mb-3" />
        <div className="space-y-2">
          <div className="h-14 bg-white/5 rounded-xl" />
          <div className="h-14 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`glass rounded-2xl border-red-500/20 p-5 text-center ${className}`}>
        <AlertCircle className="mx-auto h-6 w-6 text-red-400 mb-2" />
        <p className="text-sm text-foreground">Không thể tải danh sách gói đã mua</p>
        <p className="text-xs text-muted-foreground mt-1">{(error as any)?.message || ""}</p>
      </div>
    );
  }

  const activePurchases = purchases?.filter((p) => p.status === "ACTIVE") || [];
  const displayPurchases = showExpired ? purchases || [] : activePurchases;

  if (displayPurchases.length === 0) {
    return (
      <div className={`glass rounded-2xl border-gold/15 p-6 text-center ${className}`}>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gold/10 text-gold mb-3">
          <Zap className="h-6 w-6" />
        </div>
        <h4 className="font-display text-base font-semibold text-foreground">
          Chưa có gói đăng ký trả phí
        </h4>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          Tài khoản của bạn hiện đang áp dụng gói FREE mặc định với 3 lượt hỏi AI mỗi ngày.
        </p>
        {onExplorePlans && (
          <button
            type="button"
            onClick={onExplorePlans}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold/15 px-4 py-2 text-xs font-medium text-gold hover:bg-gold/25 transition"
          >
            Khám phá các gói AI
          </button>
        )}
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
    <div className={`glass rounded-2xl border border-gold/20 p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gold" />
          <h3 className="font-display text-base font-semibold text-foreground">
            Gói dịch vụ đã đăng ký
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {activePurchases.length} gói đang hoạt động
        </span>
      </div>

      <div className="space-y-2.5">
        {sorted.map((purchase) => {
          const daysLeft = getRemainingDays(purchase.endAt);
          const isExpired = daysLeft === 0;

          return (
            <div
              key={purchase.id}
              className={`flex items-center justify-between rounded-xl border p-3.5 transition ${
                isExpired
                  ? "border-white/5 bg-white/[0.02] opacity-60"
                  : "border-gold/20 bg-gold/[0.03] hover:border-gold/40"
              }`}
            >
              <div className="flex-1 mr-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {purchase.planNameSnapshot}
                  </h4>
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
                    {purchase.purchaseType}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-gold">
                    <Zap className="h-3 w-3" />
                    <strong>{purchase.dailyQuotaSnapshot}</strong> lượt / ngày
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {isExpired ? (
                      <span className="text-red-400">Đã hết hạn</span>
                    ) : (
                      <span>Còn {daysLeft} ngày (hết hạn: {new Date(purchase.endAt).toLocaleDateString("vi-VN")})</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                {isExpired ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] text-red-400">
                    Đã hết hạn
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Đang dùng
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
