// src/features/readers/components/ReaderProfile.tsx
import { useReader, useReviews, useReaderBookings } from "../hooks";
import { BookingForm } from "./BookingForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import {
  Star,
  Calendar,
  Users,
  MessageCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ReaderProfileProps {
  readerId: string;
}

export function ReaderProfile({ readerId }: ReaderProfileProps) {
  const { data: reader, isLoading: readerLoading } = useReader(readerId);
  const { data: reviews, isLoading: reviewsLoading } = useReviews(readerId);
  const { data: bookings } = useReaderBookings(readerId);
  const [showBooking, setShowBooking] = useState(false);

  if (readerLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!reader) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Reader not found</p>
        </CardContent>
      </Card>
    );
  }

  const isActive = reader.status === "ACTIVE";

  const stats = [
    {
      icon: Star,
      label: "Rating",
      value: reader.rating.toFixed(1),
      color: "text-yellow-500",
    },
    {
      icon: Users,
      label: "Readings",
      value: reader.totalReadings,
      color: "text-blue-500",
    },
    {
      icon: Clock,
      label: "Experience",
      value: `${reader.experience} yrs`,
      color: "text-emerald-500",
    },
    {
      icon: DollarSign,
      label: "Price",
      value: `$${reader.pricePerReading}`,
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-32 w-32">
                <AvatarImage src={reader.avatar || ""} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-4xl">
                  {reader.displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "🟢 Active" : reader.status}
              </Badge>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold">{reader.displayName}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                    {reader.languages.map((lang) => (
                      <Badge key={lang} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button onClick={() => setShowBooking(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-3">{reader.bio}</p>

              <div className="flex flex-wrap gap-2 mt-3">
                {reader.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <Icon className={cn("h-5 w-5 mx-auto mb-1", stat.color)} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          {bookings && bookings.length > 0 && (
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="reviews" className="space-y-3">
          {reviewsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {review.userName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{review.userName}</div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm">{review.rating}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </div>
                      <p className="text-sm mt-1">{review.comment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No reviews yet
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {reader.availability.map((slot) => (
                  <div
                    key={slot.dayOfWeek}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <span className="text-sm">
                      {
                        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][
                          slot.dayOfWeek
                        ]
                      }
                    </span>
                    <span className="text-sm">
                      {slot.isAvailable
                        ? `${slot.startTime} - ${slot.endTime}`
                        : "Unavailable"}
                    </span>
                    <Badge
                      variant={slot.isAvailable ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {slot.isAvailable ? "Available" : "Closed"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {bookings && bookings.length > 0 && (
          <TabsContent value="bookings">
            <Card>
              <CardContent className="p-4 space-y-2">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <div>
                      <div className="font-medium">{booking.service}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(booking.dateTime), "PPP 'at' p")}
                      </div>
                    </div>
                    <Badge
                      variant={
                        booking.status === "COMPLETED"
                          ? "default"
                          : booking.status === "CONFIRMED"
                            ? "outline"
                            : booking.status === "PENDING"
                              ? "secondary"
                              : "destructive"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <BookingForm
        readerId={readerId}
        open={showBooking}
        onOpenChange={setShowBooking}
        onSuccess={() => setShowBooking(false)}
      />
    </div>
  );
}
