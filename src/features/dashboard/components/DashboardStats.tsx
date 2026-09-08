// src/features/dashboard/components/DashboardStats.tsx
import { useDashboardStats } from "../hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Star, Users, BookOpen } from "lucide-react";

export function DashboardStats() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const items = [
    {
      icon: BookOpen,
      label: "Readings",
      value: stats.totalReadings,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      icon: Calendar,
      label: "Bookings",
      value: stats.totalBookings,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      icon: Star,
      label: "Reviews",
      value: stats.totalReviews,
      color: "text-yellow-500 bg-yellow-500/10",
    },
    {
      icon: Users,
      label: "Streak",
      value: `${stats.readingStreak} days`,
      color: "text-emerald-500 bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground">
                  {item.label}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
