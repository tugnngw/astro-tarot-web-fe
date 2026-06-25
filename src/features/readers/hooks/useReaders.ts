import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readersApi } from "../services/readersApi";
import type { Reader, Availability } from "../types/reader.types";

export const readerKeys = {
  all: ["readers"] as const,
  lists: () => [...readerKeys.all, "list"] as const,
  list: (filters?: any) => [...readerKeys.lists(), filters] as const,
  details: () => [...readerKeys.all, "detail"] as const,
  detail: (id: string) => [...readerKeys.details(), id] as const,
  featured: () => [...readerKeys.all, "featured"] as const,
  top: (limit?: number) => [...readerKeys.all, "top", limit] as const,
  stats: (id: string) => [...readerKeys.all, "stats", id] as const,
  bookings: () => [...readerKeys.all, "bookings"] as const,
  bookingsByReader: (id: string) => [...readerKeys.bookings(), id] as const,
  reviews: (id: string) => [...readerKeys.all, "reviews", id] as const,
};

export function useReaders(filters?: any) {
  return useQuery({
    queryKey: readerKeys.list(filters),
    queryFn: () => readersApi.getReaders(filters),
  });
}

export function useReader(id: string) {
  return useQuery({
    queryKey: readerKeys.detail(id),
    queryFn: () => readersApi.getReader(id),
    enabled: !!id,
  });
}

export function useFeaturedReaders() {
  return useQuery({
    queryKey: readerKeys.featured(),
    queryFn: () => readersApi.getFeaturedReaders(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopReaders(limit?: number) {
  return useQuery({
    queryKey: readerKeys.top(limit),
    queryFn: () => readersApi.getTopReaders(limit),
  });
}

export function useReaderStats(id: string) {
  return useQuery({
    queryKey: readerKeys.stats(id),
    queryFn: () => readersApi.getReaderStats(id),
    enabled: !!id,
  });
}

export function useBecomeReader() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof readersApi.becomeReader>[0]) =>
      readersApi.becomeReader(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readerKeys.all });
    },
  });
}

export function useUpdateReader() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Reader>) =>
      readersApi.updateReaderProfile(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: readerKeys.detail(id) });
      qc.invalidateQueries({ queryKey: readerKeys.lists() });
    },
  });
}

export function useUpdateAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      availability,
    }: {
      id: string;
      availability: Availability[];
    }) => readersApi.updateAvailability(id, availability),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: readerKeys.detail(id) });
    },
  });
}

export function useBookings() {
  return useQuery({
    queryKey: readerKeys.bookings(),
    queryFn: () => readersApi.getBookings(),
  });
}

export function useReaderBookings(readerId: string) {
  return useQuery({
    queryKey: readerKeys.bookingsByReader(readerId),
    queryFn: () => readersApi.getReaderBookings(readerId),
    enabled: !!readerId,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof readersApi.createBooking>[0]) =>
      readersApi.createBooking(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readerKeys.bookings() });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => readersApi.cancelBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: readerKeys.bookings() });
    },
  });
}

export function useReviews(readerId: string) {
  return useQuery({
    queryKey: readerKeys.reviews(readerId),
    queryFn: () => readersApi.getReviews(readerId),
    enabled: !!readerId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      readerId,
      ...data
    }: {
      readerId: string;
      rating: number;
      comment: string;
    }) => readersApi.createReview(readerId, data),
    onSuccess: (_, { readerId }) => {
      qc.invalidateQueries({ queryKey: readerKeys.reviews(readerId) });
      qc.invalidateQueries({ queryKey: readerKeys.detail(readerId) });
    },
  });
}
