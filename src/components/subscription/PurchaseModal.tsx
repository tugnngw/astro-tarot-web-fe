import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { subscriptionApi } from "@/api/subscription";
import type { SubscriptionPlan, AIPlanResponse, CreatePurchaseRequest } from "@/api/subscription";
import { useActivePlans } from "./PackageSelection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Zap,
  Clock,
  Wallet,
  QrCode,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  plan?: SubscriptionPlan | null;
  initialPlanId?: string | null;
  onPurchaseSuccess?: (response: AIPlanResponse) => void;
}

function formatVND(price: number): string {
  if (price === 0) return "Miễn phí";
  return price.toLocaleString("vi-VN") + " ₫";
}

export function PurchaseModal({
  open,
  onClose,
  plan: propPlan,
  initialPlanId,
  onPurchaseSuccess,
}: PurchaseModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: activePlans } = useActivePlans();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(propPlan || null);
  const [purchaseType, setPurchaseType] = useState<"WALLET" | "PAYOS" | "STRIPE" | "MANUAL">("WALLET");
  const [error, setError] = useState<string | null>(null);

  // Sync selectedPlan when prop or id changes
  useEffect(() => {
    if (propPlan) {
      setSelectedPlan(propPlan);
    } else if (initialPlanId && activePlans) {
      const found = activePlans.find((p) => p.id === initialPlanId);
      if (found) setSelectedPlan(found);
    }
  }, [propPlan, initialPlanId, activePlans]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: CreatePurchaseRequest) => subscriptionApi.purchase(data),
    onSuccess: (response: AIPlanResponse) => {
      setError(null);
      // Invalidate all subscription and usage queries
      void queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      void queryClient.invalidateQueries({ queryKey: ["subscription"] });
      void queryClient.invalidateQueries({ queryKey: ["ai-usage"] });
      void queryClient.invalidateQueries({ queryKey: ["user-purchases"] });
      toast.success(`Đã kích hoạt thành công gói ${response.planName}!`);
      onPurchaseSuccess?.(response);
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.message ?? "Mua gói dịch vụ thất bại";
      setError(msg);
      toast.error(msg);
    },
  });

  const handlePurchase = useCallback(async () => {
    if (!user || !selectedPlan) return;
    setError(null);

    const request: CreatePurchaseRequest = {
      planId: selectedPlan.id,
      purchaseType,
    };

    try {
      await mutateAsync(request);
    } catch {
      // Error handled in onError
    }
  }, [user, selectedPlan, purchaseType, mutateAsync]);

  if (!open) return null;

  const paymentOptions: Array<{
    type: "WALLET" | "PAYOS" | "STRIPE" | "MANUAL";
    label: string;
    sublabel: string;
    icon: typeof Wallet;
  }> = [
    {
      type: "WALLET",
      label: "Ví ASTROTAROT",
      sublabel: "Trừ trực tiếp vào số dư ví của bạn",
      icon: Wallet,
    },
    {
      type: "PAYOS",
      label: "Cổng PayOS / Chuyển khoản QR",
      sublabel: "Quét mã VietQR bằng app ngân hàng",
      icon: QrCode,
    },
    {
      type: "STRIPE",
      label: "Thẻ Quốc Tế (Visa / Mastercard)",
      sublabel: "Thanh toán an toàn qua cổng thẻ",
      icon: CreditCard,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass border-gold/25 sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            Đăng ký gói dịch vụ AI
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {selectedPlan ? (
          <div className="space-y-4">
            {/* Selected Plan Summary Card */}
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
                    {selectedPlan.planType === "MONTHLY"
                      ? "Gói Tháng"
                      : selectedPlan.planType === "DAY_PASS"
                        ? "Gói Ngày"
                        : "Miễn Phí"}
                  </span>
                  <h4 className="font-display mt-1 text-lg font-semibold text-foreground">
                    {selectedPlan.name}
                  </h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedPlan.description || "Gói cước mở rộng lượt hỏi AI"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display text-xl font-bold text-gradient-gold">
                    {formatVND(selectedPlan.price)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    {selectedPlan.planType === "FREE"
                      ? "Không hết hạn"
                      : `${selectedPlan.durationDays} ngày`}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 border-t border-gold/15 pt-3 text-xs">
                <div className="flex items-center gap-1.5 text-gold">
                  <Zap className="h-3.5 w-3.5" />
                  <span>
                    <strong>{selectedPlan.dailyQuota} lượt</strong> AI / ngày
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-gold/80" />
                  <span>Thời hạn: {selectedPlan.durationDays} ngày</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            {selectedPlan.price > 0 && (
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
                  Phương thức thanh toán
                </label>
                <div className="space-y-2">
                  {paymentOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = purchaseType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setPurchaseType(opt.type)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? "border-gold bg-gold/10 text-foreground"
                            : "border-white/10 bg-white/5 text-muted-foreground hover:border-gold/30 hover:bg-white/10"
                        }`}
                      >
                        <div
                          className={`grid h-8 w-8 place-items-center rounded-lg ${
                            isSelected
                              ? "bg-gold text-background"
                              : "bg-white/10 text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              isSelected ? "text-gold" : "text-foreground"
                            }`}
                          >
                            {opt.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {opt.sublabel}
                          </p>
                        </div>
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-gold bg-gold" : "border-white/30"
                          }`}
                        >
                          {isSelected && (
                            <div className="h-1.5 w-1.5 rounded-full bg-background" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notice / Security footnote */}
            <div className="flex items-start gap-2 rounded-xl bg-white/5 p-3 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>
                Hạn mức được cộng dồn theo quy tắc lấy hạn mức cao nhất trong tất cả các gói đang hoạt động của bạn. Lượt AI được hồi phục vào 00:00 (Asia/Ho_Chi_Minh) hàng ngày.
              </span>
            </div>

            {/* Submit Action */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-muted-foreground hover:bg-white/5 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isPending || !selectedPlan.isActive}
                onClick={handlePurchase}
                className="flex-1 rounded-xl bg-gold py-2.5 text-sm font-medium text-background transition hover:bg-gold/90 disabled:opacity-50"
              >
                {isPending
                  ? "Đang xử lý..."
                  : selectedPlan.price === 0
                    ? "Kích hoạt (Miễn phí)"
                    : `Thanh toán ${formatVND(selectedPlan.price)}`}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Chưa chọn gói dịch vụ nào. Vui lòng chọn một gói từ danh sách.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
