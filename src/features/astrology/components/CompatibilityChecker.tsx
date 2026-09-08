import { useState } from "react";
import { useZodiacSigns, useCompatibility } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, Briefcase, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CompatibilityChecker() {
  const { data: signs } = useZodiacSigns();
  const [sign1, setSign1] = useState("");
  const [sign2, setSign2] = useState("");
  const { data: result, isLoading } = useCompatibility(sign1, sign2);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Zodiac Compatibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Sign</label>
              <Select value={sign1} onValueChange={setSign1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your sign" />
                </SelectTrigger>
                <SelectContent>
                  {signs?.map((sign) => (
                    <SelectItem key={sign.id} value={sign.id}>
                      {sign.symbol} {sign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Partner's Sign</label>
              <Select value={sign2} onValueChange={setSign2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select partner's sign" />
                </SelectTrigger>
                <SelectContent>
                  {signs?.map((sign) => (
                    <SelectItem key={sign.id} value={sign.id}>
                      {sign.symbol} {sign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-2xl mb-2">🔮</div>
            <p className="text-muted-foreground">
              Calculating compatibility...
            </p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{result.score}%</div>
              <div className="text-sm text-muted-foreground">
                Compatibility Score
              </div>
              <Progress value={result.score} className="h-2 mt-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <Heart className="h-5 w-5 mx-auto text-red-500" />
                <div className="text-sm font-medium mt-1">Love</div>
                <div className="text-lg font-semibold">
                  {result.loveCompatibility}%
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <Users className="h-5 w-5 mx-auto text-blue-500" />
                <div className="text-sm font-medium mt-1">Friendship</div>
                <div className="text-lg font-semibold">
                  {result.friendshipCompatibility}%
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <Briefcase className="h-5 w-5 mx-auto text-emerald-500" />
                <div className="text-sm font-medium mt-1">Career</div>
                <div className="text-lg font-semibold">
                  {result.careerCompatibility}%
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm">{result.description}</p>

              <div>
                <div className="text-sm font-medium text-emerald-500">
                  Strengths
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.strengths.map((strength) => (
                    <Badge
                      key={strength}
                      variant="secondary"
                      className="text-xs"
                    >
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-amber-500">
                  Weaknesses
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.weaknesses.map((weakness) => (
                    <Badge
                      key={weakness}
                      variant="secondary"
                      className="text-xs"
                    >
                      {weakness}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="text-sm font-medium text-primary">Advice</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.advice}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
