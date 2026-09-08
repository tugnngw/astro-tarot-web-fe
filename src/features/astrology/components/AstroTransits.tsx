// src/features/astrology/components/AstroTransits.tsx
import { useCurrentTransits } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function AstroTransits() {
  const { data: transits, isLoading } = useCurrentTransits();

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

  if (!transits || transits.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          No active transits
        </CardContent>
      </Card>
    );
  }

  const getImpactColor = (impact: string) => {
    const colors: Record<string, string> = {
      positive: "text-emerald-500 bg-emerald-500/10",
      neutral: "text-blue-500 bg-blue-500/10",
      challenging: "text-amber-500 bg-amber-500/10",
    };
    return colors[impact] || "text-muted-foreground bg-muted/30";
  };

  const getImpactEmoji = (impact: string) => {
    const emojis: Record<string, string> = {
      positive: "✨",
      neutral: "🌤️",
      challenging: "🌩️",
    };
    return emojis[impact] || "🌟";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          Current Transits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transits.map((transit) => (
          <div
            key={transit.id}
            className="p-3 rounded-lg border border-border/50 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🪐</span>
                <div>
                  <div className="font-medium text-sm">
                    {transit.planet} in {transit.sign}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {transit.date}
                  </div>
                </div>
              </div>
              <Badge className={cn("text-xs", getImpactColor(transit.impact))}>
                {getImpactEmoji(transit.impact)} {transit.impact}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {transit.description}
            </p>
            {transit.aspect && (
              <div className="mt-1 text-xs text-muted-foreground">
                Aspect: {transit.aspect}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
