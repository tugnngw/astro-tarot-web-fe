import { useTarotHistory } from "../hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface TarotReadingHistoryProps {
  onViewReading: (id: string) => void;
}

export function TarotReadingHistory({
  onViewReading,
}: TarotReadingHistoryProps) {
  const { data: readings, isLoading } = useTarotHistory();

  if (isLoading) {
    return <div className="text-center py-8">Loading history...</div>;
  }

  if (!readings || readings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-4xl mb-2">🔮</div>
          <p className="text-muted-foreground">No readings yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start your first tarot reading today!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {readings.map((reading) => (
        <Card key={reading.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl">🃏</div>
              <div>
                <div className="font-medium">
                  {reading.spread || "Custom Reading"}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(
                    new Date(reading.createdAt),
                    "MMM d, yyyy 'at' h:mm a",
                  )}
                </div>
                {reading.question && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Q: {reading.question}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewReading(reading.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
