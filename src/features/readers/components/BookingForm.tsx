import { useState } from "react";
import { useCreateBooking, useReader } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, User } from "lucide-react";
import { toast } from "sonner";

interface BookingFormProps {
  readerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SERVICES = [
  { value: "tarot", label: "Tarot Reading" },
  { value: "astrology", label: "Astrology Reading" },
  { value: "spiritual", label: "Spiritual Guidance" },
  { value: "love", label: "Love Reading" },
  { value: "career", label: "Career Reading" },
];

const DURATIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "60 minutes" },
];

export function BookingForm({
  readerId,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: BookingFormProps) {
  const { data: reader } = useReader(readerId);
  const createBooking = useCreateBooking();

  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [service, setService] = useState("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !time || !service) {
      toast.error("Please fill in all required fields");
      return;
    }

    const dateTime = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    dateTime.setHours(hours, minutes);

    setLoading(true);
    try {
      await createBooking.mutateAsync({
        readerId,
        service,
        dateTime: dateTime.toISOString(),
        duration,
        notes: notes || undefined,
      });
      toast.success("Booking created successfully!");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = reader ? reader.pricePerReading * (duration / 30) : 0;

  if (!open) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Book a Reading
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service *</Label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration *</Label>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any specific questions or topics?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {reader && (
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm">Price</span>
                <span className="text-lg font-bold text-primary">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                ${reader.pricePerReading} per 30 minutes
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Booking..." : "Confirm Booking"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
