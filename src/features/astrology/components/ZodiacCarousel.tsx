// src/features/astrology/components/ZodiacCarousel.tsx
import { useZodiacSigns } from "../hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function ZodiacCarousel() {
  const { data: signs, isLoading } = useZodiacSigns();
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % (signs?.length || 1));
  };

  const prev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + (signs?.length || 1)) % (signs?.length || 1),
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading zodiac signs...</div>;
  }

  if (!signs || signs.length === 0) {
    return <div className="text-center py-8">No zodiac signs found</div>;
  }

  const currentSign = signs[currentIndex];

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="text-6xl mb-4">{currentSign.symbol}</div>
          <h3 className="text-2xl font-bold">{currentSign.name}</h3>
          <p className="text-sm text-muted-foreground">
            {currentSign.dateRange}
          </p>

          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{currentSign.element}</Badge>
            <Badge variant="outline">{currentSign.quality}</Badge>
            <Badge variant="outline">{currentSign.rulingPlanet}</Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-1 justify-center">
            {currentSign.traits.map((trait) => (
              <Badge key={trait} variant="secondary" className="text-xs">
                {trait}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={prev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground flex items-center">
              {currentIndex + 1} / {signs.length}
            </span>
            <Button variant="outline" size="sm" onClick={next}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
