import { useState } from "react";
import { useCreateBirthChart, useBirthChart } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface BirthChartFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BirthChartForm({ onSuccess, onCancel }: BirthChartFormProps) {
  const { data: existingChart } = useBirthChart();
  const createBirthChart = useCreateBirthChart();

  const [form, setForm] = useState({
    dateOfBirth: existingChart?.dateOfBirth || "",
    timeOfBirth: existingChart?.timeOfBirth || "12:00",
    placeOfBirth: existingChart?.placeOfBirth || "",
    latitude: existingChart?.coordinates?.latitude || 0,
    longitude: existingChart?.coordinates?.longitude || 0,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dateOfBirth || !form.timeOfBirth || !form.placeOfBirth) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await createBirthChart.mutateAsync({
        dateOfBirth: form.dateOfBirth,
        timeOfBirth: form.timeOfBirth,
        placeOfBirth: form.placeOfBirth,
        latitude: form.latitude,
        longitude: form.longitude,
      });
      toast.success("Birth chart created successfully!");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create birth chart");
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          toast.success("Location detected!");
        },
        () => {
          toast.error("Unable to get location");
        },
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {existingChart ? "Update Birth Chart" : "Create Birth Chart"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeOfBirth">Time of Birth *</Label>
              <Input
                id="timeOfBirth"
                type="time"
                value={form.timeOfBirth}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, timeOfBirth: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="placeOfBirth">Place of Birth *</Label>
            <Input
              id="placeOfBirth"
              placeholder="City, Country"
              value={form.placeOfBirth}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, placeOfBirth: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <div className="flex gap-2">
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={form.latitude}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      latitude: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetLocation}
                >
                  📍
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={form.longitude}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    longitude: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading
                ? "Creating..."
                : existingChart
                  ? "Update"
                  : "Create Chart"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
