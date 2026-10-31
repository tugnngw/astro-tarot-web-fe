// src/api/subscription.ts
// API layer cho hệ thống gói AI subscription
import { apiFetch } from "./client";

export interface SubscriptionPlan {
  id: string;
  planType: "MONTHLY" | "DAY_PASS" | "FREE";
  name: string;
  dailyQuota: number;
  price: number;
  durationDays: number;
  isActive: boolean;
  description?: string;
}

export interface UserPlanPurchase {
  id: string;
  userId: string;
  planId: string;
  planNameSnapshot: string;
  dailyQuotaSnapshot: number;
  priceSnapshot: number;
  startAt: string;
  endAt: string;
  status: "ACTIVE" | "EXPIRED" | "SUPERSEDED" | "CANCELLED";
  purchaseType: "STRIPE" | "PAYOS" | "WALLET" | "MANUAL";
  createdAt: string;
  updatedAt: string;
}

export interface AIPlanResponse {
  purchaseId: string | null;
  planName: string;
  dailyQuota: number;
  price: number;
  startAt?: string;
  endAt?: string;
  remainingDays: number;
  isActive: boolean;
  /** Có khi mua bằng PayOS — mở link này để thanh toán; gói kích hoạt sau webhook. */
  checkoutUrl?: string | null;
  qrCode?: string | null;
  paymentPending?: boolean;
}

export interface CreatePurchaseRequest {
  planId: string;
  purchaseType: "STRIPE" | "PAYOS" | "WALLET" | "MANUAL";
}

export interface AiUsageRecord {
  userId: string;
  usageDate: string;
  countUsed: number;
}

/**
 * Hạn mức AI hôm nay, do MÁY CHỦ tính, đã cộng đủ mọi nguồn.
 *
 * Đừng dựng lại con số này ở phía client. Trước đây có tới ba chỗ trong mã
 * giao diện tự tính `max(dailyQuotaSnapshot)` rồi mặc định 3 nếu không có
 * gói — một bản sao của luật nằm ở backend. Bản sao ấy lệch ngay khi mini
 * game bắt đầu thưởng lượt: máy chủ cộng phần thưởng vào, giao diện không
 * biết, và người chơi được 3 lượt mà huy hiệu vẫn ghi "3/3".
 */
export interface HanMucAi {
  /** Tổng hạn mức hôm nay = tuGoi + tuGame. */
  tongHanMuc: number;
  /** Phần từ gói đang hoạt động, hoặc gói miễn phí nếu chưa mua gì. */
  tuGoi: number;
  /** Phần thưởng kiếm được từ mini game hôm nay. */
  tuGame: number;
  daDung: number;
  conLai: number;
}

export interface UpdateUserPurchaseRequest {
  dailyQuotaSnapshot?: number;
  endAt?: string;
}

export const subscriptionApi = {
  // Public
  getActivePlans: () =>
    apiFetch<SubscriptionPlan[]>("/api/admin/subscriptions/plans/active"),

  getAllPlans: () =>
    apiFetch<SubscriptionPlan[]>("/api/admin/subscriptions/plans"),

  purchase: (data: CreatePurchaseRequest) =>
    apiFetch<AIPlanResponse>("/api/admin/subscriptions/purchase", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getUserActivePurchases: (userId: string) =>
    apiFetch<UserPlanPurchase[]>(
      `/api/admin/subscriptions/users/${userId}/purchases/active`,
    ),

  getAIUsage: (userId: string, date: string) =>
    apiFetch<AiUsageRecord[]>(
      `/api/admin/subscriptions/users/${userId}/ai-usage?date=${date}`,
    ),

  /** Hạn mức hôm nay. Xem {@link HanMucAi} về việc đừng tự tính lại. */
  getQuota: (userId: string) =>
    apiFetch<HanMucAi>(`/api/admin/subscriptions/users/${userId}/quota`),

  // Admin
  createPlan: (data: {
    planType: "MONTHLY" | "DAY_PASS" | "FREE";
    name: string;
    dailyQuota: number;
    price: number;
    durationDays: number;
    description?: string;
  }) =>
    apiFetch<SubscriptionPlan>("/api/admin/subscriptions/plans", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePlan: (
    planId: string,
    data: {
      dailyQuota?: number;
      price?: number;
      isActive?: boolean;
      description?: string;
    },
  ) =>
    apiFetch<SubscriptionPlan>(`/api/admin/subscriptions/plans/${planId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateUserPurchase: (purchaseId: string, data: UpdateUserPurchaseRequest) =>
    apiFetch<UserPlanPurchase>(
      `/api/admin/subscriptions/user-purchases/${purchaseId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    ),
};
