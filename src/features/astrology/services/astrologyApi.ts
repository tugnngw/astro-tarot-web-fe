import { api } from "@/lib/api/client";
import type {
  ZodiacSign,
  BirthChart,
  Horoscope,
  CompatibilityResult,
  AstrologyTransit,
} from "../types/astrology.types";

export const astrologyApi = {
  getZodiacSigns: () => api<ZodiacSign[]>("/astrology/zodiac"),
  getZodiacSign: (id: string) => api<ZodiacSign>(`/astrology/zodiac/${id}`),
  getZodiacByDate: (date: string) =>
    api<ZodiacSign>(`/astrology/zodiac/by-date?date=${date}`),
  createBirthChart: (data: {
    dateOfBirth: string;
    timeOfBirth: string;
    placeOfBirth: string;
    latitude?: number;
    longitude?: number;
  }) =>
    api<BirthChart>("/astrology/birth-chart", {
      method: "POST",
      body: data,
    }),
  getBirthChart: () => api<BirthChart>("/astrology/birth-chart/me"),
  updateBirthChart: (data: Partial<BirthChart>) =>
    api<BirthChart>("/astrology/birth-chart", {
      method: "PUT",
      body: data,
    }),
  deleteBirthChart: () =>
    api<void>("/astrology/birth-chart", { method: "DELETE" }),
  getHoroscope: (sign: string, date?: string) =>
    api<Horoscope>(
      `/astrology/horoscope/${sign}${date ? `?date=${date}` : ""}`,
    ),
  getDailyHoroscope: () => api<Horoscope[]>("/astrology/horoscope/daily"),
  getWeeklyHoroscope: () => api<Horoscope[]>("/astrology/horoscope/weekly"),
  getMonthlyHoroscope: () => api<Horoscope[]>("/astrology/horoscope/monthly"),
  getCompatibility: (sign1: string, sign2: string) =>
    api<CompatibilityResult>(`/astrology/compatibility/${sign1}/${sign2}`),
  getCompatibilityMatrix: () =>
    api<Record<string, Record<string, number>>>(
      "/astrology/compatibility/matrix",
    ),
  getCurrentTransits: () =>
    api<AstrologyTransit[]>("/astrology/transits/current"),
  getTransitsForDate: (date: string) =>
    api<AstrologyTransit[]>(`/astrology/transits?date=${date}`),
  getElementDistribution: (chartId: string) =>
    api<{ element: string; count: number; percentage: number }[]>(
      `/astrology/chart/${chartId}/elements`,
    ),
  getQualityDistribution: (chartId: string) =>
    api<{ quality: string; count: number; percentage: number }[]>(
      `/astrology/chart/${chartId}/qualities`,
    ),
};
