// ============================================================
// SUPPORT API — hỗ trợ khách
// Khớp BE: /api/v1/support/**
//
// Một bộ endpoint cho hai vai: khách thao tác trên ticket của mình, nhân viên
// (SUPPORT_VIEW) thấy toàn hàng chờ. BE tự phân biệt theo quyền.
// ============================================================

import { apiFetch } from "./client";

const BASE = "/api/v1/support";

export type TicketStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Đang chờ",
  PENDING: "Chờ khách phản hồi",
  RESOLVED: "Đã giải quyết",
  CLOSED: "Đã đóng",
};

export interface TicketRow {
  id: string;
  subject: string;
  status: TicketStatus;
  requesterName: string;
  assignedToName: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  fromStaff: boolean;
  body: string;
  createdAt: string;
}

export interface TicketDetail {
  id: string;
  subject: string;
  status: TicketStatus;
  requesterId: string;
  requesterName: string;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface TicketPage {
  content: TicketRow[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ---------- Khách ----------

export function createTicket(payload: { subject: string; body: string }) {
  return apiFetch<TicketDetail>(`${BASE}/tickets`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyTickets(query: { page?: number; size?: number } = {}) {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.size !== undefined) params.set("size", String(query.size));
  const qs = params.toString();
  return apiFetch<TicketPage>(`${BASE}/tickets/mine${qs ? `?${qs}` : ""}`);
}

export function getTicket(ticketId: string) {
  return apiFetch<TicketDetail>(`${BASE}/tickets/${ticketId}`);
}

export function replyTicket(ticketId: string, body: string) {
  return apiFetch<TicketDetail>(`${BASE}/tickets/${ticketId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

// ---------- Nhân viên ----------

export function getSupportQueue(query: { status?: TicketStatus; page?: number; size?: number } = {}) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.size !== undefined) params.set("size", String(query.size));
  const qs = params.toString();
  return apiFetch<TicketPage>(`${BASE}/queue${qs ? `?${qs}` : ""}`);
}

export function updateTicketStatus(ticketId: string, status: TicketStatus) {
  return apiFetch<TicketRow>(`${BASE}/tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
