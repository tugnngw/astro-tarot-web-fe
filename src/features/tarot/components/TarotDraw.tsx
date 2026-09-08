import { useState } from "react";
import {
  useTarotCards,
  useTarotSpreads,
  useCreateTarotReading,
} from "../hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TarotCard } from "./TarotCard";
import { toast } from "sonner";

export function TarotDraw() {
  const [spreadId, setSpreadId] = useState("");
  const [question, setQuestion] = useState("");
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const { data: cards, isLoading: cardsLoading } = useTarotCards();
  const { data: spreads } = useTarotSpreads();
  const createReading = useCreateTarotReading();

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnCards, setDrawnCards] = useState<typeof cards>([]);

  const handleDraw = async () => {
    if (!spreadId) {
      toast.error("Please select a spread");
      return;
    }

    setIsDrawing(true);
    try {
      const shuffled = [...(cards || [])].sort(() => Math.random() - 0.5);
      const spread = spreads?.find((s) => s.id === spreadId);
      const count = spread?.cardCount || 3;
      const drawn = shuffled.slice(0, count);

      setDrawnCards(drawn);
      setSelectedCards(drawn.map((c) => c.id));

      toast.success(`Drawn ${count} cards!`);
    } catch (error) {
      toast.error("Failed to draw cards");
    } finally {
      setIsDrawing(false);
    }
  };

  const handleInterpret = async () => {
    if (selectedCards.length === 0) {
      toast.error("Please draw cards first");
      return;
    }

    try {
      await createReading.mutateAsync({
        spreadId,
        question: question || undefined,
      });
      toast.success("Reading saved!");
    } catch (error) {
      toast.error("Failed to save reading");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Spread</label>
          <Select value={spreadId} onValueChange={setSpreadId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a spread..." />
            </SelectTrigger>
            <SelectContent>
              {spreads?.map((spread) => (
                <SelectItem key={spread.id} value={spread.id}>
                  {spread.name} ({spread.cardCount} cards)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Your Question (optional)
          </label>
          <Textarea
            placeholder="What would you like to know?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleDraw} disabled={isDrawing || cardsLoading}>
          {isDrawing ? "Drawing..." : "Draw Cards ✨"}
        </Button>
        {drawnCards.length > 0 && (
          <Button variant="outline" onClick={handleInterpret}>
            Save Reading
          </Button>
        )}
      </div>

      {drawnCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {drawnCards.map((card) => (
            <TarotCard
              key={card.id}
              card={card}
              isFlipped={true}
              className="mx-auto"
            />
          ))}
        </div>
      )}

      {drawnCards.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Interpretation</h3>
            <div className="text-sm text-muted-foreground">
              Your reading is ready! Click "Save Reading" to store it in your
              history.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
