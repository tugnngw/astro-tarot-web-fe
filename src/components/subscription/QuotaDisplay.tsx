import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { subscriptionApi } from "@/api/subscription";
import { useAIQuota } from "@/features/tarot/hooks/useSubscription";
import { Zap, Clock, ShieldCheck, Sparkles } from "lucide-react";


interface QuotaDisplayProps {
  className?: string;
  variant?: "compact" | "detailed";
}

export function QuotaDisplay({
  className = "",
  variant = "detailed",
}: QuotaDisplayProps) {
  const { user } = useAuth();

  // Hạn mức lấy THẲNG từ máy chủ. Chỗ này từng tự tính lại bằng max() trên
  // danh sách gói — xem chú thích ở `useAIQuota` về chuyện bản sao ấy không
  // biết gì về lượt thưởng từ mini game.
  const {
    totalQuota,
    usedCount,
    remainingCount: remaining,
    tuGoi,
    tuGame,
    isLoading,
  } = useAIQuota(user?.id ?? "");
  const { data: userPurchases } = useQuery({
    queryKey: ["user-purchases", user?.id],
    queryFn: () =>
      user
        ? subscriptionApi.getUserActivePurchases(user.id)
        : Promise.resolve([]),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div
        className={`glass rounded-2xl border-gold/20 p-5 animate-pulse ${className}`}
      >
        <div className="h-4 bg-white/10 rounded w-32" />
        <div className="h-3 bg-white/5 rounded w-48 mt-2" />
      </div>
    );
  }

  // Chia cho 0 khi hạn mức chưa về hoặc bằng 0 thì ra NaN, và thanh tiến độ
  // biến mất không báo gì.
  const percentage =
    totalQuota > 0 ? Math.min(100, (usedCount / totalQuota) * 100) : 0;

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs backdrop-blur-sm ${className}`}
        title={
          tuGame > 0
            ? `Đã dùng ${usedCount}/${totalQuota} lượt hỏi AI hôm nay (${tuGoi} từ gói + ${tuGame} thưởng từ Game)`
            : `Đã dùng ${usedCount}/${totalQuota} lượt hỏi AI hôm nay`
        }
      >
        <Zap className="h-3.5 w-3.5 text-gold animate-pulse" />
        <span className="font-medium text-foreground">
          AI: <strong className="text-gold">{remaining}</strong>/{totalQuota}{" "}
          lượt
        </span>
      </div>
    );
  }

  return (
    <div className={`glass rounded-2xl border border-gold/20 p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/10 text-gold">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              Hạn mức AI hôm nay
            </h3>
            <p className="text-2xs text-muted-foreground">
              Làm mới lúc 00:00 (Asia/Ho_Chi_Minh) hàng ngày
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-display text-lg font-bold">
            <span className="text-gold">{remaining}</span>
            <span className="text-muted-foreground text-xs font-normal">
              {" "}
              / {totalQuota} lượt còn lại
            </span>
          </div>
          <span className="text-3xs text-muted-foreground">
            Đã sử dụng {usedCount} lượt
          </span>
          {/* Nói rõ phần thưởng từ game. Gộp vào tổng thì người vừa chơi xong
              một ván không thấy công của mình ở đâu — đúng cái đã khiến họ
              tưởng phần thưởng không chạy. */}
          {tuGame > 0 && (
            <div className="text-3xs text-gold-soft">
              {tuGoi} từ gói + {tuGame} thưởng từ Game
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percentage >= 90
              ? "bg-gradient-to-r from-destructive-soft to-warning"
              : percentage >= 60
                ? "bg-gradient-to-r from-warning to-gold"
                : "bg-gradient-to-r from-success to-gold"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-2xs text-muted-foreground">
        <span>Đã dùng {percentage.toFixed(0)}%</span>
        {remaining === 0 ? (
          <span className="font-medium text-destructive-soft">
            Hết lượt hôm nay — nâng cấp gói để tiếp tục
          </span>
        ) : remaining <= 2 ? (
          <span className="font-medium text-warning">
            Sắp hết hạn mức ({remaining} lượt cuối)
          </span>
        ) : (
          <span className="text-success font-medium">
            Sẵn sàng trải bài ({remaining} lượt)
          </span>
        )}
      </div>

      {/* Active packages list */}
      {userPurchases && userPurchases.length > 0 ? (
        <div className="mt-4 border-t border-gold/20 pt-3">
          <span className="text-2xs uppercase tracking-wider text-muted-foreground">
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
                  <span className="text-2xs text-muted-foreground">
                    ({purchase.dailyQuotaSnapshot} lượt/ngày • còn {daysLeft}{" "}
                    ngày)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground border-t border-white/5 pt-2.5">
          <ShieldCheck className="h-3.5 w-3.5 text-gold/80" />
          {/* Con số lấy từ máy chủ, không viết cứng: đổi FREE_DAILY_QUOTA ở
              backend mà chỗ này viết 3 thì màn hình nói dối, và không có gì
              báo. */}
          <span>Bạn đang dùng gói FREE mặc định ({tuGoi} lượt/ngày).</span>
        </div>
      )}
    </div>
  );
}
