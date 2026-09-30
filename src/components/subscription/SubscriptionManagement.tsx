import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useActivePlans } from "./PackageSelection";
import { QuotaDisplay } from "./QuotaDisplay";
import { UserPurchasesList } from "./UserPurchasesList";
import { PurchaseModal } from "./PurchaseModal";
import type { SubscriptionPlan, AIPlanResponse } from "@/api/subscription";

export function SubscriptionManagement() {
  const { user } = useAuth();
  const { data: activePlans, isLoading } = useActivePlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<AIPlanResponse | null>(null);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlanId(plan.id);
    setPurchaseModalOpen(true);
  };

  const handlePurchaseSuccess = (data: AIPlanResponse) => {
    setPurchaseSuccess(data);
    setSelectedPlanId(null);
  };

  return (
    <div className="subscription-management">
      <header className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Quản lý gói AI</h2>
        <p className="text-sm text-gray-600">
          Quản lý gói AI cho việc đọc tarot tự động. Chọn gói phù hợp để nhận
          các bản đọc tarot hàng ngày.
        </p>
      </header>

      {isLoading ? (
        <div className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-gray-200 rounded w-48"></div>
            <div className="h-12 bg-gray-200 rounded w-32 mt-1"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="text-base font-medium mb-2">Gói AI hiện có</h3>
            <div className="flex flex-wrap gap-3">
              {activePlans?.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  className="group border rounded-lg p-3 hover:border-blue-500 transition-colors cursor-pointer text-left"
                  onClick={() => handlePlanSelect(plan)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{plan.name}</h4>
                      <p className="text-xs text-gray-600">
                        {plan.planType === 'FREE' && 'Miễn phí (không hết hạn)'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">
                        {plan.dailyQuota} lượt AI/ngày
                      </span>
                      <span className="text-xs text-gray-600">
                        {plan.durationDays} ngày
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <QuotaDisplay variant="detailed" />

          <UserPurchasesList userId={user?.id} showExpired={false} maxItems={5} className="mt-6" />

          {purchaseSuccess && (
            <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">Thành công!</h4>
              <p className="text-sm text-green-800">
                {purchaseSuccess.planName} đã được kích hoạt thành công!
              </p>
              <p className="text-xs text-green-700">
                Hạn sử dụng: {purchaseSuccess.remainingDays} ngày còn lại
              </p>
            </div>
          )}

          <button
            className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            onClick={() => setPurchaseModalOpen(true)}
          >
            Mua gói AI mới
          </button>
        </>
      )}

      {isPurchaseModalOpen && (
        <PurchaseModal
          open={isPurchaseModalOpen}
          onClose={() => {
            setSelectedPlanId(null);
            setPurchaseModalOpen(false);
          }}
          initialPlanId={selectedPlanId}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
}