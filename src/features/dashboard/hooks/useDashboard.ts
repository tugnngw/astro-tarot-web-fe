// src/features/dashboard/hooks/useDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../services/dashboardApi";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  activity: () => [...dashboardKeys.all, "activity"] as const,
  actions: () => [...dashboardKeys.all, "actions"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentActivity(limit?: number) {
  return useQuery({
    queryKey: [...dashboardKeys.activity(), limit],
    queryFn: () => dashboardApi.getRecentActivity(limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuickActions() {
  return useQuery({
    queryKey: dashboardKeys.actions(),
    queryFn: () => dashboardApi.getQuickActions(),
    staleTime: 60 * 60 * 1000,
  });
}
