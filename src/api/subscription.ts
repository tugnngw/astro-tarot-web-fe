// src/api/subscription.ts
// API layer cho hệ thống gói AI subscription
import { apiFetch } from './client';

export interface SubscriptionPlan {
  id: string;
  planType: 'MONTHLY' | 'DAY_PASS' | 'FREE';
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
  status: 'ACTIVE' | 'EXPIRED' | 'SUPERSEDED' | 'CANCELLED';
  purchaseType: 'STRIPE' | 'PAYOS' | 'WALLET' | 'MANUAL';
  createdAt: string;
  updatedAt: string;
}

export interface AIPlanResponse {
  purchaseId: string;
  planName: string;
  dailyQuota: number;
  price: number;
  startAt: string;
  endAt: string;
  remainingDays: number;
  isActive: boolean;
}

export interface CreatePurchaseRequest {
  planId: string;
  purchaseType: 'STRIPE' | 'PAYOS' | 'WALLET' | 'MANUAL';
}

export interface AiUsageRecord {
  userId: string;
  usageDate: string;
  countUsed: number;
}

export interface UpdateUserPurchaseRequest {
  dailyQuotaSnapshot?: number;
  endAt?: string;
}

export const subscriptionApi = {
  // Public
  getActivePlans: () =>
    apiFetch<SubscriptionPlan[]>('/api/admin/subscriptions/plans/active'),

  getAllPlans: () =>
    apiFetch<SubscriptionPlan[]>('/api/admin/subscriptions/plans'),

  purchase: (data: CreatePurchaseRequest) =>
    apiFetch<AIPlanResponse>('/api/admin/subscriptions/purchase', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getUserActivePurchases: (userId: string) =>
    apiFetch<UserPlanPurchase[]>(`/api/admin/subscriptions/users/${userId}/purchases/active`),

  getAIUsage: (userId: string, date: string) =>
    apiFetch<AiUsageRecord[]>(`/api/admin/subscriptions/users/${userId}/ai-usage?date=${date}`),

  // Admin
  createPlan: (data: {
    planType: 'MONTHLY' | 'DAY_PASS' | 'FREE';
    name: string;
    dailyQuota: number;
    price: number;
    durationDays: number;
    description?: string;
  }) =>
    apiFetch<SubscriptionPlan>('/api/admin/subscriptions/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePlan: (planId: string, data: {
    dailyQuota?: number;
    price?: number;
    isActive?: boolean;
    description?: string;
  }) =>
    apiFetch<SubscriptionPlan>(`/api/admin/subscriptions/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateUserPurchase: (purchaseId: string, data: UpdateUserPurchaseRequest) =>
    apiFetch<UserPlanPurchase>(`/api/admin/subscriptions/user-purchases/${purchaseId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};