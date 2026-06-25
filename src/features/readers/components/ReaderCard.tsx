// src/features/readers/components/ReaderCard.tsx
import { Link } from "@tanstack/react-router";
import { Star, Calendar, Clock, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Reader } from "../types/reader.types";
import { cn } from "@/lib/utils";

interface ReaderCardProps {
  reader: Reader;
  compact?: boolean;
}

export function ReaderCard({ reader, compact = false }: ReaderCardProps) {
  const {
    id,
    displayName,
    specialties,
    rating,
    totalReadings,
    pricePerReading,
    avatar,
    bio,
    status,
    experience,
  } = reader;

  const isActive = status === "ACTIVE";

  if (compact) {
    return (
      <Link to="/readers/$id" params={{ id }}>
        <Card className="hover:shadow-lg transition-all hover:border-primary/30 cursor-pointer">
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatar || ""} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-lg">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{displayName}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {rating.toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{totalReadings} readings</span>
                    <span>•</span>
                    <span>{experience} years</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary">
                    ${pricePerReading}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    per reading
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {specialties.slice(0, 2).map((specialty) => (
                  <Badge
                    key={specialty}
                    variant="secondary"
                    className="text-xs"
                  >
                    {specialty}
                  </Badge>
                ))}
                {specialties.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{specialties.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all hover:border-primary/30">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatar || ""} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-2xl">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="text-xs"
            >
              {isActive ? "🟢 Available" : status}
            </Badge>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-semibold">{displayName}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {rating.toFixed(1)} ({totalReadings} reviews)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {experience} years
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {totalReadings} readings
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ${pricePerReading}
                </div>
                <div className="text-xs text-muted-foreground">per reading</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
              {bio}
            </p>

            <div className="flex flex-wrap gap-1 mt-3">
              {specialties.map((specialty) => (
                <Badge key={specialty} variant="outline" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Link to="/readers/$id" params={{ id }}>
                <Button size="sm" variant="default">
                  View Profile
                </Button>
              </Link>
              <Button size="sm" variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button size="sm" variant="outline" className="text-primary">
                <Calendar className="h-4 w-4 mr-2" />
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
