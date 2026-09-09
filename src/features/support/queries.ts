// React Query hooks cho hỗ trợ khách — dùng chung cho trang khách (/support)
// và tab "Hỗ trợ khách" của nhân viên.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as supportApi from "@/api/support";
import type { TicketStatus } from "@/api/support";

export const supportKeys = {
  all: ["support"] as const,
  mine: (page: number) => [...supportKeys.all, "mine", page] as const,
  queue: (status: TicketStatus | "", page: number) =>
    [...supportKeys.all, "queue", status, page] as const,
  detail: (id: string) => [...supportKeys.all, "ticket", id] as const,
};

export function useMyTickets(page = 0) {
  return useQuery({
    queryKey: supportKeys.mine(page),
    queryFn: () => supportApi.getMyTickets({ page, size: 20 }),
    placeholderData: keepPreviousData,
  });
}

export function useSupportQueue(status: TicketStatus | "", page = 0) {
  return useQuery({
    queryKey: supportKeys.queue(status, page),
    queryFn: () => supportApi.getSupportQueue({ status: status || undefined, page, size: 20 }),
    placeholderData: keepPreviousData,
  });
}

export function useTicket(ticketId: string | null) {
  return useQuery({
    queryKey: supportKeys.detail(ticketId ?? ""),
    queryFn: () => supportApi.getTicket(ticketId as string),
    enabled: !!ticketId,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { subject: string; body: string }) => supportApi.createTicket(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: supportKeys.all }),
  });
}

export function useReplyTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, body }: { ticketId: string; body: string }) =>
      supportApi.replyTicket(ticketId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: supportKeys.all }),
  });
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: TicketStatus }) =>
      supportApi.updateTicketStatus(ticketId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: supportKeys.all }),
  });
}
