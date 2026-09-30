import { useQuery } from "@tanstack/react-query";
import { subscriptionApi } from "@/api/subscription";
import type { SubscriptionPlan } from "@/api/subscription";
import { Zap, Clock, Check, Sparkles } from "lucide-react";

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

function formatVND(price: number): string {
  if (price === 0) return "Miễn phí";
  return price.toLocaleString("vi-VN") + " ₫";
}

const PLAN_TYPE_LABELS: Record<SubscriptionPlan["planType"], string> = {
  MONTHLY: "Gói Tháng",
  DAY_PASS: "Gói Ngày",
  FREE: "Miễn Phí",
};

interface PlanCardProps {
  plan: SubscriptionPlan;
  isPopular?: boolean;
  isCurrent?: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}

export function PlanCard({ plan, isPopular, isCurrent, onSelect }: PlanCardProps) {
  const isFree = plan.planType === "FREE";

  return (
    <div
      className={`glass group relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 ${
        isPopular
          ? "border-gold/60 shadow-[0_0_24px_rgba(212,175,55,0.15)] hover:border-gold"
          : "border-gold/15 hover:border-gold/40"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-gold px-3 py-0.5 text-xs font-semibold text-background shadow-md">
          <Sparkles className="h-3 w-3" />
          Phổ biến nhất
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-gold/25 bg-gold/10 px-2.5 py-0.5 text-[11px] font-medium text-gold">
            {PLAN_TYPE_LABELS[plan.planType]}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-gold/80" />
            {isFree ? "Vĩnh viễn" : `${plan.durationDays} ngày`}
          </span>
        </div>

        <h3 className="font-display mt-3 text-xl font-semibold text-foreground group-hover:text-gold transition-colors">
          {plan.name}
        </h3>

        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
          {plan.description || "Gói dịch vụ AI Tarot mở rộng hạn mức trải bài."}
        </p>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold text-gradient-gold">
            {formatVND(plan.price)}
          </span>
          {!isFree && (
            <span className="text-xs text-muted-foreground">
              / {plan.planType === "MONTHLY" ? "tháng" : `${plan.durationDays} ngày`}
            </span>
          )}
        </div>

        <div className="my-5 h-px bg-gold/10" />

        <ul className="space-y-2.5 text-xs text-foreground/80">
          <li className="flex items-center gap-2">
            <div className="grid h-4 w-4 place-items-center rounded-full bg-gold/20 text-gold">
              <Zap className="h-2.5 w-2.5" />
            </div>
            <span>
              <strong className="text-gold">{plan.dailyQuota} lượt</strong> hỏi AI mỗi ngày
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Phân tích Tarot & bản đồ sao kết hợp</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Hạn mức làm mới 00:00 (giờ VN) hàng ngày</span>
          </li>
          {plan.dailyQuota >= 10 && (
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Ưu tiên tốc độ xử lý AI cao</span>
            </li>
          )}
        </ul>
      </div>

      <button
        type="button"
        disabled={isCurrent || !plan.isActive}
        onClick={() => onSelect(plan)}
        className={`mt-6 w-full rounded-xl py-2.5 text-sm font-medium transition-all ${
          isCurrent
            ? "border border-gold/30 bg-gold/10 text-gold cursor-default"
            : isFree
              ? "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
              : isPopular
                ? "bg-gold text-background shadow-md hover:bg-gold/90"
                : "border border-gold/40 bg-card/60 text-gold hover:bg-gold/10"
        }`}
      >
        {isCurrent
          ? "Đang sử dụng"
          : isFree
            ? "Gói mặc định"
            : `Đăng ký gói — ${formatVND(plan.price)}`}
      </button>
    </div>
  );
}
