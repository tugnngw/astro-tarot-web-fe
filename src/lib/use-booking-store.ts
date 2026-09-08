import { useSyncExternalStore } from "react";
import {
  subscribe,
  getSlots,
  getBookings,
  isSlotBooked,
  type Slot,
  type Booking,
} from "./booking-store";

// Cache snapshots so useSyncExternalStore returns stable references between events.
let slotCache: Record<string, Slot[]> = {};
let bookingCache: Booking[] | null = null;
let slotStatusCache: Record<string, Booking | undefined> = {};

subscribe(() => {
  slotCache = {};
  bookingCache = null;
  slotStatusCache = {};
});

export function useSlots(readerId = "__all"): Slot[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!slotCache[readerId]) {
        slotCache[readerId] = getSlots(
          readerId === "__all" ? undefined : readerId,
        );
      }
      return slotCache[readerId];
    },
    () => [] as Slot[],
  );
}
export function useBookings(): Booking[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!bookingCache) bookingCache = getBookings();
      return bookingCache;
    },
    () => [] as Booking[],
  );
}
export function useSlotStatus(slotId: string) {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!(slotId in slotStatusCache))
        slotStatusCache[slotId] = isSlotBooked(slotId);
      return slotStatusCache[slotId];
    },
    () => undefined,
  );
}
