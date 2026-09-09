// ============================================================
// BOOKING + THÔNG BÁO — React Query hooks
// ============================================================

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as bookingApi from "@/api/booking";
import * as notificationApi from "@/api/notifications";

export const bookingKeys = {
  all: ["booking"] as const,
  mine: (query: object) => [...bookingKeys.all, "mine", query] as const,
  reader: (query: object) => [...bookingKeys.all, "reader", query] as const,
  slots: (readerId: string, date: string, duration: number) =>
    [...bookingKeys.all, "slots", readerId, date, duration] as const,
  reviews: (readerId: string, page: number) =>
    [...bookingKeys.all, "reviews", readerId, page] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (page: number) => [...notificationKeys.all, "list", page] as const,
  unread: () => [...notificationKeys.all, "unread"] as const,
};

// ---------- Khung giờ và đánh giá (công khai) ----------

export function useSlots(readerProfileId: string, date: string, duration: number, enabled = true) {
  return useQuery({
    queryKey: bookingKeys.slots(readerProfileId, date, duration),
    queryFn: () => bookingApi.getSlots(readerProfileId, date, duration),
    enabled: enabled && Boolean(readerProfileId && date),
    // Khung giờ hết chỗ rất nhanh khi có nhiều người cùng xem một Reader.
    staleTime: 30_000,
  });
}

export function useReaderReviews(readerProfileId: string, page = 0) {
  return useQuery({
    queryKey: bookingKeys.reviews(readerProfileId, page),
    queryFn: () => bookingApi.getReaderReviews(readerProfileId, page),
    enabled: Boolean(readerProfileId),
    placeholderData: keepPreviousData,
  });
}

// ---------- Lịch hẹn ----------

export function useMyBookings(query: { status?: string; page?: number; size?: number }, enabled = true) {
  return useQuery({
    queryKey: bookingKeys.mine(query),
    queryFn: () => bookingApi.getMyBookings(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useReaderBookings(query: { status?: string; page?: number; size?: number }, enabled = true) {
  return useQuery({
    queryKey: bookingKeys.reader(query),
    queryFn: () => bookingApi.getReaderBookings(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}

/**
 * Mọi thao tác ghi đều invalidate cả nhánh booking VÀ nhánh thông báo: đổi
 * trạng thái một lịch hẹn luôn sinh một thông báo cho bên kia, và người vừa
 * thao tác thường cũng là người nhận (khi bên kia huỷ).
 */
function useBookingMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useCreateBooking() {
  return useBookingMutation(bookingApi.createBooking);
}

export function useConfirmBooking() {
  return useBookingMutation(bookingApi.confirmBooking);
}

export function useCompleteBooking() {
  return useBookingMutation(bookingApi.completeBooking);
}

export function useCancelBooking() {
  return useBookingMutation(({ id, reason }: { id: string; reason?: string }) =>
    bookingApi.cancelBooking(id, reason),
  );
}

export function useReviewBooking() {
  return useBookingMutation(
    ({ id, rating, comment }: { id: string; rating: number; comment?: string }) =>
      bookingApi.reviewBooking(id, rating, comment),
  );
}

// ---------- Thông báo ----------

export function useUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: notificationApi.getUnreadCount,
    enabled,
    // Hỏi lại mỗi phút thay vì mở WebSocket: chuông trễ một phút thì chấp nhận
    // được, còn dựng kênh realtime cho mỗi tab là cái giá quá lớn cho một con số.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useNotifications(page: number, enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.list(page),
    queryFn: () => notificationApi.getNotifications(page),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
