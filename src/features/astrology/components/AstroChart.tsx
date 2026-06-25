// src/features/astrology/components/AstroChart.tsx
import { useBirthChart, useZodiacSigns } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Sun,
  Moon,
  Star,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export function AstroChart() {
  const { data: birthChart, isLoading: chartLoading } = useBirthChart();
  const { data: zodiacSigns } = useZodiacSigns();
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [currentHouse, setCurrentHouse] = useState(1);

  if (chartLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-48 w-full" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!birthChart) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-6xl mb-4">🌟</div>
          <h3 className="text-xl font-semibold">Create Your Birth Chart</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Enter your birth details to unlock your cosmic blueprint and
            discover your celestial identity
          </p>
          <Button className="mt-4" variant="outline">
            Create Birth Chart
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getZodiacSign = (signId: string) => {
    return zodiacSigns?.find((s) => s.id === signId);
  };

  const getPlanetEmoji = (planet: string): string => {
    const emojis: Record<string, string> = {
      Sun: "☀️",
      Moon: "🌙",
      Mercury: "☿",
      Venus: "♀",
      Mars: "♂",
      Jupiter: "♃",
      Saturn: "♄",
      Uranus: "⛢",
      Neptune: "♆",
      Pluto: "♇",
    };
    return emojis[planet] || "🪐";
  };

  const getElementColor = (element: string): string => {
    const colors: Record<string, string> = {
      fire: "bg-red-500/10 text-red-500 border-red-500/20",
      earth: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      air: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      water: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    };
    return colors[element] || "";
  };

  const sunSign = getZodiacSign(birthChart.sunSign);
  const moonSign = getZodiacSign(birthChart.moonSign);
  const risingSign = getZodiacSign(birthChart.risingSign);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl">
                ☀️
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {sunSign?.name || "Unknown"} Sun
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(birthChart.dateOfBirth), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {birthChart.timeOfBirth}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {birthChart.placeOfBirth}
                  </span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {birthChart.coordinates.latitude}°N,{" "}
              {birthChart.coordinates.longitude}°E
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-1">☀️</div>
            <div className="font-semibold">Sun Sign</div>
            <div className="text-sm text-muted-foreground">{sunSign?.name}</div>
            <div className="text-xs text-muted-foreground">
              {sunSign?.dateRange}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-1">🌙</div>
            <div className="font-semibold">Moon Sign</div>
            <div className="text-sm text-muted-foreground">
              {moonSign?.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {moonSign?.dateRange}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-1">⬆️</div>
            <div className="font-semibold">Rising Sign</div>
            <div className="text-sm text-muted-foreground">
              {risingSign?.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {risingSign?.dateRange}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4" />
            Birth Chart Visualization
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 relative">
          <div className="relative w-full aspect-square max-w-2xl mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-[8%] rounded-full border border-primary/10" />
            <div className="absolute inset-[25%] rounded-full border border-primary/10" />
            <div className="absolute inset-[45%] rounded-full border border-primary/10" />

            {birthChart.houses.map((house, index) => {
              const angle = (index / 12) * 360 - 90;
              const isActive = currentHouse === house.number;
              const sign = getZodiacSign(house.signId);

              return (
                <div
                  key={house.number}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <div
                    className={cn(
                      "absolute w-0.5 h-[45%] origin-bottom cursor-pointer transition-all",
                      isActive ? "bg-primary" : "bg-primary/20",
                    )}
                    style={{ top: 0 }}
                    onMouseEnter={() => setCurrentHouse(house.number)}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold">
                      {house.number}
                    </div>
                    {isActive && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[6px] whitespace-nowrap">
                        {sign?.symbol || ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {birthChart.planets.map((planet) => {
              const angle =
                (planet.house / 12) * 360 - 90 + (planet.degree / 30) * 30;
              const radius = 55 - (planet.house % 3) * 10;
              const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
              const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

              return (
                <div
                  key={planet.planet}
                  className="absolute cursor-pointer transition-all hover:scale-150"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onMouseEnter={() => setSelectedPlanet(planet.planet)}
                  onMouseLeave={() => setSelectedPlanet(null)}
                >
                  <div className="text-xl">{getPlanetEmoji(planet.planet)}</div>
                  {selectedPlanet === planet.planet && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap text-[8px] bg-background px-1 rounded">
                      {planet.planet} in {getZodiacSign(planet.signId)?.symbol}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="absolute inset-[35%] flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl shadow-lg">
                ☀️
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  House {birthChart.houses[currentHouse - 1]?.number || 1}
                </div>
                <div className="text-xs text-muted-foreground">
                  {birthChart.houses[currentHouse - 1]?.sign || "No sign"}(
                  {birthChart.houses[currentHouse - 1]?.degree || 0}°)
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setCurrentHouse((prev) => (prev === 1 ? 12 : prev - 1))
                  }
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setCurrentHouse((prev) => (prev === 12 ? 1 : prev + 1))
                  }
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Planetary Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {birthChart.planets.map((planet) => {
              const sign = getZodiacSign(planet.signId);
              const elementColor = sign ? getElementColor(sign.element) : "";

              return (
                <div
                  key={planet.planet}
                  className={cn(
                    "p-2 rounded-lg border transition-all cursor-pointer",
                    selectedPlanet === planet.planet
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/30",
                    "hover:border-primary/30",
                  )}
                  onMouseEnter={() => setSelectedPlanet(planet.planet)}
                  onMouseLeave={() => setSelectedPlanet(null)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {getPlanetEmoji(planet.planet)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {planet.planet}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span className="truncate">
                          {sign?.symbol || planet.signId}
                        </span>
                        <span
                          className={cn(
                            "text-[8px] px-1 rounded",
                            elementColor,
                          )}
                        >
                          {sign?.element || ""}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[8px]">
                      H{planet.house}
                    </Badge>
                  </div>
                  {planet.isRetrograde && (
                    <div className="text-[8px] text-amber-500 mt-0.5">
                      ℞ Retrograde
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Element Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(
              birthChart.planets.reduce(
                (acc, p) => {
                  const sign = getZodiacSign(p.signId);
                  if (sign) {
                    acc[sign.element] = (acc[sign.element] || 0) + 1;
                  }
                  return acc;
                },
                {} as Record<string, number>,
              ),
            ).map(([element, count]) => {
              const percentage = (count / birthChart.planets.length) * 100;
              const elementColor = getElementColor(element);

              return (
                <div key={element} className="flex-1 min-w-[80px]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{element}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-0.5">
                    <div
                      className={cn("h-full rounded-full", elementColor)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
