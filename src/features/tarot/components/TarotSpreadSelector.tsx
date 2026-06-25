import { useTarotSpreads } from "../hooks";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TarotSpreadSelectorProps {
  selectedId?: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function TarotSpreadSelector({
  selectedId,
  onSelect,
  className,
}: TarotSpreadSelectorProps) {
  const { data: spreads, isLoading } = useTarotSpreads();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-center py-4">Loading spreads...</div>;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
        className,
      )}
    >
      {spreads?.map((spread) => (
        <Card
          key={spread.id}
          className={cn(
            "cursor-pointer transition-all duration-300",
            "hover:shadow-lg hover:border-primary/50",
            selectedId === spread.id ? "border-primary shadow-lg" : "",
            hoveredId === spread.id ? "scale-105" : "",
          )}
          onClick={() => onSelect(spread.id)}
          onMouseEnter={() => setHoveredId(spread.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🃏</div>
            <div className="font-semibold">{spread.name}</div>
            <div className="text-sm text-muted-foreground">{spread.nameVi}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {spread.cardCount} cards
            </div>
            <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {spread.description}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
