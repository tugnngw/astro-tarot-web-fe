// src/features/readers/components/TopReaders.tsx
import { useTopReaders } from "../hooks";
import { ReaderCard } from "./ReaderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users } from "lucide-react";

interface TopReadersProps {
  limit?: number;
  title?: string;
}

export function TopReaders({
  limit = 6,
  title = "Top Readers",
}: TopReadersProps) {
  const { data: readers, isLoading } = useTopReaders(limit);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!readers || readers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No readers available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">
          ({readers.length} readers)
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {readers.map((reader, index) => (
          <div key={reader.id} className="relative">
            {index < 3 && (
              <div className="absolute -left-2 -top-2 z-10">
                <Badge
                  variant="default"
                  className="rounded-full px-2 py-1 text-xs"
                >
                  #{index + 1}
                </Badge>
              </div>
            )}
            <ReaderCard reader={reader} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
