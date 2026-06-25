// src/features/dashboard/types/dashboard.types.ts
import type { Booking } from "../../readers/types/reader.types";
import type { TarotReading } from "../../tarot/types/tarot.types";
import type { Horoscope } from "../../astrology/types/astrology.types";

export interface DashboardStats {
  totalReadings: number;
  totalBookings: number;
  totalReviews: number;
  readingStreak: number;
  favoriteReaders: number;
  upcomingBookings: Booking[];
  recentReadings: TarotReading[];
  dailyHoroscope?: Horoscope;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: "reading" | "booking" | "review" | "horoscope_view";
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}
