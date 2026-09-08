// src/features/dashboard/components/RecentActivity.tsx
import { useRecentActivity } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const ACTIVITY_ICONS: Record<string, string> = {
  reading: "🃏",
  booking: "📅",
  review: "⭐",
  horoscope_view: "🌟",
};

export function RecentActivity() {
  const { data: activities, isLoading } = useRecentActivity(5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="text-2xl">
              {ACTIVITY_ICONS[activity.type] || "📌"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{activity.title}</div>
              <div className="text-xs text-muted-foreground">
                {activity.description}
              </div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(activity.timestamp), "MMM d")}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
