import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tarotApi } from "../services/tarotApi";

export const tarotKeys = {
  all: ["tarot"] as const,
  cards: () => [...tarotKeys.all, "cards"] as const,
  spreads: () => [...tarotKeys.all, "spreads"] as const,
  readings: () => [...tarotKeys.all, "readings"] as const,
  reading: (id: string) => [...tarotKeys.readings(), id] as const,
  history: () => [...tarotKeys.all, "history"] as const,
};

export function useTarotCards() {
  return useQuery({
    queryKey: tarotKeys.cards(),
    queryFn: () => tarotApi.getCards(),
  });
}

export function useTarotSpreads() {
  return useQuery({
    queryKey: tarotKeys.spreads(),
    queryFn: () => tarotApi.getSpreads(),
  });
}

export function useTarotReading(id: string) {
  return useQuery({
    queryKey: tarotKeys.reading(id),
    queryFn: () => tarotApi.getReading(id),
    enabled: !!id,
  });
}

export function useTarotHistory() {
  return useQuery({
    queryKey: tarotKeys.history(),
    queryFn: () => tarotApi.getHistory(),
  });
}

export function useCreateTarotReading() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { spreadId: string; question?: string }) =>
      tarotApi.createReading(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tarotKeys.history() });
    },
  });
}

export function useInterpretTarot() {
  return useMutation({
    mutationFn: (data: {
      cardIds: string[];
      spreadId: string;
      question?: string;
    }) => tarotApi.interpret(data),
  });
}
