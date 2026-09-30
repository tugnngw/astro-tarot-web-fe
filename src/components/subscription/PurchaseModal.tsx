import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { subscriptionApi } from "@/api/subscription";
import type { SubscriptionPlan, AIPlanResponse, CreatePurchaseRequest } from "@/api/subscription";

export interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  initialPlanId?: string | null;
  onPurchaseSuccess?: (response: AIPlanResponse) => void;
}

export function PurchaseModal({
  open,
  onClose,
  initialPlanId,
  onPurchaseSuccess,
}: PurchaseModalProps) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [purchaseType, setPurchaseType] = useState<'STRIPE' | 'PAYOS' | 'WALLET' | 'MANUAL'>('WALLET');
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: CreatePurchaseRequest) =>
      subscriptionApi.purchase(data),
    onSuccess: (response: AIPlanResponse) => {
      setError(null);
      onPurchaseSuccess?.(response);
      onClose();
    },
    onError: (err: any) => {
      setError(err?.message ?? "Mua gói thất bại");
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

  const paymentOptions: Array<{ type: 'STRIPE' | 'PAYOS' | 'WALLET' | 'MANUAL'; label: string }> = [
    { type: 'STRIPE', label: 'Thẻ ATM/VISA' },
    { type: 'PAYOS', label: 'PayOS' },
    { type: 'WALLET', label: 'Ví điện tử' },
    { type: 'MANUAL', label: 'Trực tiếp' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mua gói AI</h2>

        {error && (
          <div className="mb-3 p-3 rounded bg-red-100 text-red-800">
            {error}
          </div>
        )}

        {selectedPlan && (
          <div className="mb-4 p-3 rounded-lg bg-gray-50">
            <h3 className="text-base font-medium mb-2">
              {selectedPlan.name}
            </h3>

            <p className="text-sm text-gray-600 mb-2">
              {selectedPlan.dailyQuota} lượt AI/ngày trong {selectedPlan.durationDays} ngày
            </p>

            {!selectedPlan.isActive && (
              <p className="text-sm text-red-600">Gói này hiện không hoạt động</p>
            )}

            {selectedPlan.price > 0 && (
              <p className="text-sm text-gray-700 mb-3">
                {selectedPlan.price} ₫
              </p>
            )}

            {selectedPlan.planType === 'FREE' && (
              <p className="text-xs text-green-600">
                Gói FREE – không hết hạn
              </p>
            )}

            <div className="grid gap-2 mb-4">
              {paymentOptions.map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded border border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors text-left"
                  onClick={() => setPurchaseType(opt.type)}
                  style={{ background: purchaseType === opt.type ? '#e5e7eb' : 'transparent' }}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <button
              disabled={isPending}
              className={`w-full py-2 rounded-lg font-medium transition-colors text-white ${
                selectedPlan.price === 0
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={handlePurchase}
            >
              {isPending ? "Đang xử lý..." : selectedPlan.price === 0 ? "Kích hoạt (FREE)" : "Mua ngay"}
            </button>
          </div>
        )}

        <button
          className="mt-4 w-full text-gray-600 hover:text-gray-800 py-2 rounded-lg font-medium transition-colors"
          onClick={onClose}
        >
          Hủy
        </button>
      </div>
    </div>
  );
}