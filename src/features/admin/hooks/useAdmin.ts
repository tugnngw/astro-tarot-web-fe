import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/adminApi";
import type {
  PendingReaderApplication,
  ReviewReaderRequest,
} from "../types/admin.types";

export const adminKeys = {
  all: ["admin"] as const,
  pendingReaders: () => [...adminKeys.all, "pending-readers"] as const,
  reader: (id: string) => [...adminKeys.all, "reader", id] as const,
};

export function useAdminPendingReaders() {
  return useQuery({
    queryKey: adminKeys.pendingReaders(),
    queryFn: () => adminApi.getPendingReaders(),
    staleTime: 30 * 1000,
  });
}

export function useAdminReviewReaderApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewReaderRequest }) =>
      adminApi.reviewReaderApplication(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: adminKeys.pendingReaders() });
      qc.invalidateQueries({ queryKey: adminKeys.reader(id) });
    },
  });
}
