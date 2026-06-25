import { useState } from "react";
import { useBecomeReader } from "../hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";

interface BecomeReaderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SPECIALTIES = [
  "Tarot Reading",
  "Astrology",
  "Spiritual Guidance",
  "Love Reading",
  "Career Reading",
  "Past Life Reading",
  "Dream Interpretation",
  "Numerology",
  "Palm Reading",
  "Crystal Healing",
  "Chakra Balancing",
  "Meditation Guide",
];

const LANGUAGES = [
  "English",
  "Vietnamese",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
];

export function BecomeReaderModal({
  open,
  onOpenChange,
}: BecomeReaderModalProps) {
  const becomeReader = useBecomeReader();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    specialties: [] as string[],
    bio: "",
    pricePerReading: 20,
    languages: [] as string[],
    certifications: [] as string[],
  });

  const [newCertification, setNewCertification] = useState("");

  const handleAddSpecialty = (specialty: string) => {
    if (!form.specialties.includes(specialty)) {
      setForm((prev) => ({
        ...prev,
        specialties: [...prev.specialties, specialty],
      }));
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((s) => s !== specialty),
    }));
  };

  const handleAddLanguage = (language: string) => {
    if (!form.languages.includes(language)) {
      setForm((prev) => ({
        ...prev,
        languages: [...prev.languages, language],
      }));
    }
  };

  const handleRemoveLanguage = (language: string) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== language),
    }));
  };

  const handleAddCertification = () => {
    if (
      newCertification.trim() &&
      !form.certifications.includes(newCertification.trim())
    ) {
      setForm((prev) => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()],
      }));
      setNewCertification("");
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c !== cert),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.specialties.length === 0) {
      toast.error("Please select at least one specialty");
      return;
    }

    if (!form.bio || form.bio.length < 50) {
      toast.error("Please write a bio with at least 50 characters");
      return;
    }

    if (form.pricePerReading < 5) {
      toast.error("Price must be at least $5");
      return;
    }

    setLoading(true);
    try {
      await becomeReader.mutateAsync({
        specialties: form.specialties,
        bio: form.bio,
        pricePerReading: form.pricePerReading,
        languages: form.languages.length > 0 ? form.languages : ["English"],
        certifications:
          form.certifications.length > 0 ? form.certifications : undefined,
      });
      toast.success("Application submitted successfully!");
      onOpenChange(false);
      setForm({
        specialties: [],
        bio: "",
        pricePerReading: 20,
        languages: [],
        certifications: [],
      });
    } catch (error) {
      toast.error("Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Become a Reader</DialogTitle>
          <DialogDescription>
            Join our community of spiritual guides and share your wisdom with
            others.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Specialties *</Label>
            <Select onValueChange={handleAddSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="Select your specialties" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.filter((s) => !form.specialties.includes(s)).map(
                  (specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            {form.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.specialties.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialty(specialty)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio *</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself, your experience, and your approach..."
              value={form.bio}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, bio: e.target.value }))
              }
              rows={5}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {form.bio.length}/500
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price per Reading ($) *</Label>
            <Input
              id="price"
              type="number"
              min={5}
              max={200}
              value={form.pricePerReading}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  pricePerReading: Number(e.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Languages</Label>
            <Select onValueChange={handleAddLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select languages you speak" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.filter((l) => !form.languages.includes(l)).map(
                  (language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            {form.languages.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.languages.map((language) => (
                  <Badge
                    key={language}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {language}
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(language)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Certifications (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add certification..."
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCertification();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCertification}
              >
                Add
              </Button>
            </div>
            {form.certifications.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.certifications.map((cert) => (
                  <Badge
                    key={cert}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    📜 {cert}
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(cert)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
