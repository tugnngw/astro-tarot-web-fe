import { api } from "@/lib/api/client";
import type {
  PendingReaderApplication,
  ReviewReaderRequest,
} from "../types/admin.types";

export const adminApi = {
  getPendingReaders: () =>
    api<PendingReaderApplication[]>("/api/v1/admin/readers/applications"),

  reviewReaderApplication: (applicationId: string, data: ReviewReaderRequest) =>
    api<void>(`/api/v1/admin/readers/${applicationId}/review`, {
      method: "PATCH",
      body: data,
    }),
};
