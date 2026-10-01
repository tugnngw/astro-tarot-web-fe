import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { subscriptionApi } from "@/api/subscription";
import type { SubscriptionPlan, AIPlanResponse } from "@/api/subscription";
import { useActivePlans, PlanCard } from "./PackageSelection";
import { QuotaDisplay } from "./QuotaDisplay";
import { UserPurchasesList } from "./UserPurchasesList";
import { PurchaseModal } from "./PurchaseModal";
import {
  Sparkles,
  Zap,
  HelpCircle,
  Flame,
  Shield,
  Layers,
} from "lucide-react";

export function SubscriptionManagement() {
  const { user, openAuth } = useAuth();
  const { data: activePlans, isLoading: isPlansLoading } = useActivePlans();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [planFilter, setPlanFilter] = useState<"ALL" | "MONTHLY" | "DAY_PASS">("ALL");

  // Fetch active purchases to identify current plans
  const { data: activePurchases } = useQuery({
    queryKey: ["user-purchases", user?.id],
    queryFn: () => (user ? subscriptionApi.getUserActivePurchases(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const activePlanIds = useMemo(() => {
    return new Set(activePurchases?.map((p) => p.planId) || []);
  }, [activePurchases]);

  const filteredPlans = useMemo(() => {
    if (!activePlans) return [];
    if (planFilter === "ALL") return activePlans;
    return activePlans.filter((p) => p.planType === planFilter);
  }, [activePlans, planFilter]);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (!user) {
      openAuth("login");
      return;
    }
    setSelectedPlan(plan);
    setPurchaseModalOpen(true);
  };

  const handlePurchaseSuccess = (_data: AIPlanResponse) => {
    setSelectedPlan(null);
  };

  return (
    <div className="space-y-8">
      {/* Current Quota Header Banner */}
      {user && (
        <section>
          <QuotaDisplay variant="detailed" />
        </section>
      )}

      {/* Package Selection Section */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Nâng tầm trải nghiệm chiêm tinh</span>
            </div>
            <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Chọn gói cước AI Tarot
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Mở rộng số lượt hỏi bài hàng ngày, kết hợp phân tích bản đồ sao chiêm tinh và bài Tarot sâu sắc.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPlanFilter("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                planFilter === "ALL"
                  ? "bg-gold text-background shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setPlanFilter("MONTHLY")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                planFilter === "MONTHLY"
                  ? "bg-gold text-background shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Gói Tháng
            </button>
            <button
              type="button"
              onClick={() => setPlanFilter("DAY_PASS")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                planFilter === "DAY_PASS"
                  ? "bg-gold text-background shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Gói Ngày
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        {isPlansLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass rounded-2xl border-gold/15 p-6 h-80 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded w-20" />
                  <div className="h-6 bg-white/15 rounded w-36" />
                  <div className="h-4 bg-white/5 rounded w-48" />
                </div>
                <div className="h-10 bg-white/10 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              const isCurrent = activePlanIds.has(plan.id);
              // Highlight popular packages: Monthly with 20 quota or name contains "Pro" / "Phổ biến"
              const isPopular =
                plan.planType === "MONTHLY" &&
                (plan.dailyQuota >= 15 || plan.name.toLowerCase().includes("pro"));

              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isPopular={isPopular}
                  isCurrent={isCurrent}
                  onSelect={handlePlanSelect}
                />
              );
            })}
          </div>
        ) : (
          <div className="glass rounded-2xl border-gold/15 p-12 text-center">
            <Layers className="mx-auto h-8 w-8 text-gold/60 mb-2" />
            <p className="text-sm text-foreground">Không có gói dịch vụ nào trong mục này</p>
            <button
              type="button"
              onClick={() => setPlanFilter("ALL")}
              className="mt-3 text-xs text-gold hover:underline"
            >
              Xem tất cả các gói
            </button>
          </div>
        )}
      </section>

      {/* User's Active Subscriptions History */}
      {user && (
        <section>
          <UserPurchasesList
            userId={user?.id}
            showExpired={false}
            maxItems={10}
            onExplorePlans={() => setPlanFilter("ALL")}
          />
        </section>
      )}

      {/* FAQ & Value Proposition Banner */}
      <section className="glass rounded-2xl border border-gold/15 p-6 sm:p-8">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-gold" />
          Câu hỏi thường gặp về gói cước AI
        </h3>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-muted-foreground">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <Zap className="h-4 w-4 text-gold" />
              <span>Hạn mức tính thế nào?</span>
            </div>
            <p>
              Hệ thống áp dụng hạn mức cao nhất trong tất cả các gói bạn đang kích hoạt. Hạn mức tự động hồi phục 100% vào lúc 00:00 (giờ Việt Nam) mỗi ngày.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <Flame className="h-4 w-4 text-amber-400" />
              <span>Gói Ngày (Day Pass) là gì?</span>
            </div>
            <p>
              Thích hợp khi bạn có nhu cầu hỏi liên tục trong 1 hoặc 3 ngày dịp đầu tháng, rằm, hoặc trước các sự kiện lớn mà không cần cam kết cả tháng.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Bảo vệ quyền lợi & thanh toán</span>
            </div>
            <p>
              Thanh toán an toàn qua Ví nội bộ ASTROTAROT hoặc quét mã chuyển khoản QR PayOS. Gói được kích hoạt ngay lập tức sau khi hoàn tất.
            </p>
          </div>
        </div>
      </section>

      {/* Purchase Modal */}
      {isPurchaseModalOpen && (
        <PurchaseModal
          open={isPurchaseModalOpen}
          onClose={() => {
            setSelectedPlan(null);
            setPurchaseModalOpen(false);
          }}
          plan={selectedPlan}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
}
