// src/features/astrology/components/ZodiacAl.tsx
import { useZodiacSigns } from "../hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ZodiacAlProps {
  onSelect?: (signId: string) => void;
  selectedId?: string;
  className?: string;
}

export function ZodiacAl({ onSelect, selectedId, className }: ZodiacAlProps) {
  const { data: signs, isLoading } = useZodiacSigns();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading) {
    return <div className="text-center py-8">Loading zodiac signs...</div>;
  }

  if (!signs || signs.length === 0) {
    return <div className="text-center py-8">No zodiac signs available</div>;
  }

  const getElementColor = (element: string): string => {
    const colors: Record<string, string> = {
      fire: "bg-red-500/10 text-red-500 border-red-500/20",
      earth: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      air: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      water: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    };
    return colors[element] || "bg-muted";
  };

  const getElementEmoji = (element: string): string => {
    const emojis: Record<string, string> = {
      fire: "🔥",
      earth: "🌍",
      air: "💨",
      water: "💧",
    };
    return emojis[element] || "⭐";
  };

  const getQualityEmoji = (quality: string): string => {
    const emojis: Record<string, string> = {
      cardinal: "♈️",
      fixed: "♉️",
      mutable: "♊️",
    };
    return emojis[quality] || "🔮";
  };

  const currentSign = signs[currentIndex];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-full">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setCurrentIndex((prev) =>
                    prev === 0 ? signs.length - 1 : prev - 1,
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-8xl">{currentSign.symbol}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setCurrentIndex((prev) => (prev + 1) % signs.length)
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{currentSign.name}</h3>
              <p className="text-sm text-muted-foreground">
                {currentSign.nameVi}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentSign.dateRange}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <Badge className={cn(getElementColor(currentSign.element))}>
                {getElementEmoji(currentSign.element)} {currentSign.element}
              </Badge>
              <Badge variant="outline">
                {getQualityEmoji(currentSign.quality)} {currentSign.quality}
              </Badge>
              <Badge variant="outline">🌟 {currentSign.rulingPlanet}</Badge>
            </div>

            <div className="flex flex-wrap gap-1 justify-center mt-3">
              {currentSign.traits.map((trait) => (
                <Badge key={trait} variant="secondary" className="text-xs">
                  {trait}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="text-muted-foreground">Lucky Number</div>
                <div className="font-bold">{currentSign.luckyNumber}</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="text-muted-foreground">Lucky Day</div>
                <div className="font-bold">{currentSign.luckyDay}</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="text-muted-foreground">Color</div>
                <div
                  className="font-bold w-4 h-4 rounded-full mx-auto border"
                  style={{ backgroundColor: currentSign.color }}
                />
              </div>
            </div>

            {onSelect && (
              <Button
                className="mt-4 w-full"
                variant={selectedId === currentSign.id ? "default" : "outline"}
                onClick={() => onSelect(currentSign.id)}
              >
                {selectedId === currentSign.id ? "✓ Selected" : "Select Sign"}
              </Button>
            )}

            <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground">
              <span>{currentIndex + 1}</span>
              <span className="text-muted-foreground/50">/</span>
              <span>{signs.length}</span>
            </div>
          </div>

          {selectedId && (
            <div className="mt-4 p-3 rounded-lg bg-muted/30 w-full">
              <div className="text-sm font-medium">Compatibility</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentSign.compatibility.love.map((sign) => (
                  <Badge key={sign} variant="secondary" className="text-xs">
                    ❤️ {sign}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
