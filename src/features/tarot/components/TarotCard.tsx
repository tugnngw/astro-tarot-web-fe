// src/features/tarot/components/TarotCard.tsx
import { useState } from "react";
import { cn } from "@/lib/utils/utils";
import type { TarotCard as TarotCardType } from "../types/tarot.types";

interface TarotCardProps {
  card: TarotCardType;
  onClick?: () => void;
  isFlipped?: boolean;
  isReversed?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function TarotCard({
  card,
  onClick,
  isFlipped = false,
  isReversed = false,
  className,
  size = "md",
}: TarotCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: "w-32 h-48 text-xs",
    md: "w-48 h-72 text-sm",
    lg: "w-64 h-96 text-base",
  };

  const getSuitSymbol = (suit: string) => {
    const symbols: Record<string, string> = {
      major: "⭐",
      wands: "🔥",
      cups: "💧",
      swords: "⚔️",
      pentacles: "🪙",
    };
    return symbols[suit] || "🃏";
  };

  return (
    <div
      className={cn(
        "relative cursor-pointer transition-all duration-500 preserve-3d",
        sizeClasses[size],
        isFlipped ? "rotate-y-180" : "",
        isReversed ? "rotate-y-180 rotate-z-180" : "",
        className,
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Front - Card Back */}
      <div className="absolute inset-0 backface-hidden">
        <div
          className={cn(
            "w-full h-full rounded-xl border-2 border-primary/20",
            "bg-gradient-to-br from-purple-900/30 to-indigo-900/30",
            "flex flex-col items-center justify-center p-3",
            "shadow-lg backdrop-blur-sm",
          )}
        >
          <div className="text-4xl mb-2">🌟</div>
          <div className="text-xs text-muted-foreground text-center font-mystical">
            {isReversed ? "⬇️" : "⬆️"}
          </div>
          <div className="text-[10px] text-muted-foreground/50 text-center mt-1 font-serif">
            Astro Tarot
          </div>
        </div>
      </div>

      {/* Back - Card Front */}
      <div
        className={cn(
          "absolute inset-0 rotate-y-180 backface-hidden",
          "rounded-xl border-2",
          isReversed ? "border-amber-500/50" : "border-purple-500/50",
          "bg-gradient-to-br from-amber-50/90 to-purple-50/90",
          "shadow-xl backdrop-blur-sm",
          "flex flex-col items-center p-3",
          "transition-all duration-300",
          isHovered ? "shadow-2xl scale-105" : "",
        )}
      >
        {/* Suit Symbol */}
        <div className="text-2xl">{getSuitSymbol(card.suit)}</div>

        {/* Card Number */}
        <div className="text-[10px] font-bold text-muted-foreground mt-1">
          #{card.number}
        </div>

        {/* Card Name */}
        <div className="text-center mt-1">
          <div className="text-sm font-bold text-foreground">{card.name}</div>
          <div className="text-[10px] text-muted-foreground">{card.nameVi}</div>
        </div>

        {/* Card Meaning (show on hover) */}
        {isHovered && (
          <div className="absolute inset-0 rounded-xl bg-black/80 p-4 flex flex-col items-center justify-center text-white">
            <div className="text-xs font-semibold text-center">
              {isReversed ? "⬇️ Reversed" : "⬆️ Upright"}
            </div>
            <div className="text-[10px] text-center mt-1 leading-relaxed">
              {isReversed ? card.meaningReversed : card.meaning}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
