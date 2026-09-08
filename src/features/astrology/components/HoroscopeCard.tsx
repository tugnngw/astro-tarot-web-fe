// src/features/astrology/components/HoroscopeCard.tsx
import { useHoroscope } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Briefcase, Activity, DollarSign, Sparkles } from "lucide-react";

interface HoroscopeCardProps {
  sign: string;
}

export function HoroscopeCard({ sign }: HoroscopeCardProps) {
  const { data: horoscope, isLoading } = useHoroscope(sign);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!horoscope) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          No horoscope available
        </CardContent>
      </Card>
    );
  }

  const sections = [
    { icon: Heart, label: "Love", value: horoscope.love },
    { icon: Briefcase, label: "Career", value: horoscope.career },
    { icon: Activity, label: "Health", value: horoscope.health },
    { icon: DollarSign, label: "Finance", value: horoscope.finance },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Daily Horoscope
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{horoscope.general}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Icon className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {label}
                  </div>
                  <div className="text-sm">{value}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
