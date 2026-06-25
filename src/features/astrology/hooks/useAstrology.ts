import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { astrologyApi } from "../services/astrologyApi";

export const astrologyKeys = {
  all: ["astrology"] as const,
  zodiac: () => [...astrologyKeys.all, "zodiac"] as const,
  zodiacSign: (id: string) => [...astrologyKeys.zodiac(), id] as const,
  birthChart: () => [...astrologyKeys.all, "birth-chart"] as const,
  horoscope: (sign: string, date?: string) =>
    [...astrologyKeys.all, "horoscope", sign, date || "today"] as const,
  daily: () => [...astrologyKeys.all, "daily"] as const,
  weekly: () => [...astrologyKeys.all, "weekly"] as const,
  monthly: () => [...astrologyKeys.all, "monthly"] as const,
  compatibility: (sign1: string, sign2: string) =>
    [...astrologyKeys.all, "compatibility", sign1, sign2] as const,
  transits: () => [...astrologyKeys.all, "transits"] as const,
};

export function useZodiacSigns() {
  return useQuery({
    queryKey: astrologyKeys.zodiac(),
    queryFn: () => astrologyApi.getZodiacSigns(),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useZodiacSign(id: string) {
  return useQuery({
    queryKey: astrologyKeys.zodiacSign(id),
    queryFn: () => astrologyApi.getZodiacSign(id),
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useZodiacByDate(date: string) {
  return useQuery({
    queryKey: [...astrologyKeys.zodiac(), date] as const,
    queryFn: () => astrologyApi.getZodiacByDate(date),
    enabled: !!date,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useBirthChart() {
  return useQuery({
    queryKey: astrologyKeys.birthChart(),
    queryFn: () => astrologyApi.getBirthChart(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBirthChart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof astrologyApi.createBirthChart>[0]) =>
      astrologyApi.createBirthChart(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: astrologyKeys.birthChart() });
    },
  });
}

export function useUpdateBirthChart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof astrologyApi.updateBirthChart>[0]) =>
      astrologyApi.updateBirthChart(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: astrologyKeys.birthChart() });
    },
  });
}

export function useHoroscope(sign: string, date?: string) {
  return useQuery({
    queryKey: astrologyKeys.horoscope(sign, date),
    queryFn: () => astrologyApi.getHoroscope(sign, date),
    enabled: !!sign,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDailyHoroscope() {
  return useQuery({
    queryKey: astrologyKeys.daily(),
    queryFn: () => astrologyApi.getDailyHoroscope(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeeklyHoroscope() {
  return useQuery({
    queryKey: astrologyKeys.weekly(),
    queryFn: () => astrologyApi.getWeeklyHoroscope(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useMonthlyHoroscope() {
  return useQuery({
    queryKey: astrologyKeys.monthly(),
    queryFn: () => astrologyApi.getMonthlyHoroscope(),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useCompatibility(sign1: string, sign2: string) {
  return useQuery({
    queryKey: astrologyKeys.compatibility(sign1, sign2),
    queryFn: () => astrologyApi.getCompatibility(sign1, sign2),
    enabled: !!sign1 && !!sign2,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useCurrentTransits() {
  return useQuery({
    queryKey: astrologyKeys.transits(),
    queryFn: () => astrologyApi.getCurrentTransits(),
    staleTime: 5 * 60 * 1000,
  });
}
