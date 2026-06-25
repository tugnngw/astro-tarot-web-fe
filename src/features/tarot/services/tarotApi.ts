import { api } from "@/lib/api/client";
import type {
  TarotCard,
  TarotReading,
  TarotSpread,
} from "../types/tarot.types";

export const tarotApi = {
  getCards: () => api<TarotCard[]>("/tarot/cards"),
  getCard: (id: string) => api<TarotCard>(`/tarot/cards/${id}`),
  getSpreads: () => api<TarotSpread[]>("/tarot/spreads"),
  getSpread: (id: string) => api<TarotSpread>(`/tarot/spreads/${id}`),
  createReading: (data: { spreadId: string; question?: string }) =>
    api<TarotReading>("/tarot/readings", { method: "POST", body: data }),
  getReading: (id: string) => api<TarotReading>(`/tarot/readings/${id}`),
  getHistory: () => api<TarotReading[]>("/tarot/readings/history"),
  interpret: (data: {
    cardIds: string[];
    spreadId: string;
    question?: string;
  }) =>
    api<{ interpretation: string }>("/tarot/interpret", {
      method: "POST",
      body: data,
    }),
};
