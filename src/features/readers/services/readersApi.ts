import { api } from "@/lib/api/client";
import type {
  Reader,
  Booking,
  BookingRequest,
  BecomeReaderRequest,
  ReaderStats,
  ReaderFilter,
  Review,
} from "../types/reader.types";

export const readersApi = {
  getReaders: (params?: ReaderFilter) =>
    api<Reader[]>("/readers", { method: "GET", body: params }),
  getReader: (id: string) => api<Reader>(`/readers/${id}`),
  getFeaturedReaders: () => api<Reader[]>("/readers/featured"),
  getTopReaders: (limit?: number) =>
    api<Reader[]>(`/readers/top${limit ? `?limit=${limit}` : ""}`),
  becomeReader: (data: BecomeReaderRequest) =>
    api<Reader>("/readers/become", { method: "POST", body: data }),
  updateReaderProfile: (id: string, data: Partial<Reader>) =>
    api<Reader>(`/readers/${id}`, { method: "PUT", body: data }),
  updateAvailability: (id: string, data: Availability[]) =>
    api<void>(`/readers/${id}/availability`, { method: "PUT", body: data }),
  getReaderStats: (id: string) => api<ReaderStats>(`/readers/${id}/stats`),
  getReviews: (readerId: string) =>
    api<Review[]>(`/readers/${readerId}/reviews`),
  createReview: (readerId: string, data: { rating: number; comment: string }) =>
    api<Review>(`/readers/${readerId}/reviews`, { method: "POST", body: data }),
  updateReview: (reviewId: string, data: { rating: number; comment: string }) =>
    api<Review>(`/reviews/${reviewId}`, { method: "PUT", body: data }),
  deleteReview: (reviewId: string) =>
    api<void>(`/reviews/${reviewId}`, { method: "DELETE" }),
  getBookings: () => api<Booking[]>("/bookings"),
  getBooking: (id: string) => api<Booking>(`/bookings/${id}`),
  getReaderBookings: (readerId: string) =>
    api<Booking[]>(`/bookings/reader/${readerId}`),
  createBooking: (data: BookingRequest) =>
    api<Booking>("/bookings", { method: "POST", body: data }),
  updateBooking: (id: string, data: Partial<Booking>) =>
    api<Booking>(`/bookings/${id}`, { method: "PUT", body: data }),
  cancelBooking: (id: string) =>
    api<Booking>(`/bookings/${id}/cancel`, { method: "POST" }),
  completeBooking: (id: string) =>
    api<Booking>(`/bookings/${id}/complete`, { method: "POST" }),
  approveReader: (id: string) =>
    api<Reader>(`/admin/readers/${id}/approve`, { method: "POST" }),
  rejectReader: (id: string) =>
    api<Reader>(`/admin/readers/${id}/reject`, { method: "POST" }),
  suspendReader: (id: string) =>
    api<Reader>(`/admin/readers/${id}/suspend`, { method: "POST" }),
  activateReader: (id: string) =>
    api<Reader>(`/admin/readers/${id}/activate`, { method: "POST" }),
};
