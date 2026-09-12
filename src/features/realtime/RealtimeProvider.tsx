import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  connectRealtime,
  disconnectRealtime,
  subscribeRealtimeEvents,
  type RealtimeEvent,
} from "@/lib/realtime";
import {
  bookingKeys,
  notificationKeys,
} from "@/features/booking/queries";
import { moneyKeys } from "@/features/money/queries";
import { supportKeys } from "@/features/support/queries";
import { readerMeKeys } from "@/features/readers/queries";
import { adminKeys } from "@/features/admin/queries";
import { notificationLink, type Notification } from "@/api/notifications";

/**
 * Giữ STOMP sống theo phiên đăng nhập và invalidate cache + toast khi có event.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) {
      disconnectRealtime();
      return;
    }
    connectRealtime();
    return () => {
      disconnectRealtime();
    };
  }, [user?.id]);

  useEffect(() => {
    return subscribeRealtimeEvents((event) => {
      handleRealtimeEvent(queryClient, event);
    });
  }, [queryClient]);

  return children;
}

function handleRealtimeEvent(
  queryClient: ReturnType<typeof useQueryClient>,
  event: RealtimeEvent,
) {
  const type = event.type ?? event.notification?.type ?? "";
  const notification = event.notification;

  if (typeof event.unreadCount === "number") {
    queryClient.setQueryData(notificationKeys.unread(), {
      count: event.unreadCount,
    });
  }
  void queryClient.invalidateQueries({ queryKey: notificationKeys.all });

  if (
    type.startsWith("BOOKING_") ||
    type === "REVIEW_RECEIVED"
  ) {
    void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
  }

  if (type.startsWith("PAYMENT_") || type.startsWith("PAYOUT_")) {
    void queryClient.invalidateQueries({ queryKey: moneyKeys.all });
    void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
  }

  if (type.startsWith("SUPPORT_")) {
    void queryClient.invalidateQueries({ queryKey: supportKeys.all });
  }

  if (
    type.startsWith("READER_APPLICATION_") ||
    type === "ACCOUNT_ROLE_CHANGED"
  ) {
    void queryClient.invalidateQueries({ queryKey: readerMeKeys.application });
    void queryClient.invalidateQueries({
      queryKey: adminKeys.applications(),
    });
  }

  if (notification?.title) {
    showLiveToast(notification);
  }
}

function showLiveToast(n: Notification) {
  const href = notificationLink(n);
  if (href) {
    toast(n.title, {
      description: n.message ?? undefined,
      action: {
        label: "Xem",
        onClick: () => {
          window.location.assign(href);
        },
      },
    });
    return;
  }
  toast(n.title, { description: n.message ?? undefined });
}
