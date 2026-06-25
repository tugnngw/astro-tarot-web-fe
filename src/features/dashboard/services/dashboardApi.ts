// src/features/dashboard/services/dashboardApi.ts
import { api } from "@/lib/api/client";
import type {
  DashboardStats,
  Activity,
  QuickAction,
} from "../types/dashboard.types";

export const dashboardApi = {
  getStats: () => api<DashboardStats>("/api/dashboard/stats"),
  getRecentActivity: (limit?: number) =>
    api<Activity[]>(`/api/dashboard/activity${limit ? `?limit=${limit}` : ""}`),
  getQuickActions: () => api<QuickAction[]>("/api/dashboard/quick-actions"),
};
