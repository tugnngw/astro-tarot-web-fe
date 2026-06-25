// src/features/tarot/types/tarot.types.ts
export interface TarotCard {
  id: string;
  name: string;
  nameVi: string;
  suit: "major" | "wands" | "cups" | "swords" | "pentacles";
  number: number;
  meaning: string;
  meaningReversed: string;
  description: string;
  imageUrl?: string;
}

export interface TarotReading {
  id: string;
  userId: string;
  readerId?: string;
  cards: TarotCard[];
  question?: string;
  spread: string;
  interpretation: string;
  createdAt: string;
}

export interface TarotSpread {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  cardCount: number;
  positions: {
    position: number;
    name: string;
    meaning: string;
  }[];
}
